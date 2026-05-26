# COPY-AUDIT.md — REMA v2.1 Copywriting Audit

## Ringkasan Eksekutif

- **Total copy elements ditemukan:** 147
- **Breakdown:** 72 [OK] / 18 [VERBOSE] / 28 [INCONSISTENT] / 14 [NON-STANDARD] / 6 [ICON-ONLY] / 9 [BUG]
- **File dengan masalah terbanyak:** `OrderDetail.tsx` (12 temuan), `Users.tsx` (10 temuan), `Mitras.tsx` (9 temuan)
- **Tema masalah utama:**
  1. **Campur bahasa** — kata Inggris terselip di antara teks Indonesia (`"Add User"`, `"Open Access"`, `"Total Qty"`, `"Show Limit"`, `"Update Draft"`)
  2. **Emoji di judul modal** — ➕📝📦💳📈 tidak standar industri SaaS
  3. **Teks teknis/jargon** — `"Integrasi Ledger"`, `"Privilege"`, `"Kredensial"`, `"Kontrol Operasional"`, `"Manufacturing Core Pipeline"`
  4. **Copy usang/tidak akurat** — Dashboard menampilkan teks localStorage padahal aplikasi sudah di Neon DB; ChangePassword footer bilang "Enkripsi Lokal"
  5. **Validasi error dalam Bahasa Inggris** — `ChangePassword.tsx` punya 2 pesan error yang tidak diterjemahkan

---

## Panduan Copy Standard

Prinsip yang digunakan sebagai acuan audit:

1. **Tombol aksi:** verb singkat ("Simpan", bukan "Simpan Data Pesanan")
2. **Pesan toast:** "Berhasil [verb]" / "[Noun] gagal [verb]"
3. **Konfirmasi:** title = nama aksi singkat, body = konsekuensi 1 kalimat
4. **Label form:** noun tanpa titik dua (styling handle CSS)
5. **Placeholder:** contoh format atau petunjuk isi, bukan repeat label
6. **Empty state:** "[Noun] belum ada" atau aksi proaktif
7. **Error:** spesifik, bukan generik; selalu Bahasa Indonesia
8. **Bahasa:** Indonesia formal-ringkas konsisten — hindari campur Inggris kecuali istilah teknis yang tidak ada padanannya (Dashboard, PDF, DTF, SPK)

---

## Temuan Per File

### src/pages/Dashboard.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Greeting subtitle | `"Akses panel untuk memonitor produksi pesanan, mengelola keuangan, dan melihat statistik performa operasional REMA v2.1 Anda."` | [VERBOSE] | `"Panel kontrol produksi, keuangan, dan statistik performa."` | Terlalu panjang; informasi sudah jelas dari konteks halaman |
| Section title: chart | `"Grafik Pesanan Masuk"` | [OK] | — | Sudah ringkas dan deskriptif |
| Section title: table | `"10 Order Dikonfirmasi Terakhir"` | [INCONSISTENT] | `"10 Pesanan Dikonfirmasi Terakhir"` | "Order" → "Pesanan" agar konsisten dengan bahasa Indonesia |
| Table header | `"Nama Mitra"` | [OK] | — | |
| Table header | `"Qty"` | [OK] | — | Singkatan teknis yang diterima |
| Table empty state | `"Belum ada order dikonfirmasi"` | [INCONSISTENT] | `"Belum ada pesanan dikonfirmasi"` | "order" → "pesanan" |
| Section title: info box | `"Spesifikasi Sistem REMA v2.1"` | [NON-STANDARD] | `"Tentang Sistem"` | Terlalu formal/teknis; tidak perlu versi di judul section |
| Info box content | `"Sistem Informasi Manajemen Produksi & Finance (REMA) saat ini dikonfigurasi menggunakan basis data lokal terenkripsi di sisi klien..."` | [BUG] | Hapus atau ganti: `"Sistem manajemen produksi dan keuangan mitra PT. Redone Berkah Mandiri Utama. Data tersimpan di cloud (Neon DB) dan file di Cloudflare R2."` | Copy ini **tidak akurat** — aplikasi sudah tidak menggunakan localStorage; menyesatkan user |
| Info box footer badges | `"File Sesi Terkendali"` / `"Enkripsi Sisi Klien Aktif"` | [BUG] | Hapus kedua badge ini | Tidak akurat — keduanya merepresentasikan sistem lama yang sudah tidak berlaku |
| Credit alert title | `"Pemberitahuan: Limit Kredit Hampir Habis"` | [VERBOSE] | `"Limit Kredit Hampir Habis"` | "Pemberitahuan:" redundant — sudah jelas ini notifikasi |
| Credit alert body | `"Tagihan berjalan Anda saat ini adalah ... yang mendominasi batas maksimal limit kredit Anda sebesar ..."` | [VERBOSE] | `"Tagihan berjalan Anda {saldo} mendekati batas limit {limit}. Segera lakukan pembayaran agar pesanan berikutnya tetap berjalan."` | Lebih ringkas dan langsung ke tindakan |
| Chart period options | `"Minggu Ini"` / `"Bulan Ini"` / `"Tahun Ini"` | [OK] | — | |

