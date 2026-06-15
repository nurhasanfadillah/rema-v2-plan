---
phase: 38-order-creation-upload-audit
plan: 01
status: complete
completed: 2026-06-15
---

# Summary: Backend Order Creation Hardening

## What Was Done

Dua file dimodifikasi untuk memperkuat validasi backend pada proses pembuatan pesanan.

### Files Modified

**`src/api/index.ts`**
- `express.json()` → `express.json({ limit: '2mb' })` — mencegah 413 error pada order dengan banyak items/URLs

**`src/api/routes/orders.ts`**
- Import tambah: `and` dari drizzle-orm
- POST handler diupdate dengan 4 lapis validasi baru (sebelum insert):
  1. Resolve mitra dari JWT (`getMitraForUser`)
  2. Field validation: type enum ('online'|'offline'), items non-empty
  3. mitraId ownership check (enforce mitraId dari JWT, bukan dari body)
  4. Credit limit check: query `SUM(totalAmount)` orders `isBilled=false` vs `mitra.creditLimit`

### Tidak Berubah
- GET, PUT, DELETE handlers — tidak tersentuh
- Compensating delete logic — tetap ada
- Schema database — tidak berubah
- Frontend CreateOrder.tsx — tetap ada (defense in depth)

## Decisions Made
- Credit limit dihitung dari `SUM(totalAmount)` orders dengan `isBilled = false` (bukan dari ledger) — sesuai keputusan user
- mitraId selalu di-override dari JWT (bukan percaya body) untuk keamanan

## AC Results
- AC-1: express.json limit 2MB ✅
- AC-2: mitraId ownership enforced ✅
- AC-3: credit limit backend check aktif ✅
- AC-4: field validation (type + items) ✅
- Lint: clean ✅
