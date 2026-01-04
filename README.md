# AutoAssist - Car Towing & Automotive Hub

A comprehensive mobile application for car towing services, vehicle quotations, and automotive parts shopping, built with React Native Expo and TypeScript backend.

## Project Structure

```
.
├── mobile/              # React Native Expo mobile app
│   ├── screens/         # App screens
│   ├── components/      # Reusable components
│   ├── services/        # API and external services
│   ├── types.ts         # TypeScript type definitions
│   └── constants.tsx    # App constants
│
├── server/              # TypeScript backend (Admin/API)
│   ├── server.ts        # Express server
│   ├── database.ts      # Database connection and initialization
│   └── tsconfig.json    # TypeScript configuration
│
└── database/            # Database schema
    └── schema.sql
```

## Features

- **Mobile App (React Native Expo)**
  - Towing service requests
  - AI-powered vehicle quotation using Gemini
  - Automotive parts shop
  - User profile and authentication
  - Transaction history
  - Dark mode support

- **Backend (TypeScript/Express)**
  - RESTful API
  - MySQL database integration
  - User authentication
  - Transaction management
  - Workshop and product management

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL database
- Expo CLI (for mobile development)
- iOS Simulator / Android Emulator or physical device

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**

   Create `.env` file in the root:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=autoassist
   PORT=3001
   ```

   Create `mobile/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://autoassist.com.my:3002
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Start the backend server:**
   ```bash
   npm run dev:backend
   ```

4. **Start the mobile app:**
   ```bash
   npm run dev:mobile
   ```

   Or start both simultaneously:
   ```bash
   npm run dev:all
   ```

## Development

### Mobile App

The mobile app is located in the `mobile/` directory and uses:
- React Native with Expo
- React Navigation for routing
- TypeScript for type safety
- Expo Vector Icons for icons

### Backend

The backend is located in the `server/` directory and uses:
- Express.js
- TypeScript
- MySQL2 for database operations
- bcrypt for password hashing

## Building

### Backend

```bash
npm run build:backend
```

### Mobile App

For iOS:
```bash
cd mobile
npm run ios
```

For Android:
```bash
cd mobile
npm run android
```

## Default Credentials

- Email: `ahmad.z@example.com`
- Password: `password123`

## License

Private project
