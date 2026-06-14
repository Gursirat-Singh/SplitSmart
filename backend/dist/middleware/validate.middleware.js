"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const errors_1 = require("../utils/errors");
/**
 * Converts a {@link ZodError} into a flat `{ field: string[] }` map
 * suitable for the API error response.
 */
function formatZodErrors(zodError) {
    const formatted = {};
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
const validate = (schema, target = 'body') => {
    return (req, _res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            const errors = formatZodErrors(result.error);
            next(new errors_1.ValidationError('Validation failed', errors));
            return;
        }
        // Replace the target with the parsed (and potentially transformed) data.
        req[target] = result.data;
        next();
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.middleware.js.map