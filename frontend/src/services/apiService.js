import axios from 'axios';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';

// Configure axios defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Service functions
export const apiService = {
  // System health
  checkHealth: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.health);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Venues
  getVenues: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.venues);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createVenue: async (venueData) => {
    try {
      const response = await api.post(API_ENDPOINTS.venues, venueData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  getVenueById: async (venueId) => {
    try {
      const response = await api.get(API_ENDPOINTS.venueById(venueId));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateVenue: async (venueId, updateData) => {
    try {
      const response = await api.put(API_ENDPOINTS.venueById(venueId), updateData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  getVenueAreas: async (venueId) => {
    try {
      const response = await api.get(API_ENDPOINTS.venueAreas(venueId));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  addVenueArea: async (venueId, areaData) => {
    try {
      const response = await api.post(API_ENDPOINTS.venueAreas(venueId), areaData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  updateArea: async (areaId, updateData) => {
    try {
      const response = await api.put(API_ENDPOINTS.areaById(areaId), updateData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  deleteArea: async (areaId) => {
    try {
      const response = await api.delete(API_ENDPOINTS.areaById(areaId));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getVenueProducts: async (venueId) => {
    try {
      const response = await api.get(API_ENDPOINTS.venueProducts(venueId));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Sessions
  getSessions: async (status = 'in_progress') => {
    try {
      const response = await api.get(`${API_ENDPOINTS.sessions}?status=${status}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createSession: async (sessionData) => {
    try {
      const response = await api.post(API_ENDPOINTS.sessions, sessionData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  getSessionById: async (sessionId) => {
	  try {
		const response = await api.get(API_ENDPOINTS.sessionById(sessionId));
		// Fix: Return the nested session data, not the wrapper
		return { success: true, data: response.data.session };
	  } catch (error) {
		return { success: false, error: error.message };
	  }
	},

  getSessionProgress: async (sessionId) => {
    try {
      const response = await api.get(API_ENDPOINTS.sessionProgress(sessionId));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

// Stock Entries (add these to the apiService object)
  getSessionEntries: async (sessionId) => {
    try {
      const response = await api.get(API_ENDPOINTS.sessionEntries(sessionId));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  addStockEntry: async (sessionId, entryData) => {
    try {
      const response = await api.post(API_ENDPOINTS.sessionEntries(sessionId), entryData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  updateStockEntry: async (entryId, updateData) => {
    try {
      const response = await api.put(API_ENDPOINTS.updateEntry(entryId), updateData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  deleteStockEntry: async (entryId) => {
    try {
      const response = await api.delete(API_ENDPOINTS.deleteEntry(entryId));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateSession: async (sessionId, updateData) => {
    try {
      const response = await api.put(API_ENDPOINTS.sessionById(sessionId), updateData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
  
  // Session History (add these to the apiService object)
  getVenueSessions: async (venueId, status = null, limit = 50, offset = 0) => {
    try {
      let url = API_ENDPOINTS.venueSessions(venueId) + `?limit=${limit}&offset=${offset}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getAllSessions: async (status = null, limit = 50, offset = 0) => {
    try {
      let url = API_ENDPOINTS.sessions + `?limit=${limit}&offset=${offset}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Voice Recognition & Master Products
  searchMasterProducts: async (query, sessionId = null, venueId = null, maxResults = 20, minConfidence = 40) => {
    try {
      const response = await api.post('/api/master-products/search', {
        query: query.trim(),
        sessionId,
        venueId,
        maxResults,
        minConfidence
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Voice search error:', error);
      return { success: false, error: error.message, suggestions: [] };
    }
  },

  recordProductSelection: async (productId, logId, selectionRank = 1) => {
    try {
      const response = await api.post('/api/voice-recognition/select', {
        productId,
        logId,
        selectionRank
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Selection recording error:', error);
      return { success: false, error: error.message };
    }
  },

  addMasterProduct: async (productData) => {
    try {
      const response = await api.post('/api/master-products', productData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Add master product error:', error);
      return { success: false, error: error.message };
    }
  },

}; 

export default apiService;