import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/** The request properties that can be validated. */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Converts a {@link ZodError} into a flat `{ field: string[] }` map
 * suitable for the API error response.
 */
function formatZodErrors(zodError: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of zodError.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

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
export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body',
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      next(new ValidationError('Validation failed', errors));
      return;
    }

    // Replace the target with the parsed (and potentially transformed) data.
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
};
