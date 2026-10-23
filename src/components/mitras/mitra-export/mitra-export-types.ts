import type { LedgerEntry, Mitra, Order, User } from '../../../types';

// Subset field yang dibaca fungsi hitung, agar state halaman (termasuk SafeUser) langsung bisa dipakai.
export type MitraStatsOrder = Pick<Order, 'mitraId' | 'status' | 'totalAmount'>;
export type MitraStatsLedgerEntry = Pick<LedgerEntry, 'mitraId' | 'direction' | 'nominal'>;
export type MitraSummaryUser = Pick<User, 'id' | 'phone'>;

export interface MitraStats {
  totalOrders: number; // pesanan selain 'cancelled' (draft dan returned ikut terhitung)
  totalSales: number; // Σ totalAmount pesanan di atas
  saldoPiutang: number; // Σ debit - Σ kredit seluruh ledger mitra
}

export interface MitraSummaryRow extends MitraStats {
  mitraId: string;
  name: string;
  phone: string; // '' bila mitra tidak punya akun
  creditLimit: number | null; // null = Unlimited
  isArchived: boolean;
}

export interface MitraSummary {
  rows: MitraSummaryRow[];
  totalMitra: number;
  activeCount: number;
  archivedCount: number;
  totalOrders: number;
  totalSales: number;
  totalSaldoPiutang: number;
}

export interface MitraSummaryInput {
  mitras: Mitra[];
  users: MitraSummaryUser[];
  orders: MitraStatsOrder[];
  ledgers: MitraStatsLedgerEntry[];
}

export type MitraDetailMitra = Pick<Mitra, 'id' | 'name' | 'creditLimit' | 'isArchived'>;
export type MitraDetailAccount = Pick<User, 'name' | 'phone'>;

export interface MitraDetailInput {
  mitra: MitraDetailMitra;
  account: MitraDetailAccount | undefined; // akun penanggung jawab; undefined bila mitra tidak punya akun
  stats: MitraStats; // sama dengan yang ditampilkan panel, tidak dihitung ulang
}

export interface MitraDetail extends MitraStats {
  mitraId: string;
  name: string;
  isArchived: boolean;
  creditLimit: number | null; // null = Unlimited
  responsibleName: string; // '' bila mitra tidak punya akun
  phone: string; // '' bila mitra tidak punya akun
}
