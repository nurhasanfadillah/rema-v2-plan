import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { api } from '../../lib/api';
import { Product, OrderItem, Order, Mitra } from '../../types';
import { formatCurrency, generateOrderNumber } from '../../lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, Plus, Type, Globe, Package, ShoppingBag, Info, ShieldAlert, FileText, ArrowLeft } from 'lucide-react';
import { FileUpload } from '../../components/FileUpload';
import { MultiFileUpload } from '../../components/MultiFileUpload';
import { motion } from 'motion/react';

export default function CreateOrder() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const { id } = useParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [existingOrder, setExistingOrder] = useState<Order | undefined>(undefined);
  const [myMitraRecord, setMyMitraRecord] = useState<Mitra | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<'online' | 'offline'>('online');
  const [resiUrl, setResiUrl] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    Promise.all([
      api.products.list(),
      api.mitras.list(),
      id ? api.orders.get(id) : Promise.resolve(undefined),
    ]).then(([prods, mitras, order]) => {
      setProducts((prods as Product[]).filter(p => !p.isArchived));
      const myMitra = (mitras as Mitra[]).find(m => m.userId === user?.id);
      setMyMitraRecord(myMitra);
      if (order) {
        const o = order as Order;
        setExistingOrder(o);
        setType(o.type);
        setResiUrl(o.resiUrl || '');
        setRecipientName(o.recipientName || '');
        setRecipientPhone(o.recipientPhone || '');
        setRecipientAddress(o.recipientAddress || '');
        setItems(o.items || []);
      }
      setLoading(false);
    }).catch(() => {
      toast.error('Gagal memuat data pesanan');
      setLoading(false);
    });
  }, [id]);

  if (!user) return null;
  if (loading) return <div className="p-8 text-center text-slate-400 font-semibold">Memuat data...</div>;

  if (id) {
    if (!existingOrder) {
      return <div className="p-8 text-center text-red-500 font-bold font-sans animate-pulse">Akses Ditolak: Pesanan tidak ditemukan.</div>;
    }

    if (existingOrder.status === 'draft') {
      const creatorUserId = existingOrder.creatorId || myMitraRecord?.userId;
      if (creatorUserId !== user.id) {
        return <div className="p-8 text-center text-red-500 font-bold font-sans">Akses Ditolak: Pesanan draft hanya dapat diakses dan diedit oleh pembuat pesanan.</div>;
      }
    }

    if (user.role === 'mitra') {
      if (existingOrder.mitraId !== myMitraRecord?.id) {
        return <div className="p-8 text-center text-red-500 font-bold font-sans">Akses Ditolak: Anda tidak memiliki akses ke pesanan ini.</div>;
      }
      if (!['draft', 'waiting_confirmation'].includes(existingOrder.status)) {
        return <div className="p-8 text-center text-red-500 font-bold font-sans">Akses Ditolak: Pesanan yang telah diproses tidak dapat diubah oleh Mitra.</div>;
      }
    } else if (user.role === 'admin' || user.role === 'staff') {
      const prePackingStatuses = ['draft', 'waiting_confirmation', 'confirmed', 'processing', 'pressing'];
      if (!prePackingStatuses.includes(existingOrder.status)) {
        return <div className="p-8 text-center text-red-500 font-bold font-sans">Akses Ditolak: Pesanan sudah masuk tahap packing/pengiriman sehingga tidak dapat diubah lagi.</div>;
      }
    } else {
      return <div className="p-8 text-center text-slate-500 font-bold font-sans">Akses Ditolak: Peran Anda tidak memiliki izin mengedit pesanan.</div>;
    }
  } else {
    if (user.role !== 'mitra') {
      return <div className="p-8 text-center text-slate-500 font-bold font-sans">Akses Ditolak: Pembuatan pesanan baru hanya diperuntukan bagi kemitraan (Mitra).</div>;
    }
  }

  const handleAddItem = (isCustom: boolean) => {
    if (products.length === 0) {
      toast.error('Tidak ada katalog produk aktif tersedia');
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
        dtfStatus: isCustom ? 'belum_cetak' : undefined,
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

  const handleSave = async (isSubmit: boolean) => {
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
          toast.error('File preview dan berkas desain wajib untuk item custom logo (minimum 1).');
          return;
        }
      }
    }
    if (type === 'online' && !resiUrl) {
      toast.error('Berkas resi/label marketplace wajib diunggah untuk pesanan online.');
      return;
    }
    if (type === 'offline' && (!recipientName.trim() || !recipientPhone.trim() || !recipientAddress.trim())) {
      toast.error('Informasi penerima wajib dilengkapi untuk pesanan offline.');
      return;
    }

    const totalQty = items.reduce((a, b) => a + b.qty, 0);
    const totalAmount = items.reduce((a, b) => a + (b.qty * b.priceSnapshot), 0);
    const hasCustomLogo = items.some(i => i.isCustomLogo);

    if (isSubmit && user.role === 'mitra' && myMitraRecord?.creditLimit) {
      try {
        const ledgers = await api.ledgers.list(myMitraRecord.id);
        const saldo = ledgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);
        if (saldo > myMitraRecord.creditLimit) {
          toast.error(`Tagihan berjalan Anda saat ini: ${formatCurrency(saldo)}. Limit tagihan Anda: ${formatCurrency(myMitraRecord.creditLimit)}. Mohon lakukan pembayaran saldo terlebih dahulu.`);
          return;
        }
      } catch {
        toast.error('Gagal memeriksa limit kredit');
        return;
      }
    }

    const order: Order = {
      ...(existingOrder || {
        id: crypto.randomUUID(),
        orderNumber: generateOrderNumber(),
        mitraId: myMitraRecord?.id || '',
        createdAt: Date.now(),
        isBilled: false,
        creatorId: user.id,
      }),
      type,
      resiUrl,
      recipientName,
      recipientPhone,
      recipientAddress,
      items,
      status: existingOrder
        ? (user.role === 'admin' || user.role === 'staff'
            ? existingOrder.status
            : (isSubmit ? 'waiting_confirmation' : 'draft'))
        : (isSubmit ? 'waiting_confirmation' : 'draft'),
      updatedAt: Date.now(),
      hasCustomLogo,
      totalAmount,
      totalQty,
    };

    try {
      if (existingOrder) {
        await api.orders.update(existingOrder.id, order);
        await api.auditLogs.create({ userId: user.id, action: 'ORDER_UPDATED', details: `Mengubah detail pesanan #${order.orderNumber}` });
        toast.success('Pesanan berhasil diperbarui');
      } else {
        if (isSubmit) {
          const isConfirmed = await confirm({
            title: 'Konfirmasi Ajukan Pesanan',
            message: `Apakah Anda yakin ingin mengajukan pesanan dengan total ${totalQty} pcs ini? Setelah diajukan, pesanan akan masuk ke tahap verifikasi admin.`,
            confirmText: 'Ya, Ajukan',
            type: 'info'
          });
          if (!isConfirmed) return;
        }
        await api.orders.create(order);
        await api.auditLogs.create({ userId: user.id, action: isSubmit ? 'ORDER_SUBMITTED' : 'ORDER_DRAFTED', details: `Order ${order.orderNumber}` });
        toast.success(isSubmit ? 'Pesanan berhasil diajukan untuk verifikasi' : 'Draft pesanan disimpan');
      }
      navigate('/orders');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pesanan');
    }
  };

  const currentTotal = items.reduce((a, b) => a + (b.qty * b.priceSnapshot), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/orders')}
          className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
           <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
             {existingOrder ? `Edit Pesanan #${existingOrder.orderNumber}` : 'Formulir Pesanan Baru'}
           </h1>
           <p className="text-[13px] text-slate-500 mt-0.5 font-semibold">
             {existingOrder ? 'Perbarui informasi pengiriman, item, dan berkas cetak.' : 'Tentukan metode pengiriman, isi items, dan lengkapi berkas aset cetak.'}
           </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-5 sm:p-7 space-y-8">
        {/* Step 1: Shipping and Delivery */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-150">
            <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-105 text-blue-600 font-extrabold text-xs flex items-center justify-center">1</span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">Informasi Distribusi & Pengiriman</h2>
          </div>

          <div className="pt-1.5 flex flex-col md:flex-row md:items-center gap-4">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest md:w-28 shrink-0">Tipe</span>
             <div className="flex-1 flex gap-3">
                <button
                  type="button"
                  onClick={() => setType('online')}
                  className={`flex-1 py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-[0.99] cursor-pointer ${type === 'online' ? 'border-slate-950 bg-slate-950 text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  <Globe className="w-4 h-4" />
                  Online
                </button>
                <button
                  type="button"
                  onClick={() => setType('offline')}
                  className={`flex-1 py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-[0.99] cursor-pointer ${type === 'offline' ? 'border-slate-950 bg-slate-950 text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  <Package className="w-4 h-4" />
                  Offline
                </button>
             </div>
          </div>

          {type === 'online' ? (
            <div className="pt-2">
               <FileUpload value={resiUrl} onChange={setResiUrl} label="Unggah Label Pengiriman PDF / File Resi Cetak (Wajib)" accept="*/*" />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap Penerima *</label>
                   <input required value={recipientName} onChange={e=>setRecipientName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-xs" placeholder="Nama penerima paket" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">No. Handphone Penerima *</label>
                   <input required type="tel" value={recipientPhone} onChange={e=>setRecipientPhone(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-xs" placeholder="Contoh: 08xxxx" />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Alamat Lengkap Distribusi *</label>
                 <textarea required rows={3} value={recipientAddress} onChange={e=>setRecipientAddress(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-xs leading-relaxed" placeholder="Tuliskan nama jalan, RT/RW, Kecamatan, Kota, Kode Pos" />
               </div>
            </div>
          )}
        </div>

        {/* Step 2: Order Items List */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-2.5 border-b border-slate-150 gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-110 text-indigo-600 font-extrabold text-xs flex items-center justify-center">2</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest md:w-28">Item</span>
            </div>
            <div className="flex-1 flex gap-3">
               <button
                 type="button"
                 onClick={()=>handleAddItem(false)}
                 className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-slate-200"
               >
                  <Plus className="w-4 h-4"/> Polos
               </button>
               <button
                 type="button"
                 onClick={()=>handleAddItem(true)}
                 className="flex-1 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-indigo-100"
               >
                  <Plus className="w-4 h-4"/> Custom
               </button>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className="p-4 sm:p-5 border border-slate-200/80 rounded-3xl bg-slate-50 shadow-sm space-y-4">
                 <div className="space-y-4">
                    <div>
                       <SearchableProductSelect
                         products={products}
                         selectedId={item.productId}
                         onChange={val => handleUpdateItem(item.id, 'productId', val)}
                       />
                    </div>

                     <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-200/55">
                      <div className="flex items-center gap-4 border-0">
                        <input
                          type="number"
                          min="1"
                          value={item.qty || ''}
                          onChange={e => handleUpdateItem(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-16 px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 font-bold text-xs text-slate-800 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Qty"
                        />
                        <div className="text-xs font-semibold text-slate-500">
                          Subtotal: <span className="font-extrabold text-teal-600">{formatCurrency(item.qty * item.priceSnapshot)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center border border-rose-100 hover:border-rose-200 shadow-sm"
                        title="Hapus Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.isCustomLogo && (
                       <div className="space-y-4 pt-4 border-t border-slate-200/60">
                         <div>
                            <MultiFileUpload values={item.previewUrls || (item.previewUrl ? [item.previewUrl] : [])} onChange={val=>handleUpdateItem(item.id, 'previewUrls', val)} label="Unggah Visual Preview" accept="image/*" />
                         </div>
                         <div>
                            <MultiFileUpload values={item.designUrls || (item.designUrl ? [item.designUrl] : [])} onChange={val=>handleUpdateItem(item.id, 'designUrls', val)} label="File Master Design" accept="*/*" />
                         </div>
                         <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Catatan Desain</label>
                            <textarea required rows={3} value={item.designNotes||''} onChange={e=>handleUpdateItem(item.id, 'designNotes', e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none text-xs bg-white font-semibold text-slate-700 border-slate-200 resize-y" placeholder="Mis. Sisi depan dada tengah lebar 10cm, belakang polos" />
                         </div>
                       </div>
                    )}
                 </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed rounded-3xl p-8 max-w-sm mx-auto">
                 <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                 <p className="text-slate-700 font-bold text-xs">Keranjang Belanja Masih Kosong</p>
                 <p className="text-[10px] text-slate-400 font-medium">Klik tombol + Polos atau + Custom diatas untuk mulai merancang produk pilihan Anda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-150 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Estimasi Tagihan:</span>
              <span className="text-xl font-black text-slate-950">{formatCurrency(currentTotal)}</span>
           </div>
           <div className="flex gap-3 w-full md:w-auto text-xs">
              {(user.role === 'admin' || user.role === 'staff') && existingOrder ? (
                <button
                  onClick={() => handleSave(true)}
                  className="px-6 py-3 bg-gradient-to-tr from-slate-900 to-slate-800 hover:from-slate-850 hover:to-slate-755 text-white font-black rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer w-full md:w-auto"
                >
                  Simpan Perubahan
                </button>
              ) : (
                <>
                  <button onClick={() => handleSave(false)} className="flex-1 md:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-95 cursor-pointer">
                     {existingOrder ? 'Update Draft' : 'Simpan di Draft'}
                  </button>
                  <button onClick={() => handleSave(true)} className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black rounded-2xl shadow-md shadow-blue-500/10 transition-all active:scale-95 cursor-pointer">
                     {existingOrder ? 'Update & Ajukan' : 'Ajukan Pesanan'}
                  </button>
                </>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function SearchableProductSelect({
  products,
  selectedId,
  onChange,
}: {
  products: Product[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedProduct = products.find(p => p.id === selectedId) || products[0];

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 bg-white font-extrabold text-xs text-slate-700 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-slate-50"
      >
        <span>
          {selectedProduct ? `${selectedProduct.name} — ${formatCurrency(selectedProduct.price)}` : 'Pilih Produk...'}
        </span>
        <span className="text-slate-400 text-[10px] ml-2">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2 max-h-60 flex flex-col">
          <input
            type="text"
            placeholder="Cari jenis produk..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-blue-500 bg-white text-slate-800"
            autoFocus
          />
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 bg-white">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-100 rounded-lg flex justify-between items-center ${p.id === selectedId ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-800'}`}
                >
                  <span className={`${p.id === selectedId ? 'text-indigo-700 font-bold' : 'text-slate-850'} font-semibold`}>{p.name}</span>
                  <span className={`${p.id === selectedId ? 'text-indigo-650 font-bold' : 'text-slate-500'} text-[11px]`}>{formatCurrency(p.price)}</span>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-[11px] font-medium text-slate-400">
                Tidak ada hasil pencarian
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
