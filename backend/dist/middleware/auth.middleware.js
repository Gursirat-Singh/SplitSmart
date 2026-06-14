"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
/**
 * Express middleware that verifies a JWT from the `Authorization` header.
 *
 * Expected format: `Authorization: Bearer <token>`
 *
 * On success the decoded {@link AuthPayload} is attached to `req.user`.
 * On failure an {@link UnauthorizedError} is forwarded to the error handler.
 */
const authenticate = (req, _res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('Missing or malformed authorization header');
        }
        const token = header.slice(7);
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.JWT_SECRET, {
            algorithms: ['HS256'],
        });
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };
        next();
    }
    catch (err) {
        if (err instanceof errors_1.UnauthorizedError) {
            next(err);
            return;
        }
        next(new errors_1.UnauthorizedError('Invalid or expired token'));
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map