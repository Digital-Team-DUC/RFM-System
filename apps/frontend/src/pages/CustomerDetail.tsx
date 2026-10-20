import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatCurrency, Currency } from '@rfm/shared';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  BookmarkCheck,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomer() {
      try {
        const data = await api.get(`/crm/customers/${id}`);
        setCustomer(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-emerald-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return <div className="text-center p-8 text-slate-400">Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          to="/crm/customers"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">{customer.fullName}</h1>
          {customer.khmerName && <p className="text-xs text-slate-400">{customer.khmerName}</p>}
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="glass-panel rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 block uppercase font-mono">Contact Phone</span>
          <span className="font-semibold text-white flex items-center mt-1">
            <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {customer.phone}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-mono">Email Address</span>
          <span className="font-semibold text-white flex items-center mt-1">
            <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {customer.email || '—'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-mono">ID Type & Number</span>
          <span className="font-mono font-semibold text-emerald-400 mt-1 block">
            {customer.idType}: {customer.idNumber || '—'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-mono">Assigned Agent</span>
          <span className="font-semibold text-white mt-1 block">
            {customer.assignedAgent?.fullName || 'Direct Walk-In'}
          </span>
        </div>
      </div>

      {/* Contracts & Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Contracts */}
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-4">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Executed Sales Contracts</span>
          </h3>

          <div className="space-y-3">
            {customer.contracts?.length === 0 ? (
              <p className="text-xs text-slate-500">No active contracts</p>
            ) : (
              customer.contracts?.map((ctr: any) => (
                <div key={ctr.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-emerald-400">{ctr.contractNumber}</span>
                      <p className="font-semibold text-white mt-0.5">{ctr.property?.title}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">
                      {ctr.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between">
                    <div>
                      <span className="text-slate-500 block">Selling Price</span>
                      <span className="font-bold text-white">
                        {formatCurrency(ctr.sellingPrice, Currency.USD)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Balance Remaining</span>
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(ctr.balanceRemaining, Currency.USD)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bookings & Reservations */}
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-4">
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span>Booking & Reservation History</span>
          </h3>

          <div className="space-y-3">
            {customer.bookings?.length === 0 ? (
              <p className="text-xs text-slate-500">No bookings recorded</p>
            ) : (
              customer.bookings?.map((bk: any) => (
                <div key={bk.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-amber-400">{bk.bookingReference}</span>
                      <p className="font-semibold text-white mt-0.5">{bk.property?.title}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                      {bk.status}
                    </span>
                  </div>

                  <div className="mt-2 text-slate-400">
                    Deposit Paid: {formatCurrency(bk.deposits?.[0]?.amount || 0, Currency.USD)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
