# Phase Context

**Phase:** 42 — Reports: Rekap Tagihan per Produk
**Generated:** 2026-10-22
**Status:** Ready for planning

## Goals

- Tambah tab baru **"Rekap Tagihan"** di halaman Laporan (`/reports`) yang menampilkan rekap **Produk · Qty · Harga · Total** dari pesanan yang sudah **tercatat tagihan**.
- Angka rekap **selaras dengan data tagihan di Keuangan**: total rekap = jumlah debit ledger `source:'order'` pada mitra + periode yang sama.
- Tombol **"Cetak PDF"** di header Laporan ikut berfungsi untuk tab ini (komponen PDF rekap baru).

## Approach

- **Definisi "tercatat tagihan":** `order.isBilled === true`. Flag ini terset saat status → `packing` (bersamaan dengan pembuatan entri ledger debit `source:'order'`), tetap `true` saat `shipped`, dan direset `false` + ledger dihapus saat `cancelled`/`returned` (`OrderDetail.tsx:150-170`, `requests.ts:51-56`). Pesanan batal/retur otomatis tidak ikut — tidak perlu filter status manual.
- **Sumber data:** tanpa API/schema/backend baru. `Reports.tsx` sudah memuat `allOrders` dan `allLedgers` (`Reports.tsx:20-25`); tiap `OrderItem` punya `productName`, `qty`, `priceSnapshot`. Isolasi data mitra sudah ditegakkan server (orders + ledgers API) — tidak perlu logika tambahan di frontend.
- **Periode = tanggal tagihan tercatat:** ambil dari `createdAt` entri ledger `source:'order'` dengan `referenceId === order.id` (join di client dari `allLedgers`). Batas inklusif sama persis dengan tab Keuangan (`setHours(0,0,0,0)` / `setHours(23,59,59,999)`, `Reports.tsx:60-61`).
- **Granularitas baris: per produk + harga satuan.** Kelompokkan item dari order tertagih per `(produk, priceSnapshot)`; produk sama dengan harga berbeda → baris terpisah. Tiap baris: `Qty = Σ qty`, `Harga = priceSnapshot`, `Total = Qty × Harga`. Baris TOTAL di bawah (Σ Qty, Σ Total). Contoh:
  ```
  Produk       Qty   Harga      Total
  Kaos Polos    40   45.000   1.800.000
  Kaos Polos    10   50.000     500.000
  Hoodie        12  120.000   1.440.000
  TOTAL         62             3.740.000
  ```
- **UI:** `activeTab` menjadi `'finance' | 'order' | 'billing'`; tab ketiga di switcher (`Reports.tsx:189-204`) dengan blok `motion.div key="billing"` seperti dua tab lain. Filter: Mitra (khusus admin) + Tanggal Mulai + Tanggal Akhir — salin pola kartu filter tab Keuangan (`Reports.tsx:209-233`). Kartu ringkas: Total Qty + Total Tagihan. Tabel untuk desktop + tampilan ringkas untuk mobile (pola card dengan border-kiri seperti halaman lain).
- **Struktur kode (AI-friendly, sesuai CLAUDE.md global):** agregasi diekstrak ke fungsi murni (mis. `src/lib/billing-recap.ts` → `buildBillingRecap(orders, ledgers, filters)`, named export), bukan logika kompleks inline di komponen. Pertimbangkan komponen terpisah untuk isi tab agar `Reports.tsx` (±416 baris) tidak makin gemuk.
- **PDF:** komponen baru mengikuti pola `OrderReportPDF.tsx` (judul + periode + mitra, kotak ringkasan, tabel, baris total); tambah cabang ketiga di `handleExport` (`Reports.tsx:145-175`). Nama file unduhan tetap `Laporan_{activeTab}_{timestamp}.pdf`.

## Constraints

