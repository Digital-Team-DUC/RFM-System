import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { MasterPlanShapeData } from './types';
import {
  X,
  Save,
  AlertCircle,
  FileText,
  DollarSign,
  Maximize,
  Compass,
  Tag,
  Building,
  Info,
} from 'lucide-react';

interface InsertPlotInfoModalProps {
  shape: MasterPlanShapeData;
  projectId: string;
  onClose: () => void;
  onUpdated: (updatedShape: MasterPlanShapeData) => void;
}

export const InsertPlotInfoModal: React.FC<InsertPlotInfoModalProps> = ({
  shape,
  projectId,
  onClose,
  onUpdated,
}) => {
  const { t } = useTranslation();
  const prop = shape.property;

  // Basic Shape Info
  const [label, setLabel] = useState<string>(shape.label || '');
  const [shapeType, setShapeType] = useState<string>(shape.shapeType || 'path');
  const [status, setStatus] = useState<string>(shape.status || 'AVAILABLE');
  const [colorCode, setColorCode] = useState<string>(shape.colorCode || '#10b981');

  // Property / Plot Info
  const [title, setTitle] = useState<string>(prop?.title || (shape.label ? `Unit ${shape.label}` : ''));
  const [propertyType, setPropertyType] = useState<string>(prop?.propertyType || 'VILLA');
  const [sellingPrice, setSellingPrice] = useState<number>(prop?.sellingPrice ? Number(prop.sellingPrice) : 150000);
  const [landArea, setLandArea] = useState<number>(prop?.landArea ? Number(prop.landArea) : 160);
  const [buildingArea, setBuildingArea] = useState<number>(prop?.buildingArea ? Number(prop.buildingArea) : 220);
  const [bedrooms, setBedrooms] = useState<number>(prop?.bedrooms !== undefined ? prop.bedrooms : 3);
  const [bathrooms, setBathrooms] = useState<number>(prop?.bathrooms !== undefined ? prop.bathrooms : 4);
  const [facingDirection, setFacingDirection] = useState<string>(prop?.facingDirection || 'NORTH');
  const [block, setBlock] = useState<string>(prop?.block || 'Block A');
  const [zone, setZone] = useState<string>(prop?.zone || 'Zone 1');
  const [notes, setNotes] = useState<string>(prop?.notes || '');

  // Submitting
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isRoadOrAmenity =
    shapeType === 'road' ||
    shapeType === 'boulevard' ||
    shapeType === 'street' ||
    shapeType === 'park' ||
    shapeType === 'water' ||
    shapeType === 'amenity';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setErrorMsg('Plot label or name is required');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload: any = {
        label: label.trim(),
        shapeType,
        status,
        colorCode,
      };

      if (!isRoadOrAmenity) {
        payload.propertyInfo = {
          title: title.trim() || `Plot ${label.trim()}`,
          unitNumber: label.trim(),
          propertyType,
          status,
          sellingPrice: Number(sellingPrice) || 0,
          landArea: Number(landArea) || 0,
          buildingArea: Number(buildingArea) || 0,
          bedrooms: Number(bedrooms) || 0,
          bathrooms: Number(bathrooms) || 0,
          facingDirection,
          block: block.trim(),
          zone: zone.trim(),
          notes: notes.trim(),
        };
      }

      const updated = await api.patch(`/master-plan/shapes/${shape.id}`, payload);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update plot information');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 font-sans">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{t('masterPlan.insertEditPlotTitle')}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {t('masterPlan.insertEditPlotDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs font-sans">
          {/* Element Category & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">{t('masterPlan.elementCategory')}</label>
              <select
                value={shapeType}
                onChange={(e) => {
                  setShapeType(e.target.value);
                  if (e.target.value === 'road' || e.target.value === 'boulevard') {
                    setStatus('INFRASTRUCTURE');
                    setColorCode('#1e293b');
                  } else if (e.target.value === 'street') {
                    setStatus('INFRASTRUCTURE');
                    setColorCode('#334155');
                  } else if (e.target.value === 'park') {
                    setStatus('AMENITY');
                    setColorCode('#065f46');
                  } else if (e.target.value === 'water') {
                    setStatus('AMENITY');
                    setColorCode('#0284c7');
                  } else {
                    setStatus('AVAILABLE');
                    setColorCode('#10b981');
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="path">{t('masterPlan.unitPlot')}</option>
                <option value="boulevard">{t('masterPlan.mainBoulevard')}</option>
                <option value="street">{t('masterPlan.secondaryStreet')}</option>
                <option value="park">{t('masterPlan.centralGreenPark')}</option>
                <option value="water">{t('masterPlan.waterCanal')}</option>
                <option value="amenity">{t('masterPlan.clubhouseAmenity')}</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">{t('masterPlan.plotUnitLabel')}</label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. A-01, V-12, Boulevard North"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">{t('common.status')}</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (e.target.value === 'AVAILABLE') setColorCode('#10b981');
                  else if (e.target.value === 'RESERVED') setColorCode('#f59e0b');
                  else if (e.target.value === 'INSTALLMENT') setColorCode('#3b82f6');
                  else if (e.target.value === 'SOLD') setColorCode('#ef4444');
                  else if (e.target.value === 'INFRASTRUCTURE') setColorCode('#1e293b');
                  else if (e.target.value === 'AMENITY') setColorCode('#059669');
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              >
                <option value="AVAILABLE">{t('status.available')} (Green)</option>
                <option value="RESERVED">{t('status.reserved')} (Amber)</option>
                <option value="INSTALLMENT">{t('status.installment')} (Blue)</option>
                <option value="SOLD">{t('status.sold')} (Red)</option>
                <option value="BLOCKED">{t('status.blocked')} (Slate)</option>
                <option value="INFRASTRUCTURE">{t('status.infrastructure')} (Dark)</option>
                <option value="AMENITY">{t('status.amenity')} (Emerald)</option>
              </select>
            </div>
          </div>

          {/* Color & Visual Swatch */}
          <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-semibold">{t('masterPlan.plotColor')}</span>
            <input
              type="color"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-700"
            />
            <div className="flex items-center space-x-1.5">
              {['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#1e293b', '#065f46', '#0284c7'].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorCode(c)}
                    className="w-6 h-6 rounded-full border border-white/20 transition hover:scale-110"
                    style={{ backgroundColor: c }}
                  />
                ),
              )}
            </div>
          </div>

          {/* Detailed Property Information (Only for Property Units) */}
          {!isRoadOrAmenity && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>{t('masterPlan.propertyUnitDetails')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{t('masterPlan.propertyTitle')}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Royal Riverside Villa A-01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{t('masterPlan.propertyType')}</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="VILLA">{t('masterPlan.propertyTypes.villa')}</option>
                    <option value="SHOPHOUSE">{t('masterPlan.propertyTypes.shophouse')}</option>
                    <option value="TOWNHOUSE">{t('masterPlan.propertyTypes.townhouse')}</option>
                    <option value="CONDO">{t('masterPlan.propertyTypes.condo')}</option>
                    <option value="LAND_PLOT">{t('masterPlan.propertyTypes.landPlot')}</option>
                    <option value="COMMERCIAL">{t('masterPlan.propertyTypes.commercial')}</option>
                  </select>
                </div>
              </div>

              {/* Price & Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{t('masterPlan.sellingPriceUSD')}</label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{t('masterPlan.landArea')}</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={landArea}
                    onChange={(e) => setLandArea(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{t('masterPlan.buildingArea')}</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={buildingArea}
                    onChange={(e) => setBuildingArea(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Bedrooms, Bathrooms, Facing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{t('masterPlan.bedrooms')}</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{t('masterPlan.bathrooms')}</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{t('masterPlan.facingDirection')}</label>
                  <select
                    value={facingDirection}
                    onChange={(e) => setFacingDirection(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="NORTH">{t('masterPlan.directions.north')}</option>
                    <option value="SOUTH">{t('masterPlan.directions.south')}</option>
                    <option value="EAST">{t('masterPlan.directions.east')}</option>
                    <option value="WEST">{t('masterPlan.directions.west')}</option>
                    <option value="NORTHEAST">{t('masterPlan.directions.northeast')}</option>
                    <option value="SOUTHEAST">{t('masterPlan.directions.southeast')}</option>
                    <option value="NORTHWEST">{t('masterPlan.directions.northwest')}</option>
                    <option value="SOUTHWEST">{t('masterPlan.directions.southwest')}</option>
                  </select>
                </div>
              </div>

              {/* Block & Zone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{t('masterPlan.blockSection')}</label>
                  <input
                    type="text"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g. Block A, Riverfront Row"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">{t('masterPlan.zonePhase')}</label>
                  <input
                    type="text"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="e.g. Zone 1, Phase 2"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Special Notes & Features */}
              <div>
                <label className="text-slate-400 block mb-1">{t('masterPlan.plotNotes')}</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Corner lot with direct access to central garden. Pre-installed private pool."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex gap-3 font-sans">
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
              <Save className="w-4 h-4" />
              <span>{submitting ? t('common.loading') : t('masterPlan.saveUpdatePlot')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
