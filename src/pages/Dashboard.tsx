import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { Package, ShoppingCart, Activity, AlertCircle, Wallet, Users, LayoutDashboard, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user) return null;

  const orders = db.getOrders();
  const ledgers = db.getLedgers();
  const mitras = db.getMitras();

  // Metrics specifically for Mitra
  const myMitraRecord = mitras.find(m => m.userId === user.id);
  const myOrders = orders.filter(o => o.mitraId === myMitraRecord?.id);
  const activeOrders = myOrders.filter(o => !['draft', 'delivered', 'returned', 'cancelled'].includes(o.status));
  const myLedgers = ledgers.filter(l => l.mitraId === myMitraRecord?.id);
  const mySaldo = myLedgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);
  const creditLimit = myMitraRecord?.creditLimit;
  const isNearLimit = creditLimit && mySaldo >= creditLimit * 0.8;

  // Metrics for Admin
  const totalOmzet = ledgers
    .filter(l => l.direction === 'debit' && ['order', 'manual'].includes(l.source))
    .reduce((a, b) => a + b.nominal, 0);

  const pendingConfirmation = orders.filter(o => o.status === 'waiting_confirmation').length;

  const [chartPeriod, setChartPeriod] = useState<'this_month' | 'this_week' | 'this_year'>('this_month');

  const chartData = useMemo(() => {
    const now = new Date();
    const targetOrders = user?.role === 'mitra' ? myOrders : orders;
    
    let data: any[] = [];
    
    if (chartPeriod === 'this_month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysData = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`,
        pesanan: 0
      }));
      
      targetOrders.forEach(o => {
        const d = new Date(o.createdAt);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          const dayIdx = d.getDate() - 1;
          daysData[dayIdx].pesanan += 1;
        }
      });
      data = daysData;
    } else if (chartPeriod === 'this_week') {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const weekData = days.map(d => ({ name: d, pesanan: 0 }));
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      
      targetOrders.forEach(o => {
        const d = new Date(o.createdAt);
        if (d >= startOfWeek) {
          weekData[d.getDay()].pesanan += 1;
        }
      });
      data = weekData;
    } else if (chartPeriod === 'this_year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const yearData = months.map(m => ({ name: m, pesanan: 0 }));
      
      targetOrders.forEach(o => {
        const d = new Date(o.createdAt);
        if (d.getFullYear() === now.getFullYear()) {
           yearData[d.getMonth()].pesanan += 1;
        }
      });
      data = yearData;
    }
    
    return data;
  }, [orders, myOrders, chartPeriod, user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 lg:space-y-8"
    >
      {/* Dynamic Greetings Banner */}
      <motion.div 
        variants={itemVariants} 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl text-white"
      >
        <div className="absolute top-[-40%] right-[-10%] w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[20%] w-[250px] h-[250px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter tabular-nums">
              Halo, {user.name} <span className="inline-block animate-bounce origin-bottom">👋</span>
            </h1>
            <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed max-w-xl font-medium tracking-wide">
              Akses panel untuk memonitor produksi pesanan, mengelola keuangan, dan melihat statistik performa operasional REMA v2.1 Anda.
            </p>
          </div>
        </div>
      </motion.div>

      {user.role === 'mitra' && isNearLimit && (
        <motion.div 
          variants={itemVariants}
          className="bg-red-50/80 text-red-700 p-4 rounded-2xl flex items-start gap-4 border border-red-200 shadow-sm backdrop-blur-sm"
        >
          <div className="bg-red-100 p-2 rounded-xl flex-shrink-0 mt-0.5 shadow-inner">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-red-800 tracking-tight text-[13px]">Pemberitahuan: Limit Kredit Hampir Habis</h3>
            <p className="text-[11px] sm:text-xs font-medium mt-1 opacity-90 leading-normal">
              Tagihan berjalan Anda saat ini adalah <span className="text-red-900 font-bold tabular-nums">{formatCurrency(mySaldo)}</span> yang mendominasi batas maksimal limit kredit Anda sebesar <span className="text-red-900 font-bold tabular-nums">{formatCurrency(creditLimit!)}</span>. Harap segera lakukan pelunasan agar proses pesanan berikutnya tetap lancar.
            </p>
          </div>
        </motion.div>
      )}

      {/* Orders Chart Section */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04),0_8px_20px_-8px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 lg:p-7"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-indigo-600 rounded-full" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-800">
              Grafik Pesanan Masuk
            </h2>
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

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748B' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748B' }} 
              />
              <Tooltip 
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Line 
                type="monotone"
                dataKey="pesanan" 
                stroke="#4F46E5" 
                strokeWidth={3}
                activeDot={{ r: 6, fill: '#4F46E5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Main Info Box */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04),0_8px_20px_-8px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 lg:p-7"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Spesifikasi Sistem REMA v2.1</h2>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 text-slate-600 text-[12px] leading-relaxed border border-slate-100">
          <p className="font-medium">
            Sistem Informasi Manajemen Produksi & Finance (REMA) saat ini dikonfigurasi menggunakan basis data lokal terenkripsi di sisi klien. Desain antarmuka telah ditingkatkan dengan standar premium Enterprise untuk performa prima di perangkat mobile maupun desktop.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-200/50 flex flex-wrap gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-2 text-slate-600">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> File Sesi Terkendali
            </span>
            <span className="flex items-center gap-2 text-slate-600">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Enkripsi Sisi Klien Aktif
             </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
