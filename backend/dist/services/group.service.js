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
        return group;
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
    /**
     * Computes the current net balances for the group.
     * Ensures the requester is an active member.
     */
    static async getGroupBalances(groupId, userId) {
        const isMember = await membership_repository_1.MembershipRepository.isActiveMember(groupId, userId);
        if (!isMember) {
            throw new errors_1.ForbiddenError('You are not a member of this group');
        }
        return balance_service_1.BalanceService.computeGroupBalances(groupId);
    }
}
exports.GroupService = GroupService;
//# sourceMappingURL=group.service.js.map