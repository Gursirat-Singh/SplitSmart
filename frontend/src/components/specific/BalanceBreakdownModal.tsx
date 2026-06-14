import React, { useEffect, useState } from 'react';
import { LuX, LuTrendingUp, LuTrendingDown, LuDollarSign, LuCreditCard } from 'react-icons/lu';
import apiClient from '../../api/client';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { ErrorState } from '../common/ErrorState';

interface BalanceBreakdownModalProps {
  groupId: string;
  userId: string;
  onClose: () => void;
}

interface ExpenseOwedItem {
  expenseId: string;
  description: string;
  paidById: string;
  paidByName: string;
  originalAmount: number;
  currency: string;
  userShare: number;
  date: string;
}

interface ShareDetail {
  userId: string;
  userName: string;
  amount: number;
}

interface ExpenseLentItem {
  expenseId: string;
  description: string;
  originalAmount: number;
  currency: string;
  totalLent: number;
  date: string;
  shares: ShareDetail[];
}

interface SettlementPaidItem {
  settlementId: string;
  paidToId: string;
  paidToName: string;
  amount: number;
  currency: string;
  date: string;
}

interface SettlementReceivedItem {
  settlementId: string;
  paidById: string;
  paidByName: string;
  amount: number;
  currency: string;
  date: string;
}

interface BreakdownData {
  userId: string;
  userName: string;
  userEmail: string;
  netBalance: number;
  expensesOwed: ExpenseOwedItem[];
  expensesLent: ExpenseLentItem[];
  settlementsPaid: SettlementPaidItem[];
  settlementsReceived: SettlementReceivedItem[];
}

