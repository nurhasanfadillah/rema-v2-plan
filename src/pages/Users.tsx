import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { db } from '../lib/db';
import { User, Role } from '../types';
import { normalizePhone } from '../lib/utils';
import { Plus, Edit2, Lock, Unlock, MailX, Trash2, X, AlertCircle, ShieldAlert, BadgeCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Users() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  if (user?.role !== 'admin') return <div className="p-8 text-center text-red-500 font-bold">Akses Ditolak</div>;

  const handleToggleActive = async (targetId: string, currentStatus: boolean) => {
    if (targetId === user.id) return; // Cant disable self
    const isConfirmed = await confirm({
      title: currentStatus ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna',
      message: `Apakah Anda yakin ingin ${currentStatus ? 'menonaktifkan' : 'mengaktifkan'} pengguna ini?`,
      confirmText: currentStatus ? 'Nonaktifkan' : 'Aktifkan',
      type: currentStatus ? 'danger' : 'info'
    });
    
    if (!isConfirmed) return;

    const newUsers = [...users];
    const idx = newUsers.findIndex(u => u.id === targetId);
    if (idx !== -1) {
      newUsers[idx] = { ...newUsers[idx], isActive: !currentStatus };
      db.saveUsers(newUsers);
      db.addAuditLog({ userId: user.id, action: currentStatus ? 'USER_DISABLED' : 'USER_ENABLED', details: `Target: ${targetId}` });
      setUsers(newUsers);
      setSelectedUser(newUsers[idx]);
      toast.success(`Pengguna berhasil di${currentStatus ? 'nonaktifkan' : 'aktifkan'}`);
    }
  };

  const handleUnlock = async (targetId: string) => {
    const isConfirmed = await confirm({
      title: 'Buka Blokir Pengguna',
      message: 'Apakah Anda yakin ingin membuka blokir akun pengguna ini?',
      confirmText: 'Buka Blokir',
      type: 'info'
    });
    
    if (!isConfirmed) return;

    const newUsers = [...users];
    const idx = newUsers.findIndex(u => u.id === targetId);
    if (idx !== -1) {
      newUsers[idx] = { ...newUsers[idx], lockedUntil: undefined, failedLoginAttempts: 0 };
      db.saveUsers(newUsers);
      db.addAuditLog({ userId: user.id, action: 'USER_UNLOCKED', details: `Target: ${targetId}` });
      setUsers(newUsers);
      setSelectedUser(newUsers[idx]);
      toast.success('Blokir pengguna berhasil dibuka');
    }
  };

  const handleResetPassword = async (targetId: string) => {
    const isConfirmed = await confirm({
      title: 'Reset Password',
      message: 'Apakah Anda yakin ingin melakukan reset password pengguna ini? Semua sesi akan diakhiri dan mereka wajib mengganti password saat login kembali.',
      confirmText: 'Reset Password',
      type: 'warning'
    });

    if (!isConfirmed) return;
    
    const newUsers = [...users];
    const idx = newUsers.findIndex(u => u.id === targetId);
    if (idx !== -1) {
      newUsers[idx] = { ...newUsers[idx], passwordHash: 'rema1234', mustChangePassword: true };
      db.saveUsers(newUsers);
      db.addAuditLog({ userId: user.id, action: 'PASSWORD_RESET_ADMIN', details: `Target: ${targetId}` });
      setUsers(newUsers);
      setSelectedUser(newUsers[idx]);
      toast.success('Password pengguna berhasil direset');
    }
  };

  const handleEditSave = (updatedUser: User) => {
    const oldUser = users.find(u => u.id === updatedUser.id);
    
    if (oldUser && oldUser.role !== 'mitra' && updatedUser.role === 'mitra') {
      const existingMitra = db.getMitras().find(m => m.userId === updatedUser.id);
      if (!existingMitra) {
        const newMitra = {
          id: crypto.randomUUID(),
          userId: updatedUser.id,
          name: updatedUser.name,
          creditLimit: null,
          isArchived: false,
        };
        db.saveMitras([newMitra, ...db.getMitras()]);
      }
    }

    const newUsers = [...users];
    const idx = newUsers.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
      newUsers[idx] = updatedUser;
      db.saveUsers(newUsers);
      db.addAuditLog({ userId: user.id, action: 'USER_UPDATED', details: `Target: ${updatedUser.id}` });
      setUsers(newUsers);
      setSelectedUser(updatedUser);
      toast.success('Data pengguna berhasil diperbarui');
    }
  };

  const handleDelete = async (targetId: string) => {
    if (targetId === user.id) {
      toast.error("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    const targetUser = users.find(u => u.id === targetId);
    if (!targetUser) return;

    const auditLogs = db.getAuditLogs();
    const hasAuditTrail = auditLogs.some(log => log.userId === targetId);
    
    if (hasAuditTrail) {
      toast.error("Tidak dapat menghapus pengguna ini karena memiliki riwayat aktivitas di sistem. Silakan nonaktifkan saja.");
      return;
    }

    if (targetUser.role === 'mitra') {
      const mitras = db.getMitras();
      const linkedMitra = mitras.find(m => m.userId === targetId);
      if (linkedMitra) {
        const orders = db.getOrders();
        const ledgers = db.getLedgers();
        const requests = db.getRequests();
        const isUsedInOrders = orders.some(o => o.mitraId === linkedMitra.id);
        const isUsedInLedger = ledgers.some(l => l.mitraId === linkedMitra.id);
        const isUsedInRequests = requests.some(r => r.mitraId === linkedMitra.id);
        if (isUsedInOrders || isUsedInLedger || isUsedInRequests) {
          toast.error("Tidak dapat menghapus user ini karena entitas mitranya sudah memiliki pesanan, riwayat saldo, atau pengajuan (request).");
          return;
        }
      }
    }

    const isConfirmed = await confirm({
      title: 'Hapus Pengguna Secara Permanen',
      message: 'Apakah Anda yakin ingin menghapus pengguna ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus Permanen',
      type: 'danger'
    });

    if (!isConfirmed) return;

    if (targetUser.role === 'mitra') {
      const mitras = db.getMitras();
      const linkedMitra = mitras.find(m => m.userId === targetId);
      if (linkedMitra) {
        db.saveMitras(mitras.filter(m => m.id !== linkedMitra.id));
      }
    }

    const newUsers = users.filter(u => u.id !== targetId);
    db.saveUsers(newUsers);
    db.addAuditLog({ userId: user.id, action: 'USER_DELETED', details: `User ${targetId}` });
    setUsers(newUsers);
    setSelectedUser(null);
    toast.success('Pengguna berhasil dihapus');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight leading-none">Otentikasi & Akun Pengguna</h1>
          <p className="text-[11px] text-slate-500 mt-1 font-medium opacity-80">Manajemen privilege, verifikasi kredensial, dan kontrol status hak akses.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xl shadow-blue-600/10 active:scale-[0.98] cursor-pointer uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" /> Add User
        </button>
      </div>

      {users.length === 0 ? (
        <div className="bg-white/5 border border-white/5 rounded-[32px] p-16 text-center shadow-2xl backdrop-blur-sm">
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 text-slate-700 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-xl">
             <AlertCircle className="w-10 h-10" />
          </div>
          <h3 className="text-white font-bold text-xl tracking-tight">Data User Kosong</h3>
          <p className="text-slate-500 text-[13px] mt-2 mx-auto max-w-sm font-medium leading-relaxed">Silakan buat akun baru dengan klik tombol "Add User" di atas untuk memulai manajemen otentikasi.</p>
        </div>
      ) : (
        <div className="space-y-4">
            <motion.div 
            variants={containerVariants}
            className="md:hidden grid grid-cols-1 gap-2.5"
          >
            {users.map(u => (
              <motion.div 
                key={u.id}
                variants={itemVariants}
                onClick={() => setSelectedUser(u)}
                className={`bg-white/5 rounded-2xl p-3 border border-white/5 shadow-2xl hover:border-blue-500/30 transition-all cursor-pointer group flex items-center justify-between gap-3 backdrop-blur-sm ${!u.isActive ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-md border transition-all group-hover:scale-105 ${
                    u.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    u.role === 'mitra' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    'bg-slate-900 text-slate-500 border-slate-800'
                  }`}>
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-bold text-white text-[13px] leading-tight truncate group-hover:text-blue-400 transition-colors uppercase">{u.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-600 font-mono tabular-nums tracking-wider uppercase opacity-70">{u.phone}</span>
                      <span className="px-1 py-0.5 bg-slate-950/40 text-slate-500 rounded text-[7px] font-bold uppercase border border-white/5 italic opacity-60">{u.role}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    {u.isActive ? (
                      <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[7px] font-bold uppercase border border-blue-500/20 tracking-wider">Aktif</span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded text-[7px] font-bold uppercase border border-slate-800 tracking-wider">Banned</span>
                    )}
                    {u.lockedUntil && u.lockedUntil > Date.now() && (
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[7px] font-bold uppercase border border-amber-500/20 tracking-wider animate-pulse">Locked</span>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-0.5">
                     <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Desktop View - Table */}
          <div className="hidden md:block bg-white/5 rounded-2xl shadow-xl border border-white/5 overflow-hidden backdrop-blur-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-950/40 border-b border-white/5 text-slate-500 font-bold text-[8px] uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-3.5">Informasi Profil</th>
                  <th className="px-5 py-3.5">Kredensial</th>
                  <th className="px-5 py-3.5">Hak Akses</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-[12px]">
                {users.map(u => (
                  <tr 
                    key={u.id} 
                    onClick={() => setSelectedUser(u)}
                    className={`hover:bg-blue-500/[0.02] transition-colors duration-200 cursor-pointer group ${!u.isActive ? 'opacity-30' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 font-bold text-white">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border transition-all group-hover:scale-105 ${
                          u.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          u.role === 'mitra' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          'bg-slate-900 text-slate-600 border-slate-800'
                        }`}>
                          {u.name.charAt(0)}
                        </div>
                        <span className="uppercase tracking-tight text-[12px] group-hover:text-blue-300 transition-colors">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-600 tracking-wider tabular-nums uppercase opacity-70 text-[11px]">{u.phone}</td>
                    <td className="px-5 py-3">
                       <span className="px-2 py-0.5 bg-slate-950/40 border border-white/5 rounded-md text-slate-500 text-[9px] font-bold uppercase tracking-wider group-hover:text-blue-400 transition-all opacity-80">
                         {u.role}
                       </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {u.lockedUntil && u.lockedUntil > Date.now() && (
                           <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[8px] font-bold uppercase border border-amber-500/20 tracking-wider animate-pulse">Locked</span>
                        )}
                        {u.isActive ? (
                           <span className="inline-flex items-center px-3 py-1 bg-blue-500/10 text-blue-400 rounded text-[8px] font-bold uppercase border border-blue-500/20 tracking-wider">Aktif</span>
                        ) : (
                           <span className="inline-flex items-center px-3 py-1 bg-slate-900 text-slate-500 rounded text-[8px] font-bold uppercase border border-slate-800 tracking-wider">Off</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAddOpen && <AddUserModal onClose={() => setIsAddOpen(false)} onAdd={(newUser) => setUsers([newUser, ...users])} />}
      
      <AnimatePresence>
        {selectedUser && (
          <UserDetailPanel 
            userTarget={selectedUser} 
            currentUserId={user.id}
            onClose={() => setSelectedUser(null)} 
            onSave={handleEditSave}
            onToggleActive={() => handleToggleActive(selectedUser.id, selectedUser.isActive)}
            onUnlock={() => handleUnlock(selectedUser.id)}
            onResetPassword={() => handleResetPassword(selectedUser.id)}
            onDelete={() => handleDelete(selectedUser.id)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function UserDetailPanel({ 
  userTarget, 
  currentUserId,
  onClose, 
  onSave, 
  onToggleActive, 
  onUnlock, 
  onResetPassword, 
  onDelete 
}: { 
  userTarget: User, 
  currentUserId: string,
  onClose: () => void, 
  onSave: (u: User) => void,
  onToggleActive: () => void,
  onUnlock: () => void,
  onResetPassword: () => void,
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userTarget.name);
  const [phone, setPhone] = useState(userTarget.phone);
  const [role, setRole] = useState<Role>(userTarget.role);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    
    if (p !== userTarget.phone) {
      const existing = db.getUsers().find(u => u.phone === p);
      if(existing) {
        setError('Nomor telepon sudah digunakan oleh akun lain.');
        return;
      }
    }

    if (!name.trim()) {
      setError('Nama tidak boleh kosong.');
      return;
    }

    onSave({
      ...userTarget,
      name: name.trim(),
      phone: p,
      role
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100dvw' }}
        animate={{ x: 0 }}
        exit={{ x: '100dvw' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[16px] font-black text-slate-900 tracking-tight">Detail Info Akun</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!isEditing ? (
            <div className="space-y-6">
               <div>
                 <div className="flex items-center gap-3.5 mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl uppercase shadow-md">
                      {userTarget.name.charAt(0)}
                   </div>
                   <div>
                     <h3 className="text-[16px] font-black text-slate-900 leading-tight">{userTarget.name}</h3>
                     <p className="text-[10px] font-bold text-slate-400 capitalize font-mono mt-0.5 tracking-wider">{userTarget.role}</p>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/80">
                       <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Status Login</p>
                       <div className="flex items-center gap-2">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${userTarget.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                           {userTarget.isActive ? 'Aktif' : 'Off'}
                         </span>
                       </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/80">
                       <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Nomor HP</p>
                       <p className="text-[11px] font-mono font-bold text-slate-900 tracking-wide">{userTarget.phone}</p>
                    </div>
                 </div>
               </div>

               <div className="space-y-3">
                 <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Kontrol Operasional</h4>
                 <div className="grid grid-cols-2 gap-2 font-bold text-[11px]">
                    <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95">
                      <Edit2 className="w-3.5 h-3.5" /> Edit Profil
                    </button>
                    {userTarget.lockedUntil && userTarget.lockedUntil > Date.now() && (
                      <button onClick={onUnlock} className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl transition-all cursor-pointer active:scale-95">
                        <Unlock className="w-3.5 h-3.5" /> Buka Kunci
                      </button>
                    )}
                    <button onClick={onResetPassword} className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95">
                      <Lock className="w-3.5 h-3.5" /> Reset PW
                    </button>
                    <button onClick={onToggleActive} disabled={userTarget.id === currentUserId} className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95 ${userTarget.isActive ? 'bg-orange-50 hover:bg-orange-100 text-orange-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'} disabled:opacity-50`}>
                      {userTarget.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      {userTarget.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={onDelete} disabled={userTarget.id === currentUserId} className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50 font-extrabold whitespace-nowrap">
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Akun Permanen
                    </button>
                 </div>
               </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 font-bold text-[13px]">
              {error && <div className="bg-red-50 border border-red-150 text-red-650 p-3 rounded-xl text-[11px] flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}</div>}
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Pengguna</label>
                 <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-[12px]" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Telepon</label>
                 <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-[12px]" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Akses Role</label>
                 <select value={role} disabled={userTarget.role === 'admin'} onChange={e=>setRole(e.target.value as Role)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-lg outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-bold text-slate-700 text-[12px] disabled:opacity-50">
                   <option value="admin">Admin</option>
                   <option value="staff">Staff</option>
                   <option value="operational">Operational</option>
                   <option value="mitra">Mitra</option>
                 </select>
              </div>
              <div className="pt-4 flex justify-end gap-2.5 text-[11px]">
                 <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer">Batal</button>
                 <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all cursor-pointer">Simpan Perubahan</button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AddUserModal({ onClose, onAdd }: { onClose: () => void, onAdd: (user: User) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('mitra');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    
    const existing = db.getUsers().find(u => u.phone === p);
    if(existing) {
      setError('Nomor telepon sudah terdaftar di sistem.');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      phone: p,
      role,
      passwordHash: 'rema1234',
      isActive: true,
      mustChangePassword: true,
    };

    const newUsers = [newUser, ...db.getUsers()];
    db.saveUsers(newUsers);
    
    if (role === 'mitra') {
      const newMitra = {
        id: crypto.randomUUID(),
        userId: newUser.id,
        name,
        creditLimit: null,
        isArchived: false,
      };
      db.saveMitras([newMitra, ...db.getMitras()]);
    }

    db.addAuditLog({ userId: 'system', action: 'USER_CREATED', details: `User ${name} created` });
    onAdd(newUser);
    onClose();
    toast.success('Pengguna baru berhasil ditambahkan!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6 animate-in slide-in-from-bottom-6 transition-all">
        <h2 className="text-[16px] font-black tracking-tight text-slate-900 mb-5">➕ Daftarkan Akun Pengguna</h2>
        {error && <div className="bg-red-50 border border-red-150 text-red-650 p-3 rounded-xl text-[11px] flex items-start gap-2 mb-4"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
             <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-bold text-slate-800 text-[12px]" placeholder="Nama lengkap" />
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Handphone (HP)</label>
             <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-bold text-slate-850 text-[12px]" placeholder="08xxxxxxxxxx" />
          </div>
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hak Akses Sistem</label>
             <select value={role} onChange={e=>setRole(e.target.value as Role)} className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-lg outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-bold text-slate-700 text-[11px]">
                <option value="admin">Administrator SYSTEM</option>
                <option value="staff">Staff Admin</option>
                <option value="operational">Operational Produksi</option>
                <option value="mitra">Mitra Partner</option>
             </select>
          </div>
          <div className="pt-4 flex justify-end gap-2.5 text-[11px]">
             <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer">Batal</button>
             <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all cursor-pointer active:scale-95">Simpan Data</button>
          </div>
        </form>
      </div>
    </div>
  );
}export {};
