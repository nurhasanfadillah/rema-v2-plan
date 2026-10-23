---
phase: 46-mitras-pdf-export
topic: Ekspor PDF di halaman Manajemen Mitra (/mitras): daftar mitra + PDF per mitra
depth: standard
confidence: HIGH
created: 2026-10-23
---

# Discovery: Ekspor PDF di Halaman Mitra

**Recommendation:** Pakai kembali `@react-pdf/renderer` (sudah terpasang, dipakai 5 komponen PDF). Modul baru `mitra-export` menghasilkan PDF "Daftar Mitra" dari data yang sudah dimuat halaman `/mitras`, dipicu tombol "Cetak PDF" di header halaman. Library PDF dimuat lewat `import()` saat tombol diklik. Atas keputusan user (2026-10-23), panel "Detail Info Mitra" juga mendapat tombol "Cetak PDF" untuk satu mitra, memakai modul, fungsi hitung, dan helper yang sama. Tanpa dependency baru, tanpa perubahan backend atau skema.

**Confidence:** HIGH untuk pendekatan teknis — library sudah berjalan di produksi, API dikonfirmasi docs resmi, dan render nyata + build baseline sudah diuji (uji render memakai tata letak Daftar Mitra; PDF per mitra memakai pola yang sama tetapi belum diuji terpisah). Lingkup sudah diputuskan user pada 2026-10-23: Daftar Mitra **dan** PDF per mitra dengan isi sama seperti panel, dipecah menjadi plan 46-01 (Daftar Mitra) dan 46-02 (PDF per mitra) — lihat "Tambahan lingkup".

## Objective

Yang perlu dipahami sebelum planning:
- Library/pendekatan PDF apa yang tepat — pakai ulang yang ada atau tambah dependency?
- Apa yang diekspor, dari mana datanya, dan siapa yang boleh mengekspor?
- Apa dampaknya ke bundle (halaman `Mitras` di-import eager, bukan lazy)?
- Apa risiko render: lebar kolom, multi-halaman, karakter non-Latin, performa?

## Scope

**Include:**
- `src/pages/Mitras.tsx` (data, statistik, header, role gate) beserta route/navigasinya
- Infrastruktur PDF yang ada: 5 komponen react-pdf, pola ekspor di `Reports.tsx`, konfigurasi chunk di `vite.config.ts`
- API baca (`mitras`, `users`, `orders`, `ledgers`) yang sudah dipakai halaman
- Uji render nyata (spike) dan build baseline
- Panel `MitraDetailPanel` (bagian Tindakan, data `stats`/`mitraUser`) untuk PDF per mitra — lingkup tambahan dari user

**Exclude:**
- Statement piutang / daftar transaksi per mitra (user memilih isi PDF per mitra = sama dengan panel)
- Perubahan backend, skema DB, atau definisi "Total Penjualan"
- Upgrade `@react-pdf/renderer`, font Unicode, ekspor Excel/CSV

---

## Findings

### Temuan Kode (diverifikasi langsung dari repo)

| # | Fakta | Lokasi |
|---|-------|--------|
| 1 | Halaman hanya untuk admin (gate di klien); nav `/mitras` hanya `roles: ['admin']`. Tombol ekspor otomatis admin-only | `Mitras.tsx:37`, `Layout.tsx:93` |
| 2 | Empat panggilan API sekali saat mount (mitras, users, orders, ledgers). Admin menerima **semua** order (termasuk draft) dan semua ledger | `Mitras.tsx:23-35`, `orders.ts:16-44`, `ledgers.ts:10-29` |
| 3 | Statistik dihitung inline: `totalOrders` & `totalSales` = pesanan berstatus ≠ `cancelled` (draft & returned ikut terhitung); `saldoPiutang` = Σ debit − Σ kredit seluruh ledger mitra | `Mitras.tsx:39-48` |
| 4 | Tidak ada filter/pencarian/paginasi: layar = semua mitra (arsip diredupkan). Urutan = urutan API (query tanpa `ORDER BY`) | `Mitras.tsx:151-272`, `mitras.ts:10-17` |
| 5 | Header halaman hanya berisi judul. `.page-header` = `flex items-center justify-between gap-4 flex-wrap` | `Mitras.tsx:144-149`, `index.css:423` |
| 6 | Pola ekspor yang sudah ada: `pdf()` → `toBlob()` → anchor `download` → `revokeObjectURL`; spinner `isExporting`, gagal → pesan error | `Reports.tsx:152-184` |
| 7 | 5 komponen PDF memakai react-pdf + `Helvetica` bawaan. Tidak ada `Font.register`, tidak ada `<Image>` (logo mitra tidak pernah masuk PDF mana pun) | grep `src/` |
| 8 | `Mitras` di-import **eager**; 8 halaman lain lazy (`OrderDetail`, `AppQueue`, `Finance`, `CancellationsReturns`, `Reports`, `AuditLogs`, `OrderPriorities`, `Calculator`) | `App.tsx:16-28` |
| 9 | `@react-pdf/renderer` `^4.5.1` (terpasang 4.5.1; registry terbaru 4.9.0, peer React `^19` termasuk) | `package.json`, registry |
| 10 | `getMitraStats` adalah logika inline di komponen (melanggar aturan "tanpa logika kompleks inline"); perlu diekstrak agar layar dan PDF memakai satu sumber angka | `Mitras.tsx:39-48` |

