# Phase 30 Context: Priority Header Mobile Layout Fix

## Phase Goal

Button "Tambah Prioritas" di halaman Prioritas Pesanan pindah ke baris kedua pada mobile — tidak sejajar dengan judul halaman.

## Problem

`src/pages/OrderPriorities.tsx:115` — wrapper container pakai `flex items-center justify-between` sehingga button selalu inline dengan judul di semua ukuran layar.

## Approach

Ubah wrapper menjadi dua baris di mobile, tetap satu baris di desktop:
- Mobile: `flex-col gap-3` → judul baris 1, button baris 2 (right-aligned via `self-end`)
- Desktop `md:`: `flex-row items-center justify-between` → seperti sekarang

## File

- `src/pages/OrderPriorities.tsx` — baris 115, hanya perubahan className container dan button alignment
