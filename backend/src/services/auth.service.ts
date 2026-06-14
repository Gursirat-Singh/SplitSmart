import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { config } from '../config';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import type { RegisterInput, LoginInput } from '../validation/auth.schema';

export class AuthService {
  /**
   * Registers a new user.
   * Checks if the email is already in use, hashes the password, creates the user,
   * and returns the user object (excluding the password hash) along with a JWT token.
   */
  static async register(input: RegisterInput) {
    const existingUser = await UserRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ValidationError('Validation failed', { email: ['Email is already in use'] });
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await UserRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

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
  static async login(input: LoginInput) {
    const user = await UserRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
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
  private static generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }
}
