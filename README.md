# AstroWeather 🌟

AstroWeather is a web application that provides astronomical weather forecasts to help stargazers plan their observation sessions. It analyzes cloud coverage, visibility, humidity, and other weather conditions to determine the best times for astronomical observations.

## Features

### Current Features (v1.3)
- **Location Search**: Enter city name or GPS coordinates
- **Tonight's Forecast**: 3-hour interval weather forecast from 18:00 to 05:00
- **Multi-Day Forecast**: View up to 5 nights of astronomical forecasts
- **Moon Phase Information**: Complete lunar data including:
  - Current moon phase with visual emoji
  - Illumination percentage
  - Moon age in days
  - Visibility impact rating on stargazing
  - Observing recommendations based on moon phase
- **Bortle Scale Light Pollution Rating**: 🌌 NEW!
  - 9-class Bortle Scale rating (Class 1-9)
  - Light pollution quality assessment
  - Limiting magnitude estimation
  - Milky Way visibility information
  - Location-specific observing recommendations
  - Visual color-coded display
- **Astronomical Events Calendar**: 
  - ISS (International Space Station) visible passes
  - Upcoming meteor showers (Perseids, Geminids, etc.)
  - Moon events (New Moon, Full Moon)
  - Solar events (sunrise, sunset, twilight times)
  - Countdown timers for upcoming events
- **Astronomy Score**: Custom scoring algorithm (0-100) based on:
  - Cloud coverage (50% weight)
  - Visibility (20% weight)
  - Humidity (15% weight)
  - Precipitation probability (15% weight)
- **Best Observation Time**: Automatically identifies the optimal hour for stargazing
- **Mobile Responsive**: Works seamlessly on all devices
- **Forecast Caching**: Reduces API calls and improves performance
- **Secure HTTPS**: SSL certificate with custom domain

### Planned Features (Future Versions)
- Localized languages and translations
- User accounts with saved locations
- Email/push notifications for clear nights

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: SQLite
- **Weather API**: OpenWeatherMap
- **Deployment**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy)

## System Requirements

- Ubuntu 22.04 LTS (or similar Linux distribution)
- Docker & Docker Compose
- Nginx
- 2GB+ RAM
- 4+ CPU cores recommended

## Installation & Deployment

### Prerequisites

1. **Install Docker**:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

2. **Install Nginx**:
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Deployment Steps

1. **Upload the application to your VPS**:
```bash
# On your local machine, create a tarball
cd astroweather
tar -czf astroweather.tar.gz .

# Upload to your VPS (replace with your server IP)
scp astroweather.tar.gz user@your-server-ip:/home/user/
```

2. **Extract and setup on VPS**:
```bash
# SSH into your VPS
ssh user@your-server-ip

# Extract the application
mkdir -p ~/astroweather
cd ~/astroweather
tar -xzf ../astroweather.tar.gz

# Set up environment variables
cd backend
cp .env.example .env
# Edit .env and add your OpenWeatherMap API key (already done in this version)

# Create data directory
mkdir -p data
```

3. **Build and start the application**:
```bash
# From the astroweather root directory
cd ~/astroweather
docker-compose up -d --build
```

4. **Verify the application is running**:
```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs -f

# Test the API
curl http://localhost:3000/api/health
```

5. **Configure Nginx**:
```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/astroweather

# Edit the configuration to set your domain or IP
sudo nano /etc/nginx/sites-available/astroweather
# Change "your-domain.com" to your actual domain or server IP

# Enable the site
sudo ln -s /etc/nginx/sites-available/astroweather /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

6. **Access your application**:
- Open a browser and navigate to: `http://your-server-ip`

