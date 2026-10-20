import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { round2 } from '@rfm/shared';

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Chart of Accounts
  async getChartOfAccounts(organizationId?: string) {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;

    return this.prisma.chartOfAccount.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  async createAccount(data: {
    code: string;
    name: string;
    accountType: string;
    parentId?: string;
    description?: string;
    organizationId: string;
  }) {
    const existing = await this.prisma.chartOfAccount.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException(`Account code ${data.code} already exists`);
    }

    return this.prisma.chartOfAccount.create({
      data: {
        organizationId: data.organizationId,
        code: data.code,
        name: data.name,
        accountType: data.accountType,
        parentId: data.parentId,
        description: data.description,
        balance: 0,
      },
    });
  }

  // 2. Journal Entries
  async getJournalEntries(organizationId?: string) {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;

    return this.prisma.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, accountType: true } },
          },
        },
      },
      orderBy: { entryDate: 'desc' },
    });
  }

  async createJournalEntry(data: {
    entryDate?: string;
    description: string;
    reference?: string;
    lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      description?: string;
    }>;
    organizationId: string;
    createdById?: string;
  }) {
    if (!data.lines || data.lines.length < 2) {
      throw new BadRequestException('A journal entry must contain at least two line items');
    }

    // Verify Total Debits == Total Credits
    const totalDebit = round2(
      data.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0)
    );
    const totalCredit = round2(
      data.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0)
    );

    if (totalDebit !== totalCredit) {
      throw new BadRequestException(
        `Journal entry does not balance: Total Debits ($${totalDebit}) must equal Total Credits ($${totalCredit})`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.journalEntry.count();
      const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const entry = await tx.journalEntry.create({
        data: {
          organizationId: data.organizationId,
          entryNumber,
          entryDate: data.entryDate ? new Date(data.entryDate) : new Date(),
          description: data.description,
          reference: data.reference,
          isPosted: true,
          postedAt: new Date(),
          createdById: data.createdById,
          lines: {
            create: data.lines.map((line) => ({
              accountId: line.accountId,
              debit: Number(line.debit || 0),
              credit: Number(line.credit || 0),
              description: line.description,
            })),
          },
        },
        include: {
          lines: { include: { account: true } },
        },
      });

      // Update balances in Chart of Accounts
      for (const line of data.lines) {
        const netChange = Number(line.debit || 0) - Number(line.credit || 0);
        await tx.chartOfAccount.update({
          where: { id: line.accountId },
          data: { balance: { increment: netChange } },
        });
      }

      return entry;
    });
  }

  // 3. Trial Balance
  async getTrialBalance(organizationId?: string) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { code: 'asc' },
    });

    let totalDebits = 0;
    let totalCredits = 0;

    const rows = accounts.map((acc) => {
      const balance = Number(acc.balance);
      const isDebitNormal = ['ASSET', 'EXPENSE'].includes(acc.accountType);
      
      let debit = 0;
      let credit = 0;

      if (isDebitNormal) {
        if (balance >= 0) debit = balance;
        else credit = Math.abs(balance);
      } else {
        if (balance >= 0) credit = balance;
        else debit = Math.abs(balance);
      }

      totalDebits = round2(totalDebits + debit);
      totalCredits = round2(totalCredits + credit);

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        debit,
        credit,
      };
    });

    return {
      rows,
      totalDebits,
      totalCredits,
      isBalanced: totalDebits === totalCredits,
    };
  }

  // 4. Profit & Loss Statement (Income Statement)
  async getProfitAndLoss(organizationId?: string) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        accountType: { in: ['REVENUE', 'EXPENSE'] },
      },
      orderBy: { code: 'asc' },
    });

    const revenues = accounts
      .filter((a) => a.accountType === 'REVENUE')
      .map((a) => ({ code: a.code, name: a.name, amount: Number(a.balance) }));

    const expenses = accounts
      .filter((a) => a.accountType === 'EXPENSE')
      .map((a) => ({ code: a.code, name: a.name, amount: Number(a.balance) }));

    const totalRevenue = round2(revenues.reduce((sum, r) => sum + r.amount, 0));
    const totalExpense = round2(expenses.reduce((sum, e) => sum + e.amount, 0));
    const netIncome = round2(totalRevenue - totalExpense);

    return {
      revenues,
      totalRevenue,
      expenses,
      totalExpense,
      netIncome,
      grossProfitMargin: totalRevenue > 0 ? round2((netIncome / totalRevenue) * 100) : 0,
    };
  }

  // 5. Balance Sheet
  async getBalanceSheet(organizationId?: string) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] },
      },
      orderBy: { code: 'asc' },
    });

    const assets = accounts
      .filter((a) => a.accountType === 'ASSET')
      .map((a) => ({ code: a.code, name: a.name, amount: Number(a.balance) }));

    const liabilities = accounts
      .filter((a) => a.accountType === 'LIABILITY')
      .map((a) => ({ code: a.code, name: a.name, amount: Number(a.balance) }));

    const equity = accounts
      .filter((a) => a.accountType === 'EQUITY')
      .map((a) => ({ code: a.code, name: a.name, amount: Number(a.balance) }));

    // Include current period net income in equity
    const revTotal = accounts.filter((a) => a.accountType === 'REVENUE').reduce((s, a) => s + Number(a.balance), 0);
    const expTotal = accounts.filter((a) => a.accountType === 'EXPENSE').reduce((s, a) => s + Number(a.balance), 0);
    const retainedEarningsCurrent = round2(revTotal - expTotal);

    const totalAssets = round2(assets.reduce((sum, a) => sum + a.amount, 0));
    const totalLiabilities = round2(liabilities.reduce((sum, l) => sum + l.amount, 0));
    const totalEquity = round2(equity.reduce((sum, e) => sum + e.amount, 0) + retainedEarningsCurrent);

    return {
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      retainedEarningsCurrent,
      totalEquity,
      totalLiabilitiesAndEquity: round2(totalLiabilities + totalEquity),
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1.0,
    };
  }

  // 6. Accounts Receivable (AR) Aging
  async getArAging() {
    const installments = await this.prisma.installment.findMany({
      where: {
        status: { in: ['UPCOMING', 'DUE', 'PARTIALLY_PAID', 'OVERDUE'] },
        outstandingAmount: { gt: 0 },
      },
      include: {
        contract: {
          include: {
            customer: true,
            property: true,
          },
        },
      },
    });

    const now = new Date();
    let currentBucket = 0; // Not due yet or 0-30 days
    let days31_60 = 0;
    let days61_90 = 0;
    let over90 = 0;

    const details: any[] = [];

    for (const inst of installments) {
      const outstanding = Number(inst.outstandingAmount);
      const diffDays = Math.floor((now.getTime() - inst.dueDate.getTime()) / (1000 * 3600 * 24));

      let bucket = 'CURRENT';
      if (diffDays <= 0) {
        currentBucket = round2(currentBucket + outstanding);
        bucket = 'CURRENT';
      } else if (diffDays <= 30) {
        currentBucket = round2(currentBucket + outstanding);
        bucket = '1_30_DAYS';
      } else if (diffDays <= 60) {
        days31_60 = round2(days31_60 + outstanding);
        bucket = '31_60_DAYS';
      } else if (diffDays <= 90) {
        days61_90 = round2(days61_90 + outstanding);
        bucket = '61_90_DAYS';
      } else {
        over90 = round2(over90 + outstanding);
        bucket = 'OVER_90_DAYS';
      }

      details.push({
        installmentId: inst.id,
        contractNumber: inst.contract.contractNumber,
        customerName: inst.contract.customer.fullName,
        propertyCode: inst.contract.property.code,
        dueDate: inst.dueDate,
        outstandingAmount: outstanding,
        daysOverdue: Math.max(0, diffDays),
        bucket,
      });
    }

    const totalAr = round2(currentBucket + days31_60 + days61_90 + over90);

    return {
      summary: {
        currentBucket,
        days31_60,
        days61_90,
        over90,
        totalAr,
      },
      details,
    };
  }
}
