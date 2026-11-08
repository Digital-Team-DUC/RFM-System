import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency, Currency } from '@rfm/shared';
import {
  Building2,
  Home,
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  Receipt,
  AlertCircle,
  ArrowUpRight,
  MapPin,
  CheckCircle,
  Calendar,
  Clock,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [perfData, setPerfData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryRes, perfRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/performance?period=this_month').catch(() => null),
        ]);
        setData(summaryRes);
        setPerfData(perfRes);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-emerald-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Aggregating database analytics...</span>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const pieData = data?.propertyStatusDistribution || [];
  const trendData = data?.monthlySalesTrends || [];
  const benchmarks = perfData?.benchmarks || {};
  const inventory = perfData?.inventory || {};

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 font-sans">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/reports/performance"
            className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t('dashboard.executiveReport')}</span>
          </Link>
          <Link
            to="/master-plan"
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center space-x-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('nav.masterPlan')}</span>
          </Link>
          <Link
            to="/sales/bookings"
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            + {t('actions.reserveUnit')}
          </Link>
          <Link
            to="/payments"
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            {t('actions.recordPayment')}
          </Link>
        </div>
      </div>

      {/* 4 Performance Horizons: Today vs This Month vs This Year vs Remaining Stock */}
      <div className="space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {t('dashboard.horizonsTitle')}
            </h2>
          </div>
          <Link
            to="/reports/performance"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center space-x-1"
          >
            <span>{t('dashboard.viewFullReport')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today Card */}
          <Link
            to="/reports/performance?period=today"
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {i18n.language === 'km' ? 'ថ្ងៃនេះ' : 'Today'}
              </span>
              <span className="text-xs font-sans font-semibold text-emerald-400 inline-flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs">{benchmarks.today?.plotsSold || 0}</span>
                <span>{i18n.language === 'km' ? 'ឡូត៍លក់បាន' : 'Plots Sold'}</span>
              </span>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400 font-sans">{i18n.language === 'km' ? 'ចំណូលលក់' : 'Sales'}:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatCurrency(benchmarks.today?.salesRevenue || 0, Currency.USD)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400 font-sans">{i18n.language === 'km' ? 'ចំណាយ' : 'Expenses'}:</span>
                <span className="font-mono text-rose-400">
                  - {formatCurrency(benchmarks.today?.expenses || 0, Currency.USD)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-300 font-sans">{i18n.language === 'km' ? 'ចំណេញសុទ្ធ' : 'Net Profit'}:</span>
                <span className={`font-mono font-black text-sm ${
                  (benchmarks.today?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(benchmarks.today?.netProfit || 0, Currency.USD)}
                </span>
              </div>
            </div>
          </Link>

          {/* This Month Card */}
          <Link
            to="/reports/performance?period=this_month"
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 font-sans">
                <Calendar className="w-3.5 h-3.5" />
                {i18n.language === 'km' ? 'ខែនេះ' : 'This Month'}
              </span>
              <span className="text-xs font-sans font-semibold text-blue-400 inline-flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs">{benchmarks.thisMonth?.plotsSold || 0}</span>
                <span>{i18n.language === 'km' ? 'ឡូត៍លក់បាន' : 'Plots Sold'}</span>
              </span>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400 font-sans">{i18n.language === 'km' ? 'ចំណូលលក់' : 'Sales'}:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatCurrency(benchmarks.thisMonth?.salesRevenue || 0, Currency.USD)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400 font-sans">{i18n.language === 'km' ? 'ចំណាយ' : 'Expenses'}:</span>
                <span className="font-mono text-rose-400">
                  - {formatCurrency(benchmarks.thisMonth?.expenses || 0, Currency.USD)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-300 font-sans">{i18n.language === 'km' ? 'ចំណេញសុទ្ធ' : 'Net Profit'}:</span>
                <span className={`font-mono font-black text-sm ${
                  (benchmarks.thisMonth?.netProfit || 0) >= 0 ? 'text-blue-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(benchmarks.thisMonth?.netProfit || 0, Currency.USD)}
                </span>
              </div>
            </div>
          </Link>

          {/* This Year Card */}
          <Link
            to="/reports/performance?period=this_year"
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 font-sans">
                <Clock className="w-3.5 h-3.5" />
                {i18n.language === 'km' ? 'ឆ្នាំនេះ' : 'This Year'}
              </span>
              <span className="text-xs font-sans font-semibold text-purple-400 inline-flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs">{benchmarks.thisYear?.plotsSold || 0}</span>
                <span>{i18n.language === 'km' ? 'ឡូត៍លក់បាន' : 'Plots Sold'}</span>
              </span>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400 font-sans">{i18n.language === 'km' ? 'ចំណូលលក់' : 'Sales'}:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatCurrency(benchmarks.thisYear?.salesRevenue || 0, Currency.USD)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400 font-sans">{i18n.language === 'km' ? 'ចំណាយ' : 'Expenses'}:</span>
                <span className="font-mono text-rose-400">
                  - {formatCurrency(benchmarks.thisYear?.expenses || 0, Currency.USD)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-300 font-sans">{i18n.language === 'km' ? 'ចំណេញសុទ្ធ' : 'Net Profit'}:</span>
                <span className={`font-mono font-black text-sm ${
                  (benchmarks.thisYear?.netProfit || 0) >= 0 ? 'text-purple-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(benchmarks.thisYear?.netProfit || 0, Currency.USD)}
                </span>
              </div>
            </div>
          </Link>

          {/* Remaining Stock Card */}
          <Link
            to="/properties"
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-sans">
                <Home className="w-3.5 h-3.5" />
                {i18n.language === 'km' ? 'ស្តុកនៅសល់' : 'Stock Remaining'}
              </span>
              <span className="text-xs font-sans font-semibold text-amber-400 inline-flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs">{inventory.availablePlots || 0} / {inventory.totalPlots || 0}</span>
                <span>{i18n.language === 'km' ? 'ឡូត៍នៅសល់' : 'Available'}</span>
              </span>
            </div>
            <div className="space-y-1.5 mt-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400">{i18n.language === 'km' ? 'តម្លៃស្តុកនៅសល់' : 'Available Value'}:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {formatCurrency(inventory.availableValue || 0, Currency.USD)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400">{i18n.language === 'km' ? 'អត្រាលក់ដាច់' : 'Sold Rate'}:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {inventory.occupancyRate || 0}% Sold
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-xs">
                <span className="text-slate-400">{i18n.language === 'km' ? 'ឡូត៍នៅទំនេរ' : 'Remaining Plots'}:</span>
                <span className="font-bold text-white inline-flex items-baseline gap-1">
                  <span className="font-mono">{inventory.availablePlots || 0}</span>
                  <span className="font-sans">{i18n.language === 'km' ? 'ឡូត៍' : 'Units'}</span>
                  <span className="font-mono">({inventory.remainingPercentage || 0}%)</span>
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contract Sales */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('kpi.contractSales')}
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-3 font-mono">
            {formatCurrency(kpis.totalContractSales, Currency.USD)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center font-medium">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>{i18n.language === 'km' ? 'តម្លៃកិច្ចសន្យាលក់បានផ្ទៀងផ្ទាត់' : 'Reconciled Contract Value'}</span>
          </div>
        </div>

        {/* Cash Collected */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('kpi.cashCollected')}
            </span>
            <DollarSign className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300 mt-3 font-mono">
            {formatCurrency(kpis.totalCashCollected, Currency.USD)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {i18n.language === 'km' ? 'ប្រាក់កក់ និងការបង់រំលស់ជាក់ស្តែង' : 'Deposits & Verified Installments'}
          </div>
        </div>

        {/* Receivables Outstanding */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('kpi.outstandingAr')}
            </span>
            <CreditCard className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-300 mt-3 font-mono">
            {formatCurrency(kpis.totalOutstandingAr, Currency.USD)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{i18n.language === 'km' ? 'បំណុលកិច្ចសន្យានៅសល់ត្រូវប្រមូល' : 'Remaining Contract Receivables'}</span>
            {kpis.overdueCount > 0 && (
              <span className="text-amber-400 font-bold text-[10px]">
                {kpis.overdueCount} Overdue
              </span>
            )}
          </div>
        </div>

        {/* Cash & Bank Balances */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('kpi.bankBalance')}
            </span>
            <Wallet className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-3 font-mono">
            {formatCurrency(kpis.totalBankBalance, Currency.USD)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {i18n.language === 'km' ? 'គណនីធនាគារ ABA, កាណាឌីយ៉ា និងបេឡា' : 'ABA, Canadia & Vault Accounts'}
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <Building2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="font-sans">
            <div className="text-lg font-bold text-white font-mono">{kpis.totalProjects}</div>
            <div className="text-[11px] text-slate-400">{t('kpi.totalProjects')}</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <Home className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="font-sans">
            <div className="text-lg font-bold text-white font-mono">{kpis.availableProperties}</div>
            <div className="text-[11px] text-slate-400">{t('dashboard.availablePlotsUnits')}</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <CreditCard className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="font-sans">
            <div className="text-lg font-bold text-white font-mono">{kpis.installmentProperties}</div>
            <div className="text-[11px] text-slate-400">{t('dashboard.activeInstallments')}</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <Receipt className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="font-sans">
            <div className="text-lg font-bold text-white font-mono">{formatCurrency(kpis.totalExpenses, Currency.USD)}</div>
            <div className="text-[11px] text-slate-400">{t('kpi.expenses')}</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Area Chart: Monthly Trends */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                {t('dashboard.monthlyTrendsTitle')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('dashboard.monthlyTrendsSubtitle')}
              </p>
            </div>
            <Link
              to="/reports/performance"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              {t('dashboard.detailedBreakdown')}
            </Link>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => formatCurrency(val, Currency.USD)}
                />
                <Area
                  type="monotone"
                  dataKey="contractSales"
                  name={t('dashboard.contractSales')}
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="collections"
                  name={t('dashboard.collections')}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Property Inventory Distribution */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{t('dashboard.inventoryStatusTitle')}</h2>
            <p className="text-xs text-slate-400">{t('dashboard.inventoryStatusSubtitle')}</p>
          </div>
          <div className="h-64 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val) => <span className="text-xs text-slate-300 font-sans">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-800 text-center">
            <Link
              to="/properties"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center space-x-1"
            >
              <span>{t('dashboard.viewInventoryMatrix')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
