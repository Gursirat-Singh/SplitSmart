import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
/** The request properties that can be validated. */
type ValidationTarget = 'body' | 'query' | 'params';
/**
 * Creates an Express middleware that validates a specific part of the
 * incoming request against a Zod schema.
 *
 * @param schema - A Zod schema to validate against.
 * @param target - Which property of `req` to validate (`body`, `query`, or `params`). Defaults to `body`.
 * @returns An Express middleware function.
 *
 * @example
 * ```ts
 * import { z } from 'zod';
 *
 * const CreateGroupSchema = z.object({
 *   name: z.string().min(1),
 * });
 *
 * router.post('/groups', validate(CreateGroupSchema), createGroupHandler);
 * ```
 */
export declare const validate: (schema: ZodSchema, target?: ValidationTarget) => (req: Request, _res: Response, next: NextFunction) => void;
export {};
