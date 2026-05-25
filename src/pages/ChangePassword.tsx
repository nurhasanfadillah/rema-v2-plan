import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { motion } from 'motion/react';
import { Lock, LogOut, KeyRound, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function ChangePassword() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8 || password.length > 64) {
      toast.error('Password must be between 8 and 64 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const body = isForced
        ? { newPassword: password }
        : { oldPassword, newPassword: password };
      const updatedUser = await api.users.changePassword(user.id, body);
      updateUser(updatedUser);
      toast.success('Password berhasil diperbarui');
      if (!isForced) {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui password.');
    } finally {
      setIsLoading(false);
    }
  };

  const isForced = user.mustChangePassword;

  return (
    <div className={cn(
      "w-full flex items-center justify-center text-slate-100 font-sans p-4 relative overflow-hidden",
      isForced ? "min-h-screen bg-radial from-slate-900 via-slate-950 to-black" : "py-10"
    )}>
      {/* Decorative ambient gradients - only if forced page */}
      {isForced && (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        </>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full animate-fade-in z-10"
      >
        {isForced && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 shadow-lg shadow-amber-500/20 mb-4 ring-4 ring-amber-500/10">
              <KeyRound className="w-7 h-7 text-white animate-pulse" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              REMA<span className="text-blue-500">.</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Dibutuhkan Perubahan Kata Sandi</p>
            <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mt-1">PT. Redone Berkah Mandiri Utama</p>
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
          
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">
              {isForced ? 'Change Password Required' : 'Ganti Kata Sandi'}
            </h2>
            {!isForced && (
               <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
               >
                 <ArrowLeft className="w-4 h-4" />
               </button>
            )}
          </div>
          
          <p className="text-slate-400 text-sm mb-6">
            {isForced 
              ? 'Silakan amankan akun Anda dengan mengganti kata sandi default sebelum melanjutkan.' 
              : 'Pastikan kata sandi baru Anda kuat dan sulit menebak untuk keamanan akun.'}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isForced && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Kata Sandi Lama</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition text-sm text-white placeholder-slate-500 font-medium"
                    placeholder="Kata sandi saat ini"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Kata Sandi Baru</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition text-sm text-white placeholder-slate-500 font-medium"
                  placeholder="Minimal 8 karakter"
                  required minLength={8} maxLength={64}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Konfirmasi Kata Sandi Baru</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition text-sm text-white placeholder-slate-500 font-medium"
                  placeholder="Ulangi kata sandi baru"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              {isForced && (
                <button 
                  type="button" 
                  onClick={logout} 
                  className="flex-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold py-3.5 px-4 rounded-2xl transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold py-3.5 px-4 rounded-2xl transition shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>

        {isForced && (
          <p className="text-center text-xs text-slate-400/70 mt-8">
            Fase Pengembangan v2.1 • Keamanan Enkripsi Lokal
          </p>
        )}
      </motion.div>
    </div>
  );
}