---

### src/pages/Login.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Hero panel title | `"Platform Manajemen Produksi Generasi Terbaru."` | [OK] | — | Tepat untuk landing context |
| Login button | `"Masuk ke Workspace"` | [VERBOSE] | `"Masuk"` | "ke Workspace" tidak menambah informasi |
| Form label | `"Nomor Telepon"` | [OK] | — | |
| Form label | `"Kata Sandi"` | [OK] | — | |
| Footer text | `"Sesi terenkripsi secara end-to-end"` | [NON-STANDARD] | `"Koneksi terenkripsi"` | "end-to-end" tidak akurat untuk session JWT; lebih ringkas |
| Footer links | `"Syarat & Ketentuan"` / `"Kebijakan Privasi"` | [OK] | — | |
| Forgot password | `"Lupa sandi?"` | [OK] | — | |

---

### src/pages/Users.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Page title | `"Otentikasi & Akun Pengguna"` | [NON-STANDARD] | `"Manajemen Pengguna"` | "Otentikasi" adalah jargon teknis; tidak perlu di judul halaman |
| Page description | `"Manajemen privilege, verifikasi kredensial, dan kontrol status hak akses."` | [VERBOSE] | `"Kelola akun, peran, dan status akses pengguna."` | Jargon teknis berlebihan |
| Button: add | `"Add User"` | [INCONSISTENT] | `"Tambah Pengguna"` | Bahasa Indonesia konsisten |
| Modal title: add | `"➕ Daftarkan Akun Pengguna"` | [NON-STANDARD] | `"Tambah Pengguna"` | Hapus emoji; "Daftarkan Akun" terlalu formal |
| Role option | `"Administrator SYSTEM"` | [VERBOSE] | `"Administrator"` | "SYSTEM" tidak perlu |
| Role option | `"Staff Admin"` | [OK] | — | |
| Role option | `"Operational Produksi"` | [OK] | — | |
| Role option | `"Mitra Partner"` | [INCONSISTENT] | `"Mitra"` | "Partner" adalah terjemahan "Mitra" — redundant |
| Label | `"Nomor Handphone (HP)"` | [VERBOSE] | `"Nomor Handphone"` | "(HP)" redundant |
| Detail section | `"Kontrol Operasional"` | [NON-STANDARD] | `"Tindakan"` | Terlalu teknis untuk nama section tombol |
| Button | `"Reset PW"` | [INCONSISTENT] | `"Reset Password"` | Abbreviasi tidak konsisten dengan konvensi lain |
| Button | `"Disable"` / `"Enable"` | [INCONSISTENT] | `"Nonaktifkan"` / `"Aktifkan"` | Bahasa Indonesia konsisten |
| Status badge | `"Off"` (untuk inactive) | [INCONSISTENT] | `"Nonaktif"` | Bahasa Indonesia konsisten |
| Status badge | `"Banned"` | [INCONSISTENT] | `"Diblokir"` | Bahasa Indonesia konsisten |
| Empty state title | `"Data User Kosong"` | [INCONSISTENT] | `"Belum Ada Pengguna"` | "Data User" campur bahasa; format "Belum Ada X" lebih standar |
| Empty state desc | `"...klik tombol "Add User"..."` | [INCONSISTENT] | `"...klik tombol Tambah Pengguna..."` | Konsisten dengan perubahan label tombol |
| Confirm title | `"Reset Password"` | [INCONSISTENT] | `"Reset Kata Sandi"` | Konsisten Bahasa Indonesia |

---

### src/pages/Products.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Page title | `"Katalog & Koleksi Produk"` | [OK] | — | |
| Page description | `"Manajemen inventori, basis harga mitra, dan visual aset produk."` | [OK] | — | |
| Button: add | `"Add Item"` | [INCONSISTENT] | `"Tambah Produk"` | Bahasa Indonesia konsisten |
| Modal title: edit | `"📝 Ubah Detail Produk"` | [NON-STANDARD] | `"Edit Produk"` | Hapus emoji; "Ubah Detail" → "Edit" lebih ringkas |
| Modal title: add category | `"📦 Tambah Kategori Produk"` | [NON-STANDARD] | `"Tambah Produk"` | Hapus emoji; "Kategori" membingungkan — ini tambah item baru, bukan kategori |
| Button: submit edit | `"Edit & Perbarui Produk"` | [VERBOSE] | `"Simpan"` | "Edit & Perbarui" redundant; context modal sudah jelas |
| Label: add form | `"Harga Dasar (Rp)"` | [INCONSISTENT] | `"Harga (Rp)"` | Edit form pakai "Harga Jual (Rp)"; standarkan ke "Harga (Rp)" |
| No-image placeholder | `"No Image"` | [INCONSISTENT] | `"Belum Ada Gambar"` | Bahasa Indonesia konsisten |
| Empty state | `"Belum Ada Produk Katalog"` | [OK] | — | |
| Toast: tambah | `"Produk berhasil ditambahkan"` | [OK] | — | |
| Toast: edit | `"Produk berhasil diperbarui"` | [OK] | — | |
| Toast: hapus | `"Produk berhasil dihapus"` | [OK] | — | |
| Toast: arsip | `"Produk berhasil diarsipkan"` | [OK] | — | |

