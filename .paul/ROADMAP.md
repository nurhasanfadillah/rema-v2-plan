# Roadmap: rema-v2.1

## Overview

Migrasi arsitektur dari aplikasi client-side (localStorage) ke stack production-ready: backend API dengan Drizzle ORM ke Neon DB, file storage ke Cloudflare R2, dan deployment ke Vercel. UI dan business logic sudah selesai — fokus migrasi data layer dan infrastruktur.

## Current Milestone

**v2.5 UI Fixes** (v2.5.0)
Status: ✅ Complete
Phases: 1 of 1 complete (Phase 11)

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Backend API + Drizzle Schema | 2 | ✅ Complete | 2026-05-24 |
| 2 | Data Layer Migration | 8 | ✅ Complete | 2026-05-25 |
| 3 | File Storage Migration ke R2 | 1 | ✅ Complete | 2026-05-25 |
| 4 | Deploy ke Vercel | 1 | ✅ Complete | 2026-05-25 |
| 5 | UI Fixes | 1 | ✅ Complete | 2026-05-25 |
| 7 | PWA Implementation | 1 | ✅ Complete | 2026-05-26 |
| 8 | UI Consistency | 3 | ✅ Complete | 2026-05-26 |
| 9 | E2E Testing via MCP Playwright | 4 | ✅ Complete | 2026-05-26 |
| 10 | Upload Bug Fix | 1 | ✅ Complete | 2026-05-26 |
| 11 | UI Fixes | 1 | ✅ Complete | 2026-05-26 |
| 13 | UI Bug Fixes & Improvements | 1 | ✅ Complete | 2026-05-26 |
| 14 | Modal Akun Center | 1 | ✅ Complete | 2026-05-26 |

## Phase Details

### Phase 1: Backend API + Drizzle Schema ✅ Complete

**Goal:** Server API berjalan dengan koneksi ke Neon DB dan schema Drizzle lengkap dari semua TypeScript types
**Depends on:** Nothing (first phase)

**Plans:**
- [x] 01-01: Drizzle schema + Neon DB (8 tabel, deploy ke production)
- [x] 01-02: Express API server + auth endpoint + Vercel structure

### Phase 2: Data Layer Migration ✅ Complete

**Goal:** Semua localStorage reads/writes digantikan dengan API calls — app berfungsi penuh via Neon DB
**Depends on:** Phase 1 (API + schema siap)
**Completed:** 2026-05-25

**Plans:**
- [x] 02-01 through 02-08: Semua pages, components, dan routes dimigrate ke Neon DB

### Phase 3: File Storage Migration ke R2 ✅ Complete

**Goal:** Semua upload file (logo, foto produk, desain DTF, bukti resi, bukti bayar) tersimpan di R2, bukan base64 di localStorage
**Depends on:** Phase 2 (data layer sudah via API)
**Completed:** 2026-05-25

**Plans:**
- [x] 03-01: R2 upload endpoint + FileUpload/MultiFileUpload migration

### Phase 4: Deploy ke Vercel ✅ Complete

**Goal:** Aplikasi live di Vercel dengan custom domain redone.my.id dan semua environment variables terkonfigurasi
**Depends on:** Phase 3 (semua fitur berjalan via API)
**Completed:** 2026-05-25

**Plans:**
- [x] 04-01: vercel.json config + CORS + deploy + domain redone.my.id

**Result:** https://redone.my.id — live, login berfungsi, data dari Neon DB, file upload ke R2

### Phase 7: PWA Implementation ✅ Complete

**Goal:** Tambah PWA installability ke https://redone.my.id — install prompt, standalone mode, shell caching
**Depends on:** Phase 1-5 (app sudah live di production)
**Completed:** 2026-05-26

**Plans:**
- [x] 07-01: vite-plugin-pwa + icons + manifest + service worker config

**Result:** https://redone.my.id — PWA installable, standalone mode aktif, shell caching via Workbox

### Phase 8: UI Consistency ✅ Complete

