import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { formatCurrency, formatDate } from '../lib/utils';
import { LedgerEntry } from '../types';
import { Plus, Wallet, FileText, ArrowDownLeft, ArrowUpRight, Scale, TrendingDown, BookOpen, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Finance() {
  const { user } = useAuth();
  const mitras = db.getMitras();
  const [ledgers, setLedgers] = useState(db.getLedgers());

  const activeMitra = mitras.find(m => m.userId === user?.id);
  const [selectedMitraId, setSelectedMitraId] = useState<string>(
    user?.role === 'mitra' ? (activeMitra?.id || '') : 'all'
  );
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isChargeOpen, setIsChargeOpen] = useState(false);

  if (!user || user.role === 'staff' || user.role === 'operational') return <div className="p-8 text-center text-red-500 font-bold">Akses ditolak</div>;

  let displayLedgers = ledgers;
  if (selectedMitraId !== 'all') {
    displayLedgers = ledgers.filter(l => l.mitraId === selectedMitraId);
  }

  const currentSaldo = displayLedgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);

  const getSourceBadge = (source: string) => {
     switch(source) {
        case 'order': return <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Pesanan</span>;
        case 'payment': return <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Pembahasan</span>;
        case 'manual': return <span className="bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Manual Charge</span>;
        case 'cancellation': return <span className="bg-red-50 border border-red-100 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Batal Pesanan</span>;
        case 'return': return <span className="bg-purple-50 border border-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Kredit Retur</span>;
        default: return <span className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">{source}</span>;
     }
  }

  const handleRefreshLedgers = () => {
    setLedgers(db.getLedgers());
  };
  
  const sortedLedgers = displayLedgers.sort((a,b) => b.createdAt - a.createdAt);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  };

  const formattedNominal = (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 lg:space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-150 rounded-md px-2 py-0.5 w-max mb-1.5">
             <Scale className="w-3.5 h-3.5" /> Jurnal & Buku Besar
           </div>
           <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Keuangan & Tagihan Mitra</h1>
           <p className="text-[13px] text-slate-500 mt-0.5 font-semibold">Kelola pencatatan aliran masuk pembayaran, kredit retur, dan balance berjalan.</p>
        </div>
        
        {user.role === 'admin' && (
           <div className="flex flex-wrap gap-2.5 w-full sm:w-auto text-[13px]">
              <select 
                 value={selectedMitraId} 
                 onChange={e=>setSelectedMitraId(e.target.value)}
                 className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 rounded-2xl bg-white font-extrabold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-xs"
              >
                 <option value="all">Semua Mitra Aktif</option>
                 {mitras.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <button 
                onClick={() => setIsPaymentOpen(true)}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-505 text-white px-4 py-2.5 rounded-2xl font-bold transition-all shadow-md shadow-emerald-500/10 flex justify-center items-center gap-1.5 active:scale-95 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" /> Input Pembayaran
              </button>
              
              <button 
                onClick={() => setIsChargeOpen(true)}
                className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl font-bold transition-all shadow-md flex justify-center items-center gap-1.5 active:scale-95 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" /> Tagihan Manual
              </button>
           </div>
        )}
      </div>

       <motion.div 
         variants={itemVariants} 
         className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03),0_8px_16px_-8px_rgba(0,0,0,0.01)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
       >
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner flex-shrink-0">
             <Wallet className="w-5.5 h-5.5" />
           </div>
           <div>
             <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Sisa saldo piutang berjalan {selectedMitraId === 'all' ? '(Global)' : ''}</span>
             <p className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${currentSaldo > 0 ? 'text-red-650' : 'text-slate-900'}`}>{formatCurrency(currentSaldo)}</p>
           </div>
         </div>
         <div className="bg-amber-50/70 border border-amber-100 text-amber-800 text-[11px] font-semibold px-3 py-2 rounded-2xl max-w-sm">
           ⚠️ Positif (+) melambangkan piutang berjalan (saldo talangan / utang mitra). Jika saldo negatif, mitra berposisi deposit.
         </div>
       </motion.div>

      {/* Mobile view (< md) */}
      <div className="md:hidden space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm px-1 flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> Riwayat Buku Jurnal</h3>
        {sortedLedgers.map(l => {
          const isDebit = l.direction === 'debit';
          const mName = mitras.find(m => m.id === l.mitraId)?.name || 'Unknown';
          return (
            <motion.div 
              variants={itemVariants}
              key={l.id} 
              className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm relative"
            >
               <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                     <div className={`w-9 h-9 rounded-xl flex justify-center items-center flex-shrink-0 border ${isDebit ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        {isDebit ? <ArrowUpRight className="w-4.5 h-4.5"/> : <ArrowDownLeft className="w-4.5 h-4.5"/>}
                     </div>
                     <div>
                        <div className="flex flex-col gap-0.5">
                           {user.role === 'admin' && selectedMitraId === 'all' && <span className="font-extrabold text-slate-900 text-sm leading-tight">{mName}</span>}
                           <span className="text-[10px] text-slate-400 font-bold tracking-wider">{formatDate(l.createdAt)}</span>
                        </div>
                     </div>
                  </div>
                  <div>
                     {getSourceBadge(l.source)}
                  </div>
               </div>
               <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                  <p className="text-xs text-slate-600 flex-1 truncate pr-4 font-bold" title={l.description}>{l.description}</p>
                  <p className={`text-sm font-black tracking-tight whitespace-nowrap ${isDebit ? 'text-red-650' : 'text-emerald-700'}`}>
                     {isDebit ? '+' : '-'}{formatCurrency(l.nominal)}
                  </p>
               </div>
            </motion.div>
          )
        })}
        {sortedLedgers.length === 0 && (
          <motion.div variants={itemVariants} className="bg-white border-2 border-dashed text-center p-10 rounded-3xl mt-4">
             <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3"/>
             <p className="text-slate-800 font-bold text-sm">Belum ada transaksi tercatat.</p>
          </motion.div>
        )}
      </div>

      {/* Desktop view (>= md) */}
      <motion.div 
        variants={itemVariants}
        className="hidden md:block bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03),0_8px_20px_-8px_rgba(0,0,0,0.01)] border border-slate-200/60 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-900 font-extrabold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                {user.role === 'admin' && selectedMitraId === 'all' && <th className="px-6 py-4">Mitra</th>}
                <th className="px-6 py-4">Sumber Kegiatan</th>
                <th className="px-6 py-4 font-bold">Deskripsi Ledger</th>
                <th className="px-6 py-4 text-right">Debit (+)</th>
                <th className="px-6 py-4 text-right">Kredit (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {sortedLedgers.map(l => {
                const isDebit = l.direction === 'debit';
                const mName = mitras.find(m => m.id === l.mitraId)?.name || 'Unknown';
                return (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-400">{formatDate(l.createdAt)}</td>
                    {user.role === 'admin' && selectedMitraId === 'all' && <td className="px-6 py-4 font-extrabold text-slate-900">{mName}</td>}
                    <td className="px-6 py-4">{getSourceBadge(l.source)}</td>
                    <td className="px-6 py-4 font-medium max-w-[220px] truncate" title={l.description}>{l.description}</td>
                    <td className="px-6 py-4 text-right font-extrabold text-red-650">{isDebit ? formatCurrency(l.nominal) : '-'}</td>
                    <td className="px-6 py-4 text-right font-extrabold text-emerald-700">{!isDebit ? formatCurrency(l.nominal) : '-'}</td>
                  </tr>
                );
              })}
              {sortedLedgers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                    <BookOpen className="w-10 h-10 text-slate-250 mx-auto mb-3" />
                    Belum ada aliran kas masuk/keluar di database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {isPaymentOpen && <PaymentModal onClose={()=>setIsPaymentOpen(false)} onSave={handleRefreshLedgers} formattedNominal={formattedNominal} />}
      {isChargeOpen && <ChargeModal onClose={()=>setIsChargeOpen(false)} onSave={handleRefreshLedgers} formattedNominal={formattedNominal} />}
    </motion.div>
  );
}

