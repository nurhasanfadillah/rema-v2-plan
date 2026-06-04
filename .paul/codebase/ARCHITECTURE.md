# Architecture & Structure

## Directory Structure

```
rema-v2-plan/
├── src/
│   ├── api/                          # Backend Express.js
│   │   ├── server.ts                 # Entry point (port 3001 dev)
│   │   ├── index.ts                  # Express app + route mounting + CORS
│   │   ├── seed.ts                   # DB seeding script (admin user)
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT verification → req.user = {sub, role, phone}
│   │   └── routes/
│   │       ├── auth.ts               # POST /login, GET /me
│   │       ├── users.ts              # CRUD users + PATCH password
│   │       ├── mitras.ts             # CRUD mitras (3-layer delete guard)
│   │       ├── products.ts           # CRUD products (delete guard: orderItems)
│   │       ├── orders.ts             # CRUD orders (nested items, no txn)
│   │       ├── ledgers.ts            # Ledger entries + dedup source=order
│   │       ├── requests.ts           # Cancellation/return requests
│   │       ├── priorities.ts         # Order priority queue (quota check)
│   │       ├── audit-logs.ts         # Audit trail (limit query param)
│   │       ├── upload.ts             # R2 file upload (raw body, 10MB)
│   │       └── health.ts             # Health check endpoint
│   │
│   ├── db/
│   │   ├── client.ts                 # Drizzle client (Neon HTTP driver)
│   │   └── schema.ts                 # DB schema (single source of truth)
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── ChangePassword.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx                 # admin only
│   │   ├── Mitras.tsx                # admin only
│   │   ├── Products.tsx
│   │   ├── orders/
│   │   │   ├── OrdersList.tsx        # Table + search (produk, catatan desain)
│   │   │   ├── OrderDetail.tsx       # Status transitions + actions (~689 lines)
│   │   │   └── CreateOrder.tsx       # Form + items (~524 lines)
│   │   ├── AppQueue.tsx              # Production queue
│   │   ├── OrderPriorities.tsx       # Priority queue (quota-based)
│   │   ├── Finance.tsx               # Finance dashboard (~999 lines)
│   │   ├── Reports.tsx               # PDF exports
│   │   ├── AuditLogs.tsx             # admin/staff only
│   │   └── CancellationsReturns.tsx
│   │
│   ├── components/
│   │   ├── Layout.tsx                # Sidebar shell + nav (role-filtered)
│   │   ├── FileUpload.tsx            # Single file upload (drag-drop)
│   │   ├── MultiFileUpload.tsx       # Multi-file upload
│   │   ├── Lightbox.tsx              # Image preview
│   │   ├── RunningOrders.tsx         # Running orders widget (Dashboard)
│   │   ├── orders/
│   │   │   ├── OrderSPKPDF.tsx       # SPK PDF (react-pdf, ~203 lines)
│   │   │   └── ShippingLabelPDF.tsx
│   │   └── reports/
│   │       ├── FinanceReportPDF.tsx
│   │       └── OrderReportPDF.tsx
│   │
│   ├── context/
│   │   ├── AuthContext.tsx           # Global auth state + token
│   │   └── ConfirmContext.tsx        # Promise-based confirm dialog
│   │
│   ├── lib/
│   │   ├── api.ts                    # Typed fetch wrapper + token mgmt
│   │   ├── db.ts                     # LEGACY localStorage wrapper (dead code)
│   │   └── utils.ts                  # cn, normalizePhone, formatCurrency, formatDate, resizeImage
│   │
│   ├── App.tsx                       # Router + RequireAuth gate
│   ├── main.tsx                      # React entry point
│   ├── types.ts                      # Frontend TypeScript types
│   └── index.css                     # Tailwind + custom fonts/vars
│
├── api/
│   └── index.ts                      # Vercel serverless entry (wraps src/api)
├── public/                           # PWA icons
├── drizzle/                          # Generated migration files
├── .paul/                            # Planning docs
├── vercel.json
├── drizzle.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## High-Level Diagram

```
┌──────────────────────────────────────────────────────────┐
│   Frontend (React 19 + Vite + React Router 7)            │
│   Login → AuthContext hydrate → RequireAuth gate         │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP/JSON + Bearer JWT
                       ↓
┌──────────────────────────────────────────────────────────┐
│   Vercel Serverless Adapter (api/index.ts)               │
│   └─ Express App (src/api/index.ts)                      │
│      ├─ requireAuth middleware (jose JWT verify)         │
│      └─ 11 resource routers                              │
└──────────────────────┬───────────────────────────────────┘
                       │ Drizzle ORM (neon-http)
                       ↓
              ┌────────────────────────┐
              │  Neon PostgreSQL       │
              │  9 tables              │
              └────────────────────────┘
