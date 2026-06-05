# Phase 35 — Kalkulator Harga Jual: Context

## Phase Summary

Halaman kalkulator harga jual untuk role `admin` dan `mitra`. Kalkulasi bertahap dari harga pokok ke harga final marketplace, dengan penyimpanan riwayat per user (hanya bisa dilihat oleh yang membuat).

## Goals

1. **Kalkulator interaktif** — pilih produk, input parameter, output live bertahap
2. **Simpan riwayat** — hasil kalkulasi tersimpan di DB, filtered by userId
3. **Role-restricted** — hanya `admin` dan `mitra` yang bisa akses halaman ini

## Rumus Kalkulasi

```
Harga Jual    = Harga Pokok ÷ (1 - margin%)
Harga MP      = Harga Jual ÷ (1 - adminMP%)
Harga Final N = Harga Final N-1 ÷ (1 - lainnyaN%)   // jika tipe persen
              = Harga Final N-1 + lainnyaN            // jika tipe nominal
```

- Margin dihitung dari Harga Jual (bukan Harga Pokok)
- Admin MP dihitung dari Harga Marketplace
- Lainnya maksimal 4 layer (Harga Final 1–4)
- Setiap layer Lainnya bersifat opsional

## Scope

### Backend

- **Tabel baru `price_calculations`:**
  - `id` (uuid)
  - `userId` (string — dari JWT `sub`)
  - `productId` (string, nullable — jika produk dipilih)
  - `productName` (string — snapshot nama produk saat disimpan)
  - `hargaPokok` (integer)
  - `margin` (numeric — persen)
  - `adminMP` (numeric — persen)
  - `additionals` (jsonb — array `[{label, value, type: 'nominal'|'persen'}]`, maks 4)
  - `hargaJual` (integer — hasil kalkulasi)
  - `hargaMP` (integer — hasil kalkulasi)
  - `hargaFinals` (jsonb — array hasil `[hargaFinal1, hargaFinal2, ...]`)
  - `createdAt` (bigint — Unix ms)

- **Endpoints:**
  - `GET /api/price-calculations` — list riwayat milik user sendiri (filter by `req.user.sub`)
  - `POST /api/price-calculations` — simpan hasil kalkulasi baru
  - `DELETE /api/price-calculations/:id` — hapus riwayat (hanya milik sendiri)

- **Drizzle schema** di `src/db/schema.ts`
- **Route** di `src/api/routes/price-calculations.ts`
- **Mount** di `src/api/index.ts`

### Frontend

- **Halaman `/calculator`** (`src/pages/Calculator.tsx`)
- **Komponen form kalkulator:**
  - Dropdown pilih produk → auto-isi Harga Pokok dari `hargaSatuan` (editable)
  - Input: Margin (%), Admin MP (%)
  - Section Lainnya: tombol "+ Tambah" (maks 4), setiap row ada label, nilai, toggle nominal/persen, dan tombol hapus
  - Output live (update saat input berubah): Harga Jual, Harga MP, Harga Final 1–4
  - Tombol "Simpan Kalkulasi"
- **Panel Riwayat** — daftar kalkulasi tersimpan, tampilkan: nama produk, harga pokok, harga final terakhir, tanggal. Tombol hapus per item.
- **Nav link** di `Layout.tsx` sidebar — hanya tampil untuk role `admin` dan `mitra`

### Access Control

- Frontend: nav link di-filter by role (`admin` | `mitra`)
- Backend: semua endpoint butuh auth (`requireAuth`), data di-filter by `req.user.sub`

## Approach Notes

- Harga Pokok default dari `products.hargaSatuan`, tapi user bisa override tanpa mengubah data produk
- `productName` di-snapshot saat simpan agar riwayat tetap valid jika produk dihapus/diubah
- Kalkulasi 100% di frontend (tidak perlu API call untuk hitung) — API hanya untuk simpan/load riwayat
- Gunakan pola halaman existing (page-header, card-sm, btn-primary) untuk konsistensi UI
- Timestamps: Unix milliseconds (`Date.now()`)

## Open Questions

- (none — scope sudah cukup jelas untuk planning)

## Dependencies

- Phase 34 complete ✅ — codebase stabil
- `products` table sudah ada dengan field `hargaSatuan`
- Auth middleware (`AuthRequest`) sudah konsisten di route handlers

---
*Created: 2026-06-05 — discuss phase 35*
