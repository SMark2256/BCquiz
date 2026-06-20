# BC Quiz – BarCraft Corvin Quiz Nights

A Next.js based web application for presenting **BarCraft Corvin** quiz nights and handling visitor voting. The public interface displays upcoming quiz events and allows visitors to vote for the theme of the next quiz night. A protected admin interface serves for managing quizzes and voting sessions.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [Data Storage: Firebase vs. Local Mock Mode](#data-storage-firebase-vs-local-mock-mode)
- [Authentication and Authorization](#authentication-and-authorization)
- [Voting System](#voting-system)
- [External Media APIs](#external-media-apis)
- [Environment Variables](#environment-variables)
- [Installation and Running](#installation-and-running)
- [Firebase Setup](#firebase-setup)
- [Developer Guide](#developer-guide)
- [User Guide](#user-guide)
- [Deployment to Vercel](#deployment-to-vercel)

---

## Features

### Public Page (`/`)

- **Upcoming Quiz Nights List** – Displaying active quizzes with future dates in card format.
- **Live Voting** – Visitors can vote for the theme of the next quiz night. Only one active voting session can run at a time.
- **Single Vote Protection** – A visitor can only cast one vote per session (see [Voting System](#voting-system)).
- **Location and Time Information** – Static info block with event details.
- **Responsive Interface** – Mobile-optimized with animations (Framer Motion).

### Admin Interface (`/admin`)

- **Google Account Login** – Only admins with authorized email addresses can access.
- **Quiz Management** – Create, edit, delete, activate/deactivate.
- **Voting Management** – Create voting sessions, edit themes (votepool), activate, reset votes.
- **Live Results** – Vote distribution and standing can be followed in real-time.
- **Media Search** – Search for movies, series, books, and games with cover art (TMDb, Google Books, IGDB).
- **QR Code Generator** – Generate and download custom QR codes (e.g., for the voting page link).
- **Dark/Light Theme** – Admin-specific theme switcher with flash-free loading.
- **Automatic Logout** – The system automatically logs out after 30 minutes of inactivity.
- **Local Storage Indicator** – Visual indicator when the application is running in mock (localStorage) mode.

---

## Technology Stack

| Category               | Technology                                                |
|------------------------|-----------------------------------------------------------|
| Framework              | [Next.js 16](https://nextjs.org) (App Router)             |
| UI Library             | React 19                                                  |
| Language               | TypeScript                                                |
| Styling                | Tailwind CSS v4                                           |
| Components             | shadcn/ui + Base UI                                       |
| Data Fetching / Cache  | TanStack Query (React Query) + persist client             |
| Backend / Database     | Firebase (Firestore, Storage, Auth, App Check, Analytics) |
| Security / Bot Protection | Google reCAPTCHA v3 (as Firebase App Check provider)   |
| Animation              | Framer Motion                                             |
| Charts                 | Recharts                                                  |
| QR Code                | qrcode.react                                              |
| Local Storage          | localforage (visitor ID), localStorage (mock mode)        |
| Analytics              | Vercel Analytics + Speed Insights                         |

---

## Architecture Overview

The application follows a **two-tier architecture**:

1. **Public Layer** – Statically/client-side rendered page that reads data from Firestore (or localStorage in mock mode) via TanStack Query.
2. **Admin Layer** – Authentication-protected management interface for performing write operations.

Data flow occurs through a unified service layer (`services/`). Each service automatically decides whether to use **Firebase** or **local mock storage** based on configuration – thus UI code remains unchanged in both modes.

```
UI Components
    │
    ▼
React Query Hooks  (hooks/use-*.ts)
    │
    ▼
Service Layer (services/*-service.ts)
    │
    ├──► Firebase (Firestore / Storage / Auth)   ← Production mode
    └──► mock-storage.ts (localStorage)          ← Developer / Mock mode
```

---

## Project Structure

```
.
├── app/
│   ├── page.tsx                 # Public main page
│   ├── layout.tsx               # Root layout, fonts, metadata, preconnect
│   ├── globals.css              # Global styles and design tokens
│   ├── admin/
│   │   ├── page.tsx             # Admin interface (tabs: quizzes / voting / tools)
│   │   └── layout.tsx           # Flash-free theme initializer script
│   └── api/
│       └── igdb/route.ts        # IGDB proxy (Twitch token + cache)
│
├── components/
│   ├── features/                # Business components (cards, tables, dialogs, widgets)
│   ├── providers/               # QueryProvider, AdminThemeProvider
│   └── ui/                      # shadcn/ui base components
│
├── hooks/
│   ├── use-auth.ts              # Google login + admin check + auto-logout
│   ├── use-quizzes.ts           # Quiz fetching (React Query)
│   ├── use-voting.ts            # Voting logic + visitor ID handling
│   ├── use-voting-sessions.ts   # Voting session fetching
│   ├── use-mock-data.ts         # Mock mode status and data reset
│   └── motion-permission.ts     # Animation preference handling
│
├── services/
│   ├── quiz/                    # Quiz service + Firestore converter
│   ├── voting/                  # Voting service + Firestore converter
│   ├── media-api.ts             # TMDb / Google Books / IGDB searcher
│   ├── storage-service.ts       # Firebase Storage image upload
│   └── mock-storage.ts          # localStorage-based persistence (mock mode)
│
├── lib/
│   ├── firebase.ts              # Firebase initialization, App Check, helpers
│   └── utils.ts                 # Utility functions (cn, etc.)
│
├── types/
│   └── index.ts                 # Central TypeScript type definitions
│
└── public/                      # Static assets (logos, icons, sound)
```

---

## Data Models

Central types are located in the `types/index.ts` file.

### `Quiz` – Quiz Night

```ts
interface Quiz {
    id: string;
    title: string;
    titleHu?: string;        // Hungarian title
    description?: string;
    date: Date;
    time: string;            // e.g., "20:00"
    imageUrl?: string;
    location?: string;
    category?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

### `VotingSession` – Voting

Only **one** session can be active (`isActive`) at a time. The `votepool` contains the selectable themes.

```ts
interface VotingSession {
    id: string;
    title?: string;
    description?: string;
    isActive: boolean;
    votepool: VoteTopic[];
    createdAt: Date;
    updatedAt: Date;
}
```

### `VoteTopic` – Votable Theme

```ts
interface VoteTopic {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    votes: number;
}
```

### `DbVoteRecord` – Cast Vote (Firestore `votes` collection)

Uniqueness is guaranteed by the document ID in `sessionId_fingerprint` format.

```ts
interface DbVoteRecord {
    id: string;              // "{sessionId}_{fingerprint}"
    sessionId: string;
    topicId: string;
    fingerprint: string;     // visitor ID
    timestamp: Date;
}
```

### `ApiResponse<T>` – Unified Response Format

Every operation in the service layer returns this type:

```ts
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
```

---

## Data Storage: Firebase vs. Local Mock Mode

The application can operate with two types of data storage. The choice is automatic:

```ts
function shouldUseMockStorage(): boolean {
    return isMockMode() || !isFirebaseConfigured();
}
```

- **Production (Firebase) Mode** – Active when Firebase environment variables are set and mock mode is not enabled. Data is stored in Firestore.
- **Mock (Local) Mode** – Active when `NEXT_PUBLIC_USE_LOCAL_MOCK=true`, **or** if Firebase is not configured. Data lives in the browser's `localStorage`, populated with default demo data. This is ideal for development and testing without Firebase.

Mock mode is indicated on the admin interface with a "Local Storage" label and a warning bar, where data can also be reset to defaults.

The `localStorage` keys: `bcquiz_quizzes`, `bcquiz_voting_sessions`, `bcquiz_initialized`.

---

## Authentication and Authorization

Authentication is implemented in the `hooks/use-auth.ts` hook using Firebase Authentication (Google provider).

**Process:**

1. User logs in with their Google account (popup).
2. The system checks the email address against the `adminEmails` array in the `settings/config` document in Firestore.
3. If the email is not on the list, the system immediately logs the user out.
4. Upon successful login, a JWT token is available for authenticated requests.

**Security Features:**

- The admin email list is stored in Firestore, not in the code → new admins can be added without modifying code.
- **Automatic Logout** after 30 minutes of inactivity (monitoring mouse, keyboard, clicks, and scrolling).
- **Anonymous Firebase Authentication** (`ensureAnonymousUser`) can be used for public voting.

> **Note:** Actual access rules should also be enforced in Firestore Security Rules (server-side) in addition to client-side checks.

---

## Voting System

The goal of the voting system is to allow each visitor to vote **only once per session**, without registration.

**How it works:**

1. A unique **visitor ID** (`crypto.randomUUID()`) is generated for each browser and stored in `localforage` (key: `bcquiz_visitor_id`).
2. When voting, a document is added to the `votes` collection with the ID `{sessionId}_{visitorId}`.
3. The operation runs in a **Firestore transaction** (`runTransaction`):
    - Checks if a vote with this ID already exists.
    - If yes → throws an error ("You have already voted on this topic!").
    - If no → records the vote **and** atomically increments the vote count for the theme.
4. When resetting votes, the associated `votes` documents are also deleted, allowing for re-voting.

> The `fingerprint` field actually contains the visitor ID. This solution prevents accidental double voting but does not provide complete protection against intentional abuse (e.g., clearing localStorage, using multiple browsers). For stronger protection, server-side checks / actual fingerprinting would be required.

---

## External Media APIs

The admin media search combines results from three sources (`services/media-api.ts`):

| Source           | Content           | Call Method                                   |
|------------------|-------------------|-----------------------------------------------|
| **TMDb**         | Movies, series    | Direct client-side call                       |
| **Google Books** | Books             | Direct client-side call                       |
| **IGDB**         | Video games       | Via server-side proxy (`/api/igdb`)           |

**IGDB Proxy (`app/api/igdb/route.ts`):**

- IGDB uses Twitch OAuth. The proxy requests and **caches** the Twitch access token server-side (in memory, with a 60s safety margin before expiration).
- Query responses are cached for **1 hour** to avoid unnecessary calls.
- The Twitch client ID and secret are never exposed to the client side.

---

## Environment Variables

Create a `.env.local` file in the project root. **Never commit real values!**

```bash
# --- Firebase (Required for production mode) ---
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# --- Firebase App Check (reCAPTCHA v3) ---
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=

# --- Mock Mode Toggle (Optional) ---
# If true, uses localStorage instead of Firebase
NEXT_PUBLIC_USE_LOCAL_MOCK=

# --- Media APIs (Optional, for search function) ---
NEXT_PUBLIC_TMDB_API_KEY=
NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY=

# --- IGDB / Twitch (Server-side, NOT public) ---
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
```

> **Security Warning:** `TWITCH_CLIENT_SECRET` is a server-side secret – never make it available with the `NEXT_PUBLIC_` prefix. Variables with the `NEXT_PUBLIC_` prefix are included in the browser bundle.

| Variable                                    | Required?          | Description                   |
|---------------------------------------------|--------------------|-------------------------------|
| `NEXT_PUBLIC_FIREBASE_*`                    | Yes for production | Firebase project configuration |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`            | Yes for App Check  | reCAPTCHA v3 site key         |
| `NEXT_PUBLIC_USE_LOCAL_MOCK`                | No                 | `true` = local mock mode      |
| `NEXT_PUBLIC_TMDB_API_KEY`                  | No                 | Movie/series search           |
| `NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY`          | No                 | Book search                   |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | No                 | IGDB (game) search            |

---

## Installation and Running

**Prerequisite:** Node.js 18+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
#    (create .env.local based on the template above)

# 3. Start developer server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> Without Firebase configuration, the application automatically switches to **mock mode**, so it can be tried immediately with demo data.

### Available Commands

| Command         | Description                                        |
|-----------------|----------------------------------------------------|
| `npm run dev`   | Developer server (with HMR, on `0.0.0.0` host)     |
| `npm run build` | Create production build                            |
| `npm run start` | Run production build                               |
| `npm run lint`  | ESLint check                                       |

---

## Firebase Setup

For production mode, a Firebase project is required with the following services:

1. **Firestore Database** – with the following collections:
    - `quizzes` – quiz nights
    - `voting_sessions` – voting sessions
    - `votes` – cast votes (with `{sessionId}_{fingerprint}` ID)
    - `settings/config` – configuration document with an `adminEmails: string[]` field
2. **Authentication** – Google login provider enabled. Anonymous login can also be enabled for public voting.
3. **Storage** – for image uploads (quiz/theme covers).
4. **App Check** – reCAPTCHA v3 provider to protect background APIs.

**Adding an Admin:** add the authorized Google email addresses to the `adminEmails` array in the `settings/config` document in Firestore.

> According to recommended security practices, you should also restrict write operations to admin emails in Firestore Security Rules, and enforce document ID uniqueness for the `votes` collection.

---

## Developer Guide

### Adding a New Data Operation

1. Extend types in `types/index.ts`.
2. Implement Firebase and mock logic in the appropriate service (`services/`). Follow the `ApiResponse<T>` pattern.
3. Create (or extend) a React Query hook in the `hooks/` folder.
4. Use the hook in the component.

### Mock Mode for Development

For the fastest development, set: `NEXT_PUBLIC_USE_LOCAL_MOCK=true`. Data is stored in the browser and can be reset at any time with the "Default Data" button on the admin interface.

### Conventions

- **Service layer for all data operations** – components should never call Firestore directly.
- **Unified response format** – every service returns `ApiResponse<T>`.
- **Client-side data fetching** – with TanStack Query, not in `useEffect`.
- **Responsive, mobile-first** design using Tailwind utility classes.

### Debugging

- Firebase queries run through the `trackQuery` helper function, providing unified error logging.
- The IGDB proxy writes detailed logs for token and cache events.

---

## User Guide

### For Visitors

1. Open the main page – upcoming quiz nights are displayed here.
2. Scroll to the **Voting** section and choose your favorite theme.
3. You can vote once per device.

### For Admins

1. Go to the `/admin` page and log in with your authorized Google account.
2. **Quizzes** tab – create, edit, activate quiz nights. Only active, future quizzes appear on the public page.
3. **Voting Themes** tab – create voting sessions and add themes (using the media search for cover art). Only one voting session can be active at a time. Votes can be reset.
4. **Tools** tab – generate and download QR codes (e.g., for placing the voting link at the venue).
5. Theme can be toggled in the top right corner, and you can log out. The system automatically logs out after 30 minutes of inactivity.

---

## Deployment to Vercel

The project is optimized for Vercel (Analytics and Speed Insights built-in).

1. Connect the Git repository to Vercel.
2. Provide the [environment variables](#environment-variables) in the Vercel project settings.
3. Vercel automatically builds and deploys the application on every push.

---

© 2026 BarCraft Budapest. All rights reserved.
