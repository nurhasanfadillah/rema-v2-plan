# Roadmap: rema-v2.1

## Overview

Migrasi arsitektur dari aplikasi client-side (localStorage) ke stack production-ready: backend API dengan Drizzle ORM ke Neon DB, file storage ke Cloudflare R2, dan deployment ke Vercel. UI dan business logic sudah selesai — fokus migrasi data layer dan infrastruktur.

## Current Milestone

**v2.1 Production Migration** (v2.1.0)
Status: In progress
Phases: 2 of 4 complete (Phase 3 next)

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Backend API + Drizzle Schema | 2 | ✅ Complete | 2026-05-24 |
| 2 | Data Layer Migration | 8 | ✅ Complete | 2026-05-25 |
| 3 | File Storage Migration ke R2 | TBD | Not started | - |
| 4 | Deploy ke Vercel | TBD | Not started | - |

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

**Scope:**
- [x] Replace `db.getUsers/saveUsers` → API calls
- [x] Replace `db.getMitras/saveMitras` → API calls
- [x] Replace `db.getOrders/saveOrders` → API calls
- [x] Replace `db.getLedgers/saveLedgers` → API calls
- [x] Replace `db.getRequests/saveRequests` → API calls
- [x] Auth middleware untuk semua roles

**Plans:**
- [x] 02-01: Auth + AuthContext migration
- [x] 02-02: Users, Mitras, Products pages migration
- [x] 02-03: Finance, Dashboard, Reports pages migration
- [x] 02-04: AppQueue, AuditLogs, CancellationsReturns pages migration
- [x] 02-05: RunningOrders component migration
- [x] 02-06: Mitras API routes + ledger routes
- [x] 02-07: Ledger API + removeByOrder endpoint
- [x] 02-08: orders/* migration (OrdersList, CreateOrder, OrderDetail)

### Phase 3: File Storage Migration ke R2

**Goal:** Semua upload file (logo, foto produk, desain DTF, bukti resi, bukti bayar) tersimpan di R2, bukan base64 di localStorage
**Depends on:** Phase 2 (data layer sudah via API)
**Research:** Likely (R2 presigned URL vs proxy upload, @aws-sdk/client-s3)

**Scope:**
- Setup R2 client dengan kredensial tersedia
- Upload endpoint di API server
- Replace FileUpload.tsx / MultiFileUpload.tsx untuk upload ke R2
- Update fields: logoUrl, imageUrl, previewUrl, designUrl, resiUrl, attachmentUrl → R2 URLs

**Plans:**
- Akan didefinisikan saat `/paul:plan`

### Phase 4: Deploy ke Vercel

**Goal:** Aplikasi live di Vercel dengan semua environment variables terkonfigurasi
**Depends on:** Phase 3 (semua fitur berjalan via API)
**Research:** Likely (Vercel + Vite config, serverless API adapter)

**Scope:**
- vercel.json configuration
- Environment variables di Vercel dashboard
- Build pipeline frontend + API
- Smoke test production

**Plans:**
- Akan didefinisikan saat `/paul:plan`

---
*Roadmap created: 2026-05-24*
*Last updated: 2026-05-25 — Phase 2 complete*