---

### src/pages/Mitras.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Page title | `"Manajemen Partner & Mitra"` | [INCONSISTENT] | `"Manajemen Mitra"` | "Partner" dan "Mitra" berarti sama — redundant |
| Page description | `"Pantau limit kredit, identitas brand mitra, dan statistik performa partner."` | [INCONSISTENT] | `"Pantau limit kredit, profil mitra, dan statistik performa."` | "partner" diganti agar konsisten; "identitas brand" → "profil" lebih ringkas |
| Table header | `"Partner Profile"` | [INCONSISTENT] | `"Profil Mitra"` | Bahasa Indonesia konsisten |
| Table header | `"Total Sales"` | [INCONSISTENT] | `"Total Penjualan"` | Bahasa Indonesia konsisten |
| Table header | `"Vol"` | [INCONSISTENT] | `"Volume"` | "Vol" terlalu singkat dan tidak konsisten dengan header lain |
| Status badge | `"Aktif Partner"` | [INCONSISTENT] | `"Aktif"` | "Partner" redundant; halaman ini sudah konteks mitra |
| Detail stat | `"Total Sales"` | [INCONSISTENT] | `"Total Penjualan"` | Konsisten dengan perubahan header |
| Detail stat | `"Order Vol"` | [INCONSISTENT] | `"Volume Pesanan"` | Bahasa Indonesia konsisten |
| Detail label | `"Saldo Piutang (Receivables)"` | [VERBOSE] | `"Saldo Piutang"` | Terjemahan Inggris dalam kurung tidak perlu |
| Detail label | `"Limit Kredit Dinamis (Hutang Maks)"` | [VERBOSE] | `"Limit Kredit"` | Kedua keterangan tambahan tidak perlu |
| Section | `"Kontrol Akses & Profil"` | [NON-STANDARD] | `"Tindakan"` | Terlalu teknis untuk nama section tombol |
| Button | `"Open Access"` | [INCONSISTENT] | `"Buka Akses"` | Bahasa Indonesia konsisten |
| Button | `"Restricted"` | [INCONSISTENT] | `"Batasi Akses"` | Bahasa Indonesia konsisten |
| Button | `"Delete Partner Record"` | [INCONSISTENT] | `"Hapus Mitra"` | Bahasa Indonesia konsisten; "Record" tidak perlu |
| Limit editor button | `"Save"` | [INCONSISTENT] | `"Simpan"` | Bahasa Indonesia konsisten |
| Limit placeholder | `"No Limit (Unlimited)"` | [INCONSISTENT] | `"Kosongkan untuk tanpa limit"` | Bahasa Indonesia + lebih deskriptif |
| Empty state | `"Data Mitra Kosong"` | [INCONSISTENT] | `"Belum Ada Mitra"` | Format "Belum Ada X" lebih standar |

---

