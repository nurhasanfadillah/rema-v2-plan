import { pgTable, text, integer, boolean, bigint, real, jsonb } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin' | 'staff' | 'operational' | 'mitra'
  isActive: boolean('is_active').notNull().default(true),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: bigint('locked_until', { mode: 'number' }),
});

export const mitras = pgTable('mitras', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  creditLimit: real('credit_limit'),
  isArchived: boolean('is_archived').notNull().default(false),
  logoUrl: text('logo_url'),
  priorityLimit: integer('priority_limit').notNull().default(1),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: real('price').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  isArchived: boolean('is_archived').notNull().default(false),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  mitraId: text('mitra_id').notNull().references(() => mitras.id),
  type: text('type').notNull(), // 'online' | 'offline'
  resiUrl: text('resi_url'),
  recipientName: text('recipient_name'),
  recipientPhone: text('recipient_phone'),
  recipientAddress: text('recipient_address'),
  status: text('status').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
  hasCustomLogo: boolean('has_custom_logo').notNull().default(false),
  totalAmount: real('total_amount').notNull().default(0),
  totalQty: integer('total_qty').notNull().default(0),
  isBilled: boolean('is_billed').notNull().default(false),
  creatorId: text('creator_id'),
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  priceSnapshot: real('price_snapshot').notNull(),
  qty: integer('qty').notNull(),
  isCustomLogo: boolean('is_custom_logo').notNull().default(false),
  dtfStatus: text('dtf_status'), // 'belum_cetak' | 'sudah_cetak'
  previewUrl: text('preview_url'),
  designUrl: text('design_url'),
  previewUrls: jsonb('preview_urls').$type<string[]>().notNull().default([]),
  designUrls: jsonb('design_urls').$type<string[]>().notNull().default([]),
  designNotes: text('design_notes'),
});

export const ledgers = pgTable('ledgers', {
  id: text('id').primaryKey(),
  mitraId: text('mitra_id').notNull().references(() => mitras.id),
  source: text('source').notNull(), // 'order' | 'payment' | 'manual' | 'cancellation' | 'return'
  direction: text('direction').notNull(), // 'debit' | 'credit'
  nominal: real('nominal').notNull(),
  description: text('description').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  referenceId: text('reference_id'),
  attachmentUrl: text('attachment_url'),
  paymentMethod: text('payment_method'),
  referenceNumber: text('reference_number'),
});

export const actionRequests = pgTable('action_requests', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'cancellation' | 'return'
  orderId: text('order_id').notNull().references(() => orders.id),
  mitraId: text('mitra_id').notNull().references(() => mitras.id),
  reason: text('reason').notNull(),
  attachmentUrl: text('attachment_url'),
  status: text('status').notNull(),
  creditAmount: real('credit_amount'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const orderPriorities = pgTable('order_priorities', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  mitraId: text('mitra_id').notNull().references(() => mitras.id),
  notes: text('notes'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  createdBy: text('created_by').notNull(),
});

export const priceCalculations = pgTable('price_calculations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  productId: text('product_id'),
  productName: text('product_name').notNull(),
  hargaPokok: real('harga_pokok').notNull(),
  qty: integer('qty').notNull().default(1),
  margin: real('margin').notNull(),
  adminMP: real('admin_mp').notNull(),
  additionals: jsonb('additionals').$type<Array<{ label: string; value: number; type: 'nominal' | 'persen' }>>().notNull().default([]),
  hargaJual: real('harga_jual').notNull(),
  hargaMP: real('harga_mp').notNull(),
  hargaFinals: jsonb('harga_finals').$type<number[]>().notNull().default([]),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

// Inferred types for use in API layer
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Mitra = InferSelectModel<typeof mitras>;
export type NewMitra = InferInsertModel<typeof mitras>;

export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

export type OrderItem = InferSelectModel<typeof orderItems>;
export type NewOrderItem = InferInsertModel<typeof orderItems>;

export type Ledger = InferSelectModel<typeof ledgers>;
export type NewLedger = InferInsertModel<typeof ledgers>;

export type ActionRequest = InferSelectModel<typeof actionRequests>;
export type NewActionRequest = InferInsertModel<typeof actionRequests>;

export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;

export type OrderPriority = InferSelectModel<typeof orderPriorities>;
export type NewOrderPriority = InferInsertModel<typeof orderPriorities>;

export type PriceCalculation = InferSelectModel<typeof priceCalculations>;
export type NewPriceCalculation = InferInsertModel<typeof priceCalculations>;
