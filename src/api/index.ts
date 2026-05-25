import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
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

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/mitras', mitrasRouter);
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/ledgers', ledgersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/audit-logs', auditLogsRouter);

export default app;
