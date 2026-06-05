import express, { type Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { actionRequests, mitras, orders, ledgers } from '../../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let result;
    if (req.user.role === 'mitra') {
      const [mitra] = await db.select().from(mitras)
        .where(eq(mitras.userId, req.user.sub)).limit(1);
      if (!mitra) return res.status(403).json({ error: 'Mitra not found' });
      result = await db.select().from(actionRequests)
        .where(eq(actionRequests.mitraId, mitra.id))
        .orderBy(desc(actionRequests.createdAt));
    } else {
      result = await db.select().from(actionRequests)
        .orderBy(desc(actionRequests.createdAt));
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    if (!body.id) body.id = crypto.randomUUID();
    const [inserted] = await db.insert(actionRequests).values(body).returning();
    return res.status(201).json(inserted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Only admin or staff can approve/reject/update action requests
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Hanya admin atau staff yang dapat memperbarui permintaan' });
    }

    const [existing] = await db.select().from(actionRequests).where(eq(actionRequests.id, req.params.id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Request not found' });

    if (req.body.status === 'approved' && existing.status === 'pending') {
      await db.update(orders)
        .set({ status: existing.type === 'cancellation' ? 'cancelled' : 'returned', isBilled: false, updatedAt: Date.now() })
        .where(eq(orders.id, existing.orderId));
      await db.delete(ledgers).where(eq(ledgers.referenceId, existing.orderId));
    }

    const [updated] = await db.update(actionRequests)
      .set({ ...req.body, updatedAt: Date.now() })
      .where(eq(actionRequests.id, req.params.id))
      .returning();
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
