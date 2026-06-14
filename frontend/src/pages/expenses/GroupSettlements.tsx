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
          <Link to={`/groups/${groupId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
            <LuArrowLeft size={14} />
            <span>Back to Group</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-neutral-800 text-white font-medium px-4 py-2.5 rounded-lg btn-transition text-sm shadow-sm cursor-pointer"
          >
            <LuPlus className="text-base" />
            <span>Record Settlement</span>
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Settlements</h1>
          <p className="text-sm text-on-surface-variant mt-1">View and record debt payments for {group?.name}.</p>
        </div>

        {/* Settlements list */}
        {settlements.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <LuInfo className="mx-auto text-3xl text-on-surface-variant mb-4" />
            <h3 className="text-lg font-bold text-primary mb-2">No settlements recorded</h3>
            <p className="text-sm text-on-surface-variant mb-4">Click "Record Settlement" to enter a payment transaction between members.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline text-xs font-semibold text-on-surface-variant uppercase bg-neutral-50">
                    <th className="p-4 font-semibold">Sender (Payer)</th>
                    <th className="p-4 font-semibold">Receiver (Payee)</th>
                    <th className="p-4 font-semibold">Original Amount</th>
                    <th className="p-4 font-semibold">Base INR Amount</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline text-sm">
                  {settlements.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-semibold text-primary">{settlement.payer?.name}</td>
                      <td className="p-4 font-semibold text-primary">{settlement.payee?.name}</td>
                      <td className="p-4 font-mono font-medium">
                        {settlement.currency === 'USD' ? '$' : '₹'}{settlement.amount.toFixed(2)}
                        {settlement.currency === 'USD' && (
                          <span className="block text-[10px] text-on-surface-variant">Rate: {settlement.exchangeRate}</span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-primary">₹{settlement.baseAmount.toFixed(2)}</td>
                      <td className="p-4 text-on-surface-variant">
                        {new Date(settlement.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteSettlement(settlement.id)}
                          className="text-on-surface-variant hover:text-error p-1.5 rounded transition-colors btn-transition"
                        >
                          <LuTrash size={15} />
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
            <div className="fixed inset-0 bg-primary/20 backdrop-blur-xs" onClick={() => setShowModal(false)} />
            <div className="relative w-full max-w-md bg-surface border border-outline rounded-xl p-6 shadow-level-3 z-10">
              <h3 className="text-lg font-bold text-primary mb-4">Record Settlement</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Payer (Who Paid)</label>
                    <select
                      value={payerId}
                      onChange={(e) => setPayerId(e.target.value)}
                      className="w-full h-11 bg-white border border-outline rounded-lg px-3 text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    >
                      {group?.memberships?.map((m) => (
                        <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Payee (Who Received)</label>
                    <select
                      value={payeeId}
                      onChange={(e) => setPayeeId(e.target.value)}
                      className="w-full h-11 bg-white border border-outline rounded-lg px-3 text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    >
                      {group?.memberships?.map((m) => (
                        <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Amount</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full h-11 bg-white border border-outline rounded-lg px-4 text-primary font-normal placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD')}
                      className="w-full h-11 bg-white border border-outline rounded-lg px-3 text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Exchange Rate</label>
                    <input
                      type="number"
                      step="any"
                      disabled={currency === 'INR'}
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(Number(e.target.value))}
                      className="w-full h-11 bg-white border border-outline rounded-lg px-4 text-primary font-normal placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm disabled:opacity-50 disabled:bg-neutral-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 bg-white border border-outline rounded-lg px-4 text-primary font-normal focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-primary-container hover:bg-neutral-200 text-primary font-medium px-4 py-2.5 rounded-lg text-sm btn-transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-neutral-800 text-white font-medium px-4 py-2.5 rounded-lg text-sm btn-transition disabled:opacity-50 cursor-pointer"
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
