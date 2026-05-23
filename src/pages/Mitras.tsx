import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { db } from '../lib/db';
import { Mitra } from '../types';
import { formatCurrency } from '../lib/utils';
import { Save, Edit2, Archive, Trash2, X, Shield, Sparkles, AlertCircle, Award } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { motion, AnimatePresence } from 'motion/react';

export default function Mitras() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [mitras, setMitras] = useState<Mitra[]>(db.getMitras());
  const [selectedMitra, setSelectedMitra] = useState<Mitra | null>(null);
  const users = db.getUsers();

  if (user?.role !== 'admin') return <div className="p-8 text-center text-red-500 font-bold">Akses Ditolak</div>;

  const handleUpdateLimit = (mitraId: string, newLimit: string) => {
    let limitVal: number | null = parseInt(newLimit.replace(/\D/g, ''));
    if (isNaN(limitVal) || limitVal === 0) limitVal = null; // 0 or empty = unlimitted
    
    // Check if limit unchanged
    const oldMitra = mitras.find(m => m.id === mitraId);
    if (!oldMitra || oldMitra.creditLimit === limitVal) return;

    const newMitras = [...mitras];
    const idx = newMitras.findIndex(m => m.id === mitraId);
    if (idx !== -1) {
      newMitras[idx] = { ...newMitras[idx], creditLimit: limitVal };
      db.saveMitras(newMitras);
      db.addAuditLog({ userId: user.id, action: 'UPDATE_LIMIT', details: `Mitra ${mitraId} limit updated to ${limitVal}` });
      setMitras(newMitras);
      setSelectedMitra(newMitras[idx]);
      toast.success('Limit kredit berhasil diperbarui');
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

    const newMitras = [...mitras];
    const idx = newMitras.findIndex(m => m.id === mitraId);
    if (idx !== -1) {
      newMitras[idx] = { ...newMitras[idx], isArchived: !currentArchive };
      db.saveMitras(newMitras);
      db.addAuditLog({ userId: user.id, action: currentArchive ? 'MITRA_UNARCHIVED' : 'MITRA_ARCHIVED', details: `Mitra ${mitraId}` });
      setMitras(newMitras);
      setSelectedMitra(newMitras[idx]);
      toast.success(currentArchive ? 'Arsip mitra berhasil dibuka' : 'Mitra berhasil diarsipkan');
    }
  };

  const handleDelete = async (id: string) => {
    // Validation
    const orders = db.getOrders();
    const ledgers = db.getLedgers();
    const requests = db.getRequests();
    
    const targetMitra = mitras.find(m => m.id === id);
    const isUsedInOrders = orders.some(o => o.mitraId === id);
    const isUsedInLedger = ledgers.some(l => l.mitraId === id);
    const isUsedInRequests = requests.some(r => r.mitraId === id);

    if (isUsedInOrders || isUsedInLedger || isUsedInRequests) {
      toast.error("Tidak dapat menghapus mitra ini karena sudah memiliki data pesanan, riwayat saldo, atau pengajuan (request).");
      return;
    }

    const isConfirmed = await confirm({
      title: 'Hapus Mitra Secara Permanen',
      message: 'Apakah Anda yakin ingin menghapus mitra ini secara permanen?',
      confirmText: 'Ya, Hapus Permanen',
      type: 'danger'
    });
    
    if (!isConfirmed) return;

    if (targetMitra) {
      const allUsers = db.getUsers();
      const linkedUser = allUsers.find(u => u.id === targetMitra.userId);
      if (linkedUser) {
        db.saveUsers(allUsers.filter(u => u.id !== linkedUser.id));
      }
    }

    const newMitras = mitras.filter(m => m.id !== id);
    db.saveMitras(newMitras);
    db.addAuditLog({ userId: user.id, action: 'MITRA_DELETED', details: `Mitra ${id}` });
    setMitras(newMitras);
    setSelectedMitra(null);
    toast.success('Mitra berhasil dihapus');
  };

  const handleSave = (mitraToSave: Mitra) => {
    if (!mitraToSave.name.trim()) {
      toast.error("Nama mitra tidak boleh kosong.");
      return;
    }
    
    const newMitras = [...mitras];
    const idx = newMitras.findIndex(m => m.id === mitraToSave.id);
    if (idx !== -1) {
      newMitras[idx] = { ...mitraToSave };
      db.saveMitras(newMitras);
      db.addAuditLog({ userId: user.id, action: 'MITRA_UPDATED', details: `Mitra ${mitraToSave.id}` });
      setMitras(newMitras);
      setSelectedMitra(newMitras[idx]);
      toast.success('Data mitra berhasil diperbarui');
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
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-150 rounded-md px-2 py-0.5 w-max mb-1.5">
            <Shield className="w-3.5 h-3.5" /> Mitra Overview
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Manajemen Mitra Bisnis</h1>
          <p className="text-[13px] text-slate-500 mt-0.5 font-semibold">Pantau limit kredit masing-masing partner usaha, unggah brand logo, dan atur arsip.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03),0_8px_16px_-8px_rgba(0,0,0,0.01)] border border-slate-200/60 overflow-hidden">
        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {mitras.map(m => {
            const mitraUser = users.find(u => u.id === m.userId);
            return (
              <div 
                key={m.id}
                onClick={() => setSelectedMitra(m)}
                className={`p-4 hover:bg-slate-50/70 transition-colors cursor-pointer ${m.isArchived ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {m.logoUrl ? (
                      <img src={m.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-250/60 bg-white shadow-sm" />
                  ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                        {m.name.charAt(0)}
                      </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{m.name}</h3>
                    <p className="text-xs font-semibold font-mono text-slate-400 mt-0.5">{mitraUser?.phone || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-2 bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-0.5">Kredit Limit</span>
                    <span className="font-extrabold text-slate-900 text-xs">{m.creditLimit ? formatCurrency(m.creditLimit) : 'Unlimited'}</span>
                  </div>
                  <div>
                    {m.isArchived ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-slate-250">TERARSIP</span>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-emerald-100">AKTIF</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {mitras.length === 0 && (
            <div className="p-10 text-center text-slate-400 font-bold">Belum ada mitra terdaftar. Silakan daftarkan akun dengan role 'Mitra' terlebih dahulu.</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-[13px] text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-900 font-extrabold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nama Mitra</th>
                <th className="px-6 py-4">Kontak User HP</th>
                <th className="px-6 py-4">Batas Kredit</th>
                <th className="px-6 py-4 text-right">Status Partner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {mitras.map(m => {
                const mitraUser = users.find(u => u.id === m.userId);
                return (
                  <tr 
                    key={m.id} 
                    onClick={() => setSelectedMitra(m)}
                    className={`hover:bg-slate-50/70 transition-colors duration-200 cursor-pointer ${m.isArchived ? 'opacity-50' : ''}`}
                  >
                    <td className="px-6 py-4 font-extrabold text-slate-900">
                      <div className="flex items-center gap-3">
                        {m.logoUrl ? (
                           <img src={m.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-sm" />
                        ) : (
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-150">
                             {m.name.charAt(0)}
                           </div>
                        )}
                        {m.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-400">{mitraUser?.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-900">
                        {m.creditLimit ? formatCurrency(m.creditLimit) : 'No Limit / Unlimited'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.isArchived ? (
                         <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-extrabold uppercase border border-slate-200">TERARSIP</span>
                      ) : (
                         <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-extrabold uppercase border border-emerald-100">AKTIF</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
  mitraUser
}: {
  mitra: Mitra,
  currentUserId: string,
  onClose: () => void,
  onSave: (m: Mitra) => void,
  onToggleArchive: () => void,
  onDelete: () => void,
  onUpdateLimit: (id: string, limit: string) => void,
  mitraUser?: any
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
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Detail Info Mitra</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!isEditing ? (
            <div className="space-y-8">
               <div className="flex items-start gap-4">
                 <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center p-1">
                    {mitra.logoUrl ? (
                       <img src={mitra.logoUrl} alt={mitra.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 font-extrabold text-2xl uppercase rounded-xl">
                         {mitra.name.charAt(0)}
                       </div>
                    )}
                 </div>
                 <div className="pt-1.5 flex-1">
                   <h3 className="text-lg font-black text-slate-900 leading-tight mb-1.5">{mitra.name}</h3>
                   <div>
                     {mitra.isArchived ? (
                         <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-250 rounded-lg text-[10px] font-extrabold uppercase select-none">TERARSIP</span>
                      ) : (
                         <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-extrabold uppercase select-none">AKTIF</span>
                      )}
                   </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 col-span-2">
                     <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">User Akun Mitra</p>
                     <p className="text-xs font-black text-slate-900">{mitraUser?.name || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 col-span-2">
                     <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Nomor HP</p>
                     <p className="text-xs font-mono font-bold text-slate-750">{mitraUser?.phone || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 col-span-2">
                     <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5">Batas Angsuran Kredit (Credit Limit)</p>
                     <LimitEditor defaultValue={mitra.creditLimit} onSave={(val) => onUpdateLimit(mitra.id, val)} />
                  </div>
               </div>

               <div className="space-y-4 pt-2">
                 <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Opsi Operasi</h4>
                 <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                    <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95">
                      <Edit2 className="w-4 h-4" /> Edit Detail
                    </button>
                    <button onClick={onToggleArchive} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all cursor-pointer active:scale-95 ${mitra.isArchived ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' : 'bg-orange-50 hover:bg-orange-100 text-orange-700'}`}>
                      <Archive className="w-4 h-4" />
                      {mitra.isArchived ? 'Buka Arsip' : 'Arsipkan'}
                    </button>
                    <button onClick={onDelete} className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all cursor-pointer active:scale-95 font-extrabold">
                      <Trash2 className="w-4 h-4" /> Hapus Mitra
                    </button>
                 </div>
               </div>
            </div>
          ) : (
             <form onSubmit={handleSubmit} className="space-y-4 font-bold text-xs sm:text-sm">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Perusahaan / Mitra</label>
                   <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-xs" />
                </div>
                <div>
                   <FileUpload value={logoUrl} onChange={setLogoUrl} label="Logo Perusahaan / Profil" accept="image/*" />
                </div>
                <div className="pt-6 flex justify-end gap-3 text-xs">
                   <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all cursor-pointer">Batal</button>
                   <button type="submit" className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all cursor-pointer active:scale-95">Simpan Perubahan</button>
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
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 font-bold text-xs">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
          <input 
             type="text" 
             value={new Intl.NumberFormat('id-ID').format(parseInt(val.replace(/\D/g, '')) || 0)}
             placeholder="Tanpa Batas Limit (Unlimited)"
             onChange={(e) => setVal(e.target.value.replace(/\D/g, ''))}
             className="pl-8 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 text-right w-full bg-white font-extrabold text-slate-850"
          />
        </div>
        <button 
          onClick={() => onSave(val)} 
          className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer" 
          title="Save Limit"
        >
           <Save className="w-4 h-4" /> Simpan
        </button>
    </div>
  );
}export {};
