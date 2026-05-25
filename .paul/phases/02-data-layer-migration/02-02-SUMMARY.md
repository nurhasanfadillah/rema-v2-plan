---
phase: 02-data-layer-migration
plan: 02
subsystem: auth
tags: [api-client, jwt, authentication, fetch, vite-proxy]

requires:
  - phase: 02-data-layer-migration (Plan 01)
    provides: 7 CRUD API routes + JWT auth endpoint (POST /api/auth/login, GET /api/auth/me)

provides:
  - src/lib/api.ts — typed client wrapper untuk semua 7 entitas + auth
  - JWT token management di localStorage (key: rema_token)
  - AuthContext berbasis token, user di-fetch via /api/auth/me
  - Login via POST /api/auth/login (db.* fully removed)
  - ChangePassword via PATCH /api/users/:id/password (bcrypt server-side)
  - Vite proxy /api → localhost:3001

affects: [02-data-layer-migration Plan 03, semua halaman yang masih pakai db.*]

tech-stack:
  added: []
  patterns:
    - "API client pattern: single api.ts module dengan typed methods per entitas"
    - "Token storage: localStorage key rema_token (bukan rema_user)"
    - "SafeUser type: Omit<User, 'passwordHash'> digunakan di seluruh client"

key-files:
  created: [src/lib/api.ts]
  modified:
    - vite.config.ts
    - src/context/AuthContext.tsx
    - src/pages/Login.tsx
    - src/pages/ChangePassword.tsx
    - src/api/routes/users.ts

key-decisions:
  - "BASE URL hardcoded ke '/api' — Vite proxy handles dev, Vercel same-origin handles prod"
  - "Token disimpan di localStorage 'rema_token', bukan di rema_user"
  - "SafeUser = Omit<User, 'passwordHash'> — type ini digunakan di AuthContext dan semua API returns"

patterns-established:
  - "Semua API calls melalui api.* dari src/lib/api.ts — tidak ada fetch langsung di komponen"
  - "Error handling: server mengembalikan { error: string }, client throw new Error(err.error)"
  - "changePassword endpoint: oldPassword opsional (undefined = forced change, no verification)"

duration: ~30min
started: 2026-05-25T00:00:00Z
completed: 2026-05-25T00:30:00Z
---

# Phase 2 Plan 02: Client API Wrapper + Auth Migration Summary

**Typed API client (`src/lib/api.ts`) dibuat sebagai fondasi migrasi, dan seluruh auth layer (AuthContext, Login, ChangePassword) dimigrasikan dari localStorage+db ke JWT token + API calls.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Tasks | 3 completed |
| Files modified | 6 |
| TypeScript errors | 0 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: API client mengirim request dengan auth header | Pass | request() helper attach Bearer token dari localStorage rema_token |
| AC-2: Login menggunakan API | Pass | Login.tsx calls api.auth.login(), db.* fully removed |
| AC-3: Sesi bertahan setelah page refresh | Pass | AuthContext useEffect: getToken() → api.auth.me() → setUser |
| AC-4: Password change berfungsi via API | Pass | ChangePassword.tsx calls api.users.changePassword(), PATCH endpoint added |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/lib/api.ts` | Created | Typed API client: 7 entitas + auth, token management |
| `vite.config.ts` | Modified | Tambah proxy server.proxy['/api'] → localhost:3001 |
| `src/context/AuthContext.tsx` | Modified | Token-based auth, fetch user via /api/auth/me |
| `src/pages/Login.tsx` | Modified | Calls api.auth.login(), hapus db.getUsers() |
| `src/pages/ChangePassword.tsx` | Modified | Calls api.users.changePassword(), hapus db.saveUsers() |
| `src/api/routes/users.ts` | Modified | Tambah PATCH /:id/password dengan bcrypt.compare verification |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| BASE URL = '/api' hardcoded | Vite proxy untuk dev, Vercel same-origin untuk prod — tidak perlu env var VITE_API_URL | Plan 02-03 tidak perlu konfigurasi tambahan |
| Token key: 'rema_token' | Pisah dari 'rema_user' (lama) untuk migrasi gradual | Sesi localStorage lama tidak akan conflict |
| oldPassword opsional di PATCH /password | mustChangePassword=true tidak perlu verifikasi lama | Forced change tetap aman karena hanya bisa diakses user yang sudah login |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Minor |
| Scope additions | 0 | — |
| Deferred | 0 | — |

### Auto-fixed Issues

**1. vite.config.ts CRLF + Unicode karakter**
- **Found during:** Task 1
- **Issue:** File punya CRLF line endings dan karakter Unicode khusus di komentar sehingga Edit tool gagal match string
- **Fix:** Tulis ulang seluruh file (dua komentar khusus dihapus, content sama)
- **Files:** vite.config.ts
- **Verification:** TypeScript compile zero errors, proxy config terkonfirmasi

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| vite.config.ts tidak bisa di-patch dengan Edit tool (CRLF + Unicode) | Rewrite seluruh file dengan Write tool |

## Next Phase Readiness

**Ready:**
- `api.*` module siap digunakan di semua halaman
- Token management sudah bekerja (rema_token di localStorage)
- Auth layer fully migrated — tidak ada db.* di Login, AuthContext, ChangePassword
- Pattern established: setiap halaman tinggal swap `db.*` → `api.*`

**Concerns:**
- Halaman lain (Dashboard, Mitras, Orders, Users, Finance, dll) masih pakai `db.*` — akan error jika API server tidak running
- Saat ini app bisa jalan campuran: auth via API, data lain masih localStorage

**Blockers:**
- None — Plan 02-03 bisa dimulai
