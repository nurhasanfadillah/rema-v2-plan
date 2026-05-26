---
phase: 09-e2e-testing
plan: 03
subsystem: testing
tags: [playwright, order, lifecycle, status, cancellation, return, filter]

requires:
  - phase: 09-02
    provides: mitra + produk sudah ada di DB

provides:
  - Order lifecycle draft → shipped verified
  - Cancel & return flow verified — muncul di /cancellations
  - Search/filter order berfungsi
  - Upload R2 masih broken (HTTP 500 — deferred dari 09-02)

affects: ["09-04"]

key-findings:
  - "isBilled/ledger creation adalah client-side logic (OrderDetail.tsx:139), bukan backend API — hanya terpicu saat klik tombol di UI"
  - "Admin tidak bisa create order via UI (/orders/create terbatas untuk mitra) — order harus dibuat via API"
  - "Draft order hanya visible ke creator-nya (OrdersList.tsx:37-41)"

duration: ~30min
started: 2026-05-26T08:30:00Z
completed: 2026-05-26T08:45:00Z
---

# Phase 9 Plan 03: Order Lifecycle E2E Summary

**Order lifecycle (draft → shipped), cancel, return, dan filter berfungsi; upload R2 masih broken (HTTP 500).**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 menit |
| Tasks | 4 completed |
| Screenshots | 8 total |
| Bugs confirmed | 1 (upload 500 — carried over) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Buat Pesanan Draft | ✅ PASS | Order ORD-MPLYM872 created via API, tampil di /orders |
| AC-2: Draft → Shipped | ✅ PASS | Semua transisi sukses, status akhir = shipped |
| AC-3: Pesanan Cancelled | ✅ PASS | ORD-CANCEL-MPLYRB11 → cancelled, muncul di /cancellations |
| AC-4: Pesanan Returned | ✅ PASS | ORD-MPLYM872 → returned, muncul di /cancellations |
| AC-5: Filter & Pencarian | ✅ PASS | Search by order number berfungsi, status filter tersedia |
| AC-6: Upload Bukti Resi | ❌ FAIL | POST /api/upload → HTTP 500 (sama dengan bug 09-02) |

**Score: 5/6 pass, 1 fail** (upload R2 bug carried forward)

## Screenshots

| File | Description |
|------|-------------|
| `09-03-task1-01-dashboard.png` | Dashboard setelah login |
| `09-03-task1-02-orders-list.png` | Orders list with draft order |
| `09-03-task1-03-order-detail-draft.png` | Order detail — status DRAFT |
| `09-03-task2-01-waiting-confirmation.png` | Status: Menunggu Konfirmasi |
| `09-03-task2-02-confirmed.png` | Status: Dikonfirmasi |
| `09-03-task2-06-shipped.png` | Status: Terkirim/Selesai |
| `09-03-task3-01-cancellations.png` | /cancellations: cancelled + returned |
| `09-03-task4-01-orders-with-data.png` | Orders list with data |
| `09-03-task4-02-search-filter.png` | Search filter working |

## Key Findings

### 1. isBilled/ledger adalah client-side logic
Billing integration (`handleUpdateStatus` di OrderDetail.tsx:139) hanya berjalan saat user klik tombol di UI. Saat update status via API langsung, isBilled tetap false.

**Impact:** Jika admin advance status via mekanisme lain (misal bulk update), isBilled & ledger tidak akan terbuat.

### 2. Admin tidak bisa create order di UI
Page `/orders/create` hanya bisa diakses oleh role `mitra`. Admin harus menggunakan API langsung atau login sebagai mitra untuk membuat pesanan. Flow yang benar: mitra create → submit → admin confirm → process → etc.

### 3. Draft visibility terbatas
OrdersList.tsx:37-41 — draft order hanya visible ke creator (creatorId). Admin yang bukan creator tidak akan melihat draft order di /orders.

### 4. Upload R2 masih broken
POST /api/upload → HTTP 500. Memengaruhi semua upload file (logo, foto, bukti resi). Ini bug production yang perlu diinvestigasi.

## Next

Lanjut ke **Plan 09-04**: Finance & Operasional (ledger, audit log, queue).
