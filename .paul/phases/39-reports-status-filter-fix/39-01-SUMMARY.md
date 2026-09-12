---
phase: 39-reports-status-filter-fix
plan: 01
completed: 2026-09-12T14:30:44Z
duration: 5min
---

# Phase 39 Plan 01: Reports Status Filter Fix Summary

**Filter status di halaman Laporan tab Pesanan diperluas dari 6 → 10 opsi (menambahkan `pressing`, `packing`, `cancelled` yang hilang) dan 4 label disamakan dengan `STATUS_LABELS` di `OrderDetail.tsx` untuk konsistensi seluruh app.**

## AC Result

| Criterion | Status |
|-----------|--------|
| AC-1: Filter status lengkap 10 opsi | Pass |
| AC-2: Filter berfungsi untuk 3 status baru (pressing/packing/cancelled) | Pass (structural — filter logic unchanged, options exist) |
| AC-3: Label konsisten dengan STATUS_LABELS di OrderDetail | Pass |

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Reports.tsx` (baris 316-327) | Modified — 6 `<option>` diganti dengan 10 `<option>` lengkap urut alur bisnis; label disamakan dengan STATUS_LABELS di OrderDetail.tsx |

## Verification

- `npm run lint` (tsc --noEmit): exit 0 — 0 TypeScript error.
- Structural check: 10 opsi terkonfirmasi di file, urutan match alur bisnis (draft → cancelled).
- Runtime browser check: deferred to user (interactive test di `/reports` tab Pesanan).

## Label Changes (Alignment dengan OrderDetail.tsx)

| Before | After |
|--------|-------|
| Menunggu | Menunggu Konfirmasi |
| Diproses | Proses Produksi |
| Dikirim | Terkirim/Selesai |
| Retur | Pesanan Retur |
| — (missing) | Press Sablon |
| — (missing) | Sedang Packing |
| — (missing) | Dibatalkan |

## Deviations

None — plan executed exactly as specified.

## Deferred (logged di STATE.md)

- Extract `STATUS_LABELS` ke `src/lib/order-status.ts` sebagai shared constant (saat ini terduplikasi di OrderDetail.tsx + OrderSPKPDF.tsx + Reports.tsx).
- Evaluasi apakah status `cancelled` / `returned` seharusnya exclude dari kalkulasi `totalQty` / `totalSubtotal` / chart di tab Pesanan.

---
*Completed: 2026-09-12*
