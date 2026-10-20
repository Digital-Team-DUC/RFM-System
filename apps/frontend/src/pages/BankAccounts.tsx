import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { formatCurrency, Currency } from '@rfm/shared';
import { Wallet, ArrowLeftRight, Plus, Building, CheckCircle, X } from 'lucide-react';

export const BankAccounts: React.FC = () => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(10000);
  const [transferRef, setTransferRef] = useState('');

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/finance/accounts');
      setAccounts(data);
      if (data.length >= 2) {
        setFromAccountId(data[0].id);
        setToAccountId(data[1].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/accounts/transfer', {
        fromAccountId,
        toAccountId,
        amount: transferAmount,
        reference: transferRef,
      });
      setShowTransferModal(false);
      loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Transfer failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.bankAccounts')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Commercial bank balances, corporate escrow accounts, cash vaults, and internal fund transfers
          </p>
        </div>

        <button
          onClick={() => setShowTransferModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Internal Transfer</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-emerald-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div key={acc.id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {acc.accountType}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{acc.currency}</span>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{acc.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{acc.bankName}</p>
                <p className="text-xs font-mono text-slate-500 mt-1">Acct: {acc.accountNumber}</p>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Live Balance</span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {formatCurrency(acc.currentBalance, acc.currency === 'KHR' ? Currency.KHR : Currency.USD)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Internal Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleTransfer}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white mb-1">Execute Inter-Account Transfer</h3>
            <p className="text-xs text-slate-400 mb-4">
              Internal transfers move liquidity between company accounts and are not counted as revenue or expense.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Source Account (Debit)</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (${a.currentBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Destination Account (Credit)</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (${a.currentBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Transfer Amount ($)</label>
                <input
                  type="number"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Transfer Reference #</label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="e.g. TRF-2026-ABA-01"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Confirm Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
