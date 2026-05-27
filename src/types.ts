export type Role = 'admin' | 'staff' | 'operational' | 'mitra';

export interface User {
  id: string;
  name: string;
  phone: string;
  passwordHash: string; // Plaintext for local dev simulation
  role: Role;
  isActive: boolean;
  mustChangePassword?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: number;
}

export interface Mitra {
  id: string;
  userId: string;
  name: string;
  creditLimit: number | null;
  isArchived: boolean;
  logoUrl?: string;
  priorityLimit?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isArchived: boolean;
}

export type OrderStatus = 'draft' | 'waiting_confirmation' | 'confirmed' | 'processing' | 'pressing' | 'packing' | 'shipped' | 'returned' | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  priceSnapshot: number;
  qty: number;
  isCustomLogo: boolean;
  dtfStatus?: 'belum_cetak' | 'sudah_cetak';
  previewUrl?: string;
  designUrl?: string;
  previewUrls?: string[];
  designUrls?: string[];
  designNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // 6 chars
  mitraId: string;
  type: 'online' | 'offline';
  resiUrl?: string; // Online
  recipientName?: string; // Offline
  recipientPhone?: string; // Offline
  recipientAddress?: string; // Offline
  items: OrderItem[];
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  hasCustomLogo: boolean;
  totalAmount: number;
  totalQty: number;
  isBilled: boolean; // Flag if it has reached Packing
  creatorId?: string;
}

export type LedgerSource = 'order' | 'payment' | 'manual' | 'cancellation' | 'return';
export type LedgerDirection = 'debit' | 'credit';

export interface LedgerEntry {
  id: string;
  mitraId: string;
  source: LedgerSource;
  direction: LedgerDirection;
  nominal: number;
  description: string;
  createdAt: number;
  referenceId?: string; // orderId if applicable
  attachmentUrl?: string; // For payment proof
  paymentMethod?: string;
  referenceNumber?: string;
}

export type RequestStatus = 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'resolved' | 'cancelled';

export interface ActionRequest {
  id: string;
  type: 'cancellation' | 'return';
  orderId: string;
  mitraId: string;
  reason: string;
  attachmentUrl?: string;
  status: RequestStatus;
  creditAmount?: number; // Only for returns
  createdAt: number;
  updatedAt: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: number;
}

export interface OrderPriority {
  id: string;
  orderId: string;
  mitraId: string;
  mitraName: string;
  orderNumber: string;
  totalQty: number;
  notes: string | null;
  createdAt: number;
  createdBy: string;
}
