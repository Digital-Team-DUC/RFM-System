import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { X, Plus, AlertCircle, Layers } from 'lucide-react';

interface AddPhaseModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: (newAsset: any) => void;
}

export const AddPhaseModal: React.FC<AddPhaseModalProps> = ({
  projectId,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState<string>('');
  const [width, setWidth] = useState<number>(1000);
  const [height, setHeight] = useState<number>(600);
  const [autoLayout, setAutoLayout] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Phase or Sheet title is required');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const asset = await api.post(`/master-plan/project/${projectId}/assets`, {
        title: title.trim(),
        width: Number(width) || 1000,
        height: Number(height) || 600,
      });

      if (autoLayout) {
        await api.post(`/master-plan/assets/${asset.id}/generate-demo`).catch(() => {});
      }

      onCreated(asset);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create new plan sheet');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 font-sans">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('masterPlan.addPhaseTitle')}</h3>
              <p className="text-[11px] text-slate-400">{t('masterPlan.addPhaseDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">{t('masterPlan.phaseTitleLabel')}</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Phase 2 - Lakeside Villas, or Tower A Floor 5"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">{t('masterPlan.canvasWidth')}</label>
              <input
                type="number"
                min="500"
                max="4000"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('masterPlan.canvasHeight')}</label>
              <input
                type="number"
                min="400"
                max="3000"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoLayout}
              onChange={(e) => setAutoLayout(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-slate-300 font-medium text-xs">
              {t('masterPlan.autoPopulate')}
            </span>
          </label>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? t('common.loading') : t('masterPlan.createPhaseSheet')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
