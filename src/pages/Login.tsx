import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { normalizePhone } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const users = db.getUsers();
    const normalized = normalizePhone(phone);
    const userIndex = users.findIndex(u => u.phone === normalized);
    
    if (userIndex === -1) {
      toast.error('Pengguna tidak ditemukan atau kata sandi salah.');
      return;
    }

    const user = users[userIndex];
    
    if (!user.isActive) {
      toast.error('Akun dinonaktifkan.');
      return;
    }

    const unbanTime = user.lockedUntil || 0;
    if (Date.now() < unbanTime) {
      const waitMins = Math.ceil((unbanTime - Date.now()) / 60000);
      toast.error(`Akun terkunci. Coba lagi dalam ${waitMins} menit.`);
      return;
    }

    if (user.passwordHash !== password) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let lockedUntil = user.lockedUntil;
      
      if (attempts >= 5) {
        lockedUntil = Date.now() + 15 * 60000; // 15 mins block
        db.addAuditLog({ userId: user.id, action: 'LOGIN_LOCKED', details: 'Exceeded max attempts' });
      } else {
        db.addAuditLog({ userId: user.id, action: 'LOGIN_FAILED', details: `Attempt ${attempts}` });
      }

      users[userIndex] = { ...user, failedLoginAttempts: attempts, lockedUntil };
      db.saveUsers(users);
      toast.error('Kata sandi salah.');
      return;
    }

    // Success
    users[userIndex] = { ...user, failedLoginAttempts: 0, lockedUntil: undefined };
    db.saveUsers(users);
    db.addAuditLog({ userId: user.id, action: 'LOGIN_SUCCESS', details: 'Logged in' });
    
    toast.success('Berhasil masuk');
    navigate('/', { replace: true });
    login(users[userIndex]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 font-sans p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/60">
        <div className="bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-bold font-mono tracking-tight text-white mb-1.5">REMA-V2.1</h1>
          <p className="text-slate-400 text-[13px]">PT. Redone Berkah Mandiri Utama</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Nomor Telepon</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-[13px]"
                placeholder="0812..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition text-[13px]"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition text-[13px] shadow-sm mt-2"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
