import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Product, OrderItem, Order } from '../../types';
import { formatCurrency, generateOrderNumber } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Type, Globe, Package } from 'lucide-react';
import { FileUpload } from '../../components/FileUpload';
import { MultiFileUpload } from '../../components/MultiFileUpload';

export default function CreateOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const products = db.getProducts().filter(p => !p.isArchived);
  
  const [type, setType] = useState<'online' | 'offline'>('online');
  const [resiUrl, setResiUrl] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);

  if (user?.role !== 'mitra') return <div className="p-4 text-red-500">Access denied</div>;

  const handleAddItem = (isCustom: boolean) => {
    if (products.length === 0) {
      toast.error('Tidak ada produk tersedia');
      return;
    }
    setItems([
      ...items, 
      {
        id: crypto.randomUUID(),
        productId: products[0].id,
        productName: products[0].name,
        priceSnapshot: products[0].price,
        qty: 1,
        isCustomLogo: isCustom,
        designNotes: isCustom ? 'Pesanan custom logo' : 'Pesanan polos',
        previewUrls: [],
        designUrls: []
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof OrderItem, val: any) => {
    const newItems = items.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: val };
        if (field === 'productId') {
          const p = products.find(x => x.id === val);
          if (p) {
            updated.productName = p.name;
            updated.priceSnapshot = p.price;
          }
        }
        return updated;
      }
      return i;
    });
    setItems(newItems);
  };

  const handleRemoveItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleSave = (isSubmit: boolean) => {
    if (items.length === 0) {
      toast.error('Tambahkan minimal 1 item produk.');
      return;
    }
    for (const item of items) {
      if (item.qty <= 0) {
        toast.error('Kuantitas item harus lebih dari 0.');
        return;
      }
      if (item.isCustomLogo) {
        if (!item.previewUrls?.length || !item.designUrls?.length) {
          toast.error('File preview dan design wajib untuk item custom logo (minimum 1).');
          return;
        }
      }
    }
    if (type === 'online' && !resiUrl) {
      toast.error('Resi marketplace wajib untuk pesanan online.');
      return;
    }
    if (type === 'offline' && (!recipientName || !recipientPhone || !recipientAddress)) {
      toast.error('Data penerima wajib untuk pesanan offline.');
      return;
    }

    const totalQty = items.reduce((a,b)=>a+b.qty, 0);
    const totalAmount = items.reduce((a,b)=>a+(b.qty*b.priceSnapshot), 0);
    const hasCustomLogo = items.some(i => i.isCustomLogo);

    // Limit check if submitting
    if (isSubmit) {
      const myMitraRecord = db.getMitras().find(m => m.userId === user.id);
      if (myMitraRecord?.creditLimit) {
         const ledgers = db.getLedgers().filter(l => l.mitraId === user.id);
         const saldo = ledgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);
         if (saldo > myMitraRecord.creditLimit) {
           toast.error(`Tagihan Anda saat ini: ${formatCurrency(saldo)}. Limit tagihan Anda: ${formatCurrency(myMitraRecord.creditLimit)}. Silakan lakukan pembayaran.`);
           return; // Prevent submit, stays in draft
         }
      }
    }

    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: generateOrderNumber(),
      mitraId: user.id,
      type,
      resiUrl,
      recipientName,
      recipientPhone,
      recipientAddress,
      items,
      status: isSubmit ? 'waiting_confirmation' : 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      hasCustomLogo,
      totalAmount,
      totalQty,
      isBilled: false,
    };

    db.saveOrders([order, ...db.getOrders()]);
    db.addAuditLog({ userId: user.id, action: isSubmit ? 'ORDER_SUBMITTED' : 'ORDER_DRAFTED', details: `Order ${order.orderNumber}` });
    
    toast.success(isSubmit ? 'Pesanan berhasil diajukan' : 'Draft pesanan berhasil disimpan');
    navigate('/orders');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Buat Pesanan Baru</h1>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">Informasi Pengiriman</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Pesanan</label>
            <div className="flex gap-4">
               <button
                 type="button"
                 onClick={() => setType('online')}
                 className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-colors ${type === 'online' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
               >
                 <Globe className="w-5 h-5" />
                 Online (Marketplace)
               </button>
               <button
                 type="button"
                 onClick={() => setType('offline')}
                 className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-medium transition-colors ${type === 'offline' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
               >
                 <Package className="w-5 h-5" />
                 Offline (Manual)
               </button>
            </div>
          </div>
          
          {type === 'online' ? (
            <div>
               <FileUpload value={resiUrl} onChange={setResiUrl} label="File Resi Marketplace (PDF/IMG)" accept="*/*" />
            </div>
          ) : (
            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penerima *</label>
                 <input required value={recipientName} onChange={e=>setRecipientName(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-gray-900" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">No. HP Penerima *</label>
                 <input required type="tel" value={recipientPhone} onChange={e=>setRecipientPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-gray-900" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Penerima *</label>
                 <textarea required rows={3} value={recipientAddress} onChange={e=>setRecipientAddress(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-gray-900" />
               </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-bold">Item Pesanan</h2>
            <div className="flex gap-2">
               <button type="button" onClick={()=>handleAddItem(false)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-1 transition">
                  <Plus className="w-4 h-4"/> Polos
               </button>
               <button type="button" onClick={()=>handleAddItem(true)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-1 transition">
                  <Plus className="w-4 h-4"/> Custom Logo
               </button>
            </div>
          </div>
          
          {items.map((item, idx) => (
            <div key={item.id} className="p-4 border rounded-xl bg-gray-50 flex gap-4">
               <div className="flex-1 space-y-4">
                 <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Produk</label>
                      <select value={item.productId} onChange={e=>handleUpdateItem(item.id, 'productId', e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>)}
                      </select>
                   </div>
                   <div className="w-24">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                      <input type="number" min="1" value={item.qty} onChange={e=>handleUpdateItem(item.id, 'qty', parseInt(e.target.value)||0)} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-gray-900 bg-white text-center" />
                   </div>
                 </div>
                 
                 {item.isCustomLogo && (
                    <div className="space-y-3 pt-2 mt-2 border-t border-gray-200">
                      <div>
                         <MultiFileUpload values={item.previewUrls || (item.previewUrl ? [item.previewUrl] : [])} onChange={val=>handleUpdateItem(item.id, 'previewUrls', val)} label="File Preview Logo (Wajib, bisa lebih dari 1)" accept="image/*" />
                      </div>
                      <div>
                         <MultiFileUpload values={item.designUrls || (item.designUrl ? [item.designUrl] : [])} onChange={val=>handleUpdateItem(item.id, 'designUrls', val)} label="File Desain Master (ZIP/PDF/AI Wajib, bisa lebih dari 1)" accept="*/*" />
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">Catatan Desain</label>
                         <input required value={item.designNotes||''} onChange={e=>handleUpdateItem(item.id, 'designNotes', e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm bg-white" />
                      </div>
                    </div>
                 )}
               </div>
               <div>
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus Item">
                     <Trash2 className="w-5 h-5"/>
                  </button>
               </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Belum ada item ditambahkan.</p>}
        </div>

        <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="text-xl font-bold">
              Total: {formatCurrency(items.reduce((a,b)=>a+(b.qty*b.priceSnapshot), 0))}
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => handleSave(false)} className="flex-1 md:flex-none px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition">
                 Simpan Draft
              </button>
              <button onClick={() => handleSave(true)} className="flex-1 md:flex-none px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition">
                 Ajukan Pesanan
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
