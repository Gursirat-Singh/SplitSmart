import { z } from 'zod';
export declare const createGroupSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateGroupSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const addMemberSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const groupIdParamSchema: z.ZodObject<{
    groupId: z.ZodString;
}, z.core.$strip>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
