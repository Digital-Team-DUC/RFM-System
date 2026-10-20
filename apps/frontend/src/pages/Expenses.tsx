import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, Currency } from '@rfm/shared';
import { Receipt, Plus, CheckCircle, CreditCard, X, DollarSign } from 'lucide-react';

export const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<any>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    projectId: '',
    category: 'CONSTRUCTION',
    amount: 5000,
    vendorName: '',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eData, pData, aData] = await Promise.all([
        api.get('/finance/expenses'),
        api.get('/projects'),
        api.get('/finance/accounts'),
      ]);
      setExpenses(eData);
      setProjects(pData);
      setAccounts(aData);
      if (pData.length > 0 && !formData.projectId) {
        setFormData((f) => ({ ...f, projectId: pData[0].id }));
      }
      if (aData.length > 0 && !selectedAccountId) {
        setSelectedAccountId(aData[0].id);
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

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/expenses', formData);
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit expense');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/finance/expenses/${id}/approve`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handlePayExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || !selectedAccountId) return;
    try {
      await api.post(`/finance/expenses/${showPayModal.id}/pay`, {
        bankAccountId: selectedAccountId,
      });
      setShowPayModal(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Payment disbursement failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.expenses')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Operating costs, contractor billings, land acquisition, marketing, and verified disbursements
          </p>
        </div>

        {hasPermission('expenses.create') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Expense</span>
          </button>
        )}
      </div>

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
                  <th className="py-3.5 px-4">Expense #</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Vendor / Payee</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {exp.project?.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{exp.vendorName}</span>
                      <span className="text-[10px] text-slate-500">{exp.description}</span>
                    </td>
                    <td className="py-3 px-4 font-black text-rose-400">
                      {formatCurrency(exp.amount, Currency.USD)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(exp.expenseDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          exp.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : exp.status === 'APPROVED'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {exp.status === 'PENDING_APPROVAL' && hasPermission('expenses.approve') && (
                        <button
                          onClick={() => handleApprove(exp.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold transition text-[11px]"
                        >
                          Approve
                        </button>
                      )}
                      {exp.status === 'APPROVED' && (
                        <button
                          onClick={() => setShowPayModal(exp)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition text-[11px]"
                        >
                          Disburse Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Expense Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateExpense}
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Submit Operating Expense Requisition</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Expense Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  >
                    <option value="CONSTRUCTION">Construction & Engineering</option>
                    <option value="MARKETING">Marketing & Advertising</option>
                    <option value="LEGAL">Legal & Permitting</option>
                    <option value="ADMINISTRATIVE">Salaries & Administration</option>
                    <option value="UTILITIES">Office Utilities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Vendor / Contractor Name</label>
                <input
                  type="text"
                  required
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  placeholder="e.g. Mekong Concrete Piling Co."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description / Line Item Purpose</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Reinforced foundations for Phase 1 shophouses"
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Submit Requisition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disburse Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handlePayExpense}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white mb-2">Disburse Operating Expense</h3>
            <p className="text-xs text-slate-400 mb-4">
              Voucher: <span className="font-mono text-emerald-400">{showPayModal.expenseNumber}</span> • Amount:{' '}
              <span className="font-bold text-white">{formatCurrency(showPayModal.amount, Currency.USD)}</span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Disbursement Bank / Cash Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Balance: ${acc.currentBalance}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPayModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Disburse & Post to GL
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
