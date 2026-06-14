"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const error_handler_middleware_1 = require("./middleware/error-handler.middleware");
const errors_1 = require("./utils/errors");
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
const app = (0, express_1.default)();
// ── Global middleware ────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const group_routes_1 = __importDefault(require("./routes/group.routes"));
const expense_routes_1 = __importDefault(require("./routes/expense.routes"));
const settlement_routes_1 = __importDefault(require("./routes/settlement.routes"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
// ── Route placeholders ──────────────────────────────────────────────
const placeholderRouter = () => {
    const router = (0, express_1.Router)();
    return router;
};
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/groups', group_routes_1.default);
app.use('/api/v1/expenses', expense_routes_1.default);
app.use('/api/v1/settlements', settlement_routes_1.default);
app.use('/api/v1/groups/:groupId/imports', import_routes_1.default);
// ── 404 catch-all ───────────────────────────────────────────────────
app.use((req, _res, next) => {
    next(new errors_1.NotFoundError(`Cannot find ${req.method} ${req.originalUrl}`));
});
// ── Global error handler ────────────────────────────────────────────
app.use(error_handler_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map