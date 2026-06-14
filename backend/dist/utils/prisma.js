"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
/**
 * Singleton PrismaClient instance shared across the application.
 *
 * In development the client is cached on `globalThis` to survive
 * hot-reloads without exhausting database connections.
 */
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
/**
 * Gracefully disconnect Prisma when the process is shutting down.
 */
async function gracefulShutdown() {
    await exports.prisma.$disconnect();
    process.exit(0);
}
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
//# sourceMappingURL=prisma.js.map