---
phase: 08-ui-consistency
plan: 01
subsystem: ui
tags: [tailwind, css, design-system, components]

requires: []
provides:
  - "@layer components utility system di src/index.css"
  - "btn-primary, btn-secondary, btn-danger, btn-ghost, btn-success"
  - "card, card-sm, card-flat"
  - "page-title, section-title, label-xs, text-muted"
  - "page-wrapper, page-header"
affects: [08-02, 08-03]

tech-stack:
  added: []
  patterns: ["CSS utility-first component layer via @layer components"]

key-files:
  created: []
  modified: [src/index.css]

key-decisions:
  - "Tailwind v4: @apply tidak support sesama custom class — semua button variant di-expand inline"
  - "Border radius diperkecil: button rounded-xl → rounded-lg, card rounded-2xl → rounded-xl (permintaan user)"

patterns-established:
  - "Button: inline-flex + rounded-lg + px-4 py-2.5 + active:scale-95 sebagai standar"
  - "Card: rounded-xl + bg-slate-900/60 + border-slate-800/60 + p-5 sm:p-6"
  - "Typography: page-title (text-xl sm:text-2xl), section-title (text-base), label-xs (text-[10px] uppercase)"

duration: ~15min
completed: 2026-05-26
---

# Phase 8 Plan 01: CSS Foundation Summary

**Tambah `@layer components` di `src/index.css` berisi 14 utility classes untuk button, card, typography, dan layout — fondasi sistem desain konsisten untuk semua halaman.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 menit |
| Completed | 2026-05-26 |
| Tasks | 2 completed |
| Files modified | 1 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Button utilities tersedia dan konsisten | Pass | 5 varian terdefinisi, radius diubah ke rounded-lg per permintaan user |
| AC-2: Card utility tersedia | Pass | 3 varian: card, card-sm, card-flat |
| AC-3: Typography utilities tersedia | Pass | page-title, section-title, label-xs, text-muted + page-wrapper, page-header |
| AC-4: Build tidak error | Pass | `✓ built in 23.19s` |

## Accomplishments

- 14 utility classes terdefinisi dalam satu `@layer components` block di `src/index.css`
- Button system standar: 5 warna varian (primary, secondary, danger, ghost, success) + 2 ukuran modifier (sm, lg)
- Card system: 3 varian dengan radius dan padding konsisten
- Typography hierarchy: page-title → section-title → label-xs (3 level)
- Build tetap berjalan clean, zero visual regression (classes belum dipakai di halaman)

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/index.css` | Modified (+80 baris) | Tambah `@layer components` di akhir file |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Expand button inline daripada `@apply btn btn-md` | Tailwind v4 tidak support `@apply` sesama custom class di `@layer components` | Semua button variant lebih verbose tapi valid |
| Border radius diperkecil (rounded-xl→rounded-lg, rounded-2xl→rounded-xl) | Permintaan user saat review | Tampilan lebih bersih/modern, konsisten di semua button dan card |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Build error diperbaiki tanpa re-plan |
| Scope adjustments | 1 | Radius diperkecil atas permintaan user |

### Auto-fixed Issues

**1. Tailwind v4 @apply limitation**
- **Found during:** Task 2 (verify build)
- **Issue:** `Cannot apply unknown utility class 'btn'` — Tailwind v4 tidak bisa `@apply` sesama class di `@layer components`
- **Fix:** Expand semua properties button inline di setiap varian
- **Verification:** `npm run build` clean setelah fix

## Next Phase Readiness

**Ready:**
- Semua utility classes tersedia di global CSS, siap dipakai di `.tsx` files
- Plan 08-02 dapat langsung mengganti hardcoded classes dengan `.btn-primary`, `.card`, `.page-title`, dll.

**Concerns:**
- Beberapa halaman memakai `rounded-xl` / `rounded-2xl` hardcoded — saat Plan 08-02 apply, perlu diubah ke `rounded-lg` / `rounded-xl` agar konsisten dengan utility system baru

**Blockers:** None

---
*Phase: 08-ui-consistency, Plan: 01*
*Completed: 2026-05-26*
