# Smart City Complaint Intelligence (SCCI)

SCCI is a highly polished, full-stack civic dashboard and reporting system built on React 19, Tailwind CSS v4, Express, and Google Cloud Firestore. The application features a prioritize-by-hazard triage design that empowers citizens to report local infrastructure issues with pinpoint geographic accuracy and enables municipal authorities to manage resolutions with data-driven transparency.

The application utilizes an advanced hybrid AI intelligence layer powered by **NVIDIA NIM (Mistral Large 3)** with an instantaneous localized NLP rule-engine fallback, allowing the portal to automatically categorize issues, evaluate severity, gauge citizen sentiments, and extract tags without blocking user operations.

---

## 🚀 Architectural Overview

SCCI follows a robust full-stack architecture that splits responsibility cleanly between a responsive client interface and a secure, proxying Express server.

```
┌────────────────────────────────────────────────────────┐
│                      Client-Side                       │
│  ┌──────────────────┐  ┌────────────────────────────┐  │
│  │  Citizen Portal  │  │   Municipal Authority UI   │  │
│  └────────▲─────────┘  └─────────────▲──────────────┘  │
│           │                          │                 │
│           └───────────┬──────────────┘                 │
│                       ▼                                │
│              [ React 19 + Tailwind v4 ]                │
└───────────────────────┬──────────────┬─────────────────┘
                        │              │
       [Direct Reads]   │              │ [API Requests]
       & Offline Cache  │              │ (Analyze / Chat)
                        ▼              ▼
           ┌────────────────┐      ┌────────────────────────┐
           │ Cloud FireStore│      │     Express Server     │
           │  (Data Store)  │      │   - Vite Dev Proxy     │
           └────────────────┘      │   - Local NLP Fallback │
                                   │   - NVIDIA NIM Gateway │
                                   └───────────┬────────────┘
                                               ▼
                                   ┌────────────────────────┐
                                   │    NVIDIA NIM API      │
                                   │ (Mistral-Large-3-675b) │
                                   └────────────────────────┘
```

### Key Technical Pillars
1. **Interactive Geolocation Maps**: Leverages Leaflet maps to allow citizens to place complaint markers visually.
2. **Prioritize-by-Hazard Municipal Desk**: Highlights high-severity public hazards (water main bursts, downed high-voltage lines, open sewer pipes) to on-ground engineering teams.
3. **Double-Buffered State Management**: Features standard Cloud Firestore persistence synced with automatic `localStorage` caching to guarantee 100% functionality and seamless UX even during network drops.
4. **Interactive Civic Assistant AI**: A floating conversational chatbot built into the interface to assist citizens in drafting reports and explain municipal triage protocols.

---

## 📂 File Structure Directory

