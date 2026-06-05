---
phase: 35-kalkulator-harga-jual
plan: 02
subsystem: ui
tags: [react, calculator, price, history]

requires:
  - phase: 35-01
    provides: GET/POST/DELETE /api/price-calculations, types PriceCalculation + PriceCalcAdditional

provides:
  - Halaman /calculator fungsional end-to-end (form + output + riwayat)
  - api.priceCalculations.list/create/remove di src/lib/api.ts
  - Nav link Kalkulator Harga untuk admin + mitra

affects: []

tech-stack:
  added: []
  patterns: [grid-cols-4 untuk 75/25 layout, two-button toggle Rp/% untuk type selection]

key-files:
  created: [src/pages/Calculator.tsx]
  modified: [src/lib/api.ts, src/App.tsx, src/components/Layout.tsx, src/api/routes/price-calculations.ts]

key-decisions:
  - "Toggle biaya tambahan: dua tombol eksplisit [Rp][%] menggantikan single toggle — menghilangkan ambiguitas current-vs-target"
  - "switchAdditionalType reset value ke 0 saat ganti tipe — mencegah nominal value besar masuk formula persen"
  - "request<T> di api.ts: guard 204 + empty body — handle semua route yang return tanpa body"
  - "DELETE price-calculations: ubah 204.send() → json({ ok: true }) — konsisten dengan pattern existing"

patterns-established:
  - "Biaya tambahan type toggle: dua tombol terpisah, bukan single toggle"
  - "request<void> safe untuk 204 — guard di api.ts bukan per-route"

duration: ~60min
started: 2026-06-06T00:00:00Z
completed: 2026-06-06T00:00:00Z
---

# Phase 35 Plan 02: Frontend Calculator Summary

**Halaman /calculator live — kalkulator harga jual interaktif dengan dua mode input, output per unit + total qty, biaya tambahan bertahap (Rp/%), simpan riwayat per user.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Akses role-restricted | ✅ Pass | Nav link hanya admin + mitra via roles array di Layout.tsx |
| AC-2: Dua mode input produk | ✅ Pass | Toggle Pilih dari Produk / Input Manual, reset state saat switch |
| AC-3: Output kalkulasi live dan benar | ✅ Pass | Harga Jual = pokok/(1-margin%), Harga MP = jual/(1-adminMP%) |
| AC-4: Lainnya opsional, maks 4, dua tipe | ✅ Pass | Tombol [Rp][%] eksplisit, max 4 enforced di addAdditional |
| AC-5: Output per unit dan total qty | ✅ Pass | Grid 3 kolom: Label / Per Unit / Total ×qty |
| AC-6: Warning margin tidak sehat | ✅ Pass | Alert kuning jika margin > 0 && < 20 |
| AC-7: Simpan kalkulasi ke riwayat | ✅ Pass | POST lalu reload list |
| AC-8: Riwayat hanya milik sendiri | ✅ Pass | Backend filter userId = req.user.sub |
| AC-9: Hapus riwayat | ✅ Pass | DELETE dengan fix 204→JSON + guard di request<T> |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/Calculator.tsx` | Created | Halaman kalkulator lengkap |
| `src/lib/api.ts` | Modified | Tambah types + api.priceCalculations; guard 204/empty |
| `src/App.tsx` | Modified | Lazy import + route /calculator |
| `src/components/Layout.tsx` | Modified | Import Calculator icon + nav link |
| `src/api/routes/price-calculations.ts` | Modified | DELETE: 204.send() → json({ ok: true }) |

## Deviations from Plan

| Type | Description | Fix |
|------|-------------|-----|
| Auto-fixed | Toggle biaya tambahan: single toggle button membingungkan (klik '%' = keluar persen, bukan masuk) | Ganti ke dua tombol eksplisit [Rp][%]; default type ubah ke 'nominal'; switchAdditionalType reset value ke 0 |
| Auto-fixed | DELETE 204 tanpa body: request<void> panggil res.json() → throw | Backend ubah ke res.json({ ok: true }); frontend tambah guard 204 + empty text di request<T> |

## Next Phase Readiness

**Ready:**
- Halaman /calculator fungsional, diuji manual end-to-end
- api.priceCalculations tersedia untuk referensi halaman lain jika perlu

**Concerns:** None

**Blockers:** None

---
*Phase: 35-kalkulator-harga-jual, Plan: 02*
*Completed: 2026-06-06*
