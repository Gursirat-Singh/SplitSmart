export declare class GroupRepository {
    static create(data: {
        name: string;
        description?: string;
        createdById: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
    }>;
    static findById(id: string): Promise<({
        memberships: ({
            user: {
                id: string;
                email: string | null;
                name: string;
            };
        } & {
            id: string;
            userId: string;
            leftAt: Date | null;
            groupId: string;
            joinedAt: Date;
        })[];
        createdBy: {
            id: string;
            email: string | null;
            name: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
    }) | null>;
    static findByUserId(userId: string): Promise<({
        _count: {
            memberships: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
    })[]>;
    static update(id: string, data: {
        name?: string;
        description?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
    }>;
    static delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
    }>;
}
