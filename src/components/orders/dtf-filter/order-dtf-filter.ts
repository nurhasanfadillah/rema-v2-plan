import type { Order } from '../../../types';
import type { DtfFilterCounts, DtfFilterValue, OrderDtfCategory } from './dtf-filter-types';

// Aturan "belum cetak" sama persis dengan guard Press Sablon di OrderDetail: item custom dengan
// dtfStatus 'belum_cetak', null, atau kosong (kolom DB nullable, item polos/data lama bisa null).
// Sumber kebenaran = items[].isCustomLogo, bukan order.hasCustomLogo.
export function getOrderDtfCategory(order: Pick<Order, 'items'>): OrderDtfCategory {
  const customItems = order.items.filter(item => item.isCustomLogo);
  if (customItems.length === 0) return 'tanpa_dtf';
  const hasPendingItem = customItems.some(item => (item.dtfStatus || 'belum_cetak') === 'belum_cetak');
  return hasPendingItem ? 'belum_cetak' : 'sudah_cetak';
}

export function filterOrdersByDtf<T extends Pick<Order, 'items'>>(orders: T[], value: DtfFilterValue): T[] {
  if (value === 'all') return orders;
  return orders.filter(order => getOrderDtfCategory(order) === value);
}

export function countOrdersByDtf(orders: Pick<Order, 'items'>[]): DtfFilterCounts {
  const counts: DtfFilterCounts = { all: orders.length, belum_cetak: 0, sudah_cetak: 0, tanpa_dtf: 0 };
  for (const order of orders) {
    counts[getOrderDtfCategory(order)] += 1;
  }
  return counts;
}
