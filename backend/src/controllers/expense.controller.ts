import { Request, Response } from 'express';
import pool from '../db';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export const createExpense = async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const { title, amount, category, payer_id, expense_date, receipt_url, notes, split_type, splits } = req.body;
  const userId = parseInt((req as any).user.id);

  // Check if user is a member of the trip
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new AppError('Not authorized to add expenses to this trip', 403);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create expense
    const expenseResult = await client.query(
      `INSERT INTO expenses (trip_id, title, amount, category, payer_id, expense_date, receipt_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tripId, title, amount, category, payer_id, expense_date, receipt_url, notes]
    );
    const expense = expenseResult.rows[0];

    // Create splits
    for (const split of splits) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, amount, split_type, percentage, shares)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [expense.id, split.user_id, split.amount, split_type, split.percentage, split.shares]
      );
    }

    await client.query('COMMIT');
    
    logger.info(`Expense created: ${expense.id} for trip ${tripId}`);
    res.status(201).json({ status: 'success', data: expense });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const { category, payer_id, start_date, end_date } = req.query;
  const userId = parseInt((req as any).user.id);

  // Check if user is a member
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new AppError('Not authorized to view expenses for this trip', 403);
  }

  let query = `
    SELECT e.*, u.name as payer_name
    FROM expenses e
    LEFT JOIN users u ON e.payer_id = u.id
    WHERE e.trip_id = $1
  `;
  const params: any[] = [tripId];
  let paramIndex = 2;

  if (category) {
    query += ` AND e.category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (payer_id) {
    query += ` AND e.payer_id = $${paramIndex}`;
    params.push(payer_id);
    paramIndex++;
  }

  if (start_date) {
    query += ` AND e.expense_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    query += ` AND e.expense_date <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }

  query += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

  const result = await pool.query(query, params);
  res.json({ status: 'success', data: result.rows });
};

export const getExpense = async (req: Request, res: Response) => {
  const { tripId, id } = req.params;
  const userId = parseInt((req as any).user.id);

  // Check if user is a member
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new AppError('Not authorized to view this expense', 403);
  }

  const expenseResult = await pool.query(
    `SELECT e.*, u.name as payer_name
     FROM expenses e
     LEFT JOIN users u ON e.payer_id = u.id
     WHERE e.id = $1 AND e.trip_id = $2`,
    [id, tripId]
  );

  if (expenseResult.rows.length === 0) {
    throw new AppError('Expense not found', 404);
  }

  const expense = expenseResult.rows[0];

  // Get splits
  const splitsResult = await pool.query(
    `SELECT es.*, u.name as user_name
     FROM expense_splits es
     LEFT JOIN users u ON es.user_id = u.id
     WHERE es.expense_id = $1`,
    [id]
  );

  expense.splits = splitsResult.rows;

  res.json({ status: 'success', data: expense });
};

export const updateExpense = async (req: Request, res: Response) => {
  const { tripId, id } = req.params;
  const { title, amount, category, payer_id, expense_date, receipt_url, notes, split_type, splits } = req.body;
  const userId = parseInt((req as any).user.id);

  // Check if user is a member
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new AppError('Not authorized to update this expense', 403);
  }

  // Check if user is the payer or trip admin
  const expenseCheck = await pool.query(
    `SELECT e.payer_id 
     FROM expenses e
     WHERE e.id = $1 AND e.trip_id = $2`,
    [id, tripId]
  );

  if (expenseCheck.rows.length === 0) {
    throw new AppError('Expense not found', 404);
  }

  const userRole = memberCheck.rows[0].role;
  const payerId = expenseCheck.rows[0].payer_id;
  const canModify = payerId === userId || userRole === 'admin';

  if (!canModify) {
    throw new AppError('Not authorized to modify this expense', 403);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update expense
    const expenseResult = await client.query(
      `UPDATE expenses 
       SET title = $1, amount = $2, category = $3, payer_id = $4, 
           expense_date = $5, receipt_url = $6, notes = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND trip_id = $9
       RETURNING *`,
      [title, amount, category, payer_id, expense_date, receipt_url, notes, id, tripId]
    );

    if (expenseResult.rows.length === 0) {
      throw new AppError('Expense not found', 404);
    }

    // Delete old splits
    await client.query('DELETE FROM expense_splits WHERE expense_id = $1', [id]);

    // Create new splits
    for (const split of splits) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, amount, split_type, percentage, shares)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, split.user_id, split.amount, split_type, split.percentage, split.shares]
      );
    }

    await client.query('COMMIT');
    
    logger.info(`Expense updated: ${id}`);
    res.json({ status: 'success', data: expenseResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  const { tripId, id } = req.params;
  const userId = parseInt((req as any).user.id);

  // Check if user is a member
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new AppError('Not authorized to delete this expense', 403);
  }

  // Check if user is the payer or trip admin
  const expenseCheck = await pool.query(
    `SELECT payer_id FROM expenses WHERE id = $1 AND trip_id = $2`,
    [id, tripId]
  );

  if (expenseCheck.rows.length === 0) {
    throw new AppError('Expense not found', 404);
  }

  const userRole = memberCheck.rows[0].role;
  const payerId = expenseCheck.rows[0].payer_id;
  const canModify = payerId === userId || userRole === 'admin';

  if (!canModify) {
    throw new AppError('Not authorized to delete this expense', 403);
  }

  const result = await pool.query(
    'DELETE FROM expenses WHERE id = $1 AND trip_id = $2',
    [id, tripId]
  );

  if (result.rowCount === 0) {
    throw new AppError('Expense not found', 404);
  }

  logger.info(`Expense deleted: ${id}`);
  res.status(204).send();
};

export const getUserSummary = async (req: Request, res: Response) => {
  const { tripId, userId } = req.params;
  const requestUserId = parseInt((req as any).user.id);

  // Check if requesting user is a member of the trip
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [tripId, requestUserId]
  );

  if (memberCheck.rows.length === 0) {
    throw new AppError('Not authorized to view this trip', 403);
  }

  // Calculate total amount paid by the user
  const paidResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total_paid
     FROM expenses
     WHERE trip_id = $1 AND payer_id = $2`,
    [tripId, userId]
  );

  // Calculate total amount owed by the user (their share of all expenses)
  const owedResult = await pool.query(
    `SELECT COALESCE(SUM(es.amount), 0) as total_owed
     FROM expense_splits es
     JOIN expenses e ON es.expense_id = e.id
     WHERE e.trip_id = $1 AND es.user_id = $2`,
    [tripId, userId]
  );

  const totalPaid = parseFloat(paidResult.rows[0].total_paid);
  const totalOwed = parseFloat(owedResult.rows[0].total_owed);
  const netBalance = totalPaid - totalOwed;

  // Get user details
  const userResult = await pool.query(
    `SELECT id, name, email FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const summary = {
    user: userResult.rows[0],
    total_paid: totalPaid,
    total_owed: totalOwed,
    net_balance: netBalance
  };

  res.json({ status: 'success', data: summary });
};
