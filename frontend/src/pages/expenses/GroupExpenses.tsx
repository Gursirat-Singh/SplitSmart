import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import apiClient from '../../api/client';
import { Group, Expense, SplitType } from '../../types';
import { toast } from 'react-hot-toast';
import { LuArrowLeft, LuPlus, LuTrash, LuInfo } from 'react-icons/lu';

export const GroupExpenses = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // New Expense form state
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [splitsData, setSplitsData] = useState<{ [userId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupRes, expenseRes] = await Promise.all([
        apiClient.get(`/groups/${groupId}`),
        apiClient.get(`/groups/${groupId}/expenses`),
      ]);

      if (groupRes.data.success) {
        setGroup(groupRes.data.data);
        const members = groupRes.data.data.memberships || [];
        if (members.length > 0) {
          setPayerId(members[0].userId);
        }
      }
      if (expenseRes.data.success) {
        setExpenses(expenseRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  // Sync exchange rate based on currency selection
  useEffect(() => {
    if (currency === 'INR') {
      setExchangeRate(1);
    } else if (currency === 'USD' && exchangeRate === 1) {
      // Set a sensible default exchange rate for USD->INR
      setExchangeRate(83.5);
    }
  }, [currency]);

  const baseAmount = amount * exchangeRate;

  // Initialize splitsData when splitType or members change
  useEffect(() => {
    if (!group || !group.memberships) return;
    const initial: { [userId: string]: number } = {};
    const count = group.memberships.length;
    
    group.memberships.forEach((m) => {
      if (splitType === 'EQUAL') {
        initial[m.userId] = Number((baseAmount / count).toFixed(2));
      } else if (splitType === 'PERCENTAGE') {
        initial[m.userId] = Number((100 / count).toFixed(2));
      } else {
        initial[m.userId] = 0;
      }
    });
    setSplitsData(initial);
  }, [splitType, group, baseAmount]);

  const handleSplitValueChange = (userId: string, val: number) => {
    setSplitsData((prev) => ({
      ...prev,
      [userId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      toast.error('Please fill in description and a valid amount');
      return;
    }

    // Prepare splits pay-load based on splitType
    const payloadSplits = Object.entries(splitsData).map(([userId, val]) => {
      if (splitType === 'EQUAL') {
        return { userId, amount: val };
      } else if (splitType === 'PERCENTAGE') {
        return { userId, percentage: val };
      } else {
        return { userId, amount: val };
      }
    });

    // Validations
    if (splitType === 'PERCENTAGE') {
      const sum = payloadSplits.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      if (Math.abs(sum - 100) > 0.1) {
        toast.error(`Total percentage must equal 100% (currently ${sum}%)`);
        return;
      }
    } else if (splitType === 'EXACT') {
      const sum = payloadSplits.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      if (Math.abs(sum - baseAmount) > 1) {
        toast.error(`Total split amount must equal base INR amount ₹${baseAmount.toFixed(2)} (currently ₹${sum.toFixed(2)})`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await apiClient.post(`/groups/${groupId}/expenses`, {
        description,
        amount,
        currency,
        exchangeRate,
        date: new Date(date).toISOString(),
        payerId,
        splitType,
        splits: payloadSplits,
      });

      if (res.data.success) {
        toast.success('Expense recorded successfully!');
        setShowModal(false);
        setDescription('');
        setAmount(0);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await apiClient.delete(`/groups/${groupId}/expenses/${id}`);
      toast.success('Expense deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
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
            <span>Add Expense</span>
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Expenses</h1>
          <p className="text-sm text-on-surface-variant mt-1">View and record expenses for {group?.name}.</p>
        </div>

        {/* Expenses list */}
        {expenses.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <LuInfo className="mx-auto text-3xl text-on-surface-variant mb-4" />
            <h3 className="text-lg font-bold text-primary mb-2">No expenses recorded</h3>
            <p className="text-sm text-on-surface-variant mb-4">Click "Add Expense" to record the first shared split expense.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline text-xs font-semibold text-on-surface-variant uppercase bg-neutral-50">
                    <th className="p-4 font-semibold">Description</th>
                    <th className="p-4 font-semibold">Payer</th>
                    <th className="p-4 font-semibold">Original Amount</th>
                    <th className="p-4 font-semibold">Base INR Amount</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline text-sm">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-semibold text-primary">{expense.description}</td>
                      <td className="p-4 text-on-surface-variant">{expense.payer?.name}</td>
                      <td className="p-4 font-mono font-medium">
                        {expense.currency === 'USD' ? '$' : '₹'}{Number(expense.amount).toFixed(2)}
                        {expense.currency === 'USD' && (
                          <span className="block text-[10px] text-on-surface-variant">Rate: {expense.exchangeRate}</span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-primary">₹{Number((expense as any).baseInrAmount || expense.baseAmount).toFixed(2)}</td>
                      <td className="p-4 text-on-surface-variant">
                        {new Date(expense.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
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

        {/* Modal for Add Expense */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-primary/20 backdrop-blur-xs" onClick={() => setShowModal(false)} />
            <div className="relative w-full max-w-xl bg-surface border border-outline rounded-xl p-6 shadow-level-3 z-10 overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-bold text-primary mb-4">Record Split Expense</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Description</label>
                    <input
                      type="text"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Dinner, Rent"
                      className="w-full h-11 bg-white border border-outline rounded-lg px-4 text-primary font-normal placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Paid By</label>
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
                    <label className="block text-xs font-semibold text-primary uppercase tracking-wider">Split Strategy</label>
                    <select
                      value={splitType}
                      onChange={(e) => setSplitType(e.target.value as SplitType)}
                      className="w-full h-11 bg-white border border-outline rounded-lg px-3 text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    >
                      <option value="EQUAL">Split Equally</option>
                      <option value="EXACT">Exact Split (INR)</option>
                      <option value="PERCENTAGE">Percentage Split</option>
                    </select>
                  </div>
                </div>

                {/* Splits Fields */}
                <div className="space-y-3 pt-4 border-t border-outline">
                  <span className="block text-xs font-semibold text-primary uppercase tracking-wider">
                    Splits Distribution (Total Base INR: ₹{baseAmount.toFixed(2)})
                  </span>
                  
                  {group?.memberships?.map((m) => (
                    <div key={m.userId} className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-outline">
                      <span className="text-sm font-semibold text-primary">{m.user?.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          disabled={splitType === 'EQUAL'}
                          value={splitsData[m.userId] || ''}
                          onChange={(e) => handleSplitValueChange(m.userId, Number(e.target.value))}
                          className="w-24 h-9 bg-white border border-outline rounded-lg px-3 text-primary text-right text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:bg-neutral-50"
                        />
                        <span className="text-xs text-on-surface-variant font-medium">
                          {splitType === 'PERCENTAGE' ? '%' : 'INR'}
                        </span>
                      </div>
                    </div>
                  ))}
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
                    {isSubmitting ? 'Recording...' : 'Record Expense'}
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
