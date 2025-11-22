import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTrip } from '../../services/tripService';
import { expenseService } from '../../services/expenseService';
import type { Trip } from '../../types/trip';
import type { Expense, CreateExpenseData } from '../../types/expense';
import { Calendar, DollarSign, Users, Plus } from 'lucide-react';
import MembersList from '../../components/trip/MembersList';
import ExpenseForm from '../../components/expense/ExpenseForm';
import ExpenseList from '../../components/expense/ExpenseList';
import UserBalanceSummary from '../../components/expense/UserBalanceSummary';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const fetchTripData = async () => {
    try {
      if (id) {
        const tripData = await getTrip(parseInt(id));
        setTrip(tripData);
        const membersRes = await api.get(`/trips/${id}/members`);
        setMembers(membersRes.data.data);
        const expensesData = await expenseService.getExpenses(parseInt(id));
        setExpenses(expensesData);
      }
    } catch (err) {
      setError('Failed to load trip details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, [id]);

  const handleAddExpense = async (data: CreateExpenseData) => {
    try {
      if (id) {
        await expenseService.createExpense(parseInt(id), data);
        setShowExpenseForm(false);
        fetchTripData();
      }
    } catch (err) {
      console.error('Failed to create expense:', err);
      alert('Failed to create expense');
    }
  };

  const handleEditExpense = async (data: CreateExpenseData) => {
    try {
      if (id && editingExpense) {
        await expenseService.updateExpense(parseInt(id), editingExpense.id, data);
        setEditingExpense(null);
        fetchTripData();
      }
    } catch (err) {
      console.error('Failed to update expense:', err);
      alert('Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    try {
      if (id) {
        await expenseService.deleteExpense(parseInt(id), expenseId);
        fetchTripData();
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
      alert('Failed to delete expense');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading trip details...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!trip) return <div className="p-8 text-center">Trip not found</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
        <p className="text-gray-600 mb-4">{trip.description}</p>
        <div className="flex flex-wrap gap-6 text-gray-600 mb-4">
          <div className="flex items-center">
            <Calendar className="mr-2" size={20} />
            <span>
              {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'TBD'}{' - '}{trip.end_date ? new Date(trip.end_date).toLocaleDateString() : 'TBD'}
            </span>
          </div>
          <div className="flex items-center">
            <DollarSign className="mr-2" size={20} />
            <span>{trip.currency}</span>
          </div>
          <div className="flex items-center">
            <Users className="mr-2" size={20} />
            <span className="capitalize">{trip.role}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Expenses</h2>
              {!showExpenseForm && !editingExpense && (
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Add Expense
                </button>
              )}
            </div>

            {(showExpenseForm || editingExpense) && (
              <div className="mb-6">
                <ExpenseForm
                  tripId={trip.id}
                  members={members}
                  onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
                  onCancel={() => {
                    setShowExpenseForm(false);
                    setEditingExpense(null);
                  }}
                  initialData={editingExpense}
                />
              </div>
            )}

            <ExpenseList
              expenses={expenses}
              onEdit={(expense) => {
                setEditingExpense(expense);
                setShowExpenseForm(false);
              }}
              onDelete={handleDeleteExpense}
              currentUserId={user?.id}
              currentUserRole={trip.role}
            />
          </div>
        </div>
        <div className="space-y-6">
          <MembersList
            tripId={trip.id}
            members={members}
            onUpdate={fetchTripData}
            currentUserRole={trip.role}
          />
          <UserBalanceSummary
            tripId={trip.id}
            userId={user?.id}
          />
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
