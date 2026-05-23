import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { formatDate } from '../../lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Eye, Package, Calendar, User, LayoutList, Search, ArrowRight, Layers, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function OrdersList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const orders = db.getOrders();
  const mitras = db.getMitras();
  const [searchQuery, setSearchQuery] = useState('');
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
      waiting_confirmation: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', dot: 'bg-amber-505', label: 'Menunggu' },
      confirmed: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', border: 'border-blue-200/60', dot: 'bg-blue-500', label: 'Dikonfirmasi' },
      processing: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/60', dot: 'bg-purple-500', label: 'Diproses' },
      printing: { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200/60', dot: 'bg-indigo-500', label: 'Cetak DTF' },
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
        <div>
          <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-2 py-0.5 w-max mb-1.5">
            <Layers className="w-3.5 h-3.5" /> Monitor Transaksi
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{isDraftPage ? 'Draft Unit Pesanan' : 'Daftar Manajemen Pesanan'}</h1>
          <p className="text-[13px] text-slate-500 mt-0.5 font-medium">{isDraftPage ? 'Lanjutkan pesanan yang belum selesai' : 'Kelola dan pantau pesanan Anda'}</p>
        </div>
        {user.role === 'mitra' && (
          <Link 
            to="/orders/create"
            className="bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-50 hover:to-indigo-400 text-white px-5 py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 active:scale-[0.98] w-full sm:w-auto text-center"
          >
            <Plus className="w-4.5 h-4.5" /> Buat Pesanan Baru
          </Link>
        )}
      </div>

      {/* Control bar */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Cari berdasarkan nomor order, tipe, atau nama mitra..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white transition"
          />
        </div>
        
        <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 self-stretch sm:self-auto justify-center flex items-center">
          Total: {totalItems} Pesanan
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
              className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm relative hover:shadow-md transition cursor-pointer hover:border-slate-300 active:scale-[0.99]"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-mono font-black text-slate-900 text-sm">{o.orderNumber}</h3>
                  <div className="flex flex-col gap-1 mt-1.5">
                     <span className="flex items-center text-xs text-slate-500 gap-1.5 font-bold"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(o.createdAt)}</span>
                     {user.role !== 'mitra' && (
                       <span className="flex items-center text-xs text-slate-500 gap-1.5 font-extrabold"><User className="w-3.5 h-3.5 text-slate-400" /> {mitraName}</span>
                     )}
                  </div>
                </div>
                <div>{getStatusBadge(o.status)}</div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100 bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Tipe</span>
                     <span className="text-xs font-bold text-slate-700 capitalize mt-0.5">{o.type}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total</span>
                     <span className="text-xs font-bold text-slate-700 mt-0.5">{o.totalQty} pcs</span>
                   </div>
                </div>
                <div className="w-7 h-7 bg-slate-100 hover:bg-slate-200/80 rounded-full flex items-center justify-center text-slate-500 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
        {paginatedOrders.length === 0 && (
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
             <LayoutList className="w-10 h-10 mx-auto text-slate-400 mb-3" />
             Tidak ada pesanan.
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
                <th className="px-6 py-4">Nomor Pesanan</th>
                <th className="px-6 py-4">Tanggal Masuk</th>
                {user.role !== 'mitra' && <th className="px-6 py-4">Mitra</th>}
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4 text-center">Total Qty</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 font-bold">
              {paginatedOrders.map(o => {
                const mitraName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                return (
                  <tr 
                    key={o.id} 
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="hover:bg-slate-50/70 transition-colors duration-200 cursor-pointer font-semibold"
                  >
                    <td className="px-6 py-4 font-mono font-black text-slate-900">{o.orderNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-500">{formatDate(o.createdAt)}</td>
                    {user.role !== 'mitra' && <td className="px-6 py-4 font-extrabold text-slate-900">{mitraName}</td>}
                    <td className="px-6 py-4 capitalize font-bold">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${o.type === 'online' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {o.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-center text-slate-800">{o.totalQty} pcs</td>
                    <td className="px-6 py-4 text-right">{getStatusBadge(o.status)}</td>
                  </tr>
                );
              })}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    Belum ada data pesanan yang tersedia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest whitespace-nowrap">Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent border-0 text-[10px] font-extrabold text-slate-700 uppercase outline-none focus:ring-0 cursor-pointer p-0 pr-1"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="text-xs font-semibold text-slate-500 text-center sm:text-left">
              Menampilkan <span className="font-bold text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</span> sampai{' '}
              <span className="font-bold text-slate-800">{Math.min(endIndex, totalItems)}</span> dari{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> pesanan
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 disabled:cursor-not-allowed"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {getPageNumbers().map((p, idx) => {
                if (p === 'ellipsis1' || p === 'ellipsis2') {
                  return (
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs font-semibold">
                      ...
                    </span>
                  );
                }
                const pageNum = p as number;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-40 disabled:hover:bg-transparent text-slate-600 disabled:cursor-not-allowed"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

