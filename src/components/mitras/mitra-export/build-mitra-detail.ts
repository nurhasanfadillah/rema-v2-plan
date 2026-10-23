import type { MitraDetail, MitraDetailInput } from './mitra-export-types';

// Hanya memetakan: statistik datang dari stats yang sama dengan yang ditampilkan panel, tidak dihitung ulang.
export function buildMitraDetail({ mitra, account, stats }: MitraDetailInput): MitraDetail {
  return {
    mitraId: mitra.id,
    name: mitra.name,
    isArchived: mitra.isArchived,
    creditLimit: mitra.creditLimit,
    responsibleName: account?.name ?? '',
    phone: account?.phone ?? '',
    totalOrders: stats.totalOrders,
    totalSales: stats.totalSales,
    saldoPiutang: stats.saldoPiutang,
  };
}
