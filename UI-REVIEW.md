# UI Audit — Halaman Detail Pesanan

**Target:** `src/pages/orders/OrderDetail.tsx`
**Date:** 2026-06-06
**Baseline:** Abstract 6-pillar standards (tidak ada UI-SPEC.md)
**Screenshots:** Tidak diambil — dev server tidak berjalan (port 3000 & 5173 offline)

---

## Score Summary

| Pillar | Score | Rating |
|--------|-------|--------|
| Copywriting | 2/4 | Perlu Perbaikan |
| Visuals | 3/4 | Baik |
| Color | 2/4 | Perlu Perbaikan |
| Typography | 2/4 | Perlu Perbaikan |
| Spacing | 3/4 | Baik |
| Experience Design | 2/4 | Perlu Perbaikan |

**Overall Score: 14/24**

---

## Findings

### 1. Copywriting (2/4)

**BLOCKER — String bahasa Inggris "Processing..." di tiga tombol aksi kritis**

Tiga lokasi memakai string fallback bahasa Inggris yang tidak konsisten dengan UI berbahasa Indonesia:

- Baris 554: `{loading ? 'Processing...' : 'Cetak SPK'}` — tombol cetak SPK
- Baris 568: `{loading ? 'Processing...' : 'Resi Offline'}` — tombol resi offline
- Baris 603: `{statusUpdating ? 'Processing...' : STATUS_LABELS[normalNext]}` — tombol advance status

Ketika PDF sedang dirender atau status sedang diperbarui, pengguna melihat "Processing..." alih-alih teks Bahasa Indonesia seperti "Memproses..." atau "Memuat PDF...".

**WARNING — Label-label field menggunakan uppercase tracking-widest dengan ukuran 9px yang tidak terbaca**

Label field seperti "Nama Penerima:", "Telepon:", "Alamat:", "Jumlah Item:", "Tagihan Total" semuanya memakai `text-[9px] font-bold uppercase tracking-widest`. Ukuran 9px berada di bawah threshold keterbacaan (minimum 11px untuk label). Ini berlaku konsisten di seluruh kartu Informasi Pengiriman dan Rincian Tagihan (baris 349, 354, 366, 370, 374, 392, 399).

**WARNING — Pesan error "Akses Ditolak" yang terlalu singkat**

- Baris 74: `"Akses Ditolak"` — tanpa konteks atau instruksi tindak lanjut
- Baris 80: `"Akses Ditolak: Pesanan draft hanya dapat diakses oleh pembuat pesanan."` — lebih baik, tetapi tidak konsisten dengan baris 74

Pesan baris 74 tidak memberi tahu pengguna mengapa akses ditolak atau apa yang harus dilakukan.

**WARNING — Pesan loading "Memuat data..." tidak informatif**

Baris 65: `"Memuat data..."` — tidak menjelaskan data apa yang dimuat. Seharusnya "Memuat detail pesanan..." untuk konteks yang lebih jelas.

**WARNING — Label "Resi Offline" pada tombol PDF ambigu**

Baris 568-569: Tombol PDF label resi offline hanya menampilkan "Resi Offline" tanpa kata kerja (cetak/download). Bandingkan dengan "Cetak SPK" yang memiliki kata kerja jelas. Seharusnya "Cetak Label Resi" untuk konsistensi.

**INFO — Label item qty menggunakan "items" (Inggris)**

Baris 426: `{item.qty} items` — seharusnya `{item.qty} pcs` atau `{item.qty} item` konsisten dengan label lain di halaman yang menggunakan "pcs".

---

### 2. Visuals (3/4)

**WARNING — Tombol kembali (ArrowLeft) tidak punya aria-label**

Baris 314-319: Tombol `w-10 h-10` dengan hanya ikon `ArrowLeft` tanpa `aria-label` atau `title`. Screen reader tidak dapat mengidentifikasi fungsi tombol ini.

**WARNING — Tombol "Hapus" tidak memiliki ikon**

Baris 583-589: Tombol hapus (`Hapus`) tidak memiliki ikon destruktif (misalnya Trash2 dari lucide-react) yang sudah diimpor tersedia. Semua tombol lain di panel aksi memiliki ikon pendamping (PrinterIcon, Truck, dll.) kecuali tombol hapus. Inkonsistensi visual.

**WARNING — Tidak ada indikator progress tahapan pesanan di halaman detail**

