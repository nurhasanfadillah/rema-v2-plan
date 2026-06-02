import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Order, Mitra } from '../types';
import { formatDate } from '../lib/utils';
import { Package, Clock, ShieldCheck, CheckSquare, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export default function AppQueue() {
  const { user } = useAuth();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [mitras, setMitras] = useState<Mitra[]>([]);

  useEffect(() => {
    api.orders.list(true).then(setAllOrders).catch(console.error);
    api.mitras.list().then(setMitras).catch(console.error);
  }, []);

  if (!user) return null;

  // Filter queue from Dikonfirmasi up to Packing
  const inQueueStatuses = ['confirmed', 'processing', 'pressing', 'packing'];
  const orders = allOrders.filter(o => inQueueStatuses.includes(o.status));

  const getStatusBadge = (status: string) => {
    const specs: Record<string, { bg: string, text: string, border: string, label: string }> = {
      confirmed: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700 border-blue-250', border: 'border-blue-200/60', label: 'Dikonfirmasi' },
      processing: { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700', border: 'border-purple-200/60', label: 'Diproses' },
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

  // Pipeline summary data
  const pipelineStats = [
    { 
      label: 'KONFIRMASI', 
      count: sortedOrders.filter(o => o.status === 'confirmed').length,
      qty: sortedOrders.filter(o => o.status === 'confirmed').reduce((sum, o) => sum + o.totalQty, 0),
      color: 'text-blue-650',
      icon: <CheckSquare className="w-5 h-5" />
    },
    { 
      label: 'PROSES PRODUKSI', 
      count: sortedOrders.filter(o => o.status === 'processing').length,
      qty: sortedOrders.filter(o => o.status === 'processing').reduce((sum, o) => sum + o.totalQty, 0),
      color: 'text-purple-650',
      icon: <Clock className="w-5 h-5" />
    },
    { 
      label: 'PRESS SABLON', 
      count: sortedOrders.filter(o => o.status === 'pressing').length,
      qty: sortedOrders.filter(o => o.status === 'pressing').reduce((sum, o) => sum + o.totalQty, 0),
      color: 'text-pink-650',
      icon: <Layers className="w-5 h-5" />
    },
    { 
      label: 'PACKING & KIRIM', 
      count: sortedOrders.filter(o => o.status === 'packing').length,
      qty: sortedOrders.filter(o => o.status === 'packing').reduce((sum, o) => sum + o.totalQty, 0),
      color: 'text-orange-650',
      icon: <Package className="w-5 h-5" />
    }
  ];

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
      className="space-y-4 lg:space-y-5"
    >
      <div className="page-header items-end">
          <div>
            <h1 className="page-title underline decoration-indigo-500/30 decoration-4 underline-offset-8">Antrian Produksi</h1>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-200/60 font-mono">
             <div className="px-3 py-1 text-center">
                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Antrian</span>
                <span className="text-sm font-black text-slate-900">{sortedOrders.length}</span>
             </div>
             <div className="w-px h-6 bg-slate-200/50" />
             <div className="px-3 py-1 text-center">
                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Volume</span>
                <span className="text-sm font-black text-indigo-650">{sortedOrders.reduce((sum, o) => sum + o.totalQty, 0)}</span>
             </div>
          </div>
      </div>

      {/* Enhanced Pipeline Statistics Cards - Ultra Compact Dark */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5"
      >
        {pipelineStats.map((stat, i) => (
          <div key={i} className="p-2.5 rounded-xl border flex items-center gap-3 transition-all active:scale-[0.98] bg-slate-950 border-slate-800 shadow-xl shadow-black/20 group">
            <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${stat.color} group-hover:scale-105 transition-transform shrink-0`}>
              {stat.icon}
            </div>
            <div className="flex flex-col min-w-0">
               <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.18em] leading-none mb-1.5 truncate">
                 {stat.label}
               </span>
               <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white leading-none tracking-tight">
                    {stat.qty}
                  </span>
                  <span className={`text-[9px] font-bold ${stat.color} uppercase opacity-80`}>
                    ({stat.count})
                  </span>
               </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Mobile view (< md) - Compact Cards */}
      <div className="md:hidden space-y-2">
        {sortedOrders.map(o => {
          const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
          
          const statusLeftBorder = {
            confirmed: 'border-l-blue-400',
            processing: 'border-l-purple-400',
            pressing: 'border-l-rose-400',
            packing: 'border-l-orange-400'
          }[o.status as string] || 'border-l-slate-200';

          return (
            <motion.div
              variants={itemVariants}
              key={o.id}
              className={`rounded-xl border border-l-4 p-2.5 shadow-sm relative transition-all active:scale-[0.99] bg-white border-slate-200 ${statusLeftBorder}`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-mono font-black text-slate-900 text-[12px] tracking-tight">{o.orderNumber}</h3>
                </div>
                <div>{getStatusBadge(o.status)}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-1.5 text-[10px] border-t border-slate-50 pt-2">
                <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-tight">
                  <Clock className="w-2.5 h-2.5 text-slate-350" />
                  <span className="truncate">{formatDate(o.createdAt).split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-1 justify-end text-slate-900 font-extrabold text-[10px]">
                  <Layers className="w-2.5 h-2.5 text-slate-350" />
                  <span className="truncate">{mitraName.split(' ')[0]}</span>
                </div>
                <div className="col-span-2 flex items-center justify-between mt-0.5 bg-slate-50/80 rounded px-1.5 py-0.5">
                   <span className="text-[8px] text-slate-400 font-black uppercase">Volume</span>
                   <span className="text-[10px] font-black text-indigo-600">{o.totalQty} pcs</span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {sortedOrders.length === 0 && (
          <motion.div variants={itemVariants} className="bg-white border text-center py-8 rounded-xl">
             <Package className="w-8 h-8 mx-auto text-slate-300 mb-2"/>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Antrian Produksi Kosong</p>
          </motion.div>
        )}
      </div>

      {/* Desktop view (>= md) - Efficient Table */}
      <motion.div 
        variants={itemVariants}
        className="hidden md:block bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.02)] border border-slate-200/80 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] text-slate-600 border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-extrabold text-[9px] uppercase tracking-[0.12em]">
              <tr>
                <th className="pl-4 pr-2 py-2 w-32 font-black">Waktu Masuk</th>
                <th className="px-2 py-2 w-24 font-black">Nomor Pesanan</th>
                <th className="px-2 py-2 font-black">Mitra</th>
                <th className="px-2 py-2 w-20 text-center font-black">Volume</th>
                <th className="pl-2 pr-4 py-2 w-36 text-right font-black">Posisi Produksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {sortedOrders.map(o => {
                const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                
                const statusColor = {
                  confirmed: 'border-l-blue-400',
                  processing: 'border-l-purple-400',
                  pressing: 'border-l-rose-400',
                  packing: 'border-l-orange-400'
                }[o.status as string] || 'border-l-transparent';

                return (
                  <tr key={o.id} className={`group transition-all duration-150 border-l-2 ${statusColor} hover:bg-slate-50/50`}>
                    <td className="pl-4 pr-2 py-1.5 text-slate-400 font-mono text-[10px]">{formatDate(o.createdAt)}</td>
                    <td className="px-2 py-1.5">
                      <span className="font-mono font-black text-slate-900 bg-slate-100/50 px-1.5 py-0.5 rounded text-[10px] tracking-tight">{o.orderNumber}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-[11px] truncate max-w-[180px]">{mitraName}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className="text-[11px] font-black text-slate-700">{o.totalQty}</span>
                      <span className="ml-0.5 text-[8px] text-slate-400 font-extrabold uppercase">pcs</span>
                    </td>
                    <td className="pl-2 pr-4 py-1.5 text-right flex justify-end transform scale-[0.85] origin-right">{getStatusBadge(o.status)}</td>
                  </tr>
                );
              })}
              {sortedOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-3 opacity-50" />
                    <p className="font-extrabold text-[11px] uppercase tracking-widest">Antrian Produksi Kosong</p>
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
