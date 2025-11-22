import { useEffect, useState } from 'react';
import { expenseApi } from '../../services/expenseApi';
import type { UserSummary } from '../../types/expense';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface UserBalanceSummaryProps {
  tripId: number;
  userId: number;
}

const UserBalanceSummary = ({ tripId, userId }: UserBalanceSummaryProps) => {
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await expenseApi.getUserSummary(tripId, userId);
        setSummary(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load balance summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [tripId, userId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!summary) return null;

  const isPositive = summary.net_balance >= 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md border border-blue-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <DollarSign className="text-blue-600" size={24} />
        Your Balance Summary
      </h3>

      <div className="space-y-4">
        {/* Total Paid */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total You Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ${Number(summary.total_paid).toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Total amount you paid for expenses
          </p>
        </div>

        {/* Total Owed */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Share of Expenses</p>
              <p className="text-2xl font-bold text-orange-600">
                ${Number(summary.total_owed).toFixed(2)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <TrendingDown className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Total amount you owe for your share
          </p>
        </div>

        {/* Net Balance */}
        <div className={`p-4 rounded-lg shadow-sm ${
          isPositive ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
        }`}>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Net Balance</p>
            <p className={`text-3xl font-bold ${
              isPositive ? 'text-green-700' : 'text-red-700'
            }`}>
              {isPositive ? '+' : ''}${Number(summary.net_balance).toFixed(2)}
            </p>
            <p className="text-sm mt-2 text-gray-600">
              {isPositive ? (
                summary.net_balance === 0 ? (
                  <span>You're all settled up! 🎉</span>
                ) : (
                  <span>Others owe you this amount</span>
                )
              ) : (
                <span>You owe this amount to others</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBalanceSummary;
