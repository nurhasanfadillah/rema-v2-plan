---
phase: 42-reports-billing-recap
plan: 01
subsystem: ui
tags: [react, reports, billing, react-pdf, aggregation, typescript]

requires:
  - phase: 29-reports-mitra-isolation
    provides: filter mitra di sisi server untuk orders + ledgers API (isolasi data mitra di Laporan)
  - phase: 34-cancellation-return-approval
    provides: reset isBilled + penghapusan ledger saat pembatalan/retur disetujui
provides:
  - Tab "Rekap Tagihan" di halaman Laporan (Produk · Qty · Harga · Total dari pesanan tercatat tagihan)
  - Fungsi agregasi murni buildBillingRecap + hook useBillingRecap (modul billing-recap)
  - Ekspor PDF rekap tagihan (BillingRecapPDF)
affects: [reports, finance]

tech-stack:
  added: []
  patterns: [modul fitur dengan index.ts sebagai public API, fungsi agregasi murni + hook tipis, file kebab-case + named export]

key-files:
  created:
    - src/components/reports/billing-recap/billing-recap-types.ts
    - src/components/reports/billing-recap/build-billing-recap.ts
    - src/components/reports/billing-recap/use-billing-recap.ts
    - src/components/reports/billing-recap/billing-recap-tab.tsx
    - src/components/reports/billing-recap/billing-recap-pdf.tsx
    - src/components/reports/billing-recap/index.ts
  modified:
    - src/pages/Reports.tsx

key-decisions:
  - "Rekap Tagihan sebagai tab baru di Laporan; staff tidak melihat tab"
  - "Baris dikelompokkan per productId + priceSnapshot"
  - "Periode = tanggal ledger debit source 'order'; isBilled tanpa ledger dilewati"
  - "Modul fitur baru: folder + index.ts, kebab-case, named export, tanpa any"

patterns-established:
  - "Modul fitur: types + fungsi murni + hook + komponen UI + index.ts (public API); halaman hanya merangkai"
  - "Agregasi laporan sebagai fungsi murni dengan import type saja, sehingga bisa diuji langsung di Node tanpa test runner"

duration: 23min
started: 2026-10-22T16:34:50Z
completed: 2026-10-22T16:57:45Z
description: "Tab Rekap Tagihan di Laporan: rekap Produk · Qty · Harga · Total dari pesanan tercatat tagihan (per produk + harga satuan, periode = tanggal tagihan) + ekspor PDF"
type: Summary
about: "rema-v2.1"
---

# Phase 42 Plan 01: Rekap Tagihan per Produk Summary

**Halaman Laporan kini punya tab "Rekap Tagihan": rekap Produk · Qty · Harga · Total dari pesanan yang tercatat tagihan (per produk + harga satuan, periode = tanggal tagihan, admin + mitra), lengkap dengan ekspor PDF — dibangun sebagai modul `billing-recap` dengan fungsi agregasi murni yang teruji.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~23 menit (plan dibuat → UNIFY) |
| Started | 2026-10-22T16:34:50Z (plan dibuat) |
| Completed | 2026-10-22T16:57:45Z |
| Tasks | 3 auto + 1 checkpoint selesai |
| Files modified | 7 (6 baru, 1 diubah) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Tab tersedia sesuai role | Pass | Tombol dan konten tab dikondisikan `user.role !== 'staff'`; operational tetap diblokir guard lama. Disetujui user di checkpoint. |
| AC-2: Hanya pesanan tercatat tagihan | Pass | `isBilled` + entri ledger; kasus uji 1 dan 3 (draft/cancelled/ledger basi/ledger manual/tanpa ledger). |
| AC-3: Pengelompokan per produk + harga satuan | Pass | Kasus uji 2 dan 6 (harga beda → baris terpisah, harga sama dijumlah, urut A–Z lalu harga naik). |
| AC-4: Periode = tanggal tagihan | Pass | Kasus uji 4 (batas awal/akhir inklusif, pesanan dibuat 28 Sep ditagih 2 Okt) dan kasus 7 (ledger ganda → paling awal). |
| AC-5: Filter mitra + isolasi data | Pass | Kasus uji 5; render tab (dropdown mitra hanya admin); hook `lockedMitraId`. Isolasi server (Phase 29) tidak diubah. |
| AC-6: Selaras dengan tab Keuangan | Pass | Disetujui user di checkpoint (rekonsiliasi di data production). Tidak ada bukti numerik otomatis tersimpan — butuh login production. |
| AC-7: Empty state + ekspor PDF | Pass | Empty state teruji di render tab; PDF uji 60 baris ter-render 2 halaman tanpa error; tombol `disabled` saat tidak ada baris; kesesuaian PDF vs layar disetujui user di checkpoint. |

