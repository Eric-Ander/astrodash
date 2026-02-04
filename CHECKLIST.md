# 📋 AstroDash Setup Checklist

Use this checklist to track your progress. Check off each item as you complete it!

## ✅ Phase 1: Initial Setup (Day 1)

### Prerequisites
- [ ] Git installed on your computer
- [ ] Docker installed on your computer  
- [ ] GitHub account created
- [ ] Text editor installed (VS Code, Sublime, or similar)

### GitHub Repository
- [ ] Created repository on GitHub (name: `astrodash`)
- [ ] Cloned repository to your computer
- [ ] Verified you can see files locally

### Local Development
- [ ] Extracted AstroDash code into repository
- [ ] Created `backend/.env` file from template
- [ ] Added OpenWeatherMap API key to `.env`
- [ ] Started Docker containers: `docker compose up -d`
- [ ] Opened http://localhost:3000 in browser
- [ ] Verified app is running

### First Commit
- [ ] Added all files: `git add .`
- [ ] Created commit: `git commit -m "Initial commit: Add AstroDash v1.0"`
- [ ] Pushed to GitHub: `git push origin main`
- [ ] Verified files appear on GitHub

**🎉 Milestone: You have AstroDash running locally and on GitHub!**

---

## ✅ Phase 2: Server Deployment (Day 2)

### Server Access
- [ ] Can SSH into server: `ssh root@185.229.119.38`
- [ ] Docker installed on server
- [ ] Docker Compose installed on server

### Deploy Application
- [ ] Cloned repository on server: `git clone https://github.com/YOUR_USERNAME/astrodash.git`
- [ ] Created production `.env` file
- [ ] Started containers: `docker compose up -d`
- [ ] Checked logs: `docker compose logs -f`
- [ ] Verified no errors in logs

### Domain Configuration
- [ ] DNS A record created: `astrodash.ch` → `185.229.119.38`
- [ ] DNS propagated (check with: `nslookup astrodash.ch`)
- [ ] Nginx installed
- [ ] Nginx configuration created
- [ ] Nginx restarted successfully
- [ ] Can access via IP: `http://185.229.119.38:3000`

### SSL Certificate
- [ ] Certbot installed
- [ ] SSL certificate obtained: `sudo certbot --nginx -d astrodash.ch -d www.astrodash.ch`
- [ ] Can access via HTTPS: `https://astrodash.ch`
- [ ] HTTP redirects to HTTPS automatically

**🎉 Milestone: AstroDash is live at https://astrodash.ch!**

---

## ✅ Phase 3: Staging Environment (Day 3)

### DNS Configuration
- [ ] Created subdomain: `staging.astrodash.ch`
- [ ] DNS A record for staging → `185.229.119.38`
- [ ] DNS propagated

### Staging Deployment
- [ ] Created `develop` branch: `git checkout -b develop`
- [ ] Pushed develop branch: `git push origin develop`
- [ ] Started staging on server: `docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d`
- [ ] Verified staging runs on port 3001
- [ ] Created Nginx config for staging
- [ ] Got SSL for staging: `sudo certbot --nginx -d staging.astrodash.ch`
- [ ] Can access: `https://staging.astrodash.ch`

### Testing Workflow
- [ ] Made test change on develop branch
- [ ] Deployed to staging
- [ ] Verified change works
- [ ] Merged to main
- [ ] Deployed to production

**🎉 Milestone: You have staging and production environments!**

---

## ✅ Phase 4: Email Notifications (Day 4)

### SMTP Configuration
- [ ] Created Gmail app password (or other SMTP service)
- [ ] Added SMTP settings to `.env`
- [ ] Restarted application
- [ ] Checked logs for "Email service initialized"

### Testing Notifications
- [ ] Registered test account
- [ ] Saved a location
- [ ] Enabled notifications for location
- [ ] Set cloud threshold (e.g., 20%)
- [ ] Sent test email
- [ ] Received test email in inbox

**🎉 Milestone: Email notifications working!**

---

## ✅ Phase 5: Understanding the Code (Ongoing)

### Backend Exploration
- [ ] Read `backend/src/app.js` - understand main application
- [ ] Read `backend/src/routes/api.js` - understand API endpoints
- [ ] Read a controller file - understand request handling
- [ ] Read a service file - understand business logic
- [ ] Explored database file with SQLite

### Frontend Exploration
- [ ] Read `frontend/public/index.html` - understand page structure
- [ ] Read `frontend/public/css/styles.css` - understand styling
- [ ] Read `frontend/public/js/app.js` - understand frontend logic
- [ ] Tested changing some text and seeing it update