export const BalanceBreakdownModal: React.FC<BalanceBreakdownModalProps> = ({
  groupId,
  userId,
  onClose,
}) => {
  const [data, setData] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'owed' | 'lent' | 'settlements'>('all');

  const fetchBreakdown = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get(`/groups/${groupId}/balances/${userId}/breakdown`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load balance breakdown');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreakdown();
  }, [groupId, userId]);

  // Calculations for summary stats
  const totalOwed = data?.expensesOwed.reduce((acc, item) => acc + item.userShare, 0) || 0;
  const totalLent = data?.expensesLent.reduce((acc, item) => acc + item.totalLent, 0) || 0;
  const totalSettledPaid = data?.settlementsPaid.reduce((acc, item) => acc + item.amount, 0) || 0;
  const totalSettledRecv = data?.settlementsReceived.reduce((acc, item) => acc + item.amount, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-surface-card border border-border-subtle rounded-2xl shadow-level-3 z-10 flex flex-col max-h-[85vh] overflow-hidden animate-fadeIn text-primary">
        {/* Modal Header */}
        <header className="flex justify-between items-center p-6 border-b border-border-subtle bg-bg-canvas">
          <div>
            <h3 className="text-xl font-bold text-primary">Balance Breakdown</h3>
            {data && (
              <p className="text-xs text-outline mt-0.5">
                Detailed audit trail for <strong>{data.userName}</strong> ({data.userEmail || 'No email'})
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer">
            <LuX size={20} />
          </button>
        </header>

        {loading ? (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <SkeletonLoader variant="rect" className="h-24 w-full mb-6" />
            <SkeletonLoader variant="rect" className="h-10 w-full" />
            <SkeletonLoader variant="rect" className="h-48 w-full" />
          </div>
        ) : error ? (
          <div className="p-6 overflow-y-auto flex-1">
            <ErrorState message={error} onRetry={fetchBreakdown} />
          </div>
        ) : data ? (
          <>
            {/* Net Formula Dashboard */}
            <div className="p-6 bg-bg-canvas border-b border-border-subtle">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center items-center">
                <div className="bg-surface-card p-3.5 rounded-xl border border-border-subtle">
                  <p className="text-[10px] uppercase tracking-wider text-outline font-semibold">Total Lent</p>
                  <p className="text-lg font-bold font-mono text-success mt-1">₹{totalLent.toFixed(2)}</p>
                </div>
                <div className="text-outline text-lg hidden md:block">-</div>
                <div className="bg-surface-card p-3.5 rounded-xl border border-border-subtle">
                  <p className="text-[10px] uppercase tracking-wider text-outline font-semibold">Total Owed</p>
                  <p className="text-lg font-bold font-mono text-error mt-1">₹{totalOwed.toFixed(2)}</p>
                </div>
                <div className="text-outline text-lg hidden md:block">+</div>
                <div className="bg-surface-card p-3.5 rounded-xl border border-border-subtle col-span-2 md:col-span-1">
                  <p className="text-[10px] uppercase tracking-wider text-outline font-semibold">Net Balance</p>
                  <p className={`text-lg font-bold font-mono mt-1 ${data.netBalance >= 0 ? 'text-success' : 'text-error'}`}>
                    {data.netBalance >= 0 ? '+' : '-'}₹{Math.abs(data.netBalance).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Settlement summary if exists */}
              {(totalSettledPaid > 0 || totalSettledRecv > 0) && (
                <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs text-outline">
                  <span>Settlements Paid: <strong className="text-success font-mono">₹{totalSettledPaid.toFixed(2)}</strong></span>
                  <span className="hidden sm:inline">•</span>
                  <span>Settlements Received: <strong className="text-error font-mono">₹{totalSettledRecv.toFixed(2)}</strong></span>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border-subtle bg-bg-canvas px-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 btn-transition cursor-pointer ${
                  activeTab === 'all' ? 'border-secondary text-secondary' : 'border-transparent text-outline hover:text-primary'
                }`}
              >
                All Transactions
              </button>
              <button
                onClick={() => setActiveTab('lent')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 btn-transition cursor-pointer ${
                  activeTab === 'lent' ? 'border-secondary text-secondary' : 'border-transparent text-outline hover:text-primary'
                }`}
              >
                Lent ({data.expensesLent.length})
              </button>
              <button
                onClick={() => setActiveTab('owed')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 btn-transition cursor-pointer ${
                  activeTab === 'owed' ? 'border-secondary text-secondary' : 'border-transparent text-outline hover:text-primary'
                }`}
              >
                Owed ({data.expensesOwed.length})
              </button>
              <button
                onClick={() => setActiveTab('settlements')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 btn-transition cursor-pointer ${
                  activeTab === 'settlements' ? 'border-secondary text-secondary' : 'border-transparent text-outline hover:text-primary'
                }`}
              >
                Settlements ({data.settlementsPaid.length + data.settlementsReceived.length})
              </button>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-card">
              {/* LENT SECTION */}
              {(activeTab === 'all' || activeTab === 'lent') && data.expensesLent.length > 0 && (
                <div className="space-y-3">
                  {(activeTab === 'all') && <h4 className="text-xs font-bold text-outline uppercase tracking-wider">Expenses paid by {data.userName}</h4>}
                  {data.expensesLent.map((item) => (
                    <div key={item.expenseId} className="flex justify-between items-start bg-bg-canvas p-4 rounded-xl border border-border-subtle shadow-level-1 card-hover">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm flex items-center gap-1.5">
                          <span className="p-1 bg-success-light text-success rounded-lg"><LuDollarSign size={14} /></span>
                          {item.description}
                        </p>
                        <p className="text-xs text-outline">
                          Paid {item.currency} {item.originalAmount.toFixed(2)} on {new Date(item.date).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {item.shares.map((sh, sIdx) => (
                            <span key={sIdx} className="text-[10px] bg-surface-card border border-border-subtle rounded-md px-1.5 py-0.5 text-outline">
                              {sh.userName}: ₹{sh.amount.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-success text-sm flex items-center gap-0.5 justify-end">
                          <LuTrendingUp size={14} /> +₹{item.totalLent.toFixed(2)}
                        </span>
                        <p className="text-[10px] text-outline">Lent to others</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* OWED SECTION */}
              {(activeTab === 'all' || activeTab === 'owed') && data.expensesOwed.length > 0 && (
                <div className="space-y-3">
                  {(activeTab === 'all') && <h4 className="text-xs font-bold text-outline uppercase tracking-wider">Expense shares {data.userName} owes to others</h4>}
                  {data.expensesOwed.map((item) => (
                    <div key={item.expenseId} className="flex justify-between items-start bg-bg-canvas p-4 rounded-xl border border-border-subtle shadow-level-1 card-hover">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm flex items-center gap-1.5">
                          <span className="p-1 bg-error-light text-error rounded-lg"><LuDollarSign size={14} /></span>
                          {item.description}
                        </p>
                        <p className="text-xs text-outline">
                          Paid by {item.paidByName} • Total: {item.currency} {item.originalAmount.toFixed(2)} on {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-error text-sm flex items-center gap-0.5 justify-end">
                          <LuTrendingDown size={14} /> -₹{item.userShare.toFixed(2)}
                        </span>
                        <p className="text-[10px] text-outline">His share</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SETTLEMENTS SECTION */}
              {(activeTab === 'all' || activeTab === 'settlements') && (data.settlementsPaid.length > 0 || data.settlementsReceived.length > 0) && (
                <div className="space-y-3">
                  {activeTab === 'all' && <h4 className="text-xs font-bold text-outline uppercase tracking-wider">Settlements</h4>}
                  
                  {/* Paid settlements */}
                  {data.settlementsPaid.map((item) => (
                    <div key={item.settlementId} className="flex justify-between items-center bg-bg-canvas p-4 rounded-xl border border-border-subtle shadow-level-1 card-hover">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-success-light text-success rounded-lg"><LuCreditCard size={14} /></span>
                        <div>
                          <p className="font-semibold text-sm">Paid settlement to {item.paidToName}</p>
                          <p className="text-xs text-outline">
                            Recorded on {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-success text-sm">+₹{item.amount.toFixed(2)}</span>
                        <p className="text-[10px] text-outline">Reduces debt</p>
                      </div>
                    </div>
                  ))}

                  {/* Received settlements */}
                  {data.settlementsReceived.map((item) => (
                    <div key={item.settlementId} className="flex justify-between items-center bg-bg-canvas p-4 rounded-xl border border-border-subtle shadow-level-1 card-hover">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-error-light text-error rounded-lg"><LuCreditCard size={14} /></span>
                        <div>
                          <p className="font-semibold text-sm">Received settlement from {item.paidByName}</p>
                          <p className="text-xs text-outline">
                            Recorded on {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-error text-sm">-₹{item.amount.toFixed(2)}</span>
                        <p className="text-[10px] text-outline">Reduces credit</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* EMPTY STATE */}
              {activeTab === 'all' &&
                data.expensesLent.length === 0 &&
                data.expensesOwed.length === 0 &&
                data.settlementsPaid.length === 0 &&
                data.settlementsReceived.length === 0 && (
                  <p className="text-center text-sm text-outline py-8">No transactions found for this user in this group.</p>
                )}
              {activeTab === 'lent' && data.expensesLent.length === 0 && (
                <p className="text-center text-sm text-outline py-8">No paid expenses found.</p>
              )}
              {activeTab === 'owed' && data.expensesOwed.length === 0 && (
                <p className="text-center text-sm text-outline py-8">No owed expenses found.</p>
              )}
              {activeTab === 'settlements' && data.settlementsPaid.length === 0 && data.settlementsReceived.length === 0 && (
                <p className="text-center text-sm text-outline py-8">No settlements found.</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
