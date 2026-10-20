import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { formatCurrency, Currency } from '@rfm/shared';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ChevronRight,
  X,
  MessageSquare,
} from 'lucide-react';

const STAGES = [
  { key: 'NEW', label: 'New Inquiries', color: 'border-slate-500' },
  { key: 'CONTACTED', label: 'Contacted', color: 'border-blue-500' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'border-purple-500' },
  { key: 'VIEWING_SCHEDULED', label: 'Viewing Scheduled', color: 'border-amber-500' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'border-orange-500' },
  { key: 'BOOKING', label: 'Booking', color: 'border-emerald-500' },
  { key: 'WON', label: 'Won / Contracted', color: 'border-teal-400' },
];

export const CrmLeads: React.FC = () => {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    leadSource: 'FACEBOOK',
    budgetMin: 100000,
    budgetMax: 250000,
    interestedProperty: '',
  });

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await api.get('/crm/leads');
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/crm/leads', formData);
      setShowCreateModal(false);
      loadLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    }
  };

  const advanceStage = async (leadId: string, currentStage: string) => {
    const currentIndex = STAGES.findIndex((s) => s.key === currentStage);
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1].key;
      try {
        await api.patch(`/crm/leads/${leadId}/stage`, { stage: nextStage });
        loadLeads();
      } catch (err: any) {
        alert(err.message || 'Failed to advance stage');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.crm')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Customer sales pipeline tracking from initial inquiry to property contract
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Lead</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-emerald-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* Kanban Board Horizontal Scroll */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stg) => {
            const stageLeads = leads.filter((l) => l.stage === stg.key);
            return (
              <div
                key={stg.key}
                className="w-72 shrink-0 bg-slate-900/60 rounded-2xl border border-slate-800 p-3.5 flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">{stg.label}</span>
                  <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="glass-panel p-3.5 rounded-xl border-l-4 border-l-emerald-500 hover:border-slate-700 transition"
                    >
                      <h4 className="text-xs font-bold text-white">{lead.fullName}</h4>
                      <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1.5 text-slate-500 shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1.5 text-slate-500 shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        {lead.budgetMax > 0 && (
                          <div className="flex items-center font-medium text-emerald-400">
                            <DollarSign className="w-3 h-3 mr-1 text-emerald-500 shrink-0" />
                            <span>
                              {formatCurrency(lead.budgetMin, Currency.USD)} - {formatCurrency(lead.budgetMax, Currency.USD)}
                            </span>
                          </div>
                        )}
                      </div>

                      {lead.interestedProperty && (
                        <div className="mt-2 text-[10px] bg-slate-800/80 p-1.5 rounded text-slate-300 truncate">
                          Interest: {lead.interestedProperty}
                        </div>
                      )}

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-mono">
                          {lead.leadSource}
                        </span>
                        {stg.key !== 'WON' && (
                          <button
                            onClick={() => advanceStage(lead.id, lead.stage)}
                            className="p-1 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 text-[10px] font-semibold flex items-center space-x-0.5 transition"
                            title="Advance Stage"
                          >
                            <span>Advance</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateLead}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Register New Sales Lead</h3>
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
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. David Sok"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+855 12 345 678"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="david.sok@gmail.com"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Lead Source</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  >
                    <option value="FACEBOOK">Facebook / TikTok</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="BILLBOARD">Billboard</option>
                    <option value="WALK_IN">Walk-In Showroom</option>
                    <option value="DIRECT">Direct Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Budget ($)</label>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Interested Project / Unit</label>
                <input
                  type="text"
                  value={formData.interestedProperty}
                  onChange={(e) => setFormData({ ...formData, interestedProperty: e.target.value })}
                  placeholder="e.g. Grand Mekong Villa or Shophouse"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                Save Lead
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
