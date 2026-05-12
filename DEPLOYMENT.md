# Deployment Guide

## Prerequisites

- AWS Account
- Domain name (optional)
- Basic knowledge of AWS services

## AWS EC2 Deployment (Linux/Ubuntu)

### 1. Launch EC2 Instance

1. Go to AWS EC2 Dashboard
2. Click "Launch Instance"
3. Select "Ubuntu Server 20.04 LTS"
4. Choose instance type: `t2.micro` (free tier) or `t2.small` for production
5. Configure security groups:
   - Allow SSH (Port 22) from your IP
   - Allow HTTP (Port 80)
   - Allow HTTPS (Port 443)
   - Allow custom TCP (Port 5000) for backend
6. Launch and download key pair

### 2. Connect to Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-instance-ip
```

### 3. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 4. Install Required Software

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL
sudo apt install -y mysql-server

# Nginx
sudo apt install -y nginx

# Git
sudo apt install -y git

# PM2 (Process Manager)
sudo npm install -g pm2
```

### 5. Setup MySQL Database

```bash
# Start MySQL
sudo systemctl start mysql

# Secure installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p << EOF
CREATE DATABASE chat_app;
CREATE USER 'chat_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON chat_app.* TO 'chat_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

### 6. Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/your-repo/real-time-chat-application.git
cd real-time-chat-application
```

### 7. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with production values
nano .env

# Example production .env:
# PORT=5000
# NODE_ENV=production
# DB_HOST=localhost
# DB_USER=chat_user
# DB_PASSWORD=secure_password_here
# DB_NAME=chat_app
# JWT_SECRET=generate-a-long-random-string
# CLIENT_URL=https://your-domain.com

# Sync database
npm run db:sync

# Start with PM2
pm2 start src/index.js --name "chat-backend"

# Make PM2 start on reboot
pm2 startup
pm2 save
```

### 8. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Edit .env.local
nano .env.local

# Example:
# VITE_API_URL=https://your-domain.com/api
# VITE_SOCKET_URL=https://your-domain.com

# Build
npm run build

# The build output is in dist/ folder
```

### 9. Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/chat-app

# Add this configuration:

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        root /home/ubuntu/real-time-chat-application/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
    }

    # File uploads
    location /uploads {
        alias /home/ubuntu/real-time-chat-application/backend/uploads;
        expires 90d;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 10. SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 11. Firewall Setup

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

## Docker Deployment (Optional)

### Create Docker Compose File

```bash
# In project root
nano docker-compose.yml
```

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: chat-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: chat_app
      MYSQL_USER: chat_user
      MYSQL_PASSWORD: chat_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: chat-backend
    environment:
      NODE_ENV: production
      PORT: 5000
      DB_HOST: mysql
      DB_USER: chat_user
      DB_PASSWORD: chat_password
      DB_NAME: chat_app
      JWT_SECRET: your_secret_key
      CLIENT_URL: http://localhost
    ports:
      - "5000:5000"
    depends_on:
      - mysql

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: chat-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

### Backend Dockerfile

```bash
nano backend/Dockerfile
```

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Frontend Dockerfile

```bash
nano frontend/Dockerfile
```

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Frontend Nginx Config

```bash
nano frontend/nginx.conf
```

```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }
    location /api {
        proxy_pass http://backend:5000/api;
    }
}
```

### Run Docker Compose

```bash
docker-compose up -d
```

## Monitoring & Maintenance

### Check Backend Status
```bash
pm2 status
pm2 logs chat-backend
```

### Monitor System
```bash
# CPU and Memory
top

# Disk space
df -h

# Log files
sudo tail -f /var/log/nginx/error.log
```

### Backup Database
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mysqldump -u chat_user -p'password' chat_app > $BACKUP_DIR/chat_app_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

## Performance Tuning

### MySQL Optimization
```sql
-- Add indexes
CREATE INDEX idx_chatId ON Messages(chatId);
CREATE INDEX idx_senderId ON Messages(senderId);
CREATE INDEX idx_userId ON Chats(user1Id, user2Id);
```

### Nginx Gzip Compression
```nginx
gzip on;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript;
gzip_vary on;
gzip_min_length 1000;
```

## Troubleshooting

### Backend won't start
```bash
pm2 logs chat-backend
npm run db:sync
```

### Nginx 502 Bad Gateway
```bash
sudo systemctl restart nginx
pm2 restart chat-backend
```

### Database connection error
```bash
sudo systemctl status mysql
mysql -u chat_user -p chat_app
```

### SSL certificate expired
```bash
sudo certbot renew --dry-run
sudo certbot renew
```

## Monitoring Tools

### Install NodeJS Monitoring
```bash
npm install -g clinic
clinic doctor -- node src/index.js
```

### Enable PM2 Monitoring
```bash
pm2 install pm2-auto-pull
pm2 install pm2-logrotate
```

## Conclusion

Your application is now deployed on AWS with:
- ✅ HTTPS/SSL
- ✅ Auto-scaling ready
- ✅ Database persistence
- ✅ Real-time Socket.IO
- ✅ Load balancing ready

For production, consider:
- CloudFront CDN
- RDS for managed MySQL
- ElastiCache for sessions
- S3 for file storage
