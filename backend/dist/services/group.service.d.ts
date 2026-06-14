import type { CreateGroupInput, UpdateGroupInput } from '../validation/group.schema';
export declare class GroupService {
    /**
     * Creates a new group and automatically adds the creator as the first active member.
     */
    static createGroup(userId: string, input: CreateGroupInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
    }>;
    /**
     * Retrieves all groups where the user is an active member.
     */
    static getGroups(userId: string): Promise<({
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
    /**
     * Retrieves a specific group by ID, ensuring the user is an active member.
     */
    static getGroupById(groupId: string, userId: string): Promise<{
        memberships: ({
            user: {
                id: string;
                email: string;
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
            email: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
    }>;
    /**
     * Updates group details. Only the creator can update the group.
     */
    static updateGroup(groupId: string, userId: string, input: UpdateGroupInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
    }>;
    /**
     * Deletes a group. Only the creator can delete the group.
     */
    static deleteGroup(groupId: string, userId: string): Promise<void>;
    /**
     * Adds a new member to the group by email.
     * Ensures the requester is a member and the target is not already a member.
     */
    static addMember(groupId: string, requestingUserId: string, email: string): Promise<{
        id: string;
        userId: string;
        leftAt: Date | null;
        groupId: string;
        joinedAt: Date;
    }>;
    /**
     * Removes a member from the group.
     * Sets the leftAt date to effectively end their active membership.
     */
    static removeMember(groupId: string, requestingUserId: string, targetUserId: string): Promise<void>;
    /**
     * Computes the current net balances for the group.
     * Ensures the requester is an active member.
     */
    static getGroupBalances(groupId: string, userId: string): Promise<import("./balance.service").Balance[]>;
}
