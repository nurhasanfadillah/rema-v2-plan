# Technology Stack

## Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.0.1 | UI framework |
| react-dom | 19.0.1 | DOM renderer |
| react-router-dom | 7.15.1 | SPA routing |
| typescript | 5.8.2 | Type safety |
| vite | 6.2.3 | Build tool + dev server |
| @vitejs/plugin-react | 5.0.4 | React Fast Refresh |
| tailwindcss | 4.1.14 | Utility-first CSS |
| @tailwindcss/vite | 4.1.14 | Tailwind Vite integration (no config file needed) |
| framer-motion / motion | 12.x | Animations |
| lucide-react | 0.546.0 | Icons |
| recharts | 3.8.1 | Charts di Dashboard |
| react-hot-toast | 2.6.0 | Toast notifications |
| @react-pdf/renderer | 4.5.1 | PDF generation (SPK, shipping label, reports) |
| clsx + tailwind-merge | 2.1.1 / 3.6.0 | Conditional class merging (`cn()`) |
| date-fns | 4.3.0 | Date manipulation |
| vite-plugin-pwa | 1.3.0 | PWA support |

## Backend

| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.21.2 | HTTP server |
| cors | 2.8.6 | CORS middleware |
| jose | 6.2.3 | JWT sign/verify (HS256, 7 days expiry) |
| bcryptjs | 3.0.3 | Password hashing |
| dotenv | 17.2.3 | Environment variables |

## Database

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | 0.45.2 | TypeScript ORM |
| drizzle-kit | 0.31.10 | Migrations & schema push |
| @neondatabase/serverless | 1.1.0 | Neon serverless HTTP driver |

> **Note:** Neon HTTP driver tidak support transactions. Semua operasi multi-step menggunakan sequential inserts.

## Storage

| Package | Version | Purpose |
|---------|---------|---------|
| @aws-sdk/client-s3 | 3.1053.0 | Cloudflare R2 upload (S3-compatible) |

## Unused / Dormant

| Package | Version | Note |
|---------|---------|------|
| @google/genai | 2.4.0 | Installed, belum diimplementasi di kode |

---

## Build & Dev Scripts

```bash
npm run dev           # Vite dev server port 3000 (host 0.0.0.0)
npm run api:dev       # Express API port 3001
npm run build         # Vite production build → dist/
npm run lint          # tsc --noEmit (type check only, no test runner)
npm run db:push       # Push schema ke Neon DB
npm run db:studio     # Drizzle Studio (visual DB browser)
npm run db:generate   # Generate migration files
npm run db:seed       # Seed initial data
```

---

## Environment Variables

```bash
DATABASE_URL=          # Neon PostgreSQL connection string
JWT_SECRET=            # JWT signing secret (min 32 bytes recommended)
R2_ACCOUNT_ID=         # Cloudflare R2 account ID
R2_ACCESS_KEY_ID=      # R2 access key
R2_SECRET_ACCESS_KEY=  # R2 secret key
R2_BUCKET_NAME=        # R2 bucket name
R2_PUBLIC_URL=         # Public URL prefix untuk served files
API_PORT=3001          # (optional) API port
CORS_ORIGIN=           # (optional) Allowed origins
```

---

## Deployment (Vercel)

- Frontend → Vercel static hosting (SPA fallback ke `/index.html`)
- API → Vercel serverless function (`api/index.ts` di root, bukan `src/api/`)
- Max duration: 30 detik per function invocation
- File: `vercel.json`

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/((?!api).*)", "destination": "/index.html" }
  ]
}
```

---

## PWA Configuration

- Plugin: `vite-plugin-pwa`
- App name: REMA-V2
- Theme: dark (#020617)
- Display: standalone
- Auto-update strategy
- Icons: 64, 192, 512px (maskable 512, Apple touch 180)
- Max cacheable file: 3MB
