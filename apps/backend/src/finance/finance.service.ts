import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Expenses
  async getExpenses(query: { projectId?: string; category?: string; status?: string }) {
    const where: any = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;

    return this.prisma.expense.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        requestedBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async createExpense(data: {
    projectId: string;
    category: string;
    amount: number;
    currency?: string;
    vendorName: string;
    description: string;
    invoiceUrl?: string;
    requestedById?: string;
  }) {
    const count = await this.prisma.expense.count();
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.expense.create({
      data: {
        expenseNumber,
        projectId: data.projectId,
        category: data.category,
        amount: data.amount,
        currency: data.currency || 'USD',
        vendorName: data.vendorName,
        description: data.description,
        invoiceUrl: data.invoiceUrl,
        requestedById: data.requestedById,
        status: 'PENDING_APPROVAL',
      },
    });
  }

  async approveExpense(id: string, approverId: string) {
    const exp = await this.prisma.expense.findUnique({ where: { id } });
    if (!exp) throw new NotFoundException('Expense not found');

    return this.prisma.expense.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });
  }

  async payExpense(id: string, bankAccountId: string, paidDate?: string) {
    return this.prisma.$transaction(async (tx) => {
      const exp = await tx.expense.findUnique({
        where: { id },
        include: { project: true },
      });
      if (!exp) throw new NotFoundException('Expense not found');
      if (exp.status !== 'APPROVED') {
        throw new BadRequestException('Expense must be approved before payment');
      }

      const account = await tx.financialAccount.findUnique({
        where: { id: bankAccountId },
      });
      if (!account) throw new NotFoundException('Bank account not found');

      const amount = Number(exp.amount);
      if (Number(account.currentBalance) < amount) {
        throw new BadRequestException('Insufficient balance in selected bank account');
      }

      // Deduct from bank account
      await tx.financialAccount.update({
        where: { id: bankAccountId },
        data: { currentBalance: { decrement: amount } },
      });

      // Update expense
      const updated = await tx.expense.update({
        where: { id },
        data: {
          status: 'PAID',
          paymentDate: paidDate ? new Date(paidDate) : new Date(),
        },
      });

      // Post balanced double-entry journal entry: Dr Expense (5010/6020/6050), Cr Bank (1020)
      const coaBank = await tx.chartOfAccount.findFirst({ where: { code: '1020' } });
      const expCode = exp.category === 'CONSTRUCTION' ? '5010' : exp.category === 'MARKETING' ? '6020' : '6050';
      const coaExp = await tx.chartOfAccount.findFirst({ where: { code: expCode } });

      if (coaBank && coaExp) {
        const jeCount = await tx.journalEntry.count();
        const entryNumber = `JE-${new Date().getFullYear()}-${String(jeCount + 1).padStart(4, '0')}`;

        await tx.journalEntry.create({
          data: {
            organizationId: exp.project.organizationId,
            entryNumber,
            description: `Payment for Expense ${exp.expenseNumber} to ${exp.vendorName}`,
            reference: exp.expenseNumber,
            sourceEntity: 'Expense',
            sourceId: exp.id,
            isPosted: true,
            postedAt: new Date(),
            lines: {
              create: [
                {
                  accountId: coaExp.id,
                  debit: amount,
                  credit: 0,
                  description: exp.description,
                },
                {
                  accountId: coaBank.id,
                  debit: 0,
                  credit: amount,
                  description: `Disbursement from ${account.name}`,
                },
              ],
            },
          },
        });

        // Update COA balances
        await tx.chartOfAccount.update({
          where: { id: coaExp.id },
          data: { balance: { increment: amount } },
        });
        await tx.chartOfAccount.update({
          where: { id: coaBank.id },
          data: { balance: { decrement: amount } },
        });
      }

      return updated;
    });
  }

  // 2. Financial Accounts
  async getAccounts(organizationId?: string) {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;

    return this.prisma.financialAccount.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAccount(data: any, organizationId: string) {
    return this.prisma.financialAccount.create({
      data: {
        ...data,
        organizationId,
        currentBalance: data.openingBalance || 0,
      },
    });
  }

  async transferFunds(data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    fee?: number;
    reference?: string;
    description?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const fromAcc = await tx.financialAccount.findUnique({ where: { id: data.fromAccountId } });
      const toAcc = await tx.financialAccount.findUnique({ where: { id: data.toAccountId } });

      if (!fromAcc || !toAcc) throw new NotFoundException('Account not found');
      if (data.fromAccountId === data.toAccountId) {
        throw new BadRequestException('Source and destination accounts must be different');
      }

      const totalDeduct = Number(data.amount) + (data.fee || 0);
      if (Number(fromAcc.currentBalance) < totalDeduct) {
        throw new BadRequestException('Insufficient funds in source account');
      }

      await tx.financialAccount.update({
        where: { id: data.fromAccountId },
        data: { currentBalance: { decrement: totalDeduct } },
      });

      await tx.financialAccount.update({
        where: { id: data.toAccountId },
        data: { currentBalance: { increment: data.amount } },
      });

      return {
        success: true,
        transferredAmount: data.amount,
        fee: data.fee || 0,
        fromAccount: fromAcc.name,
        toAccount: toAcc.name,
      };
    });
  }

  // 3. Income Records
  async getIncomeRecords(query: { projectId?: string }) {
    const where: any = {};
    if (query.projectId) where.projectId = query.projectId;

    return this.prisma.incomeRecord.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
      orderBy: { receivedDate: 'desc' },
    });
  }
}
