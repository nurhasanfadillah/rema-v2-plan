# Coding Conventions

## Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Component files | PascalCase | `Users.tsx`, `OrderDetail.tsx` |
| Route files | kebab-case | `audit-logs.ts`, `priorities.ts` |
| Util/lib files | camelCase | `api.ts`, `utils.ts` |
| Variables & functions | camelCase | `normalizePhone()`, `getMitraStats()` |
| Constants & env vars | UPPER_SNAKE | `API_PORT`, `JWT_SECRET` |
| Custom hooks | `use` prefix | `useAuth()`, `useConfirm()` |
| DB columns | snake_case | `password_hash`, `user_id`, `is_active` |
| DB tables | lowercase plural | `users`, `orders`, `order_items` |
| TS properties | camelCase | `passwordHash`, `userId`, `isActive` |
| Interfaces/types | PascalCase | `User`, `Mitra`, `OrderStatus` |
| Props interfaces | `Props` suffix | `FileUploadProps`, `LightboxProps` |

---

## TypeScript

```typescript
// Union types untuk enums (tidak pakai enum keyword)
type Role = 'admin' | 'staff' | 'operational' | 'mitra';
type OrderStatus = 'draft' | 'waiting_confirmation' | 'confirmed' | 'processing'
                 | 'pressing' | 'packing' | 'shipped' | 'returned' | 'cancelled';

// Omit pattern untuk security
type SafeUser = Omit<User, 'passwordHash'>;

// Drizzle inferred types dari schema
type InsertOrder = typeof orders.$inferInsert;
type SelectOrder = typeof orders.$inferSelect;

// Extended Request untuk auth middleware
interface AuthRequest extends Request {
  user?: { sub: string; role: string; phone: string };
}
```

- Dua sumber type: `src/db/schema.ts` (Drizzle inferred, dipakai backend) vs `src/types.ts` (manual interface, dipakai frontend & `api.ts`). Berisiko drift — lihat CONCERNS 3.2.
- `any` masih ada di `catch (err: any)` (40+) dan beberapa `items.map((item: any) => ...)` di `orders.ts`.
- `npm run lint` = `tsc --noEmit` (tidak ada test runner).
- Path alias `@/*` ke root, tapi kode pakai relative imports (`../lib/api`).

---

## React Components

```typescript
// Functional component + explicit typing
export default function Users() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<SafeUser[]>([]);

  useEffect(() => {
    api.users.list().then(setItems).catch(console.error);
  }, []);

  // Role guard di awal komponen (frontend only)
  if (user?.role !== 'admin') return <div>Akses Ditolak</div>;
  // ...
}
```

- Semua komponen functional (tidak ada class component)
- Context via custom hooks: `useAuth()`, `useConfirm()`
- Confirm dialog pakai promise-based pattern via `ConfirmContext`
- Animasi: `motion/react` (Framer Motion) untuk transisi list/page
- **Tidak ada error boundary** — reliance pada `try/catch` + `toast.error()`

---

## API Route Pattern

```typescript
const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const data = await db.select().from(table);
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
```

**HTTP status convention**:
- `400` validation
- `401` auth gagal
- `403` permission (jarang)
- `404` not found
- `409` conflict (delete FK, self-delete, duplicate)
- `422` business rule (priorities status ineligible)
- `500` default error

UUID dibuat di handler: `id ?? crypto.randomUUID()`. Response: JSON langsung (no envelope).

---

## Error Handling

**Backend:**
```typescript
try { ... } catch (err: any) {
  console.error(err);
  return res.status(500).json({ error: err.message });
}
```

**Frontend:**
```typescript
try {
  await api.something.update(id, data);
  toast.success('Berhasil disimpan');
} catch (err: any) {
  toast.error(err.message || 'Gagal menyimpan');
}
```

- Error messages dalam Bahasa Indonesia
- Toast (`react-hot-toast`) untuk semua feedback ke user

---

## CSS / Styling

```typescript
className={cn(
  "base classes",
  isActive ? "text-blue-500 bg-slate-800" : "text-slate-400",
  hasError && "border-red-500"
)}
```

- **Tailwind v4** via `@tailwindcss/vite` (tidak ada `tailwind.config.js`)
- Dark theme: background `slate-950`, accent `slate-900`
- Primary: `blue-600` / `blue-500`
- Status: red (danger), amber (warning), green (success), blue (info)
- Fonts: Inter (body), Outfit (headings), JetBrains Mono (code) via `@theme` di `src/index.css`
- `cn()` helper dari `src/lib/utils.ts` (clsx + tailwind-merge)
- Mobile-first; tidak ada breakpoint custom

---

## Form Handling

- **Tidak ada library form** (react-hook-form / formik) — pure `useState` controlled input
- File upload: drag-drop manual (`onDragEnter/Over/Leave/Drop`)
- Validasi client minimal (size 10MB); server validation = try/catch

---

## Utility Functions (`src/lib/utils.ts`)

```typescript
cn(...inputs: ClassValue[]): string            // Class merge
normalizePhone(phone: string): string          // 0821xxx → 62821xxx
formatCurrency(amount: number): string         // "Rp 1.500.000"
formatDate(ts: number): string                 // WIB (Asia/Jakarta)
resizeImage(file: File, maxWidth?): Promise<string>  // canvas resize 800px
```

---

## Import Style

```typescript
// Named imports (tidak pakai star import)
import { api } from '../lib/api';
import type { User, Mitra } from '../types';
import { normalizePhone } from '../lib/utils';

// Path alias @/ tersedia tapi kode pakai relative
```

---

## Domain Conventions

| Domain | Aturan |
|--------|--------|
| Phone | Normalized ke `62xxxxxxxx` (hapus non-digit, ganti `0` prefix). **Hanya di-enforce di `auth.ts`** — risk inkonsistensi di route lain |
| Timestamps | Unix milliseconds (`Date.now()`) — `bigint mode number` di DB |
| IDs | `crypto.randomUUID()` v4 string |
| Currency | IDR via `formatCurrency()` (Intl.NumberFormat, 0 fraction); **storage pakai `real` float — risk presisi** |
| Timezone display | `Asia/Jakarta` |
| Order status | string literal union (`draft`, `waiting_confirmation`, ...) |
| DTF status | `belum_cetak` / `sudah_cetak` (Indonesian) |
| Ledger | `direction: 'debit'|'credit'` × `source: order|payment|manual|cancellation|return` |

---

## Git Commit Style

Conventional-loose: `<type>(<scope>): <subject>`

- **Type**: `feat`, `fix`, `docs`, `chore`, `tweak`
- **Scope**: `OrderDetail`, `OrdersList`, `Dashboard`, `paul`, dll
- **Subject**: Bahasa Indonesia atau English, deskriptif
- Tidak ada footer breaking change, jarang body

Contoh recent:
```
feat(OrdersList): tampilkan nama produk + qty per item dan perluas pencarian ke produk & catatan desain
fix: prevent double ledger entries from order production
fix(OrderDetail): tingkatkan kontras button Ajukan Sekarang
```
