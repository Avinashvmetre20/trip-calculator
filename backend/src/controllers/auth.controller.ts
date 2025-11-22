import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { sendActivationEmail } from '../services/email.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    
    // Generate 6-digit OTP
    const activationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with is_active=false
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, name, is_active, activation_token, activation_otp, activation_expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, name, created_at',
      [email, passwordHash, name, false, activationToken, activationOtp, expiresAt]
    );

    const user = newUser.rows[0];

    // Generate activation link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const activationLink = `${baseUrl}/activate/${activationToken}`;

    // Send activation email with both link and OTP
    await sendActivationEmail(email, name || 'User', activationLink, activationOtp);

    logger.info(`User registered: ${email}, activation email sent`);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! Please check your email to activate your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Check user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is activated
    if (!user.is_active) {
      throw new AppError('Please activate your account first. Check your email for the activation link.', 403);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    logger.info(`User logged in: ${email}`);

    res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const activateAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new AppError('Activation token is required', 400);
    }

    // Find user by activation token
    const result = await pool.query(
      'SELECT * FROM users WHERE activation_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired activation token', 400);
    }

    const user = result.rows[0];

    // Check if already activated
    if (user.is_active) {
      return res.json({
        status: 'success',
        message: 'Account is already activated. You can log in now.',
      });
    }

    // Check expiration
    if (user.activation_expires_at && new Date() > new Date(user.activation_expires_at)) {
      throw new AppError('Activation link has expired. Please request a new one.', 400);
    }

    // Activate account
    await pool.query(
      'UPDATE users SET is_active = $1, activation_token = NULL, activation_otp = NULL, activation_expires_at = NULL WHERE id = $2',
      [true, user.id]
    );

    logger.info(`Account activated via link: ${user.email}`);

    res.json({
      status: 'success',
      message: 'Account activated successfully! You can now log in.',
    });
  } catch (err) {
    next(err);
  }
};

export const activateWithOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400);
    }

    // Find user by email and OTP
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND activation_otp = $2',
      [email, otp]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid OTP or email', 400);
    }

    const user = result.rows[0];

    // Check if already activated
    if (user.is_active) {
      return res.json({
        status: 'success',
        message: 'Account is already activated. You can log in now.',
      });
    }

    // Check expiration
    if (!user.activation_expires_at || new Date() > new Date(user.activation_expires_at)) {
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    // Activate account
    await pool.query(
      'UPDATE users SET is_active = $1, activation_token = NULL, activation_otp = NULL, activation_expires_at = NULL WHERE id = $2',
      [true, user.id]
    );

    logger.info(`Account activated via OTP: ${user.email}`);

    res.json({
      status: 'success',
      message: 'Account activated successfully! You can now log in.',
    });
  } catch (err) {
    next(err);
  }
};


export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const result = await pool.query('SELECT id, email, name, created_at FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      user,
    });
  } catch (err) {
    next(err);
  }
};
