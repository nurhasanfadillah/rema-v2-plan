import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { db } from '../lib/db';
import { Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus, Archive, Edit2, Trash2, X } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';

export default function Products() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (!user || !['admin', 'mitra'].includes(user.role)) return <div className="p-4 text-red-500">Akses ditolak</div>;

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
       newProducts[idx] = prod;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">Katalog Produk</h1>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 md:gap-5">
        {products.map(p => (
          <div 
            key={p.id} 
            onClick={() => user?.role === 'admin' && setSelectedProduct(p)}
            className={`bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition cursor-pointer ${p.isArchived ? 'opacity-60 grayscale' : ''}`}
          >
            <div className="h-24 sm:h-40 bg-slate-50 flex items-center justify-center relative overflow-hidden">
               {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
               ) : (
                  <span className="text-slate-400 text-[10px] sm:text-xs font-medium">Tanpa Gambar</span>
               )}
               {p.isArchived && (
                 <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-slate-900/80 text-white px-1 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">
                   Diarsipkan
                 </div>
               )}
            </div>
            <div className="p-2 sm:p-3 flex-1 flex flex-col">
               <h3 className="text-[11px] sm:text-base font-semibold tracking-tight text-slate-900 mb-0.5 line-clamp-2 leading-tight">{p.name}</h3>
               <p className="text-xs sm:text-lg font-bold text-slate-700 mb-1 sm:mb-2">{formatCurrency(p.price)}</p>
               {p.description && <p className="hidden sm:block text-[12px] text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>}
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
         <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-xl">
           Belum ada produk di katalog.
         </div>
      )}

      {isAddOpen && (
        <ProductModal 
          product={null} 
          onClose={() => setIsAddOpen(false)} 
          onSave={handleSave} 
        />
      )}

      {selectedProduct && user?.role === 'admin' && (
        <ProductDetailPanel 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onSave={handleSave} 
          onToggleArchive={() => handleArchive(selectedProduct.id, selectedProduct.isArchived)}
          onDelete={() => handleDelete(selectedProduct.id)}
        />
      )}
    </div>
  );
}

function ProductDetailPanel({ 
  product, 
  onClose, 
  onSave, 
  onToggleArchive, 
  onDelete 
}: { 
  product: Product, 
  onClose: () => void, 
  onSave: (p: Product) => void,
  onToggleArchive: () => void,
  onDelete: () => void
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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 transition-opacity">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Detail Produk</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!isEditing ? (
            <div className="space-y-8">
               <div>
                 <div className="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden mb-5 border border-slate-200">
                    {product.imageUrl ? (
                       <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                         Gambar Tidak Tersedia
                       </div>
                    )}
                 </div>
                 
                 <h3 className="text-2xl font-bold text-slate-900 mb-2">{product.name}</h3>
                 <p className="text-xl font-bold text-emerald-600 mb-4">{formatCurrency(product.price)}</p>
                 
                 <div className="flex items-center gap-2 mb-6">
                    {product.isArchived ? (
                         <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[12px] font-medium uppercase tracking-wider">Diarsipkan</span>
                      ) : (
                         <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[12px] font-medium uppercase tracking-wider">Aktif</span>
                    )}
                 </div>

                 {product.description && (
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1 font-medium">Deskripsi</p>
                      <p className="text-[13px] text-slate-700 leading-relaxed">{product.description}</p>
                   </div>
                 )}
               </div>

               <div className="space-y-4">
                 <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Aksi</h4>
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsEditing(true)} className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition">
                      <Edit2 className="w-4 h-4" /> Ubah Produk
                    </button>
                    <button onClick={onToggleArchive} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${product.isArchived ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' : 'bg-orange-50 hover:bg-orange-100 text-orange-700'}`}>
                      <Archive className="w-4 h-4" />
                      {product.isArchived ? 'Buka Arsip' : 'Arsipkan'}
                    </button>
                    <button onClick={onDelete} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition">
                      <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                 </div>
               </div>
            </div>
          ) : (
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk</label>
                  <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp)</label>
                  <input required type="text" value={price} onChange={e=>setPrice(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi (Opsional)</label>
                  <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
               </div>
               <div>
                  <FileUpload value={img} onChange={setImg} label="Gambar (Opsional)" accept="image/*" />
               </div>
               <div className="pt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition">Simpan Perubahan</button>
               </div>
             </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: { product: Product | null, onClose: () => void, onSave: (p: Product) => void }) {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price.toString() || '');
  const [desc, setDesc] = useState(product?.description || '');
  const [img, setImg] = useState(product?.imageUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProd: Product = {
       id: product?.id || crypto.randomUUID(),
       name,
       price: parseInt(price.replace(/\D/g, '')) || 0,
       description: desc,
       imageUrl: img,
       isArchived: product?.isArchived || false
    };
    onSave(newProd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 transition-opacity">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <h2 className="text-xl font-bold mb-4">{product ? 'Ubah Produk' : 'Tambah Produk'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk</label>
             <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp)</label>
             <input required type="text" value={price} onChange={e=>setPrice(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi (Opsional)</label>
             <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
          </div>
          <div>
             <FileUpload value={img} onChange={setImg} label="Gambar (Opsional)" accept="image/*" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition">Batal</button>
             <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
