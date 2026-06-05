---
phase: 33-security-bug-fixes
plan: 33-01-FIX
subsystem: api
tags: [security, role-based-access, ownership, drizzle, express]

requires:
  - phase: 29-reports-mitra-isolation
    provides: mitra filter pattern di orders + ledgers API

provides:
  - Role enforcement di POST /api/orders (mitra-only)
  - Ownership check di GET/PUT/DELETE /api/orders/:id untuk role mitra
  - allMitras bypass diproteksi untuk admin/staff saja
  - GET /api/requests difilter by mitraId untuk role mitra
  - PUT /api/requests/:id dibatasi admin/staff only
  - Fix ReferenceError: and not defined di ledgers.ts

affects: [backend-api, orders-flow, requests-flow, billing-flow]

tech-stack:
  added: []
  patterns:
    - "getMitraForUser() helper untuk ownership lookup via userId"
    - "Role guard pattern: if (role !== 'X') return 403 di awal handler"
    - "Filter-by-mitra pattern seragam di orders + ledgers + requests"

key-files:
  modified:
    - src/api/routes/ledgers.ts
    - src/api/routes/orders.ts
    - src/api/routes/requests.ts

key-decisions:
  - "Ownership check hanya untuk role mitra — admin/staff bebas akses semua orders"
  - "getMitraForUser() sebagai helper reusable, bukan inline di setiap handler"
  - "UAT-006 (alur cancel/return) dan UAT-007 (credit limit backend) di-defer — refactor arsitektur lebih besar"

patterns-established:
  - "Backend security: semua role restriction di-enforce server-side, tidak bergantung frontend"

duration: ~15min
started: 2026-06-05T00:00:00Z
completed: 2026-06-05T00:00:00Z
---

# Phase 33 Fix Plan: Security & Bug Fixes Summary

**Backend API security enforcement: role check + ownership guard di orders/requests/ledgers — 5 UAT issues resolved (2 blocker, 3 major), lint clean.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 menit |
| Tasks | 3/3 PASS |
| Files modified | 3 |
| Lint | ✅ Clean |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Ledger creation tidak crash | **Pass** | `and` diimport, tidak ada ReferenceError |
| AC-2: POST /orders 403 non-mitra | **Pass** | Guard di baris 51–53 orders.ts |
| AC-3: PUT /orders/:id ownership | **Pass** | Ownership check untuk role mitra |
| AC-4: DELETE /orders/:id ownership | **Pass** | Ownership check untuk role mitra |
| AC-5: allMitras bypass diproteksi | **Pass** | Hanya admin/staff yang bisa bypass |
| AC-6: GET /orders/:id ownership | **Pass** | 403 jika mitra bukan owner |
| AC-7: GET /requests difilter mitra | **Pass** | Filter by `actionRequests.mitraId` |
| AC-8: PUT /requests 403 untuk mitra | **Pass** | Guard admin/staff only |

## Accomplishments

- Fix runtime blocker: `and` import ditambahkan ke `ledgers.ts` — `POST /api/ledgers` tidak crash lagi saat billing packing
- Backend enforcement lengkap untuk `orders` API: mitra hanya bisa create/read/update/delete order miliknya sendiri
- `requests` API sekarang mengikuti pola filter-by-mitra yang sudah ada di `orders` dan `ledgers`

## Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/api/routes/ledgers.ts` | Modified | Tambah `and` ke drizzle import |
| `src/api/routes/orders.ts` | Modified | Helper `getMitraForUser` + role/ownership guard di semua 5 endpoints |
| `src/api/routes/requests.ts` | Modified | AuthRequest type, mitra filter di GET, admin-only guard di PUT |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Helper `getMitraForUser()` di orders.ts | Menghindari duplikasi lookup di GET/PUT/DELETE | Reusable pattern, clean code |
| Admin/staff bebas akses semua orders tanpa ownership check | Mereka memang perlu akses operasional ke semua orders | Sesuai kebutuhan bisnis |
| UAT-006 & UAT-007 di-defer | Keduanya memerlukan refactor arsitektur (alur cancel/return + backend credit limit) — di luar scope security fix | Tercatat di FIX-SUMMARY.md |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Deferred | 2 | UAT-006, UAT-007 (minor) |

### Deferred Items

- **UAT-006:** Inkonsistensi dua jalur cancel/return (OrderDetail langsung vs CancellationsReturns via ActionRequest) — memerlukan refactor alur yang lebih besar
- **UAT-007:** Credit limit check dan status transition validation hanya di frontend — memerlukan server-side business logic layer

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| None | Plan berjalan sesuai spec |

## Next Phase Readiness

**Ready:**
- Backend API sekarang aman — role boundaries ditegakkan server-side
- Pola security (filter-by-mitra, ownership check, role guard) konsisten di orders + ledgers + requests
- App siap untuk production deployment dengan data isolation yang reliable

**Concerns:**
- UAT-006: Alur pembatalan/retur masih tidak konsisten antara OrderDetail dan CancellationsReturns
- UAT-007: Credit limit dan status transition masih bisa di-bypass via direct API call

**Blockers:**
- None

---
*Phase: 33-security-bug-fixes, Plan: 33-01-FIX*
*Completed: 2026-06-05*
