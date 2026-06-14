import React, { useEffect, useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../api/client';
import { Group } from '../../types';
import { LuPlus, LuFolder, LuArrowRight, LuCalendar } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const GroupList = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/groups');
      if (res.data.success) {
        setGroups(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }
    try {
      setIsCreating(true);
      const res = await apiClient.post('/groups', {
        name,
        description: description || undefined,
      });
      if (res.data.success) {
        toast.success('Group created successfully!');
        setName('');
        setDescription('');
        setShowModal(false);
        fetchGroups();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Groups</h1>
            <p className="text-outline mt-1">Manage, view, and organize your shared groups.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-dark text-white font-semibold px-4 py-2.5 rounded-lg btn-transition text-sm shadow-level-2 cursor-pointer"
          >
            <LuPlus />
            <span>Create New Group</span>
          </button>
        </header>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-secondary" />
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-12 text-center shadow-level-1">
            <LuFolder className="mx-auto text-4xl text-outline mb-4" />
            <h3 className="text-lg font-bold text-primary mb-2">No groups found</h3>
            <p className="text-outline mb-6 max-w-sm mx-auto">Create a group to start tracking splits, balances, and settlements.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-secondary hover:bg-secondary-dark text-white font-semibold px-4 py-2 rounded-lg text-sm btn-transition cursor-pointer"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-surface-card border border-border-subtle rounded-2xl p-6 hover:border-secondary/50 card-hover flex flex-col justify-between shadow-level-1"
              >
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">{group.name}</h3>
                  <p className="text-outline text-sm mb-6 line-clamp-2">{group.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center justify-between border-t border-border-subtle pt-4">
                  <div className="flex items-center gap-2 text-xs text-outline">
                    <LuCalendar />
                    <span>{group._count?.memberships || 1} members</span>
                  </div>
                  <Link
                    to={`/groups/${group.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-secondary-dark btn-transition"
                  >
                    <span>View Detail</span>
                    <LuArrowRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            {/* Content */}
            <div className="relative w-full max-w-md bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-level-3 z-10 animate-scaleIn">
              <h3 className="text-lg font-bold text-primary mb-4">Create New Group</h3>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Group Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Roommates, Trip to Goa"
                    className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg px-4 text-primary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Shared expenses for our apartment"
                    className="w-full bg-surface-card border border-border-subtle rounded-lg p-4 text-primary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-surface-container hover:bg-surface-container-high text-primary font-semibold px-4 py-2 rounded-lg text-sm btn-transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bg-secondary hover:bg-secondary-dark text-white font-semibold px-4 py-2 rounded-lg text-sm btn-transition disabled:opacity-50 cursor-pointer"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
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
