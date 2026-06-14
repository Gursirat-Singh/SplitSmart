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
declare const app: import("express-serve-static-core").Express;
export default app;
