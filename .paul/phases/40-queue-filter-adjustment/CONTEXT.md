# Phase Context

**Phase:** 40 — Queue Filter Adjustment
**Generated:** 2026-09-13
**Status:** Ready for planning

## Goals

- Halaman **Antrian Produksi** (`/app-queue`) fokus hanya pada pesanan yang **sedang dalam antrian produksi aktif** — 4 status: `waiting_confirmation`, `confirmed`, `processing`, `pressing`.
- Status `packing` dikeluarkan karena sudah masuk fase billing/kirim (`isBilled = true`) — bukan lagi bagian antrian produksi aktif.
- Status `waiting_confirmation` ditambahkan supaya operator/admin bisa melihat pesanan yang belum dikonfirmasi ikut dalam antrian sejak awal.

## Approach

- Update filter status di `src/pages/AppQueue.tsx:22`:
  - Dari: `['confirmed', 'processing', 'pressing', 'packing']`
  - Menjadi: `['waiting_confirmation', 'confirmed', 'processing', 'pressing']`
- Update `pipelineStats` (4 cards) dengan label ringkas + urutan alur:

  | # | Status                  | Label         | Warna       |
  |---|-------------------------|---------------|-------------|
  | 1 | waiting_confirmation    | Menunggu      | amber       |
  | 2 | confirmed               | Dikonfirmasi  | biru        |
  | 3 | processing              | Diproses      | ungu        |
  | 4 | pressing                | Sablon        | pink/rose   |

- Update `getStatusBadge` specs: tambah entry `waiting_confirmation` (amber palette), hapus entry `packing`.
- Update `statusLeftBorder` (mobile card, line 144–149) dan `statusColor` (desktop table row, line 209–214):
  - Tambah `waiting_confirmation: 'border-l-amber-400'`
  - Hapus `packing: 'border-l-orange-400'`
- Icon untuk card Menunggu: pilih dari `lucide-react` (kandidat: `Hourglass`, `AlertCircle`, atau `Clock`) — putuskan saat plan.

## Constraints

- **Scope sempit:** hanya file `src/pages/AppQueue.tsx` (249 baris). Tidak ada perubahan schema, API, route, atau file lain.
- Header ringkasan (total Antrian + Volume) — tetap.
- Tabel desktop (kolom Waktu Masuk, Nomor Pesanan, Mitra, Volume, Posisi Produksi) — tetap.
- Mobile card layout — tetap.
- Sort order `createdAt` asc — tetap.
- Semua role yang bisa akses `/app-queue` sekarang tetap bisa akses (tidak boleh regresi).

## Open Questions

- **Icon untuk card "Menunggu":** kandidat `Hourglass` (paling representatif untuk waiting), `AlertCircle` (attention), atau `Clock` — putuskan saat plan.
- **Shade amber:** `amber-400` (mengikuti pattern `border-l-*-400` di file), `amber-650` (mengikuti pattern text-color di card), dsb. Selaraskan dengan konvensi warna existing di file.

## Additional Context

- **File utama:** `src/pages/AppQueue.tsx` (249 baris) — sudah punya struktur 4 pipeline cards + mobile card + desktop table, tinggal ganti status.
- **Konvensi label ringkas** adalah keputusan user eksplisit untuk grid card kompak — **bukan** mengikuti `STATUS_LABELS` OrderDetail (yang pakai "Menunggu Konfirmasi", "Proses Produksi", "Press Sablon"). Divergensi label ini ok karena konteks berbeda (card grid vs. dropdown/badge full).
- **Rationale exclude `packing`:** Per CLAUDE.md Order Lifecycle — orders reaching `packing` set `isBilled = true`. Artinya secara business logic sudah lepas dari antrian produksi ke fase billing.
- **Rationale include `waiting_confirmation`:** Operator perlu visibilitas terhadap pesanan yang baru masuk (belum di-confirm) supaya bisa dikejar approval-nya — bukan hanya lihat pesanan yang sudah di-confirm.
- **Referensi konvensi warna amber:** Reports.tsx (Phase 39) & OrderDetail.tsx sudah pakai amber palette untuk `waiting_confirmation`.
- **Estimasi:** Quick-fix, 1 plan (pola mirip Phase 39). Implementasi ~30 menit + verify ~5 menit.

---

*This file is temporary. It informs planning but is not required.*
*Created by /paul:discuss, consumed by /paul:plan.*
