---
phase: 24-order-priority
plan: 01
subsystem: api
tags: [express, drizzle, postgresql, priorities, quota]

requires:
  - phase: 23-finance-desktop-enterprise-polish
    provides: app stable post finance polish

provides:
  - Tabel order_priorities di Neon DB (id, orderId, mitraId, notes, createdAt, createdBy)
  - Field priorityLimit (integer, default 1) di tabel mitras
  - GET /api/priorities — active priorities joined orders+mitras, filter status confirmed/processing/pressing
  - POST /api/priorities — mitra only, quota check, duplikat check, ownership validation
  - DELETE /api/priorities/:id — mitra only, ownership check

affects:
  - src/pages/OrderPriorities.tsx (akan consume API ini di 24-02)
  - src/lib/api.ts (akan tambah priorities namespace di 24-02)

tech-stack:
  added: []
  patterns:
    - "ACTIVE_STATUSES const array + inArray() filter untuk status-gated queries"
    - "Quota check pattern: COUNT active join + compare >= limit → 403 QUOTA_EXCEEDED"
    - "AuthRequest type dari middleware/auth.ts untuk req.user typing"

key-files:
  created:
    - src/api/routes/priorities.ts
  modified:
    - src/db/schema.ts
    - src/api/index.ts

key-decisions:
  - "priorityLimit default = 1 (conservative default, admin bisa naikkan via mitra edit)"
  - "Quota check berbasis ACTIVE priorities (join orders WHERE status in ACTIVE_STATUSES), bukan total semua entries"
  - "Non-mitra (admin/staff/operational) view-only: POST dan DELETE return 403 FORBIDDEN"
  - "Duplikat check: orderId yang sama tidak bisa masuk dua kali ke daftar aktif"

patterns-established:
  - "QUOTA_EXCEEDED error response: { error, current, limit } — frontend pakai current+limit untuk display pesan"

duration: ~10min
started: 2026-05-27T00:00:00Z
completed: 2026-05-27T00:00:00Z
---

# Phase 24 Plan 01: Backend Order Priority — Summary

**Tabel `order_priorities` + field `priorityLimit` di mitras live di Neon DB; API GET/POST/DELETE /api/priorities dengan quota check dan role guard.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~10min |
| Tasks | 3 completed |
| Files modified | 3 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: GET returns active priorities | Pass | JOIN orders+mitras, filter ACTIVE_STATUSES, order by createdAt |
| AC-2: POST berhasil dalam kuota | Pass | Quota check: activeForMitra.length < priorityLimit |
| AC-3: POST ditolak kuota habis | Pass | Returns 403 { error: QUOTA_EXCEEDED, current, limit } |
| AC-4: POST ditolak non-mitra | Pass | role !== 'mitra' → 403 FORBIDDEN |
| AC-5: DELETE milik sendiri | Pass | Ownership check + delete + 204 |
| AC-6: DELETE milik mitra lain | Pass | entry.mitraId !== mitra.id → 403 FORBIDDEN |
| Lint | Pass | 0 errors |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/db/schema.ts` | Modified | +`priorityLimit` di mitras, +tabel `orderPriorities`, +type exports |
| `src/api/routes/priorities.ts` | Created | GET/POST/DELETE endpoints dengan semua business rules |
| `src/api/index.ts` | Modified | Register `/api/priorities` router |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `priorityLimit` default = 1 | Conservative default; admin bisa set lebih tinggi via mitra edit form |
| Quota berbasis active count | Join orders WHERE status in ACTIVE_STATUSES — slot terbuka otomatis saat order keluar dari range |
| `QUOTA_EXCEEDED` response berisi `current` + `limit` | Frontend butuh angka ini untuk pesan warning yang informatif |

## Deviations from Plan

### Auto-fixed Issues

**1. TypeScript — req.user typing**
- **Found during:** Task 2 lint check
- **Issue:** Route handler menggunakan `Request` biasa, tapi `req.user` hanya ada di `AuthRequest`
- **Fix:** Import `AuthRequest` dari `middleware/auth.ts`, ganti semua handler type
- **Verification:** `npm run lint` — 0 errors setelah fix

## Next Phase Readiness

**Ready:**
- `/api/priorities` endpoint live di Neon DB
- Quota logic berfungsi server-side
- `priorityLimit` field tersedia untuk diisi via form edit mitra (24-02)
- Frontend tinggal consume API dengan `api.priorities.list/create/remove`

**Concerns:**
- None

**Blockers:**
- None

---
*Phase: 24-order-priority, Plan: 01*
*Completed: 2026-05-27*
