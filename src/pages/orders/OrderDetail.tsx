import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { db } from '../../lib/db';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Order, OrderStatus } from '../../types';
import { Lightbox } from '../../components/Lightbox';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  
  const [orders, setOrders] = useState<Order[]>(db.getOrders());
  const [lightboxState, setLightboxState] = useState<{ isOpen: boolean, images: string[], index: number }>({ isOpen: false, images: [], index: 0 });
  const order = orders.find(o => o.id === id);

  if (!order || !user) return <div className="p-4">Loading/Not Found...</div>;

  // Enforce access
  if (user.role === 'mitra' && order.mitraId !== user.id) return <div className="p-4 text-red-500">Access denied</div>;

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    const isCancel = newStatus === 'cancelled';
    const isConfirmed = await confirm({
      title: isCancel ? 'Batalkan Pesanan' : 'Update Status Pesanan',
      message: `Apakah Anda yakin ingin ${isCancel ? 'membatalkan' : `mengubah status pesanan menjadi ${newStatus}`}?`,
      confirmText: isCancel ? 'Batalkan' : 'Update',
      type: isCancel ? 'danger' : 'info'
    });
    
    if (!isConfirmed) return;

    if (newStatus === 'waiting_confirmation' && order.status === 'draft') {
      const myMitraRecord = db.getMitras().find(m => m.userId === user.id);
      if (myMitraRecord?.creditLimit) {
        const ledgers = db.getLedgers().filter(l => l.mitraId === user.id);
        const saldo = ledgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);
        if (saldo > myMitraRecord.creditLimit) {
          toast.error(`Tagihan Anda saat ini: ${formatCurrency(saldo)}. Limit tagihan Anda: ${formatCurrency(myMitraRecord.creditLimit)}. Silakan lakukan pembayaran.`);
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

  const getNextStatuses = () => {
    if (user.role === 'mitra') return []; // Mitra cant change status
    if (order.status === 'waiting_confirmation') return ['confirmed', 'cancelled'];
    if (order.status === 'confirmed') return ['processing', 'cancelled'];
    if (order.status === 'processing') return order.hasCustomLogo ? ['printing', 'cancelled'] : ['packing', 'cancelled'];
    if (order.status === 'printing') return ['pressing', 'cancelled'];
    if (order.status === 'pressing') return ['packing', 'cancelled'];
    if (order.status === 'packing') return ['shipped', 'cancelled'];
    return [];
  };

  const nextStatusList = getNextStatuses();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
     <div className="flex justify-between items-center">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Pesanan {order.orderNumber}</h1>
        <div className="flex items-center gap-3">
            {user.role === 'mitra' && !['returned', 'cancelled', 'shipped'].includes(order.status) && (
                <button onClick={() => handleUpdateStatus('cancelled')} className="text-[13px] font-medium text-red-600 hover:text-red-800 transition">
                   Batalkan Pesanan
                </button>
            )}
           <span className="px-3 py-1 font-mono text-[12px] bg-slate-900 text-white rounded-md tracking-wider uppercase">{order.status}</span>
        </div>
      </div>

      {nextStatusList.length > 0 && (
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex flex-wrap gap-2 text-[13px]">
            <span className="text-[13px] font-medium text-slate-600 flex items-center mr-2">Update Status:</span>
            {nextStatusList.map(s => (
               <button key={s} onClick={() => handleUpdateStatus(s as OrderStatus)} className={`px-4 py-1.5 text-[12px] font-bold rounded-lg uppercase tracking-wider transition ${s === 'cancelled' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-emerald-700 hover:bg-green-100'}`}>
                 Mark as {s}
               </button>
            ))}
         </div>
      )}

      {order.status === 'draft' && user.role === 'mitra' && (
         <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
             <p className="font-bold text-blue-900">Pesanan ini masih berstatus Draft</p>
             <p className="text-sm text-blue-700">Ajukan pesanan ini agar segera diproses oleh admin/staff.</p>
           </div>
           <button onClick={() => handleUpdateStatus('waiting_confirmation')} className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition shadow-sm w-full md:w-auto">
             Ajukan Pesanan
           </button>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-lg font-bold mb-4">Detail Pengiriman</h2>
            <div className="space-y-3 text-sm">
               <p><span className="text-gray-500 w-32 inline-block">Waktu Dibuat:</span> {formatDate(order.createdAt)}</p>
               <p><span className="text-gray-500 w-32 inline-block">Tipe:</span> <span className="capitalize">{order.type}</span></p>
               {order.type === 'online' ? (
                  <div className="flex items-center gap-2">
                     <span className="text-gray-500 w-32 shrink-0">Resi:</span>
                     <a href={order.resiUrl} download={`resi-${order.orderNumber}`} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition text-blue-600 font-medium text-xs">
                        Unduh File Resi
                     </a>
                  </div>
               ) : (
                  <>
                    <p><span className="text-gray-500 w-32 inline-block">Penerima:</span> {order.recipientName}</p>
                    <p><span className="text-gray-500 w-32 inline-block">No HP:</span> {order.recipientPhone}</p>
                    <p><span className="text-gray-500 w-32 inline-block flex items-start">Alamat:</span> <span className="flex-1 inline-block">{order.recipientAddress}</span></p>
                  </>
               )}
            </div>
         </div>
         
         {(user.role === 'admin' || user.role === 'mitra') && (
           <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h2 className="text-lg font-bold mb-4">Ringkasan Biaya</h2>
              <div className="space-y-3 text-sm">
                 <p><span className="text-gray-500 w-32 inline-block">Tagihan:</span> {order.isBilled ? <span className="text-green-600 font-bold">SUDAH DITAGIH</span> : <span className="text-gray-400 font-medium">BELUM DITAGIH</span>}</p>
                 <p><span className="text-gray-500 w-32 inline-block">Total Qty:</span> {order.totalQty} pcs</p>
                 <p className="border-t pt-3 font-bold text-lg flex items-center justify-between">
                    <span>Total Harga:</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                 </p>
              </div>
           </div>
         )}
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
         <h2 className="text-lg font-bold border-b pb-2">Item Pesanan</h2>
         {order.items.map((item, i) => (
            <div key={item.id} className="border-b last:border-0 pb-4 last:pb-0">
               <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900">{i+1}. {item.productName} <span className="text-sm font-normal text-gray-500">({item.isCustomLogo ? 'Custom Logo' : 'Polos'})</span></p>
                  {(user.role === 'admin' || user.role === 'mitra') && (
                    <p className="font-bold text-gray-900">{formatCurrency(item.priceSnapshot * item.qty)}</p>
                  )}
               </div>
               <div className="text-sm text-gray-500 flex justify-between">
                  {(user.role === 'admin' || user.role === 'mitra') ? (
                    <p>{formatCurrency(item.priceSnapshot)} x {item.qty} pcs</p>
                  ) : (
                    <p>{item.qty} pcs</p>
                  )}
               </div>
               
               {item.isCustomLogo && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm space-y-4 border">
                     
                     <div className="flex flex-col gap-2">
                        <span className="font-medium text-gray-700">Preview:</span>
                        <div className="flex flex-wrap gap-2">
                           {(Array.isArray(item.previewUrls) && item.previewUrls.length > 0 ? item.previewUrls : (item.previewUrl ? [item.previewUrl] : [])).map((url, idx, arr) => (
                              <div key={idx} className="relative group cursor-pointer border rounded-md overflow-hidden bg-white w-24 h-24 flex-shrink-0" onClick={() => setLightboxState({ isOpen: true, images: arr, index: idx })}>
                                 <img src={url} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">Buka</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="flex flex-col gap-2">
                        <span className="font-medium text-gray-700">Desain Master:</span>
                        <div className="flex flex-wrap gap-2">
                           {(Array.isArray(item.designUrls) && item.designUrls.length > 0 ? item.designUrls : (item.designUrl ? [item.designUrl] : [])).map((url, idx) => (
                              <a href={url} download={`design-${order.orderNumber}-${i+1}-${idx+1}`} key={idx} className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-2 text-blue-600 font-medium whitespace-nowrap">
                                 Unduh File {idx + 1}
                              </a>
                           ))}
                        </div>
                     </div>
                     
                     <p><span className="font-medium text-gray-700 w-32 inline-block">Catatan:</span> {item.designNotes}</p>
                  </div>
               )}
            </div>
         ))}
      </div>
      
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
