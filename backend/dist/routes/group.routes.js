"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const group_controller_1 = require("../controllers/group.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const group_schema_1 = require("../validation/group.schema");
const router = (0, express_1.Router)();
// All group routes require authentication
router.use(auth_middleware_1.authenticate);
router.post('/', (0, validate_middleware_1.validate)(group_schema_1.createGroupSchema), group_controller_1.GroupController.create);
router.get('/', group_controller_1.GroupController.getAll);
router.get('/:groupId', (0, validate_middleware_1.validate)(group_schema_1.groupIdParamSchema, 'params'), group_controller_1.GroupController.getOne);
router.patch('/:groupId', (0, validate_middleware_1.validate)(group_schema_1.groupIdParamSchema, 'params'), (0, validate_middleware_1.validate)(group_schema_1.updateGroupSchema), group_controller_1.GroupController.update);
router.delete('/:groupId', (0, validate_middleware_1.validate)(group_schema_1.groupIdParamSchema, 'params'), group_controller_1.GroupController.remove);
router.post('/:groupId/members', (0, validate_middleware_1.validate)(group_schema_1.groupIdParamSchema, 'params'), (0, validate_middleware_1.validate)(group_schema_1.addMemberSchema), group_controller_1.GroupController.addMember);
router.delete('/:groupId/members/:userId', (0, validate_middleware_1.validate)(group_schema_1.groupIdParamSchema, 'params'), group_controller_1.GroupController.removeMember);
router.get('/:groupId/balances', (0, validate_middleware_1.validate)(group_schema_1.groupIdParamSchema, 'params'), group_controller_1.GroupController.getBalances);
exports.default = router;
//# sourceMappingURL=group.routes.js.map