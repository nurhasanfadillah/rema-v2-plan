import express, { type Response } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { orderPriorities, orders, mitras } from '../../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

const ACTIVE_STATUSES = ['confirmed', 'processing', 'pressing'] as const;
type ActiveStatus = typeof ACTIVE_STATUSES[number];

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await db
      .select({
        id: orderPriorities.id,
        orderId: orderPriorities.orderId,
        mitraId: orderPriorities.mitraId,
        mitraName: mitras.name,
        orderNumber: orders.orderNumber,
        totalQty: orders.totalQty,
        notes: orderPriorities.notes,
        createdAt: orderPriorities.createdAt,
        createdBy: orderPriorities.createdBy,
      })
      .from(orderPriorities)
      .innerJoin(orders, eq(orderPriorities.orderId, orders.id))
      .innerJoin(mitras, eq(orderPriorities.mitraId, mitras.id))
      .where(inArray(orders.status, ACTIVE_STATUSES as unknown as ActiveStatus[]))
      .orderBy(orderPriorities.createdAt);

    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'mitra') {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const [mitra] = await db.select().from(mitras).where(eq(mitras.userId, req.user.sub)).limit(1);
    if (!mitra) return res.status(404).json({ error: 'Mitra not found' });

    const { orderId, notes } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.mitraId !== mitra.id) return res.status(403).json({ error: 'FORBIDDEN' });
    if (!(ACTIVE_STATUSES as readonly string[]).includes(order.status)) {
      return res.status(422).json({ error: 'Order status not eligible for priority' });
    }

    // Cek duplikat — order sudah ada di daftar prioritas aktif
    const existingActive = await db
      .select({ id: orderPriorities.id })
      .from(orderPriorities)
      .innerJoin(orders, eq(orderPriorities.orderId, orders.id))
      .where(
        and(
          eq(orderPriorities.orderId, orderId),
          inArray(orders.status, ACTIVE_STATUSES as unknown as ActiveStatus[])
        )
      );
    if (existingActive.length > 0) {
      return res.status(409).json({ error: 'Order already in priority list' });
    }

    // Quota check — hitung active priorities milik mitra ini
    const activeForMitra = await db
      .select({ id: orderPriorities.id })
      .from(orderPriorities)
      .innerJoin(orders, eq(orderPriorities.orderId, orders.id))
      .where(
        and(
          eq(orderPriorities.mitraId, mitra.id),
          inArray(orders.status, ACTIVE_STATUSES as unknown as ActiveStatus[])
        )
      );

    if (activeForMitra.length >= mitra.priorityLimit) {
      return res.status(403).json({
        error: 'QUOTA_EXCEEDED',
        current: activeForMitra.length,
        limit: mitra.priorityLimit,
      });
    }

    const [inserted] = await db
      .insert(orderPriorities)
      .values({
        id: crypto.randomUUID(),
        orderId,
        mitraId: mitra.id,
        notes: notes || null,
        createdAt: Date.now(),
        createdBy: req.user.sub,
      })
      .returning();

    return res.status(201).json(inserted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'mitra') {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const [mitra] = await db.select().from(mitras).where(eq(mitras.userId, req.user.sub)).limit(1);
    if (!mitra) return res.status(404).json({ error: 'Mitra not found' });

    const [entry] = await db
      .select()
      .from(orderPriorities)
      .where(eq(orderPriorities.id, req.params.id))
      .limit(1);

    if (!entry) return res.status(404).json({ error: 'Priority entry not found' });
    if (entry.mitraId !== mitra.id) return res.status(403).json({ error: 'FORBIDDEN' });

    await db.delete(orderPriorities).where(eq(orderPriorities.id, req.params.id));
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
