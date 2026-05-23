import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { formatDate } from '../lib/utils';
import { Package, Clock } from 'lucide-react';

export default function AppQueue() {
  const { user } = useAuth();
  
  if (!user) return null;

  // Filter queue from Dikonfirmasi up to Packing
  const inQueueStatuses = ['confirmed', 'processing', 'printing', 'pressing', 'packing'];
  const orders = db.getOrders().filter(o => inQueueStatuses.includes(o.status));
  const mitras = db.getMitras();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Dikonfirmasi</span>;
      case 'processing': return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Diproses</span>;
      case 'printing': return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Cetak DTF</span>;
      case 'pressing': return <span className="px-2.5 py-1 bg-fuchsia-100 text-fuchsia-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Press Sablon</span>;
      case 'packing': return <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Packing</span>;
      default: return null;
    }
  };
  
  const sortedOrders = orders.sort((a,b) => a.createdAt - b.createdAt);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Antrian Produksi</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Pantau antrian pesanan yang sedang diproses</p>
         </div>
      </div>

      {/* Mobile view (< md) */}
      <div className="md:hidden space-y-4">
        {sortedOrders.map(o => {
          const isMine = user.role === 'admin' || user.role === 'staff' || user.role === 'operational' || o.mitraId === user.id;
          const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
          
          return (
            <div key={o.id} className={`rounded-2xl border p-4 shadow-sm relative transition ${isMine ? 'bg-white border-slate-200/60 hover:border-slate-300' : 'bg-slate-50 border-slate-100 opacity-80'}`}>
              {!isMine && <div className="absolute inset-0 z-10"></div> /* Overlay to prevent interaction if not mine, though minimal interaction anyway */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-mono font-bold text-slate-900 text-sm">{o.orderNumber}</h3>
                  <div className="flex items-center text-xs text-slate-500 gap-1.5 mt-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(o.createdAt)}
                  </div>
                </div>
                <div>{getStatusBadge(o.status)}</div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Mitra</span>
                  <span className="text-xs font-medium text-slate-700">{!isMine ? '***' : mitraName}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
                  <span className="text-xs font-bold text-slate-700">{o.totalQty} pcs</span>
                </div>
              </div>
            </div>
          );
        })}
        {sortedOrders.length === 0 && (
          <div className="bg-white border text-center p-8 rounded-2xl">
             <Package className="w-10 h-10 mx-auto text-slate-300 mb-2"/>
             <p className="text-slate-500 font-medium text-sm">Antrian produksi kosong.</p>
          </div>
        )}
      </div>

      {/* Desktop view (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-900 font-semibold text-[12px]">
              <tr>
                <th className="px-5 py-3">Tanggal Pesanan</th>
                <th className="px-5 py-3">No. Pesanan</th>
                <th className="px-5 py-3">Nama Mitra</th>
                <th className="px-5 py-3">Total Qty</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedOrders.map(o => {
                const isMine = user.role === 'admin' || user.role === 'staff' || user.role === 'operational' || o.mitraId === user.id;
                const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                return (
                  <tr key={o.id} className={`transition-colors ${isMine ? 'hover:bg-slate-50/80' : 'bg-slate-50/30 opacity-70'}`}>
                    <td className="px-5 py-3">{formatDate(o.createdAt)}</td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{!isMine ? '***' : mitraName}</td>
                    <td className="px-5 py-3 font-medium">{o.totalQty} pcs</td>
                    <td className="px-5 py-3">{getStatusBadge(o.status)}</td>
                  </tr>
                );
              })}
              {sortedOrders.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Antrian produksi kosong.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
