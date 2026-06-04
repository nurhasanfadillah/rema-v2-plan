# Audit Report — Phase 32: Code Audit & Cleanup

**Tanggal audit:** 2026-06-04
**Total temuan:** 14 (HIGH: 4, MEDIUM: 8, LOW: 2)

---

## Ringkasan Eksekutif

Tiga masalah terbesar yang perlu dikerjakan segera:
1. **`src/lib/db.ts`** — seluruh file legacy localStorage (121 baris) tidak digunakan oleh siapapun sejak Phase 2 migration selesai. Aman dihapus.
2. **`framer-motion` + `@google/genai`** — dua package di `package.json` tidak pernah diimport. Menambah berat instalasi tanpa manfaat.
3. **Tidak ada lazy loading** — semua 14 halaman diload eagerly. Bundle ~2.5 MB dimuat sekaligus saat pertama buka app, termasuk `@react-pdf/renderer` (~1.5 MB) yang hanya dipakai di 2 halaman.

---

## Kategori A: Dead Code & Unused Imports

| Severity | File | Temuan | Aksi |
|----------|------|--------|------|
| **HIGH** | `src/lib/db.ts` | Seluruh file (121 baris) — legacy localStorage layer. Tidak ada satu pun file di `src/` yang mengimportnya. Sudah dimigrate ke API sejak Phase 2. | Hapus file |
| **HIGH** | `package.json` | `framer-motion` terdaftar sebagai dependency tapi tidak pernah diimport. Semua animasi menggunakan `motion` package (`from 'motion/react'`). | `npm uninstall framer-motion` |
| **HIGH** | `package.json` | `@google/genai` terdaftar sebagai dependency tapi tidak ada satupun file di `src/` yang menggunakannya. | `npm uninstall @google/genai` |
| **MEDIUM** | `src/lib/utils.ts` | Fungsi `resizeImage()` (baris 42–66) — didefinisikan tapi tidak dipanggil di mana pun. Dulunya untuk resize gambar sebelum upload ke localStorage. | Hapus fungsi |
| **MEDIUM** | `src/pages/Dashboard.tsx` baris 5 | 8 icon lucide unused: `Package`, `ShoppingCart`, `Activity`, `Wallet`, `Users`, `LayoutDashboard`, `TrendingUp`, `Calendar`. Hanya `AlertCircle` yang dipakai di JSX. | Hapus 8 icon dari import |
| **MEDIUM** | `src/pages/Finance.tsx` baris 8 | 3 icon lucide unused: `TrendingDown`, `Info`, `Image as ImageIcon`. Tidak muncul di JSX. | Hapus 3 icon dari import |
| **MEDIUM** | `src/pages/orders/OrdersList.tsx` baris 8 | 3 icon lucide unused: `Eye`, `Package`, `User`. Tidak muncul di JSX. | Hapus 3 icon dari import |
| **MEDIUM** | `src/pages/orders/OrderDetail.tsx` baris 11–13 | `Printer` diimport dua kali — sekali sebagai `Printer`, sekali sebagai `Printer as PrinterIcon`. Yang dipakai hanya `PrinterIcon`. `Printer` (tanpa alias) adalah duplikat unused. Juga `ShieldAlert` diimport tapi tidak dipakai. | Hapus `Printer` (non-alias) dan `ShieldAlert` |
| **MEDIUM** | `src/components/Layout.tsx` baris 4 | `HelpCircle` diimport dari lucide-react tapi tidak dipakai di JSX maupun `links` array. | Hapus dari import |

---

## Kategori B: Kompleksitas Berlebihan

| Severity | File | Temuan | Aksi |
|----------|------|--------|------|
| **MEDIUM** | `src/pages/Finance.tsx` | File 1000 baris — tiga modal komponen (`PaymentModal`, `ChargeModal`, `TransactionDetailModal`) didefinisikan di file yang sama sebagai fungsi di bawah komponen utama. Menyulitkan navigasi. | Pertimbangkan ekstrak ke file terpisah (`src/components/finance/`) di fase mendatang (bukan blocking) |
| **LOW** | `src/lib/db.ts` | Error handling kompleks untuk `QuotaExceededError` (baris 48–54) — moot karena file akan dihapus. | Akan hilang setelah file dihapus |
| **LOW** | `src/pages/orders/OrderDetail.tsx` | `STATUS_LABELS` constant (baris 21–31) bisa jadi utility yang dishare dengan OrdersList, tapi duplikasi ini minor. | Opsional, tidak blocking |

