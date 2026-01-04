import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import { AppError } from '../middleware/errorHandler.js';

// Admin login
export const adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error: AppError = new Error('Missing required fields: email, password');
      error.statusCode = 400;
      throw error;
    }

    // Find admin by email
    const [admins] = await pool.query('SELECT * FROM admin WHERE email = ?', [email]) as any;

    if (admins.length === 0) {
      const error: AppError = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const admin = admins[0];

    // Check if admin is active
    if (!admin.is_active) {
      const error: AppError = new Error('Admin account is deactivated');
      error.statusCode = 403;
      throw error;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      const error: AppError = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Update last login
    await pool.query('UPDATE admin SET last_login = NOW() WHERE id = ?', [admin.id]);

    // Return admin data without password
    const { password: _, ...adminWithoutPassword } = admin;
    res.json({ success: true, admin: adminWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// Get all admins
export const getAllAdmins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, role, is_active, created_at, updated_at, last_login FROM admin ORDER BY created_at DESC'
    ) as any;
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Get admin by ID
export const getAdminById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = parseInt(req.params.id);

    const [rows] = await pool.query(
      'SELECT id, email, name, role, is_active, created_at, updated_at, last_login FROM admin WHERE id = ?',
      [adminId]
    ) as any;

    if (rows.length === 0) {
      const error: AppError = new Error('Admin not found');
      error.statusCode = 404;
      throw error;
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new admin
export const createAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      const error: AppError = new Error('Missing required fields: email, password, name');
      error.statusCode = 400;
      throw error;
    }

    // Check if admin already exists
    const [existingAdmins] = await pool.query('SELECT id FROM admin WHERE email = ?', [email]) as any;
    if (existingAdmins.length > 0) {
      const error: AppError = new Error('Admin with this email already exists');
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin
    const [result] = await pool.query(
      'INSERT INTO admin (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role || 'admin']
    ) as any;

    // Get the created admin (without password)
    const [admins] = await pool.query(
      'SELECT id, email, name, role, is_active, created_at, updated_at, last_login FROM admin WHERE id = ?',
      [result.insertId]
    ) as any;

    res.status(201).json(admins[0]);
  } catch (error) {
    next(error);
  }
};

// Update admin
export const updateAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = parseInt(req.params.id);
    const { name, email, role, is_active, password } = req.body;

    if (!name || !email) {
      const error: AppError = new Error('Missing required fields: name, email');
      error.statusCode = 400;
      throw error;
    }

    // Check if admin exists
    const [existingAdmins] = await pool.query('SELECT * FROM admin WHERE id = ?', [adminId]) as any;
    if (existingAdmins.length === 0) {
      const error: AppError = new Error('Admin not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if email is already taken by another admin
    const [emailCheck] = await pool.query('SELECT id FROM admin WHERE email = ? AND id != ?', [email, adminId]) as any;
    if (emailCheck.length > 0) {
      const error: AppError = new Error('Email already in use by another admin');
      error.statusCode = 400;
      throw error;
    }

    // Build update query
    let updateFields = ['name = ?', 'email = ?'];
    let updateValues: any[] = [name, email];

    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    // Update password if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    updateValues.push(adminId);

    await pool.query(
      `UPDATE admin SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated admin (without password)
    const [admins] = await pool.query(
      'SELECT id, email, name, role, is_active, created_at, updated_at, last_login FROM admin WHERE id = ?',
      [adminId]
    ) as any;

    res.json(admins[0]);
  } catch (error) {
    next(error);
  }
};

// Delete admin
export const deleteAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = parseInt(req.params.id);

    // Check if admin exists
    const [existingAdmins] = await pool.query('SELECT id FROM admin WHERE id = ?', [adminId]) as any;
    if (existingAdmins.length === 0) {
      const error: AppError = new Error('Admin not found');
      error.statusCode = 404;
      throw error;
    }

    await pool.query('DELETE FROM admin WHERE id = ?', [adminId]);

    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    next(error);
  }
};