OrdersList.tsx (baris 181-196) memiliki `renderProgressBar` yang menampilkan progress bar 6 tahap berwarna. Halaman detail pesanan ini tidak memiliki visual progress yang setara. Pengguna melihat badge status isolasi tanpa konteks posisi dalam alur produksi.

**INFO — Animasi pulse pada dot badge status berlaku juga untuk status terminal (cancelled, shipped)**

Baris 293-295: `animate-pulse` diterapkan pada semua status termasuk `cancelled` dan `shipped` yang merupakan status final. Status terminal tidak perlu animasi pulse yang menyiratkan "sedang berproses".

**KEKUATAN — Lightbox, hover states, dan motion transitions diimplementasikan dengan baik**

Lightbox component, hover scale pada thumbnail gambar, dan slide-in dari bawah untuk menu koreksi mobile semuanya berfungsi dengan desain yang kohesif.

---

### 3. Color (2/4)

**BLOCKER — Inkonsistensi warna badge status antara OrderDetail dan OrdersList**

Dua halaman dalam modul pesanan yang sama menggunakan palet berbeda untuk status yang sama:

| Status | OrderDetail | OrdersList |
|--------|-------------|------------|
| `pressing` | `bg-rose-500` / `text-rose-300` | `bg-orange-500` / `text-orange-300` |
| `packing` | `bg-orange-500` / `text-orange-300` | `bg-cyan-500` / `text-cyan-300` |

Pengguna yang berpindah dari halaman list ke detail akan melihat warna badge berbeda untuk pesanan yang sama. Ini merusak konsistensi semantik warna.

Referensi: OrderDetail baris 285-286 vs OrdersList baris 152-153.

**WARNING — Warna hover pada total tagihan bersifat fungsional tetapi menyesatkan**

Baris 400: `group-hover:text-blue-400` pada nilai tagihan di dalam elemen non-interaktif (`div` bukan `button` atau `a`). Warna biru pada hover menyiratkan element bisa diklik padahal tidak ada aksi yang terjadi.

**WARNING — Kartu Rincian Tagihan hanya ditampilkan untuk role admin dan mitra (baris 383)**

Role `staff` yang merupakan internal tim yang sering memproses pesanan tidak dapat melihat informasi tagihan dan jumlah item. Ini adalah keputusan produk yang perlu dikonfirmasi — apakah disengaja?

**INFO — Penggunaan warna aksen biru tersebar namun masih dalam batas wajar**

Blue accent (`bg-blue-500`, `text-blue-400`) digunakan pada: progress bar aktif sidebar, badge online type, tombol ajukan draft, PDF link resi. Distribusi masih dalam toleransi — tidak melebihi 10 elemen unik.

---

### 4. Typography (2/4)

**BLOCKER — 11 ukuran font berbeda dalam satu halaman**

Audit mengidentifikasi ukuran font berikut aktif di OrderDetail:
`text-[9px]` (15 kali), `text-[10px]` (10 kali), `text-[11px]` (9 kali), `text-[12px]` (5 kali), `text-[13px]` (8 kali), `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`.

Total 11 ukuran berbeda, di mana 5 di antaranya adalah nilai arbitrary (`[9px]`–`[13px]`). Sistem tipografi yang terkontrol seharusnya menggunakan maksimal 4-5 ukuran. Keberadaan `text-[9px]` dan `text-xs` (yang setara ~12px) secara bersamaan menunjukkan tidak ada token tipografi yang terpusat.

**WARNING — 6 bobot font berbeda dalam satu halaman**

`font-medium`, `font-semibold`, `font-bold`, `font-extrabold`, `font-black`, `font-normal` semuanya hadir. `font-extrabold` dan `font-black` hanya digunakan masing-masing 2 kali (baris 600 dan 629) — nilainya tidak cukup signifikan untuk menjustifikasi variasi tambahan. Seharusnya dibatasi ke `font-medium`, `font-semibold`, `font-bold` maksimal.

**WARNING — Italic digunakan secara dekoratif tanpa makna semantik**

Class `italic` muncul di banyak tempat: label field (baris 354, 358, 435, 442, 460, 476, 486, 506, 523), nilai tagihan (baris 393, 399), dan tombol (baris 358). Italic tradisionalnya digunakan untuk penekanan semantik atau kutipan, bukan untuk styling dekoratif.

**INFO — Monospace digunakan tepat untuk nomor pesanan dan ID**

Baris 321-326: `font-mono` pada sub-judul tanggal dan `h1` nomor pesanan sudah benar dan konsisten dengan konvensi ID sistem.

