import express, { type Request, type Response } from 'express';
import { desc } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { auditLogs } from '../../db/schema.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string || '100', 10), 1000);
    const result = await db.select().from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.id) body.id = crypto.randomUUID();
    if (!body.createdAt) body.createdAt = Date.now();
    const [inserted] = await db.insert(auditLogs).values(body).returning();
    return res.status(201).json(inserted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
