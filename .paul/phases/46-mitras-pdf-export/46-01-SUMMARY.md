---
phase: 46-mitras-pdf-export
plan: 01
subsystem: ui
tags: [react-pdf, mitras, pdf-export, lazy-loading, bundle, typescript]

requires:
  - phase: 42-reports-billing-recap
    provides: pola modul fitur (folder + index.ts, fungsi murni teruji Node) dan gaya PDF react-pdf
provides:
  - Modul `mitra-export`: `calculateMitraStats`, `buildMitraSummary`, `toPdfSafeText`, `formatFileDate`, `downloadBlob`, `useMitraPdfExport`, `exportMitraListPdf`
  - Tombol "Cetak PDF" di header `/mitras` yang mengunduh "Laporan Daftar Mitra"
affects: [46-02 PDF per mitra dari panel Detail Info Mitra, mitras]

tech-stack:
  added: []
  patterns: [PDF lazy — hanya berkas PDF yang meng-import react-pdf, ekspor lewat import(), barrel tanpa komponen PDF, jalur eager bebas date-fns, fungsi hitung murni dibagi layar + PDF, uji klik browser dengan API tiruan lokal]

key-files:
  created:
    - src/components/mitras/mitra-export/mitra-export-types.ts
    - src/components/mitras/mitra-export/calculate-mitra-stats.ts
    - src/components/mitras/mitra-export/build-mitra-summary.ts
    - src/components/mitras/mitra-export/to-pdf-safe-text.ts
    - src/components/mitras/mitra-export/mitra-list-pdf.tsx
    - src/components/mitras/mitra-export/download-blob.ts
    - src/components/mitras/mitra-export/format-file-date.ts
    - src/components/mitras/mitra-export/export-mitra-list-pdf.ts
    - src/components/mitras/mitra-export/use-mitra-pdf-export.ts
    - src/components/mitras/mitra-export/index.ts
  modified:
    - src/pages/Mitras.tsx

key-decisions:
  - "Fase 46 dipecah dua plan: 46-01 fondasi + Daftar Mitra, 46-02 PDF per mitra (pilihan user)"
  - "`calculateMitraStats` (rumus lama, tak berubah) jadi satu sumber angka layar + PDF"
  - "Library PDF hanya disentuh `mitra-list-pdf.tsx`; ekspor memuatnya lewat import(); jalur eager bebas date-fns"
  - "Karakter di luar WinAnsi dibuang (`toPdfSafeText`), bukan font Unicode/CDN emoji"

patterns-established:
  - "Modul fitur PDF lazy: berkas PDF = satu-satunya yang meng-import react-pdf dan juga mengekspor pembuat blob; berkas ekspor hanya import() dinamis ke berkas itu"
  - "Cek bundel tiap fitur yang menyentuh halaman eager: build ke direktori scratch lalu periksa ukuran entry, chunk lazy, dan import statis di entry"
  - "Uji klik browser memakai API tiruan lokal (Vite dev + server mock di folder temp) agar tidak menyentuh DB produksi"

duration: ~35min
started: 2026-10-23T11:11:58Z
completed: 2026-10-23T11:47:04Z
description: "Tombol Cetak PDF di header /mitras mengunduh Laporan Daftar Mitra (semua mitra A-Z, angka identik layar) lewat modul mitra-export; library PDF lazy via import() dengan entry hanya +1,8 kB"
type: Summary
about: "rema-v2.1"
---

# Phase 46 Plan 01: Fondasi Modul `mitra-export` + PDF Daftar Mitra Summary

