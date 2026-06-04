# Testing

## Overview

Proyek ini **tidak memiliki unit test atau integration test runner**. `npm run lint` hanya melakukan TypeScript type check (`tsc --noEmit`).

Testing dilakukan secara **E2E manual via MCP Playwright** terhadap production URL `https://redone.my.id`.

Tidak ada file `*.test.*` atau `*.spec.*` di `src/`. Tidak ada `.github/workflows/` CI. Tidak ada ESLint config.

---

## Quality Gates yang Tersedia

| Gate | Command | Cakupan |
|------|---------|---------|
| TypeScript check | `npm run lint` → `tsc --noEmit` | Type safety only |
| Build verification | `npm run build` | Vite build (TS + bundle) |
| DB schema sync | `npm run db:push` | Drizzle schema vs Neon |

`tsconfig.json`: strict, isolatedModules, allowJs, skipLibCheck. Beberapa `any` di route handlers (`catch (err: any)`) lolos karena explicit.

---

## E2E Testing Results (Phase 09)

Dokumentasi ada di `.paul/phases/09-e2e-testing/`

| Sub-phase | Focus | Pass Rate |
|-----------|-------|-----------|
| 09-01 | Auth & Navigation | 5/5 (100%) |
| 09-02 | Entity CRUD (Mitra, Produk, Upload) | 5/7 (71%) |
| 09-03 | Order Lifecycle (draft→shipped, cancel) | 5/6 (83%) |
| 09-04 | Finance, Queue, Reports, Audit | 6/7 (86%) |

**Overall: ~84% acceptance criteria pass**

---

## Acceptance Criteria Format

Menggunakan format Gherkin:

```gherkin
## AC-1: Login Berhasil
Given halaman login https://redone.my.id/login terbuka
When admin mengisi nomor 082113133165 dan password yang benar
Then redirect ke dashboard (/), sidebar tampil, toast muncul
```

---

## Seeding

Hanya satu seed script: `src/api/seed.ts`
- Phone: `6282113133165`
- Password: `rema1234` (bcrypt cost 12)
- Role: `admin`
- `mustChangePassword: true`

NPM: `npm run db:seed`. Tidak ada fixture / factory untuk products, mitras, orders test data.

---

## Known Issues Found in E2E Testing

| Severity | Issue | Status |
|----------|-------|--------|
| Critical | `POST /api/upload` → HTTP 500 (R2 env vars + express.raw() Vercel) | ✅ Fixed Phase 10 |
| High | Double ledger entries from order production | ✅ Fixed (`2cac184`) |
| Medium | `isBilled` flag hanya di client-side OrderDetail | ⚠️ Open |
| Medium | OrderDetail button contrast | ✅ Fixed (`4ea36d1`) |
| Minor | DOM warnings: missing autocomplete, Recharts sizing | ⚠️ Open |

---

## Screenshots

`.paul/phases/09-e2e-testing/screenshots/` — captured saat E2E testing.

---

## How to Run E2E (Manual)

Via MCP Playwright tool di Claude Code:
1. `mcp__Playwright__browser_navigate` ke `https://redone.my.id`
2. Login dengan kredensial dari `reference.md`
3. Jalankan acceptance criteria per plan file

---

## What's Covered

- ✅ Login valid / invalid / locked account
- ✅ Navigation ke 14+ halaman
- ✅ Role-based menu visibility
- ✅ CRUD Mitra, Produk, User
- ✅ Order lifecycle (draft → shipped)
- ✅ Cancellation & return workflow
- ✅ Financial ledger operations (incl. dedup)
- ✅ Production queue
- ✅ Audit log recording
- ✅ PDF export generation

## What's NOT Covered

- ❌ Unit tests
- ❌ Integration tests (API + DB)
- ❌ Automated regression testing
- ❌ Performance testing
- ❌ Cross-mitra isolation tests (security)

---

## Rekomendasi (Prioritized)

### HIGH
1. **Setup Vitest** (ESM-native, Vite integrated) — start dari util pure functions (`normalizePhone`, `formatCurrency`).
2. **Test ledger invariants** — double-entry dedup, balance per mitra.
3. **Test order status transitions** (currently no server-side validation).

### MEDIUM
4. **Integration tests** — Vitest + supertest untuk auth flow & role filtering.
5. **CI workflow** — `.github/workflows/ci.yml` minimal: `npm ci && npm run lint && npm run build`.

### LOW
6. **E2E automated** — Playwright untuk golden path.

---

## Hambatan untuk Testing

- **Neon HTTP driver tidak support transaction** — integration test harus pakai DB asli atau mock Drizzle.
- **localStorage di `src/lib/api.ts`** — wrap dengan environment check atau inject via test context.
- **Seed minimal** — perlu fixture lengkap (products, mitras, orders) untuk skenario realistis.
