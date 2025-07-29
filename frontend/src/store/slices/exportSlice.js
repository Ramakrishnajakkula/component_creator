import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunk for saving export history
export const saveExportHistory = createAsyncThunk(
  'export/saveHistory',
  async ({ sessionId, exportData }, { rejectWithValue }) => {
    try {
      const response = await api.post('/export/history', {
        sessionId,
        ...exportData
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save export history');
    }
  }
);

// Async thunk for loading export history
export const loadExportHistory = createAsyncThunk(
  'export/loadHistory',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/export/history/${sessionId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load export history');
    }
  }
);

const initialState = {
  history: [], // Export history for current session
  isExporting: false,
  isLoading: false,
  error: null,
  lastExport: null,
  exportStats: {
    totalExports: 0,
    formatsUsed: {
      zip: 0,
      clipboard: 0,
      individual: 0
    }
  }
};

const exportSlice = createSlice({
  name: 'export',
  initialState,
  reducers: {
    // Clear export error
    clearError: (state) => {
      state.error = null;
    },
    
    // Set exporting state
    setExporting: (state, action) => {
      state.isExporting = action.payload;
    },
    
    // Add export to local history (for immediate UI feedback)
    addLocalExport: (state, action) => {
      const exportEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      
      state.history.unshift(exportEntry);
      state.lastExport = exportEntry;
      
      // Update stats
      state.exportStats.totalExports += 1;
      if (action.payload.format && state.exportStats.formatsUsed[action.payload.format] !== undefined) {
        state.exportStats.formatsUsed[action.payload.format] += 1;
      }
      
      // Keep only last 50 exports in memory
      if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
      }
    },
    
    // Clear export history
    clearHistory: (state) => {
      state.history = [];
      state.lastExport = null;
      state.exportStats = {
        totalExports: 0,
        formatsUsed: {
          zip: 0,
          clipboard: 0,
          individual: 0
        }
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Save export history
      .addCase(saveExportHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveExportHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the export entry with server response if needed
        const serverExport = action.payload;
        const localIndex = state.history.findIndex(exp => exp.id === action.meta.arg.exportData.id);
        if (localIndex !== -1) {
          state.history[localIndex] = { ...state.history[localIndex], ...serverExport };
        }
      })
      .addCase(saveExportHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Load export history
      .addCase(loadExportHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadExportHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = action.payload.exports || [];
        state.exportStats = action.payload.stats || state.exportStats;
      })
      .addCase(loadExportHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  setExporting, 
  addLocalExport, 
  clearHistory 
} = exportSlice.actions;

// Selectors
export const selectExportHistory = (state) => state.export.history;
export const selectExportLoading = (state) => state.export.isLoading;
export const selectExportError = (state) => state.export.error;
export const selectLastExport = (state) => state.export.lastExport;
export const selectExportStats = (state) => state.export.exportStats;
export const selectIsExporting = (state) => state.export.isExporting;

export default exportSlice.reducer;
