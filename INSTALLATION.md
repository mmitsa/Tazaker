# Tazaker - Hospital Queue Management System
## Installation and Deployment Guide

Complete guide for installing and deploying the Hospital Queue Management System (Tazaker).

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Quick Start (Development)](#quick-start-development)
3. [Database Setup](#database-setup)
4. [Backend Installation](#backend-installation)
5. [Frontend Installation](#frontend-installation)
6. [Configuration](#configuration)
7. [Running the System](#running-the-system)
8. [Production Deployment](#production-deployment)
9. [Docker Deployment](#docker-deployment)
10. [Troubleshooting](#troubleshooting)
11. [Security Considerations](#security-considerations)

---

## System Requirements

### Minimum Requirements
- **Operating System**: Linux (Ubuntu 20.04+), macOS, or Windows 10+
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v15.0 or higher
- **Redis**: v6.0 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 10GB minimum
- **Network**: Stable internet connection for SMS services

### Recommended for Production
- **CPU**: 4+ cores
- **RAM**: 16GB+
- **Storage**: SSD with 50GB+
- **Network**: High-speed connection
- **SSL Certificate**: For HTTPS
- **Backup System**: Automated database backups

---

## Quick Start (Development)

For quick development setup:

```bash
# Clone the repository
git clone https://github.com/mmitsa/Tazaker.git
cd Tazaker

# Setup database
createdb tazaker
psql tazaker < database/schema.sql
psql tazaker < database/seed.sql

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev

# Setup frontend (in new terminal)
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Display Screen: http://localhost:3000/display/1

---

## Database Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download and install from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)

### 2. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL console:
CREATE DATABASE tazaker;
CREATE USER tazaker_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tazaker TO tazaker_user;
\q
```

### 3. Run Database Migrations

```bash
# Navigate to database directory
cd database

# Run schema
psql -U tazaker_user -d tazaker -f schema.sql

# Run seed data (optional for development)
psql -U tazaker_user -d tazaker -f seed.sql
```

### 4. Verify Installation

```bash
psql -U tazaker_user -d tazaker

# In PostgreSQL console:
\dt                    # List all tables
SELECT * FROM users;   # Check seed data
\q
```

---

## Backend Installation

### 1. Install Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS:**
```bash
brew install node@18
```

**Verify Installation:**
```bash
node --version  # Should be v18.0.0 or higher
npm --version
```

### 2. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Verify Redis:**
```bash
redis-cli ping
# Should return: PONG
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tazaker
DB_USER=tazaker_user
DB_PASSWORD=your_secure_password
DB_MAX_CONNECTIONS=20

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# SMS Configuration (Twilio)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SMS Configuration (Mobily - Alternative)
# SMS_PROVIDER=mobily
# MOBILY_USERNAME=your_mobily_username
# MOBILY_PASSWORD=your_mobily_password
# MOBILY_SENDER=your_sender_name

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### 5. Start Backend Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Verify Backend:**
```bash
curl http://localhost:5000/api/v1/health
# Should return health status
```

---

## Frontend Installation

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1

# WebSocket Configuration
VITE_SOCKET_URL=http://localhost:5000

# Application Configuration
VITE_APP_NAME=Tazaker
VITE_APP_TITLE=Hospital Queue Management System

# Default Language (ar or en)
VITE_DEFAULT_LANGUAGE=ar
```

### 3. Start Frontend Development Server

```bash
npm run dev
```

**Verify Frontend:**
Open http://localhost:3000 in your browser

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

---

## Configuration

### SMS Provider Setup

#### Option 1: Twilio
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Configure in backend `.env`:
   ```env
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

#### Option 2: Mobily (Saudi Arabia)
1. Register at [Mobily](https://www.mobily.com.sa/)
2. Get API credentials
3. Configure in backend `.env`:
   ```env
   SMS_PROVIDER=mobily
   MOBILY_USERNAME=your_username
   MOBILY_PASSWORD=your_password
   MOBILY_SENDER=HospitalName
   ```

### SSL/TLS Configuration (Production)

For production, always use HTTPS. You can use:
- **Let's Encrypt** (Free SSL certificates)
- **Cloudflare** (Free SSL with DDoS protection)
- **Commercial SSL Certificate**

---

## Running the System

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Redis (if not running as service):**
```bash
redis-server
```

### Access the Application

- **Login Page**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **Display Screen**: http://localhost:3000/display/1 (replace 1 with clinic ID)

### Default Login Credentials

From `database/seed.sql`:

```
Super Admin:
  Username: super_admin
  Password: SuperAdmin@123

Admin:
  Username: admin
  Password: Admin@123

Doctor:
  Username: doctor1
  Password: Doctor@123

Receptionist:
  Username: receptionist1
  Password: Recept@123
```

**⚠️ IMPORTANT: Change these passwords in production!**

---

## Production Deployment

### Option 1: PM2 (Process Manager)

#### 1. Install PM2

```bash
npm install -g pm2
```

#### 2. Create PM2 Ecosystem File

Create `ecosystem.config.js` in the root:

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
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

#### 3. Start with PM2

```bash
# Build frontend
cd frontend
npm run build

# Start backend with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup
```

#### 4. PM2 Management Commands

```bash
pm2 list                 # List all processes
pm2 logs tazaker-backend # View logs
pm2 restart all          # Restart all
pm2 stop all             # Stop all
pm2 delete all           # Delete all
pm2 monit                # Monitor resources
```

### Option 2: Nginx + PM2

#### 1. Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### 2. Configure Nginx

Create `/etc/nginx/sites-available/tazaker`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/tazaker/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Proxy
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 3. Enable Site and Restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/tazaker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Docker Deployment

### 1. Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

### 2. Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: tazaker
      POSTGRES_USER: tazaker_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/1-schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/2-seed.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    depends_on:
      - postgres
      - redis
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: tazaker
      DB_USER: tazaker_user
      DB_PASSWORD: secure_password
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "5000:5000"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "80:80"

volumes:
  postgres_data:
```

### 4. Run with Docker Compose

```bash
docker-compose up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database credentials in `.env`
- Check if database exists: `psql -l`

#### 2. Redis Connection Error

```
Error: Redis connection to localhost:6379 failed
```

**Solution:**
- Check if Redis is running: `redis-cli ping`
- Start Redis: `sudo systemctl start redis`

#### 3. Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### 4. Frontend Build Errors

```
Error: Cannot find module '@/components/...'
```

**Solution:**
- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

#### 5. WebSocket Connection Failed

**Solution:**
- Check CORS settings in backend `.env`
- Verify Socket.IO URL in frontend `.env`
- Check firewall rules

---

## Security Considerations

### Production Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW, iptables)
- [ ] Enable rate limiting
- [ ] Setup database backups
- [ ] Use environment variables for secrets
- [ ] Enable logging and monitoring
- [ ] Implement SQL injection prevention
- [ ] Setup intrusion detection
- [ ] Regular security updates
- [ ] Use strong password policies
- [ ] Enable two-factor authentication (future)

### Database Security

```sql
-- Revoke public access
REVOKE ALL ON DATABASE tazaker FROM PUBLIC;

-- Grant specific privileges
GRANT CONNECT ON DATABASE tazaker TO tazaker_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tazaker_user;
```

### Firewall Configuration (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Monitoring and Maintenance

### Database Backup

**Manual Backup:**
```bash
pg_dump -U tazaker_user tazaker > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Automated Daily Backup (crontab):**
```bash
crontab -e

# Add this line:
0 2 * * * pg_dump -U tazaker_user tazaker > /backups/tazaker_$(date +\%Y\%m\%d).sql
```

### Log Rotation

Create `/etc/logrotate.d/tazaker`:

```
/var/www/tazaker/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor PM2 processes
pm2 monit

# Check logs
pm2 logs tazaker-backend --lines 100
```

---

## Support and Documentation

For additional help:
- **GitHub Issues**: https://github.com/mmitsa/Tazaker/issues
- **Documentation**: See README.md files in each directory
- **API Documentation**: http://your-domain.com/api/docs (if implemented)

---

## License

MIT License - See LICENSE file for details

---

**Last Updated**: 2024
**Version**: 1.0.0
