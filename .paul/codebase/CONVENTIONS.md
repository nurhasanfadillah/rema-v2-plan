# Coding Conventions

## Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Component files | PascalCase | `Users.tsx`, `OrderDetail.tsx` |
| Route files | kebab-case | `audit-logs.ts`, `order-items.ts` |
| Util/lib files | camelCase | `api.ts`, `utils.ts` |
| Variables & functions | camelCase | `normalizePhone()`, `getMitraStats()` |
| Constants & env vars | UPPER_SNAKE | `API_PORT`, `JWT_SECRET` |
| Custom hooks | `use` prefix | `useAuth()`, `useConfirm()` |
| DB columns | snake_case | `password_hash`, `user_id`, `is_active` |
| TS properties | camelCase | `passwordHash`, `userId`, `isActive` |
| Interfaces/types | PascalCase | `User`, `Mitra`, `OrderStatus` |
| Props interfaces | `Props` suffix | `FileUploadProps`, `LightboxProps` |

---

## TypeScript

```typescript
// Union types untuk enums (tidak pakai enum keyword)
type Role = 'admin' | 'staff' | 'operational' | 'mitra';
type OrderStatus = 'draft' | 'waiting_confirmation' | 'confirmed' | ...;

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

- Tidak ada `any` (idealnya) — tapi masih ada beberapa `item: any` di routes/orders.ts
- `noEmit` TypeScript — tidak ada test runner, hanya type check
- Path alias `@/*` maps ke root, tapi kode pakai relative imports (`../lib/api`)

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

  // Role guard di awal komponen
  if (user?.role !== 'admin') return <div>Akses Ditolak</div>;
  
  // ...
}
```

- Semua komponen functional (tidak ada class component)
- Context via custom hooks: `useAuth()`, `useConfirm()`
- Confirm dialog pakai promise-based pattern via ConfirmContext

---

## API Route Pattern

```typescript
// Semua route authenticated
router.use(requireAuth);

// CRUD standard
router.get('/', async (_req, res) => { ... });
router.post('/', async (req, res) => { ... });
router.put('/:id', async (req, res) => { ... });
router.delete('/:id', async (req, res) => { ... });

// Status codes: 201 create, 404 not found, 409 conflict, 500 error

// Dependency check sebelum delete
const [usedOrder] = await db.select().from(orders)
  .where(eq(orders.mitraId, mitraId)).limit(1);
if (usedOrder) return res.status(409).json({ error: '...' });
```

---

## Error Handling

**Backend:**
```typescript
try {
  // ...
} catch (err: any) {
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
// cn() helper untuk conditional classes
className={cn(
  "base classes",
  isActive ? "text-blue-500 bg-slate-800" : "text-slate-400",
  hasError && "border-red-500"
)}
```

- Dark theme: background `slate-950`, accent `slate-900`
- Primary color: `blue-600` / `blue-500`
- Status colors: red (danger), amber (warning), green (success), blue (info)
- Fonts: Inter (body), Outfit (headings), JetBrains Mono (code)
- Tailwind v4 — tidak ada `tailwind.config.js`

---

## Utility Functions (`src/lib/utils.ts`)

```typescript
// Class merge
cn(...inputs: ClassValue[]): string

// Phone normalization: 0821xxx → 62821xxx
normalizePhone(phone: string): string

// Currency: IDR locale
formatCurrency(amount: number): string  // "Rp 1.500.000"

// Date: WIB timezone
formatDate(ts: number): string

// Image resize: max 800px via canvas
resizeImage(file: File, maxWidth?: number): Promise<string>
```

---

## Import Style

```typescript
// Named imports (tidak pakai star import)
import { api } from '../lib/api';
import type { User, Mitra } from '../types';
import { normalizePhone } from '../lib/utils';

// Path alias @/ tersedia tapi kode pakai relative
// ../lib/api bukan @/src/lib/api
```

---

## Timestamps & IDs

- IDs: `crypto.randomUUID()` — string UUID v4
- Timestamps: Unix milliseconds (`Date.now()`) — stored as `bigint` di DB, `number` di TS
- Phone: normalized ke `62xxxxxxxx` (hapus non-digit, ganti prefix 0 → 62)
