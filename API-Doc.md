# API Documentation — REMA-V2

**Base URL (Production):** `https://redone.my.id/api`  
**Base URL (Dev):** `http://localhost:3001/api`  
**Format:** JSON request & response  
**Auth:** Bearer token (JWT HS256, 7 hari)

---

## Autentikasi

Semua endpoint kecuali `POST /auth/login` membutuhkan header:

```
Authorization: Bearer <token>
```

Token didapat dari response `POST /auth/login` dan disimpan di `localStorage('rema_token')`.

---

## Tipe Data

### SafeUser
```typescript
{
  id: string
  name: string
  phone: string           // format: 62xxxxxxxx
  role: 'admin' | 'staff' | 'operational' | 'mitra'
  isActive: boolean
  mustChangePassword?: boolean
  failedLoginAttempts?: number
  lockedUntil?: number    // Unix ms
}
```

### Mitra
```typescript
{
  id: string
  userId: string
  name: string
  creditLimit: number | null
  isArchived: boolean
  logoUrl?: string
  priorityLimit?: number
}
```

### Product
```typescript
{
  id: string
  name: string
  price: number
  description?: string
  imageUrl?: string
  isArchived: boolean
}
```

### Order
```typescript
{
  id: string
  orderNumber: string     // 6 karakter unik
  mitraId: string
  type: 'online' | 'offline'
  resiUrl?: string        // untuk type online
  recipientName?: string  // untuk type offline
  recipientPhone?: string
  recipientAddress?: string
  items: OrderItem[]
  status: OrderStatus
  createdAt: number       // Unix ms
  updatedAt: number
  hasCustomLogo: boolean
  totalAmount: number
  totalQty: number
  isBilled: boolean       // true saat status mencapai packing
  creatorId?: string
}
```

### OrderStatus
```
'draft' | 'waiting_confirmation' | 'confirmed' | 'processing' | 'pressing' | 'packing' | 'shipped' | 'returned' | 'cancelled'
```

### OrderItem
```typescript
{
  id: string
  productId: string
  productName: string
  priceSnapshot: number
  qty: number
  isCustomLogo: boolean
  dtfStatus?: 'belum_cetak' | 'sudah_cetak'
  previewUrl?: string
  designUrl?: string
  previewUrls?: string[]
  designUrls?: string[]
  designNotes?: string
}
```

### LedgerEntry
```typescript
{
  id: string
  mitraId: string
  source: 'order' | 'payment' | 'manual' | 'cancellation' | 'return'
  direction: 'debit' | 'credit'
  nominal: number
  description: string
  createdAt: number
  referenceId?: string    // orderId jika terkait pesanan
  attachmentUrl?: string  // bukti pembayaran
  paymentMethod?: string
  referenceNumber?: string
}
```

### ActionRequest
```typescript
{
  id: string
  type: 'cancellation' | 'return'
  orderId: string
  mitraId: string
  reason: string
  attachmentUrl?: string
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'resolved' | 'cancelled'
  creditAmount?: number   // hanya untuk return
  createdAt: number
  updatedAt: number
}
```

### AuditLog
```typescript
{
  id: string
  userId: string
  action: string
  details: string
  createdAt: number
}
```

### OrderPriority
```typescript
{
  id: string
  orderId: string
  mitraId: string
  mitraName: string       // joined dari tabel mitras
  orderNumber: string     // joined dari tabel orders
  totalQty: number        // joined dari tabel orders
  notes: string | null
  createdAt: number
  createdBy: string
}
```

---

## Error Response

Semua error mengembalikan JSON:
```json
{ "error": "Pesan error dalam Bahasa Indonesia" }
```

---

## Endpoints

---

### Health

#### `GET /health`
Cek status API.

**Auth:** Tidak diperlukan

**Response 200:**
```json
{ "status": "ok" }
```

---

### Auth

#### `POST /auth/login`
Login dan dapatkan JWT token.

**Auth:** Tidak diperlukan

**Request Body:**
```json
{
  "phone": "082113133165",
  "password": "password123"
}
```

