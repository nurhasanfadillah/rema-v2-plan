# API Reference

## Base URL

- Dev: `http://localhost:3001/api`
- Prod: `https://redone.my.id/api`

## Authentication

Semua endpoint (kecuali login) membutuhkan:
```
Authorization: Bearer <jwt_token>
```

---

## Auth

### `POST /api/auth/login`
```json
// Request
{ "phone": "082113133165", "password": "..." }

// Response 200
{ "token": "eyJ...", "user": { "id", "name", "phone", "role", "isActive", ... } }

// Response 401 — invalid credentials
{ "error": "Nomor atau password salah" }

// Response 423 — locked
{ "error": "Akun terkunci. Coba lagi dalam X menit." }
```

### `GET /api/auth/me`
Returns current user (SafeUser).

### `PATCH /api/users/:id/password`
```json
{ "currentPassword": "...", "newPassword": "..." }
```

---

## Users

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

---

## Mitras

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/mitras` | List all |
| POST | `/api/mitras` | Create |
| PUT | `/api/mitras/:id` | Update |
| DELETE | `/api/mitras/:id` | Delete (409 jika ada orders/ledgers) |

---

## Products

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/products` | List all |
| POST | `/api/products` | Create |
| PUT | `/api/products/:id` | Update |
| DELETE | `/api/products/:id` | Delete (409 jika dipakai di orders) |

---

## Orders

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/orders` | List all, `?mitraId=` filter |
| GET | `/api/orders/:id` | Single order dengan items |
| POST | `/api/orders` | Create order + items |
| PUT | `/api/orders/:id` | Update (hapus & recreate items) |
| DELETE | `/api/orders/:id` | Delete + cascade items |

**Order body (POST/PUT):**
```json
{
  "mitraId": "uuid",
  "type": "online|offline",
  "status": "draft",
  "items": [
    {
      "productId": "uuid",
      "productName": "...",
      "priceSnapshot": 50000,
      "qty": 10,
      "dtfStatus": "belum_cetak|sudah_cetak"
    }
  ]
}
```

---

## Ledgers

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/ledgers` | List, `?mitraId=` filter |
| POST | `/api/ledgers` | Create entry |
| PUT | `/api/ledgers/:id` | Update |
| DELETE | `/api/ledgers/:id` | Delete single |
| DELETE | `/api/ledgers/order/:orderId` | Cascade delete by order |

---

## Requests (Cancellation/Return)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/requests` | List all |
| POST | `/api/requests` | Create request |
| PUT | `/api/requests/:id` | Update status |

---

## Audit Logs

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/audit-logs` | List, `?limit=50` |
| POST | `/api/audit-logs` | Create entry |

---

## Priorities

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/priorities` | List active priorities |
| POST | `/api/priorities` | Add order to priority |
| DELETE | `/api/priorities/:id` | Remove from priority |

---

## Upload

### `POST /api/upload`
- Content-Type: `multipart/form-data`
- Field: `file`
- Max size: 10MB
- Returns: `{ "url": "https://..." }`

---

## Frontend API Client (`src/lib/api.ts`)

```typescript
// Usage examples
await api.auth.login(phone, password)
await api.auth.me()

await api.mitras.list()
await api.mitras.create(data)
await api.mitras.update(id, data)
await api.mitras.remove(id)

await api.orders.list()
await api.orders.get(id)
await api.orders.create(data)
await api.orders.update(id, data)
await api.orders.remove(id)

await api.ledgers.list(mitraId?)
await api.ledgers.create(data)
await api.ledgers.removeByOrder(orderId)

await api.upload.file(file: File)
```
