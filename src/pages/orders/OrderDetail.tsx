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
  ChevronDown, Printer as PrinterIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { OrderSPKPDF } from '../../components/orders/OrderSPKPDF';
import { ShippingLabelPDF } from '../../components/orders/ShippingLabelPDF';

// Status labels for quick rendering without "SET AS"
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  waiting_confirmation: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  processing: 'Proses Produksi',
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
  const usersList = db.getUsers();
  const activeMitra = mitrasList.find(m => m.userId === user.id);
  const orderMitra = mitrasList.find(m => m.id === order.mitraId);
  const mitraUser = usersList.find(u => u.id === orderMitra?.userId);
  const mitraPhone = mitraUser?.phone;

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
    // 1. Restriction: Cancelled and Returned orders cannot be changed
    if (order.status === 'cancelled' || order.status === 'returned') {
      toast.error('Pesanan yang sudah dibatalkan atau diretur tidak dapat diubah statusnya.');
      return;
    }

    const isCancel = newStatus === 'cancelled';
    const isReturn = newStatus === 'returned';

    // DTF Status Validation for Pressing
    if (newStatus === 'pressing') {
      const itemsPendingDTF = order.items.filter(item => item.isCustomLogo && (item.dtfStatus || 'belum_cetak') === 'belum_cetak');
      if (itemsPendingDTF.length > 0) {
        await confirm({
          title: 'Validasi Produksi: DTF Belum Siap',
          message: `Tahapan "Press Sablon" tidak dapat dimulai karena masih terdapat ${itemsPendingDTF.length} item custom yang berstatus "Belum Cetak".\n\nSilakan selesaikan proses cetak DTF untuk item tersebut dan ubah statusnya menjadi "Sudah Cetak" pada detail item di bawah sebelum memajukan tahapan produksi.`,
          confirmText: 'Pahami & Periksa Item',
          showCancel: false,
          type: 'warning'
        });
        return;
      }
    }

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
    
    // If cancelled or returned, and was already billed, we remove the original ledger entry to keep it clean (Rollback)
    if ((newStatus === 'cancelled' || newStatus === 'returned') && order.isBilled) {
       const allLedgers = db.getLedgers();
       const filteredLedgers = allLedgers.filter(l => !(l.referenceId === order.id && l.source === 'order'));
       db.saveLedgers(filteredLedgers);
    }

    const updated = { 
        ...order, 
        status: newStatus,
        isBilled: newStatus === 'packing' ? true : ((newStatus === 'cancelled' || newStatus === 'returned') ? false : order.isBilled)
    };
    const newOrders = orders.map(o => o.id === order.id ? updated : o);
    db.saveOrders(newOrders);
    db.addAuditLog({ userId: user.id, action: `STATUS_CHANGE`, details: `${order.status} -> ${newStatus} on ${order.orderNumber}` });
    setOrders(newOrders);
    toast.success('Status pesanan berhasil diperbarui');
  };

  const handleUpdateDTFStatus = (itemId: string, newDTFStatus: 'belum_cetak' | 'sudah_cetak') => {
    if (!['confirmed', 'processing'].includes(order.status)) {
      toast.error('Status Cetak DTF hanya dapat diubah saat status pesanan Dikonfirmasi atau Diproses Produksi.');
      return;
    }
    
    const allowedRoles = ['admin', 'staff', 'operational'];
    if (!allowedRoles.includes(user.role)) {
      toast.error('Hanya tim internal yang dapat memperbarui status cetak DTF.');
      return;
    }

    const updatedItems = order.items.map(item => 
      item.id === itemId ? { ...item, dtfStatus: newDTFStatus } : item
    );
    
    const updatedOrder = { ...order, items: updatedItems };
    const newOrders = orders.map(o => o.id === order.id ? updatedOrder : o);
    
    db.saveOrders(newOrders);
    db.addAuditLog({ 
      userId: user.id, 
      action: 'DTF_STATUS_CHANGE', 
      details: `Status DTF item diubah ke ${newDTFStatus} pada pesanan ${order.orderNumber}` 
    });
    setOrders(newOrders);
    toast.success(`Status Cetak DTF berhasil diubah`);
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
        return currOrder.hasCustomLogo ? 'pressing' : 'packing';
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
    if (['confirmed', 'processing', 'pressing', 'packing'].includes(order.status)) {
      return user.role === 'admin' || user.role === 'staff' || user.role === 'operational';
    }
    return false;
  };

  const getCorrectionStatuses = () => {
    if (user.role !== 'admin' && user.role !== 'staff') return [];
    
    // Correction only allowed if current status is between Confirmed and Press Sablon
    const allowedCurrent = ['confirmed', 'processing', 'pressing'];
    if (!allowedCurrent.includes(order.status)) return [];

    // Correction list also restricted to this range
    const list = ['confirmed', 'processing', 'pressing'];
    return list.filter(s => s !== order.status);
  };

  const getStatusBadge = (status: string) => {
    const specs: Record<string, { bg: string, text: string, border: string, label: string }> = {
      draft: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', border: 'border-slate-200/65', label: 'Draft' },
      waiting_confirmation: { bg: 'bg-amber-50 border-amber-200/60', text: 'text-amber-700', border: 'border-amber-200', label: 'Menunggu Konfirmasi' },
      confirmed: { bg: 'bg-blue-50 border-blue-200/50', text: 'text-blue-700', border: 'border-blue-200', label: 'Dikonfirmasi' },
      processing: { bg: 'bg-purple-50 border-purple-200/50', text: 'text-purple-700', border: 'border-purple-200', label: 'Proses Produksi' },
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

  const prePackingStatuses = ['draft', 'waiting_confirmation', 'confirmed', 'processing', 'pressing'];
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
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-500 tracking-[0.1em] uppercase opacity-70">
               <span className="tabular-nums">ID: {order.id.slice(0, 8).toUpperCase()}</span>
               <span className="opacity-30">•</span>
               <span className="tabular-nums">{formatDate(order.createdAt)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 tracking-tighter">
              <span className="text-slate-500 font-medium">Ref:</span> <span className="font-mono text-blue-500 font-bold uppercase">{order.orderNumber}</span>
            </h1>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          {getStatusBadge(order.status)}
        </div>
      </div>



      {/* Responsive details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Shipping Information Card */}
         <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 shadow-xl space-y-5 backdrop-blur-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
              <Truck className="w-4 h-4 text-slate-500" />
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Alur Distribusi & Logistik</h2>
            </div>
            <div className="space-y-4 text-[13px] text-slate-300 font-medium">
               <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                 <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Metode Pengiriman</span> 
                 <span className="capitalize px-3 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] font-bold tracking-wider">{order.type}</span>
               </div>
               {order.type === 'online' ? (
                  <div className="flex justify-between items-center pt-2">
                     <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Dokumen Resi:</span>
                     <a 
                       href={order.resiUrl} 
                       download={`resi-${order.orderNumber}`} 
                       className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-blue-400 font-bold text-[11px] flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 uppercase tracking-wide italic"
                     >
                        <Download className="w-3.5 h-3.5 opacity-50" /> Download Label Resi
                     </a>
                  </div>
               ) : (
                  <>
                    <div className="flex justify-between px-1">
                      <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Penerima Atas Nama:</span> 
                      <span className="text-slate-100 font-bold tracking-tight">{order.recipientName}</span>
                    </div>
                    <div className="flex justify-between px-1 pt-1">
                      <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Identitas Telepon:</span> 
                      <span className="text-slate-100 font-mono tracking-[0.05em] font-bold tabular-nums text-sm italic">{order.recipientPhone}</span>
                    </div>
                    <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                      <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] px-1">Alamat Pengiriman Lengkap:</span> 
                      <p className="text-slate-400 px-3 py-3 bg-slate-950/50 rounded-xl border border-slate-800/30 leading-relaxed text-[12px] font-medium font-sans italic opacity-90">{order.recipientAddress}</p>
                    </div>
                  </>
               )}
            </div>
         </div>
         
         {/* Invoice Details Card */}
         {(user.role === 'admin' || user.role === 'mitra') && (
           <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col justify-between gap-6 backdrop-blur-sm">
              <div>
                <div className="flex items-center gap-2.5 pb-3 border-b border-white/5 mb-5">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Rincian Finansial & Billing</h2>
                </div>
                <div className="space-y-4 text-[13px] text-slate-300 font-medium">
                   <div className="flex justify-between items-center px-1">
                     <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Integrasi Ledger:</span>
                     {order.isBilled ? (
                       <span className="px-2.5 py-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg tracking-wider italic uppercase">Ledger Tercatat</span>
                     ) : (
                       <span className="px-2.5 py-1 text-[9px] font-bold text-slate-500 bg-slate-800 border border-slate-700/50 rounded-lg tracking-wider italic uppercase">Pending Billed</span>
                     )}
                   </div>
                   <div className="flex justify-between px-1">
                     <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Kuantitas Pesanan:</span>
                     <span className="text-slate-100 font-bold tabular-nums italic">{order.totalQty} <span className="text-[10px] opacity-40 font-normal ml-0.5">Pcs</span></span>
                   </div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-white/5 flex items-center justify-between shadow-inner group">
                 <span className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] italic">Tagihan Total</span>
                 <span className="text-2xl font-bold text-white tabular-nums tracking-tighter group-hover:text-blue-400 transition-colors">{formatCurrency(order.totalAmount)}</span>
              </div>
           </div>
         )}
      </div>

      {/* Order Item List Detail */}
      <div className="bg-slate-900/10 p-4 sm:p-6 lg:p-8 rounded-[32px] border border-white/5 shadow-2xl backdrop-blur-sm space-y-6">
         <div className="flex items-center gap-3 pb-4 border-b border-white/5">
           <Package className="w-4.5 h-4.5 text-slate-500" />
           <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Daftar Komposisi Item & Visual</h2>
         </div>
         <div className="space-y-8">
           {order.items.map((item, i) => (
              <div key={item.id} className="border-b last:border-0 border-white/5 pb-8 last:pb-0">
                 <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-white text-base sm:text-lg tracking-tight leading-none tabular-nums">
                        <span className="text-slate-600 font-medium mr-2">{i+1}.</span> {item.productName}
                      </h3>
                      <div className="flex flex-wrap gap-2.5">
                        {item.isCustomLogo ? (
                          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[9px] font-bold uppercase tracking-wider italic">Custom Logo Design</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 rounded-lg text-[9px] font-bold uppercase tracking-wider italic">Katalog Stock Polos</span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-wider tabular-nums">{item.qty} items</span>
                      </div>
                    </div>
                    {(user.role === 'admin' || user.role === 'mitra') && (
                      <p className="font-bold text-white text-lg tabular-nums tracking-tighter">{formatCurrency(item.priceSnapshot * item.qty)}</p>
                    )}
                 </div>
                 
                 {(user.role === 'admin' || user.role === 'mitra') && (
                   <p className="text-[10px] text-slate-600 font-bold tracking-widest uppercase mb-4 px-1 italic tabular-nums">Basis Harga: {formatCurrency(item.priceSnapshot)} / Unit</p>
                 )}
                 
                 {item.isCustomLogo && (
                    <div className="mt-5 p-5 bg-slate-950/40 border border-white/5 rounded-3xl space-y-6 text-[13px]">
                       
                       <div className="flex flex-col gap-3">
                          <span className="font-bold text-slate-600 text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 italic ml-1"><ImageIcon className="w-3.5 h-3.5 opacity-60" /> Galeri Preview Visual (Klik perbesar)</span>
                          <div className="flex flex-wrap gap-3.5 pt-1">
                             {(Array.isArray(item.previewUrls) && item.previewUrls.length > 0 ? item.previewUrls : (item.previewUrl ? [item.previewUrl] : [])).map((url, idx, arr) => (
                                <div 
                                  key={idx} 
                                  className="relative group cursor-pointer border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 shadow-2xl hover:border-blue-500/50 transition-all duration-300" 
                                  onClick={() => setLightboxState({ isOpen: true, images: arr, index: idx })}
                                >
                                   <img src={url} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                                   <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-950/40 transition-all flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase tracking-widest bg-blue-600 px-2 py-1 rounded-lg shadow-xl shadow-blue-600/20">Buka</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>

                       <div className="flex flex-col gap-3 pt-2">
                          <span className="font-bold text-slate-600 text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 italic ml-1"><ExternalLink className="w-3.5 h-3.5 opacity-60" /> Arsip Sumber Design Master</span>
                          <div className="flex flex-wrap gap-3 pt-1">
                             {(Array.isArray(item.designUrls) && item.designUrls.length > 0 ? item.designUrls : (item.designUrl ? [item.designUrl] : [])).map((url, idx) => (
                                <a 
                                  href={url} 
                                  download={`design-${order.orderNumber}-${i+1}-${idx+1}`} 
                                  key={idx} 
                                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2.5 text-blue-400 font-bold text-[11px] shadow-lg cursor-pointer uppercase tracking-wide group"
                                >
                                   <Download className="w-3.5 h-3.5 opacity-50 transition-transform group-hover:-translate-y-0.5" /> Unduh Master {idx + 1}
                                </a>
                             ))}
                          </div>
                       </div>
                       
                       <div className="pt-2">
                          <span className="font-bold text-slate-600 text-[9px] uppercase tracking-[0.2em] block mb-2 italic ml-1">Catatan Operasional Desain:</span> 
                          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-400 font-medium leading-relaxed text-[12px] italic opacity-80 font-sans shadow-inner">
                            {item.designNotes || 'Tidak ada catatan khusus yang dilampirkan.'}
                          </div>
                       </div>

                       {/* DTF Status Section */}
                       <div className="pt-6 mt-4 border-t border-white/5">
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-white/5 shadow-inner">
                           <div className="space-y-0.5">
                             <h4 className="text-[10px] font-bold text-slate-500 tracking-[0.15em] uppercase italic">Status Verifikasi Cetak DTF</h4>
                           </div>
                           <div className="flex items-center gap-2">
                             {['belum_cetak', 'sudah_cetak'].map((status) => (
                               <button
                                 key={status}
                                 type="button"
                                 onClick={() => handleUpdateDTFStatus(item.id, status as 'belum_cetak' | 'sudah_cetak')}
                                 className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 cursor-pointer border ${
                                   (item.dtfStatus || 'belum_cetak') === status 
                                     ? (status === 'sudah_cetak' ? 'bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-600/20' : 'bg-slate-800 border-slate-700 text-white shadow-xl shadow-slate-800/20')
                                     : 'bg-white/5 border-white/5 text-slate-600 hover:bg-white/10'
                                 }`}
                               >
                                 {status === 'sudah_cetak' ? 'Sudah Cetak' : 'Belum Cetak'}
                               </button>
                             ))}
                           </div>
                         </div>
                         {!['confirmed', 'processing'].includes(order.status) && (
                           <p className="mt-3 text-[10px] text-slate-600 font-bold italic tracking-wide text-center sm:text-left opacity-80">* Kontrol status Cetak available dalam stage Produksi.</p>
                         )}
                       </div>
                    </div>
                 )}
              </div>
           ))}
         </div>
      </div>
      
      {/* Action Controls Panel */}
      <div className="pt-4 space-y-4">
        {order.status === 'draft' && user.role === 'mitra' && (
           <div className="bg-slate-900 p-5 rounded-3xl text-white shadow-2xl border border-blue-500/30 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] -z-10" />
             <div className="space-y-1.5 text-center md:text-left">
               <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[9px] uppercase font-bold tracking-[0.1em]">
                 <ShieldAlert className="w-3.5 h-3.5" /> Menunggu Pengajuan
               </div>
               <p className="font-bold tracking-tight text-xl text-white">Ajukan Draft Pesanan</p>
               <p className="text-[13px] text-slate-400 font-medium leading-relaxed max-w-lg">Ajukan pesanan Anda saat ini agar admin dapat memverifikasi pembayaran dan memulai rute produksi.</p>
             </div>
             <button 
               onClick={() => handleUpdateStatus('waiting_confirmation')} 
               className="px-8 py-3 bg-blue-600 text-white font-bold text-[13px] rounded-xl hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20 w-full md:w-auto cursor-pointer uppercase tracking-wide"
             >
               Ajukan Sekarang
             </button>
           </div>
        )}

        <div className="bg-slate-900/40 p-5 sm:p-6 rounded-3xl border border-white/5 shadow-2xl flex flex-col gap-6 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 pb-2">
            <Layers className="w-4.5 h-4.5 text-slate-500" />
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Aksi & Kontrol Pesanan</h2>
          </div>
          
          <div className="flex flex-col xl:flex-row xl:items-center gap-5 justify-between bg-slate-950/30 p-2 sm:p-4 rounded-2xl border border-white/5">
            {/* Context Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <PDFDownloadLink 
                document={<OrderSPKPDF order={order} mitra={orderMitra} />} 
                fileName={`SPK-${order.orderNumber}.pdf`}
                className="flex-1 sm:flex-none justify-center text-[11px] font-bold text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition px-4 py-3 sm:py-2.5 border border-slate-800 hover:border-emerald-500/30 rounded-xl cursor-pointer bg-slate-900/80 uppercase tracking-widest leading-none shadow-sm flex items-center gap-2"
              >
                {({ loading }) => (
                  <>
                    <PrinterIcon className="w-4 h-4" />
                    {loading ? 'Processing...' : 'Cetak SPK A6'}
                  </>
                )}
              </PDFDownloadLink>

              {order.type === 'offline' && (
                <PDFDownloadLink 
                  document={<ShippingLabelPDF order={order} mitra={orderMitra} mitraPhone={mitraPhone} />} 
                  fileName={`RESI-OFFLINE-${order.orderNumber}.pdf`}
                  className="flex-1 sm:flex-none justify-center text-[11px] font-bold text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition px-4 py-3 sm:py-2.5 border border-slate-800 hover:border-blue-500/30 rounded-xl cursor-pointer bg-slate-900/80 uppercase tracking-widest leading-none shadow-sm flex items-center gap-2"
                >
                  {({ loading }) => (
                    <>
                      <Truck className="w-4 h-4" />
                      {loading ? 'Processing...' : 'Resi Offline'}
                    </>
                  )}
                </PDFDownloadLink>
              )}

              {isEditEligible && (
                <button 
                  onClick={() => navigate(`/orders/${order.id}/edit`)}
                  className="flex-1 sm:flex-none justify-center text-[11px] font-bold text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition px-4 py-3 sm:py-2.5 border border-slate-800 hover:border-blue-500/30 rounded-xl cursor-pointer bg-slate-900/80 uppercase tracking-widest leading-none shadow-sm flex items-center gap-2"
                >
                   Edit Order
                </button>
              )}
              
              {isDeleteEligible && (
                <button 
                  onClick={handleDeleteOrder} 
                  className="flex-1 sm:flex-none justify-center text-[11px] font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition px-4 py-3 sm:py-2.5 border border-slate-800 hover:border-red-500/30 rounded-xl cursor-pointer bg-slate-900/80 uppercase tracking-widest leading-none shadow-sm flex items-center gap-2"
                >
                   Hapus
                </button>
              )}
            </div>

            {/* Status Update Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto xl:ml-auto">
              {canAdvanceNormally() && normalNext && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(normalNext)}
                  className="px-6 py-3.5 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] sm:text-[12px] font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl shadow-blue-500/10 active:scale-95 uppercase tracking-[0.08em]"
                >
                  Lanjutkan ke {STATUS_LABELS[normalNext]}
                </button>
              )}

              {((user.role === 'admin' || user.role === 'staff') && getCorrectionStatuses().length > 0) && (
                <div className="relative inline-block text-left w-full sm:w-auto">
                  <button 
                    type="button" 
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="w-full sm:w-auto px-5 py-3.5 sm:py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-amber-400 text-[11px] sm:text-[12px] font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl active:scale-95 whitespace-nowrap uppercase tracking-[0.08em]"
                  >
                    <span>Koreksi Status</span>
                    <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isStatusDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-45 bg-transparent md:bg-black/20" 
                        onClick={() => setIsStatusDropdownOpen(false)} 
                      />
                      
                      {/* Mobile slide-up menu */}
                      <div className="md:hidden fixed bottom-0 left-0 right-0 max-h-[60vh] bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-50 py-4 px-4 overflow-y-auto animate-in slide-in-from-bottom duration-200">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-2">
                          <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">Pilih Status Koreksi</span>
                          <button onClick={() => setIsStatusDropdownOpen(false)} className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-wider px-2 py-1">Batal</button>
                        </div>
                        <div className="space-y-1 mt-2">
                          {getCorrectionStatuses().map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setIsStatusDropdownOpen(false);
                                handleUpdateStatus(s as OrderStatus);
                              }}
                              className="w-full text-center py-4 text-xs text-amber-400 hover:text-amber-300 font-black transition-all hover:bg-slate-800 rounded-xl block uppercase tracking-widest border border-slate-800 hover:border-amber-500/20"
                            >
                              {STATUS_LABELS[s] || s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Desktop dropdown menu */}
                      <div className="hidden md:block absolute right-0 bottom-full sm:bottom-auto sm:top-full mt-2 sm:mb-0 mb-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                        <div className="px-5 py-2.5 pb-3 border-b border-white/5 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] italic">
                          Target Koreksi:
                        </div>
                        <div className="max-h-60 overflow-y-auto py-1.5">
                          {getCorrectionStatuses().map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setIsStatusDropdownOpen(false);
                                handleUpdateStatus(s as OrderStatus);
                              }}
                              className="w-full text-left px-5 py-3 text-[12px] font-semibold text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all flex items-center justify-between cursor-pointer"
                            >
                              <span>{STATUS_LABELS[s] || s}</span>
                              <span className="w-1 h-3 bg-amber-500/30 rounded-full" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
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
