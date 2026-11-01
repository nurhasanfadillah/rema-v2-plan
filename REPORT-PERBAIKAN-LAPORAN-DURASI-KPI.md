# Laporan Pengerjaan: Laporan Durasi dan KPI Pesanan

## Ringkasan

Laporan waktu proses pesanan diperbaiki agar durasi dihitung konsisten berdasarkan tanggal kalender, hasil KPI mengikuti filter aktif, dan ekspor PDF mudah dibaca serta memuat informasi SLA.

## Perubahan

- Durasi dihitung sebagai selisih tanggal kalender zona waktu Asia/Jakarta dan dibulatkan ke atas dengan minimum satu hari.
- Pesanan dikelompokkan menurut total qty: Mikro (1), Sangat kecil (2–10), Kecil (11–50), Menengah (51–100), Besar (101–250), Partai besar (251–500), Partai sangat besar (501–1.000), dan Mass production (>1.000).
- Penilaian KPI: Excellent bila durasi sampai target; Perlu evaluasi bila melebihi target tetapi masih sampai batas toleransi; Tidak memenuhi KPI bila melewati batas toleransi.
- Ringkasan jumlah pesanan per status dan kategori dihitung di server untuk seluruh data filter, bukan hanya baris halaman aktif.
- Halaman laporan menampilkan ringkasan KPI dan tabel standar SLA, serta status KPI per pesanan.
- Ekspor PDF mengelompokkan pesanan ke tabel Excellent, Perlu Evaluasi, dan Tidak memenuhi KPI. Setiap tabel memiliki warna header hijau, kuning, atau merah serta kolom Tanggal, No. Pesanan, Mitra, Total Qty, dan Durasi.
- PDF menyertakan informasi target dan batas toleransi SLA serta catatan bahwa angka SLA merupakan usulan awal dan hari menggunakan hari kalender.

## Berkas yang berubah

- `src/api/routes/orders.ts` — perhitungan durasi, klasifikasi KPI, dan agregasi ringkasan server.
- `src/lib/api.ts` — tipe respons laporan durasi dan KPI.
- `src/pages/Reports.tsx` — ringkasan KPI, standar SLA, filter, dan status pada tabel laporan.
- `src/components/reports/ProcessingTimeReportPDF.tsx` — kelompok tabel, format kolom, warna header, dan tabel SLA pada PDF.

## Pemeriksaan

- `git diff --check` — berhasil.
- `npm run lint` — berhasil (`tsc --noEmit`).

## Catatan

SLA adalah usulan awal berdasarkan pola laporan Oktober 2026, bukan standar capaian yang telah divalidasi. Pesanan custom kompleks, pengadaan material, atau proses khusus memerlukan SLA tersendiri.