### Option A: Pakai ulang `@react-pdf/renderer` (sudah ada)

**Source:** `package.json`, `Reports.tsx:152-184`, https://react-pdf.org/advanced, https://react-pdf.org/fonts, https://react-pdf.org/hooks

**Summary:** Buat komponen `<Document>` baru bergaya sama dengan `billing-recap-pdf.tsx`; hasilkan blob lewat `pdf(element).toBlob()` (API terdokumentasi di docs resmi) lalu unduh.

**Pros:**
- Tanpa dependency baru; pola `pdf().toBlob()` sudah berjalan di produksi
- Gaya (A4, Helvetica, tabel sel berborder, kartu ringkasan) bisa disalin dari PDF Rekap Tagihan
- `fixed` (header berulang), `render` (nomor halaman), `wrap={false}` terbukti berfungsi (lihat Hasil Uji)
- Konsisten dengan 5 PDF lain, jadi perawatan satu gaya

**Cons:**
- Tidak ada komponen tabel bawaan (susun `View`/`Text` manual)
- Render di main thread (asumsi, belum diverifikasi): 300 baris ≈ 8 detik di Node
- Font standar hanya WinAnsi: emoji/CJK tercetak rusak (teruji); emoji butuh sumber gambar via CDN saat render (docs `registerEmojiSource`)

**For our use case:** Cocok. Daftar mitra puluhan baris, 7 kolom, 1–3 halaman.

### Option B: jsPDF + jspdf-autotable

**Source:** https://github.com/parallax/jsPDF (README); registry: `jspdf` 4.2.1 (2026-03-17), `jspdf-autotable` 5.0.9 (2026-10-15)

**Summary:** API imperatif; tabel lewat plugin autotable.

**Pros:**
- Tabel siap pakai lewat plugin; library matang dan masih dirawat (README: co-maintained by yWorks)

**Cons:**
- Dua dependency baru dan gaya kode berbeda dari 5 PDF yang ada
- README: standard fonts "limited to the ASCII-codepage"; Unicode butuh file TTF kustom, glyph yang hilang menghasilkan output rusak — tidak lebih baik dari Option A untuk emoji
- Kemampuan autotable tidak dibaca dari sumber dan tidak diuji

**For our use case:** Tidak ada keunggulan yang menutup biaya inkonsistensi.

### Option C: pdfmake

**Source:** https://pdfmake.github.io/docs/0.3/getting-started/client-side/; registry: `pdfmake` 0.3.12 (2026-10-17)

**Summary:** Dokumen deklaratif (objek JS). Di browser memuat `pdfmake.min.js` + `vfs_fonts.js` (berisi Roboto).

**Pros:**
- Model dokumen deklaratif dengan tabel bawaan (tidak diuji); font Roboto bawaan

**Cons:**
- Dependency baru + berkas font ikut bundle; model berbeda dari React
- Dukungan Unicode/emoji tidak dinyatakan di halaman docs yang dibaca

**For our use case:** Sama seperti Option B.

### Option D: Rasterisasi DOM (html2canvas + jsPDF) atau `window.print()`

**Source:** registry: `html2canvas` 1.4.1 rilis terakhir 2022-01-22; jsPDF README (metode `html` bergantung pada html2canvas)

