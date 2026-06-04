# Technical Concerns & Debt

Severity: 🔴 **Critical** | 🟠 **High** | 🟡 **Medium** | 🟢 **Low**

---

## 🔴 Critical

### 1. Credentials di .env (Exposed in Repo)
**File:** `.env`
**Issue:** `DATABASE_URL`, R2 keys, `JWT_SECRET` tersimpan plaintext. Jika `.env` tidak di `.gitignore` atau pernah di-commit, credentials bisa bocor.
**Action:** Verifikasi `.env` ada di `.gitignore`. Rotate semua credentials jika pernah di-commit.

### 2. JWT_SECRET Lemah
**File:** `.env`
**Current value:** `rema_jwt_secret_2025_production_change_me`
**Issue:** Predictable, deskriptif, terlalu pendek. Memungkinkan token forgery.
**Action:** Generate random string minimal 32 bytes, unik per environment, dokumentasikan rotasi.

---

## 🟠 High

### 3. Tidak Ada Input Validation di API Routes
**Files:** semua `src/api/routes/*.ts`
**Issue:** Body request langsung di-insert ke DB tanpa validasi schema:
```typescript
const [inserted] = await db.insert(products).values(body).returning(); // NO validation!
```
**Risk:** Data corrupt (price negatif, field kosong, tipe salah), mass assignment, type confusion.
**Fix:** Gunakan **Zod** untuk validasi semua body POST/PUT, validasi di entry handler.

### 4. Tidak Ada RBAC di Backend
**Files:** Semua `src/api/routes/*.ts`
**Issue:** Role check hanya di frontend (UI guard). API endpoints tidak verifikasi role.
**Example:** Siapa pun yang punya valid JWT (termasuk mitra) bisa `DELETE /api/users/:id`, `POST /api/products`, dll.
**Fix:** Buat `requireRole(...roles)` middleware dan pasang di routes sensitif (admin/staff only).

### 5. Ledger Dedup Hanya untuk `source='order'`
**File:** `src/api/routes/ledgers.ts:35-46`
**Status:** Recent fix (`2cac184`) prevent double-entry order. **Tapi**:
- `payment` / `cancellation` / `return` tidak dilindungi
- Tidak ada DB-level UNIQUE constraint
**Fix:** Tambah DB constraint `UNIQUE(source, referenceId) WHERE referenceId IS NOT NULL`; perluas dedup ke source lain.

### 6. Tidak Ada Test & CI
- Zero unit / integration / E2E automated
- Tidak ada `.github/workflows/`
**Impact:** Cannot safely refactor, no regression guard.
**Fix:** Setup Vitest + CI workflow minimal (lint + build).

### 7. Legacy Dead Code: `src/lib/db.ts`
**Issue:** localStorage wrapper tidak diimport oleh halaman manapun. Mengandung hardcoded plaintext password (`'rema1234'`) di initial state. Liability dan confusing.
**Action:** Audit lintas import, hapus file ini.

---

## 🟡 Medium

### 8. JWT Expiry 7 Hari Terlalu Panjang
**File:** `src/api/routes/auth.ts:72` → `.setExpirationTime('7d')`
**Risk:** Window curian token lebar, tanpa refresh / revocation.
**Fix:** Kurangi ke 1h + refresh token flow, tambah revocation list pada logout.

### 9. File Upload Validation Lemah
**File:** `src/api/routes/upload.ts:38-40`
- Hanya percaya `Content-Type` header dari client
- Extension dari `X-File-Name` (bisa `.php.jpg`)
- Tidak ada magic byte check / MIME whitelist
**Fix:** Whitelist MIME, validasi magic bytes, force naming tanpa user-controlled extension.

### 10. Tidak Ada Validasi Transisi Status Order di Server
**Files:** `src/pages/orders/OrderDetail.tsx`, `src/api/routes/orders.ts`
**Risk:** Direct API call bisa `confirmed → draft`, atau set `isBilled` langsung tanpa state machine.
**Fix:** State machine validator di backend PUT `/api/orders/:id`.

### 11. Race Condition pada `isBilled`
**File:** `src/pages/orders/OrderDetail.tsx:150`
**Issue:** Toggle `isBilled` + create ledger tidak atomic (neon-http no transaction).
**Fix:** Backend re-check `isBilled` sebelum insert ledger; idempotent guard.

### 12. Phone Normalization Tidak Konsisten
**Issue:** Normalize hanya di `auth.ts:16-20`. Users/mitra create lewat route lain tidak normalize → user duplikat `08xxx` vs `628xxx`.
**Fix:** Shared util backend, apply di semua endpoint terima phone; UNIQUE constraint normalized di schema.

### 13. Uang sebagai `real` (Float)
**File:** `src/db/schema.ts` (`nominal`, `price`, `totalAmount`)
**Risk:** IEEE 754 — 0.1 + 0.2 ≠ 0.3 di ledger calc, akumulasi error.
**Fix:** Migrate ke `integer` (cents IDR atau rupiah utuh).

### 14. Tidak Ada Pagination di List Endpoints
**Files:** users, mitras, products, orders, ledgers
**Risk:** Memory / timeout di skala 10k+ records.
**Fix:** `?limit=100&offset=0` (cap max 1000).

### 15. OrderItem Type Duplikasi (Singular + Plural)
**Files:** `src/db/schema.ts`, `src/types.ts`
**Issue:** `previewUrl` (string) DAN `previewUrls` (jsonb array) untuk data yang sama.
**Fix:** Pilih satu pattern — array-only lebih flexible.

