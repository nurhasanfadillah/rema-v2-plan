import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { Package, ShoppingCart, Activity, AlertCircle, Wallet, Users, LayoutDashboard, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

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
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[11px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Selamat Datang Kembali
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Halo, {user.name} <span className="inline-block animate-bounce origin-bottom">👋</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
              Akses panel untuk memonitor produksi pesanan, mengelola keuangan, dan melihat statistik performa operasional REMA v2.1 Anda.
            </p>
          </div>
          <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md self-start md:self-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Peran Akun</span>
            <span className="px-2.5 py-1 bg-blue-600 text-white font-extrabold uppercase tracking-widest text-[11px] rounded-lg shadow-sm">
              {user.role}
            </span>
          </div>
        </div>
      </motion.div>

      {user.role === 'mitra' && isNearLimit && (
        <motion.div 
          variants={itemVariants}
          className="bg-red-50/80 text-red-700 p-5 rounded-3xl flex items-start gap-4 border border-red-200 shadow-sm backdrop-blur-sm"
        >
          <div className="bg-red-100 p-2.5 rounded-2xl flex-shrink-0 mt-0.5 shadow-inner">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-red-800 tracking-tight text-sm">Pemberitahuan: Limit Kredit Hampir Habis</h3>
            <p className="text-xs sm:text-sm font-semibold mt-1 opacity-90 leading-relaxed">
              Tagihan berjalan Anda saat ini adalah <span className="text-red-900 font-extrabold">{formatCurrency(mySaldo)}</span> yang mendominasi batas maksimal limit kredit Anda sebesar <span className="text-red-900 font-extrabold">{formatCurrency(creditLimit!)}</span>. Harap segera lakukan pelunasan agar proses pesanan berikutnya tetap lancar.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats Cards Section */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
      >
        {user.role === 'mitra' ? (
          <>
            <StatCard title="Tagihan Berjalan" value={formatCurrency(mySaldo)} sub={creditLimit ? `Limit: ${formatCurrency(creditLimit)}` : 'Sisa Limit: Unlimited'} icon={<Wallet />} color="blue" />
            <StatCard title="Pesanan Aktif" value={`${activeOrders.length} Pesanan`} sub="Sedang diproses produksi" icon={<Activity />} color="amber" />
            <StatCard title="Total Pesanan" value={`${myOrders.length} Order`} sub="Keseluruhan riwayat" icon={<Package />} color="emerald" />
            <StatCard title="Draft Tersimpan" value={`${myOrders.filter(o => o.status === 'draft').length} Draft`} sub="Belum diajukan ke admin" icon={<ShoppingCart />} color="purple" />
          </>
        ) : (
          <>
            <StatCard title="Menunggu Konfirmasi" value={pendingConfirmation.toString()} sub="Butuh verifikasi admin" icon={<Activity />} color="red" />
            <StatCard title="Total Order Aktif" value={orders.filter(o => !['draft','shipped','returned','cancelled'].includes(o.status)).length.toString()} sub="Pesanan di antrian produksi" icon={<ShoppingCart />} color="amber" />
            {user.role === 'admin' ? (
              <StatCard title="Total Tagihan Beredar" value={formatCurrency(totalOmzet)} sub="Total debit dari semua mitra" icon={<Wallet />} color="emerald" />
            ) : (
              <StatCard title="Daftar Antrian Utama" value={orders.filter(o => ['processing', 'printing', 'pressing', 'packing'].includes(o.status)).length.toString()} sub="Pesanan sedang diproduksi" icon={<TrendingUp />} color="emerald" />
            )}
            <StatCard title="Mitra Terdaftar" value={`${mitras.filter(m => !m.isArchived).length} Mitra`} sub="Partner aktif saat ini" icon={<Users />} color="blue" />
          </>
        )}
      </motion.div>

      {/* Main Info Box */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04),0_8px_20px_-8px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 lg:p-8"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">Spesifikasi Sistem REMA v2.1</h2>
        </div>
        <div className="bg-slate-50/70 rounded-2xl p-5 text-slate-600 text-[13px] leading-relaxed border border-slate-100/80">
          <p className="font-medium text-slate-700">
            Sistem Informasi Manajemen Produksi & Finance (REMA) saat ini dikonfigurasi menggunakan basis data lokal terenkripsi di sisi klien. Desain antarmuka telah ditingkatkan dengan standar premium Enterprise untuk performa prima di perangkat mobile maupun desktop.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-200/50 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> File Sesi Terkendali
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Enkripsi Sisi Klien Aktif
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ title, value, sub, icon, color = "blue" }: { title: string, value: string, sub?: string, icon: React.ReactNode, color?: string }) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-600 shadow-blue-500/5',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-500/5',
    amber: 'bg-amber-50 border-amber-100 text-amber-600 shadow-amber-500/5',
    red: 'bg-red-50 border-red-100 text-red-600 shadow-red-500/5',
    purple: 'bg-purple-50 border-purple-100 text-purple-600 shadow-purple-500/5'
  };
  
  return (
    <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03),0_8px_16px_-8px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:shadow-lg hover:border-slate-300 hover:translate-y-[-2px] transition-all duration-300">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-inner ${bgColors[color]}`}>
          {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 sm:w-5 sm:h-5" })}
        </div>
      </div>
      <div>
        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 line-clamp-1">{title}</p>
        <p className="text-base sm:text-2xl font-black tracking-tight text-slate-900 leading-tight truncate">{value}</p>
        {sub && <p className="text-[9px] sm:text-[11px] font-semibold text-slate-400 mt-1 sm:mt-2 flex items-center gap-1.5 line-clamp-2 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}
