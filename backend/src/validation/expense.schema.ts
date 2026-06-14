import { z } from 'zod';
import { Currency, SplitType } from '@prisma/client';

export const createExpenseSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  description: z.string().min(1, 'Description is required').max(300, 'Description is too long'),
  originalAmount: z.number().positive('Amount must be positive'),
  currency: z.nativeEnum(Currency),
  exchangeRate: z.number().positive('Exchange rate must be positive').optional(),
  splitType: z.nativeEnum(SplitType),
  expenseDate: z.string().datetime({ message: 'Invalid ISO date string' }).or(z.date()),
  splits: z.array(
    z.object({
      userId: z.string().uuid('Invalid user ID'),
      share: z.number().nonnegative('Share value must be non-negative').optional(),
    })
  ).min(1, 'At least one split participant is required'),
});

export const expenseIdParamSchema = z.object({
  expenseId: z.string().uuid('Invalid expense ID'),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
