import { Router } from 'express';
import { GroupController } from '../controllers/group.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { ExpenseController } from '../controllers/expense.controller';
import { SettlementController } from '../controllers/settlement.controller';
import {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  groupIdParamSchema,
} from '../validation/group.schema';
import {
  createNestedSettlementSchema,
  settlementIdParamSchema,
} from '../validation/settlement.schema';

const router = Router();

// All group routes require authentication
router.use(authenticate);

router.post('/', validate(createGroupSchema), GroupController.create);
router.get('/', GroupController.getAll);

router.get('/dashboard/stats', GroupController.getDashboardStats);

router.get('/:groupId', validate(groupIdParamSchema, 'params'), GroupController.getOne);
router.patch(
  '/:groupId',
  validate(groupIdParamSchema, 'params'),
  validate(updateGroupSchema),
  GroupController.update
);
router.delete('/:groupId', validate(groupIdParamSchema, 'params'), GroupController.remove);

router.post(
  '/:groupId/members',
  validate(groupIdParamSchema, 'params'),
  validate(addMemberSchema),
  GroupController.addMember
);
router.delete(
  '/:groupId/members/:userId',
  validate(groupIdParamSchema, 'params'),
  GroupController.removeMember
);
router.post(
  '/:groupId/members/:userId/link',
  validate(groupIdParamSchema, 'params'),
  GroupController.linkMember
);

router.get(
  '/:groupId/balances',
  validate(groupIdParamSchema, 'params'),
  GroupController.getBalances
);

router.get(
  '/:groupId/balances/:userId/breakdown',
  validate(groupIdParamSchema, 'params'),
  GroupController.getBalanceBreakdown
);

router.get(
  '/:groupId/expenses',
  validate(groupIdParamSchema, 'params'),
  ExpenseController.getAllForGroup
);

router.get(
  '/:groupId/settlements',
  validate(groupIdParamSchema, 'params'),
  SettlementController.getAllForGroup
);

router.post(
  '/:groupId/settlements',
  validate(groupIdParamSchema, 'params'),
  validate(createNestedSettlementSchema),
  SettlementController.createNested
);

router.delete(
  '/:groupId/settlements/:settlementId',
  validate(groupIdParamSchema.merge(settlementIdParamSchema), 'params'),
  SettlementController.deleteNested
);

export default router;
