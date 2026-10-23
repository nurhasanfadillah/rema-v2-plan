import type { MitraStats, MitraStatsLedgerEntry, MitraStatsOrder } from './mitra-export-types';

// Satu sumber angka untuk halaman Manajemen Mitra dan PDF-nya; rumus sama dengan getMitraStats lama di Mitras.tsx.
export function calculateMitraStats(
  mitraId: string,
  orders: MitraStatsOrder[],
  ledgerEntries: MitraStatsLedgerEntry[],
): MitraStats {
  const countedOrders = orders.filter(order => order.mitraId === mitraId && order.status !== 'cancelled');
  const totalSales = countedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  const saldoPiutang = ledgerEntries
    .filter(entry => entry.mitraId === mitraId)
    .reduce((balance, entry) => balance + (entry.direction === 'debit' ? entry.nominal : -entry.nominal), 0);

  return { totalOrders: countedOrders.length, totalSales, saldoPiutang };
}