### src/pages/Finance.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Page title | `"Keuangan & Tagihan Mitra"` | [OK] | — | |
| Page description | `"Kelola aliran bayar, kredit retur, dan balance berjalan."` | [INCONSISTENT] | `"Kelola aliran pembayaran, kredit retur, dan saldo berjalan."` | "balance" → "saldo" Bahasa Indonesia |
| Metric card | `"Tagihan Pending (Global)"` | [INCONSISTENT] | `"Tagihan Tertunda"` | "Pending" → "Tertunda"; "(Global)" tidak informatif |
| Source badge | `"Pembahasan"` | [BUG] | `"Pembayaran"` | Typo/bug nyata — ini seharusnya label untuk payment entry |
| Source badge | `"Manual Charge"` | [INCONSISTENT] | `"Tagihan Manual"` | Bahasa Indonesia konsisten |
| PaymentModal title | `"💳 Input Pengurangan Piutang"` | [NON-STANDARD] | `"Catat Pembayaran"` | Hapus emoji; "Pengurangan Piutang" terlalu teknis akuntansi; konteks = user membayar |
| PaymentModal title: edit | `"💳 Edit Pengurangan Piutang"` | [NON-STANDARD] | `"Edit Pembayaran"` | Konsisten dengan perubahan di atas |
| PaymentModal label | `"Pilih Mitra Partner"` | [INCONSISTENT] | `"Mitra"` | "Partner" redundant; sudah dalam konteks Finance mitra |
| ChargeModal title | `"📈 Input Tambahan Piutang"` | [NON-STANDARD] | `"Catat Tagihan Manual"` | Hapus emoji; "Tambahan Piutang" terlalu akuntansi |
| ChargeModal title: edit | `"📈 Edit Tambahan Piutang"` | [NON-STANDARD] | `"Edit Tagihan Manual"` | Konsisten dengan perubahan di atas |
| ChargeModal label | `"Uraian Deskripsi Tagihan"` | [VERBOSE] | `"Keterangan"` | "Uraian" dan "Deskripsi" berarti sama — pilih satu, "Keterangan" lebih ringkas |
| Button: bayar | `"Simpan Kredit"` | [INCONSISTENT] | `"Simpan"` | "Simpan Kredit" tidak konsisten dengan "Simpan Tagihan" di ChargeModal |
| Toast error | `"Masukan nominal yang valid!"` | [BUG] | `"Masukkan nominal yang valid"` | Typo: "Masukan" (noun) seharusnya "Masukkan" (verb); hapus tanda seru |
| Empty state | `"Belum ada transaksi tercatat."` | [INCONSISTENT] | `"Belum ada transaksi"` | Hapus titik; konsisten dengan empty state lain |
| Empty state alt | `"Belum ada aliran kas tercatat."` | [INCONSISTENT] | `"Belum ada transaksi"` | Seragamkan dengan empty state utama |

---

### src/pages/Reports.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Page title | `"Laporan & Analitik"` | [OK] | — | |
| Page description | `"Tinjauan komprehensif keuangan dan aktivitas pesanan."` | [OK] | — | |
| Button | `"Cetak PDF"` | [OK] | — | |
| Label filter | `"Tanggal Mulai"` / `"Tanggal Akhir"` | [INCONSISTENT] | Gunakan satu pola — `"Tanggal Mulai"` / `"Tanggal Akhir"` | Filter pesanan pakai `"Tgl Mulai"` / `"Tgl Akhir"` — standarkan ke bentuk penuh |
| Chart title | `"Grafik Qty Pesanan"` | [INCONSISTENT] | `"Grafik Volume Pesanan"` | "Qty" → "Volume" Bahasa Indonesia konsisten |
| Finance summary label | `"Total Limit / Debit"` | [VERBOSE] | `"Total Tagihan"` | "/ Debit" membingungkan; label tujuannya adalah total debit |
| Export modal title | `"Konfirmasi Ekspor"` | [OK] | — | |
| Export modal desc | `"Apakah Anda ingin mengekspor data..."` | [VERBOSE] | `"Data akan diekspor dalam format PDF sesuai filter aktif."` | Pola konfirmasi lebih ringkas sebagai info, bukan pertanyaan |

---

### src/pages/ChangePassword.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Form title (forced) | `"Change Password Required"` | [INCONSISTENT] | `"Ganti Kata Sandi"` | Inggris saat semua teks lain Indonesia |
| Footer text | `"Fase Pengembangan v2.1 • Keamanan Enkripsi Lokal"` | [BUG] | Hapus footer ini | Tidak akurat — aplikasi sudah production di Vercel/Neon DB, bukan "Fase Pengembangan" atau "Enkripsi Lokal" |
| Validation error | `"Password must be between 8 and 64 characters."` | [INCONSISTENT] | `"Kata sandi harus 8–64 karakter."` | Bahasa Indonesia konsisten |
| Validation error | `"Passwords do not match."` | [INCONSISTENT] | `"Konfirmasi kata sandi tidak cocok."` | Bahasa Indonesia konsisten |
| Label | `"Kata Sandi Lama"` | [OK] | — | |
| Label | `"Kata Sandi Baru"` | [OK] | — | |
| Label | `"Konfirmasi Kata Sandi Baru"` | [OK] | — | |
| Button: simpan | `"Simpan Perubahan"` | [OK] | — | |

---

### src/pages/AuditLogs.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Page title | `"Audit Logs"` | [OK] | — | Istilah teknis yang diterima; "Log Aktivitas" bisa jadi alternatif tapi tidak urgent |
| Page description | `"Riwayat aktivitas pengguna sistem"` | [OK] | — | |
| Search placeholder | `"Cari berdasarkan nama, aksi, atau detail..."` | [OK] | — | |
| Table headers | `"Waktu"` / `"Pengguna"` / `"Aksi"` / `"Detail"` | [OK] | — | |
| Empty state | `"Tidak ada aktivitas ditemukan."` | [OK] | — | |

---

