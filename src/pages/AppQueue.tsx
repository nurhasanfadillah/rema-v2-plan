import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { formatDate } from '../lib/utils';
import { Package, Clock, ShieldCheck, Cpu, LayoutGrid, CheckSquare, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export default function AppQueue() {
  const { user } = useAuth();
  
  if (!user) return null;

  // Filter queue from Dikonfirmasi up to Packing
  const inQueueStatuses = ['confirmed', 'processing', 'printing', 'pressing', 'packing'];
  const orders = db.getOrders().filter(o => inQueueStatuses.includes(o.status));
  const mitras = db.getMitras();
  const activeMitra = mitras.find(m => m.userId === user.id);

  const getStatusBadge = (status: string) => {
    const specs: Record<string, { bg: string, text: string, border: string, label: string }> = {
      confirmed: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700 border-blue-250', border: 'border-blue-200/60', label: 'Dikonfirmasi' },
      processing: { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700', border: 'border-purple-200/60', label: 'Diproses' },
      printing: { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700 border-indigo-200/60', border: 'border-indigo-200/60', label: 'Cetak DTF' },
      pressing: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700 border-rose-200/60', border: 'border-rose-200/60', label: 'Press Sablon' },
      packing: { bg: 'bg-orange-50 border-orange-100', text: 'text-orange-700 border-orange-200/60', border: 'border-orange-200/60', label: 'Packing' },
    };

    const s = specs[status] || { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', border: 'border-slate-200', label: status };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${s.bg} ${s.text} ${s.border}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {s.label}
      </span>
    );
  };
  
  const sortedOrders = orders.sort((a,b) => a.createdAt - b.createdAt);

  // Pipeline count summary calculations to look highly professional
  const confirmedCount = sortedOrders.filter(o => o.status === 'confirmed').length;
  const processingCount = sortedOrders.filter(o => o.status === 'processing').length;
  const dtfCount = sortedOrders.filter(o => o.status === 'printing').length;
  const pressCount = sortedOrders.filter(o => o.status === 'pressing').length;
  const packingCount = sortedOrders.filter(o => o.status === 'packing').length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 lg:space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-2 py-0.5 w-max mb-1.5">
              <Cpu className="w-3.5 h-3.5 animate-spin" /> Live Factory Pipeline
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Aliran Produksi Berjalan</h1>
            <p className="text-[13px] text-slate-500 mt-0.5 font-semibold">Pantau timeline perakitan dan proses produksi secara real-time.</p>
          </div>
      </div>

      {/* Steps quick pipeline monitor widgets */}
      <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center"
      >
        <div className="bg-white p-4 rounded-2xl border border-slate-200/75 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Dikonfirmasi</span>
          <span className="text-xl sm:text-2xl font-black text-blue-650">{confirmedCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/75 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Diproses</span>
          <span className="text-xl sm:text-2xl font-black text-purple-650">{processingCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/75 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Cetak DTF</span>
          <span className="text-xl sm:text-2xl font-black text-indigo-650">{dtfCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/75 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Press Sablon</span>
          <span className="text-xl sm:text-2xl font-black text-pink-650">{pressCount}</span>
        </div>
      </motion.div>

      {/* Mobile view (< md) */}
      <div className="md:hidden space-y-4">
        {sortedOrders.map(o => {
          const isMine = user.role === 'admin' || user.role === 'staff' || user.role === 'operational' || o.mitraId === activeMitra?.id;
          const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
          
          return (
            <motion.div 
              variants={itemVariants}
              key={o.id} 
              className={`rounded-2xl border p-4 shadow-sm relative transition ${
                isMine ? 'bg-white border-slate-200/60 hover:border-slate-350' : 'bg-slate-50/50 border-slate-100 opacity-80'
              }`}
            >
              {!isMine && <div className="absolute inset-0 z-10" />}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-mono font-black text-slate-900 text-sm">{o.orderNumber}</h3>
                  <div className="flex items-center text-xs text-slate-500 gap-1.5 mt-1.5 font-bold">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(o.createdAt)}
                  </div>
                </div>
                <div>{getStatusBadge(o.status)}</div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100 bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Mitra Partner</span>
                  <span className="text-xs font-extrabold text-slate-900 mt-0.5">{!isMine ? '***' : mitraName}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Pesanan</span>
                  <span className="text-xs font-black text-indigo-600 mt-0.5">{o.totalQty} pcs</span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {sortedOrders.length === 0 && (
          <motion.div variants={itemVariants} className="bg-white border-2 border-dashed text-center p-10 rounded-2xl">
             <Package className="w-12 h-12 mx-auto text-slate-350 mb-3"/>
             <p className="text-slate-800 font-bold text-sm">Antrian produksi kosong.</p>
          </motion.div>
        )}
      </div>

      {/* Desktop view (>= md) */}
      <motion.div 
        variants={itemVariants}
        className="hidden md:block bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03),0_8px_20px_-8px_rgba(0,0,0,0.01)] border border-slate-200/60 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-900 font-extrabold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Masuk Antrian</th>
                <th className="px-6 py-4">Nomor Pesanan</th>
                <th className="px-6 py-4">Nama Mitra</th>
                <th className="px-6 py-4 text-center">Format Qty</th>
                <th className="px-6 py-4 text-right">Status Pos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90 font-bold">
              {sortedOrders.map(o => {
                const isMine = user.role === 'admin' || user.role === 'staff' || user.role === 'operational' || o.mitraId === activeMitra?.id;
                const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                return (
                  <tr key={o.id} className={`transition-colors duration-150 ${isMine ? 'hover:bg-slate-50/70' : 'bg-slate-50/30 opacity-70'}`}>
                    <td className="px-6 py-4 text-slate-400 font-medium">{formatDate(o.createdAt)}</td>
                    <td className="px-6 py-4 font-mono font-black text-slate-900">{o.orderNumber}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-900">{!isMine ? '***' : mitraName}</td>
                    <td className="px-6 py-4 font-black text-center text-slate-800">{o.totalQty} pcs</td>
                    <td className="px-6 py-4 text-right">{getStatusBadge(o.status)}</td>
                  </tr>
                );
              })}
              {sortedOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3 animate-pulse" />
                    Antrian produksi kosong. Semua pesanan telah selesai dikirim!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
