import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway
  ) {}

  async findAll(query: { projectId?: string; customerId?: string; status?: string }) {
    const where: any = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;

    return this.prisma.booking.findMany({
      where,
      include: {
        customer: true,
        property: true,
        project: true,
        agent: { select: { id: true, fullName: true, phone: true } },
        deposits: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        property: true,
        project: true,
        agent: true,
        approvedBy: true,
        deposits: true,
        contract: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async create(data: {
    customerId: string;
    propertyId: string;
    projectId: string;
    agentId?: string;
    sellingPrice: number;
    discount?: number;
    bookingFee: number;
    depositRequired: number;
    expiryDays?: number;
    notes?: string;
  }) {
    // Run serializable transaction to prevent concurrent double-booking
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock and check property status
      const property = await tx.property.findUnique({
        where: { id: data.propertyId },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      if (property.status !== 'AVAILABLE') {
        throw new ConflictException(
          `Property ${property.code} is not available for reservation (Current status: ${property.status})`
        );
      }

      // 2. Check for any active non-expired booking
      const activeBooking = await tx.booking.findFirst({
        where: {
          propertyId: data.propertyId,
          status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DEPOSIT_RECEIVED'] },
          expiryDate: { gte: new Date() },
        },
      });

      if (activeBooking) {
        throw new ConflictException(
          `An active reservation already exists for property ${property.code} (Ref: ${activeBooking.bookingReference})`
        );
      }

      // 3. Generate unique booking reference
      const count = await tx.booking.count();
      const bookingReference = `BK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
      const expiryDays = data.expiryDays || 14;
      const expiryDate = new Date(Date.now() + expiryDays * 24 * 3600 * 1000);

      // 4. Create booking
      const booking = await tx.booking.create({
        data: {
          bookingReference,
          customerId: data.customerId,
          propertyId: data.propertyId,
          projectId: data.projectId,
          agentId: data.agentId,
          sellingPrice: data.sellingPrice,
          discount: data.discount || 0,
          bookingFee: data.bookingFee,
          depositRequired: data.depositRequired,
          expiryDate,
          status: 'PENDING_APPROVAL',
          notes: data.notes,
        },
        include: {
          customer: true,
          property: true,
        },
      });

      // 5. Update property status to RESERVED
      await tx.property.update({
        where: { id: data.propertyId },
        data: { status: 'RESERVED' },
      });

      await tx.propertyStatusHistory.create({
        data: {
          propertyId: data.propertyId,
          fromStatus: property.status,
          toStatus: 'RESERVED',
          reason: `Reserved under booking ${bookingReference}`,
          changedBy: data.agentId,
        },
      });

      // Update master plan shape color
      await tx.masterPlanShape.updateMany({
        where: { propertyId: data.propertyId },
        data: { status: 'RESERVED', colorCode: '#f59e0b' },
      });

      // Emit real-time updates
      this.eventsGateway.emitBookingCreated({
        bookingId: booking.id,
        reference: booking.bookingReference,
        propertyId: data.propertyId,
      });

      this.eventsGateway.emitPropertyStatusChanged({
        propertyId: data.propertyId,
        status: 'RESERVED',
        code: property.code,
        projectId: data.projectId,
      });

      return booking;
    });
  }

  async approve(id: string, approverId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { property: true },
      });

      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.status !== 'PENDING_APPROVAL') {
        throw new BadRequestException(`Booking cannot be approved from status ${booking.status}`);
      }

      return tx.booking.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: approverId,
        },
      });
    });
  }

  async cancel(id: string, reason: string, cancelledById?: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { property: true },
      });

      if (!booking) throw new NotFoundException('Booking not found');

      // Update booking
      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
        },
      });

      // Release property back to AVAILABLE
      await tx.property.update({
        where: { id: booking.propertyId },
        data: { status: 'AVAILABLE' },
      });

      await tx.propertyStatusHistory.create({
        data: {
          propertyId: booking.propertyId,
          fromStatus: booking.property.status,
          toStatus: 'AVAILABLE',
          reason: `Booking ${booking.bookingReference} cancelled: ${reason}`,
          changedBy: cancelledById,
        },
      });

      await tx.masterPlanShape.updateMany({
        where: { propertyId: booking.propertyId },
        data: { status: 'AVAILABLE', colorCode: '#10b981' },
      });

      this.eventsGateway.emitPropertyStatusChanged({
        propertyId: booking.propertyId,
        status: 'AVAILABLE',
        code: booking.property.code,
        projectId: booking.projectId,
      });

      return updated;
    });
  }

  async addDeposit(
    bookingId: string,
    data: {
      amount: number;
      paymentMethod: string;
      referenceNumber?: string;
      notes?: string;
    },
    cashierId?: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { property: true },
      });

      if (!booking) throw new NotFoundException('Booking not found');

      const count = await tx.deposit.count();
      const receiptNumber = `DEP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const deposit = await tx.deposit.create({
        data: {
          bookingId,
          receiptNumber,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          verificationStatus: 'VERIFIED',
          verifiedById: cashierId,
          notes: data.notes,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'DEPOSIT_RECEIVED' },
      });

      return deposit;
    });
  }
}
