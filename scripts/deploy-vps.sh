#!/bin/bash
set -euo pipefail

echo "======================================"
echo "Vibely VPS Deployment Script"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root: sudo bash deploy-vps.sh"
  exit 1
fi

# Configuration
APP_NAME="vibely"
APP_DIR="/var/www/vibely"
DB_NAME="vibely"
DB_USER="vibely"
DB_PASS="vibely_password"
NODE_VERSION="20"

# Detect OS
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  echo "ERROR: Cannot detect OS"
  exit 1
fi

echo "Detected OS: $OS"

# Update system
echo "[1/12] Updating system..."
apt update && apt upgrade -y

# Install Node.js
echo "[2/12] Installing Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt install -y nodejs
fi

# Install PM2
echo "[3/12] Installing PM2..."
npm install -g pm2

# Install PostgreSQL
echo "[4/12] Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
  apt install -y postgresql-16 postgresql-contrib
  systemctl start postgresql
  systemctl enable postgresql
fi

# Install Redis
echo "[5/12] Installing Redis..."
if ! command -v redis-cli &> /dev/null; then
  apt install -y redis-server
  systemctl start redis
  systemctl enable redis
fi

# Install Nginx
echo "[6/12] Installing Nginx..."
if ! command -v nginx &> /dev/null; then
  apt install -y nginx
  systemctl start nginx
  systemctl enable nginx
fi

# Setup database
echo "[7/12] Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true

# Clone repository
echo "[8/12] Cloning repository..."
if [ -d "$APP_DIR" ]; then
  echo "Repository already exists, pulling latest..."
  cd "$APP_DIR"
  git pull origin main
else
  git clone https://github.com/harshaltiwari1998/Vibely.git "$APP_DIR"
  cd "$APP_DIR"
fi

# Install dependencies
echo "[9/12] Installing dependencies..."
npm ci

# Build application
echo "[10/12] Building application..."
npm run build

# Install backend dependencies
echo "[11/12] Installing backend dependencies..."
cd services/backend
npm ci --only=production

# Run migrations
echo "[12/12] Running database migrations..."
npx prisma migrate deploy || true

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Configure environment:"
echo "   cd $APP_DIR/services/backend"
echo "   nano .env"
echo ""
echo "2. Add to .env:"
echo "   NODE_ENV=production"
echo "   PORT=4000"
echo "   DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo "   REDIS_URL=redis://localhost:6379"
echo "   JWT_SECRET=$(openssl rand -base64 32)"
echo "   JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "   CORS_ORIGIN=https://your-domain.com"
echo ""
echo "3. Start backend:"
echo "   cd $APP_DIR/services/backend"
echo "   pm2 start dist/main.js --name vibely-backend"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "4. Deploy web app:"
echo "   cd $APP_DIR/apps/web"
echo "   npm run build"
echo "   sudo cp -r dist/* /var/www/html/"
echo ""
echo "5. Configure nginx:"
echo "   sudo nano /etc/nginx/sites-available/vibely"
echo "   sudo ln -s /etc/nginx/sites-available/vibely /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl restart nginx"
echo ""
echo "6. Setup SSL:"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
