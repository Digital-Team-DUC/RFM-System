import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { formatCurrency, Currency } from '@rfm/shared';
import { Award, CheckCircle, DollarSign, X, ArrowUpRight } from 'lucide-react';

export const Commissions: React.FC = () => {
  const { t } = useTranslation();
  const [calculations, setCalculations] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payout Modal
  const [showPayoutModal, setShowPayoutModal] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(1000);
  const [payoutMethod, setPayoutMethod] = useState<string>('BANK_TRANSFER');
  const [payoutRef, setPayoutRef] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, aData] = await Promise.all([
        api.get('/commissions/calculations'),
        api.get('/commissions/agents'),
      ]);
      setCalculations(cData);
      setAgents(aData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/commissions/calculations/${id}/approve`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayoutModal) return;
    try {
      await api.post(`/commissions/calculations/${showPayoutModal.id}/payout`, {
        amount: payoutAmount,
        paymentMethod: payoutMethod,
        reference: payoutRef,
      });
      setShowPayoutModal(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Payout failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <span>{t('nav.commissions')}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Sales agent commission policies, calculations, management approvals, and payout records
        </p>
      </div>

      {/* Agents Performance Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map((ag) => {
          const totalEarned = ag.commissions?.reduce((s: any, c: any) => s + Number(c.calculatedAmount), 0) || 0;
          const totalPaid = ag.commissions?.reduce((s: any, c: any) => s + Number(c.paidAmount), 0) || 0;
          return (
            <div key={ag.id} className="glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {ag.code}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">{ag.fullName}</h3>
                  <span className="text-[11px] text-slate-400">{ag.phone}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-medium">
                  {ag.team}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Earned</span>
                  <span className="font-bold text-white block">{formatCurrency(totalEarned, Currency.USD)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Disbursed</span>
                  <span className="font-bold text-emerald-400 block">{formatCurrency(totalPaid, Currency.USD)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commission Calculations Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-emerald-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Sales Agent</th>
                  <th className="py-3.5 px-4">Contract / Property</th>
                  <th className="py-3.5 px-4">Basis Amount</th>
                  <th className="py-3.5 px-4">Rate (%)</th>
                  <th className="py-3.5 px-4">Calculated</th>
                  <th className="py-3.5 px-4">Paid Out</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {calculations.map((c) => {
                  const remaining = Number(c.approvedAmount) - Number(c.paidAmount);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{c.agent?.fullName}</span>
                        <span className="font-mono text-[10px] text-slate-500">{c.agent?.code}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-200 block">{c.contract?.contractNumber}</span>
                        <span className="text-[10px] text-slate-500">{c.contract?.property?.title}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {formatCurrency(c.basisAmount, Currency.USD)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {c.ratePercent}%
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {formatCurrency(c.calculatedAmount, Currency.USD)}
                      </td>
                      <td className="py-3 px-4 text-emerald-400">
                        {formatCurrency(c.paidAmount, Currency.USD)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : c.status === 'PARTIALLY_PAID'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {c.status === 'ELIGIBLE' && (
                          <button
                            onClick={() => handleApprove(c.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold transition text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                        {['APPROVED', 'PARTIALLY_PAID'].includes(c.status) && remaining > 0 && (
                          <button
                            onClick={() => {
                              setShowPayoutModal(c);
                              setPayoutAmount(remaining);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition text-[11px]"
                          >
                            Disburse (${remaining})
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disburse Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayout}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white mb-2">Disburse Agent Commission Payout</h3>
            <p className="text-xs text-slate-400 mb-4">
              Agent: <span className="font-semibold text-white">{showPayoutModal.agent?.fullName}</span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Payout Amount ($)</label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  <option value="BANK_TRANSFER">ABA Bank Transfer</option>
                  <option value="CASH">Cash Voucher</option>
                  <option value="CHEQUE">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Disbursement Reference</label>
                <input
                  type="text"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="e.g. ABA-PAYOUT-789012"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPayoutModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Confirm Payout
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
