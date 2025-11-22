import { Request, Response } from 'express';
import pool from '../db';
import { AppError } from '../middleware/error.middleware';
import jwt from 'jsonwebtoken';
import { sendInviteEmail } from '../services/email.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const createTrip = async (req: Request, res: Response) => {
  const { name, description, start_date, end_date, currency } = req.body;
  const userId = parseInt((req as any).user.id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create Trip
    const tripResult = await client.query(
      `INSERT INTO trips (name, description, start_date, end_date, currency, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, start_date, end_date, currency || 'USD', userId]
    );
    const trip = tripResult.rows[0];

    // Add Creator as Admin
    await client.query(
      `INSERT INTO trip_members (trip_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [trip.id, userId]
    );

    await client.query('COMMIT');
    res.status(201).json({ status: 'success', data: trip });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getTrips = async (req: Request, res: Response) => {
  const userId = parseInt((req as any).user.id);
  const result = await pool.query(
    `SELECT t.*, tm.role 
     FROM trips t
     JOIN trip_members tm ON t.id = tm.trip_id
     WHERE tm.user_id = $1
     ORDER BY t.created_at DESC`,
    [userId]
  );
  res.json({ status: 'success', data: result.rows });
};

export const getTrip = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = parseInt((req as any).user.id);

  const result = await pool.query(
    `SELECT t.*, tm.role 
     FROM trips t
     JOIN trip_members tm ON t.id = tm.trip_id
     WHERE t.id = $1 AND tm.user_id = $2`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Trip not found or access denied', 404);
  }

  res.json({ status: 'success', data: result.rows[0] });
};

export const updateTrip = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, start_date, end_date, currency } = req.body;
  const userId = parseInt((req as any).user.id);

  // Check if user is admin
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
    throw new AppError('Not authorized to update this trip', 403);
  }

  const result = await pool.query(
    `UPDATE trips SET name = $1, description = $2, start_date = $3, end_date = $4, currency = $5
     WHERE id = $6 RETURNING *`,
    [name, description, start_date, end_date, currency, id]
  );

  res.json({ status: 'success', data: result.rows[0] });
};

export const deleteTrip = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = parseInt((req as any).user.id);

  // Check if user is admin
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
    throw new AppError('Not authorized to delete this trip', 403);
  }

  await pool.query('DELETE FROM trips WHERE id = $1', [id]);
  res.status(204).send();
};

export const addMember = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email } = req.body;
  const userId = parseInt((req as any).user.id);

  // Check if requester is admin
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
    throw new AppError('Not authorized to add members', 403);
  }

  // Get Trip Name for email
  const tripResult = await pool.query('SELECT name FROM trips WHERE id = $1', [id]);
  if (tripResult.rows.length === 0) {
     throw new AppError('Trip not found', 404);
  }
  const tripName = tripResult.rows[0].name;

  // Generate Invite Link for email
  const token = jwt.sign({ tripId: id, inviterId: userId }, JWT_SECRET, { expiresIn: '7d' });
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${baseUrl}/join?token=${token}`;

  // Find user by email
  const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  
  if (userResult.rows.length > 0) {
    // User exists, add them directly
    const newMemberId = userResult.rows[0].id;
    try {
      await pool.query(
        `INSERT INTO trip_members (trip_id, user_id, role) VALUES ($1, $2, 'member')`,
        [id, newMemberId]
      );
      
      // Send email notification
      await sendInviteEmail(email, tripName, link);

      res.status(201).json({ status: 'success', message: 'Member added and email sent' });
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new AppError('User is already a member', 400);
      }
      throw error;
    }
  } else {
    // User does not exist, send invite email
    await sendInviteEmail(email, tripName, link);
    res.status(200).json({ status: 'success', message: 'User not found, but invite email sent' });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  const { id, userId: memberId } = req.params;
  const userId = parseInt((req as any).user.id);

  // Check if requester is admin
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
    throw new AppError('Not authorized to remove members', 403);
  }

  await pool.query('DELETE FROM trip_members WHERE trip_id = $1 AND user_id = $2', [id, memberId]);
  res.status(204).send();
};

export const getTripMembers = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = parseInt((req as any).user.id);

  // Check if user is a member
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (memberCheck.rows.length === 0) {
    throw new AppError('Access denied', 403);
  }

  const result = await pool.query(
    `SELECT u.id, u.name, u.email, tm.role, tm.joined_at
     FROM trip_members tm
     JOIN users u ON tm.user_id = u.id
     WHERE tm.trip_id = $1
     ORDER BY tm.joined_at ASC`,
    [id]
  );

  res.json({ status: 'success', data: result.rows });
};

export const generateInviteLink = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = parseInt((req as any).user.id);

  // Check if requester is admin
  const memberCheck = await pool.query(
    `SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
    throw new AppError('Not authorized to generate invite link', 403);
  }

  const token = jwt.sign({ tripId: id, inviterId: userId }, JWT_SECRET, { expiresIn: '7d' });
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${baseUrl}/join?token=${token}`;

  res.json({ status: 'success', data: { link } });
};

export const joinTrip = async (req: Request, res: Response) => {
  const { token } = req.body;
  const userId = parseInt((req as any).user.id);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { tripId } = decoded;

    // Check if already a member
    const existingMember = await pool.query(
      'SELECT * FROM trip_members WHERE trip_id = $1 AND user_id = $2',
      [tripId, userId]
    );

    if (existingMember.rows.length > 0) {
      throw new AppError('Already a member of this trip', 400);
    }

    // Add as member
    await pool.query(
      `INSERT INTO trip_members (trip_id, user_id, role) VALUES ($1, $2, 'member')`,
      [tripId, userId]
    );

    res.json({ status: 'success', message: 'Successfully joined the trip', tripId });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new AppError('Invalid or expired invite link', 400);
    }
    throw error;
  }
};
