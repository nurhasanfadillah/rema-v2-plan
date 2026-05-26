import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserSquare2, Package, ShoppingCart, ListOrdered, Wallet, LogOut, Menu, X, Receipt, HelpCircle, ChevronRight, Undo2, Activity, KeyRound, BarChart3, ClipboardList } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

import RunningOrders from './RunningOrders';

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const links = [
    { to: '/', icon: <LayoutDashboard />, label: 'Dashboard', roles: ['admin', 'staff', 'operational', 'mitra'] },
    { to: '/users', icon: <Users />, label: 'Pengguna', roles: ['admin'] },
    { to: '/mitras', icon: <UserSquare2 />, label: 'Mitra', roles: ['admin'] },
    { to: '/products', icon: <Package />, label: 'Katalog Produk', roles: ['admin', 'mitra'] },
    { to: '/orders/drafts', icon: <ShoppingCart />, label: 'Draft Pesanan', roles: ['mitra'] },
    { to: '/orders', icon: <ListOrdered />, label: 'Daftar Pesanan', roles: ['admin', 'staff', 'operational', 'mitra'] },
    { to: '/cancellations', icon: <Undo2 />, label: 'Pembatalan & Retur', roles: ['admin', 'staff', 'mitra'] },
    { to: '/queue', icon: <Receipt />, label: 'Antrian Produksi', roles: ['admin', 'staff', 'operational', 'mitra'] },
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
        <p className="label-xs px-3 mb-2">Main Menu</p>
        
        {visibleLinks.map(l => (
          <NavLink 
            key={l.to} 
            to={l.to}
            className={({ isActive }) => cn(
              "flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-300 font-semibold text-[13px] group relative",
              isActive 
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/15" 
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            )}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  {React.cloneElement(l.icon as React.ReactElement, { 
                    className: cn("w-4.5 h-4.5 transition-colors duration-300", 
                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300") 
                  })}
                  <span>{l.label}</span>
                </div>
                {!isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-slate-900 bg-slate-950 min-h-[80px]">
        {/* Footer biarkan kosong sesuai permintaan */}
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

      {/* Profile Sidebar Drawer */}
      <AnimatePresence>
        {profileOpen && (
          <div className="fixed inset-0 z-50 flex justify-end items-start p-6 pt-20">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px]" 
              onClick={() => setProfileOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative w-80 max-w-[90vw] bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden shadow-blue-500/5"
            >
              <div className="p-5 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Akun Saya</h3>
                  <button 
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" 
                    onClick={() => setProfileOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold text-xl flex items-center justify-center shadow-lg shadow-blue-500/5">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-bold text-white truncate leading-tight mb-1">{user.name}</div>
                    <div className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-400 capitalize font-mono tracking-wider font-bold inline-block">
                      {user.role}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <button
                  onClick={() => navigate('/change-password')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                      <KeyRound className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[13px] font-bold">Ganti Password</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>

                <div className="pt-2 px-3 pb-3">
                  <button
                    onClick={logout}
                    className="btn-danger w-full"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                    Keluar Sesi
                  </button>
                </div>
              </div>
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
                <span>Operational Panel</span>
              </div>
              <span className="lg:hidden font-display font-black tracking-tighter text-white text-xl leading-none">
                REMA<span className="text-blue-500">-V2</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div 
               onClick={() => setProfileOpen(true)}
               className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 font-bold text-lg shadow-inner cursor-pointer hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-95 group overflow-hidden relative"
             >
               <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />
               {user.name.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        <RunningOrders />

        <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar scroll-smooth bg-transparent">
          <div className="max-w-6xl mx-auto p-3.5 sm:p-4 md:p-6 lg:p-8 pb-10 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