### src/pages/AppQueue.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Page title | `"Antrian Produksi"` | [OK] | — | |
| Page subtitle | `"Manufacturing Core Pipeline"` | [INCONSISTENT] | Hapus subtitle ini | Bahasa Inggris penuh; tidak konsisten; tidak menambah informasi |
| Stats label | `"Queue"` | [INCONSISTENT] | `"Antrian"` | Bahasa Indonesia konsisten |
| Stats label | `"Volume"` | [OK] | — | |
| Pipeline stage | `"PRESS SABLON"` | [OK] | — | Istilah industri yang diterima |
| Pipeline stage | `"PACKING & SHIP"` | [INCONSISTENT] | `"PACKING & KIRIM"` | "SHIP" → "KIRIM" Bahasa Indonesia |
| Table header | `"Ref ID"` | [INCONSISTENT] | `"Nomor Pesanan"` | Lebih deskriptif; "Ref ID" terlalu teknis |
| Table header | `"Mitra Partner"` | [INCONSISTENT] | `"Mitra"` | "Partner" redundant |
| Table header | `"Volume"` | [OK] | — | |
| Table header | `"Progress Pos"` | [INCONSISTENT] | `"Posisi Produksi"` | "Progress Pos" ambigu; "Posisi Produksi" lebih jelas |
| Status badge | `"Packing"` | [INCONSISTENT] | `"Packing"` → Pertahankan | Istilah industri yang diterima; konsistenkan dengan "Press Sablon" |
| Empty state (mobile) | `"Antrian Kosong"` | [INCONSISTENT] | `"Antrian Produksi Kosong"` | Seragamkan dengan empty state desktop |
| Empty state (desktop) | `"Seluruh Produksi Selesai"` | [INCONSISTENT] | `"Antrian Produksi Kosong"` | Keduanya tampil saat tidak ada data — pakai satu pesan konsisten |

---

### src/pages/CancellationsReturns.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Page title | `"Pembatalan & Retur"` | [OK] | — | |
| Page description | `"Pusat kendali klaim transaksi dan penyesuaian limit saldo mitra."` | [VERBOSE] | `"Proses pembatalan dan retur pesanan mitra."` | "Pusat kendali" informal; "klaim transaksi" terlalu teknis |
| Form subtitle | `"Input validasi klaim transaksi pada sistem."` | [NON-STANDARD] | Hapus subtitle ini | Tidak perlu; judul form sudah cukup |
| Form label | `"Kronologi / Alasan"` | [NON-STANDARD] | `"Alasan"` | "Kronologi" bukan kata yang tepat untuk form label singkat |
| Form label | `"Estimasi Refund"` | [INCONSISTENT] | `"Estimasi Pengembalian"` | "Refund" → Bahasa Indonesia |
| Section header | `"Metrik Dampak"` | [NON-STANDARD] | `"Ringkasan Dampak"` | "Metrik" adalah jargon teknis; "Ringkasan" lebih mudah dipahami |
| Section header | `"Log Resumen Aktivitas"` | [BUG] | `"Riwayat Aktivitas"` | "Resumen" adalah kata Spanyol/campur; bukan Indonesia |
| Status badge | `"Dibatalkan"` | [INCONSISTENT] | `"Batal"` | OrdersList dan status lain pakai "Batal" — seragamkan |
| Table header | `"Ref Orde"` | [VERBOSE] | `"Nomor Pesanan"` | "Ref Orde" truncated dan tidak standar |
| Toast error | `"...pesanan yang memenuhi syarat untuk pembatalan/pembatalan"` | [BUG] | `"Tidak ada pesanan yang dapat dibatalkan"` / `"Tidak ada pesanan yang dapat diretur"` | "pembatalan/pembatalan" adalah duplikasi bug — harusnya "pembatalan/retur" |

---

