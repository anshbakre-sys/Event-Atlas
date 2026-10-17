# Event Atlas — AI-Powered, Map-First Event Discovery Platform

Event Atlas is a full-stack event discovery and aggregation platform that brings events from multiple platforms—**District by Zomato**, **BookMyShow**, and **Luma Events (lu.ma)**—into one unified, interactive map-based experience across India.

---

## 🌟 Key Features

1. **Map-First Event Discovery**
   - High-performance interactive Leaflet map with dark theme styling.
   - Synchronized map markers and left discovery sidebar. Clicking an event card highlights and flies the map to its coordinates; clicking a marker opens a quick-preview popup with one-click full detail navigation.
   - GPS current-location tracking with real-time pulsing marker, plus quick hub city switching (Indore, Mumbai, Delhi, Bengaluru, Pune).

2. **Multi-Source Event Aggregation**
   - **District by Zomato**: Live music, indie and classic rock concerts, stand-up comedy specials, and cultural nights.
   - **BookMyShow**: Stadium concerts, arena tours, theatre plays, cultural festivals, and clean family comedy.
   - **Luma Events (lu.ma)**: Developer meetups, AI and agentic hackathons, tech workshops, conferences, and founder mixers.

3. **Intelligent Sorting & Multi-Dimensional Filtering**
   - **Default Sort**: Upcoming event date in ascending order; when multiple events occur on the same date, distance from user location is used as the deterministic tie-breaker.
   - **Distance Sort**: Sorts by nearest distance first, using event date as secondary criterion.
   - **Filters**: Platform inclusion/exclusion, Category tags, Price mode (Free / Paid / Min & Max), and custom budget ceiling in INR (`₹`).

4. **Age-Based Event Eligibility (Backend-Enforced)**
   - Computes real-time age dynamically from the user's Date of Birth (DOB).
   - Under-18 users and unauthenticated users are strictly barred from receiving or viewing adult 18+ events across search, map pins, and direct links.
   - Safe Mode indicators and age badge in user profile.

5. **Gemini-Powered AI Event Discovery Agent (`/assistant`)**
   - Accessible from header and `/assistant`.
   - Interprets natural-language queries (e.g. *"Is there any rock events near me before 20 December? My budget is ₹1,000, and I can go to Indore, Mumbai, or Delhi."*).
   - Server-side parsing with `gemini-3.8-flash` returning validated structured JSON criteria (categories, cities, budget limits, date boundaries).
   - Executes real queries against the event database and provides grounded, truthful answers (zero hallucinations or fabricated events).
   - One-click **"View on Interactive Map"** transfers interpreted query parameters directly to the main map interface.

6. **Booking Handoff & Autofill**
   - Dedicated event page (`/events/:eventId`).
   - "Book / Register on Original Platform" modal.
   - Supports prefilled URL parameters for Luma registrations (`?name=...&email=...`).
   - For District and BookMyShow, provides convenient one-click copy buttons for saved name, email, phone, and DOB, with explicit user consent before redirecting in a secure tab.

---

## 🏗️ Architecture

```
Event Atlas
│
├── React Frontend (Vite)
│   ├── React Router (SPA Routing)
│   ├── Tailwind CSS v4
│   ├── React Hook Form (Forms & Validation)
│   ├── Axios API Client (/api/*)
│   ├── Leaflet & CartoDB Maps
│   ├── AuthContext & LocationContext
│   └── Pages: Home, EventDetail, Assistant, Login, Signup, Profile
│
├── Express Backend (MVC Architecture)
│   ├── Controllers: Auth, User, Event, Assistant, Source, Booking
│   ├── Services: EventService, AuthService, GeminiService, BookingService
│   ├── Models (Mongoose): User, Event, SourceStatus
│   ├── Integrations: DistrictAdapter, BookMyShowAdapter, LumaAdapter
│   └── Pure Utils: Haversine Geo, Age Eligibility, Event Filtering & Sorting
│
└── MongoDB / Mongoose Data Layer
    ├── Users Collection
    ├── Events Collection (with geospatial and compound indexes)
    └── SourceStatus Collection
```

---

## 🔧 Environment Variables

Configure the following variables in `.env`:

```env
PORT=3000
NODE_ENV=development
APP_URL="http://localhost:3000"

# MongoDB Database URI (MongoDB Atlas or local instance)
MONGODB_URI="mongodb://localhost:27017/eventatlas"

# Google Gemini API Key (Server-side AI Agent)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Session Security
SESSION_SECRET="event-atlas-super-secret-key"

# Optional External API Keys
DISTRICT_API_KEY=""
BOOKMYSHOW_API_KEY=""
LUMA_API_KEY=""
```

*Note:* If `MONGODB_URI` is not set, the backend operates in a resilient in-memory mode seeded with 18+ verified demonstration events across Indore, Mumbai, Delhi, Bengaluru, and Pune, allowing full local development and testing without database connection errors.

---

## 🚀 Running the Application

### 1. Run Unit Tests (Pure Logic)
```bash
node --test server/utils/utils.test.ts
```

### 2. Start Full-Stack Development Server
```bash
npm run dev
```
Starts Express on port 3000 with Vite middleware mounted directly (same-origin, eliminating the need for CORS).

### 3. Build for Production
```bash
npm run build
```
