import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks for session operations
export const fetchSessions = createAsyncThunk(
  'sessions/fetchSessions',
  async ({ page = 1, limit = 10, status = 'active' } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/sessions?page=${page}&limit=${limit}&status=${status}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sessions');
    }
  }
);

export const createSession = createAsyncThunk(
  'sessions/createSession',
  async ({ name, description, metadata }, { rejectWithValue }) => {
    try {
      const response = await api.post('/sessions', { name, description, metadata });
      return response.data.data.session;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create session');
    }
  }
);

export const fetchSessionById = createAsyncThunk(
  'sessions/fetchSessionById',
  async (sessionId, { rejectWithValue }) => {
    try {
      if (!sessionId || sessionId === 'undefined') {
        return rejectWithValue('Invalid session ID provided');
      }
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data.data.session;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch session');
    }
  }
);

export const updateSession = createAsyncThunk(
  'sessions/updateSession',
  async ({ sessionId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/sessions/${sessionId}`, updates);
      return response.data.data.session;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update session');
    }
  }
);

export const deleteSession = createAsyncThunk(
  'sessions/deleteSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      return sessionId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete session');
    }
  }
);

const initialState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload;
    },
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
    updateCurrentSessionCode: (state, action) => {
      if (state.currentSession) {
        state.currentSession.componentCode = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions
      .addCase(fetchSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload.sessions || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create session
      .addCase(createSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions.unshift(action.payload);
        state.currentSession = action.payload;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch session by ID
      .addCase(fetchSessionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload;
      })
      .addCase(fetchSessionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update session
      .addCase(updateSession.fulfilled, (state, action) => {
        const index = state.sessions.findIndex(session => session.id === action.payload.id);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        if (state.currentSession && state.currentSession.id === action.payload.id) {
          state.currentSession = action.payload;
        }
      })
      // Delete session
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter(session => session.id !== action.payload);
        if (state.currentSession && state.currentSession.id === action.payload) {
          state.currentSession = null;
        }
      });
  }
});

export const { 
  clearError, 
  setCurrentSession, 
  clearCurrentSession, 
  updateCurrentSessionCode 
} = sessionSlice.actions;

// Selectors
export const getCurrentSession = (state) => state.sessions.currentSession;
export const getSessionsLoading = (state) => state.sessions.isLoading;
export const getSessionsError = (state) => state.sessions.error;
export const getAllSessions = (state) => state.sessions.sessions;
export const getSessionsPagination = (state) => state.sessions.pagination;

export default sessionSlice.reducer;
