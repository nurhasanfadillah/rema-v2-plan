---
phase: 07-pwa-implementation
plan: 01
subsystem: infra
tags: [pwa, vite-plugin-pwa, service-worker, workbox, web-manifest, installability]

requires:
  - phase: 04-deploy-vercel
    provides: HTTPS live di https://redone.my.id (syarat PWA)

provides:
  - PWA installability — install prompt muncul di Chrome/Edge
  - Standalone mode — app berjalan tanpa browser UI
  - Shell caching — aset statis (JS, CSS, icons) di-precache via Workbox
  - Icons PWA (64, 192, 512, maskable-512) di public/

affects: []

tech-stack:
  added:
    - vite-plugin-pwa (devDependency)
    - "@vite-pwa/assets-generator" (devDependency)
  patterns:
    - VitePWA plugin dengan generateSW strategy
    - maximumFileSizeToCacheInBytes 3MiB untuk bundle besar

key-files:
  created:
    - public/pwa-64x64.png
    - public/pwa-192x192.png
    - public/pwa-512x512.png
    - public/maskable-icon-512x512.png
    - public/apple-touch-icon-180x180.png
  modified:
    - vite.config.ts
    - package.json

key-decisions:
  - "Gunakan preset minimal-2023 dari @vite-pwa/assets-generator — output satu maskable icon 512x512, bukan dua"
  - "maximumFileSizeToCacheInBytes: 3MiB — bundle JS ~2.5MB melebihi default 2MiB Workbox"
  - "runtimeCaching: [] — API calls ke Neon DB tetap online-only, tidak di-cache"
  - "Tidak ubah vercel.json — catch-all SPA rewrite sudah cukup, tidak perlu navigateFallback"

patterns-established:
  - "VitePWA registerType autoUpdate: SW auto-update saat ada deploy baru"

duration: ~30min
started: 2026-05-26T00:00:00Z
completed: 2026-05-26T00:30:00Z
---

# Phase 7 Plan 01: PWA Implementation Summary

**vite-plugin-pwa ditambahkan ke REMA-V2 — app https://redone.my.id sekarang bisa di-install ke home screen/desktop dengan standalone mode dan shell caching.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 menit |
| Tasks | 2 auto + 1 checkpoint, semua complete |
| Files modified | 2 (vite.config.ts, package.json) |
| Files created | 5 (icons di public/) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: App Bisa Di-install | Pass | Manifest + SW ter-generate, install prompt diverifikasi user |
| AC-2: Standalone Mode Berjalan | Pass | display:standalone dikonfigurasi, diverifikasi user |
| AC-3: Icons Muncul Benar | Pass | Icons 64, 192, 512, maskable-512 tersedia di public/ |
| AC-4: Fitur Existing Tidak Rusak | Pass | Diverifikasi manual oleh user di production |

## Accomplishments

- Konfigurasi `VitePWA` plugin di `vite.config.ts` — manifest + service worker auto-generated saat `npm run build`
- Generate PWA icons (64×64, 192×192, 512×512, maskable 512×512, apple-touch-icon 180×180) dari source `REMA_ICON.png`
- Build production berhasil: `dist/sw.js` + `dist/manifest.webmanifest` ter-generate dengan 15 entries precached (2705 KiB)
- Verifikasi manual di https://redone.my.id: install prompt muncul, standalone mode berjalan, fitur existing OK

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `vite.config.ts` | Modified | Tambah VitePWA plugin dengan manifest + workbox config |
| `package.json` | Modified | Tambah devDependencies: vite-plugin-pwa, @vite-pwa/assets-generator |
| `public/pwa-64x64.png` | Created | Icon PWA 64×64 untuk favicon |
| `public/pwa-192x192.png` | Created | Icon PWA 192×192 (required for installability) |
| `public/pwa-512x512.png` | Created | Icon PWA 512×512 (required for installability) |
| `public/maskable-icon-512x512.png` | Created | Maskable icon untuk Android adaptive icons |
| `public/apple-touch-icon-180x180.png` | Created | Icon untuk iOS "Add to Home Screen" |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024` | Bundle JS ~2.55MB melebihi default 2MiB Workbox — build gagal tanpa ini | Bundle JS di-precache, shell caching berfungsi penuh |
| `runtimeCaching: []` | Data API Neon DB harus tetap online-only | Tidak ada stale data risk, offline mode tidak didukung |
| Preset `minimal-2023` untuk icon generation | Output standar modern: 64, 192, 512, maskable-512 | Satu maskable icon (512) bukan dua seperti di plan awal |
| Tidak tambah `navigateFallback` | Vercel sudah punya catch-all SPA rewrite di vercel.json | Tidak double-handle routing, menghindari konflik |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 2 | Essential fixes, tidak ada scope creep |
| Deferred | 0 | — |

### Auto-fixed Issues

**1. Workbox file size limit**
- **Found during:** Task 2 (build)
- **Issue:** `assets/index.js` 2.55MB melebihi default 2MiB Workbox limit — build error
- **Fix:** Tambah `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024` ke workbox config
- **Verification:** `npm run build` berhasil, `dist/sw.js` ter-generate

**2. Nama file maskable icon berbeda dari plan**
- **Found during:** Task 1 (icon generation)
- **Issue:** Plan expect `pwa-maskable-192x192.png` + `pwa-maskable-512x512.png`, tapi preset `minimal-2023` hanya generate `maskable-icon-512x512.png`
- **Fix:** Manifest config disesuaikan menggunakan nama file aktual
- **Verification:** `dist/manifest.webmanifest` berisi icon entry yang benar

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Assets generator output ke direktori Pictures (same as source) | Copy manual ke `public/` |

## Next Phase Readiness

**Ready:**
- App PWA sudah live di production (https://redone.my.id)
- Tidak ada fase berikutnya yang direncanakan saat ini

**Concerns:**
- Bundle JS 2.55MB (gzip: 802KB) — kandidat code splitting jika performance menjadi concern
- Warning chunk size dari Vite adalah pre-existing, bukan diintroduce oleh PWA

**Blockers:**
- None

---
*Phase: 07-pwa-implementation, Plan: 01*
*Completed: 2026-05-26*
