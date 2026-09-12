---
phase: 40-queue-filter-adjustment
plan: 01
completed: 2026-09-13
duration: ~15min
---

# Phase 40 Plan 01: Queue Filter Adjustment Summary

**Halaman Antrian Produksi (`/app-queue`) sekarang hanya menampilkan pesanan yang sedang dalam antrian produksi aktif — 4 status: `waiting_confirmation`, `confirmed`, `processing`, `pressing`. Empat pipeline cards (MENUNGGU/DIKONFIRMASI/DIPROSES/SABLON) diselaraskan, status `packing` dikeluarkan penuh.**

## AC Result

| Criterion | Status |
|-----------|--------|
| AC-1: Filter status disesuaikan (waiting_confirmation → pressing, packing excluded) | Pass |
| AC-2: 4 pipeline cards menampilkan status baru dengan urutan alur (Menunggu → Sablon) | Pass |
| AC-3: Badge, mobile border, desktop table row disesuaikan (waiting_confirmation amber, packing dihapus, pressing label "Sablon") | Pass |

## Files Changed

| File | Change |
|------|--------|
| `src/pages/AppQueue.tsx` | Modified — 6 titik (import Hourglass, filter status, badge specs, pipelineStats, statusLeftBorder mobile, statusColor desktop) + 1 DRIFT-fix (text-amber-650 → text-amber-400) |

## Deviations

- **DRIFT auto-fixed:** Class `text-amber-650` tidak ada di `src/index.css` (proyek hanya define -650 untuk slate/blue/purple/indigo/pink/orange/red). Diganti ke `text-amber-400` (standard Tailwind, visual identik dengan pattern -650 proyek yang mirror shade -400).

## Verify

- `npm run lint` (`tsc --noEmit`) — pass tanpa error.
- Manual smoke test di `/app-queue` — deferred (user verifikasi setelah phase transition).

---
*Completed: 2026-09-13*
