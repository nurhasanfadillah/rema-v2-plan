import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { formatDate } from '../../lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Eye, Package, Calendar, User, LayoutList } from 'lucide-react';

export default function OrdersList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const orders = db.getOrders();
  const mitras = db.getMitras();

  if (!user) return null;

  const isDraftPage = location.pathname.includes('/drafts');

  // Filter based on role
  let displayOrders = orders;
  if (user.role === 'mitra') {
    displayOrders = orders.filter(o => o.mitraId === user.id);
  } else if (user.role === 'staff' || user.role === 'admin') {
    // Admin & Staff can see everything
  } else if (user.role === 'operational') {
    // Operational can see from confirmed onwards
    displayOrders = orders.filter(o => !['draft', 'waiting_confirmation'].includes(o.status));
  }
  
  if (isDraftPage) {
    displayOrders = displayOrders.filter(o => o.status === 'draft');
  } else if (user.role === 'mitra') {
    displayOrders = displayOrders.filter(o => o.status !== 'draft');
  }
  
  const sortedOrders = displayOrders.sort((a,b) => b.createdAt - a.createdAt);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Draft</span>;
      case 'waiting_confirmation': return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Menunggu</span>;
      case 'confirmed': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Dikonfirmasi</span>;
      case 'processing': return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Diproses</span>;
      case 'printing': return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Cetak DTF</span>;
      case 'pressing': return <span className="px-2.5 py-1 bg-fuchsia-100 text-fuchsia-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Press Sablon</span>;
      case 'packing': return <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Packing</span>;
      case 'shipped': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Dikirim</span>;
      case 'returned': return <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Retur</span>;
      case 'cancelled': return <span className="px-2.5 py-1 bg-slate-800 text-slate-100 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Dibatalkan</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{isDraftPage ? 'Draft Pesanan' : 'Daftar Pesanan'}</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{isDraftPage ? 'Lanjutkan pesanan yang belum selesai' : 'Kelola dan pantau pesanan Anda'}</p>
        </div>
        {user.role === 'mitra' && (
          <Link 
            to="/orders/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Buat Pesanan
          </Link>
        )}
      </div>

      {/* Mobile view (< md) */}
      <div className="md:hidden space-y-4">
        {sortedOrders.map(o => {
          const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
          return (
            <div 
              key={o.id} 
              onClick={() => navigate(`/orders/${o.id}`)}
              className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm relative hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-mono font-bold text-slate-900 text-sm">{o.orderNumber}</h3>
                  <div className="flex flex-col gap-1 mt-1.5">
                     <span className="flex items-center text-xs text-slate-500 gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(o.createdAt)}</span>
                     {user.role !== 'mitra' && (
                       <span className="flex items-center text-xs text-slate-500 gap-1.5"><User className="w-3.5 h-3.5" /> {mitraName}</span>
                     )}
                  </div>
                </div>
                <div>{getStatusBadge(o.status)}</div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tipe</span>
                     <span className="text-xs font-medium text-slate-700 capitalize">{o.type}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
                     <span className="text-xs font-medium text-slate-700">{o.totalQty} pcs</span>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
        {sortedOrders.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
             <LayoutList className="w-10 h-10 mx-auto text-slate-400 mb-3" />
             Tidak ada pesanan.
          </div>
        )}
      </div>

      {/* Desktop view (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-900 font-semibold text-[12px]">
              <tr>
                <th className="px-5 py-3">Nomor Pesanan</th>
                <th className="px-5 py-3">Tanggal</th>
                {user.role !== 'mitra' && <th className="px-5 py-3">Mitra</th>}
                <th className="px-5 py-3">Tipe</th>
                <th className="px-5 py-3 text-right">Total Qty</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedOrders.map(o => {
                const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                return (
                  <tr 
                    key={o.id} 
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                    <td className="px-5 py-3">{formatDate(o.createdAt)}</td>
                    {user.role !== 'mitra' && <td className="px-5 py-3 font-medium text-slate-900">{mitraName}</td>}
                    <td className="px-5 py-3 capitalize font-medium">{o.type}</td>
                    <td className="px-5 py-3 font-medium text-right">{o.totalQty} pcs</td>
                    <td className="px-5 py-3 text-right">{getStatusBadge(o.status)}</td>
                  </tr>
                );
              })}
              {sortedOrders.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Tidak ada pesanan ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
