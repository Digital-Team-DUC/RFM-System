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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get('/dashboard/summary');
        setData(res);
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

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {i18n.language === 'km' ? 'ផ្ទាំងព័ត៌មានប្រតិបត្តិការអចលនទ្រព្យ' : 'Executive Portfolio Dashboard'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {i18n.language === 'km'
              ? 'ទិដ្ឋភាពទូទៅនៃគម្រោង ការលក់ ការប្រមូលសាច់ប្រាក់ និងបញ្ជីអចលនទ្រព្យ'
              : 'Real-time overview of projects, contractual sales volume, collections, and financial health.'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to="/master-plan"
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{t('nav.masterPlan')}</span>
          </Link>
          <Link
            to="/sales/bookings"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            + {t('actions.reserveUnit')}
          </Link>
          <Link
            to="/payments"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            {t('actions.recordPayment')}
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
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">
            {formatCurrency(kpis.totalContractSales, Currency.USD)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center font-medium">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Reconciled Contract Value</span>
          </div>
        </div>

        {/* Cash Collected */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('kpi.cashCollected')}
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-300 mt-3">
            {formatCurrency(kpis.totalCashCollected, Currency.USD)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Deposits & Verified Installments
          </div>
        </div>

        {/* Receivables Outstanding */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('kpi.outstandingAr')}
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-300 mt-3">
            {formatCurrency(kpis.totalOutstandingAr, Currency.USD)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Remaining Contract Receivables</span>
            {kpis.overdueCount > 0 && (
              <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
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
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 mt-3">
            {formatCurrency(kpis.totalBankBalance, Currency.USD)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ABA, Canadia & Vault Accounts
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{kpis.totalProjects}</div>
            <div className="text-[11px] text-slate-400">{t('kpi.totalProjects')}</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{kpis.availableProperties}</div>
            <div className="text-[11px] text-slate-400">Available Plots/Units</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{kpis.installmentProperties}</div>
            <div className="text-[11px] text-slate-400">Active Installments</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{formatCurrency(kpis.totalExpenses, Currency.USD)}</div>
            <div className="text-[11px] text-slate-400">{t('kpi.expenses')}</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Monthly Trends */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Monthly Contract Sales vs Collections vs Expenses
              </h2>
              <p className="text-xs text-slate-400">
                Comparative monetary flow across recent periods
              </p>
            </div>
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
                  name="Contract Sales"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="collections"
                  name="Collections"
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
            <h2 className="text-base font-bold text-white">Property Inventory Status</h2>
            <p className="text-xs text-slate-400">Total units by live database status</p>
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
                  formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-800 text-center">
            <Link
              to="/properties"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center space-x-1"
            >
              <span>View Property Inventory Matrix</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
