# REMA-V2 Codebase Overview

**Project:** REMA-V2 — Sistem Informasi Manajemen Produksi & Finance
**Client:** PT. Redone Berkah Mandiri Utama
**Domain:** Garmen/konveksi — manajemen pesanan, mitra, produk, keuangan, antrian produksi
**Last mapped:** 2026-06-04 (refresh)

---

## What It Does

Aplikasi web untuk mengelola operasional bisnis konveksi:
- **Pesanan** (order lifecycle dari draft sampai shipped/returned/cancelled)
- **Mitra** (partner bisnis dengan credit limit dan ledger keuangan)
- **Produk** (katalog dengan harga snapshot per order item)
- **Keuangan** (double-entry ledger: debit/credit per mitra)
- **Antrian produksi** (queue management + order priorities quota-based)
- **Laporan** (PDF export: SPK, shipping label, finance report)
- **Audit log** (trail aktivitas semua pengguna)

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.8 + React Router 7 |
| Styling | Tailwind CSS v4 (no config file) |
| Backend | Express.js 4 (Node.js) |
| Database | Neon PostgreSQL (serverless HTTP) + Drizzle ORM |
| Auth | JWT via `jose` (HS256, 7-day), `bcryptjs` cost 12 |
| Storage | Cloudflare R2 (S3-compatible) |
| Deployment | Vercel (frontend static + serverless API, max 30s) |
| PWA | vite-plugin-pwa (auto-update, standalone) |

---

## Key Files At a Glance

| File | Role |
|------|------|
| `src/App.tsx` | React Router setup, RequireAuth gate |
| `src/main.tsx` | Entry point React |
| `src/types.ts` | Frontend domain types |
| `src/db/schema.ts` | Drizzle schema — DB source of truth |
| `src/db/client.ts` | Drizzle client (Neon HTTP driver) |
| `src/api/index.ts` | Express app + semua route dimount |
| `src/api/server.ts` | Entry point API (port 3001 dev) |
| `src/api/middleware/auth.ts` | JWT verification middleware |
| `src/lib/api.ts` | Frontend typed fetch wrapper |
| `src/lib/utils.ts` | `cn()`, `normalizePhone()`, `formatCurrency()`, `formatDate()` |
| `src/context/AuthContext.tsx` | Auth state global + token mgmt |
| `src/context/ConfirmContext.tsx` | Confirm dialog global provider |
| `src/components/Layout.tsx` | Sidebar + nav shell (role-filtered) |
| `api/index.ts` | Vercel serverless entry (wraps `src/api`) |
| `vercel.json` | Deployment config |
| `drizzle.config.ts` | Drizzle Kit config |
| `vite.config.ts` | Vite + plugins config |

---

## Roles

| Role | Akses |
|------|-------|
| `admin` | Full access semua fitur + user management |
| `staff` | Operasional harian, tidak bisa manage users |
| `operational` | Fokus produksi dan queue |
| `mitra` | Hanya melihat data milik sendiri (orders, ledger) |

---

## Domain Entities

User → Mitra (1:1 untuk role mitra) → Order → OrderItem → Product
LedgerEntry per Mitra (source: order/payment/manual/cancellation/return)
ActionRequest (cancellation/return) → Order
OrderPriority (quota-based per Mitra) → Order
AuditLog (trail aksi)

---

## Running Locally

```bash
npm run dev          # Frontend port 3000
npm run api:dev      # API port 3001 (harus jalan bersamaan)
```

Vite proxies `/api/*` → `http://localhost:3001`.
