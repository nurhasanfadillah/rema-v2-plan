---
phase: 02-data-layer-migration
plan: 04
subsystem: ui
tags: [api-client, crud, delete-endpoint, async, products, appqueue]

requires:
  - phase: 02-data-layer-migration (Plan 02)
    provides: src/lib/api.ts dengan semua typed methods

provides:
  - AppQueue.tsx — async load orders/mitras via api.orders.list + api.mitras.list
  - Products.tsx — full CRUD via api.products.* (list/create/update/remove)
  - DELETE /api/products/:id endpoint dengan server-side order_items validation
  - api.products.remove() method di src/lib/api.ts

affects: [02-data-layer-migration Plan 05+]

tech-stack:
  added: []
  patterns:
    - "DELETE endpoint dengan server-side validasi: cek order_items sebelum delete, return 409 jika ada"
    - "api.products.create signature: Omit<Product,'id'> & { id?: string } — support client-generated ID"
    - "handleSave async: isExisting check via products.some() untuk route create vs update"

key-files:
  created: []
  modified:
    - src/pages/AppQueue.tsx
    - src/pages/Products.tsx
    - src/api/routes/products.ts
    - src/lib/api.ts

key-decisions:
  - "api.products.create signature diubah dari Omit<Product,'id'> ke Omit<Product,'id'> & {id?:string} karena ProductModal generate ID client-side"
  - "Validasi delete product dipindah ke server (409 jika dipakai di order_items) — lebih robust dari client-side check"

patterns-established:
  - "Server-side 409 delete guard: cek foreign key usage sebelum delete, return conflict dengan pesan actionable"
  - "handleDelete tanpa client-side pre-validation: cukup try/catch api.*.remove(), server yang reject"

duration: ~15min
started: 2026-05-25T01:00:00Z
completed: 2026-05-25T01:15:00Z
---

# Phase 2 Plan 04: AppQueue + Products Migration Summary

**AppQueue (read-only) dan Products (full CRUD) dimigrasikan dari localStorage ke API; DELETE /products/:id endpoint ditambah dengan server-side order validation.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 min |
| Tasks | 2 completed |
| Files modified | 4 |
| TypeScript errors | 0 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: AppQueue tidak ada db.* | Pass | useState + useEffect sebelum early return |
| AC-2: Products tidak ada db.* | Pass | Semua handler async via api.products.* |
| AC-3: DELETE endpoint + 409 validation | Pass | router.delete + orderItems check |
| AC-4: TypeScript zero errors | Pass | npx tsc --noEmit clean |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/AppQueue.tsx` | Modified | useState + useEffect fetch orders/mitras; hooks sebelum early return |
| `src/pages/Products.tsx` | Modified | Async CRUD handlers, useState([]) + useEffect load |
| `src/api/routes/products.ts` | Modified | Tambah DELETE /:id dengan orderItems check (409 jika dipakai) |
| `src/lib/api.ts` | Modified | Tambah api.products.remove(); update create signature |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| api.products.create signature: `& { id?: string }` | ProductModal generate ID client-side sebelum panggil onSave — perlu forward ke server | Server tetap generate jika tidak ada; client bisa pass ID sendiri |
| Validasi delete pindah ke server (409) | Lebih robust: tidak perlu load orders ke client dulu; error message dari server langsung ke toast | handleDelete lebih sederhana, no pre-flight data loading |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Minor — type signature tweak |
| Scope additions | 0 | — |
| Deferred | 0 | — |

### Auto-fixed Issues

**1. Type mismatch — api.products.create tidak accept id**
- **Found during:** Task 2 (Products migration)
- **Issue:** `api.products.create` bertipe `Omit<Product,'id'>` tapi ProductModal pass full Product dengan id
- **Fix:** Ubah signature ke `Omit<Product,'id'> & { id?: string }` — server sudah handle `if (!body.id) body.id = crypto.randomUUID()`
- **Files:** `src/lib/api.ts`
- **Verification:** npx tsc --noEmit clean

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| AppQueue: db.getOrders/getMitras dipanggil setelah `if (!user) return null` — tidak bisa langsung jadi useEffect | Rename state ke `allOrders`, filter setelah state tersedia; hooks tetap sebelum early return |

## Next Phase Readiness

**Ready:**
- Pattern CRUD migration sudah complete: list (GET) + create (POST) + update (PUT) + delete (DELETE)
- DELETE endpoint pattern dengan server-side validation bisa direplikasi ke mitras, users jika perlu
- 7 file tersisa: Users, Mitras, Finance, CancellationsReturns, orders x3

**Concerns:**
- Users.tsx paling kompleks (568 baris, cross-entity: users+mitras+orders+ledgers) — perlu plan sendiri
- orders/ subdirectory (3 file) — CreateOrder dan OrderDetail punya mutasi kompleks

**Blockers:**
- None — Plan 02-05 bisa dimulai
