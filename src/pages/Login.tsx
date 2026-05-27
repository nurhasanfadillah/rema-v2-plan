import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Phone, ArrowRight, ShieldCheck, Eye, EyeOff,
  CheckCircle, FileText, Headphones, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { token, user } = await api.auth.login(phone, password);
      api.auth.setToken(token);
      login(user);
      toast.success('Berhasil masuk');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Gagal masuk. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ backgroundColor: '#0a1628', colorScheme: 'dark' }}
    >
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ambient glow top-right */}
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black tracking-tighter text-white">
            REMA<span className="text-blue-500">-V2</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Manajemen Produksi & Finance</p>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Selamat Datang Kembali</h2>
          <p className="text-slate-400 text-sm mt-2">Masukkan kredensial Anda untuk mengakses sistem.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Phone input */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors duration-200 focus-within:border-blue-500/60"
            style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: '#0a1628', borderColor: '#1e3a5f' }}
            >
              <Phone className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="login-phone" className="block text-blue-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                Nomor Telepon
              </label>
              <input
                id="login-phone"
                name="phone"
                type="tel"
                autoComplete="tel-national"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-transparent outline-none text-white text-sm placeholder:text-slate-600 font-medium tabular-nums"
                style={{ backgroundColor: 'transparent' }}
                placeholder="0812XXXXXXXX"
                required
              />
            </div>
            {phone.length >= 10 && (
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            )}
          </div>

          {/* Password input */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors duration-200 focus-within:border-blue-500/60"
            style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: '#0a1628', borderColor: '#1e3a5f' }}
            >
              <Lock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="login-password" className="block text-blue-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                Kata Sandi
              </label>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-white text-sm placeholder:text-slate-600 font-mono tracking-tight"
                style={{ backgroundColor: 'transparent' }}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded-lg outline-none focus:ring-2 focus:ring-slate-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Lupa sandi */}
          <div className="flex justify-end">
            <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Lupa sandi?
            </button>
          </div>

          {/* Ingat saya */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 cursor-pointer accent-blue-500"
            />
            <label htmlFor="remember-me" className="text-sm text-slate-300 cursor-pointer select-none">
              Ingat saya
            </label>
          </div>

          {/* Tombol Masuk */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-base rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"
                />
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2"
                >
                  Masuk <ArrowRight className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ backgroundColor: '#1e3a5f' }} />
          <span className="text-slate-500 text-xs">atau</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#1e3a5f' }} />
        </div>

        {/* Security badge */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3 border"
          style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Koneksi terenkripsi</p>
            <p className="text-slate-400 text-xs">Data Anda aman bersama kami.</p>
          </div>
          <span
            className="flex items-center gap-1 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0"
            style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }}
          >
            <Lock className="w-3 h-3" /> Aman
          </span>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
          <button type="button" className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <FileText className="w-3 h-3" /> Syarat & Ketentuan
          </button>
          <div className="w-px h-3 rounded-full" style={{ backgroundColor: '#1e3a5f' }} />
          <button type="button" className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Kebijakan Privasi
          </button>
        </div>

        {/* Help + Version */}
        <div
          className="rounded-2xl p-3 flex items-center gap-3 border mt-3"
          style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
            style={{ backgroundColor: '#0a1628', borderColor: '#1e3a5f' }}
          >
            <Headphones className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold">Butuh bantuan?</p>
            <p className="text-slate-500 text-[10px]">Hubungi tim support kami</p>
          </div>
          <span className="text-blue-400 text-xs font-semibold flex items-center gap-0.5 shrink-0">
            Versi 2.0.0 <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </motion.div>
    </div>
  );
}
