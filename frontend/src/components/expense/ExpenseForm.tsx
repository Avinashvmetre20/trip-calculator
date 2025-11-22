import { useState, useEffect } from 'react';
import { SplitType, EXPENSE_CATEGORIES, type CreateExpenseData } from '../../types/expense';
import { calculateSplits, validateSplits } from '../../utils/splitCalculator';

interface Member {
  id: number;
  name: string;
  email: string;
}

interface ExpenseFormProps {
  tripId: number;
  members: Member[];
  onSubmit: (data: CreateExpenseData) => void;
  onCancel: () => void;
  initialData?: any;
}

const ExpenseForm = ({ tripId, members, onSubmit, onCancel, initialData }: ExpenseFormProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [category, setCategory] = useState(initialData?.category || 'Food');
  const [payerId, setPayerId] = useState(initialData?.payer_id || members[0]?.id || 0);
  const [expenseDate, setExpenseDate] = useState(initialData?.expense_date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUAL);
  const [selectedMembers, setSelectedMembers] = useState<number[]>(members.map(m => m.id));
  const [customSplits, setCustomSplits] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize custom splits when members or split type changes
    if (splitType === SplitType.EQUAL) {
      const splits = members.filter(m => selectedMembers.includes(m.id)).map(m => ({
        user_id: m.id,
        amount: 0
      }));
      setCustomSplits(splits);
    } else if (splitType === SplitType.PERCENTAGE) {
      const equalPercentage = 100 / selectedMembers.length;
      const splits = members.filter(m => selectedMembers.includes(m.id)).map(m => ({
        user_id: m.id,
        percentage: parseFloat(equalPercentage.toFixed(2))
      }));
      setCustomSplits(splits);
    } else if (splitType === SplitType.SHARES) {
      const splits = members.filter(m => selectedMembers.includes(m.id)).map(m => ({
        user_id: m.id,
        shares: 1
      }));
      setCustomSplits(splits);
    } else {
      const splits = members.filter(m => selectedMembers.includes(m.id)).map(m => ({
        user_id: m.id,
        amount: 0
      }));
      setCustomSplits(splits);
    }
  }, [splitType, selectedMembers, members]);

  const handleMemberToggle = (memberId: number) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleCustomSplitChange = (userId: number, field: string, value: number) => {
    setCustomSplits(customSplits.map(split => 
      split.user_id === userId ? { ...split, [field]: value } : split
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Calculate final splits
    const finalSplits = calculateSplits(
      amountNum,
      splitType,
      members.filter(m => selectedMembers.includes(m.id)),
      customSplits
    );

    // Validate splits
    const validation = validateSplits(amountNum, splitType, finalSplits);
    if (!validation.valid) {
      setError(validation.error || 'Invalid split configuration');
      return;
    }

    const expenseData: CreateExpenseData = {
      title,
      amount: amountNum,
      category,
      payer_id: payerId,
      expense_date: expenseDate,
      notes,
      split_type: splitType,
      splits: finalSplits
    };

    onSubmit(expenseData);
  };

  const calculatedSplits = amount ? calculateSplits(
    parseFloat(amount),
    splitType,
    members.filter(m => selectedMembers.includes(m.id)),
    customSplits
  ) : [];

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Add Expense</h3>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2">
          <label className="block text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., Dinner at restaurant"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Amount *</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Paid by *</label>
          <select
            value={payerId}
            onChange={(e) => setPayerId(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
            required
          >
            {members.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Date *</label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-gray-700 mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border rounded"
            rows={2}
            placeholder="Optional notes..."
          />
        </div>
      </div>

      {/* Split Configuration */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-semibold mb-3">Split Between</h4>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Split Type</label>
          <div className="flex gap-2">
            {Object.values(SplitType).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSplitType(type)}
                className={`px-4 py-2 rounded ${
                  splitType === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select Members</label>
          <div className="grid grid-cols-2 gap-2">
            {members.map(member => (
              <label key={member.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => handleMemberToggle(member.id)}
                  className="w-4 h-4"
                />
                <span>{member.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Split Details */}
        {splitType !== SplitType.EQUAL && (
          <div className="bg-gray-50 p-4 rounded">
            <h5 className="font-medium mb-3">
              {splitType === SplitType.PERCENTAGE && 'Percentage Split'}
              {splitType === SplitType.CUSTOM && 'Custom Amounts'}
              {splitType === SplitType.SHARES && 'Share Ratios'}
            </h5>
            {customSplits.map(split => {
              const member = members.find(m => m.id === split.user_id);
              if (!member) return null;
              
              return (
                <div key={split.user_id} className="flex items-center gap-3 mb-2">
                  <span className="w-32">{member.name}</span>
                  {splitType === SplitType.PERCENTAGE && (
                    <input
                      type="number"
                      step="0.01"
                      value={split.percentage || 0}
                      onChange={(e) => handleCustomSplitChange(split.user_id, 'percentage', parseFloat(e.target.value))}
                      className="w-24 p-2 border rounded"
                      placeholder="%"
                    />
                  )}
                  {splitType === SplitType.CUSTOM && (
                    <input
                      type="number"
                      step="0.01"
                      value={split.amount || 0}
                      onChange={(e) => handleCustomSplitChange(split.user_id, 'amount', parseFloat(e.target.value))}
                      className="w-24 p-2 border rounded"
                      placeholder="Amount"
                    />
                  )}
                  {splitType === SplitType.SHARES && (
                    <input
                      type="number"
                      value={split.shares || 1}
                      onChange={(e) => handleCustomSplitChange(split.user_id, 'shares', parseInt(e.target.value))}
                      className="w-24 p-2 border rounded"
                      placeholder="Shares"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Preview */}
        {amount && calculatedSplits.length > 0 && (
          <div className="mt-4 bg-blue-50 p-4 rounded">
            <h5 className="font-medium mb-2">Split Preview</h5>
            {calculatedSplits.map(split => {
              const member = members.find(m => m.id === split.user_id);
              return (
                <div key={split.user_id} className="flex justify-between text-sm">
                  <span>{member?.name}</span>
                  <span className="font-medium">${split.amount?.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Add Expense
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
