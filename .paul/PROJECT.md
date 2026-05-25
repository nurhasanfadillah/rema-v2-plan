# rema-v2.1

## What This Is

Aplikasi web pengelolaan pesanan dan keuangan mitra PT. Redone Berkah Mandiri Utama. Saat ini berjalan 100% client-side menggunakan browser localStorage sebagai database dan penyimpanan file. Proyek ini adalah migrasi penuh ke stack production: Neon DB (PostgreSQL) + Drizzle ORM untuk data, Cloudflare R2 untuk file, dan deployment ke Vercel.

## Core Value

Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 2.1.0 |
| Status | Migration — Phase 3 (File Storage R2) |
| Last Updated | 2026-05-25 |

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

### Active (In Progress)

- [ ] Migrasi file storage localStorage base64 → Cloudflare R2
- [ ] Deploy ke Vercel

### Planned (Next)

- [ ] Phase 3: Migrasi File Storage ke R2 (FileUpload, MultiFileUpload → R2 URLs)
- [ ] Phase 4: Deployment ke Vercel

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
- Perlu backend API layer karena Neon DB tidak bisa diakses langsung dari browser
- File upload harus melalui server (R2 presigned URL atau proxy)
- Vercel deployment: frontend static + API sebagai serverless functions atau Express adapter

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

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| App live di Vercel | URL production aktif | Belum | Not started |
| Data tersimpan di Neon DB | Semua entitas bisa CRUD via API | ✅ Done | Complete |
| File tersimpan di R2 | Upload/view file berjalan | Belum | Not started |
| Login admin berfungsi | 082113133165 bisa masuk | ✅ Done | Complete |

## Tech Stack / Tools

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 19 + Vite + TypeScript | Tidak berubah |
| Styling | Tailwind CSS v4 | Tidak berubah |
| ORM | Drizzle ORM | ✅ Aktif — schema + API selesai |
| Database | Neon DB (PostgreSQL) | ✅ Aktif — semua data via API |
| File Storage | Cloudflare R2 | Phase 3 — belum dimigrate |
| Deployment | Vercel | Phase 4 — belum deploy |
| Current (lama) | Browser localStorage | Data: sudah digantikan; File: Phase 3 |

---
*PROJECT.md — Updated when requirements or context change*
*Last updated: 2026-05-25 after Phase 2*
