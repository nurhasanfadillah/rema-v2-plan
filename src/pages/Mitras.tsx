import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { db } from '../lib/db';
import { Mitra } from '../types';
import { formatCurrency } from '../lib/utils';
import { Save, Edit2, Archive, Trash2, X } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';

export default function Mitras() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [mitras, setMitras] = useState<Mitra[]>(db.getMitras());
  const [selectedMitra, setSelectedMitra] = useState<Mitra | null>(null);
  const users = db.getUsers();

  if (user?.role !== 'admin') return <div className="p-4 text-red-500">Access denied</div>;

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
    
    const isUsedInOrders = orders.some(o => o.mitraId === id);
    const isUsedInLedger = ledgers.some(l => l.mitraId === id);
    const isUsedInRequests = requests.some(r => r.mitraId === id);

    if (isUsedInOrders || isUsedInLedger || isUsedInRequests) {
      toast.error("Tidak dapat menghapus mitra ini karena sudah memiliki data pesanan, riwayat saldo, atau pengajuan (request).");
      return;
    }

    const isConfirmed = await confirm({
      title: 'Hapus Mitra',
      message: 'Apakah Anda yakin ingin menghapus mitra ini secara permanen?',
      confirmText: 'Hapus',
      type: 'danger'
    });
    
    if (!isConfirmed) return;

    const targetMitra = mitras.find(m => m.id === id);
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
      newMitras[idx] = mitraToSave;
      db.saveMitras(newMitras);
      db.addAuditLog({ userId: user.id, action: 'MITRA_UPDATED', details: `Mitra ${mitraToSave.id}` });
      setMitras(newMitras);
      setSelectedMitra(newMitras[idx]);
      toast.success('Data mitra berhasil diperbarui');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">Mitra Overview</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {mitras.map(m => {
            const mitraUser = users.find(u => u.id === m.userId);
            return (
              <div 
                key={m.id}
                onClick={() => setSelectedMitra(m)}
                className={`p-4 hover:bg-slate-50/50 transition-colors cursor-pointer ${m.isArchived ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {m.logoUrl ? (
                      <img src={m.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                  ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100">
                        {m.name.charAt(0)}
                      </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900">{m.name}</h3>
                    <p className="text-sm font-mono text-slate-500 mt-0.5">{mitraUser?.phone || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Limit</span>
                    <span className="font-semibold text-slate-900 text-sm">{m.creditLimit ? formatCurrency(m.creditLimit) : 'Unlimited'}</span>
                  </div>
                  <div>
                    {m.isArchived ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium uppercase tracking-wider border border-slate-200">Archived</span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-medium uppercase tracking-wider border border-emerald-100">Active</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {mitras.length === 0 && (
            <div className="p-8 text-center text-slate-500">No mitras found.</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-[13px] text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-900 font-medium text-[12px]">
              <tr>
                <th className="px-5 py-3">Mitra Name</th>
                <th className="px-5 py-3">Phone (User)</th>
                <th className="px-5 py-3">Credit Limit</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mitras.map(m => {
                const mitraUser = users.find(u => u.id === m.userId);
                return (
                  <tr 
                    key={m.id} 
                    onClick={() => setSelectedMitra(m)}
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${m.isArchived ? 'opacity-50' : ''}`}
                  >
                    <td className="px-5 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        {m.logoUrl ? (
                           <img src={m.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                             {m.name.charAt(0)}
                           </div>
                        )}
                        {m.name}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono">{mitraUser?.phone || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900">
                        {m.creditLimit ? formatCurrency(m.creditLimit) : 'Unlimited'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {m.isArchived ? (
                         <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium uppercase tracking-wider">Archived</span>
                      ) : (
                         <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-medium uppercase tracking-wider">Active</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {mitras.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No mitras found. Create a user with 'Mitra' role first.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 transition-opacity">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Mitra Details</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!isEditing ? (
            <div className="space-y-8">
               <div className="flex items-start gap-4">
                 <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    {mitra.logoUrl ? (
                       <img src={mitra.logoUrl} alt={mitra.name} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl uppercase">
                         {mitra.name.charAt(0)}
                       </div>
                    )}
                 </div>
                 <div className="pt-1">
                   <h3 className="text-xl font-bold text-slate-900 mb-1">{mitra.name}</h3>
                   <div className="flex items-center gap-2 mb-2">
                     {mitra.isArchived ? (
                         <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium uppercase tracking-wider">Archived</span>
                      ) : (
                         <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-medium uppercase tracking-wider">Active</span>
                      )}
                   </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                     <p className="text-xs text-slate-500 mb-1 font-medium">User Phone</p>
                     <p className="text-sm font-mono text-slate-900">{mitraUser?.phone || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                     <p className="text-xs text-slate-500 mb-1 font-medium">Mitra User Name</p>
                     <p className="text-sm text-slate-900">{mitraUser?.name || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                     <p className="text-xs text-slate-500 mb-2 font-medium">Credit Limit</p>
                     <LimitEditor defaultValue={mitra.creditLimit} onSave={(val) => onUpdateLimit(mitra.id, val)} />
                  </div>
               </div>

               <div className="space-y-4">
                 <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Actions</h4>
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition">
                      <Edit2 className="w-4 h-4" /> Edit Details
                    </button>
                    <button onClick={onToggleArchive} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${mitra.isArchived ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' : 'bg-orange-50 hover:bg-orange-100 text-orange-700'}`}>
                      <Archive className="w-4 h-4" />
                      {mitra.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button onClick={onDelete} className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition">
                      <Trash2 className="w-4 h-4" /> Delete Mitra
                    </button>
                 </div>
               </div>
            </div>
          ) : (
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company / Mitra Name</label>
                  <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
               </div>
               <div>
                  <FileUpload value={logoUrl} onChange={setLogoUrl} label="Logo (Opsional)" accept="image/*" />
               </div>
               <div className="pt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition">Save Changes</button>
               </div>
             </form>
          )}
        </div>
      </div>
    </div>
  );
}

function LimitEditor({ defaultValue, onSave }: { defaultValue: number | null, onSave: (val: string) => void }) {
  const [val, setVal] = useState(defaultValue ? defaultValue.toString() : '');
  return (
    <div className="flex items-center gap-2">
        <input 
           type="text" 
           value={val}
           placeholder="Unlimited"
           onChange={(e) => setVal(e.target.value.replace(/\D/g, ''))}
           className="px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 text-right w-full sm:w-48 bg-white"
        />
        <button onClick={() => onSave(val)} className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition" title="Save Limit">
           <Save className="w-4 h-4" />
        </button>
        {defaultValue && <span className="text-xs text-slate-500 font-medium ml-1">({formatCurrency(defaultValue)})</span>}
    </div>
  );
}
