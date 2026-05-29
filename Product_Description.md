# REMA-V2
**Sistem Informasi Manajemen Produksi & Keuangan Mitra**
PT. Redone Berkah Mandiri Utama

> Versi: 2.5.0 · Status: **Production** · URL: https://redone.my.id

---

## Ringkasan Produk

REMA-V2 adalah aplikasi web internal untuk mengelola operasional bisnis konveksi PT. Redone Berkah Mandiri Utama secara real-time. Aplikasi ini menggantikan proses manual berbasis spreadsheet dan catatan lokal dengan sistem terpusat yang menyimpan seluruh data pesanan, keuangan, dan aktivitas mitra di cloud.

Dengan REMA-V2, admin dapat memantau status setiap pesanan dari draft hingga pengiriman, mencatat transaksi keuangan per mitra, mengelola antrian produksi, dan menghasilkan laporan — semua dari satu dashboard yang bisa diakses dari perangkat apapun.

---

## Target Pengguna

| Role | Siapa | Akses Utama |
|------|-------|-------------|
| **Admin** | Pengelola operasional PT. Redone | Seluruh fitur — pesanan, keuangan, mitra, laporan, pengguna |
| **Staff** | Tim operasional internal | Pesanan, keuangan, antrian, laporan (tanpa manajemen pengguna) |
| **Operational** | Tim produksi lapangan | Antrian produksi, prioritas pesanan |
| **Mitra** | Partner/vendor eksternal | Pesanan milik sendiri, tambah prioritas |

**Pengguna utama:** Admin PT. Redone Berkah Mandiri Utama — akses penuh ke seluruh sistem.

---

## Fitur Utama

### 1. Manajemen Pesanan
Kelola seluruh siklus hidup pesanan dari penerimaan hingga pengiriman:
- Buat pesanan baru dengan beberapa item produk, jumlah, dan harga snapshot
- Lacak status pesanan secara real-time
- Kelola bukti resi pengiriman dan detail penerima
- Tandai item yang membutuhkan cetak DTF (desain logo kustom)
- Upload dan kelola file desain per item pesanan

### 2. Manajemen Mitra
Database lengkap partner bisnis:
- Data mitra dengan credit limit dan batas kuota prioritas
- Upload logo mitra
- Riwayat pesanan per mitra
- Status arsip (aktif/non-aktif)

### 3. Manajemen Produk
Katalog produk dengan:
- Harga produk (disimpan sebagai snapshot saat pesanan dibuat)
- Upload foto produk
- Status arsip produk

### 4. Keuangan & Ledger
Pencatatan keuangan double-entry per mitra:
- Setiap transaksi dicatat sebagai entri debit atau kredit
- Sumber transaksi: pesanan, pembayaran, penyesuaian manual, pembatalan, retur
- Upload bukti pembayaran
- Dashboard ringkasan saldo per mitra
- Laporan keuangan dengan filter tanggal dan mitra

### 5. Antrian Produksi
Pantau pesanan yang sedang dalam proses produksi:
- Tampilan real-time pesanan aktif (confirmed → pressing)
- Status DTF per item (belum cetak / sudah cetak)
- Filter dan urutkan berdasarkan status

### 6. Prioritas Pesanan
Sistem kuota prioritas per mitra:
- Mitra dapat menandai pesanan aktif sebagai prioritas
- Batas kuota ditentukan admin di data mitra
- Peringatan otomatis saat kuota penuh
- Admin/staff/operational melihat seluruh daftar prioritas

### 7. Pembatalan & Retur
Kelola permintaan pembatalan dan retur:
- Mitra mengajukan permintaan dengan alasan
- Admin memproses dan mencatat nominal kredit
- Riwayat lengkap semua permintaan

### 8. Laporan
Export laporan dalam format PDF:
- **SPK (Surat Perintah Kerja)** per pesanan
- **Label Pengiriman** per pesanan
- **Laporan Pesanan** periode tertentu
- **Laporan Keuangan** per mitra atau keseluruhan

### 9. Audit Log
Trail aktivitas lengkap:
- Setiap aksi admin/staff tercatat otomatis
- Timestamp, user, dan detail aksi
- Tidak dapat diedit atau dihapus

### 10. PWA (Progressive Web App)
- Dapat diinstal di perangkat mobile dan desktop
- Mode standalone (tanpa browser chrome)
- Shell caching untuk performa lebih cepat

---

## Siklus Hidup Pesanan

```
[DRAFT]
  ↓ Mitra mengajukan konfirmasi
[MENUNGGU KONFIRMASI]
  ↓ Admin menyetujui
[DIKONFIRMASI]
  ↓ Produksi dimulai
[DIPROSES]
  ↓ Tahap heat press
[PRESSING]
  ↓ Tahap packing (isBilled = true)
[PACKING]
  ↓ Dikirim ke penerima
[DIKIRIM] ← Status final

Jalur alternatif:
  Draft / Menunggu / Dikonfirmasi / Diproses → [DIBATALKAN]
  Dari status manapun → [DIRETUR]
```

> Pesanan yang mencapai status **Packing** otomatis ditandai sebagai sudah ditagih (`isBilled = true`) untuk keperluan pencatatan keuangan.

---

