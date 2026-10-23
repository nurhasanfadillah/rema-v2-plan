import { calculateMitraStats } from './calculate-mitra-stats';
import type { MitraSummary, MitraSummaryInput, MitraSummaryRow } from './mitra-export-types';

export function buildMitraSummary({ mitras, users, orders, ledgers }: MitraSummaryInput): MitraSummary {
  const rows = mitras
    .map((mitra): MitraSummaryRow => ({
      mitraId: mitra.id,
      name: mitra.name,
      phone: users.find(user => user.id === mitra.userId)?.phone ?? '',
      creditLimit: mitra.creditLimit,
      isArchived: mitra.isArchived,
      ...calculateMitraStats(mitra.id, orders, ledgers),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));

  const archivedCount = rows.filter(row => row.isArchived).length;

  return {
    rows,
    totalMitra: rows.length,
    activeCount: rows.length - archivedCount,
    archivedCount,
    totalOrders: rows.reduce((sum, row) => sum + row.totalOrders, 0),
    totalSales: rows.reduce((sum, row) => sum + row.totalSales, 0),
    totalSaldoPiutang: rows.reduce((sum, row) => sum + row.saldoPiutang, 0),
  };
}