### src/pages/orders/CreateOrder.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Page title (new) | `"Formulir Pesanan Baru"` | [OK] | — | |
| Page description (new) | `"Tentukan metode pengiriman, isi items, dan lengkapi berkas aset cetak."` | [INCONSISTENT] | `"Tentukan metode pengiriman, isi item, dan lengkapi berkas cetak."` | "items" → "item"; "aset cetak" → "berkas cetak" lebih ringkas |
| Section 1 title | `"Informasi Distribusi & Pengiriman"` | [VERBOSE] | `"Informasi Pengiriman"` | "Distribusi &" redundant dalam konteks ini |
| FileUpload label | `"Unggah Label Pengiriman PDF / File Resi Cetak (Wajib)"` | [VERBOSE] | `"Label Pengiriman / Resi (Wajib)"` | Label komponen FileUpload; kata "Unggah" redundant karena komponen sudah upload |
| Label | `"Alamat Lengkap Distribusi *"` | [INCONSISTENT] | `"Alamat Pengiriman *"` | OrderDetail pakai "Alamat Pengiriman Lengkap"; seragamkan ke "Alamat Pengiriman" |
| MultiFileUpload label | `"File Master Design"` | [INCONSISTENT] | `"File Master Desain"` | "Design" → "Desain" Bahasa Indonesia |
| Empty state title | `"Keranjang Belanja Masih Kosong"` | [NON-STANDARD] | `"Belum Ada Item"` | "Keranjang Belanja" adalah istilah e-commerce retail; ini B2B order management |
| Empty state desc | `"Klik tombol + Polos atau + Custom diatas untuk mulai merancang produk pilihan Anda."` | [VERBOSE] | `"Tambahkan item dengan tombol + Polos atau + Custom di atas."` | Lebih singkat dan langsung |
| Button draft (existing) | `"Update Draft"` | [INCONSISTENT] | `"Simpan Draft"` | "Update" → "Simpan" Bahasa Indonesia |
| Button submit (existing) | `"Update & Ajukan"` | [INCONSISTENT] | `"Simpan & Ajukan"` | "Update" → "Simpan" Bahasa Indonesia |
| Error | `"File preview dan berkas desain wajib untuk item custom logo (minimum 1)."` | [INCONSISTENT] | `"Preview dan berkas desain wajib diisi untuk item custom logo (min. 1 file)."` | "File preview" campur bahasa |
| Confirm message | `"Apakah Anda yakin ingin mengajukan pesanan dengan total ${totalQty} pcs ini? Setelah diajukan, pesanan akan masuk ke tahap verifikasi admin."` | [VERBOSE] | `"Pesanan dengan total ${totalQty} pcs akan masuk ke tahap verifikasi admin."` | Hilangkan "Apakah Anda yakin...?" — cukup sampaikan konsekuensi |

---

### src/pages/orders/OrdersList.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Page title (draft view) | `"Draft Unit Pesanan"` | [NON-STANDARD] | `"Draft Pesanan"` | "Unit" tidak perlu |
| Page title (main view) | `"Daftar Manajemen Pesanan"` | [VERBOSE] | `"Daftar Pesanan"` | "Manajemen" redundant |
| Search placeholder | `"Cari nomor order, tipe, atau mitra..."` | [INCONSISTENT] | `"Cari nomor pesanan, tipe, atau mitra..."` | "order" → "pesanan" |
| Table header | `"Nomor Pesanan"` | [OK] | — | |
| Table header | `"Total Qty"` | [INCONSISTENT] | `"Total Qty"` → pertahankan | Singkatan quantity yang diterima di konteks tabel; atau ganti ke "Total Item" |
| Pagination | `"Show Limit:"` | [INCONSISTENT] | `"Tampilkan:"` | Bahasa Indonesia konsisten |
| Pagination size options | `"5 Units"` / `"10 Units"` / `"25 Units"` / `"All"` | [INCONSISTENT] | `"5"` / `"10"` / `"25"` / `"Semua"` | "Units" redundant; "All" → "Semua" |
| Status filter | `"Kirim"` (untuk shipped) | [INCONSISTENT] | `"Terkirim"` | OrderDetail dan status lain pakai "Terkirim"; seragamkan |
| Status badge | `"Kirim"` | [INCONSISTENT] | `"Terkirim"` | Konsisten dengan filter |

---

