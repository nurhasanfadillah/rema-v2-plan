import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Order, OrderStatus, ActionRequest, Mitra } from '../types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../context/ConfirmContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  XOctagon, RefreshCw, AlertTriangle, CheckCircle, ArrowRight, Calendar,
  User, Trash2, FileText, CheckCircle2, ShoppingBag, Landmark, Activity
} from 'lucide-react';

export default function CancellationsReturns() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [mitras, setMitras] = useState<Mitra[]>([]);
  const [requests, setRequests] = useState<ActionRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.orders.list(),
      api.mitras.list(),
      api.requests.list(),
    ]).then(([o, m, r]) => {
      setOrders(o);
      setMitras(m);
      setRequests(r);
    }).catch(() => toast.error('Gagal memuat data'));
  }, [user]);

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
      return pool.filter(o => ['confirmed', 'processing', 'pressing', 'packing'].includes(o.status));
    } else {
      return pool.filter(o => o.status === 'shipped');
    }
  };

  const eligibleOrders = activeForm ? getEligibleOrders(activeForm) : [];

  const handleOpenForm = (type: 'cancellation' | 'return') => {
    const list = getEligibleOrders(type);
    if (list.length === 0) {
      toast.error(`Tidak ada pesanan yang dapat ${type === 'cancellation' ? 'dibatalkan' : 'diretur'}.`);
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

    try {
      // Rollback ledger billing jika pesanan sudah dibilling
      if (orderToProcess.isBilled) {
        await api.ledgers.removeByOrder(orderToProcess.id);
      }

      // Update order status
      const updatedOrder = await api.orders.update(orderToProcess.id, {
        status: newStatus,
        isBilled: false,
        updatedAt: Date.now(),
      });

      // Simpan action request log
      const newRequest: Omit<ActionRequest, 'id'> = {
        type: isCancel ? 'cancellation' : 'return',
        orderId: orderToProcess.id,
        mitraId: orderToProcess.mitraId,
        reason: reason || (isCancel ? 'Pembatalan instan melalui form' : 'Retur instan melalui form'),
        status: 'resolved',
        creditAmount: orderToProcess.isBilled ? orderToProcess.totalAmount : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const createdRequest = await api.requests.create(newRequest);

      // Audit log
      await api.auditLogs.create({
        userId: user.id,
        action: isCancel ? 'CANCEL_ORDER' : 'RETURN_ORDER',
        details: `${isCancel ? 'Batal' : 'Retur'} pesanan ${orderToProcess.orderNumber} via form manajemen`,
      });

      // Update local state
      setOrders(prev => prev.map(o => o.id === orderToProcess.id ? updatedOrder : o));
      setRequests(prev => [createdRequest, ...prev]);

      toast.success(`Pesanan #${orderToProcess.orderNumber} berhasil ${isCancel ? 'dibatalkan' : 'diretur'}.`);
      setActiveForm(null);
      setSelectedOrderId('');
      setReason('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses permintaan');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold bg-slate-100 border-slate-200 text-slate-700 uppercase tracking-tight">
          <XOctagon className="w-3 h-3" /> Batal
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold bg-purple-50 border-purple-100 text-purple-700 uppercase tracking-tight">
        <RefreshCw className="w-3 h-3" /> Retur Selesai
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Banner and Actions */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Pembatalan & Retur
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5 font-semibold">
            Kelola pembatalan dan retur pesanan mitra.
          </p>
        </div>

        {user.role !== 'operational' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenForm('cancellation')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-[11px] uppercase tracking-wide rounded-xl transition-all cursor-pointer border border-red-500/20 active:scale-95"
            >
              <XOctagon className="w-3.5 h-3.5" />
              <span>Pembatalan</span>
            </button>
            <button
              onClick={() => handleOpenForm('return')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold text-[11px] uppercase tracking-wide rounded-xl transition-all cursor-pointer border border-purple-500/20 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retur</span>
            </button>
          </div>
        )}
      </div>

      {/* Form Area using AnimatePresence */}
      <AnimatePresence mode="wait">
        {activeForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-2xl relative overflow-hidden group">
              {/* Decorative accent */}
              <div className={`absolute top-0 left-0 w-1 h-full ${activeForm === 'cancellation' ? 'bg-red-500' : 'bg-purple-500'}`} />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeForm === 'cancellation' ? 'bg-red-500/10 text-red-500' : 'bg-purple-500/10 text-purple-400'}`}>
                    {activeForm === 'cancellation' ? <XOctagon className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Formulir {activeForm === 'cancellation' ? 'Pembatalan' : 'Retur'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium"></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveForm(null)}
                  className="p-1.5 hover:bg-white/5 rounded-md text-slate-500 transition-colors"
                >
                  <XOctagon className="w-4 h-4 opacity-50" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">Pilih ID Pesanan</label>
                      <select
                        value={selectedOrderId}
                        onChange={e => setSelectedOrderId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 focus:border-blue-500/50 transition outline-none appearance-none"
                        required
                      >
                        {eligibleOrders.map(o => {
                          const mName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                          return (
                            <option key={o.id} value={o.id} className="bg-slate-950">
                              {o.orderNumber} - {mName} ({o.totalQty} pcs)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">Estimasi Pengembalian</label>
                      <div className="px-3 py-2 bg-slate-800/50 border border-slate-800 rounded-lg text-xs font-black text-emerald-400">
                        {selectedOrderId ? formatCurrency(orders.find(o => o.id === selectedOrderId)?.totalAmount || 0) : 'Rp 0'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">Alasan</label>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={2}
                      placeholder="Masukkan detail alasan klaim..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:border-blue-500/50 transition outline-none resize-none placeholder:text-slate-700"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Ringkasan Dampak</span>
                    <div className="space-y-1.5 text-[10px] font-medium text-slate-400 leading-relaxed">
                      <div className="flex gap-2">
                        <CheckCircle className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>Limit saldo mitra akan bertambah</span>
                      </div>
                      <div className="flex gap-2">
                        <CheckCircle className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>Stok bahan baku tidak akan kembali</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setActiveForm(null)}
                      className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 px-3 py-2 ${activeForm === 'cancellation' ? 'bg-red-600 shadow-red-500/10' : 'bg-purple-600 shadow-purple-500/10'} text-white rounded-lg font-bold text-[11px] shadow-lg hover:opacity-90 transition-all cursor-pointer`}
                    >
                      Konfirmasi
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Responsive List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-500/10 rounded-md">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span className="text-[13px] font-extrabold text-slate-800">Riwayat Aktivitas</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">
            <div className={`w-1.5 h-1.5 rounded-full ${displayedOrders.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className="text-[9px] font-bold text-slate-500">{displayedOrders.length} records</span>
          </div>
        </div>

        {displayedOrders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-600">Belum ada riwayat klaim</h3>
            <p className="text-[11px] text-slate-400 mt-1">Data pembatalan atau retur akan muncul setelah diproses.</p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet Card Layout */}
            <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayedOrders.map(o => {
                const partnerName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                const reqLog = requests.find(r => r.orderId === o.id);

                return (
                  <div
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className={`bg-white border border-slate-200/60 rounded-xl p-4 space-y-3 hover:border-blue-300 transition-colors cursor-pointer group border-l-4 ${o.status === 'cancelled' ? 'border-l-red-400' : 'border-l-purple-400'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-black text-slate-900">#{o.orderNumber}</span>
                      {getStatusBadge(o.status)}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Mitra</span>
                        <span className="text-slate-800 font-bold">{partnerName}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Nominal</span>
                        <span className="text-emerald-600 font-black">{o.isBilled ? formatCurrency(o.totalAmount) : '-'}</span>
                      </div>
                    </div>

                    {reqLog?.reason && (
                      <div className="text-[10px] text-slate-500 italic line-clamp-1 border-t border-slate-100 pt-2">
                        "{reqLog.reason}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-900 font-extrabold text-[10px] uppercase tracking-wider">
                    <th className="px-4 py-3 font-bold">Nomor Pesanan</th>
                    <th className="px-4 py-3 font-bold text-center">Tipe</th>
                    <th className="px-4 py-3 font-bold">Waktu Klaim</th>
                    {user.role !== 'mitra' && <th className="px-4 py-3 font-bold">Mitra</th>}
                    <th className="px-4 py-3 font-bold">Alasan Pengajuan</th>
                    <th className="px-4 py-3 text-right font-bold">Nominal (CR)</th>
                    <th className="px-4 py-3 text-right font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {displayedOrders.map(o => {
                    const partnerName = mitras.find(m => m.id === o.mitraId)?.name || 'Unknown';
                    const reqLog = requests.find(r => r.orderId === o.id);
                    return (
                      <tr
                        key={o.id}
                        onClick={() => navigate(`/orders/${o.id}`)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors duration-200 group"
                      >
                        <td className="px-4 py-2.5 font-mono text-xs font-black text-slate-800">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mr-2 group-hover:bg-slate-200">{o.orderNumber}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${o.type === 'online' ? 'bg-sky-900/30 text-sky-400 border border-sky-800/50' : 'bg-amber-900/30 text-amber-500 border border-amber-800/50'}`}>
                            {o.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] font-medium text-slate-500">
                          {formatDate(o.updatedAt || o.createdAt)}
                        </td>
                        {user.role !== 'mitra' && (
                          <td className="px-4 py-2.5 text-[11px] font-extrabold text-slate-900">
                            {partnerName}
                          </td>
                        )}
                        <td className="px-4 py-2.5 text-[11px] max-w-[200px] truncate text-slate-500 italic">
                          {reqLog?.reason || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-black text-xs">
                          {o.isBilled ? (
                            <span className="text-emerald-500">+{formatCurrency(o.totalAmount)}</span>
                          ) : (
                            <span className="text-slate-600 font-bold">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">{getStatusBadge(o.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>

  );
}
