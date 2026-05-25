import express, { type Request, type Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAuth } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

router.post('/', express.raw({ type: '*/*', limit: '10mb' }), async (req: Request, res: Response) => {
  try {
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const originalName = (req.headers['x-file-name'] as string) || 'upload';
    const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
    const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: req.body as Buffer,
      ContentType: contentType,
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return res.json({ url: publicUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
