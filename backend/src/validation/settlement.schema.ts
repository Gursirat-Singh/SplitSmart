import { z } from 'zod';
import { Currency } from '@prisma/client';

export const createSettlementSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  paidToId: z.string().uuid('Invalid payee user ID'),
  originalAmount: z.number().positive('Amount must be positive').max(10000000, 'Amount cannot exceed 10,000,000'),
  currency: z.nativeEnum(Currency),
  exchangeRate: z.number().positive('Exchange rate must be positive').max(100000, 'Exchange rate cannot exceed 100,000').optional(),
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

export const createNestedSettlementSchema = z.object({
  payerId: z.string().uuid('Invalid payer user ID'),
  payeeId: z.string().uuid('Invalid payee user ID'),
  amount: z.number().positive('Amount must be positive').max(10000000, 'Amount cannot exceed 10,000,000'),
  currency: z.nativeEnum(Currency),
  exchangeRate: z.number().positive('Exchange rate must be positive').max(100000, 'Exchange rate cannot exceed 100,000').optional(),
  date: z.string().datetime({ message: 'Invalid ISO date string' }).or(z.date()).optional(),
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

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
