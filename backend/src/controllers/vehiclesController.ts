import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all vehicles for a user
export const getUserVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);

    const [rows] = await pool.query(
      'SELECT id, model, year, chassis, engine, plate_number as plateNumber, created_at, updated_at FROM vehicles WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    ) as any;

    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Get vehicle by ID
export const getVehicleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const vehicleId = parseInt(req.params.vehicleId);

    const [rows] = await pool.query(
      'SELECT id, model, year, chassis, engine, plate_number as plateNumber, created_at, updated_at FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, userId]
    ) as any;

    if (rows.length === 0) {
      const error: AppError = new Error('Vehicle not found');
      error.statusCode = 404;
      throw error;
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new vehicle
export const createVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const { model, year, chassis, engine, plateNumber } = req.body;

    if (!model || !year || !chassis || !engine) {
      const error: AppError = new Error('Missing required fields: model, year, chassis, engine');
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.query(
      'INSERT INTO vehicles (user_id, model, year, chassis, engine, plate_number) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, model, year, chassis, engine, plateNumber || null]
    ) as any;

    const [vehicles] = await pool.query(
      'SELECT id, model, year, chassis, engine, plate_number as plateNumber, created_at, updated_at FROM vehicles WHERE id = ?',
      [result.insertId]
    ) as any;

    res.status(201).json(vehicles[0]);
  } catch (error) {
    next(error);
  }
};

// Update vehicle
export const updateVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const vehicleId = parseInt(req.params.vehicleId);
    const { model, year, chassis, engine, plateNumber } = req.body;

    if (!model || !year || !chassis || !engine) {
      const error: AppError = new Error('Missing required fields: model, year, chassis, engine');
      error.statusCode = 400;
      throw error;
    }

    // Check if vehicle exists and belongs to user
    const [existing] = await pool.query(
      'SELECT id FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, userId]
    ) as any;

    if (existing.length === 0) {
      const error: AppError = new Error('Vehicle not found');
      error.statusCode = 404;
      throw error;
    }

    await pool.query(
      'UPDATE vehicles SET model = ?, year = ?, chassis = ?, engine = ?, plate_number = ? WHERE id = ? AND user_id = ?',
      [model, year, chassis, engine, plateNumber || null, vehicleId, userId]
    );

    const [vehicles] = await pool.query(
      'SELECT id, model, year, chassis, engine, plate_number as plateNumber, created_at, updated_at FROM vehicles WHERE id = ?',
      [vehicleId]
    ) as any;

    res.json(vehicles[0]);
  } catch (error) {
    next(error);
  }
};

// Delete vehicle
export const deleteVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const vehicleId = parseInt(req.params.vehicleId);

    // Check if vehicle exists and belongs to user
    const [existing] = await pool.query(
      'SELECT id FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, userId]
    ) as any;

    if (existing.length === 0) {
      const error: AppError = new Error('Vehicle not found');
      error.statusCode = 404;
      throw error;
    }

    await pool.query('DELETE FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, userId]);

    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

