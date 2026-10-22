# rema-v2.1

## What This Is

Aplikasi web pengelolaan pesanan dan keuangan mitra PT. Redone Berkah Mandiri Utama. Berjalan di production: Neon DB (PostgreSQL) + Drizzle ORM untuk data, Cloudflare R2 untuk file, deployed ke Vercel di https://redone.my.id.

## Core Value

Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 2.5.0 |
| Status | Production — Live di https://redone.my.id |
| Last Updated | 2026-10-23 |

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
- [x] UI fixes: running orders filter confirmed, grafik exclude non-aktif, tabel ringkas order confirmed — Phase 11
- [x] UI Bug Fixes & Improvements: 9 item (button mitra+draft, sidebar active, modal copy, dashboard labels, about text, login layout, mitra modal desktop, admin edit harga satuan) — Phase 13
- [x] Login UI Redesign: mobile-first navy theme, input kotak-ikon, security badge, footer lengkap — Phase 17
- [x] UI Polish lanjutan: Cancellations, Finance, Orders, AppQueue, Reports — header utility class, colored cards, mobile left-border — Phase 18–22
- [x] Confirm dialog dark theme + login autofill fix — Phase 22
- [x] Finance Desktop Enterprise Polish: sticky table, sortable columns, quick action row menu, sidebar glow/hover, topbar search/notif, summary sparkline, semantic color system, PaymentModal clean — Phase 23
- [x] Order Priority (Prioritas Pesanan): halaman /priority, modal tambah + quota warning professional, hapus own entry, nav link Zap semua role, field Batas Prioritas di form mitra — Phase 24

- [x] Product_Description.md — dokumen lengkap REMA-V2 (bisnis + teknis) di root repo — Phase 26
- [x] UI Polish Batch 3: hapus dead code bell/search di header, panel AJUKAN jadi biru, PDF SPK label "Jenis Pesanan" + catatan desain inline, MultiFileUpload inline square grid — Phase 27
- [x] PWA Update UX: banner notifikasi versi baru (PWAUpdateBanner) + tombol install PWA di header Layout — Phase 28
- [x] Reports Mitra Data Isolation Fix: backend enforce filter by role (orders + ledgers API), frontend timing fix via useEffect — Phase 29
- [x] Priority Header Mobile Fix: button "Tambah Prioritas" ke baris kedua pada mobile — Phase 30
- [x] Orders Product Items Display: nama produk × qty per item di daftar pesanan (mobile card + desktop table), truncation "+N lainnya" untuk 4+ item — Phase 31
- [x] Code Audit & Cleanup: hapus db.ts + resizeImage + 14 unused icon imports, uninstall framer-motion + @google/genai (36 packages), lazy loading 7 halaman berat + vendor-pdf/charts chunks — Phase 32
- [x] Security Bug Fixes: role + ownership enforcement di orders/requests API — mitra tidak bisa akses data mitra lain — Phase 33
- [x] Cancellation Return Approval Workflow: alur pengajuan → pending → approve/reject oleh admin; frontend pending panel dengan role-aware UI — Phase 34
- [x] Kalkulator Harga Jual: halaman /calculator, dua mode input, kalkulasi live, simpan riwayat — Phase 35
- [x] Sidebar User Footer: info pengguna + logout di footer sidebar satu baris, modal ganti password inline — Phase 36
- [x] Orders List Cleanup: hapus kolom Tipe, tampilkan badge tipe + catatan desain per item (truncated) — Phase 37
- [x] Order Creation Hardening: express.json 2MB, mitraId ownership check, credit limit backend enforcement, field validation — Phase 38
- [x] Upload file limit 50MB: FileUpload + MultiFileUpload + upload.ts + Vercel memory 1024MB — Phase 38
- [x] Reports Status Filter Fix: filter status di halaman Laporan tab Pesanan diperluas dari 6 → 10 opsi (menambahkan pressing/packing/cancelled) dan label selaras dengan STATUS_LABELS di OrderDetail — Phase 39
- [x] Queue Filter Adjustment: halaman Antrian Produksi (`/app-queue`) hanya menampilkan 4 status alur aktif (waiting_confirmation, confirmed, processing, pressing); packing dikeluarkan; 4 pipeline cards diselaraskan (Menunggu/Dikonfirmasi/Diproses/Sablon) — Phase 40
- [x] Order Detail: nama mitra tampil inline di header `OrderDetail.tsx` (`{orderNumber} — {mitraName}`); fallback aman saat mitra dangling; berlaku semua role; PDF SPK tidak diubah — Phase 41
- [x] Reports Rekap Tagihan: tab baru "Rekap Tagihan" di halaman Laporan — rekap Produk · Qty · Harga · Total dari pesanan tercatat tagihan (`isBilled`), dikelompokkan per produk + harga satuan, filter mitra + periode (tanggal tagihan), ekspor PDF; tampil untuk admin + mitra (staff tidak melihat tab); modul `billing-recap` dengan public API `index.ts` — Phase 42
- [x] Reports PDF Rekap Produk & Qty: PDF Rekap Tagihan memuat section "Rekap Produk (harga digabung)" — Produk + Qty saja, satu baris per produk (harga berbeda digabung), di atas tabel rincian per harga satuan; `productQty` dihitung di `buildBillingRecap`; hanya PDF, tab di layar tidak berubah — Phase 43
- [x] Orders List: Filter Status Cetak DTF: baris chip "Semua DTF / Belum Cetak / Sudah Cetak / Tanpa DTF" (dengan jumlah pesanan) di halaman Daftar Pesanan, berkombinasi dengan filter status dan pencarian; Belum Cetak = ada ≥1 item custom belum dicetak (termasuk parsial), Sudah Cetak = semua item custom sudah dicetak, Tanpa DTF = tidak ada item custom; modul `dtf-filter` dengan public API `index.ts` — Phase 44

