import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import { AppError } from '../middleware/errorHandler.js';

// Get all users
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, phone, created_at FROM users ORDER BY created_at DESC'
    ) as any;
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    
    const [rows] = await pool.query(
      'SELECT id, email, name, phone, created_at FROM users WHERE id = ?',
      [userId]
    ) as any;

    if (rows.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new user
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      const error: AppError = new Error('Missing required fields: email, password, name');
      error.statusCode = 400;
      throw error;
    }

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]) as any;
    if (existingUsers.length > 0) {
      const error: AppError = new Error('User with this email already exists');
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, phone || null]
    ) as any;

    // Get the created user (without password)
    const [users] = await pool.query(
      'SELECT id, email, name, phone, created_at FROM users WHERE id = ?',
      [result.insertId]
    ) as any;

    res.status(201).json(users[0]);
  } catch (error) {
    next(error);
  }
};

// Update user
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, phone, password } = req.body;

    if (!name || !email) {
      const error: AppError = new Error('Missing required fields: name, email');
      error.statusCode = 400;
      throw error;
    }

    // Check if user exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]) as any;
    if (existingUsers.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if email is already taken by another user
    const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]) as any;
    if (emailCheck.length > 0) {
      const error: AppError = new Error('Email already in use by another account');
      error.statusCode = 400;
      throw error;
    }

    // Build update query
    let updateFields = ['name = ?', 'email = ?'];
    let updateValues: any[] = [name, email];

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }

    // Update password if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    updateValues.push(userId);

    await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated user (without password)
    const [updatedUsers] = await pool.query(
      'SELECT id, email, name, phone, created_at FROM users WHERE id = ?',
      [userId]
    ) as any;

    res.json(updatedUsers[0]);
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]) as any;
    if (existingUsers.length === 0) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// User login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error: AppError = new Error('Missing required fields: email, password');
      error.statusCode = 400;
      throw error;
    }

    // Find user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]) as any;

    if (users.length === 0) {
      const error: AppError = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      const error: AppError = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// User register
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      const error: AppError = new Error('Missing required fields: email, password, name');
      error.statusCode = 400;
      throw error;
    }

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]) as any;
    if (existingUsers.length > 0) {
      const error: AppError = new Error('User with this email already exists');
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, phone || null]
    ) as any;

    // Get the created user (without password)
    const [users] = await pool.query(
      'SELECT id, email, name, phone, created_at FROM users WHERE id = ?',
      [result.insertId]
    ) as any;

    res.status(201).json({ success: true, user: users[0] });
  } catch (error) {
    next(error);
  }
};