**Goal:** Sistem desain konsisten — button, card, typography, spacing seragam di semua halaman
**Depends on:** Phase 4 (app live di production)
**Completed:** 2026-05-26

**Plans:**
- [x] 08-01: CSS Foundation — @layer components utility system di index.css
- [x] 08-02: Apply ke Layout, Dashboard, Login, Users
- [x] 08-03: Apply ke Mitras, Products, Finance, AppQueue, Orders, AuditLogs

**Result:** Semua 11 halaman menggunakan utility class system yang seragam (.page-header, .page-title, .btn-*, .card-sm, .label-xs)

### Phase 9: E2E Testing via MCP Playwright ✅ Complete

**Goal:** Verifikasi fungsionalitas seluruh aplikasi via E2E testing menggunakan MCP Playwright — semua 14 halaman + edge cases
**Depends on:** Phase 4 (app live di production)
**Completed:** 2026-05-26

**Plans:**
- [x] 09-01: Auth & Navigasi (login valid/invalid, sidebar, logout, deep link)
- [x] 09-02: Entity CRUD (Mitra, Produk, Users + upload file)
- [x] 09-03: Order Lifecycle (draft → shipped, cancel, return, bukti resi)
- [x] 09-04: Finance, AppQueue, Reports, AuditLogs, CancellationsReturns

**Result:** 21/25 AC pass (84%), semua 14 halaman diuji. Bug kritis: POST /api/upload → HTTP 500

### Phase 10: Upload Bug Fix ✅ Complete

**Goal:** Fix POST /api/upload HTTP 500 di production — ganti stream body dengan express.raw() middleware agar upload ke Cloudflare R2 berfungsi
**Depends on:** Phase 3 (R2 setup sudah ada), Phase 9 (bug ditemukan via E2E)
**Completed:** 2026-05-26

**Plans:**
- [x] 10-01: Fix upload handler (express.raw + logging)

**Result:** Upload ke R2 berfungsi penuh di production. Bug kritis P1 dari Phase 9 E2E testing resolved.

### Phase 11: UI Fixes ✅ Complete

**Goal:** Perbaiki 3 item UI: RunningOrders filter confirmed-only, grafik dashboard exclude status non-aktif, tambah tabel ringkas 10 order confirmed terakhir
**Depends on:** Phase 9 (E2E testing revealed these issues)
**Completed:** 2026-05-26

**Plans:**
- [x] 11-01: RunningOrders filter + Dashboard chart filter + tabel ringkas

### Phase 12: Copywriting Audit & Improvement ✅ Complete

**Goal:** Audit komprehensif seluruh copy UI (buttons, labels, placeholders, toasts, modals, page titles) — identifikasi inconsistency & verbosity, apply copy standar industri SaaS Indonesia yang ringkas dan profesional
**Depends on:** Phase 11 (app stable di production)
**Completed:** 2026-05-26

**Plans:**
- [x] 12-01: Audit komprehensif copy UI → COPY-AUDIT.md (research)
- [x] 12-02: Implementasi approved copy improvements (execute)

### Phase 13: UI Bug Fixes & Improvements ✅ Complete

**Goal:** Perbaiki 9 item: bug role mitra+draft (button & modal copy), sidebar active state, dashboard labels, about text, login layout, mitra modal desktop center, dan feature edit harga satuan untuk admin
**Depends on:** Phase 12 (app stable)
**Completed:** 2026-05-26

**Plans:**
- [x] 13-01: Bug fixes + UI/copy + feature harga satuan (execute)

### Phase 14: Modal Akun Center ✅ Complete

**Goal:** Ubah modal Detail Info Akun dari slide-in panel kanan menjadi centered overlay modal
**Depends on:** Phase 13 (app stable)
**Completed:** 2026-05-26

**Plans:**
- [x] 14-01: UserDetailPanel layout + animasi diubah ke centered modal (quick-fix)

---
*Roadmap created: 2026-05-24*
*Last updated: 2026-05-26 — Phase 14 Modal Akun Center ditambahkan*
