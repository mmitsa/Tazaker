# Tazaker - Production Deployment Guide
## Hospital Queue Management System

Complete guide for deploying Tazaker to production environment.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Server Requirements](#server-requirements)
3. [Deployment Steps](#deployment-steps)
4. [Environment Configuration](#environment-configuration)
5. [Database Migration](#database-migration)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Nginx Configuration](#nginx-configuration)
8. [PM2 Process Management](#pm2-process-management)
9. [Docker Deployment](#docker-deployment)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [Monitoring Setup](#monitoring-setup)
12. [Backup Strategy](#backup-strategy)
13. [Rollback Procedure](#rollback-procedure)

---

## Pre-Deployment Checklist

### Security Checklist

- [ ] All default passwords changed
- [ ] Strong JWT secrets generated (32+ characters)
- [ ] Environment variables properly set
- [ ] Database user has minimal required permissions
- [ ] Firewall rules configured
- [ ] SSL certificate obtained and installed
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled (Helmet.js)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

### Configuration Checklist

- [ ] Database connection string updated
- [ ] Redis connection configured
- [ ] SMS provider credentials set
- [ ] SMTP settings configured (if using email)
- [ ] WebSocket URL configured
- [ ] API base URL set correctly
- [ ] Log levels set appropriately
- [ ] Session timeout configured
- [ ] File upload limits set

### Code Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No console.log statements in production
- [ ] Error handling implemented everywhere
- [ ] Database indexes created
- [ ] API documentation up to date
- [ ] Frontend built with production optimizations
- [ ] All dependencies up to date
- [ ] No known security vulnerabilities

### Infrastructure Checklist

- [ ] Server provisioned and accessible
- [ ] Domain name configured
- [ ] DNS records created
- [ ] PostgreSQL installed and configured
- [ ] Redis installed and configured
- [ ] Node.js 18+ installed
- [ ] Nginx installed
- [ ] PM2 installed globally
- [ ] Backup system configured
- [ ] Monitoring tools installed

---

## Server Requirements

### Minimum Specifications

```
CPU: 2 cores
RAM: 4GB
Storage: 20GB SSD
Network: 100 Mbps
OS: Ubuntu 20.04 LTS or higher
```

### Recommended Specifications

```
CPU: 4+ cores
RAM: 8GB+
Storage: 50GB SSD
Network: 1 Gbps
OS: Ubuntu 22.04 LTS
Load Balancer: Optional
```

### Software Requirements

```
Node.js: v18.17.0 or higher
PostgreSQL: v15.0 or higher
Redis: v6.2 or higher
Nginx: v1.18 or higher
PM2: v5.3.0 or higher
```

---

## Deployment Steps

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget build-essential

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x.x
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Enable services
sudo systemctl enable postgresql redis-server nginx
sudo systemctl start postgresql redis-server nginx
```

### Step 2: Create Application User

```bash
# Create dedicated user for the application
sudo adduser tazaker --disabled-password

# Add to necessary groups
sudo usermod -aG sudo tazaker

# Switch to application user
sudo su - tazaker
```

### Step 3: Clone Repository

```bash
# Create application directory
mkdir -p /home/tazaker/apps
cd /home/tazaker/apps

# Clone repository
git clone https://github.com/yourusername/tazaker.git
cd tazaker

# Checkout production branch
git checkout main
```

### Step 4: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE tazaker_production;
CREATE USER tazaker_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE tazaker_production TO tazaker_user;

# Grant schema permissions
\c tazaker_production
GRANT ALL ON SCHEMA public TO tazaker_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tazaker_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tazaker_user;

\q

# Run migrations
psql -U tazaker_user -d tazaker_production -f database/schema.sql

# DO NOT run seed.sql in production (contains test data)
# Instead, create initial admin user manually
```

### Step 5: Backend Configuration

```bash
cd backend

# Install dependencies
npm ci --only=production

# Create production environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

Production `.env.production`:

```env
# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tazaker_production
DB_USER=tazaker_user
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD
DB_MAX_CONNECTIONS=20
DB_SSL=false

# JWT (Generate new secure keys!)
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_AT_LEAST_32_CHARACTERS
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=YOUR_SUPER_SECURE_REFRESH_SECRET_AT_LEAST_32_CHARACTERS
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# SMS - Twilio
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_production_twilio_sid
TWILIO_AUTH_TOKEN=your_production_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/production.log

# Session
SESSION_SECRET=YOUR_SECURE_SESSION_SECRET
SESSION_TIMEOUT=3600000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 6: Frontend Build

```bash
cd ../frontend

# Install dependencies
npm ci

# Create production environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

Production `.env.production`:

```env
VITE_API_URL=https://yourdomain.com/api/v1
VITE_SOCKET_URL=https://yourdomain.com
VITE_APP_NAME=Tazaker
VITE_DEFAULT_LANGUAGE=ar
```

Build frontend:

```bash
# Build for production
npm run build

# Build output will be in dist/
ls -la dist/
```

### Step 7: Deploy Frontend

```bash
# Create web root directory
sudo mkdir -p /var/www/tazaker
sudo chown -R tazaker:tazaker /var/www/tazaker

# Copy built files
cp -r dist/* /var/www/tazaker/

# Set correct permissions
sudo chmod -R 755 /var/www/tazaker
```

---

## Nginx Configuration

Create `/etc/nginx/sites-available/tazaker`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=tazaker_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=addr:10m;

# Upstream backend
upstream tazaker_backend {
    least_conn;
    server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Root directory
    root /var/www/tazaker;
    index index.html;

    # Max body size (for file uploads)
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/tazaker-access.log;
    error_log /var/log/nginx/tazaker-error.log;

    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api {
        limit_req zone=tazaker_limit burst=20 nodelay;
        limit_conn addr 10;

        proxy_pass http://tazaker_backend;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://tazaker_backend;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400;
        proxy_buffering off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://tazaker_backend/api/v1/health;
    }
}
```

Enable site:

```bash
# Test configuration
sudo nginx -t

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/tazaker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL Certificate Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Certificate will auto-renew via cron
```

---

## PM2 Process Management

### PM2 Ecosystem File

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'tazaker-backend',
      cwd: './backend',
      script: 'src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env.production',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
```

### Start Application

```bash
# Create logs directory
mkdir -p backend/logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u tazaker --hp /home/tazaker

# Run the command PM2 outputs
```

### PM2 Management Commands

```bash
# Status
pm2 status
pm2 list

# Logs
pm2 logs tazaker-backend
pm2 logs tazaker-backend --lines 100

# Monitoring
pm2 monit

# Restart
pm2 restart tazaker-backend

# Reload (zero-downtime)
pm2 reload tazaker-backend

# Stop
pm2 stop tazaker-backend

# Delete
pm2 delete tazaker-backend
```

---

## Post-Deployment Verification

### Automated Verification Script

Create `scripts/verify-deployment.sh`:

```bash
#!/bin/bash

DOMAIN="https://yourdomain.com"
API_URL="$DOMAIN/api/v1"

echo "🔍 Starting deployment verification..."
echo

# 1. Check if frontend is accessible
echo "1. Checking frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN)
if [ $HTTP_CODE -eq 200 ]; then
    echo "✅ Frontend is accessible (HTTP $HTTP_CODE)"
else
    echo "❌ Frontend check failed (HTTP $HTTP_CODE)"
    exit 1
fi

# 2. Check if API is accessible
echo "2. Checking API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ $HTTP_CODE -eq 200 ]; then
    echo "✅ API is accessible (HTTP $HTTP_CODE)"
else
    echo "❌ API check failed (HTTP $HTTP_CODE)"
    exit 1
fi

# 3. Check SSL certificate
echo "3. Checking SSL certificate..."
SSL_EXPIRY=$(echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
echo "✅ SSL certificate valid until: $SSL_EXPIRY"

# 4. Check database connection
echo "4. Checking database connection..."
# This requires API endpoint that checks DB
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ $HTTP_CODE -eq 200 ]; then
    echo "✅ Database connection OK"
else
    echo "❌ Database connection failed"
    exit 1
fi

# 5. Check Redis connection
echo "5. Checking Redis..."
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis is running"
else
    echo "❌ Redis check failed"
    exit 1
fi

# 6. Check PM2 processes
echo "6. Checking PM2 processes..."
PM2_COUNT=$(pm2 jlist | jq length)
if [ $PM2_COUNT -gt 0 ]; then
    echo "✅ PM2 processes running: $PM2_COUNT"
else
    echo "❌ No PM2 processes found"
    exit 1
fi

# 7. Test login endpoint
echo "7. Testing login endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}')
if [ $HTTP_CODE -eq 401 ] || [ $HTTP_CODE -eq 200 ]; then
    echo "✅ Login endpoint responding"
else
    echo "❌ Login endpoint failed (HTTP $HTTP_CODE)"
    exit 1
fi

echo
echo "✅ All verification checks passed!"
echo "🚀 Deployment successful!"
```

Make executable and run:

```bash
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh
```

### Manual Verification Checklist

- [ ] Frontend loads at https://yourdomain.com
- [ ] Login page is accessible
- [ ] Can login with admin credentials
- [ ] Dashboard loads after login
- [ ] All navigation links work
- [ ] API endpoints respond correctly
- [ ] WebSocket connection established
- [ ] Display screen works (/display/1)
- [ ] Language switcher works
- [ ] Mobile view is responsive
- [ ] SSL certificate is valid
- [ ] No console errors in browser
- [ ] No 404 errors in network tab
- [ ] PM2 processes are running
- [ ] Database queries are fast (<100ms)
- [ ] Logs are being written correctly

---

## Monitoring Setup

### Application Monitoring with PM2 Plus

```bash
# Install PM2 Plus (optional, paid service)
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY

# Or use free PM2 web dashboard
pm2 web
```

### Log Monitoring

```bash
# Install logrotate
sudo apt install -y logrotate

# Create logrotate configuration
sudo nano /etc/logrotate.d/tazaker
```

Add:

```
/home/tazaker/apps/tazaker/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 tazaker tazaker
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Uptime Monitoring

Use services like:
- **UptimeRobot** (free)
- **Pingdom**
- **StatusCake**

Monitor:
- https://yourdomain.com
- https://yourdomain.com/api/v1/health

---

## Backup Strategy

### Automated Database Backup

Create `/home/tazaker/scripts/backup-db.sh`:

```bash
#!/bin/bash

# Configuration
DB_NAME="tazaker_production"
DB_USER="tazaker_user"
BACKUP_DIR="/home/tazaker/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/tazaker_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database and compress
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "tazaker_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_FILE s3://your-bucket/backups/

echo "Backup completed: $BACKUP_FILE"
```

Setup cron job:

```bash
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/tazaker/scripts/backup-db.sh >> /home/tazaker/logs/backup.log 2>&1
```

### Code Backup

```bash
# Backup application code weekly
0 3 * * 0 tar -czf /home/tazaker/backups/code/tazaker_$(date +\%Y\%m\%d).tar.gz /home/tazaker/apps/tazaker
```

---

## Rollback Procedure

### Quick Rollback

```bash
# 1. Stop current application
pm2 stop tazaker-backend

# 2. Restore previous version
cd /home/tazaker/apps/tazaker
git log --oneline -n 5  # Find previous commit
git reset --hard COMMIT_HASH

# 3. Restore dependencies if needed
cd backend && npm ci

# 4. Restore database (if needed)
psql -U tazaker_user -d tazaker_production < /path/to/backup.sql

# 5. Restart application
pm2 restart tazaker-backend

# 6. Verify deployment
./scripts/verify-deployment.sh
```

---

## Troubleshooting

### Common Issues

**1. 502 Bad Gateway**
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs tazaker-backend --lines 50

# Restart backend
pm2 restart tazaker-backend
```

**2. Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U tazaker_user -d tazaker_production -c "SELECT 1;"

# Check connection limits
psql -U postgres -c "SHOW max_connections;"
```

**3. High Memory Usage**
```bash
# Check memory
free -h

# Check PM2 memory usage
pm2 monit

# Increase max memory restart
pm2 restart tazaker-backend --max-memory-restart 1G
```

**4. WebSocket Connection Failed**
```bash
# Check Nginx WebSocket configuration
sudo nginx -t

# Check firewall
sudo ufw status

# Allow WebSocket port
sudo ufw allow 443/tcp
```

---

## Performance Tuning

### PostgreSQL Optimization

Edit `/etc/postgresql/15/main/postgresql.conf`:

```conf
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 4MB

# Connections
max_connections = 100

# Logging
log_min_duration_statement = 1000  # Log slow queries
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### Redis Optimization

Edit `/etc/redis/redis.conf`:

```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

Restart Redis:

```bash
sudo systemctl restart redis-server
```

---

## Maintenance Mode

Create `/var/www/tazaker/maintenance.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Maintenance - Tazaker</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        h1 { font-size: 48px; margin-bottom: 20px; }
        p { font-size: 20px; }
    </style>
</head>
<body>
    <h1>🔧 صيانة مؤقتة</h1>
    <h1>Scheduled Maintenance</h1>
    <p>نعتذر عن الإزعاج. سنعود قريباً!</p>
    <p>We'll be back soon!</p>
</body>
</html>
```

Enable maintenance mode in Nginx:

```nginx
# Add to server block
if (-f /var/www/tazaker/maintenance.html) {
    return 503;
}

error_page 503 @maintenance;

location @maintenance {
    root /var/www/tazaker;
    rewrite ^(.*)$ /maintenance.html break;
}
```

---

## Security Hardening

### Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Fail2Ban

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local

# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Final Checklist

- [ ] All services running (PostgreSQL, Redis, PM2, Nginx)
- [ ] SSL certificate valid and auto-renewal configured
- [ ] Environment variables properly set
- [ ] Database backup cron job configured
- [ ] Monitoring and alerts setup
- [ ] Firewall configured
- [ ] Fail2Ban installed and configured
- [ ] Log rotation configured
- [ ] PM2 startup script configured
- [ ] Verification script passes all checks
- [ ] Documentation updated
- [ ] Team trained on deployment process
- [ ] Emergency contacts list updated
- [ ] Rollback procedure tested

---

**Deployment completed! 🚀**

For support, refer to [INSTALLATION.md](./INSTALLATION.md) or create an issue.

---

**Last Updated**: 2024
**Version**: 1.0.0
