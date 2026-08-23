<div align="center">
  <img src="./client/src/assets/varuna.png" alt="VARUNA Logo" width="120" />
  <h1>VARUNA: Ocean Disaster Management System</h1>
  <p><strong>A unified, government-grade disaster management platform for building a resilient nation.</strong></p>
  
  [![React](https://img.shields.io/badge/React-19.0-blue.svg?style=flat&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg?style=flat&logo=node.js)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg?style=flat&logo=mongodb)](https://www.mongodb.com/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black.svg?style=flat&logo=socket.io)](https://socket.io/)
</div>

<br />

> **VARUNA** (named after the Hindu deity of water and oceans) is a comprehensive, real-time disaster management and response coordination platform. Built with a modern technology stack, VARUNA bridges the gap between citizens, NGOs, and disaster management officials to ensure rapid, coordinated responses to oceanic and coastal emergencies.

---

## The Problem
Natural oceanic and coastal disasters (cyclones, tsunamis, severe floods) cause massive devastation primarily due to delayed communication between affected citizens and emergency responders. Existing systems suffer from fragmented data, lack of real-time coordination, and manual triage processes that severely delay critical resource allocation during the golden hour of rescue.

## The Solution
VARUNA serves as a unified, real-time command center. By leveraging **Artificial Intelligence (AI)** and **Natural Language Processing (NLP)**, VARUNA completely automates the triage of emergency reports. When a citizen submits a disaster report, the system's AI engines instantly analyze the text and imagery to predict the severity of the threat, allowing authorities to dispatch resources efficiently without manual verification delays.

## What Was Done to Solve It
To build this highly resilient and intelligent platform, we implemented the following core architectures:
- **NLP-Powered Threat Analysis:** Integrated a dedicated machine learning microservice that utilizes Natural Language Processing (NLP) to extract context, urgency, and severity from unstructured citizen text reports, automatically categorizing them as Low, Mild, or High Risk.
- **AI Computer Vision Assessment:** Automated the analysis of user-uploaded disaster imagery using AI to corroborate textual reports with visual evidence of flooding or structural damage.
- **Real-Time Data Pipelines:** Built a robust WebSocket (Socket.io) infrastructure to broadcast AI-verified alerts to the live interactive map in milliseconds, ensuring all NGOs and District Disaster Management (DDMO) officials see the exact same critical data simultaneously.
- **Automated Intelligence Gathering:** Deployed automated web scraping microservices to continuously aggregate meteorological data and coastal warnings, enriching our internal database with official forecasts.

---

## Key Features

- **Live Interactive Maps:** Real-time geolocation tracking and disaster zone mapping using Leaflet. Features satellite, terrain, and default layers for precise topographical assessment.
- **Real-Time WebSockets:** Powered by Socket.io for instantaneous disaster alerts, live post updates, and real-time dashboard syncing across all active clients.
- **Role-Based Access Control (RBAC):** Tailored dashboards and capabilities for multiple user tiers: 
  - **General Users** (Citizen reporting)
  - **NGOs** (Relief coordination)
  - **DDMO Officials** (District authorities)
  - **Admins** (System oversight)
- **Advanced Authentication:** Seamless secure login via JWT (JSON Web Tokens) alongside Google OAuth 2.0 integration.
- **Modern UI/UX Design System:** Mobile-first, glass-morphism UI built from scratch using custom CSS. Features fluid micro-animations, accessible color contrast, and a professional thematic design inspired by Indian national colors.
- **Automated Data Scraping:** Integrated Python and Node.js scraping services (Cheerio) to aggregate official coastal warnings and weather alerts.
- **Media Management:** Direct Cloudinary integration for scalable disaster image uploads and report attachments.

---

## Technology Stack

**Frontend (Client)**
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Mapping:** React-Leaflet
- **State/Data:** Context API, Axios
- **Auth:** `@react-oauth/google`, JWT Decode
- **Styling:** Custom CSS with robust CSS variables and BEM methodology

**Backend (Server)**
- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Real-time:** Socket.io
- **Security:** bcryptjs, jsonwebtoken, CORS
- **Storage & Utils:** Multer, Cloudinary, Node-cron, CSV-writer

---

## Project Architecture

```text
VARUNA-disaster-management/
├── client/                 # Frontend React SPA (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI (Auth, Maps, Reports, Dashboard)
│   │   ├── api/            # Axios interceptors & API config
│   │   └── assets/         # Static media & icons
│   └── vercel.json         # Vercel deployment configuration
├── server/                 # Primary Node.js REST API & WebSocket Server
│   ├── controllers/        # Business logic (Auth, Alerts, Maps, Posts)
│   ├── models/             # MongoDB Mongoose Schemas
│   ├── routes/             # Express API route definitions
│   └── middlewares/        # JWT Verification & RBAC Guards
└── web-scraping-server/    # Microservice for aggregating live disaster data
```

---

## Getting Started

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) and [MongoDB](https://www.mongodb.com/) installed and running.

### 1. Clone the repository
```bash
git clone https://github.com/ARC7666/VARUNA-disaster-management.git
cd VARUNA-disaster-management
```

### 2. Backend Setup
```bash
cd server
npm install

# Create a .env file in the server directory:
# PORT=5000
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# GOOGLE_CLIENT_ID=your_google_oauth_client_id

npm start
```

### 3. Frontend Setup
```bash
cd ../client
npm install

# Create a .env file in the client directory:
# VITE_BACKEND_URL=http://localhost:5000
# VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

npm run dev
```

Visit `http://localhost:5173` to view the application in your browser.

---

## UI and Design Philosophy
VARUNA was designed with a strict focus on usability during high-stress emergency situations:
- **High Contrast & Clarity:** Utilizing an official "Government Blue" (`#1e40af`) paired with readable typography (`Inter` and `Poppins`).
- **Responsive by Default:** CSS Grid and Flexbox layouts ensure the command center works flawlessly whether viewed on a high-resolution monitor in a control room or a mobile phone in the field.
- **Thematic Flourishes:** Subtle integrations of the Indian Tricolor in loading states and authentication borders add a professional, patriotic polish.

---

## Contributing
Contributions, issues, and feature requests are welcome. 
If you are an engineer looking to improve the core platform or add integrations for weather APIs, feel free to fork the repository and submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <p>Built for a safer, more resilient tomorrow.</p>
</div>