import { Currency } from '@prisma/client';
import { prisma } from '../utils/prisma';

export interface Balance {
  from: string; // userId who owes
  to: string;   // userId who is owed
  amount: number;
  currency: Currency;
}

export class BalanceService {
  /**
   * Computes all pairwise balances in a group in a unified currency (INR).
   * Based on the formula: net(A→B) = debt(A→B) - debt(B→A) - settled(A→B) + settled(B→A)
   */
  static async computeGroupBalances(groupId: string): Promise<Balance[]> {
    // 1. Query A: Aggregate all expense debts in unified INR
    // Debt from expense shares where userId != paidById
    const debtsRaw = await prisma.$queryRaw<
      { debtor_id: string; creditor_id: string; total_debt: number }[]
    >`
      SELECT
          es."userId"    AS debtor_id,
          e."paidById"   AS creditor_id,
          SUM(es."baseInrAmount") AS total_debt
      FROM expense_shares es
      JOIN expenses e ON e.id = es."expenseId"
      WHERE e."groupId" = ${groupId}::uuid
        AND es."userId" != e."paidById"
      GROUP BY es."userId", e."paidById";
    `;

    // 2. Query B: Aggregate all settlements in unified INR
    const settlementsRaw = await prisma.$queryRaw<
      { payer_id: string; payee_id: string; total_settled: number }[]
    >`
      SELECT
          s."paidById"  AS payer_id,
          s."paidToId"  AS payee_id,
          SUM(s."baseInrAmount") AS total_settled
      FROM settlements s
      WHERE s."groupId" = ${groupId}::uuid
      GROUP BY s."paidById", s."paidToId";
    `;

    // Helpers to build compound keys
    const makeKey = (u1: string, u2: string) => `${u1}_${u2}`;

    const debts = new Map<string, number>();
    for (const d of debtsRaw) {
      debts.set(makeKey(d.debtor_id, d.creditor_id), Number(d.total_debt));
    }

    const settlements = new Map<string, number>();
    for (const s of settlementsRaw) {
      settlements.set(makeKey(s.payer_id, s.payee_id), Number(s.total_settled));
    }

    // Collect all unique user pairs
    const pairs = new Set<string>(); // Format: userA|userB (where userA < userB)

    const addPair = (u1: string, u2: string) => {
      const a = u1 < u2 ? u1 : u2;
      const b = u1 < u2 ? u2 : u1;
      pairs.add(`${a}|${b}`);
    };

    debtsRaw.forEach((d) => addPair(d.debtor_id, d.creditor_id));
    settlementsRaw.forEach((s) => addPair(s.payer_id, s.payee_id));

    const finalBalances: Balance[] = [];

    // 3. Compute Net Balances
    for (const pairStr of pairs) {
      const [userA, userB] = pairStr.split('|') as [string, string];

      const debt_A_to_B = debts.get(makeKey(userA, userB)) || 0;
      const debt_B_to_A = debts.get(makeKey(userB, userA)) || 0;

      const settled_A_to_B = settlements.get(makeKey(userA, userB)) || 0;
      const settled_B_to_A = settlements.get(makeKey(userB, userA)) || 0;

      // net(A->B)
      const net = (debt_A_to_B - debt_B_to_A) - (settled_A_to_B - settled_B_to_A);

      // Round to 2 decimal places to avoid floating point issues near zero
      const roundedNet = Number(net.toFixed(2));

      if (roundedNet > 0) {
        finalBalances.push({
          from: userA,
          to: userB,
          amount: roundedNet,
          currency: Currency.INR,
        });
      } else if (roundedNet < 0) {
        finalBalances.push({
          from: userB,
          to: userA,
          amount: Math.abs(roundedNet),
          currency: Currency.INR,
        });
      }
    }

    return finalBalances;
  }
}
