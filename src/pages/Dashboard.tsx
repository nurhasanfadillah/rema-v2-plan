import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { AlertCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Order, LedgerEntry, Mitra } from '../types';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-slate-700">
      <p className="font-semibold text-slate-300 mb-0.5">{label}</p>
      <p className="font-bold text-indigo-300">{payload[0].value} Pesanan</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [mitras, setMitras] = useState<Mitra[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'this_month' | 'this_week' | 'this_year'>('this_month');

  useEffect(() => {
    api.orders.list(true).then(setOrders).catch(console.error);
    api.ledgers.list().then(setLedgers).catch(console.error);
    api.mitras.list().then(setMitras).catch(console.error);
  }, []);

  if (!user) return null;

  const myMitraRecord = mitras.find(m => m.userId === user.id);
  const myOrders = orders.filter(o => o.mitraId === myMitraRecord?.id);
  const activeOrders = myOrders.filter(o => !['draft', 'delivered', 'returned', 'cancelled'].includes(o.status));
  const myLedgers = ledgers.filter(l => l.mitraId === myMitraRecord?.id);
  const mySaldo = myLedgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);
  const creditLimit = myMitraRecord?.creditLimit;
  const isNearLimit = creditLimit && mySaldo >= creditLimit * 0.8;

  const totalOmzet = ledgers
    .filter(l => l.direction === 'debit' && ['order', 'manual'].includes(l.source))
    .reduce((a, b) => a + b.nominal, 0);

  const pendingConfirmation = orders.filter(o => o.status === 'waiting_confirmation').length;
  const activeProductionOrders = orders.filter(o =>
    ['confirmed', 'processing', 'pressing', 'packing'].includes(o.status)
  ).length;

  const now = new Date();
  const todayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
  }).length;

  const chartData = useMemo(() => {
    const now = new Date();
    const baseOrders = user?.role === 'mitra' ? myOrders : orders;
    const EXCLUDED_STATUSES = ['draft', 'waiting_confirmation', 'cancelled', 'returned'];
    const targetOrders = baseOrders.filter(o => !EXCLUDED_STATUSES.includes(o.status));

    if (chartPeriod === 'this_month') {
      const today = now.getDate();
      return Array.from({ length: today }, (_, i) => {
        const day = i + 1;
        return {
          name: `${day}`,
          pesanan: targetOrders.filter(o => {
            const d = new Date(o.createdAt);
            return d.getDate() === day &&
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear();
          }).length,
        };
      });
    }

    if (chartPeriod === 'this_week') {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      return Array.from({ length: now.getDay() + 1 }, (_, i) => ({
        name: days[i],
        pesanan: targetOrders.filter(o => {
          const d = new Date(o.createdAt);
          return d >= startOfWeek && d.getDay() === i;
        }).length,
      }));
    }

    if (chartPeriod === 'this_year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      return Array.from({ length: now.getMonth() + 1 }, (_, i) => ({
        name: months[i],
        pesanan: targetOrders.filter(o => {
          const d = new Date(o.createdAt);
          return d.getMonth() === i && d.getFullYear() === now.getFullYear();
        }).length,
      }));
    }

    return [];
  }, [orders, myOrders, chartPeriod, user]);

  const hasChartData = chartData.some(d => d.pesanan > 0);

  const recentOrders = useMemo(() => {
    const base = user?.role === 'mitra' ? myOrders : orders;
    return [...base]
      .filter(o => !['draft'].includes(o.status))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  }, [orders, myOrders, user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  const formatRelativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Baru saja';
    if (m < 60) return `${m} mnt lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    return `${d} hari lalu`;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 lg:space-y-8"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl text-white"
      >
        <div className="absolute top-[-40%] right-[-10%] w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[20%] w-[250px] h-[250px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter">
              Halo, {user.name} <span className="inline-block animate-bounce origin-bottom">👋</span>
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Panel kontrol produksi, keuangan, dan statistik performa.
            </p>
          </div>

          {user.role !== 'mitra' && (
            <div className="flex gap-4 md:gap-6 text-center shrink-0">
              <div>
                <p className="text-2xl font-bold tabular-nums text-white">{todayOrders}</p>
                <p className="text-[10px] text-slate-400 font-medium">Pesanan Hari Ini</p>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <p className="text-2xl font-bold tabular-nums text-amber-400">{pendingConfirmation}</p>
                <p className="text-[10px] text-slate-400 font-medium">Menunggu Konfirmasi</p>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <p className="text-2xl font-bold tabular-nums text-indigo-400">{activeProductionOrders}</p>
                <p className="text-[10px] text-slate-400 font-medium">Produksi Aktif</p>
              </div>
            </div>
          )}

          {user.role === 'mitra' && (
            <div className="flex gap-4 md:gap-6 text-center shrink-0">
              <div>
                <p className="text-2xl font-bold tabular-nums text-white">{activeOrders.length}</p>
                <p className="text-[10px] text-slate-400 font-medium">Pesanan Aktif</p>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <p className="text-xl font-bold tabular-nums text-amber-400">{formatCurrency(mySaldo)}</p>
                <p className="text-[10px] text-slate-400 font-medium">Tagihan Berjalan</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Credit Limit Warning */}
      {user.role === 'mitra' && isNearLimit && (
        <motion.div
          variants={itemVariants}
          className="bg-red-50/80 text-red-700 p-4 rounded-2xl flex items-start gap-4 border border-red-200 shadow-sm"
        >
          <div className="bg-red-100 p-2 rounded-xl flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-red-800 tracking-tight text-[13px]">Limit Kredit Hampir Habis</h3>
            <p className="text-[11px] sm:text-xs font-medium mt-1 opacity-90 leading-normal">
              Tagihan berjalan <span className="text-red-900 font-bold tabular-nums">{formatCurrency(mySaldo)}</span> mendekati batas limit <span className="text-red-900 font-bold tabular-nums">{formatCurrency(creditLimit!)}</span>. Segera lakukan pembayaran.
            </p>
          </div>
        </motion.div>
      )}

      {/* Chart */}
      <motion.div variants={itemVariants} className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-indigo-600 rounded-full" />
            <h2 className="section-title">Monitor Pesanan Masuk</h2>
          </div>

          <select
            value={chartPeriod}
            onChange={(e) => setChartPeriod(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
          >
            <option value="this_week">Minggu Ini</option>
            <option value="this_month">Bulan Ini</option>
            <option value="this_year">Tahun Ini</option>
          </select>
        </div>

        {!hasChartData ? (
          <div className="h-[220px] flex flex-col items-center justify-center text-slate-400">
            <ShoppingBag className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Belum ada pesanan pada periode ini</p>
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPesanan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  dy={10}
                  interval={chartPeriod === 'this_month' && chartData.length > 15 ? 4 : 0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="pesanan"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fill="url(#colorPesanan)"
                  activeDot={{ r: 5, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Recent Orders Table */}
      <motion.div variants={itemVariants} className="card">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-5 bg-green-600 rounded-full" />
          <h2 className="section-title">Pesanan Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">No. Order</th>
                <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Mitra</th>
                <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">Belum ada pesanan</td>
                </tr>
              ) : (
                recentOrders.map(order => {
                  const mitra = mitras.find(m => m.id === order.mitraId);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 text-indigo-600 font-mono font-semibold text-[12px] text-left">#{order.orderNumber}</td>
                      <td className="py-3 text-slate-700 font-medium text-[13px] text-left">{mitra?.name || 'Unknown'}</td>
                      <td className="py-3 text-slate-600 text-right tabular-nums font-semibold">{order.totalQty}</td>
                      <td className="py-3 text-right text-slate-400 text-[11px] tabular-nums whitespace-nowrap">
                        {formatRelativeTime(order.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
