/**
 * Application configuration derived from environment variables.
 *
 * @property {number} PORT - The port the server listens on (default: 3000).
 * @property {string} DATABASE_URL - Prisma database connection string.
 * @property {string} JWT_SECRET - Secret key used to sign and verify JWTs.
 * @property {string} JWT_EXPIRES_IN - JWT expiration duration (e.g. "7d", "1h").
 * @property {string} NODE_ENV - Current runtime environment.
 */
export declare const config: {
    readonly PORT: number;
    readonly DATABASE_URL: string;
    readonly JWT_SECRET: string;
    readonly JWT_EXPIRES_IN: string;
    readonly NODE_ENV: string;
};
