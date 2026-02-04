# 🚀 AstroDash Deployment Guide

Step-by-step guide to deploy AstroDash to your server with staging and production environments.

## 📋 Prerequisites

- ✅ Server with Ubuntu (you have: 185.229.119.38)
- ✅ Domain configured (astrodash.ch)
- ✅ SSH access to server
- ✅ Code on GitHub

---

## Part 1: Initial Server Setup (One-Time)

### Step 1: Connect to Server

```bash
# From your Windows PC (Git Bash)
ssh root@185.229.119.38
```

### Step 2: Install Docker (if not already installed)

```bash
# Quick install script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
docker compose version
```

### Step 3: Install Nginx & Certbot

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

---

## Part 2: Deploy Production Environment

### Step 1: Clone Repository

```bash
# Go to home directory
cd ~

# Clone your repository (replace YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/astrodash.git

# Enter directory
cd astrodash

# Verify files
ls -la
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit configuration
nano backend/.env
```

**Important settings to change:**
```bash
# Required:
OPENWEATHER_API_KEY=your_actual_api_key

# Recommended:
JWT_SECRET=generate_random_string_here
APP_URL=https://astrodash.ch

# Optional (for email notifications):
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Start Production

```bash
# Start containers in background
docker compose up -d

# Check if running
docker compose ps

# View logs (Ctrl+C to exit)
docker compose logs -f
```

**You should see:**
```
astrodash  Up  0.0.0.0:3000->3000/tcp
```

**Test it:**
```bash
# From server
curl http://localhost:3000

# Should return HTML
```

---

## Part 3: Configure Domain & SSL

### Step 1: Configure DNS

**On your domain provider** (where you bought astrodash.ch):

1. Add A record:
   ```
   Type: A
   Name: @
   Value: 185.229.119.38
   TTL: 3600
   ```

2. Add CNAME for www:
   ```
   Type: CNAME
   Name: www
   Value: astrodash.ch
   TTL: 3600
   ```

3. Save and wait 5-60 minutes for DNS to propagate

**Check DNS propagation:**
```bash
# From server or your PC
nslookup astrodash.ch

# Should show: 185.229.119.38
```

### Step 2: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/astrodash
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name astrodash.ch www.astrodash.ch;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed later)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable the site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/astrodash /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Should show: test is successful

# Restart Nginx
sudo systemctl restart nginx
```

**Test it:**
```
Open browser: http://astrodash.ch
You should see AstroDash!
```

### Step 3: Get SSL Certificate

```bash
# Get free SSL from Let's Encrypt
sudo certbot --nginx -d astrodash.ch -d www.astrodash.ch

# Follow prompts:
# 1. Enter your email
# 2. Agree to terms (Y)
# 3. Receive newsletters? (your choice)
# 4. Redirect HTTP to HTTPS? Choose: 2 (Redirect)
```

**Test HTTPS:**
```
Open browser: https://astrodash.ch
Should work with green lock icon! 🔒
```

---

## Part 4: Deploy Staging Environment

### Step 1: Configure Staging DNS

**On your domain provider:**

Add subdomain:
```
Type: A
Name: staging
Value: 185.229.119.38
TTL: 3600
```

**Wait for DNS propagation, then check:**
```bash
nslookup staging.astrodash.ch
# Should show: 185.229.119.38
```

### Step 2: Create Develop Branch

```bash
# On server, in ~/astrodash
cd ~/astrodash

# Create and push develop branch
git checkout -b develop
git push origin develop
```

### Step 3: Start Staging Container

```bash
# Start staging alongside production
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Check both containers
docker compose ps

# Should see:
# astrodash          Up  0.0.0.0:3000->3000/tcp  (production)
# astrodash-staging  Up  0.0.0.0:3001->3000/tcp  (staging)
```

### Step 4: Configure Nginx for Staging

```bash
# Create staging configuration
sudo nano /etc/nginx/sites-available/staging-astrodash
```

**Paste this:**
```nginx
server {
    listen 80;
    server_name staging.astrodash.ch;
    
    # Password protection (optional but recommended)
    auth_basic "Staging Environment";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Create password for staging (optional):**
```bash
# Install password tool
sudo apt install -y apache2-utils

# Create password
sudo htpasswd -c /etc/nginx/.htpasswd admin

# Enter password when prompted
# Remember this password - you'll need it to access staging
```

**Enable staging site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/staging-astrodash /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 5: Get SSL for Staging

```bash
# Get SSL certificate
sudo certbot --nginx -d staging.astrodash.ch

# Follow prompts (same as before)
```

**Test staging:**
```
Open browser: https://staging.astrodash.ch
Enter username: admin
Enter password: (the one you created)
Should see AstroDash staging!
```

---

## Part 5: Daily Workflow

### Deploying to Staging (Test First)

```bash
# On your Windows PC
git checkout develop
git add .
git commit -m "Add new feature"
git push origin develop

