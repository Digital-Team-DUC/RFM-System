import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { formatCurrency, Currency } from '@rfm/shared';
import {
  FileText,
  CreditCard,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  X,
  Plus,
  ShieldCheck,
} from 'lucide-react';

export const Contracts: React.FC = () => {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Contract & Schedule
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Modals
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showWaiveModal, setShowWaiveModal] = useState<any>(null);
  const [waiveReason, setWaiveReason] = useState('');

  // Payment Form
  const [payAmount, setPayAmount] = useState<number>(6250);
  const [payMethod, setPayMethod] = useState<string>('BANK_TRANSFER');
  const [payRef, setPayRef] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Plan Form
  const [planCount, setPlanCount] = useState<number>(24);
  const [firstDueDate, setFirstDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );

  const loadContracts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/contracts');
      setContracts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const loadInstallments = async (contractId: string) => {
    setScheduleLoading(true);
    try {
      const data = await api.get(`/payments/contract/${contractId}/installments`);
      setInstallments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSelectContract = (ctr: any) => {
    setSelectedContract(ctr);
    loadInstallments(ctr.id);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    setActionLoading(true);
    try {
      await api.post('/payments', {
        contractId: selectedContract.id,
        amount: payAmount,
        paymentMethod: payMethod,
        transactionRef: payRef || `TXN-${Date.now()}`,
      });
      setShowPayModal(false);
      setPayRef('');
      loadContracts();
      loadInstallments(selectedContract.id);
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    setActionLoading(true);
    try {
      await api.post(`/payments/plans/${selectedContract.id}`, {
        planType: 'EQUAL_MONTHLY',
        installmentCount: planCount,
        firstDueDate,
      });
      setShowPlanModal(false);
      loadContracts();
      loadInstallments(selectedContract.id);
    } catch (err: any) {
      alert(err.message || 'Plan generation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWaivePenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showWaiveModal) return;
    setActionLoading(true);
    try {
      await api.post(`/payments/installments/${showWaiveModal.id}/waive-penalty`, {
        amount: Number(showWaiveModal.calculatedPenalty || showWaiveModal.latePenalty),
        reason: waiveReason || 'Manager courtesy waiver',
      });
      setShowWaiveModal(null);
      loadInstallments(selectedContract.id);
    } catch (err: any) {
      alert(err.message || 'Penalty waiver failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.contracts')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Binding sales contracts, installment schedules, sequential payment allocations, and penalty policies
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-emerald-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contracts List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Executed Contracts ({contracts.length})
            </h3>
            {contracts.map((ctr) => {
              const isSelected = selectedContract?.id === ctr.id;
              return (
                <div
                  key={ctr.id}
                  onClick={() => handleSelectContract(ctr)}
                  className={`p-4 rounded-2xl glass-panel cursor-pointer transition border ${
                    isSelected
                      ? 'border-emerald-500 bg-slate-900 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-xs text-emerald-400">
                      {ctr.contractNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400">
                      {ctr.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1.5">{ctr.property?.title}</h4>
                  <p className="text-xs text-slate-400">{ctr.customer?.fullName}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Price</span>
                      <span className="font-bold text-white">
                        {formatCurrency(ctr.sellingPrice, Currency.USD)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Remaining</span>
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(ctr.balanceRemaining, Currency.USD)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contract Detail & Installment Schedule */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 min-h-[500px]">
            {!selectedContract ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 p-12">
                <FileText className="w-12 h-12 mb-2 opacity-40" />
                <p className="text-sm font-medium">Select a contract to view installment schedule</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {selectedContract.contractNumber}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">
                      {selectedContract.property?.title}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Buyer: <span className="text-slate-200 font-semibold">{selectedContract.customer?.fullName}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {installments.length === 0 ? (
                      <button
                        onClick={() => setShowPlanModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Generate Payment Plan</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const nextUnpaid = installments.find((i) => i.status !== 'PAID');
                          if (nextUnpaid) {
                            setPayAmount(Number(nextUnpaid.outstandingAmount));
                          }
                          setShowPayModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Schedule Table */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Reconciled Installment Schedule
                  </h3>

                  {scheduleLoading ? (
                    <div className="text-center py-12 text-emerald-400">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs">Loading schedule...</span>
                    </div>
                  ) : installments.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                      No payment plan generated for this contract yet. Click "Generate Payment Plan" above.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[460px] overflow-y-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 sticky top-0 text-slate-400 uppercase font-semibold border-b border-slate-800 z-10">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Due Date</th>
                            <th className="py-2.5 px-3">Scheduled</th>
                            <th className="py-2.5 px-3">Paid</th>
                            <th className="py-2.5 px-3">Outstanding</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Penalty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {installments.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-800/40 transition">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                                {row.installmentNumber}
                              </td>
                              <td className="py-2.5 px-3">
                                {new Date(row.dueDate).toLocaleDateString('en-GB')}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-white">
                                {formatCurrency(row.scheduledAmount, Currency.USD)}
                              </td>
                              <td className="py-2.5 px-3 text-emerald-400">
                                {formatCurrency(row.amountPaid, Currency.USD)}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-white">
                                {formatCurrency(row.outstandingAmount, Currency.USD)}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    row.status === 'PAID'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : row.status === 'PARTIALLY_PAID'
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : row.isOverdue
                                      ? 'bg-rose-500/20 text-rose-400'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {row.isOverdue ? `Overdue (${row.overdueDays}d)` : row.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {row.calculatedPenalty > 0 ? (
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <span className="text-amber-400 font-bold font-mono">
                                      +${row.calculatedPenalty}
                                    </span>
                                    <button
                                      onClick={() => setShowWaiveModal(row)}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px]"
                                      title="Waive penalty"
                                    >
                                      Waive
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Record Customer Payment</h3>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Payment will be sequentially allocated across upcoming/due installments and automatically post a balanced double-entry ledger entry.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  <option value="BANK_TRANSFER">Bank Wire Transfer (ABA/Canadia)</option>
                  <option value="KHQR_SCAN">Bakong KHQR QR Code</option>
                  <option value="CASH">Cash Office</option>
                  <option value="CHEQUE">Banker's Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Transaction Ref / Slip # (Idempotent)</label>
                <input
                  type="text"
                  required
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. ABA-TXN-991024"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                {actionLoading ? 'Processing...' : 'Post Verified Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Generate Payment Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePlan}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white mb-2">Configure Installment Plan</h3>
            <p className="text-xs text-slate-400 mb-4">
              Contract balance: <span className="font-bold text-emerald-400">{formatCurrency(selectedContract.balanceRemaining, Currency.USD)}</span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Number of Installments (Months)</label>
                <input
                  type="number"
                  required
                  value={planCount}
                  onChange={(e) => setPlanCount(Number(e.target.value))}
                  min={1}
                  max={360}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">First Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                {actionLoading ? 'Generating...' : 'Generate Reconciled Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Waive Penalty Modal */}
      {showWaiveModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleWaivePenalty}
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white mb-2">Waive Late Penalty</h3>
            <p className="text-xs text-slate-400 mb-4">
              Installment #{showWaiveModal.installmentNumber} • Amount: ${showWaiveModal.calculatedPenalty}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Authorized Waiver Justification</label>
                <textarea
                  value={waiveReason}
                  onChange={(e) => setWaiveReason(e.target.value)}
                  placeholder="e.g. Courtesy grace waiver authorized by Sales Director"
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowWaiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Approve Waiver
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
