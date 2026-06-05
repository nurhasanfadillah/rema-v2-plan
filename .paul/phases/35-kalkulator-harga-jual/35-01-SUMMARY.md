# Summary: Phase 35 Plan 01 — Backend price_calculations

**Completed:** 2026-06-05
**Status:** All tasks PASS

## What Was Built

- Tabel `price_calculations` ditambah ke `src/db/schema.ts` (tanpa FK ke products — intentional)
- API route `src/api/routes/price-calculations.ts`: GET / POST / DELETE dengan role check (admin+mitra) dan ownership filter (userId = req.user.sub)
- Route di-mount di `src/api/index.ts` sebagai `/api/price-calculations`
- `npm run db:push` berhasil — tabel tersedia di Neon DB

## Files Modified

| File | Change |
|------|--------|
| `src/db/schema.ts` | Tambah tabel `priceCalculations` + types `PriceCalculation` + `NewPriceCalculation` |
| `src/api/routes/price-calculations.ts` | File baru — GET/POST/DELETE endpoints |
| `src/api/index.ts` | Mount priceCalculationsRouter di `/api/price-calculations` |

## Acceptance Criteria

| AC | Status |
|----|--------|
| AC-1: Schema terdaftar di DB | ✅ PASS — db:push berhasil |
| AC-2: POST simpan kalkulasi | ✅ PASS — insert dengan validasi required fields |
| AC-3: GET hanya tampilkan milik sendiri | ✅ PASS — filter `eq(userId, req.user.sub)` |
| AC-4: DELETE hanya bisa milik sendiri | ✅ PASS — ownership check sebelum delete |
| AC-5: Role check admin+mitra | ✅ PASS — ALLOWED_ROLES check di semua handler |

## Decisions

- `productId` sengaja tanpa `.references()` — kalkulasi tetap valid meskipun produk dihapus/diubah
- `qty` default 1 di backend jika tidak dikirim atau < 1
- Role check pakai `ALLOWED_ROLES` const array untuk konsistensi

## Deviations

- Tidak ada

## For Plan 35-02

Types tersedia: `PriceCalculation`, `NewPriceCalculation` dari `src/db/schema.ts`
Endpoint siap: `GET/POST/DELETE /api/price-calculations`
