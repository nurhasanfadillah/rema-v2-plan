import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api, PriceCalculation, PriceCalcAdditional } from '../lib/api';
import { Product } from '../types';
import { Calculator as CalcIcon, Trash2, Plus, X, AlertTriangle } from 'lucide-react';

const fmt = (n: number) => Math.round(n).toLocaleString('id-ID');

type InputMode = 'select' | 'manual';

export default function Calculator() {
  const { user } = useAuth();

  // Form state
  const [inputMode, setInputMode] = useState<InputMode>('select');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [hargaPokok, setHargaPokok] = useState(0);
  const [qty, setQty] = useState(1);
  const [margin, setMargin] = useState(30);
  const [adminMP, setAdminMP] = useState(14);
  const [additionals, setAdditionals] = useState<PriceCalcAdditional[]>([]);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<PriceCalculation[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, hist] = await Promise.all([
          api.products.list(),
          api.priceCalculations.list(),
        ]);
        setProducts(prods.filter(p => !p.isArchived));
        setHistory(hist);
      } catch {
        toast.error('Gagal memuat data');
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, []);

  // Calculations
  const safeQty = Math.max(1, qty);
  const hargaJual = margin > 0 && margin < 100 ? hargaPokok / (1 - margin / 100) : hargaPokok;
  const hargaMP = adminMP > 0 && adminMP < 100 ? hargaJual / (1 - adminMP / 100) : hargaJual;
  const hargaFinals = additionals.reduce<number[]>((acc, item, i) => {
    const base = i === 0 ? hargaMP : acc[i - 1];
    const result =
      item.type === 'persen' && item.value > 0 && item.value < 100
        ? base / (1 - item.value / 100)
        : base + item.value;
    return [...acc, result];
  }, []);

  const showMarginWarning = margin > 0 && margin < 20;

  const switchMode = (mode: InputMode) => {
    setInputMode(mode);
    setProductName('');
    setHargaPokok(0);
    setSelectedProductId('');
  };

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    if (!id) {
      setProductName('');
      setHargaPokok(0);
      return;
    }
    const p = products.find(pr => pr.id === id);
    if (p) {
      setProductName(p.name);
      setHargaPokok(p.price);
    }
  };

  const addAdditional = () => {
    if (additionals.length >= 4) return;
    setAdditionals(prev => [...prev, { label: '', value: 0, type: 'nominal' }]);
  };

  const updateAdditional = (idx: number, patch: Partial<PriceCalcAdditional>) => {
    setAdditionals(prev => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const switchAdditionalType = (idx: number, newType: 'nominal' | 'persen') => {
    setAdditionals(prev => prev.map((a, i) =>
      i === idx ? { ...a, type: newType, value: 0 } : a
    ));
  };

  const removeAdditional = (idx: number) => {
    setAdditionals(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!productName.trim()) {
      toast.error('Nama produk wajib diisi');
      return;
    }
    if (hargaPokok <= 0) {
      toast.error('Harga pokok harus lebih dari 0');
      return;
    }
    setSaving(true);
    try {
      await api.priceCalculations.create({
        productId: selectedProductId || null,
        productName: productName.trim(),
        hargaPokok,
        qty: safeQty,
        margin,
        adminMP,
        additionals,
        hargaJual: Math.round(hargaJual),
        hargaMP: Math.round(hargaMP),
        hargaFinals: hargaFinals.map(Math.round),
      });
      toast.success('Kalkulasi berhasil disimpan');
      const updated = await api.priceCalculations.list();
      setHistory(updated);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan kalkulasi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.priceCalculations.remove(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success('Riwayat dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus');
    }
  };

  if (!user) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CalcIcon className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        <div>
          <h1 className="page-title">Kalkulator Harga Jual</h1>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Hitung harga jual, marketplace, dan biaya tambahan
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form Card */}
        <div className="card-sm space-y-4">
          {/* Mode toggle */}
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Mode Input Produk</p>
            <div className="flex gap-2">
              <button
                onClick={() => switchMode('select')}
                className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all border ${
                  inputMode === 'select'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Pilih dari Produk
              </button>
              <button
                onClick={() => switchMode('manual')}
                className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all border ${
                  inputMode === 'manual'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Input Manual
              </button>
            </div>
          </div>

          {/* Product input */}
          {inputMode === 'select' ? (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                Pilih Produk
              </label>
              <select
                value={selectedProductId}
                onChange={e => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              >
                <option value="">-- Pilih produk --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                Nama Produk
              </label>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="mis. Kaos Polos"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder-slate-600"
              />
            </div>
          )}

          {/* Harga Pokok + Qty inline */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                Harga Pokok (Rp)
              </label>
              <input
                type="number"
                value={hargaPokok || ''}
                onChange={e => setHargaPokok(Number(e.target.value))}
                min={0}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder-slate-600"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                Qty
              </label>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                min={1}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Margin + Admin MP inline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                Margin (%)
              </label>
              <input
                type="number"
                value={margin}
                onChange={e => setMargin(Number(e.target.value))}
                min={0}
                max={99}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                Admin MP (%)
              </label>
              <input
                type="number"
                value={adminMP}
                onChange={e => setAdminMP(Number(e.target.value))}
                min={0}
                max={99}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          {showMarginWarning && (
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-400 leading-relaxed">
                Margin di bawah 20% kurang sehat — laba terlalu tipis untuk menutup biaya operasional.
              </p>
            </div>
          )}

          {/* Biaya Tambahan */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                Biaya Tambahan <span className="text-slate-600 normal-case font-medium">(opsional, maks 4)</span>
              </p>
              {additionals.length < 4 && (
                <button
                  onClick={addAdditional}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Biaya
                </button>
              )}
            </div>
            <div className="space-y-2">
              {additionals.map((a, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={a.label}
                    onChange={e => updateAdditional(idx, { label: e.target.value })}
                    placeholder="mis. Ongkir"
                    className="flex-1 min-w-0 px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder-slate-600"
                  />
                  <input
                    type="number"
                    value={a.value || ''}
                    onChange={e => updateAdditional(idx, { value: Number(e.target.value) })}
                    placeholder="0"
                    min={0}
                    className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-[12px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder-slate-600"
                  />
                  <div className="flex rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
                    <button
                      onClick={() => switchAdditionalType(idx, 'nominal')}
                      className={`px-2.5 py-2 text-[11px] font-bold transition-all ${
                        a.type === 'nominal'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Rp
                    </button>
                    <button
                      onClick={() => switchAdditionalType(idx, 'persen')}
                      className={`px-2.5 py-2 text-[11px] font-bold transition-all border-l border-slate-700 ${
                        a.type === 'persen'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      %
                    </button>
                  </div>
                  <button
                    onClick={() => removeAdditional(idx)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Kalkulasi'}
          </button>
        </div>

        {/* Output Card */}
        <div className="card-sm">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-4">Hasil Kalkulasi</p>

          {hargaPokok <= 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <CalcIcon className="w-10 h-10 text-slate-700" />
              <p className="text-slate-500 text-[13px] font-semibold">Isi harga pokok untuk melihat hasil</p>
            </div>
          ) : (
            <div className="space-y-0 rounded-xl overflow-hidden border border-slate-800">
              {/* Header row */}
              <div className="grid grid-cols-3 bg-slate-800/80 px-3 py-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Label</span>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Per Unit</span>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Total ×{safeQty}</span>
              </div>

              {/* Harga Jual */}
              <div className="grid grid-cols-3 px-3 py-3 border-t border-slate-800/60">
                <span className="text-[12px] font-semibold text-slate-300">Harga Jual</span>
                <span className="text-[12px] font-bold text-white text-right">Rp {fmt(hargaJual)}</span>
                <span className="text-[12px] font-bold text-emerald-400 text-right">Rp {fmt(hargaJual * safeQty)}</span>
              </div>

              {/* Nominal margin */}
              <div className="grid grid-cols-3 px-3 py-2 border-t border-slate-800/60 bg-slate-800/30">
                <span className="text-[11px] text-slate-500 col-span-3">
                  Margin: Rp {fmt(hargaJual - hargaPokok)} / unit
                  {safeQty > 1 && <span className="ml-2 text-slate-600">· Total Rp {fmt((hargaJual - hargaPokok) * safeQty)}</span>}
                </span>
              </div>

              {/* Harga MP */}
              <div className="grid grid-cols-3 px-3 py-3 border-t border-slate-800/60">
                <span className="text-[12px] font-semibold text-slate-300">Harga Marketplace</span>
                <span className="text-[12px] font-bold text-white text-right">Rp {fmt(hargaMP)}</span>
                <span className="text-[12px] font-bold text-emerald-400 text-right">Rp {fmt(hargaMP * safeQty)}</span>
              </div>

              {/* Harga Finals */}
              {hargaFinals.map((hf, i) => (
                <div key={i} className="grid grid-cols-3 px-3 py-3 border-t border-slate-800/60">
                  <span className="text-[12px] font-semibold text-slate-300 truncate pr-2">
                    Harga Final {i + 1}{additionals[i]?.label ? ` — ${additionals[i].label}` : ''}
                  </span>
                  <span className="text-[12px] font-bold text-white text-right">Rp {fmt(hf)}</span>
                  <span className="text-[12px] font-bold text-emerald-400 text-right">Rp {fmt(hf * safeQty)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Info footer */}
          {hargaPokok > 0 && (
            <div className="mt-3 px-3 py-2.5 bg-slate-800/50 rounded-xl">
              <p className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-400">Harga Pokok:</span> Rp {fmt(hargaPokok)} ·{' '}
                <span className="font-bold text-slate-400">Margin:</span> {margin}% ·{' '}
                <span className="font-bold text-slate-400">Admin MP:</span> {adminMP}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="mt-8">
        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-4">Riwayat Kalkulasi</p>

        {loadingHistory ? (
          <div className="text-center py-10 text-slate-500 text-[13px]">Memuat riwayat...</div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CalcIcon className="w-10 h-10 text-slate-700" />
            <p className="text-slate-500 font-semibold text-[13px]">Belum ada riwayat kalkulasi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(h => {
              const finalPrice = h.hargaFinals.length > 0 ? h.hargaFinals[h.hargaFinals.length - 1] : h.hargaMP;
              return (
                <div key={h.id} className="card-sm flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-[13px] truncate">{h.productName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {h.qty} × Rp {fmt(h.hargaPokok)} → Rp {fmt(finalPrice)}/unit
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(h.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all flex-shrink-0"
                    title="Hapus riwayat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
