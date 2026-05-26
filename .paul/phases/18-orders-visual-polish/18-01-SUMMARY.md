---
phase: 18-orders-visual-polish
plan: 01
subsystem: ui
tags: [react, tailwind, orders, badge, pagination, filter]

requires:
  - phase: 17-login-ui-redesign
    provides: app stable, baseline clean

provides:
  - OrdersList visual polish: dark-glow badge, typography, mobile card hierarchy, search clear, pagination
  - Filter dropdown dikembalikan ke preferensi user dengan qty+count
  - Pagination selalu tampil (prev/next tidak hidden)

affects: []

tech-stack:
  added: []
  patterns:
    - "Dark-theme badge: bg-*/15 + text-*/300 + border-*/30 + shadow glow — pattern reusable di halaman lain"

key-files:
  modified: [src/pages/orders/OrdersList.tsx]

key-decisions:
  - "Filter chips ditolak user saat checkpoint — dikembalikan ke dropdown (preferensi UX user)"
  - "Pagination prev/next selalu tampil (bukan conditional totalPages > 1) agar selalu visible"

patterns-established:
  - "Badge dark-theme: bg-{color}-500/15, text-{color}-300, border-{color}-500/30, shadow-{color}-500/20"

duration: ~20min
started: 2026-05-27T00:00:00Z
completed: 2026-05-27T00:00:00Z
---

# Phase 18 Plan 01: Orders Visual Polish Summary

**OrdersList.tsx diperhalus: status badge dark-theme glow, filter dropdown lebih kontras dengan qty+count, mobile card customer-name dominan, label typography dikurangi uppercase-nya, search clear button, dan pagination kompak yang selalu tampil.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 menit |
| Tasks | 3 auto + 1 checkpoint (dengan 1 iterasi fix) |
| Files modified | 1 |
| TypeScript errors | 0 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Status badge dark-theme glow | Pass | bg-*/15 + glow shadow per warna status |
| AC-2: Filter status horizontal chips | Deviated → Pass | User memilih dropdown — dikembalikan dengan styling lebih baik + qty+count |
| AC-3: Typography kurangi uppercase | Pass | Label "Tipe"/"Total" mobile card tidak lagi uppercase tracking-widest |
| AC-4: Mobile card customer name dominan | Pass | Nama mitra besar+terang di atas, order number kecil abu di bawah |
| AC-5: Search bar clear button | Pass | Tombol × muncul saat ada input, search focus bg lebih terang |
| AC-6: Pagination kompak | Pass | Single row dengan card container, prev/next selalu tampil |

## Accomplishments

- Status badge seluruh status dikonversi ke dark-theme — konsisten dengan app dark mode
- Filter dropdown diperbarui: teks lebih terang (`text-slate-200`), border lebih kontras (`border-slate-700`), menampilkan `N pesanan (N pcs)` per opsi
- Mobile card: nama customer jadi elemen dominan untuk role admin/staff
- Search bar: clear button (×) + `focus:bg-slate-800` filled surface
- Pagination: selalu tampil dengan container card, prev/next tidak disembunyikan

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/orders/OrdersList.tsx` | Modified | Visual polish — badge, filter, card, search, pagination |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Kembalikan filter ke dropdown | User lebih familiar dengan dropdown, chips ditolak di checkpoint | Dropdown dipertahankan dengan styling improved |
| Pagination selalu tampil | User tidak bisa melihat prev/next karena conditional `totalPages > 1` | Selalu render, disable saja saat di boundary |

## Deviations from Plan

### AC-2 — Filter Chips → Dropdown
- **Planned:** Horizontal scrollable chips
- **Actual:** Dropdown dikembalikan (user feedback di checkpoint)
- **Impact:** Positif — sesuai preferensi user, dropdown lebih familiar untuk usecase ini

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Badge dark-theme pattern siap direplikasi ke halaman lain (Mitra, Produk, dll)
- OrdersList stabil, semua fungsionalitas filter/search/pagination berfungsi

**Concerns:** None

**Blockers:** None

---
*Phase: 18-orders-visual-polish, Plan: 01*
*Completed: 2026-05-27*
