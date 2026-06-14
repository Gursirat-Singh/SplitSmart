import { GroupRepository } from '../repositories/group.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import { UserRepository } from '../repositories/user.repository';
import { BalanceService } from './balance.service';
import { prisma } from '../utils/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import type { CreateGroupInput, UpdateGroupInput } from '../validation/group.schema';

export class GroupService {
  /**
   * Creates a new group and automatically adds the creator as the first active member.
   */
  static async createGroup(userId: string, input: CreateGroupInput) {
    return prisma.$transaction(async (tx) => {
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
  static async getGroups(userId: string) {
    return GroupRepository.findByUserId(userId);
  }

  /**
   * Retrieves a specific group by ID, ensuring the user is an active member.
   */
  static async getGroupById(groupId: string, userId: string) {
    const isMember = await MembershipRepository.isActiveMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const group = await GroupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const pendingReviewsCount = await prisma.importRow.count({
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
  static async updateGroup(groupId: string, userId: string, input: UpdateGroupInput) {
    const isMember = await MembershipRepository.isActiveMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const group = await GroupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    if (group.createdById !== userId) {
      throw new ForbiddenError('Only the group creator can update group details');
    }

    return GroupRepository.update(groupId, input);
  }

  /**
   * Deletes a group. Only the creator can delete the group.
   */
  static async deleteGroup(groupId: string, userId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    if (group.createdById !== userId) {
      throw new ForbiddenError('Only the group creator can delete the group');
    }

    await GroupRepository.delete(groupId);
  }

  /**
   * Adds a new member to the group by email.
   * Ensures the requester is a member and the target is not already a member.
   */
  static async addMember(groupId: string, requestingUserId: string, email: string) {
    const isMember = await MembershipRepository.isActiveMember(groupId, requestingUserId);
    if (!isMember) {
      throw new ForbiddenError('You must be a member to add others');
    }

    const targetUser = await UserRepository.findByEmail(email);
    if (!targetUser) {
      throw new NotFoundError('User with this email not found');
    }

    const isTargetAlreadyMember = await MembershipRepository.isActiveMember(groupId, targetUser.id);
    if (isTargetAlreadyMember) {
      throw new ValidationError('Validation failed', { email: ['User is already a member of this group'] });
    }

    return MembershipRepository.create({
      groupId,
      userId: targetUser.id,
    });
  }

  /**
   * Removes a member from the group.
   * Sets the leftAt date to effectively end their active membership.
   */
  static async removeMember(groupId: string, requestingUserId: string, targetUserId: string) {
    const isMember = await MembershipRepository.isActiveMember(groupId, requestingUserId);
    if (!isMember) {
      throw new ForbiddenError('You must be a member to remove others');
    }

    const group = await GroupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    if (targetUserId === group.createdById) {
      throw new ForbiddenError('Cannot remove the group creator');
    }

    const targetMembership = await MembershipRepository.findActiveMembership(groupId, targetUserId);
    if (!targetMembership) {
      throw new NotFoundError('Active membership not found for this user');
    }

    await MembershipRepository.leave(targetMembership.id);
  }

  static async getGroupBalances(groupId: string, userId: string) {
    const isMember = await MembershipRepository.isActiveMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    const settlements = await BalanceService.computeGroupBalances(groupId);

    const group = await GroupRepository.findById(groupId);
    const usersMap = new Map();
    group?.memberships?.forEach(m => {
      if (m.user) {
        usersMap.set(m.userId, { name: m.user.name, email: m.user.email });
      }
    });

    const userBalances = new Map<string, number>();
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
  static async linkMember(groupId: string, requestingUserId: string, importedMemberId: string, email: string) {
    const isMember = await MembershipRepository.isActiveMember(groupId, requestingUserId);
    if (!isMember) {
      throw new ForbiddenError('You must be a member to link profiles');
    }

    const importedUser = await UserRepository.findById(importedMemberId);
    if (!importedUser || importedUser.isRegistered) {
      throw new NotFoundError('Imported member not found or is already registered');
    }

    // Verify imported member actually belongs to the specified group
    const belongsToGroup = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: importedMemberId,
      },
    });
    if (!belongsToGroup) {
      throw new ForbiddenError('The imported member does not belong to this group');
    }

    const registeredUser = await UserRepository.findByEmail(email);
    if (!registeredUser || !registeredUser.isRegistered) {
      throw new NotFoundError('Registered user with this email not found');
    }

    // Link imported member to registered member
    return prisma.$transaction(async (tx) => {
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
        } else {
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
      } else {
        // If they already have a membership, just deactivate/delete the imported membership
        await tx.groupMembership.deleteMany({
          where: { groupId, userId: importedMemberId },
        });
      }

      return registeredUser;
    });
  }

  static async getDashboardStats(userId: string) {
    const memberships = await prisma.groupMembership.findMany({
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
        recentSettlements: []
      };
    }

    const totalExpenses = await prisma.expense.count({
      where: { groupId: { in: groupIds } }
    });

    const totalSettlements = await prisma.settlement.count({
      where: { groupId: { in: groupIds } }
    });

    const totalImportedRecords = await prisma.importRow.count({
      where: { import: { groupId: { in: groupIds } } }
    });

    // Compute outstanding debt for this user across all their groups
    let totalOutstandingDebt = 0;
    for (const gId of groupIds) {
      const groupBalances = await BalanceService.computeGroupBalances(gId);
      for (const b of groupBalances) {
        if (b.from === userId) {
          totalOutstandingDebt += b.amount;
        }
      }
    }

    const recentExpenses = await prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: { expenseDate: 'desc' },
      take: 5,
      include: {
        paidBy: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } }
      }
    });

    const recentSettlements = await prisma.settlement.findMany({
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

  static async getBalanceBreakdown(groupId: string, userId: string, targetUserId: string) {
    // 1. Verify requesting user is in the group
    const isMember = await MembershipRepository.isActiveMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // 2. Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true }
    });
    if (!targetUser) {
      throw new NotFoundError('Target user not found');
    }

    // 3. Fetch all expense shares where targetUserId is involved in this group
    const shares = await prisma.expenseShare.findMany({
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

    const expensesOwed: any[] = [];
    const expensesLent: any[] = [];

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
      } else {
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
    const settlements = await prisma.settlement.findMany({
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

    const settlementsPaid: any[] = [];
    const settlementsReceived: any[] = [];

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
      } else {
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
