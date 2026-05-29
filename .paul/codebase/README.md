# Codebase Map

Dibuat: 2026-05-29 via `paul:map-codebase`

## Documents

| File | Isi |
|------|-----|
| [OVERVIEW.md](OVERVIEW.md) | Project overview, what it does, key files, roles |
| [STACK.md](STACK.md) | Tech stack lengkap, dependencies, scripts, env vars |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Struktur direktori, data flow, auth, DB schema, routing |
| [CONVENTIONS.md](CONVENTIONS.md) | Naming, TypeScript patterns, component patterns, CSS |
| [TESTING.md](TESTING.md) | E2E testing approach, coverage, known issues |
| [INTEGRATIONS.md](INTEGRATIONS.md) | Neon DB, Cloudflare R2, Vercel, JWT |
| [API.md](API.md) | API endpoint reference + frontend client usage |
| [CONCERNS.md](CONCERNS.md) | Technical debt, security issues, priority actions |

## Quick Facts

- **Stack:** React 19 + Express.js + Neon PostgreSQL + Drizzle ORM + Tailwind CSS v4
- **Deployment:** Vercel (frontend static + serverless API)
- **Storage:** Cloudflare R2
- **Auth:** JWT (jose) + bcryptjs
- **No test runner** — type check only (`npm run lint`)
- **9 DB tables:** users, mitras, products, orders, order_items, ledgers, action_requests, audit_logs, order_priorities
- **4 roles:** admin, staff, operational, mitra
- **Legacy dead code:** `src/lib/db.ts` (localStorage wrapper, tidak dipakai)
