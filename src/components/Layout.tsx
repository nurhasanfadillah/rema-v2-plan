import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserSquare2, Package, ShoppingCart, ListOrdered, Wallet, LogOut, Menu, X, Receipt, ChevronRight, Undo2, Activity, KeyRound, BarChart3, ClipboardList, Zap, Download, Calculator, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

import RunningOrders from './RunningOrders';
import { PWAUpdateBanner } from './PWAUpdateBanner';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Layout() {
  const { user, logout, updateUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [cpOldPw, setCpOldPw] = useState('');
  const [cpNewPw, setCpNewPw] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const openChangePass = () => {
    setCpOldPw('');
    setCpNewPw('');
    setCpConfirm('');
    setChangePassOpen(true);
  };

  const closeChangePass = () => {
    setCpOldPw('');
    setCpNewPw('');
    setCpConfirm('');
    setChangePassOpen(false);
  };

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpNewPw.length < 8 || cpNewPw.length > 64) {
      toast.error('Kata sandi harus 8–64 karakter.');
      return;
    }
    if (cpNewPw !== cpConfirm) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setCpLoading(true);
    try {
      const updatedUser = await api.users.changePassword(user!.id, { oldPassword: cpOldPw, newPassword: cpNewPw });
      updateUser(updatedUser);
      toast.success('Password berhasil diperbarui');
      closeChangePass();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui password.');
    } finally {
      setCpLoading(false);
    }
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  if (!user) return null;

  const links = [
    { to: '/', icon: <LayoutDashboard />, label: 'Dashboard', roles: ['admin', 'staff', 'operational', 'mitra'] },
    { to: '/users', icon: <Users />, label: 'Pengguna', roles: ['admin'] },
    { to: '/mitras', icon: <UserSquare2 />, label: 'Mitra', roles: ['admin'] },
    { to: '/products', icon: <Package />, label: 'Katalog Produk', roles: ['admin', 'mitra'] },
    { to: '/orders/drafts', icon: <ShoppingCart />, label: 'Draft Pesanan', roles: ['mitra'] },
    { to: '/orders', icon: <ListOrdered />, label: 'Daftar Pesanan', roles: ['admin', 'staff', 'operational', 'mitra'], excludePrefix: '/orders/drafts' },
    { to: '/cancellations', icon: <Undo2 />, label: 'Pembatalan & Retur', roles: ['admin', 'staff', 'mitra'] },
    { to: '/queue', icon: <Receipt />, label: 'Antrian Produksi', roles: ['admin', 'staff', 'operational', 'mitra'] },
    { to: '/priority', icon: <Zap />, label: 'Prioritas Pesanan', roles: ['admin', 'staff', 'operational', 'mitra'] },
    { to: '/calculator', icon: <Calculator />, label: 'Kalkulator Harga', roles: ['admin', 'mitra'] },
    { to: '/finance', icon: <Wallet />, label: 'Keuangan', roles: ['admin', 'mitra'] },
    { to: '/reports', icon: <BarChart3 />, label: 'Laporan', roles: ['admin', 'mitra', 'staff'] },
    { to: '/audit-logs', icon: <ClipboardList />, label: 'Audit Logs', roles: ['admin', 'staff'] },
  ];

  const visibleLinks = links.filter(l => l.roles.includes(user.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 w-64 flex-shrink-0 border-r border-slate-900 relative">
      <div className="pt-8 pb-6 px-6 relative flex flex-col items-start">
        <div className="flex items-center gap-3 group px-1">
          <div>
            <h2 className="font-display text-lg font-black tracking-tighter text-white flex items-center leading-none">
              REMA<span className="text-blue-500">-V2</span>
            </h2>
            <p className="text-[8px] font-mono text-slate-500 tracking-widest font-bold uppercase mt-1">Workspace v2.1</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
        <p className="label-xs px-3 mb-2">Menu Utama</p>
        
        {visibleLinks.map(l => {
          const active = l.excludePrefix
            ? location.pathname.startsWith(l.to) && !location.pathname.startsWith(l.excludePrefix)
            : undefined; // undefined = let NavLink decide via isActive
          return (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => cn(
                "flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-300 font-semibold text-[13px] group relative overflow-visible",
                (active ?? isActive)
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/15 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5"
              )}
            >
              {({ isActive }) => {
                const isLinkActive = active ?? isActive;
                return (
                  <>
                    {isLinkActive && <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-blue-400 rounded-r-full shadow-lg shadow-blue-500/50" />}
                    <div className="flex items-center gap-3">
                      {React.cloneElement(l.icon as React.ReactElement, {
                        className: cn("w-4.5 h-4.5 transition-colors duration-300",
                        isLinkActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")
                      })}
                      <span>{l.label}</span>
                    </div>
                    {!isLinkActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-900 bg-slate-950">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-2xl hover:bg-slate-900/60 transition-colors group">
          <button
            onClick={openChangePass}
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-200 truncate leading-tight">{user.name}</p>
              <span className="text-[9px] font-mono text-blue-400 uppercase tracking-wider">{user.role}</span>
            </div>
          </button>
          <button
            onClick={logout}
            title="Keluar"
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans overflow-hidden text-slate-100 relative fixed inset-0">
      {/* Decorative ambient gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex border-r border-slate-900 bg-slate-950">
        <SidebarContent />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" 
              onClick={() => setMobileOpen(false)} 
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-64 max-w-[85vw] flex bg-slate-950 shadow-2xl"
            >
              <SidebarContent />
              <button 
                className="absolute top-5 -right-12 text-white/70 hover:text-white p-2 animate-pulse" 
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ganti Password */}
      <AnimatePresence>
        {changePassOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
              onClick={closeChangePass}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <KeyRound className="w-4.5 h-4.5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Ganti Kata Sandi</h3>
                      <p className="text-[11px] text-slate-400">{user.name}</p>
                    </div>
                  </div>
                  <button onClick={closeChangePass} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleChangePass} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Kata Sandi Lama</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={cpOldPw}
                      onChange={e => setCpOldPw(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl outline-none transition text-sm text-white placeholder-slate-600"
                      placeholder="Kata sandi saat ini"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={cpNewPw}
                      onChange={e => setCpNewPw(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl outline-none transition text-sm text-white placeholder-slate-600"
                      placeholder="Minimal 8 karakter"
                      required minLength={8} maxLength={64}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Konfirmasi Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={cpConfirm}
                      onChange={e => setCpConfirm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl outline-none transition text-sm text-white placeholder-slate-600"
                      placeholder="Ulangi kata sandi baru"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeChangePass} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition">
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={cpLoading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cpLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
        
        {/* Universal Glass Header */}
        <header className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-3.5 flex items-center justify-between z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="lg:hidden p-2 -ml-1 text-slate-400 bg-slate-900/50 hover:bg-slate-900 hover:text-white rounded-xl active:scale-95 transition-all outline-none"
            >
              <Menu className="w-5 h-5"/>
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg uppercase tracking-[0.08em]">
                <Activity className="w-3 h-3" />
                <span>Panel Operasional</span>
              </div>
              <span className="lg:hidden font-display font-black tracking-tighter text-white text-xl leading-none">
                REMA<span className="text-blue-500">-V2</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {installPrompt && (
              <button
                onClick={() => installPrompt.prompt()}
                className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                title="Install Aplikasi"
              >
                <Download className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </header>

        <RunningOrders />

        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar scroll-smooth bg-transparent">
          <div className="max-w-6xl mx-auto p-3.5 sm:p-4 md:p-6 lg:p-8 pb-10 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>
      <PWAUpdateBanner />
    </div>
  );
}
