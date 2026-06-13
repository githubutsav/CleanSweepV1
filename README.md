# 🧹 CleanSweep

**CleanSweep** is a civic waste management platform that empowers citizens to report garbage, track cleanups, earn rewards, and build cleaner communities — all in one app.

![CleanSweep](https://img.shields.io/badge/Built%20with-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## ✨ Features

- 📍 **Report Garbage** — Submit waste reports with photo, location pin, severity, and an optional note
- 🗺️ **Explore Map** — Browse all reports on an interactive map with status filters
- 🏘️ **Community Feed** — See what others are reporting, like posts, and join discussions
- 🏆 **Points & Leaderboard** — Earn points for logging in, reporting waste, and confirming cleanups
- 🛍️ **Marketplace** — Redeem points for rewards and offers
- 👤 **User Profile** — View your stats, report history, and earned badges
- 🛠️ **Admin Dashboard** — Municipal staff can manage reports and update dustbin statuses

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Vanilla CSS (Glassmorphism dark theme) |
| Backend | Supabase (Auth, Database, Storage) |
| Maps | Leaflet.js |
| State | Zustand |
| Routing | React Router v7 |

---

## 🧠 Computational Intelligence Layer

CleanSweep uses Wolfram Language as the project's computational intelligence layer for the heavy logic that would otherwise require a separate backend service.

### `classify_waste.wl` - AI Waste Classification

When a citizen takes a photo of garbage on the Home page, the React app sends the image as a binary blob to the Wolfram Cloud API. Wolfram then uses `ImageIdentify` to analyze the image and detect the object in the photo. From there, custom pattern matching with `StringContainsQ` and `Switch` maps that object into a structured waste category such as Plastic, E-Waste, or Medical waste. Finally, Wolfram uses its knowledge base to estimate severity, recyclability, and decomposition time.

### `optimize_route.wl` - Garbage Truck Route Optimization

When a municipal worker clicks **Optimize Route** on the Admin Dashboard map, the app gathers the GPS coordinates of all pending garbage reports and sends them to the Wolfram API. Wolfram converts those raw latitude and longitude values into native `GeoPosition` objects, then uses `FindShortestTour` to solve the Travelling Salesman Problem and produce the most fuel-efficient route. It also calculates the total real-world distance with `GeoDistance` and returns the numbered route back to React, which draws it on the map.

### `APIFunction` and `CloudDeploy`

Instead of running a heavy Node or Python backend, CleanSweep uses a serverless microservice architecture. The Wolfram logic is wrapped in `APIFunction` to define the expected inputs, such as images or JSON strings, and deployed with `CloudDeploy` to create live REST API endpoints on Wolfram's servers. The React frontend simply fetches those endpoints whenever it needs heavy computational lifting.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
# Clone the repo
git clone https://github.com/githubutsav/CleanSweepV1.git
cd CleanSweepV1

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── Home.jsx          # Main app (report, map, community, leaderboard)
│   ├── Login.jsx         # Auth page
│   ├── Profile.jsx       # User profile & stats
│   ├── Marketplace.jsx   # Points redemption store
│   └── Admin.jsx         # Municipal admin panel
├── lib/
│   ├── supabaseClient.js # Supabase instance
│   └── store.js          # Zustand global state
└── index.css             # Global styles & design tokens
```

---

## 🗃️ Database

The app uses Supabase with the following core tables:

- `profiles` — User info, points, and stats
- `garbage_reports` — Citizen-submitted waste reports
- `dustbin_status` — Municipal dustbin tracking
- `community_posts` — Community feed posts
- `post_likes` / `post_comments` — Engagement on posts
- `leaderboard` — Top contributors view

> **Note:** SQL setup scripts are excluded from this repo for security. Set up your own Supabase project and configure the tables accordingly.

---

## 📸 Screenshots

> Coming soon

---

## 📄 License

MIT © [githubutsav](https://github.com/githubutsav)
