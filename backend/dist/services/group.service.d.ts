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
        pendingReviewsCount: number;
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
    static getGroupBalances(groupId: string, userId: string): Promise<{
        balances: {
            userId: string;
            name: any;
            email: any;
            balance: number;
        }[];
        suggestedSettlements: {
            from: string;
            fromName: any;
            to: string;
            toName: any;
            amount: number;
            currency: import(".prisma/client").$Enums.Currency;
        }[];
    }>;
    /**
     * Links an imported member (ghost user) to a registered user in a group.
     * Merges all financial and membership references.
     */
    static linkMember(groupId: string, requestingUserId: string, importedMemberId: string, email: string): Promise<{
        id: string;
        email: string | null;
        passwordHash: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isRegistered: boolean;
        linkedUserId: string | null;
    }>;
    static getDashboardStats(userId: string): Promise<{
        totalGroups: number;
        totalExpenses: number;
        totalSettlements: number;
        totalOutstandingDebt: number;
        totalImportedRecords: number;
        totalExpenseAmount: number;
        totalSettlementAmount: number;
        topCreditor: {
            name: string;
            amount: number;
        };
        topDebtor: {
            name: string;
            amount: number;
        };
        activeMembersCount: number;
        monthlySpendingTrend: {
            date: string;
            amount: number;
        }[];
        recentExpenses: {
            id: string;
            groupId: string;
            groupName: string;
            description: string;
            originalAmount: number;
            currency: import(".prisma/client").$Enums.Currency;
            baseInrAmount: number;
            paidById: string;
            paidByName: string;
            expenseDate: Date;
        }[];
        recentSettlements: {
            id: string;
            groupId: string;
            groupName: string;
            paidById: string;
            paidByName: string;
            paidToId: string;
            paidToName: string;
            originalAmount: number;
            currency: import(".prisma/client").$Enums.Currency;
            baseInrAmount: number;
            settledAt: Date;
        }[];
    }>;
    static getBalanceBreakdown(groupId: string, userId: string, targetUserId: string): Promise<{
        userId: string;
        userName: string;
        userEmail: string | null;
        netBalance: number;
        expensesOwed: any[];
        expensesLent: any[];
        settlementsPaid: any[];
        settlementsReceived: any[];
    }>;
}