### Active (In Progress)

- (none)

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
| Quota check via API error QUOTA_EXCEEDED | Frontend tidak perlu prefetch quota — lazy check saat submit, single source of truth di backend | 2026-05-27 | Active |
| Mount PWAUpdateBanner di wrapper div utama Layout (bukan Content Area) | Agar `fixed bottom-0` tidak terpotong `overflow-hidden` pada flex-1 inner div | 2026-05-29 | Active |
| Backend enforce mitra filter (bukan frontend) | Frontend filter bisa di-bypass; server-side enforcement adalah satu-satunya yang reliable untuk data isolation | 2026-05-29 | Active |
| AuthRequest type di semua route handlers | req.user butuh AuthRequest dari middleware/auth.ts — Request standar Express tidak punya user property | 2026-05-29 | Active |
| Submit cancel/return membuat pending ActionRequest (bukan eksekusi langsung) | Approval workflow membutuhkan intermediate state — backend eksekusi hanya saat approved | 2026-06-05 | Active |
| 'pending' ditambah ke RequestStatus union | Backend Phase 34-01 sudah support 'pending' tapi frontend type belum — lint error tanpa penambahan ini | 2026-06-05 | Active |
| Credit limit backend check dari orders isBilled=false | Konsisten dengan logika frontend; lebih simpel dari query ledger | 2026-06-15 | Active |
| mitraId di-override dari JWT di POST /api/orders | Tidak trust body untuk mitraId — prevent cross-mitra order creation | 2026-06-15 | Active |
| Upload file limit 50MB (frontend + backend + Vercel 1024MB RAM) | File desain garmen sering >10MB; 50MB cukup untuk semua format (CDR, AI, PDF) | 2026-06-15 | Active |
| Filter status Reports pakai label sama dengan STATUS_LABELS OrderDetail (duplicate accepted) | Konsistensi UI seluruh app tanpa refactor extract shared constant; extraction dideferensi untuk phase terpisah | 2026-09-12 | Active |
| Antrian Produksi exclude `packing` (masuk fase billing/kirim, bukan antrian aktif) | `packing` set `isBilled=true` — secara bisnis sudah lepas dari antrian produksi ke fase penagihan/pengiriman | 2026-09-13 | Active |
| Antrian Produksi include `waiting_confirmation` di kepala alur | Operator perlu visibilitas pesanan yang belum di-confirm supaya bisa dikejar approval-nya sejak awal | 2026-09-13 | Active |
| Label card AppQueue ringkas (Menunggu/Dikonfirmasi/Diproses/Sablon), tidak selaras dengan STATUS_LABELS penuh | Grid card kompak butuh label pendek; konteks berbeda dari dropdown/badge full di halaman lain | 2026-09-13 | Active |
| Nama mitra tampil inline di `h1` OrderDetail (`{orderNumber} — {mitraName}`, em dash separator) | Opsi inline dipilih dibanding baris baru agar header tetap compact; em dash konsisten dengan konvensi tipografi UI | 2026-09-13 | Active |
| Fallback aman `orderMitra ? ` — ${name}` : ''` di OrderDetail | mitraId adalah FK — seharusnya tidak dangling, tapi ternary check menghindari crash pada edge case data anomali tanpa biaya berarti | 2026-09-13 | Active |
| PDF SPK tidak menambahkan nama mitra di Phase 41 (deferred kalau perlu) | PDF SPK sudah punya section info mitra eksplisit; tidak ada gap konteks yang perlu ditutup di PDF | 2026-09-13 | Active |
| Rekap Tagihan sebagai tab baru di Laporan (bukan di dalam tab Keuangan/Pesanan); staff tidak melihat tab | Filter + PDF sendiri tanpa mengubah tab yang ada; konsisten dengan tab Keuangan (staff tidak melihat nominal uang) | 2026-10-22 | Active |
| Baris rekap tagihan dikelompokkan per `productId + priceSnapshot` | Lossless: produk sama dengan harga berbeda = baris terpisah, Qty × Harga = Total tiap baris, jumlah baris = total tagihan | 2026-10-22 | Active |
| Periode rekap tagihan = tanggal ledger debit `source:'order'`; order `isBilled` tanpa ledger dilewati | Selaras dengan filter tab Keuangan; ledger satu-satunya sumber tanggal tagihan | 2026-10-22 | Active |
| Modul fitur baru: folder + `index.ts` public API, file kebab-case, named export, tanpa `any` | Mengikuti CLAUDE.md global; file lama tidak di-rename dan tsconfig tidak diubah | 2026-10-22 | Active |
| Rekap Produk (Produk + Qty, harga digabung) di PDF Rekap Tagihan: di atas tabel rincian, hanya PDF (tab di layar tidak berubah) | Fokus pada produk meskipun harga berbeda, tanpa menghilangkan rincian per harga untuk penagihan | 2026-10-23 | Active |
| `productQty` dihitung di fungsi agregasi murni `buildBillingRecap` per `productId` (bukan di komponen PDF) | Satu sumber agregasi; Σ qty = totalQty; teruji di Node tanpa test runner | 2026-10-23 | Active |
| Filter status cetak DTF di Daftar Pesanan berbentuk chip satu baris (bukan dropdown + bottom sheet kedua) | Kode filter status yang ada tidak disentuh; layout sama untuk mobile dan desktop (chip membungkus bila sempit) | 2026-10-23 | Active |
| Kategori DTF per pesanan: Belum Cetak (≥1 item custom belum dicetak, termasuk parsial) / Sudah Cetak (semua item custom sudah dicetak) / Tanpa DTF (tidak ada item custom) | Aturan "belum cetak" sama persis dengan guard Press Sablon di OrderDetail; sumber kebenaran `items[].isCustomLogo`, bukan `order.hasCustomLogo` | 2026-10-23 | Active |
| Hitungan chip DTF = lingkup role + filter status terpilih, tanpa pencarian; hitungan opsi filter status tidak memperhitungkan filter DTF | Belum + Sudah + Tanpa = Semua DTF; selaras dengan hitungan status yang juga tidak memperhitungkan pencarian | 2026-10-23 | Active |
| Klasifikasi/penyaringan/penghitungan DTF di fungsi murni modul `src/components/orders/dtf-filter/` (hanya `import type`); state filter tetap di halaman | Pola modul Phase 42 dipakai ulang untuk fitur filter; teruji di Node tanpa test runner | 2026-10-23 | Active |

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
*Last updated: 2026-10-23 after Phase 44 — Orders List: Filter Status Cetak DTF*
