# Fix Summary: 33-01-FIX

**Executed:** 2026-06-05  
**Plan:** `.paul/phases/33-security-bug-fixes/33-01-FIX.md`  
**Status:** ✅ Complete — 3/3 tasks PASS

---

## Files Modified

### `src/api/routes/ledgers.ts`
- Tambah `and` ke import drizzle-orm (baris 2)
- Fix: `ReferenceError: and is not defined` saat `POST /api/ledgers` dengan `source='order'`

### `src/api/routes/orders.ts`
- Tambah helper `getMitraForUser()` untuk ownership lookup
- `GET /` — `allMitras=true` bypass hanya berlaku untuk admin/staff
- `GET /:id` — ownership check: mitra hanya bisa akses order miliknya
- `POST /` — role guard: hanya mitra yang bisa membuat pesanan
- `PUT /:id` — ownership check untuk role mitra
- `DELETE /:id` — ownership check untuk role mitra

### `src/api/routes/requests.ts`
- Ganti `Request` ke `AuthRequest` agar akses `req.user`
- Tambah import `mitras` dari schema
- `GET /` — filter by mitraId untuk role mitra
- `PUT /:id` — role guard: hanya admin/staff yang bisa update

---

## UAT Issues Resolved

| ID | Severity | Status |
|----|----------|--------|
| UAT-001 | Blocker | ✅ Fixed — `and` import ditambahkan |
| UAT-002 | Blocker | ✅ Fixed — role + ownership check di semua orders endpoints |
| UAT-003 | Major | ✅ Fixed — `allMitras` bypass diproteksi |
| UAT-004 | Major | ✅ Fixed — ownership check di `GET /orders/:id` |
| UAT-005 | Major | ✅ Fixed — requests GET difilter, PUT diproteksi |
| UAT-006 | Minor | ⏸ Deferred — inkonsistensi alur cancel/return (refactor arsitektur) |
| UAT-007 | Minor | ⏸ Deferred — credit limit & status validation di frontend |

---

## Lint
- `npm run lint` — ✅ Clean (0 TypeScript errors)

---

## Deferred Issues
UAT-006 dan UAT-007 adalah perubahan arsitektur yang lebih besar, di-defer ke fase terpisah jika diperlukan.
