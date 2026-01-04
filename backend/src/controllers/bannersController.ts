import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all active banners
export const getBanners = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, subtitle, image, link_url, display_order FROM banner_sliders WHERE is_active = TRUE ORDER BY display_order ASC, id ASC'
    ) as any;
    
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

