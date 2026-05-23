import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { formatCurrency, formatDate } from '../lib/utils';
import { Order, OrderStatus, ActionRequest } from '../types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../context/ConfirmContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XOctagon, RefreshCw, AlertTriangle, CheckCircle, ArrowRight, Calendar, 
  User, Trash2, FileText, CheckCircle2, ShoppingBag, Landmark
} from 'lucide-react';

export default function CancellationsReturns() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  // Load database entities
  const [orders, setOrders] = useState<Order[]>(db.getOrders());
  const mitras = db.getMitras();
  const activeMitra = mitras.find(m => m.userId === user?.id);

  // Form states
  const [activeForm, setActiveForm] = useState<'cancellation' | 'return' | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  if (!user) return null;

  // Filter cancelled or returned orders for display
  let displayedOrders = orders.filter(o => ['cancelled', 'returned'].includes(o.status));
  if (user.role === 'mitra') {
    displayedOrders = displayedOrders.filter(o => o.mitraId === activeMitra?.id);
  }

  // Get eligible orders for dropdown depends on action type
  const getEligibleOrders = (type: 'cancellation' | 'return') => {
    let pool = orders;
    if (user.role === 'mitra') {
      pool = orders.filter(o => o.mitraId === activeMitra?.id);
    }

    if (type === 'cancellation') {
      // Cancellation eligible: confirmed down to packing
      return pool.filter(o => ['confirmed', 'processing', 'printing', 'pressing', 'packing'].includes(o.status));
    } else {
      // Return eligible: only 'shipped' status
      return pool.filter(o => o.status === 'shipped');
    }
  };

  const eligibleOrders = activeForm ? getEligibleOrders(activeForm) : [];

  const handleOpenForm = (type: 'cancellation' | 'return') => {
    const list = getEligibleOrders(type);
    if (list.length === 0) {
      toast.error(`Tidak ada pesanan yang memenuhi syarat untuk ${type === 'cancellation' ? 'pembatalan/pembatalan' : 'retur'}.`);
      return;
    }
    setActiveForm(type);
    setSelectedOrderId(list[0]?.id || '');
    setReason('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      toast.error('Silakan pilih pesanan terlebih dahulu.');
      return;
    }

    const orderToProcess = orders.find(o => o.id === selectedOrderId);
    if (!orderToProcess) {
      toast.error('Pesanan tidak ditemukan.');
      return;
    }

    const isCancel = activeForm === 'cancellation';
    const newStatus: OrderStatus = isCancel ? 'cancelled' : 'returned';

    // Access control check
    const allowedRoles = ['admin', 'staff', 'mitra'];
    if (!allowedRoles.includes(user.role)) {
      toast.error('Anda tidak memiliki izin untuk melakukan pembatalan atau retur.');
      return;
    }

    const isConfirmed = await confirm({
      title: isCancel ? 'Konfirmasi Pembatalan' : 'Konfirmasi Retur Pesanan',
      message: `Apakah Anda yakin ingin ${isCancel ? 'membatalkan' : 'meretur'} pesanan #${orderToProcess.orderNumber}? Tindakan ini bersifat permanen dan saldo tagihan akan otomatis disesuaikan.`,
      confirmText: isCancel ? 'Ya, Batalkan' : 'Ya, Retur',
      type: 'danger'
    });

    if (!isConfirmed) return;

    // Billing adjustments (just like standard rules)
    if (orderToProcess.isBilled) {
      const newLedgerEntry = {
        id: crypto.randomUUID(),
        mitraId: orderToProcess.mitraId,
        source: (isCancel ? 'cancellation' : 'return') as 'cancellation' | 'return',
        direction: 'credit' as const,
        nominal: orderToProcess.totalAmount,
        description: `${isCancel ? 'Batal' : 'Retur'} Pesanan ${orderToProcess.orderNumber}`,
        createdAt: Date.now(),
        referenceId: orderToProcess.id
      };
      db.saveLedgers([newLedgerEntry, ...db.getLedgers()]);
    }

    // Update order status
    const updatedOrder: Order = {
      ...orderToProcess,
      status: newStatus,
      updatedAt: Date.now()
    };

    const newOrders = orders.map(o => o.id === orderToProcess.id ? updatedOrder : o);
    db.saveOrders(newOrders);
    setOrders(newOrders);

    // Save action request log in local DB
    const newRequest: ActionRequest = {
      id: crypto.randomUUID(),
      type: isCancel ? 'cancellation' : 'return',
      orderId: orderToProcess.id,
      mitraId: orderToProcess.mitraId,
      reason: reason || (isCancel ? 'Pembatalan instan melalui form' : 'Retur instan melalui form'),
      status: 'resolved',
      creditAmount: orderToProcess.isBilled ? orderToProcess.totalAmount : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    db.saveRequests([newRequest, ...db.getRequests()]);

    // Save Audit Log
    db.addAuditLog({
      userId: user.id,
      action: isCancel ? 'CANCEL_ORDER' : 'RETURN_ORDER',
      details: `${isCancel ? 'Batal' : 'Retur'} pesanan ${orderToProcess.orderNumber} via form manajemen`
    });

    toast.success(`Pesanan #${orderToProcess.orderNumber} berhasil ${isCancel ? 'dibatalkan' : 'diretur'}.`);
    setActiveForm(null);
    setSelectedOrderId('');
    setReason('');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black bg-slate-900 border-slate-800 text-slate-100 uppercase tracking-wider">
          Dibatalkan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black bg-purple-50 border-purple-200 text-purple-700 uppercase tracking-wider">
        Retur Selesai
      </span>
    );
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-red-500 bg-red-500/5 border border-red-500/10 rounded-md px-2 py-0.5 w-max mb-1.5 animate-pulse">
            <XOctagon className="w-3.5 h-3.5" /> Ruang Kontrol Garansi & Pembatalan
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Manajemen Pembatalan & Retur</h1>
          <p className="text-[13px] text-slate-400 mt-0.5 font-medium">
            Kelola pengajuan retur pesanan rusak atau pembatalan antrian pengerjaan secara sentralisasi.
          </p>
        </div>

        {/* Action Buttons to raise trigger form */}
        {user.role !== 'operational' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenForm('cancellation')}
              className="px-4 py-3 bg-red-650 hover:bg-red-600 text-white font-extrabold text-[12px] uppercase tracking-wider rounded-2xl flex items-center justify-center shadow-lg shadow-red-950/20 active:scale-[0.98] transition-all cursor-pointer h-12"
            >
              PEMBATALAN
            </button>
            <button
              onClick={() => handleOpenForm('return')}
              className="px-4 py-3 bg-red-650 hover:bg-red-600 text-white font-extrabold text-[12px] uppercase tracking-wider rounded-2xl flex items-center justify-center shadow-lg shadow-red-950/20 active:scale-[0.98] transition-all cursor-pointer h-12"
            >
              RETUR
            </button>
          </div>
        )}
      </div>

      {/* Form Area using AnimatePresence */}
      <AnimatePresence mode="wait">
        {activeForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xl space-y-4 text-slate-900"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeForm === 'cancellation' ? 'bg-red-50 text-red-650' : 'bg-purple-50 text-purple-600'}`}>
                  {activeForm === 'cancellation' ? <XOctagon className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold tracking-tight text-slate-900 text-base">
                    Formulir {activeForm === 'cancellation' ? 'Pembatasan/Pembatalan' : 'Retur Pengembalian'}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Isi detail klaim transaksi di bawah ini dengan tepat.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-lg"
              >
                Tutup Form
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pilih Transaksi Aktif</label>
                  <select
                    value={selectedOrderId}
                    onChange={e => setSelectedOrderId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition"
                    required
                  >
                    {eligibleOrders.map(o => {
                      const mName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                      return (
                        <option key={o.id} value={o.id}>
                          {o.orderNumber} - {mName} ({o.totalQty} pcs - {formatCurrency(o.totalAmount)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Alasan Pengajuan</label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Kesalahan input motif logo atau produk cacat saat pengiriman..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition resize-none"
                    required
                  />
                </div>
              </div>

              {/* Informational Guidelines Card */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Panduan Logika Bisnis</span>
                  <ul className="text-xs font-semibold text-slate-600 space-y-2 list-none p-0">
                    <li className="flex items-start gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span><strong>Pembatalan</strong> hanya diizinkan untuk pesanan berstatus <strong>Dikonfirmasi sampai dengan Packing</strong> (Draft dan Menunggu Konfirmasi menggunakan hapus langsung).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <span><strong>Retur</strong> hanya diizinkan untuk pesanan berstatus <strong>Terkirim (shipped)</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span><strong>Pengembalian limit tagihan</strong> akan dimasukkan ke buku keuangan jika pesanan sudah dikenakan tagihan (Billed / mencapai tahapan Packing).</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-slate-200/50 mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveForm(null)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-150 active:scale-95 transition-all text-center cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2.5 ${activeForm === 'cancellation' ? 'bg-red-650 hover:bg-red-600 shadow-red-100' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-100'} text-white rounded-xl font-extrabold text-xs shadow-md active:scale-95 transition-all text-center cursor-pointer`}
                  >
                    Konfirmasi {activeForm === 'cancellation' ? 'Batal' : 'Retur'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Responsive List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">Daftar Pembatalan & Retur</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Sesi Berjalan • {displayedOrders.length} riwayat ditemukan</p>
          </div>
        </div>

        {displayedOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 text-slate-500">
            <FileText className="w-12 h-12 text-slate-350 mx-auto mb-4 animate-bounce" />
            <h3 className="font-extrabold text-slate-900 text-sm">Tidak Ada Transaksi Terdata</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xs mx-auto">
              Belum terdapat data pembatalan maupun retur pesanan yang terdaftar saat ini.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet Card Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:hidden">
              {displayedOrders.map(o => {
                const partnerName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                const reqLog = db.getRequests().find(r => r.orderId === o.id);
                
                return (
                  <div 
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="group bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden transform hover:-translate-y-1"
                  >
                    {/* Card Header */}
                    <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono font-black text-slate-900 tracking-tight">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          {o.orderNumber}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${o.type === 'online' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {o.type} Delivery
                        </span>
                      </div>
                      {getStatusBadge(o.status)}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 py-4 space-y-3.5 flex-1">
                      {/* Time & Mitra Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Klaim: {formatDate(o.updatedAt || o.createdAt)}</span>
                        </div>
                        
                        {user.role !== 'mitra' && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>Mitra: <strong className="font-extrabold text-slate-900">{partnerName}</strong></span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Total Item: <strong className="font-extrabold text-slate-900">{o.totalQty} pcs</strong></span>
                        </div>
                      </div>

                      {/* Reason Section */}
                      {reqLog?.reason && (
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Alasan Pengajuan:</span>
                          <p className="text-xs font-medium text-slate-600 italic line-clamp-2">
                            "{reqLog.reason}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Refund Detail & Action */}
                    <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Refund Limit / Billing</span>
                        {o.isBilled ? (
                          <span className="text-emerald-600 font-extrabold text-sm block mt-0.5">
                            +{formatCurrency(o.totalAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold text-xs block mt-0.5">
                            Belum ditagih
                          </span>
                        )}
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-500 flex items-center justify-center transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden text-slate-605">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-extrabold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Ref Orde</th>
                      <th className="px-6 py-4">Waktu Klaim</th>
                      {user.role !== 'mitra' && <th className="px-6 py-4">Nama Mitra</th>}
                      <th className="px-6 py-4">Tipe Distribusi</th>
                      <th className="px-6 py-4 text-center">Total Item</th>
                      <th className="px-6 py-4">Alasan Pengajuan</th>
                      <th className="px-6 py-4 text-right">Refund Nominal</th>
                      <th className="px-6 py-4 text-right">Status Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {displayedOrders.map(o => {
                      const partnerName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                      const reqLog = db.getRequests().find(r => r.orderId === o.id);
                      return (
                        <tr
                          key={o.id}
                          onClick={() => navigate(`/orders/${o.id}`)}
                          className="hover:bg-slate-50/65 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 font-mono font-black text-slate-900">{o.orderNumber}</td>
                          <td className="px-6 py-4 font-medium text-slate-500">{formatDate(o.updatedAt || o.createdAt)}</td>
                          {user.role !== 'mitra' && <td className="px-6 py-4 font-extrabold text-slate-900">{partnerName}</td>}
                          <td className="px-6 py-4 capitalize font-bold">
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${o.type === 'online' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                              {o.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">{o.totalQty} pcs</td>
                          <td className="px-6 py-4 max-w-xs truncate text-slate-500 italic">
                            {reqLog?.reason || '-'}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900">
                            {o.isBilled ? (
                              <span className="text-emerald-600">+{formatCurrency(o.totalAmount)}</span>
                            ) : (
                              <span className="text-slate-400 font-bold">- (Belum Ditagih)</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">{getStatusBadge(o.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
