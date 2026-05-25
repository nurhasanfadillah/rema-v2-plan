import type { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required');
const secret = new TextEncoder().encode(jwtSecret);

export interface AuthRequest extends Request {
  user?: { sub: string; role: string; phone: string };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { payload } = await jwtVerify(header.slice(7), secret);
    req.user = payload as { sub: string; role: string; phone: string };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
