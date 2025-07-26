import { createSlice } from '@reduxjs/toolkit';

// Initial state for version history
const initialState = {
  history: [], // Array of version objects
  currentVersion: 0,
  maxVersions: 50, // Limit to prevent memory issues
  canUndo: false,
  canRedo: false
};

const versionHistorySlice = createSlice({
  name: 'versionHistory',
  initialState,
  reducers: {
    // Add a new version to history
    addVersion: (state, action) => {
      const { code, css, timestamp, description, sessionId } = action.payload;
      
      // Create new version object
      const newVersion = {
        id: Date.now(),
        code,
        css: css || '',
        timestamp: timestamp || new Date().toISOString(),
        description: description || 'Code update',
        sessionId
      };

      // Remove any versions after current position (if we're not at the latest)
      if (state.currentVersion < state.history.length - 1) {
        state.history = state.history.slice(0, state.currentVersion + 1);
      }

      // Add new version
      state.history.push(newVersion);

      // Limit history size
      if (state.history.length > state.maxVersions) {
        state.history.shift();
        state.currentVersion = Math.max(0, state.currentVersion - 1);
      } else {
        state.currentVersion = state.history.length - 1;
      }

      // Update undo/redo state
      state.canUndo = state.history.length > 1;
      state.canRedo = false;
    },

    // Undo to previous version
    undo: (state) => {
      if (state.canUndo && state.currentVersion > 0) {
        state.currentVersion -= 1;
        state.canRedo = true;
        state.canUndo = state.currentVersion > 0;
      }
    },

    // Redo to next version
    redo: (state) => {
      if (state.canRedo && state.currentVersion < state.history.length - 1) {
        state.currentVersion += 1;
        state.canUndo = true;
        state.canRedo = state.currentVersion < state.history.length - 1;
      }
    },

    // Jump to specific version
    goToVersion: (state, action) => {
      const versionIndex = action.payload;
      if (versionIndex >= 0 && versionIndex < state.history.length) {
        state.currentVersion = versionIndex;
        state.canUndo = versionIndex > 0;
        state.canRedo = versionIndex < state.history.length - 1;
      }
    },

    // Clear history for a session
    clearHistory: (state, action) => {
      const sessionId = action.payload;
      if (sessionId) {
        // Remove versions for specific session
        state.history = state.history.filter(version => version.sessionId !== sessionId);
      } else {
        // Clear all history
        state.history = [];
      }
      state.currentVersion = 0;
      state.canUndo = false;
      state.canRedo = false;
    },

    // Update version description
    updateVersionDescription: (state, action) => {
      const { versionIndex, description } = action.payload;
      if (state.history[versionIndex]) {
        state.history[versionIndex].description = description;
      }
    },

    // Set max versions limit
    setMaxVersions: (state, action) => {
      state.maxVersions = Math.max(10, action.payload);
      
      // Trim history if it exceeds new limit
      if (state.history.length > state.maxVersions) {
        const trimAmount = state.history.length - state.maxVersions;
        state.history.splice(0, trimAmount);
        state.currentVersion = Math.max(0, state.currentVersion - trimAmount);
        state.canUndo = state.currentVersion > 0;
      }
    }
  }
});

export const {
  addVersion,
  undo,
  redo,
  goToVersion,
  clearHistory,
  updateVersionDescription,
  setMaxVersions
} = versionHistorySlice.actions;

// Selectors
export const getCurrentVersion = (state) => {
  const history = state.versionHistory;
  return history.history[history.currentVersion] || null;
};

export const getVersionHistory = (state) => state.versionHistory.history;

export const getUndoRedoState = (state) => ({
  canUndo: state.versionHistory.canUndo,
  canRedo: state.versionHistory.canRedo,
  currentVersion: state.versionHistory.currentVersion,
  totalVersions: state.versionHistory.history.length
});

export const getVersionsForSession = (state, sessionId) => {
  return state.versionHistory.history.filter(version => version.sessionId === sessionId);
};

export default versionHistorySlice.reducer;
