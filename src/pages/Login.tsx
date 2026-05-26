import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, ArrowRight, ShieldCheck, Eye, EyeOff, LayoutPanelLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="h-screen w-full flex overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Left Panel: Hero Visual (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="/src/assets/images/login_hero_abstract_1779588166325.png" 
            alt="Workspace Background" 
            className="w-full h-full object-cover opacity-60 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/40 to-transparent" />
        </div>
        
        <div className="relative z-10 p-16 max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <LayoutPanelLeft className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-white font-display">
                REMA<span className="text-blue-500">-V2</span>
              </h1>
            </div>
            
            <h2 className="text-5xl font-bold font-display leading-[1.1] text-white mb-6">
              Platform Manajemen Produksi <span className="text-blue-500/80">Generasi Terbaru</span>.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed font-medium">
              Kelola ekosistem produksi dan alur keuangan bisnis Anda dalam satu workspace yang terintegrasi, aman, dan efisien.
            </p>
            
            <div className="mt-12 flex items-center gap-6 text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistem Online
              </div>
              <div>Build v2.1.0 (LTS)</div>
              <div>PT. Redone Berkah Mandiri</div>
            </div>
          </motion.div>
        </div>

        {/* Ambient glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-slate-950 relative overflow-y-auto">
        {/* Background elements for mobile */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-600/10 blur-[80px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-indigo-600/10 blur-[80px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Logo only for mobile */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl font-black tracking-tighter text-white font-display">
              REMA<span className="text-blue-500">-V2</span>
            </h1>
            <p className="text-slate-500 text-[12px] mt-2 font-medium">Manajemen Produksi & Finance</p>
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight font-display mb-2">Selamat Datang Kembali</h2>
            <p className="text-[13px] text-slate-500 font-medium">Masukkan kredensial Anda untuk mengakses sistem.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="login-phone" className="label-xs ml-1">Nomor Telepon</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-300">
                  <Phone strokeWidth={2.5} className="w-full h-full" />
                </div>
                <input 
                  id="login-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 rounded-2xl outline-none transition-all duration-300 text-[13px] text-white placeholder:text-slate-700 font-medium tabular-nums shadow-sm"
                  placeholder="0812XXXXXXXX"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="login-password" className="label-xs">Kata Sandi</label>
                <button type="button" className="text-[10px] text-blue-500/70 hover:text-blue-500 font-bold transition-colors">Lupa sandi?</button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-300">
                  <Lock strokeWidth={2.5} className="w-full h-full" />
                </div>
                <input 
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 rounded-2xl outline-none transition-all duration-300 text-[13px] text-white placeholder:text-slate-700 font-medium shadow-sm font-mono tracking-tight"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 text-slate-600 hover:text-slate-400 transition-colors rounded-lg outline-none focus:ring-2 focus:ring-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 mt-8"
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
                    Masuk <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4 text-[10px] text-slate-600 font-medium text-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              Koneksi terenkripsi
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:text-slate-400 transition-colors cursor-pointer">Syarat & Ketentuan</span>
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              <span className="hover:text-slate-400 transition-colors cursor-pointer">Kebijakan Privasi</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
