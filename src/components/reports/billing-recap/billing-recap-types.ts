export interface BillingRecapFilters {
  startDate: string; // YYYY-MM-DD, '' = tanpa batas awal
  endDate: string; // YYYY-MM-DD, '' = tanpa batas akhir
  mitraId: string; // 'all' atau id mitra
}

export interface BillingRecapRow {
  key: string;
  productId: string;
  productName: string;
  unitPrice: number;
  qty: number;
  total: number;
}

export interface BillingProductQty {
  productId: string;
  productName: string;
  qty: number;
}

export interface BillingRecap {
  rows: BillingRecapRow[];
  productQty: BillingProductQty[];
  totalQty: number;
  totalAmount: number;
  orderCount: number;
}
