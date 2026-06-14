import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../api/client';
import { Group, GroupBalancesResponse } from '../../types';
import { toast } from 'react-hot-toast';
import { LuArrowLeft, LuUserPlus, LuUserMinus, LuDollarSign, LuFileSpreadsheet, LuCreditCard, LuTrash, LuLink } from 'react-icons/lu';
import { useAuth } from '../../contexts/AuthContext';

export const GroupDetails = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [balancesData, setBalancesData] = useState<GroupBalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberEmail, setMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [linkingMemberId, setLinkingMemberId] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const [groupRes, balanceRes] = await Promise.all([
        apiClient.get(`/groups/${groupId}`),
        apiClient.get(`/groups/${groupId}/balances`)
      ]);

      if (groupRes.data.success) {
        setGroup(groupRes.data.data);
      }
      if (balanceRes.data.success) {
        setBalancesData(balanceRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch group details');
      navigate('/groups');
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
      const res = await apiClient.delete(`/groups/${groupId}`);
      toast.success('Group deleted successfully');
      navigate('/groups');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-secondary" />
        </div>
      </MainLayout>
    );
  }

  if (!group) return null;

  return (
    <MainLayout>
      <div className="space-y-8 animate-fadeIn text-primary">
        {/* Back navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link to="/groups" className="inline-flex items-center gap-2 text-outline hover:text-primary transition-colors">
            <LuArrowLeft />
            <span>Back to Groups</span>
          </Link>
          {group.createdById === currentUser?.id && (
            <button
              onClick={handleDeleteGroup}
              className="inline-flex items-center gap-2 bg-error hover:bg-error-container text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <LuTrash />
              <span>Delete Group</span>
            </button>
          )}
        </div>

        {/* Group Header */}
        <header className="bg-surface-card border border-border-subtle p-6 rounded-2xl shadow-level-1 relative overflow-hidden">
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">{group.name}</h1>
          <p className="text-outline text-sm max-w-xl">{group.description || 'No description provided'}</p>
        </header>

        {/* Action Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to={`/groups/${groupId}/expenses`}
            className="flex items-center justify-center gap-3 p-4 bg-surface-card hover:bg-surface-container border border-border-subtle rounded-xl hover:border-secondary/50 btn-transition font-semibold shadow-level-1"
          >
            <LuDollarSign className="text-secondary text-lg" />
            <span>Expenses</span>
          </Link>

          <Link
            to={`/groups/${groupId}/settlements`}
            className="flex items-center justify-center gap-3 p-4 bg-surface-card hover:bg-surface-container border border-border-subtle rounded-xl hover:border-secondary/50 btn-transition font-semibold shadow-level-1"
          >
            <LuCreditCard className="text-success text-lg" />
            <span>Settlements</span>
          </Link>

          <Link
            to={`/groups/${groupId}/import`}
            className="flex items-center justify-center gap-3 p-4 bg-surface-card hover:bg-surface-container border border-border-subtle rounded-xl hover:border-secondary/50 btn-transition font-semibold shadow-level-1"
          >
            <LuFileSpreadsheet className="text-outline text-lg" />
            <span>Import CSV</span>
          </Link>
        </div>

        {/* Members & Balances split view */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members list */}
          <div className="bg-surface-card border border-border-subtle p-6 rounded-2xl shadow-level-1 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-primary">Members</h2>
              <button
                onClick={() => setShowMemberModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-secondary-dark transition-colors cursor-pointer"
              >
                <LuUserPlus />
                <span>Add Member</span>
              </button>
            </div>
            <div className="divide-y divide-border-subtle">
              {group.memberships?.map((membership) => (
                <div key={membership.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div className="overflow-hidden pr-2">
                    <p className="font-medium text-primary truncate flex items-center gap-1.5">
                      {membership.user?.name}
                      {membership.user?.isRegistered === false && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 font-semibold px-1.5 py-0.5 rounded">
                          Ghost
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-outline truncate">{membership.user?.email || '(No Email)'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {membership.user?.isRegistered === false && (
                      <button
                        onClick={() => setLinkingMemberId(membership.userId)}
                        className="text-outline hover:text-secondary p-1 rounded transition-colors"
                        title="Link registered user"
                      >
                        <LuLink size={16} />
                      </button>
                    )}
                    {group.createdById !== membership.userId && (
                      <button
                        onClick={() => handleRemoveMember(membership.userId)}
                        className="text-outline hover:text-error p-1 rounded transition-colors"
                        title="Remove member"
                      >
                        <LuUserMinus size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balances list */}
          <div className="bg-surface-card border border-border-subtle p-6 rounded-2xl shadow-level-1 lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-primary mb-2">Group Balances</h2>
              <p className="text-outline text-xs">Positive means they are owed; negative means they owe.</p>
            </div>
            
            <div className="space-y-3">
              {balancesData?.balances?.map((b) => (
                <div key={b.userId} className="flex justify-between items-center bg-bg-canvas p-4 rounded-xl border border-border-subtle">
                  <div>
                    <span className="font-semibold text-primary">{b.name}</span>
                    <p className="text-xs text-outline">{b.email}</p>
                  </div>
                  <span className={`font-bold font-mono ${b.balance >= 0 ? 'text-success' : 'text-error'}`}>
                    {b.balance >= 0 ? '+' : '-'}₹{Math.abs(b.balance).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Suggested Settlements */}
            {balancesData?.suggestedSettlements && balancesData.suggestedSettlements.length > 0 && (
              <div className="pt-6 border-t border-border-subtle space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Suggested Settlements</h3>
                <div className="space-y-2">
                  {balancesData.suggestedSettlements.map((s, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-surface-container p-3 rounded-lg border border-border-subtle text-sm text-primary">
                      <span>
                        <strong className="text-primary">{s.fromName}</strong> owes <strong className="text-primary">{s.toName}</strong>
                      </span>
                      <strong className="font-mono text-success mt-1 sm:mt-0">
                        ₹{s.amount.toFixed(2)}
                      </strong>
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
            <div
              className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm"
              onClick={() => setLinkingMemberId(null)}
            />
            <div className="relative w-full max-w-md bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-level-3 z-10">
              <h3 className="text-lg font-bold text-primary mb-2">Link Ghost Member</h3>
              <p className="text-xs text-outline mb-4">
                Enter the email of a registered user to merge this ghost member's transaction history into their account.
              </p>
              <form onSubmit={handleLinkMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Registered User Email</label>
                  <input
                    type="email"
                    required
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg px-4 text-primary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkingMemberId(null);
                      setLinkEmail('');
                    }}
                    className="bg-surface-container hover:bg-surface-container-high text-primary font-semibold px-4 py-2 rounded-lg text-sm btn-transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLinking}
                    className="bg-secondary hover:bg-secondary-dark text-white font-semibold px-4 py-2 rounded-lg text-sm btn-transition disabled:opacity-50 cursor-pointer"
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
            <div
              className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm"
              onClick={() => setShowMemberModal(false)}
            />
            <div className="relative w-full max-w-md bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-level-3 z-10">
              <h3 className="text-lg font-bold text-primary mb-4">Add Member by Email</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg px-4 text-primary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMemberModal(false)}
                    className="bg-surface-container hover:bg-surface-container-high text-primary font-semibold px-4 py-2 rounded-lg text-sm btn-transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingMember}
                    className="bg-secondary hover:bg-secondary-dark text-white font-semibold px-4 py-2 rounded-lg text-sm btn-transition disabled:opacity-50 cursor-pointer"
                  >
                    {isAddingMember ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
