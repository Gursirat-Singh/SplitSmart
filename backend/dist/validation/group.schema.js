"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupIdParamSchema = exports.addMemberSchema = exports.updateGroupSchema = exports.createGroupSchema = void 0;
const zod_1 = require("zod");
exports.createGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Group name is required').max(150),
    description: zod_1.z.string().optional(),
});
exports.updateGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(150).optional(),
    description: zod_1.z.string().optional(),
});
exports.addMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.groupIdParamSchema = zod_1.z.object({
    groupId: zod_1.z.string().uuid('Invalid group ID'),
});
//# sourceMappingURL=group.schema.js.map