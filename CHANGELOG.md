# Changelog

All notable changes to AstroWeather will be documented in this file.

## [1.2.0] - 2025-02-01

### Added
- **Astronomical Events Calendar** 🌠
  - ISS (International Space Station) visible passes
    - Next 5 visible passes for user location
    - Pass times and duration
    - Uses Open Notify API
  - Upcoming Meteor Showers
    - 8 major annual meteor showers database
    - Peak dates and ZHR (Zenithal Hourly Rate)
    - Active periods and best viewing times
    - Includes: Quadrantids, Lyrids, Eta Aquarids, Perseids, Orionids, Leonids, Geminids, Ursids
  - Moon Events
    - Next New Moon date
    - Next Full Moon date
    - Countdown timers
    - Observation recommendations
  - Solar Events
    - Sunrise and sunset times
    - Civil, nautical, and astronomical twilight
    - Day length calculation
    - Best times for astronomical observations

- **Backend Services**
  - New `astronomicalEventsService.js` with comprehensive event calculations
  - ISS pass API integration (Open Notify)
  - Meteor shower database
  - Solar time calculations using astronomical formulas
  - Moon event calculations
  
- **API Endpoints**
  - `GET /api/events` - All astronomical events for location
  - `GET /api/events/iss` - ISS passes only
  - `GET /api/events/meteors` - Meteor showers only

- **UI Components**
  - Events grid layout with color-coded cards
  - Event cards for ISS, meteors, moon, and solar events
  - Countdown badges for upcoming events
  - Responsive design for events section
  - Event icons and visual indicators

### Technical Details
- Astronomical twilight calculations using solar declination
- ISS pass data cached from Open Notify API
- Meteor shower peak date calculations
- Integration with existing moon phase service
- Event filtering and sorting by date

## [1.1.0] - 2025-02-01

### Added
- **Moon Phase Information**
  - Visual moon phase emoji display
  - Current phase name (New Moon, Waxing Crescent, etc.)
  - Illumination percentage
  - Moon age in days
  - Visibility impact rating (Excellent to Very Poor)
  - Observation recommendations based on lunar phase
  - Moon rise and set times (estimated)
  
- **Multi-Day Forecast**
  - View up to 5 nights of astronomical forecasts
  - Toggle button to switch between tonight and multi-day views
  - Each night shows:
    - Date and moon phase
    - Summary statistics (quality, score, clouds)
    - Best observation time
    - Complete 3-hour forecast data
  - New API endpoint: `/api/weather/forecast/multiday`
  
- **Backend Services**
  - New `moonPhaseService.js` for lunar calculations
  - Enhanced `weatherService.js` with multi-day support
  - Moon phase calculations using astronomical algorithms
  
- **UI Enhancements**
  - Moon phase display card with golden styling
  - Multi-day forecast grid layout
  - Night cards with moon and summary information
  - Responsive design for new components
  - Toggle button for view switching

### Changed
- Updated forecast title to accurately reflect "3-Hour Forecast" intervals
- Enhanced API response to include moon phase data
- Improved controller to handle multi-day requests
- Better mobile responsiveness for new features

### Technical Details
- Added moon phase calculation algorithm based on lunar cycle (29.53059 days)
- Implemented visibility impact scoring based on illumination
- Multi-day forecast processes each night (18:00-05:00) separately
- Moon phase included in multi-day forecast for planning

## [1.0.0] - 2025-01-31

### Initial Release
- Location search by city name or GPS coordinates
- Tonight's 3-hour interval forecast (18:00 - 05:00)
- Custom astronomy quality scoring algorithm
- Best observation time recommendation
- Mobile-responsive web interface
- Dark space theme optimized for astronomers
- SQLite database with forecast caching
- Docker containerization
- Nginx reverse proxy configuration
- Comprehensive documentation

### Core Features
- Weather data from OpenWeatherMap API
- Cloud coverage, visibility, humidity, precipitation analysis
- Astronomy score (0-100) with weighted factors
- Beautiful dark-themed UI
- Hourly forecast display with color-coded scores
- Quality rating system (Excellent to Very Poor)

### Technical Stack
- Backend: Node.js + Express
- Frontend: Vanilla JavaScript, HTML5, CSS3
- Database: SQLite with WAL mode
- Deployment: Docker + Docker Compose
- Web Server: Nginx
