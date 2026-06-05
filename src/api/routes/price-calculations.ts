import express, { type Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { priceCalculations } from '../../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

const ALLOWED_ROLES = ['admin', 'mitra'] as const;

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user.role as typeof ALLOWED_ROLES[number])) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const rows = await db
      .select()
      .from(priceCalculations)
      .where(eq(priceCalculations.userId, req.user.sub))
      .orderBy(desc(priceCalculations.createdAt));

    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user.role as typeof ALLOWED_ROLES[number])) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const {
      productId,
      productName,
      hargaPokok,
      qty,
      margin,
      adminMP,
      additionals,
      hargaJual,
      hargaMP,
      hargaFinals,
    } = req.body;

    if (!productName || hargaPokok == null || margin == null || adminMP == null || hargaJual == null || hargaMP == null) {
      return res.status(400).json({ error: 'productName, hargaPokok, margin, adminMP, hargaJual, hargaMP are required' });
    }

    const safeQty = typeof qty === 'number' && qty >= 1 ? qty : 1;

    const [inserted] = await db
      .insert(priceCalculations)
      .values({
        id: crypto.randomUUID(),
        userId: req.user.sub,
        productId: productId || null,
        productName,
        hargaPokok,
        qty: safeQty,
        margin,
        adminMP,
        additionals: additionals || [],
        hargaJual,
        hargaMP,
        hargaFinals: hargaFinals || [],
        createdAt: Date.now(),
      })
      .returning();

    return res.status(201).json(inserted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user.role as typeof ALLOWED_ROLES[number])) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const [row] = await db
      .select()
      .from(priceCalculations)
      .where(eq(priceCalculations.id, req.params.id))
      .limit(1);

    if (!row) return res.status(404).json({ error: 'Not found' });
    if (row.userId !== req.user.sub) return res.status(403).json({ error: 'FORBIDDEN' });

    await db.delete(priceCalculations).where(eq(priceCalculations.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
