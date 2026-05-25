import express, { type Request, type Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/client.ts';
import { actionRequests } from '../../db/schema.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await db.select().from(actionRequests).orderBy(desc(actionRequests.createdAt));
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.id) body.id = crypto.randomUUID();
    const [inserted] = await db.insert(actionRequests).values(body).returning();
    return res.status(201).json(inserted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const [updated] = await db.update(actionRequests)
      .set(req.body)
      .where(eq(actionRequests.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
