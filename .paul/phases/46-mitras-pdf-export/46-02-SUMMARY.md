---
phase: 46-mitras-pdf-export
plan: 02
subsystem: ui
tags: [react-pdf, mitras, pdf-export, lazy-loading, typescript]

requires:
  - phase: 46-mitras-pdf-export
    provides: Plan 46-01 — modul `mitra-export` (calculateMitraStats, toPdfSafeText, downloadBlob, formatFileDate, hook, pola PDF lazy)
provides:
  - PDF per mitra: `MitraDetailPDF` + `createMitraDetailPdfBlob`, `buildMitraDetail`, `buildMitraDetailFileName`, `exportMitraDetailPdf`, dan `exportMitraDetail` di `useMitraPdfExport`
  - Tombol "Cetak PDF" di bagian Tindakan panel Detail Info Mitra
affects: [mitras]

tech-stack:
  added: []
  patterns: [berkas PDF kedua mengikuti pola lazy 46-01 tanpa deviasi bundel, satu hook dengan satu isExporting + satu penjaga klik untuk dua ekspor, uji pohon elemen yang memperluas komponen fungsi buatan sendiri, uji klik browser dengan API tiruan termasuk jalur galat dan daftar kosong]

key-files:
  created:
    - src/components/mitras/mitra-export/build-mitra-detail.ts
    - src/components/mitras/mitra-export/build-mitra-detail-file-name.ts
    - src/components/mitras/mitra-export/mitra-detail-pdf.tsx
    - src/components/mitras/mitra-export/export-mitra-detail-pdf.ts
  modified:
    - src/components/mitras/mitra-export/mitra-export-types.ts
    - src/components/mitras/mitra-export/use-mitra-pdf-export.ts
    - src/components/mitras/mitra-export/index.ts
    - src/pages/Mitras.tsx

key-decisions:
  - "`buildMitraDetail` hanya memetakan `stats` yang sama dengan panel (tanpa hitung ulang); limit yang dicetak = nilai tersimpan"
  - "Tombol di Tindakan panel (baris penuh di atas Hapus Mitra, hanya mode lihat); satu `isExporting` + penjaga klik dibagi dengan tombol header"
  - "Nama berkas `Mitra_<NAMA_AMAN>_<tanggal>.pdf`: diakritik dibuang, non-alfanumerik jadi `_`, maksimal 40 karakter, kosong jadi `Tanpa_Nama`"

patterns-established:
  - "Setiap PDF baru di halaman eager: satu berkas PDF yang meng-import react-pdf + pembuat blob, berkas ekspor hanya `import()` dinamis ke berkas itu, barrel tanpa komponen PDF"
  - "Dua ekspor berbagi satu fungsi internal `runExport` (penjaga klik ganda, try/catch, toast) di hook"

duration: ~35min
started: 2026-10-23T13:20:17Z
completed: 2026-10-23T13:55:25Z
description: "Tombol Cetak PDF di panel Detail Info Mitra mengunduh PDF satu halaman per mitra dengan angka identik panel; nama berkas aman, ekspor lewat import() dinamis (entry +1,95 kB), satu status ekspor dibagi dengan tombol header"
type: Summary
about: "rema-v2.1"
---

# Phase 46 Plan 02: PDF per Mitra dari Panel Detail Info Mitra Summary

