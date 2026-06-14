"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipRepository = void 0;
const prisma_1 = require("../utils/prisma");
class MembershipRepository {
    static async findActiveMembers(groupId, date) {
        if (date) {
            return prisma_1.prisma.groupMembership.findMany({
                where: {
                    groupId,
                    joinedAt: { lte: date },
                    OR: [{ leftAt: null }, { leftAt: { gt: date } }],
                },
                include: {
                    user: {
                        select: { id: true, email: true, name: true },
                    },
                },
            });
        }
        return prisma_1.prisma.groupMembership.findMany({
            where: {
                groupId,
                leftAt: null,
            },
            include: {
                user: {
                    select: { id: true, email: true, name: true },
                },
            },
        });
    }
    static async findActiveMembership(groupId, userId) {
        return prisma_1.prisma.groupMembership.findFirst({
            where: {
                groupId,
                userId,
                leftAt: null,
            },
        });
    }
    static async create(data) {
        return prisma_1.prisma.groupMembership.create({
            data: {
                ...data,
                joinedAt: new Date(),
            },
        });
    }
    static async leave(membershipId) {
        return prisma_1.prisma.groupMembership.update({
            where: { id: membershipId },
            data: { leftAt: new Date() },
        });
    }
    static async isActiveMember(groupId, userId) {
        const membership = await this.findActiveMembership(groupId, userId);
        return membership !== null;
    }
}
exports.MembershipRepository = MembershipRepository;
//# sourceMappingURL=membership.repository.js.map