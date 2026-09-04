# 🚀 A5 Confectioners - Deployment Guide

## Production Deployment Steps

### Option 1: Railway Deployment (Recommended)

#### Step 1: Prepare Code
```bash
# Ensure everything is committed
git add -A
git commit -m "Production ready deployment"
git push origin main
```

#### Step 2: Connect to Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project
4. Select "Deploy from GitHub repo"
5. Connect your repository

#### Step 3: Configure Environment Variables
In Railway Dashboard → Variables, add:

```
PORT=3001
NODE_ENV=production
JWT_SECRET=generate-secure-random-string-here-min-32-chars
UPI_ID=your-upi-id@upi
RESTAURANT_NAME=A5 Confectioners
CLIENT_URL=https://your-railway-domain.railway.app
APP_URL=https://your-railway-domain.railway.app
```

**Optional SMS Support:**
```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Step 4: Deploy
- Railway auto-deploys on git push
- Monitor deployment in Railway Dashboard
- Check build logs if issues occur

#### Step 5: Post-Deployment
1. Change admin password immediately:
   - Go to /admin/login
   - Login with admin/admin123
   - Change password (contact dev team for method)

2. Verify features:
   - Test customer menu (/table/1)
   - Test admin dashboard (/admin)
   - Test kitchen display (/kitchen)
   - Test payment flow
   - Test feedback

3. Generate QR codes:
   - Admin → Tables
   - Click "QR Code" for each table
   - Print and place on tables

---

### Option 2: Manual VPS/Server Deployment

#### Prerequisites
- Ubuntu 20.04+ or similar
- Node.js 18+
- nginx (for reverse proxy)
- PM2 (for process management)

#### Step 1: Setup Server
```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install nginx
sudo apt-get install -y nginx
```

#### Step 2: Clone and Setup
```bash
# Clone repository
git clone https://github.com/yourusername/restaurant-billing.git
cd restaurant-billing

# Install dependencies
npm install

# Build production
npm run build

# Create .env file
cp .env.production .env
# Edit .env with your values
nano .env
```

#### Step 3: Start with PM2
```bash
# Start application
pm2 start "npm start" --name "a5-restaurant"

# Save PM2 config
pm2 save

# Setup auto-start on reboot
pm2 startup
```

#### Step 4: Setup nginx Reverse Proxy
```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/a5-restaurant

# Add this content:
```
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3001/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/a5-restaurant /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### Step 5: Setup SSL (HTTPS)
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

#### Step 6: Configure Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

### Option 3: Docker Deployment

#### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

#### Step 2: Build Docker Image
```bash
docker build -t a5-restaurant:latest .
```

#### Step 3: Run Container
```bash
docker run -d \
  --name a5-restaurant \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  -e UPI_ID=your-upi-id@upi \
  -e CLIENT_URL=https://your-domain.com \
  -e APP_URL=https://your-domain.com \
  a5-restaurant:latest
```

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET (32+ chars)
- [ ] Change UPI_ID to real UPI
- [ ] Enable HTTPS/SSL
- [ ] Setup firewall
- [ ] Backup database regularly
- [ ] Monitor logs for errors
- [ ] Keep dependencies updated
- [ ] Setup rate limiting
- [ ] Enable CORS properly
- [ ] Validate all user inputs
- [ ] Rotate JWT_SECRET quarterly

---

## 📊 Monitoring & Maintenance

### Daily Tasks
```bash
# Check application status
pm2 status

# View logs
pm2 logs a5-restaurant

# CPU & Memory usage
pm2 monit
```

### Weekly Tasks
- Backup database
- Review server logs
- Check API response times
- Monitor disk space

### Monthly Tasks
- Security updates
- Dependency updates
- Database optimization
- Performance review

### Quarterly Tasks
- Security audit
- Change passwords
- Update SSL certificate
- Disaster recovery test

---

## 🆘 Troubleshooting

### Application won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# View PM2 logs
pm2 logs a5-restaurant

# Restart application
pm2 restart a5-restaurant
```

### Database issues
```bash
# Check database file exists
ls -la restaurant.db

# Backup current database
cp restaurant.db restaurant.db.backup

# Delete and recreate
rm restaurant.db
npm start  # Will recreate on startup
```

### High memory usage
```bash
# Restart application
pm2 restart a5-restaurant

# Check for memory leaks in logs
pm2 logs a5-restaurant | grep -i memory
```

### SSL certificate issues
```bash
# Renew certificate
sudo certbot renew --dry-run

# Check certificate expiry
sudo certbot certificates
```

---

## 📱 Post-Deployment Checklist

- [ ] Test customer QR menu flow
- [ ] Test payment with UPI QR
- [ ] Test admin login
- [ ] Test kitchen display updates
- [ ] Test feedback submission & export
- [ ] Test bill history & closure
- [ ] Test best sellers analytics
- [ ] Test PDF download
- [ ] Test WhatsApp sharing
- [ ] Test SMS (if Twilio enabled)
- [ ] Verify all pages load
- [ ] Check mobile responsiveness
- [ ] Test on different browsers
- [ ] Verify error handling
- [ ] Check API response times

---

## 📈 Performance Optimization

### Frontend
```bash
# Analyze bundle size
npm run build -- --stats

# Optimize images
# Use .jpg for photos, .png for graphics
# Compress images before upload
```

### Backend
- Enable database indexing
- Cache frequently accessed data
- Optimize Socket.io connections
- Limit query results
- Use pagination for large datasets

### Infrastructure
- Use CDN for static files
- Enable gzip compression
- Setup caching headers
- Monitor CPU & memory
- Optimize database queries

---

## 🚀 Scaling for Growth

### When to Scale
- CPU usage consistently >80%
- Memory usage >85%
- Response times >2 seconds
- Concurrent users >100

### Scaling Strategies
1. Vertical Scaling (upgrade server)
2. Horizontal Scaling (multiple servers + load balancer)
3. Database Replication
4. Caching Layer (Redis)
5. CDN for static content

---

## 📞 Support During Deployment

If you encounter issues:
1. Check logs: `pm2 logs a5-restaurant`
2. Verify .env variables are set
3. Check network connectivity
4. Review application error messages
5. Check console browser for client errors

---

## ✅ Final Checklist

Before going live:
- [ ] All features tested
- [ ] Security settings configured
- [ ] Backups automated
- [ ] Monitoring enabled
- [ ] Team trained on admin features
- [ ] QR codes printed and placed
- [ ] Database backed up
- [ ] Documentation updated
- [ ] Support process documented
- [ ] Go-live date scheduled

---

## 🎉 Deployment Complete!

Your A5 Confectioners restaurant billing system is now live! 

**Key URLs:**
- Admin: https://your-domain.com/admin/login
- Kitchen: https://your-domain.com/kitchen
- Customer Menu: https://your-domain.com/table/1
- Bill Share: https://your-domain.com/bill/:sessionId

**Remember:**
- Change default admin password immediately
- Keep backups up-to-date
- Monitor server logs regularly
- Update dependencies periodically
- Test new features before production use

**Questions?** Contact: support@a5confectioners.com
