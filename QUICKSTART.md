# AstroWeather - Quick Start Guide

## Local Testing (Before Deploying to VPS)

If you want to test the application locally first:

1. **Install Node.js dependencies**:
```bash
cd backend
npm install
```

2. **Start the application**:
```bash
npm start
```

3. **Open in browser**:
```
http://localhost:3000
```

4. **Test the API**:
```bash
# Health check
curl http://localhost:3000/api/health

# Test with a city
curl "http://localhost:3000/api/weather/forecast?city=London"

# Test with coordinates
curl "http://localhost:3000/api/weather/forecast?lat=51.5074&lon=-0.1278"
```

## Deploying to Your Contabo VPS

### Option 1: Automated Deployment (Recommended)

1. **Download and upload files to your VPS**:
```bash
# After downloading astroweather.tar.gz from Claude

# On your local machine - upload to VPS
scp astroweather.tar.gz user@your-vps-ip:/home/user/

# On your VPS - extract the files
ssh user@your-vps-ip
cd /home/user
tar -xzf astroweather.tar.gz
cd astroweather
```

2. **Run the deployment script**:
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Install Docker and Nginx if needed
- Build the Docker container
- Start the application
- Configure Nginx
- Open firewall ports

3. **Access your application**:
```
http://your-vps-ip
```

### Option 2: Manual Deployment

1. **Install Docker and Docker Compose**:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose nginx
sudo systemctl start docker nginx
sudo systemctl enable docker nginx
sudo usermod -aG docker $USER
```

2. **Upload and extract the application** (as shown in Option 1)

3. **Build and start**:
```bash
cd astroweather
docker-compose up -d --build
```

4. **Configure Nginx**:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/astroweather
sudo nano /etc/nginx/sites-available/astroweather
# Edit server_name to your IP or domain

sudo ln -s /etc/nginx/sites-available/astroweather /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

5. **Open firewall**:
```bash
sudo ufw allow 80
sudo ufw allow 443
```

## Verifying the Deployment

1. **Check Docker containers**:
```bash
docker-compose ps
```

2. **Check logs**:
```bash
docker-compose logs -f
```

3. **Test the API**:
```bash
curl http://localhost:3000/api/health
```

4. **Test from browser**:
```
http://your-vps-ip
```

## Common Issues

### Port 3000 already in use
```bash
sudo netstat -tulpn | grep 3000
# Kill the process using port 3000 or change PORT in .env
```

### Can't connect from browser
```bash
# Check firewall
sudo ufw status
sudo ufw allow 80

# Check nginx
sudo systemctl status nginx
sudo nginx -t
```

### Docker permission denied
```bash
sudo usermod -aG docker $USER
# Log out and log back in
```

## Next Steps

After successful deployment:

1. **Setup SSL certificate** (for HTTPS):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

2. **Setup automatic backups**:
```bash
# Create backup script
echo '#!/bin/bash' > backup.sh
echo 'cp backend/data/astroweather.db backend/data/astroweather-$(date +%Y%m%d).db' >> backup.sh
chmod +x backup.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
# Add: 0 2 * * * /path/to/astroweather/backup.sh
```

3. **Monitor logs**:
```bash
# View live logs
docker-compose logs -f

# View specific number of lines
docker-compose logs --tail=100
```

## Support

If you encounter any issues:

1. Check logs: `docker-compose logs -f`
2. Verify API key in `backend/.env`
3. Ensure all ports are open: 80, 443, 3000
4. Restart: `docker-compose restart`

---

**Your OpenWeatherMap API Key**: ffaed453c5056f24b9af3ca60ec5e833
(Already configured in backend/.env)
