export declare class UserRepository {
    static findByEmail(email: string): Promise<{
        id: string;
        email: string | null;
        passwordHash: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isRegistered: boolean;
        linkedUserId: string | null;
    } | null>;
    static findById(id: string): Promise<{
        id: string;
        email: string | null;
        passwordHash: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isRegistered: boolean;
        linkedUserId: string | null;
    } | null>;
    static create(data: {
        email?: string | null;
        passwordHash?: string | null;
        name: string;
    }): Promise<{
        id: string;
        email: string | null;
        passwordHash: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isRegistered: boolean;
        linkedUserId: string | null;
    }>;
}
