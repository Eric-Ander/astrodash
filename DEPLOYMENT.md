# AstroDashboard – Deployment Guide

This document describes how to set up a fresh Ubuntu server, harden its security, and deploy the AstroDashboard application. It is intended for system administrators or developers deploying the application on their own infrastructure.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Initial Server Setup](#2-initial-server-setup)
3. [Create Non-Root Admin User](#3-create-non-root-admin-user)
4. [SSH Hardening](#4-ssh-hardening)
5. [Firewall (UFW)](#5-firewall-ufw)
6. [Fail2ban – Brute Force Protection](#6-fail2ban--brute-force-protection)
7. [Automatic Security Updates](#7-automatic-security-updates)
8. [Install Docker](#8-install-docker)
9. [Install and Configure Nginx](#9-install-and-configure-nginx)
10. [SSL Certificate (Let's Encrypt)](#10-ssl-certificate-lets-encrypt)
11. [Deploy Staging Environment](#11-deploy-staging-environment)
12. [Deploy Production Environment](#12-deploy-production-environment)
13. [Promote the First Admin User](#13-promote-the-first-admin-user)
14. [Updating Staging and Production](#14-updating-staging-and-production)
15. [Security Checklist](#15-security-checklist)

---

## Architecture Overview

AstroDashboard supports running **staging** and **production** environments on the same server:

```
                    ┌─────────────────────────────────────┐
                    │              Nginx                  │
                    │  staging.yourdomain.com → port 3001 │
                    │  www.yourdomain.com     → port 3002 │
                    └─────────────────────────────────────┘
                              │              │
              ┌───────────────┘              └───────────────┐
              ▼                                              ▼
    ┌──────────────────┐                        ┌──────────────────┐
    │ astrodash-staging │                        │ astrodash-prod   │
    │ Container :3001   │                        │ Container :3002  │
    │ ~/astrodash-staging│                       │ ~/astrodash-prod │
    └──────────────────┘                        └──────────────────┘
```

| Environment | Domain | Port | Directory | Container | Branch |
|-------------|--------|------|-----------|-----------|--------|
| Staging | staging.yourdomain.com | 3001 | ~/astrodash-staging | astrodash-staging | feature branches |
| Production | www.yourdomain.com | 3002 | ~/astrodash-prod | astrodash-prod | main |

---

## 1. Prerequisites

### Server
- Ubuntu 22.04 LTS (or later)
- Minimum: 1 vCPU, 1 GB RAM, 10 GB disk
- A domain name pointed to the server's IP address (e.g. `staging.yourdomain.com`)

### Accounts and API Keys Required
- **OpenWeatherMap API key** – free at https://openweathermap.org/api
- **Git access** to this repository

### Local Machine
- SSH client
- An SSH key pair (Ed25519 recommended)

---

## 2. Initial Server Setup

Connect as root and update the system:

```bash
ssh root@your-server-ip

apt update && apt upgrade -y
apt install -y curl wget git ufw fail2ban unattended-upgrades
```

---

## 3. Create Non-Root Admin User

Running everything as root is a security risk. Create a dedicated user:

```bash
adduser astro
usermod -aG sudo astro
```

Verify the user has sudo access:

```bash
su - astro
sudo whoami   # should return: root
exit
```

---

## 4. SSH Hardening

### Copy Your Public Key to the Server

On your **local machine**, generate an SSH key if you don't have one:

```bash
ssh-keygen -t ed25519 -C "astrodash-server"
```

Copy the public key to the server:

```bash
ssh-copy-id astro@your-server-ip
```

### Harden the SSH Configuration

On the server:

```bash
sudo nano /etc/ssh/sshd_config
```

Set the following values (add or update each line):

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
X11Forwarding no
MaxAuthTries 3
LoginGraceTime 30
```

Apply the changes:

```bash
sudo systemctl restart sshd
```

> **Important:** Before closing your current session, open a **second SSH session** to verify you can still connect. If you are locked out, you will need console access via your hosting provider.

---

## 5. Firewall (UFW)

Allow only the necessary ports:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 6. Fail2ban – Brute Force Protection

Create a clean configuration:

```bash
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
backend = systemd
EOF
```

Enable and start the service:

```bash
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
```

---

## 7. Automatic Security Updates

```bash
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

Ensure these lines are uncommented:

```
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
```

Enable the service:

```bash
sudo systemctl enable unattended-upgrades
```

---

## 8. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh

# Allow the astro user to run Docker without sudo
sudo usermod -aG docker astro

# Log out and back in for the group change to take effect
exit
ssh astro@your-server-ip

# Verify installation
docker --version
docker compose version
```

---

## 9. Install and Configure Nginx

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Remove the default placeholder site
sudo rm /etc/nginx/sites-enabled/default
```

### Add Rate Limiting to the Main Nginx Config

```bash
sudo nano /etc/nginx/nginx.conf
```

Inside the `http { ... }` block, add this line near the top:

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # ... rest of existing config
```

### Create the Site Configuration

```bash
sudo nano /etc/nginx/sites-available/astrodash-staging
```

Paste the following (replace `staging.yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name staging.yourdomain.com;

    # Hide nginx version
    server_tokens off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/astrodash-staging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 10. SSL Certificate (Let's Encrypt)

Your domain must be pointed to the server's IP before running this.

```bash
sudo certbot --nginx -d staging.yourdomain.com
```

Certbot will automatically modify the Nginx config to add HTTPS. Verify auto-renewal works:

```bash
sudo certbot renew --dry-run
```

Certificates renew automatically every 90 days.

---

## 11. Deploy Staging Environment

### Clone the Repository

```bash
cd ~
git clone <your-repo-url> astrodash-staging
cd astrodash-staging
git checkout main
```

### Create the Environment File

```bash
nano .env
```

Add the following variables:

```env
NODE_ENV=staging
OPENWEATHER_API_KEY=your_openweathermap_api_key
JWT_SECRET=your_strong_random_secret
```

Generate a strong JWT secret:

```bash
openssl rand -base64 48
```

Copy the output and use it as the value for `JWT_SECRET`.

### Create Data Directory

```bash
mkdir -p backend/data/staging
```

### Start the Staging Container

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
```

### Verify It Is Running

```bash
# Check container status
docker ps

# Check application logs
docker compose -f docker-compose.yml -f docker-compose.staging.yml logs --tail=30
```

The container should show as `Up` (it may show `unhealthy` briefly on first start while the health check initialises – this is normal).

Visit `https://staging.yourdomain.com` in your browser.

---

## 12. Deploy Production Environment

Production runs alongside staging on the same server but with a separate directory, container, database, and domain.

### Clone the Repository for Production

```bash
cd ~
git clone <your-repo-url> astrodash-prod
cd astrodash-prod
git checkout main
```

### Create the Production Environment File

```bash
nano .env
```

Add:

```env
NODE_ENV=production
OPENWEATHER_API_KEY=your_openweathermap_api_key
JWT_SECRET=your_production_jwt_secret
```

> **Important:** Use a **different** JWT secret for production than staging.

Generate a new secret:

```bash
openssl rand -base64 48
```

### Create Data Directory

```bash
mkdir -p backend/data/production
```

### Start the Production Container

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Create Nginx Config for Production

```bash
sudo nano /etc/nginx/sites-available/astrodash-prod
```

Paste:

```nginx
server {
    listen 80;
    server_name www.yourdomain.com yourdomain.com;

    server_tokens off;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/astrodash-prod /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate for Production

```bash
sudo certbot --nginx -d www.yourdomain.com -d yourdomain.com
```

### Verify Production

```bash
docker ps
```

You should see both containers running:

```
astrodash-staging  ... 0.0.0.0:3001->3000/tcp
astrodash-prod     ... 0.0.0.0:3002->3000/tcp
```

Visit `https://www.yourdomain.com` to verify.

---

## 13. Promote the First Admin User

After creating your account through the web interface, run this to grant admin privileges.

### For Staging

```bash
docker exec -it astrodash-staging node -e "
const db = require('./src/config/database');
db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run('your@email.com');
const user = db.prepare('SELECT email, is_admin FROM users WHERE email = ?').get('your@email.com');
console.log('Result:', user);
"
```

### For Production

```bash
docker exec -it astrodash-prod node -e "
const db = require('./src/config/database');
db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run('your@email.com');
const user = db.prepare('SELECT email, is_admin FROM users WHERE email = ?').get('your@email.com');
console.log('Result:', user);
"
```

Log out and back in to the application. The **User Management** option will appear in your user menu.

> **Note:** Staging and production have separate databases. You need to create accounts and promote admins separately in each environment.

---

## 14. Updating Staging and Production

### Development Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Feature    │ ──► │   Staging   │ ──► │ Production  │
│  Branch     │     │   (test)    │     │   (live)    │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. Develop and test on a **feature branch**
2. Deploy to **staging** for testing
3. Merge to **main** when ready
4. Deploy to **production**

### Update Staging

```bash
cd ~/astrodash-staging
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
```

Or to test a feature branch:

```bash
cd ~/astrodash-staging
git fetch origin
git checkout your-feature-branch
git pull origin your-feature-branch
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
```

### Merge Feature Branch to Main

After testing on staging:

```bash
cd ~/astrodash-staging
git checkout main
git pull origin main
git merge your-feature-branch
git push origin main
```

### Update Production

Only deploy to production from the `main` branch:

```bash
cd ~/astrodash-prod
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Quick Reference Commands

**Deploy to staging (one-liner):**

```bash
cd ~/astrodash-staging && git pull origin main && docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
```

**Deploy to production (one-liner):**

```bash
cd ~/astrodash-prod && git pull origin main && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### View Logs

**Staging:**

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml logs --tail=50 -f
```

**Production:**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=50 -f
```

---

## 15. Security Checklist

Run these commands to verify your setup:

| Check | Command |
|-------|---------|
| Firewall is active | `sudo ufw status` |
| Fail2ban is running | `sudo fail2ban-client status sshd` |
| Root login disabled | `grep PermitRootLogin /etc/ssh/sshd_config` |
| Password auth disabled | `grep PasswordAuthentication /etc/ssh/sshd_config` |
| SSL certificate active | `sudo certbot certificates` |
| Docker group membership | `groups` (should include `docker`) |
| Nginx config valid | `sudo nginx -t` |
| Nginx security headers | `curl -I https://staging.yourdomain.com` |
| Application is running | `docker ps` |
