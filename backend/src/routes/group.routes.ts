import { Router } from 'express';
import { GroupController } from '../controllers/group.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  groupIdParamSchema,
} from '../validation/group.schema';

const router = Router();

// All group routes require authentication
router.use(authenticate);

router.post('/', validate(createGroupSchema), GroupController.create);
router.get('/', GroupController.getAll);

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

router.get(
  '/:groupId/balances',
  validate(groupIdParamSchema, 'params'),
  GroupController.getBalances
);

export default router;
