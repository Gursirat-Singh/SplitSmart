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
      <div className="space-y-8 animate-fadeIn text-primary">
        <div>
          <Link to={`/groups/${groupId}`} className="inline-flex items-center gap-2 text-outline hover:text-primary transition-colors">
            <LuArrowLeft />
            <span>Back to Group</span>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Import Expenses from CSV</h1>
          <p className="text-outline mt-1">Upload a exported expenses CSV file to mass import into {group?.name}.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload panel */}
          <div className="bg-surface-card border border-border-subtle p-6 rounded-2xl shadow-level-1 h-fit space-y-6">
            <h2 className="text-lg font-bold text-primary">Upload CSV</h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-outline hover:border-secondary/50 rounded-xl p-6 text-center cursor-pointer transition-all relative bg-surface-container-low hover:bg-surface-container">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <LuFileText className="mx-auto text-4xl text-outline mb-2" />
                <span className="block text-sm font-semibold text-primary">
                  {file ? file.name : 'Click or drag CSV here'}
                </span>
                <span className="block text-xs text-outline mt-1">Accepts .csv files up to 5MB</span>
              </div>

              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full h-11 bg-secondary hover:bg-secondary-dark text-white font-semibold rounded-lg flex items-center justify-center gap-2 btn-transition disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? 'Uploading & Processing...' : 'Upload & Process'}
              </button>
            </form>
          </div>

          {/* Report History */}
          <div className="bg-surface-card border border-border-subtle p-6 rounded-2xl shadow-level-1 lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-primary">Import History & Reports</h2>

            {reports.length === 0 ? (
              <div className="text-center py-8 text-outline text-sm">
                No past imports recorded for this group.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="bg-surface-container border border-border-subtle rounded-xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-surface-card border border-border-subtle rounded-lg text-secondary">
                        <LuFileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary text-sm">{report.fileName}</h4>
                        <p className="text-xs text-outline">
                          Uploaded on {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-outline">
                          <span>Rows: {report.totalRows}</span>
                          <span>Imported: {report.importedRows}</span>
                          <span className="flex items-center gap-1 text-warning">
                            <LuInfo size={12} />
                            Anomalies: {report.anomaliesCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 text-xs">
                        {report.status === 'COMPLETED' ? (
                          <span className="flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded-full font-medium">
                            <LuCheck size={12} />
                            Success
                          </span>
                        ) : report.status === 'PENDING' ? (
                          <span className="flex items-center gap-1 text-warning bg-warning/10 px-2 py-1 rounded-full font-medium">
                            <LuClock size={12} />
                            Pending Review
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-error bg-error/10 px-2 py-1 rounded-full font-medium">
                            <LuInfo size={12} />
                            Failed
                          </span>
                        )}
                      </div>
                      
                      <Link
                        to={`/groups/${groupId}/imports/${report.id}`}
                        className="bg-surface-card hover:bg-surface-container-high border border-border-subtle text-secondary hover:text-secondary-dark px-3 py-1.5 rounded-lg text-xs font-semibold btn-transition shadow-level-1"
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
