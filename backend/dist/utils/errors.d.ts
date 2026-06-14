/**
 * Base application error with an HTTP status code.
 *
 * All operational errors thrown intentionally should extend this class
 * so the global error handler can distinguish them from programming bugs.
 */
export declare class AppError extends Error {
    /** HTTP status code to send in the response. */
    readonly statusCode: number;
    /** `true` when the error is expected / operational, `false` for programming bugs. */
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, isOperational?: boolean);
}
/**
 * 404 — The requested resource could not be found.
 */
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
/**
 * 400 — The request payload failed validation.
 */
export declare class ValidationError extends AppError {
    /** Optional structured validation error details. */
    readonly errors?: Record<string, string[]>;
    constructor(message?: string, errors?: Record<string, string[]>);
}
/**
 * 401 — Authentication is required or has failed.
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * 403 — The authenticated user lacks permission for this action.
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
