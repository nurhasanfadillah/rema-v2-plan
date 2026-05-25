---
phase: 07-pwa-implementation
type: context
created: 2026-05-25
---

# Phase 7 — PWA Implementation

## Summary

Menambahkan PWA (Progressive Web App) installability ke aplikasi REMA-V2 yang sudah live di https://redone.my.id, sehingga app bisa di-install ke home screen HP dan desktop dan terasa seperti aplikasi native.

## Goals

1. **Installability** — Prompt "Install App" muncul saat user membuka redone.my.id di browser (Chrome, Edge, Safari)
2. **Native feel** — App terbuka full screen tanpa browser UI (address bar, toolbar)
3. **Shell caching** — Aset statis (JS, CSS, HTML) di-cache agar load cepat, data tetap online via API

## Out of Scope

- Offline data caching — database dan API calls tetap butuh koneksi internet
- Push notifications
- Background sync

## Approach

### Library

**`vite-plugin-pwa`** — integrasi native dengan Vite, auto-generate `manifest.webmanifest` + service worker, minimal config untuk installability.

### Assets

- **Icon source:** `C:\Users\USER\Pictures\REMA_ICON.png`
- **Icon sizes dibutuhkan:** 192×192, 512×512, dan maskable variant
- **Tool resize:** Sharp atau `vite-plugin-pwa` built-in icon generation (`@vite-pwa/assets-generator`)

### Manifest Config

```
name: REMA-V2
short_name: REMA-V2
theme_color: #020617
background_color: #020617
display: standalone
start_url: /
```

### Service Worker Strategy

- **Strategy:** `generateSW` (auto-generate, tidak perlu tulis SW manual)
- **Cache:** Precache aset statis saja (JS, CSS, fonts, icons)
- **Data:** Tidak di-cache — semua API calls ke Neon DB tetap online-only

### Deployment

- App sudah di Vercel — tidak ada perubahan infra
- HTTPS sudah aktif (syarat PWA terpenuhi)
- Service worker akan di-serve dari root domain

## Constraints

- Frontend React 19 + Vite — tidak ganti framework
- Vercel deployment tetap seperti sekarang
- Tidak boleh break fitur existing

## Open Questions

- Apakah perlu `maskable` icon variant (untuk Android adaptive icons)? → Direkomendasikan yes, tambahkan padding saat generate
- Safari iOS: installability via "Add to Home Screen" (tidak ada install prompt native) — acceptable

## Prior Phase Context

Phase 1-5: Migrasi localStorage → Neon DB + R2 + Vercel (selesai)
Phase 6: Order form fix (selesai)
App sudah live dan stabil di production.
