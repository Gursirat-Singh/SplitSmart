import type { RegisterInput, LoginInput } from '../validation/auth.schema';
export declare class AuthService {
    /**
     * Registers a new user.
     * Checks if the email is already in use, hashes the password, creates the user,
     * and returns the user object (excluding the password hash) along with a JWT token.
     */
    static register(input: RegisterInput): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
        };
        token: string;
    }>;
    /**
     * Logs in an existing user.
     * Finds the user by email, compares the provided password with the stored hash,
     * and returns the user object (excluding the password hash) along with a JWT token.
     */
    static login(input: LoginInput): Promise<{
        user: {
            id: string;
            email: string | null;
            name: string;
        };
        token: string;
    }>;
    /**
     * Helper function to generate a JWT token.
     */
    private static generateToken;
}
