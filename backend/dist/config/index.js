"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Application configuration derived from environment variables.
 *
 * @property {number} PORT - The port the server listens on (default: 3000).
 * @property {string} DATABASE_URL - Prisma database connection string.
 * @property {string} JWT_SECRET - Secret key used to sign and verify JWTs.
 * @property {string} JWT_EXPIRES_IN - JWT expiration duration (e.g. "7d", "1h").
 * @property {string} NODE_ENV - Current runtime environment.
 */
exports.config = {
    PORT: parseInt(process.env.PORT ?? '3000', 10),
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('FATAL: JWT_SECRET environment variable is required in production mode'); })()
        : 'dev_default_super_secret_signing_key_splitsmart_2026'),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
    NODE_ENV: process.env.NODE_ENV ?? 'development',
};
//# sourceMappingURL=index.js.map