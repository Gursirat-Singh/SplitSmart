import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { catchAsync } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';
import type { ApiResponse } from '../types';

export class AuthController {
  static register = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await AuthService.register(req.body);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'User registered successfully',
    };

    res.status(201).json(response);
  });

  static login = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await AuthService.login(req.body);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Logged in successfully',
    };

    res.status(200).json(response);
  });

  static me = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user!.userId;
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;

    const response: ApiResponse<typeof userWithoutPassword> = {
      success: true,
      data: userWithoutPassword,
      message: 'User profile retrieved successfully',
    };

    res.status(200).json(response);
  });
}
