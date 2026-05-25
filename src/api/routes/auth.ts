import express, { type Request, type Response } from 'express';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from '../../db/client.ts';
import { users } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';

const Router = express.Router;
const router = Router();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required');
const secret = new TextEncoder().encode(jwtSecret);

function normalizePhone(phone: string) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '62' + p.substring(1);
  return p;
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password required' });
    }

    const normalized = normalizePhone(phone);
    const result = await db.select().from(users).where(eq(users.phone, normalized)).limit(1);
    const user = result[0];

    if (!user) {
      return res.status(401).json({ error: 'Pengguna tidak ditemukan atau kata sandi salah.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Akun dinonaktifkan.' });
    }

    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      const waitMins = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(401).json({ error: `Akun terkunci. Coba lagi dalam ${waitMins} menit.` });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let lockedUntil = user.lockedUntil;

      if (attempts >= 5) {
        lockedUntil = Date.now() + 15 * 60000;
      }

      await db.update(users).set({
        failedLoginAttempts: attempts,
        lockedUntil: lockedUntil,
      }).where(eq(users.id, user.id));

      return res.status(401).json({ error: 'Kata sandi salah.' });
    }

    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
    }).where(eq(users.id, user.id));

    const token = await new SignJWT({ sub: user.id, role: user.role, phone: user.phone })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    const { passwordHash, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await db.select().from(users).where(eq(users.id, currentUser.sub)).limit(1);
    const user = result[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { passwordHash, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (err) {
    console.error('/me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
