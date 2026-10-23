---
phase: 47-pdf-chunk-lazy-loading
plan: 01
completed: 2026-10-23T18:16:19+07:00
duration: ~20min
description: "Chunk @react-pdf/renderer kini benar-benar lazy di build produksi: entri 'vendor-pdf' dihapus dari manualChunks; JS jalur kritis turun 771,56 → 279,59 kB gzip"
type: Summary
about: "rema-v2.1"
---

# Phase 47 Plan 01: Chunk PDF Lazy di Build Produksi Summary

**Entri `'vendor-pdf'` dihapus dari `manualChunks` di `vite.config.ts`: `@react-pdf/renderer` kini menjadi chunk `react-pdf.browser-*.js` yang hanya di-import statis oleh `Reports` dan `OrderDetail`, tidak lagi di-preload `index.html` maupun di-import entry — JS jalur kritis turun dari 771,56 kB menjadi 279,59 kB gzip (−491,97 kB, −63,8%), entry hanya +0,68 kB.**

## Penyebab

`manualChunks` bentuk objek di Rollup ikut memasukkan modul bersama milik chunk itu. `react/jsx-runtime` (ekspor `j` dari `vendor-pdf`) ikut terbawa ke `vendor-pdf`, sehingga entry (`import{j as o}from"./vendor-pdf-*.js"`) dan ke-8 halaman lazy meng-import chunk 1,47 MB itu secara statis dan Vite men-preload-nya di `index.html`. Tujuan isolasi Phase 32 tidak tercapai untuk chunk PDF (`vendor-charts` memang eager karena Dashboard memakai recharts).

## AC Result

| Criterion | Status |
|-----------|--------|
| AC-1: Chunk PDF tidak di jalur kritis | Pass |
| AC-2: Ukuran dan kualitas terjaga | Pass |
| AC-3: PDF tetap dihasilkan; chunk dimuat saat halaman dibuka | Pass |

## Files Changed

| File | Change |
|------|--------|
| `vite.config.ts` | Modified (+3/−1) — hapus `'vendor-pdf': ['@react-pdf/renderer']` dari `manualChunks` + komentar alasan agar tidak dikembalikan; `'vendor-charts'` tidak berubah |

## Hasil Ukur (sebelum → sesudah)

Build: `npm run build -- --outDir node_modules/.cache/<nama> --emptyOutDir` (vite 6.4.2, 3771 modul) pada commit dasar 2276e42; kedua build di checkout yang sama, hanya `vite.config.ts` yang berbeda. Ukuran kB = 1000 byte seperti laporan Vite.

| Metrik | Sebelum | Sesudah | Selisih |
|--------|---------|---------|---------|
| Chunk PDF | `vendor-pdf-iOULSWDy.js` 1.466,87 kB · gzip 492,16 kB | `react-pdf.browser-MXUDNrCB.js` 1.466,17 kB · gzip 491,85 kB | −0,70 kB · gzip −0,31 kB |
| Entry | `index-Daov7N9v.js` 557,79 kB · gzip 163,83 kB | `index-BB3a8_Vt.js` 558,47 kB · gzip 164,02 kB | **+0,68 kB** · gzip +0,19 kB (batas ±1 kB) |
| `vendor-charts-DLucGAxp.js` | 390,82 kB · gzip 115,57 kB | identik (hash sama) | 0 |
| `modulepreload` di `index.html` | `vendor-charts`, `vendor-pdf` | hanya `vendor-charts` | −1 |
| Import statis entry | `vendor-pdf` (`j`) + `vendor-charts` | hanya `vendor-charts` (nama chunk PDF hanya di `__vite__mapDeps`) | |
| Halaman lazy yang meng-import chunk PDF secara statis | 8 dari 8 (AppQueue, AuditLogs, Calculator, CancellationsReturns, Finance, OrderDetail, OrderPriorities, Reports) | 2 (OrderDetail, Reports) | −6 |
| JS jalur kritis (entry + vendor-charts + chunk PDF) | 2.415,48 kB · gzip 771,56 kB | 949,29 kB · gzip 279,59 kB | −1.466,19 kB · gzip **−491,97 kB (−63,8%)** |
| JS terkirim di layar Login (browser, resource timing, gzip) | ≈753 KiB (entry 160 + vendor-charts 113 + vendor-pdf 481) | ≈273 KiB (entry 160 + vendor-charts 113) | ≈−480 KiB |
| `index.html` | 0,63 kB · gzip 0,34 kB | 0,55 kB · gzip 0,33 kB | −0,08 kB |
| Precache PWA | 31 entri · 2.797,27 KiB | 31 entri · 2.796,97 KiB | −0,30 KiB |

