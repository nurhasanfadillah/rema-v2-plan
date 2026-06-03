# SUMMARY — Phase 31, Plan 01

## What Was Done

Menambahkan tampilan nama produk + qty per item pesanan di halaman daftar pesanan (OrdersList.tsx).

### Changes
- **Import** `OrderItem` dari `../../types`
- **Helper** `renderItemsSummary(items, maxItems=3)` — render `productName × qty` per item, truncation "+N lainnya" jika > 3 item
- **Mobile card** — section baru antara header (orderNumber/date) dan footer (tipe/total), menampilkan ringkasan item
- **Desktop table** — kolom baru "Item Pesanan" setelah "Tipe", sebelum "Total Qty", max-width 250px
- **colSpan** updated 6 → 7 di empty state row

## Files Modified

| File | Change |
|------|--------|
| `src/pages/orders/OrdersList.tsx` | +import, +helper, +mobile items section, +desktop column, colSpan fix |

## Verification

- [x] `npm run lint` — no errors
- [x] `npm run build` — success (13.27s)
- [x] AC-1: Mobile card menampilkan item produk
- [x] AC-2: Desktop table kolom "Item Pesanan"
- [x] AC-3: Truncation "+N lainnya" untuk 4+ item
- [x] AC-4: Styling konsisten dark theme (slate-300/500, text-[11px])

## Decisions

None — straightforward UI addition.

## Deferred Issues

None.
