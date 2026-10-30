import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { MasterPlanShapeData, PropertySummary } from './types';
import {
  X,
  Trash2,
  Save,
  Link,
  Unlink,
  CheckCircle,
  AlertCircle,
  Move,
  Layers,
  Palette,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface PlotEditorDrawerProps {
  shape: MasterPlanShapeData;
  projectId: string;
  onClose: () => void;
  onUpdate: (updatedShape: MasterPlanShapeData) => void;
  onDelete: (shapeId: string) => void;
}

export const PlotEditorDrawer: React.FC<PlotEditorDrawerProps> = ({
  shape,
  projectId,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslation();

  // Form State
  const [label, setLabel] = useState<string>(shape.label || '');
  const [propertyId, setPropertyId] = useState<string>(shape.propertyId || '');
  const [status, setStatus] = useState<string>(shape.status || 'AVAILABLE');
  const [colorCode, setColorCode] = useState<string>(shape.colorCode || '#10b981');
  const [coordinates, setCoordinates] = useState<string>(shape.coordinates || '');

  // Properties available for linking
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loadingProps, setLoadingProps] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    setLabel(shape.label || '');
    setPropertyId(shape.propertyId || '');
    setStatus(shape.status || 'AVAILABLE');
    setColorCode(shape.colorCode || '#10b981');
    setCoordinates(shape.coordinates || '');
  }, [shape]);

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoadingProps(true);
        const data = await api.get('/properties', { projectId });
        setProperties(data || []);
      } catch (err) {
        console.error('Failed to load project properties', err);
      } finally {
        setLoadingProps(false);
      }
    }
    loadProperties();
  }, [projectId]);

  // Handle Property Selection change
  const handlePropertyChange = (selectedId: string) => {
    setPropertyId(selectedId);
    if (!selectedId) return;

    const prop = properties.find((p) => p.id === selectedId);
    if (prop) {
      setLabel(prop.unitNumber || prop.code);
      setStatus(prop.status);
      setColorCode(
        prop.status === 'AVAILABLE'
          ? '#10b981'
          : prop.status === 'RESERVED'
          ? '#f59e0b'
          : prop.status === 'INSTALLMENT'
          ? '#3b82f6'
          : '#ef4444',
      );
    }
  };

  // Nudge coordinates helper (move shape by dx, dy)
  const nudgeCoordinates = (dx: number, dy: number) => {
    let pointIndex = 0;
    const nudged = coordinates.replace(/-?\d+(\.\d+)?/g, (match) => {
      const num = parseFloat(match);
      const isX = pointIndex % 2 === 0;
      pointIndex++;
      return isX ? String(Math.round((num + dx) * 10) / 10) : String(Math.round((num + dy) * 10) / 10);
    });
    setCoordinates(nudged);
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');

      const updated = await api.patch(`/master-plan/shapes/${shape.id}`, {
        label,
        propertyId: propertyId || null,
        status,
        colorCode,
        coordinates,
      });

      onUpdate(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update plot shape');
    } finally {
      setSaving(false);
    }
  };

  // Delete plot shape
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete plot "${label}" from the site plan?`)) {
      return;
    }

    try {
      setSaving(true);
      await api.delete(`/master-plan/shapes/${shape.id}`);
      onDelete(shape.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete shape');
      setSaving(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 w-96 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-3xl shadow-2xl p-5 z-20 animate-in fade-in slide-in-from-right duration-200 flex flex-col max-h-[90%] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t('masterPlan.plotEditorTitle')}</h3>
            <span className="text-[10px] text-slate-400 font-mono">ID: {shape.id.slice(0, 8)}...</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 font-sans">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="py-4 space-y-4 text-xs font-sans">
        {/* Label */}
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">{t('masterPlan.plotUnitLabel')}</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="e.g. Villa V-01"
          />
        </div>

        {/* Link Property Unit */}
        <div>
          <label className="text-slate-400 block mb-1 font-semibold flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Link className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('masterPlan.linkProperty')}</span>
            </span>
            {propertyId && (
              <button
                type="button"
                onClick={() => setPropertyId('')}
                className="text-[10px] text-amber-400 hover:underline flex items-center space-x-0.5"
              >
                <Unlink className="w-3 h-3" />
                <span>{t('actions.delete')}</span>
              </button>
            )}
          </label>
          <select
            value={propertyId}
            onChange={(e) => handlePropertyChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
          >
            <option value="">-- {t('masterPlan.unlinked')} --</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.unitNumber || p.code} — {p.title} (${p.sellingPrice.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Status & Color */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">{t('common.status')}</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setColorCode(
                  e.target.value === 'AVAILABLE'
                    ? '#10b981'
                    : e.target.value === 'RESERVED'
                    ? '#f59e0b'
                    : e.target.value === 'INSTALLMENT'
                    ? '#3b82f6'
                    : '#ef4444',
                );
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="AVAILABLE">{t('status.available')}</option>
              <option value="RESERVED">{t('status.reserved')}</option>
              <option value="INSTALLMENT">{t('status.installment')}</option>
              <option value="SOLD">{t('status.sold')}</option>
              <option value="BLOCKED">{t('status.blocked')}</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold flex items-center space-x-1">
              <Palette className="w-3 h-3 text-slate-500" />
              <span>{t('masterPlan.plotColor')}</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-slate-700"
              />
              <span className="font-mono text-slate-300 uppercase text-[11px]">{colorCode}</span>
            </div>
          </div>
        </div>

        {/* Nudge / Shift Plot Coordinates */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
              <Move className="w-3 h-3 text-slate-500" />
              <span>{t('masterPlan.nudgePosition')}</span>
            </span>
            <span className="text-[10px] text-slate-500">±10 px</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => nudgeCoordinates(0, -10)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex justify-center items-center"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => nudgeCoordinates(0, 10)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex justify-center items-center"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => nudgeCoordinates(-10, 0)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex justify-center items-center"
              title="Move Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => nudgeCoordinates(10, 0)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex justify-center items-center"
              title="Move Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Raw Coordinates Preview */}
        <div>
          <label className="text-[10px] text-slate-500 block mb-1 font-mono">{t('masterPlan.positionCoordinates')} (SVG)</label>
          <textarea
            rows={2}
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 font-mono text-[10px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('common.loading') : t('common.saveChanges')}</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 transition flex items-center justify-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('masterPlan.deletePlot')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