Precache PWA praktis sama: service worker tetap mengunduh chunk PDF di latar belakang (31 entri), jadi total byte untuk pengguna PWA tidak berkurang — yang berubah adalah chunk itu tidak lagi menghalangi startup.

## Verify

| Check | Hasil |
|-------|-------|
| `npm run build` (baseline dan sesudah, ke direktori scratch) | exit 0 kedua kali (26,86 dtk / 23,75 dtk); peringatan chunk >500 kB sekarang untuk `react-pdf.browser` dan `index` (sudah ada sebelumnya untuk `vendor-pdf`/`index`) |
| `npm run lint` (`tsc --noEmit`) | exit 0 |
| `git diff` | hanya `vite.config.ts` (+3/−1); dependency, komponen PDF, Reports/OrderDetail tidak tersentuh |
| Smoke test `vite preview --outDir <scratch sesudah>` + mock API lokal | lihat tabel di bawah; konsol browser tanpa error |

Smoke test memakai server mock lokal (fixture 2 mitra, 3 produk, 3 pesanan online/offline, 3 ledger; skrip ada di folder catatan sesi, di luar repo) — tanpa akses ke DB/R2 produksi; login dilewati dengan token mock.

| Skenario | Hasil |
|----------|-------|
| Layar Login dan Dashboard (startup) | JS diminta: entry + `vendor-charts` (+ `workbox-window`); chunk PDF **tidak** diminta |
| Buka Laporan (navigasi client-side) | `Reports-*.js` + `react-pdf.browser-MXUDNrCB.js` baru diminta saat itu |
| Laporan › Cetak PDF › Unduh PDF — tab Keuangan | `Laporan_finance_*.pdf`, 4.279 B, 1 halaman |
| Laporan › Cetak PDF › Unduh PDF — tab Pesanan | `Laporan_order_*.pdf`, 5.506 B, 1 halaman |
| Laporan › Cetak PDF › Unduh PDF — tab Rekap Tagihan | `Laporan_billing_*.pdf`, 5.953 B, 1 halaman |
| Buka Detail Pesanan offline (`/orders/o-2`, navigasi client-side dari Dashboard) | `OrderDetail-*.js` + chunk PDF baru diminta saat itu |
| Detail Pesanan › Cetak SPK | `SPK-EF34GH.pdf`, 3.429 B, 1 halaman |
| Detail Pesanan › Resi Offline (label pengiriman) | `RESI-OFFLINE-EF34GH.pdf`, 3.522 B, 1 halaman |

Semua PDF: header `%PDF-1.3`, akhir `%%EOF`, tipe blob `application/pdf` (Laporan), tanpa `alert` gagal ekspor. Server preview/mock dimatikan, service worker + cache origin `localhost:4173` dibersihkan, direktori scratch dan konfigurasi launcher sementara dihapus.

## Batasan

- Yang diperiksa pada PDF hanya validitas file (header, `%%EOF`, jumlah halaman, ukuran) — tampilan visual tidak dibandingkan, karena komponen PDF dan datanya tidak berubah; data uji = fixture, bukan data produksi.
- Build di Vercel belum diuji (belum deploy); pengujian dilakukan pada build lokal lewat `vite preview`.
- Reports dan OrderDetail masih meng-import `@react-pdf/renderer` secara statis (lihat Deferred Issues di STATE.md).

---
*Completed: 2026-10-23*
