"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupRepository = void 0;
const prisma_1 = require("../utils/prisma");
class GroupRepository {
    static async create(data) {
        return prisma_1.prisma.group.create({
            data,
        });
    }
    static async findById(id) {
        return prisma_1.prisma.group.findUnique({
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
    static async findByUserId(userId) {
        return prisma_1.prisma.group.findMany({
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
    static async update(id, data) {
        return prisma_1.prisma.group.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        return prisma_1.prisma.group.delete({
            where: { id },
        });
    }
}
exports.GroupRepository = GroupRepository;
//# sourceMappingURL=group.repository.js.map