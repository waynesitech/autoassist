import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all transactions
export const getAllTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, status, userId } = req.query;
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (userId) {
      query += ' AND user_id = ?';
      params.push(parseInt(userId as string));
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const [rows] = await pool.query(query, params) as any;
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Get transaction by ID
export const getTransactionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transactionId = req.params.id;
    console.log('Getting transaction by ID:', transactionId);

    // Get transaction with quotation details if it's a quotation
    const [rows] = await pool.query(
      `SELECT t.*, q.quote_type as quoteType, q.admin_message as adminMessage, q.workshop_id as workshopId
       FROM transactions t
       LEFT JOIN quotations q ON t.id = q.transaction_id
       WHERE t.id = ?`,
      [transactionId]
    ) as any;

    console.log('Query result rows:', rows.length);

    if (rows.length === 0) {
      const error: AppError = new Error('Transaction not found');
      error.statusCode = 404;
      throw error;
    }

    const transaction = rows[0];
    // Convert quoteType to lowercase if it exists
    if (transaction.quoteType) {
      transaction.quoteType = transaction.quoteType.toLowerCase();
    }

    console.log('Sending transaction response:', transaction.id);
    res.json(transaction);
  } catch (error) {
    console.error('Error in getTransactionById:', error);
    next(error);
  }
};

// Create new transaction
export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, title, amount, userId } = req.body;

    if (!type || !title || amount === undefined) {
      const error: AppError = new Error('Missing required fields: type, title, amount');
      error.statusCode = 400;
      throw error;
    }

    const id = `TX${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    const status = 'pending';

    await pool.query(
      'INSERT INTO transactions (id, type, title, date, amount, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, type, title, date, amount, status, userId || null]
    );

    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]) as any;
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Update transaction
export const updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transactionId = req.params.id;
    const { type, title, amount, status, date } = req.body;

    // Check if transaction exists
    const [existing] = await pool.query('SELECT id FROM transactions WHERE id = ?', [transactionId]) as any;
    if (existing.length === 0) {
      const error: AppError = new Error('Transaction not found');
      error.statusCode = 404;
      throw error;
    }

    // Build update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (amount !== undefined) {
      updateFields.push('amount = ?');
      updateValues.push(amount);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (date !== undefined) {
      updateFields.push('date = ?');
      updateValues.push(date);
    }

    if (updateFields.length === 0) {
      const error: AppError = new Error('No fields to update');
      error.statusCode = 400;
      throw error;
    }

    updateValues.push(transactionId);

    await pool.query(
      `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [transactionId]) as any;

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Delete transaction
export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transactionId = req.params.id;

    // Check if transaction exists
    const [existing] = await pool.query('SELECT id FROM transactions WHERE id = ?', [transactionId]) as any;
    if (existing.length === 0) {
      const error: AppError = new Error('Transaction not found');
      error.statusCode = 404;
      throw error;
    }

    await pool.query('DELETE FROM transactions WHERE id = ?', [transactionId]);

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Create towing request
export const createTowingRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workshopId, workshopName, amount, pickup, destination, userId } = req.body;

    if (!workshopId || !workshopName || amount === undefined || !pickup || !destination) {
      const error: AppError = new Error('Missing required fields: workshopId, workshopName, amount, pickup, destination');
      error.statusCode = 400;
      throw error;
    }

    const id = `TX${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    const status = 'pending';
    const title = `Towing to ${workshopName} from ${pickup} to ${destination}`;

    // Insert into transactions table
    await pool.query(
      'INSERT INTO transactions (id, type, title, date, amount, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, 'Towing', title, date, amount, status, userId || null]
    );

    // Insert into towing_requests table
    await pool.query(
      `INSERT INTO towing_requests (transaction_id, user_id, workshop_id, pickup, destination, amount, status, date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId || null, workshopId, pickup, destination, amount, status, date]
    );

    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]) as any;
    res.status(201).json({ success: true, transaction: rows[0] });
  } catch (error) {
    next(error);
  }
};

// Create quotation
export const createQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, model, year, engine, chassis, description, quoteType, images, workshopId, amount, userId } = req.body;

    if (!type || !model || !year || !engine || !chassis || amount === undefined) {
      const error: AppError = new Error('Missing required fields: type, model, year, engine, chassis, amount');
      error.statusCode = 400;
      throw error;
    }

    if (!workshopId) {
      const error: AppError = new Error('Workshop ID is required');
      error.statusCode = 400;
      throw error;
    }

    const id = `TX${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    const status = 'pending';

    // Insert into transactions table
    await pool.query(
      'INSERT INTO transactions (id, type, title, date, amount, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, 'Quotation', `${type} Quote: ${model}`, date, amount, status, userId || null]
    );

    // Insert into quotations table
    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null;
    await pool.query(
      `INSERT INTO quotations (transaction_id, user_id, workshop_id, model, year, engine, chassis, description, quote_type, images, amount, status, date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId || null, workshopId, model, year, engine, chassis, description || null, quoteType || 'brief', imagesJson, amount, status, date]
    );

    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]) as any;
    res.status(201).json({ success: true, transaction: rows[0] });
  } catch (error) {
    next(error);
  }
};

// Checkout (create shop transaction)
export const checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cart, workshop, total, userId } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0 || total === undefined) {
      const error: AppError = new Error('Missing required fields: cart, total');
      error.statusCode = 400;
      throw error;
    }

    if (!workshop || !workshop.id) {
      const error: AppError = new Error('Workshop is required');
      error.statusCode = 400;
      throw error;
    }

    const id = `TX${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    const status = 'pending';
    const title = `${cart.length} Item${cart.length > 1 ? 's' : ''} Order at ${workshop.name}`;

    // Insert into transactions table
    await pool.query(
      'INSERT INTO transactions (id, type, title, date, amount, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, 'Shop', title, date, total, status, userId || null]
    );

    // Insert into shop_orders table
    const [orderResult] = await pool.query(
      `INSERT INTO shop_orders (transaction_id, user_id, workshop_id, total, status, date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId || null, workshop.id, total, status, date]
    ) as any;
    const orderId = orderResult.insertId;

    // Insert into shop_order_items table for each cart item
    for (const item of cart) {
      const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      const subtotal = itemPrice * item.quantity;
      
      await pool.query(
        `INSERT INTO shop_order_items (order_id, product_id, product_name, product_price, quantity, subtotal) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.id, item.name, itemPrice, item.quantity, subtotal]
      );
    }

    // Clear cart_items for this user after successful checkout (cart is now an order)
    if (userId) {
      await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    }

    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]) as any;
    res.status(201).json({ success: true, transaction: rows[0] });
  } catch (error) {
    next(error);
  }
};

