import express, { type Response } from 'express';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { ledgers, mitras } from '../../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let filterMitraId = req.query.mitraId as string | undefined;

    if (req.user.role === 'mitra') {
      const [mitra] = await db.select().from(mitras).where(eq(mitras.userId, req.user.sub)).limit(1);
      if (!mitra) return res.status(403).json({ error: 'Mitra not found' });
      filterMitraId = mitra.id;
    }

    const result = filterMitraId
      ? await db.select().from(ledgers)
          .where(eq(ledgers.mitraId, filterMitraId))
          .orderBy(desc(ledgers.createdAt))
      : await db.select().from(ledgers).orderBy(desc(ledgers.createdAt));
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    if (body.source === 'order' && body.referenceId) {
      const [existing] = await db.select().from(ledgers)
        .where(
          and(
            eq(ledgers.referenceId, body.referenceId),
            eq(ledgers.source, 'order')
          )
        )
        .limit(1);
      if (existing) {
        return res.status(200).json(existing);
      }
    }

    if (!body.id) body.id = crypto.randomUUID();
    const [inserted] = await db.insert(ledgers).values(body).returning();
    return res.status(201).json(inserted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const [updated] = await db.update(ledgers)
      .set(req.body)
      .where(eq(ledgers.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Ledger not found' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/order/:orderId', async (req: AuthRequest, res: Response) => {
  try {
    await db.delete(ledgers)
      .where(
        and(
          eq(ledgers.referenceId, req.params.orderId),
          eq(ledgers.source, 'order')
        )
      );
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await db.delete(ledgers).where(eq(ledgers.id, req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
