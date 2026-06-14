import type { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service';
import { catchAsync } from '../utils/helpers';
import type { ApiResponse } from '../types';

export class ExpenseController {
  /**
   * Create a new expense.
   */
  static create = catchAsync(async (req: Request, res: Response) => {
    const paidById = req.user!.userId;
    const result = await ExpenseService.createExpense(paidById, req.body);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Expense created successfully',
    };

    res.status(201).json(response);
  });

  /**
   * Get all expenses for a group.
   */
  static getAllForGroup = catchAsync(async (req: Request, res: Response) => {
    const groupId = req.params.groupId as string;
    const userId = req.user!.userId;
    const expenses = await ExpenseService.getGroupExpenses(groupId, userId);

    const response: ApiResponse = {
      success: true,
      data: expenses,
      message: 'Group expenses retrieved successfully',
    };

    res.status(200).json(response);
  });

  /**
   * Get a single expense details.
   */
  static getOne = catchAsync(async (req: Request, res: Response) => {
    const expenseId = req.params.expenseId as string;
    const userId = req.user!.userId;
    const expense = await ExpenseService.getExpenseById(expenseId, userId);

    const response: ApiResponse = {
      success: true,
      data: expense,
      message: 'Expense details retrieved successfully',
    };

    res.status(200).json(response);
  });

  /**
   * Delete an expense.
   */
  static remove = catchAsync(async (req: Request, res: Response) => {
    const expenseId = req.params.expenseId as string;
    const userId = req.user!.userId;
    await ExpenseService.deleteExpense(expenseId, userId);

    const response: ApiResponse = {
      success: true,
      data: null,
      message: 'Expense deleted successfully',
    };

    res.status(200).json(response);
  });
}
