export declare class MembershipRepository {
    static findActiveMembers(groupId: string, date?: Date): Promise<({
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
    })[]>;
    static findActiveMembership(groupId: string, userId: string): Promise<{
        id: string;
        userId: string;
        leftAt: Date | null;
        groupId: string;
        joinedAt: Date;
    } | null>;
    static create(data: {
        userId: string;
        groupId: string;
    }): Promise<{
        id: string;
        userId: string;
        leftAt: Date | null;
        groupId: string;
        joinedAt: Date;
    }>;
    static leave(membershipId: string): Promise<{
        id: string;
        userId: string;
        leftAt: Date | null;
        groupId: string;
        joinedAt: Date;
    }>;
    static isActiveMember(groupId: string, userId: string): Promise<boolean>;
}
