import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { api } from '../lib/api';
import { OrderPriority, Order, Mitra } from '../types';
import { Zap, Trash2, AlertTriangle, X, Plus } from 'lucide-react';
import { formatDate } from '../lib/utils';

const ACTIVE_STATUSES = ['confirmed', 'processing', 'pressing'];

export default function OrderPriorities() {
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const [priorities, setPriorities] = useState<OrderPriority[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [myMitra, setMyMitra] = useState<Mitra | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [quotaData, setQuotaData] = useState({ current: 0, limit: 1 });
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isMitra = user?.role === 'mitra';

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.priorities.list();
      setPriorities(data);
      if (isMitra) {
        const [allOrders, allMitras] = await Promise.all([api.orders.list(), api.mitras.list()]);
        const mitra = allMitras.find(m => m.userId === user?.id) || null;
        setMyMitra(mitra);
        if (mitra) {
          const prioritizedIds = new Set(data.map(p => p.orderId));
          const eligible = allOrders.filter(
            o => o.mitraId === mitra.id && ACTIVE_STATUSES.includes(o.status) && !prioritizedIds.has(o.id)
          );
          setMyOrders(eligible);
        }
      }
    } catch {
      toast.error('Gagal memuat daftar prioritas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const myActivePriorities = isMitra && myMitra
    ? priorities.filter(p => p.mitraId === myMitra.id).length
    : 0;

  const handleOpenAdd = () => {
    const limit = myMitra?.priorityLimit ?? 1;
    if (myActivePriorities >= limit) {
      setQuotaData({ current: myActivePriorities, limit });
      setShowQuotaWarning(true);
    } else {
      setSelectedOrderId('');
      setNotes('');
      setShowAddModal(true);
    }
  };

  const handleAdd = async () => {
    if (!selectedOrderId) return;
    setSubmitting(true);
    try {
      await api.priorities.create({ orderId: selectedOrderId, notes: notes || undefined });
      toast.success('Pesanan berhasil ditambahkan ke daftar prioritas');
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      if (err.message === 'QUOTA_EXCEEDED') {
        setShowAddModal(false);
        setQuotaData({ current: myActivePriorities, limit: myMitra?.priorityLimit ?? 1 });
        setShowQuotaWarning(true);
      } else {
        toast.error(err.message || 'Gagal menambahkan prioritas');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p: OrderPriority) => {
    const ok = await confirm({
      title: 'Hapus dari Daftar Prioritas',
      message: `Hapus pesanan #${p.orderNumber} dari daftar prioritas?`,
      confirmText: 'Hapus',
      type: 'warning',
    });
    if (!ok) return;
    try {
      await api.priorities.remove(p.id);
      toast.success('Pesanan dihapus dari daftar prioritas');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus prioritas');
    }
  };

  if (!user) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="page-title">Prioritas Pesanan</h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Pesanan yang diprioritaskan untuk diproses lebih cepat
            </p>
          </div>
        </div>
        {isMitra && (
          <button onClick={handleOpenAdd} className="btn-primary flex-shrink-0 self-end md:self-auto">
            <Plus className="w-4 h-4" />
            Tambah Prioritas
          </button>
        )}
      </div>

      {/* Table — Desktop */}
      <div className="hidden md:block mt-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest w-10">#</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Mitra</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">No. Pesanan</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Qty</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Catatan</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Ditambah</th>
                  {isMitra && <th className="w-12 px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isMitra ? 7 : 6} className="text-center py-12 text-slate-500">Memuat...</td></tr>
                ) : priorities.length === 0 ? (
                  <tr>
                    <td colSpan={isMitra ? 7 : 6}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Zap className="w-12 h-12 text-slate-700" />
                        <p className="text-slate-500 font-semibold text-[13px]">Belum ada pesanan prioritas</p>
                        {isMitra && <p className="text-slate-600 text-[11px]">Klik "Tambah Prioritas" untuk mendaftarkan pesanan</p>}
                      </div>
                    </td>
                  </tr>
                ) : (
                  priorities.map((p, i) => (
                    <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-bold">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{p.mitraName}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[11px]">
                          #{p.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-300">{p.totalQty} pcs</td>
                      <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{p.notes || <span className="text-slate-600 italic">—</span>}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{formatDate(p.createdAt)}</td>
                      {isMitra && (
                        <td className="px-4 py-3">
                          {p.mitraId === myMitra?.id && (
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Hapus dari prioritas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cards — Mobile */}
      <div className="md:hidden mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-[13px]">Memuat...</div>
        ) : priorities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Zap className="w-12 h-12 text-slate-700" />
            <p className="text-slate-500 font-semibold text-[13px]">Belum ada pesanan prioritas</p>
          </div>
        ) : (
          priorities.map((p, i) => (
            <div key={p.id} className="card-sm border-l-4 border-amber-500 relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-600">#{i + 1}</span>
                    <span className="font-mono font-bold text-amber-400 text-[12px]">#{p.orderNumber}</span>
                  </div>
                  <p className="font-bold text-white text-[13px] truncate">{p.mitraName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.totalQty} pcs · {formatDate(p.createdAt)}</p>
                  {p.notes && <p className="text-[11px] text-slate-500 mt-1 italic">"{p.notes}"</p>}
                </div>
                {isMitra && p.mitraId === myMitra?.id && (
                  <button
                    onClick={() => handleDelete(p)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Priority Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <h2 className="text-[15px] font-bold text-white">Tambah Prioritas</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Pilih Pesanan Aktif</label>
                <select
                  value={selectedOrderId}
                  onChange={e => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                >
                  <option value="">-- Pilih pesanan --</option>
                  {myOrders.map(o => (
                    <option key={o.id} value={o.id}>#{o.orderNumber} · {o.totalQty} pcs</option>
                  ))}
                </select>
                {myOrders.length === 0 && (
                  <p className="text-[11px] text-slate-500 mt-1.5">Tidak ada pesanan aktif yang tersedia.</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                  Catatan <span className="text-slate-600 normal-case font-medium">(opsional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Alasan atau keterangan prioritas..."
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-[12px] transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedOrderId || submitting}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Menyimpan...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quota Warning Modal */}
      {showQuotaWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowQuotaWarning(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-amber-500/20 rounded-3xl shadow-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-[16px] font-bold text-white mb-2">Batas Prioritas Tercapai</h2>
            <p className="text-[13px] text-slate-400 leading-relaxed mb-1">
              Anda memiliki{' '}
              <span className="font-bold text-amber-400">{quotaData.current}/{quotaData.limit}</span>{' '}
              slot prioritas aktif.
            </p>
            <p className="text-[12px] text-slate-500 leading-relaxed mb-6">
              Slot akan tersedia kembali setelah pesanan prioritas aktif selesai diproses atau dihapus dari daftar.
            </p>
            <button
              onClick={() => setShowQuotaWarning(false)}
              className="w-full btn-primary"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