## Stack Teknologi

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| **Frontend** | React + TypeScript | 19.0.1 / 5.8.2 |
| **Routing** | React Router | 7.15.1 |
| **Styling** | Tailwind CSS | v4.1.14 |
| **Animasi** | Framer Motion | 12.x |
| **Charts** | Recharts | 3.8.1 |
| **PDF** | @react-pdf/renderer | 4.5.1 |
| **Build Tool** | Vite | 6.2.3 |
| **Backend** | Express.js | 4.21.2 |
| **Runtime** | Node.js | 22.x |
| **ORM** | Drizzle ORM | 0.45.2 |
| **Database** | Neon PostgreSQL (serverless) | — |
| **Autentikasi** | JWT via jose | 6.2.3 |
| **Enkripsi** | bcryptjs | 3.0.3 |
| **File Storage** | Cloudflare R2 (S3-compatible) | — |
| **Deployment** | Vercel | — |
| **PWA** | vite-plugin-pwa | 1.3.0 |

---

## Arsitektur Sistem

```
┌─────────────────────────────────┐
│         Browser / PWA           │
│  React 19 + React Router 7      │
│  Tailwind CSS v4 + Framer Motion│
└────────────┬────────────────────┘
             │ HTTPS + JWT Bearer Token
             │ /api/* (Vercel Serverless)
┌────────────▼────────────────────┐
│       API Layer (Express.js)    │
│  Vercel Serverless Function     │
│  Middleware: JWT Auth + CORS    │
│  Routes: 11 resource endpoints  │
└──────┬──────────────────┬───────┘
       │                  │
┌──────▼──────┐    ┌──────▼──────┐
│  Neon DB    │    │ Cloudflare  │
│ PostgreSQL  │    │     R2      │
│ Drizzle ORM │    │ File Storage│
│ 9 tabel     │    │ storage.    │
│             │    │ jisoi.net   │
└─────────────┘    └─────────────┘
```

**Alur data:**
1. Browser mengirim request ke `/api/*` dengan Bearer token di header
2. Vercel merutekan ke serverless function Express.js
3. Middleware `requireAuth` memverifikasi JWT
4. Route handler berinteraksi dengan Neon DB via Drizzle ORM
5. Upload file dikirim ke Cloudflare R2 dan dikembalikan sebagai public URL

---

## Database

9 tabel di Neon PostgreSQL:

| Tabel | Fungsi |
|-------|--------|
| `users` | Akun pengguna (admin, staff, operational, mitra) |
| `mitras` | Data partner bisnis |
| `products` | Katalog produk |
| `orders` | Pesanan dengan metadata pengiriman |
| `order_items` | Item-item dalam pesanan (qty, harga, DTF status) |
| `ledgers` | Entri keuangan double-entry per mitra |
| `action_requests` | Permintaan pembatalan & retur |
| `audit_logs` | Trail aktivitas semua pengguna |
| `order_priorities` | Daftar pesanan prioritas per mitra |

---

## Infrastruktur & Deployment

| Komponen | Layanan | Keterangan |
|----------|---------|-----------|
| **Frontend** | Vercel CDN | Static files dari `/dist/`, SPA fallback |
| **API** | Vercel Serverless | Node.js runtime, max 30 detik/request |
| **Database** | Neon PostgreSQL | Serverless, HTTP driver (tanpa koneksi TCP persisten) |
| **File Storage** | Cloudflare R2 | S3-compatible, public via `storage.jisoi.net` |
| **Domain** | `redone.my.id` | DNS via Cloudflare, SSL dari Vercel |

**Catatan deployment:**
- Frontend dan API di-deploy dari satu repository (monorepo)
- `vercel.json` mengatur routing: `/api/*` → serverless, semua lainnya → `index.html`
- Environment variables dikelola via Vercel Dashboard

---

## Keamanan

- **Autentikasi:** JWT (HS256) dengan masa berlaku 7 hari
- **Password:** Di-hash dengan bcryptjs sebelum disimpan
- **Lockout:** Akun terkunci otomatis setelah 5 kali gagal login (15 menit)
- **Role-based UI:** Menu dan fitur difilter berdasarkan role pengguna
- **Token storage:** JWT disimpan di localStorage browser
- **CORS:** Origin yang diizinkan dikonfigurasi via environment variable

---

## Status & Pencapaian

| Fitur | Status |
|-------|--------|
| Manajemen pesanan (CRUD + status flow) | ✅ Live |
| Manajemen mitra | ✅ Live |
| Manajemen produk | ✅ Live |
| Manajemen pengguna | ✅ Live |
| Ledger keuangan | ✅ Live |
| Upload file ke Cloudflare R2 | ✅ Live |
| Laporan PDF | ✅ Live |
| Antrian produksi | ✅ Live |
| Prioritas pesanan | ✅ Live |
| Pembatalan & retur | ✅ Live |
| Audit log | ✅ Live |
| PWA installable | ✅ Live |
| E2E testing (84% pass rate) | ✅ Selesai |

**URL Production:** https://redone.my.id  
**Versi saat ini:** 2.5.0  
**Total fase pengembangan:** 25 fase selesai

---

## Riwayat Singkat Pengembangan

| Fase | Pencapaian |
|------|-----------|
| v1.0 | Aplikasi client-side penuh (localStorage) |
| v2.0 | Migrasi ke backend API + Neon PostgreSQL + Cloudflare R2 |
| v2.5 | Deploy ke Vercel production, PWA, UI consistency system |
| v2.5.x | E2E testing, UI polish, Finance enterprise dashboard, Order Priority |

---

*Dokumen ini diperbarui: 2026-05-29*  
*Kontak teknis: nurhasanfadillah@gmail.com*
