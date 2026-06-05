# Phase Context: 34 — Cancellation & Return Approval Workflow

**Created:** 2026-06-05  
**Source:** /paul:discuss session  
**Phase:** 34 — Cancellation Return Approval

---

## Goals

Redesign alur pembatalan dan retur dari "mitra langsung eksekusi" menjadi "mitra ajukan → admin/staff approve". Ini adalah intent issue (bukan sekadar bug patch) — alur bisnis perlu dirancang ulang dari nol.

**Sukses terlihat seperti:**
- Mitra tidak bisa langsung mengubah status order ke `cancelled`/`returned`
- Mitra submit pengajuan dari halaman Pembatalan & Retur
- Admin/staff lihat daftar pengajuan pending dan bisa approve/reject
- Setelah approve: status order berubah + ledger di-cleanup
- Setelah reject: order tetap di status sebelumnya

---

## Alur Bisnis

### Pengajuan
- **Mitra:** Submit pengajuan dari halaman **Pembatalan & Retur** (bukan OrderDetail)
  - Pilih pesanan dari dropdown (filter: pesanan aktif miliknya)
  - Pilih tipe: Pembatalan atau Retur
  - Isi alasan
  - Submit → `ActionRequest` dibuat dengan status `pending`
  - Order **tetap** di status sebelumnya (tidak berubah)
- **Admin:** Bisa langsung cancel/return (bypass approval — karena mereka approver)
- **Staff:** Submit pengajuan (sama seperti mitra), perlu approval admin

### Approval
- **Siapa:** Admin + Staff bisa approve/reject
- **Approve:**
  - Status order → `cancelled` atau `returned`
  - Semua ledger entries terkait order dihapus (source: 'order', referenceId: orderId)
  - `ActionRequest` status → `approved`
- **Reject:**
  - Order tetap di status sebelumnya
  - `ActionRequest` status → `rejected`

### Ledger
- Perubahan ledger **hanya terjadi saat approve**, bukan saat pengajuan
- Baik cancel maupun return: **hapus semua ledger terkait order** (bukan buat entri baru)

---

## Scope Perubahan

### Backend
- `src/api/routes/orders.ts` — Blokir mitra dari langsung set `status: cancelled/returned` via PUT
- `src/api/routes/requests.ts` — Endpoint PUT approve: ubah status order + hapus ledger order
- `src/api/routes/ledgers.ts` — Tambah endpoint DELETE by orderId atau bulk delete

### Frontend
- `src/pages/orders/OrderDetail.tsx` — Hapus tombol cancel/return yang langsung eksekusi
- `src/pages/CancellationsReturns.tsx` — Redesign total:
  - Panel mitra: form submit pengajuan + daftar pengajuan sendiri
  - Panel admin/staff: daftar semua pending + tombol approve/reject per item

---

## Constraints

- Gunakan tabel `action_requests` yang sudah ada di schema
- Tidak perlu status transisi baru di orders (tidak perlu `pending_cancellation`)
- Hapus ledger via DELETE (bukan soft delete) — konsisten dengan behavior saat ini
- Admin bisa bypass (langsung cancel/return dari OrderDetail) — ini intentional

---

## Open Questions (untuk planning)

1. Apakah OrderDetail admin masih punya tombol cancel/return langsung?
2. Apakah mitra bisa menarik kembali (withdraw) pengajuan yang masih pending?
3. Format alasan (text bebas atau dropdown pilihan)?

---

## Prior Work

- `UAT-006` di `.paul/phases/33-security-bug-fixes/33-01-UAT.md` — dokumentasi masalah
- `src/pages/CancellationsReturns.tsx` — halaman yang akan di-redesign
- `src/pages/orders/OrderDetail.tsx` — file yang akan dihapus tombol cancel/return-nya
- `src/api/routes/requests.ts` — route yang akan diperluas dengan approve logic
