import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { formatCurrency, Currency } from '@rfm/shared';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Wallet,
  Receipt,
  Home,
  Building,
  Calendar,
  Filter,
  Printer,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Layers,
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

export const BusinessPerformanceReport: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Filters state
  const [period, setPeriod] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Active tab in report details
  const [activeTab, setActiveTab] = useState<'daily' | 'soldPlots' | 'expenses' | 'projects'>('daily');

  // Data & loading
  const [data, setData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch performance data
  const loadPerformanceData = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (period === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }
      if (selectedProjectId) params.append('projectId', selectedProjectId);

      const [perfRes, projRes] = await Promise.all([
        api.get(`/dashboard/performance?${params.toString()}`),
        api.get('/projects').catch(() => []),
      ]);

      setData(perfRes);
      if (Array.isArray(projRes)) setProjects(projRes);
    } catch (err) {
      console.error('Failed to load business performance report:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, startDate, endDate, selectedProjectId]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  // Handle Preset selection
  const handleSelectPreset = (newPeriod: string) => {
    setPeriod(newPeriod);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (newPeriod === 'today') {
      const todayStr = toYmd(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (newPeriod === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = toYmd(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (newPeriod === 'this_week') {
      const s = new Date(now);
      const day = s.getDay();
      const diff = s.getDate() - day + (day === 0 ? -6 : 1);
      s.setDate(diff);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      setStartDate(toYmd(s));
      setEndDate(toYmd(e));
    } else if (newPeriod === 'this_month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(toYmd(s));
      setEndDate(toYmd(e));
    } else if (newPeriod === 'last_month') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(toYmd(s));
      setEndDate(toYmd(e));
    } else if (newPeriod === 'this_year') {
      const s = new Date(now.getFullYear(), 0, 1);
      const e = new Date(now.getFullYear(), 11, 31);
      setStartDate(toYmd(s));
      setEndDate(toYmd(e));
    }
  };

  // CSV Export handler
  const handleExportCsv = () => {
    if (!data?.selectedRange) return;
    const { soldPlotsList = [], expensesList = [], label } = data.selectedRange;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `EXECUTIVE PERFORMANCE REPORT: ${label}\r\n\r\n`;

    // Summary section
    csvContent += `SUMMARY METRICS\r\n`;
    csvContent += `Plots Sold,${data.selectedRange.plotsSold}\r\n`;
    csvContent += `Sales Revenue (USD),${data.selectedRange.salesRevenue}\r\n`;
    csvContent += `Cash Collected (USD),${data.selectedRange.cashCollected}\r\n`;
    csvContent += `Expenses (USD),${data.selectedRange.expenses}\r\n`;
    csvContent += `Net Profit (USD),${data.selectedRange.netProfit}\r\n`;
    csvContent += `Profit Margin (%),${data.selectedRange.profitMargin}%\r\n\r\n`;

    // Sold plots section
    csvContent += `SOLD PLOTS REGISTER\r\n`;
    csvContent += `Contract #,Date,Plot Code,Plot Name,Project,Customer,Selling Price (USD),Deposit Paid (USD),Balance (USD),Status\r\n`;
    soldPlotsList.forEach((c: any) => {
      csvContent += `"${c.contractNumber}","${new Date(c.soldDate).toLocaleDateString()}","${c.property?.code || ''}","${c.property?.title || ''}","${c.project?.name || ''}","${c.customer?.fullName || ''}",${c.sellingPrice},${c.depositPaid},${c.balanceRemaining},"${c.status}"\r\n`;
    });
    csvContent += `\r\n`;

    // Expenses section
    csvContent += `EXPENSES REGISTER\r\n`;
    csvContent += `Expense #,Date,Category,Vendor,Description,Project,Amount (USD),Status\r\n`;
    expensesList.forEach((e: any) => {
      csvContent += `"${e.expenseNumber}","${new Date(e.expenseDate).toLocaleDateString()}","${e.category}","${e.vendorName}","${e.description}","${e.project?.name || ''}",${e.amount},"${e.status}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RFM_Executive_Report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96 text-emerald-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Computing financial horizon metrics & plots analysis...</span>
        </div>
      </div>
    );
  }

  const benchmarks = data?.benchmarks || {};
  const inventory = data?.inventory || {};
  const selectedRange = data?.selectedRange || {};
  const dailyBreakdown = selectedRange.dailyBreakdown || [];
  const soldPlotsList = selectedRange.soldPlotsList || [];
  const expensesList = selectedRange.expensesList || [];
  const projectBreakdown = selectedRange.projectBreakdown || [];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl print:border-none print:bg-none print:p-0">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {t('performance.title')}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('performance.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={loadPerformanceData}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition flex items-center space-x-1.5 shadow"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('performance.exportCsv')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t('performance.printReport')}</span>
          </button>
        </div>
      </div>

      {/* 4-Horizon Comparative Matrix (Today vs Month vs Year vs Inventory) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('performance.benchmarksTitle')}</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Real-time Financial Reconciled Totals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. TODAY (ថ្ងៃនេះ) */}
          <div
            onClick={() => handleSelectPreset('today')}
            className={`p-5 rounded-3xl border transition cursor-pointer relative overflow-hidden group ${
              period === 'today'
                ? 'bg-slate-900/90 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('performance.today')}
              </span>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 inline-flex items-center gap-1.5 shadow-sm leading-normal">
                <span className="font-mono font-bold text-xs">{benchmarks.today?.plotsSold || 0}</span>
                <span>{i18n.language === 'km' ? ' ឡូត៍ លក់បាន' : ' Plots Sold'}</span>
              </span>
            </div>

            <div className="space-y-1.5 mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-sans">{t('performance.salesRevenue')}:</span>
                <span className="text-base font-black text-white font-mono">
                  {formatCurrency(benchmarks.today?.salesRevenue || 0, Currency.USD)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400 font-sans">{t('performance.totalExpenses')}:</span>
                <span className="font-bold text-rose-400 font-mono">
                  - {formatCurrency(benchmarks.today?.expenses || 0, Currency.USD)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-300 font-sans">{t('performance.netProfit')}:</span>
                <span className={`text-base font-black font-mono ${
                  (benchmarks.today?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(benchmarks.today?.netProfit || 0, Currency.USD)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. THIS MONTH (ខែនេះ) */}
          <div
            onClick={() => handleSelectPreset('this_month')}
            className={`p-5 rounded-3xl border transition cursor-pointer relative overflow-hidden group ${
              period === 'this_month'
                ? 'bg-slate-900/90 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 font-sans">
                <Calendar className="w-3.5 h-3.5" />
                {t('performance.thisMonth')}
              </span>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 inline-flex items-center gap-1.5 shadow-sm leading-normal">
                <span className="font-mono font-bold text-xs">{benchmarks.thisMonth?.plotsSold || 0}</span>
                <span>{i18n.language === 'km' ? ' ឡូត៍ លក់បាន' : ' Plots Sold'}</span>
              </span>
            </div>

            <div className="space-y-1.5 mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-sans">{t('performance.salesRevenue')}:</span>
                <span className="text-base font-black text-white font-mono">
                  {formatCurrency(benchmarks.thisMonth?.salesRevenue || 0, Currency.USD)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400 font-sans">{t('performance.totalExpenses')}:</span>
                <span className="font-bold text-rose-400 font-mono">
                  - {formatCurrency(benchmarks.thisMonth?.expenses || 0, Currency.USD)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-300 font-sans">{t('performance.netProfit')}:</span>
                <span className={`text-base font-black font-mono ${
                  (benchmarks.thisMonth?.netProfit || 0) >= 0 ? 'text-blue-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(benchmarks.thisMonth?.netProfit || 0, Currency.USD)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. THIS YEAR (ឆ្នាំនេះ) */}
          <div
            onClick={() => handleSelectPreset('this_year')}
            className={`p-5 rounded-3xl border transition cursor-pointer relative overflow-hidden group ${
              period === 'this_year'
                ? 'bg-slate-900/90 border-purple-500 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 font-sans">
                <Clock className="w-3.5 h-3.5" />
                {t('performance.thisYear')}
              </span>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 inline-flex items-center gap-1.5 shadow-sm leading-normal">
                <span className="font-mono font-bold text-xs">{benchmarks.thisYear?.plotsSold || 0}</span>
                <span>{i18n.language === 'km' ? ' ឡូត៍ លក់បាន' : ' Plots Sold'}</span>
              </span>
            </div>

            <div className="space-y-1.5 mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-sans">{t('performance.salesRevenue')}:</span>
                <span className="text-base font-black text-white font-mono">
                  {formatCurrency(benchmarks.thisYear?.salesRevenue || 0, Currency.USD)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400 font-sans">{t('performance.totalExpenses')}:</span>
                <span className="font-bold text-rose-400 font-mono">
                  - {formatCurrency(benchmarks.thisYear?.expenses || 0, Currency.USD)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-300 font-sans">{t('performance.netProfit')}:</span>
                <span className={`text-base font-black font-mono ${
                  (benchmarks.thisYear?.netProfit || 0) >= 0 ? 'text-purple-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(benchmarks.thisYear?.netProfit || 0, Currency.USD)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. REMAINING INVENTORY (សល់ប៉ុន្មាន) */}
          <div className="p-5 rounded-3xl border bg-slate-900/60 border-slate-800 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-sans">
                <Home className="w-3.5 h-3.5" />
                {t('performance.inventoryStatus')}
              </span>
              <span className="text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 inline-flex items-center gap-1.5 shadow-sm">
                <span className="font-mono font-bold text-xs">{inventory.availablePlots || 0} / {inventory.totalPlots || 0}</span>
                <span>{i18n.language === 'km' ? 'ឡូត៍នៅសល់' : 'Available'}</span>
              </span>
            </div>

            <div className="space-y-1.5 mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-sans">{t('performance.availableValue')}:</span>
                <span className="text-base font-black text-amber-300 font-mono">
                  {formatCurrency(inventory.availableValue || 0, Currency.USD)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400 font-sans">{t('performance.occupancy')}:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {inventory.occupancyRate || 0}% Sold
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between text-xs">
                <span className="text-slate-500 font-sans">Reserved / Installment:</span>
                <span className="font-mono text-slate-300">
                  {inventory.reservedPlots || 0} Res • {inventory.installmentPlots || 0} Inst
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Range & Project Filter Toolbar */}
      <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('performance.quickPeriods')}:</span>
            </span>

            {[
              { id: 'today', label: t('performance.today') },
              { id: 'yesterday', label: t('performance.yesterday') },
              { id: 'this_week', label: t('performance.thisWeek') },
              { id: 'this_month', label: t('performance.thisMonth') },
              { id: 'last_month', label: t('performance.lastMonth') },
              { id: 'this_year', label: t('performance.thisYear') },
              { id: 'custom', label: t('performance.customRange') },
            ].map((pItem) => (
              <button
                key={pItem.id}
                onClick={() => handleSelectPreset(pItem.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  period === pItem.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {pItem.label}
              </button>
            ))}
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">{t('performance.allProjects')}</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range Inputs (Shown with dark theme and matching alignments) */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className={`p-4 rounded-2xl transition-all duration-200 ${
            period === 'custom'
              ? 'bg-slate-950/80 border border-emerald-500/40 shadow-lg shadow-emerald-500/5'
              : 'bg-slate-950/50 border border-slate-800/80'
          }`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3.5">
              <div className="flex-1 w-full overflow-visible">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2 select-none leading-normal pt-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{t('performance.startDate')}</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPeriod('custom');
                  }}
                  style={{ colorScheme: 'dark', backgroundColor: '#0f172a', color: '#f8fafc' }}
                  className="w-full h-11 bg-slate-900 border border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 text-slate-100 font-mono text-xs focus:outline-none transition cursor-pointer shadow-inner"
                />
              </div>

              <div className="flex-1 w-full overflow-visible">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2 select-none leading-normal pt-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{t('performance.endDate')}</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPeriod('custom');
                  }}
                  style={{ colorScheme: 'dark', backgroundColor: '#0f172a', color: '#f8fafc' }}
                  className="w-full h-11 bg-slate-900 border border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 text-slate-100 font-mono text-xs focus:outline-none transition cursor-pointer shadow-inner"
                />
              </div>

              <button
                onClick={() => {
                  setPeriod('custom');
                  loadPerformanceData();
                }}
                className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 shrink-0 mt-2 sm:mt-0"
              >
                <Filter className="w-4 h-4" />
                <span>{t('performance.applyFilter')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Range Hero Highlights */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              {t('performance.activeRange')}
            </span>
            <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
              <span>{selectedRange.label}</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({selectedRange.startDate} → {selectedRange.endDate})
              </span>
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">{t('performance.profitMarginLabel')}</span>
            <span className={`text-sm font-black font-mono px-2.5 py-1 rounded-xl border ${
              (selectedRange.profitMargin || 0) >= 20
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {selectedRange.profitMargin || 0}%
            </span>
          </div>
        </div>

        {/* 4 Main Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Plots Sold */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-sans">
              <span>{t('performance.plotsSold')}</span>
              <Home className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-sans flex items-baseline gap-1.5">
              <span className="font-mono">{selectedRange.plotsSold || 0}</span>
              <span className="text-sm font-normal text-slate-400">{t('performance.units')}</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 font-sans flex items-center gap-1">
              <span>{t('performance.salesValue')}</span>
              <span className="font-mono font-bold">{formatCurrency(selectedRange.salesRevenue || 0, Currency.USD)}</span>
            </div>
          </div>

          {/* Cash Collections */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-sans">
              <span>{t('performance.cashCollected')}</span>
              <DollarSign className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-teal-300 font-mono">
              {formatCurrency(selectedRange.cashCollected || 0, Currency.USD)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-sans flex items-center gap-1">
              <span>{t('performance.approx')}</span>
              <span className="font-mono">{formatCurrency((selectedRange.cashCollected || 0) * 4100, Currency.KHR)}</span>
            </div>
          </div>

          {/* Expenses */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-sans">
              <span>{t('performance.totalExpenses')}</span>
              <Receipt className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-300 font-mono">
              {formatCurrency(selectedRange.expenses || 0, Currency.USD)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-sans flex items-center gap-1">
              <span className="font-mono">{expensesList.length}</span>
              <span>{t('performance.approvedVouchers')}</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-sans">
              <span>{t('performance.netProfit')}</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className={`text-2xl font-black font-mono ${
              (selectedRange.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatCurrency(selectedRange.netProfit || 0, Currency.USD)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-sans">
              <span>{t('performance.cashFlow')}</span>
              <span className={`font-mono font-semibold ${
                (selectedRange.netCashFlow || 0) >= 0 ? 'text-teal-400' : 'text-rose-400'
              }`}>
                {formatCurrency(selectedRange.netCashFlow || 0, Currency.USD)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      {dailyBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          {/* Timeline Chart */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl font-sans">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{t('performance.timelineTitle')}</h3>
                <p className="text-[11px] text-slate-400">{t('performance.timelineSubtitle')}</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} />
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
                    dataKey="salesRevenue"
                    name={t('dashboard.contractSales')}
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#salesArea)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cashCollected"
                    name={t('dashboard.collections')}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name={t('dashboard.expenses')}
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Categories Donut */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between font-sans">
            <div>
              <h3 className="text-sm font-bold text-white">{t('performance.expenseDistTitle')}</h3>
              <p className="text-[11px] text-slate-400">{t('performance.expenseDistSubtitle')}</p>
            </div>

            <div className="h-60 w-full my-auto">
              {selectedRange.expenseCategoryBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={selectedRange.expenseCategoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {selectedRange.expenseCategoryBreakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => formatCurrency(val, Currency.USD)}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => <span className="text-xs text-slate-300 font-sans">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                  {t('performance.noExpenses')}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400 font-sans flex items-center justify-center gap-1.5">
              <span>{t('performance.totalCategoryOutflow')}:</span>
              <span className="font-mono font-bold text-white">{formatCurrency(selectedRange.expenses || 0, Currency.USD)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabbed Detailed Registers & Tables */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden font-sans">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 gap-2 text-xs overflow-x-auto print:hidden">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'daily'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('performance.dailyBreakdown')} ({dailyBreakdown.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('soldPlots')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'soldPlots'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t('performance.soldPlotsList')} ({soldPlotsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'expenses'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{t('performance.expenseRegister')} ({expensesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'projects'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{t('performance.projectSummary')} ({projectBreakdown.length})</span>
          </button>
        </div>

        {/* Tab 1: Daily Breakdown Table */}
        {activeTab === 'daily' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">{t('performance.date')}</th>
                  <th className="px-5 py-3.5 text-center">{t('performance.plotsSold')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.salesRevenue')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.cashCollected')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.totalExpenses')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.netProfit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {dailyBreakdown.length > 0 ? (
                  dailyBreakdown.map((row: any) => (
                    <tr key={row.date} className="hover:bg-slate-900/40 transition">
                      <td className="px-5 py-3 font-semibold text-white">
                        {row.date} ({row.displayDate})
                      </td>
                      <td className="px-5 py-3 text-center">
                        {row.plotsSold > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                            {row.plotsSold}
                          </span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-emerald-400 font-semibold">
                        {row.salesRevenue > 0 ? formatCurrency(row.salesRevenue, Currency.USD) : '-'}
                      </td>
                      <td className="px-5 py-3 text-right text-teal-300">
                        {row.cashCollected > 0 ? formatCurrency(row.cashCollected, Currency.USD) : '-'}
                      </td>
                      <td className="px-5 py-3 text-right text-rose-400">
                        {row.expenses > 0 ? `- ${formatCurrency(row.expenses, Currency.USD)}` : '-'}
                      </td>
                      <td className={`px-5 py-3 text-right font-bold ${
                        row.netProfit > 0 ? 'text-emerald-400' : row.netProfit < 0 ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                        {formatCurrency(row.netProfit, Currency.USD)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500 italic font-sans">
                      {t('performance.noRecords')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Sold Plots Register */}
        {activeTab === 'soldPlots' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">{t('performance.contractNumber')}</th>
                  <th className="px-5 py-3.5">{t('performance.property')}</th>
                  <th className="px-5 py-3.5">{t('performance.project')}</th>
                  <th className="px-5 py-3.5">{t('performance.customer')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.sellingPrice')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.depositPaid')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.balance')}</th>
                  <th className="px-5 py-3.5">{t('performance.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {soldPlotsList.length > 0 ? (
                  soldPlotsList.map((c: any) => (
                    <tr key={c.contractId} className="hover:bg-slate-900/40 transition">
                      <td className="px-5 py-3 font-mono font-bold text-emerald-400">
                        {c.contractNumber}
                      </td>
                      <td className="px-5 py-3 font-semibold text-white">
                        {c.property?.code} • {c.property?.title}
                      </td>
                      <td className="px-5 py-3 text-slate-400">{c.project?.name}</td>
                      <td className="px-5 py-3 text-white">
                        {c.customer?.fullName} {c.customer?.khmerName ? `(${c.customer.khmerName})` : ''}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(c.sellingPrice, Currency.USD)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-teal-300">
                        {formatCurrency(c.depositPaid, Currency.USD)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-400">
                        {formatCurrency(c.balanceRemaining, Currency.USD)}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-400">
                        {new Date(c.soldDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-500 italic">
                      {t('performance.noSoldPlots')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Expense Register */}
        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Expense #</th>
                  <th className="px-5 py-3.5">{t('performance.category')}</th>
                  <th className="px-5 py-3.5">{t('performance.vendor')}</th>
                  <th className="px-5 py-3.5">{t('performance.description')}</th>
                  <th className="px-5 py-3.5">{t('performance.project')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.amount')}</th>
                  <th className="px-5 py-3.5">{t('performance.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {expensesList.length > 0 ? (
                  expensesList.map((e: any) => (
                    <tr key={e.expenseId} className="hover:bg-slate-900/40 transition">
                      <td className="px-5 py-3 font-mono font-bold text-rose-400">
                        {e.expenseNumber}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700 font-sans">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-white font-medium">{e.vendorName}</td>
                      <td className="px-5 py-3 text-slate-400 max-w-xs truncate">{e.description}</td>
                      <td className="px-5 py-3 text-slate-400">{e.project?.name}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-rose-400">
                        - {formatCurrency(e.amount, Currency.USD)}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-400">
                        {new Date(e.expenseDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500 italic">
                      {t('performance.noExpenses')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Project Comparison */}
        {activeTab === 'projects' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">{t('performance.project')}</th>
                  <th className="px-5 py-3.5 text-center">{t('performance.totalPlots')}</th>
                  <th className="px-5 py-3.5 text-center">{t('performance.availablePlots')}</th>
                  <th className="px-5 py-3.5 text-center">{t('performance.plotsSoldInRange')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.salesInRange')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.expensesInRange')}</th>
                  <th className="px-5 py-3.5 text-right">{t('performance.netProfitInRange')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {projectBreakdown.length > 0 ? (
                  projectBreakdown.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-5 py-3 font-sans font-bold text-white">
                        {p.name} <span className="text-slate-500 font-mono text-[10px]">({p.code})</span>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-300 font-mono">{p.totalPlots}</td>
                      <td className="px-5 py-3 text-center text-amber-400 font-bold font-mono">{p.availablePlots}</td>
                      <td className="px-5 py-3 text-center text-emerald-400 font-bold font-mono">{p.plotsSold}</td>
                      <td className="px-5 py-3 text-right text-emerald-400 font-mono">
                        {formatCurrency(p.salesRevenue, Currency.USD)}
                      </td>
                      <td className="px-5 py-3 text-right text-rose-400 font-mono">
                        - {formatCurrency(p.expenses, Currency.USD)}
                      </td>
                      <td className={`px-5 py-3 text-right font-bold font-mono ${
                        p.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {formatCurrency(p.netProfit, Currency.USD)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500 italic">
                      {t('performance.noProjects')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

