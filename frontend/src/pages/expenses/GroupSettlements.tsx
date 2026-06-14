import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../api/client';
import { Group, Settlement } from '../../types';
import { toast } from 'react-hot-toast';
import { LuArrowLeft, LuPlus, LuTrash, LuInfo } from 'react-icons/lu';

export const GroupSettlements = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState('');
  const [payeeId, setPayeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupRes, settleRes] = await Promise.all([
        apiClient.get(`/groups/${groupId}`),
        apiClient.get(`/groups/${groupId}/settlements`),
      ]);

      if (groupRes.data.success) {
        setGroup(groupRes.data.data);
        const members = groupRes.data.data.memberships || [];
        if (members.length > 0) {
          setPayerId(members[0].userId);
          if (members.length > 1) {
            setPayeeId(members[1].userId);
          } else {
            setPayeeId(members[0].userId);
          }
        }
      }
      if (settleRes.data.success) {
        setSettlements(settleRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  useEffect(() => {
    if (currency === 'INR') {
      setExchangeRate(1);
    } else if (currency === 'USD' && exchangeRate === 1) {
      setExchangeRate(83.5);
    }
  }, [currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    if (payerId === payeeId) {
      toast.error('Payer and payee must be different users');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiClient.post(`/groups/${groupId}/settlements`, {
        amount,
        currency,
        exchangeRate,
        date: new Date(date).toISOString(),
        payerId,
        payeeId,
      });

      if (res.data.success) {
        toast.success('Settlement recorded successfully!');
        setShowModal(false);
        setAmount(0);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSettlement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this settlement?')) return;
    try {
      await apiClient.delete(`/groups/${groupId}/settlements/${id}`);
      toast.success('Settlement deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete settlement');
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
        <div className="flex items-center justify-between">
          <Link to={`/groups/${groupId}`} className="inline-flex items-center gap-2 text-outline hover:text-primary transition-colors">
            <LuArrowLeft />
            <span>Back to Group</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-dark text-white font-semibold px-4 py-2.5 rounded-lg btn-transition text-sm shadow-level-2 cursor-pointer"
          >
            <LuPlus />
            <span>Record Settlement</span>
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Settlements</h1>
          <p className="text-outline mt-1">View and record debt payments for {group?.name}.</p>
        </div>

        {/* Settlements list */}
        {settlements.length === 0 ? (
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-12 text-center shadow-level-1">
            <LuInfo className="mx-auto text-4xl text-outline mb-4" />
            <h3 className="text-lg font-bold text-primary mb-2">No settlements recorded</h3>
            <p className="text-outline mb-4">Click "Record Settlement" to enter a payment transaction between members.</p>
          </div>
        ) : (
          <div className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden shadow-level-1">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border-subtle text-xs font-semibold text-outline uppercase bg-surface-container">
                    <th className="p-4">Sender (Payer)</th>
                    <th className="p-4">Receiver (Payee)</th>
                    <th className="p-4">Original Amount</th>
                    <th className="p-4">Base INR Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-sm">
                  {settlements.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-4 font-semibold text-primary">{settlement.payer?.name}</td>
                      <td className="p-4 font-semibold text-primary">{settlement.payee?.name}</td>
                      <td className="p-4 font-mono">
                        {settlement.currency === 'USD' ? '$' : '₹'}{settlement.amount.toFixed(2)}
                        {settlement.currency === 'USD' && (
                          <span className="block text-xs text-outline">Rate: {settlement.exchangeRate}</span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-secondary">₹{settlement.baseAmount.toFixed(2)}</td>
                      <td className="p-4 text-outline">
                        {new Date(settlement.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteSettlement(settlement.id)}
                          className="text-outline hover:text-error p-2 rounded transition-colors"
                        >
                          <LuTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal for recording Settlement */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative w-full max-w-md bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-level-3 z-10">
              <h3 className="text-lg font-bold text-primary mb-4">Record Settlement</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Payer (Who Paid)</label>
                    <select
                      value={payerId}
                      onChange={(e) => setPayerId(e.target.value)}
                      className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg px-3 text-primary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
                    >
                      {group?.memberships?.map((m) => (
                        <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Payee (Who Received)</label>
                    <select
                      value={payeeId}
                      onChange={(e) => setPayeeId(e.target.value)}
                      className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg px-3 text-primary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
                    >
                      {group?.memberships?.map((m) => (
                        <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Amount</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg px-4 text-primary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD')}
                      className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg px-3 text-primary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Exchange Rate</label>
                    <input
                      type="number"
                      step="any"
                      disabled={currency === 'INR'}
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(Number(e.target.value))}
                      className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg px-4 text-primary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm disabled:opacity-50 disabled:bg-surface-container"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg px-4 text-primary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
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
                    disabled={isSubmitting}
                    className="bg-secondary hover:bg-secondary-dark text-white font-semibold px-4 py-2 rounded-lg text-sm btn-transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Recording...' : 'Record Settlement'}
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
