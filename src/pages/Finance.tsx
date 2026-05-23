import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { formatCurrency, formatDate } from '../lib/utils';
import { LedgerEntry } from '../types';
import { Plus, Wallet, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function Finance() {
  const { user } = useAuth();
  const mitras = db.getMitras();
  const [ledgers, setLedgers] = useState(db.getLedgers());

  const [selectedMitraId, setSelectedMitraId] = useState<string>(user?.role === 'mitra' ? user.id : 'all');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isChargeOpen, setIsChargeOpen] = useState(false);

  if (!user || user.role === 'staff' || user.role === 'operational') return <div className="p-4 text-red-500">Access denied</div>;

  let displayLedgers = ledgers;
  if (selectedMitraId !== 'all') {
    displayLedgers = ledgers.filter(l => l.mitraId === selectedMitraId);
  }

  const currentSaldo = displayLedgers.reduce((acc, curr) => acc + (curr.direction === 'debit' ? curr.nominal : -curr.nominal), 0);

  const getSourceBadge = (source: string) => {
     switch(source) {
        case 'order': return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">Pesanan</span>;
        case 'payment': return <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">Pembayaran</span>;
        case 'manual': return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">Manual Charge</span>;
        case 'cancellation': return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">Batal Pesanan</span>;
        case 'return': return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">Kredit Retur</span>;
        default: return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">{source}</span>;
     }
  }

  const handleRefreshLedgers = () => {
    setLedgers(db.getLedgers());
  };
  
  const sortedLedgers = displayLedgers.sort((a,b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-xl font-bold tracking-tight text-slate-900">Keuangan & Tagihan</h1>
           <p className="text-[13px] text-slate-500 mt-0.5">Kelola transaksi dan tagihan berjalan</p>
        </div>
        
        {user.role === 'admin' && (
           <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto text-[13px]">
              <select 
                 value={selectedMitraId} 
                 onChange={e=>setSelectedMitraId(e.target.value)}
                 className="w-full sm:w-auto px-3.5 py-2 border border-slate-200/60 rounded-xl bg-white font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                 <option value="all">Semua Mitra</option>
                 {mitras.map(m => <option key={m.id} value={m.userId}>{m.name}</option>)}
              </select>

              <button 
                onClick={() => setIsPaymentOpen(true)}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-medium transition-colors shadow-sm flex justify-center items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Input Pembayaran
              </button>
              
              <button 
                onClick={() => setIsChargeOpen(true)}
                className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl font-medium transition-colors shadow-sm flex justify-center items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Tagihan Manual
              </button>
           </div>
        )}
      </div>

       <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner flex-shrink-0">
             <Wallet className="w-5 h-5" />
           </div>
           <div>
             <p className="text-[13px] font-semibold text-slate-500 mb-0.5">Saldo Berjalan {selectedMitraId === 'all' ? '(Global)' : ''}</p>
             <p className={`text-2xl lg:text-3xl font-bold tracking-tight ${currentSaldo > 0 ? 'text-red-600' : 'text-slate-900'}`}>{formatCurrency(currentSaldo)}</p>
             <p className="text-[11px] font-medium text-slate-400 mt-1 bg-slate-50 inline-block px-1.5 py-0.5 rounded-md">Positif (+) berarti tagihan (mitra berutang).</p>
           </div>
         </div>
      </div>

      {/* Mobile view (< md) */}
      <div className="md:hidden space-y-3">
        <h3 className="font-semibold text-slate-800 px-1 mb-2">Riwayat Transaksi</h3>
        {sortedLedgers.map(l => {
          const isDebit = l.direction === 'debit';
          const mName = mitras.find(m => m.userId === l.mitraId)?.name || 'Unknown';
          return (
            <div key={l.id} className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition">
               <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex justify-center items-center flex-shrink-0 ${isDebit ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isDebit ? <ArrowUpRight className="w-5 h-5"/> : <ArrowDownLeft className="w-5 h-5"/>}
                     </div>
                     <div>
                        <div className="flex flex-col gap-0.5">
                           {user.role === 'admin' && selectedMitraId === 'all' && <span className="font-semibold text-slate-900 text-sm leading-tight">{mName}</span>}
                           <span className="text-xs text-slate-500 font-medium">{formatDate(l.createdAt)}</span>
                        </div>
                     </div>
                  </div>
                  <div>
                     {getSourceBadge(l.source)}
                  </div>
               </div>
               <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-sm text-slate-600 flex-1 truncate pr-4" title={l.description}>{l.description}</p>
                  <p className={`text-sm font-bold tracking-tight whitespace-nowrap ${isDebit ? 'text-red-600' : 'text-emerald-600'}`}>
                     {isDebit ? '+' : '-'}{formatCurrency(l.nominal)}
                  </p>
               </div>
            </div>
          )
        })}
        {sortedLedgers.length === 0 && (
          <div className="bg-white border text-center p-8 rounded-2xl mt-4">
             <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2"/>
             <p className="text-slate-500 font-medium text-sm">Belum ada transaksi tercatat.</p>
          </div>
        )}
      </div>

      {/* Desktop view (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-900 font-semibold text-[12px]">
              <tr>
                <th className="px-5 py-3">Waktu</th>
                {user.role === 'admin' && selectedMitraId === 'all' && <th className="px-5 py-3">Mitra</th>}
                <th className="px-5 py-3">Sumber</th>
                <th className="px-5 py-3">Deskripsi</th>
                <th className="px-5 py-3 text-right">Debit (+)</th>
                <th className="px-5 py-3 text-right">Kredit (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedLedgers.map(l => {
                const isDebit = l.direction === 'debit';
                const mName = mitras.find(m => m.userId === l.mitraId)?.name || 'Unknown';
                return (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                    {user.role === 'admin' && selectedMitraId === 'all' && <td className="px-5 py-3 font-semibold text-slate-900">{mName}</td>}
                    <td className="px-5 py-3">{getSourceBadge(l.source)}</td>
                    <td className="px-5 py-3 max-w-[200px] truncate" title={l.description}>{l.description}</td>
                    <td className="px-5 py-3 text-right font-semibold text-red-600">{isDebit ? formatCurrency(l.nominal) : '-'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600">{!isDebit ? formatCurrency(l.nominal) : '-'}</td>
                  </tr>
                );
              })}
              {sortedLedgers.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Belum ada transaksi tercatat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPaymentOpen && <PaymentModal onClose={()=>setIsPaymentOpen(false)} onSave={handleRefreshLedgers} />}
      {isChargeOpen && <ChargeModal onClose={()=>setIsChargeOpen(false)} onSave={handleRefreshLedgers} />}
    </div>
  );
}

function PaymentModal({ onClose, onSave }: { onClose: () => void, onSave: () => void }) {
  const [mitra, setMitra] = useState(db.getMitras()[0]?.userId || '');
  const [nominal, setNominal] = useState('');
  const [method, setMethod] = useState('transfer');
  const [ref, setRef] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: LedgerEntry = {
       id: crypto.randomUUID(),
       mitraId: mitra,
       source: 'payment',
       direction: 'credit',
       nominal: parseInt(nominal.replace(/\D/g, '')),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 lg:p-8 animate-in slide-in-from-bottom-4">
        <h2 className="text-xl font-bold tracking-tight mb-6">Input Pembayaran (KREDIT)</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mitra</label>
             <select required value={mitra} onChange={e=>setMitra(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                {db.getMitras().map(m=><option key={m.id} value={m.userId}>{m.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nominal (Rp)</label>
             <input required type="text" value={nominal} onChange={e=>setNominal(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0" />
          </div>
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-1.5">Metode</label>
             <select required value={method} onChange={e=>setMethod(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="transfer">Transfer</option>
                <option value="cash">Cash</option>
                <option value="qris">QRIS</option>
                <option value="lainnya">Lainnya</option>
             </select>
          </div>
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-1.5">Referensi</label>
             <input required value={ref} onChange={e=>setRef(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Mis. INV001" />
          </div>
          <div className="pt-6 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">Batal</button>
             <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-sm">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChargeModal({ onClose, onSave }: { onClose: () => void, onSave: () => void }) {
  const [mitra, setMitra] = useState(db.getMitras()[0]?.userId || '');
  const [nominal, setNominal] = useState('');
  const [desc, setDesc] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: LedgerEntry = {
       id: crypto.randomUUID(),
       mitraId: mitra,
       source: 'manual',
       direction: 'debit',
       nominal: parseInt(nominal.replace(/\D/g, '')),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 lg:p-8 animate-in slide-in-from-bottom-4">
        <h2 className="text-xl font-bold tracking-tight mb-6">Manual Charge (DEBIT)</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mitra</label>
             <select required value={mitra} onChange={e=>setMitra(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                {db.getMitras().map(m=><option key={m.id} value={m.userId}>{m.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nominal (Rp)</label>
             <input required type="text" value={nominal} onChange={e=>setNominal(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0" />
          </div>
          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi Tagihan</label>
             <input required value={desc} onChange={e=>setDesc(e.target.value)} className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Keterangan tagihan" />
          </div>
          <div className="pt-6 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">Batal</button>
             <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors shadow-sm">Tambahkan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