**Tombol "Cetak PDF" di header Manajemen Mitra mengunduh "Laporan Daftar Mitra" — semua mitra (aktif + arsip) urut A–Z dengan angka identik layar karena satu fungsi hitung dipakai bersama; library PDF dimuat lazy lewat `import()` (entry hanya +1,8 kB) dan emoji/CJK pada nama tidak lagi tercetak rusak.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~35 menit (plan dibuat → UNIFY; eksekusi APPLY ~22 menit; termasuk menunggu persetujuan user) |
| Started | 2026-10-23T11:11:58Z (plan dibuat) |
| Completed | 2026-10-23T11:47:04Z |
| Tasks | 3 auto + 1 checkpoint selesai |
| Files modified | 11 kode (10 baru, `Mitras.tsx` +9/−10) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Tombol Cetak PDF mengunduh Daftar Mitra | Pass | Uji browser: `Daftar_Mitra_2026-10-23.pdf` terunduh; isi sesuai (judul, "Dicetak", 4 kotak ringkasan, 7 kolom, TOTAL, catatan kaki); disetujui user di checkpoint |
| AC-2: Angka identik dengan layar | Pass | `calculateMitraStats` sama dengan rumus lama pada fixture acak (46 assertion); total PDF di browser = hitungan manual (Rp 48.500.000 / 7 pesanan / Rp 26.000.000); diff `Mitras.tsx` hanya tombol, hook, dan pembungkus `getMitraStats` |
| AC-3: Urutan dan format baris | Pass | Urut A–Z tak peka huruf besar/kecil ('Andi', 'budi', 'Citra'); "HP: -" untuk mitra tanpa akun; saldo > 0 merah, ≤ 0 hijau, negatif "-Rp 500.000" (cek visual) |
| AC-4: Multi-halaman | Pass | 49 mitra → 3 halaman; header tabel berulang di hal. 2–3, baris utuh, TOTAL di akhir, "Halaman X / Y" (cek visual + assertion struktur: 2 elemen `fixed`, semua baris `wrap={false}`) |
| AC-5: Nama dengan karakter tak didukung | Pass | Emoji dan CJK dibuang ("Konveksi Ria Collection", nama CJK → "-"); aksen, em dash, `×`, `·` tetap; render tidak gagal |
| AC-6: Library PDF dimuat saat diklik | Pass | Setelah perbaikan: `mitra-list-pdf` chunk terpisah 6,24 kB; entry 559.588 B (+1.799 B, batas 8 kB); tanpa import statis di entry; di dev, modul PDF + library baru diminta setelah klik. Build pertama sempat +22.678 B (Deviasi 1) |
| AC-7: Status ekspor dan penanganan galat | Pass | Tombol langsung "Membuat PDF..." + nonaktif setelah klik, kembali "Cetak PDF" setelah unduh (teruji di browser). Nonaktif saat `mitras.length === 0` dan toast "Gagal membuat PDF" saat galat hanya diverifikasi dari kode, tidak dijalankan di UI |

## Accomplishments

- Tombol "Cetak PDF" di header Manajemen Mitra mengunduh PDF Daftar Mitra: semua mitra A–Z, 4 kotak ringkasan, tabel 7 kolom, baris TOTAL, catatan kaki definisi, header tabel berulang dan "Halaman X / Y" di semua halaman.
- Satu sumber angka: `calculateMitraStats` (dipindah dari `getMitraStats` inline, rumus tidak berubah, teruji terhadap rumus lama) dipakai layar dan PDF.
- Library PDF benar-benar lazy: hanya `mitra-list-pdf.tsx` yang meng-import `@react-pdf/renderer`, `exportMitraListPdf` memuatnya lewat `import()`; entry +1,8 kB dan chunk `vendor-pdf` identik dengan baseline.
- Nama dengan emoji/CJK tidak lagi tercetak sebagai karakter acak: `toPdfSafeText` membuang karakter di luar WinAnsi (nama kosong → "-").
- Fondasi siap dipakai Plan 46-02 (PDF per mitra dari panel Detail Info Mitra).

## Task Commits

