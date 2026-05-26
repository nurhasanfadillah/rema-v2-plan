import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { LedgerEntry, Mitra, Order } from '../types';
import { Plus, Wallet, FileText, ArrowDownLeft, ArrowUpRight, TrendingDown, BookOpen, Clock, Calendar, Info, Filter, ChevronDown, ChevronUp, Trash2, Edit2, X, Download, ExternalLink, Image as ImageIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUpload } from '../components/FileUpload';

export default function Finance() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [mitras, setMitras] = useState<Mitra[]>([]);
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedMitraId, setSelectedMitraId] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      api.mitras.list(),
      api.ledgers.list(),
      api.orders.list(),
    ]).then(([m, l, o]) => {
      setMitras(m);
      setLedgers(l);
      setOrders(o);
      if (user?.role === 'mitra') {
        const active = m.find(mt => mt.userId === user.id);
        if (active) setSelectedMitraId(active.id);
      }
    }).catch(() => toast.error('Gagal memuat data keuangan'));
  }, [user]);

  const activeMitra = mitras.find(m => m.userId === user?.id);

  const handleMitraChange = (id: string) => {
    setSelectedMitraId(id);
    setCurrentPage(1);
  };
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<LedgerEntry | null>(null);
  const [editingLedger, setEditingLedger] = useState<LedgerEntry | null>(null);

  if (!user || user.role === 'staff' || user.role === 'operational') return <div className="p-8 text-center text-red-500 font-bold">Akses ditolak</div>;

  const handleDeleteLedger = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Transaksi',
      message: 'Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan.',
      confirmText: 'Hapus',
      type: 'danger'
    });
    if (!isConfirmed) return;
    try {
      await api.ledgers.remove(id);
      setLedgers(prev => prev.filter(l => l.id !== id));
      toast.success('Transaksi berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus transaksi');
    }
  };

  const handleLedgerSaved = (entry: LedgerEntry, isEdit: boolean) => {
    if (isEdit) {
      setLedgers(prev => prev.map(l => l.id === entry.id ? entry : l));
    } else {
      setLedgers(prev => [entry, ...prev]);
    }
  };

  let displayLedgers = ledgers;
  if (selectedMitraId !== 'all') {
    displayLedgers = ledgers.filter(l => l.mitraId === selectedMitraId);
  }

  // Filter based on date range
  if (dateRange.start) {
    const startTs = new Date(dateRange.start).setHours(0, 0, 0, 0);
    displayLedgers = displayLedgers.filter(l => l.createdAt >= startTs);
  }
  if (dateRange.end) {
    const endTs = new Date(dateRange.end).setHours(23, 59, 59, 999);
    displayLedgers = displayLedgers.filter(l => l.createdAt <= endTs);
  }

  const currentSaldo = displayLedgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);

  // Calculate Tagihan Pending (Proyeksi Tagihan)
  // Status: Dikonfirmasi (confirmed), Diproses (processing), Press Sablon (pressing)
  let relevantOrders = orders.filter(o => ['confirmed', 'processing', 'pressing'].includes(o.status));
  if (selectedMitraId !== 'all') {
    relevantOrders = relevantOrders.filter(o => o.mitraId === selectedMitraId);
  }
  const pendingBills = relevantOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Filter out cancellation and return for debit/credit summary
  const summaryLedgers = displayLedgers.filter(l => l.source !== 'cancellation' && l.source !== 'return');
  const totalDebit = summaryLedgers.reduce((acc, curr) => curr.direction === 'debit' ? acc + curr.nominal : acc, 0);
  const totalCredit = summaryLedgers.reduce((acc, curr) => curr.direction === 'credit' ? acc + curr.nominal : acc, 0);

  const getSourceBadge = (source: string) => {
     switch(source) {
        case 'order': return <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Pesanan</span>;
        case 'payment': return <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Pembahasan</span>;
        case 'manual': return <span className="bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Manual Charge</span>;
        case 'cancellation': return <span className="bg-red-50 border border-red-100 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Batal Pesanan</span>;
        case 'return': return <span className="bg-purple-50 border border-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Kredit Retur</span>;
        default: return <span className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">{source}</span>;
     }
  }

  const sortedLedgers = displayLedgers.sort((a,b) => b.createdAt - a.createdAt);

  const totalItems = sortedLedgers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLedgers = sortedLedgers.slice(startIndex, startIndex + itemsPerPage);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  };

  const formattedNominal = (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 lg:space-y-6"
    >
      <div className="page-header">
        <div>
           <h1 className="page-title">Keuangan & Tagihan Mitra</h1>
           <p className="text-[12px] text-slate-500 mt-0.5 font-semibold">Kelola aliran bayar, kredit retur, dan balance berjalan.</p>
        </div>

        {user.role === 'admin' && (
           <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="btn-success flex-1 sm:flex-none text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" /> Input Bayar
              </button>

              <button
                onClick={() => setIsChargeOpen(true)}
                className="btn-secondary flex-1 sm:flex-none text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" /> Tagihan Manual
              </button>
           </div>
        )}
      </div>

       <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <motion.div
              variants={itemVariants}
              className="card-sm flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl items-center justify-center text-blue-600 shadow-inner flex-shrink-0">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5 truncate">Saldo Piutang {selectedMitraId === 'all' ? '(Global)' : ''}</span>
                  <p className={`text-sm sm:text-xl lg:text-2xl font-black tracking-tight leading-none truncate ${currentSaldo > 0 ? 'text-red-650' : 'text-slate-900'}`}>{formatCurrency(currentSaldo)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="card-sm flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-9 h-9 bg-amber-50 border border-amber-100 rounded-xl items-center justify-center text-amber-600 shadow-inner flex-shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5 truncate">Tagihan Pending {selectedMitraId === 'all' ? '(Global)' : ''}</span>
                  <p className="text-sm sm:text-xl lg:text-2xl font-black tracking-tight leading-none text-slate-900 truncate">{formatCurrency(pendingBills)}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {(dateRange.start || dateRange.end) && (
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-3 sm:gap-4"
            >
               <div className="card-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5">
                     <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                        <ArrowUpRight className="w-3 h-3" />
                     </div>
                     <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Debit (Tagihan)</span>
                  </div>
                  <p className="text-sm sm:text-lg font-black tracking-tight text-red-600 truncate">{formatCurrency(totalDebit)}</p>
               </div>

               <div className="card-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5">
                     <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <ArrowDownLeft className="w-3 h-3" />
                     </div>
                     <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Kredit (Bayar)</span>
                  </div>
                  <p className="text-sm sm:text-lg font-black tracking-tight text-emerald-700 truncate">{formatCurrency(totalCredit)}</p>
               </div>
            </motion.div>
          )}
       </div>

      <div className="pt-1">
        <div className="flex justify-between items-center px-1 mb-2.5">
          <h3 className="font-extrabold text-slate-800 text-[13px] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Riwayat Jurnal
          </h3>
          {user.role === 'admin' && (
             <button
                onClick={() => setShowFilters(!showFilters)}
                className={`border px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer text-[10px] ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
             >
                <Filter className="w-3 h-3" />
                Filter
                {showFilters ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
             </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && user.role === 'admin' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 sm:px-3 sm:py-1.5 flex flex-col sm:flex-row items-center gap-2.5">
                <div className="hidden sm:flex items-center gap-1 text-slate-500 flex-shrink-0">
                  <Filter className="w-2.5 h-2.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Opsi:</span>
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

                <div className="flex flex-wrap items-center gap-2 w-full">
                  <div className="flex items-center gap-1 flex-1 sm:flex-none">
                    <span className="text-[9px] font-bold text-slate-400 uppercase hidden sm:block">Mitra:</span>
                    <select
                      value={selectedMitraId}
                      onChange={e=>handleMitraChange(e.target.value)}
                      className="flex-1 sm:w-36 px-2 py-1 border border-slate-200 rounded-lg bg-white font-extrabold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-[10px]"
                    >
                      <option value="all">Semua Mitra</option>
                      {mitras.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>

                  <div className="hidden sm:block h-3 w-px bg-slate-200 mx-1"></div>

                  <div className="flex items-center gap-1 flex-1 sm:flex-none">
                    <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap hidden sm:block">Periode:</span>
                    <div className="flex items-center gap-1 flex-1">
                      <div className="relative flex-1 sm:flex-none">
                        <Calendar className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400" />
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={e => {
                            setDateRange(prev => ({ ...prev, start: e.target.value }));
                            setCurrentPage(1);
                          }}
                          className="w-full sm:w-24 pl-5 pr-1 py-1 border border-slate-200 rounded-lg bg-white font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-[9.5px]"
                        />
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase hidden sm:block">ke</span>
                      <div className="relative flex-1 sm:flex-none">
                        <Calendar className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400" />
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={e => {
                            setDateRange(prev => ({ ...prev, end: e.target.value }));
                            setCurrentPage(1);
                          }}
                          className="w-full sm:w-24 pl-5 pr-1 py-1 border border-slate-200 rounded-lg bg-white font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-[9.5px]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedMitraId('all');
                      setDateRange({ start: '', end: '' });
                      setCurrentPage(1);
                    }}
                    className="ml-auto text-[9px] font-black text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded-lg transition-all uppercase tracking-wider"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile view (< md) */}
        <div className="md:hidden space-y-2.5">
        {paginatedLedgers.map(l => {
          const isDebit = l.direction === 'debit';
          const mName = mitras.find(m => m.id === l.mitraId)?.name || 'Unknown';
          return (
            <motion.div
              variants={itemVariants}
              key={l.id}
              onClick={() => setSelectedLedger(l)}
              className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-xs relative cursor-pointer hover:border-blue-300 transition-all"
            >
               <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                     <div className="flex flex-col gap-0">
                        {user.role === 'admin' && selectedMitraId === 'all' && (
                           <span className="font-black text-slate-900 text-[11px] leading-tight block truncate max-w-[120px]">{mName}</span>
                        )}
                        <span className="text-[9px] text-slate-400 font-bold tracking-tight">{formatDate(l.createdAt)}</span>
                     </div>
                  </div>
                  <div>
                     {getSourceBadge(l.source)}
                  </div>
               </div>
               <div className="flex justify-between items-center bg-slate-50/70 -mx-3 -mb-3 p-3 py-2 px-3 rounded-b-xl border-t border-slate-100">
                  <p className="text-[10px] text-slate-600 flex-1 truncate pr-3 font-semibold" title={l.description}>{l.description}</p>
                  <p className={`text-[11px] font-black tracking-tight whitespace-nowrap ${isDebit ? 'text-red-650' : 'text-emerald-700'}`}>
                     {isDebit ? '+' : '-'}{formatCurrency(l.nominal)}
                  </p>
               </div>
            </motion.div>
          )
        })}
        {sortedLedgers.length === 0 && (
          <motion.div variants={itemVariants} className="bg-white border-2 border-dashed text-center p-10 rounded-3xl mt-4">
             <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3"/>
             <p className="text-slate-800 font-bold text-sm">Belum ada transaksi tercatat.</p>
          </motion.div>
        )}
      </div>

      {/* Desktop view (>= md) */}
      <motion.div
        variants={itemVariants}
        className="hidden md:block bg-white rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.03),0_4px_12px_-8px_rgba(0,0,0,0.01)] border border-slate-200/60 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-900 font-extrabold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                {user.role === 'admin' && selectedMitraId === 'all' && <th className="px-4 py-3">Mitra</th>}
                <th className="px-4 py-3">Sumber</th>
                <th className="px-4 py-3 font-bold">Deskripsi</th>
                <th className="px-4 py-3 text-right">Debit (+)</th>
                <th className="px-4 py-3 text-right">Kredit (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {paginatedLedgers.map(l => {
                const isDebit = l.direction === 'debit';
                const mName = mitras.find(m => m.id === l.mitraId)?.name || 'Unknown';
                return (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50/70 transition-colors duration-200 cursor-pointer"
                    onClick={() => setSelectedLedger(l)}
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-400 text-[11px]">{formatDate(l.createdAt)}</td>
                    {user.role === 'admin' && selectedMitraId === 'all' && <td className="px-4 py-2.5 font-extrabold text-slate-900">{mName}</td>}
                    <td className="px-4 py-2.5">{getSourceBadge(l.source)}</td>
                    <td className="px-4 py-2.5 font-medium max-w-[200px] truncate" title={l.description}>{l.description}</td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-red-650">{isDebit ? formatCurrency(l.nominal) : '-'}</td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-emerald-700">{!isDebit ? formatCurrency(l.nominal) : '-'}</td>
                  </tr>
                );
              })}
              {sortedLedgers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 font-bold">
                    <BookOpen className="w-8 h-8 text-slate-250 mx-auto mb-2" />
                    Belum ada aliran kas tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination & Page Size UI */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm mt-4">
          <div className="flex items-center gap-3 order-2 sm:order-1">
            <span className="text-[11px] font-bold text-slate-500">Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-[11px]"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-[11px] font-bold text-slate-500">dari {totalItems} entri</span>
          </div>

          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 5) return true;
                  return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="text-slate-400 text-[11px] font-bold px-1">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>

      {isPaymentOpen && <PaymentModal onClose={()=>setIsPaymentOpen(false)} onSave={handleLedgerSaved} formattedNominal={formattedNominal} mitras={mitras} />}
      {isChargeOpen && <ChargeModal onClose={()=>setIsChargeOpen(false)} onSave={handleLedgerSaved} formattedNominal={formattedNominal} mitras={mitras} />}

      {editingLedger && (
         editingLedger.source === 'payment'
           ? <PaymentModal
               editData={editingLedger}
               onClose={()=>setEditingLedger(null)}
               onSave={handleLedgerSaved}
               formattedNominal={formattedNominal}
               mitras={mitras}
             />
           : <ChargeModal
               editData={editingLedger}
               onClose={()=>setEditingLedger(null)}
               onSave={handleLedgerSaved}
               formattedNominal={formattedNominal}
               mitras={mitras}
             />
      )}

      {selectedLedger && (
        <TransactionDetailModal
          ledger={selectedLedger}
          onClose={() => setSelectedLedger(null)}
          onEdit={(l) => {
            setSelectedLedger(null);
            setEditingLedger(l);
          }}
          onDelete={(id) => {
            setSelectedLedger(null);
            handleDeleteLedger(id);
          }}
          isAdmin={user.role === 'admin'}
          mitras={mitras}
        />
      )}
    </motion.div>
  );
}

function PaymentModal({ onClose, onSave, formattedNominal, editData, mitras }: {
  onClose: () => void,
  onSave: (entry: LedgerEntry, isEdit: boolean) => void,
  formattedNominal: (v: string) => string,
  editData?: LedgerEntry,
  mitras: Mitra[]
}) {
  const { confirm } = useConfirm();
  const [mitra, setMitra] = useState(editData?.mitraId || mitras[0]?.id || '');
  const [nominalDisplay, setNominalDisplay] = useState(editData ? formattedNominal(editData.nominal.toString()) : '');
  const [method, setMethod] = useState(editData?.paymentMethod || 'transfer');
  const [ref, setRef] = useState(editData?.referenceNumber || '');
  const [attachment, setAttachment] = useState(editData?.attachmentUrl || '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseInt(nominalDisplay.replace(/\D/g, ''));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      toast.error('Masukan nominal yang valid!');
      return;
    }

    const isConfirmed = await confirm({
      title: editData ? 'Update Pembayaran' : 'Simpan Pembayaran',
      message: `Apakah Anda yakin ingin ${editData ? 'mengubah' : 'menyimpan'} pembayaran sebesar ${formattedNominal(cleanNum.toString())} ini?`,
      confirmText: 'Simpan',
      type: 'info'
    });
    if (!isConfirmed) return;

    try {
      if (editData) {
        const updated = await api.ledgers.update(editData.id, {
          mitraId: mitra,
          nominal: cleanNum,
          description: `Pembayaran ${method.toUpperCase()} - Ref: ${ref}`,
          paymentMethod: method,
          referenceNumber: ref,
          attachmentUrl: attachment,
        });
        await api.auditLogs.create({ userId: 'admin', action: 'PAYMENT_EDITED', details: `ID: ${editData.id}, Nominal: ${cleanNum}` });
        toast.success('Pembayaran berhasil diperbarui!');
        onSave(updated, true);
      } else {
        const entry = await api.ledgers.create({
          mitraId: mitra,
          source: 'payment',
          direction: 'credit',
          nominal: cleanNum,
          description: `Pembayaran ${method.toUpperCase()} - Ref: ${ref}`,
          createdAt: Date.now(),
          paymentMethod: method,
          referenceNumber: ref,
          attachmentUrl: attachment,
        });
        await api.auditLogs.create({ userId: 'admin', action: 'PAYMENT_ADDED', details: `Nominal: ${entry.nominal}` });
        toast.success('Pembayaran berhasil ditambahkan!');
        onSave(entry, false);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pembayaran');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6 animate-in slide-in-from-bottom-6 max-h-[95vh] overflow-y-auto">
        <h2 className="text-[16px] font-black tracking-tight text-slate-900 mb-5 flex items-center gap-2">
          <span>💳</span> {editData ? 'Edit' : 'Input'} Pengurangan Piutang
        </h2>
        <form onSubmit={submit} className="space-y-3.5">
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pilih Mitra Partner</label>
             <select required value={mitra} onChange={e=>setMitra(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 text-[11px]">
                {mitras.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nominal Setoran (Rp)</label>
             <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px]">Rp</span>
               <input
                 required
                 type="text"
                 value={nominalDisplay}
                 onChange={e=>setNominalDisplay(formattedNominal(e.target.value))}
                 className="w-full pl-9 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-extrabold text-slate-800 text-[13px]"
                 placeholder="0"
               />
             </div>
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Metode Bayar</label>
             <select required value={method} onChange={e=>setMethod(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 text-[11px]">
                <option value="transfer">Bank Transfer (Manual)</option>
                <option value="cash">Setor Tunai (Cash)</option>
                <option value="qris">E-Wallet / QRIS</option>
                <option value="lainnya">Lainnya</option>
             </select>
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kode Referensi</label>
             <input required value={ref} onChange={e=>setRef(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 text-[11px]" placeholder="Mis. TF-BCA-928" />
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bukti Transaksi (Opsional)</label>
             <FileUpload
                onChange={url => setAttachment(url)}
                value={attachment}
                label="Klik/Drop Bukti Bayar"
             />
          </div>
          <div className="pt-4 flex justify-end gap-2.5">
             <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-[11px] cursor-pointer">Batal</button>
             <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-555/10 text-[11px] cursor-pointer active:scale-95">Simpan Kredit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChargeModal({ onClose, onSave, formattedNominal, editData, mitras }: {
  onClose: () => void,
  onSave: (entry: LedgerEntry, isEdit: boolean) => void,
  formattedNominal: (v: string) => string,
  editData?: LedgerEntry,
  mitras: Mitra[]
}) {
  const { confirm } = useConfirm();
  const [mitra, setMitra] = useState(editData?.mitraId || mitras[0]?.id || '');
  const [nominalDisplay, setNominalDisplay] = useState(editData ? formattedNominal(editData.nominal.toString()) : '');
  const [desc, setDesc] = useState(editData?.description || '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseInt(nominalDisplay.replace(/\D/g, ''));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      toast.error('Masukan nominal yang valid!');
      return;
    }

    const isConfirmed = await confirm({
      title: editData ? 'Update Tagihan' : 'Simpan Tagihan',
      message: `Apakah Anda yakin ingin ${editData ? 'mengubah' : 'menyimpan'} penambahan tagihan sebesar ${formattedNominal(cleanNum.toString())} ini?`,
      confirmText: 'Simpan',
      type: 'info'
    });
    if (!isConfirmed) return;

    try {
      if (editData) {
        const updated = await api.ledgers.update(editData.id, {
          mitraId: mitra,
          nominal: cleanNum,
          description: desc,
        });
        await api.auditLogs.create({ userId: 'admin', action: 'MANUAL_CHARGE_EDITED', details: `ID: ${editData.id}, Nominal: ${cleanNum}` });
        toast.success('Manual charge berhasil diperbarui!');
        onSave(updated, true);
      } else {
        const entry = await api.ledgers.create({
          mitraId: mitra,
          source: 'manual',
          direction: 'debit',
          nominal: cleanNum,
          description: desc,
          createdAt: Date.now(),
        });
        await api.auditLogs.create({ userId: 'admin', action: 'MANUAL_CHARGE_ADDED', details: `Nominal: ${entry.nominal}` });
        toast.success('Manual charge (debit) berhasil ditambahkan!');
        onSave(entry, false);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan tagihan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6 animate-in slide-in-from-bottom-6 transition-all max-h-[90vh] overflow-y-auto">
        <h2 className="text-[16px] font-black tracking-tight text-slate-900 mb-5 flex items-center gap-2">
          <span>📈</span> {editData ? 'Edit' : 'Input'} Tambahan Piutang
        </h2>
        <form onSubmit={submit} className="space-y-3.5">
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pilih Mitra Partner</label>
             <select required value={mitra} onChange={e=>setMitra(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 text-[11px]">
                {mitras.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nominal Penambahan Tagihan (Rp)</label>
             <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px]">Rp</span>
               <input
                 required
                 type="text"
                 value={nominalDisplay}
                 onChange={e=>setNominalDisplay(formattedNominal(e.target.value))}
                 className="w-full pl-9 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-extrabold text-slate-800 text-[13px]"
                 placeholder="0"
               />
             </div>
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Uraian Deskripsi Tagihan</label>
             <input required value={desc} onChange={e=>setDesc(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 text-[11px]" placeholder="Mis. Denda, Tambah Layanan" />
          </div>
          <div className="pt-4 flex justify-end gap-2.5">
             <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-[11px] cursor-pointer">Batal</button>
             <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md text-[11px] cursor-pointer active:scale-95">Simpan Tagihan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransactionDetailModal({ ledger, onClose, onEdit, onDelete, isAdmin, mitras }: {
  ledger: LedgerEntry,
  onClose: () => void,
  onEdit: (l: LedgerEntry) => void,
  onDelete: (id: string) => void,
  isAdmin: boolean,
  mitras: Mitra[]
}) {
  const isDebit = ledger.direction === 'debit';
  const mName = mitras.find(m => m.id === ledger.mitraId)?.name || 'Unknown';
  const isManual = ledger.source === 'manual' || ledger.source === 'payment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 sm:p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
           <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${isDebit ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                 {isDebit ? <ArrowUpRight className="w-5 h-5"/> : <ArrowDownLeft className="w-5 h-5"/>}
              </div>
              <p className={`text-lg font-black tracking-tight ${isDebit ? 'text-red-650' : 'text-emerald-700'}`}>
                 {isDebit ? '+' : '-'}{formatCurrency(ledger.nominal)}
              </p>
           </div>
           <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
              <X className="w-4 h-4" />
           </button>
        </div>

        <div className="space-y-4">
           <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <div>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Waktu</span>
                 <p className="text-[10px] font-extrabold text-slate-800">{formatDate(ledger.createdAt)}</p>
              </div>
              <div>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Mitra</span>
                 <p className="text-[10px] font-extrabold text-slate-800">{mName}</p>
              </div>
              <div>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Sumber</span>
                 <p className="text-[10px] font-extrabold text-slate-800 uppercase">{ledger.source}</p>
              </div>
              <div>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Tipe</span>
                 <p className="text-[10px] font-extrabold text-slate-800 uppercase">{ledger.direction}</p>
              </div>
           </div>

           <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Deskripsi</span>
              <p className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-100 p-2.5 rounded-lg leading-relaxed italic">
                 "{ledger.description}"
              </p>
           </div>

           {ledger.attachmentUrl && (
              <div>
                 <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Bukti Transaksi</span>
                 <div className="relative group cursor-pointer border rounded-xl overflow-hidden bg-slate-50 aspect-video flex items-center justify-center shadow-sm hover:border-blue-300 transition-all duration-300">
                    <img src={ledger.attachmentUrl} alt="Bukti Transaksi" className="max-w-full max-h-full object-contain" />
                    <a
                      href={ledger.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center"
                    >
                       <ExternalLink className="text-white opacity-0 group-hover:opacity-100 w-5 h-5" />
                    </a>
                 </div>
              </div>
           )}

           {isAdmin && isManual && (
              <div className="flex gap-2.5 pt-1">
                 <button
                    onClick={() => onEdit(ledger)}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all text-[11px]"
                 >
                    <Edit2 className="w-3 h-3" /> Edit
                 </button>
                 <button
                    onClick={() => onDelete(ledger.id)}
                    className="flex-1 bg-red-50 border border-red-100 text-red-600 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-all text-[11px]"
                 >
                    <Trash2 className="w-3 h-3" /> Hapus
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