**Cons:**
- Halaman bertema gelap (slate-950 + `white/5`) → PDF gelap, atau perlu DOM cetak terpisah
- Teks menjadi gambar (tidak bisa diseleksi, file besar, buram); `window.print()` butuh CSS print, dialognya berbeda di mobile/PWA, dan tidak menghasilkan file seperti tombol "Cetak PDF" lain

**For our use case:** Ditolak.

*PDF di server (mis. headless browser) tidak dievaluasi mendalam: berlebihan untuk daftar sederhana dan butuh infrastruktur serverless tambahan.*

### Hasil Uji Teknis (spike render nyata)

Spike sementara di `node_modules/.cache` (git-ignored, **sudah dihapus**; git bersih). `@react-pdf/renderer` 4.5.1, Node v25.6.0; hasil dilihat langsung di viewer PDF browser pane.

| Uji | Hasil |
|-----|-------|
| 8 kasus nama (normal, 70 karakter multi-kata, 76 karakter satu kata, emoji, CJK, aksen + em dash + `·` + `×`, `"` `&` `<tag>`, kosong) | Semua render **tanpa error** (±5 KB/dokumen) |
| Teks Latin-1 (`Café Ñandú — Outlet · Pusat × 2`) | Tercetak benar |
| Emoji `😀` dan CJK `日本商店` | **Tercetak rusak** (karakter acak, tanpa crash) — Helvetica WinAnsi |
| Kata sangat panjang | Dipotong otomatis dengan tanda hubung (`…EXPIALI-/DOCIOUS…`, `am-/persand`); tidak ada overflow |
| A4 portrait, 7 kolom (6/28/17/8/17/16/8 %) | Muat; `Rp 1.234.567.890` dan ringkasan `Rp 21.100.225.230` tidak terpotong; negatif tampil `-Rp 1.500.000` |
| Header tabel `fixed` | Berulang di halaman 2 dan 3 tanpa menimpa baris pertama; footer `Halaman X / 3` benar |
| 49 baris | 3 halaman, 20,4 KB (header `fixed`) vs 18,3 KB (biasa); ±1,2 s |
| Skala (Node, bukan browser) | 10 baris 0,36 s · 100 baris 2,0 s (5 hal.) · 300 baris 8,2 s (12 hal., 83 KB) |

### Temuan Sampingan: `vendor-pdf` dimuat saat startup (bukan bagian fitur ini)

Build baseline (`vite build` ke direktori scratch, dihapus setelahnya):

- `index.html` memuat `<link rel="modulepreload">` ke `vendor-pdf-*.js` dan entry chunk diawali `import{j as o}from"./vendor-pdf-*.js"` → chunk **1.466,87 kB (gzip 492,16 kB)** dimuat untuk semua pengguna di semua halaman, termasuk Login. Semua chunk halaman juga meng-import dari chunk itu.
- Dugaan penyebab (inferensi): `manualChunks: { 'vendor-pdf': ['@react-pdf/renderer'] }` (`vite.config.ts:59`) ikut membawa modul bersama (kemungkinan runtime JSX/React) ke chunk tersebut, sehingga entry bergantung padanya. Tujuan Phase 32 ("vendor-pdf terisolasi") hanya tercapai sebagai file terpisah, bukan sebagai lazy load.
- Uji perbaikan (config salinan tanpa entri `vendor-pdf`): hasil `react-pdf.browser-*.js` 1.466,17 kB (gzip 491,85 kB) **tidak di-preload dan tidak di-import statis oleh entry**; entry hanya +0,68 kB (557,79 → 558,47 kB; gzip 163,83 → 164,02 kB). Precache PWA praktis tidak berubah (31 entri; 2.797,27 → 2.796,97 KiB).
- Implikasi untuk fitur ini: hari ini import statis dari `Mitras.tsx` hanya menambah kode komponen PDF yang kecil ke entry. Tetapi bila chunking diperbaiki, import statis dari halaman eager akan menarik 492 kB gzip itu kembali ke startup. **`import()` dinamis saat klik benar di kedua kondisi**, sehingga fitur ini dan perbaikan chunking independen satu sama lain.

## Comparison

