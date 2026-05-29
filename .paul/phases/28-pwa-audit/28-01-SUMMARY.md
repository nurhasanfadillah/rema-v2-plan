---
phase: 28-pwa-audit
plan: 01
subsystem: ui
tags: [pwa, service-worker, vite-plugin-pwa, react, install-prompt]

requires:
  - phase: 27-ui-polish-batch-3
    provides: Layout.tsx stabil, Tailwind v4, lucide-react tersedia

provides:
  - PWAUpdateBanner component (useRegisterSW update notification)
  - Install prompt button di header Layout
  - vite-env.d.ts dengan PWA type references

affects: [deployment, pwa, layout]

tech-stack:
  added: []
  patterns: [useRegisterSW hook dari vite-plugin-pwa/react untuk SW update state]

key-files:
  created:
    - src/vite-env.d.ts
    - src/components/PWAUpdateBanner.tsx
  modified:
    - src/components/Layout.tsx

key-decisions:
  - "Mount PWAUpdateBanner di dalam wrapper div utama Layout agar z-50 fixed banner tidak terpotong oleh overflow-hidden"
  - "BeforeInstallPromptEvent dideclare lokal di Layout.tsx — tidak perlu file types terpisah"

patterns-established:
  - "useRegisterSW dari virtual:pwa-register/react adalah satu-satunya cara akses SW update state"

duration: ~10min
started: 2026-05-29T00:00:00Z
completed: 2026-05-29T00:00:00Z
---

# Phase 28 Plan 01: PWA Update Banner + Install Prompt

**PWAUpdateBanner component + install prompt button ditambahkan ke Layout — user kini mendapat notifikasi saat versi baru tersedia dan dapat install app dari header.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~10 min |
| Tasks | 2 completed |
| Files modified | 3 (2 created, 1 modified) |
| Lint | ✓ zero errors |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Update Banner Muncul Saat Ada Versi Baru | Pass | `useRegisterSW` → `needRefresh` → banner fixed bottom; tombol "Perbarui Sekarang" → `updateServiceWorker(true)` |
| AC-2: Tombol Install PWA di Header | Pass | `beforeinstallprompt` event listener di useEffect; Download icon muncul kondisional; `appinstalled` event → tombol hilang |
| AC-3: TypeScript Tidak Error | Pass | `npm run lint` (tsc --noEmit) zero errors |

## Accomplishments

- Banner update PWA `fixed bottom-0` muncul saat service worker mendeteksi versi baru, tersembunyi saat tidak ada update
- Tombol install ikon `Download` di header muncul hanya saat browser mendukung dan app belum terinstall
- `vite-env.d.ts` memastikan TypeScript mengenali `virtual:pwa-register/react`

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/vite-env.d.ts` | Created | Type references untuk vite/client + vite-plugin-pwa/client |
| `src/components/PWAUpdateBanner.tsx` | Created | Banner notifikasi update, consumer `useRegisterSW` |
| `src/components/Layout.tsx` | Modified | Import PWAUpdateBanner + Download, BeforeInstallPromptEvent type, installPrompt state + effect, tombol install di header, render `<PWAUpdateBanner />` |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Mount `<PWAUpdateBanner />` di dalam wrapper div utama (bukan di dalam Content Area) | Agar `fixed bottom-0` bekerja benar — banner tidak terpotong `overflow-hidden` pada `.flex-1` | Banner selalu visible di atas semua konten |
| `BeforeInstallPromptEvent` interface lokal di Layout.tsx | Tidak perlu file types terpisah untuk satu interface | Lebih sederhana, tidak menambah file baru |

## Deviations from Plan

None — plan dieksekusi persis sesuai spesifikasi.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- PWA update UX terpasang dan functional
- Install prompt terkontrol (tidak mengandalkan timing browser default)
- TypeScript clean, tidak ada error baru

**Concerns:**
- Banner hanya bisa ditest di production (service worker tidak aktif di dev mode)

**Blockers:**
- None

---
*Phase: 28-pwa-audit, Plan: 01*
*Completed: 2026-05-29*
