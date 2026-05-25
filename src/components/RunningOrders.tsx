import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import type { Order, Mitra } from '../types';

export default function RunningOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mitras, setMitras] = useState<Mitra[]>([]);

  useEffect(() => {
    api.orders.list().then(setOrders).catch(console.error);
    api.mitras.list().then(setMitras).catch(console.error);
  }, []);

  const activeOrdersString = useMemo(() => {
    // Get latest 10 orders
    const latest = [...orders]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    if (latest.length === 0) return "Belum ada pesanan terbaru...";

    return latest.map(order => {
      const mitra = mitras.find(m => m.id === order.mitraId);
      const mitraName = mitra?.name || 'Unknown Mitra';
      return `${mitraName} ${order.totalQty} pcs`;
    }).join('  —  ') + '  —  ';
  }, [orders, mitras]);

  return (
    <div className="bg-slate-900/50 border-b border-white/5 py-2.5 overflow-hidden whitespace-nowrap relative flex items-center">
      {/* Icon label fixed position */}
      <div className="px-4 bg-slate-950/80 backdrop-blur-md border-r border-white/5 relative z-10 flex items-center gap-2">
        <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terbaru</span>
      </div>

      <div className="flex-1 overflow-hidden relative group">
        <motion.div
          animate={{
            x: [0, "-50%"],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40,
              ease: "linear",
            },
          }}
          className="inline-block"
        >
          <span className="text-[11px] font-mono font-bold text-slate-300 tracking-wide uppercase px-4">
            {activeOrdersString}
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-300 tracking-wide uppercase px-4">
            {activeOrdersString}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
