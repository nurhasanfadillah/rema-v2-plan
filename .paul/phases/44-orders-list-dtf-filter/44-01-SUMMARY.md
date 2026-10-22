---
phase: 44-orders-list-dtf-filter
plan: 01
subsystem: ui
tags: [react, orders, filter, dtf, typescript]

requires:
  - phase: 43-billing-pdf-product-qty
    provides: konvensi modul fitur dari Phase 42 (folder + index.ts, kebab-case, named export, import type di fungsi murni)
provides:
  - Modul src/components/orders/dtf-filter/ — getOrderDtfCategory, filterOrdersByDtf, countOrdersByDtf, DtfFilterChips
  - Filter status cetak DTF (Semua DTF / Belum Cetak / Sudah Cetak / Tanpa DTF) di halaman Daftar Pesanan
affects: [orders]

tech-stack:
  added: []
  patterns: [roll-up status tingkat-item ke kategori tingkat-pesanan di fungsi murni yang teruji di Node, kontrol filter chip presentasional dengan state tetap di halaman]

key-files:
  created:
    - src/components/orders/dtf-filter/dtf-filter-types.ts
    - src/components/orders/dtf-filter/order-dtf-filter.ts
    - src/components/orders/dtf-filter/dtf-filter-chips.tsx
    - src/components/orders/dtf-filter/index.ts
  modified:
    - src/pages/orders/OrdersList.tsx

key-decisions:
  - "Kategori DTF per pesanan: Belum Cetak (≥1 item custom belum dicetak, termasuk parsial) / Sudah Cetak / Tanpa DTF"
  - "Aturan 'belum cetak' sama persis dengan guard Press Sablon di OrderDetail"
  - "Kontrol berupa chip satu baris, bukan dropdown + bottom sheet kedua"
  - "Hitungan chip = lingkup role + filter status terpilih, tanpa pencarian"

patterns-established:
  - "Status tingkat-item di-roll-up ke kategori tingkat-pesanan di fungsi murni; ekspresi aturan dipakai ulang persis dari guard yang sudah ada agar filter dan guard tidak pernah berbeda"
  - "Modul filter halaman: fungsi murni + komponen presentasional di modul, state filter tetap di halaman"

duration: 26min
started: 2026-10-22T17:51:58Z
completed: 2026-10-22T18:18:00Z
description: "Daftar Pesanan: filter status cetak DTF berbentuk chip (Semua DTF / Belum Cetak / Sudah Cetak / Tanpa DTF) dengan jumlah pesanan, berkombinasi dengan filter status dan pencarian"
type: Summary
about: "rema-v2.1"
---

# Phase 44 Plan 01: Filter Status Cetak DTF di Daftar Pesanan Summary

**Daftar Pesanan (`/orders`) kini punya baris chip "Semua DTF · Belum Cetak · Sudah Cetak · Tanpa DTF" dengan jumlah pesanan, berkombinasi (AND) dengan filter status dan pencarian; kategori per pesanan dihitung di fungsi murni yang memakai aturan "belum cetak" persis seperti guard Press Sablon dan teruji 10 kasus di Node.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~26 menit (plan dibuat → UNIFY; termasuk waktu tunggu checkpoint user) |
| Started | 2026-10-22T17:51:58Z (plan dibuat) |
| Completed | 2026-10-22T18:18:00Z |
| Tasks | 2 auto + 1 checkpoint selesai |
| Files modified | 5 (4 baru, 1 diubah: `OrdersList.tsx` +20/−0) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Pengelompokan DTF per pesanan | Pass | 10/10 kasus uji Node: items kosong, semua polos, custom `belum_cetak`, custom `null`/`undefined`/kosong (data lama), semua `sudah_cetak`, parsial, custom `sudah_cetak` + polos, polos dengan `dtfStatus` nyasar diabaikan; Belum + Sudah + Tanpa = jumlah pesanan. |
| AC-2: Chip filter tampil di Daftar Pesanan | Pass | Kode: `role="group"` + `aria-label="Filter status cetak DTF"`, `aria-pressed` per chip, `flex flex-wrap`, chip aktif biru, dirender di dalam fragment `!isDraftPage` (tersembunyi di `/orders/drafts`). Disetujui user di checkpoint ("sudah sesuai"). |
| AC-3: Penyaringan dan kombinasi dengan filter lain | Pass | Kode: filter DTF diterapkan setelah filter status dan sebelum pencarian (irisan AND), `setCurrentPage(1)` pada `onChange`, `dtfCounts` dihitung dari daftar role yang dipersempit ke status terpilih tanpa pencarian. Disetujui user di checkpoint. |
| AC-4: Tanpa regresi | Pass | `git diff --numstat`: `OrdersList.tsx` +20/−0 (hanya penambahan); tidak ada perubahan di `src/api`, `src/db`, `src/types.ts`, `OrderDetail.tsx`. Disetujui user di checkpoint. |

Checkpoint Task 3 (human-verify) disetujui user ("sudah sesuai") tanpa temuan yang dilaporkan. Catatan: pengecekan otomatis oleh Claude di panel Browser tidak berjalan (tab belum punya sesi login), sehingga bukti perilaku di layar untuk AC-2 sampai AC-4 berasal dari verifikasi manual user, bukan dari bukti otomatis.

## Verification Results

