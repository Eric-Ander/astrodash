#!/bin/bash

# AstroWeather Deployment Script
# This script automates the deployment process on Ubuntu 22.04

set -e

echo "================================================"
echo "  AstroWeather Deployment Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please do not run this script as root${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    sudo apt update
    sudo apt install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed successfully${NC}"
    echo -e "${YELLOW}Please log out and log back in for Docker group changes to take effect${NC}"
    echo -e "${YELLOW}Then run this script again${NC}"
    exit 0
else
    echo -e "${GREEN}Docker is installed${NC}"
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing docker-compose...${NC}"
    sudo apt install -y docker-compose
    echo -e "${GREEN}docker-compose installed${NC}"
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx not found. Installing Nginx...${NC}"
    sudo apt update
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    echo -e "${GREEN}Nginx installed successfully${NC}"
else
    echo -e "${GREEN}Nginx is installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Creating data directory...${NC}"
mkdir -p backend/data
echo -e "${GREEN}Data directory created${NC}"

echo ""
echo -e "${YELLOW}Step 3: Checking environment configuration...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Error: backend/.env file not found${NC}"
    echo -e "${YELLOW}Copying .env.example to .env...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}Please edit backend/.env and add your OpenWeatherMap API key${NC}"
    exit 1
fi
echo -e "${GREEN}Environment file found${NC}"

echo ""
echo -e "${YELLOW}Step 4: Building Docker containers...${NC}"
docker-compose down 2>/dev/null || true
docker-compose build
echo -e "${GREEN}Docker containers built${NC}"

echo ""
echo -e "${YELLOW}Step 5: Starting application...${NC}"
docker-compose up -d
echo -e "${GREEN}Application started${NC}"

# Wait for application to start
echo ""
echo -e "${YELLOW}Waiting for application to be ready...${NC}"
sleep 5

# Check if application is running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}Application is running!${NC}"
else
    echo -e "${RED}Application failed to start. Check logs:${NC}"
    echo "docker-compose logs"
    exit 1
fi

# Test health endpoint
echo ""
echo -e "${YELLOW}Testing health endpoint...${NC}"
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}API is responding!${NC}"
else
    echo -e "${RED}API is not responding. Check logs:${NC}"
    echo "docker-compose logs"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 6: Configuring Nginx...${NC}"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Create nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/astroweather

# Ask user for domain or use IP
echo ""
echo -e "${YELLOW}Enter your domain name (or press Enter to use IP: $SERVER_IP):${NC}"
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
    DOMAIN=$SERVER_IP
fi

# Update nginx config with domain/IP
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/astroweather

# Enable site
if [ ! -f "/etc/nginx/sites-enabled/astroweather" ]; then
    sudo ln -s /etc/nginx/sites-available/astroweather /etc/nginx/sites-enabled/
fi

# Test nginx config
if sudo nginx -t 2>&1 | grep -q "successful"; then
    sudo systemctl reload nginx
    echo -e "${GREEN}Nginx configured successfully${NC}"
else
    echo -e "${RED}Nginx configuration failed. Please check manually${NC}"
fi

# Check if firewall is active
if sudo ufw status | grep -q "Status: active"; then
    echo ""
    echo -e "${YELLOW}Firewall is active. Opening ports...${NC}"
    sudo ufw allow 80
    sudo ufw allow 443
    echo -e "${GREEN}Ports 80 and 443 opened${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "================================================"
echo ""
echo -e "Access your application at: ${GREEN}http://$DOMAIN${NC}"
echo ""
echo "Useful commands:"
echo "  - View logs:      docker-compose logs -f"
echo "  - Restart app:    docker-compose restart"
echo "  - Stop app:       docker-compose down"
echo "  - Check status:   docker-compose ps"
echo ""
echo -e "${YELLOW}For SSL setup with Let's Encrypt:${NC}"
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d $DOMAIN"
echo ""
echo "================================================"
