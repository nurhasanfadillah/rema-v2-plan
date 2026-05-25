---
phase: 04-deploy-vercel
plan: 01
subsystem: infra
tags: [vercel, cloudflare, dns, cors, deployment]

requires:
  - phase: 03-file-storage-r2
    provides: R2 upload endpoint + FileUpload migration siap production

provides:
  - Aplikasi REMA live di https://redone.my.id
  - Vercel project terkonfigurasi (env vars, domain, SSL)
  - vercel.json production-ready (includeFiles: src/**, maxDuration: 30)
  - CORS multi-origin support

affects: []

tech-stack:
  added: []
  patterns: ["CORS_ORIGIN comma-separated string untuk multi-origin", "Cloudflare DNS proxy OFF untuk domain Vercel"]

key-files:
  created: []
  modified: [vercel.json, src/api/index.ts]

key-decisions:
  - "CORS_ORIGIN multi-origin via comma-separated env var"
  - "Cloudflare DNS proxy OFF agar Vercel bisa provision SSL cert sendiri"
  - "Scope Vercel deploy: nurhasan-fadillahs-projects (perlu --scope flag)"

patterns-established:
  - "Vercel deploy: npx vercel --token=... deploy --prod --yes --scope nurhasan-fadillahs-projects"

duration: ~2 jam
started: 2026-05-25T08:00:00Z
completed: 2026-05-25T10:10:00Z
---

# Phase 4 Plan 01: Deploy ke Vercel Summary

**Aplikasi REMA v2.1 live di https://redone.my.id — frontend + API + R2 berjalan di production Vercel dengan Neon DB dan Cloudflare R2.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~2 jam |
| Started | 2026-05-25 |
| Completed | 2026-05-25 |
| Tasks | 3 completed (2 auto + 1 checkpoint) |
| Files modified | 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Build frontend berhasil | Pass | `npm run build` — exit 0, dist/ terbuat |
| AC-2: Vercel deployment live | Pass | https://rema-v2-plan.vercel.app dan https://redone.my.id aktif |
| AC-3: Custom domain redone.my.id aktif | Pass | A record → 76.76.21.21, SSL provisioned, HTTP 200 |
| AC-4: API berfungsi di production | Pass | Login 082113133165 berhasil, data Neon DB tampil |
| AC-5: File upload berfungsi di production | Pass | Approved oleh user di checkpoint |

## Accomplishments

- Vercel deployment production live: https://redone.my.id
- vercel.json diperluas `includeFiles: src/**` + `maxDuration: 30` agar semua API routes ter-bundle dan upload tidak timeout
- CORS diupgrade ke multi-origin (comma-separated) sehingga bisa serve production domain + localhost sekaligus
- Semua 8 env vars terkonfigurasi di Vercel (DATABASE_URL, JWT_SECRET, R2_*, CORS_ORIGIN)
- DNS A record dan CNAME dikonfigurasi di Cloudflare, SSL cert otomatis provisioned oleh Vercel

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `vercel.json` | Modified | includeFiles: src/**, maxDuration: 30 |
| `src/api/index.ts` | Modified | CORS multi-origin via CORS_ORIGIN env var |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| CORS_ORIGIN comma-separated | Mendukung multiple origin tanpa hardcode | Production + localhost dev berjalan bersamaan |
| Cloudflare DNS proxy OFF | Vercel perlu akses langsung untuk SSL cert provisioning | SSL cert berhasil auto-provisioned |
| vercel.json includeFiles: src/** | src/db/** tidak cukup — routes, middleware juga perlu ikut bundle | API serverless berjalan lengkap di Vercel |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Scope flag diperlukan untuk Vercel CLI |
| Blocker resolved | 1 | Cloudflare API token tidak punya DNS permission |

### Auto-fixed Issues

**1. Vercel CLI perlu --scope flag**
- **Found during:** Task 2 (deploy)
- **Issue:** Vercel CLI non-interactive mode membutuhkan `--scope` eksplisit
- **Fix:** Tambah `--scope nurhasan-fadillahs-projects` ke deploy command
- **Verification:** Deploy berhasil, project terhubung

### Blocker Resolved (dengan manual action)

**1. Cloudflare API token tidak punya Zone DNS permission**
- **Issue:** Token R2 yang ada hanya punya R2 permissions, tidak DNS
- **Resolution:** User membuat token baru dengan Zone DNS Edit permission, lalu menambahkan DNS records manual via Cloudflare dashboard
- **Outcome:** A record dan CNAME berhasil, domain aktif

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Env vars sudah ada (conflict saat POST) | Gunakan PATCH untuk update nilai |
| Cloudflare token auth error untuk DNS | User buat token baru + tambah DNS record manual |
| DNS propagation delay di browser user | Tunggu propagasi selesai (~10 menit) |

## Next Phase Readiness

**Ready:**
- Aplikasi fully live di https://redone.my.id
- Semua fitur berjalan: login, CRUD, file upload via R2
- Milestone v2.1 Production Migration selesai

**Concerns:**
- JWT_SECRET masih default placeholder — sebaiknya diganti ke random string production
- Bundle size frontend 2.5MB (warning dari Vite) — kandidat optimasi di versi berikutnya

**Blockers:** None — milestone complete

---
*Phase: 04-deploy-vercel, Plan: 01*
*Completed: 2026-05-25*
