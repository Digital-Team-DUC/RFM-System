import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
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

interface NavItem {
  to: string;
  label: string;
  icon: any;
  permission?: string | string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const navSections: NavSection[] = [
    {
      title: 'Portfolio & Inventory',
      items: [
        { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
        { to: '/projects', label: t('nav.projects'), icon: Building, permission: 'properties.read' },
        { to: '/master-plan', label: t('nav.masterPlan'), icon: Map, permission: 'properties.read' },
        { to: '/properties', label: t('nav.properties'), icon: Home, permission: 'properties.read' },
      ],
    },
    {
      title: 'CRM & Sales',
      items: [
        { to: '/crm/leads', label: t('nav.crm'), icon: UserCheck, permission: 'crm.read' },
        { to: '/crm/customers', label: t('nav.customers'), icon: Users, permission: 'crm.read' },
        { to: '/sales/bookings', label: t('nav.bookings'), icon: BookmarkCheck, permission: 'sales.create' },
        { to: '/sales/contracts', label: t('nav.contracts'), icon: FileText, permission: 'contracts.manage' },
        { to: '/payments', label: t('nav.payments'), icon: CreditCard, permission: 'payments.receive' },
        { to: '/commissions', label: t('nav.commissions'), icon: Award, permission: 'commissions.manage' },
      ],
    },
    {
      title: 'Finance & Accounting',
      items: [
        { to: '/finance/expenses', label: t('nav.expenses'), icon: Receipt, permission: 'expenses.create' },
        { to: '/finance/accounts', label: t('nav.bankAccounts'), icon: Wallet, permission: 'accounting.read' },
        { to: '/accounting/coa', label: t('nav.chartOfAccounts'), icon: BookOpen, permission: 'accounting.read' },
        { to: '/accounting/journal', label: t('nav.journalEntries'), icon: Split, permission: 'accounting.read' },
        { to: '/accounting/statements', label: t('nav.financialStatements'), icon: BarChart3, permission: 'accounting.read' },
      ],
    },
    {
      title: 'System & Admin',
      items: [
        { to: '/admin/users', label: t('nav.users'), icon: Users, permission: 'users.manage' },
        { to: '/admin/audit', label: t('nav.auditLogs'), icon: ShieldAlert, permission: 'audit.read' },
        { to: '/admin/settings', label: t('nav.settings'), icon: Settings, permission: 'settings.manage' },
      ],
    },
  ];

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

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
        {visibleSections.map((section, idx) => (
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
