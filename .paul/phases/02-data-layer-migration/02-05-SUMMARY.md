---
phase: 02-data-layer-migration
plan: 05
subsystem: ui
tags: [api-client, crud, delete-endpoint, async, users, mitras, safeuser]

requires:
  - phase: 02-data-layer-migration (Plan 02)
    provides: src/lib/api.ts dengan semua typed methods

provides:
  - Users.tsx — full async CRUD via api.users.* dan api.mitras.*
  - DELETE /api/users/:id dengan 4-layer server-side validation
  - api.users.remove() di src/lib/api.ts
  - SafeUser type pattern untuk halaman yang butuh user data tanpa passwordHash

affects: [02-data-layer-migration Plan 06+]

tech-stack:
  added: []
  patterns:
    - "SafeUser = Omit<User,'passwordHash'> — didefinisikan lokal di komponen yang butuhnya"
    - "DELETE endpoint multi-step validation: self-guard → audit trail → mitra deps → cascade delete"
    - "mitras state di Users.tsx untuk auto-create mitra saat role berubah ke mitra"
    - "AddUserModal async + onAddMitra callback — parent tetap owner of state"
    - "api.users.create signature: id? opsional (pattern konsisten dengan products)"

key-files:
  created: []
  modified:
    - src/pages/Users.tsx
    - src/api/routes/users.ts
    - src/lib/api.ts

key-decisions:
  - "api.users.create: tambah id? opsional — konsisten dengan products pattern (server fallback ke randomUUID)"
  - "handleDelete validasi pindah ke server (409) — hapus 40+ baris pre-flight client-side checks"
  - "handleResetPassword: pakai newPassword API (bcrypt di server) bukan plaintext passwordHash di localStorage"
  - "UserDetailPanel phone check: pakai allUsers prop dari parent state, bukan db.getUsers()"

patterns-established:
  - "Server-side 409 guard pattern untuk delete — reject dengan pesan actionable, client cukup toast.error(err.message)"
  - "Multi-resource state di satu halaman: users + mitras di-load parallel di useEffect"

duration: ~20min
started: 2026-05-25T01:15:00Z
completed: 2026-05-25T01:35:00Z
---

# Phase 2 Plan 05: Users.tsx Migration Summary

**Users.tsx (568 baris, 5 handler mutasi, cross-entity) dimigrasikan ke async API; DELETE /api/users/:id ditambah dengan 4-layer server-side validation termasuk audit trail check dan mitra cascade delete.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Tasks | 2 completed |
| Files modified | 3 |
| TypeScript errors | 0 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Users.tsx tidak ada db.* | Pass | Zero db.* references, semua via api.* |
| AC-2: DELETE endpoint 4-layer validation | Pass | self-guard(403), audit(409), mitra deps(409), cascade delete |
| AC-3: Reset password via bcrypt | Pass | api.users.update({newPassword}) → server bcrypt hash |
| AC-4: TypeScript zero errors | Pass | npx tsc --noEmit clean |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/Users.tsx` | Modified | SafeUser types, 5 async handlers, mitras state, AddUserModal/UserDetailPanel refactor |
| `src/api/routes/users.ts` | Modified | DELETE /:id dengan full validation chain |
| `src/lib/api.ts` | Modified | api.users.remove(); api.users.create id? opsional |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| api.users.create: `id?` opsional | Konsisten dengan products pattern; server fallback ke randomUUID | Client bisa pass ID atau biarkan server generate |
| Validasi delete pindah ke server | Hapus 40+ baris pre-flight client-side db calls; server lebih authoritative | handleDelete jadi 15 baris, 409 message langsung ke toast |
| handleResetPassword via newPassword | localStorage simpan 'rema1234' sebagai plaintext — fix security issue | Server bcrypt-hash password reset |
| allUsers prop ke UserDetailPanel | Phone uniqueness check butuh users list; pass dari parent state bukan db.getUsers() | Panel tidak perlu akses db, separation of concerns terjaga |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Minor — type signature tweak |
| Scope additions | 0 | — |
| Deferred | 0 | — |

### Auto-fixed Issues

**1. api.users.create type tidak accept id**
- **Found during:** Task 2 (AddUserModal migration)
- **Issue:** Type `Omit<User,'id'|'passwordHash'>` tidak allow `id` — tapi AddUserModal generate id client-side
- **Fix:** Tambah `id?: string` ke type (konsisten dengan products pattern)
- **Files:** `src/lib/api.ts`
- **Verification:** npx tsc --noEmit clean

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| None | — |

## Next Phase Readiness

**Ready:**
- DELETE endpoint pattern dengan multi-step validation bisa direplikasi
- SafeUser local type pattern established untuk komponen lain
- 6 file tersisa: Mitras, Finance, CancellationsReturns, orders x3

**Concerns:**
- orders/ (3 file: OrdersList, CreateOrder, OrderDetail) — paling kompleks karena CreateOrder/OrderDetail punya logic pesanan multi-item
- Finance.tsx dan Mitras.tsx juga cukup kompleks (ledger entries, credit limit)

**Blockers:**
- None — Plan 02-06 bisa dimulai
