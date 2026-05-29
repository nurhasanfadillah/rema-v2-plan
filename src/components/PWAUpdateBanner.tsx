import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-blue-500/20 px-4 py-3 flex items-center justify-between gap-4 shadow-2xl">
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-white leading-tight">Versi baru tersedia</p>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Perbarui untuk mendapatkan fitur terbaru.</p>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-xl transition-all active:scale-95 cursor-pointer uppercase tracking-wide shadow-lg shadow-blue-600/20"
      >
        Perbarui Sekarang
      </button>
    </div>
  );
}
