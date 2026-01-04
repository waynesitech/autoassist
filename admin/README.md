# AutoAssist Admin Dashboard

Modern admin dashboard for managing all AutoAssist modules with full CRUD operations.

## Features

- **Dashboard**: Overview statistics for all modules
- **Users Management**: Full CRUD operations for user accounts
- **Workshops Management**: Full CRUD operations for workshop partners
- **Products Management**: Full CRUD operations for shop products
- **Transactions Management**: Full CRUD operations for all transaction types
- **Vehicles Management**: Full CRUD operations for user vehicles

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Axios** for API calls

## Setup

1. **Install dependencies:**
   ```bash
   cd admin
   npm install
   ```

2. **Configure API URL (optional):**
   Create a `.env` file:
   ```env
   VITE_API_URL=http://autoassist.com.my/api
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The dashboard will open at `http://autoassist.com.my/admin`

## Project Structure

```
admin/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Main layout with sidebar
│   │   ├── DataTable.tsx       # Reusable data table component
│   │   └── Modal.tsx            # Reusable modal component
│   ├── pages/
│   │   ├── Dashboard.tsx        # Dashboard with statistics
│   │   ├── Users.tsx           # Users CRUD
│   │   ├── Workshops.tsx       # Workshops CRUD
│   │   ├── Products.tsx        # Products CRUD
│   │   ├── Transactions.tsx    # Transactions CRUD
│   │   └── Vehicles.tsx        # Vehicles CRUD
│   ├── services/
│   │   └── api.ts              # API service layer
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # Entry point
├── package.json
└── vite.config.ts
```

## Usage

1. Navigate to different modules using the sidebar
2. Click "+ Add" button to create new records
3. Click "Edit" on any row to update records
4. Click "Delete" on any row to remove records
5. View statistics on the dashboard

## API Connection

The dashboard connects to the backend API at `http://autoassist.com.my/api` by default. Make sure the backend server is running before using the dashboard.

