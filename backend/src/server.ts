import './types/express';
import app from './app';
import { config } from './config';

/**
 * Starts the HTTP server and registers top-level process error handlers.
 */
const server = app.listen(config.PORT, () => {
  console.log(
    `🚀 SplitSmart server running on port ${config.PORT} [${config.NODE_ENV}]`,
  );
});

// ── Unhandled promise rejections ─────────────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[unhandledRejection]', reason);
  server.close(() => {
    process.exit(1);
  });
});

// ── Uncaught exceptions ──────────────────────────────────────────────
process.on('uncaughtException', (error: Error) => {
  console.error('[uncaughtException]', error);
  server.close(() => {
    process.exit(1);
  });
});
