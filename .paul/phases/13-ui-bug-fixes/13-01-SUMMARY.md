---
phase: 13-ui-bug-fixes
plan: 01
subsystem: ui
tags: [react, tailwind, orders, sidebar, login, dashboard, mitra]

requires:
  - phase: 12-copywriting-audit
    provides: copy standar UI yang sudah diaudit

provides:
  - Bug fix: button "Lanjutkan" tidak muncul untuk mitra+draft
  - Bug fix: sidebar hanya satu item aktif di /orders/drafts
  - Copy fix: modal Ajukan Draft dengan teks pengajuan yang tepat
  - UI: dashboard labels "Monitor Pesanan Masuk" dan "Pesanan Terbaru"
  - UI: Tentang Sistem teks user-friendly
  - UI: Login heading centered, desktop fit viewport
  - UI: Modal Detail Info Mitra centered di desktop
  - Feature: Admin dapat edit harga satuan per item di mode edit pesanan

affects: []

tech-stack:
  added: []
  patterns:
    - "excludePrefix di NavLink links array untuk custom active state logic"
    - "isDraftSubmit flag untuk branching copy modal konfirmasi berdasarkan konteks"

key-files:
  modified:
    - src/pages/orders/OrderDetail.tsx
    - src/components/Layout.tsx
    - src/pages/Dashboard.tsx
    - src/pages/Login.tsx
    - src/pages/Mitras.tsx
    - src/pages/orders/CreateOrder.tsx

key-decisions:
  - "canAdvanceNormally() return false untuk draft — bukan role-check, karena mitra+draft sudah punya panel Ajukan Sekarang tersendiri"
  - "excludePrefix di links array daripada end prop — end tidak bisa exclude prefix, harus custom logic dengan location.pathname"
  - "lg:items-center lg:justify-center di Mitras modal — Framer Motion tetap pakai animasi x, positioning dihandle CSS breakpoint"

patterns-established:
  - "NavLink dengan excludePrefix: gunakan location.pathname.startsWith() untuk custom isActive daripada mengandalkan NavLink isActive prop"

duration: ~15min
started: 2026-05-26T00:00:00Z
completed: 2026-05-26T00:15:00Z
---

# Phase 13 Plan 01: UI Bug Fixes & Improvements Summary

**9 item diperbaiki: 2 bug perilaku (button mitra+draft, sidebar active), 1 copy fix modal, 4 copy/label UI, 1 layout fix login desktop, 1 feature edit harga satuan admin.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 menit |
| Tasks | 3/3 completed |
| Files modified | 6 |
| AC | 9/9 PASS |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Button "Lanjutkan" tidak muncul untuk mitra+draft | Pass | canAdvanceNormally() return false untuk draft |
| AC-2: Copy modal Ajukan Draft sesuai konteks pengajuan | Pass | isDraftSubmit flag — judul & pesan berbeda |
| AC-3: Sidebar aktif hanya satu item di /orders/drafts | Pass | excludePrefix + custom isActive logic |
| AC-4: Dashboard label grafik dan tabel | Pass | "Monitor Pesanan Masuk", "Pesanan Terbaru" |
| AC-5: Tentang Sistem user-friendly | Pass | Teks menjelaskan REMA untuk mitra & admin |
| AC-6: Modal Mitra desktop centered tanpa overflow | Pass | lg:items-center lg:justify-center + lg:max-h-[85vh] |
| AC-7: Login heading text-center | Pass | mb-10 text-center |
| AC-8: Login desktop fit viewport | Pass | h-screen + overflow-hidden + overflow-y-auto di panel |
| AC-9: Admin edit harga satuan di mode edit | Pass | Input Harga/Unit — admin/staff + id saja |

## Accomplishments

- Bug: Mitra tidak lagi melihat button "Lanjutkan ke Menunggu Konfirmasi" redundan saat membuka pesanan draft
- Bug: Sidebar mitra di `/orders/drafts` kini hanya aktif satu item (bukan dua sekaligus)
- Copy: Modal konfirmasi "Ajukan Draft" kini memakai teks pengajuan bukan teks generik ubah status
- UI: Label dashboard diperbarui menjadi lebih deskriptif dan kontekstual
- Feature: Admin dapat override harga satuan per item saat mengedit pesanan — input Harga/Unit muncul khusus admin/staff di mode edit

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/orders/OrderDetail.tsx` | Modified | Fix canAdvanceNormally() + isDraftSubmit modal copy |
| `src/components/Layout.tsx` | Modified | excludePrefix di links array + custom isActive NavLink |
| `src/pages/Dashboard.tsx` | Modified | Label "Monitor Pesanan Masuk", "Pesanan Terbaru", About text |
| `src/pages/Login.tsx` | Modified | h-screen, overflow-hidden, text-center heading, padding desktop |
| `src/pages/Mitras.tsx` | Modified | Modal lg:items-center lg:justify-center + lg:max-h-[85vh] |
| `src/pages/orders/CreateOrder.tsx` | Modified | Input Harga/Unit untuk admin/staff di mode edit |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| canAdvanceNormally() return false untuk draft | Mitra+draft punya panel Ajukan Sekarang tersendiri — button Lanjutkan jadi redundan dan membingungkan | Tidak ada perubahan alur logika, hanya visibilitas button |
| excludePrefix alih-alih `end` prop di NavLink | React Router `end` prop hanya bisa exact match — tidak bisa exclude prefix. Custom logic dengan location.pathname lebih presisi | Pola ini bisa dipakai untuk link lain yang butuh exclude sub-path |
| Framer Motion tetap pakai animasi x untuk Mitra modal | Framer tidak support CSS breakpoints natively — animasi slide-in dari kanan tetap terjadi di desktop tapi posisinya center via Tailwind. Tradeoff minor tapi acceptable | Animasi sedikit berbeda antara mobile dan desktop tapi tidak mengganggu UX |

## Deviations from Plan

None — plan dieksekusi sesuai spesifikasi.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Semua 9 item production bugs/improvements terselesaikan
- Aplikasi siap untuk usage production tanpa bug-bug UI yang ditemukan

**Concerns:**
- Modal Mitra animasi slide-in masih aktif di desktop karena Framer Motion tidak support CSS breakpoints — minor tradeoff, tidak perlu diperbaiki sekarang

**Blockers:**
- None

---
*Phase: 13-ui-bug-fixes, Plan: 01*
*Completed: 2026-05-26*