| Kriteria | A: react-pdf (ada) | B: jsPDF + autotable | C: pdfmake | D: raster/print |
|----------|--------------------|----------------------|------------|-----------------|
| Dependency baru | Tidak | 2 paket | 1 paket + font | html2canvas (rilis terakhir 2022) / tidak |
| Konsistensi dengan 5 PDF ada | Penuh | Rendah | Rendah | Rendah |
| Tabel multi-halaman (header berulang, no. halaman) | Teruji | Tidak diuji | Tidak diuji | Buruk |
| Emoji/CJK | Rusak (teruji); butuh CDN/font | Rusak (README); butuh TTF | Tidak dinyatakan | Mengikuti browser (raster) |
| Terbukti di produksi proyek ini | Ya (`Reports.tsx`) | Tidak | Tidak | Tidak |
| Risiko | Rendah | Sedang | Sedang | Tinggi |

## Recommendation

**Choose: Option A — `@react-pdf/renderer` (pakai ulang)**

**Rationale:** Satu-satunya opsi tanpa biaya dependensi baru dan sudah terbukti di produksi proyek ini; semua kebutuhan layout (A4, 7 kolom, multi-halaman, header berulang, nomor halaman) terverifikasi lewat render nyata. Opsi lain tidak menyelesaikan masalah emoji/CJK dengan lebih baik dan menambah pola PDF kedua.

### Rancangan awal (disempurnakan saat `/paul:plan`)

**1. Modul baru** `src/components/mitras/mitra-export/` (pola Phase 42: folder + `index.ts`, kebab-case, named export, tanpa `any`):

| File | Isi |
|------|-----|
| `mitra-export-types.ts` | `MitraSummaryRow`, `MitraSummary` (baris + total + hitungan aktif/arsip) |
| `calculate-mitra-stats.ts` | Fungsi murni `calculateMitraStats` — dipindah dari `getMitraStats` agar layar dan PDF satu sumber |
| `build-mitra-summary.ts` | `buildMitraSummary({ mitras, users, orders, ledgers })` → baris urut A–Z + total |
| `to-pdf-safe-text.ts` | Buang karakter di luar WinAnsi (emoji/CJK) agar tidak tercetak rusak |
| `mitra-list-pdf.tsx` | `<Document>` A4 portrait: header, ringkasan, tabel 7 kolom, header tabel `fixed`, footer "Halaman X / Y", catatan definisi |
| `export-mitra-list-pdf.ts` | `exportMitraListPdf(summary)`: `import()` dinamis `@react-pdf/renderer` + `mitra-list-pdf` → `pdf(el).toBlob()` → unduh `Daftar_Mitra_YYYY-MM-DD.pdf` |
| `index.ts` | Public API — hanya ekspor yang aman-eager (builder, tipe, `exportMitraListPdf`); komponen PDF **tidak** di-re-export statis |

**2. Perubahan file lama:** hanya `src/pages/Mitras.tsx` — tombol "Cetak PDF" di `page-header` (`btn-primary`, ikon Download, `ml-auto` agar rata kanan saat membungkus di mobile), handler + state `isExporting` (hook diletakkan **sebelum** early return baris 37), dan `getMitraStats` memanggil fungsi murni modul. Tanpa perubahan API, skema, routing, atau dependency.

**3. Isi PDF:** judul "Laporan Daftar Mitra", cap "Dicetak: …", ringkasan (Total Mitra, Total Penjualan, Total Pesanan, Total Saldo Piutang), tabel No · Mitra (nama + HP) · Total Penjualan · Jumlah Pesanan · Saldo Piutang · Limit Kredit · Status, baris TOTAL, catatan kaki definisi.

**4. Kriteria penerimaan yang diusulkan:**
- AC-1: Admin melihat tombol "Cetak PDF" di `/mitras`; klik mengunduh `Daftar_Mitra_<tanggal>.pdf` berisi semua mitra
- AC-2: Angka di PDF identik dengan layar (Total Penjualan, Pesanan, Saldo Piutang, Limit, Status) — satu fungsi hitung untuk keduanya
- AC-3: Lebih dari satu halaman: header tabel berulang, baris tidak terpotong, nomor halaman benar
- AC-4: Nama berisi emoji/CJK tidak menghasilkan karakter rusak
- AC-5: Tombol nonaktif + indikator selama proses; gagal → toast error
- AC-6: `npm run lint` lulus; `import()` dinamis memastikan library PDF tidak di-import statis dari `Mitras.tsx`; layar tidak berubah selain tombol
- AC-7 (lingkup tambahan, plan 46-02): panel "Detail Info Mitra" punya tombol "Cetak PDF" yang mengunduh PDF mitra tersebut; angka identik dengan panel (Total Penjualan, Pesanan, Saldo Piutang, Limit)
- Verifikasi tanpa test runner (pola Phase 42–43): fungsi murni diuji di Node, isi PDF lewat inspeksi pohon elemen + render nyata

