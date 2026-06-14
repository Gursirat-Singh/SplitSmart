import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../api/client';
import { Group } from '../../types';
import { toast } from 'react-hot-toast';
import {
  LuArrowLeft,
  LuCheck,
  LuX,
  LuInfo,
  LuRefreshCw,
} from 'react-icons/lu';

interface OriginalExpense {
  id: string;
  description: string;
  originalAmount: number;
  currency: string;
  expenseDate: string;
  paidBy: string;
}

interface ExtendedImportAnomaly {
  id: string;
  reportId: string;
  rowNumber: number;
  type: string;
  severity: 'WARNING' | 'ERROR';
  rowData: string;
  reason: string;
  resolved: boolean;
  originalExpense?: OriginalExpense | null;
}

interface ExtendedImportReport {
  id: string;
  groupId: string;
  fileName: string;
  uploadedById: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  importedRows: number;
  anomaliesCount: number;
  createdAt: string;
  anomalies: ExtendedImportAnomaly[];
}

export const ImportReport = () => {
  const { groupId, importId } = useParams<{ groupId: string; importId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [report, setReport] = useState<ExtendedImportReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'duplicates' | 'errors'>('all');

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

  const handleResolveAnomaly = async (anomalyId: string, action: 'ACCEPT' | 'SKIP' | 'REPLACE') => {
    try {
      setResolvingId(anomalyId);
      const res = await apiClient.post(`/groups/${groupId}/imports/${importId}/resolve`, {
        anomalyId,
        action,
      });

      if (res.data.success) {
        let actionMsg = '';
        if (action === 'SKIP') actionMsg = 'kept original (skipped row)';
        if (action === 'ACCEPT') actionMsg = 'imported as a new expense';
        if (action === 'REPLACE') actionMsg = 'replaced original expense with duplicate';

        toast.success(`Successfully resolved anomaly: ${actionMsg}`);
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

  // Filter logic
  const filteredAnomalies = report.anomalies.filter((anomaly) => {
    if (activeFilter === 'duplicates') {
      return anomaly.type === 'DUPLICATE_ENTRY' || anomaly.type === 'SETTLEMENT_DETECTED' || anomaly.type === 'REFUND';
    }
    if (activeFilter === 'errors') {
      return anomaly.severity === 'ERROR';
    }
    return true;
  });

  return (
    <MainLayout>
      <div className="space-y-8 animate-fadeIn text-on-background">
        <div>
          <Link to={`/groups/${groupId}/import`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
            <LuArrowLeft size={14} />
            <span>Back to Imports</span>
          </Link>
        </div>

        {/* Report Overview */}
        <header className="glass-card p-6 space-y-6">
          <div>
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest font-mono">Import Report Details</span>
            <h1 className="text-2xl font-bold tracking-tight text-primary mt-1">{report.fileName}</h1>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-outline text-sm font-semibold">
            <div>
              <span className="text-on-surface-variant block text-xs font-semibold">Status</span>
              <strong className={`font-bold uppercase tracking-wider ${report.status === 'COMPLETED' ? 'text-primary' : 'text-neutral-500'}`}>
                {report.status}
              </strong>
            </div>
            <div>
              <span className="text-on-surface-variant block text-xs font-semibold">Rows Processed</span>
              <strong className="text-primary font-mono">{report.totalRows}</strong>
            </div>
            <div>
              <span className="text-on-surface-variant block text-xs font-semibold">Success Counter</span>
              <strong className="text-primary font-mono">{report.importedRows}</strong>
            </div>
            <div>
              <span className="text-on-surface-variant block text-xs font-semibold">Anomalies Logged</span>
              <strong className="text-error font-mono">{report.anomaliesCount}</strong>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline bg-transparent">
          <button
            onClick={() => setActiveFilter('all')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 btn-transition cursor-pointer tracking-wider uppercase ${
              activeFilter === 'all' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            All Anomalies ({report.anomalies.length})
          </button>
          <button
            onClick={() => setActiveFilter('duplicates')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 btn-transition cursor-pointer tracking-wider uppercase ${
              activeFilter === 'duplicates' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            Duplicates ({report.anomalies.filter(a => a.type === 'DUPLICATE_ENTRY' || a.type === 'SETTLEMENT_DETECTED' || a.type === 'REFUND').length})
          </button>
          <button
            onClick={() => setActiveFilter('errors')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 btn-transition cursor-pointer tracking-wider uppercase ${
              activeFilter === 'errors' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            Hard Errors ({report.anomalies.filter(a => a.severity === 'ERROR').length})
          </button>
        </div>

        {/* Anomaly list */}
        <section className="space-y-6">
          {filteredAnomalies.length === 0 ? (
            <div className="glass-card p-12 text-center text-on-surface-variant text-sm">
              No anomalies matching the selected filter.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAnomalies.map((anomaly) => {
                const isDuplicate = anomaly.type === 'DUPLICATE_ENTRY';
                const parsedRowData = JSON.parse(anomaly.rowData);

                return (
                  <div key={anomaly.id} className="glass-card p-6 space-y-5">
                    {/* Severity Banner */}
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          anomaly.severity === 'ERROR' ? 'error-badge' : 'warning-badge'
                        }`}>
                          {anomaly.severity === 'ERROR' ? 'ERROR (SKIPPED)' : 'REVIEW REQUIRED'}
                        </span>
                        
                        <span className="text-[10px] font-semibold bg-primary-container text-primary border border-outline px-2 py-0.5 rounded">
                          {anomaly.type}
                        </span>

                        <span className="text-xs text-on-surface-variant font-medium">Row {anomaly.rowNumber}</span>
                      </div>

                      <div className="text-xs font-semibold">
                        {anomaly.resolved ? (
                          <span className="text-xs px-2 py-0.5 rounded success-badge">
                            Resolved
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded warning-badge animate-pulse">
                            Pending Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Conflict description */}
                    <div className="flex gap-2.5 items-center text-xs font-medium text-primary bg-neutral-50 p-3 rounded-lg border border-outline">
                      <LuInfo size={14} className="text-primary shrink-0" />
                      <span>{anomaly.reason}</span>
                    </div>

                    {/* Side by side duplicate A/B Reconciliation Card */}
                    {isDuplicate && anomaly.originalExpense && !anomaly.resolved ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Entry A (Existing) */}
                        <div className="border border-outline bg-white rounded-lg p-4 space-y-3 shadow-sm">
                          <h5 className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Entry A (Existing)</h5>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-primary">{anomaly.originalExpense.description}</p>
                            <p className="text-lg font-bold font-mono text-primary">
                              {anomaly.originalExpense.currency} {anomaly.originalExpense.originalAmount.toFixed(2)}
                            </p>
                            <div className="text-[11px] text-on-surface-variant space-y-0.5 pt-1">
                              <p>Paid by: <strong>{anomaly.originalExpense.paidBy}</strong></p>
                              <p>Date: {new Date(anomaly.originalExpense.expenseDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Entry B (Importing) */}
                        <div className="border border-primary/20 bg-primary-container rounded-lg p-4 space-y-3 shadow-sm">
                          <h5 className="text-[10px] font-semibold text-primary uppercase tracking-wider">Entry B (Importing)</h5>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-primary">{parsedRowData.description}</p>
                            <p className="text-lg font-bold font-mono text-primary">
                              {parsedRowData.currency} {parseFloat(parsedRowData.originalAmount).toFixed(2)}
                            </p>
                            <div className="text-[11px] text-on-surface-variant space-y-0.5 pt-1">
                              <p>Payer Email: <strong>{parsedRowData.payerEmail}</strong></p>
                              <p>Date: {parsedRowData.expenseDate}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Fallback Raw JSON view */
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-on-surface-variant">Raw Row Data:</p>
                        <pre className="text-xs text-primary font-mono bg-neutral-50 p-4 rounded-lg border border-outline whitespace-pre-wrap max-w-full overflow-x-auto">
                          {anomaly.rowData}
                        </pre>
                      </div>
                    )}

                    {/* Action buttons (only for unresolved warnings/anomalies) */}
                    {!anomaly.resolved && anomaly.severity === 'WARNING' && (
                      <div className="flex flex-wrap gap-3 justify-end pt-3 border-t border-outline">
                        <button
                          onClick={() => handleResolveAnomaly(anomaly.id, 'SKIP')}
                          disabled={resolvingId !== null}
                          className="inline-flex items-center gap-1.5 bg-primary-container hover:bg-neutral-200 text-primary font-semibold px-3.5 py-2 rounded-lg text-xs btn-transition disabled:opacity-50 cursor-pointer border border-outline"
                          title="Keep the original expense and ignore this duplicate row"
                        >
                          <LuX size={12} />
                          <span>Keep Original</span>
                        </button>
                        
                        {isDuplicate && (
                          <button
                            onClick={() => handleResolveAnomaly(anomaly.id, 'REPLACE')}
                            disabled={resolvingId !== null}
                            className="inline-flex items-center gap-1.5 bg-neutral-200 hover:bg-neutral-300 text-primary font-semibold px-3.5 py-2 rounded-lg text-xs btn-transition disabled:opacity-50 cursor-pointer border border-outline"
                            title="Replace/overwrite the original expense with this duplicate row"
                          >
                            <LuRefreshCw size={12} />
                            <span>Merge Entries</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleResolveAnomaly(anomaly.id, 'ACCEPT')}
                          disabled={resolvingId !== null}
                          className="inline-flex items-center gap-1.5 bg-primary hover:bg-neutral-800 text-white font-semibold px-3.5 py-2 rounded-lg text-xs btn-transition disabled:opacity-50 cursor-pointer shadow-sm"
                          title="Import this row anyway, keeping both expenses"
                        >
                          <LuCheck size={12} />
                          <span>Keep Both (Import)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

