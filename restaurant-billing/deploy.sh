#!/bin/bash

# Build for production
echo "Building for production..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo ""
  echo "🚀 To deploy to Railway:"
  echo ""
  echo "1. Install Railway CLI:"
  echo "   npm install -g @railway/cli"
  echo ""
  echo "2. Login to Railway:"
  echo "   railway login"
  echo ""
  echo "3. Initialize Railway project:"
  echo "   railway init"
  echo ""
  echo "4. Set environment variables in Railway Dashboard:"
  echo "   - PORT=3001"
  echo "   - NODE_ENV=production"
  echo "   - JWT_SECRET=your-secure-secret"
  echo "   - UPI_ID=your-upi-id@upi"
  echo "   - RESTAURANT_NAME=A5 Confectioners"
  echo "   - CLIENT_URL=https://your-domain.railway.app"
  echo "   - APP_URL=https://your-domain.railway.app"
  echo ""
  echo "5. Deploy:"
  echo "   railway deploy"
  echo ""
  echo "6. Or simply push to GitHub for auto-deploy:"
  echo "   git push"
else
  echo "❌ Build failed!"
  exit 1
fi
