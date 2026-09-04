#!/bin/bash

# 🚀 Railway Quick Deploy Script
# This script helps you deploy A5 Confectioners to Railway

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   A5 Confectioners - Railway Deployment Script            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI found"
echo ""

# Step 1: Login
echo "🔐 Step 1: Login to Railway"
railway login

echo ""
echo "✅ Logged in to Railway"
echo ""

# Step 2: Initialize project
echo "📁 Step 2: Initializing Railway project..."

if [ -f "railway.json" ]; then
    echo "   Found railway.json config"
else
    echo "   Creating railway.json..."
    cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 5
  }
}
EOF
fi

railway init || true

echo ""
echo "✅ Railway project initialized"
echo ""

# Step 3: Deploy
echo "🚀 Step 3: Deploying to Railway..."
echo ""
echo "This will:"
echo "  1. Build the application"
echo "  2. Upload to Railway"
echo "  3. Start the server"
echo ""
echo "Press Enter to continue..."
read

railway deploy

echo ""
echo "✅ Deployment started!"
echo ""

# Step 4: Instructions
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           DEPLOYMENT COMPLETE - NEXT STEPS                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration Required:"
echo ""
echo "1. Go to Railway Dashboard:"
echo "   https://railway.app/dashboard"
echo ""
echo "2. Select your project → Variables"
echo ""
echo "3. Add these environment variables:"
echo ""
echo "   PORT=3001"
echo "   NODE_ENV=production"
echo "   JWT_SECRET=<generate-secure-32-char-string>"
echo "   UPI_ID=<your-upi-id@upi>"
echo "   RESTAURANT_NAME=A5 Confectioners"
echo "   CLIENT_URL=<your-railway-domain>.railway.app"
echo "   APP_URL=<your-railway-domain>.railway.app"
echo ""
echo "4. (Optional) Add Twilio SMS support:"
echo "   TWILIO_ACCOUNT_SID=<your-twilio-sid>"
echo "   TWILIO_AUTH_TOKEN=<your-twilio-token>"
echo "   TWILIO_PHONE_NUMBER=+1234567890"
echo ""
echo "5. Deployment will restart automatically"
echo ""
echo "✅ Your app will be live at: https://your-domain.railway.app"
echo ""
echo "📝 After Going Live:"
echo ""
echo "  • Admin: https://your-domain.railway.app/admin/login"
echo "  • Kitchen: https://your-domain.railway.app/kitchen"
echo "  • Customer: https://your-domain.railway.app/table/1"
echo ""
echo "⚠️  IMPORTANT:"
echo ""
echo "  1. Change default admin password immediately"
echo "     Username: admin → Change password"
echo "     Default: admin123"
echo ""
echo "  2. Generate QR codes:"
echo "     Admin → Tables → Click QR Code button"
echo ""
echo "  3. Update UPI_ID to your actual UPI"
echo ""
echo "  4. Test all features before going live"
echo ""
echo "📊 Monitor Your App:"
echo ""
echo "  • Logs: railway logs"
echo "  • Status: railway status"
echo "  • Connect: railway connect"
echo ""
echo "🎉 Happy serving! 🍽️"
echo ""