Tidak ada commit per task — seluruh perubahan di-commit pada transisi phase (`feat(46): ...`), sesuai pola phase sebelumnya. Hash tercatat di STATE.md (Git State) setelah transisi.

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/components/mitras/mitra-export/mitra-export-types.ts` | Created (37) | Tipe `MitraStats`, `MitraSummaryRow`, `MitraSummary`, `MitraSummaryInput` + subset `Pick` agar state halaman langsung bisa dipakai |
| `src/components/mitras/mitra-export/calculate-mitra-stats.ts` | Created (17) | `calculateMitraStats`: satu sumber angka layar + PDF (rumus lama) |
| `src/components/mitras/mitra-export/build-mitra-summary.ts` | Created (27) | `buildMitraSummary`: baris per mitra urut A–Z, total, hitungan aktif/arsip |
| `src/components/mitras/mitra-export/to-pdf-safe-text.ts` | Created (27) | `toPdfSafeText`: NFC, ratakan spasi, buang karakter di luar WinAnsi, kosong → "-" |
| `src/components/mitras/mitra-export/mitra-list-pdf.tsx` | Created (146) | `MitraListPDF` (A4, 7 kolom, header `fixed`, footer halaman) + `createMitraListPdfBlob` |
| `src/components/mitras/mitra-export/download-blob.ts` | Created (11) | `downloadBlob`: unduh Blob, `revokeObjectURL` dengan jeda 1 detik |
| `src/components/mitras/mitra-export/format-file-date.ts` | Created (6) | `formatFileDate` yyyy-MM-dd tanggal lokal, tanpa date-fns |
| `src/components/mitras/mitra-export/export-mitra-list-pdf.ts` | Created (11) | `exportMitraListPdf`: `import()` dinamis → blob → unduh `Daftar_Mitra_<tanggal>.pdf` |
| `src/components/mitras/mitra-export/use-mitra-pdf-export.ts` | Created (32) | Hook `useMitraPdfExport`: `isExporting`, penjaga klik ganda (`useRef`), toast galat |
| `src/components/mitras/mitra-export/index.ts` | Created (8) | Public API modul (tanpa `MitraListPDF`, dengan komentar alasannya) |
| `src/pages/Mitras.tsx` | Modified (+9/−10) | Impor, hook sebelum gate admin, `getMitraStats` → `calculateMitraStats`, `handleExportPdf`, tombol di header |

## Verification Results

| Check | Hasil |
|-------|-------|
| `npm run lint` (`tsc --noEmit`) | exit 0 — setelah tiap task dan di akhir |
| Uji fungsi murni (Node + esbuild bundle, skrip sementara di luar repo) | 46 assertion lulus: kesetaraan dengan rumus lama (>300 pesanan/ledger, 9 status, 5 source), semantik rinci, `buildMitraSummary`, `toPdfSafeText` |
| Uji render PDF (Node, esbuild + `renderToBuffer`, di `node_modules/.cache/`) | 38 assertion lulus: 3 mitra → 1 halaman; 49 mitra → 3 halaman (21.457 B); daftar kosong → 1 halaman; inspeksi pohon elemen; `createMitraListPdfBlob` → Blob `application/pdf`; `formatFileDate` |
| Inspeksi visual PDF (viewer browser pane) | Header berulang di hal. 2–3, TOTAL, catatan kaki, "Halaman X / Y", hyphenation kata panjang, emoji dibuang, "-" untuk nama CJK |
| Build produksi ke direktori scratch — pertama | exit 0, tetapi entry +22.678 B (di atas batas AC-6) → diperbaiki, lihat Deviasi 1 |
| Build produksi ke direktori scratch — setelah perbaikan | exit 0; `mitra-list-pdf-D1zVnIeq.js` 6,24 kB (gzip 1,90 kB); entry `index-W1ONxhpk.js` 559.588 B (+1.799 B; gzip 164,57 vs 163,83 kB); `vendor-pdf` 1.466.869 B identik baseline; `format-*.js` kembali lazy; tanpa import statis ke `mitra-list-pdf` di entry |
| Uji klik browser (Vite dev + API tiruan lokal, tanpa DB/R2 produksi) | Tombol → "Membuat PDF..." + nonaktif → unduh `Daftar_Mitra_2026-10-23.pdf` (7.480 B, `application/pdf`, `%PDF-`) → tombol aktif lagi; konsol tanpa error; `mitra-list-pdf.tsx` dan `@react-pdf/renderer` baru diminta setelah klik; PDF hasil build browser berangka benar |
| Checkpoint Task 4 (human-verify) | Disetujui user tanpa temuan yang dilaporkan |
| Kebersihan | Skrip uji, bundel, mock/sink, build scratch, dan server dev dihapus/dihentikan; `git status` hanya `Mitras.tsx`, modul baru, dan berkas `.paul/` |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Fase 46 dipecah dua plan: 46-01 fondasi + Daftar Mitra, 46-02 PDF per mitra | Pilihan user; scope ≈5 task untuk dua fitur melewati batas 2–3 task per plan | Tiap plan bisa diverifikasi sendiri; 46-02 memakai fondasi ini |
| Isi PDF per mitra (46-02) = sama dengan panel (profil, penanggung jawab + HP, limit, 3 statistik; 1 halaman; tanpa daftar transaksi) | Pilihan user; tidak menduplikasi Laporan › Keuangan | Ruang lingkup 46-02 kecil |
| `calculateMitraStats` (rumus lama tak berubah) satu sumber angka layar + PDF; `getMitraStats` menjadi pembungkus tipis | Angka PDF harus identik dengan layar; teruji terhadap rumus lama | "Total Penjualan" tetap ikut draft/returned (Deferred Issue yang sudah ada) |
| Default DISCOVERY dipakai: urut A–Z, "Jumlah Pesanan", HP ikut, arsip ikut, "Unlimited", catatan kaki definisi | Mirror layar tanpa mengubah definisi | PDF dan layar konsisten, kecuali urutan (layar mengikuti urutan API) |
| Hanya `mitra-list-pdf.tsx` yang meng-import `@react-pdf/renderer` dan sekaligus mengekspor `createMitraListPdfBlob`; `exportMitraListPdf` hanya `import()` dinamis ke berkas itu; `index.ts` tidak mengekspor komponen PDF | `Mitras` di-import eager; import dinamis namespace library menambah chunk `vendor-pdf` dan menghilangkan tree-shaking | Benar pada chunking sekarang maupun setelah Phase 47 (chunk PDF lazy) |
| Jalur eager modul dilarang memakai `date-fns`; nama berkas tanggal lewat `formatFileDate` | `format()` menarik chunk 20,8 kB ke entry | Entry hanya +1,8 kB |
| Karakter di luar WinAnsi dibuang (`toPdfSafeText`), nama kosong → "-" | Aman offline, tanpa bobot font; Helvetica bawaan mencetak emoji/CJK sebagai karakter acak | Perilaku sama dapat dibagikan ke PDF lain (Deferred) |
| Tombol di `page-header`: `btn-primary` + ikon Download + `ml-auto`; hook ekspor dipanggil sebelum gate admin | Konsisten dengan "Cetak PDF" di Laporan; hindari pelanggaran aturan hooks | Pola tombol dipakai ulang di panel (46-02) |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 3 | Dua koreksi bundel (terukur lewat build) dan satu penyederhanaan implementasi sanitasi; semuanya esensial |
| Scope additions | 2 | Uji klik browser dengan API tiruan; `toPdfSafeText` juga membungkus cap "Dicetak" — keduanya kecil, tanpa perubahan perilaku |
| Deferred | 2 | Dicatat di STATE.md (Deferred Issues) |

**Total impact:** Esensial, tanpa scope creep. File baru bertambah satu (`format-file-date.ts`; 10 berkas modul, bukan 9) dan pembuatan blob pindah ke `mitra-list-pdf.tsx`.

### Auto-fixed Issues

**1. [Bundel] `date-fns format()` di jalur eager menarik chunk `format` ke entry**
- **Found during:** Task 3 (build produksi ke direktori scratch)
- **Issue:** `export-mitra-list-pdf.ts` meng-import `format` dari `date-fns` secara statis; Mitras (eager) memindahkan chunk `format-*.js` (20,78 kB) dari lazy ke entry → entry 580.467 B (+22.678 B), melanggar AC-6 (< +8 kB)
- **Fix:** Fungsi 5 baris `formatFileDate` (tanggal lokal) di berkas baru `format-file-date.ts`; tanpa `date-fns` di jalur eager
- **Files:** `export-mitra-list-pdf.ts`, `format-file-date.ts` (baru)
- **Verification:** Build ulang: entry 559.588 B (+1.799 B), `format-DF3zju1I.js` kembali chunk lazy; assertion `formatFileDate` (3 tanggal) lulus

**2. [Bundel] Import dinamis namespace `@react-pdf/renderer` menambah chunk `vendor-pdf`**
- **Found during:** Task 3 (build pertama)
- **Issue:** `import('@react-pdf/renderer')` dari berkas ekspor mengambil seluruh namespace sehingga tree-shaking dinonaktifkan: `vendor-pdf` 1.466,87 → 1.468,89 kB (hash berubah)
- **Fix:** Pembuatan blob (`pdf()` + `updateContainer` + `toBlob`) dipindah ke `mitra-list-pdf.tsx` sebagai `createMitraListPdfBlob`; `exportMitraListPdf` hanya `import('./mitra-list-pdf')`
- **Files:** `mitra-list-pdf.tsx`, `export-mitra-list-pdf.ts`
- **Verification:** `vendor-pdf-iOULSWDy.js` 1.466.869 B identik baseline; assertion `createMitraListPdfBlob` → Blob `application/pdf` berheader `%PDF` lulus

**3. [Implementasi] `toPdfSafeText` memfilter per code point, bukan regex dengan flag `u`**
- **Found during:** Task 1
- **Issue:** Regex dengan karakter mentah rawan salah (rentang U+00A0-00FF sempat tertulis dengan spasi biasa sehingga ikut meloloskan karakter kontrol); kesalahan yang sama terulang pada percobaan kedua
- **Fix:** Daftar 27 code point tambahan WinAnsi + dua rentang, difilter per code point (`[...text]`) — perilaku sama, lebih mudah dibaca dan diperiksa
- **Files:** `to-pdf-safe-text.ts`
- **Verification:** 14 assertion `toPdfSafeText` lulus (Latin-1 dan WinAnsi tak berubah, emoji/CJK/kontrol terbuang, NFC, spasi diratakan, kosong → "-")

### Deferred Items

Dicatat di STATE.md (Deferred Issues):
- Helper unduh Blob dipakai bersama: `Reports.tsx` memuat pola yang sama secara inline (tanpa jeda `revokeObjectURL`) — kandidat ekstraksi (ditemukan di Task 2)
- Batasan WinAnsi juga berlaku di PDF lama (SPK memuat `designNotes` teks bebas, nama produk/mitra): `toPdfSafeText` bisa dibagikan (ditemukan di discovery, dikonfirmasi Task 2)

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Build pertama: entry +22,7 kB dan `vendor-pdf` +2 kB | Dua perbaikan bundel di atas; build ulang membuktikan entry +1,8 kB dan `vendor-pdf` identik baseline |
| Regex karakter mentah di `to-pdf-safe-text.ts` salah dua kali | Diganti daftar code point eksplisit dan diuji |
| Tab Browser untuk berkas lokal beberapa kali tidak bisa di-screenshot (tab terbuka sebagai pratinjau berkas) | Berkas disalin ke `node_modules/.cache/` proyek, tab ditutup dan dibuka ulang; PDF dilihat lewat `file://` |
| Navigasi ke URL `blob:` dari halaman tidak mengganti halaman | PDF dari browser dikirim ke penerima sementara di port 3002 (dihapus) lalu dibuka dari berkas |

