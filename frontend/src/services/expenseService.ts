import api from './api';
import type { Expense, CreateExpenseData } from '../types/expense';

export const expenseService = {
  createExpense: async (tripId: number, data: CreateExpenseData) => {
    const response = await api.post(`/trips/${tripId}/expenses`, data);
    return response.data;
  },

  getExpenses: async (tripId: number, filters?: {
    category?: string;
    payer_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.payer_id) params.append('payer_id', filters.payer_id.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await api.get(`/trips/${tripId}/expenses?${params.toString()}`);
    return response.data.data as Expense[];
  },

  getExpense: async (tripId: number, expenseId: number) => {
    const response = await api.get(`/trips/${tripId}/expenses/${expenseId}`);
    return response.data.data as Expense;
  },

  updateExpense: async (tripId: number, expenseId: number, data: CreateExpenseData) => {
    const response = await api.put(`/trips/${tripId}/expenses/${expenseId}`, data);
    return response.data;
  },

  deleteExpense: async (tripId: number, expenseId: number) => {
    await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
  },
};
