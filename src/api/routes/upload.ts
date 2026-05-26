import express, { type Request, type Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAuth } from '../middleware/auth.ts';

const router = express.Router();
router.use(requireAuth);

function initS3() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  const missing = [];
  if (!accountId) missing.push('R2_ACCOUNT_ID');
  if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
  if (!bucketName) missing.push('R2_BUCKET_NAME');
  if (!publicUrl) missing.push('R2_PUBLIC_URL');

  return { s3: new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  }), bucketName: bucketName!, publicUrl: publicUrl!, missing };
}

router.post('/', express.raw({ type: '*/*', limit: '10mb' }), async (req: Request, res: Response) => {
  try {
    const { s3, bucketName, publicUrl, missing } = initS3();
    if (missing.length > 0) {
      console.error('[upload] Missing R2 env vars:', missing);
      return res.status(500).json({ error: `Missing R2 env vars: ${missing.join(', ')}` });
    }

    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const originalName = (req.headers['x-file-name'] as string) || 'upload';
    const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
    const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const body = req.body as Buffer;

    if (!body || body.length === 0) {
      return res.status(400).json({ error: 'Empty request body' });
    }

    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));

    const url = `${publicUrl}/${key}`;
    return res.json({ url });
  } catch (err: any) {
    console.error('[upload] Error:', err);
    return res.status(500).json({
      error: err.message,
      code: err.Code ?? err.code ?? err.name,
      httpStatus: err.$metadata?.httpStatusCode,
    });
  }
});

export default router;
