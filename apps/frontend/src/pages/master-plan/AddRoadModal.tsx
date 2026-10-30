import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { MasterPlanAssetData, MasterPlanShapeData } from './types';
import { X, Plus, AlertCircle, Compass, Layers } from 'lucide-react';

interface AddRoadModalProps {
  asset: MasterPlanAssetData;
  onClose: () => void;
  onCreated: (newShape: MasterPlanShapeData) => void;
}

export const AddRoadModal: React.FC<AddRoadModalProps> = ({
  asset,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState<string>('Mekong Royal Boulevard');
  const [roadType, setRoadType] = useState<'boulevard' | 'street' | 'alley'>('boulevard');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [positionPercent, setPositionPercent] = useState<number>(50); // 50% along the canvas
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const canvasWidth = asset.width || 1000;
  const canvasHeight = asset.height || 600;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Road name is required');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const thickness = roadType === 'boulevard' ? 36 : roadType === 'street' ? 22 : 14;
      let coordinates = '';

      if (orientation === 'horizontal') {
        const y = Math.round((canvasHeight * positionPercent) / 100);
        coordinates = `M 20 ${y} L ${canvasWidth - 20} ${y} L ${canvasWidth - 20} ${y + thickness} L 20 ${y + thickness} Z`;
      } else {
        const x = Math.round((canvasWidth * positionPercent) / 100);
        coordinates = `M ${x} 20 L ${x + thickness} 20 L ${x + thickness} ${canvasHeight - 20} L ${x} ${canvasHeight - 20} Z`;
      }

      const created = await api.post(`/master-plan/assets/${asset.id}/roads`, {
        name: name.trim(),
        roadType,
        coordinates,
      });

      onCreated(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create road');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 font-sans">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('masterPlan.addRoadTitle')}</h3>
              <p className="text-[11px] text-slate-400">{t('masterPlan.addRoadDesc')}</p>
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
            <label className="text-slate-300 block mb-1 font-semibold">{t('masterPlan.roadNameLabel')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Royal Mekong Boulevard"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">{t('masterPlan.roadTypeLabel')}</label>
              <select
                value={roadType}
                onChange={(e) => setRoadType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="boulevard">{t('masterPlan.mainBoulevard')}</option>
                <option value="street">{t('masterPlan.secondaryStreet')}</option>
                <option value="alley">Access Alley (1 Lane / 14px)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">{t('masterPlan.orientation')}</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="horizontal">{t('masterPlan.horizontal')}</option>
                <option value="vertical">{t('masterPlan.vertical')}</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-400 font-semibold">
                {t('masterPlan.roadPosition')} ({orientation === 'horizontal' ? 'Y-Axis' : 'X-Axis'})
              </label>
              <span className="font-mono text-emerald-400 font-bold">{positionPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={positionPercent}
              onChange={(e) => setPositionPercent(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>{orientation === 'horizontal' ? 'Top (10%)' : 'Left (10%)'}</span>
              <span>Center (50%)</span>
              <span>{orientation === 'horizontal' ? 'Bottom (90%)' : 'Right (90%)'}</span>
            </div>
          </div>

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
              <span>{submitting ? t('common.loading') : t('masterPlan.createRoad')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
