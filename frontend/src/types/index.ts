export interface User {
  id: string;
  email?: string | null;
  name: string;
  isRegistered?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdBy?: User;
  memberships?: Membership[];
  _count?: {
    memberships: number;
  };
}

export interface Membership {
  id: string;
  userId: string;
  groupId: string;
  joinedAt: string;
  leftAt?: string | null;
  user?: User;
}

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE';

export interface ExpenseSplit {
  id: string;
  userId: string;
  user?: User;
  amount: number;
  percentage?: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: 'INR' | 'USD';
  exchangeRate: number;
  baseAmount: number;
  date: string;
  payerId: string;
  payer?: User;
  groupId: string;
  splitType: SplitType;
  splits: ExpenseSplit[];
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  payerId: string;
  payer?: User;
  payeeId: string;
  payee?: User;
  amount: number;
  currency: 'INR' | 'USD';
  exchangeRate: number;
  baseAmount: number;
  date: string;
  createdAt: string;
}

export interface Balance {
  userId: string;
  name: string;
  email: string;
  balance: number; // Positive means they are owed, negative means they owe
}

export interface SettlementRecommendation {
  from: string; // userId
  fromName: string;
  to: string; // userId
  toName: string;
  amount: number;
  currency: 'INR';
}

export interface GroupBalancesResponse {
  balances: Balance[];
  suggestedSettlements: SettlementRecommendation[];
}

export interface ImportAnomaly {
  id: string;
  reportId: string;
  rowNumber: number;
  rowData: string;
  reason: string;
  resolved: boolean;
}

export interface ImportReport {
  id: string;
  groupId: string;
  fileName: string;
  uploadedById: string;
  uploadedBy?: User;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  importedRows: number;
  anomaliesCount: number;
  createdAt: string;
  anomalies?: ImportAnomaly[];
}
