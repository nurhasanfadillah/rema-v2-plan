# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-13)

**Core value:** Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.
**Current focus:** Phase 42 complete — halaman Laporan kini punya tab "Rekap Tagihan" (Produk · Qty · Harga · Total dari pesanan tercatat tagihan) + ekspor PDF.

## Current Position

Milestone: v2.5 UI Fixes (rolling)
Phase: 42 (Reports: Rekap Tagihan per Produk) — Complete
Plan: Not started
Status: Ready to plan next phase
Last activity: 2026-10-22 — Phase 42 transitioned; PROJECT.md + ROADMAP.md evolved

Progress:
- Phase 42: [██████████] 100% (1 of 1 plans complete)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop 42 closed — Phase 42 complete]
```

## Accumulated Context

### Decisions
| Decision | Phase | Impact |
|----------|-------|--------|
| Mount PWAUpdateBanner di wrapper div utama Layout (bukan Content Area) | Phase 28 | Banner fixed-bottom tidak terpotong overflow-hidden |
| Backend enforce mitra filter (orders + ledgers API) | Phase 29 | Data isolation reliable — tidak bisa di-bypass dari frontend |
| Role + ownership check di orders/requests API | Phase 33 | Mitra tidak bisa akses/modifikasi order mitra lain; hanya admin/staff approve requests |
| AuthRequest type di route handlers yang akses req.user | Phase 29 | Konsisten dengan priorities.ts; fix TS type error |
| Submit cancel/return → pending ActionRequest (bukan eksekusi langsung) | Phase 34 | Approval workflow — backend eksekusi hanya saat admin/staff approve |
| 'pending' ditambah ke RequestStatus union | Phase 34 | Backend support 'pending' sejak 34-01 tapi frontend type belum ada |
| mitraId di-override dari JWT di POST /api/orders | Phase 38 | Prevent cross-mitra order creation; tidak trust body |
| Credit limit backend dari SUM(totalAmount) orders isBilled=false | Phase 38 | Konsisten dengan logika frontend; simpel tanpa query ledger |
| Upload limit 50MB + Vercel memory 1024MB | Phase 38 | File desain garmen sering >10MB |
| Filter status Reports selaras dengan STATUS_LABELS OrderDetail (duplicate accepted) | Phase 39 | Konsistensi label UI tanpa refactor ekstraksi shared constant (deferred) |
| Antrian Produksi exclude `packing` (dianggap sudah lepas dari antrian aktif) | Phase 40 | `packing` set `isBilled=true` — secara bisnis sudah masuk fase billing/kirim |
| Antrian Produksi include `waiting_confirmation` di kepala alur | Phase 40 | Operator perlu visibilitas pesanan yang belum di-confirm agar bisa dikejar approval |
| Label card AppQueue ringkas (Menunggu/Dikonfirmasi/Diproses/Sablon) | Phase 40 | Grid card kompak butuh label pendek; konteks berbeda dari dropdown/badge full |
| Nama mitra ditampilkan inline di `h1` OrderDetail (`{orderNumber} — {mitraName}`) | Phase 41 | Opsi inline (bukan baris baru) dipilih agar header tetap compact; em dash separator konsisten dengan konvensi tipografi UI |
| Fallback `orderMitra ? ` — ${name}` : ''` (tidak crash saat mitra dangling) | Phase 41 | Data mitraId adalah FK — seharusnya tidak dangling, tapi ternary check membuat kode robust terhadap edge case data anomali |
| Rekap Tagihan = tab baru di Laporan (bukan di tab Keuangan/Pesanan); hanya admin + mitra | Phase 42 | Filter dan PDF sendiri; tab lama tidak berubah; staff tidak melihat tab (seperti Keuangan) |
| Baris rekap dikelompokkan per `productId + priceSnapshot` | Phase 42 | Produk sama harga beda = baris terpisah; Qty × Harga = Total tiap baris; tanpa harga rata-rata |
| Periode rekap = tanggal ledger debit `source:'order'`; order `isBilled` tanpa ledger dilewati | Phase 42 | Selaras dengan filter tab Keuangan; total rekap = Σ debit order |
| Fitur baru berbentuk modul folder + `index.ts` public API, file kebab-case, named export, tanpa `any` | Phase 42 | Pola acuan modul baru (CLAUDE.md global); file lama tidak di-rename; tsconfig tetap non-strict |
| PDF rekap memakai `formatCurrency` 0 desimal | Phase 42 | Selaras tampilan layar; berbeda dari PDF lama (2 desimal) — lihat Deferred Issues |

### Git State
Last commit: d66b61d — feat(41): order detail header - tampilkan nama mitra inline
Branch: main
Feature branches merged: none

### Blockers/Concerns
- None

### Deferred Issues
- Extract `STATUS_LABELS` ke `src/lib/order-status.ts` sebagai shared constant (saat ini duplicate di OrderDetail.tsx + OrderSPKPDF.tsx + Reports.tsx).
- Evaluasi apakah `cancelled`/`returned` harus exclude dari kalkulasi `totalQty`/`totalSubtotal`/chart di tab Pesanan (saat ini ikut, sedangkan tab Keuangan exclude `cancellation`/`return`).
- Seragamkan format mata uang PDF: `FinanceReportPDF`/`OrderReportPDF` memakai `formatCur` 2 desimal ("Rp 1.800.000,00"), `BillingRecapPDF` memakai `formatCurrency` 0 desimal.
- Kolom `real` (float4) pada `totalAmount`/`priceSnapshot`/`ledgers.nominal` kehilangan presisi integer di atas ±Rp 16,7 jt — pertimbangkan `numeric`/`bigint`; belum ada selisih yang dilaporkan.

## Session Continuity

Last session: 2026-10-22
Stopped at: Phase 42 transition complete — SUMMARY, PROJECT.md, ROADMAP.md, STATE.md diperbarui
Next action: /paul:discuss atau /paul:plan untuk phase baru, atau selesai
Resume file: .paul/ROADMAP.md

---
*STATE.md — Updated after every significant action*
