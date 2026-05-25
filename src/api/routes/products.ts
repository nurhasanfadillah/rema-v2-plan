import express, { type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { products, orderItems } from '../../db/schema.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await db.select().from(products);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.id) body.id = crypto.randomUUID();
    const [inserted] = await db.insert(products).values(body).returning();
    return res.status(201).json(inserted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const [updated] = await db.update(products)
      .set(req.body)
      .where(eq(products.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const usedInOrders = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.productId, req.params.id))
      .limit(1);
    if (usedInOrders.length > 0) {
      return res.status(409).json({ error: 'Produk sudah digunakan dalam pesanan. Silakan arsipkan saja.' });
    }
    await db.delete(products).where(eq(products.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