# On server
ssh root@185.229.119.38
cd ~/astrodash
git checkout develop
git pull origin develop
docker compose -f docker-compose.yml -f docker-compose.staging.yml restart

# Test at: https://staging.astrodash.ch
```

### Deploying to Production (After Testing)

```bash
# On your Windows PC
git checkout main
git merge develop
git push origin main

# On server
ssh root@185.229.119.38
cd ~/astrodash
git checkout main
git pull origin main
docker compose restart

# Live at: https://astrodash.ch
```

---

## Part 6: Maintenance Commands

### View Logs

```bash
# Production logs
docker compose logs -f

# Staging logs
docker compose -f docker-compose.yml -f docker-compose.staging.yml logs -f

# Last 100 lines
docker compose logs --tail=100

# Follow specific service
docker compose logs -f astrodash
```

### Restart Services

```bash
# Restart production
docker compose restart

# Restart staging
docker compose -f docker-compose.yml -f docker-compose.staging.yml restart

# Restart both
docker compose restart && \
docker compose -f docker-compose.yml -f docker-compose.staging.yml restart
```

### Update Code

```bash
# Update production
cd ~/astrodash
git checkout main
git pull origin main
docker compose restart

# Update staging
git checkout develop
git pull origin develop
docker compose -f docker-compose.yml -f docker-compose.staging.yml restart
```

### Check Status

```bash
# See running containers
docker compose ps

# See resource usage
docker stats

# Check Nginx
sudo systemctl status nginx
sudo nginx -t
```

### Database Backup

```bash
# Backup production database
cp ~/astrodash/backend/data/prod/astrodash.db \
   ~/backups/astrodash-prod-$(date +%Y%m%d).db

# Backup staging database
cp ~/astrodash/backend/data/staging/astrodash.db \
   ~/backups/astrodash-staging-$(date +%Y%m%d).db

# Create backup directory if needed
mkdir -p ~/backups
```

### Renew SSL Certificates

```bash
# Certificates auto-renew, but you can test:
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew
sudo systemctl reload nginx
```

---

## Part 7: Troubleshooting

### Can't access astrodash.ch

1. **Check DNS:**
   ```bash
   nslookup astrodash.ch
   # Should show: 185.229.119.38
   ```

2. **Check Nginx:**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. **Check Docker:**
   ```bash
   docker compose ps
   # Should show: Up
   ```

4. **Check logs:**
   ```bash
   docker compose logs --tail=50
   ```

### Container won't start

```bash
# Check logs
docker compose logs

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Port already in use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process
kill -9 PID
```

### SSL certificate errors

```bash
# Check certificates
sudo certbot certificates

# Renew all
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

### Database is locked

```bash
# Stop containers
docker compose down

# Check for processes
ps aux | grep astrodash

# Start again
docker compose up -d
```

---

## Part 8: Monitoring

### Set Up Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/astrodash
```

```
/var/log/astrodash/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
```

### Monitor Disk Space

```bash
# Check disk usage
df -h

# Check Docker usage
docker system df

# Clean up old Docker images
docker system prune -a
```

### Set Up Automated Backups

```bash
# Create backup script
nano ~/backup-astrodash.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
mkdir -p ~/backups
cp ~/astrodash/backend/data/prod/astrodash.db ~/backups/astrodash-prod-$DATE.db
# Keep only last 30 days
find ~/backups -name "astrodash-*.db" -mtime +30 -delete
```

```bash
# Make executable
chmod +x ~/backup-astrodash.sh

# Add to crontab (daily at 3 AM)
crontab -e
```

Add line:
```
0 3 * * * /root/backup-astrodash.sh
```

---

## ✅ Deployment Checklist

### Initial Setup
- [ ] Server accessible via SSH
- [ ] Docker installed
- [ ] Nginx installed
- [ ] Certbot installed
- [ ] Code cloned from GitHub
- [ ] .env file configured
- [ ] Production container running
- [ ] DNS configured
- [ ] Nginx configured
- [ ] SSL certificate obtained
- [ ] https://astrodash.ch works

### Staging Setup
- [ ] Staging DNS configured
- [ ] Develop branch created
- [ ] Staging container running
- [ ] Staging Nginx configured
- [ ] Staging password set (optional)
- [ ] Staging SSL obtained
- [ ] https://staging.astrodash.ch works

### Maintenance
- [ ] Backups configured
- [ ] Log rotation set up
- [ ] Monitoring in place
- [ ] SSL auto-renewal tested

---

## 📞 Need Help?

- Check logs: `docker compose logs -f`
- GitHub Issues: https://github.com/YOUR_USERNAME/astrodash/issues
- Email: your-email@example.com

---

**Your setup:**
- Production: https://astrodash.ch (port 3000)
- Staging: https://staging.astrodash.ch (port 3001)
- Server: 185.229.119.38

**Clear skies! 🌟**
