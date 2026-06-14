import { Router } from 'express';
import { SettlementController } from '../controllers/settlement.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { createSettlementSchema, settlementIdParamSchema } from '../validation/settlement.schema';
import { groupIdParamSchema } from '../validation/group.schema';

const router = Router();

// All settlement routes require authentication
router.use(authenticate);

router.post('/', validate(createSettlementSchema), SettlementController.create);
router.get('/group/:groupId', validate(groupIdParamSchema, 'params'), SettlementController.getAllForGroup);
router.delete('/:settlementId', validate(settlementIdParamSchema, 'params'), SettlementController.delete);

export default router;
