import axios from 'axios';
import { toast } from 'react-hot-toast';

// Enhanced API configuration with comprehensive error handling
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to determine error type
const getErrorType = (error) => {
  if (!error.response) {
    return 'NETWORK_ERROR';
  }
  
  const status = error.response.status;
  if (status >= 400 && status < 500) {
    return status === 404 ? 'NOT_FOUND' : 'CLIENT_ERROR';
  }
  if (status >= 500) {
    return 'SERVER_ERROR';
  }
  return 'UNKNOWN_ERROR';
};

// Helper function to get user-friendly error messages
const getErrorMessage = (error, endpoint) => {
  const status = error.response?.status;
  
  // Special handling for session-related 404s
  if (status === 404) {
    if (endpoint?.includes('/sessions/')) {
      return 'Session not found. This might be because the session has expired or the backend is not fully configured.';
    }
    if (endpoint?.includes('/health')) {
      return 'Health check endpoint not available. Server may be starting up.';
    }
    return 'The requested resource was not found. Some features may not be available yet.';
  }
  
  if (status === 401) {
    return 'Authentication required. Please log in to continue.';
  }
  
  if (status === 403) {
    return 'Access denied. You do not have permission to perform this action.';
  }
  
  if (status === 429) {
    return 'Too many requests. Please wait a moment before trying again.';
  }
  
  if (status >= 500) {
    return 'Server error. Please try again later or contact support if the problem persists.';
  }
  
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }
  
  return error.response?.data?.message || 'An unexpected error occurred. Please try again.';
};

// Request interceptor to add metadata
api.interceptors.request.use(
  (config) => {
    // Add timestamp for duration calculation
    config.metadata = { startTime: new Date() };
    
    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    // Minimal logging in development
    return response;
  },
  async (error) => {
    const errorType = getErrorType(error);
    const endpoint = error.config?.url;
    const userMessage = getErrorMessage(error, endpoint);
    
    // Silent error handling - no console logs unless critical
    // Only log critical errors that aren't expected 404s
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server Error:', {
        status: error.response.status,
        url: endpoint
      });
    }

    // Handle specific error cases with appropriate actions
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // For 404 errors on session endpoints, try local storage fallback
    if (error.response?.status === 404 && endpoint?.includes('/sessions/')) {
      // Silent fallback to local storage
      return Promise.reject({
        ...error,
        isSilent: true,
        userMessage
      });
    }

    // Show user-friendly toast for other errors (not 404s)
    if (error.response?.status !== 404) {
      toast.error(userMessage, {
        duration: 4000,
        position: 'top-right',
      });
    }

    // Enhance error object with user-friendly information
    const enhancedError = {
      ...error,
      userMessage,
      errorType,
      timestamp: new Date().toISOString()
    };

    return Promise.reject(enhancedError);
  }
);

// Health check function (use direct URL to avoid /api prefix)
const healthCheck = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const healthUrl = baseUrl.replace('/api', '') + '/health';
    
    const response = await axios.get(healthUrl, { timeout: 5000 });
    return {
      status: 'online',
      data: response.data
    };
  } catch (error) {
    return {
      status: 'offline',
      error: error.message
    };
  }
};

// Enhanced API service with comprehensive session management
export const apiService = {
  // Health check
  healthCheck,

  // Session management
  sessions: {
    // Create new session
    create: async (sessionData) => {
      try {
        return await api.post('/sessions', sessionData);
      } catch {
        // Silent fallback to local storage
        const sessionId = 'local_' + Date.now();
        const localSession = { ...sessionData, id: sessionId, source: 'local' };
        localStorage.setItem(`session_${sessionId}`, JSON.stringify(localSession));
        return { data: localSession };
      }
    },

    // Restore session with fallback
    restoreSession: async (sessionId) => {
      try {
        return await api.get(`/sessions/restore/${sessionId}`);
      } catch (error) {
        // Silent fallback to local storage
        const localData = localStorage.getItem(`session_${sessionId}`);
        if (localData) {
          return { data: { ...JSON.parse(localData), source: 'local' } };
        }
        throw error;
      }
    },

    // Auto-save with fallback
    saveAutosave: async (saveData) => {
      try {
        return await api.post('/sessions/autosave', saveData);
      } catch {
        // Silent fallback to local storage
        const saveKey = `autosave_${saveData.sessionId}_${Date.now()}`;
        localStorage.setItem(saveKey, JSON.stringify(saveData));
        return { data: { id: saveKey, source: 'local' } };
      }
    },

    // Get autosave history
    getAutosaveHistory: async (sessionId) => {
      try {
        return await api.get(`/sessions/autosave/${sessionId}/history`);
      } catch {
        // Silent fallback to local storage
        const localSaves = Object.keys(localStorage)
          .filter(key => key.startsWith(`autosave_${sessionId}`))
          .map(key => ({
            id: key,
            ...JSON.parse(localStorage.getItem(key)),
            source: 'local'
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return { data: localSaves };
      }
    }
  },

  // AI service
  ai: {
    generateComponent: (prompt) => api.post('/ai/generate', { prompt }),
    chat: (message, context) => api.post('/ai/chat', { message, context })
  },

  // User management
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    refreshToken: () => api.post('/auth/refresh'),
    getProfile: () => api.get('/auth/profile')
  }
};

export default api;
