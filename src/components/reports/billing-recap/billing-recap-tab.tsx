import { FileText, Filter } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import type { Mitra } from '../../../types';
import type { BillingRecap, BillingRecapFilters } from './billing-recap-types';

export interface BillingRecapTabProps {
  filters: BillingRecapFilters;
  recap: BillingRecap;
  mitras: Mitra[];
  canSelectMitra: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onMitraIdChange: (value: string) => void;
}

const LABEL_CLASS = 'text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1';
const FIELD_CLASS =
  'w-full border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10';

export function BillingRecapTab({
  filters,
  recap,
  mitras,
  canSelectMitra,
  onStartDateChange,
  onEndDateChange,
  onMitraIdChange,
}: BillingRecapTabProps) {
  return (
    <>
      <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-700">Filter Tagihan</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {canSelectMitra && (
            <div>
              <label className={LABEL_CLASS}>Cari Mitra</label>
              <select value={filters.mitraId} onChange={e => onMitraIdChange(e.target.value)} className={FIELD_CLASS}>
                <option value="all">Semua Mitra</option>
                {mitras.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={LABEL_CLASS}>Tanggal Mulai</label>
            <input type="date" value={filters.startDate} onChange={e => onStartDateChange(e.target.value)} className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Tanggal Akhir</label>
            <input type="date" value={filters.endDate} onChange={e => onEndDateChange(e.target.value)} className={FIELD_CLASS} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
          <span className={LABEL_CLASS}>Total Qty</span>
          <p className="text-3xl font-black text-blue-600">
            {recap.totalQty} <span className="text-sm text-slate-500 font-bold">Pcs</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
          <span className={LABEL_CLASS}>Total Tagihan</span>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(recap.totalAmount)}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">dari {recap.orderCount} pesanan</p>
        </div>
      </div>

      {recap.rows.length === 0 ? (
        <div className="bg-white border-2 border-dashed text-center p-10 rounded-3xl">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-800 font-bold text-sm">Belum ada pesanan tertagih</p>
          <p className="text-slate-400 text-xs mt-1">Ubah filter atau tunggu pesanan masuk tahap Packing.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-900 font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Harga Satuan</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {recap.rows.map(row => (
                    <tr key={row.key} className="hover:bg-slate-50/70 transition-colors duration-200">
                      <td className="px-4 py-2.5 font-extrabold text-slate-900">{row.productName}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{row.qty}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(row.unitPrice)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-extrabold text-slate-900">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200/80 font-extrabold text-slate-900">
                  <tr>
                    <td className="px-4 py-3 text-[10px] uppercase tracking-wider">Total</td>
                    <td className="px-4 py-3 text-right tabular-nums">{recap.totalQty}</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(recap.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-2">
            {recap.rows.map(row => (
              <div
                key={row.key}
                className="bg-white rounded-xl border border-slate-200/60 border-l-4 border-l-blue-500 p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm break-words">{row.productName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{row.qty} Pcs × {formatCurrency(row.unitPrice)}</p>
                </div>
                <p className="font-extrabold text-slate-900 text-sm tabular-nums whitespace-nowrap">{formatCurrency(row.total)}</p>
              </div>
            ))}
            <div className="bg-slate-50 rounded-xl border border-slate-200/60 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-xs text-slate-500 mt-0.5">{recap.totalQty} Pcs</p>
              </div>
              <p className="font-extrabold text-slate-900 text-sm tabular-nums">{formatCurrency(recap.totalAmount)}</p>
            </div>
          </div>
        </>
      )}

      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
        Hanya pesanan yang sudah tercatat tagihan (Packing atau lebih; batal/retur tidak termasuk). Periode mengacu tanggal tagihan tercatat. Debit manual tidak termasuk dalam rekap.
      </p>
    </>
  );
}
