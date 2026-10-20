import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { round2 } from '@rfm/shared';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(organizationId?: string) {
    const orgFilter = organizationId ? { organizationId } : undefined;

    // 1. Projects & Properties
    const totalProjects = await this.prisma.project.count({ where: orgFilter });
    const properties = await this.prisma.property.findMany({
      where: organizationId ? { project: { organizationId } } : undefined,
      select: { status: true, sellingPrice: true, propertyType: true },
    });

    const totalProperties = properties.length;
    const availableProperties = properties.filter((p) => p.status === 'AVAILABLE').length;
    const reservedProperties = properties.filter((p) => p.status === 'RESERVED').length;
    const soldProperties = properties.filter((p) => p.status === 'SOLD').length;
    const installmentProperties = properties.filter((p) => p.status === 'INSTALLMENT').length;

    // 2. Contracts & Sales
    const contracts = await this.prisma.contract.findMany({
      where: organizationId ? { project: { organizationId } } : undefined,
      select: { sellingPrice: true, depositPaid: true, balanceRemaining: true, status: true },
    });

    const totalContractSales = round2(
      contracts.reduce((sum, c) => sum + Number(c.sellingPrice), 0)
    );
    const totalOutstandingAr = round2(
      contracts.reduce((sum, c) => sum + Number(c.balanceRemaining), 0)
    );

    // 3. Payments & Collections
    const payments = await this.prisma.payment.findMany({
      where: organizationId ? { contract: { project: { organizationId } } } : undefined,
      select: { amount: true },
    });
    const totalCashCollected = round2(
      payments.reduce((sum, p) => sum + Number(p.amount), 0)
    );

    // 4. Expenses
    const expenses = await this.prisma.expense.findMany({
      where: {
        ...(organizationId ? { project: { organizationId } } : {}),
        status: { in: ['APPROVED', 'PAID'] },
      },
      select: { amount: true },
    });
    const totalExpenses = round2(
      expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    );

    // 5. Cash & Bank Balances
    const accounts = await this.prisma.financialAccount.findMany({
      where: orgFilter,
      select: { currentBalance: true },
    });
    const totalBankBalance = round2(
      accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0)
    );

    // 6. Overdue installments count
    const now = new Date();
    const overdueCount = await this.prisma.installment.count({
      where: {
        dueDate: { lt: now },
        status: { in: ['UPCOMING', 'DUE', 'PARTIALLY_PAID', 'OVERDUE'] },
        outstandingAmount: { gt: 0 },
      },
    });

    return {
      kpis: {
        totalProjects,
        totalProperties,
        availableProperties,
        reservedProperties,
        soldProperties,
        installmentProperties,
        totalContractSales,
        totalCashCollected,
        totalOutstandingAr,
        totalExpenses,
        totalBankBalance,
        overdueCount,
      },
      propertyStatusDistribution: [
        { name: 'Available', value: availableProperties, color: '#10b981' },
        { name: 'Reserved', value: reservedProperties, color: '#f59e0b' },
        { name: 'Installment', value: installmentProperties, color: '#3b82f6' },
        { name: 'Sold', value: soldProperties, color: '#ef4444' },
      ],
      monthlySalesTrends: [
        { month: 'May 2026', contractSales: 380000, collections: 120000, expenses: 85000 },
        { month: 'Jun 2026', contractSales: 540000, collections: 185000, expenses: 95000 },
        { month: 'Jul 2026', contractSales: 420000, collections: 210000, expenses: 110000 },
        { month: 'Aug 2026', contractSales: 610000, collections: 275000, expenses: 125000 },
        { month: 'Sep 2026', contractSales: 730000, collections: 340000, expenses: 140000 },
        { month: 'Oct 2026', contractSales: 850000, collections: 410000, expenses: 155000 },
      ],
    };
  }
}
