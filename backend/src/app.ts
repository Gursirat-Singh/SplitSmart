import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.middleware';
import { NotFoundError } from './utils/errors';

/**
 * Configured Express application instance.
 *
 * Middleware applied (in order):
 * 1. `helmet` — sets security-related HTTP headers.
 * 2. `cors` — enables Cross-Origin Resource Sharing.
 * 3. `express.json` — parses JSON request bodies.
 *
 * Route namespaces are mounted under `/api/v1`.
 */
const app = express();

// ── Global middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth.routes';
import groupRoutes from './routes/group.routes';
import expenseRoutes from './routes/expense.routes';
import settlementRoutes from './routes/settlement.routes';
import importRoutes from './routes/import.routes';

// ── Route placeholders ──────────────────────────────────────────────
const placeholderRouter = (): Router => {
  const router = Router();
  return router;
};

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/settlements', settlementRoutes);
app.use('/api/v1/groups/:groupId/imports', importRoutes);

// ── 404 catch-all ───────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(new NotFoundError(`Cannot find ${req.method} ${req.originalUrl}`));
});

// ── Global error handler ────────────────────────────────────────────
app.use(errorHandler);

export default app;
