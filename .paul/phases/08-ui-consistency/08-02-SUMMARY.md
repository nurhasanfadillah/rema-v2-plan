---
phase: 08-ui-consistency
plan: 02
subsystem: ui
tags: [tailwind, css, design-system, buttons, typography, cards]

requires:
  - phase: 08-01
    provides: "@layer components utility classes di src/index.css"
provides:
  - "btn-danger diterapkan di Layout (logout)"
  - "btn-primary diterapkan di Users, Login"
  - "btn-secondary + btn-ghost diterapkan di Users modals"
  - ".card diterapkan di Dashboard (chart + info)"
  - ".section-title diterapkan di Dashboard headings"
  - ".label-xs diterapkan di Login form labels"
  - ".page-title + .page-header diterapkan di Users"
affects: [08-03]

tech-stack:
  added: []
  patterns: ["Utility class replacement — swap hardcoded className dengan @layer components"]

key-files:
  modified:
    - src/components/Layout.tsx
    - src/pages/Dashboard.tsx
    - src/pages/Login.tsx
    - src/pages/Users.tsx

key-decisions:
  - "Login submit button pakai py-4 override untuk mempertahankan tinggi button yang lebih besar"
  - "btn-primary di Users ditambah text-[10px] uppercase tracking-wider karena Add User button punya style teks khusus"

patterns-established:
  - "Page header pattern: .page-header wrapper + .page-title h1 + .btn-primary action"
  - "Modal form footer: .btn-ghost (cancel) + .btn-secondary (submit)"

duration: ~10min
completed: 2026-05-26
---

# Phase 8 Plan 02: Apply Utilities — Layout, Dashboard, Login, Users

**Apply 10 utility class replacements di 4 file utama — shell + halaman paling sering dilihat — tanpa perubahan fungsional.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~10 menit |
| Completed | 2026-05-26 |
| Tasks | 4 completed |
| Files modified | 4 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: btn-danger di Layout | Pass | Logout button pakai .btn-danger w-full |
| AC-2: .card di Dashboard | Pass | Chart card + info card diganti .card |
| AC-3: .label-xs di Login | Pass | Dua form labels pakai .label-xs |
| AC-4: page utilities di Users | Pass | page-header, page-title, btn-primary, btn-secondary, btn-ghost |
| AC-5: Build clean | Pass | ✓ built in 11.69s |

## Accomplishments

- 10 className replacements di 4 file — tidak ada perubahan fungsional
- Button consistency: logout, Add User, form submit/cancel kini dari satu sumber
- Card consistency: Dashboard cards pakai .card dengan radius/shadow/padding seragam
- Typography: form labels Login dan page title Users dari utility system

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/components/Layout.tsx` | Modified (2 changes) | btn-danger logout, label-xs nav |
| `src/pages/Dashboard.tsx` | Modified (4 changes) | .card x2, .section-title x2 |
| `src/pages/Login.tsx` | Modified (3 changes) | .label-xs x2, .btn-primary submit |
| `src/pages/Users.tsx` | Modified (5 changes) | page-header, page-title, btn-primary, btn-secondary, btn-ghost x2 |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Login submit: tambah `py-4` override | Login button lebih tinggi dari default .btn-primary (py-2.5) — dipertahankan untuk estetika form | Satu-satunya btn-primary dengan padding custom |
| btn-primary Users: tambah `text-[10px] uppercase tracking-wider` | Add User button punya label uppercase yang berbeda dari button biasa | Minor style addition, tidak melanggar utility system |

## Deviations from Plan

None — semua perubahan sesuai plan.

## Next Phase Readiness

**Ready:**
- Pattern button/card/typography sudah terbukti berjalan di 4 file
- Plan 08-03 tinggal replikasi pola yang sama ke 6 halaman sisanya

**Concerns:**
- Beberapa halaman (Mitras, Products, Finance) punya pattern card custom yang lebih kompleks — perlu review sebelum blindly apply .card

**Blockers:** None

---
*Phase: 08-ui-consistency, Plan: 02*
*Completed: 2026-05-26*