Checkpoint Task 4 (human-verify) disetujui user tanpa temuan yang dilaporkan.

## Verification Results

| Check | Hasil |
|-------|-------|
| `npm run lint` (`tsc --noEmit`) | exit 0 — setelah Task 1, 2, dan 3 |
| `npm run build` | Sukses (Task 2 dan 3); `vendor-pdf` tetap chunk terpisah (1.466,87 kB), chunk `Reports` 38,80 kB (gzip 8,02 kB) |
| Kasus uji agregasi (Node, script sementara di luar repo) | 7/7 lulus (zona waktu Asia/Jakarta) |
| Render server-side komponen tab + hook | 4/4 lulus |
| Render PDF uji (60 baris, data sintetis) | 19.358 byte, 2 halaman, tanpa error |
| Vite dev: `Reports.tsx` + 5 modul baru | HTTP 200 semua; API tanpa token → 401 (gerbang auth normal) |

## Accomplishments

- Modul baru `src/components/reports/billing-recap/` (6 file, 382 baris) dengan public API `index.ts`: tipe, fungsi agregasi murni `buildBillingRecap`, hook `useBillingRecap`, komponen tab, komponen PDF.
- Tab ketiga di `/reports` untuk admin dan mitra (staff tidak melihat tab): filter mitra + periode, kartu Total Qty / Total Tagihan, tabel desktop + kartu mobile, empty state, catatan kaki.
- Rekap konsisten dengan tab Keuangan: periode memakai tanggal ledger debit order, dan pesanan batal/retur otomatis keluar karena `isBilled` direset.
- Ekspor PDF A4 (ringkasan, tabel, baris TOTAL) lewat tombol Cetak PDF yang sudah ada; tombol nonaktif bila tidak ada baris.

## Task Commits

