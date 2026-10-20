import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, Currency } from '@rfm/shared';
import {
  BookmarkCheck,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';

export const Bookings: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [searchParams] = useSearchParams();

  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState<number>(5000);
  const [depositMethod, setDepositMethod] = useState<string>('KHQR_SCAN');
  const [depositRef, setDepositRef] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    propertyId: searchParams.get('propertyId') || '',
    projectId: '',
    sellingPrice: 100000,
    discount: 0,
    bookingFee: 2000,
    depositRequired: 20000,
    expiryDays: 14,
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, cData, pData] = await Promise.all([
        api.get('/bookings'),
        api.get('/crm/customers'),
        api.get('/properties', { status: 'AVAILABLE' }),
      ]);
      setBookings(bData);
      setCustomers(cData);
      setProperties(pData);

      if (cData.length > 0 && !formData.customerId) {
        setFormData((f) => ({ ...f, customerId: cData[0].id }));
      }
      if (pData.length > 0 && !formData.propertyId) {
        setFormData((f) => ({
          ...f,
          propertyId: pData[0].id,
          projectId: pData[0].projectId,
          sellingPrice: Number(pData[0].sellingPrice),
          depositRequired: Math.round(Number(pData[0].sellingPrice) * 0.1),
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('propertyId')) {
      setShowCreateModal(true);
    }
  }, []);

  const handlePropertySelected = (propId: string) => {
    const prop = properties.find((p) => p.id === propId);
    if (prop) {
      setFormData((f) => ({
        ...f,
        propertyId: propId,
        projectId: prop.projectId,
        sellingPrice: Number(prop.sellingPrice),
        depositRequired: Math.round(Number(prop.sellingPrice) * 0.1),
      }));
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/bookings', formData);
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create reservation');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/approve`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Please specify cancellation reason:');
    if (!reason) return;
    try {
      await api.patch(`/bookings/${id}/cancel`, { reason });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDepositModal) return;
    try {
      await api.post(`/bookings/${showDepositModal.id}/deposits`, {
        amount: depositAmount,
        paymentMethod: depositMethod,
        referenceNumber: depositRef,
      });
      setShowDepositModal(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Deposit recording failed');
    }
  };

  const handleGenerateContract = async (bookingId: string) => {
    if (!confirm('Execute formal sales contract for this reservation?')) return;
    try {
      await api.post(`/contracts/from-booking/${bookingId}`);
      window.location.href = '/sales/contracts';
    } catch (err: any) {
      alert(err.message || 'Contract creation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white flex items-center space-x-2">
            <BookmarkCheck className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.bookings')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Property reservations, deposit verification, and contract handover workflow
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-emerald-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">Booking Fee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {b.bookingReference}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{b.customer?.fullName}</span>
                      <span className="text-[10px] text-slate-500">{b.customer?.phone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{b.property?.code}</span>
                      <span className="text-[10px] text-slate-400">{b.property?.title}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {formatCurrency(b.sellingPrice, Currency.USD)}
                    </td>
                    <td className="py-3 px-4 text-emerald-400">
                      {formatCurrency(b.bookingFee, Currency.USD)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'APPROVED' || b.status === 'DEPOSIT_RECEIVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : b.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : b.status === 'CONTRACTED'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {b.status === 'PENDING_APPROVAL' && hasPermission('bookings.approve') && (
                        <button
                          onClick={() => handleApprove(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold transition text-[11px]"
                        >
                          Approve
                        </button>
                      )}

                      {['APPROVED', 'PENDING_APPROVAL'].includes(b.status) && (
                        <button
                          onClick={() => {
                            setShowDepositModal(b);
                            setDepositAmount(Number(b.bookingFee));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition text-[11px]"
                        >
                          + Deposit
                        </button>
                      )}

                      {b.status === 'DEPOSIT_RECEIVED' && (
                        <button
                          onClick={() => handleGenerateContract(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition text-[11px]"
                        >
                          Generate Contract
                        </button>
                      )}

                      {!['CONTRACTED', 'CANCELLED'].includes(b.status) && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                          title="Cancel Reservation"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Reservation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBooking}
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">New Property Reservation</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Customer</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Available Property</label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => handlePropertySelected(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-mono"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title} (${p.sellingPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Agreed Selling Price ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Booking Fee ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.bookingFee}
                    onChange={(e) => setFormData({ ...formData, bookingFee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Total Down Payment Required ($)</label>
                  <input
                    type="number"
                    value={formData.depositRequired}
                    onChange={(e) => setFormData({ ...formData, depositRequired: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Reservation Validity (Days)</label>
                  <input
                    type="number"
                    value={formData.expiryDays}
                    onChange={(e) => setFormData({ ...formData, expiryDays: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>
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
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
              >
                Confirm Reservation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddDeposit}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white mb-1">
              Record Reservation Deposit
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Booking: <span className="font-mono text-emerald-400">{showDepositModal.bookingReference}</span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Deposit Amount ($)</label>
                <input
                  type="number"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                >
                  <option value="KHQR_SCAN">ABA Pay / Bakong KHQR</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CASH">Cash Office Collection</option>
                  <option value="CHEQUE">Banker's Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Bank Reference / TXN Slip</label>
                <input
                  type="text"
                  value={depositRef}
                  onChange={(e) => setDepositRef(e.target.value)}
                  placeholder="e.g. ABA-TXN-109283"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDepositModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Verify & Issue Receipt
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
