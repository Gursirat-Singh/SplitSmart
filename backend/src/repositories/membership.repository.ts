import { prisma } from '../utils/prisma';

export class MembershipRepository {
  static async findActiveMembers(groupId: string, date?: Date) {
    if (date) {
      return prisma.groupMembership.findMany({
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

    return prisma.groupMembership.findMany({
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

  static async findActiveMembership(groupId: string, userId: string) {
    return prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId,
        leftAt: null,
      },
    });
  }

  static async create(data: { userId: string; groupId: string }) {
    return prisma.groupMembership.create({
      data: {
        ...data,
        joinedAt: new Date(),
      },
    });
  }

  static async leave(membershipId: string) {
    return prisma.groupMembership.update({
      where: { id: membershipId },
      data: { leftAt: new Date() },
    });
  }

  static async isActiveMember(groupId: string, userId: string): Promise<boolean> {
    const membership = await this.findActiveMembership(groupId, userId);
    return membership !== null;
  }
}
