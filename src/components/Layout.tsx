import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserSquare2, Package, ShoppingCart, ListOrdered, Wallet, LogOut, Menu, X, Receipt } from 'lucide-react';
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
    { to: '/queue', icon: <Receipt />, label: 'Antrian Produksi', roles: ['admin', 'staff', 'operational', 'mitra'] },
    { to: '/finance', icon: <Wallet />, label: 'Keuangan', roles: ['admin', 'mitra'] },
  ];

  const visibleLinks = links.filter(l => l.roles.includes(user.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 w-64 flex-shrink-0">
      <div className="pt-8 pb-5 px-5 relative">
        <h2 className="font-sans text-xl font-bold tracking-tight text-white mb-0.5">
          REMA<span className="text-blue-500">.</span>
        </h2>
        <p className="text-[10px] font-mono text-slate-500">v2.1</p>
      </div>
      <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {visibleLinks.map(l => (
          <NavLink 
            key={l.to} 
            to={l.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-[13px]",
              isActive ? "bg-blue-600/10 text-blue-500" : "hover:bg-slate-900 hover:text-slate-100"
            )}
          >
            {({ isActive }) => (
              <>
                {React.cloneElement(l.icon as React.ReactElement, { className: cn("w-4 h-4 transition-colors", isActive ? "text-blue-500 text-opacity-100" : "text-slate-400") })}
                {l.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="p-4 border-t border-slate-800/50">
        <div className="mb-3 px-2">
          <div className="text-[13px] font-semibold text-slate-100">{user.name}</div>
          <div className="text-[11px] text-slate-500 capitalize font-mono mt-0.5">{user.role}</div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-900 text-red-400 hover:text-red-300 transition-colors font-medium text-[13px]"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex border-r border-slate-200 bg-white">
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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
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
                className="absolute top-5 -right-12 text-white/70 hover:text-white p-2" 
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
        
        {/* Mobile Header (Glassmorphism) */}
        <header className="lg:hidden sticky top-0 bg-white/70 backdrop-blur-md border-b border-slate-200/50 px-4 py-3 flex items-center justify-between z-40 supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center gap-3">
             <button onClick={() => setMobileOpen(true)} className="p-1.5 -ml-1.5 text-slate-700 bg-slate-100/50 rounded-lg active:scale-95 transition-transform">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-sans text-base tracking-tight font-bold text-slate-900">
              REMA<span className="text-blue-600">.</span>
            </h1>
          </div>
          {/* Avatar or Placeholder */}
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 text-blue-700 font-medium text-[13px]">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 pb-20">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
