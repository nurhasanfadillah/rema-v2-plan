# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-13)

**Core value:** Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.
**Current focus:** Phase 46 complete — Manajemen Mitra punya ekspor PDF Daftar Mitra (tombol di header) dan PDF per mitra (tombol di panel Detail Info Mitra).

## Current Position

Milestone: v2.5 UI Fixes (rolling)
Phase: 46 (Mitras: Ekspor PDF) — Complete
Plan: Not started
Status: Ready to plan next phase
Last activity: 2026-10-23 — Phase 46 transitioned; PROJECT.md + ROADMAP.md evolved

Progress:
- Phase 46: [██████████] 100% (2 of 2 plans complete)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop 46-02 closed — Phase 46 complete]
```

## Accumulated Context

### Decisions
| Decision | Phase | Impact |
|----------|-------|--------|
| Mount PWAUpdateBanner di wrapper div utama Layout (bukan Content Area) | Phase 28 | Banner fixed-bottom tidak terpotong overflow-hidden |
| Backend enforce mitra filter (orders + ledgers API) | Phase 29 | Data isolation reliable — tidak bisa di-bypass dari frontend |
| Role + ownership check di orders/requests API | Phase 33 | Mitra tidak bisa akses/modifikasi order mitra lain; hanya admin/staff approve requests |
| AuthRequest type di route handlers yang akses req.user | Phase 29 | Konsisten dengan priorities.ts; fix TS type error |
| Submit cancel/return → pending ActionRequest (bukan eksekusi langsung) | Phase 34 | Approval workflow — backend eksekusi hanya saat admin/staff approve |
| 'pending' ditambah ke RequestStatus union | Phase 34 | Backend support 'pending' sejak 34-01 tapi frontend type belum ada |
| mitraId di-override dari JWT di POST /api/orders | Phase 38 | Prevent cross-mitra order creation; tidak trust body |
| Credit limit backend dari SUM(totalAmount) orders isBilled=false | Phase 38 | Konsisten dengan logika frontend; simpel tanpa query ledger |
| Upload limit 50MB + Vercel memory 1024MB | Phase 38 | File desain garmen sering >10MB |
| Filter status Reports selaras dengan STATUS_LABELS OrderDetail (duplicate accepted) | Phase 39 | Konsistensi label UI tanpa refactor ekstraksi shared constant (deferred) |
| Antrian Produksi exclude `packing` (dianggap sudah lepas dari antrian aktif) | Phase 40 | `packing` set `isBilled=true` — secara bisnis sudah masuk fase billing/kirim |
| Antrian Produksi include `waiting_confirmation` di kepala alur | Phase 40 | Operator perlu visibilitas pesanan yang belum di-confirm agar bisa dikejar approval |
| Label card AppQueue ringkas (Menunggu/Dikonfirmasi/Diproses/Sablon) | Phase 40 | Grid card kompak butuh label pendek; konteks berbeda dari dropdown/badge full |
| Nama mitra ditampilkan inline di `h1` OrderDetail (`{orderNumber} — {mitraName}`) | Phase 41 | Opsi inline (bukan baris baru) dipilih agar header tetap compact; em dash separator konsisten dengan konvensi tipografi UI |
| Fallback `orderMitra ? ` — ${name}` : ''` (tidak crash saat mitra dangling) | Phase 41 | Data mitraId adalah FK — seharusnya tidak dangling, tapi ternary check membuat kode robust terhadap edge case data anomali |
| Rekap Tagihan = tab baru di Laporan (bukan di tab Keuangan/Pesanan); hanya admin + mitra | Phase 42 | Filter dan PDF sendiri; tab lama tidak berubah; staff tidak melihat tab (seperti Keuangan) |
| Baris rekap dikelompokkan per `productId + priceSnapshot` | Phase 42 | Produk sama harga beda = baris terpisah; Qty × Harga = Total tiap baris; tanpa harga rata-rata |
| Periode rekap = tanggal ledger debit `source:'order'`; order `isBilled` tanpa ledger dilewati | Phase 42 | Selaras dengan filter tab Keuangan; total rekap = Σ debit order |
| Fitur baru berbentuk modul folder + `index.ts` public API, file kebab-case, named export, tanpa `any` | Phase 42 | Pola acuan modul baru (CLAUDE.md global); file lama tidak di-rename; tsconfig tetap non-strict |
| PDF rekap memakai `formatCurrency` 0 desimal | Phase 42 | Selaras tampilan layar; berbeda dari PDF lama (2 desimal) — lihat Deferred Issues |
| Rekap Produk (Produk + Qty, harga digabung) ditaruh di ATAS tabel rincian PDF; hanya PDF, tab di layar tidak berubah | Phase 43 | Pilihan user; PDF tetap memuat rincian per harga; tanpa mode ekspor tambahan |
| `productQty` dihitung di `buildBillingRecap` per `productId` (nama terbaru, urut A–Z), bukan di komponen PDF | Phase 43 | Satu sumber agregasi; Σ productQty = totalQty; teruji di Node |
| Rekap Produk tanpa kolom harga/total uang | Phase 43 | Fokus produk + qty; PDF punya TOTAL Qty |
| Filter status cetak DTF di Daftar Pesanan berbentuk chip satu baris (Semua DTF / Belum Cetak / Sudah Cetak / Tanpa DTF), bukan dropdown + bottom sheet kedua | Phase 44 | Kode filter status yang ada tidak disentuh; chip membungkus bila sempit (sejak Phase 45 hanya tampil di desktop) |
| Kategori DTF per pesanan: Belum Cetak = ada ≥1 item custom yang belum dicetak (dtfStatus 'belum_cetak', null, atau kosong; termasuk parsial); Sudah Cetak = semua item custom sudah dicetak; Tanpa DTF = tidak ada item custom | Phase 44 | Pilihan user; aturan sama persis dengan guard Press Sablon (`OrderDetail.tsx:100`); sumber kebenaran `items[].isCustomLogo`, bukan `order.hasCustomLogo` |
| Hitungan chip DTF = lingkup role + filter status terpilih, tanpa pencarian; hitungan opsi filter status tidak memperhitungkan filter DTF | Phase 44 | Belum + Sudah + Tanpa = Semua DTF; selaras dengan hitungan status yang juga tidak memperhitungkan pencarian |
| Klasifikasi/penyaringan/penghitungan DTF di fungsi murni modul `src/components/orders/dtf-filter/` (hanya `import type`); state filter tetap di `OrdersList.tsx` | Phase 44 | Pola modul Phase 42 dipakai ulang untuk fitur filter; teruji 10 kasus di Node tanpa test runner |
| Chip filter DTF hanya tampil di desktop (md / 768px ke atas), disembunyikan di mobile lewat wrapper `hidden md:block` di `OrdersList.tsx` | Phase 45 | Permintaan user; menggantikan "layout sama untuk mobile dan desktop" dari keputusan Phase 44; keputusan breakpoint tetap di halaman, bukan di komponen modul |
| Phase 46 dipecah 2 plan: 46-01 fondasi modul `mitra-export` + PDF Daftar Mitra, 46-02 PDF per mitra dari panel Detail Info Mitra (isi = sama dengan panel, 1 halaman, tanpa daftar transaksi) | Phase 46 | Pilihan user; 46-02 memakai modul `mitra-export` |
| `calculateMitraStats` (rumus lama tak berubah) = satu sumber angka layar + PDF Manajemen Mitra; `getMitraStats` jadi pembungkus tipis | Phase 46 | Angka PDF identik layar; teruji terhadap rumus lama pada data acak; semantik "Total Penjualan" (draft/returned ikut) tidak berubah |
| PDF Daftar Mitra mirror layar: semua mitra (aktif + arsip), urut A–Z, kolom "Jumlah Pesanan", limit kosong = "Unlimited", HP ikut, catatan kaki definisi | Phase 46 | Default dari DISCOVERY; urutan layar tetap mengikuti urutan API |
| Library PDF di halaman eager: hanya `mitra-list-pdf.tsx` yang meng-import `@react-pdf/renderer` (+ `createMitraListPdfBlob`), ekspor memuatnya lewat `import()`, barrel tidak mengekspor komponen PDF, jalur eager bebas `date-fns` (`formatFileDate`) | Phase 46 | Entry +1,8 kB dan `vendor-pdf` identik baseline; benar sebelum maupun sesudah Phase 47 |
| Karakter di luar WinAnsi dibuang (`toPdfSafeText`), nama kosong → "-"; bukan font Unicode/CDN emoji | Phase 46 | Aman offline tanpa bobot font; Helvetica bawaan mencetak emoji/CJK sebagai karakter acak |
| Tombol "Cetak PDF" di `page-header` Mitras (`btn-primary`, ikon Download, `ml-auto`); hook ekspor dipanggil sebelum gate admin | Phase 46 | Konsisten dengan Laporan; tidak mengulang pelanggaran aturan hooks di `OrdersList.tsx` |
| `buildMitraDetail` hanya memetakan `stats` yang sama dengan panel (tanpa hitung ulang); PDF per mitra memakai limit tersimpan, judul "Detail Info Mitra", label "Jumlah Pesanan" | Phase 46 | Angka PDF = angka panel; limit yang baru diketik tetapi belum disimpan tidak ikut tercetak |
| Tombol Cetak PDF per mitra di Tindakan panel (baris penuh di atas Hapus Mitra, hanya mode lihat); satu `isExporting` + penjaga `useRef` dibagi dengan tombol header lewat `runExport` bersama; nama berkas `Mitra_<NAMA_AMAN>_<tanggal>.pdf` | Phase 46 | Dua ekspor saling mengunci; nama berkas aman untuk aksen/emoji/CJK |

### Git State
Last commit: b957c80 — feat(45): orders list - sembunyikan chip filter DTF di mobile
Branch: main
Feature branches merged: none

### Blockers/Concerns
- Phase 47 (chunk PDF lazy) ada di branch `claude/charming-clarke-4d6351` (belum di-push/digabung; verifikasinya di 47-01-SUMMARY pada branch itu). Phase 46 kini ter-commit di `main`, jadi saat digabung `.paul/ROADMAP.md`, `STATE.md`, `PROJECT.md`, `paul.toml`, dan `ledger.toml` akan bentrok ringan — selesaikan manual. Kodenya (`vite.config.ts`) tidak bentrok dengan modul `mitra-export`.

### Deferred Issues
- Extract `STATUS_LABELS` ke `src/lib/order-status.ts` sebagai shared constant (saat ini duplicate di OrderDetail.tsx + OrderSPKPDF.tsx + Reports.tsx).
- Evaluasi apakah `cancelled`/`returned` harus exclude dari kalkulasi `totalQty`/`totalSubtotal`/chart di tab Pesanan (saat ini ikut, sedangkan tab Keuangan exclude `cancellation`/`return`).
- Seragamkan format mata uang PDF: `FinanceReportPDF`/`OrderReportPDF` memakai `formatCur` 2 desimal ("Rp 1.800.000,00"), `BillingRecapPDF` memakai `formatCurrency` 0 desimal.
- Kolom `real` (float4) pada `totalAmount`/`priceSnapshot`/`ledgers.nominal` kehilangan presisi integer di atas ±Rp 16,7 jt — pertimbangkan `numeric`/`bigint`; belum ada selisih yang dilaporkan.
- Badge "DTF" lama di `OrdersList.tsx` menyala bila ≥1 item `sudah_cetak`, sehingga pesanan parsial menampilkan badge "DTF" sekaligus masuk filter "Belum Cetak" — pertimbangkan menyelaraskan badge dengan kategori `getOrderDtfCategory`.
- `OrdersList.tsx` memanggil `React.useEffect` setelah `if (!user) return null` (pelanggaran aturan hooks yang sudah ada sebelum Phase 44) — pindahkan hook ke atas early return.
- Hitungan opsi filter status di `OrdersList.tsx` belum memperhitungkan filter DTF: memilih "Belum Cetak" lalu status "Press Sablon" bisa menghasilkan 0 walau opsi menampilkan angka > 0 (chip DTF menunjukkan alasannya).
- Filter DTF yang sedang aktif tetap menyaring daftar bila jendela desktop dipersempit di bawah 768px (chip tersembunyi, tidak ada kontrol untuk melepasnya sampai halaman dimuat ulang atau jendela dilebarkan) — pertimbangkan reset ke 'all' saat viewport mobile (matchMedia).
- Ekstrak helper unduh Blob bersama: `Reports.tsx` (`handleExport`) menyalin pola anchor + `createObjectURL` secara inline dan langsung `revokeObjectURL`; `mitra-export/download-blob.ts` sudah memakai jeda 1 detik (Phase 46).
- Batasan WinAnsi pada PDF lama: teks bebas (SPK `designNotes`, nama produk/mitra) berisi emoji/CJK tercetak sebagai karakter acak — pertimbangkan membagikan `toPdfSafeText` (modul `mitra-export`) ke `OrderSPKPDF` dan PDF lain.
- "Total Penjualan" di Manajemen Mitra dan PDF Daftar Mitra (`calculateMitraStats`) ikut menghitung draft dan returned (hanya `cancelled` dikeluarkan) — terkait item evaluasi `cancelled`/`returned` di atas.
- Urutan baris layar Manajemen Mitra mengikuti urutan API (query tanpa `ORDER BY`), sedangkan PDF Daftar Mitra urut A–Z — pertimbangkan menyamakan.
- `MitraDetailPanel` di `Mitras.tsx` memakai `mitraUser?: any` (sudah ada sebelum Phase 46) — ganti dengan tipe `SafeUser`.

## Session Continuity

Last session: 2026-10-23
Stopped at: Phase 46 transition complete — committed ke git
Next action: /paul:discuss atau /paul:plan untuk phase baru, atau selesai
Resume file: .paul/phases/46-mitras-pdf-export/46-02-PLAN.md

---
*STATE.md — Updated after every significant action*
