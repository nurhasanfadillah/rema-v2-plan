export type OrderDtfCategory = 'belum_cetak' | 'sudah_cetak' | 'tanpa_dtf';

export type DtfFilterValue = 'all' | OrderDtfCategory;

export type DtfFilterCounts = Record<DtfFilterValue, number>;
