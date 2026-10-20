import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { formatCurrency, Currency, round2 } from '@rfm/shared';
import { Split, Plus, Trash2, CheckCircle, AlertTriangle, X, Check } from 'lucide-react';

export const JournalEntries: React.FC = () => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Journal Entry Modal
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<any[]>([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' },
  ]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eData, aData] = await Promise.all([
        api.get('/accounting/journal-entries'),
        api.get('/accounting/chart-of-accounts'),
      ]);
      setEntries(eData);
      setAccounts(aData);
      if (aData.length >= 2 && !lines[0].accountId) {
        setLines([
          { accountId: aData[0].id, debit: 1000, credit: 0, description: 'Debit leg' },
          { accountId: aData[1].id, debit: 0, credit: 1000, description: 'Credit leg' },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addLine = () => {
    setLines([...lines, { accountId: accounts[0]?.id || '', debit: 0, credit: 0, description: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  // Balancing logic
  const totalDebits = round2(lines.reduce((s, l) => s + Number(l.debit || 0), 0));
  const totalCredits = round2(lines.reduce((s, l) => s + Number(l.credit || 0), 0));
  const isBalanced = totalDebits === totalCredits && totalDebits > 0;
  const difference = round2(Math.abs(totalDebits - totalCredits));

  const handlePostEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    setActionLoading(true);
    try {
      await api.post('/accounting/journal-entries', {
        description,
        reference,
        lines,
      });
      setShowModal(false);
      setDescription('');
      setReference('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Journal entry posting failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <Split className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.journalEntries')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Double-entry General Ledger audit trail enforcing strict equality: Total Debits == Total Credits
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t('actions.postEntry')}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-emerald-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((je) => {
            const entryDr = je.lines?.reduce((s: any, l: any) => s + Number(l.debit), 0) || 0;
            const entryCr = je.lines?.reduce((s: any, l: any) => s + Number(l.credit), 0) || 0;
            return (
              <div key={je.id} className="glass-panel p-5 rounded-2xl border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {je.entryNumber}
                    </span>
                    <span className="text-xs font-semibold text-white">{je.description}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    {je.reference && (
                      <span className="font-mono text-slate-400">Ref: {je.reference}</span>
                    )}
                    <span className="text-slate-500">
                      {new Date(je.entryDate).toLocaleDateString('en-GB')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Balanced ($ {entryDr.toLocaleString()})</span>
                    </span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/60">
                        <th className="py-2 px-3">Account</th>
                        <th className="py-2 px-3">Memo / Description</th>
                        <th className="py-2 px-3 text-right">Debit ($)</th>
                        <th className="py-2 px-3 text-right">Credit ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-medium">
                      {je.lines?.map((line: any) => (
                        <tr key={line.id}>
                          <td className="py-2 px-3">
                            <span className="font-mono font-bold text-emerald-400 mr-2">
                              {line.account?.code}
                            </span>
                            <span className="text-slate-300">{line.account?.name}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-400">{line.description || '—'}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white">
                            {Number(line.debit) > 0 ? formatCurrency(line.debit, Currency.USD) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white">
                            {Number(line.credit) > 0 ? formatCurrency(line.credit, Currency.USD) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Balanced Journal Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handlePostEntry}
            className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Post Double-Entry Journal Voucher</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-300 font-medium mb-1">Entry Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Accrue monthly administrative expenses"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-300 font-medium mb-1">Source / Voucher Ref</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. VOUCHER-2026-99"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Journal Debits & Credits
                </span>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Leg</span>
                </button>
              </div>

              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center text-xs">
                    <select
                      value={line.accountId}
                      onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                      required
                      className="w-1/3 p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Memo"
                      value={line.description}
                      onChange={(e) => updateLine(idx, 'description', e.target.value)}
                      className="w-1/4 p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                    />

                    <input
                      type="number"
                      placeholder="Debit ($)"
                      value={line.debit}
                      onChange={(e) => updateLine(idx, 'debit', Number(e.target.value))}
                      className="w-1/6 p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold"
                    />

                    <input
                      type="number"
                      placeholder="Credit ($)"
                      value={line.credit}
                      onChange={(e) => updateLine(idx, 'credit', Number(e.target.value))}
                      className="w-1/6 p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold"
                    />

                    {lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Balancing Invariant Status Indicator */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="space-x-4">
                <span>
                  Total Debits:{' '}
                  <strong className="text-white font-mono">${totalDebits.toLocaleString()}</strong>
                </span>
                <span>
                  Total Credits:{' '}
                  <strong className="text-white font-mono">${totalCredits.toLocaleString()}</strong>
                </span>
              </div>

              <div>
                {isBalanced ? (
                  <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Balanced Entry ($ {totalDebits})</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1.5 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Out of Balance by ${difference}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isBalanced || actionLoading}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-40 transition"
              >
                {actionLoading ? 'Posting...' : 'Post Balanced Journal Entry'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
