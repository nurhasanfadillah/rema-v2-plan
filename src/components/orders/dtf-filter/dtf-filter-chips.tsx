import { Printer } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { DtfFilterCounts, DtfFilterValue } from './dtf-filter-types';

export interface DtfFilterChipsProps {
  value: DtfFilterValue;
  counts: DtfFilterCounts;
  onChange: (value: DtfFilterValue) => void;
}

const DTF_FILTER_OPTIONS: { value: DtfFilterValue; label: string }[] = [
  { value: 'all', label: 'Semua DTF' },
  { value: 'belum_cetak', label: 'Belum Cetak' },
  { value: 'sudah_cetak', label: 'Sudah Cetak' },
  { value: 'tanpa_dtf', label: 'Tanpa DTF' },
];

export function DtfFilterChips({ value, counts, onChange }: DtfFilterChipsProps) {
  return (
    <div role="group" aria-label="Filter status cetak DTF" className="flex flex-wrap items-center gap-2">
      <Printer className="w-4 h-4 text-slate-400 shrink-0" />
      {DTF_FILTER_OPTIONS.map(option => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition-colors',
              isActive
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            )}
          >
            {option.label}
            <span className={cn('text-[11px] tabular-nums', isActive ? 'text-blue-300' : 'text-slate-500')}>
              {counts[option.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
