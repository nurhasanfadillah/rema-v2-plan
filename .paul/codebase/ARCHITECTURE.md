# Architecture & Structure

## Directory Structure

```
rema-v2-plan/
├── src/
│   ├── api/                          # Backend Express.js
│   │   ├── server.ts                 # Entry point (port 3001)
│   │   ├── index.ts                  # Express app + route mounting
│   │   ├── seed.ts                   # DB seeding script
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT verification → req.user
│   │   └── routes/
│   │       ├── auth.ts               # POST /login, GET /me
│   │       ├── users.ts              # CRUD users
│   │       ├── mitras.ts             # CRUD mitras
│   │       ├── products.ts           # CRUD products
│   │       ├── orders.ts             # CRUD orders (nested items)
│   │       ├── ledgers.ts            # Financial ledger entries
│   │       ├── requests.ts           # Cancellation/return requests
│   │       ├── priorities.ts         # Order priority management
│   │       ├── audit-logs.ts         # Audit trail
│   │       ├── upload.ts             # S3/R2 file upload
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
│   │   │   ├── OrdersList.tsx        # Table + filter
│   │   │   ├── OrderDetail.tsx       # Status transitions + actions
│   │   │   └── CreateOrder.tsx       # Form + items
│   │   ├── AppQueue.tsx              # Production queue
│   │   ├── OrderPriorities.tsx       # Priority queue
│   │   ├── Finance.tsx               # Finance dashboard
│   │   ├── Reports.tsx               # PDF exports
│   │   ├── AuditLogs.tsx             # admin/staff only
│   │   └── CancellationsReturns.tsx
│   │
│   ├── components/
│   │   ├── Layout.tsx                # Sidebar shell + nav (role-filtered)
│   │   ├── FileUpload.tsx            # Single file upload (drag-drop)
│   │   ├── MultiFileUpload.tsx       # Multi-file upload
│   │   ├── Lightbox.tsx              # Image preview
│   │   ├── RunningOrders.tsx         # Running orders widget
│   │   ├── orders/
│   │   │   ├── OrderSPKPDF.tsx       # SPK PDF (react-pdf)
│   │   │   └── ShippingLabelPDF.tsx  # Shipping label PDF
│   │   └── reports/
│   │       ├── FinanceReportPDF.tsx
│   │       └── OrderReportPDF.tsx
│   │
│   ├── context/
│   │   ├── AuthContext.tsx           # Global auth state + token
│   │   └── ConfirmContext.tsx        # Promise-based confirm dialog
│   │
│   ├── lib/
│   │   ├── api.ts                    # Typed fetch wrapper
│   │   ├── db.ts                     # LEGACY: localStorage wrapper (dead code)
│   │   └── utils.ts                  # cn(), normalizePhone(), formatCurrency(), dll
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

## Data Flow

```
Browser
  ↓ (fetch + Bearer token)
src/lib/api.ts          ← typed wrapper, reads rema_token from localStorage
  ↓ (Vite proxy dev / direct prod)
Express API (port 3001)
  ↓ requireAuth middleware
  ↓ route handler
Drizzle ORM
  ↓ HTTP (serverless)
Neon PostgreSQL
```

---

## Auth Flow

1. `POST /api/auth/login` → phone + password
2. Backend normalizes phone (`0xxx` → `62xxx`)
3. Bcrypt compare password vs hash
4. 5 gagal login = locked 15 menit
5. Sukses → kembalikan JWT (7 hari) + SafeUser
6. Frontend simpan token di `localStorage('rema_token')`
7. `AuthContext` hydrate via `GET /api/auth/me` on mount
8. `RequireAuth` wrapper → redirect ke Login jika tidak ada user
9. Jika `mustChangePassword` → paksa ke `/change-password`

**JWT Payload:** `{ sub: userId, role, phone }`

---

## Database Schema (9 Tables)

| Table | Key Fields |
|-------|-----------|
| `users` | id, name, phone (unique), passwordHash, role, isActive, failedLoginAttempts, lockedUntil, mustChangePassword |
| `mitras` | id, userId (FK→users), name, creditLimit, isArchived, logoUrl, priorityLimit |
| `products` | id, name, price, description, imageUrl, isArchived |
| `orders` | id, orderNumber (unique), mitraId (FK→mitras), type (online/offline), status, totalAmount, totalQty, isBilled |
| `order_items` | id, orderId (FK→orders), productId, productName, priceSnapshot, qty, dtfStatus, previewUrl(s), designUrl(s) |
| `ledgers` | id, mitraId (FK→mitras), orderId, source, direction (debit/credit), nominal, description, paymentMethod |
| `action_requests` | id, type (cancellation/return), orderId (FK→orders), mitraId, reason, status, creditAmount |
| `audit_logs` | id, userId (text, no FK), action, details, createdAt |
| `order_priorities` | id, orderId (FK→orders), mitraId, notes, createdBy |

---

## Order Status Flow

```
draft
  ↓ (mitra submit)
waiting_confirmation
  ↓ (admin approve)
confirmed
  ↓
processing
  ↓
pressing
  ↓ (isBilled = true dipasang saat packing)
packing
  ↓
shipped ← terminal state

Dari draft/waiting_confirmation/confirmed/processing → cancelled
Dari mana saja → returned
```

---

## React Router Structure

| Route | Page | Auth |
|-------|------|------|
| `/` | Dashboard | All roles |
| `/users` | Users.tsx | admin only |
| `/mitras` | Mitras.tsx | admin only |
| `/products` | Products.tsx | All |
| `/orders` | OrdersList.tsx | All |
| `/orders/drafts` | OrdersList (filter) | mitra only |
| `/orders/create` | CreateOrder.tsx | All |
| `/orders/:id/edit` | CreateOrder.tsx | draft only |
| `/orders/:id` | OrderDetail.tsx | All |
| `/queue` | AppQueue.tsx | All |
| `/priority` | OrderPriorities.tsx | All |
| `/finance` | Finance.tsx | All |
| `/reports` | Reports.tsx | All |
| `/audit-logs` | AuditLogs.tsx | admin/staff |
| `/cancellations` | CancellationsReturns.tsx | All |
| `/change-password` | ChangePassword.tsx | Forced if flag |

---

## Finance / Ledger Model

Double-entry style:
- Setiap event keuangan buat `LedgerEntry`
- `direction: 'debit' | 'credit'`
- `source: 'order' | 'payment' | 'manual' | 'cancellation' | 'return'`
- Saldo mitra = sum(credit) − sum(debit)

---

## State Management

- **AuthContext** — user + token (localStorage persistence)
- **ConfirmContext** — global confirm dialog (promise-based)
- **Component-level useState** — semua state page-level
- **Tidak ada Redux/Zustand** — semua lifting ke component atau context
- **Data fetching** — langsung `api.*` di `useEffect`, no caching
