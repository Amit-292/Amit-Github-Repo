# A5 Confectioners - Restaurant Billing System

A modern, production-ready restaurant billing and order management system with QR code ordering, real-time kitchen display, SMS/WhatsApp integration, and comprehensive analytics.

**Status**: ✅ **LIVE IN PRODUCTION** | **Version**: 2.0.0

🚀 **LIVE DEMO**: https://a5confectioners-restaurant.up.railway.app

---

## 🌐 Application URLs

### **Live Production Links**

#### 👨‍💼 **Admin Dashboard** (Staff Only)
```
https://a5confectioners-restaurant.up.railway.app/admin/login
```
- **Username**: admin
- **Password**: admin123 (⚠️ Change this immediately in production!)
- **Access**: Menu management, table setup, bills, analytics, reports, feedback
- **Purpose**: Restaurant staff and management

#### 🍳 **Kitchen Display System**
```
https://a5confectioners-restaurant.up.railway.app/kitchen
```
- **Access**: Kitchen staff only
- **View**: Real-time order updates
- **Features**: Live orders, status updates (Pending → Preparing → Ready → Served)
- **Refresh**: Auto-updates every 30 seconds via Socket.io
- **Purpose**: Coordinate food preparation

#### 📱 **Customer Menu** (Scan Table QR Code)
```
https://a5confectioners-restaurant.up.railway.app/table/1
https://a5confectioners-restaurant.up.railway.app/table/2
https://a5confectioners-restaurant.up.railway.app/table/3
... (replace '1', '2', '3' with your table numbers)
```
- **Access**: No login required
- **View**: Browse menu, place orders, view bill
- **Payment**: Pay via UPI QR code
- **Feedback**: Submit rating and feedback
- **Purpose**: Customer-facing interface

#### 📄 **Bill Sharing** (Public Access)
```
https://a5confectioners-restaurant.up.railway.app/bill/SESSION_ID
```
- **Access**: No login required
- **View**: Bill details, download PDF, share via WhatsApp/SMS
- **Purpose**: Customer bill viewing and sharing

---

### **Local Development Links** (If running locally)
```
Admin Dashboard:    http://localhost:3000/admin/login
Kitchen Display:    http://localhost:3000/kitchen
Customer Menu:      http://localhost:3000/table/1
Bill Sharing:       http://localhost:3000/bill/SESSION_ID
Backend API:        http://localhost:3001/api
```

---

### **Quick Access Guide**

| User Type | URL | Purpose | Authentication |
|-----------|-----|---------|-----------------|
| **Restaurant Admin** | `/admin/login` | Manage business | Username/Password |
| **Kitchen Staff** | `/kitchen` | View orders | Open access |
| **Customer** | `/table/{number}` | Order food, pay | No login |
| **Billing** | `/bill/{sessionId}` | View/share bill | No login |

---

## 🎯 Key Features

### 📱 Customer Experience
- **QR Code Menu**: Scan table QR code to view menu instantly
- **Browse & Order**: Browse items by category with descriptions and prices
- **Real-time Bill**: View itemized bill with live updates
- **UPI Payment**: Pay via QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)
- **Feedback**: Rate food (1-5 stars) and staff experience
- **Bill Sharing**: Download bill PDF, share via WhatsApp or SMS
- **Public Access**: No login required for customers

### 🍳 Kitchen Staff
- **Real-Time Display**: Live order board with visual status
- **Order Status**: Pending → Preparing → Ready → Served workflow
- **Auto-Refresh**: Socket.io powered real-time updates every 30 seconds
- **Order Details**: See all items and quantities at a glance

### 👨‍💼 Admin Management
- **Menu Management**: Create, edit, delete menu items with categories
- **Table Management**: Create tables with multiple groups, auto-generate QR codes
- **Active Bills**: View live bills awaiting payment
- **Bills History**: Complete transaction history with date filtering
- **Best Sellers**: Top 20 most ordered items with revenue tracking
- **Feedback Analytics**: View and export customer feedback to Excel/PDF
- **Bill Closure**: Move paid bills to history with one click
- **SMS Integration**: Send bills to customers via SMS (Twilio)
- **User Management**: Secure JWT authentication

### 📊 Analytics & Reporting
- **Best Sellers Tab**: Top items ranked by quantity ordered
- **Revenue Tracking**: Item-wise revenue breakdown
- **Feedback Export**: Download feedbacks as Excel or PDF
- **Date Filtering**: View data by specific dates
- **Bill Summaries**: Per-table, per-group, and overall totals
- **GST Calculation**: Automatic 5% GST calculation