### 16. Resource Ownership Tidak Diverifikasi
**File:** `src/api/routes/mitras.ts`
**Issue:** User mitra bisa update mitra milik orang lain — tidak ada check `req.user.sub === mitra.userId`.

### 17. Cascade Delete Tidak Didefinisikan di Schema
**File:** `src/db/schema.ts`
**Issue:** Foreign keys tanpa `.onDelete('cascade')`. Multi-layer dependency check manual & fragile.
**Fix:** Define cascade rules; tetap pertahankan business guard di handler.

### 18. Aggregasi Keuangan di Client-Side
**File:** `src/pages/Finance.tsx`
**Issue:** Group by tanggal dilakukan di frontend dari seluruh dataset.
**Fix:** Server-side SQL GROUP BY + pagination.

### 19. God Components (500+ lines)
- `Finance.tsx` ~999 lines
- `OrderDetail.tsx` ~689 lines
- `CreateOrder.tsx` ~524 lines
**Fix:** Ekstrak hook (`useOrderStatusUpdate`), sub-component (`<LedgerTable />`, `<OrderItemsForm />`).

### 20. PDF Bundle Tidak Code-Split
**Files:** `OrderSPKPDF.tsx`, `*ReportPDF.tsx`
**Issue:** `@react-pdf/renderer` ~200KB, bundled eager.
**Fix:** `React.lazy()` + dynamic import.

### 21. N+1 Pattern di Orders List
**File:** `src/api/routes/orders.ts`
**Issue:** 2 query + manual JS join — mahal di skala 1000+.
**Fix:** Drizzle relations `with: { items: true }` + pagination.

### 22. Tidak Ada DB Index Eksplisit
**File:** `src/db/schema.ts`
FK ada tapi tanpa `.index()` di kolom yang sering di-filter (`mitraId`, `referenceId`, `orderId`, `createdAt`).
**Fix:** Tambah indexes.

### 23. `.env.example` Tanpa Deskripsi
**Issue:** Onboarding susah; gampang misconfigure.
**Fix:** Komentar inline per var (sumber, format, contoh).

### 24. CORS Documentation Tidak Jelas
**File:** `src/api/index.ts:6-17`
**Fix:** Dokumentasikan whitelist per env; warn / fail-fast jika kosong di prod.

### 25. Generic Error Handling Tanpa Correlation ID
- Semua handler `catch (err: any)` → `{ error: err.message }` tanpa request ID
- Stack trace bisa leak sensitive info
**Fix:** Error handler middleware Express, classify error types, sanitize response prod, log dengan correlation ID.

---

## 🟢 Low

### 26. Tidak Ada Unique Constraint: `orderPriorities.orderId`
Seharusnya satu order = satu priority entry.

### 27. `auditLogs.userId` Bukan Foreign Key
Disimpan sebagai `text`. Intentional (tidak block delete user) tapi bisa dangling reference.

### 28. `console.log` di Production Code
**Files:** `auth.ts:78,98`, `upload.ts:33,58`, `seed.ts:17`, beberapa halaman.
**Fix:** Structured logger (pino / winston) level-based.

### 29. `@google/genai` Terinstall tapi Tidak Dipakai
Dependency cost tanpa manfaat. Hapus jika tidak ada rencana.

### 30. Type Duplikasi `types.ts` vs `schema.ts`
Dua source of truth mudah drift.
**Fix:** Backend pakai Drizzle inferred eksklusif; frontend types untuk UI-specific shapes saja.

### 31. `any` Prevalensi di Routes
40+ `catch (err: any)` + `items.map((item: any) => ...)` di `orders.ts`.
**Fix:** Tipe `unknown` + narrowing; central error helper.

### 32. API_PORT di Production Code
**File:** `src/api/server.ts:3`
Tidak relevan di Vercel serverless.
**Fix:** Guard `if (require.main === module)` agar tidak execute di serverless.

---

## Migration Status

| Item | Status |
|------|--------|
| localStorage → PostgreSQL | ✅ Selesai (semua page pakai API) |
| `src/lib/db.ts` cleanup | ⚠️ Dead code, belum dihapus |
| File upload R2 | ✅ Selesai (Phase 10) |
| Ledger dedup (source=order) | ✅ Selesai (`2cac184`) |
| Backend RBAC | ❌ Belum |
| Input validation (Zod) | ❌ Belum |
| Pagination | ❌ Belum |
| Unit/integration tests | ❌ Belum |
| CI/CD workflow | ❌ Belum |

---

## Priority Actions

**Segera (< 1 jam each):**
1. Verifikasi `.env` di `.gitignore` + rotate kredensial
2. Generate `JWT_SECRET` baru yang kuat
3. Hapus `src/lib/db.ts`
4. Dokumentasikan `.env.example` per variable

**Minggu ini:**
5. Tambah Zod validation di API routes (mulai POST/PUT)
6. Implementasi `requireRole()` middleware → pasang di routes sensitif
7. Perluas ledger dedup ke `payment`/`cancellation`/`return` + DB constraint
8. Setup `.github/workflows/ci.yml` minimal (lint + build)

**Backlog:**
9. Migrate money fields ke `integer` cents
10. State machine validator order transitions di backend
11. Pagination di list endpoints
12. Code-split PDF renderer
13. Setup Vitest + test ledger invariants
14. Refactor god components (Finance, OrderDetail, CreateOrder)
15. Tambah cascade rules + indexes di schema
