# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-05-26)

**Core value:** Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.
**Current focus:** v2.5 — UI Fixes selesai, aplikasi production-ready penuh

## Current Position

Milestone: v3.4 Cancellations Returns Polish
Phase: 21 (Cancellations Returns Polish) — Complete
Plan: 21-01 SUMMARY created
Status: Phase 21 complete
Last activity: 2026-05-27 — UNIFY 21-01 complete

Progress:
- Phase 21: [██████████] 100% (complete)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Phase 21 — loop complete]
```

## Accumulated Context

### Decisions
| Decision | Phase | Impact |
|----------|-------|--------|
| Custom domain storage.jisoi.net untuk R2 public URL | Phase 3 | Vercel env vars pakai URL ini |
| CORS_ORIGIN multi-origin via comma-separated string | Phase 4 | Production + localhost bersamaan |
| Edit Profil dihapus (updateUser hanya local state) | Phase 5 | Profile drawer bersih, tidak menyesatkan |
| vite-plugin-pwa generateSW, no runtime caching | Phase 7 | Data API tetap online-only, aset statis di-precache |
| maximumFileSizeToCacheInBytes 3MiB | Phase 7 | Bundle JS 2.55MB melebihi default 2MiB Workbox |
| @layer components utility system di index.css | Phase 8 | Single source of truth untuk semua design tokens |
| AppQueue items-end + underline decoration dipertahankan | Phase 8 | Visual identity unik per halaman tetap ada |
| express.raw() per-route untuk binary upload | Phase 10 | for-await stream tidak reliable di Vercel serverless |

### Infrastructure (production aktif)
- Neon DB: ep-twilight-mountain-aoaf3qy4-pooler.c-2.ap-southeast-1.aws.neon.tech
- R2 bucket: rema-v2, public URL: https://storage.jisoi.net
- Vercel: https://redone.my.id (LIVE, PWA installable, upload berfungsi)

### Known Issues (deferred, bukan blocker)
- isBilled/ledger billing logic client-side only (OrderDetail.tsx:139) — tidak terpicu via API langsung
- "Unknown User" di audit logs untuk API calls tanpa user name di payload

## Session Continuity

Last session: 2026-05-27
Stopped at: UNIFY 21-01 selesai — phase 21 complete
Next action: phase berikutnya atau selesai
Resume file: .paul/phases/21-cancellations-returns-polish/21-01-SUMMARY.md

---
*STATE.md — Updated after every significant action*
