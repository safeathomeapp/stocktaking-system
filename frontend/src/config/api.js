// API Configuration for Stock Taking System
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://stocktaking-api-production.up.railway.app'
  : 'https://stocktaking-api-production.up.railway.app'; // Use production for development too since local DB has issues

export const API_ENDPOINTS = {
  // System
  health: '/api/health',

  // Venues
  venues: '/api/venues',
  venueById: (venueId) => `/api/venues/${venueId}`,
  venueProducts: (venueId) => `/api/venues/${venueId}/products`,
  venueSessions: (venueId) => `/api/venues/${venueId}/sessions`,
  venueAreas: (venueId) => `/api/venues/${venueId}/areas`,

  // Areas
  areas: '/api/areas',
  areaById: (areaId) => `/api/areas/${areaId}`,

  // Sessions
  sessions: '/api/sessions',
  sessionById: (sessionId) => `/api/sessions/${sessionId}`,
  sessionProgress: (sessionId) => `/api/sessions/${sessionId}/progress`,

  // Stock Entries
  sessionEntries: (sessionId) => `/api/sessions/${sessionId}/entries`,
  updateEntry: (entryId) => `/api/entries/${entryId}`,
  deleteEntry: (entryId) => `/api/entries/${entryId}`,
};

export default API_BASE_URL;