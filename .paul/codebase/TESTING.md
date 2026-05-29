# Testing

## Overview

Proyek ini **tidak memiliki unit test atau integration test runner**. `npm run lint` hanya melakukan TypeScript type check (`tsc --noEmit`).

Testing dilakukan secara **E2E manual via MCP Playwright** terhadap production URL `https://redone.my.id`.

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

## Known Issues Found in E2E Testing

| Severity | Issue |
|----------|-------|
| Critical | `POST /api/upload` → HTTP 500 (R2 env vars tidak terkonfigurasi) — sudah difix di Phase 10 |
| Medium | `isBilled` flag hanya di client-side OrderDetail, tidak via API call terpisah |
| Minor | DOM warnings: missing autocomplete attributes, Recharts sizing |

---

## Screenshots

Ada di `.paul/phases/09-e2e-testing/screenshots/` — captured saat E2E testing.

---

## How to Run E2E (Manual)

Gunakan MCP Playwright tool di Claude Code:
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
- ✅ Financial ledger operations
- ✅ Production queue
- ✅ Audit log recording
- ✅ PDF export generation

## What's NOT Covered

- ❌ Unit tests (tidak ada)
- ❌ Integration tests (tidak ada)
- ❌ File upload (butuh R2 configured)
- ❌ Automated regression testing
- ❌ Performance testing