### src/pages/orders/OrderDetail.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Card title | `"Alur Distribusi & Logistik"` | [VERBOSE] | `"Informasi Pengiriman"` | Terlalu teknis; "Alur Distribusi & Logistik" terkesan seperti judul proses SCM |
| Label | `"Penerima Atas Nama:"` | [VERBOSE] | `"Nama Penerima:"` | Lebih ringkas |
| Label | `"Identitas Telepon:"` | [VERBOSE] | `"Telepon:"` | "Identitas" tidak perlu |
| Label | `"Alamat Pengiriman Lengkap:"` | [VERBOSE] | `"Alamat:"` | Konteks sudah jelas dari card title |
| Card title | `"Rincian Finansial & Billing"` | [INCONSISTENT] | `"Rincian Tagihan"` | "Billing" → Indonesia; "Finansial &" redundant |
| Label | `"Integrasi Ledger:"` | [NON-STANDARD] | `"Status Tagihan:"` | "Integrasi Ledger" jargon teknis; user tidak perlu tahu istilah internal |
| Badge | `"Pending Billed"` | [INCONSISTENT] | `"Belum Ditagih"` | Bahasa Indonesia konsisten |
| Badge | `"Ledger Tercatat"` | [NON-STANDARD] | `"Sudah Ditagih"` | "Ledger Tercatat" jargon internal; "Sudah Ditagih" lebih jelas untuk user |
| Label | `"Kuantitas Pesanan:"` | [VERBOSE] | `"Jumlah Item:"` | "Kuantitas" terlalu formal; "Jumlah Item" lebih natural |
| Section title | `"Daftar Komposisi Item & Visual"` | [VERBOSE] | `"Item Pesanan"` | Terlalu deskriptif; judulnya sendiri sudah cukup |
| Badge | `"Custom Logo Design"` | [INCONSISTENT] | `"Custom Logo"` | "Design" → hilangkan atau ganti "Desain" |
| Badge | `"Katalog Stock Polos"` | [INCONSISTENT] | `"Polos"` | "Katalog Stock" redundant dalam konteks item list |
| Label | `"Galeri Preview Visual (Klik perbesar)"` | [VERBOSE] | `"Preview"` | "Galeri", "Visual", "(Klik perbesar)" semua redundant |
| Label | `"Arsip Sumber Design Master"` | [NON-STANDARD] | `"File Desain"` | "Arsip Sumber" dan "Master" tidak perlu; "Design" → "Desain" |
| Button | `"Unduh Master X"` | [INCONSISTENT] | `"Unduh Desain X"` | Konsisten dengan label "File Desain" |
| Label | `"Catatan Operasional Desain:"` | [VERBOSE] | `"Catatan Desain:"` | "Operasional" redundant |
| Label | `"Status Verifikasi Cetak DTF"` | [VERBOSE] | `"Status Cetak DTF"` | "Verifikasi" redundant — bukan verifikasi, hanya status |
| Helper text | `"* Kontrol status Cetak available dalam stage Produksi."` | [INCONSISTENT] | `"Status cetak hanya dapat diubah pada tahap Produksi."` | "available" dan "stage" → Bahasa Indonesia |
| Draft banner desc | `"Pesanan ini masih berstatus Draft..."` (panjang) | [VERBOSE] | `"Pesanan masih draft. Ajukan agar masuk ke antrean verifikasi admin."` | Ringkas tapi informasi kunci tetap ada |
| Button | `"Edit Order"` | [INCONSISTENT] | `"Edit Pesanan"` | Bahasa Indonesia konsisten |
| Toast | `"Gagal update status"` | [INCONSISTENT] | `"Gagal memperbarui status"` | "update" → "memperbarui" |
| Toast DTF restriction | `"Status Cetak DTF hanya dapat diubah saat status pesanan Dikonfirmasi atau Diproses Produksi."` | [VERBOSE] | `"Status cetak DTF hanya dapat diubah saat pesanan Dikonfirmasi atau Diproses."` | Hilangkan pengulangan kata |

---

### src/components/Layout.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Sidebar nav section | `"Main Menu"` | [INCONSISTENT] | `"Menu Utama"` | Bahasa Indonesia konsisten |
| Header | `"Operational Panel"` | [INCONSISTENT] | `"Panel Operasional"` | Bahasa Indonesia konsisten |
| Profile button | `"Ganti Password"` | [INCONSISTENT] | `"Ganti Kata Sandi"` | "Password" → "Kata Sandi"; konsisten dengan ChangePassword.tsx |
| Logout button | `"Keluar Sesi"` | [VERBOSE] | `"Keluar"` | "Sesi" redundant — logout sudah implisit mengakhiri sesi |

---

### src/components/RunningOrders.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Label | `"Terbaru"` | [OK] | — | |
| Empty state | `"Belum ada pesanan terkonfirmasi..."` | [OK] | — | |

---

### src/components/FileUpload.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Upload prompt | `"Tarik & Lepas File di Sini"` | [OK] | — | |
| Sub-text | `"Bisa klik untuk memilih file di folder lokal komputer (Maksimal 10MB)"` | [VERBOSE] | `"Klik atau seret file ke sini (maks. 10MB)"` | Lebih ringkas; "folder lokal komputer" redundant |
| Uploaded state | `"Berkas Berhasil Terunggah"` | [OK] | — | |
| Badge | `"Ready"` | [INCONSISTENT] | `"Siap"` | Bahasa Indonesia konsisten |
| Error | `"Ukuran file terlalu besar. Batas maksimal adalah 10MB."` | [OK] | — | |

---

### src/components/MultiFileUpload.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Upload prompt | `"Tarik & Lepas File ke Sini"` | [INCONSISTENT] | `"Tarik & Lepas File di Sini"` | FileUpload pakai "di Sini"; seragamkan |
| Sub-text | `"Bisa memilih lebih dari 1 file sekaligus (Maksimal 10MB per file)"` | [VERBOSE] | `"Pilih beberapa file sekaligus (maks. 10MB per file)"` | "Bisa" tidak perlu; lebih ringkas |
| Toast remove | `"Lampiran berhasil dihapus"` | [INCONSISTENT] | `"Berkas dihapus"` | FileUpload pakai "Berkas dihapus"; seragamkan |
| Error format | `"${f.name}: terlalu besar (maks 10MB)"` | [INCONSISTENT] | `"${f.name}: ukuran file melebihi batas 10MB"` | FileUpload pakai pesan berbeda; seragamkan format error |

