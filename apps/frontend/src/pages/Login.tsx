import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, Lock, Mail, Globe, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@rfm.com');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    {
      id: 'super-admin',
      title: 'Super Admin',
      subtitle: 'Full Access',
      email: 'admin@rfm.com',
      pass: 'Admin123!',
    },
    {
      id: 'sales-manager',
      title: 'Sales Manager',
      subtitle: 'Bookings/CRM',
      email: 'sales.manager@rfm.com',
      pass: 'Sales123!',
    },
    {
      id: 'accountant',
      title: 'Sr. Accountant',
      subtitle: 'General Ledger',
      email: 'accountant@rfm.com',
      pass: 'Account123!',
    },
    {
      id: 'cashier',
      title: 'Head Cashier',
      subtitle: 'Payments/Receipts',
      email: 'cashier@rfm.com',
      pass: 'Cashier123!',
    },
  ];

  const [selectedRoleId, setSelectedRoleId] = useState<string>('super-admin');

  const selectRole = (role: (typeof quickRoles)[0]) => {
    setSelectedRoleId(role.id);
    setEmail(role.email);
    setPassword(role.pass);
    setError(null);
  };

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'km' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('rfm_language', next);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Language toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleLang}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{i18n.language === 'en' ? 'ភាសាខ្មែរ (KM)' : 'English (EN)'}</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-2xl shadow-emerald-500/20 border border-slate-700/60 overflow-hidden flex items-center justify-center">
              <img src="/rfm-logo.png" alt="RFM System" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {t('appName')}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {t('appSubtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl relative">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@rfm.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : t('actions.login')}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3 text-center">
              Quick Test Roles
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {quickRoles.map((role) => {
                const isSelected = selectedRoleId === role.id || email === role.email;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => selectRole(role)}
                    className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40 text-white'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className={`font-semibold text-xs ${isSelected ? 'text-emerald-400 font-bold' : 'text-slate-200'}`}>
                        {role.title}
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{role.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center mt-6 text-slate-500 text-xs flex items-center justify-center space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Enterprise End-to-End Encrypted Session</span>
        </div>
      </div>
    </div>
  );
};
