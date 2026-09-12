# Phase Context

**Phase:** 39 — Reports Status Filter Fix
**Generated:** 2026-09-12
**Status:** Ready for planning

## Goals

- Filter status di halaman Laporan (tab Pesanan) menampilkan seluruh status alur pesanan — persis sama dengan `OrderStatus` di `src/types.ts:34` (9 status).
- Menghilangkan gap dimana user tidak bisa memfilter pesanan tahap `pressing`, `packing`, dan `cancelled` di laporan.

## Approach

- Ganti hardcoded 6 `<option>` di `src/pages/Reports.tsx:316-324` menjadi 9 status lengkap sesuai alur bisnis.
- Reuse label bahasa Indonesia dari konstanta `STATUS_LABELS` yang sudah ada di `src/pages/orders/OrderDetail.tsx:21-31` untuk konsistensi seluruh app. Idealnya: extract `STATUS_LABELS` ke lokasi shared (mis. `src/lib/order-status.ts` atau `src/types.ts`) supaya bisa dipakai ulang tanpa duplikasi.
- Urutan opsi mengikuti flow bisnis: `draft → waiting_confirmation → confirmed → processing → pressing → packing → shipped → returned → cancelled`.
- Opsi "Semua" tetap ada sebagai default.

## Constraints

- **Scope sempit:** hanya menyentuh filter dropdown status di tab Pesanan (`Reports.tsx`). Tidak menyentuh logika kalkulasi `totalQty` / `totalSubtotal` / chart, dan tidak menyentuh tab Keuangan.
- Label harus konsisten dengan yang sudah dipakai di halaman Order Detail (source of truth: `STATUS_LABELS`).
- Tidak boleh menyebabkan regresi pada filter default `all` atau perilaku useEffect role-based (mitra auto-set `ordMitraId`).

## Open Questions

- (Ditinjau saat plan) Apakah `STATUS_LABELS` sebaiknya di-extract ke `src/lib/order-status.ts` sebagai shared constant, atau cukup diduplikasi di `Reports.tsx`? Rekomendasi: extract — sudah dipakai di 2 file (OrderDetail, SPKPDF) + akan dipakai di Reports.
- (Deferred) Apakah `cancelled`/`returned` harus ikut kalkulasi `totalQty` / `totalSubtotal` / chart? Saat ini ikut, dan berbeda treatment dari tab Keuangan yang exclude `cancellation`/`return`. **Tidak masuk scope Phase 39** — user eksplisit hanya minta filter status.

## Additional Context

- **Sumber masalah:** filter status di `Reports.tsx:316-324` hanya punya 6 opsi (Draft, Menunggu, Dikonfirmasi, Diproses, Dikirim, Retur). Tiga status hilang: `pressing`, `packing`, `cancelled`.
- **Label reference** dari `OrderDetail.tsx:21-31`:
  - draft → Draft
  - waiting_confirmation → Menunggu Konfirmasi
  - confirmed → Dikonfirmasi
  - processing → Proses Produksi
  - pressing → Press Sablon
  - packing → Sedang Packing
  - shipped → Terkirim/Selesai
  - returned → Pesanan Retur
  - cancelled → Dibatalkan
- **Estimasi:** Quick-fix, satu file utama (`Reports.tsx`) + opsional satu file baru (`src/lib/order-status.ts`) jika extract dilakukan.

---

*This file is temporary. It informs planning but is not required.*
*Created by /paul:discuss, consumed by /paul:plan.*
