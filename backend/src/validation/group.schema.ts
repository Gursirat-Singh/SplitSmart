import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(150),
  description: z.string().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const groupIdParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
