import dotenv from 'dotenv';

dotenv.config();

/**
 * Application configuration derived from environment variables.
 *
 * @property {number} PORT - The port the server listens on (default: 3000).
 * @property {string} DATABASE_URL - Prisma database connection string.
 * @property {string} JWT_SECRET - Secret key used to sign and verify JWTs.
 * @property {string} JWT_EXPIRES_IN - JWT expiration duration (e.g. "7d", "1h").
 * @property {string} NODE_ENV - Current runtime environment.
 */
export const config = {
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
} as const;
