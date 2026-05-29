---
phase: 28-pwa-audit
topic: PWA install prompt, update notification, dan push notification
depth: standard
confidence: HIGH
created: 2026-05-29
---

# Discovery: PWA Audit — Install, Update, Notifikasi

**Recommendation:** Implementasi update notification + install prompt (1 plan, ~30 menit). Push notification deferralkan — butuh backend infrastructure tersendiri.

**Confidence:** HIGH — semua pattern terdokumentasi di vite-plugin-pwa, tidak ada unknown teknis.

---

## Objective

Yang perlu diketahui sebelum planning:
- Apa yang sudah berjalan di PWA saat ini?
- Gap mana yang perlu diimplementasi?
- Apakah push notification termasuk scope yang sama?
- Approach teknis yang tepat untuk setiap gap?

## Scope

**Include:**
- Audit state PWA saat ini (vite.config.ts, sw.js, main.tsx)
- Install prompt (beforeinstallprompt)
- Update notification (useRegisterSW hook)
- Push notification feasibility assessment

**Exclude:**
- Perubahan Workbox caching strategy
- Offline support / background sync
- PWA icon/manifest changes

---

## Findings

### State Saat Ini

**Apa yang sudah berjalan:**
- `registerType: 'autoUpdate'` — SW otomatis update saat deploy baru
- `sw.js` dengan `self.skipWaiting()` + `clientsClaim()` — aktivasi langsung
- `dist/registerSW.js` — registrasi SW sederhana setelah page load
- PWA manifest lengkap (icons, display: standalone, theme_color)
- Installable via browser default prompt (Chrome/Edge mendeteksi otomatis)

**Yang TIDAK ada:**
1. Custom install prompt UI di dalam app
2. Notifikasi ke user ketika ada update tersedia
3. Push notification (VAPID, subscription, backend sender)

---

### Gap 1: Update Notification

**Problem:** `registerType: 'autoUpdate'` membuat SW update secara silent. Ketika ada versi baru di-deploy, halaman bisa reload tiba-tiba tanpa penjelasan — user experience buruk.

**Solution:** Gunakan `useRegisterSW` hook dari `virtual:pwa-register/react` (sudah termasuk di `vite-plugin-pwa`). Hook ini expose:
- `needRefresh` — ada versi baru siap diaktifkan
- `updateServiceWorker(true)` — paksa reload ke versi baru

**Implementasi:**
```tsx
// src/components/PWAUpdatePrompt.tsx
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  
  if (!needRefresh) return null;
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 ...">
      <p>Versi baru tersedia</p>
      <button onClick={() => updateServiceWorker(true)}>Perbarui Sekarang</button>
    </div>
  );
}
```

Mount di `Layout.tsx` atau `App.tsx`.

**Effort:** ~30 menit, 2 file (komponen baru + mount di Layout)
**Caveat:** `registerType: 'autoUpdate'` tetap, hanya menambah UI notification

---

### Gap 2: Install Prompt

**Problem:** Browser default A2HS prompt muncul di waktu yang tidak tepat dan tidak branded. Tidak ada tombol "Install App" yang jelas di dalam app.

**Solution:** Intercept `beforeinstallprompt` event, simpan di state, tampilkan tombol install custom di header atau halaman settings.

**Implementasi:**
```tsx
// Tambah di App.tsx atau context baru
const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

useEffect(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setInstallPrompt(e as BeforeInstallPromptEvent);
  });
  window.addEventListener('appinstalled', () => setInstallPrompt(null));
}, []);

// Tombol di Layout.tsx header (sudah ada user avatar area)
{installPrompt && (
  <button onClick={() => installPrompt.prompt()}>
    Install App
  </button>
)}
```

**Effort:** ~20 menit, 2 file (App.tsx untuk listener + Layout.tsx untuk tombol)
**Caveat:** Hanya muncul di browser yang mendukung (Chrome/Edge). Safari iOS pakai "Add to Home Screen" manual — tidak bisa di-intercept.

---

### Gap 3: Push Notification

**Assessment:** Push notification membutuhkan infrastructure terpisah:

| Requirement | Status | Effort |
|-------------|--------|--------|
| VAPID key pair (server + client) | ❌ Tidak ada | Rendah (1x generate) |
| SW `push` event handler | ❌ Tidak ada | Sedang |
| Backend: `/api/push/subscribe` endpoint | ❌ Tidak ada | Sedang |
| Backend: push sender (web-push library) | ❌ Tidak ada | Sedang |
| DB: tabel `push_subscriptions` | ❌ Tidak ada | Sedang |
| Trigger: kapan push dikirim? | ❓ Belum defined | Tinggi |

**Assessment:** Push notification adalah phase tersendiri (Phase 29) — bukan part dari audit fix ini. Tanpa definisi "trigger kapan push dikirim" (new order? status change?) implementasi tidak bermakna.

**Recommendation:** Defer — define business requirement dulu sebelum implement.

---

## Comparison

| Item | Effort | Value | Include di Phase 28? |
|------|--------|-------|---------------------|
| Update notification | ~30 menit | Tinggi — UX penting | ✅ Ya |
| Install prompt | ~20 menit | Sedang — nice-to-have | ✅ Ya |
| Push notification | 2-4 jam + backend | Tinggi tapi perlu spec | ❌ Defer ke Phase 29 |

---

## Recommendation

**Implementasi Phase 28:** Update notification + install prompt dalam 1 plan.

**Rationale:**
- Keduanya menggunakan vite-plugin-pwa API yang sudah ada, tidak butuh dependency baru
- Update notification adalah gap UX yang nyata (user bingung reload tiba-tiba)
- Install prompt mudah, branded, dan meningkatkan discoverability
- Push notification memerlukan diskusi business requirement sebelum implement

**Caveats:**
- `useRegisterSW` dari `virtual:pwa-register/react` — perlu type definition jika TypeScript strict
- Install prompt tidak tersedia di Safari iOS — harus ada fallback message
- Update prompt hanya muncul jika ada versi baru (tidak muncul di dev mode)

## Open Questions

- Push notification: event apa yang akan mentrigger push? (new order, status change, payment reminder) — Impact: **high** sebelum Phase 29 bisa diplan

## Quality Report

**Sources consulted:**
- Kode sumber langsung: vite.config.ts, src/main.tsx, dist/sw.js, dist/registerSW.js
- vite-plugin-pwa docs pattern: `useRegisterSW` hook (well-known API, tidak berubah antara v0.x dan v1.x)

**Verification:**
- `registerType: 'autoUpdate'` confirmed di vite.config.ts
- Tidak ada `beforeinstallprompt` listener di seluruh src/ — confirmed via scan
- Tidak ada `useRegisterSW` usage di src/ — confirmed via scan
- `vite-plugin-pwa: ^1.3.0` installed — `virtual:pwa-register/react` tersedia

**Assumptions (not verified):**
- TypeScript declarations untuk `virtual:pwa-register/react` tersedia di package (biasanya auto-included)
- `BeforeInstallPromptEvent` perlu custom type declaration (tidak ada di lib.dom.d.ts standar)

---
*Discovery completed: 2026-05-29*
*Confidence: HIGH*
*Ready for: /paul:plan 28*
