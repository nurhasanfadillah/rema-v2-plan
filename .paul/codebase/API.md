# API Reference

## Base URL

- Dev: `http://localhost:3001/api`
- Prod: `https://redone.my.id/api`

## Authentication

Semua endpoint (kecuali `/health` dan `/auth/login`) membutuhkan:
```
Authorization: Bearer <jwt_token>
```

Error response format: `{ "error": "<message>" }`. Tidak ada envelope wrapper untuk success.

---

## Auth — `src/api/routes/auth.ts`

### `POST /api/auth/login`
```json
// Request
{ "phone": "082113133165", "password": "..." }

// Response 200
{ "token": "eyJ...", "user": { "id", "name", "phone", "role", "isActive", ... } }

// Response 401 — invalid credentials / locked / inactive
{ "error": "Nomor atau password salah" }
```

Phone otomatis di-normalize (`0xxx` → `62xxx`). 5 kali gagal → locked 15 menit.

### `GET /api/auth/me`
Returns current user (SafeUser).

---

## Users — `src/api/routes/users.ts`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/users` | List all (SafeUser, no passwordHash) |
| POST | `/api/users` | Create user (password di-hash) |
| PUT | `/api/users/:id` | Update partial |
| PATCH | `/api/users/:id/password` | `{oldPassword?, newPassword}` — oldPassword optional (admin force-reset) |
| DELETE | `/api/users/:id` | Guard: tidak bisa hapus diri sendiri (409) |

---

## Mitras — `src/api/routes/mitras.ts`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/mitras` | List all |
| POST | `/api/mitras` | Create — body: `{userId, name, creditLimit?, logoUrl?, priorityLimit?, ...}` |
| PUT | `/api/mitras/:id` | Update partial |
| DELETE | `/api/mitras/:id` | 3-layer guard: cek orders, ledgers, action_requests; juga hapus linked user |

---

## Products — `src/api/routes/products.ts`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/products` | List all |
| POST | `/api/products` | Create — body: `{name, price, description?, imageUrl?, isArchived?}` |
| PUT | `/api/products/:id` | Update partial |
| DELETE | `/api/products/:id` | 409 jika dipakai di `order_items` |

---

## Orders — `src/api/routes/orders.ts`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/orders` | List, role `mitra` auto-filter; query `allMitras=true` admin bypass |
| GET | `/api/orders/:id` | Single order + items |
| POST | `/api/orders` | Create + items (sequential insert, no txn) |
| PUT | `/api/orders/:id` | Update: hapus semua items lama, insert ulang |
| DELETE | `/api/orders/:id` | Cascade ke `order_items` (manual loop) |

**Order body:**
```json
{
  "mitraId": "uuid",
  "type": "online|offline",
  "status": "draft",
  "recipientName": "...",
  "recipientPhone": "...",
  "recipientAddress": "...",
  "resiUrl": null,
  "hasCustomLogo": false,
  "totalAmount": 1500000,
  "totalQty": 30,
  "isBilled": false,
  "items": [
    {
      "productId": "uuid",
      "productName": "...",
      "priceSnapshot": 50000,
      "qty": 10,
      "dtfStatus": "belum_cetak|sudah_cetak",
      "previewUrls": [],
      "designUrls": []
    }
  ]
}
```

---

## Ledgers — `src/api/routes/ledgers.ts`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/ledgers` | List sorted desc; role `mitra` auto-filter; query `mitraId=` |
| POST | `/api/ledgers` | Create — **dedup** `source='order'+referenceId` return existing |
| PUT | `/api/ledgers/:id` | Update partial |
| DELETE | `/api/ledgers/:id` | Delete single |
| DELETE | `/api/ledgers/order/:orderId` | Cascade delete by order (`source='order'`) |

Body: `{mitraId, source, direction, nominal, description, referenceId?, attachmentUrl?, paymentMethod?, referenceNumber?}`

---

## Requests (Cancellation/Return) — `src/api/routes/requests.ts`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/requests` | List all |
| POST | `/api/requests` | Create — `{type: 'cancellation'|'return', orderId, mitraId, reason, attachmentUrl?, status, creditAmount?}` |
| PUT | `/api/requests/:id` | Update status |

---

## Audit Logs — `src/api/routes/audit-logs.ts`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/audit-logs` | List, `?limit=100` (default 100, max 1000) |
| POST | `/api/audit-logs` | Create entry `{userId, action, details}` |

**Catatan**: audit log dipanggil **manual dari frontend** (`api.auditLogs.create()`), bukan auto pada backend.

---

## Priorities — `src/api/routes/priorities.ts`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/priorities` | List active; join orders+mitras; filter status (confirmed/processing/pressing) |
| POST | `/api/priorities` | Role **mitra-only**; quota check `mitra.priorityLimit`; dedup; status eligible |
| DELETE | `/api/priorities/:id` | Role **mitra-only**; ownership check |

Error: 403 (non-mitra / quota / forbidden), 404, 409 (duplicate), 422 (status ineligible).

---

## Upload — `src/api/routes/upload.ts`

### `POST /api/upload`
- Content-Type: `application/octet-stream` (raw binary, **bukan multipart**)
- Headers: `X-File-Name` (original filename untuk extract extension)
- Max size: 10MB (via `express.raw()`)
- Returns: `{ "url": "https://..." }` — public R2 URL
- Object key: `uploads/{timestamp}-{8-char-random}.{ext}`

---

## Frontend API Client (`src/lib/api.ts`)

```typescript
// Auth
await api.auth.login(phone, password)
await api.auth.me()

// Resources
await api.users.list() / create(data) / update(id, data) / remove(id)
await api.mitras.list() / create(data) / update(id, data) / remove(id)
await api.products.list() / create(data) / update(id, data) / remove(id)
await api.orders.list({ allMitras? }) / get(id) / create(data) / update(id, data) / remove(id)
await api.ledgers.list(mitraId?) / create(data) / update(id, data) / remove(id) / removeByOrder(orderId)
await api.requests.list() / create(data) / update(id, data)
await api.priorities.list() / create(data) / remove(id)
await api.auditLogs.list({ limit? }) / create(data)
await api.upload.file(file: File)
```

Token management: `getToken()`, `setToken(t)`, `clearToken()` — `localStorage('rema_token')`.

---

## Cross-Cutting Notes

1. **Tidak ada validasi body terstruktur** (no zod/joi) — semua route langsung destructure `req.body`.
2. **Tidak ada validasi transisi status order** di server.
3. **Tidak ada pagination** kecuali audit-logs `?limit=`.
4. **Tidak ada RBAC** terstruktur — sebagian route hanya cek auth, tanpa role.
5. UUID via `crypto.randomUUID()` di handler.
6. Error message campuran Indonesia/English.
