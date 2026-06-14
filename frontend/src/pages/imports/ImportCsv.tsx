import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../api/client';
import { Group, ImportReport } from '../../types';
import { toast } from 'react-hot-toast';
import { LuArrowLeft, LuFileText, LuInfo, LuCheck, LuClock } from 'react-icons/lu';

export const ImportCsv = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [reports, setReports] = useState<ImportReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupRes, reportRes] = await Promise.all([
        apiClient.get(`/groups/${groupId}`),
        apiClient.get(`/groups/${groupId}/imports`),
      ]);

      if (groupRes.data.success) {
        setGroup(groupRes.data.data);
      }
      if (reportRes.data.success) {
        setReports(reportRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load import records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const res = await apiClient.post(`/groups/${groupId}/imports/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        toast.success('CSV uploaded and processed successfully!');
        setFile(null);
        fetchData();
        // Redirect to the newly created report if it has anomalies
        const report: ImportReport = res.data.data;
        if (report.anomaliesCount > 0) {
          toast.success('Anomalies detected. Redirecting to review report...', { duration: 6000 });
          navigate(`/groups/${groupId}/imports/${report.id}`);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'CSV upload failed');
    } finally {
      setIsUploading(false);
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

  return (
    <MainLayout>
      <div className="space-y-8 animate-fadeIn text-on-background">
        <div>
          <Link to={`/groups/${groupId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
            <LuArrowLeft size={14} />
            <span>Back to Group</span>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Import Expenses from CSV</h1>
          <p className="text-sm text-on-surface-variant mt-1">Upload an exported expenses CSV file to mass import into {group?.name}.</p>
        </div>

        <div className="fintech-bento-grid">
          {/* Upload panel - Bento Ingestion Zone */}
          <div className="glass-card md:col-span-4 p-6 space-y-6 h-fit">
            <h2 className="text-base font-bold text-primary tracking-tight">Upload CSV</h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-outline hover:border-primary rounded-xl p-8 text-center cursor-pointer transition-all relative bg-neutral-50 hover:bg-neutral-100">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <LuFileText className="mx-auto text-3xl text-on-surface-variant mb-3 animate-pulse" />
                <span className="block text-sm font-semibold text-primary">
                  {file ? file.name : 'Click or drag CSV here'}
                </span>
                <span className="block text-[11px] text-on-surface-variant mt-1.5">Accepts .csv files up to 5MB</span>
              </div>

              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full h-11 bg-primary hover:bg-neutral-800 text-white font-medium rounded-lg flex items-center justify-center gap-2 btn-transition disabled:opacity-50 cursor-pointer shadow-sm text-sm"
              >
                {isUploading ? 'Uploading & Processing...' : 'Upload & Process'}
              </button>
            </form>
          </div>

          {/* Report History */}
          <div className="glass-card md:col-span-8 p-6 space-y-6">
            <h2 className="text-base font-bold text-primary tracking-tight pb-2 border-b border-outline">Import History & Reports</h2>

            {reports.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant text-sm">
                No past imports recorded for this group.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="bg-white border border-outline rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-primary transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary-container rounded-lg text-primary">
                        <LuFileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-primary">{report.fileName}</h4>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          Uploaded on {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-on-surface-variant font-medium">
                          <span>Rows: {report.totalRows}</span>
                          <span>Imported: {report.importedRows}</span>
                          <span className="inline-flex items-center gap-1 text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[10px]">
                            Anomalies: {report.anomaliesCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="flex items-center gap-1.5">
                        {report.status === 'COMPLETED' ? (
                          <span className="text-xs px-2.5 py-0.5 rounded success-badge">
                            Success
                          </span>
                        ) : report.status === 'PENDING' ? (
                          <span className="text-xs px-2.5 py-0.5 rounded warning-badge">
                            Pending Review
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded error-badge">
                            Failed
                          </span>
                        )}
                      </div>
                      
                      <Link
                        to={`/groups/${groupId}/imports/${report.id}`}
                        className="bg-white hover:bg-neutral-50 border border-outline text-primary px-3 py-1.5 rounded-lg text-xs font-semibold btn-transition shadow-sm"
                      >
                        View Report
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

