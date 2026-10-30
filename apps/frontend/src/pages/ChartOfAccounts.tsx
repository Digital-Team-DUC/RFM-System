import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { formatCurrency, Currency } from '@rfm/shared';
import { BookOpen, Plus, Search, Layers, X } from 'lucide-react';

export const ChartOfAccounts: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    accountType: 'ASSET',
    description: '',
  });

  const loadCOA = async () => {
    setLoading(true);
    try {
      const data = await api.get('/accounting/chart-of-accounts');
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCOA();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/accounting/chart-of-accounts', formData);
      setShowModal(false);
      loadCOA();
    } catch (err: any) {
      alert(err.message || 'Failed to create account');
    }
  };

  const filtered = accounts.filter((a) => {
    if (filterType === 'ALL') return true;
    return a.accountType === filterType;
  });

  const filterOptions = [
    { key: 'ALL', label: i18n.language === 'km' ? 'ទាំងអស់' : 'ALL' },
    { key: 'ASSET', label: i18n.language === 'km' ? 'ទ្រព្យសកម្ម (Asset)' : 'ASSET' },
    { key: 'LIABILITY', label: i18n.language === 'km' ? 'បំណុល (Liability)' : 'LIABILITY' },
    { key: 'EQUITY', label: i18n.language === 'km' ? 'មូលធន (Equity)' : 'EQUITY' },
    { key: 'REVENUE', label: i18n.language === 'km' ? 'ចំណូល (Revenue)' : 'REVENUE' },
    { key: 'EXPENSE', label: i18n.language === 'km' ? 'ចំណាយ (Expense)' : 'EXPENSE' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.chartOfAccounts')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {i18n.language === 'km'
              ? 'តារាងគណនីសៀវភៅធំសម្រាប់ទ្រទ្រង់ប្រព័ន្ធគណនេយ្យទ្វេភាគនៃអាជីវកម្មអចលនទ្រព្យ'
              : 'General ledger chart of accounts foundation supporting double-entry real estate financial accounting'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{i18n.language === 'km' ? 'បង្កើតគណនីថ្មី' : 'New Account'}</span>
        </button>
      </div>

      {/* Account Type Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 text-xs">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilterType(opt.key)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
              filterType === opt.key
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
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
                  <th className="py-3.5 px-4">{i18n.language === 'km' ? 'លេខកូដគណនី' : 'Account Code'}</th>
                  <th className="py-3.5 px-4">{i18n.language === 'km' ? 'ឈ្មោះគណនី' : 'Account Name'}</th>
                  <th className="py-3.5 px-4">{i18n.language === 'km' ? 'ប្រភេទ' : 'Type'}</th>
                  <th className="py-3.5 px-4 text-right">{i18n.language === 'km' ? 'សមតុល្យសៀវភៅធំ' : 'Current Ledger Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filtered.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">{acc.code}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{acc.name}</span>
                      {acc.description && <span className="text-[10px] text-slate-500">{acc.description}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {acc.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-white font-mono">
                      {formatCurrency(acc.balance, Currency.USD)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white mb-4">
              {i18n.language === 'km' ? 'បន្ថែមគណនីសៀវភៅធំថ្មី' : 'Add General Ledger Account'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {i18n.language === 'km' ? 'លេខកូដគណនី' : 'Account Code'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. 1030 or 6060"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {i18n.language === 'km' ? 'ឈ្មោះគណនី' : 'Account Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bank of China Corporate USD"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {i18n.language === 'km' ? 'ប្រភេទគណនី' : 'Account Category'}
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold"
                >
                  <option value="ASSET">{i18n.language === 'km' ? 'ទ្រព្យសកម្ម (ASSET)' : 'ASSET'}</option>
                  <option value="LIABILITY">{i18n.language === 'km' ? 'បំណុល (LIABILITY)' : 'LIABILITY'}</option>
                  <option value="EQUITY">{i18n.language === 'km' ? 'មូលធន (EQUITY)' : 'EQUITY'}</option>
                  <option value="REVENUE">{i18n.language === 'km' ? 'ចំណូល (REVENUE)' : 'REVENUE'}</option>
                  <option value="EXPENSE">{i18n.language === 'km' ? 'ចំណាយ (EXPENSE)' : 'EXPENSE'}</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                {i18n.language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                {i18n.language === 'km' ? 'រក្សាទុកគណនី' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
