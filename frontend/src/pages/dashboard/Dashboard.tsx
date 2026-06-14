import React, { useEffect, useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { Group, GroupBalancesResponse } from '../../types';
import {
  LuUsers,
  LuTrendingUp,
  LuTrendingDown,
  LuPlus,
  LuArrowRight,
  LuDollarSign,
  LuCreditCard,
  LuFileSpreadsheet,
  LuActivity,
} from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { ErrorState } from '../../components/common/ErrorState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface RecentExpense {
  id: string;
  groupId: string;
  groupName: string;
  description: string;
  originalAmount: number;
  currency: string;
  baseInrAmount: number;
  paidById: string;
  paidByName: string;
  expenseDate: string;
}

interface RecentSettlement {
  id: string;
  groupId: string;
  groupName: string;
  paidById: string;
  paidByName: string;
  paidToId: string;
  paidToName: string;
  originalAmount: number;
  currency: string;
  baseInrAmount: number;
  settledAt: string;
}

interface StatsData {
  totalGroups: number;
  totalExpenses: number;
  totalSettlements: number;
  totalOutstandingDebt: number;
  totalImportedRecords: number;
  totalExpenseAmount: number;
  totalSettlementAmount: number;
  topCreditor: { name: string; amount: number };
  topDebtor: { name: string; amount: number };
  activeMembersCount: number;
  monthlySpendingTrend: { date: string; amount: number }[];
  recentExpenses: RecentExpense[];
  recentSettlements: RecentSettlement[];
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [youAreOwed, setYouAreOwed] = useState(0);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch Stats & Recent Activity
      const statsRes = await apiClient.get('/groups/dashboard/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      // 2. Fetch user's groups
      const groupsRes = await apiClient.get('/groups');
      if (groupsRes.data.success) {
        const userGroups: Group[] = groupsRes.data.data;
        setGroups(userGroups);

        // 3. Fetch balances for all groups to compile overall standing
        let netBalance = 0;
        let positiveBalance = 0;
        let negativeBalance = 0;

        await Promise.all(
          userGroups.map(async (group) => {
            try {
              const balanceRes = await apiClient.get(`/groups/${group.id}/balances`);
              if (balanceRes.data.success) {
                const data: GroupBalancesResponse = balanceRes.data.data;
                const myBalance = data.balances.find((b) => b.userId === user?.id);
                if (myBalance) {
                  netBalance += myBalance.balance;
                  if (myBalance.balance > 0) {
                    positiveBalance += myBalance.balance;
                  } else if (myBalance.balance < 0) {
                    negativeBalance += Math.abs(myBalance.balance);
                  }
                }
              }
            } catch (err) {
              console.error(`Failed to fetch balances for group ${group.id}:`, err);
            }
          })
        );

        setTotalBalance(netBalance);
        setYouAreOwed(positiveBalance);
        setYouOwe(negativeBalance);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8 animate-fadeIn">
          <header className="flex justify-between items-center">
            <SkeletonLoader variant="rect" className="h-14 w-1/3" />
            <SkeletonLoader variant="rect" className="h-10 w-32" />
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonLoader variant="rect" className="h-28 w-full" count={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <SkeletonLoader variant="rect" className="h-20 w-full" count={5} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonLoader variant="rect" className="h-64 lg:col-span-2" />
            <SkeletonLoader variant="rect" className="h-64" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <ErrorState message={error} onRetry={fetchDashboardData} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-fadeIn text-on-background">
        {/* Welcome Header */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Financial Dashboard</h1>
            <p className="text-sm text-on-surface-variant mt-1">Hello, {user?.name}. Here's your real-time financial standing.</p>
          </div>
          <Link
            to="/groups"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-neutral-800 text-white font-medium px-4 py-2.5 rounded-lg btn-transition text-sm shadow-sm cursor-pointer"
          >
            <LuPlus className="text-base" />
            <span>Manage Groups</span>
          </Link>
        </header>

        {/* Primary Standing Cards - Fintech Bento Row */}
        <div className="fintech-bento-grid">
          {/* Total Net Balance - Bento span 4 */}
          <div className="glass-card md:col-span-4 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Net Balance</p>
                <h3 className={`text-3xl font-bold font-mono tracking-tight mt-3 ${totalBalance >= 0 ? 'text-primary' : 'text-error'}`}>
                  {totalBalance >= 0 ? '+' : '-'}₹{Math.abs(totalBalance).toFixed(2)}
                </h3>
              </div>
              <span className="p-2 bg-primary-container rounded-lg text-primary">
                <LuUsers className="text-lg" />
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-outline flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">Real-time status</span>
              {totalBalance >= 0 ? (
                <span className="text-xs px-2.5 py-1 rounded-md success-badge">Positive Ledger</span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-md error-badge">Net Debtor</span>
              )}
            </div>
          </div>

          {/* You Owe - Bento span 4 */}
          <div className="glass-card md:col-span-4 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">You Owe (Total)</p>
                <h3 className="text-3xl font-bold font-mono text-error mt-3">
                  ₹{youOwe.toFixed(2)}
                </h3>
              </div>
              <span className="p-2 bg-error-container text-error rounded-lg">
                <LuTrendingDown className="text-lg" />
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-outline">
              <p className="text-xs text-on-surface-variant">Outstanding across all joined groups</p>
            </div>
          </div>

          {/* You are owed - Bento span 4 */}
          <div className="glass-card md:col-span-4 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">You Are Owed</p>
                <h3 className="text-3xl font-bold font-mono text-primary mt-3">
                  ₹{youAreOwed.toFixed(2)}
                </h3>
              </div>
              <span className="p-2 bg-primary-container text-primary rounded-lg">
                <LuTrendingUp className="text-lg" />
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-outline">
              <p className="text-xs text-on-surface-variant">Collectable debt streams</p>
            </div>
          </div>
        </div>

        {/* Analytics Bento Grid Card Indicators */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-card p-4 text-center">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Groups</p>
              <p className="text-2xl font-bold mt-1.5 text-primary">{stats.totalGroups}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Expenses</p>
              <p className="text-2xl font-bold mt-1.5 text-primary">{stats.totalExpenses}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Settlements</p>
              <p className="text-2xl font-bold mt-1.5 text-primary">{stats.totalSettlements}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Outstanding Debt</p>
              <p className="text-2xl font-bold font-mono text-error mt-1.5">₹{stats.totalOutstandingDebt.toFixed(2)}</p>
            </div>
            <div className="glass-card p-4 text-center col-span-2 md:col-span-1">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Imported Rows</p>
              <p className="text-2xl font-bold mt-1.5 text-primary">{stats.totalImportedRecords}</p>
            </div>
          </div>
        )}

        {/* Group Financial Overview */}
        {stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-primary">Group Financial Overview</h2>
            
            <div className="fintech-bento-grid">
              {/* Total Group Expenses - Bento span 4 */}
              <div className="glass-card md:col-span-4 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Group Expenses</p>
                    <h3 className="text-3xl font-bold font-mono text-primary mt-3">
                      ₹{stats.totalExpenseAmount.toFixed(2)}
                    </h3>
                  </div>
                  <span className="p-2 bg-primary-container text-primary rounded-lg">
                    <LuDollarSign className="text-lg" />
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-outline">
                  <p className="text-xs text-on-surface-variant">Combined expenses across all groups</p>
                </div>
              </div>

              {/* Total Settlements - Bento span 4 */}
              <div className="glass-card md:col-span-4 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Settlements</p>
                    <h3 className="text-3xl font-bold font-mono text-primary mt-3">
                      ₹{stats.totalSettlementAmount.toFixed(2)}
                    </h3>
                  </div>
                  <span className="p-2 bg-primary-container text-primary rounded-lg">
                    <LuCreditCard className="text-lg" />
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-outline">
                  <p className="text-xs text-on-surface-variant">Combined settlements across all groups</p>
                </div>
              </div>

              {/* Active Members - Bento span 4 */}
              <div className="glass-card md:col-span-4 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Active Members</p>
                    <h3 className="text-3xl font-bold font-mono text-primary mt-3">
                      {stats.activeMembersCount}
                    </h3>
                  </div>
                  <span className="p-2 bg-primary-container text-primary rounded-lg">
                    <LuUsers className="text-lg" />
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-outline">
                  <p className="text-xs text-on-surface-variant">Unique active group participants</p>
                </div>
              </div>

              {/* Top Creditor - Bento span 6 */}
              <div className="glass-card md:col-span-6 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Top Group Creditor</p>
                    <h3 className="text-2xl font-bold mt-3 text-primary truncate max-w-xs md:max-w-md">
                      {stats.topCreditor.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-on-surface-variant">Net Creditable</span>
                    <p className="text-xl font-bold font-mono text-primary mt-1">
                      +₹{stats.topCreditor.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-outline">
                  <p className="text-xs text-on-surface-variant">Member owed the most across all groups</p>
                </div>
              </div>

              {/* Top Debtor - Bento span 6 */}
              <div className="glass-card md:col-span-6 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Top Group Debtor</p>
                    <h3 className="text-2xl font-bold mt-3 text-primary truncate max-w-xs md:max-w-md">
                      {stats.topDebtor.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-on-surface-variant">Net Outstanding</span>
                    <p className="text-xl font-bold font-mono text-error mt-1.5">
                      -₹{stats.topDebtor.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-outline">
                  <p className="text-xs text-on-surface-variant">Member owing the most across all groups</p>
                </div>
              </div>

              {/* Monthly Spending Trend Chart - Bento span 12 */}
              <div className="glass-card md:col-span-12 p-6 flex flex-col h-80">
                <h3 className="text-xs font-semibold text-primary mb-4 uppercase tracking-wider">Monthly Spending Trends</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.monthlySpendingTrend}>
                      <XAxis dataKey="date" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                      <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Bar dataKey="amount" fill="#171717" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main interactive splits */}
        <div className="fintech-bento-grid">
          {/* Recent Activity Section - Bento span 8 */}
          <div className="glass-card md:col-span-8 p-6 space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b border-outline">
              <span className="p-1.5 bg-primary-container text-primary rounded-md"><LuActivity size={16} /></span>
              <h2 className="text-lg font-bold text-primary tracking-tight">Recent Activity</h2>
            </div>

            <div className="space-y-6 divide-y divide-outline">
              {/* Recent Expenses */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Latest Expenses</h3>
                {stats?.recentExpenses.length === 0 ? (
                  <p className="text-sm text-on-surface-variant py-2">No expenses added yet.</p>
                ) : (
                  stats?.recentExpenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center py-3.5 first:pt-0">
                      <div>
                        <p className="text-sm font-semibold text-primary">{exp.description}</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Paid by {exp.paidByName} • Group: <strong className="text-primary font-medium">{exp.groupName}</strong> • {new Date(exp.expenseDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-primary text-sm bg-primary-container px-2 py-1 rounded">
                        {exp.currency} {exp.originalAmount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Recent Settlements */}
              <div className="space-y-3 pt-5">
                <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Latest Settlements</h3>
                {stats?.recentSettlements.length === 0 ? (
                  <p className="text-sm text-on-surface-variant py-2">No settlements recorded yet.</p>
                ) : (
                  stats?.recentSettlements.map((set) => (
                    <div key={set.id} className="flex justify-between items-center py-3.5 first:pt-0">
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          {set.paidByName} paid {set.paidToName}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Settled in <strong className="text-primary font-medium">{set.groupName}</strong> • {new Date(set.settledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-primary text-sm bg-neutral-100 px-2 py-1 rounded">
                        +₹{set.baseInrAmount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Groups list - Bento span 4 */}
          <div className="glass-card md:col-span-4 p-6 space-y-6 flex flex-col justify-between h-fit">
            <div>
              <h2 className="text-lg font-bold text-primary tracking-tight mb-4 pb-2 border-b border-outline">Your Groups</h2>
              {groups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-on-surface-variant mb-4">You are not in any group yet.</p>
                  <Link to="/groups" className="text-primary hover:underline font-semibold text-sm">Create or join one now</Link>
                </div>
              ) : (
                <div className="divide-y divide-outline">
                  {groups.slice(0, 5).map((group) => (
                    <div key={group.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                      <div className="overflow-hidden pr-2">
                        <h3 className="text-sm font-semibold text-primary truncate">{group.name}</h3>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">{group.description || 'No description'}</p>
                      </div>
                      <Link
                        to={`/groups/${group.id}`}
                        className="p-1.5 bg-primary-container hover:bg-primary hover:text-white rounded text-primary transition-all cursor-pointer btn-transition"
                      >
                        <LuArrowRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {groups.length > 5 && (
              <div className="mt-4 pt-4 border-t border-outline text-center">
                <Link to="/groups" className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1">
                  <span>View All Groups</span>
                  <LuArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

