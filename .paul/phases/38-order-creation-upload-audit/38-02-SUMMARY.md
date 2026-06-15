---
phase: 38-order-creation-upload-audit
plan: 02
status: complete
completed: 2026-06-15
---

# Summary: Upload Size Limit Removal (10MB → 50MB)

## What Was Done

Empat file dimodifikasi untuk menaikkan batas upload secara konsisten dari 10MB ke 50MB.

### Files Modified

**`src/components/FileUpload.tsx`**
- Limit check: `10 * 1024 * 1024` → `50 * 1024 * 1024`
- Toast error: "...10MB" → "...50MB"
- UI hint text: "maks. 10MB" → "maks. 50MB"

**`src/components/MultiFileUpload.tsx`**
- Limit check: `10 * 1024 * 1024` → `50 * 1024 * 1024`
- Toast error: "...10MB" → "...50MB"

**`src/api/routes/upload.ts`**
- `express.raw({ limit: '10mb' })` → `express.raw({ limit: '50mb' })`

**`vercel.json`**
- Tambah `"memory": 1024` ke function config `api/index.ts`

### Tidak Berubah
- Upload handler logic (R2, key generation, error handling)
- File type validation / accept types
- Preview/thumbnail logic
- vercel.json rewrites dan maxDuration

## AC Results
- AC-1: Frontend menerima file 10–50MB ✅
- AC-2: Backend menerima body hingga 50MB ✅
- AC-3: Pesan error menyebut "50MB" ✅
- Lint: clean ✅