**Tombol "Cetak PDF" di bagian Tindakan panel Detail Info Mitra mengunduh PDF satu halaman untuk mitra yang dibuka — nama, status, penanggung jawab + kontak, limit kredit, dan tiga statistik dengan angka identik panel; nama berkas aman, library PDF tetap lazy (entry +1,95 kB) dan satu status ekspor dibagi dengan tombol header.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~35 menit (eksekusi APPLY → UNIFY; plan dibuat 18:56 dan menunggu persetujuan user ±84 menit, tidak dihitung) |
| Started | 2026-10-23T13:20:17Z (APPLY mulai; plan dibuat 11:56:00Z) |
| Completed | 2026-10-23T13:55:25Z |
| Tasks | 3 auto + 1 checkpoint selesai |
| Files modified | 8 kode (4 baru, 4 diubah; `Mitras.tsx` kumulatif +20/−9 terhadap HEAD bersama 46-01) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Tombol Cetak PDF di panel mengunduh PDF mitra | Pass | Uji browser: `Mitra_TOKO_MAJU_JAYA_2026-10-23.pdf` (3.395 B, `application/pdf`, `%PDF-`), panel tetap terbuka; isi 1 halaman diperiksa visual (judul, nama huruf besar, status, 3 kotak, kartu info, catatan kaki); disetujui user di checkpoint |
| AC-2: Angka identik dengan panel | Pass | `buildMitraDetail` menyalin `stats` apa adanya (27 assertion: statistik identik, field tambahan tidak ikut, input tidak dimutasi); handler memberi `getMitraStats(mitra.id)` yang sama dengan panel |
| AC-3: Fallback dan format | Pass | Mitra arsip tanpa akun, limit null, saldo negatif → "Terarsip", "-", "-", "Unlimited", "-Rp 1.500.000" hijau (visual); limit 0 → "Unlimited"; penanggung jawab hanya emoji → "-" (uji pohon elemen) |
| AC-4: Nama berkas aman dan teks dinamis aman | Pass | Di browser: `Mitra_CV_SEJAHTERA_ABADI_SENTOSA_MAKMUR_BERSAM_…` (40 karakter), `Mitra_Konveksi_Ria_Collection_…`, `Mitra_Cafe_Nandu_Outlet_…`, `Mitra_Andi_Garment_…`, nama CJK → `Mitra_Tanpa_Nama_…`; emoji/CJK tidak ada di isi PDF; semua nama lolos pola `[A-Za-z0-9_]` |
| AC-5: Status ekspor bersama dan galat | Pass | Selama proses, tombol panel dan header sama-sama "Membuat PDF..." + nonaktif. Jalur galat dijalankan di UI: toast "Gagal membuat PDF", tombol aktif lagi, panel terbuka, tanpa unduhan, ekspor berikutnya normal |
| AC-6: Library PDF tetap lazy | Pass | `mitra-detail-pdf-DBb8-oYc.js` 3.438 B (gzip 1,33 kB) terpisah; entry 561.540 B (+1.952 B dari 559.588, batas 3.000 B); tanpa import statis di entry; `vendor-pdf` 1.466.869 B identik baseline; di dev, modul PDF dan library baru diminta setelah klik |
| AC-7: Panel dan halaman tidak berubah selain tombol baru | Pass | Tombol hilang di mode edit dan muncul lagi setelah Batal; header, tabel/kartu, dan angka layar tidak berubah (diff terbatas pada tombol, props, handler); tombol header nonaktif saat daftar kosong |

## Accomplishments

- Panel Detail Info Mitra punya tombol "Cetak PDF" (baris penuh di atas "Hapus Mitra", hanya mode lihat) yang mengunduh PDF satu halaman: nama huruf besar, status Partner Aktif/Terarsip, Total Penjualan, Jumlah Pesanan, Saldo Piutang, Akun Penanggung Jawab, Kontak WhatsApp, Limit Kredit ("Unlimited" bila kosong), catatan kaki.
- Angka PDF identik panel tanpa perhitungan baru: `buildMitraDetail` hanya memetakan `stats` yang diberikan panel.
- Nama berkas aman untuk semua jenis nama (aksen, emoji, CJK, simbol, nama panjang) dan teks dinamis di PDF dibersihkan lewat `toPdfSafeText`.
- Satu hook melayani dua ekspor: `isExporting` dan penjaga klik dibagi, sehingga tombol header dan panel saling mengunci dan dua ekspor tidak berjalan paralel.
- Pola lazy 46-01 diterapkan tanpa deviasi bundel: `mitra-detail-pdf` chunk 3,4 kB, entry +1,95 kB, `vendor-pdf` tidak berubah.

