# INCIOS Ocean Disaster Management

A comprehensive ocean disaster management system with real-time reporting, live mapping, and disaster response coordination.

## Features

- **Dashboard**: Real-time disaster reporting and monitoring
- **Reports Page**: View and manage disaster reports
- **Live Map**: Interactive map with multiple view types (satellite, terrain, default)
- **Mobile Responsive**: Optimized for both desktop and mobile devices

## Project Structure

```
├── backend/           # API server and database
├── frontend/          # Client-side application
├── docs/             # Documentation
├── assets/           # Static assets
└── README.md         # This file
```

## Issues Being Addressed

1. **Posting Issue**: Posts showing "posting" but not appearing in reports page
2. **Map Visibility**: Map not visible on live map page
3. **Map Legends**: Reduce legend size and make responsive for mobile
4. **Map Types**: Add satellite, terrain, and default map options

## Setup Instructions

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Development Status

- [x] Project structure created
- [ ] Backend API endpoints
- [ ] Frontend components
- [ ] Map integration
- [ ] Mobile responsive design

## Technologies

- Backend: Node.js/Express (or your preferred stack)
- Frontend: React/Vue/HTML+JS (to be determined)
- Maps: Leaflet/OpenLayers/Google Maps (to be determined)
- Database: MongoDB/PostgreSQL (to be determined)