### Optional: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Certbot will automatically configure HTTPS
# The certificate will auto-renew
```

## Usage

### Search by City Name
1. Enter a city name (e.g., "London", "New York", "Tokyo")
2. Click "Search"
3. View tonight's astronomical forecast

### Search by Coordinates
1. Click the "Coordinates" tab
2. Enter latitude and longitude
3. Click "Search"
4. View tonight's astronomical forecast

### Understanding the Scores

**Astronomy Score (0-100)**:
- **90-100**: Excellent - Perfect conditions for stargazing
- **75-89**: Very Good - Great conditions with minimal interference
- **60-74**: Good - Suitable for most observations
- **45-59**: Fair - Acceptable for bright objects
- **30-44**: Poor - Challenging conditions
- **0-29**: Very Poor - Not recommended for observations

## API Documentation

### Endpoints

#### Get Forecast by City
```
GET /api/weather/forecast?city={city_name}
```

**Example**:
```bash
curl "http://localhost:3000/api/weather/forecast?city=London"
```

#### Get Forecast by Coordinates
```
GET /api/weather/forecast?lat={latitude}&lon={longitude}
```

**Example**:
```bash
curl "http://localhost:3000/api/weather/forecast?lat=51.5074&lon=-0.1278"
```

#### Get Multi-Day Forecast
```
GET /api/weather/forecast/multiday?city={city_name}&days={1-5}
GET /api/weather/forecast/multiday?lat={latitude}&lon={longitude}&days={1-5}
```

**Parameters**:
- `days` (optional): Number of nights to forecast (1-5, default: 5)

**Example**:
```bash
curl "http://localhost:3000/api/weather/forecast/multiday?city=London&days=3"
```

#### Get Astronomical Events
```
GET /api/events?city={city_name}
GET /api/events?lat={latitude}&lon={longitude}
```

Returns all astronomical events including ISS passes, meteor showers, moon events, and solar times.

**Example**:
```bash
curl "http://localhost:3000/api/events?city=London"
```

#### Get ISS Passes Only
```
GET /api/events/iss?lat={latitude}&lon={longitude}
```

**Example**:
```bash
curl "http://localhost:3000/api/events/iss?lat=51.5074&lon=-0.1278"
```

#### Get Meteor Showers Only
```
GET /api/events/meteors
```

**Example**:
```bash
curl "http://localhost:3000/api/events/meteors"
```

#### Health Check
```
GET /api/health
```

**Example**:
```bash
curl "http://localhost:3000/api/health"
```

### Response Format

```json
{
  "location": {
    "name": "London, GB",
    "coordinates": {
      "lat": 51.5074,
      "lon": -0.1278
    },
    "country": "GB"
  },
  "tonight": {
    "start": "2025-01-31T18:00:00.000Z",
    "end": "2025-02-01T05:00:00.000Z"
  },
  "summary": {
    "average_score": 65,
    "average_cloud_coverage": 35,
    "overall_quality": "Good",
    "total_hours": 11
  },
  "best_observation_time": {
    "time": "23:00",
    "datetime": "2025-01-31T23:00:00.000Z",
    "score": 85,
    "quality_rating": "Very Good"
  },
  "hourly_forecast": [...]
}
```

## Management Commands

### View Logs
```bash
docker-compose logs -f astroweather
```

### Restart Application
```bash
docker-compose restart
```

### Stop Application
```bash
docker-compose down
```

### Update Application
```bash
# Pull latest changes
git pull  # if using git

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backup Database
```bash
# Copy the SQLite database
cp backend/data/astroweather.db backend/data/astroweather.db.backup
```

## Troubleshooting

### Application won't start
```bash
# Check Docker logs
docker-compose logs

# Check if port 3000 is already in use
sudo netstat -tulpn | grep 3000

# Restart Docker
sudo systemctl restart docker
docker-compose up -d
```

### Can't access from browser
```bash
# Check if nginx is running
sudo systemctl status nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check firewall
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

### API Key Issues
```bash
# Verify API key in .env file
cat backend/.env | grep OPENWEATHER_API_KEY

# Test API key directly
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"
```

## Performance Optimization

### Caching
The application caches forecast data for 60 minutes by default. You can adjust this in the `.env` file:
```
CACHE_DURATION=60  # minutes
```

### Database Maintenance
```bash
# Clean old cache entries (automatic, but can be done manually)
sqlite3 backend/data/astroweather.db "DELETE FROM forecast_cache WHERE fetched_at < datetime('now', '-24 hours')"
```

## Security Considerations

1. **API Key**: Keep your OpenWeatherMap API key secret
2. **Firewall**: Only expose necessary ports (80, 443)
3. **Updates**: Regularly update the system and Docker images
4. **SSL**: Always use HTTPS in production
5. **Backups**: Regularly backup your database

## Contributing

Future enhancements are planned. Current roadmap includes:
- User authentication system
- Favorite locations management
- Email notifications
- Mobile app
- Extended forecast (multiple days)
- Moon phase calculator
- Light pollution overlay

## License

MIT License

## Credits

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Created for astronomical enthusiasts worldwide

## Support

For issues or questions, check the logs first:
```bash
docker-compose logs -f
```

## Version History

- **v1.3.0** (2025-02-02): Bortle Scale Light Pollution Rating
  - 9-class Bortle Scale implementation (Class 1-9)
  - Estimated light pollution based on location
  - Distance-based calculation from major cities
  - Detailed Bortle class descriptions
  - Limiting magnitude for each class
  - Milky Way visibility information
  - Location-specific observing recommendations
  - Color-coded visual display
  - Mobile-responsive Bortle card
  - Integration with weather forecast

- **v1.2.0** (2025-02-01): Astronomical Events Calendar
  - ISS (International Space Station) visible passes
  - Upcoming meteor showers with peak dates and ZHR
  - Moon events (next New Moon and Full Moon)
  - Solar events (sunrise, sunset, twilight times)
  - Event cards with countdowns for upcoming events
  - Integration with Open Notify API for ISS data
  - Built-in meteor shower database (8 major showers)
  - Astronomical twilight calculations
  - New API endpoints: `/api/events`, `/api/events/iss`, `/api/events/meteors`

- **v1.1.0** (2025-02-01): Moon Phase & Multi-Day Forecast Update
  - Moon phase information with visual display
  - Moon illumination and visibility impact
  - Observing recommendations based on lunar phase
  - Multi-day forecast (up to 5 nights)
  - Toggle between tonight and multi-day views
  - Enhanced UI with moon phase card
  
- **v1.0.0** (2025-01-31): Initial release
  - City and coordinate search
  - Tonight's 3-hour forecast (18:00-05:00)
  - Astronomy quality scoring
  - Mobile responsive design
  - SQLite caching

---

**Happy Stargazing! 🌟🔭**
