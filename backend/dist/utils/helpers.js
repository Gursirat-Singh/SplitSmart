"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundCurrency = exports.catchAsync = void 0;
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
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.catchAsync = catchAsync;
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
const roundCurrency = (amount, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round((amount + Number.EPSILON) * factor) / factor;
};
exports.roundCurrency = roundCurrency;
//# sourceMappingURL=helpers.js.map