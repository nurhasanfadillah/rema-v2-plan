import express from 'express';
import cors from 'cors';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());

import healthRouter from './routes/health.ts';
import authRouter from './routes/auth.ts';
import mitrasRouter from './routes/mitras.ts';
import productsRouter from './routes/products.ts';
import usersRouter from './routes/users.ts';
import ordersRouter from './routes/orders.ts';
import ledgersRouter from './routes/ledgers.ts';
import requestsRouter from './routes/requests.ts';
import auditLogsRouter from './routes/audit-logs.ts';
import uploadRouter from './routes/upload.ts';

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/mitras', mitrasRouter);
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/ledgers', ledgersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/upload', uploadRouter);

export default app;
