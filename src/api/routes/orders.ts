import express, { type Response } from 'express';
import { eq, inArray, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { orders, orderItems, mitras, ledgers } from '../../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

const processingDurationDays = sql<number>`(
  greatest(1,
    (to_timestamp(${ledgers.createdAt}::double precision / 1000) AT TIME ZONE 'Asia/Jakarta')::date
    - (to_timestamp(${orders.createdAt}::double precision / 1000) AT TIME ZONE 'Asia/Jakarta')::date
  )
)`.mapWith(Number);
const processingKpiCategory = sql<string>`case
  when ${orders.totalQty} <= 1 then 'Mikro'
  when ${orders.totalQty} <= 10 then 'Sangat kecil'
  when ${orders.totalQty} <= 50 then 'Kecil'
  when ${orders.totalQty} <= 100 then 'Menengah'
  when ${orders.totalQty} <= 250 then 'Besar'
  when ${orders.totalQty} <= 500 then 'Partai besar'
  when ${orders.totalQty} <= 1000 then 'Partai sangat besar'
  else 'Mass production'
end`;
const processingKpiTargetDays = sql<number>`case
  when ${orders.totalQty} <= 1 then 1
  when ${orders.totalQty} <= 10 then 2
  when ${orders.totalQty} <= 50 then 3
  when ${orders.totalQty} <= 100 then 4
  when ${orders.totalQty} <= 250 then 5
  when ${orders.totalQty} <= 500 then 7
  when ${orders.totalQty} <= 1000 then 10
  else 14
end`.mapWith(Number);
const processingKpiToleranceDays = sql<number>`case
  when ${orders.totalQty} <= 1 then 2
  when ${orders.totalQty} <= 10 then 3
  when ${orders.totalQty} <= 50 then 4
  when ${orders.totalQty} <= 100 then 5
  when ${orders.totalQty} <= 250 then 7
  when ${orders.totalQty} <= 500 then 9
  when ${orders.totalQty} <= 1000 then 12
  else 17
end`.mapWith(Number);
const processingKpiStatus = sql<string>`case
  when ${processingDurationDays} <= ${processingKpiTargetDays} then 'excellent'
  when ${processingDurationDays} <= ${processingKpiToleranceDays} then 'evaluation'
  else 'failed'
end`;

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

router.get('/processing-time', async (req: AuthRequest, res: Response) => {
  try {
    const { start, end } = req.query;
    if (typeof start !== 'string' || typeof end !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return res.status(400).json({ error: 'Tanggal mulai dan akhir wajib diisi dengan format YYYY-MM-DD' });
    }

    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) {
      return res.status(400).json({ error: 'Nomor halaman dan ukuran halaman tidak valid' });
    }
    const boundedPageSize = Math.min(pageSize, 100);

    const startAt = new Date(`${start}T00:00:00+07:00`).getTime();
    const endAt = new Date(`${end}T23:59:59.999+07:00`).getTime();
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || startAt > endAt) {
      return res.status(400).json({ error: 'Rentang tanggal tidak valid' });
    }

    const conditions = [
      gte(orders.createdAt, startAt),
      lte(orders.createdAt, endAt),
      eq(ledgers.source, 'order'),
      eq(ledgers.direction, 'debit'),
    ];

    if (req.user.role === 'mitra') {
      const mitra = await getMitraForUser(req.user.sub);
      if (!mitra) return res.status(403).json({ error: 'Mitra not found' });
      conditions.push(eq(orders.mitraId, mitra.id));
    } else if (req.user.role === 'admin' && typeof req.query.mitraId === 'string' && req.query.mitraId !== 'all') {
      conditions.push(eq(orders.mitraId, req.query.mitraId));
    }

    const [rows, [summary]] = await Promise.all([
      db.select({
        orderNumber: orders.orderNumber,
        mitraId: orders.mitraId,
        mitraName: mitras.name,
        orderedAt: orders.createdAt,
        packedAt: ledgers.createdAt,
        totalQty: orders.totalQty,
        durationDays: processingDurationDays,
        kpiCategory: processingKpiCategory,
        targetDays: processingKpiTargetDays,
        toleranceDays: processingKpiToleranceDays,
        kpiStatus: processingKpiStatus,
      })
        .from(orders)
        .innerJoin(ledgers, eq(ledgers.referenceId, orders.id))
        .innerJoin(mitras, eq(mitras.id, orders.mitraId))
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt), desc(orders.id))
        .limit(boundedPageSize)
        .offset((page - 1) * boundedPageSize),
      db.select({
        totalCount: count(),
        averageDays: sql<number>`ceil(avg(${processingDurationDays}))`.mapWith(Number),
        excellentCount: sql<number>`count(*) filter (where ${processingDurationDays} <= ${processingKpiTargetDays})`.mapWith(Number),
        evaluationCount: sql<number>`count(*) filter (where ${processingDurationDays} > ${processingKpiTargetDays} and ${processingDurationDays} <= ${processingKpiToleranceDays})`.mapWith(Number),
        failedCount: sql<number>`count(*) filter (where ${processingDurationDays} > ${processingKpiToleranceDays})`.mapWith(Number),
        microCount: sql<number>`count(*) filter (where ${orders.totalQty} <= 1)`.mapWith(Number),
        verySmallCount: sql<number>`count(*) filter (where ${orders.totalQty} between 2 and 10)`.mapWith(Number),
        smallCount: sql<number>`count(*) filter (where ${orders.totalQty} between 11 and 50)`.mapWith(Number),
        mediumCount: sql<number>`count(*) filter (where ${orders.totalQty} between 51 and 100)`.mapWith(Number),
        largeCount: sql<number>`count(*) filter (where ${orders.totalQty} between 101 and 250)`.mapWith(Number),
        bulkCount: sql<number>`count(*) filter (where ${orders.totalQty} between 251 and 500)`.mapWith(Number),
        veryLargeCount: sql<number>`count(*) filter (where ${orders.totalQty} between 501 and 1000)`.mapWith(Number),
        massProductionCount: sql<number>`count(*) filter (where ${orders.totalQty} > 1000)`.mapWith(Number),
      })
        .from(orders)
        .innerJoin(ledgers, eq(ledgers.referenceId, orders.id))
        .innerJoin(mitras, eq(mitras.id, orders.mitraId))
        .where(and(...conditions)),
    ]);

    return res.json({
      rows,
      totalCount: summary.totalCount,
      averageDays: summary.averageDays ?? 0,
      kpiSummary: {
        excellent: summary.excellentCount,
        evaluation: summary.evaluationCount,
        failed: summary.failedCount,
      },
      kpiCategoryCounts: {
        micro: summary.microCount,
        verySmall: summary.verySmallCount,
        small: summary.smallCount,
        medium: summary.mediumCount,
        large: summary.largeCount,
        bulk: summary.bulkCount,
        veryLarge: summary.veryLargeCount,
        massProduction: summary.massProductionCount,
      },
      page,
      pageSize: boundedPageSize,
    });
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

    // Resolve mitra dari JWT — ensures all subsequent checks use server-side identity
    const mitra = await getMitraForUser(req.user.sub);
    if (!mitra) return res.status(403).json({ error: 'Akun mitra tidak ditemukan' });

    const { items, ...orderData } = req.body;

    // Field validation
    if (!['online', 'offline'].includes(orderData.type)) {
      return res.status(400).json({ error: 'Tipe pesanan tidak valid' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items pesanan tidak boleh kosong' });
    }

    // mitraId ownership check — prevent cross-mitra order creation
    if (orderData.mitraId && orderData.mitraId !== mitra.id) {
      return res.status(403).json({ error: 'mitraId tidak sesuai akun Anda' });
    }
    orderData.mitraId = mitra.id;

    // Credit limit check: sum totalAmount of unbilled orders vs creditLimit
    if (mitra.creditLimit) {
      const outstandingOrders = await db.select({ totalAmount: orders.totalAmount })
        .from(orders)
        .where(and(eq(orders.mitraId, mitra.id), eq(orders.isBilled, false)));
      const outstanding = outstandingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const newTotal = orderData.totalAmount || 0;
      if (outstanding + newTotal > mitra.creditLimit) {
        return res.status(400).json({
          error: `Tagihan berjalan: ${outstanding.toFixed(0)}. Order baru: ${newTotal.toFixed(0)}. Melebihi limit kredit: ${mitra.creditLimit.toFixed(0)}`,
          code: 'CREDIT_LIMIT_EXCEEDED',
        });
      }
    }

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
