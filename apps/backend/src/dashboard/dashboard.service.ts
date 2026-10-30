import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { round2 } from '@rfm/shared';

export interface PerformanceQueryDto {
  period?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to resolve start & end Date boundaries
   */
  private getDateRange(
    period: string = 'today',
    customStart?: string,
    customEnd?: string,
  ): { start: Date; end: Date; label: string } {
    const now = new Date();

    if (period === 'custom' && customStart && customEnd) {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e, label: `${customStart} to ${customEnd}` };
    }

    if (period === 'yesterday') {
      const s = new Date(now);
      s.setDate(s.getDate() - 1);
      s.setHours(0, 0, 0, 0);
      const e = new Date(now);
      e.setDate(e.getDate() - 1);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e, label: 'Yesterday (ម្សិលមិញ)' };
    }

    if (period === 'this_week') {
      const s = new Date(now);
      const day = s.getDay();
      const diff = s.getDate() - day + (day === 0 ? -6 : 1); // Monday
      s.setDate(diff);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e, label: 'This Week (សប្តាហ៍នេះ)' };
    }

    if (period === 'this_month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: s, end: e, label: 'This Month (ខែនេះ)' };
    }

    if (period === 'last_month') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: s, end: e, label: 'Last Month (ខែមុន)' };
    }

    if (period === 'this_year') {
      const s = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start: s, end: e, label: 'This Year (ឆ្នាំនេះ)' };
    }

    if (period === 'all') {
      const s = new Date(2020, 0, 1, 0, 0, 0, 0);
      const e = new Date(2035, 11, 31, 23, 59, 59, 999);
      return { start: s, end: e, label: 'All Time (សរុបទាំងអស់)' };
    }

    // Default 'today'
    const s = new Date(now);
    s.setHours(0, 0, 0, 0);
    const e = new Date(now);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e, label: 'Today (ថ្ងៃនេះ)' };
  }

  /**
   * Helper to calculate aggregate metrics within a given start and end date
   */
  private async calculateWindowMetrics(
    start: Date,
    end: Date,
    organizationId?: string,
    projectId?: string,
  ) {
    const projectScope = organizationId ? { project: { organizationId } } : {};
    const filterByProject = projectId ? { projectId } : {};

    // 1. Contracts & Plots Sold
    const contracts = await this.prisma.contract.findMany({
      where: {
        ...projectScope,
        ...filterByProject,
        OR: [
          { signedDate: { gte: start, lte: end } },
          { signedDate: null, createdAt: { gte: start, lte: end } },
        ],
      },
      include: {
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            unitNumber: true,
            landArea: true,
            buildingArea: true,
            propertyType: true,
            sellingPrice: true,
            status: true,
          },
        },
        customer: {
          select: { id: true, fullName: true, khmerName: true, phone: true },
        },
        project: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const plotsSold = contracts.length;
    const salesRevenue = round2(
      contracts.reduce((sum, c) => sum + Number(c.sellingPrice), 0),
    );

    // 2. Verified Collections (Cash Inflow)
    const payments = await this.prisma.payment.findMany({
      where: {
        ...(organizationId ? { contract: { project: { organizationId } } } : {}),
        ...(projectId ? { contract: { projectId } } : {}),
        verificationStatus: 'VERIFIED',
        paymentDate: { gte: start, lte: end },
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        contract: {
          select: {
            contractNumber: true,
            property: { select: { code: true, unitNumber: true } },
            project: { select: { name: true } },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const cashCollected = round2(
      payments.reduce((sum, p) => sum + Number(p.amount), 0),
    );

    // 3. Operating & Project Expenses (Cash Outflow)
    const expenses = await this.prisma.expense.findMany({
      where: {
        ...projectScope,
        ...filterByProject,
        status: { in: ['APPROVED', 'PAID'] },
        expenseDate: { gte: start, lte: end },
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });

    const totalExpenses = round2(
      expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    );

    // 4. Net Profit & Margins
    const netProfit = round2(salesRevenue - totalExpenses);
    const netCashFlow = round2(cashCollected - totalExpenses);
    const profitMargin = salesRevenue > 0 ? round2((netProfit / salesRevenue) * 100) : 0;

    return {
      plotsSold,
      salesRevenue,
      cashCollected,
      expenses: totalExpenses,
      netProfit,
      netCashFlow,
      profitMargin,
      contracts,
      payments,
      expensesList: expenses,
    };
  }

  /**
   * Executive Performance & Detailed Summary Report (Today, Month, Year, Custom Range)
   */
  async getPerformanceReport(organizationId?: string, query: PerformanceQueryDto = {}) {
    const { period = 'today', startDate, endDate, projectId } = query;

    // 1. Compute Benchmark Windows (Today, This Month, This Year)
    const todayRange = this.getDateRange('today');
    const monthRange = this.getDateRange('this_month');
    const yearRange = this.getDateRange('this_year');

    const [todayMetrics, monthMetrics, yearMetrics] = await Promise.all([
      this.calculateWindowMetrics(todayRange.start, todayRange.end, organizationId, projectId),
      this.calculateWindowMetrics(monthRange.start, monthRange.end, organizationId, projectId),
      this.calculateWindowMetrics(yearRange.start, yearRange.end, organizationId, projectId),
    ]);

    // 2. Compute Selected / Custom Date Range Window
    const selectedRangeConfig = this.getDateRange(period, startDate, endDate);
    const selectedMetrics = await this.calculateWindowMetrics(
      selectedRangeConfig.start,
      selectedRangeConfig.end,
      organizationId,
      projectId,
    );

    // 3. Inventory Overview (សល់ប៉ុន្មាន)
    const allProperties = await this.prisma.property.findMany({
      where: {
        ...(organizationId ? { project: { organizationId } } : {}),
        ...(projectId ? { projectId } : {}),
      },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        sellingPrice: true,
        projectId: true,
        project: { select: { id: true, name: true, code: true } },
      },
    });

    const totalPlots = allProperties.length;
    const availablePlots = allProperties.filter((p) => p.status === 'AVAILABLE').length;
    const availableValue = round2(
      allProperties
        .filter((p) => p.status === 'AVAILABLE')
        .reduce((sum, p) => sum + Number(p.sellingPrice), 0),
    );

    const reservedPlots = allProperties.filter((p) => p.status === 'RESERVED').length;
    const reservedValue = round2(
      allProperties
        .filter((p) => p.status === 'RESERVED')
        .reduce((sum, p) => sum + Number(p.sellingPrice), 0),
    );

    const installmentPlots = allProperties.filter((p) => p.status === 'INSTALLMENT').length;
    const installmentValue = round2(
      allProperties
        .filter((p) => p.status === 'INSTALLMENT')
        .reduce((sum, p) => sum + Number(p.sellingPrice), 0),
    );

    const soldPlots = allProperties.filter((p) => p.status === 'SOLD').length;
    const soldValue = round2(
      allProperties
        .filter((p) => p.status === 'SOLD')
        .reduce((sum, p) => sum + Number(p.sellingPrice), 0),
    );

    const remainingPercentage = totalPlots > 0 ? round2((availablePlots / totalPlots) * 100) : 0;
    const occupancyRate = totalPlots > 0 ? round2(((soldPlots + installmentPlots) / totalPlots) * 100) : 0;

    // 4. Daily Breakdown for Selected Range (for timeline chart and daily reports)
    const dailyMap = new Map<string, {
      date: string;
      displayDate: string;
      plotsSold: number;
      salesRevenue: number;
      cashCollected: number;
      expenses: number;
      netProfit: number;
    }>();

    // Initialize days in range (if range <= 60 days)
    const diffDays = Math.ceil(
      (selectedRangeConfig.end.getTime() - selectedRangeConfig.start.getTime()) / (1000 * 3600 * 24),
    );

    if (diffDays <= 90) {
      const cur = new Date(selectedRangeConfig.start);
      while (cur <= selectedRangeConfig.end) {
        const dStr = cur.toISOString().split('T')[0];
        dailyMap.set(dStr, {
          date: dStr,
          displayDate: cur.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          plotsSold: 0,
          salesRevenue: 0,
          cashCollected: 0,
          expenses: 0,
          netProfit: 0,
        });
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Populate contracts into daily buckets
    for (const c of selectedMetrics.contracts) {
      const d = (c.signedDate || c.createdAt).toISOString().split('T')[0];
      const entry = dailyMap.get(d) || {
        date: d,
        displayDate: d,
        plotsSold: 0,
        salesRevenue: 0,
        cashCollected: 0,
        expenses: 0,
        netProfit: 0,
      };
      entry.plotsSold += 1;
      entry.salesRevenue = round2(entry.salesRevenue + Number(c.sellingPrice));
      entry.netProfit = round2(entry.salesRevenue - entry.expenses);
      dailyMap.set(d, entry);
    }

    // Populate payments into daily buckets
    for (const p of selectedMetrics.payments) {
      const d = p.paymentDate.toISOString().split('T')[0];
      const entry = dailyMap.get(d) || {
        date: d,
        displayDate: d,
        plotsSold: 0,
        salesRevenue: 0,
        cashCollected: 0,
        expenses: 0,
        netProfit: 0,
      };
      entry.cashCollected = round2(entry.cashCollected + Number(p.amount));
      dailyMap.set(d, entry);
    }

    // Populate expenses into daily buckets
    for (const e of selectedMetrics.expensesList) {
      const d = e.expenseDate.toISOString().split('T')[0];
      const entry = dailyMap.get(d) || {
        date: d,
        displayDate: d,
        plotsSold: 0,
        salesRevenue: 0,
        cashCollected: 0,
        expenses: 0,
        netProfit: 0,
      };
      entry.expenses = round2(entry.expenses + Number(e.amount));
      entry.netProfit = round2(entry.salesRevenue - entry.expenses);
      dailyMap.set(d, entry);
    }

    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 5. Expense Breakdown by Category
    const categoryMap: Record<string, number> = {};
    for (const e of selectedMetrics.expensesList) {
      categoryMap[e.category] = round2((categoryMap[e.category] || 0) + Number(e.amount));
    }
    const expenseCategoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: selectedMetrics.expenses > 0 ? round2((amount / selectedMetrics.expenses) * 100) : 0,
    }));

    // 6. Project Breakdown for Selected Range
    const projects = await this.prisma.project.findMany({
      where: organizationId ? { organizationId } : undefined,
      select: { id: true, name: true, code: true },
    });

    const projectBreakdown = projects.map((proj) => {
      const projProps = allProperties.filter((p) => p.projectId === proj.id);
      const projContracts = selectedMetrics.contracts.filter((c) => c.projectId === proj.id);
      const projExpenses = selectedMetrics.expensesList.filter((e) => e.projectId === proj.id);
      const projPayments = selectedMetrics.payments.filter((p) => p.contract?.project?.name === proj.name);

      const pSales = round2(projContracts.reduce((s, c) => s + Number(c.sellingPrice), 0));
      const pExp = round2(projExpenses.reduce((s, e) => s + Number(e.amount), 0));
      const pColl = round2(projPayments.reduce((s, p) => s + Number(p.amount), 0));

      return {
        id: proj.id,
        name: proj.name,
        code: proj.code,
        totalPlots: projProps.length,
        availablePlots: projProps.filter((p) => p.status === 'AVAILABLE').length,
        plotsSold: projContracts.length,
        salesRevenue: pSales,
        cashCollected: pColl,
        expenses: pExp,
        netProfit: round2(pSales - pExp),
      };
    });

    return {
      benchmarks: {
        today: {
          period: 'today',
          label: 'Today (ថ្ងៃនេះ)',
          plotsSold: todayMetrics.plotsSold,
          salesRevenue: todayMetrics.salesRevenue,
          cashCollected: todayMetrics.cashCollected,
          expenses: todayMetrics.expenses,
          netProfit: todayMetrics.netProfit,
          netCashFlow: todayMetrics.netCashFlow,
          profitMargin: todayMetrics.profitMargin,
        },
        thisMonth: {
          period: 'this_month',
          label: 'This Month (ខែនេះ)',
          plotsSold: monthMetrics.plotsSold,
          salesRevenue: monthMetrics.salesRevenue,
          cashCollected: monthMetrics.cashCollected,
          expenses: monthMetrics.expenses,
          netProfit: monthMetrics.netProfit,
          netCashFlow: monthMetrics.netCashFlow,
          profitMargin: monthMetrics.profitMargin,
        },
        thisYear: {
          period: 'this_year',
          label: 'This Year (ឆ្នាំនេះ)',
          plotsSold: yearMetrics.plotsSold,
          salesRevenue: yearMetrics.salesRevenue,
          cashCollected: yearMetrics.cashCollected,
          expenses: yearMetrics.expenses,
          netProfit: yearMetrics.netProfit,
          netCashFlow: yearMetrics.netCashFlow,
          profitMargin: yearMetrics.profitMargin,
        },
      },
      inventory: {
        totalPlots,
        availablePlots,
        availableValue,
        reservedPlots,
        reservedValue,
        installmentPlots,
        installmentValue,
        soldPlots,
        soldValue,
        remainingPercentage,
        occupancyRate,
      },
      selectedRange: {
        period,
        startDate: selectedRangeConfig.start.toISOString().split('T')[0],
        endDate: selectedRangeConfig.end.toISOString().split('T')[0],
        label: selectedRangeConfig.label,
        plotsSold: selectedMetrics.plotsSold,
        salesRevenue: selectedMetrics.salesRevenue,
        cashCollected: selectedMetrics.cashCollected,
        expenses: selectedMetrics.expenses,
        netProfit: selectedMetrics.netProfit,
        netCashFlow: selectedMetrics.netCashFlow,
        profitMargin: selectedMetrics.profitMargin,
        soldPlotsList: selectedMetrics.contracts.map((c) => ({
          contractId: c.id,
          contractNumber: c.contractNumber,
          soldDate: c.signedDate || c.createdAt,
          sellingPrice: Number(c.sellingPrice),
          depositPaid: Number(c.depositPaid),
          balanceRemaining: Number(c.balanceRemaining),
          status: c.status,
          property: c.property,
          customer: c.customer,
          project: c.project,
        })),
        expensesList: selectedMetrics.expensesList.map((e) => ({
          expenseId: e.id,
          expenseNumber: e.expenseNumber,
          category: e.category,
          vendorName: e.vendorName,
          description: e.description,
          amount: Number(e.amount),
          expenseDate: e.expenseDate,
          status: e.status,
          project: e.project,
        })),
        collectionsList: selectedMetrics.payments.map((p) => ({
          paymentId: p.id,
          receiptNumber: p.receiptNumber,
          amount: Number(p.amount),
          paymentDate: p.paymentDate,
          customerName: p.customer?.fullName,
          contractNumber: p.contract?.contractNumber,
          projectName: p.contract?.project?.name,
        })),
        dailyBreakdown,
        expenseCategoryBreakdown,
        projectBreakdown,
      },
    };
  }

  /**
   * General Executive KPI summary & trends
   */
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
      contracts.reduce((sum, c) => sum + Number(c.sellingPrice), 0),
    );
    const totalOutstandingAr = round2(
      contracts.reduce((sum, c) => sum + Number(c.balanceRemaining), 0),
    );

    // 3. Payments & Collections
    const payments = await this.prisma.payment.findMany({
      where: organizationId ? { contract: { project: { organizationId } } } : undefined,
      select: { amount: true },
    });
    const totalCashCollected = round2(
      payments.reduce((sum, p) => sum + Number(p.amount), 0),
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
      expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    );

    // 5. Cash & Bank Balances
    const accounts = await this.prisma.financialAccount.findMany({
      where: orgFilter,
      select: { currentBalance: true },
    });
    const totalBankBalance = round2(
      accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0),
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

    // 7. Dynamic Monthly Sales Trends for last 6 calendar months
    const monthlySalesTrends: Array<{ month: string; contractSales: number; collections: number; expenses: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthLabel = monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      const [mContracts, mPayments, mExpenses] = await Promise.all([
        this.prisma.contract.findMany({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
            status: { notIn: ['CANCELLED', 'VOIDED'] },
          },
          select: { sellingPrice: true },
        }),
        this.prisma.payment.findMany({
          where: {
            paymentDate: { gte: monthStart, lte: monthEnd },
            verificationStatus: 'VERIFIED',
          },
          select: { amount: true },
        }),
        this.prisma.expense.findMany({
          where: {
            expenseDate: { gte: monthStart, lte: monthEnd },
            status: { in: ['APPROVED', 'PAID'] },
          },
          select: { amount: true },
        }),
      ]);

      monthlySalesTrends.push({
        month: monthLabel,
        contractSales: round2(mContracts.reduce((s, c) => s + Number(c.sellingPrice), 0)),
        collections: round2(mPayments.reduce((s, p) => s + Number(p.amount), 0)),
        expenses: round2(mExpenses.reduce((s, e) => s + Number(e.amount), 0)),
      });
    }

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
      monthlySalesTrends,
    };
  }
}
