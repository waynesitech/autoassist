# AutoAssist Backend Server

Express.js backend server with MySQL database integration.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure database:**
   Create a `.env` file in the `server` directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=autoassist
   PORT=3001
   ```

3. **Make sure MySQL is running:**
   - Ensure MySQL server is running on localhost
   - The database will be created automatically if it doesn't exist

4. **Start the server:**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /api/workshops` - Get all workshops
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction
- `POST /api/towing` - Create a towing request
- `POST /api/quotation` - Create a quotation
- `POST /api/checkout` - Process checkout
- `GET /api/products` - Get all products
- `GET /api/health` - Health check endpoint

## Database Schema

The database will be automatically initialized on server startup with:
- `workshops` table
- `transactions` table
- `products` table

Initial data will be seeded if tables are empty.
