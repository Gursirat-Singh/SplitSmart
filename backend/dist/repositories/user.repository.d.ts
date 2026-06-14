export declare class UserRepository {
    static findByEmail(email: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    static findById(id: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    static create(data: {
        email: string;
        passwordHash: string;
        name: string;
    }): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
