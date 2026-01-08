import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import usersRoutes from './routes/usersRoutes.js';
import workshopsRoutes from './routes/workshopsRoutes.js';
import productsRoutes from './routes/productsRoutes.js';
import transactionsRoutes from './routes/transactionsRoutes.js';
import vehiclesRoutes from './routes/vehiclesRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import bannersRoutes from './routes/bannersRoutes.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from project root
// This allows URLs like /static/mobile/assets/img/... to work
// Use the same path resolution logic as the controller
const projectRoot = process.cwd();
const possibleStaticPaths = [
  projectRoot, // If running from project root
  path.join(projectRoot, '..'), // If running from backend directory
  path.join(__dirname, '../..'), // Fallback: relative from server
];

let staticPath: string | null = null;
for (const testPath of possibleStaticPaths) {
  // Check if mobile/assets directory exists in this path
  const testAssetsPath = path.join(testPath, 'mobile/assets');
  if (fs.existsSync(testAssetsPath)) {
    staticPath = testPath;
    break;
  }
}

if (staticPath) {
  console.log('Serving static files from project root:', staticPath);
  app.use('/static', express.static(staticPath));
} else {
  console.warn('Project root not found. Tried paths:', possibleStaticPaths);
}

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'AutoAssist Backend API',
    version: '1.0.0',
    status: 'running',
      endpoints: {
      health: '/api/health',
      users: '/api/users',
      workshops: '/api/workshops',
      products: '/api/products',
      transactions: '/api/transactions',
      banners: '/api/banners',
      documentation: 'See README.md for full API documentation'
    }
  });
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const pool = (await import('./config/database.js')).default;
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// API Routes
// Mount nested routes first to avoid conflicts
app.use('/api/users', vehiclesRoutes);
app.use('/api/users', notificationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/workshops', workshopsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannersRoutes);

// Legacy endpoints for backward compatibility
// Note: /api/workshops is now handled by workshopsRoutes, so this is removed to avoid conflicts

app.get('/api/transactions', async (req, res, next) => {
  const { getAllTransactions } = await import('./controllers/transactionsController.js');
  getAllTransactions(req, res, next);
});

app.get('/api/transactions/:id', async (req, res, next) => {
  const { getTransactionById } = await import('./controllers/transactionsController.js');
  getTransactionById(req, res, next);
});

app.post('/api/transactions', async (req, res, next) => {
  const { createTransaction } = await import('./controllers/transactionsController.js');
  createTransaction(req, res, next);
});

app.post('/api/towing', async (req, res, next) => {
  const { createTowingRequest } = await import('./controllers/transactionsController.js');
  createTowingRequest(req, res, next);
});

app.post('/api/quotation', async (req, res, next) => {
  const { createQuotation } = await import('./controllers/transactionsController.js');
  createQuotation(req, res, next);
});

app.post('/api/checkout', async (req, res, next) => {
  const { checkout } = await import('./controllers/transactionsController.js');
  checkout(req, res, next);
});

app.get('/api/products', async (req, res, next) => {
  const { getAllProducts } = await import('./controllers/productsController.js');
  getAllProducts(req, res, next);
});

app.get('/api/banners', async (req, res, next) => {
  const { getBanners } = await import('./controllers/bannersController.js');
  getBanners(req, res, next);
});

app.post('/api/register', async (req, res, next) => {
  const { register } = await import('./controllers/usersController.js');
  register(req, res, next);
});

app.post('/api/login', async (req, res, next) => {
  const { login } = await import('./controllers/usersController.js');
  login(req, res, next);
});

app.put('/api/users/:id', async (req, res, next) => {
  const { updateUser } = await import('./controllers/usersController.js');
  updateUser(req, res, next);
});

app.get('/api/users/:userId/vehicles', async (req, res, next) => {
  const { getUserVehicles } = await import('./controllers/vehiclesController.js');
  getUserVehicles(req, res, next);
});

app.post('/api/users/:userId/vehicles', async (req, res, next) => {
  const { createVehicle } = await import('./controllers/vehiclesController.js');
  createVehicle(req, res, next);
});

app.put('/api/users/:userId/vehicles/:vehicleId', async (req, res, next) => {
  const { updateVehicle } = await import('./controllers/vehiclesController.js');
  updateVehicle(req, res, next);
});

app.delete('/api/users/:userId/vehicles/:vehicleId', async (req, res, next) => {
  const { deleteVehicle } = await import('./controllers/vehiclesController.js');
  deleteVehicle(req, res, next);
});

app.get('/api/users/:userId/notification-settings', async (req, res, next) => {
  const { getNotificationSettings } = await import('./controllers/notificationsController.js');
  getNotificationSettings(req, res, next);
});

app.put('/api/users/:userId/notification-settings', async (req, res, next) => {
  const { updateNotificationSettings } = await import('./controllers/notificationsController.js');
  updateNotificationSettings(req, res, next);
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on http://autoassist.com.my:${PORT}`);
      console.log(`🌐 Server accessible on network at http://0.0.0.0:${PORT}`);
      console.log(`📡 API endpoints available at http://autoassist.com.my:${PORT}/api`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   GET    /api/health`);
      console.log(`   GET    /api/users`);
      console.log(`   POST   /api/users/register`);
      console.log(`   POST   /api/users/login`);
      console.log(`   GET    /api/workshops`);
      console.log(`   GET    /api/products`);
      console.log(`   GET    /api/transactions`);
      console.log(`\n💡 To connect from mobile device, use your computer's IP address`);
      console.log(`   Find it with: ifconfig | grep "inet " | grep -v 127.0.0.1\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