**Caveats:**
- Angka PDF mewarisi semantik layar: "Total Penjualan" ikut menghitung draft & returned (hanya `cancelled` dikeluarkan) dan kolom `real` (float4) kehilangan presisi di atas ±Rp 16,7 jt per nilai (Deferred Issues yang sudah ada)
- Waktu render naik linear dengan jumlah baris; di atas ±200 mitra bisa terasa lama (≈8 s untuk 300 baris di Node)
- `Mitras.tsx` memakai hook sebelum early return; hook baru harus mengikuti pola itu (jangan mengulang pelanggaran di `OrdersList.tsx`)

### Tambahan lingkup: PDF per mitra (keputusan user 2026-10-23)

**Keputusan:** selain Daftar Mitra, panel "Detail Info Mitra" mendapat tombol "Cetak PDF" untuk satu mitra. Isi = sama dengan panel: profil (nama, status), penanggung jawab + HP, limit kredit, Total Penjualan, Jumlah Pesanan, Saldo Piutang; 1 halaman; tanpa daftar transaksi. Dipecah menjadi plan 46-01 (fondasi + Daftar Mitra) dan 46-02 (PDF per mitra) agar tiap plan ≤3 task.

**Implikasi (dari temuan kode):**
- Semua data sudah ada: `MitraDetailPanel` menerima `mitra`, `mitraUser`, dan `stats` → tanpa API baru dan tanpa perhitungan baru (memakai `calculateMitraStats` yang sama)
- Tombol di bagian "Tindakan" panel (grid 2 kolom: Edit Profil / Batasi Akses / Hapus Mitra) → perlu keputusan tata letak (mis. baris penuh di atas "Hapus Mitra"); hanya tampil pada mode lihat, bukan mode edit
- Dipakai ulang dari 46-01: `toPdfSafeText`, helper unduh, gaya PDF, hook ekspor (ditambah ekspor satu mitra), pola `import()` dinamis
- Tidak menduplikasi laporan lain: Laporan › Keuangan sudah mengekspor mutasi ledger per mitra; PDF ini sengaja hanya kartu info + ringkasan, bukan statement
- Panel adalah overlay `fixed` dengan animasi (`AnimatePresence`): tombol harus `type="button"`, tidak menutup panel, dan memakai `isExporting` yang sama dengan tombol header agar tidak ada dua ekspor paralel

## Open Questions

| # | Pertanyaan | Default yang direkomendasikan | Impact |
|---|-----------|-------------------------------|--------|
| 1 | ~~Lingkup: hanya "Daftar Mitra", atau juga PDF per mitra?~~ **Diputuskan user (2026-10-23):** Daftar Mitra **dan** PDF per mitra dari panel "Detail Info Mitra"; isi PDF per mitra = sama dengan panel (1 halaman, tanpa daftar transaksi) | — (selesai) | resolved |
| 2 | "Total Penjualan": ikuti layar (draft & returned ikut) + catatan kaki, atau koreksi definisi dulu? | Ikuti layar + catatan kaki; koreksi masuk Deferred Issues yang sudah ada | medium |
| 3 | Label kolom "Volume" di layar sebenarnya jumlah pesanan non-batal (tertulis "items"), bukan jumlah pcs. Beri label "Jumlah Pesanan" di PDF? | Ya | low |
| 4 | Urutan baris: A–Z nama, atau Saldo Piutang terbesar dulu? | A–Z (deterministik; layar memakai urutan API tanpa `ORDER BY`) | low |
| 5 | Sertakan nomor HP penanggung jawab (data pribadi) di PDF? | Ya, sama seperti layar (admin-only) | low |
| 6 | Mitra arsip ikut dicetak? | Ya, dengan status "Arsip" (layar menampilkan semua) | low |
| 7 | Emoji/CJK pada nama: buang karakter tak didukung, atau daftarkan font Unicode / sumber emoji CDN? | Buang (aman offline, tanpa bobot font); CDN butuh jaringan saat render | low |
| 8 | Data dari state saat halaman dibuka (paritas `Reports`), atau muat ulang saat klik? | State yang ada + cap "Dicetak: tanggal-jam" | low |
| 9 | Catat audit log saat ekspor? Label tombol "Cetak PDF" (konsisten Reports/Phase 12) atau "Ekspor PDF"? | Tanpa audit log (paritas Reports); "Cetak PDF" | low |

