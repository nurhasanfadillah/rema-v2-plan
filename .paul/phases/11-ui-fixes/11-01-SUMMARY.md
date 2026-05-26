---
phase: 11-ui-fixes
plan: 01
subsystem: ui
tags: [react, dashboard, filter, running-orders, recharts]

requires:
  - phase: 9-e2e-testing
    provides: identified UI display issues via E2E testing

provides:
  - Running orders ticker hanya menampilkan order status confirmed
  - Grafik pesanan masuk exclude draft/waiting_confirmation/cancelled/returned
  - Tabel ringkas 10 order confirmed terakhir di dashboard (admin/staff)

affects: []

tech-stack:
  added: []
  patterns:
    - "Filter status array (EXCLUDED_STATUSES) didefinisikan di dalam useMemo"
    - "Tabel kondisional berdasarkan user.role !== 'mitra'"

key-files:
  created: []
  modified:
    - src/components/RunningOrders.tsx
    - src/pages/Dashboard.tsx

key-decisions:
  - "Tabel ringkas hanya tampil untuk role selain mitra (admin/staff/operational)"
  - "EXCLUDED_STATUSES didefinisikan inside useMemo, bukan sebagai konstanta modul"

patterns-established:
  - "Filter status order: gunakan array EXCLUDED_STATUSES + .includes() untuk readability"

duration: ~5min
started: 2026-05-26T00:00:00Z
completed: 2026-05-26T00:05:00Z
---

# Phase 11 Plan 01: UI Fixes Summary

**Running orders ticker di-filter ke status confirmed; grafik dashboard exclude status non-aktif; tabel ringkas 10 order confirmed terakhir ditambahkan ke dashboard.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~5 menit |
| Tasks | 3/3 completed |
| Files modified | 2 |
| TypeScript errors | 0 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: RunningOrders hanya tampilkan status confirmed | Pass | Filter `o.status === 'confirmed'` sebelum sort/slice |
| AC-2: Grafik exclude draft/waiting_confirmation/cancelled/returned | Pass | EXCLUDED_STATUSES filter di chartData useMemo |
| AC-3: Tabel ringkas 10 order confirmed terakhir | Pass | useMemo + tabel JSX dengan badge Online/Offline |

## Accomplishments

- Ticker RunningOrders sekarang hanya menampilkan order yang benar-benar aktif dikonfirmasi
- Grafik pesanan masuk mencerminkan order aktif saja — noise dari draft dan status terminal dihapus
- Dashboard admin mendapat ringkasan cepat 10 order confirmed terbaru dengan info mitra, qty, dan jenis

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/components/RunningOrders.tsx` | Modified | Filter confirmed sebelum sort; fallback text diupdate |
| `src/pages/Dashboard.tsx` | Modified | Chart filter + useMemo recentConfirmedOrders + tabel JSX |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Tabel hanya tampil untuk non-mitra | Mitra tidak perlu melihat order mitra lain | Menjaga UI bersih untuk mitra |
| EXCLUDED_STATUSES di dalam useMemo | Tidak perlu konstanta modul level, hanya dipakai satu tempat | Lebih sederhana |

## Deviations from Plan

None — plan dieksekusi sesuai spesifikasi.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Semua 11 fase v2.1–v2.5 selesai; aplikasi production-ready penuh
- UI data display konsisten dengan status order yang bermakna

**Concerns:**
- Tidak ada

**Blockers:**
- None

---
*Phase: 11-ui-fixes, Plan: 01*
*Completed: 2026-05-26*
