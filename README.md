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