---

## Kategori C: Performa & Bundle

| Severity | File | Temuan | Aksi |
|----------|------|--------|------|
| **HIGH** | `src/App.tsx` | **Zero lazy loading** — semua 14 halaman diimport eagerly di baris 11–26. Bundle mencapai ~2.5 MB dimuat sekaligus saat user pertama membuka app. Halaman berat seperti Finance (1000 baris), OrderDetail+Reports (pakai `@react-pdf/renderer` ~1.5 MB), dan Dashboard (recharts) semua masuk initial bundle. | Tambahkan `React.lazy()` + `Suspense` untuk setidaknya halaman berat |
| **MEDIUM** | `vite.config.ts` | Tidak ada `build.rollupOptions.output.manualChunks`. Library berat (`recharts`, `@react-pdf/renderer`) tidak dipisahkan ke chunk terpisah. | Tambahkan manual chunk config untuk vendor libraries besar |
| **MEDIUM** | `src/pages/AuditLogs.tsx` | Menggunakan `date-fns` (library ~75 KB) hanya untuk format tanggal. App sudah punya `formatDate` di `src/lib/utils.ts`. Cek apakah format `date-fns` berbeda atau bisa diganti. | Cek apakah `formatDate` dari utils bisa menggantikan `date-fns` di AuditLogs dan PDF components |

---

## File Yang Bersih (Tidak Ada Masalah Signifikan)

- `src/lib/api.ts` — clean, semua endpoint digunakan
- `src/lib/utils.ts` — clean setelah `resizeImage` dihapus (3 fungsi lainnya digunakan)
- `src/types.ts` — semua tipe digunakan
- `src/context/AuthContext.tsx` — clean, sederhana
- `src/context/ConfirmContext.tsx` — clean
- `src/db/schema.ts` — clean
- `src/api/routes/*` — semua route digunakan (requests.ts digunakan oleh CancellationsReturns)
- `src/components/RunningOrders.tsx`, `FileUpload.tsx`, `MultiFileUpload.tsx`, `Lightbox.tsx`, `PWAUpdateBanner.tsx` — semua digunakan

---

## Rekomendasi untuk Plan 32-02

### Prioritas HIGH (kerjakan dulu — quick wins, aman):

1. **Hapus `src/lib/db.ts`** — file 121 baris, zero dependents, pasti aman
2. **Uninstall 2 dead packages** — `npm uninstall framer-motion @google/genai`
3. **Hapus `resizeImage` dari `src/lib/utils.ts`**
4. **Hapus unused icon imports** dari 5 file (Dashboard, Finance, OrdersList, OrderDetail, Layout) — perubahan kecil, tidak ada behavior change

### Prioritas MEDIUM (performa — lebih impactful):

5. **Tambah lazy loading di `src/App.tsx`** — gunakan `React.lazy()` + `Suspense` minimal untuk:
   - `Finance` (berat)
   - `OrderDetail` (pakai `@react-pdf/renderer`)
   - `Reports` (pakai `@react-pdf/renderer`)
   - `AuditLogs`
   - `OrderPriorities`
   Ini akan memotong initial bundle secara signifikan
6. **Manual chunk splitting di `vite.config.ts`** — pisahkan `recharts` dan `@react-pdf/renderer` ke vendor chunk

### Prioritas LOW (opsional):

7. Cek apakah `date-fns` di `AuditLogs.tsx` bisa diganti `formatDate` dari utils (bisa kurangi 1 dependency)
8. Pertimbangkan ekstrak modal-modal dari Finance.tsx ke file terpisah (maintainability, bukan performa)

---

*Audit selesai: 2026-06-04 — siap untuk Plan 32-02*