```

Dev mode: Vite proxy `/api/*` → `http://localhost:3001`.

---

## Auth Flow

1. `POST /api/auth/login` → phone + password
2. Backend normalizes phone (`0xxx` → `62xxx`)
3. Bcrypt compare password vs hash
4. 5 gagal login = locked 15 menit (`lockedUntil` timestamp)
5. Sukses → reset attempts, return JWT (7 hari) + SafeUser
6. Frontend simpan token di `localStorage('rema_token')`
7. `AuthContext` hydrate via `GET /api/auth/me` on mount
8. `RequireAuth` wrapper → redirect ke Login jika tidak ada user
9. Jika `mustChangePassword` → paksa ke `/change-password`

**JWT Payload:** `{ sub: userId, role, phone }` | HS256 | 7-day exp.

---

## Database Schema (9 Tables)

| Table | Key Fields |
|-------|-----------|
| `users` | id, name, phone (unique, normalized 62xxx), passwordHash, role, isActive, failedLoginAttempts, lockedUntil, mustChangePassword |
| `mitras` | id, userId (FK→users), name, creditLimit, isArchived, logoUrl, priorityLimit |
| `products` | id, name, price (real!), description, imageUrl, isArchived |
| `orders` | id, orderNumber (unique), mitraId (FK→mitras), type (online/offline), status, totalAmount (real!), totalQty, isBilled, hasCustomLogo, recipient*, resiUrl, createdAt, updatedAt |
| `order_items` | id, orderId (FK→orders), productId, productName, priceSnapshot, qty, dtfStatus, previewUrl(s), designUrl(s) |
| `ledgers` | id, mitraId (FK→mitras), orderId, source, direction (debit/credit), nominal (real!), description, paymentMethod, referenceId, referenceNumber, attachmentUrl |
| `action_requests` | id, type (cancellation/return), orderId (FK→orders), mitraId, reason, status, creditAmount |
| `audit_logs` | id, userId (text, **no FK**), action, details, createdAt |
| `order_priorities` | id, orderId (FK→orders), mitraId, notes, createdBy |

**Catatan**:
- Semua ID = `text` (UUID string)
- Semua timestamp = `bigint mode number` (Unix ms)
- Field uang pakai `real` (float) — lihat CONCERNS 2.6
- FK tanpa `.onDelete()` cascade — multi-layer guard manual di handler

---

## Order Status Flow

```
draft
  ↓ (mitra submit)
waiting_confirmation
  ↓ (admin approve)
confirmed → processing → pressing → packing → shipped (terminal)
                                       ↑
                              isBilled = true di-set di packing

cancellation/return → via /api/requests workflow → returned (post-shipped)
```

Transisi divalidasi di frontend (`OrderDetail.tsx`), **tidak ada validasi server-side**.

---

## React Router Structure

| Route | Page | Auth |
|-------|------|------|
| `/` | Dashboard | All roles |
| `/users` | Users.tsx | admin only |
| `/mitras` | Mitras.tsx | admin only |
| `/products` | Products.tsx | admin, mitra |
| `/orders` | OrdersList.tsx | All |
| `/orders/drafts` | OrdersList (filter) | mitra only |
| `/orders/create` | CreateOrder.tsx | mitra |
| `/orders/:id/edit` | CreateOrder.tsx | draft / pre-packing |
| `/orders/:id` | OrderDetail.tsx | All |
| `/queue` | AppQueue.tsx | All |
| `/priority` | OrderPriorities.tsx | All |
| `/finance` | Finance.tsx | admin, mitra |
| `/reports` | Reports.tsx | admin, mitra, staff |
| `/audit-logs` | AuditLogs.tsx | admin/staff |
| `/cancellations` | CancellationsReturns.tsx | admin, staff, mitra |
| `/change-password` | ChangePassword.tsx | Forced if `mustChangePassword` |

---

## Finance / Ledger Model

Double-entry style per mitra:
- Setiap event keuangan buat `LedgerEntry`
- `direction: 'debit' | 'credit'`
- `source: 'order' | 'payment' | 'manual' | 'cancellation' | 'return'`
- Saldo mitra = Σ(credit) − Σ(debit)
- `referenceId` link ke `orderId` / `requestId`
- **Dedup**: POST `/api/ledgers` cek (source=order + referenceId) → return existing (idempotent, fix `2cac184`)

---

## State Management

- **AuthContext** — user + token (localStorage persistence)
- **ConfirmContext** — global confirm dialog (promise-based)
- **Component-level useState** — semua state page-level
- **Tidak ada Redux/Zustand/React Query** — fetch langsung `api.*` di `useEffect`, no caching
