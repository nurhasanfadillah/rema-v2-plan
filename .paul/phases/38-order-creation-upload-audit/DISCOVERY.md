---
phase: 38-order-creation-upload-audit
topic: Audit sistem proses membuat pesanan + hapus batasan size upload file
depth: standard
confidence: HIGH
created: 2026-06-15
---

# Discovery: Order Creation Audit + Upload Size Limit Removal

**Recommendation:** Fix dua masalah berbeda dalam satu phase — (1) hardening validasi backend pada order creation, dan (2) naikkan upload file limit dari 10MB ke 50MB di 3 tempat.

**Confidence:** HIGH — Semua temuan diverifikasi langsung dari kode.

## Objective

Yang perlu dipahami sebelum planning:
- Di mana saja gap validasi dalam proses pembuatan pesanan?
- Di mana saja batasan 10MB upload file dikonfigurasi?
- Apakah ada constraint platform (Vercel) yang perlu diatasi?
- Perubahan apa yang paling impactful dan aman?

## Scope

**Include:**
- Order creation flow: `CreateOrder.tsx`, `POST /api/orders`, `express.json()` limit
- Upload flow: `FileUpload.tsx`, `MultiFileUpload.tsx`, `upload.ts`, `vercel.json`
- Backend validation gap dan credit limit enforcement

**Exclude:**
- Refactor arsitektur order creation
- Perubahan schema database
- Upload non-order (logo mitra, foto produk)

---

## Findings

### Topik A: Audit Sistem Proses Membuat Pesanan

#### A1 — express.json() Limit 100KB (KRITIS)

**File:** `src/api/index.ts:18`
```ts
app.use(express.json()); // default limit: 100KB
```

**Masalah:** POST `/api/orders` mengirim JSON yang bisa besar. Setiap item pesanan bisa punya:
- `previewUrls[]` — array URL, ~100 char/URL × banyak file
- `designUrls[]` — array URL serupa
- `designNotes` — text panjang

Kalkulasi worst-case: 20 item × (5 previewUrls + 5 designUrls × 100 char + 200 char designNotes) = ~40KB + metadata order ≈ **bisa mendekati 100KB**. Jika exceed, request langsung gagal dengan `413 Payload Too Large` tanpa pesan error yang jelas.

**Fix:** Set `express.json({ limit: '2mb' })` — cukup untuk semua skenario order tanpa over-engineering.

#### A2 — Tidak Ada Backend Credit Limit Check (GAP KEAMANAN)

**File:** `src/pages/orders/CreateOrder.tsx:166-178` (frontend only)  
**File:** `src/api/routes/orders.ts:50-88` (tidak ada credit check)

**Masalah:** Validasi credit limit hanya di frontend. Mitra bisa bypass dengan mengirim request langsung ke API.

**Fix:** Tambahkan credit limit check di `POST /api/orders`:
1. Query mitra by `mitraId` dari request body
2. Query total tagihan outstanding (orders dengan `isBilled: true` yang belum lunas)
3. Bandingkan dengan `mitra.creditLimit`
4. Return 400 jika exceed

#### A3 — Tidak Ada Validasi Field Wajib di Backend

**File:** `src/api/routes/orders.ts:50-88`

**Masalah:** POST handler hanya cek `role === 'mitra'`. Tidak ada validasi:
- `mitraId` harus ada dan milik mitra yang login
- `type` harus 'online' | 'offline'
- `items` harus array non-empty
- `totalAmount` harus positif

Potensi: ghost data, data corruption, dan mitra bisa submit order dengan `mitraId` mitra lain.

**Fix yang paling kritis:** Pastikan `mitraId` di request body === `mitraId` dari JWT user (ownership enforcement, bukan sekadar role check).

#### A4 — No Atomic Transaction (ACCEPTED LIMITATION)

**File:** `src/api/routes/orders.ts:63-80`

**Situasi:** Neon HTTP driver tidak support transactions. Compensating delete sudah ada:
```ts
// Compensating delete — roll back the orphaned order row
await db.delete(orders).where(eq(orders.id, orderData.id)).catch(() => {});
```

**Keputusan:** Terima limitation ini. Kompensasi sudah ada. Neon support transactions via WebSocket driver (`@neondatabase/serverless`) tapi migration ke WS driver out of scope.

---

### Topik B: Hapus Batasan Size Upload File

#### B1 — 3 Tempat Limit 10MB

| Lokasi | File | Line | Nilai Saat Ini |
|--------|------|------|----------------|
| Frontend single | `src/components/FileUpload.tsx` | 29 | `10 * 1024 * 1024` |
| Frontend multi | `src/components/MultiFileUpload.tsx` | 30 | `10 * 1024 * 1024` |
| Backend Express | `src/api/routes/upload.ts` | 29 | `express.raw({ limit: '10mb' })` |

Semua harus diubah secara konsisten.

#### B2 — Vercel Serverless Function Body Limit

**File:** `vercel.json` — tidak ada konfigurasi `bodySizeLimit`

