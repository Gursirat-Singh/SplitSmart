import { prisma } from '../utils/prisma';

export class GroupRepository {
  static async create(data: { name: string; description?: string; createdById: string }) {
    return prisma.group.create({
      data,
    });
  }

  static async findById(id: string) {
    return prisma.group.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true },
        },
        memberships: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.group.findMany({
      where: {
        memberships: {
          some: {
            userId,
            leftAt: null, // Only groups where user is currently active
          },
        },
      },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
    });
  }

  static async update(id: string, data: { name?: string; description?: string }) {
    return prisma.group.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.group.delete({
      where: { id },
    });
  }
}
