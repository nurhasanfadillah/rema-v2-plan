import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { db } from '../../lib/db';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Order, OrderStatus } from '../../types';
import { Lightbox } from '../../components/Lightbox';
import { 
  ArrowLeft, FileText, CheckCircle, AlertTriangle, Printer, Download, CreditCard, 
  Layers, Package, Calendar, User, Truck, ShieldAlert, Tag, ExternalLink, Image as ImageIcon,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';

// Status labels for quick rendering without "SET AS"
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  waiting_confirmation: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  processing: 'Proses Produksi',
  printing: 'Cetak DTF',
  pressing: 'Press Sablon',
  packing: 'Sedang Packing',
  shipped: 'Terkirim/Selesai',
  returned: 'Pesanan Retur',
  cancelled: 'Dibatalkan',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  
  const [orders, setOrders] = useState<Order[]>(db.getOrders());
  const [lightboxState, setLightboxState] = useState<{ isOpen: boolean, images: string[], index: number }>({ isOpen: false, images: [], index: 0 });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const order = orders.find(o => o.id === id);

  const mitrasList = db.getMitras();
  const activeMitra = mitrasList.find(m => m.userId === user.id);

  if (!order || !user) return <div className="p-8 text-center text-slate-500 font-bold">Pesanan tidak ditemukan...</div>;

  // Enforce access
  if (user.role === 'mitra' && order.mitraId !== activeMitra?.id) return <div className="p-8 text-center text-red-500 font-bold">Akses Ditolak</div>;

  // Rule: order draft only visible to order creator
  if (order.status === 'draft') {
    const creatorUserId = order.creatorId || mitrasList.find(m => m.id === order.mitraId)?.userId;
    if (creatorUserId !== user.id) {
       return <div className="p-8 text-center text-red-500 font-bold font-sans">Akses Ditolak: Pesanan draft hanya dapat diakses oleh pembuat pesanan.</div>;
    }
  }

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    const isCancel = newStatus === 'cancelled';
    const isReturn = newStatus === 'returned';

    // Access control for cancellation & return
    if (isCancel || isReturn) {
      const allowedRoles = ['admin', 'staff', 'mitra'];
      if (!allowedRoles.includes(user.role)) {
        toast.error('Anda tidak memiliki izin untuk melakukan pembatalan atau retur.');
        return;
      }
    }

    const isConfirmed = await confirm({
      title: isCancel ? 'Batalkan Pesanan' : (isReturn ? 'Retur Pesanan' : 'Update Status Pesanan'),
      message: `Apakah Anda yakin ingin ${isCancel ? 'membatalkan' : (isReturn ? 'meretur' : `mengubah status pesanan menjadi ${newStatus}`)} pesanan ini?`,
      confirmText: isCancel ? 'Ya, Batalkan' : (isReturn ? 'Ya, Retur' : 'Ya, Update'),
      type: (isCancel || isReturn) ? 'danger' : 'info'
    });
    
    if (!isConfirmed) return;

    if (newStatus === 'waiting_confirmation' && order.status === 'draft') {
      const myMitraRecord = mitrasList.find(m => m.userId === user.id);
      if (myMitraRecord?.creditLimit) {
        const ledgers = db.getLedgers().filter(l => l.mitraId === myMitraRecord.id);
        const saldo = ledgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);
        if (saldo > myMitraRecord.creditLimit) {
          toast.error(`Tagihan Anda saat ini: ${formatCurrency(saldo)}. Limit tagihan Anda: ${formatCurrency(myMitraRecord.creditLimit)}. Silakan lakukan pelunasan terlebih dahulu.`);
          return;
        }
      }
    }

    // Basic verification and billing trigger if passing to packing
    if (newStatus === 'packing' && !order.isBilled) {
       // Automatic Billing debit
       db.getLedgers(); // load
       const newLedgerEntry = {
          id: crypto.randomUUID(),
          mitraId: order.mitraId,
          source: 'order' as const,
          direction: 'debit' as const,
          nominal: order.totalAmount,
          description: `Pesanan ${order.orderNumber} - ${order.totalQty} pcs`,
          createdAt: Date.now(),
          referenceId: order.id
       };
       db.saveLedgers([newLedgerEntry, ...db.getLedgers()]);
    }
    
    // Cancellation Reversal
    if (newStatus === 'cancelled' && order.isBilled) {
       // Was billed, we must refund
       const newLedgerEntry = {
          id: crypto.randomUUID(),
          mitraId: order.mitraId,
          source: 'cancellation' as const,
          direction: 'credit' as const,
          nominal: order.totalAmount,
          description: `Batal Pesanan ${order.orderNumber}`,
          createdAt: Date.now(),
          referenceId: order.id
       };
       db.saveLedgers([newLedgerEntry, ...db.getLedgers()]);
    }

    // Return Reversal
    if (newStatus === 'returned' && order.isBilled) {
       // Was billed, we must credit/refund for return
       const newLedgerEntry = {
          id: crypto.randomUUID(),
          mitraId: order.mitraId,
          source: 'return' as const,
          direction: 'credit' as const,
          nominal: order.totalAmount,
          description: `Retur Pesanan ${order.orderNumber}`,
          createdAt: Date.now(),
          referenceId: order.id
       };
       db.saveLedgers([newLedgerEntry, ...db.getLedgers()]);
    }

    const updated = { 
        ...order, 
        status: newStatus,
        isBilled: newStatus === 'packing' ? true : order.isBilled 
    };
    const newOrders = orders.map(o => o.id === order.id ? updated : o);
    db.saveOrders(newOrders);
    db.addAuditLog({ userId: user.id, action: `STATUS_CHANGE`, details: `${order.status} -> ${newStatus} on ${order.orderNumber}` });
    setOrders(newOrders);
    toast.success('Status pesanan berhasil diperbarui');
  };

  const handleDeleteOrder = async () => {
    const isConfirmed = await confirm({
      title: 'Hapus Pesanan',
      message: `Apakah Anda yakin ingin menghapus pesanan #${order.orderNumber} ini? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus',
      type: 'danger'
    });
    if (!isConfirmed) return;
    
    const newOrders = db.getOrders().filter(o => o.id !== order.id);
    db.saveOrders(newOrders);
    db.addAuditLog({
      userId: user.id,
      action: 'DELETE_ORDER',
      details: `Menghapus pesanan #${order.orderNumber}`
    });
    toast.success('Pesanan berhasil dihapus');
    navigate(order.status === 'draft' ? '/orders/drafts' : '/orders');
  };

  const getNormalNextStatus = (currOrder: Order): OrderStatus | null => {
    switch (currOrder.status) {
      case 'draft': 
        return 'waiting_confirmation';
      case 'waiting_confirmation': 
        return 'confirmed';
      case 'confirmed': 
        return 'processing';
      case 'processing': 
        return currOrder.hasCustomLogo ? 'printing' : 'packing';
      case 'printing': 
        return 'pressing';
      case 'pressing': 
        return 'packing';
      case 'packing': 
        return 'shipped';
      default: 
        return null;
    }
  };

  const normalNext = getNormalNextStatus(order);

  const canAdvanceNormally = () => {
    if (!order) return false;
    if (order.status === 'draft') return user.role === 'mitra';
    if (order.status === 'waiting_confirmation') return user.role === 'admin' || user.role === 'staff';
    if (['confirmed', 'processing', 'printing', 'pressing', 'packing'].includes(order.status)) {
      return user.role === 'admin' || user.role === 'staff' || user.role === 'operational';
    }
    return false;
  };

  const getCorrectionStatuses = () => {
    if (user.role !== 'admin' && user.role !== 'staff') return [];
    const list = ['draft', 'waiting_confirmation', 'confirmed', 'processing'];
    if (order.hasCustomLogo) {
      list.push('printing', 'pressing');
    }
    list.push('packing', 'shipped');
    return list.filter(s => s !== order.status);
  };

  const getStatusBadge = (status: string) => {
    const specs: Record<string, { bg: string, text: string, border: string, label: string }> = {
      draft: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', border: 'border-slate-200/65', label: 'Draft' },
      waiting_confirmation: { bg: 'bg-amber-50 border-amber-200/60', text: 'text-amber-700', border: 'border-amber-200', label: 'Menunggu Konfirmasi' },
      confirmed: { bg: 'bg-blue-50 border-blue-200/50', text: 'text-blue-700', border: 'border-blue-200', label: 'Dikonfirmasi' },
      processing: { bg: 'bg-purple-50 border-purple-200/50', text: 'text-purple-700', border: 'border-purple-200', label: 'Proses Produksi' },
      printing: { bg: 'bg-indigo-50 border-indigo-200/50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Cetak DTF' },
      pressing: { bg: 'bg-pink-50 border-pink-200/50', text: 'text-pink-700', border: 'border-pink-200', label: 'Press Sablon' },
      packing: { bg: 'bg-orange-50 border-orange-200/50', text: 'text-orange-700', border: 'border-orange-200', label: 'Sedang Packing' },
      shipped: { bg: 'bg-emerald-50 border-emerald-200/50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Terkirim/Selesai' },
      returned: { bg: 'bg-red-50 border-red-200/50', text: 'text-red-700', border: 'border-red-200', label: 'Pesanan Retur' },
      cancelled: { bg: 'bg-slate-900 border-slate-800', text: 'text-slate-100', border: 'border-slate-800', label: 'Dibatalkan' },
    };

    const s = specs[status] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: status };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${s.bg} ${s.text} ${s.border}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {s.label}
      </span>
    );
  };

  const prePackingStatuses = ['draft', 'waiting_confirmation', 'confirmed', 'processing', 'printing', 'pressing'];
  const isEditEligible =
    (user.role === 'mitra' && order.mitraId === activeMitra?.id && ['draft', 'waiting_confirmation'].includes(order.status)) ||
    ((user.role === 'admin' || user.role === 'staff') && prePackingStatuses.includes(order.status));

  const isDeleteEligible = 
    (user.role === 'mitra' && order.mitraId === activeMitra?.id && ['draft', 'waiting_confirmation'].includes(order.status)) ||
    ((user.role === 'admin' || user.role === 'staff') && ['draft', 'waiting_confirmation'].includes(order.status));

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(order.status === 'draft' ? '/orders/drafts' : '/orders')}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-extrabold text-slate-400 tracking-wider">
               <span>ID: {order.id.slice(0, 8).toUpperCase()}</span>
               <span>•</span>
               <span>{formatDate(order.createdAt)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight mt-0.5">
              Ref: <span className="font-mono text-blue-600 font-black">{order.orderNumber}</span>
            </h1>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          {isEditEligible && (
            <button 
              onClick={() => navigate(`/orders/${order.id}/edit`)}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 transition px-3.5 py-2 border border-blue-500/10 rounded-xl cursor-pointer"
            >
               Edit Pesanan
            </button>
          )}
          {isDeleteEligible && (
            <button 
              onClick={handleDeleteOrder} 
              className="text-xs font-extrabold text-red-500 hover:text-red-750 hover:bg-red-50/50 transition px-3.5 py-2 border border-red-500/10 rounded-xl cursor-pointer"
            >
               Hapus Pesanan
            </button>
          )}
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Desktop Update Status Controls (Admin/Staff/Operational) */}
      <div className="hidden md:block space-y-4">
        {/* Normal progressive flow button */}
        {canAdvanceNormally() && normalNext && (
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Pembaruan Tahapan Progresif</span>
              <p className="text-white text-[13px] font-semibold">Progres pesanan ke langkah berikutnya:</p>
            </div>
            <button
              type="button"
              onClick={() => handleUpdateStatus(normalNext)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/15 active:scale-95 uppercase tracking-wider"
            >
              Lanjutkan ke {STATUS_LABELS[normalNext]}
            </button>
          </div>
        )}

        {/* Dedicated Correction Flow for Admin & Staff only */}
        {(user.role === 'admin' || user.role === 'staff') && getCorrectionStatuses().length > 0 && (
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase">Alur Koreksi/Lompat Status (Khusus Admin/Staff)</span>
              <p className="text-white text-[13px] font-semibold">Pindah proses secara manual untuk koreksi operasional:</p>
            </div>
            <div className="relative inline-block text-left self-start md:self-center">
              <button 
                type="button" 
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-600/15 active:scale-95 whitespace-nowrap uppercase tracking-wider"
              >
                <span>Pilih Status Koreksi</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>

              {isStatusDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-45 bg-transparent" 
                    onClick={() => setIsStatusDropdownOpen(false)} 
                  />
                  <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-60 bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-1.5 pb-2 border-b border-slate-700/60 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Koreksi Ke:
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {getCorrectionStatuses().map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setIsStatusDropdownOpen(false);
                            handleUpdateStatus(s as OrderStatus);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-slate-700/50 transition-all flex items-center justify-between cursor-pointer animate-none"
                        >
                          <span>{STATUS_LABELS[s] || s}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Draft Warning */}
      {order.status === 'draft' && user.role === 'mitra' && (
         <div className="bg-gradient-to-tr from-blue-600 to-blue-500 p-5 rounded-3xl text-white shadow-lg shadow-blue-500/15 flex flex-col md:flex-row justify-between items-center gap-5">
           <div className="space-y-1">
             <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 border border-white/20 text-white rounded-md text-[10px] uppercase font-bold tracking-wider">
               <ShieldAlert className="w-3.5 h-3.5" /> Menunggu Pengajuan
             </div>
             <p className="font-extrabold tracking-tight text-base sm:text-lg">Pesanan Anda Masih Berbentuk Draft</p>
             <p className="text-[13px] text-blue-105 font-medium">Ajukan pesanan Anda saat ini agar admin dapat memverifikasi pembayaran dan memulai rute produksi.</p>
           </div>
           <button 
             onClick={() => handleUpdateStatus('waiting_confirmation')} 
             className="px-6 py-3 bg-white text-blue-600 font-extrabold text-xs rounded-2xl hover:bg-blue-50 active:scale-95 transition-all shadow-md w-full md:w-auto cursor-pointer"
           >
             Ajukan Pesanan Sekarang
           </button>
         </div>
      )}

      {/* Responsive details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Shipping Information Card */}
         <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
              <Truck className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">Data Alamat & Distribusi</h2>
            </div>
            <div className="space-y-3.5 text-xs sm:text-[13px] text-slate-600 font-semibold">
               <div className="flex justify-between items-center">
                 <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] w-32 shrink-0">Metode:</span> 
                 <span className="capitalize px-2.5 py-0.5 bg-slate-100 border rounded-lg text-slate-800 text-xs font-black">{order.type}</span>
               </div>
               {order.type === 'online' ? (
                  <div className="flex justify-between items-center pt-2">
                     <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] w-32 shrink-0">File Label/Resi:</span>
                     <a 
                       href={order.resiUrl} 
                       download={`resi-${order.orderNumber}`} 
                       className="px-3.5 py-2 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl text-blue-600 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                     >
                        <Download className="w-3.5 h-3.5" /> Unduh PDF Label
                     </a>
                  </div>
               ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] w-32 shrink-0">Nama Penerima:</span> 
                      <span className="text-slate-950 font-extrabold text-right">{order.recipientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] w-32 shrink-0">No Telepon:</span> 
                      <span className="text-slate-950 font-mono tracking-wider font-extrabold">{order.recipientPhone}</span>
                    </div>
                    <div className="flex justify-between items-start pt-2 border-t border-slate-50/80">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] w-32 shrink-0 mt-0.5">Alamat Lengkap:</span> 
                      <span className="text-slate-700 text-right leading-relaxed font-bold break-words flex-1 pl-4">{order.recipientAddress}</span>
                    </div>
                  </>
               )}
            </div>
         </div>
         
         {/* Invoice Details Card */}
         {(user.role === 'admin' || user.role === 'mitra') && (
           <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 mb-4">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">Kalkulasi Billing Keuangan</h2>
                </div>
                <div className="space-y-3.5 text-xs sm:text-[13px] text-slate-600 font-semibold">
                   <div className="flex justify-between items-center">
                     <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Aliran Buku Ledger:</span>
                     {order.isBilled ? (
                       <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg">TERTULIS DI LEDGER</span>
                     ) : (
                       <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">MENUNGGU PACKING</span>
                     )}
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Jumlah Items:</span>
                     <span className="text-slate-800 font-extrabold">{order.totalQty} Pcs</span>
                   </div>
                </div>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                 <span className="text-slate-500 font-black text-xs uppercase tracking-wider">Total Tagihan</span>
                 <span className="text-lg sm:text-xl font-black text-slate-950">{formatCurrency(order.totalAmount)}</span>
              </div>
           </div>
         )}
      </div>

      {/* Order Item List Detail */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-5">
         <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
           <Package className="w-5 h-5 text-indigo-600" />
           <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">Komposisi Item & Atribut Desain</h2>
         </div>
         <div className="space-y-6">
           {order.items.map((item, i) => (
              <div key={item.id} className="border-b last:border-0 border-slate-100 pb-5 last:pb-0">
                 <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {i+1}. {item.productName}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-wider">
                        {item.isCustomLogo ? (
                          <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full">Custom Logo</span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-full">Katalog Polos</span>
                        )}
                        <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-full">{item.qty} pcs</span>
                      </div>
                    </div>
                    {(user.role === 'admin' || user.role === 'mitra') && (
                      <p className="font-black text-slate-900 text-base">{formatCurrency(item.priceSnapshot * item.qty)}</p>
                    )}
                 </div>
                 
                 {(user.role === 'admin' || user.role === 'mitra') && (
                   <p className="text-xs text-slate-400 font-extrabold tracking-wider uppercase mb-3 px-1">{formatCurrency(item.priceSnapshot)} / pcs</p>
                 )}
                 
                 {item.isCustomLogo && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs sm:text-[13px] space-y-4 font-semibold text-slate-700">
                       
                       <div className="flex flex-col gap-2">
                          <span className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Preview Visual (Klik untuk perbesar)</span>
                          <div className="flex flex-wrap gap-2.5 pt-1">
                             {(Array.isArray(item.previewUrls) && item.previewUrls.length > 0 ? item.previewUrls : (item.previewUrl ? [item.previewUrl] : [])).map((url, idx, arr) => (
                                <div 
                                  key={idx} 
                                  className="relative group cursor-pointer border rounded-2xl overflow-hidden bg-white w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 shadow-sm hover:border-blue-300 transition-all duration-300" 
                                  onClick={() => setLightboxState({ isOpen: true, images: arr, index: idx })}
                                >
                                   <img src={url} alt="Preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                   <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-950/30 transition-all flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 text-[10px] font-extrabold uppercase tracking-widest bg-slate-950/60 px-2 py-1 rounded-lg backdrop-blur-sm">Buka</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>

                       <div className="flex flex-col gap-2 pt-2">
                          <span className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5 text-slate-400" /> Berkas Master Desain</span>
                          <div className="flex flex-wrap gap-2.5 pt-1">
                             {(Array.isArray(item.designUrls) && item.designUrls.length > 0 ? item.designUrls : (item.designUrl ? [item.designUrl] : [])).map((url, idx) => (
                                <a 
                                  href={url} 
                                  download={`design-${order.orderNumber}-${i+1}-${idx+1}`} 
                                  key={idx} 
                                  className="px-3.5 py-2 bg-white hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex items-center gap-2 text-blue-600 font-extrabold text-xs shadow-sm cursor-pointer"
                                >
                                   <Download className="w-3.5 h-3.5" /> Unduh Berkas {idx + 1}
                                </a>
                             ))}
                          </div>
                       </div>
                       
                       <div className="pt-2">
                          <span className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Catatan Tambahan Desain:</span> 
                          <p className="bg-white border rounded-xl p-3 text-slate-600 font-medium leading-relaxed mt-1 text-xs">{item.designNotes || 'Tidak ada catatan khusus.'}</p>
                       </div>
                    </div>
                 )}
              </div>
           ))}
         </div>
      </div>
      
      {/* Mobile Update Status Controls (Admin/Staff/Operational) at the very bottom */}
      <div className="block md:hidden space-y-3 pt-4 pb-2">
        {/* Normal progressive flow button */}
        {canAdvanceNormally() && normalNext && (
          <button
            type="button"
            onClick={() => handleUpdateStatus(normalNext)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer shadow-md"
          >
            Lanjutkan ke {STATUS_LABELS[normalNext]}
          </button>
        )}

        {/* Dedicated Correction Flow for Admin & Staff only */}
        {(user.role === 'admin' || user.role === 'staff') && getCorrectionStatuses().length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer shadow-md"
            >
              Lompat / Koreksi Status
            </button>

            {isStatusDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-45 bg-black/20 backdrop-blur-xs" 
                  onClick={() => setIsStatusDropdownOpen(false)} 
                />
                <div className="fixed bottom-0 left-0 right-0 max-h-[50vh] bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-2xl z-50 py-4 px-4 overflow-y-auto animate-in slide-in-from-bottom duration-200 text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-2 font-sans">
                    <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">Pilih Status Koreksi</span>
                    <button onClick={() => setIsStatusDropdownOpen(false)} className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-wider">Batal</button>
                  </div>
                  <div className="space-y-1">
                    {getCorrectionStatuses().map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setIsStatusDropdownOpen(false);
                          handleUpdateStatus(s as OrderStatus);
                        }}
                        className="w-full text-center py-3.5 text-xs text-amber-400 hover:text-amber-300 font-black transition-all hover:bg-slate-800 rounded-xl block uppercase tracking-widest border border-transparent hover:border-amber-500/20"
                      >
                        {STATUS_LABELS[s] || s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Lightbox Trigger frame */}
      {lightboxState.isOpen && (
         <Lightbox 
           images={lightboxState.images} 
           initialIndex={lightboxState.index} 
           onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))} 
         />
      )}
    </div>
  );
}
