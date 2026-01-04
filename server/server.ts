import express, { Request, Response } from 'express';
import cors from 'cors';
import pool, { initializeDatabase } from './database.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Workshop, Transaction, User, CartItem } from '../types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

// Get all workshops
app.get('/api/workshops', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM workshops ORDER BY id');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching workshops:', error);
    res.status(500).json({ error: 'Failed to fetch workshops' });
  }
});

// Get all transactions
app.get('/api/transactions', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create a new transaction
app.post('/api/transactions', async (req: Request, res: Response) => {
  try {
    const { type, title, amount } = req.body;
    
    if (!type || !title || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields: type, title, amount' });
    }

    const id = `TX${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    const status = 'pending';

    await pool.query(
      'INSERT INTO transactions (id, type, title, date, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, type, title, date, amount, status]
    );

    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]) as any;
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Create towing request
app.post('/api/towing', async (req: Request, res: Response) => {
  try {
    const { workshopId, workshopName, amount, pickup, destination, userId } = req.body;
    
    if (!workshopId || !workshopName || amount === undefined || !pickup || !destination) {
      return res.status(400).json({ error: 'Missing required fields: workshopId, workshopName, amount, pickup, destination' });
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
    console.error('Error creating towing request:', error);
    res.status(500).json({ error: 'Failed to create towing request' });
  }
});

// Create quotation
app.post('/api/quotation', async (req: Request, res: Response) => {
  try {
    const { type, model, year, engine, chassis, description, quoteType, images, workshopId, amount, userId } = req.body;
    
    if (!type || !model || !year || !engine || !chassis || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields: type, model, year, engine, chassis, amount' });
    }

    if (!workshopId) {
      return res.status(400).json({ error: 'Workshop ID is required' });
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
    console.error('Error creating quotation:', error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

// Checkout (create shop transaction)
app.post('/api/checkout', async (req: Request, res: Response) => {
  try {
    const { cart, workshop, total, userId } = req.body;
    
    if (!cart || !Array.isArray(cart) || cart.length === 0 || total === undefined) {
      return res.status(400).json({ error: 'Missing required fields: cart, total' });
    }

    if (!workshop || !workshop.id) {
      return res.status(400).json({ error: 'Workshop is required' });
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
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'Failed to process checkout' });
  }
});

// Get all products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all active banners
app.get('/api/banners', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, subtitle, image, link_url, display_order FROM banner_sliders WHERE is_active = TRUE ORDER BY display_order ASC, id ASC'
    ) as any;
    res.json(rows);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// User registration
app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]) as any;
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
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
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User login
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' });
    }

    // Find user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]) as any;
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Update user profile
app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, phone, password } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Missing required fields: name, email' });
    }

    // Check if user exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]) as any;
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]) as any;
    if (emailCheck.length > 0) {
      return res.status(400).json({ error: 'Email already in use by another account' });
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

    res.json({ success: true, user: updatedUsers[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get notification settings for a user
app.get('/api/users/:userId/notification-settings', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const [rows] = await pool.query(
      'SELECT push_notifications as pushNotifications, email_notifications as emailNotifications, sms_notifications as smsNotifications, order_updates as orderUpdates, service_reminders as serviceReminders, promotions FROM notification_settings WHERE user_id = ?',
      [userId]
    ) as any;

    if (rows.length === 0) {
      // Return default settings if none exist
      res.json({
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        orderUpdates: true,
        serviceReminders: true,
        promotions: false,
      });
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

// Update notification settings for a user
app.put('/api/users/:userId/notification-settings', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { pushNotifications, emailNotifications, smsNotifications, orderUpdates, serviceReminders, promotions } = req.body;

    // Check if settings exist
    const [existing] = await pool.query(
      'SELECT id FROM notification_settings WHERE user_id = ?',
      [userId]
    ) as any;

    if (existing.length === 0) {
      // Create new settings
      await pool.query(
        'INSERT INTO notification_settings (user_id, push_notifications, email_notifications, sms_notifications, order_updates, service_reminders, promotions) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, pushNotifications ?? true, emailNotifications ?? true, smsNotifications ?? false, orderUpdates ?? true, serviceReminders ?? true, promotions ?? false]
      );
    } else {
      // Update existing settings
      await pool.query(
        'UPDATE notification_settings SET push_notifications = ?, email_notifications = ?, sms_notifications = ?, order_updates = ?, service_reminders = ?, promotions = ? WHERE user_id = ?',
        [pushNotifications ?? true, emailNotifications ?? true, smsNotifications ?? false, orderUpdates ?? true, serviceReminders ?? true, promotions ?? false, userId]
      );
    }

    const [updated] = await pool.query(
      'SELECT push_notifications as pushNotifications, email_notifications as emailNotifications, sms_notifications as smsNotifications, order_updates as orderUpdates, service_reminders as serviceReminders, promotions FROM notification_settings WHERE user_id = ?',
      [userId]
    ) as any;

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Get all vehicles for a user
app.get('/api/users/:userId/vehicles', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const [rows] = await pool.query(
      'SELECT id, model, year, chassis, engine, plate_number as plateNumber, created_at FROM vehicles WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    ) as any;
    res.json(rows);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Create a new vehicle
app.post('/api/users/:userId/vehicles', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { model, year, chassis, engine, plateNumber } = req.body;
    
    if (!model || !year || !chassis || !engine) {
      return res.status(400).json({ error: 'Missing required fields: model, year, chassis, engine' });
    }

    const [result] = await pool.query(
      'INSERT INTO vehicles (user_id, model, year, chassis, engine, plate_number) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, model, year, chassis, engine, plateNumber || null]
    ) as any;

    const [vehicles] = await pool.query(
      'SELECT id, model, year, chassis, engine, plate_number as plateNumber, created_at FROM vehicles WHERE id = ?',
      [result.insertId]
    ) as any;

    res.status(201).json(vehicles[0]);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Update a vehicle
app.put('/api/users/:userId/vehicles/:vehicleId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const vehicleId = parseInt(req.params.vehicleId);
    const { model, year, chassis, engine, plateNumber } = req.body;
    
    if (!model || !year || !chassis || !engine) {
      return res.status(400).json({ error: 'Missing required fields: model, year, chassis, engine' });
    }

    // Check if vehicle exists and belongs to user
    const [existing] = await pool.query(
      'SELECT id FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, userId]
    ) as any;

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await pool.query(
      'UPDATE vehicles SET model = ?, year = ?, chassis = ?, engine = ?, plate_number = ? WHERE id = ? AND user_id = ?',
      [model, year, chassis, engine, plateNumber || null, vehicleId, userId]
    );

    const [vehicles] = await pool.query(
      'SELECT id, model, year, chassis, engine, plate_number as plateNumber, created_at FROM vehicles WHERE id = ?',
      [vehicleId]
    ) as any;

    res.json(vehicles[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete a vehicle
app.delete('/api/users/:userId/vehicles/:vehicleId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const vehicleId = parseInt(req.params.vehicleId);

    // Check if vehicle exists and belongs to user
    const [existing] = await pool.query(
      'SELECT id FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, userId]
    ) as any;

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await pool.query(
      'DELETE FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://autoassist.com.my:${PORT}`);
  console.log(`Server accessible on network at http://0.0.0.0:${PORT}`);
  console.log(`API endpoints available at http://autoassist.com.my:${PORT}/api`);
  console.log(`\nTo connect from mobile device, use your computer's IP address:`);
  console.log(`Find it with: ifconfig | grep "inet " | grep -v 127.0.0.1`);
});
