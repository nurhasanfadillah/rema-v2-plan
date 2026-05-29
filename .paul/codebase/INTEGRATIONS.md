# External Integrations

## 1. Neon PostgreSQL (Database)

**Type:** Serverless PostgreSQL  
**SDK:** `@neondatabase/serverless` v1.1.0  
**Config file:** `src/db/client.ts`  
**ORM:** Drizzle ORM v0.45.2

```typescript
// src/db/client.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

**Env vars:**
- `DATABASE_URL` — Neon connection string (format: `postgresql://user:pass@host/db?sslmode=require`)

**Limitations:**
- HTTP driver, tidak support transactions
- Komentar di kode: "sequential inserts are safe for single-admin app"

**Commands:**
```bash
npm run db:push       # Apply schema changes
npm run db:studio     # Visual DB browser (port 4983)
npm run db:generate   # Generate migration SQL
npm run db:seed       # Seed initial data
```

---

## 2. Cloudflare R2 (File Storage)

**Type:** S3-compatible object storage  
**SDK:** `@aws-sdk/client-s3` v3.1053.0  
**Route file:** `src/api/routes/upload.ts`  
**Endpoint:** `POST /api/upload`

```typescript
// S3Client configured with R2 endpoint
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});
```

**File key format:** `uploads/{timestamp}-{randomId}.{ext}`  
**Response:** `{ url: string }` — full public URL  
**Max file size:** 10MB  
**Auth required:** JWT Bearer token

**Env vars:**
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL` — prefix untuk public URL

**Known issue:** R2 API token bisa expired — generate baru dari Cloudflare Dashboard jika upload 500.

---

## 3. Vercel (Deployment)

**Type:** Hosting platform (static + serverless)  
**Config file:** `vercel.json`  
**Serverless entry:** `api/index.ts` (root level, bukan `src/api/`)

**Architecture:**
- Frontend → Vercel CDN (static files dari `dist/`)
- API → Vercel Serverless Function (Node.js runtime, max 30s)
- DB → Neon (external, serverless)

**Routing:**
```json
{ "source": "/api/(.*)", "destination": "/api" }      // API ke serverless
{ "source": "/((?!api).*)", "destination": "/index.html" }  // SPA fallback
```

**Production URL:** https://redone.my.id

---

## 4. JWT Authentication (jose)

**Library:** `jose` v6.2.3  
**Algorithm:** HS256  
**Expiry:** 7 hari  
**Storage:** `localStorage('rema_token')` di frontend

**Payload:** `{ sub: userId, role, phone }`  
**Header:** `Authorization: Bearer <token>`  
**Middleware:** `src/api/middleware/auth.ts`

---

## 5. Google Generative AI (Dormant)

**Library:** `@google/genai` v2.4.0  
**Status:** Terinstall tapi **tidak ada implementasi** di kode saat ini  
**Flag:** `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` di metadata  
**Use case yang dimaksud:** Kemungkinan untuk design generation atau content analysis
