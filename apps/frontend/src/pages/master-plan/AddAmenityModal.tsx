import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { MasterPlanAssetData, MasterPlanShapeData } from './types';
import { X, Plus, AlertCircle, Trees, Waves, Building } from 'lucide-react';

interface AddAmenityModalProps {
  asset: MasterPlanAssetData;
  onClose: () => void;
  onCreated: (newShape: MasterPlanShapeData) => void;
}

export const AddAmenityModal: React.FC<AddAmenityModalProps> = ({
  asset,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState<string>('Central Botanic Park');
  const [amenityType, setAmenityType] = useState<'park' | 'water' | 'clubhouse' | 'pool' | 'gate'>('park');
  const [width, setWidth] = useState<number>(180);
  const [height, setHeight] = useState<number>(120);
  const [posX, setPosX] = useState<number>(400);
  const [posY, setPosY] = useState<number>(200);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Amenity name is required');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const created = await api.post(`/master-plan/assets/${asset.id}/amenities`, {
        name: name.trim(),
        amenityType,
        x: Number(posX) || 400,
        y: Number(posY) || 200,
        width: Number(width) || 180,
        height: Number(height) || 120,
      });

      onCreated(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create amenity space');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 font-sans">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trees className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('masterPlan.addAmenityTitle')}</h3>
              <p className="text-[11px] text-slate-400">{t('masterPlan.addAmenityDesc')}</p>
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
            <label className="text-slate-300 block mb-1 font-semibold">{t('masterPlan.amenityName')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Central Botanic Park"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">{t('masterPlan.amenityType')}</label>
            <select
              value={amenityType}
              onChange={(e) => {
                const val = e.target.value as any;
                setAmenityType(val);
                if (val === 'park') setName('Central Botanic Park');
                else if (val === 'water') setName('Riverside Lake');
                else if (val === 'pool') setName('Infinity Swimming Pool');
                else if (val === 'clubhouse') setName('Community Clubhouse & Gym');
                else if (val === 'gate') setName('Grand Entrance Gatehouse');
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="park">{t('masterPlan.amenityTypes.park')}</option>
              <option value="water">{t('masterPlan.amenityTypes.water')}</option>
              <option value="pool">{t('masterPlan.amenityTypes.pool')}</option>
              <option value="clubhouse">{t('masterPlan.amenityTypes.clubhouse')}</option>
              <option value="gate">{t('masterPlan.amenityTypes.gate')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">{t('masterPlan.canvasWidth')}</label>
              <input
                type="number"
                min="50"
                max="800"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('masterPlan.canvasHeight')}</label>
              <input
                type="number"
                min="30"
                max="600"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
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
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? t('common.loading') : t('masterPlan.createAmenity')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