## Temuan Sampingan → usulan Deferred Issues

- **`vendor-pdf` dimuat saat startup** (492 kB gzip di jalur kritis semua pengguna): hapus entri `'vendor-pdf'` dari `manualChunks` di `vite.config.ts` — terukur di build uji, belum diuji di browser/Lighthouse. Phase tersendiri; independen dari fitur ini.
- **Batasan Latin-1 juga berlaku di PDF lain** (SPK memuat `designNotes` teks bebas; nama produk/mitra di semua PDF). Setelah `to-pdf-safe-text` ada, pertimbangkan membagikannya ke PDF lama.

## Quality Report

**Sources consulted:**
- Repo (dibaca 2026-10-23): `Mitras.tsx`, `App.tsx`, `Reports.tsx`, `billing-recap/*`, `FinanceReportPDF.tsx`, `vite.config.ts`, `index.css`, `src/lib/api.ts`, `src/api/routes/{orders,ledgers,mitras}.ts`, `package.json`, `.paul/STATE.md`, `.paul/ROADMAP.md`
- https://react-pdf.org/advanced — `pdf().toBlob()`, `fixed`, `render` (`pageNumber`/`totalPages`), `wrap={false}` (via Context7, docs resmi, tanpa tanggal terbit)
- https://react-pdf.org/fonts — `Font.register`, `Font.registerEmojiSource` (butuh jaringan saat render)
- https://react-pdf.org/hooks — `usePDF`
- https://github.com/parallax/jsPDF (README, dibaca 2026-10-23)
- https://pdfmake.github.io/docs/0.3/getting-started/client-side/ (dibaca 2026-10-23)
- npm registry (query 2026-10-23): `@react-pdf/renderer` 4.9.0 (2026-08-27), `jspdf` 4.2.1 (2026-03-17), `jspdf-autotable` 5.0.9 (2026-10-15), `pdfmake` 0.3.12 (2026-10-17), `html2canvas` 1.4.1 (2022-01-22); peer deps react-pdf: React `^16.8 … ^19`

**Verification:**
- API `pdf().toBlob()` / `fixed` / `render` / `wrap`: docs resmi **dan** dipakai di produksi (`Reports.tsx`) **dan** diuji di spike
- Tata letak, multi-halaman, hyphenation, emoji/CJK rusak: render nyata + pemeriksaan visual halaman 1–3
- Admin menerima semua order/ledger; "Total Penjualan" ikut draft/returned: dibaca langsung di `orders.ts`, `ledgers.ts`, `Mitras.tsx`
- `vendor-pdf` dimuat saat startup + efek perbaikan: dua build produksi ke direktori scratch (modulepreload, import statement entry, ukuran chunk)

**Assumptions (not verified):**
- react-pdf di browser merender di main thread (UI bisa terasa beku untuk daftar besar); docs belum diperiksa, waktu render diukur di Node, bukan browser/perangkat mobile
- Perilaku `a[download]` + blob URL di PWA standalone iOS tidak diuji (paritas dengan `Reports`)
- Jumlah mitra produksi diasumsikan puluhan (<100)
- Penyebab `vendor-pdf` eager (runtime JSX di dalam chunk) adalah inferensi dari bukti import/preload; perbaikannya hanya diverifikasi lewat build
- Kemampuan tabel jsPDF-autotable/pdfmake dan opsi PDF server-side tidak diuji (tidak menentukan keputusan)
- PDF per mitra (plan 46-02): tata letak kartu 1 halaman belum diuji; angka waktu render dari spike hanya indikatif karena memakai tata letak Daftar Mitra

---
*Discovery completed: 2026-10-23*
*Confidence: HIGH (teknis); lingkup menunggu konfirmasi*
*Ready for: /paul:plan 46*
