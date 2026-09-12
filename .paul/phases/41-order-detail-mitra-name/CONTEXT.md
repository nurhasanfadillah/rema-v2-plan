# Phase Context

**Phase:** 41 — Order Detail: Tampilkan Nama Mitra di Header
**Generated:** 2026-09-13
**Status:** Ready for planning

## Goals

- Tampilkan **nama mitra pemilik pesanan** langsung di judul halaman `OrderDetail.tsx` sehingga konteks kepemilikan pesanan terlihat tanpa harus scroll ke section info mitra.
- Format inline: `{orderNumber} — {mitraName}` di baris `h1` header.
- Tampil untuk **semua role** (admin, staff, operational, mitra). Untuk role mitra, nama yang muncul = nama mitranya sendiri (konsisten, tidak ada special-casing).

## Approach

- Edit satu tempat di `src/pages/orders/OrderDetail.tsx:326-328` (blok `<h1>`):
  - Dari: `{order.orderNumber}`
  - Menjadi: `{order.orderNumber}{orderMitra ? ` — ${orderMitra.name}` : ''}`
- Data mitra **sudah tersedia** — variabel `orderMitra` sudah didefinisikan di line 69:
  ```ts
  const orderMitra = mitras.find(m => m.id === order.mitraId);
  ```
  Tidak perlu fetch tambahan, tidak perlu API baru.
- Styling `h1` tetap sama (`text-xl sm:text-2xl font-bold text-white tracking-tighter font-mono`).
- Jika nama mitra panjang → mengalir natural karena parent `<div className="space-y-1">` tidak ada `truncate`. Kalau di mobile bikin wrap 2 baris, itu OK (informasi lebih penting daripada single-line).

## Constraints

- **Scope sempit:** hanya edit 1 baris di `src/pages/orders/OrderDetail.tsx`.
- **Tidak menyentuh:**
  - PDF SPK (`src/components/orders/OrderSPKPDF.tsx`) — user eksplisit tidak mau.
  - Route/API (tidak ada perubahan schema, endpoint, atau data flow).
  - Halaman lain (Orders list, AppQueue, Reports, dll).
  - Format subline atas (`{tanggal} · {id}`) — tetap.
- **Tidak ada opsi hide-for-mitra:** semua role sama (per keputusan user).
- **Tidak ada breaking change:** kalau `orderMitra` undefined (data anomaly, seharusnya tidak terjadi karena mitraId FK), fallback ke tampilan tanpa nama mitra (sama seperti sebelum phase ini).

## Open Questions

- **Separator character:** em dash (`—` U+2014) atau en dash (`–` U+2013)?
  - Rekomendasi: em dash (`—`), konsisten dengan konvensi tipografi yang sudah dipakai di UI Indonesia lain.
- **Case handling nama mitra:** biarkan apa adanya (misal "PT Redone Berkah Mandiri Utama"), atau force uppercase seperti baris tanggal?
  - Rekomendasi: apa adanya. `h1` sudah kelihatan menonjol, tidak perlu uppercase.

## Additional Context

- **File utama:** `src/pages/orders/OrderDetail.tsx` (sekitar 600 baris). Perubahan di area header (line 320–329).
- **Struktur header sekarang:**
  ```
  ← [back button]  {tanggal} · {id 8-char}      [status badge]
                    {orderNumber}
  ```
- **Struktur setelah perubahan:**
  ```
  ← [back button]  {tanggal} · {id 8-char}      [status badge]
                    {orderNumber} — {mitraName}
  ```
- **Alasan pilih Opsi 2 (inline) dibanding baris baru:** header lebih compact, tidak menambah tinggi visual. Konteks pesanan-mitra terbaca satu baris.
- **Rationale skip PDF SPK:** PDF sudah ada section info mitra yang eksplisit — tidak ada gap konteks di PDF yang perlu ditutup.
- **Estimasi:** Quick-fix, 1 plan (pola mirip Phase 30, Phase 39, Phase 40). Implementasi ~5 menit + verify ~5 menit.

---

*This file is temporary. It informs planning but is not required.*
*Created by /paul:discuss, consumed by /paul:plan.*
