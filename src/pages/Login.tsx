import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { normalizePhone } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      const users = db.getUsers();
      const normalized = normalizePhone(phone);
      const userIndex = users.findIndex(u => u.phone === normalized);
      
      if (userIndex === -1) {
        toast.error('Pengguna tidak ditemukan atau kata sandi salah.');
        setIsLoading(false);
        return;
      }

      const user = users[userIndex];
      
      if (!user.isActive) {
        toast.error('Akun dinonaktifkan.');
        setIsLoading(false);
        return;
      }

      const unbanTime = user.lockedUntil || 0;
      if (Date.now() < unbanTime) {
        const waitMins = Math.ceil((unbanTime - Date.now()) / 60000);
        toast.error(`Akun terkunci. Coba lagi dalam ${waitMins} menit.`);
        setIsLoading(false);
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
        setIsLoading(false);
        return;
      }

      // Success
      users[userIndex] = { ...user, failedLoginAttempts: 0, lockedUntil: undefined };
      db.saveUsers(users);
      db.addAuditLog({ userId: user.id, action: 'LOGIN_SUCCESS', details: 'Logged in' });
      
      toast.success('Berhasil masuk');
      navigate('/', { replace: true });
      login(users[userIndex]);
      setIsLoading(false);
    }, 400); // add subtle feedback timing
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-slate-100 font-sans p-4 relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 mb-4 ring-4 ring-blue-500/10">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            REMA<span className="text-blue-500">.</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Sistem Informasi Manajemen Produksi & Finance</p>
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mt-1">PT. Redone Berkah Mandiri Utama</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
          
          <h2 className="text-lg font-semibold text-white mb-6">Silakan Masuk ke Akun Anda</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nomor Telepon</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition text-sm text-white placeholder-slate-500 font-medium"
                  placeholder="Contoh: 081234567890"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Kata Sandi</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition text-sm text-white placeholder-slate-500 font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold py-3.5 px-4 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] cursor-pointer mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Masuk Sistem <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400/70 mt-8">
          Fase Pengembangan v2.1 • Keamanan Enkripsi Lokal
        </p>
      </motion.div>
    </div>
  );
}
