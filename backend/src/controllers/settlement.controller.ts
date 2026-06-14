import type { Request, Response, NextFunction } from 'express';
import { SettlementService } from '../services/settlement.service';
import { catchAsync } from '../utils/helpers';
import type { ApiResponse } from '../types';

export class SettlementController {
  static create = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await SettlementService.createSettlement(req.user!.userId, req.body);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Settlement recorded successfully',
    };

    res.status(201).json(response);
  });

  static getAllForGroup = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await SettlementService.getGroupSettlements(req.params.groupId as string, req.user!.userId);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Settlements retrieved successfully',
    };

    res.status(200).json(response);
  });

  static delete = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await SettlementService.deleteSettlement(req.params.settlementId as string, req.user!.userId);
    res.status(204).end();
  });
}
