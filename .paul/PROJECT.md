# rema-v2.1

## What This Is

Aplikasi web pengelolaan pesanan dan keuangan mitra PT. Redone Berkah Mandiri Utama. Berjalan di production: Neon DB (PostgreSQL) + Drizzle ORM untuk data, Cloudflare R2 untuk file, deployed ke Vercel di https://redone.my.id.

## Core Value

Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 2.4.0 |
| Status | Production — Live di https://redone.my.id |
| Last Updated | 2026-05-26 |

## Requirements

### Core Features

- Manajemen mitra (CRUD, credit limit, logo)
- Manajemen pesanan dengan status tracking (draft → shipped/returned/cancelled)
- Ledger keuangan per mitra (debit/kredit, bukti bayar)
- Upload file: logo mitra, foto produk, file desain DTF, bukti resi, bukti bayar
- Audit log semua aktivitas admin

### Validated (Shipped)

- [x] Seluruh UI dan business logic — berjalan di localStorage
- [x] Backend API + Drizzle Schema (8 tabel) terhubung ke Neon DB — Phase 1
- [x] Migrasi data layer localStorage → Neon DB via API — Phase 2 (semua pages bebas db.*)
- [x] Migrasi file storage localStorage base64 → Cloudflare R2 — Phase 3
- [x] Deploy ke Vercel dengan custom domain redone.my.id — Phase 4
- [x] PWA installability — install prompt, standalone mode, shell caching — Phase 7
- [x] UI Consistency — utility class system (@layer components) seragam di semua 11 halaman — Phase 8
- [x] E2E Testing — 21/25 AC pass (84%), semua 14 halaman diuji via Chrome DevTools — Phase 9
- [x] Upload file ke R2 berfungsi di Vercel production (express.raw() fix) — Phase 10

### Active (In Progress)

- (none — v2.4 Upload Bug Fix complete)

### Planned (Next)

- (none)

### Out of Scope

- Multi-user / role selain admin — hanya satu admin
- Data migration dari localStorage lama — mulai fresh di production

## Target Users

**Primary:** Admin PT. Redone Berkah Mandiri Utama
- Akses penuh ke seluruh fitur
- Login: 082113133165

## Constraints

### Technical Constraints

- Frontend tetap React + Vite (tidak diganti framework)
- Backend API layer via Express sebagai Vercel serverless function
- File upload melalui server (R2 presigned URL atau proxy)
- Vercel deployment: frontend static + API sebagai serverless functions

### Business Constraints

- Hanya satu user (admin) — tidak perlu sistem auth kompleks
- Kredensial production tersimpan di .env (tidak di kode)

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Neon DB + Drizzle ORM | PostgreSQL serverless cocok untuk Vercel, Drizzle type-safe | 2026-05-24 | Active |
| Cloudflare R2 | S3-compatible, lebih murah dari S3, kredensial sudah tersedia | 2026-05-24 | Active |
| Deploy ke Vercel | Platform target, cocok dengan Vite + serverless API | 2026-05-24 | Active |
| Dual-migration strategy Phase 2 | Data layer (db.*) dimigrate terpisah dari file layer (R2) agar lebih mudah ditest | 2026-05-25 | Active |
| Async load pattern (useEffect + Promise.all) | Konsisten di semua pages yang butuh multiple data sources | 2026-05-25 | Active |
| Custom domain storage.jisoi.net untuk R2 | r2.dev diblokir Biznet Indonesia | 2026-05-25 | Active |
| CORS_ORIGIN comma-separated multi-origin | Mendukung production domain + localhost dev bersamaan | 2026-05-25 | Active |
| Cloudflare DNS proxy OFF untuk Vercel domain | Vercel perlu akses langsung untuk SSL cert provisioning | 2026-05-25 | Active |
| express.raw() per-route untuk binary upload | Global raw middleware bertabrakan dengan express.json(); for-await stream tidak reliable di Vercel serverless | 2026-05-26 | Active |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| App live di Vercel | URL production aktif | https://redone.my.id | ✅ Complete |
| Data tersimpan di Neon DB | Semua entitas bisa CRUD via API | ✅ Done | Complete |
| File tersimpan di R2 | Upload/view file berjalan | ✅ Done | Complete |
| Login admin berfungsi | 082113133165 bisa masuk | ✅ Done | Complete |

## Tech Stack / Tools

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 19 + Vite + TypeScript | Production |
| Styling | Tailwind CSS v4 | Production |
| ORM | Drizzle ORM | ✅ Aktif — schema + API selesai |
| Database | Neon DB (PostgreSQL) | ✅ Aktif — semua data via API |
| File Storage | Cloudflare R2 | ✅ Aktif — public via storage.jisoi.net |
| Deployment | Vercel | ✅ Live — https://redone.my.id |

---
*PROJECT.md — Updated when requirements or context change*
*Last updated: 2026-05-26 after Phase 10 — v2.4 Upload Bug Fix complete*
