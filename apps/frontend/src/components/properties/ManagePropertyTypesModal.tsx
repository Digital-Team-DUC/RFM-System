import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getPropertyTypes,
  addPropertyType,
  deletePropertyType,
  resetPropertyTypes,
  PropertyTypeOption,
} from '../../services/propertyTypes';
import { X, Plus, Trash2, RotateCcw, Tag, Check, AlertCircle } from 'lucide-react';

interface ManagePropertyTypesModalProps {
  onClose: () => void;
  onTypesUpdated?: (types: PropertyTypeOption[]) => void;
}

export const ManagePropertyTypesModal: React.FC<ManagePropertyTypesModalProps> = ({
  onClose,
  onTypesUpdated,
}) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === 'km';

  const [types, setTypes] = useState<PropertyTypeOption[]>(getPropertyTypes());
  const [newLabelEn, setNewLabelEn] = useState('');
  const [newLabelKm, setNewLabelKm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelEn.trim()) {
      setErrorMsg(isKm ? 'សូមបញ្ចូលឈ្មោះប្រភេទអចលនទ្រព្យ (អង់គ្លេស)' : 'Please enter property type name (English)');
      return;
    }

    try {
      const created = addPropertyType({
        labelEn: newLabelEn.trim(),
        labelKm: newLabelKm.trim() || newLabelEn.trim(),
      });

      const updated = getPropertyTypes();
      setTypes(updated);
      setNewLabelEn('');
      setNewLabelKm('');
      setErrorMsg('');
      setSuccessMsg(isKm ? `បានបន្ថែមប្រភេទ "${created.labelKm}" ដោយជោគជ័យ!` : `Added "${created.labelEn}" successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);

      if (onTypesUpdated) {
        onTypesUpdated(updated);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add property type');
    }
  };

  const handleDelete = (value: string, label: string) => {
    if (types.length <= 1) {
      setErrorMsg(isKm ? 'មិនអាចលុបបានទេ ត្រូវមានយ៉ាងហោចណាស់ប្រភេទមួយក្នុងប្រព័ន្ធ' : 'Cannot delete the last remaining property type');
      return;
    }

    const confirmMsg = isKm
      ? `តើអ្នកពិតជាចង់លុបប្រភេទអចលនទ្រព្យ "${label}" មែនទេ?`
      : `Are you sure you want to delete property type "${label}"?`;

    if (window.confirm(confirmMsg)) {
      deletePropertyType(value);
      const updated = getPropertyTypes();
      setTypes(updated);
      setErrorMsg('');
      setSuccessMsg(isKm ? `បានលុបប្រភេទ "${label}" រួចរាល់` : `Deleted "${label}" successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);

      if (onTypesUpdated) {
        onTypesUpdated(updated);
      }
    }
  };

  const handleReset = () => {
    const confirmMsg = isKm
      ? 'តើអ្នកចង់កំណត់ប្រភេទអចលនទ្រព្យត្រឡប់ទៅលំនាំដើមរបស់ប្រព័ន្ធវិញឬ?'
      : 'Reset property types to system defaults?';

    if (window.confirm(confirmMsg)) {
      const restored = resetPropertyTypes();
      setTypes(restored);
      setErrorMsg('');
      setSuccessMsg(isKm ? 'បានកំណត់ទៅលំនាំដើមរួចរាល់' : 'Reset to default property types');
      setTimeout(() => setSuccessMsg(''), 3000);

      if (onTypesUpdated) {
        onTypesUpdated(restored);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 font-sans">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isKm ? 'គ្រប់គ្រងប្រភេទអចលនទ្រព្យ (Property Types)' : 'Manage Property Types'}
              </h3>
              <p className="text-xs text-slate-400">
                {isKm
                  ? 'បង្កើត បន្ថែម ឬលុបប្រភេទអចលនទ្រព្យក្នុងប្រព័ន្ធ (Borey, Villa, Land, Shophouse)'
                  : 'Add or remove custom property types in inventory & master plan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 font-sans">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Add New Property Type Form */}
        <form onSubmit={handleAdd} className="p-6 pb-4 border-b border-slate-800/80 font-sans bg-slate-950/40">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>{isKm ? '+ បន្ថែមប្រភេទអចលនទ្រព្យថ្មី' : '+ Add New Property Type'}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {isKm ? 'ឈ្មោះជាភាសាអង់គ្លេស *' : 'Name in English *'}
              </label>
              <input
                type="text"
                required
                value={newLabelEn}
                onChange={(e) => setNewLabelEn(e.target.value)}
                placeholder="e.g. King Villa, Queen Villa, Warehouse"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {isKm ? 'ឈ្មោះជាភាសាខ្មែរ (Khmer)' : 'Name in Khmer (Optional)'}
              </label>
              <input
                type="text"
                value={newLabelKm}
                onChange={(e) => setNewLabelKm(e.target.value)}
                placeholder="ឧ. វីឡាឃីង, ឃ្លាំង, ដីឡូត៍ពិសេស"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{isKm ? 'រក្សាទុកប្រភេទថ្មី' : 'Save New Property Type'}</span>
          </button>
        </form>

        {/* Existing Property Types List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2 font-sans">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-slate-400">
              {isKm ? `បញ្ជីប្រភេទអចលនទ្រព្យបច្ចុប្បន្ន (${types.length})` : `Active Property Types (${types.length})`}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-slate-500 hover:text-amber-400 transition flex items-center space-x-1"
              title="Reset to system defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isKm ? 'កំណត់លំនាំដើម' : 'Reset Defaults'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {types.map((t) => (
              <div
                key={t.value}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
                    {t.labelEn.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{isKm ? t.labelKm : t.labelEn}</span>
                      {isKm && t.labelKm !== t.labelEn && (
                        <span className="text-[11px] text-slate-400 font-normal">({t.labelEn})</span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{t.value}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(t.value, isKm ? t.labelKm : t.labelEn)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title={isKm ? 'លុបប្រភេទនេះ' : 'Delete type'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            {isKm ? 'បិទ / រួចរាល់' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

