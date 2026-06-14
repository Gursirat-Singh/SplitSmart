import React, { useEffect, useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { Group, GroupBalancesResponse } from '../../types';
import { LuUsers, LuTrendingUp, LuTrendingDown, LuPlus, LuArrowRight } from 'react-icons/lu';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [youAreOwed, setYouAreOwed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch user's groups
        const groupsRes = await apiClient.get('/groups');
        if (groupsRes.data.success) {
          const userGroups: Group[] = groupsRes.data.data;
          setGroups(userGroups);

          // 2. Fetch balances for all groups to compile overall statistics
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

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-secondary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Welcome Header */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Financial Dashboard</h1>
            <p className="text-outline mt-1">Hello, {user?.name}. Here's your real-time financial standing.</p>
          </div>
          <Link
            to="/groups"
            className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-dark text-white font-semibold px-4 py-2.5 rounded-lg btn-transition text-sm shadow-level-2"
          >
            <LuPlus />
            <span>Manage Groups</span>
          </Link>
        </header>

        {error && (
          <div className="bg-error-light border border-error/20 rounded-xl p-4 text-error text-sm">
            {error}
          </div>
        )}

        {/* Aggregate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Total Balance */}
          <div className="bg-surface-card border border-border-subtle p-6 rounded-2xl relative overflow-hidden shadow-level-1 card-hover">
            <div className="absolute right-4 top-4 bg-secondary/10 p-2.5 rounded-xl">
              <LuUsers className="text-secondary text-xl" />
            </div>
            <p className="text-xs font-semibold text-outline uppercase tracking-wider">Total Net Balance</p>
            <p className={`text-3xl font-bold font-mono mt-3 ${totalBalance >= 0 ? 'text-success' : 'text-error'}`}>
              {totalBalance >= 0 ? '+' : '-'}₹{Math.abs(totalBalance).toFixed(2)}
            </p>
          </div>

          {/* You Owe */}
          <div className="bg-surface-card border border-border-subtle p-6 rounded-2xl relative overflow-hidden shadow-level-1 card-hover">
            <div className="absolute right-4 top-4 bg-error-light p-2.5 rounded-xl">
              <LuTrendingDown className="text-error text-xl" />
            </div>
            <p className="text-xs font-semibold text-outline uppercase tracking-wider">You Owe</p>
            <p className="text-3xl font-bold font-mono text-error mt-3">
              ₹{youOwe.toFixed(2)}
            </p>
          </div>

          {/* You are owed */}
          <div className="bg-surface-card border border-border-subtle p-6 rounded-2xl relative overflow-hidden shadow-level-1 card-hover">
            <div className="absolute right-4 top-4 bg-success-light p-2.5 rounded-xl">
              <LuTrendingUp className="text-success text-xl" />
            </div>
            <p className="text-xs font-semibold text-outline uppercase tracking-wider">You Are Owed</p>
            <p className="text-3xl font-bold font-mono text-success mt-3">
              ₹{youAreOwed.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Groups & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-surface-card border border-border-subtle p-6 rounded-2xl lg:col-span-2 shadow-level-1">
            <h2 className="text-lg font-bold text-primary mb-4">Your Groups</h2>
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-outline mb-4">You are not in any group yet.</p>
                <Link to="/groups" className="text-secondary hover:underline font-semibold text-sm">Create or join one now</Link>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {groups.slice(0, 5).map((group) => (
                  <div key={group.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                    <div>
                      <h3 className="font-semibold text-primary">{group.name}</h3>
                      <p className="text-xs text-outline">{group.description || 'No description'}</p>
                    </div>
                    <Link
                      to={`/groups/${group.id}`}
                      className="p-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-secondary hover:text-secondary-dark transition-colors"
                    >
                      <LuArrowRight />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-card border border-border-subtle p-6 rounded-2xl shadow-level-1 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary mb-2">SplitSmart Tip</h2>
              <p className="text-sm text-outline leading-relaxed">
                Keep your balances clear and healthy! Add expenses as they occur, use multi-currency if paying abroad, and settle up instantly using settlements.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-border-subtle text-center">
              <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Version 1.0.0 Stable</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
