import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, Currency } from '@rfm/shared';
import {
  Home,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Edit,
  Tag,
  CheckCircle,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const Properties: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { selectedProjectId, hasPermission } = useAuth();

  const [properties, setProperties] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Filters
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState(selectedProjectId || '');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Modals
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Property Form State
  const [formData, setFormData] = useState({
    projectId: '',
    code: '',
    unitNumber: '',
    block: '',
    zone: '',
    propertyType: 'LAND_PLOT',
    title: '',
    landArea: 100,
    buildingArea: 0,
    bedrooms: 0,
    bathrooms: 0,
    listingPrice: 100000,
    sellingPrice: 95000,
    reservationAmount: 2000,
  });

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await api.get('/properties', {
        projectId: filterProject || undefined,
        status: filterStatus || undefined,
        propertyType: filterType || undefined,
        search: search || undefined,
      });
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const prjs = await api.get('/projects');
        setProjects(prjs);
        if (prjs.length > 0 && !formData.projectId) {
          setFormData((f) => ({ ...f, projectId: prjs[0].id }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  useEffect(() => {
    loadProperties();
  }, [filterProject, filterStatus, filterType, search]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/properties', formData);
      setShowCreateModal(false);
      loadProperties();
    } catch (err: any) {
      alert(err.message || 'Failed to create property');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showStatusModal || !newStatus) return;
    setActionLoading(true);
    try {
      await api.patch(`/properties/${showStatusModal.id}/status`, {
        status: newStatus,
        reason: statusReason,
      });
      setShowStatusModal(null);
      loadProperties();
    } catch (err: any) {
      alert(err.message || 'Status transition error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
            <Home className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.properties')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real estate inventory matrix across projects, villas, land plots, and condominiums
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {hasPermission('properties.create') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Property Unit</span>
            </button>
          )}

          {/* Grid/Table View Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl glass-panel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, title, unit..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Project Filter */}
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="RESERVED">RESERVED</option>
          <option value="INSTALLMENT">INSTALLMENT</option>
          <option value="SOLD">SOLD</option>
          <option value="UNDER_DEVELOPMENT">UNDER DEVELOPMENT</option>
        </select>

        {/* Property Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        >
          <option value="">All Property Types</option>
          <option value="LAND_PLOT">Land Plot</option>
          <option value="VILLA_SINGLE">Single Villa</option>
          <option value="VILLA_TWIN">Twin Villa</option>
          <option value="SHOPHOUSE">Shophouse</option>
          <option value="TOWNHOUSE">Townhouse</option>
          <option value="CONDO_STUDIO">Studio Condo</option>
        </select>
      </div>

      {/* Main Inventory Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-emerald-400">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading inventory...</span>
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center p-12 glass-panel rounded-2xl text-slate-500">
          <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold">No properties matched the filter criteria</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Code / Unit</th>
                  <th className="py-3.5 px-4">Title & Type</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Area (Land/Bldg)</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {p.code}
                      {p.unitNumber && <span className="text-slate-500 block text-[10px]">{p.unitNumber}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{p.title}</span>
                      <span className="text-[10px] text-slate-400">{p.propertyType}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{p.project?.name || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {p.landArea} m² {p.buildingArea > 0 && ` / ${p.buildingArea} m²`}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {formatCurrency(p.sellingPrice, Currency.USD)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'AVAILABLE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : p.status === 'RESERVED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : p.status === 'INSTALLMENT'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedProperty(p)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {hasPermission('properties.update') && (
                        <button
                          onClick={() => {
                            setShowStatusModal(p);
                            setNewStatus(p.status === 'AVAILABLE' ? 'RESERVED' : 'AVAILABLE');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 transition"
                          title="Change status"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p.id} className="glass-panel rounded-2xl p-5 hover:border-slate-700 transition">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {p.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    p.status === 'AVAILABLE'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : p.status === 'RESERVED'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-2">{p.title}</h3>
              <p className="text-[11px] text-slate-400">{p.project?.name}</p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Area: {p.landArea} m²</span>
                <span className="font-extrabold text-emerald-400">
                  {formatCurrency(p.sellingPrice, Currency.USD)}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedProperty(p)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition text-center"
                >
                  Inspect Unit
                </button>
                {p.status === 'AVAILABLE' && (
                  <button
                    onClick={() => (window.location.href = `/sales/bookings?propertyId=${p.id}`)}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition text-center"
                  >
                    Reserve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Property Details Drawer/Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {selectedProperty.code}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">{selectedProperty.title}</h2>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Property Type</span>
                <span className="font-semibold text-slate-200">{selectedProperty.propertyType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Unit / Block</span>
                <span className="font-semibold text-slate-200">
                  {selectedProperty.unitNumber || '—'} / {selectedProperty.block || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Land Area</span>
                <span className="font-semibold text-slate-200">{selectedProperty.landArea} m²</span>
              </div>
              <div>
                <span className="text-slate-500 block">Building Area</span>
                <span className="font-semibold text-slate-200">{selectedProperty.buildingArea} m²</span>
              </div>
              <div>
                <span className="text-slate-500 block">Bedrooms / Baths</span>
                <span className="font-semibold text-slate-200">
                  {selectedProperty.bedrooms} Beds / {selectedProperty.bathrooms} Baths
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Facing Direction</span>
                <span className="font-semibold text-slate-200">{selectedProperty.facingDirection || 'EAST'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Listing Price</span>
                <span className="font-semibold text-slate-200">
                  {formatCurrency(selectedProperty.listingPrice, Currency.USD)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Approved Selling Price</span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(selectedProperty.sellingPrice, Currency.USD)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedProperty(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition"
              >
                Close
              </button>
              {selectedProperty.status === 'AVAILABLE' && (
                <button
                  onClick={() => (window.location.href = `/sales/bookings?propertyId=${selectedProperty.id}`)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                >
                  Proceed to Reservation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateStatus}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white mb-2">
              Transition Status: {showStatusModal.code}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current status: <span className="font-bold text-emerald-400">{showStatusModal.status}</span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">New Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="UNDER_DEVELOPMENT">UNDER DEVELOPMENT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason / Remarks</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Reason for status change..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                {actionLoading ? 'Saving...' : 'Confirm Transition'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Property Unit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProperty}
            className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Create New Property Unit</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-300 font-medium mb-1">Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-300 font-medium mb-1">Property Code (Unique)</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. GMR-V04"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Property Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Deluxe Riverside Villa V-04"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Property Type</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  <option value="LAND_PLOT">Land Plot</option>
                  <option value="VILLA_SINGLE">Single Villa</option>
                  <option value="VILLA_TWIN">Twin Villa</option>
                  <option value="SHOPHOUSE">Shophouse</option>
                  <option value="TOWNHOUSE">Townhouse</option>
                  <option value="CONDO_STUDIO">Studio Condo</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Unit / Block</label>
                <input
                  type="text"
                  value={formData.unitNumber}
                  onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                  placeholder="e.g. V-04 / Block A"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Land Area (m²)</label>
                <input
                  type="number"
                  value={formData.landArea}
                  onChange={(e) => setFormData({ ...formData, landArea: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Building Area (m²)</label>
                <input
                  type="number"
                  value={formData.buildingArea}
                  onChange={(e) => setFormData({ ...formData, buildingArea: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Bedrooms / Baths</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                    placeholder="Beds"
                    className="w-1/2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  />
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                    placeholder="Baths"
                    className="w-1/2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Approved Selling Price ($)</label>
                <input
                  type="number"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
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
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                {actionLoading ? 'Saving...' : 'Create Unit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
