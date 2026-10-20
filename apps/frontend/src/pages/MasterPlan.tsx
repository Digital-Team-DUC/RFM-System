import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatCurrency, Currency } from '@rfm/shared';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle,
  Clock,
  CreditCard,
  Building,
  Home,
  X,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const MasterPlan: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { selectedProjectId } = useAuth();
  const { socket } = useSocket();

  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [masterPlanData, setMasterPlanData] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [zoom, setZoom] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Load Projects
  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await api.get('/projects');
        setProjects(data);
        if (data.length > 0) {
          const target = selectedProjectId || data[0].id;
          setActiveProjectId(target);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProjects();
  }, [selectedProjectId]);

  // Load Master Plan when activeProjectId changes
  useEffect(() => {
    async function loadMasterPlan() {
      if (!activeProjectId) return;
      setLoading(true);
      try {
        const data = await api.get(`/master-plan/project/${activeProjectId}`);
        setMasterPlanData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMasterPlan();
  }, [activeProjectId]);

  // Real-time listener for property status change
  useEffect(() => {
    if (!socket) return;

    const handlePropertyUpdated = (event: any) => {
      if (masterPlanData && event.projectId === activeProjectId) {
        setMasterPlanData((prev: any) => {
          if (!prev) return prev;
          const updatedShapes = prev.shapes.map((s: any) => {
            if (s.propertyId === event.propertyId) {
              return {
                ...s,
                status: event.status,
                colorCode:
                  event.status === 'AVAILABLE'
                    ? '#10b981'
                    : event.status === 'RESERVED'
                    ? '#f59e0b'
                    : event.status === 'INSTALLMENT'
                    ? '#3b82f6'
                    : '#ef4444',
                property: s.property ? { ...s.property, status: event.status } : s.property,
              };
            }
            return s;
          });
          return { ...prev, shapes: updatedShapes };
        });

        // Also update selected property drawer if open
        if (selectedProperty && selectedProperty.id === event.propertyId) {
          setSelectedProperty((prev: any) => ({ ...prev, status: event.status }));
        }
      }
    };

    socket.on('property_status_changed', handlePropertyUpdated);
    return () => {
      socket.off('property_status_changed', handlePropertyUpdated);
    };
  }, [socket, activeProjectId, masterPlanData, selectedProperty]);

  const shapes = masterPlanData?.shapes || [];
  const filteredShapes = shapes.filter((shape: any) => {
    if (filterStatus === 'ALL') return true;
    return shape.status === filterStatus;
  });

  const availableCount = shapes.filter((s: any) => s.status === 'AVAILABLE').length;
  const reservedCount = shapes.filter((s: any) => s.status === 'RESERVED').length;
  const installmentCount = shapes.filter((s: any) => s.status === 'INSTALLMENT').length;
  const soldCount = shapes.filter((s: any) => s.status === 'SOLD').length;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>{t('nav.masterPlan')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interactive visual plot picker and site plan layout with live availability
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Switcher */}
          <select
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStatus === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({shapes.length})
            </button>
            <button
              onClick={() => setFilterStatus('AVAILABLE')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStatus === 'AVAILABLE'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              Available ({availableCount})
            </button>
            <button
              onClick={() => setFilterStatus('RESERVED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStatus === 'RESERVED'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              Reserved ({reservedCount})
            </button>
            <button
              onClick={() => setFilterStatus('INSTALLMENT')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStatus === 'INSTALLMENT'
                  ? 'bg-blue-500 text-white font-bold'
                  : 'text-blue-400 hover:bg-blue-500/10'
              }`}
            >
              Installment ({installmentCount})
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas Container */}
      <div className="relative rounded-2xl glass-panel border border-slate-800 overflow-hidden bg-slate-950 min-h-[580px] flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center space-y-3 text-emerald-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading master plan geometry...</span>
          </div>
        ) : shapes.length === 0 ? (
          <div className="text-center p-8 text-slate-500">
            <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No visual site plan uploaded for this project</p>
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-8 transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            {/* SVG Visual Site Plan */}
            <svg
              viewBox="0 0 1000 600"
              className="w-full max-w-4xl h-auto drop-shadow-2xl select-none"
            >
              {/* Site Base Background */}
              <rect x="20" y="20" width="960" height="560" rx="16" fill="#090d16" stroke="#1e293b" strokeWidth="2" />

              {/* Roads & Boulevard Decoration */}
              <path d="M 20 175 L 980 175" stroke="#334155" strokeWidth="24" strokeLinecap="round" />
              <path d="M 20 175 L 980 175" stroke="#fbbf24" strokeWidth="2" strokeDasharray="12 8" />
              <text x="500" y="180" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle" letterSpacing="4">
                MEKONG RIVERSIDE BOULEVARD (MAIN ENTRANCE)
              </text>

              {/* Secondary Street */}
              <path d="M 280 20 L 280 580" stroke="#1e293b" strokeWidth="16" />
              <path d="M 460 20 L 460 580" stroke="#1e293b" strokeWidth="16" />

              {/* Landscape & Green Spaces */}
              <circle cx="850" cy="100" r="45" fill="#064e3b" opacity="0.6" stroke="#059669" strokeWidth="1.5" />
              <text x="850" y="104" fill="#a7f3d0" fontSize="11" textAnchor="middle" fontWeight="bold">Central Park</text>

              {/* Property Shapes */}
              {filteredShapes.map((shape: any) => {
                const isSelected = selectedProperty?.id === shape.propertyId;
                const statusColor =
                  shape.status === 'AVAILABLE'
                    ? '#10b981'
                    : shape.status === 'RESERVED'
                    ? '#f59e0b'
                    : shape.status === 'INSTALLMENT'
                    ? '#3b82f6'
                    : '#ef4444';

                return (
                  <g
                    key={shape.id}
                    onClick={() => setSelectedProperty(shape.property)}
                    className="cursor-pointer transition-all duration-200 group"
                  >
                    <path
                      d={shape.coordinates}
                      fill={statusColor}
                      fillOpacity={isSelected ? 0.9 : 0.65}
                      stroke={isSelected ? '#ffffff' : statusColor}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="hover:fill-opacity-95 transition-all"
                    />
                    {/* Centered Label */}
                    <text
                      x={getShapeCenter(shape.coordinates).x}
                      y={getShapeCenter(shape.coordinates).y}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {shape.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex items-center space-x-4 text-xs font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300">{t('status.available')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-300">{t('status.reserved')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-300">{t('status.installment')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-slate-300">{t('status.sold')}</span>
          </div>
        </div>

        {/* Property Inspector Drawer */}
        {selectedProperty && (
          <div className="absolute top-4 right-4 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-5 z-20 animate-in fade-in slide-in-from-right duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  {selectedProperty.code}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">
                  {selectedProperty.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                    selectedProperty.status === 'AVAILABLE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : selectedProperty.status === 'RESERVED'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : selectedProperty.status === 'INSTALLMENT'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedProperty.status}
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Property Type</span>
                <span className="font-semibold text-white">{selectedProperty.propertyType}</span>
              </div>

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

              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-slate-400 font-medium">Selling Price</span>
                <span className="text-lg font-black text-emerald-400">
                  {formatCurrency(selectedProperty.sellingPrice, Currency.USD)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {selectedProperty.status === 'AVAILABLE' && (
                <button
                  onClick={() => (window.location.href = `/sales/bookings?propertyId=${selectedProperty.id}`)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-1.5 transition"
                >
                  <span>Reserve This Unit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => (window.location.href = `/properties?id=${selectedProperty.id}`)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              >
                View Full Specifications
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper: approximate center point of SVG path for label rendering
function getShapeCenter(coord: string): { x: number; y: number } {
  const nums = coord.match(/\d+(\.\d+)?/g)?.map(Number) || [];
  if (nums.length >= 4) {
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
    const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
    return { x: Math.round(avgX), y: Math.round(avgY) };
  }
  return { x: 100, y: 100 };
}
