# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

REMA-V2 adalah sistem manajemen operasional produksi (garmen/konveksi) berbasis web. Aplikasi ini mengelola pesanan, mitra, produk, keuangan, dan antrian produksi. Stack: React 19 + Vite (frontend), Express.js (API backend), Drizzle ORM + Neon PostgreSQL (database), Tailwind CSS v4.

## Development Commands

```bash
# Frontend dev server (port 3000)
npm run dev

# API backend dev server (port 3001)
npm run api:dev

# Type check only (no test runner exists)
npm run lint

# Build frontend for production
npm run build

# Database operations
npm run db:push       # Push schema changes to Neon DB
npm run db:studio     # Open Drizzle Studio (visual DB browser)
npm run db:generate   # Generate migration files
npm run db:seed       # Seed initial data
```

Both `npm run dev` and `npm run api:dev` must run simultaneously. Vite proxies `/api/*` requests to `http://localhost:3001`.

## Environment Setup

Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — Neon PostgreSQL connection string (required by API)
- `JWT_SECRET` — Secret for signing JWT tokens
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — Cloudflare R2 for file/image storage

## Architecture

### Dual-Database Strategy

The frontend (`src/lib/db.ts`) uses **localStorage** as a fallback/legacy store with key `rema_v2_db`. The production backend API uses **Neon PostgreSQL** via Drizzle ORM. `AuthContext` calls the API; pages that haven't been migrated may still use the localStorage `db` object directly.

- `src/lib/db.ts` — localStorage CRUD wrapper (legacy/offline mode)
- `src/db/client.ts` — Drizzle client connected to Neon PostgreSQL
- `src/db/schema.ts` — Single source of truth for all table definitions and TypeScript types

### API Layer

- `src/api/index.ts` — Express app with all routes mounted at `/api/*`
- `src/api/server.ts` — Entry point (starts server on port 3001)
- `src/api/middleware/auth.ts` — JWT verification via `jose`; attaches `req.user = { sub, role, phone }`
- `src/api/routes/` — One file per resource (auth, users, mitras, products, orders, ledgers, requests, audit-logs)
- `src/lib/api.ts` — Frontend fetch wrapper; reads JWT from `localStorage('rema_token')`; all calls go through `request<T>(method, path, body)`

For Vercel deployment, `api/index.ts` at repo root acts as a serverless function entry point (see `vercel.json`).

### Frontend Structure

- `src/App.tsx` — Router setup; `RequireAuth` gate (redirects to Login, forces password change if `mustChangePassword`)
- `src/context/AuthContext.tsx` — Global auth state; hydrates from `api.auth.me()` on mount using stored token
- `src/context/ConfirmContext.tsx` — Global confirm dialog provider
- `src/components/Layout.tsx` — Main shell with sidebar navigation; nav links are role-filtered at render time
- `src/pages/` — One file per route; `orders/` subdirectory for order-specific pages
- `src/components/orders/` and `src/components/reports/` — PDF generation components using `@react-pdf/renderer`
- `src/types.ts` — Frontend domain types (separate from Drizzle-inferred types in `src/db/schema.ts`)

### Role-Based Access

Four roles: `admin`, `staff`, `operational`, `mitra`. Nav links and API routes are filtered by role. The `Layout.tsx` sidebar controls frontend visibility; API middleware should enforce role restrictions server-side.

### Order Lifecycle

Status flow: `draft` → `waiting_confirmation` → `confirmed` → `processing` → `pressing` → `packing` → `shipped` → (`returned` | `cancelled`). Orders reaching `packing` set `isBilled = true`. Items with `isCustomLogo` track DTF print status (`belum_cetak` / `sudah_cetak`).

### Finance / Ledger

Double-entry style: each financial event creates a `LedgerEntry` with `direction: 'debit' | 'credit'` and `source: 'order' | 'payment' | 'manual' | 'cancellation' | 'return'`. Mitra balance = sum of credits − sum of debits.

## Key Conventions

- Phone numbers are stored normalized to `62xxxxxxxx` format (Indonesian). `normalizePhone()` in `src/api/routes/auth.ts` handles conversion from `0xxx`.
- Timestamps are Unix milliseconds (`Date.now()`), stored as `bigint` in DB and `number` in TypeScript.
- IDs are `crypto.randomUUID()` strings.
- `src/lib/utils.ts` — contains `cn()` (clsx + tailwind-merge helper).
- Tailwind v4 is used via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed.
- Path alias `@` maps to repo root (configured in `vite.config.ts`).


## Kredensial
- C:\Users\USER\Documents\Proyek\PROJECT-APP\rema-v2-aistudio\rema-v2-plan\reference.md