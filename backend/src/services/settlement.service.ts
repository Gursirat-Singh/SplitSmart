import { prisma } from '../utils/prisma';
import { MembershipRepository } from '../repositories/membership.repository';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import { roundCurrency } from '../utils/helpers';
import type { CreateSettlementInput } from '../validation/settlement.schema';
import { Currency } from '@prisma/client';

export class SettlementService {
  /**
   * Records a settlement payment from one user to another within a group.
   */
  static async createSettlement(paidById: string, input: CreateSettlementInput) {
    const { groupId, paidToId, originalAmount, currency, exchangeRate: rateInput, settledAt } = input;

    // 1. Cannot settle with oneself
    if (paidById === paidToId) {
      throw new ValidationError('You cannot record a settlement with yourself');
    }

    // 2. Validate that the payer is an active member of the group
    const isPayerActive = await MembershipRepository.isActiveMember(groupId, paidById);
    if (!isPayerActive) {
      throw new ForbiddenError('Payer is not an active member of the group');
    }

    // 3. Validate that the payee is an active member of the group
    const isPayeeActive = await MembershipRepository.isActiveMember(groupId, paidToId);
    if (!isPayeeActive) {
      throw new ValidationError('Payee is not an active member of the group');
    }

    // 4. Handle exchange rate
    let exchangeRate = 1.0;
    if (currency === Currency.USD) {
      if (!rateInput) {
        throw new ValidationError('Exchange rate is required for USD transactions');
      }
      exchangeRate = rateInput;
    } else {
      exchangeRate = 1.0; // Enforce 1.0 for INR
    }

    const baseInrAmount = roundCurrency(originalAmount * exchangeRate);

    // 5. Create Settlement
    return prisma.settlement.create({
      data: {
        groupId,
        paidById,
        paidToId,
        originalAmount,
        currency,
        exchangeRate,
        baseInrAmount,
        settledAt: settledAt ? new Date(settledAt) : undefined,
      },
      include: {
        paidBy: {
          select: { id: true, email: true, name: true }
        },
        paidTo: {
          select: { id: true, email: true, name: true }
        }
      }
    });
  }

  /**
   * Retrieves all settlements for a specific group.
   */
  static async getGroupSettlements(groupId: string, userId: string) {
    // 1. Verify that the requesting user is an active member of the group
    const isMember = await MembershipRepository.isActiveMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // 2. Fetch settlements
    return prisma.settlement.findMany({
      where: { groupId },
      orderBy: { settledAt: 'desc' },
      include: {
        paidBy: {
          select: { id: true, email: true, name: true }
        },
        paidTo: {
          select: { id: true, email: true, name: true }
        }
      }
    });
  }

  /**
   * Deletes a settlement record.
   */
  static async deleteSettlement(settlementId: string, userId: string) {
    // 1. Retrieve the settlement
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        group: {
          select: { createdById: true }
        }
      }
    });

    if (!settlement) {
      throw new NotFoundError('Settlement not found');
    }

    // 2. Verify requesting user is either the payer, the payee, or the group creator
    const isPayer = settlement.paidById === userId;
    const isPayee = settlement.paidToId === userId;
    const isGroupCreator = settlement.group.createdById === userId;

    if (!isPayer && !isPayee && !isGroupCreator) {
      throw new ForbiddenError('You do not have permission to delete this settlement');
    }

    // 3. Delete settlement
    await prisma.settlement.delete({
      where: { id: settlementId }
    });
  }
}
