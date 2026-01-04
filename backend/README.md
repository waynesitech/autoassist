# AutoAssist Backend API

Backend system for AutoAssist mobile application providing CRUD operations for all modules.

## Features

- **Users Management**: Full CRUD operations for user accounts, authentication (login/register)
- **Workshops Management**: CRUD operations for workshop partners
- **Products Management**: CRUD operations for shop products
- **Transactions Management**: CRUD operations for all transaction types (Quotation, Towing, Shop)
- **Vehicles Management**: CRUD operations for user vehicles
- **Notification Settings**: Get and update user notification preferences

## Tech Stack

- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MySQL** database with connection pooling
- **bcrypt** for password hashing
- **CORS** enabled for cross-origin requests

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Database connection and initialization
│   ├── controllers/
│   │   ├── usersController.ts   # User CRUD operations
│   │   ├── workshopsController.ts # Workshop CRUD operations
│   │   ├── productsController.ts # Product CRUD operations
│   │   ├── transactionsController.ts # Transaction CRUD operations
│   │   ├── vehiclesController.ts # Vehicle CRUD operations
│   │   └── notificationsController.ts # Notification settings
│   ├── routes/
│   │   ├── usersRoutes.ts
│   │   ├── workshopsRoutes.ts
│   │   ├── productsRoutes.ts
│   │   ├── transactionsRoutes.ts
│   │   ├── vehiclesRoutes.ts
│   │   └── notificationsRoutes.ts
│   ├── middleware/
│   │   └── errorHandler.ts      # Error handling middleware
│   └── server.ts                # Main server file
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the `backend` directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=autoassist
   PORT=3002
   NODE_ENV=development
   ```

3. **Start the server:**
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Workshops
- `GET /api/workshops` - Get all workshops
- `GET /api/workshops/:id` - Get workshop by ID
- `POST /api/workshops` - Create new workshop
- `PUT /api/workshops/:id` - Update workshop
- `DELETE /api/workshops/:id` - Delete workshop

### Products
- `GET /api/products` - Get all products (optional query: `?category=categoryName`)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Transactions
- `GET /api/transactions` - Get all transactions (optional queries: `?type=Quotation&status=pending&userId=1`)
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/towing` - Create towing request
- `POST /api/transactions/quotation` - Create quotation request
- `POST /api/transactions/checkout` - Process shop checkout

### Vehicles
- `GET /api/users/:userId/vehicles` - Get all vehicles for a user
- `GET /api/users/:userId/vehicles/:vehicleId` - Get vehicle by ID
- `POST /api/users/:userId/vehicles` - Create new vehicle
- `PUT /api/users/:userId/vehicles/:vehicleId` - Update vehicle
- `DELETE /api/users/:userId/vehicles/:vehicleId` - Delete vehicle

### Notification Settings
- `GET /api/users/:userId/notification-settings` - Get notification settings
- `PUT /api/users/:userId/notification-settings` - Update notification settings

### Health Check
- `GET /api/health` - Check server and database status

## Database Schema

The backend automatically initializes the database with the following tables:
- `users` - User accounts
- `workshops` - Workshop partners
- `products` - Shop products
- `transactions` - All transaction types
- `vehicles` - User vehicles
- `notification_settings` - User notification preferences

## Error Handling

All endpoints use consistent error handling:
- 400: Bad Request (missing/invalid parameters)
- 401: Unauthorized (authentication failed)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

Error responses follow this format:
```json
{
  "status": "error",
  "error": "Error message"
}
```

## Development

- **Type checking:** `npm run type-check`
- **Build:** `npm run build`
- **Development server:** `npm run dev` (uses tsx watch mode)

## Notes

- The server runs on `0.0.0.0` to be accessible from mobile devices on the same network
- Default user credentials: `ahmad.z@example.com` / `password123`
- All passwords are hashed using bcrypt before storage
- The database is automatically initialized with default data on first run

