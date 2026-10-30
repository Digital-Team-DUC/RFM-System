import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, Currency } from '@rfm/shared';
import { PropertySummary } from './types';
import {
  X,
  CheckCircle,
  AlertCircle,
  User,
  UserPlus,
  DollarSign,
  Calendar,
  Building,
  ShieldCheck,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface QuickReservationModalProps {
  property: PropertySummary;
  projectId: string;
  onClose: () => void;
  onSuccess: (booking: any) => void;
}

export const QuickReservationModal: React.FC<QuickReservationModalProps> = ({
  property,
  projectId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Form State
  const [customerId, setCustomerId] = useState<string>('');
  const [agentId, setAgentId] = useState<string>(user?.id || '');
  const [sellingPrice, setSellingPrice] = useState<number>(Number(property.sellingPrice) || 0);
  const [discount, setDiscount] = useState<number>(0);
  const [bookingFee, setBookingFee] = useState<number>(2000);
  const [expiryDays, setExpiryDays] = useState<number>(14);
  const [notes, setNotes] = useState<string>('');

  // Inline Quick Add Customer
  const [showAddCustomer, setShowAddCustomer] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [newCustIdCard, setNewCustIdCard] = useState<string>('');
  const [creatingCust, setCreatingCust] = useState<boolean>(false);

  // Status
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  // Load Customers & Agents
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [custRes, agentRes] = await Promise.all([
          api.get('/crm/customers'),
          api.get('/commissions/agents').catch(() => []),
        ]);
        setCustomers(custRes || []);
        if (custRes && custRes.length > 0) {
          setCustomerId(custRes[0].id);
        }
        setAgents(agentRes || []);
      } catch (err: any) {
        console.error('Failed to load customers or agents', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  // Quick Add Customer Handler
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setErrorMsg('Customer name and phone number are required');
      return;
    }

    try {
      setCreatingCust(true);
      setErrorMsg('');
      const created = await api.post('/crm/customers', {
        fullName: newCustName.trim(),
        phone: newCustPhone.trim(),
        email: newCustEmail.trim() || undefined,
        nationalId: newCustIdCard.trim() || undefined,
        customerType: 'INDIVIDUAL',
        assignedAgentId: agentId || undefined,
      });

      setCustomers((prev) => [created, ...prev]);
      setCustomerId(created.id);
      setShowAddCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustIdCard('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create customer');
    } finally {
      setCreatingCust(false);
    }
  };

  // Submit Reservation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMsg('Please select or create a customer');
      return;
    }

    const netPrice = sellingPrice - discount;
    if (netPrice <= 0) {
      setErrorMsg('Net selling price must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const booking = await api.post('/bookings', {
        customerId,
        propertyId: property.id,
        projectId,
        agentId: agentId || user?.id,
        sellingPrice,
        discount,
        bookingFee,
        depositRequired: bookingFee,
        expiryDays,
        notes: notes.trim() || `Instant reservation from Master Plan interactive plot layout.`,
      });

      setCreatedBooking(booking);
      onSuccess(booking);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reserve property. It might have already been reserved.');
    } finally {
      setSubmitting(false);
    }
  };

  const netPrice = Math.max(0, sellingPrice - discount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2 font-sans">
                <span>{t('masterPlan.quickReserveTitle')}</span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                {t('masterPlan.quickReserveSubtitle')}
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

        {/* Success Confirmation Screen */}
        {createdBooking ? (
          <div className="p-8 flex flex-col items-center text-center space-y-4 font-sans">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{t('masterPlan.unitReservedSuccess')}</h3>
              <p className="text-sm text-slate-400 mt-1">
                Property <span className="text-emerald-400 font-bold">{property.code}</span> {t('masterPlan.unitLockedNotice')}.
              </p>
            </div>

            <div className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('masterPlan.bookingReference')}</span>
                <span className="text-emerald-400 font-bold font-mono">{createdBooking.bookingReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('masterPlan.customerLabel')}</span>
                <span className="text-white font-semibold">
                  {createdBooking.customer?.fullName || 'Assigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('masterPlan.agreedPriceLabel')}</span>
                <span className="text-white font-mono">{formatCurrency(netPrice, Currency.USD)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('masterPlan.depositDueLabel')}</span>
                <span className="text-amber-400 font-bold font-mono">
                  {formatCurrency(bookingFee, Currency.USD)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('masterPlan.expiryDate')}</span>
                <span className="text-slate-300 font-mono">
                  {new Date(createdBooking.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex w-full gap-3 pt-2">
              <button
                onClick={() => (window.location.href = `/sales/bookings`)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center justify-center space-x-1.5"
              >
                <span>{t('nav.bookings')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              >
                {t('actions.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Property Summary Pill */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                    {property.code}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{property.propertyType}</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{property.title}</h4>
                <div className="text-[11px] text-slate-400 mt-0.5 flex gap-3">
                  <span>Land: {property.landArea} m²</span>
                  {property.buildingArea > 0 && <span>Building: {property.buildingArea} m²</span>}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Listing Price</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {formatCurrency(property.sellingPrice, Currency.USD)}
                </span>
              </div>
            </div>

            {/* Customer Picker with Quick Add toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('masterPlan.selectCustomer')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showAddCustomer ? 'Cancel' : t('masterPlan.newCustomer')}</span>
                </button>
              </div>

              {/* Inline Quick Add Customer Form */}
              {showAddCustomer ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 animate-in fade-in">
                  <h5 className="text-xs font-bold text-emerald-400">Quick Create Customer</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        placeholder="e.g. Sokha Meng"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        placeholder="e.g. 012 888 999"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        placeholder="customer@gmail.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        National ID / Passport
                      </label>
                      <input
                        type="text"
                        value={newCustIdCard}
                        onChange={(e) => setNewCustIdCard(e.target.value)}
                        placeholder="ID number"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleCreateCustomer}
                      disabled={creatingCust}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50"
                    >
                      {creatingCust ? 'Creating...' : 'Save Customer & Select'}
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone || c.email || 'No contact'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sales Agent */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                {t('masterPlan.salesAgent')}
              </label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value={user?.id || ''}>{user?.fullName} (Current User)</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} ({a.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">{t('masterPlan.agreedPrice')} ($)</label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{t('masterPlan.discount')} ($)</label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Deposit & Expiry */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  {t('masterPlan.bookingFee')} ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={bookingFee}
                    onChange={(e) => setBookingFee(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{t('masterPlan.expiryDays')}</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Special Terms or Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Client requested North-facing orientation..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Net Amount Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Net Contract Consideration:</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {formatCurrency(netPrice, Currency.USD)}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{submitting ? 'Locking...' : t('masterPlan.confirmReservation')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
