import api from './api';
import type { Expense, CreateExpenseData, UserSummary } from '../types/expense';

export const expenseApi = {
  // Get all expenses for a trip
  getExpenses: async (tripId: number): Promise<Expense[]> => {
    const response = await api.get(`/trips/${tripId}/expenses`);
    return response.data.data;
  },

  // Get a single expense
  getExpense: async (tripId: number, expenseId: number): Promise<Expense> => {
    const response = await api.get(`/trips/${tripId}/expenses/${expenseId}`);
    return response.data.data;
  },

  // Create a new expense
  createExpense: async (tripId: number, data: CreateExpenseData): Promise<Expense> => {
    const response = await api.post(`/trips/${tripId}/expenses`, data);
    return response.data.data;
  },

  // Update an expense
  updateExpense: async (tripId: number, expenseId: number, data: CreateExpenseData): Promise<Expense> => {
    const response = await api.put(`/trips/${tripId}/expenses/${expenseId}`, data);
    return response.data.data;
  },

  // Delete an expense
  deleteExpense: async (tripId: number, expenseId: number): Promise<void> => {
    await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
  },

  // Get user summary (balance information)
  getUserSummary: async (tripId: number, userId: number): Promise<UserSummary> => {
    const response = await api.get(`/trips/${tripId}/user-summary/${userId}`);
    return response.data.data;
  }
};
