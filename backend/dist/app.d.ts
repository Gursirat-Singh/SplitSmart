import express from 'express';
/**
 * Configured Express application instance.
 */
declare const app: import("express-serve-static-core").Express;
export declare const uploadLimiter: (req: express.Request, res: express.Response, next: express.NextFunction) => void;
export default app;
