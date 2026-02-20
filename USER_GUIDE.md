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
3. [Understanding the Astronomy Score](#3-understanding-the-astronomy-score)
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

## 3. Understanding the Astronomy Score

The astronomy score (0–100) is calculated for each hour of the night using four weather factors:

| Factor | Weight | Best value |
|--------|--------|------------|
| Cloud Coverage | 50% | 0% clouds |
| Visibility | 20% | 10+ km |
| Humidity | 15% | Under 50% |
| Precipitation Probability | 15% | 0% chance |

A score of **90 or above** means excellent conditions. A score **below 30** means observation is not practical.

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