| Check | Hasil |
|-------|-------|
| `npm run lint` (`tsc --noEmit`) | exit 0 — setelah Task 1 dan setelah Task 2 |
| `npm run build` | exit 0 (built in 9,55 dtk); peringatan chunk >500 kB (`vendor-pdf`, `index`) sudah ada sebelumnya |
| Kasus uji fungsi murni (Node 25.6, `--experimental-transform-types`, script sementara di luar repo) | 10/10 lulus; script dihapus setelah dipakai |
| `git diff --numstat` | `OrdersList.tsx` 20 tambah / 0 hapus: 2 import, 1 state, hitungan chip + penyaringan, 1 elemen `<DtfFilterChips />` |
| Pemeriksaan modul | Tanpa `any` dan `export default`; `OrdersList.tsx` mengimpor modul hanya lewat `index.ts` |
| Server dev | API :3001 dan Vite :3000 menyala normal; keduanya dimatikan setelah verifikasi |
| `git status` | Hanya 5 file di `files_modified` + artefak `.paul/` |

## Accomplishments

- `getOrderDtfCategory` meng-roll-up status DTF item ke satu kategori per pesanan memakai ekspresi yang sama persis dengan guard Press Sablon (`OrderDetail.tsx:100`), termasuk `null`/kosong pada data lama — filter dan guard tidak akan pernah berbeda.
- `DtfFilterChips` (ikon Printer + 4 chip berjumlah, `aria-pressed`) bersifat presentasional; semua angka datang dari `countOrdersByDtf`, penyaringan dari `filterOrdersByDtf`.
- Penyambungan di `OrdersList.tsx` minimal dan aditif; KPI, filter status (select desktop + bottom sheet mobile), pencarian, paginasi, dan badge "DTF" tidak berubah.

## Task Commits

Tidak ada commit per task — seluruh perubahan di-commit pada transisi phase (`feat(44): ...`), sesuai pola phase sebelumnya. Hash tercatat di STATE.md (Git State).

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/components/orders/dtf-filter/dtf-filter-types.ts` | Created (5 baris) | Tipe `OrderDtfCategory`, `DtfFilterValue`, `DtfFilterCounts` |
| `src/components/orders/dtf-filter/order-dtf-filter.ts` | Created (25 baris) | Fungsi murni `getOrderDtfCategory`, `filterOrdersByDtf`, `countOrdersByDtf` (hanya `import type`) |
| `src/components/orders/dtf-filter/dtf-filter-chips.tsx` | Created (46 baris) | Komponen presentasional `DtfFilterChips` |
| `src/components/orders/dtf-filter/index.ts` | Created (4 baris) | Public API modul |
| `src/pages/orders/OrdersList.tsx` | Modified (+20/−0, kini 599 baris) | Import modul, state `dtfFilter`, hitungan chip + penyaringan, elemen `<DtfFilterChips />` |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Kategori DTF per pesanan: Belum Cetak (≥1 item custom belum dicetak, termasuk parsial) / Sudah Cetak / Tanpa DTF | Pilihan user; sama dengan definisi "DTF belum siap" di OrderDetail | Pesanan parsial muncul di Belum Cetak; setiap pesanan tepat satu kategori |
| Sumber kebenaran `items[].isCustomLogo`, bukan `order.hasCustomLogo` | Flag level pesanan bisa tak sinkron dengan item; guard OrderDetail memakai level item | Filter konsisten dengan guard Press Sablon |
| Kontrol berupa chip satu baris, bukan dropdown + bottom sheet kedua | Kode filter status yang ada tidak perlu disentuh; layout sama untuk mobile dan desktop | `OrdersList.tsx` hanya bertambah 20 baris |
| Hitungan chip = lingkup role + filter status terpilih, tanpa pencarian | Belum + Sudah + Tanpa = Semua DTF; selaras dengan hitungan status yang juga tidak memperhitungkan pencarian | Chip menjelaskan hasil 0 saat dikombinasi dengan status |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Scope additions | 0 | — |
| Deferred | 3 | Dicatat ke STATE.md → Deferred Issues (sudah diumumkan di plan, bukan temuan baru) |

**Total impact:** None — plan executed exactly as written. Pilihan implementasi dalam ruang lingkup plan: `import type` terpisah untuk `DtfFilterValue`, dan komentar singkat di atas aturan DTF dan hitungan chip.

### Deferred Items

- Badge "DTF" lama di Daftar Pesanan menyala bila ≥1 item `sudah_cetak`, sehingga pesanan parsial menampilkan badge itu sekaligus masuk filter "Belum Cetak" (Task 2 / SCOPE LIMITS plan).
- `React.useEffect` setelah `if (!user) return null` di `OrdersList.tsx` (pelanggaran aturan hooks yang sudah ada sebelum phase ini; tidak diperbaiki).
- Hitungan opsi filter status belum memperhitungkan filter DTF (memilih "Belum Cetak" lalu status "Press Sablon" bisa menghasilkan 0 walau opsi menampilkan angka > 0).

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Cek otomatis di panel Browser tidak bisa berjalan: tab tanpa sesi login (`localStorage` dan `sessionStorage` kosong); pesan "sudah login" berasal dari tombol cepat yang terkirim sebelum login | Kredensial tidak diisi oleh Claude; user memverifikasi manual di browser sendiri dan menyetujui checkpoint |

## Next Phase Readiness

**Ready:**
- `getOrderDtfCategory` / `filterOrdersByDtf` / `countOrdersByDtf` dapat dipakai ulang (mis. badge di daftar, filter DTF di Antrian Produksi) tanpa mengubah aturan.

**Concerns:**
- Tiga Deferred Issues di atas (badge vs kategori filter, hitungan status vs filter DTF, hook setelah early return).
- `OrdersList.tsx` kini 599 baris dengan JSX inline besar — kandidat ekstraksi (mis. bottom sheet filter status) bila filter bertambah.

**Blockers:**
- None

---
*Phase: 44-orders-list-dtf-filter, Plan: 01*
*Completed: 2026-10-23*
