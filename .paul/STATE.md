# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-05-29)

**Core value:** Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.
**Current focus:** UI Enhancement — Orders list product items display

## Current Position

Milestone: Kalkulator Harga Jual
Phase: 35 (Kalkulator Harga Jual) — In Progress
Plan: 35-03 created, awaiting approval
Status: PLAN created, ready for APPLY
Last activity: 2026-06-06 — Plan 35-03 UI layout fix Calculator dibuat

Progress:
- Phase 35: [█████░░░░░] 50% (1 of 2 plans complete)
- All phases: 34 phases complete, Phase 35 in progress

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ○        ○     [Plan 35-03 created, awaiting approval]
```

## Accumulated Context

### Decisions
| Decision | Phase | Impact |
|----------|-------|--------|
| Mount PWAUpdateBanner di wrapper div utama Layout (bukan Content Area) | Phase 28 | Banner fixed-bottom tidak terpotong overflow-hidden |
| Backend enforce mitra filter (orders + ledgers API) | Phase 29 | Data isolation reliable — tidak bisa di-bypass dari frontend |
| Role + ownership check di orders/requests API | Phase 33 | Mitra tidak bisa akses/modifikasi order mitra lain; hanya admin/staff approve requests |
| AuthRequest type di route handlers yang akses req.user | Phase 29 | Konsisten dengan priorities.ts; fix TS type error |
| Submit cancel/return → pending ActionRequest (bukan eksekusi langsung) | Phase 34 | Approval workflow — backend eksekusi hanya saat admin/staff approve |
| 'pending' ditambah ke RequestStatus union | Phase 34 | Backend support 'pending' sejak 34-01 tapi frontend type belum ada |

### Blockers/Concerns
- None

### Deferred Issues
- None

## Session Continuity

Last session: 2026-06-06
Stopped at: Plan 35-02 created — Frontend Calculator halaman + nav link + riwayat
Next action: Review plan lalu jalankan /paul:apply .paul/phases/35-kalkulator-harga-jual/35-02-PLAN.md
Resume file: .paul/phases/35-kalkulator-harga-jual/35-02-PLAN.md

---
*STATE.md — Updated after every significant action*