- **Tidak ada perubahan backend/schema/API.**
- **Tidak mengubah tab Keuangan dan Pesanan.** Deferred issue di STATE.md (`cancelled`/`returned` ikut kalkulasi tab Pesanan) tetap deferred; tab baru menghindarinya lewat `isBilled`.
- **Akses role:** `operational` tetap ditolak (guard `Reports.tsx:141`); `mitra` hanya melihat data miliknya (server-enforced); `staff` tidak melihat nominal uang di Laporan (konvensi yang ada: tab Keuangan disembunyikan, `showSubtotal={user.role !== 'staff'}`) — perlakuan tab baru untuk staff: lihat Open Questions.
- **Tanpa kolom mitra** di tabel — admin memakai filter Mitra yang sudah ada (pecahan per mitra bisa ditambahkan nanti bila diminta).
- Debit ledger `source:'manual'` tidak punya produk → tidak masuk rekap.
- Tidak ada test runner; verifikasi = `npm run lint` (type check) + cek manual.

## Open Questions

- **Staff & tab baru:** usulan = tab **disembunyikan sepenuhnya** untuk staff (sama seperti Keuangan; seluruh isinya urusan tagihan). Alternatif: tampil tanpa kolom Harga/Total (jadi hanya produk + qty). Putuskan saat plan.
- **Kunci grup:** `productName` (konsisten dengan `productRecap` di `Reports.tsx:114`) atau `productId` (lebih stabil bila nama produk berubah), ditambah `priceSnapshot`. Usulan: `productId + priceSnapshot`, label dari `productName` item.
- **Data anomali:** order `isBilled` tanpa entri ledger `source:'order'` (atau sebaliknya, ledger tanpa order). Usulan: hanya hitung order yang `isBilled === true` DAN punya entri ledger-nya; anomali diabaikan. Cek ada/tidaknya anomali di data production saat planning.
- **Selisih dengan "Total Tagihan" Keuangan:** kartu itu menjumlah semua debit non-cancellation/return, termasuk `manual`. Perlu catatan kecil di UI agar angka yang berbeda tidak membingungkan?
- **Penamaan file baru:** CLAUDE.md global mewajibkan kebab-case + named export (mis. `billing-recap-pdf.tsx`), sedangkan file sebelahnya di `src/components/reports/` PascalCase (`OrderReportPDF.tsx`). Usulan: file baru ikut CLAUDE.md global; file lama tidak di-rename.

## Additional Context

- **Keputusan dari diskusi (semua sesuai rekomendasi):** penempatan = tab baru; baris = per produk + harga satuan; periode = tanggal tagihan tercatat; PDF ikut di phase ini.
- **File yang kemungkinan tersentuh:** `src/pages/Reports.tsx` (state tab, tombol tab, `handleExport`), util agregasi baru, komponen tab baru (opsional), komponen PDF baru di `src/components/reports/`.
- **Bisa dipakai ulang:** `formatCurrency`/`formatDate` (`src/lib/utils.ts`), markup kartu filter tab Keuangan, pola PDF `OrderReportPDF.tsx`/`FinanceReportPDF.tsx`.
- **Urutan baris default:** nama produk A–Z, lalu harga naik (kolom sortable bisa menyusul).
- **Verifikasi yang disarankan:** (1) pada periode yang hanya berisi debit `order`, total rekap = "Total Tagihan" tab Keuangan; (2) pesanan cancelled/returned tidak muncul; (3) login mitra hanya melihat datanya sendiri; (4) PDF terunduh dan angkanya sama dengan layar.
- **ROADMAP:** Phase 42 belum terdaftar di `.paul/ROADMAP.md` — daftarkan lewat `/paul:plan` (atau `/paul:add-phase`).
- **Estimasi:** 1 plan tipe standard (util agregasi → tab UI → PDF); pecah jadi 2 plan bila PDF membengkak.

---

*This file is temporary. It informs planning but is not required.*
*Created by /paul:discuss, consumed by /paul:plan.*
