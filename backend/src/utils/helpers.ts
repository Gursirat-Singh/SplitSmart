import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express route handler so that rejected promises are
 * automatically forwarded to the next error-handling middleware.
 *
 * @param fn - An async request handler.
 * @returns A standard Express {@link RequestHandler}.
 *
 * @example
 * ```ts
 * router.get('/items', catchAsync(async (req, res) => {
 *   const items = await ItemService.findAll();
 *   res.json({ success: true, data: items });
 * }));
 * ```
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Rounds a monetary amount to the given number of decimal places
 * using the "round half away from zero" strategy.
 *
 * @param amount   - The numeric value to round.
 * @param decimals - Number of decimal places (default `2`).
 * @returns The rounded number.
 *
 * @example
 * ```ts
 * roundCurrency(10.255);    // 10.26
 * roundCurrency(10.254);    // 10.25
 * roundCurrency(1.5, 0);    // 2
 * ```
 */
export const roundCurrency = (amount: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
};
