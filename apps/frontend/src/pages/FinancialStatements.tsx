import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { formatCurrency, Currency } from '@rfm/shared';
import {
  BarChart3,
  TrendingUp,
  Scale,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';

export const FinancialStatements: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'pnl' | 'balanceSheet' | 'trialBalance' | 'arAging'>('pnl');

  const [pnl, setPnl] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [arAging, setArAging] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatements() {
      setLoading(true);
      try {
        const [pData, bsData, tbData, arData] = await Promise.all([
          api.get('/accounting/profit-and-loss'),
          api.get('/accounting/balance-sheet'),
          api.get('/accounting/trial-balance'),
          api.get('/accounting/ar-aging'),
        ]);
        setPnl(pData);
        setBalanceSheet(bsData);
        setTrialBalance(tbData);
        setArAging(arData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStatements();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>{t('statements.title', t('nav.financialStatements'))}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('statements.subtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'pnl'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{t('statements.tabs.pnl')}</span>
        </button>

        <button
          onClick={() => setActiveTab('balanceSheet')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'balanceSheet'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{t('statements.tabs.balanceSheet')}</span>
        </button>

        <button
          onClick={() => setActiveTab('trialBalance')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'trialBalance'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{t('statements.tabs.trialBalance')}</span>
        </button>

        <button
          onClick={() => setActiveTab('arAging')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'arAging'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{t('statements.tabs.arAging')}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-emerald-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'pnl' ? (
        /* 1. PROFIT & LOSS STATEMENT */
        <div className="glass-panel rounded-2xl p-6 max-w-4xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white">{t('statements.pnl.title')}</h2>
            <p className="text-xs text-slate-400">{t('statements.pnl.subtitle')}</p>
          </div>

          {/* Revenues */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              {t('statements.pnl.operatingRevenues')}
            </h3>
            <div className="divide-y divide-slate-800/60 text-xs">
              {pnl?.revenues?.map((r: any) => (
                <div key={r.code} className="py-2.5 flex justify-between">
                  <span className="text-slate-300">
                    <span className="font-mono text-slate-500 mr-2">{r.code}</span>
                    {r.name}
                  </span>
                  <span className="font-bold text-white">{formatCurrency(r.amount, Currency.USD)}</span>
                </div>
              ))}
              <div className="py-3 flex justify-between font-black text-emerald-400 border-t border-slate-700">
                <span>{t('statements.pnl.totalRevenues')}</span>
                <span>{formatCurrency(pnl?.totalRevenue, Currency.USD)}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
              {t('statements.pnl.operatingExpenses')}
            </h3>
            <div className="divide-y divide-slate-800/60 text-xs">
              {pnl?.expenses?.map((e: any) => (
                <div key={e.code} className="py-2.5 flex justify-between">
                  <span className="text-slate-300">
                    <span className="font-mono text-slate-500 mr-2">{e.code}</span>
                    {e.name}
                  </span>
                  <span className="font-bold text-white">{formatCurrency(e.amount, Currency.USD)}</span>
                </div>
              ))}
              <div className="py-3 flex justify-between font-black text-rose-400 border-t border-slate-700">
                <span>{t('statements.pnl.totalExpenses')}</span>
                <span>{formatCurrency(pnl?.totalExpense, Currency.USD)}</span>
              </div>
            </div>
          </div>

          {/* Net Operating Income */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex justify-between items-center text-sm font-black">
            <span className="text-white">{t('statements.pnl.netIncome')}</span>
            <span
              className={`text-lg font-mono ${
                pnl?.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(pnl?.netIncome, Currency.USD)}
            </span>
          </div>
        </div>
      ) : activeTab === 'balanceSheet' ? (
        /* 2. BALANCE SHEET */
        <div className="glass-panel rounded-2xl p-6 max-w-4xl space-y-6">
          <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">{t('statements.balanceSheet.title')}</h2>
              <p className="text-xs text-slate-400">{t('statements.balanceSheet.subtitle')}</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{t('statements.balanceSheet.balanced')}</span>
            </div>
          </div>

          {/* Assets */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">{t('statements.balanceSheet.assets')}</h3>
            <div className="divide-y divide-slate-800/60 text-xs">
              {balanceSheet?.assets?.map((a: any) => (
                <div key={a.code} className="py-2.5 flex justify-between">
                  <span className="text-slate-300">
                    <span className="font-mono text-slate-500 mr-2">{a.code}</span>
                    {a.name}
                  </span>
                  <span className="font-bold text-white">{formatCurrency(a.amount, Currency.USD)}</span>
                </div>
              ))}
              <div className="py-3 flex justify-between font-black text-emerald-400 border-t border-slate-700">
                <span>{t('statements.balanceSheet.totalAssets')}</span>
                <span>{formatCurrency(balanceSheet?.totalAssets, Currency.USD)}</span>
              </div>
            </div>
          </div>

          {/* Liabilities */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">{t('statements.balanceSheet.liabilities')}</h3>
            <div className="divide-y divide-slate-800/60 text-xs">
              {balanceSheet?.liabilities?.map((l: any) => (
                <div key={l.code} className="py-2.5 flex justify-between">
                  <span className="text-slate-300">
                    <span className="font-mono text-slate-500 mr-2">{l.code}</span>
                    {l.name}
                  </span>
                  <span className="font-bold text-white">{formatCurrency(l.amount, Currency.USD)}</span>
                </div>
              ))}
              <div className="py-3 flex justify-between font-black text-amber-400 border-t border-slate-700">
                <span>{t('statements.balanceSheet.totalLiabilities')}</span>
                <span>{formatCurrency(balanceSheet?.totalLiabilities, Currency.USD)}</span>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">{t('statements.balanceSheet.equity')}</h3>
            <div className="divide-y divide-slate-800/60 text-xs">
              {balanceSheet?.equity?.map((e: any) => (
                <div key={e.code} className="py-2.5 flex justify-between">
                  <span className="text-slate-300">
                    <span className="font-mono text-slate-500 mr-2">{e.code}</span>
                    {e.name}
                  </span>
                  <span className="font-bold text-white">{formatCurrency(e.amount, Currency.USD)}</span>
                </div>
              ))}
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-300">{t('statements.balanceSheet.retainedEarningsCurrent')}</span>
                <span className="font-bold text-white">
                  {formatCurrency(balanceSheet?.retainedEarningsCurrent, Currency.USD)}
                </span>
              </div>
              <div className="py-3 flex justify-between font-black text-blue-400 border-t border-slate-700">
                <span>{t('statements.balanceSheet.totalEquity')}</span>
                <span>{formatCurrency(balanceSheet?.totalEquity, Currency.USD)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'trialBalance' ? (
        /* 3. TRIAL BALANCE */
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">{t('statements.trialBalance.title')}</h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {t('statements.trialBalance.debits')}: ${trialBalance?.totalDebits?.toLocaleString()} == {t('statements.trialBalance.credits')}: ${trialBalance?.totalCredits?.toLocaleString()}
            </span>
          </div>

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">{t('statements.trialBalance.code')}</th>
                <th className="py-3 px-4">{t('statements.trialBalance.accountName')}</th>
                <th className="py-3 px-4">{t('statements.trialBalance.category')}</th>
                <th className="py-3 px-4 text-right">{t('statements.trialBalance.debitCol')}</th>
                <th className="py-3 px-4 text-right">{t('statements.trialBalance.creditCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {trialBalance?.rows?.map((row: any) => (
                <tr key={row.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">{row.code}</td>
                  <td className="py-2.5 px-4 text-white">{row.name}</td>
                  <td className="py-2.5 px-4 text-slate-400">{row.accountType}</td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {row.debit > 0 ? formatCurrency(row.debit, Currency.USD) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {row.credit > 0 ? formatCurrency(row.credit, Currency.USD) : '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900/90 font-black text-white text-xs border-t-2 border-slate-700">
                <td colSpan={3} className="py-3 px-4 uppercase">
                  {t('statements.trialBalance.grandTotal')}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400">
                  {formatCurrency(trialBalance?.totalDebits, Currency.USD)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400">
                  {formatCurrency(trialBalance?.totalCredits, Currency.USD)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        /* 4. ACCOUNTS RECEIVABLE AGING */
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="glass-card p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">{t('statements.arAging.currentBucket')}</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block">
                {formatCurrency(arAging?.summary?.currentBucket, Currency.USD)}
              </span>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">{t('statements.arAging.days31_60')}</span>
              <span className="text-lg font-bold text-blue-400 mt-1 block">
                {formatCurrency(arAging?.summary?.days31_60, Currency.USD)}
              </span>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">{t('statements.arAging.days61_90')}</span>
              <span className="text-lg font-bold text-amber-400 mt-1 block">
                {formatCurrency(arAging?.summary?.days61_90, Currency.USD)}
              </span>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">{t('statements.arAging.over90')}</span>
              <span className="text-lg font-bold text-rose-400 mt-1 block">
                {formatCurrency(arAging?.summary?.over90, Currency.USD)}
              </span>
            </div>
            <div className="glass-card p-4 rounded-xl bg-slate-900 border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">{t('statements.arAging.totalAr')}</span>
              <span className="text-lg font-black text-white mt-1 block">
                {formatCurrency(arAging?.summary?.totalAr, Currency.USD)}
              </span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">{t('statements.arAging.contractNo')}</th>
                  <th className="py-3 px-4">{t('statements.arAging.customer')}</th>
                  <th className="py-3 px-4">{t('statements.arAging.property')}</th>
                  <th className="py-3 px-4">{t('statements.arAging.dueDate')}</th>
                  <th className="py-3 px-4 text-right">{t('statements.arAging.outstanding')}</th>
                  <th className="py-3 px-4 text-center">{t('statements.arAging.agingBucket')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {arAging?.details?.map((item: any) => (
                  <tr key={item.installmentId} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                      {item.contractNumber}
                    </td>
                    <td className="py-2.5 px-4 text-white">{item.customerName}</td>
                    <td className="py-2.5 px-4 text-slate-400">{item.propertyCode}</td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {new Date(item.dueDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-white">
                      {formatCurrency(item.outstandingAmount, Currency.USD)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {item.bucket} ({item.daysOverdue}d)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
