import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { db } from '../lib/db';
import { Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus, Archive, Edit2, Trash2, X, Shirt, Award, AlertCircle, ShoppingBag } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { motion, AnimatePresence } from 'motion/react';

export default function Products() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (!user || !['admin', 'mitra'].includes(user.role)) return <div className="p-8 text-center text-red-500 font-bold">Akses Ditolak</div>;

  const handleArchive = async (id: string, currentArchive: boolean) => {
    if (user?.role !== 'admin') return;
    
    const isConfirmed = await confirm({
      title: currentArchive ? 'Buka Arsip Produk' : 'Arsipkan Produk',
      message: currentArchive ? 'Buka arsip produk ini agar bisa dipesan kembali?' : 'Arsipkan produk ini? Ini akan menyembunyikannya dari pesanan baru.',
      confirmText: currentArchive ? 'Buka Arsip' : 'Arsipkan',
      type: currentArchive ? 'info' : 'warning'
    });
    
    if (!isConfirmed) return;

    const newProducts = [...products];
    const idx = newProducts.findIndex(p => p.id === id);
    if (idx !== -1) {
      newProducts[idx] = { ...newProducts[idx], isArchived: !currentArchive };
      db.saveProducts(newProducts);
      db.addAuditLog({ userId: user.id, action: currentArchive ? 'PRODUCT_UNARCHIVED' : 'PRODUCT_ARCHIVED', details: `Product ${id}` });
      setProducts(newProducts);
      setSelectedProduct(newProducts[idx]);
      toast.success(currentArchive ? 'Arsip produk berhasil dibuka' : 'Produk berhasil diarsipkan');
    }
  };

  const handleDelete = async (id: string) => {
    if (user?.role !== 'admin') return;
    
    // Validation
    const orders = db.getOrders();
    const isUsedInOrders = orders.some(o => o.items.some(i => i.productId === id));
    if (isUsedInOrders) {
      toast.error("Tidak dapat menghapus produk ini karena sudah digunakan dalam pesanan. Silakan arsipkan saja.");
      return;
    }

    const isConfirmed = await confirm({
      title: 'Hapus Produk',
      message: 'Apakah Anda yakin ingin menghapus produk ini secara permanen?',
      confirmText: 'Hapus',
      type: 'danger'
    });

    if (!isConfirmed) return;

    const newProducts = products.filter(p => p.id !== id);
    db.saveProducts(newProducts);
    db.addAuditLog({ userId: user.id, action: 'PRODUCT_DELETED', details: `Product ${id}` });
    setProducts(newProducts);
    setSelectedProduct(null);
    toast.success('Produk berhasil dihapus');
  };

  const handleSave = (prod: Product) => {
    if (prod.price <= 0 || !prod.name.trim()) {
      toast.error("Nama produk harus diisi dan harga harus lebih dari 0.");
      return;
    }
    let newProducts = [...products];
    const idx = newProducts.findIndex(p => p.id === prod.id);
    if (idx !== -1) {
       newProducts[idx] = { ...prod };
       db.addAuditLog({ userId: user!.id, action: 'PRODUCT_UPDATED', details: `Product ${prod.id}` });
       toast.success('Produk berhasil diperbarui');
       setSelectedProduct(prod);
    } else {
       newProducts.unshift(prod);
       db.addAuditLog({ userId: user!.id, action: 'PRODUCT_CREATED', details: `Product ${prod.id}` });
       toast.success('Produk berhasil ditambahkan');
    }
    db.saveProducts(newProducts);
    setProducts(newProducts);
    setIsAddOpen(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  const formattedLabel = (p: string) => {
     const num = parseInt(p.replace(/\D/g, ''));
     if (isNaN(num)) return '';
     return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-150 rounded-md px-2 py-0.5 w-max mb-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Katalog Produk
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Katalog & Koleksi Produk</h1>
          <p className="text-[13px] text-slate-500 mt-0.5 font-semibold">Kelola ketersediaan barang, list harga jual mitra, dan foto produk.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-gradient-to-tr from-slate-950 to-slate-900 hover:from-slate-900 hover:to-slate-850 text-white px-5 py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" /> Tambah Produk Baru
          </button>
        )}
      </div>

      <motion.div 
        variants={containerVariants} 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5"
      >
        {products.map(p => (
          <motion.div 
            variants={itemVariants}
            key={p.id} 
            onClick={() => user?.role === 'admin' && setSelectedProduct(p)}
            className={`bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-all duration-300 relative ${user?.role === 'admin' ? 'cursor-pointer hover:border-slate-350 active:scale-[0.98]' : 'select-none'} ${p.isArchived ? 'opacity-60 grayscale' : ''}`}
          >
            <div className="aspect-[4/3] sm:aspect-square bg-slate-50 flex items-center justify-center relative overflow-hidden group border-b border-slate-100">
               {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
               ) : (
                  <div className="flex flex-col items-center gap-1.5 text-slate-350">
                    <ShoppingBag className="w-8 h-8 opacity-40" />
                    <span className="text-[10px] sm:text-xs font-semibold">Default Placeholder</span>
                  </div>
               )}
               {p.isArchived && (
                 <div className="absolute top-2.5 right-2.5 bg-slate-950 border border-slate-800 text-[9px] font-black uppercase text-slate-100 px-2 py-0.5 rounded-md shadow-sm">
                   DIARSIPKAN
                 </div>
               )}
            </div>
            <div className="p-3.5 flex-1 flex flex-col justify-between gap-1.5">
               <div>
                 <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 line-clamp-2 leading-tight">{p.name}</h3>
                 {p.description && <p className="hidden sm:block text-[11px] text-slate-400 font-medium line-clamp-1 leading-relaxed mt-1">{p.description}</p>}
               </div>
               <p className="text-sm sm:text-base font-black text-slate-950 leading-none">{formatCurrency(p.price)}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {products.length === 0 && (
         <motion.div variants={itemVariants} className="text-center py-16 border-2 border-dashed rounded-3xl p-8 max-w-md mx-auto">
           <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
           <p className="text-slate-800 font-bold mb-1">Belum Ada Produk Katalog</p>
           <p className="text-xs text-slate-400 font-medium">Tambahkan produk baru sebagai item persediaan pesanan.</p>
         </motion.div>
      )}

      {isAddOpen && (
        <ProductModal 
          product={null} 
          onClose={() => setIsAddOpen(false)} 
          onSave={handleSave} 
          formattedLabel={formattedLabel}
        />
      )}

      <AnimatePresence>
        {selectedProduct && user?.role === 'admin' && (
          <ProductDetailPanel 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onSave={handleSave} 
            onToggleArchive={() => handleArchive(selectedProduct.id, selectedProduct.isArchived)}
            onDelete={() => handleDelete(selectedProduct.id)}
            formattedLabel={formattedLabel}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProductDetailPanel({ 
  product, 
  onClose, 
  onSave, 
  onToggleArchive, 
  onDelete,
  formattedLabel
}: { 
  product: Product, 
  onClose: () => void, 
  onSave: (p: Product) => void,
  onToggleArchive: () => void,
  onDelete: () => void,
  formattedLabel: (p: string) => string
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [desc, setDesc] = useState(product.description || '');
  const [img, setImg] = useState(product.imageUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
       ...product,
       name,
       price: parseInt(price.replace(/\D/g, '')) || 0,
       description: desc,
       imageUrl: img,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100vw' }}
        animate={{ x: 0 }}
        exit={{ x: '100vw' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Detail Info Produk</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!isEditing ? (
            <div className="space-y-8">
               <div>
                 <div className="w-full aspect-video bg-slate-50 border rounded-2xl overflow-hidden mb-5">
                    {product.imageUrl ? (
                       <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center text-slate-350 gap-2">
                         <ShoppingBag className="w-10 h-10 opacity-30" />
                         <span className="text-xs font-semibold">Gambar Tidak Tersedia</span>
                       </div>
                    )}
                 </div>
                 
                 <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1.5 leading-tight">{product.name}</h3>
                 <p className="text-lg font-black text-slate-950 mb-4">{formatCurrency(product.price)}</p>
                 
                 <div className="flex items-center gap-2 mb-6">
                    {product.isArchived ? (
                         <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-extrabold uppercase">DIARSIPKAN</span>
                      ) : (
                         <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-extrabold uppercase animate-pulse">AKTIF</span>
                    )}
                 </div>

                 {product.description && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Deskripsi Produk</p>
                       <p className="text-xs leading-relaxed text-slate-600 font-semibold">{product.description}</p>
                    </div>
                 )}
               </div>

               <div className="space-y-4 pt-1">
                 <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Kontrol Manajemen</h4>
                 <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                    <button onClick={() => setIsEditing(true)} className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer active:scale-95 text-xs font-extrabold shadow-md">
                      <Edit2 className="w-4 h-4" /> Edit & Perbarui Produk
                    </button>
                    <button onClick={onToggleArchive} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all cursor-pointer active:scale-95 ${product.isArchived ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' : 'bg-orange-50 hover:bg-orange-100 text-orange-700'}`}>
                      <Archive className="w-4 h-4" />
                      {product.isArchived ? 'Buka Arsip' : 'Arsipkan'}
                    </button>
                    <button onClick={onDelete} className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all cursor-pointer active:scale-95">
                      <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                 </div>
               </div>
            </div>
          ) : (
             <form onSubmit={handleSubmit} className="space-y-4 font-bold text-xs sm:text-sm">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Produk</label>
                   <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-xs" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Harga Jual (Rp)</label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                     <input required type="text" value={new Intl.NumberFormat('id-ID').format(parseInt(price.replace(/\D/g, '')) || 0)} onChange={e=>setPrice(e.target.value.replace(/\D/g, ''))} className="w-full pl-9 pr-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-extrabold text-slate-850 text-xs" />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Deskripsi Produk (Opsional)</label>
                   <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-semibold text-xs leading-relaxed" />
                </div>
                <div>
                   <FileUpload value={img} onChange={setImg} label="Gambar Visual Produk" accept="image/*" />
                </div>
                <div className="pt-6 flex justify-end gap-3 text-xs">
                   <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all cursor-pointer">Batal</button>
                   <button type="submit" className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all cursor-pointer active:scale-95">Simpan Perubahan</button>
                </div>
             </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ProductModal({ product, onClose, onSave, formattedLabel }: { product: Product | null, onClose: () => void, onSave: (p: Product) => void, formattedLabel: (p: string) => string }) {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price.toString() || '');
  const [desc, setDesc] = useState(product?.description || '');
  const [img, setImg] = useState(product?.imageUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrice = parseInt(price.replace(/\D/g, '')) || 0;
    const newProd: Product = {
       id: product?.id || crypto.randomUUID(),
       name,
       price: cleanPrice,
       description: desc,
       imageUrl: img,
       isArchived: product?.isArchived || false
    };
    onSave(newProd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 lg:p-8 animate-in slide-in-from-bottom-8">
        <h2 className="text-lg font-black text-slate-900 mb-6">{product ? '📝 Ubah Detail Produk' : '📦 Tambah Kategori Produk'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 font-bold text-xs sm:text-sm">
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Produk</label>
             <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-bold text-slate-800 text-xs" placeholder="Mis. Produk Kualitas Premium" />
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Harga Dasar (Rp)</label>
             <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
               <input required type="text" value={new Intl.NumberFormat('id-ID').format(parseInt(price.replace(/\D/g, '')) || 0)} onChange={e=>setPrice(e.target.value.replace(/\D/g, ''))} className="w-full pl-9 pr-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-extrabold text-slate-850 text-xs" placeholder="0" />
             </div>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Deskripsi Produk (Opsional)</label>
             <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-semibold text-xs leading-relaxed" placeholder="Penjelasan bahan, warna, dll." />
          </div>
          <div>
             <FileUpload value={img} onChange={setImg} label="Gambar Utama Produk" accept="image/*" />
          </div>
          <div className="pt-6 flex justify-end gap-3 text-xs">
             <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all cursor-pointer">Batal</button>
             <button type="submit" className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all cursor-pointer active:scale-95">Simpan Produk</button>
          </div>
        </form>
      </div>
    </div>
  );
}export {};
