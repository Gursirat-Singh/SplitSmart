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

    return group;
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

  /**
   * Computes the current net balances for the group.
   * Ensures the requester is an active member.
   */
  static async getGroupBalances(groupId: string, userId: string) {
    const isMember = await MembershipRepository.isActiveMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    return BalanceService.computeGroupBalances(groupId);
  }
}