> Nomor telepon otomatis dinormalisasi: `0821xxx` → `62821xxx`

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { ...SafeUser }
}
```

**Error Responses:**

| Status | Kondisi | Pesan |
|--------|---------|-------|
| 400 | phone atau password kosong | `"Phone and password required"` |
| 401 | Pengguna tidak ditemukan | `"Pengguna tidak ditemukan atau kata sandi salah."` |
| 401 | Akun nonaktif | `"Akun dinonaktifkan."` |
| 401 | Akun terkunci | `"Akun terkunci. Coba lagi dalam X menit."` |
| 401 | Password salah | `"Kata sandi salah."` |

> Setelah 5 kali gagal login, akun dikunci selama 15 menit.

---

#### `GET /auth/me`
Ambil data pengguna yang sedang login.

**Auth:** Required

**Response 200:**
```json
{ "user": { ...SafeUser } }
```

**Error Responses:**

| Status | Kondisi |
|--------|---------|
| 401 | Token tidak valid |
| 404 | User tidak ditemukan |

---

### Users

#### `GET /users`
List semua pengguna.

**Auth:** Required

**Response 200:** `SafeUser[]`

---

#### `POST /users`
Buat pengguna baru.

**Auth:** Required

**Request Body:**
```json
{
  "name": "Nama Lengkap",
  "phone": "082113133165",
  "role": "staff",
  "isActive": true,
  "password": "passwordBaru123",
  "mustChangePassword": true
}
```

**Response 201:** `SafeUser`

---

#### `PUT /users/:id`
Update data pengguna.

**Auth:** Required

**Request Body:** Partial SafeUser fields. Opsional tambah `newPassword` untuk ganti password.

```json
{
  "name": "Nama Baru",
  "isActive": false,
  "newPassword": "passwordBaru"
}
```

**Response 200:** `SafeUser`

**Error 404:** User tidak ditemukan

---

#### `PATCH /users/:id/password`
Ganti password. Digunakan untuk flow `mustChangePassword`.

**Auth:** Required

**Request Body:**
```json
{
  "oldPassword": "passwordLama",
  "newPassword": "passwordBaru123"
}
```

> `oldPassword` opsional — jika tidak disertakan, langsung ganti tanpa verifikasi (untuk admin reset).

**Response 200:** `SafeUser` (dengan `mustChangePassword: false`)

**Error Responses:**

| Status | Kondisi |
|--------|---------|
| 400 | `newPassword` kosong |
| 401 | `oldPassword` tidak sesuai |
| 404 | User tidak ditemukan |

---

#### `DELETE /users/:id`
Hapus pengguna.

**Auth:** Required

**Error Responses:**

| Status | Kondisi |
|--------|---------|
| 403 | Tidak bisa hapus akun sendiri |
| 404 | User tidak ditemukan |
| 409 | User memiliki riwayat aktivitas di audit log |
| 409 | User mitra memiliki pesanan / ledger / request terkait |

> Jika user role `mitra` dengan data terkait, gunakan `PUT /users/:id` dengan `isActive: false` untuk menonaktifkan.

---

### Mitras

#### `GET /mitras`
List semua mitra.

**Auth:** Required

**Response 200:** `Mitra[]`

---

#### `POST /mitras`
Buat mitra baru.

**Auth:** Required

**Request Body:**
```json
{
  "userId": "uuid",
  "name": "Nama Mitra",
  "creditLimit": 5000000,
  "isArchived": false,
  "logoUrl": "https://storage.jisoi.net/uploads/...",
  "priorityLimit": 3
}
```

**Response 201:** `Mitra`

---

#### `PUT /mitras/:id`
Update data mitra.

**Auth:** Required

**Request Body:** Partial `Mitra` fields

**Response 200:** `Mitra`

---

#### `DELETE /mitras/:id`
Hapus mitra.

**Auth:** Required

**Error Responses:**

| Status | Kondisi |
|--------|---------|
| 404 | Mitra tidak ditemukan |
| 409 | Mitra memiliki pesanan terkait |
| 409 | Mitra memiliki entri ledger |
| 409 | Mitra memiliki action request |

---

### Products

#### `GET /products`
List semua produk.

**Auth:** Required

**Response 200:** `Product[]`

---

#### `POST /products`
Buat produk baru.

**Auth:** Required

**Request Body:**
```json
{
  "name": "Kaos Polos",
  "price": 45000,
  "description": "Kaos cotton combed 30s",
  "imageUrl": "https://storage.jisoi.net/uploads/...",
  "isArchived": false
}
```

**Response 201:** `Product`

---

#### `PUT /products/:id`
Update data produk.

**Auth:** Required

**Request Body:** Partial `Product` fields

**Response 200:** `Product`

---

#### `DELETE /products/:id`
Hapus produk.

**Auth:** Required

**Error 409:** Produk sudah digunakan di pesanan (tidak bisa dihapus, gunakan `isArchived: true`)

---

### Orders

#### `GET /orders`
List semua pesanan beserta items.

**Auth:** Required

**Query Parameters:**

| Param | Type | Keterangan |
|-------|------|-----------|
| `mitraId` | string | Filter pesanan milik mitra tertentu |

**Response 200:** `Order[]` (setiap order menyertakan array `items`)

---

#### `POST /orders`
Buat pesanan baru dengan items.

**Auth:** Required

**Request Body:**
```json
{
  "orderNumber": "ABC123",
  "mitraId": "uuid-mitra",
  "type": "online",
  "resiUrl": "https://...",
  "status": "draft",
  "hasCustomLogo": false,
  "totalAmount": 450000,
  "totalQty": 10,
  "isBilled": false,
  "createdAt": 1716800000000,
  "updatedAt": 1716800000000,
  "items": [
    {
      "productId": "uuid-produk",
      "productName": "Kaos Polos",
      "priceSnapshot": 45000,
      "qty": 10,
      "isCustomLogo": false,
      "dtfStatus": "belum_cetak"
    }
  ]
}
```

**Response 201:** `Order` (dengan items)

> Items di-insert secara sequential setelah order. Neon HTTP driver tidak support transactions.

---

#### `GET /orders/:id`
Ambil satu pesanan dengan items.

**Auth:** Required

**Response 200:** `Order` (dengan items)

**Error 404:** Pesanan tidak ditemukan

---

#### `PUT /orders/:id`
Update pesanan. **Items lama dihapus dan diganti items baru.**

**Auth:** Required

**Request Body:** Partial `Order` fields + `items` array

**Response 200:** `Order` (dengan items terbaru)

**Error 404:** Pesanan tidak ditemukan

---

#### `DELETE /orders/:id`
Hapus pesanan beserta semua items (cascade).

**Auth:** Required

**Response 200:** `{ "success": true }`

---

### Ledgers

#### `GET /ledgers`
List semua entri ledger.

**Auth:** Required

**Query Parameters:**

| Param | Type | Keterangan |
|-------|------|-----------|
| `mitraId` | string | Filter entri milik mitra tertentu |

**Response 200:** `LedgerEntry[]`

---

#### `POST /ledgers`
Buat entri ledger baru.

**Auth:** Required

**Request Body:**
```json
{
  "mitraId": "uuid-mitra",
  "source": "payment",
  "direction": "credit",
  "nominal": 1500000,
  "description": "Pembayaran pesanan ABC123",
  "createdAt": 1716800000000,
  "referenceId": "uuid-order",
  "paymentMethod": "Transfer BCA",
  "attachmentUrl": "https://storage.jisoi.net/uploads/..."
}
```

**Response 201:** `LedgerEntry`

---

#### `PUT /ledgers/:id`
Update entri ledger.

**Auth:** Required

**Request Body:** Partial `LedgerEntry` fields

**Response 200:** `LedgerEntry`

---

#### `DELETE /ledgers/:id`
Hapus satu entri ledger.

**Auth:** Required

**Response 200:** `{ "success": true }`

---

#### `DELETE /ledgers/order/:orderId`
Hapus semua entri ledger terkait satu pesanan (cascade delete).

**Auth:** Required

**Response 200:** `{ "success": true }`

---

### Requests (Pembatalan & Retur)

#### `GET /requests`
List semua action requests.

**Auth:** Required

**Response 200:** `ActionRequest[]`

---

#### `POST /requests`
Buat request pembatalan atau retur.

**Auth:** Required

**Request Body:**
```json
{
  "type": "cancellation",
  "orderId": "uuid-order",
  "mitraId": "uuid-mitra",
  "reason": "Stok bahan habis",
  "attachmentUrl": "https://...",
  "status": "submitted",
  "createdAt": 1716800000000,
  "updatedAt": 1716800000000
}
```

**Response 201:** `ActionRequest`

---

#### `PUT /requests/:id`
Update status request (misal: approve/reject oleh admin).

**Auth:** Required

**Request Body:**
```json
{
  "status": "approved",
  "creditAmount": 500000
}
```

**Response 200:** `ActionRequest`

---

### Audit Logs

#### `GET /audit-logs`
List audit log aktivitas.

**Auth:** Required

**Query Parameters:**

| Param | Type | Default | Keterangan |
|-------|------|---------|-----------|
| `limit` | number | semua | Batasi jumlah hasil |

**Response 200:** `AuditLog[]`

---

#### `POST /audit-logs`
Catat satu aktivitas ke audit log.

**Auth:** Required

**Request Body:**
```json
{
  "userId": "uuid-user",
  "action": "UPDATE_ORDER_STATUS",
  "details": "Order ABC123 status diubah dari confirmed ke processing"
}
```

**Response 201:** `AuditLog`

---

### Priorities (Prioritas Pesanan)

#### `GET /priorities`
List pesanan prioritas aktif (status: confirmed / processing / pressing).

**Auth:** Required

**Response 200:** `OrderPriority[]` (termasuk `mitraName`, `orderNumber`, `totalQty` dari join)

---

#### `POST /priorities`
Tambah pesanan ke daftar prioritas.

**Auth:** Required — **hanya role `mitra`**

**Request Body:**
```json
{
  "orderId": "uuid-order",
  "notes": "Deadline tanggal 5"
}
```

**Response 201:** `OrderPriority`

**Error Responses:**

| Status | Kondisi | Body |
|--------|---------|------|
| 400 | `orderId` kosong | `{ "error": "orderId required" }` |
| 403 | Bukan role mitra | `{ "error": "FORBIDDEN" }` |
| 403 | Quota habis | `{ "error": "QUOTA_EXCEEDED", "current": N, "limit": N }` |
| 403 | Order bukan milik mitra ini | `{ "error": "FORBIDDEN" }` |
| 404 | Order tidak ditemukan | `{ "error": "Order not found" }` |
| 409 | Order sudah ada di daftar prioritas aktif | `{ "error": "Order already in priority list" }` |
| 422 | Status order tidak eligible | `{ "error": "Order status not eligible for priority" }` |

> Order eligible: `confirmed`, `processing`, `pressing`. Quota ditentukan oleh field `priorityLimit` di data mitra.

---

#### `DELETE /priorities/:id`
Hapus entri prioritas.

**Auth:** Required — **hanya role `mitra`** (hanya bisa hapus milik sendiri)

**Response 204:** (no content)

**Error Responses:**

| Status | Kondisi |
|--------|---------|
| 403 | Bukan role mitra atau bukan milik mitra ini |
| 404 | Entry tidak ditemukan |

---

### Upload

#### `POST /upload`
Upload file ke Cloudflare R2.

**Auth:** Required

**Headers:**
```
Content-Type: <mime-type-file>        # e.g. image/jpeg, image/png
X-File-Name: nama-file.jpg            # nama asli file
Authorization: Bearer <token>
```

**Body:** Raw binary file (bukan multipart/form-data)

**Batas:** Max 10MB

**Response 200:**
```json
{ "url": "https://storage.jisoi.net/uploads/1716800000000-abc12345.jpg" }
```

**Error Responses:**

| Status | Kondisi |
|--------|---------|
| 400 | Body kosong |
| 500 | R2 env vars tidak terkonfigurasi atau error upload |

> Format key file di R2: `uploads/{timestamp}-{randomId}.{ext}`

---

## Frontend API Client (`src/lib/api.ts`)

Wrapper typed untuk semua endpoint. Otomatis attach Bearer token dari localStorage.

```typescript
import { api } from './lib/api';