---

### 5. Spacing (3/4)

**WARNING — Nilai arbitrary spacing untuk blur dan z-index**

Baris 520: `blur-[60px]` dan `w-32 h-32` untuk ambient glow dekoratif — ini adalah nilai arbitrary yang tidak menggunakan skala spacing standar Tailwind, meskipun dampaknya rendah karena ini elemen dekoratif.

Baris 626: `shadow-[0_-20px_50px_rgba(0,0,0,0.5)]` — shadow arbitrary di mobile slide-up menu.

**WARNING — Inkonsistensi padding antara kartu-kartu detail**

- Kartu Informasi Pengiriman: `p-6` (baris 342)
- Kartu Item Pesanan: `p-4 sm:p-6 lg:p-8` (baris 407) — tiga level padding berbeda
- Panel Aksi & Kontrol: `p-5 sm:p-6` (baris 534)

Kartu-kartu dalam satu grid tidak memiliki padding baseline yang konsisten di breakpoint yang sama. Pada desktop, kartu Item Pesanan memiliki `p-8` (32px) sedangkan kartu lain `p-6` (24px).

**WARNING — Section gaps tidak konsisten: `space-y-6` di root vs `space-y-8` pada beberapa kondisi**

Baris 310: `space-y-6 lg:space-y-8` di container root. Namun grid detail (baris 340) menggunakan `gap-6`, dan item pesanan dalam loop menggunakan `pb-8` (baris 414). Pada lg breakpoint, gap antara section 32px tapi internal item gap bisa 20-24px, menciptakan ritme vertikal yang tidak merata.

**KEKUATAN — Responsive breakpoints diimplementasikan di semua section kritis**

Panel aksi menggunakan `flex-col xl:flex-row`, kartu informasi menggunakan `grid-cols-1 md:grid-cols-2`, dan area judul menggunakan `flex-col sm:flex-row`. Responsivitas cukup komprehensif.

---

### 6. Experience Design (2/4)

**BLOCKER — Tidak ada tombol Batalkan/Retur yang dapat diakses dari UI**

Fungsi `handleUpdateStatus('cancelled')` dan `handleUpdateStatus('returned')` ada di kode (baris 95-96, 162-169) beserta logika konfirmasi yang lengkap (baris 125-132). Namun tidak ada tombol atau mekanisme UI yang memanggil kedua aksi ini.

`getCorrectionStatuses()` (baris 267-277) hanya mengembalikan `['confirmed', 'processing', 'pressing']` — tidak termasuk `cancelled` atau `returned`. Sehingga meskipun `handleUpdateStatus` mendukung pembatalan/retur, tidak ada entry point UI-nya.

Akibatnya: admin/staff/mitra tidak dapat membatalkan atau meretur pesanan dari halaman ini. Alur kritis ini putus.

**BLOCKER — Loading state adalah plain text tanpa skeleton atau spinner**

Baris 65: `<div className="p-8 text-center text-slate-400 font-semibold">Memuat data...</div>`

Tidak ada skeleton loader, tidak ada spinner, tidak ada indikasi visual bahwa halaman sedang memuat. Pada koneksi lambat, layar kosong dengan teks kecil tidak memberi umpan balik yang memadai.

**WARNING — State error pada `catch` hanya menampilkan toast, lalu redirect implicit**

Baris 58-61: Ketika `Promise.all` gagal, hanya toast error yang ditampilkan, kemudian `setLoading(false)` menyebabkan render branch `!order` menampilkan "Pesanan tidak ditemukan...". Pengguna tidak tahu apakah pesanan memang tidak ada atau apakah terjadi error jaringan. Dua kondisi berbeda ditampilkan sama.

**WARNING — Tidak ada pesan apapun jika `order.resiUrl` kosong untuk pesanan online**

Baris 352-360: Untuk pesanan online, link download resi langsung menggunakan `href={order.resiUrl}` tanpa guard. Jika `resiUrl` kosong atau undefined (tipe `string | undefined` di baris 57 types.ts), link tetap render tetapi mengarah ke `href="undefined"`. Seharusnya ada fallback: "Dokumen resi belum diunggah."

**WARNING — `statusUpdating` mencegah double-submit tetapi tidak memblokir tombol Hapus secara simultan**

Tombol "Hapus Pesanan" (`handleDeleteOrder`) tidak memeriksa `statusUpdating`. Pengguna secara teori bisa memicu delete sembari status sedang diupdate.

