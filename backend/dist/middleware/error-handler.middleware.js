"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const config_1 = require("../config");
/**
 * Derives a user-friendly message from a Prisma known-request error.
 */
function handlePrismaError(err) {
    switch (err.code) {
        case 'P2002': {
            const target = err.meta?.target?.join(', ') ?? 'field';
            return new errors_1.AppError(`A record with that ${target} already exists.`, 409);
        }
        case 'P2025':
            return new errors_1.AppError('The requested record was not found.', 404);
        default:
            return new errors_1.AppError('A database error occurred.', 500);
    }
}
/**
 * Global Express error-handling middleware.
 *
 * - Recognises {@link AppError} instances and returns their status code.
 * - Translates Prisma `PrismaClientKnownRequestError` codes (P2002, P2025)
 *   into appropriate HTTP responses.
 * - Falls back to 500 for unknown / unexpected errors.
 * - Includes the stack trace in the response body when `NODE_ENV` is `development`.
 */
const errorHandler = (err, _req, res, _next) => {
    // ── Prisma known-request errors ────────────────────────────────────
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(err);
        res.status(appError.statusCode).json({
            success: false,
            message: appError.message,
            ...(config_1.config.NODE_ENV === 'development' && { stack: err.stack }),
        });
        return;
    }
    // ── Application errors ─────────────────────────────────────────────
    if (err instanceof errors_1.AppError) {
        const body = {
            success: false,
            message: err.message,
        };
        if (err instanceof errors_1.ValidationError && err.errors) {
            body.errors = err.errors;
        }
        if (config_1.config.NODE_ENV === 'development') {
            body.stack = err.stack;
        }
        res.status(err.statusCode).json(body);
        return;
    }
    // ── Unknown / unexpected errors ────────────────────────────────────
    console.error('[UnhandledError]', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(config_1.config.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error-handler.middleware.js.map