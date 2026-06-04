---
phase: 32-code-audit-cleanup
plan: 01
type: research
status: complete
completed: 2026-06-04
---

# Summary: Plan 32-01 — Code Audit

## What Was Done

Audit menyeluruh seluruh `src/` codebase REMA-V2 — 40+ file dibaca dan dianalisis mencakup semua halaman, komponen, lib utilities, API routes, dan package.json.

## Output

`AUDIT-REPORT.md` — 14 temuan terkategorisasi (HIGH: 4, MEDIUM: 8, LOW: 2).

## Temuan Utama

**Dead Code (HIGH):**
- `src/lib/db.ts` — file 121 baris, legacy localStorage layer, zero imports. Aman dihapus.
- `framer-motion` di package.json — dependency tidak pernah diimport (semua gunakan `motion` package)
- `@google/genai` di package.json — dependency tidak pernah diimport

**Unused Imports (MEDIUM):**
- Dashboard.tsx: 8 icon lucide unused
- Finance.tsx: 3 icon unused
- OrdersList.tsx: 3 icon unused
- OrderDetail.tsx: `Printer` (duplicate) + `ShieldAlert` unused
- Layout.tsx: `HelpCircle` unused
- utils.ts: `resizeImage()` function unused

**Performa (HIGH):**
- Zero lazy loading di App.tsx — semua 14 halaman eager import, bundle ~2.5 MB
- `@react-pdf/renderer` (~1.5 MB) masuk initial bundle padahal hanya dipakai 2 halaman

## Keputusan / Catatan

- `date-fns` dipakai di AuditLogs.tsx dan PDF reports — tidak dead, tapi bisa dipertimbangkan diganti formatDate dari utils (LOW priority)
- Finance.tsx 1000 baris dengan 3 modal — code smell tapi tidak blocking (MEDIUM/LOW priority)

## Siap untuk Plan 32-02

AUDIT-REPORT.md berisi rekomendasi terstruktur (HIGH/MEDIUM/LOW) yang langsung bisa dikerjakan di Plan 32-02 (execute/cleanup).
