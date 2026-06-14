import type { Request, Response, NextFunction } from 'express';
import { SettlementService } from '../services/settlement.service';
import { catchAsync } from '../utils/helpers';
import type { ApiResponse } from '../types';
import { MembershipRepository } from '../repositories/membership.repository';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { prisma } from '../utils/prisma';

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

  static createNested = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const groupId = req.params.groupId as string;
    const payerId = req.body.payerId as string;
    const payeeId = req.body.payeeId as string;
    const { amount, currency, exchangeRate, date } = req.body;

    // Verify requesting user is in the group
    const isMember = await MembershipRepository.isActiveMember(groupId, req.user!.userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const result = await SettlementService.createSettlement(payerId, {
      groupId,
      paidToId: payeeId,
      originalAmount: amount,
      currency,
      exchangeRate,
      settledAt: date,
    });

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

  static deleteNested = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const groupId = req.params.groupId as string;
    const settlementId = req.params.settlementId as string;

    // Verify requesting user is in the group
    const isMember = await MembershipRepository.isActiveMember(groupId, req.user!.userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Verify settlement belongs to the group
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId }
    });
    if (!settlement) {
      throw new NotFoundError('Settlement not found');
    }
    if (settlement.groupId !== groupId) {
      throw new ForbiddenError('Settlement does not belong to this group');
    }

    await SettlementService.deleteSettlement(settlementId, req.user!.userId);

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Settlement deleted successfully',
    };

    res.status(200).json(response);
  });
}
