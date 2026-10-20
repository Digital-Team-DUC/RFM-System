import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgents(organizationId?: string) {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;

    return this.prisma.salesAgent.findMany({
      where,
      include: {
        commissions: {
          select: {
            calculatedAmount: true,
            approvedAmount: true,
            paidAmount: true,
            status: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getPolicies(organizationId?: string) {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;

    return this.prisma.commissionPolicy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCalculations(query: { agentId?: string; contractId?: string; status?: string }) {
    const where: any = {};
    if (query.agentId) where.agentId = query.agentId;
    if (query.contractId) where.contractId = query.contractId;
    if (query.status) where.status = query.status;

    return this.prisma.commissionCalculation.findMany({
      where,
      include: {
        agent: true,
        policy: true,
        contract: {
          include: {
            property: true,
            customer: true,
          },
        },
        payouts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveCommission(id: string, approverId: string, approvedAmount?: number) {
    const comm = await this.prisma.commissionCalculation.findUnique({
      where: { id },
    });
    if (!comm) throw new NotFoundException('Commission calculation not found');

    const amount = approvedAmount !== undefined ? approvedAmount : Number(comm.calculatedAmount);

    return this.prisma.commissionCalculation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAmount: amount,
        approvedById: approverId,
      },
    });
  }

  async recordPayout(id: string, data: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }, paidById?: string) {
    return this.prisma.$transaction(async (tx) => {
      const comm = await tx.commissionCalculation.findUnique({
        where: { id },
      });
      if (!comm) throw new NotFoundException('Commission calculation not found');

      const approved = Number(comm.approvedAmount);
      const paid = Number(comm.paidAmount);
      const remaining = approved - paid;

      if (data.amount > remaining) {
        throw new BadRequestException(
          `Payout amount ($${data.amount}) cannot exceed remaining approved balance ($${remaining})`
        );
      }

      const payout = await tx.commissionPayout.create({
        data: {
          commissionId: id,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          paidById,
        },
      });

      const newPaid = paid + data.amount;
      const newStatus = newPaid >= approved ? 'PAID' : 'PARTIALLY_PAID';

      await tx.commissionCalculation.update({
        where: { id },
        data: {
          paidAmount: newPaid,
          status: newStatus,
        },
      });

      return payout;
    });
  }
}
