# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-05-26)

**Core value:** Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.
**Current focus:** v2.5 — UI Fixes selesai, aplikasi production-ready penuh

## Current Position

Milestone: v2.8 Modal Center Fix
Phase: 14 of 14 (Modal Akun Center) — Complete
Plan: 14-01 COMPLETE
Status: Phase 14 complete — v2.8 Modal Akun Center selesai
Last activity: 2026-05-26 — Plan 14-01 UNIFY complete, Phase 14 done

Progress:
- Milestone: [██████████] 100%
- Phase 14: [██████████] 100%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete — Phase 14 done]
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

Last session: 2026-05-26
Stopped at: Phase 14 complete — UNIFY done
Next action: Tidak ada phase berikutnya — buat milestone/phase baru jika ada pekerjaan selanjutnya
Resume file: .paul/phases/14-modal-akun-center/14-01-SUMMARY.md

---
*STATE.md — Updated after every significant action*
