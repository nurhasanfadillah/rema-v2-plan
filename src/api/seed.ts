import { db } from '../db/client.ts';
import { users } from '../db/schema.ts';
import bcrypt from 'bcryptjs';

async function seed() {
  const passwordHash = await bcrypt.hash('rema1234', 12);
  await db.insert(users).values({
    id: 'admin_1',
    name: 'Super Admin',
    phone: '62821133131665',
    passwordHash,
    role: 'admin',
    isActive: true,
    mustChangePassword: true,
    failedLoginAttempts: 0,
  });
  console.log('Admin user seeded: 62821133131665 / rema1234');
}

seed().catch(console.error);
