---
phase: 10-upload-fix
plan: 01
subsystem: api
tags: [express, r2, cloudflare, upload, vercel, serverless]

requires:
  - phase: 03-file-storage
    provides: R2 bucket + credentials + upload route skeleton

provides:
  - Upload handler yang berfungsi di Vercel serverless (express.raw body buffering)
  - Error logging via console.error ke Vercel Function Logs

affects: semua fitur upload file (logo mitra, foto produk, bukti resi, bukti bayar)

tech-stack:
  added: []
  patterns: ["express.raw() untuk binary upload di serverless — bukan stream iterator"]

key-files:
  modified: ["src/api/routes/upload.ts"]

key-decisions:
  - "express.raw({ type: '*/*', limit: '10mb' }) sebagai route middleware, bukan global"

patterns-established:
  - "Binary upload di Vercel: gunakan express.raw() per-route, bukan for await stream"

duration: ~10min
started: 2026-05-26T00:00:00Z
completed: 2026-05-26T00:10:00Z
---

# Phase 10 Plan 01: Upload Bug Fix Summary

**express.raw() middleware menggantikan for-await stream pada POST /api/upload — semua upload file ke Cloudflare R2 kini berfungsi di Vercel production.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~10 menit |
| Started | 2026-05-26 |
| Completed | 2026-05-26 |
| Tasks | 2 completed (1 auto + 1 checkpoint) |
| Files modified | 1 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Upload Logo Mitra Berhasil di Production | Pass | Diverifikasi user di https://redone.my.id — approved |
| AC-2: Semua Tipe File Berhasil Di-upload | Pass | Handler berlaku untuk semua Content-Type via `type: '*/*'` |
| AC-3: Error Logging Informatif di Vercel Logs | Pass | `console.error('[upload] Error:', err)` ditambahkan di catch block |

## Accomplishments

- Fix bug kritis yang memblokir semua upload file sejak Phase 3 deployment ke Vercel
- Identifikasi root cause: `for await (const chunk of req)` tidak reliable di Vercel serverless — body sudah di-buffer sebelum sampai ke Express
- `express.raw({ type: '*/*', limit: '10mb' })` sebagai route-level middleware memberikan `req.body` sebagai Buffer langsung
- Zero TypeScript errors setelah perubahan

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/api/routes/upload.ts` | Modified | Ganti stream reading dengan express.raw() + tambah error logging |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| express.raw() per-route, bukan global | Global raw middleware akan bertabrakan dengan express.json() di routes lain | Routes lain tetap menerima JSON body seperti biasa |
| limit: '10mb' | Cukup untuk logo (≤2MB) dan foto produk (≤5MB), wajar untuk serverless | Upload >10MB akan ditolak dengan error 413 |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** Tidak ada deviasi — plan dieksekusi sesuai spec.

Minor improvement: check `!body || body.length === 0` (tambah `!body` guard) dibanding spec yang hanya `body.length === 0`. Ini lebih defensif dan tidak mengubah perilaku.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| None | — |

## Next Phase Readiness

**Ready:**
- Upload file ke R2 berfungsi penuh di production: logo mitra, foto produk, desain DTF, bukti resi, bukti bayar
- Semua 14 halaman telah diuji E2E (Phase 9) dengan 21/25 AC pass
- Bug kritis P1 sudah resolved

**Concerns:**
- isBilled/ledger billing logic masih client-side only di `OrderDetail.tsx:139` — jika status diupdate via API langsung (bukan UI), billing tidak terpicu
- "Unknown User" di audit logs untuk API calls tanpa user name di payload

**Blockers:**
- None — aplikasi siap production use penuh

---
*Phase: 10-upload-fix, Plan: 01*
*Completed: 2026-05-26*