Tidak ada commit per task — seluruh perubahan di-commit pada transisi phase (`feat(42): ...`), sesuai pola phase sebelumnya. Hash tercatat di STATE.md (Git State).

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/components/reports/billing-recap/billing-recap-types.ts` | Created (21 baris) | Tipe `BillingRecapFilters`, `BillingRecapRow`, `BillingRecap` |
| `src/components/reports/billing-recap/build-billing-recap.ts` | Created (72 baris) | Fungsi murni agregasi: join ledger → filter → kelompok per produk + harga |
| `src/components/reports/billing-recap/use-billing-recap.ts` | Created (34 baris) | Hook state filter + `useMemo` rekap; mitra bisa dikunci (`lockedMitraId`) |
| `src/components/reports/billing-recap/billing-recap-tab.tsx` | Created (141 baris) | UI tab: filter, kartu ringkas, tabel desktop, kartu mobile, empty state |
| `src/components/reports/billing-recap/billing-recap-pdf.tsx` | Created (106 baris) | Dokumen PDF A4 rekap tagihan |
| `src/components/reports/billing-recap/index.ts` | Created (8 baris) | Public API modul |
| `src/pages/Reports.tsx` | Modified (+39/−8) | Tab ketiga, pemanggilan hook, cabang `handleExport`, tombol Cetak PDF `disabled` saat kosong |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Rekap Tagihan sebagai tab baru (bukan di tab Keuangan/Pesanan); staff tidak melihat tab | Filter + PDF sendiri tanpa mengubah tab yang ada; konsisten dengan Keuangan | `Reports.tsx` hanya bertambah wiring; admin + mitra saja |
| Kunci grup `productId + priceSnapshot` | Lossless: harga beda = baris terpisah, Qty × Harga = Total tiap baris | Tidak ada harga rata-rata; Σ baris = total tagihan |
| Periode = tanggal ledger debit `source:'order'`; `isBilled` tanpa ledger dilewati | Selaras dengan filter tab Keuangan; ledger satu-satunya sumber tanggal tagihan | Total rekap = Σ debit order pada filter yang sama |
| Modul folder + `index.ts`, file kebab-case, named export, tanpa `any` | Mengikuti CLAUDE.md global | Pola acuan modul baru; file lama tidak di-rename; tsconfig tetap non-strict |
| PDF baru memakai `formatCurrency` (0 desimal) | Selaras dengan tampilan layar | Berbeda dari PDF lama (2 desimal) — dicatat sebagai deferred |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Penyederhanaan kecil pada tombol Cetak PDF |
| Scope additions | 0 | Hanya tooling verifikasi di luar repo (kasus uji ke-7, uji render tab + PDF) |
| Deferred | 2 | Dicatat di STATE.md |

**Total impact:** Tidak ada scope creep produk; satu penyederhanaan kecil yang tidak mengubah perilaku yang dijanjikan AC.

### Auto-fixed Issues

**1. [UI] Tombol Cetak PDF cukup memakai `disabled`**
- **Found during:** Task 3 (Komponen PDF + wiring ekspor)
- **Issue:** Plan meminta tambahan `disabled:opacity-50 disabled:cursor-not-allowed` dan `title`. `.btn-primary` (`src/index.css`) sudah memuat `disabled:opacity-50 disabled:pointer-events-none`, sehingga cursor dan tooltip tidak akan pernah tampil.
- **Fix:** Hanya `disabled={isBillingExportDisabled}` pada tombol; empty state di tab sudah menjelaskan alasannya.
- **Files:** `src/pages/Reports.tsx`
- **Verification:** `npm run lint` dan `npm run build` exit 0.

Varian minor: `billingMitraName` dihitung di body komponen dengan `mitras.find(...)?.name ?? 'Semua Mitra'` (setara dengan ekspresi di plan).

### Deferred Items

- Format mata uang PDF tidak seragam: `FinanceReportPDF`/`OrderReportPDF` memakai 2 desimal ("Rp 1.800.000,00"), `BillingRecapPDF` 0 desimal (discovered in Task 3).
- Kolom `real` (float4) pada `totalAmount`/`priceSnapshot`/`ledgers.nominal` kehilangan presisi integer di atas ±Rp 16,7 jt; belum ada selisih yang dilaporkan (discovered saat menyusun checkpoint Task 4).

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Browser pane memperlakukan PDF uji yang disajikan lewat server lokal sebagai unduhan dan memunculkan dialog simpan ke user | PDF hanya data sintetis; server sementara dimatikan, semua artefak uji dihapus; tidak ada dampak ke repo |
| `.btn-primary` sudah punya style disabled | Disederhanakan (lihat Deviations) |
| Tidak ada rasterizer PDF lokal, layout PDF tidak bisa saya cek visual | Layout PDF dicek user di checkpoint Task 4 |

## Next Phase Readiness

**Ready:**
- Modul `billing-recap` siap diperluas (kolom mitra, ekspor Excel/CSV) tanpa banyak menyentuh `Reports.tsx`.
- Pola modul (types + fungsi murni + hook + UI + `index.ts`) tersedia sebagai acuan fitur berikutnya.

**Concerns:**
- Dua deferred di atas (format mata uang PDF, presisi float4).
- Konvensi baru (kebab-case, `index.ts`, tanpa `any`) hanya berlaku di modul baru; file lama dan tsconfig belum diseragamkan.
- `Reports.tsx` masih panjang (~455 baris); isi tab Keuangan dan Pesanan masih inline.

**Blockers:**
- None

---
*Phase: 42-reports-billing-recap, Plan: 01*
*Completed: 2026-10-22*
