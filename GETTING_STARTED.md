# 🚀 Getting Started with AstroDash - Step by Step Guide

> **For developers new to Git, Docker, and web development**

This guide will walk you through everything from zero to having AstroDash running. Don't worry if you're not an expert - I'll explain each step!

## 📚 What You'll Learn

1. How to use Git and GitHub (version control)
2. How to work with Docker (containerization)
3. How the AstroDash architecture works
4. How to add new features safely
5. How to deploy to production

---

## Part 1: Understanding the Basics (10 minutes reading)

### What is Git?

Git is like "Track Changes" in Microsoft Word, but for code. It:
- Saves every version of your code
- Lets multiple people work on the same code
- Lets you undo mistakes easily

**Key Git Concepts:**
- **Repository (repo)**: A folder containing your project and its history
- **Commit**: A saved snapshot of your code
- **Branch**: A separate version of your code (like a parallel universe)
- **Push**: Upload your changes to GitHub
- **Pull**: Download changes from GitHub

### What is Docker?

Docker is like a "shipping container" for your app. It:
- Packages your app with everything it needs
- Runs the same way on any computer
- Makes deployment super easy

**Key Docker Concepts:**
- **Image**: A blueprint for your app
- **Container**: A running instance of your app
- **docker-compose**: Tool to run multiple containers together

### What is AstroDash's Architecture?

```
AstroDash is like a restaurant:

Frontend (Website)     = Dining Room (what customers see)
Backend (API Server)   = Kitchen (where work happens)
Database              = Pantry (where data is stored)
Cards (Plugins)       = Menu Items (features you can add/remove)
```

---

## Part 2: Setting Up Your Computer (15 minutes)

### Step 1: Install Git

**On Mac:**
```bash
# Open Terminal and run:
git --version
# If not installed, follow prompts to install
```

**On Windows:**
1. Download from: https://git-scm.com/download/win
2. Install with default options
3. Open "Git Bash" (installed with Git)

**On Linux:**
```bash
sudo apt update
sudo apt install git
```

**Verify it works:**
```bash
git --version
# Should show: git version 2.x.x
```

### Step 2: Install Docker

**On Mac:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install it
3. Start Docker Desktop

**On Windows:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install it (requires WSL2)
3. Start Docker Desktop

**On Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**Verify it works:**
```bash
docker --version
# Should show: Docker version 20.x.x

docker compose version
# Should show: Docker Compose version 2.x.x
```

### Step 3: Set Up GitHub Account

