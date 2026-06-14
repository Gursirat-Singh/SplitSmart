import React, { useEffect, useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../api/client';
import { Group } from '../../types';
import { LuFileSpreadsheet, LuArrowRight, LuFolder } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const ImportCenter = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <MainLayout>
      <div className="space-y-8 animate-fadeIn text-on-background">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">CSV Import Center</h1>
          <p className="text-sm text-on-surface-variant mt-1">Select a group to upload and import expenses from a CSV file.</p>
        </div>

        {loading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <LuFolder className="mx-auto text-4xl text-on-surface-variant mb-4" />
            <h3 className="text-lg font-bold text-primary mb-2">No groups found</h3>
            <p className="text-sm text-on-surface-variant mb-6 max-w-sm mx-auto">You need to belong to a group before you can import expenses.</p>
            <Link
              to="/groups"
              className="bg-primary hover:bg-neutral-800 text-white font-medium px-5 py-2.5 rounded-lg text-sm btn-transition inline-block"
            >
              Manage Groups
            </Link>
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
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
                    <LuFileSpreadsheet size={14} />
                    <span>Import Center</span>
                  </div>
                  <Link
                    to={`/groups/${group.id}/import`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline btn-transition"
                  >
                    <span>Import CSV</span>
                    <LuArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
