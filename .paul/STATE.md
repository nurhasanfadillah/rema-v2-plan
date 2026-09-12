# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-13)

**Core value:** Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.
**Current focus:** Phase 41 complete — header `OrderDetail.tsx` kini menampilkan nama mitra inline (`{orderNumber} — {mitraName}`).

## Current Position

Milestone: v2.5 UI Fixes (rolling)
Phase: 41 (Order Detail: Mitra Name in Header) — Complete
Plan: 41-01 unified, loop closed
Status: Ready for transition (PROJECT.md + ROADMAP.md evolve, git commit)
Last activity: 2026-09-13 — Created .paul/phases/41-order-detail-mitra-name/41-01-SUMMARY.md

Progress:
- Phase 41: [██████████] 100% (1 of 1 plans complete)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop 41 closed — Phase 41 complete]
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
| Nama mitra ditampilkan inline di `h1` OrderDetail (`{orderNumber} — {mitraName}`) | Phase 41 | Opsi inline (bukan baris baru) dipilih agar header tetap compact; em dash separator konsisten dengan konvensi tipografi UI |
| Fallback `orderMitra ? ` — ${name}` : ''` (tidak crash saat mitra dangling) | Phase 41 | Data mitraId adalah FK — seharusnya tidak dangling, tapi ternary check membuat kode robust terhadap edge case data anomali |

### Git State
Last commit: 4375451 — chore(40): record git state in STATE.md after phase commit
Branch: main
Feature branches merged: none
Pending: Phase 41 changes not yet committed (SUMMARY + STATE + OrderDetail.tsx + PLAN + CONTEXT)

### Blockers/Concerns
- None

### Deferred Issues
- Extract `STATUS_LABELS` ke `src/lib/order-status.ts` sebagai shared constant (saat ini duplicate di OrderDetail.tsx + OrderSPKPDF.tsx + Reports.tsx).
- Evaluasi apakah `cancelled`/`returned` harus exclude dari kalkulasi `totalQty`/`totalSubtotal`/chart di tab Pesanan (saat ini ikut, sedangkan tab Keuangan exclude `cancellation`/`return`).

## Session Continuity

Last session: 2026-09-13
Stopped at: Loop 41 closed — SUMMARY dibuat, menunggu transition (PROJECT.md + ROADMAP.md evolve + git commit)
Next action: transition Phase 41 (evolve docs, commit), lalu route ke phase berikutnya atau selesai
Resume file: .paul/phases/41-order-detail-mitra-name/41-01-SUMMARY.md

---
*STATE.md — Updated after every significant action*
