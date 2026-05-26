import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { api } from '../lib/api';
import { Mitra, User, Order, LedgerEntry } from '../types';
import { formatCurrency } from '../lib/utils';
import { Save, Edit2, Archive, Trash2, X, Sparkles, AlertCircle, Award, ChevronRight } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { motion, AnimatePresence } from 'motion/react';

type SafeUser = Omit<User, 'passwordHash'>;

export default function Mitras() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [mitras, setMitras] = useState<Mitra[]>([]);
  const [selectedMitra, setSelectedMitra] = useState<Mitra | null>(null);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    Promise.all([
      api.mitras.list(),
      api.users.list(),
      api.orders.list(),
      api.ledgers.list(),
    ]).then(([m, u, o, l]) => {
      setMitras(m);
      setUsers(u);
      setOrders(o);
      setLedgerEntries(l);
    }).catch(() => toast.error('Gagal memuat data mitra'));
  }, []);

  if (user?.role !== 'admin') return <div className="p-8 text-center text-red-500 font-bold">Akses Ditolak</div>;

  const getMitraStats = (mitraId: string) => {
    const mitraOrders = orders.filter(o => o.mitraId === mitraId && o.status !== 'cancelled');
    const totalOrders = mitraOrders.length;
    const totalSales = mitraOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const mitraLedgers = ledgerEntries.filter(l => l.mitraId === mitraId);
    const saldoPiutang = mitraLedgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);

    return { totalOrders, totalSales, saldoPiutang };
  };

  const handleUpdateLimit = async (mitraId: string, newLimit: string) => {
    let limitVal: number | null = parseInt(newLimit.replace(/\D/g, ''));
    if (isNaN(limitVal) || limitVal === 0) limitVal = null;

    const oldMitra = mitras.find(m => m.id === mitraId);
    if (!oldMitra || oldMitra.creditLimit === limitVal) return;

    try {
      const updated = await api.mitras.update(mitraId, { creditLimit: limitVal });
      await api.auditLogs.create({ userId: user.id, action: 'UPDATE_LIMIT', details: `Mitra ${mitraId} limit updated to ${limitVal}` });
      setMitras(prev => prev.map(m => m.id === mitraId ? updated : m));
      setSelectedMitra(updated);
      toast.success('Limit kredit berhasil diperbarui');
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui limit');
    }
  };

  const handleToggleArchive = async (mitraId: string, currentArchive: boolean) => {
    const isConfirmed = await confirm({
      title: currentArchive ? 'Buka Arsip Mitra' : 'Arsipkan Mitra',
      message: currentArchive ? 'Buka arsip mitra ini?' : 'Arsipkan mitra ini? Mereka tidak akan bisa membuat pesanan baru.',
      confirmText: currentArchive ? 'Buka Arsip' : 'Arsipkan',
      type: currentArchive ? 'info' : 'warning'
    });

    if (!isConfirmed) return;

    try {
      const updated = await api.mitras.update(mitraId, { isArchived: !currentArchive });
      await api.auditLogs.create({ userId: user.id, action: currentArchive ? 'MITRA_UNARCHIVED' : 'MITRA_ARCHIVED', details: `Mitra ${mitraId}` });
      setMitras(prev => prev.map(m => m.id === mitraId ? updated : m));
      setSelectedMitra(updated);
      toast.success(currentArchive ? 'Arsip mitra berhasil dibuka' : 'Mitra berhasil diarsipkan');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status arsip');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Mitra Secara Permanen',
      message: 'Apakah Anda yakin ingin menghapus mitra ini secara permanen?',
      confirmText: 'Ya, Hapus Permanen',
      type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await api.mitras.remove(id);
      await api.auditLogs.create({ userId: user.id, action: 'MITRA_DELETED', details: `Mitra ${id}` });
      setMitras(prev => prev.filter(m => m.id !== id));
      setSelectedMitra(null);
      toast.success('Mitra berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus mitra');
    }
  };

  const handleSave = async (mitraToSave: Mitra) => {
    if (!mitraToSave.name.trim()) {
      toast.error("Nama mitra tidak boleh kosong.");
      return;
    }

    try {
      const updated = await api.mitras.update(mitraToSave.id, { name: mitraToSave.name, logoUrl: mitraToSave.logoUrl });
      await api.auditLogs.create({ userId: user.id, action: 'MITRA_UPDATED', details: `Mitra ${mitraToSave.id}` });
      setMitras(prev => prev.map(m => m.id === mitraToSave.id ? updated : m));
      setSelectedMitra(updated);
      toast.success('Data mitra berhasil diperbarui');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data mitra');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
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
        <div>
          <h1 className="page-title">Manajemen Mitra</h1>
          <p className="text-[11px] text-slate-500 mt-1 font-medium opacity-80">Pantau limit kredit, profil mitra, dan statistik performa.</p>
        </div>
      </div>

      {mitras.length === 0 ? (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-10 text-center shadow-2xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 text-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-white font-bold text-lg tracking-tight">Belum Ada Mitra</h3>
          <p className="text-slate-500 text-[12px] mt-1.5 mx-auto max-w-sm font-medium leading-relaxed">Silakan daftarkan akun dengan role 'Mitra' terlebih dahulu melalui menu Manajemen User untuk memunculkan profil di sini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile View - Cards */}
          <motion.div
            variants={containerVariants}
            className="md:hidden grid grid-cols-1 gap-2.5"
          >
            {mitras.map(m => {
              const mitraUser = users.find(u => u.id === m.userId);
              const stats = getMitraStats(m.id);
              return (
                <motion.div
                  key={m.id}
                  variants={itemVariants}
                  onClick={() => setSelectedMitra(m)}
                  className={`bg-white/5 rounded-2xl p-3.5 border border-white/5 shadow-2xl hover:border-blue-500/30 transition-all cursor-pointer group flex items-center justify-between gap-3 backdrop-blur-sm ${m.isArchived ? 'opacity-40 grayscale' : ''}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {m.logoUrl ? (
                      <img src={m.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/5 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex-shrink-0 flex items-center justify-center font-bold text-md border border-blue-500/20 transition-transform group-hover:scale-105">
                        {m.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="font-bold text-white text-[13px] leading-tight truncate group-hover:text-blue-400 transition-colors uppercase">{m.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-600 font-mono tabular-nums tracking-wider uppercase opacity-70">HP: {mitraUser?.phone || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      {m.isArchived ? (
                         <span className="px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded text-[7px] font-bold uppercase border border-slate-800 tracking-wider">Arsip</span>
                      ) : (
                         <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[7px] font-bold uppercase border border-blue-500/20 tracking-wider">Aktif</span>
                      )}
                      <span className="text-[9px] font-bold text-slate-500 tabular-nums lowercase italic opacity-60 group-hover:text-amber-500 transition-colors leading-none">{stats.totalOrders} items</span>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-0.5 shadow-lg">
                       <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Desktop View - Table */}
          <div className="hidden md:block bg-white/5 rounded-2xl shadow-xl border border-white/5 overflow-hidden backdrop-blur-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-950/40 border-b border-white/5 text-slate-500 font-bold text-[8px] uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-3.5">Profil Mitra</th>
                  <th className="px-5 py-3.5">Total Penjualan</th>
                  <th className="px-5 py-3.5 text-center">Volume</th>
                  <th className="px-5 py-3.5">Saldo Piutang</th>
                  <th className="px-5 py-3.5">Limit Kredit</th>
                  <th className="px-5 py-3.5 text-right">Status Hubungan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-[12px]">
                {mitras.map(m => {
                  const mitraUser = users.find(u => u.id === m.userId);
                  const stats = getMitraStats(m.id);
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMitra(m)}
                      className={`hover:bg-blue-500/[0.02] transition-colors duration-200 cursor-pointer group ${m.isArchived ? 'opacity-30' : ''}`}
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          {m.logoUrl ? (
                             <img src={m.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/5 shadow-2xl" />
                          ) : (
                             <div className="w-8 h-8 rounded-lg bg-slate-900 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-800 transition-colors group-hover:border-blue-500/30 group-hover:text-blue-400">
                               {m.name.charAt(0)}
                             </div>
                          )}
                          <div className="space-y-0">
                            <div className="text-white font-bold tracking-tight group-hover:text-blue-300 transition-colors uppercase text-[12px]">{m.name}</div>
                            <div className="text-[9px] font-mono font-bold text-slate-600 tracking-wider truncate uppercase opacity-60">HP: {mitraUser?.phone || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-blue-400 font-bold tabular-nums tracking-tighter text-[13px] italic">{formatCurrency(stats.totalSales)}</td>
                      <td className="px-5 py-2.5 text-center text-slate-500 font-bold tabular-nums opacity-60 italic">{stats.totalOrders} <span className="text-[8px] uppercase tracking-widest ml-0.5">items</span></td>
                      <td className={`px-5 py-2.5 font-black tabular-nums text-[13px] tracking-tight ${stats.saldoPiutang > 0 ? 'text-red-500' : 'text-emerald-400 opacity-60'}`}>
                        {formatCurrency(stats.saldoPiutang)}
                      </td>
                      <td className="px-5 py-2.5 text-slate-300 font-bold tabular-nums text-[12px]">
                        {m.creditLimit ? (
                           <span className="text-amber-500/80">{formatCurrency(m.creditLimit)}</span>
                        ) : (
                           <span className="text-slate-600 italic font-medium opacity-50 tracking-widest uppercase text-[9px]">Unlimited</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {m.isArchived ? (
                           <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded text-[7px] font-bold uppercase border border-slate-800 tracking-wider">Arsip</span>
                        ) : (
                           <span className="inline-flex items-center px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-[8px] font-bold uppercase border border-blue-500/20 tracking-wider">Aktif</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedMitra && (
          <MitraDetailPanel
            mitra={selectedMitra}
            currentUserId={user.id}
            onClose={() => setSelectedMitra(null)}
            onSave={handleSave}
            onToggleArchive={() => handleToggleArchive(selectedMitra.id, selectedMitra.isArchived)}
            onDelete={() => handleDelete(selectedMitra.id)}
            onUpdateLimit={handleUpdateLimit}
            mitraUser={users.find(u => u.id === selectedMitra.userId)}
            stats={getMitraStats(selectedMitra.id)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MitraDetailPanel({
  mitra,
  currentUserId,
  onClose,
  onSave,
  onToggleArchive,
  onDelete,
  onUpdateLimit,
  mitraUser,
  stats
}: {
  mitra: Mitra,
  currentUserId: string,
  onClose: () => void,
  onSave: (m: Mitra) => void,
  onToggleArchive: () => void,
  onDelete: () => void,
  onUpdateLimit: (id: string, limit: string) => void,
  mitraUser?: any,
  stats: { totalOrders: number, totalSales: number, saldoPiutang: number }
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(mitra.name);
  const [logoUrl, setLogoUrl] = useState(mitra.logoUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...mitra,
      name,
      logoUrl,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <motion.div
        initial={{ x: '100vw' }}
        animate={{ x: 0 }}
        exit={{ x: '100vw' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="bg-slate-950 w-full max-w-md h-full shadow-2xl flex flex-col border-l border-white/5"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-[16px] font-black text-white tracking-tight">Detail Info Mitra</h2>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!isEditing ? (
            <div className="space-y-5">
               <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center p-1 relative shadow-sm">
                    {mitra.logoUrl ? (
                       <img src={mitra.logoUrl} alt={mitra.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center bg-blue-500/10 text-blue-400 font-extrabold text-xl uppercase rounded-xl">
                         {mitra.name.charAt(0)}
                       </div>
                    )}
                 </div>
                 <div className="flex-1">
                   <h3 className="text-lg font-black text-white leading-tight mb-1 uppercase tracking-tight">{mitra.name}</h3>
                   <div className="flex items-center gap-2">
                     {mitra.isArchived ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-white/5 text-slate-500 border border-white/5 rounded text-[8px] font-extrabold uppercase select-none tracking-wider">Terarsip</span>
                       ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[8px] font-extrabold uppercase select-none tracking-wider animate-pulse">Partner Aktif</span>
                       )}
                   </div>
                 </div>
               </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col justify-center">
                     <div className="flex items-center gap-1.5 mb-0.5">
                        <Award className="w-2.5 h-2.5 text-emerald-500" />
                        <p className="text-[8px] font-extrabold text-emerald-500/70 uppercase tracking-widest">Total Penjualan</p>
                     </div>
                     <p className="text-[13px] font-black text-emerald-400 tabular-nums">{formatCurrency(stats.totalSales)}</p>
                  </div>
                  <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center">
                     <div className="flex items-center gap-1.5 mb-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                        <p className="text-[8px] font-extrabold text-blue-500/70 uppercase tracking-widest">Volume Pesanan</p>
                     </div>
                     <p className="text-[13px] font-black text-blue-400 tabular-nums">{stats.totalOrders} <span className="text-[9px] font-bold opacity-60">items</span></p>
                    </div>

                  <div className="col-span-2 p-3 bg-red-500/5 rounded-xl border border-red-500/10 flex flex-col justify-center">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                           <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                           <p className="text-[8px] font-extrabold text-red-500/70 uppercase tracking-widest leading-none mt-0.5">Saldo Piutang</p>
                        </div>
                        <p className={`text-[12px] font-black tabular-nums transition-colors ${stats.saldoPiutang > 0 ? 'text-red-500' : 'text-emerald-500 opacity-60'}`}>
                           {formatCurrency(stats.saldoPiutang)}
                        </p>
                     </div>
                  </div>

                  <div className="col-span-2 p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2.5">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Akun Penanggung Jawab</p>
                           <p className="text-[11px] font-bold text-white uppercase">{mitraUser?.name || '-'}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Kontak WhatsApp</p>
                           <p className="text-[11px] font-mono font-bold text-slate-400 tracking-tight">{mitraUser?.phone || '-'}</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 col-span-2">
                     <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Limit Kredit</p>
                     <LimitEditor defaultValue={mitra.creditLimit} onSave={(val) => onUpdateLimit(mitra.id, val)} />
                  </div>
               </div>

               <div className="space-y-2.5 pt-1">
                 <h4 className="text-[9px] font-extrabold text-slate-600 uppercase tracking-widest border-b border-white/5 pb-1">Tindakan</h4>
                 <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-all cursor-pointer active:scale-95 border border-white/5">
                      <Edit2 className="w-3 h-3" /> Edit Profil
                    </button>
                    <button onClick={onToggleArchive} className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer active:scale-95 border ${mitra.isArchived ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20'}`}>
                      <Archive className="w-3 h-3" />
                      {mitra.isArchived ? 'Buka Akses' : 'Batasi Akses'}
                    </button>
                    <button onClick={onDelete} className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all cursor-pointer active:scale-95 font-extrabold uppercase tracking-wider border border-red-500/20">
                      <Trash2 className="w-3 h-3" /> Hapus Mitra
                    </button>
                 </div>
               </div>
            </div>
          ) : (
             <form onSubmit={handleSubmit} className="space-y-3.5 font-bold text-[13px]">
                <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Perusahaan / Mitra</label>
                   <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2.5 border border-white/5 bg-white/5 focus:bg-white/10 text-white rounded-lg outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-[12px]" />
                </div>
                <div className="dark">
                   <FileUpload value={logoUrl} onChange={setLogoUrl} label="Logo Perusahaan / Profil" accept="image/*" />
                </div>
                <div className="pt-4 flex justify-end gap-2.5 text-[11px]">
                   <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl font-bold transition-all cursor-pointer">Batal</button>
                   <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all cursor-pointer active:scale-95">Simpan Perubahan</button>
                </div>
             </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function LimitEditor({ defaultValue, onSave }: { defaultValue: number | null, onSave: (val: string) => void }) {
  const [val, setVal] = useState(defaultValue ? defaultValue.toString() : '');
  return (
    <div className="flex items-center gap-2 pt-0.5">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600">Rp</span>
          <input
             type="text"
             value={new Intl.NumberFormat('id-ID').format(parseInt(val.replace(/\D/g, '')) || 0)}
             placeholder="Kosongkan untuk tanpa limit"
             onChange={(e) => setVal(e.target.value.replace(/\D/g, ''))}
             className="pl-7 pr-3 py-2 border border-white/10 rounded-lg outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-right w-full bg-white/5 font-bold text-white text-[11px] placeholder:text-slate-600 placeholder:italic"
          />
        </div>
        <button
           onClick={() => onSave(val)}
           className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer text-[10px] font-bold"
           title="Save Limit"
        >
           <Save className="w-3 h-3" /> Simpan
        </button>
    </div>
  );
}
