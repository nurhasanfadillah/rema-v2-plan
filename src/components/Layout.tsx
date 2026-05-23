import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserSquare2, Package, ShoppingCart, ListOrdered, Wallet, LogOut, Menu, X, Receipt, HelpCircle, ChevronRight, Undo2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
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
  ];

  const visibleLinks = links.filter(l => l.roles.includes(user.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 w-64 flex-shrink-0 border-r border-slate-900 relative">
      <div className="pt-8 pb-6 px-6 relative flex flex-col items-start">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/10 flex items-center justify-center font-bold text-white text-base">
            R
          </div>
          <div>
            <h2 className="font-sans text-lg font-extrabold tracking-tight text-white flex items-center">
              REMA<span className="text-blue-500">.</span>
            </h2>
            <p className="text-[9px] font-mono text-slate-500 tracking-wider font-semibold uppercase">Workspace v2.1</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
        <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Main Menu</p>
        
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

      <div className="p-4 border-t border-slate-900 bg-slate-950">
        <div className="mb-4 px-3 py-3 rounded-2xl bg-slate-900/40 border border-slate-900/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-slate-100 truncate leading-tight">{user.name}</div>
            <div className="text-[10px] text-slate-500 capitalize font-mono mt-0.5 tracking-wider">{user.role}</div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all duration-200 font-semibold text-[13px] border border-red-500/10 active:scale-[0.98] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Keluar Sesi
        </button>
      </div>
    </div>
  );

  // Dynamic premium bottom tabs for mobile navigation
  const getBottomTabs = () => {
    switch (user.role) {
      case 'mitra':
        return [
          { to: '/', icon: <LayoutDashboard className="w-5 h-5 transition-all" />, label: 'Home' },
          { to: '/products', icon: <Package className="w-5 h-5 transition-all" />, label: 'Katalog' },
          { to: '/orders/drafts', icon: <ShoppingCart className="w-5 h-5 transition-all" />, label: 'Draft' },
          { to: '/orders', icon: <ListOrdered className="w-5 h-5 transition-all" />, label: 'Pesanan' },
        ];
      case 'admin':
        return [
          { to: '/', icon: <LayoutDashboard className="w-5 h-5 transition-all" />, label: 'Home' },
          { to: '/orders', icon: <ListOrdered className="w-5 h-5 transition-all" />, label: 'Pesanan' },
          { to: '/queue', icon: <Receipt className="w-5 h-5 transition-all" />, label: 'Antrian' },
          { to: '/finance', icon: <Wallet className="w-5 h-5 transition-all" />, label: 'Keuangan' },
        ];
      case 'staff':
        return [
          { to: '/', icon: <LayoutDashboard className="w-5 h-5 transition-all" />, label: 'Home' },
          { to: '/orders', icon: <ListOrdered className="w-5 h-5 transition-all" />, label: 'Pesanan' },
          { to: '/queue', icon: <Receipt className="w-5 h-5 transition-all" />, label: 'Antrian' },
          { to: '/cancellations', icon: <Undo2 className="w-5 h-5 transition-all" />, label: 'Retur' },
        ];
      case 'operational':
        return [
          { to: '/', icon: <LayoutDashboard className="w-5 h-5 transition-all" />, label: 'Home' },
          { to: '/orders', icon: <ListOrdered className="w-5 h-5 transition-all" />, label: 'Pesanan' },
          { to: '/queue', icon: <Receipt className="w-5 h-5 transition-all" />, label: 'Antrian' },
        ];
      default:
        return [
          { to: '/', icon: <LayoutDashboard className="w-5 h-5 transition-all" />, label: 'Home' },
        ];
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-slate-950 font-sans overflow-hidden text-slate-100 relative">
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

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
        
        {/* Universal Glass Header */}
        <header className="sticky top-0 bg-slate-950/60 backdrop-blur-xl border-b border-slate-900/60 px-5 py-4 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="lg:hidden p-2 -ml-1 text-slate-300 bg-slate-900/50 hover:bg-slate-900 hover:text-white rounded-xl active:scale-95 transition-all"
            >
              <Menu className="w-5 h-5"/>
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline-flex px-2 py-0.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-md uppercase tracking-wider">
                Produksi & Finance
              </span>
              <span className="lg:hidden font-extrabold tracking-tight text-white text-base">
                REMA<span className="text-blue-500">.</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-slate-200">{user.name}</span>
                <span className="text-[10px] text-slate-500 capitalize font-mono mt-0.5">{user.role}</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center border border-blue-500/20 text-blue-400 font-bold text-xs shadow-inner cursor-pointer transition-colors">
               {user.name.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-transparent">
          <div className="max-w-6xl mx-auto p-3.5 sm:p-4 md:p-6 lg:p-8 pb-32 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sticky Floating Bottom Navigation Bar */}
      <div 
        className="lg:hidden fixed bottom-3 left-4 right-4 z-40 bg-slate-950/80 backdrop-blur-xl border border-slate-900 rounded-2xl flex items-center justify-around py-1.5 px-2 shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
        style={{ paddingBottom: 'calc(4px + env(safe-area-inset-bottom, 0px))' }}
      >
        {getBottomTabs().map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-300 text-center select-none min-h-[44px]",
              isActive 
                ? "text-blue-400 font-black scale-102" 
                : "text-slate-400 hover:text-slate-100 font-semibold"
            )}
          >
            {({ isActive }) => (
              <>
                <div className={cn("transition-all duration-300", isActive ? "scale-110 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "text-slate-400")}>
                  {tab.icon}
                </div>
                <span className="text-[9px] mt-1 tracking-tight font-medium leading-none">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* The More Button to open the sidebar */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-400 hover:text-slate-100 transition-all duration-300 text-center select-none min-h-[44px]"
        >
          <Menu className="w-5 h-5 text-slate-400 transition-all active:scale-90" />
          <span className="text-[9px] mt-1 tracking-tight font-medium leading-none">Lainnya</span>
        </button>
      </div>
    </div>
  );
}
