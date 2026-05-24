import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { formatDate, cn } from '../../lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Eye, Package, Calendar, User, LayoutList, Search, ArrowRight, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function OrdersList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const orders = db.getOrders();
  const mitras = db.getMitras();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  if (!user) return null;

  const isDraftPage = location.pathname.includes('/drafts');

  // Filter based on role and creator permissions for drafts
  let displayOrders = orders;
  const activeMitra = mitras.find(m => m.userId === user.id);
  
  // Rule: draft status orders can ONLY be seen by their creator
  displayOrders = displayOrders.filter(o => {
    if (o.status !== 'draft') return true;
    const creatorUserId = o.creatorId || mitras.find(m => m.id === o.mitraId)?.userId;
    return creatorUserId === user.id;
  });

  if (user.role === 'mitra') {
    displayOrders = displayOrders.filter(o => o.mitraId === activeMitra?.id);
  } else if (user.role === 'staff' || user.role === 'admin') {
    // Admin & Staff can see everything that isn't a draft belonging to someone else
  } else if (user.role === 'operational') {
    // Operational can see from confirmed onwards
    displayOrders = orders.filter(o => !['draft', 'waiting_confirmation'].includes(o.status));
  }
  
  // Filter out cancelled and returned orders since they are only displayed on the Cancellations & Returns page
  displayOrders = displayOrders.filter(o => !['cancelled', 'returned'].includes(o.status));
  
  if (isDraftPage) {
    displayOrders = displayOrders.filter(o => o.status === 'draft');
  } else if (user.role === 'mitra') {
    displayOrders = displayOrders.filter(o => o.status !== 'draft');
  }

  // Status Filter
  const statusStats = displayOrders.reduce((acc, order) => {
    if (!acc[order.status]) {
      acc[order.status] = { orders: 0, qty: 0 };
    }
    acc[order.status].orders += 1;
    acc[order.status].qty += (order.totalQty || 0);
    return acc;
  }, {} as Record<string, { orders: number; qty: number }>);

  const totalStats = Object.values(statusStats).reduce((acc, curr) => {
    acc.orders += curr.orders;
    acc.qty += curr.qty;
    return acc;
  }, { orders: 0, qty: 0 });

  if (!isDraftPage && statusFilter !== 'all') {
    displayOrders = displayOrders.filter(o => o.status === statusFilter);
  }

  // Live filter query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayOrders = displayOrders.filter(o => 
      o.orderNumber.toLowerCase().includes(q) || 
      o.type.toLowerCase().includes(q) ||
      (mitras.find(m => m.id === o.mitraId)?.name || '').toLowerCase().includes(q)
    );
  }
  
  const sortedOrders = displayOrders.sort((a,b) => b.createdAt - a.createdAt);

  // Pagination calculations
  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  // If page index exceeds total page count after search or page size change, adjust page index.
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push('ellipsis1');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('ellipsis2');
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  const getStatusBadge = (status: string) => {
    const specs: Record<string, { bg: string, text: string, border: string, dot: string, label: string }> = {
      draft: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400', label: 'Draft' },
      waiting_confirmation: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', dot: 'bg-amber-500', label: 'Menunggu' },
      confirmed: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', border: 'border-blue-200/60', dot: 'bg-blue-500', label: 'Dikonfirmasi' },
      processing: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/60', dot: 'bg-purple-500', label: 'Diproses' },
      pressing: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', border: 'border-rose-200/60', dot: 'bg-rose-500', label: 'Press Sablon' },
      packing: { bg: 'bg-orange-50 border-orange-100', text: 'text-orange-700', border: 'border-orange-200/60', dot: 'bg-orange-500', label: 'Packing' },
      shipped: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700 border-emerald-200/60', border: 'border-emerald-200/60', dot: 'bg-emerald-500', label: 'Kirim' },
      returned: { bg: 'bg-red-50 border-red-100', text: 'text-red-700', border: 'border-red-200/60', dot: 'bg-red-500', label: 'Retur' },
      cancelled: { bg: 'bg-slate-900', text: 'text-slate-100', border: 'border-slate-800', dot: 'bg-slate-500', label: 'Batal' },
    };

    const s = specs[status] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400', label: status };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${s.bg} ${s.text} ${s.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
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
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tighter text-white">{isDraftPage ? 'Draft Unit Pesanan' : 'Daftar Manajemen Pesanan'}</h1>
          <p className="text-[12px] text-slate-500 font-medium tracking-wide italic opacity-80">{isDraftPage ? 'Lanjutkan pesanan yang belum selesai' : 'Kelola dan pantau pesanan Anda'}</p>
        </div>
        {user.role === 'mitra' && (
          <Link 
            to="/orders/create"
            className="bg-slate-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all border border-slate-800 hover:border-blue-500 shadow-xl shadow-black/20 active:scale-[0.98] w-full sm:w-auto text-center group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" /> Buat Pesanan Baru
          </Link>
        )}
      </div>

      {/* Control bar */}
      <div className="bg-white/5 rounded-2xl border border-white/5 p-4 shadow-2xl flex flex-col lg:flex-row gap-4 items-center justify-between backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-3xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Cari nomor order, tipe, atau mitra..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-[13px] font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-950 transition placeholder:text-slate-600 tabular-nums"
            />
          </div>
          
          {!isDraftPage && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 min-w-[200px]">
              <LayoutList className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-0 text-[11px] font-bold text-slate-300 outline-none focus:ring-0 cursor-pointer p-0 pr-6 flex-1 italic"
              >
                <option value="all">Semua Status - {totalStats.orders} ({totalStats.qty})</option>
                <option value="waiting_confirmation">Menunggu - {statusStats['waiting_confirmation']?.orders || 0} ({statusStats['waiting_confirmation']?.qty || 0})</option>
                <option value="confirmed">Dikonfirmasi - {statusStats['confirmed']?.orders || 0} ({statusStats['confirmed']?.qty || 0})</option>
                <option value="processing">Diproses - {statusStats['processing']?.orders || 0} ({statusStats['processing']?.qty || 0})</option>
                <option value="pressing">Press Sablon - {statusStats['pressing']?.orders || 0} ({statusStats['pressing']?.qty || 0})</option>
                <option value="packing">Packing - {statusStats['packing']?.orders || 0} ({statusStats['packing']?.qty || 0})</option>
                <option value="shipped">Kirim - {statusStats['shipped']?.orders || 0} ({statusStats['shipped']?.qty || 0})</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] bg-slate-900/50 border border-slate-800/50 rounded-lg px-4 py-2 self-stretch lg:self-auto justify-center flex items-center tabular-nums">
          Total: <span className="text-slate-300 ml-1.5 font-bold italic">{totalItems}</span> <span className="ml-1 opacity-60">Pesanan</span>
        </div>
      </div>

      {/* Mobile view (< md) */}
      <div className="md:hidden space-y-4">
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
                <div>
                  <h3 className="font-mono font-bold text-white text-sm tracking-tighter uppercase">{o.orderNumber}</h3>
                  <div className="flex flex-col gap-1.5 mt-2">
                     <span className="flex items-center text-[11px] text-slate-500 gap-2 font-medium tabular-nums"><Calendar className="w-3.5 h-3.5 opacity-60" /> {formatDate(o.createdAt)}</span>
                     {user.role !== 'mitra' && (
                       <span className="flex items-center text-[11px] text-slate-400 gap-2 font-bold"><User className="w-3.5 h-3.5 opacity-60" /> {mitraName}</span>
                     )}
                  </div>
                </div>
                <div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(o.status)}
                    {o.items.some(i => i.dtfStatus === 'sudah_cetak') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-[0.1em] border border-emerald-500/20">
                        DTF
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 bg-black/20 -mx-4 -mb-4 p-4 rounded-b-2xl">
                <div className="flex items-center gap-6">
                   <div className="flex flex-col">
                     <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Tipe</span>
                     <span className="text-[12px] font-semibold text-slate-300 capitalize mt-0.5">{o.type}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Total</span>
                     <span className="text-[12px] font-bold text-slate-300 mt-0.5 tabular-nums">{o.totalQty} <span className="text-[10px] font-normal opacity-60">pcs</span></span>
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
            <thead className="bg-slate-950/50 border-b border-white/5 text-slate-500 font-bold text-[10px] uppercase tracking-[0.15em]">
              <tr>
                <th className="px-6 py-4.5 font-bold">Nomor Pesanan</th>
                <th className="px-6 py-4.5">Tanggal Masuk</th>
                {user.role !== 'mitra' && <th className="px-6 py-4.5">Mitra</th>}
                <th className="px-6 py-4.5">Tipe</th>
                <th className="px-6 py-4.5 text-center">Total Qty</th>
                <th className="px-6 py-4.5 text-right">Status</th>
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
                    <td className="px-6 py-4 font-medium text-slate-500 italic tabular-nums">{formatDate(o.createdAt)}</td>
                    {user.role !== 'mitra' && <td className="px-6 py-4 font-bold text-slate-200">{mitraName}</td>}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${o.type === 'online' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {o.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-center text-slate-400 tabular-nums">
                      <span className="text-slate-100">{o.totalQty}</span> <span className="text-[11px] font-normal opacity-50 ml-1 italic">pcs</span>
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

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 bg-slate-900/50 rounded-2xl shadow-xl border border-white/5 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 shadow-inner">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">Show Limit:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent border-0 text-[11px] font-bold text-slate-300 uppercase outline-none focus:ring-0 cursor-pointer p-0 pr-1 tabular-nums italic"
              >
                <option value={5}>5 Units</option>
                <option value={10}>10 Units</option>
                <option value={25}>25 Units</option>
                <option value={50}>50 Units</option>
                <option value={100}>100 Units</option>
              </select>
            </div>
            
            <div className="text-[12px] font-medium text-slate-500 text-center sm:text-left tracking-wide">
              Menampilkan <span className="font-bold text-slate-300 tabular-nums">{(startIndex + 1).toLocaleString()}</span> –{' '}
              <span className="font-bold text-slate-300 tabular-nums">{Math.min(endIndex, totalItems).toLocaleString()}</span> <span className="opacity-60 italic mx-1">dari</span>{' '}
              <span className="font-bold text-slate-300 tabular-nums">{totalItems.toLocaleString()}</span> <span className="opacity-60 italic uppercase text-[10px] font-bold tracking-tighter">Entri Pesanan</span>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-1 self-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center border border-slate-800 rounded-xl bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg active:scale-90"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              
              <div className="flex items-center gap-1 mx-1.5">
                {getPageNumbers().map((p, idx) => {
                  if (p === 'ellipsis1' || p === 'ellipsis2') {
                    return (
                      <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-700 text-xs font-bold">
                        •••
                      </span>
                    );
                  }
                  const pageNum = p as number;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold transition-all duration-300 tabular-nums",
                        isActive
                          ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-110"
                          : "text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center border border-slate-800 rounded-xl bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg active:scale-90"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

