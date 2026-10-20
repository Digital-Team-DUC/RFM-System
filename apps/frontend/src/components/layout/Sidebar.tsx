import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building,
  Map,
  Home,
  UserCheck,
  Users,
  BookmarkCheck,
  FileText,
  CreditCard,
  Award,
  Receipt,
  Wallet,
  BookOpen,
  Split,
  BarChart3,
  ShieldAlert,
  Settings,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();

  const navSections = [
    {
      title: 'Portfolio & Inventory',
      items: [
        { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
        { to: '/projects', label: t('nav.projects'), icon: Building },
        { to: '/master-plan', label: t('nav.masterPlan'), icon: Map },
        { to: '/properties', label: t('nav.properties'), icon: Home },
      ],
    },
    {
      title: 'CRM & Sales',
      items: [
        { to: '/crm/leads', label: t('nav.crm'), icon: UserCheck },
        { to: '/crm/customers', label: t('nav.customers'), icon: Users },
        { to: '/sales/bookings', label: t('nav.bookings'), icon: BookmarkCheck },
        { to: '/sales/contracts', label: t('nav.contracts'), icon: FileText },
        { to: '/payments', label: t('nav.payments'), icon: CreditCard },
        { to: '/commissions', label: t('nav.commissions'), icon: Award },
      ],
    },
    {
      title: 'Finance & Accounting',
      items: [
        { to: '/finance/expenses', label: t('nav.expenses'), icon: Receipt },
        { to: '/finance/accounts', label: t('nav.bankAccounts'), icon: Wallet },
        { to: '/accounting/coa', label: t('nav.chartOfAccounts'), icon: BookOpen },
        { to: '/accounting/journal', label: t('nav.journalEntries'), icon: Split },
        { to: '/accounting/statements', label: t('nav.financialStatements'), icon: BarChart3 },
      ],
    },
    {
      title: 'System & Admin',
      items: [
        { to: '/admin/users', label: t('nav.users'), icon: Users },
        { to: '/admin/audit', label: t('nav.auditLogs'), icon: ShieldAlert },
        { to: '/admin/settings', label: t('nav.settings'), icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-900/40">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-white block">
            RFM SYSTEM
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block -mt-1">
            Enterprise ERP
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {section.title}
            </p>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-3 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center font-mono">
        v1.0.0 • Asia/Phnom_Penh (USD/KHR)
      </div>
    </aside>
  );
};
