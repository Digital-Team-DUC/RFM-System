import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway
  ) {}

  async findAll(query: { projectId?: string; customerId?: string; status?: string }) {
    const where: any = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;

    return this.prisma.contract.findMany({
      where,
      include: {
        customer: true,
        property: true,
        project: true,
        installments: {
          select: {
            id: true,
            status: true,
            scheduledAmount: true,
            amountPaid: true,
            outstandingAmount: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        customer: true,
        property: true,
        project: true,
        booking: {
          include: { deposits: true },
        },
        paymentPlans: true,
        installments: {
          orderBy: { installmentNumber: 'asc' },
          include: {
            allocations: {
              include: { payment: true },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        commissions: {
          include: { agent: true, policy: true },
        },
      },
    });

    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async createFromBooking(bookingId: string, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: true,
          deposits: true,
        },
      });

      if (!booking) throw new NotFoundException('Booking not found');

      const existingContract = await tx.contract.findFirst({
        where: { bookingId },
      });
      if (existingContract) {
        throw new BadRequestException('Contract already exists for this booking');
      }

      // Calculate total verified deposits
      const totalDeposits = booking.deposits
        .filter((d) => d.verificationStatus === 'VERIFIED')
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const count = await tx.contract.count();
      const contractNumber = `CTR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
      const balanceRemaining = Number(booking.sellingPrice) - totalDeposits;

      const contract = await tx.contract.create({
        data: {
          contractNumber,
          bookingId: booking.id,
          customerId: booking.customerId,
          propertyId: booking.propertyId,
          projectId: booking.projectId,
          sellingPrice: booking.sellingPrice,
          depositPaid: totalDeposits,
          balanceRemaining,
          status: 'ACTIVE',
          signedDate: new Date(),
          transferCondition: 'Full title transfer upon 100% contract balance payment.',
          notes,
        },
        include: {
          customer: true,
          property: true,
        },
      });

      // Update booking
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONTRACTED' },
      });

      // Update property to INSTALLMENT
      await tx.property.update({
        where: { id: booking.propertyId },
        data: { status: 'INSTALLMENT' },
      });

      await tx.propertyStatusHistory.create({
        data: {
          propertyId: booking.propertyId,
          fromStatus: booking.property.status,
          toStatus: 'INSTALLMENT',
          reason: `Contract ${contractNumber} executed`,
        },
      });

      await tx.masterPlanShape.updateMany({
        where: { propertyId: booking.propertyId },
        data: { status: 'INSTALLMENT', colorCode: '#3b82f6' },
      });

      this.eventsGateway.emitPropertyStatusChanged({
        propertyId: booking.propertyId,
        status: 'INSTALLMENT',
        code: booking.property.code,
        projectId: booking.projectId,
      });

      return contract;
    });
  }
}
