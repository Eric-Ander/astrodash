# AstroDashboard – User Guide

AstroDashboard is an astronomical weather forecasting platform for stargazers. It analyses weather conditions, moon phases, light pollution, and astronomical events to help you plan the best observation sessions.

---

## Table of Contents

1. [Getting Started – Location Search](#1-getting-started--location-search)
2. [Dashboard Cards](#2-dashboard-cards)
   - [Weather Summary](#weather-summary-card)
   - [Moon Phase](#moon-phase-card)
   - [Hourly Forecast](#hourly-forecast-card)
   - [Light Pollution](#light-pollution-card)
   - [Astronomical Events](#astronomical-events-card)
3. [Understanding the Scores](#3-understanding-the-scores)
   - [Astronomy Score (Weather-Based)](#31-astronomy-score-weather-based)
   - [Light Pollution – Bortle Scale](#32-light-pollution--bortle-scale)
   - [Moon Visibility Impact](#33-moon-visibility-impact)
   - [How the Scores Work Together](#34-how-the-scores-work-together)
4. [User Accounts](#4-user-accounts)
5. [Saved Locations](#5-saved-locations)
6. [Notifications](#6-notifications)
7. [Customising the Dashboard](#7-customising-the-dashboard)
8. [Admin Panel](#8-admin-panel)
9. [Frequently Asked Questions](#9-frequently-asked-questions)

---

## 1. Getting Started – Location Search

When you open AstroDashboard you are presented with a search bar. You can search in two ways:

### Search by City Name

1. Make sure the **City Name** tab is selected.
2. Type a city name in the search field (e.g. `London`, `Tokyo`, `New York`).
3. Click **Search** or press Enter.

**If multiple cities match your search** (e.g. searching `Springfield` returns results from several countries), a selection dialog will appear listing all matching locations. Each entry shows:
- City name
- State / region and country
- Coordinates (latitude and longitude)

Click the correct city to load its forecast.

### Search by Coordinates

1. Click the **Coordinates** tab.
2. Enter the **Latitude** (e.g. `47.3769`) and **Longitude** (e.g. `8.5417`).
3. Click **Search**.

This is useful if you know the exact coordinates of your observation site.

---

## 2. Dashboard Cards

After a successful search, the dashboard loads a set of information cards. Each card focuses on one aspect of the night sky conditions.

---

### Weather Summary Card

The Weather Summary gives you an at-a-glance overview of tonight's conditions.

| Field | Description |
|-------|-------------|
| **Overall Quality** | A one-word rating of the night (Excellent, Very Good, Good, Fair, Poor, Very Poor) |
| **Average Score** | Overall astronomy score from 0 to 100 |
| **Average Cloud Coverage** | Mean cloud coverage expected during the night |
| **Best Observation Time** | The single hour with the best conditions |

---

### Moon Phase Card

The Moon Phase card shows the current state of the moon and how it affects observation conditions.

| Field | Description |
|-------|-------------|
| **Phase Name** | New Moon, Waxing Crescent, First Quarter, etc. |
| **Illumination** | Percentage of the moon's surface that is lit (0% = new moon, 100% = full moon) |
| **Visibility Impact** | Rating of how much the moon affects sky darkness |
| **Recommendation** | Short advice based on the current phase |
| **Next Events** | Days until the next new moon and full moon |

**Tip:** A new moon (0% illumination) gives the darkest skies and is ideal for deep-sky observation. A full moon (100%) washes out faint objects.

---

### Hourly Forecast Card

The Hourly Forecast gives a detailed breakdown of conditions hour by hour throughout the night (18:00 to 05:00).

Each hourly entry shows:

| Field | Description |
|-------|-------------|
| **Time** | The forecast hour |
| **Temperature** | Air temperature in °C |
| **Clouds** | Cloud coverage percentage (lower is better for stargazing) |
| **Visibility** | Atmospheric visibility in kilometres |
| **Humidity** | Relative humidity percentage |
| **Wind** | Wind speed in m/s |
| **Rain Chance** | Probability of precipitation |
| **Astronomy Score** | Quality score from 0 to 100 for that hour |

The colour of the score circle indicates quality at a glance:

| Colour | Score | Rating |
|--------|-------|--------|
| Green | 90–100 | Excellent |
| Yellow-green | 75–89 | Very Good |
| Yellow | 60–74 | Good |
| Orange | 45–59 | Fair |
| Dark orange | 30–44 | Poor |
| Red | 0–29 | Very Poor |

---

### Light Pollution Card

The Light Pollution card estimates the darkness of the sky at your location using the **Bortle Dark-Sky Scale**.

| Bortle Class | Description |
|---|---|
| Class 1 | Excellent dark sky – zodiacal light visible, Milky Way casts shadows |
| Class 2 | Truly dark sky – faint zodiacal bands visible |
| Class 3 | Rural sky – some light pollution on horizon |
| Class 4 | Rural / suburban transition |
| Class 5 | Suburban sky – Milky Way visible but washed out |
| Class 6 | Bright suburban sky |
| Class 7 | Suburban / urban transition |
| Class 8 | City sky – only bright star clusters visible |
| Class 9 | Inner city sky – only the moon and a few bright stars visible |

Additional information shown:

| Field | Description |
|-------|-------------|
| **Limiting Magnitude** | Faintest star visible to the naked eye at this location |
| **Milky Way Visibility** | Whether the Milky Way is visible from this site |
| **Recommendation** | Observation advice for this light pollution level |

**Tip:** Light pollution is based on your geographic location and nearby population centres. It does not change with the weather – use it to evaluate your site rather than the night.

---

### Astronomical Events Card

The Astronomical Events card shows upcoming events relevant to observers at your location.

#### ISS Passes
The next visible passes of the International Space Station, including:
- Local rise time
- Duration of the pass in minutes

#### Meteor Showers
Upcoming major meteor showers, including:
- Peak date
- Days until peak
- **ZHR** (Zenithal Hourly Rate) – the maximum number of meteors per hour under ideal conditions

Major showers included: Perseids, Geminids, Quadrantids, Lyrids, Eta Aquarids, Delta Aquarids, Andromedids, Ursids.

#### Moon Events
- Next **New Moon** date and countdown
- Next **Full Moon** date and countdown

#### Solar Events
- Today's **Sunrise** and **Sunset** times
- **Astronomical twilight** times (when the sky is fully dark)
- **Day length**

**Tip:** Astronomical twilight end marks the earliest time the sky is dark enough for serious deep-sky observation.

---

## 3. Understanding the Scores

AstroDashboard uses three independent scoring systems to help you evaluate observation conditions. Each measures a different aspect of sky quality.

---

### 3.1 Astronomy Score (Weather-Based)

The astronomy score (0–100) is calculated for each hour of the night. It reflects how suitable the weather conditions are for stargazing.

#### Formula

```
Total Score = (Cloud Score × 0.50) + (Visibility Score × 0.20) +
              (Humidity Score × 0.15) + (Precipitation Score × 0.15)
```

#### Component Breakdown

**Cloud Score (50% of total)**

Clouds are the most important factor. Clear skies are essential for observation.

| Cloud Coverage | Points (out of 50) |
|----------------|-------------------|
| 0% | 50 (perfect) |
| 20% | 40 |
| 50% | 25 |
| 80% | 10 |
| 100% | 0 (overcast) |

Formula: `50 × (1 - cloud_percentage / 100)`

**Visibility Score (20% of total)**

Atmospheric visibility affects how crisp stars appear. Haze, fog, and dust reduce visibility.

| Visibility | Points (out of 20) |
|------------|-------------------|
| 10 km or more | 20 (maximum) |
| 5 km | 10 |
| 2 km | 4 |
| 1 km or less | 0 (poor) |

Formula: For visibility between 1–10 km: `20 × (visibility_km / 10)`

**Humidity Score (15% of total)**

High humidity causes dew on optics and reduces atmospheric transparency.

| Humidity | Points (out of 15) |
|----------|-------------------|
| 40% or below | 15 (optimal) |
| 50% | 11.25 |
| 60% | 7.5 |
| 70% | 3.75 |
| 80% or above | 0 (poor) |

Formula: For humidity between 40–80%: `15 × (1 - (humidity - 40) / 40)`

**Precipitation Score (15% of total)**

Any chance of rain or snow makes observation impractical.

| Rain Probability | Points (out of 15) |
|------------------|-------------------|
| 0% | 15 (no rain) |
| 25% | 11.25 |
| 50% | 7.5 |
| 75% | 3.75 |
| 100% | 0 (certain rain) |

Formula: `15 × (1 - precipitation_probability)`

#### Quality Ratings

| Total Score | Rating | Colour |
|-------------|--------|--------|
| 90–100 | Excellent | Green |
| 75–89 | Very Good | Yellow-green |
| 60–74 | Good | Yellow |
| 45–59 | Fair | Orange |
| 30–44 | Poor | Dark orange |
| 0–29 | Very Poor | Red |

---

### 3.2 Light Pollution – Bortle Scale

The Bortle Dark-Sky Scale (Class 1–9) estimates how dark the sky is at your location based on nearby population centres. Unlike the astronomy score, this does not change with weather – it reflects the permanent light pollution at your site.

#### How It Is Calculated

AstroDashboard uses a variant of **Walker's Law** to estimate cumulative sky brightness:

1. All cities within **300 km** of your location are considered.
2. For each city, a brightness contribution is calculated:

```
Contribution = Population / (Distance + 5)^2.5
```

Where:
- **Population** is the city's population
- **Distance** is the great-circle distance in kilometres
- **5 km buffer** accounts for urban sprawl (prevents extreme values at city centres)
- **Exponent 2.5** models how light pollution falls off with distance

3. All contributions are summed to give a **cumulative brightness value**.

4. This value is mapped to a Bortle class:

| Cumulative Brightness | Bortle Class | Sky Quality |
|-----------------------|--------------|-------------|
| > 50,000 | 9 | Inner city |
| 15,001 – 50,000 | 8 | City sky |
| 5,001 – 15,000 | 7 | Suburban/urban transition |
| 1,501 – 5,000 | 6 | Bright suburban |
| 401 – 1,500 | 5 | Suburban |
| 81 – 400 | 4 | Rural/suburban transition |
| 11 – 80 | 3 | Rural |
| 2 – 10 | 2 | Typical dark sky |
| < 2 | 1 | Excellent dark sky |

#### Limiting Magnitude

Each Bortle class corresponds to a **limiting magnitude** – the faintest star visible to the naked eye under those conditions:

| Bortle Class | Limiting Magnitude | What You Can See |
|--------------|-------------------|------------------|
| 1 | 7.6 – 8.0 | Zodiacal light, gegenschein, Milky Way casts shadows |
| 2 | 7.1 – 7.5 | Faint zodiacal bands, M33 visible to naked eye |
| 3 | 6.6 – 7.0 | Milky Way appears complex, M31 obvious |
| 4 | 6.1 – 6.5 | Milky Way visible but lacks detail |
| 5 | 5.6 – 6.0 | Milky Way washed out, only brightest parts visible |
| 6 | 5.1 – 5.5 | Milky Way only visible at zenith |
| 7 | 4.6 – 5.0 | Milky Way invisible, M31 barely visible |
| 8 | 4.1 – 4.5 | Only bright constellations recognisable |
| 9 | < 4.0 | Only the moon and a few bright stars visible |

#### Example Calculations

| Location | Approx. Brightness | Bortle Class |
|----------|-------------------|--------------|
| Central London | ~170,000 | 9 |
| Zurich city centre | ~8,000 | 7 |
| Basel city centre | ~3,200 | 6 |
| Rural area 60 km from a city | ~100 | 4 |
| Remote mountain 200 km from cities | < 2 | 1–2 |

---

### 3.3 Moon Visibility Impact

The moon's brightness can wash out faint objects. AstroDashboard calculates moon illumination and rates its impact on observation conditions.

#### Moon Phase Calculation

The moon follows a **29.53-day cycle** (synodic month). Illumination is calculated using a sinusoidal model:

```
Illumination = ((1 - cos(2π × phase_fraction)) / 2) × 100%
```

Where `phase_fraction` = days since last new moon ÷ 29.53

| Phase | Days Since New Moon | Illumination |
|-------|---------------------|--------------|
| New Moon | 0 | 0% |
| Waxing Crescent | 1.8 – 5.5 | 1% – 25% |
| First Quarter | 5.5 – 9.2 | 25% – 50% |
| Waxing Gibbous | 9.2 – 12.9 | 50% – 75% |
| Full Moon | 12.9 – 16.6 | 75% – 100% |
| Waning Gibbous | 16.6 – 20.3 | 75% – 50% |
| Last Quarter | 20.3 – 24.0 | 50% – 25% |
| Waning Crescent | 24.0 – 27.7 | 25% – 1% |

#### Visibility Impact Rating

| Illumination | Impact Rating | Effect on Deep-Sky Observation |
|--------------|---------------|--------------------------------|
| < 10% | Excellent | Minimal interference – ideal for faint objects |
| 10% – 29% | Very Good | Low interference – most objects visible |
| 30% – 49% | Good | Moderate interference – avoid faint nebulae |
| 50% – 69% | Fair | Significant interference – stick to bright objects |
| 70% – 89% | Poor | Severe interference – only planets and bright stars |
| ≥ 90% | Very Poor | Maximum interference – observation very limited |

#### Planning Around the Moon

- **Best nights:** Within 5 days of new moon (illumination < 25%)
- **Acceptable nights:** First/last quarter (illumination ~50%) – observe before moonrise or after moonset
- **Challenging nights:** Within 5 days of full moon (illumination > 75%)

**Tip:** Even during a full moon, bright planets (Jupiter, Saturn, Mars, Venus) and double stars remain excellent targets.

---

### 3.4 How the Scores Work Together

The three scores measure different things and are displayed independently:

| Score | What It Measures | Changes With |
|-------|------------------|--------------|
| Astronomy Score | Weather conditions | Hour by hour |
| Bortle Class | Light pollution | Location only |
| Moon Impact | Lunar interference | Date (moon phase) |

**For the best observation session, look for:**
- Astronomy score **75 or above** (clear, dry, good visibility)
- Bortle class **4 or lower** (rural or darker)
- Moon illumination **below 30%** (near new moon)

---

## 4. User Accounts

Creating an account allows you to save locations and receive email notifications.

### Register

1. Click the **Login** button in the top-right corner.
2. Switch to the **Create Account** tab.
3. Enter your name (optional), email address, and a password (minimum 6 characters).
4. Click **Create Account**.

You are logged in automatically after registration.

### Login

1. Click the **Login** button.
2. Enter your email and password.
3. Click **Login**.

Your session is saved in the browser. You will remain logged in until you click **Logout**.

### Logout

Click your name in the top-right corner, then click **Logout**.

---

## 5. Saved Locations

When logged in, you can save any searched location for quick access later.

### Saving a Location

1. Search for a city or enter coordinates.
2. After the forecast loads, click the **⭐ Save This Location** button below the search area.

### Accessing Saved Locations

1. Click your name in the top-right corner.
2. Click **📍 Saved Locations**.
3. Click any location in the list to load its forecast immediately.

### Managing Saved Locations

From the Saved Locations panel you can:

| Action | How |
|--------|-----|
| **Load a location** | Click the location name |
| **Mark as favourite** | Click the ⭐ icon |
| **Edit the name** | Click the edit (✏️) icon |
| **Configure notifications** | Click the 🔔 icon |
| **Delete** | Click the 🗑️ icon |

---

## 6. Notifications

AstroDashboard can send you an email when the sky conditions at a saved location are good.

### Setting Up Notifications

1. Open **Saved Locations** from the user menu.
2. Click the 🔔 icon next to a saved location.
3. **Enable notifications** using the toggle.
4. Set a **cloud coverage threshold** (e.g. 30% means you will be notified when cloud coverage drops below 30%).
5. Save your settings.

### Test Notification

To confirm your email address receives notifications:
1. Open notification settings for a location.
2. Click **Send Test Email**.

### Notification Schedule

Notifications are checked automatically once per day. If conditions at your saved location meet your threshold, you will receive an email with:
- Cloud coverage, visibility, and humidity details
- Best observation time for the night
- Astronomy score

> **Note:** Notifications require the server administrator to have configured SMTP email settings. Contact your administrator if you do not receive emails.

---

## 7. Customising the Dashboard

### Reordering Cards

You can drag and drop cards to rearrange them on the dashboard. Click and hold a card header, then drag it to your preferred position.

### Changing Card Size

Some cards support multiple sizes (Small, Medium, Large). Look for a size control on the card to switch between sizes.

### Enabling and Disabling Cards

Cards you do not need can be disabled. Changes to card preferences are:
- **Saved to your account** when logged in
- **Saved in your browser** when not logged in (cleared if you clear browser data)

---

## 8. Admin Panel

The Admin Panel is available to users with administrator privileges.

### Accessing the Admin Panel

1. Click your name in the top-right corner.
2. Click **👑 User Management**.

### Features

#### User Statistics
An overview of the platform at a glance:
- Total registered users
- Number of administrators
- Users active in the last 7 days
- Total saved locations across all users

#### User List
A searchable, paginated table of all users. For each user you can see:
- Email address
- Name
- Registration date
- Number of saved locations
- Admin status

#### User Actions

| Action | Description |
|--------|-------------|
| **👑 / 👤 Toggle Admin** | Grant or revoke administrator privileges |
| **🔑 Reset Password** | Set a new password for the user |
| **🗑️ Delete User** | Permanently remove the user account |

> **Note:** You cannot delete or demote your own account.

### Promoting the First Admin

The first administrator must be set directly on the server. See the [Deployment Guide](DEPLOYMENT.md#12-promote-the-first-admin-user) for instructions.

---

## 9. Frequently Asked Questions

**Why does my city search return multiple results?**
Many city names exist in more than one country or region (e.g. "Paris" exists in France, Texas, and Ontario). AstroDashboard shows you all matching cities so you can select the correct one.

**Why is my astronomy score low even though there are no clouds?**
High humidity or poor visibility (e.g. from haze or dust) also reduce the score. Check the individual hour details to see which factor is pulling the score down.

**The light pollution class seems wrong for my location. Why?**
Light pollution is estimated from population data of nearby cities, not real-time satellite measurements. It gives a general indication of your site's quality and is most accurate in areas with well-documented population centres.

**Why am I not receiving email notifications?**
Notifications require SMTP configuration on the server side. If you never receive a test email, contact your system administrator. Also check your spam folder.

**My saved location loaded the wrong city – how do I fix it?**
Delete the saved location and search again, this time selecting the correct city from the disambiguation dialog.

**The ISS pass times look wrong. Why?**
ISS pass predictions use your searched coordinates. Make sure the location shown on screen matches where you will be observing from.

**Can I use AstroDashboard on mobile?**
Yes. The interface is fully responsive and works on phones and tablets.
