import { Link as RouterLink } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatCurrency, Currency } from '@rfm/shared';
import { MasterPlanAssetData, MasterPlanShapeData, PropertySummary, EditorTool } from './master-plan/types';
import { MasterPlanCanvas } from './master-plan/MasterPlanCanvas';
import { QuickReservationModal } from './master-plan/QuickReservationModal';
import { PlotEditorDrawer } from './master-plan/PlotEditorDrawer';
import { AddPhaseModal } from './master-plan/AddPhaseModal';
import { UploadBlueprintModal } from './master-plan/UploadBlueprintModal';
import { AddRoadModal } from './master-plan/AddRoadModal';
import { AddAmenityModal } from './master-plan/AddAmenityModal';
import { InsertPlotInfoModal } from './master-plan/InsertPlotInfoModal';
import {
  Building,
  CheckCircle,
  Clock,
  Home,
  X,
  ArrowRight,
  Search,
  Filter,
  Plus,
  Sparkles,
  Upload,
  Layers,
  Edit3,
  Eye,
  MousePointer,
  Square,
  Pentagon,
  Trash2,
  Maximize,
  Bed,
  Bath,
  Compass,
  Trees,
  Waves,
  FileText,
  Tag,
  Link,
} from 'lucide-react';

export const MasterPlan: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { selectedProjectId } = useAuth();
  const { socket } = useSocket();

  // Project state
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  // Assets (Phases / Sheets)
  const [assets, setAssets] = useState<MasterPlanAssetData[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string>('');
  const [activeAsset, setActiveAsset] = useState<MasterPlanAssetData | null>(null);

  // Shapes & Selection
  const [shapes, setShapes] = useState<MasterPlanShapeData[]>([]);
  const [selectedShape, setSelectedShape] = useState<MasterPlanShapeData | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertySummary | null>(null);

  // Mode and Tools
  const [editorMode, setEditorMode] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showReserveModal, setShowReserveModal] = useState<boolean>(false);
  const [showAddPhaseModal, setShowAddPhaseModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showRoadModal, setShowRoadModal] = useState<boolean>(false);
  const [showAmenityModal, setShowAmenityModal] = useState<boolean>(false);
  const [showInsertInfoModal, setShowInsertInfoModal] = useState<boolean>(false);

  // Loading & Notifications
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // 1. Load Projects
  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await api.get('/projects');
        setProjects(data || []);
        if (data && data.length > 0) {
          const target = selectedProjectId || data[0].id;
          setActiveProjectId(target);
        } else {
          setActiveProjectId('');
          setAssets([]);
          setActiveAsset(null);
          setShapes([]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    }
    loadProjects();
  }, [selectedProjectId]);

  // 2. Load Assets for active project
  const loadAssets = useCallback(async (projId: string, preferAssetId?: string) => {
    if (!projId) return;
    try {
      setLoading(true);
      const assetList: MasterPlanAssetData[] = await api.get(`/master-plan/project/${projId}/assets`);
      setAssets(assetList || []);
      if (assetList && assetList.length > 0) {
        const target = preferAssetId && assetList.some((a) => a.id === preferAssetId)
          ? preferAssetId
          : assetList[0].id;
        setActiveAssetId(target);
      } else {
        setActiveAssetId('');
        setActiveAsset(null);
        setShapes([]);
      }
    } catch (err) {
      console.error('Failed to load project assets', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      loadAssets(activeProjectId);
    }
  }, [activeProjectId, loadAssets]);

  // 3. Load active Master Plan Asset & Shapes
  const loadActiveAsset = useCallback(async (assetId: string) => {
    if (!assetId) return;
    try {
      setLoading(true);
      const data: MasterPlanAssetData = await api.get(`/master-plan/assets/${assetId}`);
      setActiveAsset(data);
      setShapes(data.shapes || []);
      setSelectedShape(null);
      setSelectedProperty(null);
    } catch (err) {
      console.error('Failed to load active master plan asset', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeAssetId) {
      loadActiveAsset(activeAssetId);
    }
  }, [activeAssetId, loadActiveAsset]);

  // 4. Real-time WebSocket listener for property status updates
  useEffect(() => {
    if (!socket) return;

    const handlePropertyUpdated = (event: any) => {
      if (event.projectId === activeProjectId) {
        setShapes((prevShapes) =>
          prevShapes.map((s) => {
            if (s.propertyId === event.propertyId) {
              const newColor =
                event.status === 'AVAILABLE'
                  ? '#10b981'
                  : event.status === 'RESERVED'
                  ? '#f59e0b'
                  : event.status === 'INSTALLMENT'
                  ? '#3b82f6'
                  : '#ef4444';
              return {
                ...s,
                status: event.status,
                colorCode: newColor,
                property: s.property ? { ...s.property, status: event.status } : s.property,
              };
            }
            return s;
          }),
        );

        if (selectedShape && selectedShape.propertyId === event.propertyId) {
          setSelectedShape((prev) =>
            prev ? { ...prev, status: event.status, property: prev.property ? { ...prev.property, status: event.status } : prev.property } : prev,
          );
        }
        if (selectedProperty && selectedProperty.id === event.propertyId) {
          setSelectedProperty((prev) => (prev ? { ...prev, status: event.status } : prev));
        }
      }
    };

    socket.on('property_status_changed', handlePropertyUpdated);
    return () => {
      socket.off('property_status_changed', handlePropertyUpdated);
    };
  }, [socket, activeProjectId, selectedShape, selectedProperty]);

  // Handle shape selection on canvas - ALWAYS sets selectedShape & property
  const handleSelectShape = (shape: MasterPlanShapeData | null) => {
    setSelectedShape(shape);
    setSelectedProperty(shape?.property || null);
  };

  // Create shape from canvas drawing
  const handleCreateShape = async (newShapeData: {
    coordinates: string;
    shapeType: string;
    label: string;
    colorCode?: string;
    status?: string;
  }) => {
    if (!activeAssetId) return;
    try {
      const created = await api.post(`/master-plan/assets/${activeAssetId}/shapes`, {
        ...newShapeData,
        status: newShapeData.status || 'AVAILABLE',
      });
      setShapes((prev) => [...prev, created]);
      setSelectedShape(created);
      setSelectedProperty(created.property || null);
      showToast(`${newShapeData.label} added to master plan`);
    } catch (err: any) {
      console.error('Failed to create shape', err);
    }
  };

  // Update shape handler
  const handleUpdateShape = (updatedShape: MasterPlanShapeData) => {
    setShapes((prev) => prev.map((s) => (s.id === updatedShape.id ? updatedShape : s)));
    setSelectedShape(updatedShape);
    setSelectedProperty(updatedShape.property || null);
    showToast('Plot details saved');
  };

  // Delete shape handler
  const handleDeleteShape = (shapeId: string) => {
    setShapes((prev) => prev.filter((s) => s.id !== shapeId));
    setSelectedShape(null);
    setSelectedProperty(null);
    showToast('Plot deleted');
  };

  // Auto-generate layout generator
  const handleGenerateDemo = async () => {
    if (!activeAssetId) return;
    try {
      setLoading(true);
      const res = await api.post(`/master-plan/assets/${activeAssetId}/generate-demo`);
      showToast(res.message || 'Auto-layout plots generated successfully');
      await loadActiveAsset(activeAssetId);
    } catch (err: any) {
      console.error('Failed to generate demo layout', err);
    } finally {
      setLoading(false);
    }
  };

  // Toast notification helper
  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Delete current phase / sheet
  const handleDeletePhase = async () => {
    if (!activeAssetId || assets.length <= 1) return;
    if (!window.confirm(`Are you sure you want to delete this sheet: "${activeAsset?.title}"?`)) {
      return;
    }
    try {
      setLoading(true);
      await api.delete(`/master-plan/assets/${activeAssetId}`);
      showToast('Phase sheet removed');
      await loadAssets(activeProjectId);
    } catch (err: any) {
      console.error('Failed to delete asset', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter shapes
  const filteredShapes = shapes.filter((shape) => {
    if (filterStatus === 'ALL') return true;
    return shape.status === filterStatus;
  });

  // Plot count badges
  const availableCount = shapes.filter((s) => s.status === 'AVAILABLE').length;
  const reservedCount = shapes.filter((s) => s.status === 'RESERVED').length;
  const installmentCount = shapes.filter((s) => s.status === 'INSTALLMENT').length;
  const soldCount = shapes.filter((s) => s.status === 'SOLD').length;

  return (
    <div className="space-y-5">
      {/* Action Toast */}
      {actionSuccessMsg && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-5 h-5 text-slate-950" />
          <span className="text-xs">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl glass-panel">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>{t('masterPlan.title')}</span>
            </h1>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
              Site Studio 2.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t('masterPlan.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Switcher */}
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-800">
            <Building className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900">
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search Unit Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('masterPlan.searchUnit')}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-2xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 md:w-56 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mode Switcher */}
          <button
            onClick={() => {
              setEditorMode(!editorMode);
            }}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 border shadow-lg ${
              editorMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {editorMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{editorMode ? t('masterPlan.editMode') : t('masterPlan.viewMode')}</span>
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            {i18n.language === 'km' ? 'មិនទាន់មានគម្រោងអភិវឌ្ឍន៍នៅឡើយទេ' : 'No Projects Found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {i18n.language === 'km'
              ? 'ដើម្បីចាប់ផ្ដើមរចនាប្លង់មេ Master Plan សូមបង្កើតគម្រោងអចលនទ្រព្យថ្មីមួយជាមុនសិន។'
              : 'To begin designing an interactive master plan, please create a real estate project first.'}
          </p>
          <RouterLink
            to="/projects"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{i18n.language === 'km' ? '+ បង្កើតគម្រោងថ្មី' : '+ Create New Project'}</span>
          </RouterLink>
        </div>
      ) : (
        <>
        {/* Phase / Sheet Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 font-sans">
        {/* Phase Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 flex items-center space-x-1 shrink-0 mr-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('masterPlan.phasesAndSheets')}</span>
          </span>
          {assets.map((ast) => {
            const isActive = ast.id === activeAssetId;
            return (
              <button
                key={ast.id}
                onClick={() => setActiveAssetId(ast.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-2 border ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                }`}
              >
                <span>{ast.title}</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full font-mono text-slate-300">
                  {ast._count?.shapes || (ast.shapes ? ast.shapes.length : 0)}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setShowAddPhaseModal(true)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition flex items-center space-x-1 text-xs shrink-0 px-2.5 font-semibold"
            title={t('masterPlan.addPhase')}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('masterPlan.addPhase')}</span>
          </button>
        </div>

        {/* Master Plan Customization Actions */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap">
          {/* Add Road Button */}
          {activeAsset && (
            <button
              onClick={() => setShowRoadModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t('masterPlan.addRoad')}</span>
            </button>
          )}

          {/* Add Amenity Button */}
          {activeAsset && (
            <button
              onClick={() => setShowAmenityModal(true)}
              className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <Trees className="w-3.5 h-3.5" />
              <span>{t('masterPlan.addAmenity')}</span>
            </button>
          )}

          {/* Auto-Layout Plots */}
          <button
            onClick={handleGenerateDemo}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('masterPlan.generateDemo')}</span>
          </button>

          {/* Upload SVG Blueprint */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('masterPlan.uploadSvg')}</span>
          </button>

          {/* Delete Sheet */}
          {assets.length > 1 && (
            <button
              onClick={handleDeletePhase}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
              title={t('masterPlan.deletePhase')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editor Toolbar (When editorMode is active) */}
      {editorMode && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5 mr-1 font-sans">
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('masterPlan.drawTools')}</span>
            </span>

            {/* Select Tool */}
            <button
              onClick={() => setActiveTool('select')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border ${
                activeTool === 'select'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>{t('masterPlan.selectPlot')}</span>
            </button>

            {/* Draw Plot */}
            <button
              onClick={() => setActiveTool('drawRect')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border ${
                activeTool === 'drawRect'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Square className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('masterPlan.drawPlot')}</span>
            </button>

            {/* Draw Road */}
            <button
              onClick={() => setActiveTool('drawRoad')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border ${
                activeTool === 'drawRoad'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('masterPlan.drawRoadTool')}</span>
            </button>

            {/* Draw Park */}
            <button
              onClick={() => setActiveTool('drawPark')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border ${
                activeTool === 'drawPark'
                  ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Trees className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('masterPlan.drawParkTool')}</span>
            </button>

            {/* Draw Lake / Water */}
            <button
              onClick={() => setActiveTool('drawWater')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border ${
                activeTool === 'drawWater'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('masterPlan.drawWaterTool')}</span>
            </button>

            {/* Draw Amenity */}
            <button
              onClick={() => setActiveTool('drawAmenity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border ${
                activeTool === 'drawAmenity'
                  ? 'bg-slate-200 text-slate-950 border-white font-bold shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-slate-300" />
              <span>{t('masterPlan.drawAmenityTool')}</span>
            </button>

            {/* Draw Polygon */}
            <button
              onClick={() => setActiveTool('drawPolygon')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border ${
                activeTool === 'drawPolygon'
                  ? 'bg-blue-500 text-white border-blue-400 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Pentagon className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('masterPlan.drawPolygon')}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-sans">
            {activeTool === 'drawRoad' && t('masterPlan.hints.drawRoad')}
            {activeTool === 'drawPark' && t('masterPlan.hints.drawPark')}
            {activeTool === 'drawWater' && t('masterPlan.hints.drawWater')}
            {activeTool === 'drawAmenity' && t('masterPlan.hints.drawAmenity')}
            {activeTool === 'drawRect' && t('masterPlan.hints.drawRect')}
            {activeTool === 'drawPolygon' && t('masterPlan.hints.drawPolygon')}
            {activeTool === 'select' && t('masterPlan.hints.select')}
          </div>
        </div>
      )}

      {/* Filter Status Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition ${
            filterStatus === 'ALL'
              ? 'bg-slate-700 text-white shadow'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          {t('masterPlan.allPlots')} ({shapes.length})
        </button>

        <button
          onClick={() => setFilterStatus('AVAILABLE')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center space-x-1.5 ${
            filterStatus === 'AVAILABLE'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/60 text-emerald-400 hover:bg-emerald-500/10 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{t('masterPlan.available')}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/20">({availableCount})</span>
        </button>

        <button
          onClick={() => setFilterStatus('RESERVED')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center space-x-1.5 ${
            filterStatus === 'RESERVED'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'bg-slate-900/60 text-amber-400 hover:bg-amber-500/10 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{t('masterPlan.reserved')}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/20">({reservedCount})</span>
        </button>

        <button
          onClick={() => setFilterStatus('INSTALLMENT')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center space-x-1.5 ${
            filterStatus === 'INSTALLMENT'
              ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20'
              : 'bg-slate-900/60 text-blue-400 hover:bg-blue-500/10 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>{t('masterPlan.installment')}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/20">({installmentCount})</span>
        </button>

        <button
          onClick={() => setFilterStatus('SOLD')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center space-x-1.5 ${
            filterStatus === 'SOLD'
              ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20'
              : 'bg-slate-900/60 text-rose-400 hover:bg-rose-500/10 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>{t('masterPlan.sold')}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-black/20">({soldCount})</span>
        </button>
      </div>

      {/* Main Interactive Canvas Container */}
      <div className="relative">
        {loading ? (
          <div className="w-full h-[640px] rounded-3xl glass-panel border border-slate-800 bg-slate-950 flex flex-col items-center justify-center space-y-3 text-emerald-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading interactive site plan geometry...</span>
          </div>
        ) : activeAsset ? (
          <MasterPlanCanvas
            asset={activeAsset}
            shapes={filteredShapes}
            selectedShape={selectedShape}
            onSelectShape={handleSelectShape}
            editorMode={editorMode}
            activeTool={activeTool}
            onCreateShape={handleCreateShape}
            searchQuery={searchQuery}
          />
        ) : (
          <div className="w-full h-[640px] rounded-3xl glass-panel border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <Building className="w-12 h-12 opacity-50" />
            <p className="text-sm font-semibold">No master plan asset found for this project</p>
            <button
              onClick={() => setShowAddPhaseModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Create Master Plan Sheet
            </button>
          </div>
        )}

        {/* ALWAYS Show Plot & Unit Inspector Drawer whenever ANY shape is clicked */}
        {selectedShape && (
          <div className="absolute top-4 right-4 w-88 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-3xl shadow-2xl p-5 z-20 animate-in fade-in slide-in-from-right duration-200 flex flex-col max-h-[92%] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20">
                    {selectedProperty?.code || selectedShape.label || 'PLOT'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    {selectedProperty?.propertyType || selectedShape.shapeType || 'PLOT'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">
                  {selectedProperty?.title || selectedShape.label}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedShape(null);
                  setSelectedProperty(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action: Insert / Edit Info Button */}
            <div className="py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Specifications & Data:</span>
              <button
                onClick={() => setShowInsertInfoModal(true)}
                className="px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t('masterPlan.insertInfo')}</span>
              </button>
            </div>

            {/* Detailed Info Section */}
            <div className="py-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                    selectedShape.status === 'AVAILABLE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : selectedShape.status === 'RESERVED'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : selectedShape.status === 'INSTALLMENT'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : selectedShape.status === 'SOLD'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}
                >
                  {selectedShape.status}
                </span>
              </div>

              {selectedProperty ? (
                <>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Land Area</span>
                    <span className="font-semibold text-white">{selectedProperty.landArea} m²</span>
                  </div>

                  {selectedProperty.buildingArea > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Building Area</span>
                      <span className="font-semibold text-white">{selectedProperty.buildingArea} m²</span>
                    </div>
                  )}

                  {selectedProperty.bedrooms > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Bedrooms / Baths</span>
                      <span className="font-semibold text-white">
                        {selectedProperty.bedrooms} Beds / {selectedProperty.bathrooms} Baths
                      </span>
                    </div>
                  )}

                  {selectedProperty.facingDirection && (
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Facing</span>
                      <span className="font-semibold text-white">{selectedProperty.facingDirection}</span>
                    </div>
                  )}

                  {selectedProperty.block && (
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-500">Block / Zone</span>
                      <span className="font-semibold text-white">
                        {selectedProperty.block} {selectedProperty.zone ? `• ${selectedProperty.zone}` : ''}
                      </span>
                    </div>
                  )}

                  {selectedProperty.notes && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Notes:</span>
                      {selectedProperty.notes}
                    </div>
                  )}

                  {/* Price Banner */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 font-medium">Selling Price (USD)</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        {formatCurrency(selectedProperty.sellingPrice, Currency.USD)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-[11px] text-slate-500 mt-0.5">
                      <span>Approx (KHR)</span>
                      <span className="font-mono">
                        {formatCurrency(Number(selectedProperty.sellingPrice) * 4100, Currency.KHR)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (() => {
                const isRoad =
                  selectedShape.shapeType === 'road' ||
                  selectedShape.shapeType === 'boulevard' ||
                  selectedShape.shapeType === 'street' ||
                  selectedShape.shapeType === 'alley';

                const isAmenityOrPark =
                  selectedShape.shapeType === 'park' ||
                  selectedShape.shapeType === 'water' ||
                  selectedShape.shapeType === 'amenity' ||
                  selectedShape.shapeType === 'pool' ||
                  selectedShape.shapeType === 'clubhouse';

                const nums = selectedShape.coordinates.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
                const xs = nums.filter((_, i) => i % 2 === 0);
                const ys = nums.filter((_, i) => i % 2 === 1);
                const w = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
                const h = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
                const isVert = h > w;
                const roadLength = Math.round((isVert ? h : w) / 10);
                const roadWidth = Math.round((isVert ? w : h) / 10);

                if (isRoad) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Road Class</span>
                        <span className="font-bold text-amber-400 uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {selectedShape.shapeType}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-300">
                        <span className="text-slate-500">Orientation</span>
                        <span className="font-semibold text-white">
                          {isVert ? 'Portrait (North-South)' : 'Landscape (East-West)'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-300">
                        <span className="text-slate-500">Dimensions</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {roadLength}m length × {roadWidth}m width
                        </span>
                      </div>
                      <button
                        onClick={() => setShowInsertInfoModal(true)}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow flex items-center justify-center space-x-1.5 transition font-sans"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t('masterPlan.editRoadDetails')}</span>
                      </button>
                    </div>
                  );
                }

                if (isAmenityOrPark) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-sans">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">{t('common.details')}</span>
                        <span className="font-bold text-emerald-400 uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {selectedShape.shapeType}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowInsertInfoModal(true)}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow flex items-center justify-center space-x-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t('masterPlan.editFacilityDetails')}</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-sans">
                    <p className="text-[11px] text-slate-400">
                      {t('masterPlan.noSpecsNotice')}
                    </p>
                    <button
                      onClick={() => setShowInsertInfoModal(true)}
                      className="w-full py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('masterPlan.insertSpecsPrice')}</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2 font-sans">
              {selectedShape.status === 'AVAILABLE' && selectedProperty && (
                <button
                  onClick={() => setShowReserveModal(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-1.5 transition"
                >
                  <span>{t('masterPlan.reserveUnit')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {selectedProperty && (
                <button
                  onClick={() => (window.location.href = `/properties?id=${selectedProperty.id}`)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
                >
                  {t('masterPlan.viewFullInventorySpecs')}
                </button>
              )}

              {editorMode && (
                <button
                  onClick={async () => {
                    if (window.confirm(`Delete shape "${selectedShape.label}"?`)) {
                      await api.delete(`/master-plan/shapes/${selectedShape.id}`);
                      handleDeleteShape(selectedShape.id);
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 transition flex items-center justify-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('masterPlan.deleteShape')}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Direct Quick Reservation Modal */}
      {showReserveModal && selectedProperty && (
        <QuickReservationModal
          property={selectedProperty}
          projectId={activeProjectId}
          onClose={() => setShowReserveModal(false)}
          onSuccess={(booking) => {
            setShapes((prev) =>
              prev.map((s) =>
                s.propertyId === selectedProperty.id
                  ? { ...s, status: 'RESERVED', colorCode: '#f59e0b' }
                  : s,
              ),
            );
            if (selectedShape) {
              setSelectedShape((prev) =>
                prev ? { ...prev, status: 'RESERVED', colorCode: '#f59e0b' } : null,
              );
            }
            setSelectedProperty((prev) => (prev ? { ...prev, status: 'RESERVED' } : null));
            showToast(`Unit ${selectedProperty.code} reserved! Reference: ${booking.bookingReference}`);
          }}
        />
      )}

      {/* Insert / Edit Plot Info Modal */}
      {showInsertInfoModal && selectedShape && (
        <InsertPlotInfoModal
          shape={selectedShape}
          projectId={activeProjectId}
          onClose={() => setShowInsertInfoModal(false)}
          onUpdated={(updated) => {
            handleUpdateShape(updated);
          }}
        />
      )}

      {/* Add Road Modal */}
      {showRoadModal && activeAsset && (
        <AddRoadModal
          asset={activeAsset}
          onClose={() => setShowRoadModal(false)}
          onCreated={(newRoad) => {
            setShapes((prev) => [...prev, newRoad]);
            setSelectedShape(newRoad);
            setSelectedProperty(null);
            showToast(`Road "${newRoad.label}" added to site plan`);
          }}
        />
      )}

      </>
      )}

      {/* Add Amenity Modal */}
      {showAmenityModal && activeAsset && (
        <AddAmenityModal
          asset={activeAsset}
          onClose={() => setShowAmenityModal(false)}
          onCreated={(newAmenity) => {
            setShapes((prev) => [...prev, newAmenity]);
            setSelectedShape(newAmenity);
            setSelectedProperty(null);
            showToast(`Amenity "${newAmenity.label}" added to site plan`);
          }}
        />
      )}

      {/* Add Phase Sheet Modal */}
      {showAddPhaseModal && (
        <AddPhaseModal
          projectId={activeProjectId}
          onClose={() => setShowAddPhaseModal(false)}
          onCreated={(newAsset) => {
            loadAssets(activeProjectId, newAsset.id);
            showToast(`Phase "${newAsset.title}" created successfully!`);
          }}
        />
      )}

      {/* Upload Blueprint SVG Modal */}
      {showUploadModal && activeAssetId && (
        <UploadBlueprintModal
          assetId={activeAssetId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newSvg) => {
            setActiveAsset((prev) => (prev ? { ...prev, svgContent: newSvg } : null));
            showToast('Blueprint SVG updated successfully');
          }}
        />
      )}
    </div>
  );
};