```
├── .env.example                # Example configuration of secret environment keys
├── firebase-blueprint.json     # Declarative schema blueprints for Cloud Firestore
├── firestore.rules             # Declarative security rules for Firestore access control
├── index.html                  # Core single-page application entry file with Leaflet CDN
├── metadata.json               # Application workspace metadata and framework configurations
├── package.json                # Project dependencies, build, and production start scripts
├── server.ts                   # Full-stack Node Express server, endpoint APIs, & Vite router middleware
└── src/
    ├── App.tsx                 # Main application coordinator, path router, and auth gatekeeper
    ├── index.css               # Unified global Tailwind CSS import and Space Grotesk theme mapping
    ├── main.tsx                # Client entry point configured to suppress HMR websocket noise
    ├── firebase.ts             # Firestore connection setup, offline caching, and database seeding
    └── components/
        ├── AiAssistant.tsx     # Floating conversational AI chatbot UI component
        ├── AuthorityPortal.tsx # Priority-driven dashboard workspace for city officials
        ├── CitizenPortal.tsx   # Report and complaint-tracking wizard for local citizens
        ├── DashboardCharts.tsx # Visual metrics powered by Recharts (Category, Severity, Timelines)
        ├── HomeDetails.tsx     # Responsive main dashboard landing page
        ├── LoginPortal.tsx     # Multi-role authentication panel
        └── MapComponent.tsx    # Standardized Leaflet GPS pointer mapping implementation
```

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` into a new `.env` file in your root folder:

```bash
cp .env.example .env
```

| Environment Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `NVIDIA_API_KEY` | Key for Nvidia NIM API model analysis. | *(Generate on build.nvidia.com)* |
| `GEMINI_API_KEY` | Backup Google Gemini Key. | *MY_GEMINI_API_KEY* |
| `APP_URL` | Self-referential application URL for hooks. | *http://localhost:3000* |
| `VITE_FIREBASE_API_KEY` | Firebase API Key (Client-side). | *(Found in Firebase Console)* |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain. | *[your-project].firebaseapp.com* |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID. | *[your-project-id]* |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket. | *[your-project].appspot.com* |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging Sender ID. | *(9-digit identifier)* |
| `VITE_FIREBASE_APP_ID` | Firebase Unique Application ID. | *1:xxxxx:web:xxxxxx* |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Custom Firestore Database ID. | *(optional, defaults to `(default)`)* |

---

## 🛠️ Local Development Guide

To download, configure, and boot the application locally on your machine, execute the following commands:

### 1. Install Dependencies
Ensure that Node.js (v18+) is installed on your computer:
```bash
npm install
```

### 2. Configure Firebase Setup
The application is pre-configured to look at a local configuration file `firebase-applet-config.json` in the root of the project to initialize Firebase. If deploying locally, fill out your custom credentials in either your `.env` variables or inside the `firebase-applet-config.json` file.

### 3. Run Development Server
This boots the custom full-stack server using `tsx` (TypeScript Executor) on port `3000`.
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser to view the application.

---

## 📦 Build Phase
To compile both the React client bundle and the Node backend server to clean production-ready chunks, run:
```bash
npm run build
```
The build process executes:
1. `vite build` — Bundles client-side assets to `/dist`.
2. `esbuild server.ts ...` — Bundles the Express TypeScript backend into a highly optimized, standalone, self-contained CommonJS Node file located at `/dist/server.cjs`.

To run the compiled production build locally:
```bash
npm run start
```

---

## 🌐 Complete Step-by-Step Hosting Guide

Because SCCI is a full-stack application (client-side React + server-side Node.js APIs), it requires a hosting approach that can run a Node environment, or a split deployment where the frontend is hosted on static pages and the backend is run serverless.

Here are the three best paths to host your application in production.

---

### Pathway A: Google Cloud Run (Recommended Full-Stack Path)
Cloud Run is a fully managed serverless platform that runs containerized applications. It matches the architecture utilized inside Google AI Studio.

#### Step 1: Install the Google Cloud SDK
Ensure you have the `gcloud` CLI installed and authenticated:
```bash
gcloud auth login
gcloud auth configure-docker
```

#### Step 2: Create a `Dockerfile`
Create a file named `Dockerfile` in the root of your project:
```dockerfile
FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start"]
```

#### Step 3: Deploy Directly with Cloud Run
Execute this command in your project root to build and deploy the container in one step:
```bash
gcloud run deploy smartcity-intelligence \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NVIDIA_API_KEY=your_actual_key_here,NODE_ENV=production"
```
Once completed, the Google Cloud CLI will print your live service URL.

---

### Pathway B: Firebase Hosting + Cloud Functions (Official Firebase Path)
Since SCCI already contains `firestore.rules` and `firebase-blueprint.json`, integrating with Firebase Hosting provides an incredibly reliable, low-cost serverless experience.

#### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

#### Step 2: Initialize Firebase in your directory
Run the initialization wizard:
```bash
firebase init
```
Select the following options:
* **Firestore**: Configure security rules (`firestore.rules`) and indexes.
* **Hosting**: Configure files for Firebase Hosting.
* **Functions**: Compile server.ts logic to a serverless Cloud Function (optional, if server-side NIM APIs are needed).

#### Step 3: Set up Single-Page Redirects
Ensure your generated `firebase.json` redirects all client traffic to your static entry `index.html` (since we are using a Single Page App):
```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

#### Step 4: Build and Deploy
```bash
npm run build
firebase deploy
```
This deploys the static React client directly to Firebase’s secure global CDN and applies the specified Firestore security rules instantly.

---

### Pathway C: Render, Fly.io, or Heroku (Fast Server Deployment)
These modern PaaS platforms are excellent for simple full-stack Node.js deployment.

#### Step 1: Connect your Repository
Push your project to a private or public GitHub repository.

#### Step 2: Configure Render / Fly.io Settings
Create a new **Web Service** and map the following parameters:
* **Build Command**: `npm install && npm run build`
* **Start Command**: `npm run start`
* **Environment Variable Config**: Add `NVIDIA_API_KEY`, `VITE_FIREBASE_API_KEY`, and remaining key credentials inside the settings dashboard.

The platforms will auto-detect the port bindings, construct the esbuild bundled server, and launch the Node process on a secure URL.
