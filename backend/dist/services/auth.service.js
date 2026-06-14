"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repositories/user.repository");
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
class AuthService {
    /**
     * Registers a new user.
     * Checks if the email is already in use, hashes the password, creates the user,
     * and returns the user object (excluding the password hash) along with a JWT token.
     */
    static async register(input) {
        const existingUser = await user_repository_1.UserRepository.findByEmail(input.email);
        let user;
        if (existingUser) {
            if (existingUser.isRegistered) {
                throw new errors_1.ValidationError('Validation failed', { email: ['Email is already in use'] });
            }
            // Upgrade existing imported member
            const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
            const { prisma } = require('../utils/prisma');
            user = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    passwordHash,
                    isRegistered: true,
                    name: input.name,
                },
            });
        }
        else {
            const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
            user = await user_repository_1.UserRepository.create({
                email: input.email,
                passwordHash,
                name: input.name,
            });
        }
        const token = this.generateToken(user.id, user.email);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        };
    }
    /**
     * Logs in an existing user.
     * Finds the user by email, compares the provided password with the stored hash,
     * and returns the user object (excluding the password hash) along with a JWT token.
     */
    static async login(input) {
        const user = await user_repository_1.UserRepository.findByEmail(input.email);
        if (!user || !user.isRegistered || !user.passwordHash) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const token = this.generateToken(user.id, user.email);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        };
    }
    /**
     * Helper function to generate a JWT token.
     */
    static generateToken(userId, email) {
        return jsonwebtoken_1.default.sign({ userId, email: email || '' }, config_1.config.JWT_SECRET, {
            expiresIn: config_1.config.JWT_EXPIRES_IN,
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map