import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createExpenseSchema, expenseIdParamSchema } from '../validation/expense.schema';
import { z } from 'zod';

const router = Router();

// Make sure the params schemas are formatted correctly
const groupIdParamSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

router.use(authenticate);

// POST /api/v1/expenses - Create a new expense
router.post('/', validate(createExpenseSchema), ExpenseController.create);

// GET /api/v1/expenses/group/:groupId - Retrieve all expenses for a group
router.get('/group/:groupId', validate(groupIdParamSchema, 'params'), ExpenseController.getAllForGroup);

// GET /api/v1/expenses/:expenseId - Retrieve details for a single expense
router.get('/:expenseId', validate(expenseIdParamSchema, 'params'), ExpenseController.getOne);

// DELETE /api/v1/expenses/:expenseId - Delete a single expense
router.delete('/:expenseId', validate(expenseIdParamSchema, 'params'), ExpenseController.remove);

export default router;
