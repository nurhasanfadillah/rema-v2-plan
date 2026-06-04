import express, { type Response } from 'express';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { orders, orderItems, mitras } from '../../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const bypassMitra = req.query.allMitras === 'true';
    let filterMitraId = req.query.mitraId as string | undefined;

    if (!bypassMitra && req.user.role === 'mitra') {
      const [mitra] = await db.select().from(mitras).where(eq(mitras.userId, req.user.sub)).limit(1);
      if (!mitra) return res.status(403).json({ error: 'Mitra not found' });
      filterMitraId = mitra.id;
    }

    const allOrders = filterMitraId
      ? await db.select().from(orders).where(eq(orders.mitraId, filterMitraId))
      : await db.select().from(orders);

    const orderIds = allOrders.map(o => o.id);
    const allItems = orderIds.length > 0
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
      : [];

    const result = allOrders.map(o => ({
      ...o,
      items: allItems.filter(i => i.orderId === o.id),
    }));
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { items, ...orderData } = req.body;
    if (!orderData.id) orderData.id = crypto.randomUUID();

    // neon-http driver doesn't support transactions — sequential inserts are safe
    // for a single-admin app with no concurrent writes
    await db.insert(orders).values(orderData);
    if (items?.length) {
      await db.insert(orderItems).values(
        items.map((item: any) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          orderId: orderData.id,
        }))
      );
    }

    const inserted = await db.select().from(orders).where(eq(orders.id, orderData.id)).limit(1);
    const insertedItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderData.id));
    return res.status(201).json({ ...inserted[0], items: insertedItems });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const order = await db.select().from(orders).where(eq(orders.id, req.params.id)).limit(1);
    if (!order[0]) return res.status(404).json({ error: 'Order not found' });
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, req.params.id));
    return res.json({ ...order[0], items });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { items, ...orderData } = req.body;
    const orderId = req.params.id;

    await db.update(orders).set(orderData).where(eq(orders.id, orderId));
    if (items !== undefined) {
      await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
      if (items.length) {
        await db.insert(orderItems).values(
          items.map((item: any) => ({
            ...item,
            id: item.id || crypto.randomUUID(),
            orderId,
          }))
        );
      }
    }

    const updated = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const updatedItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    if (!updated[0]) return res.status(404).json({ error: 'Order not found' });
    return res.json({ ...updated[0], items: updatedItems });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await db.delete(orderItems).where(eq(orderItems.orderId, req.params.id));
    await db.delete(orders).where(eq(orders.id, req.params.id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
