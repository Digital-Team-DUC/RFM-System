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
  TrendingUp,
  ShieldAlert,
  Settings,
  X,
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

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const navSections: NavSection[] = [
    {
      title: t('nav.sections.portfolio'),
      items: [
        { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
        { to: '/projects', label: t('nav.projects'), icon: Building, permission: 'properties.read' },
        { to: '/master-plan', label: t('nav.masterPlan'), icon: Map, permission: 'properties.read' },
        { to: '/properties', label: t('nav.properties'), icon: Home, permission: 'properties.read' },
      ],
    },
    {
      title: t('nav.sections.crm'),
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
      title: t('nav.sections.finance'),
      items: [
        { to: '/reports/performance', label: t('nav.executiveReport'), icon: TrendingUp },
        { to: '/finance/expenses', label: t('nav.expenses'), icon: Receipt, permission: 'expenses.create' },
        { to: '/finance/accounts', label: t('nav.bankAccounts'), icon: Wallet, permission: 'accounting.read' },
        { to: '/accounting/coa', label: t('nav.chartOfAccounts'), icon: BookOpen, permission: 'accounting.read' },
        { to: '/accounting/journal', label: t('nav.journalEntries'), icon: Split, permission: 'accounting.read' },
        { to: '/accounting/statements', label: t('nav.financialStatements'), icon: BarChart3, permission: 'accounting.read' },
      ],
    },
    {
      title: t('nav.sections.admin'),
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

  const renderSidebarContent = (isMobile: boolean) => (
    <>
      {/* Brand Header */}
      <div className="h-14 sm:h-16 px-4 sm:px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/rfm-logo.png" alt="RFM System Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block truncate leading-tight">
              RFM SYSTEM
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block">
              Enterprise ERP
            </span>
          </div>
        </div>
        {isMobile && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white transition lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
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
                    onClick={() => {
                      if (isMobile && onCloseMobile) onCloseMobile();
                    }}
                    className={({ isActive }) =>
                      `flex items-center py-2.5 sm:py-2 text-xs transition ${
                        isActive
                          ? 'pl-3 border-l-2 border-emerald-500 text-emerald-400 font-bold'
                          : 'pl-3.5 text-slate-400 hover:text-emerald-400 font-medium'
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
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center font-mono shrink-0">
        v1.0.0 • Asia/Phnom_Penh (USD/KHR)
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (lg and up) */}
      <aside className="hidden lg:flex w-64 border-r border-slate-800 bg-slate-950 flex-col shrink-0 h-screen sticky top-0 overflow-y-auto">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile & Tablet Slide-Over Drawer (< lg) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-out Panel */}
          <aside className="relative z-10 w-72 max-w-[82vw] border-r border-slate-800 bg-slate-950 flex flex-col h-full shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
