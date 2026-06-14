"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupService = void 0;
const group_repository_1 = require("../repositories/group.repository");
const membership_repository_1 = require("../repositories/membership.repository");
const user_repository_1 = require("../repositories/user.repository");
const balance_service_1 = require("./balance.service");
const prisma_1 = require("../utils/prisma");
const errors_1 = require("../utils/errors");
class GroupService {
    /**
     * Creates a new group and automatically adds the creator as the first active member.
     */
    static async createGroup(userId, input) {
        return prisma_1.prisma.$transaction(async (tx) => {
            const group = await tx.group.create({
                data: {
                    name: input.name,
                    description: input.description,
                    createdById: userId,
                },
            });
            await tx.groupMembership.create({
                data: {
                    groupId: group.id,
                    userId,
                    joinedAt: new Date(),
                },
            });
            return group;
        });
    }
    /**
     * Retrieves all groups where the user is an active member.
     */
    static async getGroups(userId) {
        return group_repository_1.GroupRepository.findByUserId(userId);
    }
    /**
     * Retrieves a specific group by ID, ensuring the user is an active member.
     */
    static async getGroupById(groupId, userId) {
        const isMember = await membership_repository_1.MembershipRepository.isActiveMember(groupId, userId);
        if (!isMember) {
            throw new errors_1.ForbiddenError('You are not a member of this group');
        }
        const group = await group_repository_1.GroupRepository.findById(groupId);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        const pendingReviewsCount = await prisma_1.prisma.importRow.count({
            where: {
                import: { groupId },
                verdict: 'FLAGGED'
            }
        });
        return {
            ...group,
            pendingReviewsCount
        };
    }
    /**
     * Updates group details. Only the creator can update the group.
     */
    static async updateGroup(groupId, userId, input) {
        const isMember = await membership_repository_1.MembershipRepository.isActiveMember(groupId, userId);
        if (!isMember) {
            throw new errors_1.ForbiddenError('You are not a member of this group');
        }
        const group = await group_repository_1.GroupRepository.findById(groupId);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        if (group.createdById !== userId) {
            throw new errors_1.ForbiddenError('Only the group creator can update group details');
        }
        return group_repository_1.GroupRepository.update(groupId, input);
    }
    /**
     * Deletes a group. Only the creator can delete the group.
     */
    static async deleteGroup(groupId, userId) {
        const group = await group_repository_1.GroupRepository.findById(groupId);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        if (group.createdById !== userId) {
            throw new errors_1.ForbiddenError('Only the group creator can delete the group');
        }
        await group_repository_1.GroupRepository.delete(groupId);
    }
    /**
     * Adds a new member to the group by email.
     * Ensures the requester is a member and the target is not already a member.
     */
    static async addMember(groupId, requestingUserId, email) {
        const isMember = await membership_repository_1.MembershipRepository.isActiveMember(groupId, requestingUserId);
        if (!isMember) {
            throw new errors_1.ForbiddenError('You must be a member to add others');
        }
        const targetUser = await user_repository_1.UserRepository.findByEmail(email);
        if (!targetUser) {
            throw new errors_1.NotFoundError('User with this email not found');
        }
        const isTargetAlreadyMember = await membership_repository_1.MembershipRepository.isActiveMember(groupId, targetUser.id);
        if (isTargetAlreadyMember) {
            throw new errors_1.ValidationError('Validation failed', { email: ['User is already a member of this group'] });
        }
        return membership_repository_1.MembershipRepository.create({
            groupId,
            userId: targetUser.id,
        });
    }
    /**
     * Removes a member from the group.
     * Sets the leftAt date to effectively end their active membership.
     */
    static async removeMember(groupId, requestingUserId, targetUserId) {
        const isMember = await membership_repository_1.MembershipRepository.isActiveMember(groupId, requestingUserId);
        if (!isMember) {
            throw new errors_1.ForbiddenError('You must be a member to remove others');
        }
        const group = await group_repository_1.GroupRepository.findById(groupId);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        if (targetUserId === group.createdById) {
            throw new errors_1.ForbiddenError('Cannot remove the group creator');
        }
        const targetMembership = await membership_repository_1.MembershipRepository.findActiveMembership(groupId, targetUserId);
        if (!targetMembership) {
            throw new errors_1.NotFoundError('Active membership not found for this user');
        }
        await membership_repository_1.MembershipRepository.leave(targetMembership.id);
    }
    static async getGroupBalances(groupId, userId) {
        const isMember = await membership_repository_1.MembershipRepository.isActiveMember(groupId, userId);
        if (!isMember) {
            throw new errors_1.ForbiddenError('You are not a member of this group');
        }
        const settlements = await balance_service_1.BalanceService.computeGroupBalances(groupId);
        const group = await group_repository_1.GroupRepository.findById(groupId);
        const usersMap = new Map();
        group?.memberships?.forEach(m => {
            if (m.user) {
                usersMap.set(m.userId, { name: m.user.name, email: m.user.email });
            }
        });
        const userBalances = new Map();
        group?.memberships?.forEach(m => userBalances.set(m.userId, 0));
        const suggestedSettlements = [];
        for (const s of settlements) {
            // s.from owes s.to s.amount
            const fromBal = userBalances.get(s.from) || 0;
            userBalances.set(s.from, fromBal - s.amount);
            const toBal = userBalances.get(s.to) || 0;
            userBalances.set(s.to, toBal + s.amount);
            suggestedSettlements.push({
                from: s.from,
                fromName: usersMap.get(s.from)?.name || 'Unknown',
                to: s.to,
                toName: usersMap.get(s.to)?.name || 'Unknown',
                amount: s.amount,
                currency: s.currency
            });
        }
        const balances = Array.from(userBalances.entries()).map(([uId, bal]) => ({
            userId: uId,
            name: usersMap.get(uId)?.name || 'Unknown',
            email: usersMap.get(uId)?.email || '',
            balance: bal
        }));
        return {
            balances,
            suggestedSettlements
        };
    }
    /**
     * Links an imported member (ghost user) to a registered user in a group.
     * Merges all financial and membership references.
     */
    static async linkMember(groupId, requestingUserId, importedMemberId, email) {
        const isMember = await membership_repository_1.MembershipRepository.isActiveMember(groupId, requestingUserId);
        if (!isMember) {
            throw new errors_1.ForbiddenError('You must be a member to link profiles');
        }
        const importedUser = await user_repository_1.UserRepository.findById(importedMemberId);
        if (!importedUser || importedUser.isRegistered) {
            throw new errors_1.NotFoundError('Imported member not found or is already registered');
        }
        // Verify imported member actually belongs to the specified group
        const belongsToGroup = await prisma_1.prisma.groupMembership.findFirst({
            where: {
                groupId,
                userId: importedMemberId,
            },
        });
        if (!belongsToGroup) {
            throw new errors_1.ForbiddenError('The imported member does not belong to this group');
        }
        const registeredUser = await user_repository_1.UserRepository.findByEmail(email);
        if (!registeredUser || !registeredUser.isRegistered) {
            throw new errors_1.NotFoundError('Registered user with this email not found');
        }
        // Link imported member to registered member
        return prisma_1.prisma.$transaction(async (tx) => {
            // 1. Set linkedUserId on the imported user
            await tx.user.update({
                where: { id: importedMemberId },
                data: { linkedUserId: registeredUser.id },
            });
            // 2. Transfer expenses paid by imported user to registered user
            await tx.expense.updateMany({
                where: { groupId, paidById: importedMemberId },
                data: { paidById: registeredUser.id },
            });
            // 3. Transfer expense shares to registered user
            const shares = await tx.expenseShare.findMany({
                where: { expense: { groupId }, userId: importedMemberId },
            });
            for (const share of shares) {
                const existingShare = await tx.expenseShare.findFirst({
                    where: { expenseId: share.expenseId, userId: registeredUser.id },
                });
                if (existingShare) {
                    // Add them together
                    await tx.expenseShare.update({
                        where: { id: existingShare.id },
                        data: {
                            originalAmount: Number(existingShare.originalAmount) + Number(share.originalAmount),
                            baseInrAmount: Number(existingShare.baseInrAmount) + Number(share.baseInrAmount),
                        },
                    });
                    await tx.expenseShare.delete({ where: { id: share.id } });
                }
                else {
                    await tx.expenseShare.update({
                        where: { id: share.id },
                        data: { userId: registeredUser.id },
                    });
                }
            }
            // 4. Transfer settlements paid/received
            await tx.settlement.updateMany({
                where: { groupId, paidById: importedMemberId },
                data: { paidById: registeredUser.id },
            });
            await tx.settlement.updateMany({
                where: { groupId, paidToId: importedMemberId },
                data: { paidToId: registeredUser.id },
            });
            // 5. Ensure the registered user has a membership in the group
            const registeredMembership = await tx.groupMembership.findFirst({
                where: { groupId, userId: registeredUser.id, leftAt: null },
            });
            if (!registeredMembership) {
                // Transfer the membership
                await tx.groupMembership.updateMany({
                    where: { groupId, userId: importedMemberId },
                    data: { userId: registeredUser.id },
                });
            }
            else {
                // If they already have a membership, just deactivate/delete the imported membership
                await tx.groupMembership.deleteMany({
                    where: { groupId, userId: importedMemberId },
                });
            }
            return registeredUser;
        });
    }
    static async getDashboardStats(userId) {
        const memberships = await prisma_1.prisma.groupMembership.findMany({
            where: { userId, leftAt: null },
            select: { groupId: true }
        });
        const groupIds = memberships.map(m => m.groupId);
        const totalGroups = groupIds.length;
        if (totalGroups === 0) {
            return {
                totalGroups: 0,
                totalExpenses: 0,
                totalSettlements: 0,
                totalOutstandingDebt: 0,
                totalImportedRecords: 0,
                recentExpenses: [],
                recentSettlements: [],
                totalExpenseAmount: 0,
                totalSettlementAmount: 0,
                topCreditor: { name: 'None', amount: 0 },
                topDebtor: { name: 'None', amount: 0 },
                activeMembersCount: 0,
                monthlySpendingTrend: []
            };
        }
        const totalExpenses = await prisma_1.prisma.expense.count({
            where: { groupId: { in: groupIds } }
        });
        const totalSettlements = await prisma_1.prisma.settlement.count({
            where: { groupId: { in: groupIds } }
        });
        const totalImportedRecords = await prisma_1.prisma.importRow.count({
            where: { import: { groupId: { in: groupIds } } }
        });
        // Compute outstanding debt for this user across all their groups
        let totalOutstandingDebt = 0;
        for (const gId of groupIds) {
            const groupBalances = await balance_service_1.BalanceService.computeGroupBalances(gId);
            for (const b of groupBalances) {
                if (b.from === userId) {
                    totalOutstandingDebt += b.amount;
                }
            }
        }
        // Compute group financial overview metrics
        const groups = await prisma_1.prisma.group.findMany({
            where: { id: { in: groupIds } },
            include: {
                memberships: {
                    where: { leftAt: null },
                    include: {
                        user: { select: { id: true, name: true } }
                    }
                }
            }
        });
        const globalBalances = new Map();
        const userNames = new Map();
        for (const group of groups) {
            group.memberships.forEach(m => {
                if (m.user) {
                    userNames.set(m.userId, m.user.name);
                }
            });
            const settlementsList = await balance_service_1.BalanceService.computeGroupBalances(group.id);
            for (const s of settlementsList) {
                globalBalances.set(s.from, (globalBalances.get(s.from) || 0) - s.amount);
                globalBalances.set(s.to, (globalBalances.get(s.to) || 0) + s.amount);
            }
        }
        let topCreditor = { name: 'None', amount: 0 };
        let topDebtor = { name: 'None', amount: 0 };
        let maxPositive = 0;
        let maxNegative = 0;
        for (const [uId, bal] of globalBalances.entries()) {
            if (bal > maxPositive) {
                maxPositive = bal;
                topCreditor = {
                    name: userNames.get(uId) || 'Unknown',
                    amount: Number(bal.toFixed(2))
                };
            }
            if (bal < maxNegative) {
                maxNegative = bal;
                topDebtor = {
                    name: userNames.get(uId) || 'Unknown',
                    amount: Number(Math.abs(bal).toFixed(2))
                };
            }
        }
        const uniqueMemberIds = new Set();
        for (const group of groups) {
            group.memberships.forEach(m => {
                uniqueMemberIds.add(m.userId);
            });
        }
        const activeMembersCount = uniqueMemberIds.size;
        const totalExpenseSum = await prisma_1.prisma.expense.aggregate({
            where: { groupId: { in: groupIds } },
            _sum: { baseInrAmount: true }
        });
        const totalExpenseAmount = Number(totalExpenseSum._sum.baseInrAmount || 0);
        const totalSettlementSum = await prisma_1.prisma.settlement.aggregate({
            where: { groupId: { in: groupIds } },
            _sum: { baseInrAmount: true }
        });
        const totalSettlementAmount = Number(totalSettlementSum._sum.baseInrAmount || 0);
        const expensesForTrend = await prisma_1.prisma.expense.findMany({
            where: { groupId: { in: groupIds } },
            select: { expenseDate: true, baseInrAmount: true },
            orderBy: { expenseDate: 'asc' }
        });
        const monthlyTrendsMap = new Map();
        expensesForTrend.forEach((exp) => {
            const date = new Date(exp.expenseDate);
            const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const amount = Number(exp.baseInrAmount);
            monthlyTrendsMap.set(monthYear, (monthlyTrendsMap.get(monthYear) || 0) + amount);
        });
        const monthlySpendingTrend = Array.from(monthlyTrendsMap.entries()).map(([date, amount]) => ({
            date,
            amount: Number(amount.toFixed(2)),
        }));
        const recentExpenses = await prisma_1.prisma.expense.findMany({
            where: { groupId: { in: groupIds } },
            orderBy: { expenseDate: 'desc' },
            take: 5,
            include: {
                paidBy: { select: { id: true, name: true, email: true } },
                group: { select: { id: true, name: true } }
            }
        });
        const recentSettlements = await prisma_1.prisma.settlement.findMany({
            where: { groupId: { in: groupIds } },
            orderBy: { settledAt: 'desc' },
            take: 5,
            include: {
                paidBy: { select: { id: true, name: true, email: true } },
                paidTo: { select: { id: true, name: true, email: true } },
                group: { select: { id: true, name: true } }
            }
        });
        return {
            totalGroups,
            totalExpenses,
            totalSettlements,
            totalOutstandingDebt,
            totalImportedRecords,
            totalExpenseAmount,
            totalSettlementAmount,
            topCreditor,
            topDebtor,
            activeMembersCount,
            monthlySpendingTrend,
            recentExpenses: recentExpenses.map(e => ({
                id: e.id,
                groupId: e.groupId,
                groupName: e.group.name,
                description: e.description,
                originalAmount: Number(e.originalAmount),
                currency: e.currency,
                baseInrAmount: Number(e.baseInrAmount),
                paidById: e.paidById,
                paidByName: e.paidBy.name,
                expenseDate: e.expenseDate
            })),
            recentSettlements: recentSettlements.map(s => ({
                id: s.id,
                groupId: s.groupId,
                groupName: s.group.name,
                paidById: s.paidById,
                paidByName: s.paidBy.name,
                paidToId: s.paidToId,
                paidToName: s.paidTo.name,
                originalAmount: Number(s.originalAmount),
                currency: s.currency,
                baseInrAmount: Number(s.baseInrAmount),
                settledAt: s.settledAt
            }))
        };
    }
    static async getBalanceBreakdown(groupId, userId, targetUserId) {
        // 1. Verify requesting user is in the group
        const isMember = await membership_repository_1.MembershipRepository.isActiveMember(groupId, userId);
        if (!isMember) {
            throw new errors_1.ForbiddenError('You are not a member of this group');
        }
        // 2. Verify target user exists
        const targetUser = await prisma_1.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, name: true, email: true }
        });
        if (!targetUser) {
            throw new errors_1.NotFoundError('Target user not found');
        }
        // 3. Fetch all expense shares where targetUserId is involved in this group
        const shares = await prisma_1.prisma.expenseShare.findMany({
            where: {
                userId: targetUserId,
                expense: { groupId }
            },
            include: {
                expense: {
                    include: {
                        paidBy: { select: { id: true, name: true, email: true } },
                        shares: {
                            include: {
                                user: { select: { id: true, name: true, email: true } }
                            }
                        }
                    }
                }
            },
            orderBy: {
                expense: {
                    expenseDate: 'desc'
                }
            }
        });
        const expensesOwed = [];
        const expensesLent = [];
        for (const s of shares) {
            const exp = s.expense;
            if (exp.paidById === targetUserId) {
                // Target user paid. They lent to others.
                const otherShares = exp.shares.filter(other => other.userId !== targetUserId);
                const totalLent = otherShares.reduce((acc, curr) => acc + Number(curr.baseInrAmount), 0);
                if (totalLent > 0) {
                    expensesLent.push({
                        expenseId: exp.id,
                        description: exp.description,
                        originalAmount: Number(exp.originalAmount),
                        currency: exp.currency,
                        totalLent,
                        date: exp.expenseDate,
                        shares: otherShares.map(o => ({
                            userId: o.userId,
                            userName: o.user.name,
                            amount: Number(o.baseInrAmount)
                        }))
                    });
                }
            }
            else {
                // Target user owes.
                expensesOwed.push({
                    expenseId: exp.id,
                    description: exp.description,
                    paidById: exp.paidById,
                    paidByName: exp.paidBy.name,
                    originalAmount: Number(exp.originalAmount),
                    currency: exp.currency,
                    userShare: Number(s.baseInrAmount),
                    date: exp.expenseDate
                });
            }
        }
        // 4. Fetch all settlements in this group where targetUserId is payer or payee
        const settlements = await prisma_1.prisma.settlement.findMany({
            where: {
                groupId,
                OR: [
                    { paidById: targetUserId },
                    { paidToId: targetUserId }
                ]
            },
            include: {
                paidBy: { select: { id: true, name: true } },
                paidTo: { select: { id: true, name: true } }
            },
            orderBy: {
                settledAt: 'desc'
            }
        });
        const settlementsPaid = [];
        const settlementsReceived = [];
        for (const set of settlements) {
            if (set.paidById === targetUserId) {
                settlementsPaid.push({
                    settlementId: set.id,
                    paidToId: set.paidToId,
                    paidToName: set.paidTo.name,
                    amount: Number(set.baseInrAmount),
                    currency: set.currency,
                    date: set.settledAt
                });
            }
            else {
                settlementsReceived.push({
                    settlementId: set.id,
                    paidById: set.paidById,
                    paidByName: set.paidBy.name,
                    amount: Number(set.baseInrAmount),
                    currency: set.currency,
                    date: set.settledAt
                });
            }
        }
        // Compute net balance
        const balancesResponse = await this.getGroupBalances(groupId, userId);
        const balanceObj = balancesResponse.balances.find(b => b.userId === targetUserId);
        const netBalance = balanceObj ? balanceObj.balance : 0;
        return {
            userId: targetUserId,
            userName: targetUser.name,
            userEmail: targetUser.email,
            netBalance,
            expensesOwed,
            expensesLent,
            settlementsPaid,
            settlementsReceived
        };
    }
}
exports.GroupService = GroupService;
//# sourceMappingURL=group.service.js.map