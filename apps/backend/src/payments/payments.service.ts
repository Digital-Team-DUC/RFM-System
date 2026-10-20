import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import {
  generateInstallmentSchedule,
  calculateLatePenalty,
  round2,
} from '@rfm/shared';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway
  ) {}

  // 1. Generate Payment Plan & Installment Schedule for Contract
  async createPaymentPlan(contractId: string, data: {
    planType: string;
    installmentCount: number;
    frequencyMonths?: number;
    firstDueDate: string;
    gracePeriodDays?: number;
    penaltyDailyRate?: number;
    penaltyFixedFee?: number;
    penaltyMaxCap?: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
      });
      if (!contract) throw new NotFoundException('Contract not found');

      // Check if plan already exists
      const existingPlan = await tx.paymentPlan.findFirst({
        where: { contractId },
      });
      if (existingPlan) {
        throw new BadRequestException('A payment plan is already configured for this contract');
      }

      const totalPrincipal = Number(contract.sellingPrice);
      const depositAmount = Number(contract.depositPaid);
      const firstDue = new Date(data.firstDueDate);
      const freq = data.frequencyMonths || 1;

      // Calculate final due date
      const finalDue = new Date(firstDue);
      finalDue.setMonth(finalDue.getMonth() + (data.installmentCount - 1) * freq);

      // Create PaymentPlan record
      const plan = await tx.paymentPlan.create({
        data: {
          contractId,
          planType: data.planType || 'EQUAL_MONTHLY',
          totalPrincipal,
          depositAmount,
          installmentCount: data.installmentCount,
          frequencyMonths: freq,
          firstDueDate: firstDue,
          finalDueDate: finalDue,
          gracePeriodDays: data.gracePeriodDays ?? 7,
          penaltyDailyRate: data.penaltyDailyRate ?? 0.05,
          penaltyFixedFee: data.penaltyFixedFee ?? 0,
          penaltyMaxCap: data.penaltyMaxCap ?? 10.0,
        },
      });

      // Generate reconciled schedule using shared financial engine
      const scheduleRows = generateInstallmentSchedule(
        totalPrincipal,
        depositAmount,
        data.installmentCount,
        firstDue,
        freq
      );

      // Persist installment rows
      for (const row of scheduleRows) {
        await tx.installment.create({
          data: {
            paymentPlanId: plan.id,
            contractId,
            installmentNumber: row.installmentNumber,
            dueDate: new Date(row.dueDate),
            scheduledAmount: row.scheduledAmount,
            amountPaid: 0,
            outstandingAmount: row.scheduledAmount,
            latePenalty: 0,
            status: 'UPCOMING',
          },
        });
      }

      return this.prisma.paymentPlan.findUnique({
        where: { id: plan.id },
        include: {
          installments: { orderBy: { installmentNumber: 'asc' } },
        },
      });
    });
  }

  // 2. Record Customer Payment & Allocate Sequentially
  async recordPayment(data: {
    contractId: string;
    amount: number;
    paymentMethod: string;
    transactionRef?: string;
    paymentDate?: string;
    notes?: string;
    receivedById?: string;
  }) {
    const paymentAmount = round2(Number(data.amount));
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: data.contractId },
        include: {
          customer: true,
          project: true,
          installments: {
            where: {
              status: { in: ['UPCOMING', 'DUE', 'PARTIALLY_PAID', 'OVERDUE'] },
            },
            orderBy: { installmentNumber: 'asc' },
          },
        },
      });

      if (!contract) throw new NotFoundException('Contract not found');

      // Check external transaction reference idempotency
      if (data.transactionRef) {
        const existingTx = await tx.payment.findFirst({
          where: { transactionRef: data.transactionRef },
        });
        if (existingTx) {
          throw new BadRequestException(
            `A payment with transaction reference "${data.transactionRef}" has already been processed (Receipt: ${existingTx.receiptNumber})`
          );
        }
      }

      // Generate receipt number
      const paymentCount = await tx.payment.count();
      const receiptNumber = `REC-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(4, '0')}`;

      // Create Payment record
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          contractId: data.contractId,
          customerId: contract.customerId,
          amount: paymentAmount,
          currency: 'USD',
          paymentMethod: data.paymentMethod,
          transactionRef: data.transactionRef,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          receivedById: data.receivedById,
          verificationStatus: 'VERIFIED',
          notes: data.notes,
        },
      });

      // Allocate sequentially across installments
      let remainingToAllocate = paymentAmount;
      for (const inst of contract.installments) {
        if (remainingToAllocate <= 0) break;

        const outstanding = Number(inst.outstandingAmount);
        const allocationAmount = round2(Math.min(remainingToAllocate, outstanding));

        // Create allocation record
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            installmentId: inst.id,
            allocatedAmount: allocationAmount,
          },
        });

        const newAmountPaid = round2(Number(inst.amountPaid) + allocationAmount);
        const newOutstanding = round2(outstanding - allocationAmount);
        const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.installment.update({
          where: { id: inst.id },
          data: {
            amountPaid: newAmountPaid,
            outstandingAmount: newOutstanding,
            status: newStatus,
          },
        });

        remainingToAllocate = round2(remainingToAllocate - allocationAmount);
      }

      // Update contract balance
      const newBalanceRemaining = Math.max(0, round2(Number(contract.balanceRemaining) - paymentAmount));
      const isContractCompleted = newBalanceRemaining <= 0;

      await tx.contract.update({
        where: { id: data.contractId },
        data: {
          balanceRemaining: newBalanceRemaining,
          status: isContractCompleted ? 'COMPLETED' : contract.status,
        },
      });

      // If fully paid, update property status to SOLD
      if (isContractCompleted) {
        await tx.property.update({
          where: { id: contract.propertyId },
          data: { status: 'SOLD' },
        });

        await tx.propertyStatusHistory.create({
          data: {
            propertyId: contract.propertyId,
            fromStatus: 'INSTALLMENT',
            toStatus: 'SOLD',
            reason: `Contract ${contract.contractNumber} fully paid`,
          },
        });
      }

      // Automatically post balanced Double-Entry Journal Entry for this payment!
      // Dr Cash/Bank, Cr Accounts Receivable
      const coaBank = await tx.chartOfAccount.findFirst({ where: { code: '1020' } });
      const coaAr = await tx.chartOfAccount.findFirst({ where: { code: '1200' } });

      if (coaBank && coaAr) {
        const jeCount = await tx.journalEntry.count();
        const entryNumber = `JE-${new Date().getFullYear()}-${String(jeCount + 1).padStart(4, '0')}`;

        await tx.journalEntry.create({
          data: {
            organizationId: contract.project.organizationId,
            entryNumber,
            description: `Payment received ${receiptNumber} for Contract ${contract.contractNumber}`,
            reference: receiptNumber,
            sourceEntity: 'Payment',
            sourceId: payment.id,
            isPosted: true,
            postedAt: new Date(),
            createdById: data.receivedById,
            lines: {
              create: [
                {
                  accountId: coaBank.id,
                  debit: paymentAmount,
                  credit: 0,
                  description: `Collection via ${data.paymentMethod}`,
                },
                {
                  accountId: coaAr.id,
                  debit: 0,
                  credit: paymentAmount,
                  description: `Installment receivable reduction for ${contract.customer.fullName}`,
                },
              ],
            },
          },
        });

        // Update account balances
        await tx.chartOfAccount.update({
          where: { id: coaBank.id },
          data: { balance: { increment: paymentAmount } },
        });
        await tx.chartOfAccount.update({
          where: { id: coaAr.id },
          data: { balance: { decrement: paymentAmount } },
        });
      }

      // Real-time broadcast
      this.eventsGateway.emitPaymentReceived({
        paymentId: payment.id,
        receiptNumber: payment.receiptNumber,
        amount: paymentAmount,
        contractId: data.contractId,
      });

      return payment;
    });
  }

  // 3. Get Installments with Penalty Calculations
  async getContractInstallments(contractId: string) {
    const installments = await this.prisma.installment.findMany({
      where: { contractId },
      include: {
        paymentPlan: true,
        allocations: {
          include: { payment: true },
        },
      },
      orderBy: { installmentNumber: 'asc' },
    });

    const now = new Date();

    return installments.map((inst) => {
      const plan = inst.paymentPlan;
      const outstanding = Number(inst.outstandingAmount);
      const isPastDue = now > inst.dueDate && inst.status !== 'PAID';

      let calculatedPenalty = 0;
      let overdueDays = 0;

      if (isPastDue && plan) {
        const penaltyInfo = calculateLatePenalty(
          outstanding,
          inst.dueDate,
          now,
          {
            gracePeriodDays: plan.gracePeriodDays,
            dailyRatePercent: Number(plan.penaltyDailyRate),
            fixedFee: Number(plan.penaltyFixedFee),
            maxCapPercent: Number(plan.penaltyMaxCap),
          }
        );
        calculatedPenalty = penaltyInfo.penaltyAmount;
        overdueDays = penaltyInfo.overdueDays;
      }

      return {
        ...inst,
        isOverdue: isPastDue,
        overdueDays,
        calculatedPenalty,
      };
    });
  }

  // 4. Waive Late Penalty
  async waivePenalty(installmentId: string, amount: number, reason: string) {
    return this.prisma.installment.update({
      where: { id: installmentId },
      data: {
        waivedPenalty: amount,
        latePenalty: 0,
        status: 'WAIVED',
      },
    });
  }

  // 5. List All Payments
  async findAllPayments(query: { contractId?: string; customerId?: string }) {
    const where: any = {};
    if (query.contractId) where.contractId = query.contractId;
    if (query.customerId) where.customerId = query.customerId;

    return this.prisma.payment.findMany({
      where,
      include: {
        contract: {
          include: {
            property: { select: { code: true, title: true } },
            project: { select: { name: true } },
          },
        },
        customer: { select: { id: true, fullName: true, phone: true } },
        allocations: {
          include: {
            installment: { select: { installmentNumber: true, dueDate: true } },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