// Auth
await api.auth.login('082113133165', 'password')
await api.auth.me()

// CRUD
await api.mitras.list()
await api.mitras.create(data)
await api.mitras.update(id, data)
await api.mitras.remove(id)

await api.products.list()
await api.products.create(data)
await api.products.update(id, data)
await api.products.remove(id)

await api.users.list()
await api.users.create(data)
await api.users.update(id, data)
await api.users.changePassword(id, { oldPassword, newPassword })
await api.users.remove(id)

await api.orders.list()
await api.orders.get(id)
await api.orders.create(data)
await api.orders.update(id, data)
await api.orders.remove(id)

await api.ledgers.list()
await api.ledgers.list(mitraId)     // filter by mitra
await api.ledgers.create(data)
await api.ledgers.update(id, data)
await api.ledgers.remove(id)
await api.ledgers.removeByOrder(orderId)

await api.requests.list()
await api.requests.create(data)
await api.requests.update(id, data)

await api.auditLogs.list()
await api.auditLogs.list(50)        // limit 50
await api.auditLogs.create(data)

await api.priorities.list()
await api.priorities.create({ orderId, notes })
await api.priorities.remove(id)

await api.upload.file(file)         // File object dari input/drag-drop
```

**Error handling:**

Semua method melempar `Error` dengan pesan dari server jika response tidak OK:
```typescript
try {
  const result = await api.orders.create(data);
} catch (err: any) {
  toast.error(err.message || 'Terjadi kesalahan');
}
```

---

## Catatan Teknis

| Topik | Detail |
|-------|--------|
| **Token expiry** | 7 hari sejak login |
| **Phone format** | Input `0821xxx` otomatis dikonversi ke `62821xxx` |
| **ID format** | `crypto.randomUUID()` — UUID v4 string |
| **Timestamps** | Unix milliseconds (`Date.now()`) — `number` di TS, `bigint` di DB |
| **Transactions** | Tidak tersedia (Neon HTTP driver) — sequential inserts |
| **Upload key** | `uploads/{ms}-{8charUUID}.{ext}` |
| **CORS** | Origin diatur via env var `CORS_ORIGIN` (comma-separated) |

---

*Diperbarui: 2026-05-29 · Versi API: 2.5.0*
