# Vibely Production Deployment Guide (No Docker Desktop Required)

## Overview

This guide covers deploying Vibely to a production Linux server **without** using Docker Desktop locally. All builds are done on the production server.

## Prerequisites

- A Linux VPS/server (Ubuntu 22.04+ recommended)
- SSH access to the server
- A domain name pointing to your server
- Node.js 18+ on the server

## Option 1: Automated Deployment (Recommended)

Use the one-click deployment script on your Linux server.

```bash
# On your Linux server
curl -fsSL https://raw.githubusercontent.com/harshaltiwari1998/Vibely/main/scripts/deploy-vps.sh | bash
```

Or manually:
```bash
# Clone repository
git clone https://github.com/harshaltiwari1998/Vibely.git /var/www/vibely
cd /var/www/vibely

# Run deployment script
bash scripts/deploy-vps.sh
```

## Option 2: Manual Deployment

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Install Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2
sudo npm install -g pm2
```

### Step 2: Database Setup

```bash
# Create database and user
sudo -u postgres psql -c "CREATE DATABASE vibely;"
sudo -u postgres psql -c "CREATE USER vibely WITH ENCRYPTED PASSWORD 'vibely_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vibely TO vibely;"
sudo -u postgres psql -d vibely -c "GRANT ALL ON SCHEMA public TO vibely;"
```

### Step 3: Application Deployment

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/harshaltiwari1998/Vibely.git
cd Vibely

# Install dependencies
npm ci

# Build all packages
npm run build

# Install backend dependencies
cd services/backend
npm ci --only=production

# Run Prisma migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

### Step 4: Environment Configuration

```bash
cd /var/www/Vibely/services/backend

# Create .env file
sudo nano .env
```

Add the following:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://vibely:vibely_password@localhost:5432/vibely
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
CORS_ORIGIN=https://vibely.app,https://admin.vibely.app
```

### Step 5: Start Backend with PM2

```bash
cd /var/www/Vibely/services/backend

# Start backend
pm2 start dist/main.js --name vibely-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 6: Deploy Web App

```bash
cd /var/www/Vibely/apps/web

# Build web app
npm run build

# Copy to nginx directory
sudo cp -r dist/* /var/www/html/
```

### Step 7: Deploy Admin App

```bash
cd /var/www/Vibely/apps/admin

# Build admin app
npm run build

# Create admin directory
sudo mkdir -p /var/www/admin.vibely.app

# Copy to nginx directory
sudo cp -r dist/* /var/www/admin.vibely.app/
```

### Step 8: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/vibely
```

Add:
```nginx
server {
    listen 80;
    server_name vibely.app www.vibely.app;
    root /var/www/html;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

```bash
sudo nano /etc/nginx/sites-available/admin.vibely.app
```

Add:
```nginx
server {
    listen 80;
    server_name admin.vibely.app;
    root /var/www/admin.vibely.app;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
```

### Step 9: Enable Sites and Restart Nginx

```bash
# Enable sites
sudo ln -s /etc/nginx/sites-available/vibely /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.vibely.app /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Step 10: SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate for main domain
sudo certbot --nginx -d vibely.app -d www.vibely.app

# Get certificate for admin domain
sudo certbot --nginx -d admin.vibely.app

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 11: Firewall Configuration

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow http
sudo ufw allow https

# Allow PostgreSQL (only if needed externally)
# sudo ufw allow 5432/tcp

# Check status
sudo ufw status
```

## Verification

```bash
# Check backend is running
pm2 status
curl http://localhost:4000/api/health

# Check nginx
sudo nginx -t
sudo systemctl status nginx

# Check services
sudo systemctl status postgresql
sudo systemctl status redis
```

## Update Procedure

```bash
cd /var/www/Vibely
git pull origin main
npm run build
cd services/backend
npm ci --only=production
npx prisma migrate deploy
pm2 restart vibely-backend
```

## Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs vibely-backend

# System resources
htop
```

## Backup

```bash
# Database backup
sudo -u postgres pg_dump vibely > vibely_backup_$(date +%Y%m%d).sql

# Compress
gzip vibely_backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs vibely-backend

# Check database connection
psql -U vibely -d vibely -c "SELECT 1;"

# Check Redis
redis-cli ping
```

### Nginx 502 Bad Gateway
```bash
# Check backend is running
pm2 status
curl http://localhost:4000/api/health

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### WebSocket not connecting
```bash
# Check nginx config has proxy for /socket.io
# Check backend is listening on 4000
netstat -tlnp | grep 4000
```

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Change JWT secrets
- [ ] Configure CORS_ORIGIN to actual domain
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Configure firewall (ufw)
- [ ] Disable root SSH login
- [ ] Use SSH keys instead of passwords
- [ ] Keep system updated
- [ ] Configure fail2ban
- [ ] Set up log rotation
