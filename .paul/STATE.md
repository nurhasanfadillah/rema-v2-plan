# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-09-13)

**Core value:** Admin dapat mengelola pesanan dan keuangan mitra secara real-time dengan data persisten di cloud, bukan di browser.
**Current focus:** Phase 45 complete — chip filter DTF di Daftar Pesanan kini hanya tampil di desktop (disembunyikan di mobile).

## Current Position

Milestone: v2.5 UI Fixes (rolling)
Phase: 45 (Orders List: Filter DTF Hanya di Desktop) — Complete
Plan: Not started
Status: Ready to plan next phase
Last activity: 2026-10-23 — Phase 45 transitioned; PROJECT.md + ROADMAP.md evolved

Progress:
- Phase 45: [██████████] 100% (1 of 1 plans complete)

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop 45 closed — Phase 45 complete]
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
| Rekap Produk (Produk + Qty, harga digabung) ditaruh di ATAS tabel rincian PDF; hanya PDF, tab di layar tidak berubah | Phase 43 | Pilihan user; PDF tetap memuat rincian per harga; tanpa mode ekspor tambahan |
| `productQty` dihitung di `buildBillingRecap` per `productId` (nama terbaru, urut A–Z), bukan di komponen PDF | Phase 43 | Satu sumber agregasi; Σ productQty = totalQty; teruji di Node |
| Rekap Produk tanpa kolom harga/total uang | Phase 43 | Fokus produk + qty; PDF punya TOTAL Qty |
| Filter status cetak DTF di Daftar Pesanan berbentuk chip satu baris (Semua DTF / Belum Cetak / Sudah Cetak / Tanpa DTF), bukan dropdown + bottom sheet kedua | Phase 44 | Kode filter status yang ada tidak disentuh; chip membungkus bila sempit (sejak Phase 45 hanya tampil di desktop) |
| Kategori DTF per pesanan: Belum Cetak = ada ≥1 item custom yang belum dicetak (dtfStatus 'belum_cetak', null, atau kosong; termasuk parsial); Sudah Cetak = semua item custom sudah dicetak; Tanpa DTF = tidak ada item custom | Phase 44 | Pilihan user; aturan sama persis dengan guard Press Sablon (`OrderDetail.tsx:100`); sumber kebenaran `items[].isCustomLogo`, bukan `order.hasCustomLogo` |
| Hitungan chip DTF = lingkup role + filter status terpilih, tanpa pencarian; hitungan opsi filter status tidak memperhitungkan filter DTF | Phase 44 | Belum + Sudah + Tanpa = Semua DTF; selaras dengan hitungan status yang juga tidak memperhitungkan pencarian |
| Klasifikasi/penyaringan/penghitungan DTF di fungsi murni modul `src/components/orders/dtf-filter/` (hanya `import type`); state filter tetap di `OrdersList.tsx` | Phase 44 | Pola modul Phase 42 dipakai ulang untuk fitur filter; teruji 10 kasus di Node tanpa test runner |
| Chip filter DTF hanya tampil di desktop (md / 768px ke atas), disembunyikan di mobile lewat wrapper `hidden md:block` di `OrdersList.tsx` | Phase 45 | Permintaan user; menggantikan "layout sama untuk mobile dan desktop" dari keputusan Phase 44; keputusan breakpoint tetap di halaman, bukan di komponen modul |

### Git State
Last commit: 6e61449 — feat(44): orders list - filter status cetak DTF (chip Belum/Sudah Cetak/Tanpa DTF)
Branch: main
Feature branches merged: none

### Blockers/Concerns
- None

### Deferred Issues
- Extract `STATUS_LABELS` ke `src/lib/order-status.ts` sebagai shared constant (saat ini duplicate di OrderDetail.tsx + OrderSPKPDF.tsx + Reports.tsx).
- Evaluasi apakah `cancelled`/`returned` harus exclude dari kalkulasi `totalQty`/`totalSubtotal`/chart di tab Pesanan (saat ini ikut, sedangkan tab Keuangan exclude `cancellation`/`return`).
- Seragamkan format mata uang PDF: `FinanceReportPDF`/`OrderReportPDF` memakai `formatCur` 2 desimal ("Rp 1.800.000,00"), `BillingRecapPDF` memakai `formatCurrency` 0 desimal.
- Kolom `real` (float4) pada `totalAmount`/`priceSnapshot`/`ledgers.nominal` kehilangan presisi integer di atas ±Rp 16,7 jt — pertimbangkan `numeric`/`bigint`; belum ada selisih yang dilaporkan.
- Badge "DTF" lama di `OrdersList.tsx` menyala bila ≥1 item `sudah_cetak`, sehingga pesanan parsial menampilkan badge "DTF" sekaligus masuk filter "Belum Cetak" — pertimbangkan menyelaraskan badge dengan kategori `getOrderDtfCategory`.
- `OrdersList.tsx` memanggil `React.useEffect` setelah `if (!user) return null` (pelanggaran aturan hooks yang sudah ada sebelum Phase 44) — pindahkan hook ke atas early return.
- Hitungan opsi filter status di `OrdersList.tsx` belum memperhitungkan filter DTF: memilih "Belum Cetak" lalu status "Press Sablon" bisa menghasilkan 0 walau opsi menampilkan angka > 0 (chip DTF menunjukkan alasannya).
- Filter DTF yang sedang aktif tetap menyaring daftar bila jendela desktop dipersempit di bawah 768px (chip tersembunyi, tidak ada kontrol untuk melepasnya sampai halaman dimuat ulang atau jendela dilebarkan) — pertimbangkan reset ke 'all' saat viewport mobile (matchMedia).

## Session Continuity

Last session: 2026-10-23
Stopped at: Phase 45 transition complete
Next action: /paul:discuss atau /paul:plan untuk phase baru, atau selesai
Resume file: .paul/phases/45-orders-dtf-filter-desktop-only/45-01-PLAN.md

---
*STATE.md — Updated after every significant action*
