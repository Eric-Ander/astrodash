# AstroDash Roadmap

This document outlines planned features and improvements for AstroDash. Features are organized by priority and development phase.

## Current Version: v1.4

### Recently Completed
- User authentication system with registration and login
- User accounts with saved/favorite locations
- City disambiguation (handling multiple cities with same name)
- Admin user management interface
- Staging and production environment separation
- Custom favicons for staging/production environments

---

## Phase 1: Notifications (In Development)

### Email Notifications for Excellent Conditions
**Priority:** High
**Status:** In Development

Allow users to receive email alerts when their saved locations have excellent stargazing conditions.

**Features:**
- Mark saved locations for notifications (per-location toggle)
- Configurable "excellent" threshold (default: astronomy score ≥ 80)
- Daily notification check (configurable time, default: 14:00 local)
- Forecast window: tonight and tomorrow night
- Email includes:
  - Location name and coordinates
  - Best observation time
  - Astronomy score and conditions summary
  - Moon phase information
  - Direct link to full forecast
- User preferences:
  - Enable/disable notifications globally
  - Set minimum score threshold
  - Choose notification frequency (daily digest vs. immediate)
- Unsubscribe mechanism (one-click unsubscribe link)

**Technical Requirements:**
- Email service integration (SMTP or SendGrid/Mailgun)
- Background job scheduler (node-cron or similar)
- Email templates (HTML and plain text)
- User email verification
- Rate limiting to prevent spam

---

## Phase 2: Enhanced Forecasting

### Best Night Finder
**Priority:** High
**Status:** Planned

Compare the next 7 days and highlight the best night for stargazing.

**Features:**
- 7-day forecast comparison view
- Visual calendar with color-coded nights
- Ranking of nights by astronomy score
- Consider moon phase in recommendations
- "Plan your week" summary

### Astronomical Events Calendar
**Priority:** Medium
**Status:** Partially Implemented (ISS, Meteors)

Expand the events system with more celestial events.

**Features:**
- Planet visibility and conjunctions
- Eclipse predictions (solar and lunar)
- Comet appearances
- Satellite flares (Iridium, Starlink)
- Deep sky object visibility windows
- Integration with external astronomy APIs
- Personal event reminders

---

## Phase 3: Location Intelligence

### Dark Site Finder
**Priority:** High
**Status:** Planned

Help users find nearby locations with better Bortle scores.

**Features:**
- Search radius configuration (10-100 km)
- Map view with Bortle overlay
- Driving directions integration
- Filter by:
  - Maximum Bortle class
  - Accessibility (parking, terrain)
  - Amenities nearby
- Community-submitted dark sites
- Save favorite dark sites

### Light Pollution Map Overlay
**Priority:** Medium
**Status:** Planned

Visual representation of light pollution zones.

**Features:**
- Interactive map with Bortle zones
- Real-time light pollution data
- Historical comparisons
- City light impact visualization
- Optimal viewing direction suggestions

---

## Phase 4: Observation Planning

### Observation Planner
**Priority:** Medium
**Status:** Planned

Plan what celestial objects to observe tonight.

**Features:**
- Tonight's visible objects list:
  - Planets
  - Bright stars
  - Messier objects
  - NGC objects
- Rise/set times for objects
- Altitude/azimuth throughout the night
- Equipment recommendations based on:
  - Object type
  - Current conditions
  - User's equipment profile
- Observation checklist
- Session logging

### Equipment Profile
**Priority:** Low
**Status:** Planned

Store user's astronomy equipment for personalized recommendations.

**Features:**
- Telescope specifications
- Eyepiece collection
- Camera/imaging equipment
- Binoculars
- Limiting magnitude calculator
- Field of view calculator

---

## Phase 5: Community Features

### Observation Sharing
**Priority:** Low
**Status:** Planned

Share observations and connect with other astronomers.

**Features:**
- Observation log with photos
- Public/private observation notes
- Location sharing (with privacy controls)
- Activity feed
- Comments and reactions
- Follow other astronomers

### Community Dark Sites
**Priority:** Low
**Status:** Planned

Crowdsourced database of observation locations.

**Features:**
- Submit new dark sites
- Rate and review locations
- Add photos and descriptions
- Verify Bortle ratings
- Report light pollution changes
- Moderation system

---

## Phase 6: Platform Expansion

### Progressive Web App (PWA)
**Priority:** Medium
**Status:** Planned

Installable mobile app experience.

**Features:**
- Offline support for saved locations
- Push notifications
- Home screen installation
- Background sync
- Faster load times

### Mobile Native Apps
**Priority:** Low
**Status:** Future Consideration

Native iOS and Android applications.

**Features:**
- Full native experience
- GPS-based location
- Widget support
- Apple Watch / Wear OS companion
- AR sky map integration

### API for Third Parties
**Priority:** Low
**Status:** Future Consideration

Public API for astronomy applications.

**Features:**
- API key management
- Rate limiting tiers
- Documentation portal
- Webhook support
- Usage analytics

---

## Phase 7: Internationalization

### Multi-Language Support
**Priority:** Medium
**Status:** Planned

Localized interface for global users.

**Languages (Priority Order):**
1. German (de-CH, de-DE, de-AT)
2. French (fr-CH, fr-FR)
3. Italian (it-CH, it-IT)
4. Spanish (es)
5. Japanese (ja)
6. Chinese (zh)

**Features:**
- UI translation
- Localized date/time formats
- Metric/imperial units toggle
- RTL language support
- Community translation contributions

---

## Technical Debt & Infrastructure

### Performance Improvements
- Database query optimization
- Enhanced caching strategies
- CDN for static assets
- Image optimization
- Lazy loading

### Security Enhancements
- Two-factor authentication (2FA)
- Session management improvements
- Security audit
- Penetration testing
- GDPR compliance tools

### Monitoring & Analytics
- Application performance monitoring
- User analytics (privacy-respecting)
- Error tracking
- Uptime monitoring
- Usage metrics dashboard

### Testing
- Comprehensive unit tests
- Integration tests
- End-to-end tests
- Performance benchmarks
- Accessibility audits

---

## Version Milestones

| Version | Focus | Key Features |
|---------|-------|--------------|
| v1.5 | Notifications | Email alerts for excellent conditions |
| v1.6 | Forecasting | Best Night Finder, 7-day comparison |
| v1.7 | Locations | Dark Site Finder, Light pollution map |
| v1.8 | Planning | Observation Planner, Object visibility |
| v2.0 | Platform | PWA, Push notifications, Offline support |
| v2.1 | i18n | German, French, Italian support |
| v2.2 | Community | Sharing, Dark site submissions |

---

## Contributing Ideas

Have a feature idea? We welcome suggestions! Consider:

1. **User value**: How does this help astronomers?
2. **Feasibility**: What technical requirements are needed?
3. **Scope**: Can it be broken into smaller pieces?
4. **Dependencies**: Does it require external APIs or services?

---

## Feedback

Features are prioritized based on:
- User feedback and requests
- Technical feasibility
- Development resources
- Strategic alignment

This roadmap is subject to change based on user needs and technical discoveries.

---

*Last updated: February 2026*
