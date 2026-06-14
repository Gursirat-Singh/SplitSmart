import { z } from 'zod';
import { Currency } from '@prisma/client';

export const createSettlementSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  paidToId: z.string().uuid('Invalid payee user ID'),
  originalAmount: z.number().positive('Amount must be positive'),
  currency: z.nativeEnum(Currency),
  exchangeRate: z.number().positive('Exchange rate must be positive').optional(),
  settledAt: z.string().datetime({ message: 'Invalid ISO date string' }).or(z.date()).optional(),
}).refine(
  (data) => {
    if (data.currency === Currency.USD && !data.exchangeRate) {
      return false;
    }
    return true;
  },
  {
    message: 'Exchange rate is required when currency is USD',
    path: ['exchangeRate'],
  }
);

export const settlementIdParamSchema = z.object({
  settlementId: z.string().uuid('Invalid settlement ID'),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
