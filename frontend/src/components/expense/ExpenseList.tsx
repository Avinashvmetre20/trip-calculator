import { useState } from 'react';
import type { Expense } from '../../types/expense';
import { Trash2, Edit2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: number) => void;
  currentUserId?: number;
  currentUserRole?: string;
}

const ExpenseList = ({ expenses, onEdit, onDelete, currentUserId, currentUserRole }: ExpenseListProps) => {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Check if current user can modify an expense
  const canModifyExpense = (expense: Expense): boolean => {
    if (!currentUserId) return false;
    return expense.payer_id === currentUserId || currentUserRole === 'admin';
  };

  const handleDelete = (id: number) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No expenses yet. Add your first expense above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map(expense => {
        const canModify = canModifyExpense(expense);
        
        return (
          <div key={expense.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-lg">{expense.title}</h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {expense.category}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Amount:</span> ${Number(expense.amount).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Paid by:</span> {expense.payer_name || 'Unknown'}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {new Date(expense.expense_date).toLocaleDateString()}
                  </p>
                  {expense.notes && (
                    <p className="text-gray-500 italic">{expense.notes}</p>
                  )}
                </div>

                {expense.splits && expense.splits.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium text-gray-500 mb-2">Split among {expense.splits.length} people:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {expense.splits.map(split => (
                        <div key={split.id} className="flex justify-between">
                          <span className="text-gray-600">{split.user_name}</span>
                          <span className="font-medium">${Number(split.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {canModify && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onEdit(expense)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className={`p-2 rounded ${
                      deleteConfirm === expense.id
                        ? 'bg-red-600 text-white'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                    title={deleteConfirm === expense.id ? 'Click again to confirm' : 'Delete'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExpenseList;
