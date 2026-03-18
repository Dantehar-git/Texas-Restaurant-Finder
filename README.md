# 🍽️ Texas Restaurant Finder

[![React](https://img.shields.io/badge/React-18-blue)]()
[![Vite](https://img.shields.io/badge/Vite-Fast%20Build-yellow)]()
[![Node.js](https://img.shields.io/badge/Node.js-Express-green)]()
[![API](https://img.shields.io/badge/APIs-Geoapify%20%7C%20Unsplash-orange)]()
[![Deployment](https://img.shields.io/badge/Deployed-Vercel-black)]()

A full-stack React application for discovering restaurants across major Texas cities, enriched with dynamic imagery, map visualization, and detailed place data.

👉 **Live Demo:** https://texas-restaurant-finder.vercel.app
👉 **GitHub Repo:** https://github.com/Dantehar-git

---

## 🚀 Tech Stack

**Frontend**

- React (Vite)
- React Router
- Context API (state management)

**Backend**

- Node.js + Express

**APIs**

- Geoapify Places API (search + place details)
- Unsplash API (image enrichment)

**Other**

- React Leaflet (maps)
- OpenStreetMap
- Custom CSS + Bootstrap utilities

---

## ✨ Features

- 🔍 Search restaurants by city and keyword
- 🗺️ Interactive map with synchronized markers
- 📍 Detailed restaurant view (address, hours, website)
- 🖼️ Dynamic image gallery powered by Unsplash
- ❤️ Favorites system using Context API
- 🍴 Cuisine filtering with normalized parsing
- ⚡ Server-side caching to reduce API calls
- 🔄 Optimized loading states and UI responsiveness

---

## 🧠 Architecture Overview

This application uses a **hybrid client-server architecture** to aggregate and enrich third-party data.

### Problem

Geoapify provides structured location data but lacks high-quality images.

### Solution

A backend service:

1. Fetches restaurant data from Geoapify
2. Enriches results with Unsplash images
3. Normalizes inconsistent API responses
4. Caches results to improve performance

---

## 🔌 API Integration Strategy

### 📍 Geoapify (Primary Data Source)

Used for:

- Restaurant discovery by location
- Place details (address, hours, contact info)
- Coordinates for map rendering

```http
GET /v2/places
GET /v2/place-details
```
