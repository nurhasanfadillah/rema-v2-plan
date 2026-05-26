import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Order, Mitra } from '../../types';
import { formatDate, cn } from '../../lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Eye, Package, Calendar, User, LayoutList, Search, ArrowRight, FileSpreadsheet, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion } from 'motion/react';

export default function OrdersList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [mitras, setMitras] = useState<Mitra[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Promise.all([api.orders.list(), api.mitras.list()])
      .then(([o, m]) => { setOrders(o); setMitras(m); })
      .catch(() => toast.error('Gagal memuat data pesanan'));
  }, []);

  if (!user) return null;

  const isDraftPage = location.pathname.includes('/drafts');

  let displayOrders = orders;
  const activeMitra = mitras.find(m => m.userId === user.id);

  displayOrders = displayOrders.filter(o => {
    if (o.status !== 'draft') return true;
    const creatorUserId = o.creatorId || mitras.find(m => m.id === o.mitraId)?.userId;
    return creatorUserId === user.id;
  });

  if (user.role === 'mitra') {
    displayOrders = displayOrders.filter(o => o.mitraId === activeMitra?.id);
  } else if (user.role === 'operational') {
    displayOrders = orders.filter(o => !['draft', 'waiting_confirmation'].includes(o.status));
  }

  displayOrders = displayOrders.filter(o => !['cancelled', 'returned'].includes(o.status));

  if (isDraftPage) {
    displayOrders = displayOrders.filter(o => o.status === 'draft');
  } else if (user.role === 'mitra') {
    displayOrders = displayOrders.filter(o => o.status !== 'draft');
  }

  const statusStats: Record<string, { orders: number; qty: number }> = displayOrders.reduce(
    (acc: Record<string, { orders: number; qty: number }>, order) => {
      if (!acc[order.status]) acc[order.status] = { orders: 0, qty: 0 };
      acc[order.status]!.orders += 1;
      acc[order.status]!.qty += (order.totalQty || 0);
      return acc;
    },
    {}
  );

  const totalStats = (Object.values(statusStats) as { orders: number; qty: number }[]).reduce((acc, curr) => {
    acc.orders += curr.orders;
    acc.qty += curr.qty;
    return acc;
  }, { orders: 0, qty: 0 });

  if (!isDraftPage && statusFilter !== 'all') {
    displayOrders = displayOrders.filter(o => o.status === statusFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayOrders = displayOrders.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.type.toLowerCase().includes(q) ||
      (mitras.find(m => m.id === o.mitraId)?.name || '').toLowerCase().includes(q)
    );
  }

  const sortedOrders = displayOrders.sort((a, b) => b.createdAt - a.createdAt);

  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2) end = 4;
      else if (currentPage >= totalPages - 1) start = totalPages - 3;
      if (start > 2) pages.push('ellipsis1');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('ellipsis2');
      pages.push(totalPages);
    }
    return pages;
  };

  // Task 1: Dark-theme glow badge
  const getStatusBadge = (status: string) => {
    const specs: Record<string, { bg: string; text: string; border: string; glow: string; dot: string; label: string }> = {
      draft:                { bg: 'bg-slate-500/15',  text: 'text-slate-300',  border: 'border-slate-500/30',  glow: '',                     dot: 'bg-slate-400',   label: 'Draft' },
      waiting_confirmation: { bg: 'bg-amber-500/15',  text: 'text-amber-300',  border: 'border-amber-500/30',  glow: 'shadow-amber-500/20',  dot: 'bg-amber-400',   label: 'Menunggu' },
      confirmed:            { bg: 'bg-blue-500/15',   text: 'text-blue-300',   border: 'border-blue-500/30',   glow: 'shadow-blue-500/20',   dot: 'bg-blue-400',    label: 'Dikonfirmasi' },
      processing:           { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30', glow: 'shadow-purple-500/20', dot: 'bg-purple-400',  label: 'Diproses' },
      pressing:             { bg: 'bg-rose-500/15',   text: 'text-rose-300',   border: 'border-rose-500/30',   glow: 'shadow-rose-500/20',   dot: 'bg-rose-400',    label: 'Press Sablon' },
      packing:              { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30', glow: 'shadow-orange-500/20', dot: 'bg-orange-400',  label: 'Packing' },
      shipped:              { bg: 'bg-emerald-500/15',text: 'text-emerald-300',border: 'border-emerald-500/30',glow: 'shadow-emerald-500/20',dot: 'bg-emerald-400', label: 'Terkirim' },
      returned:             { bg: 'bg-red-500/15',    text: 'text-red-300',    border: 'border-red-500/30',    glow: 'shadow-red-500/20',    dot: 'bg-red-400',     label: 'Retur' },
      cancelled:            { bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-600/30',  glow: '',                     dot: 'bg-slate-500',   label: 'Batal' },
    };
    const s = specs[status] || { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30', glow: '', dot: 'bg-slate-400', label: status };
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide shadow-sm',
        s.glow, s.bg, s.text, s.border
      )}>
        <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
        {s.label}
      </span>
    );
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <div className="page-header">
        <div className="space-y-0.5">
          <h1 className="page-title">{isDraftPage ? 'Draft Pesanan' : 'Daftar Pesanan'}</h1>
          <p className="text-[12px] text-slate-500 font-medium">
            {isDraftPage ? 'Lanjutkan pesanan yang belum selesai' : 'Kelola dan pantau pesanan Anda'}
          </p>
        </div>
        {user.role === 'mitra' && (
          <Link to="/orders/create" className="btn-primary w-full sm:w-auto group">
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" /> Buat Pesanan Baru
          </Link>
        )}
      </div>

      {/* Control bar */}
      <div className="bg-white/5 rounded-2xl border border-white/5 p-4 shadow-2xl flex flex-col gap-3 backdrop-blur-sm">
        {/* Search row */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Cari nomor pesanan, tipe, atau mitra..."
              className="w-full pl-10 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-[13px] font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-800 transition placeholder:text-slate-600 tabular-nums"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-900/50 border border-slate-800/50 rounded-lg px-3 py-2 tabular-nums whitespace-nowrap hidden sm:flex items-center gap-1">
            <span className="text-slate-300">{totalItems}</span>
            <span className="opacity-60">Pesanan</span>
          </div>
        </div>

        {/* Filter status — dropdown dengan qty + jumlah pesanan */}
        {!isDraftPage && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
            <LayoutList className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-0 text-[12px] font-semibold text-slate-200 outline-none focus:ring-0 cursor-pointer p-0 flex-1"
            >
              <option value="all">Semua Status — {totalStats.orders} pesanan ({totalStats.qty} pcs)</option>
              <option value="waiting_confirmation">Menunggu — {statusStats['waiting_confirmation']?.orders || 0} pesanan ({statusStats['waiting_confirmation']?.qty || 0} pcs)</option>
              <option value="confirmed">Dikonfirmasi — {statusStats['confirmed']?.orders || 0} pesanan ({statusStats['confirmed']?.qty || 0} pcs)</option>
              <option value="processing">Diproses — {statusStats['processing']?.orders || 0} pesanan ({statusStats['processing']?.qty || 0} pcs)</option>
              <option value="pressing">Press Sablon — {statusStats['pressing']?.orders || 0} pesanan ({statusStats['pressing']?.qty || 0} pcs)</option>
              <option value="packing">Packing — {statusStats['packing']?.orders || 0} pesanan ({statusStats['packing']?.qty || 0} pcs)</option>
              <option value="shipped">Terkirim — {statusStats['shipped']?.orders || 0} pesanan ({statusStats['shipped']?.qty || 0} pcs)</option>
            </select>
          </div>
        )}
      </div>

      {/* Mobile view (< md) */}
      <div className="md:hidden space-y-3">
        {paginatedOrders.map(o => {
          const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
          return (
            <motion.div
              variants={itemVariants}
              key={o.id}
              onClick={() => navigate(`/orders/${o.id}`)}
              className="bg-slate-900/40 rounded-2xl border border-white/5 p-4 shadow-xl relative hover:bg-slate-900/60 transition cursor-pointer hover:border-blue-500/30 active:scale-[0.99] group"
            >
              <div className="flex justify-between items-start mb-4">
                {/* Task 4: customer name dominan */}
                <div>
                  {user.role !== 'mitra' && (
                    <p className="font-bold text-white text-sm leading-tight">{mitraName}</p>
                  )}
                  <p className="font-mono text-xs text-slate-500 mt-0.5">{o.orderNumber}</p>
                  <span className="flex items-center text-[11px] text-slate-500 gap-1.5 mt-2 font-medium tabular-nums">
                    <Calendar className="w-3 h-3 opacity-60" /> {formatDate(o.createdAt)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(o.status)}
                  {o.items.some(i => i.dtfStatus === 'sudah_cetak') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-[0.1em] border border-emerald-500/20">
                      DTF
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 bg-black/20 -mx-4 -mb-4 p-4 rounded-b-2xl">
                <div className="flex items-center gap-5">
                  {/* Task 3: kurangi uppercase agresif pada label */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-medium">Tipe</span>
                    <span className="text-[12px] font-semibold text-slate-300 capitalize mt-0.5">{o.type}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-medium">Total</span>
                    <span className="text-[12px] font-bold text-slate-300 mt-0.5 tabular-nums">
                      {o.totalQty} <span className="text-[10px] font-normal opacity-60">pcs</span>
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 rounded-xl flex items-center justify-center transition-all duration-300 border border-slate-700 group-hover:border-blue-500/30 shadow-lg">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
        {paginatedOrders.length === 0 && (
          <motion.div variants={itemVariants} className="bg-slate-900/50 rounded-2xl border border-white/5 p-12 text-center text-slate-500">
            <LayoutList className="w-10 h-10 mx-auto text-slate-700 mb-4 opacity-50" />
            <p className="text-sm font-medium">Tidak ada pesanan.</p>
          </motion.div>
        )}
      </div>

      {/* Desktop view (>= md) */}
      <motion.div
        variants={itemVariants}
        className="hidden md:block bg-slate-900/30 rounded-3xl shadow-2xl border border-white/5 overflow-hidden backdrop-blur-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-slate-300">
            <thead className="bg-slate-950/50 border-b border-white/5 text-slate-500 font-bold text-[10px] uppercase tracking-[0.1em]">
              <tr>
                <th className="px-6 py-4 font-bold">Nomor Pesanan</th>
                <th className="px-6 py-4">Tanggal Masuk</th>
                {user.role !== 'mitra' && <th className="px-6 py-4">Mitra</th>}
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4 text-center">Total Qty</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedOrders.map(o => {
                const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                return (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-white tracking-tighter uppercase whitespace-nowrap">{o.orderNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-500 tabular-nums">{formatDate(o.createdAt)}</td>
                    {user.role !== 'mitra' && <td className="px-6 py-4 font-bold text-slate-200">{mitraName}</td>}
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border',
                        o.type === 'online'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      )}>
                        {o.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-center text-slate-400 tabular-nums">
                      <span className="text-slate-100">{o.totalQty}</span>
                      <span className="text-[11px] font-normal opacity-50 ml-1">pcs</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {o.items.some(i => i.dtfStatus === 'sudah_cetak') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20">
                            DTF
                          </span>
                        )}
                        {getStatusBadge(o.status)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <FileSpreadsheet className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-40" />
                    <p className="text-sm font-medium">Belum ada data pesanan yang tersedia.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination kompak — selalu tampil saat ada data */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between gap-3 bg-slate-900/50 rounded-2xl border border-white/5 px-4 py-3">
          {/* Kiri: page size + info */}
          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-bold text-slate-400 outline-none px-2 py-1.5 cursor-pointer focus:border-slate-700 transition"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-[11px] text-slate-500 tabular-nums hidden sm:block">
              <span className="text-slate-300 font-semibold">{startIndex + 1}–{Math.min(endIndex, totalItems)}</span>
              {' '}<span className="opacity-60">dari</span>{' '}
              <span className="text-slate-300 font-semibold">{totalItems}</span>
            </span>
          </div>

          {/* Kanan: prev + pages + next — selalu tampil */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {getPageNumbers().map((p, idx) => {
                if (p === 'ellipsis1' || p === 'ellipsis2') {
                  return (
                    <span key={`e-${idx}`} className="w-7 text-center text-slate-700 text-xs">…</span>
                  );
                }
                const n = p as number;
                return (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-[12px] font-bold transition-all tabular-nums',
                      n === currentPage
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
