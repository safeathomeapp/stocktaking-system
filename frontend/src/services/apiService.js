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

  deleteStockEntry: async (sessionId, productId) => {
    try {
      const response = await api.delete(`${API_BASE_URL}/api/sessions/${sessionId}/entries/product/${productId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
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

      // TEMPORARY: Mock response for testing voice recognition UI
      if (query.toLowerCase().includes('beck')) {
        return {
          success: true,
          data: {
            suggestions: [
              {
                id: 'mock-1',
                name: "Beck's Lager",
                brand: "Beck's",
                category: "Beer",
                size: "275ml",
                confidence: 75,
                logId: 'mock-log-1'
              },
              {
                id: 'mock-2',
                name: "Beck's Blue",
                brand: "Beck's",
                category: "Beer",
                size: "275ml",
                confidence: 79,
                logId: 'mock-log-2'
              }
            ]
          }
        };
      } else if (query.toLowerCase().includes('wine') || query.toLowerCase().includes('chardonnay')) {
        return {
          success: true,
          data: {
            suggestions: [
              {
                id: 'mock-3',
                name: "House Chardonnay",
                brand: "House Wine",
                category: "Wine",
                size: "750ml",
                confidence: 92,
                logId: 'mock-log-3'
              },
              {
                id: 'mock-4',
                name: "Kendall Jackson Chardonnay",
                brand: "Kendall Jackson",
                category: "Wine",
                size: "750ml",
                confidence: 87,
                logId: 'mock-log-4'
              }
            ]
          }
        };
      }

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

  // Create venue-specific product
  createVenueProduct: async (venueId, productData) => {
    try {
      const response = await api.post(`/api/venues/${venueId}/products`, productData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create venue product error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Master Products API
  getMasterProducts: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/api/master-products?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get master products error:', error);
      return { success: false, error: error.message };
    }
  },

  getMasterProductById: async (id) => {
    try {
      const response = await api.get(`/api/master-products/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get master product error:', error);
      return { success: false, error: error.message };
    }
  },

  createMasterProduct: async (productData) => {
    try {
      const response = await api.post('/api/master-products', productData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create master product error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  updateMasterProduct: async (id, updateData) => {
    try {
      const response = await api.put(`/api/master-products/${id}`, updateData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update master product error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  getMasterProductCategories: async () => {
    try {
      const response = await api.get('/api/master-products/categories/summary');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get master product categories error:', error);
      return { success: false, error: error.message };
    }
  },

  searchMasterProductsAdvanced: async (searchQuery, options = {}) => {
    try {
      const { limit = 20, min_score = 0.1 } = options;
      const response = await api.post('/api/master-products/search', {
        query: searchQuery,
        limit,
        min_score
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Search master products error:', error);
      return { success: false, error: error.message };
    }
  },

  // User Profile Management (Single-user system)
  getUserProfile: async () => {
    try {
      const response = await api.get('/api/user/profile');
      return { success: true, profile: response.data.profile };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  getUserSummary: async () => {
    try {
      const response = await api.get('/api/user/summary');
      return { success: true, summary: response.data.summary };
    } catch (error) {
      console.error('Get user summary error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  updateUserProfile: async (profileData) => {
    try {
      const response = await api.put('/api/user/profile', profileData);
      return { success: true, profile: response.data.profile, message: response.data.message };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  resetUserProfile: async () => {
    try {
      const response = await api.post('/api/user/profile/reset');
      return { success: true, profile: response.data.profile, message: response.data.message };
    } catch (error) {
      console.error('Reset user profile error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // EPOS Sales Imports
  importEposData: async (venueId, eposData) => {
    try {
      const response = await api.post('/api/epos-imports', {
        venue_id: venueId,
        ...eposData
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Import EPOS data error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  getEposImports: async (venueId) => {
    try {
      const response = await api.get(`/api/epos-imports?venue_id=${venueId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get EPOS imports error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  getEposImportRecords: async (importId, matchStatus = null) => {
    try {
      const url = matchStatus
        ? `/api/epos-imports/${importId}/records?match_status=${matchStatus}`
        : `/api/epos-imports/${importId}/records`;
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get EPOS import records error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  matchEposRecord: async (recordId, venueProductId, matchedBy) => {
    try {
      const response = await api.put(`/api/epos-records/${recordId}/match`, {
        venue_product_id: venueProductId,
        matched_by: matchedBy
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Match EPOS record error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // CSV Preferences
  getVenueCsvPreferences: async (venueId) => {
    try {
      const response = await api.get(`/api/venues/${venueId}/csv-preferences`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get CSV preferences error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  saveVenueCsvPreferences: async (venueId, preferences) => {
    try {
      const response = await api.put(`/api/venues/${venueId}/csv-preferences`, preferences);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Save CSV preferences error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  getVenueLastSessionDate: async (venueId) => {
    try {
      const response = await api.get(`/api/venues/${venueId}/last-session-date`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get last session date error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Suppliers
  getSuppliers: async () => {
    try {
      const response = await api.get('/api/suppliers');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get suppliers error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Invoice Import Preferences
  getSupplierInvoicePreferences: async (supplierId) => {
    try {
      const response = await api.get(`/api/suppliers/${supplierId}/invoice-preferences`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get supplier invoice preferences error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  saveSupplierInvoicePreferences: async (supplierId, preferences) => {
    try {
      const response = await api.put(`/api/suppliers/${supplierId}/invoice-preferences`, preferences);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Save supplier invoice preferences error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  // Invoice PDF Upload
  uploadInvoicePDF: async (pdfFile, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);

      const response = await api.post('/api/invoices/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Upload invoice PDF error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

};

export default apiService;