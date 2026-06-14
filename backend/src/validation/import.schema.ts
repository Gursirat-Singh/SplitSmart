import { z } from 'zod';

export const importIdParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  importId: z.string().uuid('Invalid import ID'),
});

export const resolveDuplicateSchema = z.object({
  rowId: z.string().uuid('Invalid row ID').optional(),
  anomalyId: z.string().uuid('Invalid anomaly ID').optional(),
  action: z.enum(['ACCEPT', 'SKIP', 'IMPORT', 'REPLACE']),
}).refine((data) => !!data.rowId || !!data.anomalyId, {
  message: 'Either rowId or anomalyId is required',
});

export type ResolveDuplicateInput = z.infer<typeof resolveDuplicateSchema>;
