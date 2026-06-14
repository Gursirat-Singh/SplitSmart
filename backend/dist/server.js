"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./types/express");
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
/**
 * Starts the HTTP server and registers top-level process error handlers.
 */
const server = app_1.default.listen(config_1.config.PORT, () => {
    console.log(`🚀 SplitSmart server running on port ${config_1.config.PORT} [${config_1.config.NODE_ENV}]`);
});
// ── Unhandled promise rejections ─────────────────────────────────────
process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
    server.close(() => {
        process.exit(1);
    });
});
// ── Uncaught exceptions ──────────────────────────────────────────────
process.on('uncaughtException', (error) => {
    console.error('[uncaughtException]', error);
    server.close(() => {
        process.exit(1);
    });
});
//# sourceMappingURL=server.js.map