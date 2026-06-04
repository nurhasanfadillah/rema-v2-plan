---
phase: 32-code-audit-cleanup
type: context
created: 2026-06-04
---

# Phase 32 — Code Audit & Cleanup

## Summary

Audit menyeluruh codebase REMA-V2 untuk menemukan dead code, import tidak terpakai, logika yang salah atau kompleks berlebihan, dan potensi masalah performa loading. Setelah audit, cleanup berdasarkan temuan yang disetujui.

## Goals

1. **Dead code** — temukan komponen, fungsi, import yang tidak dipakai
2. **Kode salah** — identifikasi logika yang berpotensi bug atau tidak konsisten
3. **Simplifikasi** — kode terlalu kompleks yang bisa diringkas tanpa mengubah behavior
4. **Performa loading** — cek hal yang membuat app terasa berat saat pertama dibuka (bundle size, lazy loading, dll)

## Out of Scope

- Fitur baru
- Redesign arsitektur besar
- Perubahan skema database

## Approach

### Two-step plan:
- **Plan 32-01 (research/audit):** Scan seluruh `src/`, identifikasi semua masalah, hasilkan laporan temuan
- **Plan 32-02 (execute/cleanup):** Implementasi cleanup berdasarkan temuan audit yang disetujui

### Scope audit:
- `src/pages/` — semua halaman
- `src/components/` — semua komponen
- `src/api/routes/` — backend routes
- `src/lib/` — utility functions
- `src/types.ts` dan `src/db/schema.ts` — tipe yang mungkin tidak dipakai
- Bundle analysis — import berat yang bisa di-lazy load

## Constraints

- Tidak boleh break fitur yang sudah berjalan di production
- Perubahan harus aman (tidak ada behavior change, hanya cleanup)
- Frontend React 19 + Vite — tidak ganti framework

## Open Questions

- Apakah ada halaman atau fitur tertentu yang terasa paling lambat? (untuk prioritas)
- Seberapa agresif cleanup yang diinginkan? (safe/conservative vs menyeluruh)

## Prior Phase Context

Phase 31: Orders Product Items Display (selesai 2026-06-03)
Semua 31 phase complete. App live dan stabil di https://redone.my.id.
