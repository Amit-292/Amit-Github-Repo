# 🍽️ Restaurant Billing System

A full-stack restaurant billing web application with QR code ordering, real-time kitchen display, and UPI payment.

## Features

- **Customer Flow**: Scan QR → Browse Menu → Place Order → View Bill → Pay via UPI
- **Kitchen Display**: Real-time order board with status updates (Pending → Preparing → Ready → Served)
- **Admin Panel**: Manage menu items, tables, and generate QR codes

## Tech Stack

- **Backend**: Node.js + Express + Socket.io + better-sqlite3
- **Frontend**: React 18 + Vite + React Router v6
- **Auth**: JWT (admin only)
- **QR**: qrcode (server), qrcode.react (client)
- **Real-time**: Socket.io

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
# 1. Clone / navigate to the project
cd restaurant-billing

# 2. Install server dependencies
npm install

# 3. Install client dependencies
cd client && npm install && cd ..

# 4. Set up environment
cp .env.example .env
# Edit .env with your settings
```

## Configuration (.env)

```env
PORT=3001
JWT_SECRET=your_secret_here
UPI_ID=yourname@upi          # Your UPI ID for payments
RESTAURANT_NAME=My Restaurant
CLIENT_URL=http://localhost:5173  # For QR code generation
```

## Running in Development

```bash
# Start both server and client (from project root)
npm run dev

# Or separately:
npm run dev:server   # Server on port 3001
npm run dev:client   # Client on port 5173
```

## URLs

| URL | Description |
|-----|-------------|
| `http://localhost:5173/table/1` | Customer menu for Table 1 |
| `http://localhost:5173/table/1/bill` | Bill page for Table 1 |
| `http://localhost:5173/kitchen` | Kitchen display |
| `http://localhost:5173/admin` | Admin dashboard (local dev) |
| `http://localhost:5173/admin/login` | Admin login (local dev) |
| `https://restaurant-billing-production-a629.up.railway.app/admin/login` | **Admin login (LIVE)** |
| `https://restaurant-billing-production-a629.up.railway.app/kitchen` | **Kitchen display (LIVE)** |
| `https://restaurant-billing-production-a629.up.railway.app/table/1` | **Table 1 customer menu (LIVE)** |

## Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

> ⚠️ Change the default password in production!

## Production Build

```bash
# Build the React client
npm run build

# Start server (serves built client + API)
NODE_ENV=production npm start
```

## How UPI Payment Works

1. Customer views bill and sees total amount
2. A QR code is generated from the UPI deep-link URL
3. Customer scans the QR with any UPI app (GPay, PhonePe, Paytm, etc.)
4. Or taps "Pay via UPI" button on mobile to open UPI app directly
5. Configure your UPI ID in `.env` as `UPI_ID=yourname@upi`

## How QR Codes Work

1. Go to Admin → Table Management
2. Click "QR Code" button next to any table
3. Download the QR image and print it for that table
4. When scanned, it opens the menu at `CLIENT_URL/table/:tableNumber`
5. Set `CLIENT_URL` in `.env` to your production domain for deployment

## Database

The app uses SQLite (better-sqlite3) stored at `server/restaurant.db`. The database is auto-created and seeded on first run with:
- 5 tables (Table 1–5)
- 8 sample menu items across 4 categories
- Default admin user

## Project Structure

```
restaurant-billing/
├── server/
│   ├── index.js          # Express + Socket.io server
│   ├── db.js             # SQLite database + seeding
│   ├── middleware/
│   │   └── auth.js       # JWT middleware
│   └── routes/
│       ├── auth.js       # POST /api/auth/login
│       ├── menu.js       # CRUD /api/menu
│       ├── tables.js     # CRUD /api/tables + QR
│       └── orders.js     # Orders + sessions + live feed
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CustomerMenu.jsx    # Customer-facing menu
│   │   │   ├── BillPage.jsx        # Bill + UPI payment
│   │   │   ├── KitchenDisplay.jsx  # Real-time kitchen board
│   │   │   ├── AdminLogin.jsx      # Admin login
│   │   │   └── AdminDashboard.jsx  # Menu + table management
│   │   └── components/
│   │       ├── MenuItem.jsx        # Menu item card
│   │       ├── Cart.jsx            # Cart summary bar
│   │       ├── OrderCard.jsx       # Kitchen order card
│   │       └── UpiPayment.jsx      # UPI QR + deep-link
│   └── vite.config.js
├── .env.example
└── README.md
```