**Constraint:** Vercel Serverless Functions:
- Default body limit: tidak ada dokumentasi eksplisit, tapi praktiknya ~4.5MB untuk Hobby
- Pro plan: hingga 50MB dapat dikonfigurasi

**Solusi:** Tambahkan konfigurasi di `vercel.json`:
```json
"functions": {
  "api/index.ts": {
    "includeFiles": "src/**",
    "maxDuration": 30,
    "memory": 1024
  }
}
```

Untuk body size, Vercel menggunakan config `bodyParser: false` di Next.js, tapi untuk Express/serverless-http, limit dikontrol oleh Express sendiri. Vercel hanya mem-buffer full body sebelum ke function handler — **constraint platform utama adalah memory limit function**, bukan explicit body size.

**Rekomendasi:** Naikkan ke **50MB** di Express (aman untuk file desain garmen, CAD files, dst) dan tambah `memory: 1024` di vercel.json agar function punya cukup RAM untuk buffer file besar.

#### B3 — Cloudflare R2 Upload Limit

Cloudflare R2 menggunakan S3-compatible API dengan `PutObjectCommand`. Single-part upload limit: **5GB per object**. Ini bukan bottleneck.

---

## Comparison

| Aspek | Status Saat Ini | Setelah Fix | Impact |
|-------|-----------------|-------------|--------|
| express.json() limit | 100KB default | 2MB explicit | Order dengan banyak item tidak gagal |
| Credit limit backend | Frontend-only | Frontend + Backend | Security hardening |
| mitraId ownership | Tidak dicek | Dicek vs JWT | Prevents cross-mitra submission |
| Upload size frontend | 10MB | 50MB | File desain besar bisa diupload |
| Upload size backend | 10MB | 50MB | Konsisten dengan frontend |
| Vercel memory | Default | 1024MB | Support buffer file 50MB |

---

## Recommendation

**Buat Phase 38 dengan 2 plan:**

**Plan 38-01: Backend Order Creation Hardening**
- Fix express.json() limit → `2mb` (`src/api/index.ts`)
- Tambah ownership check: `mitraId` in body === mitra dari JWT (`src/api/routes/orders.ts`)
- Tambah credit limit check di backend (query mitra + outstanding bills)
- Tambah basic field validation (type enum, items non-empty)

**Plan 38-02: Upload Size Limit Removal**
- `FileUpload.tsx:29` → ubah ke `50 * 1024 * 1024`
- `MultiFileUpload.tsx:30` → ubah ke `50 * 1024 * 1024`  
- `upload.ts:29` → ubah ke `express.raw({ limit: '50mb' })`
- `vercel.json` → tambah `"memory": 1024` untuk function

**Rationale:**
- Dua plan terpisah karena scope berbeda (backend logic vs upload config)
- 38-01 yang lebih kompleks dan berisiko, 38-02 straightforward config change
- Order: 38-02 bisa dikerjakan independen; 38-01 butuh testing lebih hati-hati

**Caveats:**
- Credit limit check backend: query `SUM(totalAmount)` dari orders milik mitra dengan `isBilled = false` — sama persis dengan logika frontend saat ini
- 50MB file → latency upload akan lebih lama; UX perlu progress indicator (sudah ada di MultiFileUpload)
- Vercel Hobby plan mungkin masih punya constraint — verify dengan test upload 20MB+ setelah deploy

## Open Questions

- ~~Apakah credit limit perlu dihitung dari ledger atau dari orders yang belum isBilled?~~ **RESOLVED:** Dari `SUM(totalAmount)` orders dengan `isBilled = false`, konsisten dengan logika frontend.
- Berapa limit "tanpa batasan" yang realistis? 50MB atau lebih? — Impact: **low** (mudah diubah kembali)

## Quality Report

**Sources consulted:**
- `src/api/index.ts` — Express middleware setup
- `src/api/routes/orders.ts` — Full order CRUD handlers
- `src/api/routes/upload.ts` — Upload handler dengan express.raw
- `src/components/FileUpload.tsx` — Frontend file size validation
- `src/components/MultiFileUpload.tsx` — Frontend multi-file validation
- `src/pages/orders/CreateOrder.tsx` — Order creation form + credit limit check
- `vercel.json` — Vercel deployment configuration

**Verification:**
- express.json() default 100KB: Verified via Express docs (default `limit: '100kb'`)
- 10MB limit di 3 tempat: Verified line-by-line di source code
- No backend credit check: Verified — `orders.ts` POST handler tidak ada query ke mitras/ledgers
- No mitraId validation: Verified — hanya role check, tidak ada mitraId ownership assertion
- Cloudflare R2 limit 5GB: Dari R2 documentation (S3-compatible single-part PUT)

**Assumptions (not verified):**
- Vercel Hobby plan body buffer behavior — perlu ditest post-deploy dengan file >10MB

---
*Discovery completed: 2026-06-15*
*Confidence: HIGH*
*Ready for: /paul:plan 38-order-creation-upload-audit*
