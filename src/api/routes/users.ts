import express, { type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../../db/client.ts';
import { users, mitras, auditLogs, orders, ledgers, actionRequests } from '../../db/schema.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await db.select().from(users);
    const safe = result.map(({ passwordHash, ...u }) => u);
    return res.json(safe);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    if (!rest.id) rest.id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const [inserted] = await db.insert(users).values({ ...rest, passwordHash }).returning();
    const { passwordHash: _, ...safe } = inserted;
    return res.status(201).json(safe);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { newPassword, ...rest } = req.body;
    const updates: Record<string, any> = { ...rest };
    if (newPassword) {
      updates.passwordHash = await bcrypt.hash(newPassword, 12);
    }
    const [updated] = await db.update(users)
      .set(updates)
      .where(eq(users.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safe } = updated;
    return res.json(safe);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/password', async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'newPassword wajib diisi' });

    const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (oldPassword !== undefined) {
      const match = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!match) return res.status(401).json({ error: 'Kata sandi lama tidak sesuai.' });
    }

    const [updated] = await db.update(users)
      .set({ passwordHash: await bcrypt.hash(newPassword, 12), mustChangePassword: false })
      .where(eq(users.id, req.params.id))
      .returning();

    const { passwordHash, ...safe } = updated;
    return res.json(safe);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Guard: tidak bisa hapus diri sendiri
    if (req.params.id === (req as any).user.sub) {
      return res.status(403).json({ error: 'Tidak dapat menghapus akun Anda sendiri.' });
    }

    // Cek audit trail
    const audit = await db.select().from(auditLogs)
      .where(eq(auditLogs.userId, req.params.id)).limit(1);
    if (audit.length > 0) {
      return res.status(409).json({ error: 'Tidak dapat menghapus pengguna ini karena memiliki riwayat aktivitas di sistem. Silakan nonaktifkan saja.' });
    }

    // Ambil user untuk cek role
    const [targetUser] = await db.select().from(users)
      .where(eq(users.id, req.params.id)).limit(1);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Jika mitra: cek dependencies sebelum hapus
    if (targetUser.role === 'mitra') {
      const [linkedMitra] = await db.select().from(mitras)
        .where(eq(mitras.userId, req.params.id)).limit(1);
      if (linkedMitra) {
        const [usedOrder] = await db.select().from(orders)
          .where(eq(orders.mitraId, linkedMitra.id)).limit(1);
        const [usedLedger] = await db.select().from(ledgers)
          .where(eq(ledgers.mitraId, linkedMitra.id)).limit(1);
        const [usedRequest] = await db.select().from(actionRequests)
          .where(eq(actionRequests.mitraId, linkedMitra.id)).limit(1);
        if (usedOrder || usedLedger || usedRequest) {
          return res.status(409).json({ error: 'Tidak dapat menghapus user ini karena entitas mitranya sudah memiliki pesanan, riwayat saldo, atau pengajuan (request).' });
        }
        // Hapus linked mitra (hard delete)
        await db.delete(mitras).where(eq(mitras.id, linkedMitra.id));
      }
    }

    // Hapus user
    await db.delete(users).where(eq(users.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
