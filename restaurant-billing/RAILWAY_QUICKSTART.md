# 🚀 Railway Deployment - Quick Start

## Live Deployment in 5 Minutes

### Prerequisites
- GitHub account
- Railway account (free tier available)
- This repository pushed to GitHub

---

## Method 1: Use Railway Dashboard (Easiest)

### Step 1: Go to Railway
1. Visit https://railway.app
2. Click "Start New Project"
3. Select "Deploy from GitHub repo"

### Step 2: Connect GitHub
1. Authorize Railway to access GitHub
2. Select `restaurant-billing` repository
3. Click "Deploy Now"

Railway will automatically:
- Detect Node.js project
- Install dependencies
- Build the application
- Start the server

### Step 3: Configure Environment Variables
1. Go to Railway Project Dashboard
2. Click on your deployment → Variables
3. Add these variables:

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-secure-random-string-32-chars-min
UPI_ID=your-upi-id@upi
RESTAURANT_NAME=A5 Confectioners
CLIENT_URL=your-railway-domain.railway.app
APP_URL=your-railway-domain.railway.app
```

**Optional - Twilio SMS:**
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 4: Deploy
- Railway auto-deploys when variables are saved
- Check "Deploy" tab for status
- Once green, your app is live!

### Step 5: Access Your App
- **Admin**: https://your-domain.railway.app/admin/login
- **Kitchen**: https://your-domain.railway.app/kitchen
- **Customer**: https://your-domain.railway.app/table/1

---

## Method 2: CLI Deployment (Advanced)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Run Deploy Script
```bash
chmod +x RAILWAY_DEPLOY.sh
./RAILWAY_DEPLOY.sh
```

The script will guide you through:
1. Login to Railway
2. Initialize project
3. Deploy application
4. Show next steps

### Step 3: Add Environment Variables
```bash
railway variable set PORT=3001
railway variable set NODE_ENV=production
railway variable set JWT_SECRET=your-secret
railway variable set UPI_ID=your-upi@upi
railway variable set CLIENT_URL=your-domain.railway.app
railway variable set APP_URL=your-domain.railway.app
```

### Step 4: Check Status
```bash
railway logs          # View application logs
railway status        # Check deployment status
railway open         # Open app in browser
```

---

## 🔧 Post-Deployment Checklist

After your app is live:

### Security ⚠️
- [ ] Change default admin password
  - Login with: admin / admin123
  - Ask dev team for password change method
- [ ] Verify JWT_SECRET is set and strong
- [ ] Update UPI_ID to your actual UPI

### Testing
- [ ] Test customer menu (/table/1)
- [ ] Scan QR code and verify it works
- [ ] Test payment flow
- [ ] Submit feedback
- [ ] Admin login (/admin)
- [ ] Kitchen display (/kitchen)
- [ ] Export feedback to Excel/PDF
- [ ] Test best sellers tab

### Configuration
- [ ] Print QR codes for all tables
- [ ] Place QR codes on tables
- [ ] Test on multiple devices (mobile, tablet, desktop)
- [ ] Verify SMS (if Twilio configured)

### Monitoring
- [ ] Check Railway Dashboard daily
- [ ] Monitor for errors in logs
- [ ] Verify database file exists
- [ ] Check disk usage

---

## 📊 Your Live URLs

Once deployed, you can access:

| Interface | URL |
|-----------|-----|
| **Admin Login** | `https://your-domain.railway.app/admin/login` |
| **Kitchen Display** | `https://your-domain.railway.app/kitchen` |
| **Customer Menu** | `https://your-domain.railway.app/table/1` |
| **Bill View** | `https://your-domain.railway.app/bill/:id` |
| **API** | `https://your-domain.railway.app/api/*` |

---

## 🆘 Troubleshooting

### App won't deploy
**Check:**
- All environment variables are set
- JWT_SECRET is defined
- No build errors in logs
- GitHub repository is public or authorized

**View Logs:**
```bash
railway logs --follow
```

### QR codes not working
**Solution:**
- Ensure CLIENT_URL matches your Railway domain
- Update in Railway → Variables → CLIENT_URL
- Redeploy if needed

### Payment QR not generating
**Check:**
- UPI_ID is set correctly
- Format: `name@bank` (e.g., `amit@okhdfcbank`)
- Test with a valid UPI account

### SMS not working
**If Twilio not configured:**
- SMS works in demo mode (logs to console)
- Check server logs for SMS text

**If Twilio configured:**
- Verify TWILIO_ACCOUNT_SID is correct
- Check TWILIO_AUTH_TOKEN is correct
- Verify phone number format: +country-code-number
- Check Twilio account has credits

### Database issues
**Connection failed:**
- Database auto-creates on first run
- Check file system has write permissions
- On Railway, database persists in project volume

**Data reset:**
- Database is persistent on Railway
- Don't delete the volume to keep data
- To reset: delete and redeploy (will create new DB)

---

## 📈 Monitoring

### Check Application Health
```bash
# View real-time logs
railway logs --follow

# Check specific service
railway logs --service=web

# View deployment history
railway deploy --history
```

### Access Environment Variables
```bash
# View current variables
railway variable list

# Set new variable
railway variable set KEY=value

# Remove variable
railway variable delete KEY
```

### Manage Deployment
```bash
# Redeploy latest code
railway deploy

# Connect to running instance
railway connect

# View resource usage
railway status
```

---

## 💡 Tips & Tricks

### 1. Custom Domain
1. In Railway Dashboard → Domain
2. Add custom domain (e.g., `restaurant.yourdomain.com`)
3. Update DNS records as shown
4. Update CLIENT_URL and APP_URL to new domain

### 2. Database Backup
- Railway keeps backups automatically
- To download: railway database backup download
- Store backup safely

### 3. Scale Up if Needed
- As traffic grows, upgrade from free tier
- Go to Railway → Project → Settings → Plan
- Choose suitable tier based on usage

### 4. Environment-Specific Config
- Keep `.env.production` in version control
- Add actual secrets in Railway Dashboard
- Never commit secrets to GitHub

### 5. Test Locally Before Deploy
```bash
# Test production build locally
npm run build
NODE_ENV=production npm start

# Visit http://localhost:3001
```

---

## 🎓 Learning Resources

### Railway Documentation
- https://docs.railway.app
- https://railway.app/status

### Environment Variables
- Keep secrets safe
- Use Railway's variable management
- Rotate secrets periodically

### Performance
- Monitor logs for errors
- Check database performance
- Optimize queries if needed

---

## ✅ Success Indicators

Your deployment is successful when:
- ✅ App loads without errors
- ✅ Admin can login
- ✅ Customer menu displays
- ✅ Kitchen display shows orders
- ✅ Payment QR codes generate
- ✅ Feedback can be submitted
- ✅ Admin can export data
- ✅ Best sellers tab shows items

---

## 🎉 Congratulations!

Your A5 Confectioners restaurant is now live on Railway! 

### Next Steps:
1. Train staff on using the system
2. Print and place QR codes
3. Promote to customers
4. Monitor performance
5. Gather feedback
6. Optimize as needed

---

## 📞 Support

For issues:
1. Check Railway logs: `railway logs --follow`
2. Review DEPLOYMENT_GUIDE.md
3. Check README.md for full documentation
4. Contact development team if stuck

---

**Status**: ✅ Production Ready
**Version**: 2.0.0
**Last Updated**: September 4, 2026

🍽️ Happy serving!
