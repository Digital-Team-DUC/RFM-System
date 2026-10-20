import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Building, Globe, Shield, Database, Radio } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-black text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>{t('nav.settings')}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Company configuration, currency exchange rates, fiscal calendar, and external integration status
        </p>
      </div>

      <div className="space-y-4">
        {/* Company Info */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Company Identity & Registration</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block">Organization Name</span>
              <span className="font-semibold text-white">Phnom Penh Land & Asset Development Co., Ltd.</span>
            </div>
            <div>
              <span className="text-slate-500 block">Corporate Tax Registration #</span>
              <span className="font-mono font-semibold text-white">K009-876543210</span>
            </div>
            <div>
              <span className="text-slate-500 block">Head Office Address</span>
              <span className="text-slate-200">Preah Monivong Blvd, Boeung Keng Kang 1, Phnom Penh, Cambodia</span>
            </div>
            <div>
              <span className="text-slate-500 block">Operating Timezone</span>
              <span className="font-mono text-emerald-400">Asia/Phnom_Penh (UTC+7)</span>
            </div>
          </div>
        </div>

        {/* Currency & Financial Defaults */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Currencies & Dual Exchange Rate</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-slate-500 block">Primary Functional Currency</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">USD ($)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Secondary Local Currency</span>
              <span className="font-mono font-bold text-teal-400 text-sm">KHR (៛)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Official Reference Exchange Rate</span>
              <span className="font-mono font-bold text-white text-sm">1 USD = 4,100 KHR</span>
            </div>
          </div>
        </div>

        {/* Integration Statuses */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Radio className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">External Integrations & Provider Bridges</h3>
          </div>

          <div className="divide-y divide-slate-800/60">
            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-semibold text-white block">PostgreSQL Database</span>
                <span className="text-slate-500 text-[11px]">Primary transactional persistence layer</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                Connected & Synced
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-semibold text-white block">Socket.IO Real-Time Gateway</span>
                <span className="text-slate-500 text-[11px]">Authorized WebSocket event dispatching</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                Active
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-semibold text-white block">Redis / BullMQ Notification Worker</span>
                <span className="text-slate-500 text-[11px]">Background reminder queue</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                Local Redis Standby
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-semibold text-white block">Telegram Bot Reminders</span>
                <span className="text-slate-500 text-[11px]">Overdue installment push alerts</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-400">
                Unconfigured (Awaiting Token)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