**WARNING — Teks konfirmasi DTF tidak menjelaskan item mana yang belum cetak**

Baris 104: Pesan hanya menyebutkan jumlah item (`itemsPendingDTF.length`) tanpa menyebutkan nama produk. Admin/operational yang mengelola banyak item tidak tahu item mana yang perlu diselesaikan.

**INFO — Role-based access control pada visibility komponen sudah diterapkan dengan baik**

Edit/delete/DTF controls semuanya memiliki guard role yang tepat. Mitra tidak bisa mengubah status internal. Operational tidak bisa mengakses info finansial.

---

## Top Priority Fixes

1. **BLOCKER: Tidak ada tombol Batalkan/Retur di UI** — Admin, staff, dan mitra tidak dapat melakukan pembatalan atau retur pesanan dari halaman detail. Tambahkan dua tombol eksplisit di panel "Aksi & Kontrol" dengan guard role yang sesuai: `(user.role === 'admin' || user.role === 'staff' || user.role === 'mitra')` dan hanya tampilkan untuk status yang eligible. Panggil `handleUpdateStatus('cancelled')` dan `handleUpdateStatus('returned')` dari sana. Referensi: baris 591-674.

2. **BLOCKER: Inkonsistensi warna badge status antara OrderDetail dan OrdersList** — Status `pressing` menggunakan `rose` di detail tapi `orange` di list; status `packing` menggunakan `orange` di detail tapi `cyan` di list. Ekstrak `getStatusBadge` ke file shared (`src/lib/statusBadge.tsx`) dan gunakan satu definisi di kedua halaman. Referensi: OrderDetail baris 280-298, OrdersList baris 147-168.

3. **BLOCKER: String "Processing..." dalam bahasa Inggris pada tiga tombol aksi** — Ganti dengan teks Indonesia yang kontekstual: `'Memuat PDF...'` untuk PDFDownloadLink (baris 554, 568) dan `'Memperbarui...'` untuk tombol advance status (baris 603). Ini berdampak langsung pada kepercayaan pengguna terhadap sistem.

4. **WARNING: 11 ukuran font arbitrary dalam satu halaman** — Standardisasi ke 4 ukuran: `text-[10px]` untuk label mikro, `text-xs` (12px) untuk nilai sekunder, `text-sm` (14px) untuk konten utama, `text-lg`/`text-xl` untuk heading. Hapus `text-[9px]` (di bawah threshold keterbacaan) dan gabungkan `text-[11px]`, `text-[12px]`, `text-[13px]` ke nilai Tailwind standar terdekat.

5. **WARNING: resiUrl tidak di-guard untuk nilai kosong** — Tambahkan kondisi di baris 352: `{order.resiUrl ? (<a href={order.resiUrl}...>) : (<span className="text-slate-500 italic text-[11px]">Dokumen resi belum tersedia.</span>)}`.

6. **WARNING: Loading state tanpa skeleton** — Ganti `<div className="p-8 text-center...">Memuat data...</div>` (baris 65) dengan komponen skeleton yang mencerminkan struktur halaman: dua kartu `h-40` di grid 2-kolom, satu kartu item besar, dan satu panel aksi.

---

## Files Audited

- `src/pages/orders/OrderDetail.tsx` — File utama audit (689 baris)
- `src/components/Layout.tsx` — Konteks shell dan sidebar (375 baris)
- `src/pages/orders/OrdersList.tsx` — Referensi konsistensi (578 baris)
- `src/types.ts` — Definisi tipe domain (122 baris)

---

## Registry Audit

`components.json` tidak ditemukan — shadcn tidak diinisialisasi. Registry audit dilewati.

---

## UI REVIEW COMPLETE

**Phase:** OrderDetail UI Audit
**Overall Score:** 14/24
**Screenshots:** Tidak diambil (dev server offline)

### Pillar Summary

| Pillar | Score |
|--------|-------|
| Copywriting | 2/4 |
| Visuals | 3/4 |
| Color | 2/4 |
| Typography | 2/4 |
| Spacing | 3/4 |
| Experience Design | 2/4 |

### Top 3 Fixes
1. Tidak ada tombol Batalkan/Retur di UI — alur pembatalan pesanan putus sepenuhnya
2. Inkonsistensi warna badge status antara OrderDetail dan OrdersList untuk pressing/packing
3. String "Processing..." bahasa Inggris pada tiga tombol aksi kritis
