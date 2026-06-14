import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../api/client';
import { Group, GroupBalancesResponse } from '../../types';
import { toast } from 'react-hot-toast';
import {
  LuArrowLeft,
  LuUserPlus,
  LuUserMinus,
  LuDollarSign,
  LuFileSpreadsheet,
  LuCreditCard,
  LuTrash,
  LuLink,
  LuUsers,
  LuInfo,
  LuTrendingUp,
} from 'react-icons/lu';
import { useAuth } from '../../contexts/AuthContext';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { BalanceBreakdownModal } from '../../components/specific/BalanceBreakdownModal';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface ExpenseItem {
  id: string;
  description: string;
  originalAmount: number;
  baseInrAmount: number;
  currency: string;
  expenseDate: string;
  paidById: string;
  paidBy: {
    name: string;
  };
}

interface SettlementItem {
  id: string;
  baseInrAmount: number;
  settledAt: string;
}

interface ImportItem {
  id: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
}

export const GroupDetails = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [group, setGroup] = useState<(Group & { pendingReviewsCount?: number }) | null>(null);
  const [balancesData, setBalancesData] = useState<GroupBalancesResponse | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [imports, setImports] = useState<ImportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [linkingMemberId, setLinkingMemberId] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Breakdown modal state
  const [selectedBreakdownUserId, setSelectedBreakdownUserId] = useState<string | null>(null);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const [groupRes, balanceRes, expensesRes, settlementsRes, importsRes] = await Promise.all([
        apiClient.get(`/groups/${groupId}`),
        apiClient.get(`/groups/${groupId}/balances`),
        apiClient.get(`/expenses/group/${groupId}`),
        apiClient.get(`/settlements/group/${groupId}`),
        apiClient.get(`/groups/${groupId}/imports`),
      ]);

      if (groupRes.data.success) {
        setGroup(groupRes.data.data);
      }
      if (balanceRes.data.success) {
        setBalancesData(balanceRes.data.data);
      }
      if (expensesRes.data.success) {
        setExpenses(expensesRes.data.data);
      }
      if (settlementsRes.data.success) {
        setSettlements(settlementsRes.data.data);
      }
      if (importsRes.data.success) {
        setImports(importsRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch group details');
      toast.error(err.response?.data?.message || 'Failed to fetch group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) {
      toast.error('Email is required');
      return;
    }
    try {
      setIsAddingMember(true);
      const res = await apiClient.post(`/groups/${groupId}/members`, {
        email: memberEmail,
      });
      if (res.data.success) {
        toast.success('Member added successfully!');
        setMemberEmail('');
        setShowMemberModal(false);
        fetchGroupDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await apiClient.delete(`/groups/${groupId}/members/${userId}`);
      if (res.data.success) {
        toast.success('Member removed successfully!');
        fetchGroupDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleLinkMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail || !linkingMemberId) return;
    try {
      setIsLinking(true);
      const res = await apiClient.post(`/groups/${groupId}/members/${linkingMemberId}/link`, { email: linkEmail });
      if (res.data.success) {
        toast.success('Imported member linked successfully!');
        setLinkingMemberId(null);
        setLinkEmail('');
        fetchGroupDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to link member');
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This action is irreversible.')) return;
    try {
      await apiClient.delete(`/groups/${groupId}`);
      toast.success('Group deleted successfully');
      navigate('/groups');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    }
  };

  // ── CHARTS DATA DERIVATIONS ──────────────────────────────────────
  
  // 1. Spending Share by Member (Doughnut Chart)
  const spendingByMemberMap = new Map<string, number>();
  expenses.forEach((exp) => {
    const name = exp.paidBy?.name || 'Unknown';
    const amount = Number(exp.baseInrAmount);
    spendingByMemberMap.set(name, (spendingByMemberMap.get(name) || 0) + amount);
  });

  const spendingChartData = Array.from(spendingByMemberMap.entries()).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  // Vibrant chart colors mapped to slate/blue/green scales
  const COLORS = ['#0058be', '#009668', '#ba1a1a', '#8B5CF6', '#EC4899', '#06B6D4', '#2170e4'];

  // 2. Monthly Trends (Bar Chart)
  const monthlyTrendsMap = new Map<string, number>();
  expenses.forEach((exp) => {
    const date = new Date(exp.expenseDate);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const amount = Number(exp.baseInrAmount);
    monthlyTrendsMap.set(monthYear, (monthlyTrendsMap.get(monthYear) || 0) + amount);
  });

  const trendChartData = Array.from(monthlyTrendsMap.entries())
    .map(([date, amount]) => ({
      date,
      amount: Number(amount.toFixed(2)),
    }))
    .reverse(); // Ensure chronological order

  // Quick stats summaries
  const totalExpenseSum = expenses.reduce((acc, exp) => acc + Number(exp.baseInrAmount), 0);
  const totalSettlementSum = settlements.reduce((acc, s) => acc + Number(s.baseInrAmount), 0);
  const totalImportedRecords = imports.reduce((acc, imp) => acc + imp.totalRows, 0);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8 animate-fadeIn">
          <SkeletonLoader variant="rect" className="h-24 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SkeletonLoader variant="rect" className="h-20 w-full" count={5} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <SkeletonLoader variant="rect" className="h-64" count={2} />
            <SkeletonLoader variant="rect" className="h-64" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !group) {
    return (
      <MainLayout>
        <ErrorState message={error || 'Group not found'} onRetry={fetchGroupDetails} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-fadeIn text-on-background">
        {/* Back navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link to="/groups" className="inline-flex items-center gap-2 text-outline hover:text-primary font-semibold transition-colors">
            <LuArrowLeft />
            <span>Back to Groups</span>
          </Link>
          {group.createdById === currentUser?.id && (
            <button
              onClick={handleDeleteGroup}
              className="inline-flex items-center gap-2 bg-error hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <LuTrash />
              <span>Delete Group</span>
            </button>
          )}
        </div>

        {/* Group Header */}
        <header className="glass-card p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">{group.name}</h1>
            <p className="text-sm text-on-surface-variant leading-relaxed mt-1">
              {group.description || 'No description provided'}
            </p>
          </div>
          {group.createdById === currentUser?.id && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this group? This action is permanent.')) {
                  handleDeleteGroup();
                }
              }}
              className="self-start md:self-auto inline-flex items-center justify-center gap-2 border border-outline hover:bg-error-container hover:text-on-error-container text-on-surface-variant font-medium px-4 py-2.5 rounded-lg btn-transition text-xs cursor-pointer"
            >
              <LuTrash size={14} />
              <span>Delete Group</span>
            </button>
          )}
        </header>

        {/* Group Summary Bento Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Expenses</p>
            <p className="text-lg font-bold font-mono mt-1 text-primary">₹{totalExpenseSum.toFixed(0)}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Settlements</p>
            <p className="text-lg font-bold font-mono mt-1 text-primary">₹{totalSettlementSum.toFixed(0)}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Active Members</p>
            <p className="text-lg font-bold mt-1 text-primary">
              {group.memberships?.filter((m) => !m.leftAt).length || 0}
            </p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Imported Rows</p>
            <p className="text-lg font-bold mt-1 text-primary">{totalImportedRecords}</p>
          </div>
          <div className="glass-card p-4 text-center col-span-2 md:col-span-1">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pending Reviews</p>
            <p className={`text-lg font-bold mt-1 ${group.pendingReviewsCount ? 'text-error animate-pulse' : 'text-on-surface-variant'}`}>
              {group.pendingReviewsCount || 0}
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to={`/groups/${groupId}/expenses`}
            className="flex items-center justify-center gap-3 p-4 glass-card font-semibold text-sm hover:bg-primary-container"
          >
            <LuDollarSign className="text-primary text-base" />
            <span>Expenses</span>
          </Link>

          <Link
            to={`/groups/${groupId}/settlements`}
            className="flex items-center justify-center gap-3 p-4 glass-card font-semibold text-sm hover:bg-primary-container"
          >
            <LuCreditCard className="text-primary text-base" />
            <span>Settlements</span>
          </Link>

          <Link
            to={`/groups/${groupId}/import`}
            className="flex items-center justify-center gap-3 p-4 glass-card font-semibold text-sm hover:bg-primary-container"
          >
            <LuFileSpreadsheet className="text-primary text-base" />
            <span>Import CSV</span>
          </Link>
        </div>

        {/* Charts & Visualizations */}
        {expenses.length > 0 && (
          <div className="fintech-bento-grid">
            {/* Spending Share Chart - Bento span 6 */}
            <div className="glass-card md:col-span-6 p-6 flex flex-col h-80">
              <h3 className="text-xs font-semibold text-primary mb-4 uppercase tracking-wider">Spending Share by Payer</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {spendingChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend Chart - Bento span 6 */}
            <div className="glass-card md:col-span-6 p-6 flex flex-col h-80">
              <h3 className="text-xs font-semibold text-primary mb-4 uppercase tracking-wider">Monthly Spending Trends</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData}>
                    <XAxis dataKey="date" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Bar dataKey="amount" fill="#171717" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Members & Balances split view */}
        <div className="fintech-bento-grid">
          {/* Members list - Bento span 4 */}
          <div className="glass-card md:col-span-4 p-6 space-y-6 h-fit">
            <div className="flex justify-between items-center pb-2 border-b border-outline">
              <h2 className="text-base font-bold text-primary tracking-tight">Members</h2>
              <button
                onClick={() => setShowMemberModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer btn-transition"
              >
                <LuUserPlus />
                <span>Add Member</span>
              </button>
            </div>
            <div className="divide-y divide-outline">
              {group.memberships?.map((membership) => (
                <div key={membership.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                  <div className="overflow-hidden pr-2">
                    <p className="text-sm font-semibold text-primary truncate flex items-center gap-1.5">
                      {membership.user?.name}
                      {membership.user?.isRegistered === false && (
                        <span className="text-[9px] bg-neutral-100 text-neutral-600 font-semibold px-2 py-0.5 rounded border border-neutral-200 uppercase tracking-wider">
                          Ghost
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">{membership.user?.email || '(No Email)'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {membership.user?.isRegistered === false && (
                      <button
                        onClick={() => setLinkingMemberId(membership.userId)}
                        className="text-on-surface-variant hover:text-primary p-1.5 bg-primary-container hover:bg-neutral-200 rounded transition-all btn-transition"
                        title="Link registered user"
                      >
                        <LuLink size={14} />
                      </button>
                    )}
                    {group.createdById !== membership.userId && (
                      <button
                        onClick={() => handleRemoveMember(membership.userId)}
                        className="text-on-surface-variant hover:text-error p-1.5 bg-primary-container hover:bg-error-container hover:text-on-error-container rounded transition-all btn-transition"
                        title="Remove member"
                      >
                        <LuUserMinus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balances list - Bento span 8 */}
          <div className="glass-card md:col-span-8 p-6 space-y-6">
            <div className="pb-2 border-b border-outline">
              <h2 className="text-base font-bold text-primary tracking-tight">Group Balances</h2>
              <p className="text-on-surface-variant text-xs mt-1">
                Positive means they are owed; negative means they owe. <strong>Click any row for detailed audit derivations.</strong>
              </p>
            </div>

            <div className="space-y-2">
              {balancesData?.balances?.map((b) => (
                <div
                  key={b.userId}
                  onClick={() => setSelectedBreakdownUserId(b.userId)}
                  className="flex justify-between items-center bg-white hover:bg-neutral-50 p-4 rounded-lg border border-outline hover:border-primary cursor-pointer btn-transition shadow-sm"
                  title="Click to view breakdown"
                >
                  <div>
                    <span className="text-sm font-semibold text-primary">{b.name}</span>
                    <p className="text-xs text-on-surface-variant mt-0.5">{b.email || 'No email'}</p>
                  </div>
                  <span className={`text-sm font-bold font-mono flex items-center gap-1.5 ${b.balance >= 0 ? 'text-primary' : 'text-error'}`}>
                    {b.balance >= 0 ? '+' : '-'}₹{Math.abs(b.balance).toFixed(2)}
                    <LuTrendingUp size={14} className={b.balance >= 0 ? 'text-primary' : 'text-error transform rotate-180'} />
                  </span>
                </div>
              ))}
            </div>

            {/* Suggested Settlements */}
            {balancesData?.suggestedSettlements && balancesData.suggestedSettlements.length > 0 && (
              <div className="pt-6 border-t border-outline space-y-4">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Suggested Settlements</h3>
                <div className="space-y-2">
                  {balancesData.suggestedSettlements.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-primary-container p-3 rounded-lg border border-outline text-xs text-primary font-medium"
                    >
                      <span>
                        <strong className="text-primary font-semibold">{s.fromName}</strong> owes <strong className="text-primary font-semibold">{s.toName}</strong>
                      </span>
                      <strong className="font-mono text-primary mt-1 sm:mt-0">₹{s.amount.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Link Member Modal */}
        {linkingMemberId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-primary/20 backdrop-blur-xs" onClick={() => setLinkingMemberId(null)} />
            <div className="relative w-full max-w-md bg-surface border border-outline rounded-xl p-6 shadow-level-3 z-10">
              <h3 className="text-lg font-bold text-primary mb-2">Link Ghost Member</h3>
              <p className="text-xs text-on-surface-variant mb-4">
                Enter the email of a registered user to merge this ghost member's transaction history into their account.
              </p>
              <form onSubmit={handleLinkMember} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Registered User Email</label>
                  <input
                    type="email"
                    required
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full h-11 bg-white border border-outline rounded-lg px-4 text-primary font-normal placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkingMemberId(null);
                      setLinkEmail('');
                    }}
                    className="bg-primary-container hover:bg-neutral-200 text-primary font-medium px-4 py-2 rounded-lg text-sm btn-transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLinking}
                    className="bg-primary hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-lg text-sm btn-transition disabled:opacity-50 cursor-pointer"
                  >
                    {isLinking ? 'Linking...' : 'Link Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-primary/20 backdrop-blur-xs" onClick={() => setShowMemberModal(false)} />
            <div className="relative w-full max-w-md bg-surface border border-outline rounded-xl p-6 shadow-level-3 z-10">
              <h3 className="text-lg font-bold text-primary mb-4">Add Member by Email</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full h-11 bg-white border border-outline rounded-lg px-4 text-primary font-normal placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMemberModal(false);
                      setMemberEmail('');
                    }}
                    className="bg-primary-container hover:bg-neutral-200 text-primary font-medium px-4 py-2 rounded-lg text-sm btn-transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingMember}
                    className="bg-primary hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-lg text-sm btn-transition disabled:opacity-50 cursor-pointer"
                  >
                    {isAddingMember ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Balance Breakdown Modal */}
        {selectedBreakdownUserId && (
          <BalanceBreakdownModal
            groupId={groupId!}
            userId={selectedBreakdownUserId}
            onClose={() => setSelectedBreakdownUserId(null)}
          />
        )}
      </div>
    </MainLayout>
  );
};

