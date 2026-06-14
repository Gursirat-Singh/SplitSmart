import { prisma } from '../utils/prisma';
import { MembershipRepository } from '../repositories/membership.repository';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import { roundCurrency } from '../utils/helpers';
import type { CreateExpenseInput } from '../validation/expense.schema';

export class ExpenseService {
  /**
   * Creates a new expense inside a group and partitions the shares using the specified split rule.
   * Everything runs inside a single Prisma transaction.
   */
  static async createExpense(paidById: string, input: CreateExpenseInput) {
    const {
      groupId,
      description,
      originalAmount,
      currency,
      exchangeRate: rateInput,
      splitType,
      expenseDate,
      splits,
    } = input;

    const parsedDate = new Date(expenseDate);

    // 1. Validate that the payer is an active member on the expense date
    const payerMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: paidById,
        joinedAt: { lte: parsedDate },
        OR: [{ leftAt: null }, { leftAt: { gt: parsedDate } }],
      },
    });

    if (!payerMembership) {
      throw new ForbiddenError('Payer is not an active member of the group on the expense date');
    }

    // 2. Validate all split participants are active members on the expense date
    const participantIds = splits.map((s) => s.userId);
    const uniqueParticipants = Array.from(new Set(participantIds));

    const activeMemberships = await prisma.groupMembership.findMany({
      where: {
        groupId,
        userId: { in: uniqueParticipants },
        joinedAt: { lte: parsedDate },
        OR: [{ leftAt: null }, { leftAt: { gt: parsedDate } }],
      },
    });

    if (activeMemberships.length !== uniqueParticipants.length) {
      throw new ValidationError('One or more split participants are not active group members on this date');
    }

    // 3. Handle currency exchange rate logic
    let exchangeRate = 1.0;
    if (currency === 'USD') {
      if (!rateInput) {
        throw new ValidationError('Exchange rate is required for USD transactions');
      }
      exchangeRate = rateInput;
    } else {
      exchangeRate = 1.0; // Enforce 1.0 for INR
    }

    const baseInrAmount = roundCurrency(originalAmount * exchangeRate);

    // 4. Calculate individual shares based on split type
    interface CalculatedShare {
      userId: string;
      originalAmount: number;
      baseInrAmount: number;
    }

    const calculatedShares: CalculatedShare[] = [];

    if (splitType === 'EQUAL') {
      const shareCount = uniqueParticipants.length;
      const originalShareBase = roundCurrency(originalAmount / shareCount);
      const baseInrShareBase = roundCurrency(baseInrAmount / shareCount);

      let originalSum = 0;
      let baseInrSum = 0;

      for (let i = 0; i < shareCount; i++) {
        const userId = uniqueParticipants[i];
        if (!userId) {
          throw new ValidationError('Participant user ID is missing');
        }
        calculatedShares.push({
          userId,
          originalAmount: originalShareBase,
          baseInrAmount: baseInrShareBase,
        });
        originalSum += originalShareBase;
        baseInrSum += baseInrShareBase;
      }

      // Assign rounding remainder strictly to the payer
      const originalRemainder = roundCurrency(originalAmount - originalSum);
      const baseInrRemainder = roundCurrency(baseInrAmount - baseInrSum);

      if (originalRemainder !== 0 || baseInrRemainder !== 0) {
        const payerShare = calculatedShares.find(s => s.userId === paidById);
        if (payerShare) {
          payerShare.originalAmount = roundCurrency(payerShare.originalAmount + originalRemainder);
          payerShare.baseInrAmount = roundCurrency(payerShare.baseInrAmount + baseInrRemainder);
        } else {
          // Payer is not part of the split; add a self-share for the remainder to preserve the sum
          calculatedShares.push({
            userId: paidById,
            originalAmount: originalRemainder,
            baseInrAmount: baseInrRemainder,
          });
        }
      }
    } else if (splitType === 'EXACT') {
      // Validate that every split has a share value
      let originalSum = 0;
      for (const split of splits) {
        if (!split || split.share === undefined) {
          throw new ValidationError('Share value is required for EXACT splits');
        }
        originalSum += split.share;
      }

      if (roundCurrency(originalSum) !== roundCurrency(originalAmount)) {
        throw new ValidationError(
          `Total splits (${originalSum}) must equal the original expense amount (${originalAmount})`
        );
      }

      let baseInrSum = 0;
      const splitCount = splits.length;

      for (let i = 0; i < splitCount; i++) {
        const split = splits[i];
        if (!split) {
          throw new ValidationError('Split configuration is invalid');
        }
        const originalShare = split.share;
        if (originalShare === undefined) {
          throw new ValidationError('Share value is required for EXACT splits');
        }
        
        if (i === splitCount - 1) {
          const remainingBaseInr = roundCurrency(baseInrAmount - baseInrSum);
          calculatedShares.push({
            userId: split.userId,
            originalAmount: roundCurrency(originalShare),
            baseInrAmount: remainingBaseInr,
          });
        } else {
          const baseInrRounded = roundCurrency(originalShare * exchangeRate);
          baseInrSum += baseInrRounded;
          calculatedShares.push({
            userId: split.userId,
            originalAmount: roundCurrency(originalShare),
            baseInrAmount: baseInrRounded,
          });
        }
      }
    } else if (splitType === 'PERCENTAGE') {
      let percentageSum = 0;
      for (const split of splits) {
        if (!split || split.share === undefined) {
          throw new ValidationError('Share percentage is required for PERCENTAGE splits');
        }
        percentageSum += split.share;
      }

      if (Math.abs(percentageSum - 100) > 0.01) {
        throw new ValidationError('Sum of percentages must equal 100%');
      }

      let originalSum = 0;
      let baseInrSum = 0;
      const splitCount = splits.length;

      for (let i = 0; i < splitCount; i++) {
        const split = splits[i];
        if (!split) {
          throw new ValidationError('Split configuration is invalid');
        }
        const percent = split.share;
        if (percent === undefined) {
          throw new ValidationError('Share percentage is required for PERCENTAGE splits');
        }

        if (i === splitCount - 1) {
          const remainingOriginal = roundCurrency(originalAmount - originalSum);
          const remainingBaseInr = roundCurrency(baseInrAmount - baseInrSum);
          calculatedShares.push({
            userId: split.userId,
            originalAmount: remainingOriginal,
            baseInrAmount: remainingBaseInr,
          });
        } else {
          const originalRounded = roundCurrency((originalAmount * percent) / 100);
          const baseInrRounded = roundCurrency((baseInrAmount * percent) / 100);
          originalSum += originalRounded;
          baseInrSum += baseInrRounded;

          calculatedShares.push({
            userId: split.userId,
            originalAmount: originalRounded,
            baseInrAmount: baseInrRounded,
          });
        }
      }
    }

    // 5. Wrap creation in a transaction
    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          groupId,
          paidById,
          originalAmount,
          currency,
          exchangeRate,
          baseInrAmount,
          description,
          splitType,
          expenseDate: parsedDate,
        },
        include: {
          paidBy: {
            select: { id: true, email: true, name: true },
          },
        },
      });

      const sharesData = calculatedShares.map((share) => ({
        expenseId: expense.id,
        userId: share.userId,
        originalAmount: share.originalAmount,
        baseInrAmount: share.baseInrAmount,
      }));

      await tx.expenseShare.createMany({
        data: sharesData,
      });

      const fullShares = await tx.expenseShare.findMany({
        where: { expenseId: expense.id },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      });

      return {
        ...expense,
        shares: fullShares,
      };
    });
  }

  /**
   * Retrieves all expenses for a given group.
   * Ensures the requesting user is an active member of the group.
   */
  static async getGroupExpenses(groupId: string, userId: string) {
    const isMember = await MembershipRepository.isActiveMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this group');
    }

    return prisma.expense.findMany({
      where: { groupId },
      orderBy: { expenseDate: 'desc' },
      include: {
        paidBy: {
          select: { id: true, email: true, name: true },
        },
        shares: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });
  }

  /**
   * Retrieves a single expense by ID, checking that the user belongs to its group.
   */
  static async getExpenseById(expenseId: string, userId: string) {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        paidBy: {
          select: { id: true, email: true, name: true },
        },
        shares: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    const isMember = await MembershipRepository.isActiveMember(expense.groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of the group this expense belongs to');
    }

    return expense;
  }

  /**
   * Deletes an expense. Only the payer or the group creator can delete it.
   */
  static async deleteExpense(expenseId: string, userId: string) {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        group: {
          select: { createdById: true },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    const isAuthorized = expense.paidById === userId || expense.group.createdById === userId;
    if (!isAuthorized) {
      throw new ForbiddenError('Only the payer or group creator can delete this expense');
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });
  }
}
