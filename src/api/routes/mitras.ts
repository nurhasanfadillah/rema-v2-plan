import express, { type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { mitras, orders, ledgers, actionRequests, users } from '../../db/schema.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await db.select().from(mitras);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.id) body.id = crypto.randomUUID();
    const [inserted] = await db.insert(mitras).values(body).returning();
    return res.status(201).json(inserted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const [updated] = await db.update(mitras)
      .set(req.body)
      .where(eq(mitras.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Mitra not found' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const mitraId = req.params.id;

    // Layer 1: cek orders
    const [usedOrder] = await db.select().from(orders)
      .where(eq(orders.mitraId, mitraId)).limit(1);
    if (usedOrder) {
      return res.status(409).json({ error: 'Tidak dapat menghapus mitra ini karena sudah memiliki data pesanan.' });
    }

    // Layer 2: cek ledger entries
    const [usedLedger] = await db.select().from(ledgers)
      .where(eq(ledgers.mitraId, mitraId)).limit(1);
    if (usedLedger) {
      return res.status(409).json({ error: 'Tidak dapat menghapus mitra ini karena sudah memiliki riwayat saldo.' });
    }

    // Layer 3: cek action requests
    const [usedRequest] = await db.select().from(actionRequests)
      .where(eq(actionRequests.mitraId, mitraId)).limit(1);
    if (usedRequest) {
      return res.status(409).json({ error: 'Tidak dapat menghapus mitra ini karena sudah memiliki pengajuan (request).' });
    }

    // Layer 4: ambil mitra untuk dapatkan userId
    const [targetMitra] = await db.select().from(mitras)
      .where(eq(mitras.id, mitraId)).limit(1);
    if (!targetMitra) return res.status(404).json({ error: 'Mitra not found' });

    const linkedUserId = targetMitra.userId;

    // Hapus mitra dulu (mitra FK ke users, jadi hapus mitra sebelum user)
    await db.delete(mitras).where(eq(mitras.id, mitraId));

    // Hapus linked user jika ada
    if (linkedUserId) {
      await db.delete(users).where(eq(users.id, linkedUserId));
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
