import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { api } from '../lib/api';
import { User, Mitra, Role } from '../types';
import { normalizePhone } from '../lib/utils';

type SafeUser = Omit<User, 'passwordHash'>;
import { Plus, Edit2, Lock, Unlock, MailX, Trash2, X, AlertCircle, ShieldAlert, BadgeCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Users() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [mitras, setMitras] = useState<Mitra[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);

  useEffect(() => {
    api.users.list().then(setUsers).catch(console.error);
    api.mitras.list().then(setMitras).catch(console.error);
  }, []);

  if (user?.role !== 'admin') return <div className="p-8 text-center text-red-500 font-bold">Akses Ditolak</div>;

  const handleToggleActive = async (targetId: string, currentStatus: boolean) => {
    if (targetId === user.id) return;
    const isConfirmed = await confirm({
      title: currentStatus ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna',
      message: `Apakah Anda yakin ingin ${currentStatus ? 'menonaktifkan' : 'mengaktifkan'} pengguna ini?`,
      confirmText: currentStatus ? 'Nonaktifkan' : 'Aktifkan',
      type: currentStatus ? 'danger' : 'info'
    });
    if (!isConfirmed) return;
    try {
      const updated = await api.users.update(targetId, { isActive: !currentStatus });
      await api.auditLogs.create({ userId: user.id, action: currentStatus ? 'USER_DISABLED' : 'USER_ENABLED', details: `Target: ${targetId}` });
      setUsers(prev => prev.map(u => u.id === targetId ? updated : u));
      setSelectedUser(updated);
      toast.success(`Pengguna berhasil di${currentStatus ? 'nonaktifkan' : 'aktifkan'}`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status pengguna');
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
    try {
      const updated = await api.users.update(targetId, { lockedUntil: null, failedLoginAttempts: 0 });
      await api.auditLogs.create({ userId: user.id, action: 'USER_UNLOCKED', details: `Target: ${targetId}` });
      setUsers(prev => prev.map(u => u.id === targetId ? updated : u));
      setSelectedUser(updated);
      toast.success('Blokir pengguna berhasil dibuka');
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuka blokir');
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
    try {
      const updated = await api.users.update(targetId, { newPassword: 'rema1234', mustChangePassword: true });
      await api.auditLogs.create({ userId: user.id, action: 'PASSWORD_RESET_ADMIN', details: `Target: ${targetId}` });
      setUsers(prev => prev.map(u => u.id === targetId ? updated : u));
      setSelectedUser(updated);
      toast.success('Password pengguna berhasil direset');
    } catch (err: any) {
      toast.error(err.message || 'Gagal reset password');
    }
  };

  const handleEditSave = async (updatedUser: SafeUser) => {
    const oldUser = users.find(u => u.id === updatedUser.id);
    try {
      if (oldUser && oldUser.role !== 'mitra' && updatedUser.role === 'mitra') {
        const existingMitra = mitras.find(m => m.userId === updatedUser.id);
        if (!existingMitra) {
          const created = await api.mitras.create({ id: crypto.randomUUID(), userId: updatedUser.id, name: updatedUser.name, creditLimit: undefined, isArchived: false } as Omit<Mitra, 'id'>);
          setMitras(prev => [created, ...prev]);
        }
      }
      const updated = await api.users.update(updatedUser.id, updatedUser);
      await api.auditLogs.create({ userId: user.id, action: 'USER_UPDATED', details: `Target: ${updatedUser.id}` });
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updated : u));
      setSelectedUser(updated);
      toast.success('Data pengguna berhasil diperbarui');
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui pengguna');
    }
  };

  const handleDelete = async (targetId: string) => {
    if (targetId === user.id) {
      toast.error("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    const isConfirmed = await confirm({
      title: 'Hapus Pengguna Secara Permanen',
      message: 'Apakah Anda yakin ingin menghapus pengguna ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus Permanen',
      type: 'danger'
    });
    if (!isConfirmed) return;
    try {
      await api.users.remove(targetId);
      await api.auditLogs.create({ userId: user.id, action: 'USER_DELETED', details: `User ${targetId}` });
      setUsers(prev => prev.filter(u => u.id !== targetId));
      setMitras(prev => prev.filter(m => m.userId !== targetId));
      setSelectedUser(null);
      toast.success('Pengguna berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pengguna');
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
          <h1 className="page-title">Otentikasi & Akun Pengguna</h1>
          <p className="text-[11px] text-slate-500 mt-1 font-medium opacity-80">Manajemen privilege, verifikasi kredensial, dan kontrol status hak akses.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="btn-primary text-[10px] uppercase tracking-wider"
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

      {isAddOpen && (
        <AddUserModal
          onClose={() => setIsAddOpen(false)}
          onAdd={(newUser) => setUsers(prev => [newUser, ...prev])}
          onAddMitra={(newMitra) => setMitras(prev => [newMitra, ...prev])}
        />
      )}

      <AnimatePresence>
        {selectedUser && (
          <UserDetailPanel
            userTarget={selectedUser}
            currentUserId={user.id}
            allUsers={users}
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
  allUsers,
  onClose,
  onSave,
  onToggleActive,
  onUnlock,
  onResetPassword,
  onDelete
}: {
  userTarget: SafeUser,
  currentUserId: string,
  allUsers: SafeUser[],
  onClose: () => void,
  onSave: (u: SafeUser) => void,
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
      const existing = allUsers.find(u => u.phone === p && u.id !== userTarget.id);
      if (existing) {
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
                 <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost">Batal</button>
                 <button type="submit" className="btn-secondary">Simpan Perubahan</button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AddUserModal({ onClose, onAdd, onAddMitra }: { onClose: () => void, onAdd: (user: SafeUser) => void, onAddMitra: (mitra: Mitra) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('mitra');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    setError('');
    try {
      const created = await api.users.create({
        id: crypto.randomUUID(),
        name,
        phone: p,
        role,
        password: 'rema1234',
        isActive: true,
        mustChangePassword: true,
        failedLoginAttempts: 0,
      });
      if (role === 'mitra') {
        const newMitra = await api.mitras.create({ id: crypto.randomUUID(), userId: created.id, name, creditLimit: undefined, isArchived: false } as Omit<Mitra, 'id'>);
        onAddMitra(newMitra);
      }
      await api.auditLogs.create({ userId: 'system', action: 'USER_CREATED', details: `User ${name} created` });
      onAdd(created);
      onClose();
      toast.success('Pengguna baru berhasil ditambahkan!');
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan pengguna');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6 animate-in slide-in-from-bottom-6 transition-all max-h-[90vh] overflow-y-auto">
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
             <button type="button" onClick={onClose} className="btn-ghost">Batal</button>
             <button type="submit" className="btn-secondary">Simpan Data</button>
          </div>
        </form>
      </div>
    </div>
  );
}export {};
