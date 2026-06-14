import { Currency } from '@prisma/client';
export interface Balance {
    from: string;
    to: string;
    amount: number;
    currency: Currency;
}
export declare class BalanceService {
    /**
     * Computes all pairwise balances in a group.
     * Based on the formula: net(A→B) = debt(A→B) - debt(B→A) - settled(A→B) + settled(B→A)
     */
    static computeGroupBalances(groupId: string): Promise<Balance[]>;
}
