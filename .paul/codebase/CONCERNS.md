# Technical Concerns & Debt

## 🔴 Critical

### 1. Credentials di .env (Exposed in Repo)
**File:** `.env`  
**Issue:** DATABASE_URL, R2 keys, JWT_SECRET tersimpan plaintext. Jika `.env` tidak di `.gitignore` atau pernah di-commit, credentials bisa bocor.  
**Action:** Verifikasi `.env` ada di `.gitignore`. Rotate semua credentials jika pernah di-commit.

### 2. JWT_SECRET Lemah
**File:** `.env`  
**Current value:** `rema_jwt_secret_2025_production_change_me`  
**Issue:** Deskriptif, mudah ditebak, terlalu pendek untuk production.  
**Action:** Generate random string minimal 32 bytes.

---

## 🟠 High

### 3. Tidak Ada Input Validation di API Routes
**Files:** `src/api/routes/products.ts`, `mitras.ts`, `requests.ts`, `ledgers.ts`, `orders.ts`  
**Issue:** Body request langsung di-insert ke DB tanpa validasi schema:
```typescript
const [inserted] = await db.insert(products).values(body).returning(); // NO validation!
```
**Risk:** Data corrupt (price negatif, field kosong, tipe salah)  
**Fix:** Gunakan Zod untuk validasi semua body request

### 4. Tidak Ada RBAC di Backend
**Files:** Semua `src/api/routes/*.ts`  
**Issue:** Role check hanya di frontend (UI guard). API endpoints tidak verifikasi role.  
**Example:** Siapapun yang punya valid JWT bisa `DELETE /api/users/:id`  
**Fix:** Buat `requireRole(...roles)` middleware dan pasang di routes sensitif

---

## 🟡 Medium

### 5. Legacy Dead Code: `src/lib/db.ts`
**File:** `src/lib/db.ts`  
**Issue:** localStorage wrapper tidak diimport oleh halaman manapun. Tapi ada hardcoded password plaintext (`'rema1234'`) di initial state.  
**Action:** Hapus file ini sepenuhnya.

### 6. Tidak Ada Pagination di List Endpoints
**Files:** `src/api/routes/users.ts`, `mitras.ts`, `products.ts`, `orders.ts`, `ledgers.ts`  
**Issue:** `db.select().from(table)` tanpa `.limit()` — semua record dikembalikan.  
**Risk:** Memory issue & lambat saat data besar  
**Fix:** Tambah `?limit=50&offset=0` parameter

### 7. OrderItem Type Duplikasi (Singular + Plural)
**Files:** `src/db/schema.ts` L54-68, `src/types.ts` L36-49  
**Issue:** Ada `previewUrl` (string) DAN `previewUrls` (jsonb array) untuk data yang sama. Mana yang dipakai?  
**Fix:** Pilih satu pattern — array-only lebih flexible.

### 8. Resource Ownership Tidak Diverifikasi
**File:** `src/api/routes/mitras.ts` L30-40  
**Issue:** User bisa update mitra milik orang lain — tidak ada check `req.user.sub === mitra.userId`.

### 9. Cascade Delete Tidak Didefinisikan di Schema
**File:** `src/db/schema.ts`  
**Issue:** Foreign keys tanpa `.onDelete('cascade')`. Orphaned data mungkin terjadi jika delete manual gagal.  
**Workaround saat ini:** Multi-layer dependency check sebelum delete (manual & fragile)

### 10. `any` Types di Orders Route
**File:** `src/api/routes/orders.ts` L42, L78  
```typescript
items.map((item: any) => ...)  // No type safety
```

### 11. Aggregasi Keuangan di Client-Side
**File:** `src/pages/Finance.tsx` L49-78  
**Issue:** Group by tanggal dilakukan di frontend dari seluruh dataset. Seharusnya server-side dengan SQL GROUP BY.

---

## 🟢 Low

### 12. Tidak Ada Unique Constraint: `orderPriorities.orderId`
Seharusnya satu order hanya boleh punya satu priority entry.

### 13. `auditLogs.userId` Bukan Foreign Key
**Schema:** Disimpan sebagai `text`, tidak ada FK ke `users.id`.  
Ini intentional (tidak ingin block delete user) tapi bisa menyebabkan dangling references.

### 14. `console.log` di Production Code
Tersebar di `src/api/server.ts`, `src/api/routes/upload.ts`, beberapa halaman.  
Tidak ada structured logging framework.

### 15. Tidak Ada Error Correlation IDs
Semua error catch hanya return `{ error: err.message }` tanpa request ID, sehingga sulit debug production issues.

### 16. `@google/genai` Terinstall tapi Tidak Dipakai
Dependency cost tanpa manfaat saat ini. Hapus jika tidak ada rencana implementasi.

---

## Migration Status

| Item | Status |
|------|--------|
| localStorage → PostgreSQL | ✅ Selesai — semua halaman pakai API |
| `src/lib/db.ts` | ⚠️ Dead code, belum dihapus |
| File upload R2 | ✅ Selesai (Phase 10) |
| Backend RBAC | ❌ Belum diimplementasi |
| Input validation | ❌ Belum diimplementasi |
| Pagination | ❌ Belum diimplementasi |

---

## Priority Actions

**Segera:**
1. Verifikasi `.env` di `.gitignore`
2. Generate JWT_SECRET baru yang kuat
3. Hapus `src/lib/db.ts`

**Minggu ini:**
1. Tambah Zod validation di API routes
2. Implementasi `requireRole()` middleware
3. Tambah pagination ke list endpoints

**Backlog:**
1. Fix OrderItem type (pilih singular atau plural)
2. Structured logging + error correlation IDs
3. Cascade delete di schema
4. Agregasi Finance → server-side
