import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { Package, ShoppingCart, Activity, AlertCircle, Wallet } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user) return null;

  const orders = db.getOrders();
  const ledgers = db.getLedgers();
  const mitras = db.getMitras();

  // Metrics specifically for Mitra
  const myOrders = orders.filter(o => o.mitraId === user.id);
  const activeOrders = myOrders.filter(o => !['draft', 'delivered', 'returned', 'cancelled'].includes(o.status));
  const myLedgers = ledgers.filter(l => l.mitraId === user.id);
  const mySaldo = myLedgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);
  const myMitraRecord = mitras.find(m => m.userId === user.id);
  const creditLimit = myMitraRecord?.creditLimit;
  const isNearLimit = creditLimit && mySaldo >= creditLimit * 0.8;

  // Metrics for Admin
  const totalOmzet = ledgers
    .filter(l => l.direction === 'debit' && ['order', 'manual'].includes(l.source))
    .reduce((a, b) => a + b.nominal, 0);

  const pendingConfirmation = orders.filter(o => o.status === 'waiting_confirmation').length;

  return (
    <div className="space-y-5 lg:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-[13px] mt-0.5">Ringkasan metrik bisnis dan operasional Anda hari ini.</p>
        </div>
      </div>
      
      {user.role === 'mitra' && isNearLimit && (
        <div className="bg-red-50/80 text-red-700 p-4 rounded-2xl flex items-start gap-4 border border-red-200/50 shadow-sm backdrop-blur-sm">
          <div className="bg-red-100 p-2 rounded-full flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800 tracking-tight">Limit Tagihan Hampir Habis</h3>
            <p className="text-sm font-medium mt-1 opacity-90 leading-relaxed">Tagihan Anda saat ini <span className="font-bold">{formatCurrency(mySaldo)}</span> mendekati limit limit <span className="font-bold">{formatCurrency(creditLimit!)}</span>. Harap lakukan pembayaran.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {user.role === 'mitra' ? (
          <>
            <StatCard title="Tagihan Berjalan" value={formatCurrency(mySaldo)} sub={creditLimit ? `Limit: ${formatCurrency(creditLimit)}` : 'Tanpa Limit'} icon={<Wallet className="text-blue-500" />} color="blue" />
            <StatCard title="Pesanan Aktif" value={activeOrders.length.toString()} icon={<Activity className="text-amber-500" />} color="amber" />
            <StatCard title="Total Pesanan" value={myOrders.length.toString()} icon={<Package className="text-emerald-500" />} color="emerald" />
            <StatCard title="Draft Tersimpan" value={myOrders.filter(o => o.status === 'draft').length.toString()} icon={<ShoppingCart className="text-purple-500" />} color="purple" />
          </>
        ) : (
          <>
            <StatCard title="Menunggu Konfirmasi" value={pendingConfirmation.toString()} icon={<Activity className="text-red-500" />} color="red" />
            <StatCard title="Total Order Aktif" value={orders.filter(o => !['draft','shipped','returned','cancelled'].includes(o.status)).length.toString()} icon={<ShoppingCart className="text-amber-500" />} color="amber" />
            {user.role === 'admin' && (
              <StatCard title="Total Tagihan Beredar" value={formatCurrency(totalOmzet)} icon={<Wallet className="text-emerald-500" />} color="emerald" />
            )}
            <StatCard title="Total Mitra Aktif" value={mitras.filter(m => !m.isArchived).length.toString()} icon={<Package className="text-blue-500" />} color="blue" />
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 lg:p-6">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 mb-3">Informasi Sistem REMA-V2.1</h2>
        <div className="bg-slate-50 rounded-xl p-4 text-slate-600 text-[13px] leading-relaxed border border-slate-100">
          Selamat datang kembali, <span className="font-semibold text-slate-900">{user.name}</span>. Anda saat ini masuk sebagai <span className="uppercase font-bold text-slate-900 bg-slate-200/50 px-1.5 py-0.5 rounded text-[11px]">{user.role}</span>.
          <br/>
          <br/>
          Sistem ini menggunakan basis data lokal untuk fase pengembangan dan saat ini dioptimalkan untuk pengalaman web seluler (mobile-first).
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color = "blue" }: { title: string, value: string, sub?: string, icon: React.ReactNode, color?: string }) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    red: 'bg-red-50 border-red-100',
    purple: 'bg-purple-50 border-purple-100'
  };
  
  return (
    <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${bgColors[color]}`}>
          {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 " + (icon as React.ReactElement).props.className })}
        </div>
      </div>
      <div>
        <p className="text-[13px] font-medium text-slate-500 mb-0.5">{title}</p>
        <p className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {sub && <p className="text-[11px] font-medium text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
