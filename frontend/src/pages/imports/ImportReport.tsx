import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../api/client';
import { Group, ImportReport as IReport } from '../../types';
import { toast } from 'react-hot-toast';
import { LuArrowLeft, LuCheck, LuX, LuInfo } from 'react-icons/lu';

export const ImportReport = () => {
  const { groupId, importId } = useParams<{ groupId: string; importId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [report, setReport] = useState<IReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupRes, reportRes] = await Promise.all([
        apiClient.get(`/groups/${groupId}`),
        apiClient.get(`/groups/${groupId}/imports/${importId}`),
      ]);

      if (groupRes.data.success) {
        setGroup(groupRes.data.data);
      }
      if (reportRes.data.success) {
        setReport(reportRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load import report details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId && importId) {
      fetchData();
    }
  }, [groupId, importId]);

  const handleResolveAnomaly = async (anomalyId: string, action: 'IMPORT' | 'SKIP') => {
    try {
      setResolvingId(anomalyId);
      const res = await apiClient.post(`/groups/${groupId}/imports/${importId}/resolve`, {
        anomalyId,
        action,
      });

      if (res.data.success) {
        toast.success(`Anomaly ${action === 'IMPORT' ? 'imported as duplicate' : 'skipped'} successfully`);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resolve anomaly');
    } finally {
      setResolvingId(null);
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

  if (!report) return null;

  return (
    <MainLayout>
      <div className="space-y-8 animate-fadeIn text-primary">
        <div>
          <Link to={`/groups/${groupId}/import`} className="inline-flex items-center gap-2 text-outline hover:text-primary transition-colors">
            <LuArrowLeft />
            <span>Back to Imports</span>
          </Link>
        </div>

        {/* Report Overview */}
        <header className="bg-surface-card border border-border-subtle p-6 rounded-2xl shadow-level-1 space-y-4">
          <div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Import Report</span>
            <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">{report.fileName}</h1>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border-subtle text-sm">
            <div>
              <span className="text-outline block">Status</span>
              <strong className={`font-semibold ${report.status === 'COMPLETED' ? 'text-success' : 'text-warning'}`}>
                {report.status}
              </strong>
            </div>
            <div>
              <span className="text-outline block">Total Rows</span>
              <strong className="text-primary">{report.totalRows}</strong>
            </div>
            <div>
              <span className="text-outline block">Imported Rows</span>
              <strong className="text-success">{report.importedRows}</strong>
            </div>
            <div>
              <span className="text-outline block">Anomalies Detected</span>
              <strong className="text-warning">{report.anomaliesCount}</strong>
            </div>
          </div>
        </header>

        {/* Anomaly list */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-primary">Anomalies & Conflicts</h2>
          
          {!report.anomalies || report.anomalies.length === 0 ? (
            <div className="bg-surface-card border border-border-subtle shadow-level-1 rounded-2xl p-8 text-center text-outline text-sm">
              No anomalies or conflicts detected in this import.
            </div>
          ) : (
            <div className="space-y-4">
              {report.anomalies.map((anomaly) => (
                <div key={anomaly.id} className="bg-surface-card border border-border-subtle rounded-xl p-5 space-y-4 shadow-level-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="p-2 bg-warning/10 text-warning rounded-lg h-fit">
                        <LuInfo size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary text-sm">
                          Row {anomaly.rowNumber}: {anomaly.reason}
                        </h4>
                        <p className="text-xs text-primary mt-1 font-mono bg-surface-container p-2.5 rounded border border-border-subtle whitespace-pre-wrap max-w-full overflow-x-auto">
                          {anomaly.rowData}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-semibold">
                      {anomaly.resolved ? (
                        <span className="flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded-full">
                          <LuCheck size={12} />
                          Resolved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-warning bg-warning/10 px-2 py-1 rounded-full">
                          Pending Action
                        </span>
                      )}
                    </div>
                  </div>

                  {!anomaly.resolved && (
                    <div className="flex gap-3 justify-end pt-2 border-t border-border-subtle">
                      <button
                        onClick={() => handleResolveAnomaly(anomaly.id, 'SKIP')}
                        disabled={resolvingId !== null}
                        className="inline-flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-primary font-semibold px-3 py-1.5 rounded-lg text-xs btn-transition disabled:opacity-50 cursor-pointer"
                      >
                        <LuX size={14} />
                        <span>Skip Row</span>
                      </button>
                      <button
                        onClick={() => handleResolveAnomaly(anomaly.id, 'IMPORT')}
                        disabled={resolvingId !== null}
                        className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary-dark text-white font-semibold px-3 py-1.5 rounded-lg text-xs btn-transition disabled:opacity-50 cursor-pointer"
                      >
                        <LuCheck size={14} />
                        <span>Import as Duplicate</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};
