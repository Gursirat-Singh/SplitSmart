import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.middleware';
import { NotFoundError } from './utils/errors';
import { rateLimit } from './middleware/rate-limit.middleware';

/**
 * Configured Express application instance.
 */
const app = express();

// ── Global rate limiting & headers ───────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
       process.env.CLIENT_URL || "",
    ],
    credentials: true,
  })
);
app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again later.',
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many login or registration attempts. Please try again after 15 minutes.',
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many file upload requests. Please try again after 15 minutes.',
});

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

app.use('/api/v1/auth', authLimiter, authRoutes);
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
