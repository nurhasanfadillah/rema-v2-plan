import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Mitra, Product, LedgerEntry, Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Receipt, FileText, Download, Filter, Calendar, Info, X } from 'lucide-react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { FinanceReportPDF } from '../components/reports/FinanceReportPDF';
import { OrderReportPDF } from '../components/reports/OrderReportPDF';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

export default function Reports() {
  const { user } = useAuth();
  const [mitras, setMitras] = useState<Mitra[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allLedgers, setAllLedgers] = useState<LedgerEntry[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.mitras.list().then(setMitras).catch(console.error);
    api.products.list().then(setProducts).catch(console.error);
    api.ledgers.list().then(setAllLedgers).catch(console.error);
    api.orders.list().then(setAllOrders).catch(console.error);
  }, []);

  const [activeTab, setActiveTab] = useState<'finance' | 'order'>(user?.role === 'staff' ? 'order' : 'finance');

  // Finance Filters
  const [finStart, setFinStart] = useState('');
  const [finEnd, setFinEnd] = useState('');
  const [finMitraId, setFinMitraId] = useState<string>('all');

  // Order Filters
  const [ordStart, setOrdStart] = useState('');
  const [ordEnd, setOrdEnd] = useState('');
  const [ordMitraId, setOrdMitraId] = useState<string>('all');
  const [ordType, setOrdType] = useState('all');
  const [ordStatus, setOrdStatus] = useState('all');
  const [ordProduct, setOrdProduct] = useState('all');

  useEffect(() => {
    if (user?.role === 'mitra' && mitras.length > 0) {
      const myMitra = mitras.find(m => m.userId === user.id);
      if (myMitra) {
        setFinMitraId(myMitra.id);
        setOrdMitraId(myMitra.id);
      }
    }
  }, [mitras, user]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  // Derived Finance Data
  const financeData = useMemo(() => {
    let filtered = allLedgers.filter(l => l.source !== 'cancellation' && l.source !== 'return');
    if (finMitraId !== 'all') filtered = filtered.filter(l => l.mitraId === finMitraId);
    if (finStart) filtered = filtered.filter(l => l.createdAt >= new Date(finStart).setHours(0,0,0,0));
    if (finEnd) filtered = filtered.filter(l => l.createdAt <= new Date(finEnd).setHours(23,59,59,999));

    const totalDebit = filtered.reduce((acc, curr) => curr.direction === 'debit' ? acc + curr.nominal : acc, 0);
    const totalCredit = filtered.reduce((acc, curr) => curr.direction === 'credit' ? acc + curr.nominal : acc, 0);

    // Chart Data Grouped by Date
    const dateRecap = filtered.reduce((acc: any, curr) => {
      const d = new Date(curr.createdAt);
      d.setHours(0,0,0,0);
      const timestamp = d.getTime();
      if (!acc[timestamp]) {
         acc[timestamp] = {
           name: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
           debit: 0,
           credit: 0,
           timestamp,
         };
      }
      if (curr.direction === 'debit') acc[timestamp].debit += curr.nominal;
      if (curr.direction === 'credit') acc[timestamp].credit += curr.nominal;
      return acc;
    }, {});
    
    const chartData = Object.values(dateRecap)
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
      .map((item: any) => ({ name: item.name, debit: item.debit, credit: item.credit }));

    return { filtered, totalDebit, totalCredit, chartData };
  }, [allLedgers, finStart, finEnd, finMitraId]);

  // Derived Order Data
  const orderData = useMemo(() => {
    let filteredOrders = allOrders;
    if (ordMitraId !== 'all') filteredOrders = filteredOrders.filter(o => o.mitraId === ordMitraId);
    if (ordStart) filteredOrders = filteredOrders.filter(o => o.createdAt >= new Date(ordStart).setHours(0,0,0,0));
    if (ordEnd) filteredOrders = filteredOrders.filter(o => o.createdAt <= new Date(ordEnd).setHours(23,59,59,999));
    if (ordType !== 'all') filteredOrders = filteredOrders.filter(o => o.type === ordType);
    if (ordStatus !== 'all') filteredOrders = filteredOrders.filter(o => o.status === ordStatus);

    let items = filteredOrders.flatMap(o => o.items.map(i => ({
      ...i,
      orderDate: o.createdAt,
      orderNumber: o.orderNumber,
      orderType: o.type,
      mitraId: o.mitraId,
      superOrder: o
    })));

    if (ordProduct !== 'all') items = items.filter(i => i.productId === ordProduct);

    const totalQty = items.reduce((acc, curr) => acc + curr.qty, 0);
    const totalSubtotal = items.reduce((acc, curr) => acc + (curr.qty * curr.priceSnapshot), 0);

    const productRecap = items.reduce((acc: any, curr) => {
      acc[curr.productName] = (acc[curr.productName] || 0) + curr.qty;
      return acc;
    }, {});
    
    const dateRecap = items.reduce((acc: any, curr) => {
      const d = new Date(curr.orderDate);
      d.setHours(0,0,0,0);
      const timestamp = d.getTime();
      if (!acc[timestamp]) {
         acc[timestamp] = {
           name: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
           qty: 0,
           timestamp,
         };
      }
      acc[timestamp].qty += curr.qty;
      return acc;
    }, {});
    
    const chartData = Object.values(dateRecap)
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
      .map((item: any) => ({ name: item.name, qty: item.qty }));

    return { items, totalQty, totalSubtotal, productRecap, chartData };
  }, [allOrders, ordStart, ordEnd, ordMitraId, ordType, ordStatus, ordProduct]);

  if (!user || user.role === 'operational') return <div className="p-8 text-center text-red-500 font-bold">Akses ditolak</div>;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const doc = activeTab === 'finance' ? (
        <FinanceReportPDF ledgers={financeData.filtered} mitras={mitras} filters={{start: finStart, end: finEnd, mitraId: finMitraId}} totalDebit={financeData.totalDebit} totalCredit={financeData.totalCredit} />
      ) : (
        <OrderReportPDF items={orderData.items} mitras={mitras} filters={{start: ordStart, end: ordEnd, mitraId: ordMitraId, status: ordStatus, type: ordType, productId: ordProduct}} totalQty={orderData.totalQty} totalSubtotal={orderData.totalSubtotal} showSubtotal={user.role !== 'staff'} recap={orderData.productRecap} />
      );
      
      const asPdf = pdf();
      asPdf.updateContainer(doc);
      const blob = await asPdf.toBlob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_${activeTab}_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Gagal mengekspor dokumen PDF. Pastikan data tidak kosong.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header items-end">
        <div>
           <h1 className="page-title">Laporan & Analitik</h1>
           <p className="text-xs text-slate-400 mt-0.5 font-medium">Tinjauan komprehensif keuangan dan aktivitas pesanan.</p>
        </div>
        <button onClick={() => setIsExportModalOpen(true)} className="btn-primary">
          <Download className="w-4 h-4" /> Cetak PDF
        </button>
      </div>

      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 max-w-sm">
         {user.role !== 'staff' && (
           <button 
             onClick={() => setActiveTab('finance')}
             className={`flex-1 py-2 px-4 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'finance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <BarChart3 className="w-4 h-4"/> Keuangan
           </button>
         )}
         <button 
           onClick={() => setActiveTab('order')}
           className={`flex-1 py-2 px-4 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'order' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
         >
           <Receipt className="w-4 h-4"/> Pesanan
         </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'finance' && user.role !== 'staff' && (
          <motion.div key="finance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
             <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Filter Keuangan</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.role === 'admin' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cari Mitra</label>
                      <select value={finMitraId} onChange={e=>setFinMitraId(e.target.value)} className="w-full border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10">
                        <option value="all">Semua Mitra</option>
                        {mitras.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tanggal Mulai</label>
                    <input type="date" value={finStart} onChange={e=>setFinStart(e.target.value)} className="w-full border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tanggal Akhir</label>
                    <input type="date" value={finEnd} onChange={e=>setFinEnd(e.target.value)} className="w-full border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10" />
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Rekap Saldo Piutang Berjalan</span>
                  <p className="text-3xl font-black text-slate-900 mb-6">{formatCurrency(financeData.totalDebit - financeData.totalCredit)}</p>
                  
                  <div className="flex bg-slate-50 rounded-xl p-3 divide-x divide-slate-200 border border-slate-100">
                     <div className="flex-1 px-3">
                        <span className="text-xs text-slate-500 font-bold block mb-1">Total Tagihan</span>
                        <span className="text-lg font-black text-red-650">{formatCurrency(financeData.totalDebit)}</span>
                     </div>
                     <div className="flex-1 px-3">
                        <span className="text-xs text-slate-500 font-bold block mb-1">Total Bayar / Kredit</span>
                        <span className="text-lg font-black text-emerald-600">{formatCurrency(financeData.totalCredit)}</span>
                     </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm h-64 flex flex-col">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Grafik Keuangan</h3>
                   {finStart && finEnd ? (
                     <div className="flex-1 min-h-0">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={financeData.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} width={80} interval="preserveStartEnd" angle={-25} textAnchor="end" />
                            <YAxis tick={{fontSize: 10, fill: '#64748b'}} width={60} tickFormatter={(value) => value >= 1000000 ? `Rp${(value / 1000000).toFixed(0)}Jt` : `Rp${(value / 1000).toFixed(0)}Rb`} />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            <Line name="Debit" type="monotone" dataKey="debit" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 6 }} />
                            <Line name="Kredit" type="monotone" dataKey="credit" stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} />
                          </LineChart>
                       </ResponsiveContainer>
                     </div>
                   ) : (
                     <div className="flex-1 flex items-center justify-center -mt-4">
                       <p className="text-slate-400 font-bold text-sm text-center">
                         <Info className="w-10 h-10 mx-auto mb-3 opacity-20" />
                         Pilih Tanggal Mulai dan Akhir<br/>untuk melihat grafik.
                       </p>
                     </div>
                   )}
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'order' && (
          <motion.div key="order" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
             <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Filter Pesanan</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {user.role === 'admin' && (
                    <div className="col-span-2 md:col-span-1 lg:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cari Mitra</label>
                      <select value={ordMitraId} onChange={e=>setOrdMitraId(e.target.value)} className="w-full border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 text-xs font-bold text-slate-700">
                        <option value="all">Semua Mitra</option>
                        {mitras.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tanggal Mulai</label>
                    <input type="date" value={ordStart} onChange={e=>setOrdStart(e.target.value)} className="w-full border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 text-xs font-bold text-slate-700" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tanggal Akhir</label>
                    <input type="date" value={ordEnd} onChange={e=>setOrdEnd(e.target.value)} className="w-full border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 text-xs font-bold text-slate-700" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tipe Pesanan</label>
                    <select value={ordType} onChange={e=>setOrdType(e.target.value)} className="w-full border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 text-xs font-bold text-slate-700">
                        <option value="all">Semua</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                    <select value={ordStatus} onChange={e=>setOrdStatus(e.target.value)} className="w-full border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 text-xs font-bold text-slate-700">
                        <option value="all">Semua</option>
                        <option value="draft">Draft</option>
                        <option value="waiting_confirmation">Menunggu</option>
                        <option value="confirmed">Dikonfirmasi</option>
                        <option value="processing">Diproses</option>
                        <option value="shipped">Dikirim</option>
                        <option value="returned">Retur</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1 lg:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Produk</label>
                    <select value={ordProduct} onChange={e=>setOrdProduct(e.target.value)} className="w-full border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 text-xs font-bold text-slate-700">
                        <option value="all">Semua Produk</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1 flex flex-col gap-4">
                   <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Volume / Qty</span>
                     <p className="text-3xl font-black text-blue-600 mb-6">{orderData.totalQty} <span className="text-sm text-slate-500 font-bold">Pcs</span></p>
                     
                     {user.role !== 'staff' && (
                       <div>
                         <span className="text-xs text-slate-500 font-bold block mb-1">Estimasi Nilai (Subtotal)</span>
                         <span className="text-xl font-black text-slate-900">{formatCurrency(orderData.totalSubtotal)}</span>
                       </div>
                     )}
                   </div>
                   <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm flex-1 h-48">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Rekap Terlaris</h3>
                      <div className="overflow-y-auto h-32 pr-2 space-y-2">
                        {Object.entries(orderData.productRecap).sort(([,a], [,b]) => (b as number) - (a as number)).map(([name, qty], i) => (
                           <div key={name} className="flex justify-between items-center text-sm">
                              <span className="font-semibold text-slate-700 truncate">{name}</span>
                              <span className="font-bold text-blue-600 ml-2">{qty} Pcs</span>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm h-80 flex flex-col">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Grafik Volume Pesanan</h3>
                   {ordStart && ordEnd ? (
                     <div className="flex-1 min-h-0">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={orderData.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} width={80} interval="preserveStartEnd" angle={-25} textAnchor="end" />
                            <YAxis tick={{fontSize: 10, fill: '#64748b'}} />
                            <Tooltip />
                            <Line type="monotone" dataKey="qty" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                          </LineChart>
                       </ResponsiveContainer>
                     </div>
                   ) : (
                     <div className="flex-1 flex items-center justify-center -mt-4">
                       <p className="text-slate-400 font-bold text-sm text-center">
                         <Info className="w-10 h-10 mx-auto mb-3 opacity-20" />
                         Pilih Tanggal Mulai dan Akhir<br/>untuk melihat grafik.
                       </p>
                     </div>
                   )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-black text-lg text-slate-900">Konfirmasi Ekspor</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Data akan diekspor dalam format PDF sesuai filter aktif.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsExportModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">Batal</button>
              <button onClick={handleExport} disabled={isExporting} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2">
                {isExporting ? 'Menyiapkan...' : <><Download className="w-4 h-4"/> Unduh PDF</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