function PaymentModal({ onClose, onSave, formattedNominal }: { onClose: () => void, onSave: () => void, formattedNominal: (v: string) => string }) {
  const [mitra, setMitra] = useState(db.getMitras()[0]?.id || '');
  const [nominalDisplay, setNominalDisplay] = useState('');
  const [method, setMethod] = useState('transfer');
  const [ref, setRef] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseInt(nominalDisplay.replace(/\D/g, ''));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      toast.error('Masukan nominal yang valid!');
      return;
    }
    const entry: LedgerEntry = {
       id: crypto.randomUUID(),
       mitraId: mitra,
       source: 'payment',
       direction: 'credit',
       nominal: cleanNum,
       description: `Pembayaran ${method.toUpperCase()} - Ref: ${ref}`,
       createdAt: Date.now()
     };
    db.saveLedgers([entry, ...db.getLedgers()]);
    db.addAuditLog({ userId: 'admin', action: 'PAYMENT_ADDED', details: `Nominal: ${entry.nominal}` });
    toast.success('Pembayaran berhasil ditambahkan!');
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 lg:p-8 animate-in slide-in-from-bottom-8">
        <h2 className="text-lg font-black tracking-tight text-slate-900 mb-6 flex items-center gap-2">
          <span>💳</span> Input Pengurangan Piutang (Kredit)
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pilih Mitra Partner</label>
             <select required value={mitra} onChange={e=>setMitra(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 text-xs">
                {db.getMitras().map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nominal Setoran (Rp)</label>
             <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
               <input 
                 required 
                 type="text" 
                 value={nominalDisplay} 
                 onChange={e=>setNominalDisplay(formattedNominal(e.target.value))} 
                 className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-extrabold text-slate-800 text-sm" 
                 placeholder="0" 
               />
             </div>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Metode Bayar</label>
             <select required value={method} onChange={e=>setMethod(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 text-xs">
                <option value="transfer">Bank Transfer (Manual)</option>
                <option value="cash">Setor Tunai (Cash)</option>
                <option value="qris">E-Wallet / QRIS</option>
                <option value="lainnya">Lainnya</option>
             </select>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kode Referensi</label>
             <input required value={ref} onChange={e=>setRef(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 text-xs" placeholder="Mis. TF-BCA-928" />
          </div>
          <div className="pt-6 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all text-xs cursor-pointer">Batal</button>
             <button type="submit" className="px-5 py-3 bg-emerald-600 hover:bg-emerald-550 text-white rounded-2xl font-bold transition-all shadow-md shadow-emerald-555/10 text-xs cursor-pointer active:scale-95">Simpan Kredit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChargeModal({ onClose, onSave, formattedNominal }: { onClose: () => void, onSave: () => void, formattedNominal: (v: string) => string }) {
  const [mitra, setMitra] = useState(db.getMitras()[0]?.id || '');
  const [nominalDisplay, setNominalDisplay] = useState('');
  const [desc, setDesc] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseInt(nominalDisplay.replace(/\D/g, ''));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      toast.error('Masukan nominal yang valid!');
      return;
    }
    const entry: LedgerEntry = {
       id: crypto.randomUUID(),
       mitraId: mitra,
       source: 'manual',
       direction: 'debit',
       nominal: cleanNum,
       description: desc,
       createdAt: Date.now()
    };
    db.saveLedgers([entry, ...db.getLedgers()]);
    db.addAuditLog({ userId: 'admin', action: 'MANUAL_CHARGE_ADDED', details: `Nominal: ${entry.nominal}` });
    toast.success('Manual charge (debit) berhasil ditambahkan!');
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 lg:p-8 animate-in slide-in-from-bottom-8">
        <h2 className="text-lg font-black tracking-tight text-slate-900 mb-6 flex items-center gap-2">
          <span>📈</span> Input Tambahan Piutang (Debit)
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pilih Mitra Partner</label>
             <select required value={mitra} onChange={e=>setMitra(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 text-xs">
                {db.getMitras().map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nominal Penambahan Tagihan (Rp)</label>
             <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
               <input 
                 required 
                 type="text" 
                 value={nominalDisplay} 
                 onChange={e=>setNominalDisplay(formattedNominal(e.target.value))} 
                 className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-extrabold text-slate-800 text-sm" 
                 placeholder="0" 
               />
             </div>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Uraian Deskripsi Tagihan</label>
             <input required value={desc} onChange={e=>setDesc(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 text-xs" placeholder="Mis. Denda Keterlambatan Kirim, Penambahan Layanan" />
          </div>
          <div className="pt-6 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all text-xs cursor-pointer">Batal</button>
             <button type="submit" className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-md text-xs cursor-pointer active:scale-95">Tambahkan Tagihan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
