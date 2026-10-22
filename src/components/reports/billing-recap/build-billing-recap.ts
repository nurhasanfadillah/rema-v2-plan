import type { LedgerEntry, Order } from '../../../types';
import type { BillingRecap, BillingRecapFilters, BillingRecapRow } from './billing-recap-types';

interface BilledOrder {
  order: Order;
  billedAt: number;
}

export function buildBillingRecap(
  orders: Order[],
  ledgers: LedgerEntry[],
  filters: BillingRecapFilters,
): BillingRecap {
  // Tanggal tagihan = waktu entri ledger debit source 'order' (dibuat saat pesanan masuk Packing)
  const billedAtByOrderId = new Map<string, number>();
  for (const ledger of ledgers) {
    if (ledger.source !== 'order' || ledger.direction !== 'debit' || !ledger.referenceId) continue;
    const existing = billedAtByOrderId.get(ledger.referenceId);
    if (existing === undefined || ledger.createdAt < existing) {
      billedAtByOrderId.set(ledger.referenceId, ledger.createdAt);
    }
  }

  const rangeStart = filters.startDate ? new Date(filters.startDate).setHours(0, 0, 0, 0) : null;
  const rangeEnd = filters.endDate ? new Date(filters.endDate).setHours(23, 59, 59, 999) : null;

  const billedOrders: BilledOrder[] = [];
  for (const order of orders) {
    if (!order.isBilled) continue;
    if (filters.mitraId !== 'all' && order.mitraId !== filters.mitraId) continue;
    const billedAt = billedAtByOrderId.get(order.id);
    if (billedAt === undefined) continue;
    if (rangeStart !== null && billedAt < rangeStart) continue;
    if (rangeEnd !== null && billedAt > rangeEnd) continue;
    billedOrders.push({ order, billedAt });
  }
  billedOrders.sort((a, b) => a.billedAt - b.billedAt);

  const rowsByKey = new Map<string, BillingRecapRow>();
  for (const { order } of billedOrders) {
    for (const item of order.items) {
      const key = `${item.productId}::${item.priceSnapshot}`;
      const subtotal = item.qty * item.priceSnapshot;
      const row = rowsByKey.get(key);
      if (row) {
        row.qty += item.qty;
        row.total += subtotal;
        row.productName = item.productName;
      } else {
        rowsByKey.set(key, {
          key,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.priceSnapshot,
          qty: item.qty,
          total: subtotal,
        });
      }
    }
  }

  const rows = [...rowsByKey.values()].sort(
    (a, b) => a.productName.localeCompare(b.productName, 'id') || a.unitPrice - b.unitPrice,
  );

  return {
    rows,
    totalQty: rows.reduce((sum, row) => sum + row.qty, 0),
    totalAmount: rows.reduce((sum, row) => sum + row.total, 0),
    orderCount: billedOrders.length,
  };
}
