export interface Expense {
  id: number;
  trip_id: number;
  title: string;
  amount: number;
  category: string;
  payer_id: number;
  payer_name?: string;
  expense_date: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: number;
  expense_id: number;
  user_id: number;
  user_name?: string;
  amount: number;
  split_type: SplitType;
  percentage?: number;
  shares?: number;
}

export type SplitType = 'equal' | 'percentage' | 'custom' | 'shares';

export const SplitType = {
  EQUAL: 'equal' as SplitType,
  PERCENTAGE: 'percentage' as SplitType,
  CUSTOM: 'custom' as SplitType,
  SHARES: 'shares' as SplitType
};

export interface CreateExpenseData {
  title: string;
  amount: number;
  category: string;
  payer_id: number;
  expense_date: string;
  receipt_url?: string;
  notes?: string;
  split_type: SplitType;
  splits: {
    user_id: number;
    amount?: number;
    percentage?: number;
    shares?: number;
  }[];
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Accommodation',
  'Entertainment',
  'Shopping',
  'Other'
] as const;

export interface UserSummary {
  user: {
    id: number;
    name: string;
    email: string;
  };
  total_paid: number;
  total_owed: number;
  net_balance: number;
}
