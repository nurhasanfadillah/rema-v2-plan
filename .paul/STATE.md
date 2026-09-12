# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-13)

**Core value:** Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.
**Current focus:** Phase 40 complete — halaman Antrian Produksi fokus pada 4 status alur aktif (menunggu, dikonfirmasi, diproses, sablon); packing exclude.

## Current Position

Milestone: v2.5 UI Fixes (rolling)
Phase: 40 (Queue Filter Adjustment) — Complete
Plan: Not started
Status: Ready to plan next phase
Last activity: 2026-09-13 — Phase 40 transitioned; PROJECT.md + ROADMAP.md evolved

Progress:
- Phase 40: [██████████] 100% (1 of 1 plans complete)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop 40 closed — Phase 40 complete]
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
| mitraId di-override dari JWT di POST /api/orders | Phase 38 | Prevent cross-mitra order creation; tidak trust body |
| Credit limit backend dari SUM(totalAmount) orders isBilled=false | Phase 38 | Konsisten dengan logika frontend; simpel tanpa query ledger |
| Upload limit 50MB + Vercel memory 1024MB | Phase 38 | File desain garmen sering >10MB |
| Filter status Reports selaras dengan STATUS_LABELS OrderDetail (duplicate accepted) | Phase 39 | Konsistensi label UI tanpa refactor ekstraksi shared constant (deferred) |
| Antrian Produksi exclude `packing` (dianggap sudah lepas dari antrian aktif) | Phase 40 | `packing` set `isBilled=true` — secara bisnis sudah masuk fase billing/kirim |
| Antrian Produksi include `waiting_confirmation` di kepala alur | Phase 40 | Operator perlu visibilitas pesanan yang belum di-confirm agar bisa dikejar approval |
| Label card AppQueue ringkas (Menunggu/Dikonfirmasi/Diproses/Sablon) | Phase 40 | Grid card kompak butuh label pendek; konteks berbeda dari dropdown/badge full |

### Git State
Last commit: a079456 — feat(40): queue filter adjustment - antrian produksi fokus 4 status aktif
Branch: main
Feature branches merged: none

### Blockers/Concerns
- None

### Deferred Issues
- Extract `STATUS_LABELS` ke `src/lib/order-status.ts` sebagai shared constant (saat ini duplicate di OrderDetail.tsx + OrderSPKPDF.tsx + Reports.tsx).
- Evaluasi apakah `cancelled`/`returned` harus exclude dari kalkulasi `totalQty`/`totalSubtotal`/chart di tab Pesanan (saat ini ikut, sedangkan tab Keuangan exclude `cancellation`/`return`).

## Session Continuity

Last session: 2026-09-13
Stopped at: Phase 40 transition complete — committed ke git
Next action: /paul:discuss atau /paul:plan untuk phase baru, atau selesai
Resume file: .paul/ROADMAP.md

---
*STATE.md — Updated after every significant action*
