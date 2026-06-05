---
phase: 34-cancellation-return-approval
plan: 02
subsystem: ui
tags: [react, action-request, approval-workflow, cancellation, return]

requires:
  - phase: 34-01
    provides: Backend enforcement — requests.ts approve/reject side effects, orders.ts protection

provides:
  - UI approval workflow: form submit → pending ActionRequest → admin approve/reject
  - Pending panel di halaman Pembatalan & Retur dengan role-aware tombol
  - RequestStatus type extended dengan 'pending'

affects: [phase-35, AppQueue, OrderDetail]

tech-stack:
  added: []
  patterns:
    - "Optimistic local state update setelah approve/reject tanpa reload"
    - "canApprove flag untuk conditional render tombol berdasarkan role"

key-files:
  modified:
    - src/pages/CancellationsReturns.tsx
    - src/types.ts

key-decisions:
  - "Tambah 'pending' ke RequestStatus union di types.ts — backend sudah support tapi frontend type belum ada"
  - "handleApprove update local orders state langsung (optimistic) — tidak perlu reload"

patterns-established:
  - "Submit form → buat pending request → approval flow (bukan eksekusi langsung)"

duration: ~15min
started: 2026-06-05T00:00:00Z
completed: 2026-06-05T00:00:00Z
---

# Phase 34 Plan 02: Redesign UI Pembatalan & Retur — Approval Flow

**Form submit sekarang membuat pending ActionRequest; admin/staff approve/reject via panel baru di halaman yang sama.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 min |
| Tasks | 2/2 completed + checkpoint approved |
| Files modified | 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Submit form buat pending ActionRequest | Pass | `handleSubmit` hanya call `api.requests.create` dengan `status: 'pending'` |
| AC-2: Admin/staff lihat pending dengan tombol approve/reject | Pass | `canApprove` flag + tombol Setujui/Tolak di pending panel |
| AC-3: Approve → hilang dari pending, order berubah | Pass | `handleApprove` update orders state `newOrderStatus` |
| AC-4: Reject → hilang dari pending, order tidak berubah | Pass | `handleReject` hanya update requests state |
| AC-5: Mitra hanya lihat pending miliknya read-only | Pass | Backend filter + badge "Menunggu" untuk non-canApprove |

## Accomplishments

- `handleSubmit` tidak lagi mengeksekusi cancel/return langsung — hanya membuat pending request
- Section "Menunggu Persetujuan" muncul secara kondisional jika ada pending requests
- Role-aware UI: admin/staff punya tombol, mitra hanya badge status
- Checkpoint human-verify: approved ✓

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/CancellationsReturns.tsx` | Modified | Redesign handleSubmit + pending panel + approve/reject handlers |
| `src/types.ts` | Modified | Tambah `'pending'` ke `RequestStatus` union |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Tambah `'pending'` ke `RequestStatus` | Backend 34-01 sudah support `pending` tapi frontend type belum → lint error | Konsisten antara DB schema dan frontend types |
| Optimistic local state di handleApprove | Update `orders` local state langsung setelah approve — tidak perlu reload halaman | UX responsif, data sinkron tanpa round-trip |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Scope additions | 1 | Minor — type fix esensial |
| Deferred | 0 | — |

**Total impact:** Scope addition minimal — fix type yang seharusnya sudah ada sejak Phase 34-01.

### Scope Additions

**1. `src/types.ts` — tambah 'pending' ke RequestStatus**
- **Found during:** Task 1 (lint check)
- **Issue:** `status: 'pending'` tidak assignable ke `RequestStatus` — type hanya punya `'submitted' | 'reviewed' | 'approved' | 'rejected' | 'resolved' | 'cancelled'`
- **Fix:** Tambah `'pending'` ke union
- **Files:** `src/types.ts`
- **Verification:** `npm run lint` — 0 errors

## Next Phase Readiness

**Ready:**
- Alur pengajuan → approval berfungsi end-to-end
- Backend (34-01) + Frontend (34-02) konsisten
- Phase 34 complete — milestone Cancellation & Return Approval Workflow selesai

**Concerns:**
- Tidak ada fitur "tarik kembali" (withdraw) pengajuan pending — diputuskan di-defer di boundaries plan
- Mitra tidak mendapat notifikasi saat request approved/rejected (harus reload manual)

**Blockers:**
- None

---
*Phase: 34-cancellation-return-approval, Plan: 02*
*Completed: 2026-06-05*
