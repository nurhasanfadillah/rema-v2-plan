# Roadmap: rema-v2.1

## Overview

Migrasi arsitektur dari aplikasi client-side (localStorage) ke stack production-ready: backend API dengan Drizzle ORM ke Neon DB, file storage ke Cloudflare R2, dan deployment ke Vercel. UI dan business logic sudah selesai — fokus migrasi data layer dan infrastruktur.

## Current Milestone

**v2.3 UI Consistency** (v2.3.0)
Status: ✅ Complete
Phases: 1 of 1 complete

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

---
*Roadmap created: 2026-05-24*
*Last updated: 2026-05-26 — v2.3 UI Consistency milestone complete*