### Making First Change
- [ ] Created feature branch
- [ ] Made a small change (e.g., changed title)
- [ ] Tested locally
- [ ] Committed and pushed
- [ ] Created pull request
- [ ] Merged to main

**🎉 Milestone: You understand the codebase!**

---

## ✅ Phase 6: Plugin Card System (Week 2)

### Understanding Cards
- [ ] Read `docs/CARDS.md`
- [ ] Explored existing card structure
- [ ] Understood manifest.json format

### Creating First Card
- [ ] Created card directory structure
- [ ] Wrote manifest.json
- [ ] Created backend service
- [ ] Created backend routes
- [ ] Created frontend component
- [ ] Tested card locally
- [ ] Deployed to staging
- [ ] Tested on staging
- [ ] Deployed to production

**🎉 Milestone: You can add new features!**

---

## ✅ Phase 7: Advanced Features (Future)

### Night Vision Mode
- [ ] Planned implementation
- [ ] Created card structure
- [ ] Implemented CSS red theme
- [ ] Added toggle button
- [ ] Tested thoroughly
- [ ] Deployed

### Hardware Profiles
- [ ] Designed database schema
- [ ] Created backend API
- [ ] Built frontend UI
- [ ] Tested with real equipment
- [ ] Deployed

### ISS Tracking
- [ ] Found tracking API
- [ ] Implemented backend service
- [ ] Created frontend card
- [ ] Tested tracking accuracy
- [ ] Deployed

---

## 📊 Progress Tracking

**Current Phase:** _____________

**Completed:**
- [ ] Phase 1: Initial Setup
- [ ] Phase 2: Server Deployment
- [ ] Phase 3: Staging Environment
- [ ] Phase 4: Email Notifications
- [ ] Phase 5: Understanding Code
- [ ] Phase 6: Plugin Cards
- [ ] Phase 7: Advanced Features

**Next Steps:**
1. _________________________________
2. _________________________________
3. _________________________________

**Blockers/Questions:**
- _________________________________
- _________________________________
- _________________________________

---

## 🆘 When You Get Stuck

### Quick Troubleshooting

**Problem: Can't start Docker**
- [ ] Is Docker Desktop running?
- [ ] Check: `docker --version`
- [ ] Restart Docker Desktop

**Problem: Port already in use**
- [ ] Check what's using it: `sudo lsof -i :3000`
- [ ] Kill the process or change port

**Problem: Can't connect to server**
- [ ] Check SSH: `ssh root@your-ip`
- [ ] Check firewall: `sudo ufw status`
- [ ] Check if containers running: `docker compose ps`

**Problem: Changes not showing**
- [ ] Hard refresh browser: `Ctrl+F5` or `Cmd+Shift+R`
- [ ] Restart containers: `docker compose restart`
- [ ] Check if you edited correct file

### Getting Help

1. **Check logs:**
   ```bash
   docker compose logs -f
   ```

2. **Search existing issues:**
   https://github.com/YOUR_USERNAME/astrodash/issues

3. **Create new issue:**
   - Include error message
   - Describe what you were doing
   - Attach relevant logs

4. **Ask in discussions:**
   https://github.com/YOUR_USERNAME/astrodash/discussions

---

## 📚 Learning Resources

### Git
- [ ] Completed: https://learngitbranching.js.org/
- [ ] Read: Git basics tutorial
- [ ] Practiced: Creating branches and merging

### Docker
- [ ] Read: Docker getting started guide
- [ ] Understood: Images vs containers
- [ ] Practiced: Basic docker commands

### JavaScript
- [ ] Refreshed: Basic JavaScript syntax
- [ ] Learned: Async/await
- [ ] Understood: Fetch API

### Node.js
- [ ] Read: Node.js introduction
- [ ] Understood: require() and module.exports
- [ ] Learned: Express.js basics

---

## 🎯 Goals

### Short Term (This Week)
- [ ] _________________________________
- [ ] _________________________________
- [ ] _________________________________

### Medium Term (This Month)
- [ ] _________________________________
- [ ] _________________________________
- [ ] _________________________________

### Long Term (This Year)
- [ ] _________________________________
- [ ] _________________________________
- [ ] _________________________________

---

## 📝 Notes

Use this space for your own notes, commands you use frequently, or things you want to remember:

```
Useful Commands:
- 
- 
- 

Server IP: 185.229.119.38

Important URLs:
- Production: https://astrodash.ch
- Staging: https://staging.astrodash.ch
- GitHub: https://github.com/YOUR_USERNAME/astrodash

SMTP Settings:
- Host: 
- User: 
- From: 
```

---

**Last Updated:** _______________

**Next Review:** _______________

---

Remember: Progress, not perfection! 🚀

Every checkbox is a step forward. Keep going!