---

## 🌟 Phase 2 Features (NEW - September 2026)

### 📤 Advanced Sharing
| Feature | Details |
|---------|---------|
| **PDF Download** | Generate and download bills as PDF |
| **WhatsApp Share** | Send bill with link via WhatsApp |
| **SMS Integration** | Send bills via SMS with Twilio |
| **Public Bill View** | Share bills without requiring login |
| **Multi-Platform** | Works on desktop, mobile, tablets |

### 📈 Analytics
| Feature | Details |
|---------|---------|
| **Best Sellers** | Top 20 items by order frequency |
| **Revenue Analytics** | Track revenue per item |
| **Feedback Export** | Excel and PDF export options |
| **Date Filtering** | View data by date ranges |
| **Bill Summaries** | Table-wise, group-wise, overall totals |

### 🎨 Professional Branding
| Component | Implementation |
|-----------|-----------------|
| **Logo** | Displayed on all pages and QR code |
| **Colors** | Deep brown (#6B4423) and cream (#F5E6D3) |
| **QR Branding** | Logo above QR with branded container |
| **Consistent Design** | Unified theme across all interfaces |

---

## 📋 Complete Feature Checklist

### ✅ All Requirements Implemented

#### From Initial Request #1
- [x] Feedback export to Excel/PDF
- [x] Feedback persistence (no auto-delete)
- [x] Date-wise feedback viewing
- [x] Bills history tab
- [x] Per-table bill calculations
- [x] Per-group bill calculations
- [x] GST calculation (5%)
- [x] Delete bills from history option

#### From Initial Request #2
- [x] Bill closure workflow (paid → history)
- [x] WhatsApp PDF sharing
- [x] SMS text message with link
- [x] Customer bill download on payment page
- [x] Customer WhatsApp share
- [x] Best seller analytics tab
- [x] Brand color theme throughout
- [x] Logo on all pages
- [x] Logo on QR code
- [x] Professional appearance

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Local Development

```bash
# Clone and setup
cd restaurant-billing
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start development server
npm run dev
```

**Local URLs:**
- Customer: http://localhost:5173/table/1
- Kitchen: http://localhost:5173/kitchen
- Admin: http://localhost:5173/admin/login

### Environment Configuration

Create `.env` in project root:

```env
# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=change-this-secret-in-production

# Database
DATABASE_PATH=./restaurant.db

# UPI Payment
UPI_ID=your-upi-id@upi
RESTAURANT_NAME=A5 Confectioners

# URLs
CLIENT_URL=http://localhost:5173

# SMS Integration (Optional - works in demo mode without this)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# App URL for bill sharing
APP_URL=http://localhost:5173
```

### Default Credentials
```
Username: admin
Password: admin123
```

⚠️ **IMPORTANT**: Change these in production!

---

## 🚀 Production Deployment on Railway

### Option 1: One-Click Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/restaurant-billing)

### Option 2: Manual Railway Deployment

#### Step 1: Setup Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project

#### Step 2: Connect Repository
```bash
# Login to Railway CLI
npm install -g @railway/cli
railway login

# Initialize and deploy
railway init
railway deploy
```

#### Step 3: Configure Environment Variables
In Railway Dashboard:
1. Go to Project → Variables
2. Add these variables:
   ```
   PORT=3001
   NODE_ENV=production
   JWT_SECRET=your-secure-random-secret
   UPI_ID=your-upi-id@upi
   RESTAURANT_NAME=A5 Confectioners
   CLIENT_URL=https://your-railway-domain.railway.app
   TWILIO_ACCOUNT_SID=your-twilio-sid (optional)
   TWILIO_AUTH_TOKEN=your-twilio-token (optional)
   TWILIO_PHONE_NUMBER=+1234567890 (optional)
   APP_URL=https://your-railway-domain.railway.app
   ```

#### Step 4: Deploy
1. Push to your GitHub repository
2. Railway auto-deploys on push
3. Check deployment status in Railway Dashboard

### Access Your Live App
- **Admin**: https://your-domain.railway.app/admin/login
- **Kitchen**: https://your-domain.railway.app/kitchen
- **Table 1**: https://your-domain.railway.app/table/1
- **Bills Share**: https://your-domain.railway.app/bill/:sessionId

---

## 🛠️ Tech Stack

### Frontend
```
React 18 - UI Framework
Vite - Build tool & dev server
React Router - Navigation
Socket.io Client - Real-time updates
html2pdf - PDF generation
XLSX - Excel export
QRCode.React - QR code generation
```

### Backend
```
Node.js - Runtime
Express.js - Web framework
Socket.io - WebSocket server
better-sqlite3 - Database
JWT - Authentication
Twilio SDK - SMS integration (optional)
```

### Database
```
SQLite3 - Lightweight, serverless
WAL Mode - Performance optimization
Indexed queries - Fast data retrieval
```

---

## 📊 API Endpoints Reference

### Authentication
```
POST   /api/auth/login          Admin login
POST   /api/auth/logout         Admin logout
```

### Menu
```
GET    /api/menu                Get all items
POST   /api/menu                Add item (admin)
PATCH  /api/menu/:id            Update item (admin)
DELETE /api/menu/:id            Delete item (admin)
```

### Tables
```
GET    /api/tables              Get all tables
POST   /api/tables              Add table (admin)
PATCH  /api/tables/:id          Update table (admin)
DELETE /api/tables/:id          Delete table (admin)
GET    /api/tables/:id/qr       Generate QR code
```

### Orders & Bills
```
POST   /api/orders              Create order
GET    /api/orders/live         Get live orders
GET    /api/orders/bills        Get active bills (admin)
GET    /api/orders/bills-history Get bill history (admin)
DELETE /api/orders/bills-history/:id Delete bill (admin)
GET    /api/orders/best-sellers Get top items (admin)
PATCH  /api/orders/:id/status   Update status
PATCH  /api/orders/bills/:sessionId/close Close bill (admin)
GET    /api/orders/bill-share/:sessionId Get bill for share (public)
```

### Feedback
```
POST   /api/feedback             Submit feedback
GET    /api/feedback             Get feedbacks (admin)
DELETE /api/feedback/:id         Delete feedback (admin)
GET    /api/feedback/export/excel Export to Excel (admin)
GET    /api/feedback/export/pdf  Export to PDF (admin)
```

### SMS
```
POST   /api/orders/bill-share/send-sms Send SMS (admin)
GET    /api/orders/bill-share/:id/sms-text Get SMS text (public)
```

---

## 📁 Project Structure

```
restaurant-billing/
├── server/
│   ├── index.js                 # Express + Socket.io
│   ├── db.js                    # Database setup & seeding
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── routes/
│   │   ├── auth.js              # /api/auth/*
│   │   ├── menu.js              # /api/menu/*
│   │   ├── tables.js            # /api/tables/*
│   │   ├── orders.js            # /api/orders/* + best-sellers
│   │   └── feedback.js          # /api/feedback/* + exports
│   └── services/
│       └── smsService.js        # Twilio SMS integration
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx     # Admin panel
│   │   │   ├── AdminLogin.jsx         # Admin login
│   │   │   ├── CustomerMenu.jsx       # Customer menu
│   │   │   ├── BillPage.jsx           # Bill & payment
│   │   │   ├── BillShare.jsx          # Public bill share
│   │   │   └── KitchenDisplay.jsx     # Kitchen board
│   │   ├── components/
│   │   │   ├── UpiPayment.jsx         # UPI payment QR
│   │   │   ├── MenuItem.jsx           # Menu item card
│   │   │   └── OrderCard.jsx          # Kitchen order card
│   │   ├── constants.js         # Brand colors
│   │   ├── index.css            # Global styles
│   │   ├── App.jsx              # Main app
│   │   └── main.jsx             # Entry point
│   ├── public/
│   │   ├── logo.jpg             # Restaurant logo
│   │   └── index.html           # HTML template
│   ├── vite.config.js
│   └── package.json
│
├── package.json                 # Root dependencies
├── .env.example                 # Environment template
├── README.md                    # This file
└── .gitignore
```

---

## 🎨 Customization

### Brand Colors
Edit `client/src/constants.js`:

```javascript
export const BRAND_COLORS = {
  primary: '#6B4423',      // Deep Brown
  primaryDark: '#4a2c17',  // Darker Brown
  secondary: '#F5E6D3',    // Cream
  accent: '#8B5A3C',       // Medium Brown
  // ...
};
```

### Restaurant Logo
1. Replace `client/public/logo.jpg` with your logo
2. Size: 200x200px recommended
3. Adjust in components if needed

### Restaurant Details
Edit `.env`:
```env
RESTAURANT_NAME=A5 Confectioners
UPI_ID=your-upi-id@upi
```

### Categories & Menu Items
- Admin Dashboard → Menu Items
- Add/edit items with categories
- Prices update live

---

## 🔒 Security

### Authentication
- JWT token-based (25 min expiry)
- Secure password storage
- Admin routes protected
- Session-based access control

### Data Protection
- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- CSRF tokens on sensitive ops

### Public Access
- Bill sharing via session IDs
- No personal data exposed
- Read-only for customers
- Secure download links

---

## 📈 Performance

### Optimizations
- **Frontend**: Vite build optimization, code splitting
- **Backend**: SQLite WAL mode, indexed queries
- **Real-time**: Socket.io efficient updates
- **PDF**: Client-side generation (no server load)
- **Database**: Normalized schema, proper indexing

### Monitoring
- Check Railway dashboard for CPU/memory
- Review server logs for errors
- Monitor database size
- Track API response times

---

## 📱 SMS Integration

### Free Testing (Demo Mode)
- Works without Twilio credentials
- Logs SMS to server console
- Perfect for development

### Production SMS (Twilio)
1. Create Twilio account: https://www.twilio.com
2. Get: Account SID, Auth Token, Phone Number
3. Set in `.env` file
4. Feature automatically enables

---

## 🐛 Troubleshooting

### Issue: Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Port already in use
```bash
# Use different port
PORT=3002 npm run dev
```

### Issue: Database corrupted
```bash
# Delete and reinitialize
rm restaurant.db
npm run dev
```

### Issue: SMS not sending
- Verify Twilio credentials
- Check phone number format (+country code)
- Review server logs
- Use demo mode to test

### Issue: QR codes not generating
- Check CLIENT_URL in .env
- Verify domain is accessible
- Clear browser cache
- Check network connection

---

## 📚 Usage Guide

### For Customers
1. **Scan Table QR** → Opens menu
2. **Browse Items** → By category
3. **Select Items** → Add to cart
4. **View Bill** → Total with items
5. **Pay via UPI** → Scan QR or use button
6. **Leave Feedback** → Optional ratings
7. **Share Bill** → PDF, WhatsApp, or SMS

### For Kitchen Staff
1. **Monitor Orders** → Real-time display
2. **Update Status** → Click to change
3. **Pending** → Item received
4. **Preparing** → Cooking started
5. **Ready** → Ready to serve
6. **Served** → Customer received

### For Admin
1. **Login** → /admin/login
2. **Manage Menu** → Add/edit items
3. **Manage Tables** → Create/edit tables
4. **View Bills** → Active and history
5. **Export Data** → Feedback to Excel/PDF
6. **Best Sellers** → View analytics
7. **Send SMS** → To customers (if Twilio setup)

---

## 📊 Sample Data

Database initializes with:
- **Tables**: Table 1-5
- **Menu Items**: 8 items across 4 categories
  - Snacks (Samosa, Pakora)
  - Sweets (Gulab Jamun, Rasgulla)
  - Beverages (Coffee, Tea)
  - Desserts (Ice Cream, Kulfi)
- **Admin User**: admin / admin123

---

## 🚀 Deployment Checklist

- [ ] Change JWT_SECRET in production
- [ ] Change admin password
- [ ] Set proper UPI_ID
- [ ] Configure TWILIO_ variables (optional)
- [ ] Set CLIENT_URL to production domain
- [ ] Backup database before major updates
- [ ] Monitor server logs daily
- [ ] Test SMS in demo mode first
- [ ] Verify QR codes work on live domain
- [ ] Test payment flow end-to-end

---

## 📞 Support

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| QR codes not scanning | Update CLIENT_URL to production domain |
| SMS not working | Add Twilio credentials (or use demo mode) |
| Payment QR not generating | Check UPI_ID in .env |
| Kitchen display not updating | Verify Socket.io connection |
| Feedback not persisting | Check database permissions |
| Export failing | Verify file permissions in server |

---

## 📈 Future Roadmap

- [ ] Email integration for bills
- [ ] WhatsApp Business API
- [ ] Customer loyalty program
- [ ] Multi-language support
- [ ] Mobile app (iOS/Android)
- [ ] Payment gateway integration
- [ ] Table reservations
- [ ] Staff management
- [ ] Inventory tracking
- [ ] Advanced analytics

---

## 📄 License

Private - A5 Confectioners

---

## 👥 Team

**Developed by**: Development Team  
**For**: A5 Confectioners Restaurant  
**Date**: September 2026  
**Status**: ✅ Production Ready

---

## 📞 Contact & Support

For issues, feature requests, or support:
- Email: support@a5confectioners.com
- Phone: +91-XXX-XXX-XXXX
- Website: www.a5confectioners.com

---

**Last Updated**: September 4, 2026 | **Version**: 2.0.0 | **Status**: 🟢 LIVE IN PRODUCTION

🚀 **Live at**: https://a5confectioners-restaurant.up.railway.app
