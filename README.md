# CivixVerify: AI-Powered Smart City Grievance & Trust Portal
### *Empowering Municipal Governance, Citizen Trust, and Automated Public Infrastructure Management via Multimodal Gemini Vision & Google Cloud*

---
## 🚀 Live Demo & Development URLs
*   **Development App URL:** [https://smart-city-complaint-intelligence.vercel.app/](https://smart-city-complaint-intelligence.vercel.app/)
*   **Shared App URL:** [https://smart-city-complaint-intelligence.vercel.app/](https://smart-city-complaint-intelligence.vercel.app/)


---

## 1. Brief About the Idea

**CivixVerify** is an enterprise-grade, intelligent smart city platform that bridges the communication and trust gap between citizens and municipal administrators. In traditional civic management portals, public grievance redressal channels suffer from high friction, anonymous spam, identity fraud, and severe classification bottlenecks.

CivixVerify solves this through a **trust-anchored onboarding ecosystem** powered by the **Google Gemini SDK** and **Google Cloud Firestore**. By integrating a state-of-the-art **AI Government ID Inspector**, the portal allows users to upload a physical copy of their national identification card (such as an Indian Aadhaar Card, PAN Card, Voter ID, or Driving License). The system performs deep multi-modal computer vision analysis to:
1.  **Validate Layout & Document Integrity:** Detect and flag invalid, dark, or spoofed images to maintain platform trust.
2.  **Instant Structured OCR Extraction:** Automatically extract critical fields—including **Legal Name, 12-digit ID Number, Residential Address, and Registered Mobile Number**—directly from the image.
3.  **One-Click Auto-Fill:** Instantly populates and locks the registration card with verified credentials, mitigating human keying errors and onboarding fatigue.

Once registered, citizens gain access to an interactive spatial map interface to report incidents (e.g., potholes, sewage leaks, power outages) and consult with a municipal AI assistant. In parallel, government departments use the administrative command center to evaluate AI-prioritized workflows, manage service level agreements (SLAs), and view analytical hotspots.

---

## 2. Problem Translation, Real-World Impact, & Technical Architecture

### A. Translation into Google Cloud & AI Workflows
We approached the common municipal grievance bottleneck by building a robust full-stack TypeScript environment configured with a headless API gateway. Rather than using mock configurations, we engineered real, high-throughput pipelines leveraging Google Cloud services:

*   **Multimodal AI Engine (Google Gemini SDK):** Using `@google/genai` on Node.js/Express, we pass raw document files straight to the `gemini-2.5-flash` or `gemini-3.5-flash` model. Using developer-configured system prompts and tight JSON Schema parameters, Gemini parses unstructured image pixels and yields standardized JSON structures. This bypasses legacy OCR scrapers that struggle with skew, shadows, or bilingual documents.
*   **Trust Binding & Integrity Gates (Google Cloud Firestore):** Firestore NoSQL acts as our real-time synchronization store. Once Gemini extracts identity data, the backend queries Firestore indexes to ensure the national ID number is not already registered under another account, cryptographically locking individual identifiers to specific user profiles and preventing identity duplication.
*   **Geospatial Mapping & Incident Geocoding:** Addresses provided by citizens (or auto-filled from verified Aadhaar records) are parsed and geocoded into precise GPS coordinates (Latitude/Longitude), mapping reports to live-updating Leaflet coordinate layers.
*   **Automated Classification Router:** Every submitted grievance is classified, tagged, and analyzed for hazard severity through an LLM classification pipeline, optimizing routing to the correct department (e.g., Public Works, Water Authority, Electricity Board).

---

### B. Real-World Impact & Problem Solved

| Affected Stakeholder | Traditional Pain Point | CivixVerify Practical Impact |
| :--- | :--- | :--- |
| **Citizens & Community** | - Registration forms are incredibly long and tedious.<br>- Lack of feedback leads to citizens feeling ignored.<br>- Vague location descriptions make finding issues difficult. | - **One-click sign-up** via ID photo upload.<br>- Real-time SLA progress timers and transparency logs.<br>- GPS interactive marker pins ensure repair teams arrive exactly where needed. |
| **Municipal Organizations** | - Platforms flooded with fake, duplicate, or duplicate spam reports.<br>- Heavy administrative overhead to sort and assign issues manually. | - **Verified-Identity-Only** submissions protect resources.<br>- Automated severity routing ranks critical hazards (e.g., open drains) instantly. |
| **Cities & Urban Planners** | - Unstructured complaint logs provide no long-term insight into infrastructure decline. | - Real-time spatial heatmaps reveal systemic, recurring problem areas. |

---

### C. Technical Architecture & Structural Workflow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CLIENT VIEW                                      │
│                                                                                        │
│     [Citizen Sign-Up]  ───────> Upload ID ───────> Verify  ───────> Form Auto-Filled   │
│            │                                                                 ▲         │
│            ▼ (Authenticated with Profile Locked)                             │         │
│     [Grievance Panel]  ───────> File Complaint ───> Upload Photo ────────────┼─┐       │
│            │                                                                 │ │       │
│            ▼                                                                 │ │       │
│     [Smart City Chat]  ◄─────── Consult Assistant                            │ │       │
└────────────┬─────────────────────────────────────────────────────────────────┼─┼───────┘
             │                                                                 │ │
             │ REST API Queries (SSL Secured)                                  │ │
             ▼                                                                 │ │
┌──────────────────────────────────────────────────────────────────────────────┼─┼───────┐
│                                   API GATEWAY                                │ │
│                                                                              │ │
│     [Express Backend API Router]                                             │ │
│            ├─── /api/verify-id  ─────────────────────────────────────────────┘ │
│            ├─── /api/analyze-incident ─────────────────────────────────────────┘
│            └─── /api/chat-assistant                                            │
└────────────┬────────────────────────────────────────┬──────────────────────────┼───────┘
             │                                        │                          │
             ▼ SDK Calls                              ▼                          ▼
┌────────────────────────────────────────┐┌────────────────────────┐┌────────────────────┐
│         Google Gemini Models           ││  Google Cloud Firestore││  Mapping Engine    │
│  (Multimodal OCR & Layout Analysis)   ││  (NoSQL DB & Indexes)  ││ (Leaflet/Geocodes) │
└────────────────────────────────────────┘└────────────────────────┘└────────────────────┘
```

---

## 3. Opportunities, Differentiation, & Unique Selling Point (USP)

### A. Differentiation from Competitors
Existing administrative portals are typically simple forms that lack smart features. The comparison below illustrates CivixVerify's key differentiators:

1.  **Identity Verification vs. SIM Registration:** Most portals verify users via phone-based OTP, which only proves ownership of a SIM card. CivixVerify verifies national documents, ensuring accountability.
2.  **Multimodal Intake:** Traditional platforms require users to fill out complex categories manually. Our platform analyzes photos of street damage to auto-classify categories, severity, and urgency.
3.  **Conversational Assistance:** Instead of standard FAQ menus, an AI Municipal Agent guides users through emergency preparedness, legal codes, and active ticket status.

### B. Unique Selling Point (USP)
> **"Visual Trust, Zero Friction."**
> CivixVerify turns registration into a secure, single-step onboarding process. By analyzing a national ID, it extracts name, address, and mobile number, validating identity and auto-filling profile forms in under three seconds. This provides robust accountability without administrative friction.

---

## 4. Key Features Offered by the Solution

### 1. Citizen Interface
*   **🛡️ Multi-Document ID Inspector:** Instantly verifies Indian Aadhaar, PAN Cards, Driver’s Licenses, and Passports.
*   **📋 Single-Tap Profile Autofill:** Automatically populates user profile forms using structured OCR.
*   **📍 Spatial Geocoding Map:** Drag-and-drop map markers to pin precise incident locations.
*   **🤖 City Council AI Assistant:** Real-time chat helper that references local codes, safety warnings, and ticket statuses.
*   **⏱️ Live SLA Redressal Tracker:** Visual timeline logs showing exactly when a ticket was received, assigned, and resolved.

### 2. Municipal Authority Dashboard
*   **🗺️ Interactive Geospatial Map:** Dynamic map clusters showing the distribution of complaints across city zones.
*   **📊 Performance Metrics & Analytics:** Interactive charts (using Recharts and D3) tracking ticket categories, weekly volume, and resolution rates.
*   **🚦 Intelligent Severity Routing:** Automatically prioritizes high-hazard complaints to ensure fast resolution.
*   **⚙️ SLA Administrative Controls:** Tools for government staff to assign engineers, log field updates, and close tickets.

---

## 5. Process Flow Diagram (Detailed Use Case)

```
                       +─────────────────────────────────+
                       │       Unregistered Citizen      │
                       +────────────────┬────────────────+
                                        │
                                        ▼
                       +─────────────────────────────────+
                       │      Upload Government ID       │
                       +────────────────┬────────────────+
                                        │
                                        ▼
                       +─────────────────────────────────+
                       │   Gemini Vision OCR API Route   │
                       +────────────────┬────────────────+
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼ [Document Rejected]                   ▼ [Document Verified]
        +───────────────────────+               +───────────────────────+
        │ Display Error & Reason│               │ Auto-fill Profile     │
        +───────────────────────+               │ (Name, Phone, Address)│
                                                +───────────┬───────────+
                                                            │
                                                            ▼
                                                +───────────────────────+
                                                │ Firestore Integrity   │
                                                │ Lock (No Duplicates)  │
                                                +───────────┬───────────+
                                                            │
                                                            ▼
                                                +───────────────────────+
                                                │ File Incident Ticket │
                                                +───────────┬───────────+
                                                            │
                                                            ▼
                                                +───────────────────────+
                                                │ AI Classifies Category│
                                                │ & Severity Level      │
                                                +───────────┬───────────+
                                                            │
                                                            ▼
                                                +───────────────────────+
                                                │ Municipal Authority   │
                                                │ SLA Redressal Stream  │
                                                +───────────────────────+
```

---

## 6. Wireframes & Frontend Layout Mockups

### Frame A: ID Verification Suite (Signup Phase)
```
+-----------------------------------------------------------------------------------+
| CivixVerify | Secure Government Identity Verification Setup                      |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  Select Identity Card Type: [ Indian Aadhaar Card (UIDAI) ] [V]                   |
|                                                                                   |
|  +---------------------------------------+  +----------------------------------+  |
|  | Card Document Image Upload Area       |  | Real-Time Gemini Vision Results  |  |
|  |                                       |  |                                  |  |
|  |  +---------------------------------+  |  | STATUS: [ VERIFIED & SECURED ]   |  |
|  |  |                                 |  |  |                                  |  |
|  |  |        [ Aadhaar Image ]        |  |  | extracted profile properties:    |  |
|  |  |                                 |  |  | • Legal Name: Ramesh Kumar       |  |
|  |  +---------------------------------+  |  | • ID Number:  5489 1204 9058     |  |
|  |                                       |  | • Address: 12, MG Road, Sec 4,   |  |
|  |  [ Choose another document file ]     |  |   Bengaluru, Karnataka - 560001  |  |
|  +---------------------------------------+  | • Phone: 9876543210              |  |
|                                             |                                  |  |
|                                             | [ LINK IDENTITY & AUTO-FILL ]    |  |
|                                             +----------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Frame B: Citizen Workspace Dashboard
```
+-----------------------------------------------------------------------------------+
| CivixVerify Portal                                        [AI Assistant] [Ramesh] |
+-----------------------------------------------------------------------------------+
|  +-------------------------------------+  +------------------------------------+  |
|  | File A Public Grievance             |  | Interactive Incident Geo-Map       |  |
|  |                                     |  |                                    |  |
|  | Grievance Category:                 |  | +--------------------------------+ |  |
|  | [ Road Damage / Potholes     ] [V]  |  | | [o] sewage spill (High)        | |  |
|  | Title: Major Pothole Near Intersection|  | |                                | |  |
|  | Incident Address:                   |  | |           [o] Pothole (Med)    | |  |
|  | [ 12, MG Road, Sec 4, Bengaluru   ] |  | |                                | |  |
|  |                                     |  | +--------------------------------+ |  |
|  | Upload Damage Snapshots:            |  |                                    |  |
|  | [ Drop Incident Images Here       ] |  | Active Redressal Tracker:          |  |
|  |                                     |  | • Sewer Leaks - Assigned (12h left)|  |
|  | [ SUBMIT GRIEVANCE ]                |  | • Potholes    - Pending  (36h left)|  |
|  +-------------------------------------+  +------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 7. Comprehensive Architecture Blueprint

```
                      +───────────────────────────────+
                      │       Web Application         │
                      │  (React 18 Single Page App)   │
                      +───────────────┬───────────────+
                                      │
                         REST API     │ Server Streams
                         Queries      │ 
                                      ▼
                      +───────────────────────────────+
                      │      TypeScript Backend       │
                      │   (Node.js Express Server)    │
                      +───────────────┬───────────────+
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
+───────────────────────+ +───────────────────────+ +───────────────────────+
|     Google Gemini     | |     Google Cloud      | |   Leaflet Map Engine  |
|    SDK Integration    | |   Firestore Database  | |   & Geocode Services  |
| (Multimodal OCR, Chat | | (Citizen Data Store,  | | (Geospatial Incident  |
|  Classification, LLM) | | Grievance Records)    | |   Coordinate Plot)    |
+───────────────────────+ +───────────────────────+ +───────────────────────+
```

---

## 8. Technology Stack & Design Decisions

### Why We Selected This Stack
1.  **Google Gemini Developer API (`@google/genai`):** We integrated the `gemini-2.5-flash` model. Its multimodal capabilities allow it to analyze physical documents, while support for structured JSON schemas ensures consistent, reliable API responses.
2.  **Tailwind CSS:** Selected for custom, responsive interface styling with high-contrast UI components and robust accessibility support.
3.  **Google Cloud Firestore:** A real-time, serverless NoSQL database that scales effortlessly while maintaining high data integrity through duplicate-prevention indexes.
4.  **Leaflet & Geocoding Map Controls:** Enables coordinate mapping directly in the browser, bypassing complex, proprietary mapping setups.

---

## 9. Running and Initializing the Prototype

### Quickstart Setup
1.  **Configure Environment Variables:**
    Create a `.env` file in the project root:
    ```env
    GEMINI_API_KEY=your_actual_gemini_api_key
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Start the Live Dev Server:**
    ```bash
    npm run dev
    ```
4.  **Open Portal:**
    Navigate to `http://localhost:3000` to interact with both the Citizen and Authority dashboards.
