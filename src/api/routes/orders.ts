import express, { type Response } from 'express';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { orders, orderItems, mitras } from '../../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

// Helper: resolve mitraId from JWT user sub (for role=mitra)
async function getMitraForUser(userId: string) {
  const [mitra] = await db.select().from(mitras).where(eq(mitras.userId, userId)).limit(1);
  return mitra || null;
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // allMitras bypass only allowed for admin/staff
    const canBypass = req.user.role === 'admin' || req.user.role === 'staff';
    const bypassMitra = canBypass && req.query.allMitras === 'true';
    // queueView: production queue is visible to all roles (shared operational view)
    const isQueueView = req.query.queueView === 'true';
    let filterMitraId = req.query.mitraId as string | undefined;

    if (!bypassMitra && !isQueueView && req.user.role === 'mitra') {
      const mitra = await getMitraForUser(req.user.sub);
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
    // Only mitra can create orders
    if (req.user.role !== 'mitra') {
      return res.status(403).json({ error: 'Hanya mitra yang dapat membuat pesanan' });
    }

    const { items, ...orderData } = req.body;
    if (!orderData.id) orderData.id = crypto.randomUUID();

    // neon-http driver doesn't support transactions — if orderItems insert fails,
    // compensate by deleting the orphaned order row to prevent ghost orders.
    await db.insert(orders).values(orderData);
    if (items?.length) {
      try {
        await db.insert(orderItems).values(
          items.map((item: any) => ({
            ...item,
            id: item.id || crypto.randomUUID(),
            orderId: orderData.id,
            previewUrls: item.previewUrls ?? [],
            designUrls: item.designUrls ?? [],
          }))
        );
      } catch (itemsErr: any) {
        // Compensating delete — roll back the orphaned order row
        await db.delete(orders).where(eq(orders.id, orderData.id)).catch(() => {});
        console.error('[orders POST] Failed to insert order items, compensating delete executed:', itemsErr?.message);
        throw itemsErr;
      }
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

    // Ownership check: mitra can only access their own orders
    if (req.user.role === 'mitra') {
      const mitra = await getMitraForUser(req.user.sub);
      if (!mitra || order[0].mitraId !== mitra.id) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, req.params.id));
    return res.json({ ...order[0], items });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const orderId = req.params.id;

    // Ownership check: mitra can only update their own orders
    if (req.user.role === 'mitra') {
      const existing = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!existing[0]) return res.status(404).json({ error: 'Order not found' });
      const mitra = await getMitraForUser(req.user.sub);
      if (!mitra || existing[0].mitraId !== mitra.id) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }
    }

    const { items, ...orderData } = req.body;

    // Only admin can directly set status to cancelled/returned — others must use /api/requests
    if ((orderData.status === 'cancelled' || orderData.status === 'returned') && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Pembatalan/retur harus melalui form pengajuan' });
    }

    await db.update(orders).set(orderData).where(eq(orders.id, orderId));
    if (items !== undefined) {
      await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
      if (items.length) {
        try {
          await db.insert(orderItems).values(
            items.map((item: any) => ({
              ...item,
              id: item.id || crypto.randomUUID(),
              orderId,
              previewUrls: item.previewUrls ?? [],
              designUrls: item.designUrls ?? [],
            }))
          );
        } catch (itemsErr: any) {
          console.error('[orders PUT] Failed to re-insert order items:', itemsErr?.message);
          throw itemsErr;
        }
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
    const orderId = req.params.id;

    // Ownership check: mitra can only delete their own orders
    if (req.user.role === 'mitra') {
      const existing = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!existing[0]) return res.status(404).json({ error: 'Order not found' });
      const mitra = await getMitraForUser(req.user.sub);
      if (!mitra || existing[0].mitraId !== mitra.id) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }
    }

    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await db.delete(orders).where(eq(orders.id, orderId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
