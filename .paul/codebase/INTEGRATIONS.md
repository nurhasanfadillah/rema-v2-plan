# External Integrations

## 1. Neon PostgreSQL (Database)

**Type:** Serverless PostgreSQL
**SDK:** `@neondatabase/serverless` v1.1.0
**Config file:** `src/db/client.ts`
**ORM:** Drizzle ORM v0.45.2 (`drizzle-orm/neon-http`)

```typescript
// src/db/client.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

**Env vars:**
- `DATABASE_URL` — Neon connection string (format: `postgresql://user:pass@host/db?sslmode=require`)

**Karakteristik:**
- HTTP driver — fetch-based, cocok untuk Vercel serverless (no persistent connection)
- **Tidak support transactions** — semua operasi multi-step pakai sequential inserts (risiko inkonsistensi)
- Pooling native via Neon serverless

**Commands:**
```bash
npm run db:push       # Apply schema changes
npm run db:studio     # Visual DB browser (port 4983)
npm run db:generate   # Generate migration SQL
npm run db:seed       # Seed admin user
```

---

## 2. Cloudflare R2 (File Storage)

**Type:** S3-compatible object storage
**SDK:** `@aws-sdk/client-s3` v3.1053.0
**Route file:** `src/api/routes/upload.ts`
**Endpoint:** `POST /api/upload`

```typescript
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});
```

**File key format:** `uploads/{timestamp}-{8-char-random}.{ext}`
**Response:** `{ url: string }` — full public URL via `R2_PUBLIC_URL`
**Max file size:** 10MB (via `express.raw()` — required untuk Vercel serverless)
**Auth required:** JWT Bearer token

**Penggunaan:** product `imageUrl`, order item `previewUrls` / `designUrls`, attachment audit, action request attachment.

**Env vars:**
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

**Known issue:** R2 API token bisa expired → upload 500. Generate baru dari Cloudflare Dashboard.

---

## 3. Vercel (Deployment)

**Type:** Hosting platform (static + serverless)
**Config file:** `vercel.json`
**Serverless entry:** `api/index.ts` (root, wraps `src/api/index.ts`)

**Architecture:**
- Frontend → Vercel CDN (static files dari `dist/`)
- API → Vercel Serverless Function (Node.js runtime, max 30s)
- DB → Neon (external, serverless)

**Routing:**
```json
{ "source": "/api/(.*)", "destination": "/api" }              // API ke serverless
{ "source": "/((?!api).*)", "destination": "/index.html" }    // SPA fallback
```

**Function config:** `{ maxDuration: 30, includeFiles: 'src/**' }`

**Production URL:** https://redone.my.id

---

## 4. JWT Authentication (jose)

**Library:** `jose` v6.2.3
**Algorithm:** HS256
**Expiry:** 7 hari
**Storage:** `localStorage('rema_token')` di frontend

**Payload:** `{ sub: userId, role, phone }`
**Header:** `Authorization: Bearer <token>`
**Sign:** `src/api/routes/auth.ts` (login)
**Verify middleware:** `src/api/middleware/auth.ts` — attach `req.user`

**Env vars:**
- `JWT_SECRET` — secret untuk sign/verify (TextEncoder UTF-8); **wajib strong & unik per env** (lihat CONCERNS 1.1).

---

## 5. Google Generative AI (Dormant)

**Library:** `@google/genai` v2.4.0
**Status:** Terinstall tapi **tidak ada implementasi** di kode saat ini
**Flag:** `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` di metadata
**Use case yang dimaksud:** Kemungkinan design generation atau content analysis

**Action**: Audit penggunaan; hapus dari `package.json` jika tidak ada rencana.

---

## Layanan yang TIDAK Terintegrasi

| Layanan | Status |
|---------|--------|
| Email (SMTP / SendGrid / Resend) | ❌ tidak ada |
| SMS / WhatsApp gateway | ❌ tidak ada |
| Payment gateway (Midtrans / Xendit) | ❌ tidak ada |
| Analytics (PostHog / Mixpanel / GA) | ❌ tidak ada |
| Error tracking (Sentry) | ❌ tidak ada |
| Queue / background job | ❌ tidak ada |

---

## Frontend API Client Pattern

`src/lib/api.ts`:
- Base URL: `/api`
- Token injection otomatis: `Authorization: Bearer ${token}`
- Generic: `request<T>(method, path, body): Promise<T>`
- Namespace: `api.auth`, `api.users`, `api.mitras`, `api.products`, `api.orders`, `api.ledgers`, `api.requests`, `api.priorities`, `api.auditLogs`, `api.upload`
- Error: throw setelah parse `{ error }` dari response

---

## Summary Env Vars

```
DATABASE_URL=<neon postgres connection string>
JWT_SECRET=<random 32+ byte hex>
CORS_ORIGIN=<comma-separated allowed origins>
API_PORT=3001                         # dev only
R2_ACCOUNT_ID=<cloudflare account>
R2_ACCESS_KEY_ID=<r2 access key>
R2_SECRET_ACCESS_KEY=<r2 secret>
R2_BUCKET_NAME=<bucket name>
R2_PUBLIC_URL=<public base url>
```

Template di `.env.example` (sebaiknya tambah deskripsi per var).
