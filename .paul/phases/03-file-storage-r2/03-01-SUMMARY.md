---
phase: 03-file-storage-r2
plan: 01
subsystem: api
tags: [cloudflare-r2, aws-sdk-s3, file-upload, react-components]

requires:
  - phase: 02-data-layer-migration
    provides: API layer + auth middleware yang dipakai upload route

provides:
  - POST /api/upload endpoint (R2 via @aws-sdk/client-s3)
  - api.upload.file() helper di src/lib/api.ts
  - FileUpload.tsx bebas base64 — upload ke R2, return URL
  - MultiFileUpload.tsx bebas base64 — upload paralel ke R2

affects: 04-deploy-vercel

tech-stack:
  added: ["@aws-sdk/client-s3"]
  patterns: ["raw file upload via express.raw()", "custom Cloudflare domain untuk R2 public access"]

key-files:
  created: ["src/api/routes/upload.ts"]
  modified: ["src/api/index.ts", "src/lib/api.ts", "src/components/FileUpload.tsx", "src/components/MultiFileUpload.tsx"]

key-decisions:
  - "Custom domain storage.jisoi.net untuk R2 — r2.dev diblokir Biznet Indonesia"
  - "express.raw() per-route bukan global — hindari konflik dengan express.json()"
  - "Data lama (base64 di DB) tidak dimigrate — hanya upload baru pakai R2"

patterns-established:
  - "Upload route: express.raw({ type: '*/*', limit: '10mb' }) + X-File-Name header"
  - "Key format: uploads/{timestamp}-{uuid8}.{ext}"
  - "Public URL: https://storage.jisoi.net/{key}"

duration: ~2 sessions (handoff mid-execution)
started: 2026-05-25T00:00:00Z
completed: 2026-05-25T00:00:00Z
---

# Phase 3 Plan 01: R2 File Upload Migration Summary

**POST /api/upload + FileUpload/MultiFileUpload migrated dari base64 ke Cloudflare R2 via storage.jisoi.net**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~2 sessions |
| Tasks | 2 completed |
| Files modified | 7 |
| Checkpoint | Approved |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: POST /api/upload tersedia dan upload ke R2 | Pass | S3Client, express.raw, returns `{ url }` |
| AC-2: FileUpload.tsx bebas dari base64 | Pass | api.upload.file(), spinner, isImage via extension |
| AC-3: MultiFileUpload.tsx bebas dari base64 | Pass | Promise.all upload paralel |
| AC-4: TypeScript zero errors | Pass | npx tsc --noEmit clean |

## Accomplishments

- Upload endpoint berjalan di R2 bucket `rema-v2` via `@aws-sdk/client-s3`
- FileUpload + MultiFileUpload sepenuhnya bebas dari `FileReader`, `readAsDataURL`, dan `resizeImage`
- Custom domain `storage.jisoi.net` di-setup via Cloudflare API — mengatasi blokir ISP Biznet pada `r2.dev`
- File tersimpan dengan key `uploads/{ts}-{uuid8}.{ext}`, accessible via HTTPS public URL

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/api/routes/upload.ts` | Created | R2 upload endpoint |
| `src/api/index.ts` | Modified | Register uploadRouter di /api/upload |
| `src/lib/api.ts` | Modified | api.upload.file() helper |
| `src/components/FileUpload.tsx` | Modified | Base64 → R2 upload, spinner |
| `src/components/MultiFileUpload.tsx` | Modified | Base64 loop → Promise.all R2 |
| `.env` | Modified | R2_BUCKET_NAME=rema-v2, R2_PUBLIC_URL=https://storage.jisoi.net |
| `src/api/seed.ts` | Modified | Fix phone typo admin user |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Custom domain `storage.jisoi.net` | Biznet intercept DNS untuk r2.dev (return IP ISP lokal) | URL file production pakai storage.jisoi.net |
| express.raw() per-route | Global express.raw() konflik dengan express.json() di routes lain | Upload route isolated, routes lain tidak terdampak |
| Data lama tidak dimigrate | Plan boundaries eksplisit — bisa breaking change data existing | Base64 lama di DB tetap ada, upload baru pakai R2 URL |

## Deviations from Plan

### Auto-fixed Issues

**1. Admin phone typo di database**
- **Found during:** Checkpoint verification (login gagal)
- **Issue:** Seed menyimpan `62821133131665` (14 digit), login normalize ke `6282113133165`
- **Fix:** Update via Drizzle script + perbaiki seed.ts
- **Verification:** Login berhasil setelah fix

**2. R2 bucket name mismatch**
- **Found during:** Checkpoint verification (upload 500 error)
- **Issue:** `.env` `R2_BUCKET_NAME=rema-storage`, bucket aktual `rema-v2`
- **Fix:** Update .env

**3. r2.dev DNS interception**
- **Found during:** Checkpoint verification (image tidak tampil)
- **Issue:** Biznet mengembalikan IP lokal (182.23.x, 101.255.x) untuk `r2.dev`
- **Fix:** Setup custom domain `storage.jisoi.net` via Cloudflare API

## Next Phase Readiness

**Ready:**
- File upload pipeline berfungsi penuh (R2 + public URL)
- `storage.jisoi.net` aktif dan accessible dari Indonesia
- TypeScript clean, tidak ada breaking change pada pages yang menggunakan FileUpload

**Concerns:**
- Data lama yang masih base64 di Neon DB tidak akan tampil sebagai gambar jika URL tidak valid — acceptable karena data lama dari development
- Vercel perlu environment variables R2 di-set (R2_BUCKET_NAME=rema-v2, R2_PUBLIC_URL=https://storage.jisoi.net, dll)

**Blockers:** None

---
*Phase: 03-file-storage-r2, Plan: 01*
*Completed: 2026-05-25*
