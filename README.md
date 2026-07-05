# SCCi: AI-Powered Smart City Grievance & Trust Portal
### *Empowering Municipal Governance, Citizen Trust, and Automated Public Infrastructure Management via Multimodal Gemini Vision & Google Cloud*

---

## 🚀 Live Demo & Development URLs
*   **Development App URL:** [https://ais-dev-kv6lltajrdup4agya43z4y-8250557229.asia-southeast1.run.app](https://ais-dev-kv6lltajrdup4agya43z4y-8250557229.asia-southeast1.run.app)
*   **Shared App URL:** [https://ais-pre-kv6lltajrdup4agya43z4y-8250557229.asia-southeast1.run.app](https://ais-pre-kv6lltajrdup4agya43z4y-8250557229.asia-southeast1.run.app)

---

## 1. Brief About the Idea

**SCCi** (Smart City Complaint Intelligence) is a state-of-the-art dual-portal platform built for modern municipal administrations and citizens. The core philosophy of SCCi is that **public complaint channels require a high trust score to succeed**.

By integrating **Gemini Multi-Modal Vision and Google Cloud Firestore**, SCCi secures civic platforms from spam, anonymous vandalism, and duplicates while eliminating registration hurdles. When citizens sign up, they can upload a copy of their national identity document (e.g., Aadhaar Card, PAN Card, Voter ID, or Passport). The backend calls **Gemini** to run real-time document OCR, validating the document's structure, verifying layout integrity, and instantly **extracting and auto-filling the citizen's Legal Name, Home/Residential Address, and Registered Phone Number** onto their profile. 

This establishes cryptographically secured, verified citizen accounts that help city administrators prioritize, geocode, assign, and resolve actual issues with 100% confidence.

---

## 2. Approach, Real-World Impact, and Workflow

### A. Approach to the Problem Statement
Most cities suffer from a disjointed public works workflow. We approached this problem by creating a full-stack, cloud-native architecture that bridges the gap between **trusted citizen reporting** and **automated municipal dispatch**.

1.  **Strict Security/Verification Gates:** Instead of standard open forms where anyone can file fake issues, we implemented a server-side route that proxies identity image bytes to **Gemini 2.5/3.5 Flash** for deep analysis, verifying whether the document is a valid national ID and extracting standard details.
2.  **Multimodal Complaint Intake:** Citizens can drag map markers or enter an address (which geocodes automatically to latitude/longitude) and upload a photo of the incident (e.g., street potholes, water leakages).
3.  **Automated Machine Analysis:** The backend uses Gemini and rules-based fallback engines to classify complaints, evaluate severity levels (High/Medium/Low), identify sentiments, and tag metadata words, reducing sorting delays.
4.  **Actionable Authority Portal:** Designed with elegant analytics boards using Recharts/D3 to track municipal SLAs, assign tasks to engineers, and view real-time geospatial hotspots.

---

### B. Real-World Problem Addressed & Practical Impact

| Aspect | The Traditional Problem | The SCCi Solution |
| :--- | :--- | :--- |
| **Spam / Fake Grievances** | Public databases are filled with duplicate, invalid, or anonymous complaints, leading to wasted surveyor inspection trips. | **AI Aadhaar/ID Verification** guarantees that every report is attached to a real, unique citizen profile. |
| **Friction in Profile Onboarding** | Manual forms with 15+ fields (Address, Phone, Name, UID) discourage civic engagement. | **Single-click OCR** extracts and auto-fills Name, Phone, and Address in under 3 seconds using Gemini Vision. |
| **Vague/Mismapped Incidents** | "Pothole near the old grocery store" makes it impossible for repair trucks to locate. | Interactive mapping geocodes text strings and allows users to **drag pinpoint location markers** with exact coordinates. |
| **Response Delays & Backlogs** | Complaints sit in standard email lists without clear prioritization. | **Automated SLA Engine** ranks tickets based on AI-determined severity and maps them into a real-time command center. |

---

### C. Core Architecture & Data Workflow
The system processes data securely from the moment a photo or document is uploaded to the moment an engineering crew marks a task as resolved.

```
+──────────────────────────+
|  Citizen Onboarding:     |
|  Upload Aadhaar / ID     |
+────────────┬─────────────+
             │ Base64 Image
             ▼
+──────────────────────────+     Validated Details      +──────────────────────────+
|   Server-side Gemini     | ─────────────────────────> |  Auto-Fill Profile Form  |
|   OCR & Structure Check  |                            |  Name, Phone, Address    |
+──────────────────────────+                            +────────────┬─────────────+
                                                                     │
                                                                     ▼
+──────────────────────────+      Geocoded Incident     +──────────────────────────+
|  Incident Submission:    | <───────────────────────── | Firestore Secure DB:     |
|  Geocoded Map Location   |                            | Citizen Record Secured   |
+────────────┬─────────────+                            +──────────────────────────+
             │
             ▼
+──────────────────────────+     Real-time Analysis     +──────────────────────────+
|  NVIDIA Mistral /        | ─────────────────────────> |  Executive Dashboard &   |
|  Gemini Issue Classifier |                            |  Interactive Map Marker  |
+──────────────────────────+                            +──────────────────────────+
```

---

## 3. Opportunities, Differentiation, & USP

### A. How Different Is It from Existing Ideas?
- **Vision-First Trust Layer:** Standard options use OTP SMS verification, which only proves ownership of a SIM card, not identity. SCCi uses multi-modal vision models to read and verify formal ID cards instantly.
- **Bi-directional AI Processing:** It uses AI on the *citizen side* (document inspection, auto-fill, chat assistant) and AI on the *official side* (complaint auto-tagging, severity prediction, sentiment monitoring).
- **Relational Data Mapping:** It actively checks Firestore to prevent duplicate registration of the same ID number under different accounts, protecting user identity.

### B. Unique Selling Point (USP)
> **"Zero-Friction Trust Onboarding"**
> By utilizing Gemini’s rapid structured JSON output schema, the application takes an image of an ID card and instantly verifies, extracts, and auto-fills the registration page with the user's name, registered address, and phone number. This offers complete municipal validation without any of the manual data-entry fatigue.

---

## 4. Key Features Offered by the Solution

1.  **🛡️ Live Government ID Verification:** Real-time upload interface supporting Indian Aadhaar, PAN Card, Voter ID, and other national documents.
2.  **📋 Auto-Extraction & Profile Binding:** Extracts legal details (Name, Address, Phone number, ID number) and auto-fills the profile.
3.  **📍 Geographic Geocoding Map Control:** Lets citizens enter physical addresses or drag pins to pinpoint the exact latitude and longitude of public issues.
4.  **🤖 Smart City AI Assistant:** A helpful chatbot that answers citizen inquiries regarding city guidelines, ordinances, and complaint status using context history.
5.  **📈 Executive Authority command center:** Full analytical screen for city managers, including status boards, maps, and category breakdowns.
6.  **🚦 Automated Severity Priority Router:** Uses LLMs to evaluate issues and rank critical hazards (High) higher on the department queue.
7.  **⏱️ Interactive Timeline SLAs:** Tracks resolution time based on severity, displaying color-coded timers to keep public departments accountable.

---

## 5. Process Flow Diagram

```
[ Citizen Sign-up/Log-in ]
           │
           ├─── Unverified ───> [ Upload ID Image ] ───> [ Gemini Vision OCR ] ───> [ Auto-fill & Secure Profile ] 
           │                                                                                     │
           └─── Verified Citizen ────────────────────────────────────────────────────────────────┘
                         │
                         ▼
             [ File Public Incident ]
                         │
                         ├───> Drag Map Marker / Geocode Location Address
                         ├───> Upload Incident Snapshot (Pothole, Wire leak, Trash)
                         └───> Gemini / Mistral API Classifies Category & Urgency
                                       │
                                       ▼
                       [ Firestore Database Entry ]
                                       │
                                       ▼
                    [ Official Analytical Console ]
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
                [ Geospatial Hotspots ]     [ SLA Task Assignment ]
```

---

## 6. Wireframes & UI Mock Layouts

### Citizen Submission Dashboard
```
+-----------------------------------------------------------------------------------------+
| SCCi                                          [Help Assistant AI]  [Citizen Menu] |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  Submit Grievance                          City-wide Incident Tracker                   |
|  +-------------------------------------+   +-----------------------------------------+  |
|  | Title: Broken sewer pipeline        |   | [ SEARCH INCIDENTS ]                    |  |
|  | Category: [ Water & Sewage  ] [V]   |   |                                         |  |
|  | Address: 4th Block, Indiranagar     |   |  • ID #732 - High Urgency Sewer Leak    |  |
|  |                                     |   |    [Assigned - SLA: 12 Hours Left]      |  |
|  | [ Drag and Drop Incident Image ]    |   |                                         |  |
|  |                                     |   |  • ID #731 - Medium Urgency Pothole     |  |
|  |  [ Pinpoint Location on Map ]       |   |    [Pending - SLA: 36 Hours Left]       |  |
|  |                                     |   +-----------------------------------------+  |
|  |  [ SUBMIT INCIDENT REPORT ]         |   | Interactive Visual Pins Map             |  |
|  +-------------------------------------+   | [o] Water Leak  [o] Power Outage        |  |
|                                            +-----------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

### Citizen ID Verification Modal
```
+-----------------------------------------------------------------------------------------+
| SCCi Secure Citizen Portal                                                       |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  Secure Profile Verification                                                            |
|  +--------------------------------------+  +-----------------------------------------+  |
|  | Upload ID Image (Aadhaar / Voter ID) |  | Gemini Vision AI Inspection Result      |  |
|  | +----------------------------------+ |  |                                         |  |
|  | |                                  | |  | STATUS: Verified Legitimate             |  |
|  | |        [ UPLOADED IMAGE ]        | |  |                                         |  |
|  | |                                  | |  | Extracted Data:                         |  |
|  | +----------------------------------+ |  | - Legal Name: Ramesh Kumar              |  |
|  |                                      |  | - ID Number:  5489-1204-9058            |  |
|  |  [ Choose another file ]             |  | - Address: 12, MG Road, Bengaluru       |  |
|  +--------------------------------------+  | - Phone: 9876543210                     |  |
|                                            |                                         |  |
|                                            | [ SAVE & AUTO-FILL REGISTRATION CARD ]  |  |
|                                            +-----------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 7. System Architecture Diagram

```
               ┌────────────────────────────────────────────────────────┐
               │                     Web Browser                        │
               │   (React SPA, Tailwind UI, Leaflet / Custom Maps)     │
               └───────────┬────────────────────────────────▲───────────┘
                           │                                │
                     HTTPS │ API Queries              HTTPS │ Data Streams
                           ▼                                │
               ┌────────────────────────────────────────────┴───────────┐
               │                    Express Server                      │
               │                 (Node.js REST Engine)                  │
               └───────────┬────────────────────────────────▲───────────┘
                           │                                │
                     HTTPS │ REST APIs                HTTPS │ REST APIs
                           ▼                                │
      ┌────────────────────┴───────────┐         ┌──────────┴─────────────────────┐
      │        Gemini Vision LLM       │         │       Cloud Firestore          │
      │  (ID verification, OCR,        │         │   (NoSQL Citizen Profiles,     │
      │   Incident Classification)     │         │    Grievance Collections)      │
      └────────────────────────────────┘         └────────────────────────────────┘
```

---

## 8. Technology Stack & Google/Nvidia Services Used

### A. Core Technologies
- **Front-End:** React 18, Vite (Fast HMR), Tailwind CSS (Aesthetic utilities), Lucide React (Sleek UI icons), Recharts & D3 (Dashboard analytics visualization).
- **Backend Server:** Node.js, Express, `tsx` TypeScript execution daemon.
- **Database Engine:** Google Cloud Firestore (Live collections, profile binding, security check indexing).

### B. Google & Nvidia AI Services
1.  **Google Gemini Developer API (`@google/genai`):** Used to interface with the `gemini-2.5-flash` model. Selected for its rapid inference speeds, high visual/OCR accuracy, and support for complex JSON Schemas.
2.  **Multimodal Vision OCR:** Utilized on the `/api/verify-id` route to parse uploaded identity documents and output formatted JSON, automating user onboarding.
3.  **NVIDIA Mistral API (or rules-based fallbacks):** Employed inside the `/api/analyze` router to tag, classify, and assess the severity and sentiment of citizen-submitted descriptions.

### C. Scalability & Deployment Support
- **Stateless Express Backend:** Allows the Node server to scale horizontally across serverless Google Cloud Run containers.
- **Flexible NoSQL Firestore Schemas:** Easily accommodates evolving municipal metadata, category additions, and custom compliance frameworks without downtime.

---

## 9. Prototype Highlights

### 1. Document Extraction Control Board
Our visual control board shows the raw uploaded image file side-by-side with the real-time **AI Inspection Panel**. Clicking the button triggers Gemini to parse the fields, showing loading alerts with dynamic scan animations.

### 2. Live Citizen Grievance Portal
Features interactive incident feeds, live status cards (Pending, In Progress, Resolved), and SLA timers indicating exactly how much time remains for the assigned department to resolve the issue.

### 3. Government Analytical Console
Includes interactive maps highlighting dense issue hotspots, progress graphs representing overall resolution rates, and ticket assignment boards that empower city coordinators to streamline public infrastructure maintenance.
