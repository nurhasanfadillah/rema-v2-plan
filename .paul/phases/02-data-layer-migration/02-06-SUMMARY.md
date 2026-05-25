---
phase: 02-data-layer-migration
plan: 06
subsystem: ui
tags: [api-client, crud, async, mitras, cancellations, returns, ledgers]

requires:
  - phase: 02-data-layer-migration (Plan 02)
    provides: src/lib/api.ts dengan semua typed methods

provides:
  - Mitras.tsx — full async CRUD via api.mitras.* + api.auditLogs.*
  - CancellationsReturns.tsx — full async via api.orders.* + api.ledgers.* + api.requests.*
  - DELETE /api/mitras/:id dengan 4-layer server-side validation + permanent delete + linked user cascade
  - DELETE /api/ledgers/order/:orderId — rollback billing entries terkait satu pesanan
  - api.ledgers.removeByOrder() di src/lib/api.ts
  - GET /api/ledgers — mitraId sekarang opsional (sebelumnya wajib, menyebabkan 400)

affects: [02-data-layer-migration Plan 07+]

tech-stack:
  added: []
  patterns:
    - "4-layer 409 delete guard di server — orders → ledgers → actionRequests → get mitra → delete mitra → delete user"
    - "DELETE mitra sebelum DELETE user (karena mitras.userId FK ke users.id)"
    - "GET /ledgers optional mitraId: jika ada filter by mitra, jika tidak return semua"
    - "api.ledgers.removeByOrder(orderId) — targeted delete by referenceId + source=order"
    - "CancellationsReturns: requests state via useEffect, bukan db.getRequests() inline di render"

key-files:
  created: []
  modified:
    - src/pages/Mitras.tsx
    - src/pages/CancellationsReturns.tsx
    - src/api/routes/mitras.ts
    - src/api/routes/ledgers.ts
    - src/lib/api.ts

key-decisions:
  - "DELETE /mitras/:id jadi permanent delete (bukan set isArchived=true seperti sebelumnya) — karena handleDelete di UI memang bermaksud hapus permanen"
  - "Delete order: mitra dulu, baru user (FK constraint: mitras.userId → users.id)"
  - "ledgers GET tanpa mitraId return semua — dibutuhkan Mitras.tsx untuk getMitraStats lintas semua mitra"
  - "Requests state di CancellationsReturns — load saat mount, update lokal setelah create, bukan re-fetch"

patterns-established:
  - "Server-side cascade delete: hapus child (mitra) sebelum parent (user) karena FK constraint"
  - "Optional query param di GET route: if (mitraId) filter, else return all"

duration: ~15min
started: 2026-05-25T02:00:00Z
completed: 2026-05-25T02:15:00Z
---

# Phase 2 Plan 06: Mitras.tsx + CancellationsReturns.tsx Migration Summary

**Mitras.tsx dan CancellationsReturns.tsx dimigrasikan ke async API; DELETE /api/mitras/:id diubah menjadi permanent delete dengan 4-layer 409 validation; DELETE /api/ledgers/order/:orderId ditambah untuk rollback billing saat pembatalan/retur.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 min |
| Tasks | 2 completed |
| Files modified | 5 |
| TypeScript errors | 0 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Mitras.tsx bebas dari db.* | Pass | Zero db.* references, semua via api.* + useEffect load |
| AC-2: DELETE /api/mitras/:id 4-layer validation | Pass | orders→ledgers→actionRequests→get mitra→delete mitra→delete user |
| AC-3: CancellationsReturns.tsx bebas dari db.* | Pass | Zero db.* references, requests state via useEffect |
| AC-4: TypeScript zero errors | Pass | npx tsc --noEmit clean |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/Mitras.tsx` | Modified | useEffect load 4 states, 4 async handlers via api.* |
| `src/pages/CancellationsReturns.tsx` | Modified | useEffect load 3 states, handleSubmit async multi-step |
| `src/api/routes/mitras.ts` | Modified | DELETE: 4-layer 409 + permanent delete + user cascade |
| `src/api/routes/ledgers.ts` | Modified | GET optional mitraId + DELETE /order/:orderId |
| `src/lib/api.ts` | Modified | api.ledgers.removeByOrder() added |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| DELETE /mitras/:id jadi hard delete | UI `handleDelete` bermaksud hapus permanen, bukan archive (archive punya endpoint PUT sendiri) | Mitra + linked user terhapus dari DB jika bersih |
| Delete mitra sebelum user | `mitras.userId` FK ke `users.id` — delete user dulu akan violate FK | Urutan: delete mitra → delete user |
| GET /ledgers tanpa mandatory mitraId | Mitras.tsx butuh semua ledger untuk getMitraStats lintas semua mitra | Endpoint lebih fleksibel, backward-compatible |
| requests state di CancellationsReturns | `db.getRequests().find()` dipanggil inline di render (2 tempat) — harus diganti dengan state | `requests` di-load saat mount, update lokal setelah `api.requests.create` |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Scope additions | 0 | — |
| Deferred | 0 | — |

None — plan dieksekusi sesuai spesifikasi.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| None | — |

## Next Phase Readiness

**Ready:**
- DELETE /api/mitras/:id pattern dengan cascade delete bisa dicontoh
- api.ledgers.removeByOrder() siap dipakai jika Finance.tsx butuh ledger rollback
- 4 file tersisa: Finance.tsx + orders/OrdersList.tsx + orders/CreateOrder.tsx + orders/OrderDetail.tsx

**Concerns:**
- Finance.tsx (825L, 20 db.*) — paling kompleks karena ledger entries + payment records
- orders/* (3 file, ~1600L total) — paling kompleks karena CreateOrder/OrderDetail multi-item logic

**Blockers:**
- None — Plan 02-07 bisa dimulai
