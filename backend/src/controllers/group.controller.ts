import type { Request, Response, NextFunction } from 'express';
import { GroupService } from '../services/group.service';
import { catchAsync } from '../utils/helpers';
import type { ApiResponse } from '../types';

export class GroupController {
  static create = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await GroupService.createGroup(req.user!.userId, req.body);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Group created successfully',
    };

    res.status(201).json(response);
  });

  static getAll = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await GroupService.getGroups(req.user!.userId);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Groups retrieved successfully',
    };

    res.status(200).json(response);
  });

  static getOne = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await GroupService.getGroupById(req.params.groupId as string, req.user!.userId);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Group retrieved successfully',
    };

    res.status(200).json(response);
  });

  static update = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await GroupService.updateGroup(req.params.groupId as string, req.user!.userId, req.body);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Group updated successfully',
    };

    res.status(200).json(response);
  });

  static remove = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await GroupService.deleteGroup(req.params.groupId as string, req.user!.userId);
    res.status(204).end();
  });

  static addMember = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await GroupService.addMember(req.params.groupId as string, req.user!.userId, req.body.email);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Member added successfully',
    };

    res.status(201).json(response);
  });

  static removeMember = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await GroupService.removeMember(req.params.groupId as string, req.user!.userId, req.params.userId as string);

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Member removed successfully',
    };

    res.status(200).json(response);
  });

  static linkMember = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await GroupService.linkMember(
      req.params.groupId as string,
      req.user!.userId,
      req.params.userId as string,
      req.body.email as string
    );

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Imported member linked successfully',
    };

    res.status(200).json(response);
  });

  static getBalances = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await GroupService.getGroupBalances(req.params.groupId as string, req.user!.userId);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Group balances retrieved successfully',
    };

    res.status(200).json(response);
  });
}
