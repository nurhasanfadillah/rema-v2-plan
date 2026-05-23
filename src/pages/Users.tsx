import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { db } from '../lib/db';
import { User, Role } from '../types';
import { normalizePhone } from '../lib/utils';
import { Plus, Edit2, Lock, Unlock, MailX, Trash2, X, AlertCircle, ShieldAlert, BadgeCheck, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
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
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-2 py-0.5 w-max mb-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Akses Superadministrator
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Manajemen Akun Pengguna</h1>
          <p className="text-[13px] text-slate-500 mt-0.5 font-semibold">Tentukan hak akses, kelola penanganan kata sandi, blokir, dan limitasi operasional.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-gradient-to-tr from-slate-950 to-slate-900 hover:from-slate-900 hover:to-slate-800 text-white px-5 py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
        >
          <Plus className="w-4.5 h-4.5" /> Tambah Pengguna Baru
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03),0_8px_16px_-8px_rgba(0,0,0,0.01)] border border-slate-200/60 overflow-hidden">
        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {users.map(u => (
            <div 
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div>
                 <h3 className="font-extrabold text-slate-900 text-sm">{u.name}</h3>
                 <p className="text-xs font-semibold font-mono text-slate-400 mt-0.5">{u.phone}</p>
                 <div className="flex items-center gap-1.5 mt-2">
                    <span className="capitalize text-[10px] font-extrabold text-slate-500 border border-slate-250 bg-white px-2 py-0.5 rounded-md leading-none">{u.role}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${u.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                       {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    {u.lockedUntil && u.lockedUntil > Date.now() && (
                       <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 text-orange-700">
                          Terkunci
                       </span>
                    )}
                 </div>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
          {users.length === 0 && (
            <div className="p-10 text-center text-slate-400 font-bold">Belum ada akun pengguna terdaftar.</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-[13px] text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-900 font-extrabold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nama Pengguna</th>
                <th className="px-6 py-4">Nomor HP/Kontak</th>
                <th className="px-6 py-4">Peran (Role)</th>
                <th className="px-6 py-4 text-right">Status Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {users.map(u => (
                <tr 
                  key={u.id} 
                  onClick={() => setSelectedUser(u)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer font-semibold"
                >
                  <td className="px-6 py-4 font-extrabold text-slate-900">{u.name}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-400">{u.phone}</td>
                  <td className="px-6 py-4 capitalize">
                     <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs">
                       {u.role}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${u.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-105'}`}>
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      {u.lockedUntil && u.lockedUntil > Date.now() && (
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                          Terkunci
                         </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Detail Info Akun</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!isEditing ? (
            <div className="space-y-8">
               <div>
                 <div className="flex items-center gap-4 mb-4">
                   <div className="w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl uppercase shadow-md">
                      {userTarget.name.charAt(0)}
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-slate-900 leading-tight">{userTarget.name}</h3>
                     <p className="text-xs font-bold text-slate-400 capitalize font-mono mt-1 tracking-wider">{userTarget.role}</p>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                       <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Status Login</p>
                       <div className="flex items-center gap-2">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider ${userTarget.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                           {userTarget.isActive ? 'Aktif' : 'Nonaktif'}
                         </span>
                       </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                       <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Nomor HP</p>
                       <p className="text-xs font-mono font-bold text-slate-900 tracking-wide">{userTarget.phone}</p>
                    </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Kontrol Operasional</h4>
                 <div className="grid grid-cols-2 gap-3 font-bold text-xs">
                    <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95">
                      <Edit2 className="w-4 h-4" /> Edit Profil
                    </button>
                    {userTarget.lockedUntil && userTarget.lockedUntil > Date.now() && (
                      <button onClick={onUnlock} className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl transition-all cursor-pointer active:scale-95">
                        <Unlock className="w-4 h-4" /> Buka Kunci
                      </button>
                    )}
                    <button onClick={onResetPassword} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95">
                      <Lock className="w-4 h-4" /> Reset PW
                    </button>
                    <button onClick={onToggleActive} disabled={userTarget.id === currentUserId} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all cursor-pointer active:scale-95 ${userTarget.isActive ? 'bg-orange-50 hover:bg-orange-100 text-orange-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'} disabled:opacity-50`}>
                      {userTarget.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      {userTarget.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onClick={onDelete} disabled={userTarget.id === currentUserId} className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50 font-extrabold">
                      <Trash2 className="w-4 h-4" /> Hapus Akun Permanen
                    </button>
                 </div>
               </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-bold text-xs sm:text-sm">
              {error && <div className="bg-red-50 border border-red-150 text-red-650 p-4 rounded-xl text-xs flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}</div>}
              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Pengguna</label>
                 <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-xs" />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nomor Telepon</label>
                 <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-xs" />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Akses Role</label>
                 <select value={role} disabled={userTarget.role === 'admin'} onChange={e=>setRole(e.target.value as Role)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-bold text-slate-700 text-xs disabled:opacity-50">
                   <option value="admin">Admin</option>
                   <option value="staff">Staff</option>
                   <option value="operational">Operational</option>
                   <option value="mitra">Mitra</option>
                 </select>
              </div>
              <div className="pt-6 flex justify-end gap-3 text-xs">
                 <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all cursor-pointer">Batal</button>
                 <button type="submit" className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all cursor-pointer">Simpan Perubahan</button>
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
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 lg:p-8 animate-in slide-in-from-bottom-8">
        <h2 className="text-lg font-black tracking-tight text-slate-900 mb-6">➕ Daftarkan Akun Pengguna</h2>
        {error && <div className="bg-red-50 border border-red-150 text-red-650 p-4 rounded-xl text-xs flex items-start gap-2 mb-4"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
             <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-bold text-slate-800 text-xs" placeholder="Nama lengkap" />
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nomor Handphone (HP)</label>
             <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-bold text-slate-850 text-xs" placeholder="08xxxxxxxxxx" />
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hak Akses Sistem</label>
             <select value={role} onChange={e=>setRole(e.target.value as Role)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-bold text-slate-700 text-xs">
                <option value="admin">Administrator SYSTEM</option>
                <option value="staff">Staff Admin</option>
                <option value="operational">Tim Operational Produksi</option>
                <option value="mitra">Mitra Partner</option>
             </select>
          </div>
          <div className="pt-6 flex justify-end gap-3 text-xs">
             <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all cursor-pointer">Batal</button>
             <button type="submit" className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all cursor-pointer active:scale-95">Simpan Data</button>
          </div>
        </form>
      </div>
    </div>
  );
}export {};
