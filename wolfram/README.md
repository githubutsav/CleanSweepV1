# <img src="../src/assets/wolfram-logo.svg" width="30" height="30" align="top" /> Wolfram Components

This directory contains the **Wolfram** scripts that power CleanSweep's AI and computational intelligence layer. These scripts are deployed as public REST APIs on [Wolfram Cloud](https://www.wolframcloud.com/).

---

## 📁 Files

### `classify_waste.wl` — AI Waste Classification

Uses Wolfram's neural networks and built-in knowledge base to analyze a photo of waste and return structured data.

**Wolfram Functions Used:**
- `ImageIdentify` — Neural net image recognition (pre-trained on millions of images)
- `Classify` — Machine learning classification
- `EntityValue` — Access to Wolfram's curated Knowledge Base for material properties

**Input:** An image file (JPEG/PNG) via multipart POST  
**Output:** JSON with `category`, `severity`, `recyclable`, `decompositionTime`

```wolfram
(* Core logic — identify the image and categorize *)
identified = ImageIdentify[#image, All, 3];
category = categorizeWaste[First[Keys[identified]]];
severity = assessSeverity[category];
```

---

### `optimize_route.wl` — Garbage Truck Route Optimization

Solves the **Travelling Salesman Problem (TSP)** to compute the most fuel-efficient route for municipal garbage trucks to visit all pending waste reports.

**Wolfram Functions Used:**
- `FindShortestTour` — Exact TSP solver using combinatorial optimization
- `GeoDistance` — Real-world geographic distance calculations
- `GeoPosition` — Geographic coordinate handling

**Input:** JSON array of `{id, lat, lon}` objects  
**Output:** JSON with `orderedRoute`, `totalDistanceKm`, `numberOfStops`

```wolfram
(* Core logic — solve TSP across all report locations *)
geoPoints = GeoPosition[{#["lat"], #["lon"]}] & /@ parsed;
tour = FindShortestTour[geoPoints];
```

---

## 🚀 Deployment Instructions

1. Go to [wolframcloud.com](https://www.wolframcloud.com/) and log in
2. Click **"New Notebook"**
3. Copy-paste the contents of a `.wl` file into the notebook
4. Press **Shift + Enter** to evaluate
5. The final `CloudDeploy` line will output a URL — that's your API endpoint

### Environment Variables

After deploying, add the URLs to your `.env` file:

```env
VITE_WOLFRAM_API_URL=https://www.wolframcloud.com/obj/your-username/CleanSweepClassify
VITE_WOLFRAM_ROUTE_API_URL=https://www.wolframcloud.com/obj/your-username/CleanSweepRoute
```

---

## 🏗️ Architecture

```
┌─────────────┐     POST image     ┌──────────────────────┐
│  React App  │ ──────────────────→ │  Wolfram Cloud API   │
│  (Home.jsx) │ ←────────────────── │  classify_waste.wl   │
│             │     JSON response   │  • ImageIdentify     │
│             │                     │  • Knowledge Base    │
└─────────────┘                     └──────────────────────┘

┌─────────────┐   POST coordinates  ┌──────────────────────┐
│  React App  │ ──────────────────→  │  Wolfram Cloud API   │
│ (Admin.jsx) │ ←──────────────────  │  optimize_route.wl   │
│             │   Optimal ordering   │  • FindShortestTour  │
│             │                      │  • GeoDistance        │
└─────────────┘                      └──────────────────────┘
```