---

### src/context/ConfirmContext.tsx

| Element | Current | Category | Proposed | Reason |
|---------|---------|----------|----------|--------|
| Default confirm button | `"Konfirmasi"` | [OK] | — | |
| Default cancel button | `"Batal"` | [OK] | — | |

---

## Rekomendasi Icon-Only

Area yang disarankan cukup dengan icon tanpa teks label — atau teks dapat dipindahkan ke `title` attribute (tooltip):

| Lokasi | Element | Alasan |
|--------|---------|--------|
| `OrderDetail.tsx` | Tombol back (sudah icon-only dengan `ArrowLeft`) | Sudah diimplementasi dengan baik — pertahankan |
| `CreateOrder.tsx` | Tombol hapus item (`Trash2` icon) | Sudah icon-only dengan `title="Hapus Item"` — pertahankan |
| `OrdersList.tsx` | Action buttons di baris tabel (jika ada) | Jika ruang terbatas di mobile, icon + tooltip cukup |
| `Layout.tsx` | Nav labels di sidebar collapsed state | Pertimbangkan mode collapsed mobile dengan icon-only |
| `Products.tsx` | Tombol arsip/edit di baris tabel | Icon + tooltip memadai jika konteks jelas dari baris tabel |

---

## Bugs yang Perlu Diperbaiki (Prioritas Tinggi)

| File | Bug | Fix |
|------|-----|-----|
| `Finance.tsx` | Source badge label `"Pembahasan"` seharusnya `"Pembayaran"` | Cek konstanta/nilai hardcoded di badge render |
| `Finance.tsx` | Toast error `"Masukan nominal yang valid!"` — typo "Masukan" | Ganti ke `"Masukkan nominal yang valid"` |
| `CancellationsReturns.tsx` | Error toast `"pembatalan/pembatalan"` — duplikasi bug | Ganti ke `"pembatalan"` atau `"retur"` sesuai konteks |
| `Dashboard.tsx` | Info box menyebut "basis data lokal terenkripsi" — tidak akurat | Hapus atau ganti dengan copy yang akurat |
| `Dashboard.tsx` | Badge "File Sesi Terkendali" dan "Enkripsi Sisi Klien Aktif" — tidak akurat | Hapus |
| `ChangePassword.tsx` | Footer "Fase Pengembangan v2.1 • Keamanan Enkripsi Lokal" — tidak akurat | Hapus |

---

## Summary Perubahan untuk Plan 12-02

**Total perubahan yang perlu diimplementasi: 19 file, ~73 string**

Urutan prioritas:

**P1 — Bug/Inakurasi (segera):**
- Dashboard info box content + badges (outdated/inaccurate)
- ChangePassword footer (inaccurate)
- Finance "Pembahasan" badge (bug)
- Finance toast typo "Masukan"
- CancellationsReturns "pembatalan/pembatalan" duplicate

**P2 — Campur bahasa (konsistensi):**
- Users: "Add User", "Disable"/"Enable", "Off"/"Banned", "Reset PW", "Reset Password" (dialog)
- Products: "Add Item", "No Image"
- Mitras: "Open Access"/"Restricted", "Delete Partner Record", "Save", "Total Sales", "Order Vol", "Partner Profile", "No Limit (Unlimited)"
- Finance: "balance", "Pending", "Pilih Mitra Partner"
- AppQueue: "Queue", "PACKING & SHIP", "Ref ID", "Mitra Partner", "Progress Pos"
- Layout: "Main Menu", "Operational Panel", "Ganti Password", "Keluar Sesi"
- OrdersList: "Show Limit", "Units", "Kirim" (status), "nomor order"
- CreateOrder: "Update Draft", "Update & Ajukan", "File Master Design", "items"
- OrderDetail: "Billing", "Pending Billed", "Custom Logo Design", "Katalog Stock Polos", "Edit Order", "available", "stage", "Gagal update status"
- FileUpload: "Ready" badge
- MultiFileUpload: prompt text inconsistency

**P3 — Verbose/Non-standard (polish):**
- Dashboard: greeting subtitle, credit alert
- Login: button
- Users: page title/desc, modal title, role options, section name
- Products: modal titles, button label
- Mitras: page title/desc, section name, stat labels
- Finance: modal titles, labels
- Reports: filter labels, chart title
- AppQueue: subtitle, empty state
- CancellationsReturns: page desc, form subtitle, labels, section headers, table header
- CreateOrder: section title, upload label, empty state
- OrdersList: page title
- OrderDetail: card titles, labels (banyak)
- FileUpload/MultiFileUpload: sub-text

---

*COPY-AUDIT.md — Diproduksi pada Phase 12-01 (Audit)*
*Siap dieksekusi pada Plan 12-02 (Implementasi)*