1. Go to https://github.com
2. Click "Sign up" (if you don't have an account)
3. Verify your email
4. You're ready!

---

## Part 3: Creating Your AstroDash Repository (10 minutes)

### Step 1: Create Repository on GitHub

1. Go to https://github.com
2. Click the "+" in top right → "New repository"
3. Repository name: `astrodash`
4. Description: "Amateur Astronomer's Dashboard"
5. Choose "Public" (or "Private" if you prefer)
6. ✅ Check "Add a README file"
7. Choose license: "MIT License"
8. Click "Create repository"

**🎉 You now have a GitHub repository!**

### Step 2: Clone Repository to Your Computer

Open Terminal/Git Bash and run:

```bash
# Navigate to where you want the code
cd ~/Documents  # or wherever you keep projects

# Clone your repository (replace YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/astrodash.git

# Go into the folder
cd astrodash

# You should see:
ls
# Shows: README.md  LICENSE
```

**🎉 You now have the code on your computer!**

---

## Part 4: Adding the AstroDash Code (15 minutes)

Now we'll add the actual AstroDash application code to your repository.

### Understanding the Structure First

```
astrodash/
├── README.md              ← Main documentation (you'll update this)
├── LICENSE               ← MIT license
├── .gitignore           ← Tells Git what NOT to save
├── docker-compose.yml    ← Tells Docker how to run the app
│
├── backend/             ← Server-side code (Node.js)
│   ├── package.json     ← Lists dependencies
│   ├── .env.example     ← Template for configuration
│   ├── Dockerfile       ← Instructions to build backend
│   └── src/            ← Your actual code
│       ├── app.js      ← Main application
│       ├── services/   ← Business logic
│       ├── controllers/← API endpoints
│       └── config/     ← Configuration
│
├── frontend/           ← Client-side code (HTML/CSS/JS)
│   └── public/
│       ├── index.html  ← Main page
│       ├── css/        ← Stylesheets
│       └── js/         ← JavaScript
│
├── cards/              ← Plugin cards (features)
│   ├── weather/        ← Weather card
│   ├── moon/          ← Moon phase card
│   └── ...            ← More cards
│
└── docs/              ← Additional documentation
    ├── ARCHITECTURE.md
    └── API.md
```

### Step-by-Step: Adding Files

I'll provide you with a complete package. Here's how to add it:

```bash
# 1. Download the AstroDash package (I'll create this for you)
# You'll receive: astrodash-v1.0.tar.gz

# 2. Extract it in your repository folder
cd ~/Documents/astrodash
tar -xzf ~/Downloads/astrodash-v1.0.tar.gz

# 3. Check what was added
ls -la
# You should see: backend/, frontend/, cards/, docs/, etc.

# 4. Add everything to Git
git add .

# 5. Save (commit) your changes
git commit -m "Initial commit: Add AstroDash v1.0"

# 6. Upload to GitHub
git push origin main
```

**🎉 Your code is now on GitHub!**

Visit: `https://github.com/YOUR_USERNAME/astrodash`

---

## Part 5: Running AstroDash Locally (10 minutes)

Now let's run AstroDash on your computer!

### Step 1: Configure Environment

```bash
# 1. Copy the example environment file
cp backend/.env.example backend/.env

# 2. Edit it (use nano, vim, or any text editor)
nano backend/.env

# 3. Add your OpenWeatherMap API key
# Get free key at: https://openweathermap.org/api
# Update this line:
OPENWEATHER_API_KEY=your_actual_key_here

# Save and exit (in nano: Ctrl+X, then Y, then Enter)
```

### Step 2: Start AstroDash

```bash
# Make sure you're in the astrodash folder
cd ~/Documents/astrodash

# Start everything with Docker
docker compose up -d

# The -d means "detached" (runs in background)
```

**Wait 30 seconds for everything to start...**

### Step 3: Check if it's Running

```bash
# Check status
docker compose ps

# Should show:
# NAME              STATUS
# astrodash         Up

# View logs (to see if there are errors)
docker compose logs -f

# Press Ctrl+C to stop viewing logs
```

### Step 4: Open in Browser

Open your web browser and go to:
```
http://localhost:3000
```

**🎉 AstroDash is running on your computer!**

### Common Issues:

**Problem: Port 3000 already in use**
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill it (replace PID with the number shown)
kill -9 PID

# Or change AstroDash to use different port
# Edit docker-compose.yml: "3001:3000"
```

**Problem: Docker not running**
```bash
# Start Docker Desktop app
# Wait for it to show "Docker is running"
```

---

## Part 6: Making Your First Change (15 minutes)

Let's make a simple change to understand the workflow.

### The Development Workflow

```
1. Create a branch (safe place to experiment)
2. Make changes
3. Test locally
4. Commit changes
5. Push to GitHub
6. Create Pull Request
7. Merge to main
```

### Example: Change the App Title

**Step 1: Create a Branch**
```bash
# Create and switch to new branch
git checkout -b change-title

# Verify you're on the branch
git branch
# Shows: * change-title
```

**Step 2: Make the Change**
```bash
# Open the main HTML file
nano frontend/public/index.html

# Find this line (around line 50):
<h1 class="logo">
    <span class="star-icon">✨</span>
    <span>AstroDash</span>
</h1>

# Change to:
<h1 class="logo">
    <span class="star-icon">🔭</span>
    <span>My AstroDash</span>
</h1>

# Save and exit
```

**Step 3: See Your Change**
```bash
# Restart Docker to see changes
docker compose restart

# Open browser: http://localhost:3000
# The title should now say "My AstroDash" with 🔭
```

**Step 4: Commit Your Change**
```bash
# See what changed
git status
# Shows: modified: frontend/public/index.html

# Stage the change
git add frontend/public/index.html

# Commit with a message
git commit -m "Change app title and icon"
```

**Step 5: Push to GitHub**
```bash
# Push your branch to GitHub
git push origin change-title
```

**Step 6: Create Pull Request**
1. Go to GitHub: `https://github.com/YOUR_USERNAME/astrodash`
2. You'll see: "change-title had recent pushes"
3. Click "Compare & pull request"
4. Add description: "Changed the app title and icon"
5. Click "Create pull request"

**Step 7: Merge (or Wait for Review)**
1. If you're working alone: Click "Merge pull request"
2. If working with others: Wait for review
3. After merge: Your change is in the main code!

**Step 8: Update Your Local Main**
```bash
# Switch back to main branch
git checkout main

# Get the latest code (including your merged change)
git pull origin main

# Delete the old branch (cleanup)
git branch -d change-title
```

**🎉 You just completed a full development cycle!**

---

## Part 7: Deploying to Your Server (20 minutes)

Now let's put AstroDash on your real server (VPS).

### Step 1: Connect to Your Server

```bash
# SSH into your VPS (replace with your IP)
ssh root@185.229.119.38

# You're now on your server!
# The prompt changes to: root@yourserver:~#
```

### Step 2: Install Docker (if not already installed)

```bash
# Quick install script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify
docker --version
```

### Step 3: Clone Your Repository

```bash
# Go to home directory
cd ~

# Clone your repo (replace YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/astrodash.git

# Enter folder
cd astrodash
```

### Step 4: Configure for Production

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit with your production settings
nano backend/.env

# Update these:
NODE_ENV=production
OPENWEATHER_API_KEY=your_key
APP_URL=https://astrodash.ch
SMTP_USER=your_email  # if using notifications

# Save and exit
```

### Step 5: Start AstroDash

```bash
# Start in production mode
docker compose up -d

# Check logs
docker compose logs -f

# Press Ctrl+C when done viewing
```

### Step 6: Configure Domain (astrodash.ch)

**DNS Configuration:**
1. Log into your domain provider (where you bought astrodash.ch)
2. Add an A record:
   - Name: `@` (or leave blank)
   - Type: `A`
   - Value: `185.229.119.38` (your server IP)
   - TTL: `3600`
3. Add a CNAME record for www:
   - Name: `www`
   - Type: `CNAME`
   - Value: `astrodash.ch`
4. Save changes (takes 5-60 minutes to propagate)

**Nginx Setup:**
```bash
# Install Nginx
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# Create config
sudo nano /etc/nginx/sites-available/astrodash
```

Add this content:
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
    }
}
```

Enable the site:
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/astrodash /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

**Get SSL Certificate:**
```bash
# Get free SSL certificate
sudo certbot --nginx -d astrodash.ch -d www.astrodash.ch

# Follow the prompts:
# 1. Enter your email
# 2. Agree to terms
# 3. Choose: Redirect HTTP to HTTPS (option 2)
```

**🎉 AstroDash is live at https://astrodash.ch!**

---

## Part 8: Daily Workflow (Reference)

Here's what you'll do regularly:

### Making Changes

```bash
# 1. Update your local code
git pull origin main

# 2. Create branch for new feature
git checkout -b feature/my-feature

# 3. Make your changes
# Edit files...

# 4. Test locally
docker compose restart

# 5. Commit
git add .
git commit -m "Add my feature"

# 6. Push
git push origin feature/my-feature

# 7. Create Pull Request on GitHub
# 8. Merge when ready
# 9. Deploy to production (see below)
```

### Deploying Updates

```bash
# SSH into server
ssh root@185.229.119.38

# Go to project
cd ~/astrodash

# Get latest code
git pull origin main

# Restart (no rebuild if only code changed)
docker compose restart

# Or rebuild if dependencies changed
docker compose down
docker compose build
docker compose up -d
```

### Checking Logs

```bash
# View all logs
docker compose logs -f

# View recent logs
docker compose logs --tail=100

# View specific service logs
docker compose logs backend -f
```

---

## Part 9: Getting Help

### When Something Goes Wrong

1. **Check logs first:**
   ```bash
   docker compose logs -f
   ```

2. **Google the error message**
   - Copy the exact error
   - Search: "docker [your error message]"

3. **Check GitHub Issues:**
   - https://github.com/YOUR_USERNAME/astrodash/issues

4. **Ask for help:**
   - Create an issue on GitHub
   - Include: error message, what you were doing, logs

### Learning Resources

- **Git:** https://learngitbranching.js.org/ (interactive!)
- **Docker:** https://docker-curriculum.com/
- **JavaScript:** https://javascript.info/
- **Node.js:** https://nodejs.dev/learn

---

## Part 10: Quick Reference

### Essential Commands

```bash
# Git
git status                    # See changes
git add .                     # Stage all changes
git commit -m "message"       # Save changes
git push origin branch-name   # Upload to GitHub
git pull origin main          # Download latest

# Docker
docker compose up -d          # Start
docker compose down           # Stop
docker compose restart        # Restart
docker compose logs -f        # View logs
docker compose ps             # Check status

# Server
ssh user@server-ip            # Connect to server
cd ~/astrodash                # Go to project
git pull                      # Update code
docker compose restart        # Apply changes
```

### File Locations

```bash
# Configuration
backend/.env                  # Environment variables

# Logs
docker compose logs           # Application logs

# Database
backend/data/prod/astrodash.db  # Production database

# Important files
frontend/public/index.html    # Main webpage
backend/src/app.js           # Main server file
```

---

## 🎓 You're Ready!

You now know how to:
- ✅ Use Git and GitHub
- ✅ Work with Docker
- ✅ Run AstroDash locally
- ✅ Make changes safely
- ✅ Deploy to production
- ✅ Troubleshoot issues

**Next Steps:**
1. Read [CONTRIBUTING.md](CONTRIBUTING.md) to add features
2. Check [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand the system
3. Try adding your first card!

**Remember:** Everyone was a beginner once. Don't hesitate to ask questions!

---

**Happy coding! 🚀🔭**

Clear skies and clean code!
