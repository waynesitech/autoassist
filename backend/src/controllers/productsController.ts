import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all products
export const getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY id';

    const [rows] = await pool.query(query, params) as any;
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]) as any;

    if (rows.length === 0) {
      const error: AppError = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new product
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, price, category, image, stock } = req.body;

    if (!name || price === undefined || !category || !image || stock === undefined) {
      const error: AppError = new Error('Missing required fields: name, price, category, image, stock');
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, price, category, image, stock) VALUES (?, ?, ?, ?, ?)',
      [name, price, category, image, stock]
    ) as any;

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]) as any;

    res.status(201).json(products[0]);
  } catch (error) {
    next(error);
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);
    const { name, price, category, image, stock } = req.body;

    // Check if product exists
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]) as any;
    if (existing.length === 0) {
      const error: AppError = new Error('Product not found');
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
    if (price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(price);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(image);
    }
    if (stock !== undefined) {
      updateFields.push('stock = ?');
      updateValues.push(stock);
    }

    if (updateFields.length === 0) {
      const error: AppError = new Error('No fields to update');
      error.statusCode = 400;
      throw error;
    }

    updateValues.push(productId);

    await pool.query(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]) as any;

    res.json(products[0]);
  } catch (error) {
    next(error);
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);

    // Check if product exists
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]) as any;
    if (existing.length === 0) {
      const error: AppError = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    await pool.query('DELETE FROM products WHERE id = ?', [productId]);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

