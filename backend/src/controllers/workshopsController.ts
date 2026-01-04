import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all workshops
export const getAllWorkshops = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM workshops ORDER BY id');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Get workshop by ID
export const getWorkshopById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workshopId = parseInt(req.params.id);

    const [rows] = await pool.query('SELECT * FROM workshops WHERE id = ?', [workshopId]) as any;

    if (rows.length === 0) {
      const error: AppError = new Error('Workshop not found');
      error.statusCode = 404;
      throw error;
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new workshop
export const createWorkshop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, rating, location, icon, image } = req.body;

    if (!name || rating === undefined || !location || !icon) {
      const error: AppError = new Error('Missing required fields: name, rating, location, icon');
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.query(
      'INSERT INTO workshops (name, rating, location, icon, image) VALUES (?, ?, ?, ?, ?)',
      [name, rating, location, icon, image || null]
    ) as any;

    const [workshops] = await pool.query('SELECT * FROM workshops WHERE id = ?', [result.insertId]) as any;

    res.status(201).json(workshops[0]);
  } catch (error) {
    next(error);
  }
};

// Update workshop
export const updateWorkshop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workshopId = parseInt(req.params.id);
    const { name, rating, location, icon, image } = req.body;

    // Check if workshop exists
    const [existing] = await pool.query('SELECT id FROM workshops WHERE id = ?', [workshopId]) as any;
    if (existing.length === 0) {
      const error: AppError = new Error('Workshop not found');
      error.statusCode = 404;
      throw error;
    }

    // Build update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }
    if (icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(icon);
    }
    if (image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(image || null);
    }

    if (updateFields.length === 0) {
      const error: AppError = new Error('No fields to update');
      error.statusCode = 400;
      throw error;
    }

    updateValues.push(workshopId);

    await pool.query(
      `UPDATE workshops SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [workshops] = await pool.query('SELECT * FROM workshops WHERE id = ?', [workshopId]) as any;

    res.json(workshops[0]);
  } catch (error) {
    next(error);
  }
};

// Delete workshop
export const deleteWorkshop = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workshopId = parseInt(req.params.id);

    // Check if workshop exists
    const [existing] = await pool.query('SELECT id FROM workshops WHERE id = ?', [workshopId]) as any;
    if (existing.length === 0) {
      const error: AppError = new Error('Workshop not found');
      error.statusCode = 404;
      throw error;
    }

    await pool.query('DELETE FROM workshops WHERE id = ?', [workshopId]);

    res.json({ success: true, message: 'Workshop deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get available images from mobile/assets/img/
export const getAvailableImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use process.cwd() to get the current working directory (project root)
    // This is more reliable than using __dirname which changes based on compilation
    const projectRoot = process.cwd();
    
    // Try multiple possible paths
    const possiblePaths = [
      path.join(projectRoot, 'mobile/assets/img'), // If running from project root
      path.join(projectRoot, '../mobile/assets/img'), // If running from backend directory
      path.join(__dirname, '../../../../mobile/assets/img'), // Fallback: relative from controllers
    ];
    
    let imagesPath: string | null = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        imagesPath = testPath;
        break;
      }
    }
    
    // If no path found, return empty array
    if (!imagesPath) {
      console.log('Images directory not found. Tried paths:', possiblePaths);
      res.json([]);
      return;
    }
    
    console.log('Found images directory at:', imagesPath);

    // Read directory and filter for image files
    const files = fs.readdirSync(imagesPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const imageFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(file => ({
        filename: file,
        path: `/mobile/assets/img/${file}`,
        url: `/static/mobile/assets/img/${file}` // Relative path for serving static files
      }));

    res.json(imageFiles);
  } catch (error) {
    next(error);
  }
};

