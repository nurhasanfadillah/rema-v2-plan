---
phase: 45-orders-dtf-filter-desktop-only
plan: 01
completed: 2026-10-22T18:43:00Z
duration: ~3min
description: "Chip filter DTF di Daftar Pesanan disembunyikan di mobile (hanya tampil md ke atas) lewat wrapper hidden md:block"
type: Summary
about: "rema-v2.1"
---

# Phase 45 Plan 01: Filter DTF Hanya di Desktop Summary

**Chip filter status cetak DTF di Daftar Pesanan (`/orders`) kini disembunyikan di mode mobile (< 768px) lewat wrapper `hidden md:block` di `OrdersList.tsx`; di desktop tetap tampil dan berfungsi seperti sebelumnya.**

## AC Result

| Criterion | Status |
|-----------|--------|
| AC-1: Chip DTF hanya tampil di desktop | Pass (statis) |

## Files Changed

| File | Change |
|------|--------|
| `src/pages/orders/OrdersList.tsx` | Modified (+8/−5) — `<DtfFilterChips />` dibungkus `<div className="hidden md:block">` + komentar `Desktop only` |

## Verify

- `npm run lint` (tsc --noEmit) → exit 0
- `git diff` → hanya wrapper + komentar di sekitar `<DtfFilterChips />`; modul `src/components/orders/dtf-filter/` dan file lain di `src/` tidak tersentuh
- Visual di browser (< 768px dan ≥ 768px): belum dilakukan — quick-fix tanpa checkpoint; kelas `hidden md:block` sama dengan yang sudah dipakai di wrapper tabel desktop pada file yang sama

Catatan: perubahan dikerjakan langsung atas permintaan user, lalu dicatat lewat PAUL; APPLY memverifikasi dan menyimpannya. Perubahan ini menggantikan bagian "layout sama untuk mobile dan desktop" dari keputusan Phase 44 (dicatat di PROJECT.md dan STATE.md). Efek samping yang diketahui: filter DTF yang sedang aktif tetap menyaring daftar bila jendela desktop dipersempit di bawah 768px (chip tersembunyi) — dicatat di Deferred Issues.

---
*Completed: 2026-10-23*
