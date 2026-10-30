import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { X, Upload, FileCode, AlertCircle, Check } from 'lucide-react';

interface UploadBlueprintModalProps {
  assetId: string;
  onClose: () => void;
  onSuccess: (svgContent: string) => void;
}

export const UploadBlueprintModal: React.FC<UploadBlueprintModalProps> = ({
  assetId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [svgContent, setSvgContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      setErrorMsg('Please select a valid .svg vector blueprint file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setSvgContent(text);
        setErrorMsg('');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read SVG file');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svgContent.trim()) {
      setErrorMsg('Please upload a file or paste SVG markup');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      await api.post(`/master-plan/assets/${assetId}/upload-svg`, {
        svgContent: svgContent.trim(),
      });

      onSuccess(svgContent.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update blueprint SVG');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 font-sans">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('masterPlan.uploadSvg')}</h3>
              <p className="text-[11px] text-slate-400">{t('masterPlan.uploadBlueprintDesc')}</p>
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
          {/* File input */}
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-950/50">
            <input
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
              id="svgFileInput"
            />
            <label htmlFor="svgFileInput" className="cursor-pointer flex flex-col items-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                <FileCode className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-white">{t('masterPlan.uploadVectorSvg')}</span>
              <span className="text-[10px] text-slate-500">AutoCAD SVG, Figma SVG, or architectural layout (.svg)</span>
            </label>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">{t('masterPlan.pasteSvgMarkup')}</label>
            <textarea
              rows={4}
              value={svgContent}
              onChange={(e) => setSvgContent(e.target.value)}
              placeholder="<svg ...><path ... /></svg>"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
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
              disabled={submitting || !svgContent.trim()}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? t('common.loading') : t('masterPlan.saveRenderBlueprint')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
