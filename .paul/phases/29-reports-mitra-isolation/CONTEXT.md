# Phase 29 Context: Reports Mitra Data Isolation Fix

## Phase Goal

Mitra hanya dapat melihat data milik dirinya sendiri di halaman Laporan — orders dan ledgers difilter by mitra yang sedang login.

## Problem Statement

Saat ini role `mitra` login dan buka halaman `/reports`, mereka melihat data dari **semua mitra**. Ada dua bug yang menyebabkan ini:

### Bug 1 — Frontend timing race (`Reports.tsx:32-37`)
```tsx
// mitras masih [] saat useState diinisialisasi (async belum selesai)
// mitras.find(...) → undefined → fallback ke 'all'
const [finMitraId, setFinMitraId] = useState(
  user?.role === 'mitra' ? mitras.find(m => m.userId === user?.id)?.id || 'all' : 'all'
);
const [ordMitraId, setOrdMitraId] = useState(
  user?.role === 'mitra' ? mitras.find(m => m.userId === user?.id)?.id || 'all' : 'all'
);
```
Filter selalu `'all'` untuk mitra karena `mitras` array masih kosong saat state diinisialisasi.

### Bug 2 — Backend tidak enforce role (`orders.ts:10-30`, `ledgers.ts:10-22`)
```ts
// Hanya filter jika ada ?mitraId= query param
// Tidak ada pengecekan role — mitra bisa GET semua data
const allOrders = mitraId
  ? await db.select().from(orders).where(eq(orders.mitraId, mitraId))
  : await db.select().from(orders); // ← semua data!
```
API tidak memvalidasi role — mitra dapat mengakses semua data tanpa parameter apapun.

## Goals

1. **Backend enforcement (primary — security)**: `GET /api/orders` dan `GET /api/ledgers` harus otomatis filter by mitra jika `req.user.role === 'mitra'`
2. **Frontend fix (defense in depth)**: `Reports.tsx` harus update `finMitraId`/`ordMitraId` via `useEffect` setelah `mitras` selesai di-load

## Approach

### Backend (`src/api/routes/orders.ts` + `src/api/routes/ledgers.ts`)
- Jika `req.user.role === 'mitra'`, cari mitraId dari tabel `mitras` by `userId === req.user.sub`
- Enforce filter ke mitraId tersebut — override query param apapun
- Admin/staff/operational tetap bisa akses semua data (dengan optional `?mitraId=` filter)

### Frontend (`src/pages/Reports.tsx`)
- Tambah `useEffect` yang watch `[mitras, user]`
- Jika `user.role === 'mitra'` dan `mitras` sudah ter-load, set `finMitraId` dan `ordMitraId` ke `mitras.find(m => m.userId === user.id)?.id`
- Filter dropdown mitra sudah hidden untuk role mitra (tidak perlu UI change)

## Files to Change

- `src/api/routes/orders.ts` — enforce mitra filter di GET /
- `src/api/routes/ledgers.ts` — enforce mitra filter di GET /
- `src/pages/Reports.tsx` — fix timing bug dengan useEffect

## Constraints

- Tidak perlu perubahan schema DB
- Tidak perlu endpoint baru
- Backend menggunakan `req.user.sub` (dari JWT) sebagai `userId` untuk lookup mitraId
- Harus lookup mitraId dari tabel `mitras` karena JWT hanya menyimpan `sub` (userId), bukan `mitraId`

## Open Questions

- Apakah perlu cek endpoint lain selain orders + ledgers di halaman Reports? (Saat ini: tidak — scope sudah jelas)