## Next Phase Readiness

**Ready:**
- Modul `mitra-export` siap dipakai Plan 46-02: `calculateMitraStats` (angka panel), `toPdfSafeText`, `downloadBlob`, `formatFileDate`, pola `createMitra...Blob` + `import()` dinamis, dan `useMitraPdfExport` (tinggal ditambah ekspor satu mitra).
- `MitraDetailPanel` sudah menerima `mitra`, `mitraUser`, dan `stats` — semua data PDF per mitra tersedia tanpa API baru.

**Concerns:**
- Tombol di bagian "Tindakan" panel (grid 2 kolom) perlu keputusan tata letak; `isExporting` dari hook harus dibagi dengan tombol header agar tidak ada dua ekspor paralel (props ke panel).
- Layar Manajemen Mitra memakai urutan API sedangkan PDF A–Z (urutan layar tidak disamakan).
- Phase 47 (chunk PDF lazy) ada di branch `claude/charming-clarke-4d6351` dan belum digabung; saat digabung `.paul/ROADMAP.md`, `STATE.md`, `paul.toml`, dan `ledger.toml` akan bentrok ringan. 46-01 benar pada kedua kondisi chunking.
- Jalur toast galat dan tombol nonaktif saat tanpa mitra belum dijalankan di UI (hanya dibaca dari kode).

**Blockers:**
- None

---
*Phase: 46-mitras-pdf-export, Plan: 01*
*Completed: 2026-10-23*
