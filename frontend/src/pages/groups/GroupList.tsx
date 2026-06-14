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
      <div className="space-y-8 animate-fadeIn text-on-background">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Groups</h1>
            <p className="text-sm text-on-surface-variant mt-1">Manage, view, and organize your shared groups.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-neutral-800 text-white font-medium px-4 py-2.5 rounded-lg btn-transition text-sm shadow-sm cursor-pointer"
          >
            <LuPlus className="text-base" />
            <span>Create New Group</span>
          </button>
        </header>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <LuFolder className="mx-auto text-4xl text-on-surface-variant mb-4" />
            <h3 className="text-lg font-bold text-primary mb-2">No groups found</h3>
            <p className="text-sm text-on-surface-variant mb-6 max-w-sm mx-auto">Create a group to start tracking splits, balances, and settlements.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary hover:bg-neutral-800 text-white font-medium px-5 py-2.5 rounded-lg text-sm btn-transition cursor-pointer"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="fintech-bento-grid">
            {groups.map((group) => (
              <div
                key={group.id}
                className="glass-card md:col-span-4 p-6 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-base font-bold text-primary mb-2 truncate">{group.name}</h3>
                  <p className="text-xs text-on-surface-variant mb-6 line-clamp-2 leading-relaxed">{group.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center justify-between border-t border-outline pt-4">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                    <LuCalendar size={14} />
                    <span>{group._count?.memberships || 1} members</span>
                  </div>
                  <Link
                    to={`/groups/${group.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline btn-transition"
                  >
                    <span>View Detail</span>
                    <LuArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}

            {/* New Circle Bento Widget Mock */}
            <button
              onClick={() => setShowModal(true)}
              className="glass-card md:col-span-4 p-6 border-dashed border-2 hover:border-solid border-outline flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="p-2.5 bg-primary-container rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-200 mb-3">
                <LuPlus size={20} className="text-primary group-hover:text-white" />
              </div>
              <p className="text-sm font-semibold text-primary">New Circle</p>
              <p className="text-xs text-on-surface-variant mt-1">Get Started manual action</p>
            </button>
          </div>
        )}

        {/* Create Group Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-primary/20 backdrop-blur-xs"
              onClick={() => setShowModal(false)}
            />
            {/* Content */}
            <div className="relative w-full max-w-md bg-surface border border-outline rounded-xl p-6 shadow-level-3 z-10 animate-scaleIn">
              <h3 className="text-lg font-bold text-primary mb-4">Create New Group</h3>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Group Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Roommates, Trip to Goa"
                    className="w-full h-11 bg-white border border-outline rounded-lg px-4 text-primary font-normal placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Shared expenses for our apartment"
                    className="w-full bg-white border border-outline rounded-lg p-4 text-primary font-normal placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-primary-container hover:bg-neutral-200 text-primary font-medium px-4 py-2 rounded-lg text-sm btn-transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bg-primary hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-lg text-sm btn-transition disabled:opacity-50 cursor-pointer"
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

