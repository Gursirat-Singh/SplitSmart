"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const user_repository_1 = require("../repositories/user.repository");
const helpers_1 = require("../utils/helpers");
const errors_1 = require("../utils/errors");
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
AuthController.register = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await auth_service_1.AuthService.register(req.body);
    const response = {
        success: true,
        data: result,
        message: 'User registered successfully',
    };
    res.status(201).json(response);
});
AuthController.login = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const result = await auth_service_1.AuthService.login(req.body);
    const response = {
        success: true,
        data: result,
        message: 'Logged in successfully',
    };
    res.status(200).json(response);
});
AuthController.me = (0, helpers_1.catchAsync)(async (req, res, _next) => {
    const userId = req.user.userId;
    const user = await user_repository_1.UserRepository.findById(userId);
    if (!user) {
        throw new errors_1.NotFoundError('User not found');
    }
    const { passwordHash, ...userWithoutPassword } = user;
    const response = {
        success: true,
        data: userWithoutPassword,
        message: 'User profile retrieved successfully',
    };
    res.status(200).json(response);
});
//# sourceMappingURL=auth.controller.js.map