## Task Commits

Tidak ada commit per task — seluruh perubahan Phase 46 (46-01 dan 46-02) di-commit pada transisi phase (`feat(46): ...`), sesuai pola phase sebelumnya. Hash tercatat di STATE.md (Git State).

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/components/mitras/mitra-export/build-mitra-detail.ts` | Created (16) | `buildMitraDetail`: memetakan mitra + akun + `stats` menjadi `MitraDetail` tanpa hitung ulang |
| `src/components/mitras/mitra-export/build-mitra-detail-file-name.ts` | Created (27) | `buildMitraDetailFileName`: `Mitra_<NAMA_AMAN>_<tanggal>.pdf` |
| `src/components/mitras/mitra-export/mitra-detail-pdf.tsx` | Created (111) | `MitraDetailPDF` (A4, 1 halaman, kartu info) + `createMitraDetailPdfBlob` |
| `src/components/mitras/mitra-export/export-mitra-detail-pdf.ts` | Created (11) | `exportMitraDetailPdf`: `import()` dinamis → blob → unduh |
| `src/components/mitras/mitra-export/mitra-export-types.ts` | Modified (55, +18) | Tipe `MitraDetailMitra`, `MitraDetailAccount`, `MitraDetailInput`, `MitraDetail` |
| `src/components/mitras/mitra-export/use-mitra-pdf-export.ts` | Modified (44, dari 32) | `exportMitraDetail`; satu `runExport` bersama untuk penjaga klik, try/catch, toast |
| `src/components/mitras/mitra-export/index.ts` | Modified (17, dari 8) | Ekspor `buildMitraDetail`, `exportMitraDetailPdf`, tipe baru; komentar `MitraDetailPDF` tidak diekspor |
| `src/pages/Mitras.tsx` | Modified (kumulatif +20/−9) | Impor, destructuring hook, `handleExportDetailPdf`, props `onExportPdf`/`isExporting` di panel, tombol di Tindakan |

## Verification Results

| Check | Hasil |
|-------|-------|
| `npm run lint` (`tsc --noEmit`) | exit 0 — setelah tiap task dan di akhir |
| Uji fungsi murni (Node + esbuild bundle, skrip sementara di luar repo) | 27 assertion lulus: `buildMitraDetail` (pemetaan, fallback akun, limit null, statistik tidak dihitung ulang, tanpa mutasi) dan `buildMitraDetailFileName` (aksen, emoji/CJK/kosong → `Tanpa_Nama`, pemangkasan 40 karakter, hanya karakter aman) |
| Uji render PDF (Node, esbuild + `renderToBuffer`) | 44 assertion lulus: lima kasus semuanya tepat 1 halaman (aktif lengkap, arsip tanpa akun + saldo negatif, emoji + CJK, nama 200 karakter tanpa spasi, nama 25 kata); inspeksi pohon elemen untuk tiga detail; tanpa elemen `fixed`; `createMitraDetailPdfBlob` → Blob `application/pdf` |
| Inspeksi visual PDF contoh (viewer browser pane) | Kasus A (aktif lengkap) dan B (arsip, tanpa akun, limit null, saldo negatif) sesuai panel |
| Build produksi ke direktori scratch | exit 0; `mitra-detail-pdf` chunk 3.438 B; entry 561.540 B (+1.952 B); `vendor-pdf` 1.466.869 B identik; `format-*.js` tetap lazy; tanpa import statis ke `mitra-detail-pdf` di entry |
| Uji klik browser (Vite dev + API tiruan lokal, tanpa DB/R2 produksi) | Ekspor 6 mitra berbeda (berkas benar, `application/pdf`); label/nonaktif bersama tombol header; tombol hilang di mode edit; jalur galat (toast, tombol aktif, panel terbuka, ekspor berikutnya normal); daftar kosong → tombol header nonaktif; modul PDF dan library baru diminta setelah klik; konsol hanya berisi galat uji yang disengaja |
| Checkpoint Task 4 (human-verify) | Disetujui user tanpa temuan yang dilaporkan |
| Kebersihan | Skrip uji, bundel, mock, build scratch, dan server dev dihapus/dihentikan |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `buildMitraDetail` hanya memetakan `stats` dari panel; limit = nilai tersimpan | Angka PDF harus sama dengan yang dilihat admin; isi editor yang belum disimpan bukan data mitra | Tidak ada perhitungan baru; PDF tidak mencerminkan limit yang baru diketik tetapi belum disimpan |
| Judul PDF "Detail Info Mitra", label "Jumlah Pesanan", status "Partner Aktif"/"Terarsip" | Judul dan status sama dengan panel; "Volume Pesanan"/"items" di panel ambigu (sebenarnya jumlah pesanan) | Konsisten dengan Daftar Mitra |
| Tombol di Tindakan: baris penuh di atas "Hapus Mitra", gaya biru lembut, hanya mode lihat | Tidak bercampur dengan tindakan destruktif, bagian Tindakan memang tidak ada di mode edit | Pola tombol serupa dengan header |
| Satu `isExporting` + satu penjaga `useRef` dibagi dua ekspor lewat `runExport` | Dua ekspor tidak boleh paralel; logika try/catch/toast tidak digandakan | Perilaku `exportMitraList` tidak berubah |
| Nama berkas `Mitra_<NAMA_AMAN>_<yyyy-MM-dd>.pdf` | Aman di semua sistem berkas dan mudah dikenali | Nama tak terbaca → `Tanpa_Nama` |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Scope additions | 2 | Komponen internal `InfoRow` di `mitra-detail-pdf.tsx`; verifikasi tambahan di browser (jalur galat, daftar kosong) — tanpa perubahan perilaku |
| Deferred | 1 | Dicatat di STATE.md (Deferred Issues) |

**Total impact:** Tidak ada deviasi dari plan. Pelajaran bundel 46-01 sudah dimasukkan ke plan sehingga build pertama langsung lolos batas AC-6.

### Deferred Items

Dicatat di STATE.md (Deferred Issues):
- `MitraDetailPanel` memakai `mitraUser?: any` (sudah ada sebelum Phase 46) — ganti dengan tipe `SafeUser` (ditemukan saat Task 3)

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Uji pohon elemen pertama gagal membaca label "Akun Penanggung Jawab" karena label dikirim lewat props ke `InfoRow`, bukan `children` | Walker uji memperluas komponen fungsi buatan sendiri (kekurangan skrip uji, bukan bug produk); 44 assertion lulus setelahnya |
| Viewer PDF lokal di browser pane sempat timeout dan tidak bisa diklik di dalam frame | Pemeriksaan visual lewat scroll viewer setelah tampilan di-render ulang |

## Next Phase Readiness

**Ready:**
- Phase 46 lengkap: Daftar Mitra (46-01) dan PDF per mitra (46-02) memakai satu modul `mitra-export` dengan public API `index.ts`.
- Pola PDF lazy + hook bersama siap dipakai ekspor lain di halaman eager.

**Concerns:**
- Phase 47 (chunk PDF lazy) ada di branch `claude/charming-clarke-4d6351` dan belum digabung; saat digabung `.paul/ROADMAP.md`, `STATE.md`, `paul.toml`, `ledger.toml` akan bentrok ringan dengan Phase 46. Modul `mitra-export` benar pada kedua kondisi chunking.
- Deferred Issues yang bertambah di Phase 46: helper unduh Blob bersama, batasan WinAnsi di PDF lama, semantik "Total Penjualan", urutan layar vs PDF, tipe `mitraUser?: any`.

**Blockers:**
- None

---
*Phase: 46-mitras-pdf-export, Plan: 02*
*Completed: 2026-10-23*
