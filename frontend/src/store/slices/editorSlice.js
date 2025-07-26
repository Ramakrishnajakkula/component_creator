import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Code content
  code: '',
  css: '',
  
  // UI state
  activeTab: 'jsx', // 'jsx', 'css', 'preview'
  previewMode: 'desktop', // 'desktop', 'tablet', 'mobile'
  isDarkMode: false,
  isFullscreen: false,
  
  // Editor settings
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  showLineNumbers: true,
  theme: 'light', // 'light', 'dark'
  
  // Preview settings
  previewScale: 1,
  showGrid: false,
  showRuler: false,
  
  // Error handling
  jsxErrors: [],
  cssErrors: [],
  
  // History for undo/redo
  history: {
    jsx: [],
    css: [],
    currentIndex: {
      jsx: -1,
      css: -1
    }
  },
  
  // Auto-save
  lastSaved: null,
  hasUnsavedChanges: false,
  
  // Export settings
  exportFormat: 'jsx', // 'jsx', 'tsx', 'vue', 'angular'
  includeStyles: true,
  includeDependencies: true
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    // Code updates
    setEditorCode: (state, action) => {
      state.code = action.payload;
      state.hasUnsavedChanges = true;
      // Add to history
      if (state.history.jsx[state.history.jsx.length - 1] !== action.payload) {
        state.history.jsx.push(action.payload);
        state.history.currentIndex.jsx = state.history.jsx.length - 1;
        // Limit history to 50 entries
        if (state.history.jsx.length > 50) {
          state.history.jsx.shift();
          state.history.currentIndex.jsx--;
        }
      }
    },
    
    setEditorCSS: (state, action) => {
      state.css = action.payload;
      state.hasUnsavedChanges = true;
      // Add to history
      if (state.history.css[state.history.css.length - 1] !== action.payload) {
        state.history.css.push(action.payload);
        state.history.currentIndex.css = state.history.css.length - 1;
        // Limit history to 50 entries
        if (state.history.css.length > 50) {
          state.history.css.shift();
          state.history.currentIndex.css--;
        }
      }
    },
    
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    setCode: (state, action) => {
      const { jsx, css } = action.payload;
      if (jsx !== undefined) {
        state.code = jsx;
      }
      if (css !== undefined) {
        state.css = css;
      }
      state.hasUnsavedChanges = true;
    },
    
    // UI state
    setPreviewMode: (state, action) => {
      state.previewMode = action.payload;
    },
    
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      state.theme = state.isDarkMode ? 'dark' : 'light';
    },
    
    setTheme: (state, action) => {
      state.theme = action.payload;
      state.isDarkMode = action.payload === 'dark';
    },
    
    toggleFullscreen: (state) => {
      state.isFullscreen = !state.isFullscreen;
    },
    
    // Editor settings
    setFontSize: (state, action) => {
      state.fontSize = Math.max(10, Math.min(24, action.payload));
    },
    
    setTabSize: (state, action) => {
      state.tabSize = Math.max(2, Math.min(8, action.payload));
    },
    
    toggleWordWrap: (state) => {
      state.wordWrap = !state.wordWrap;
    },
    
    toggleLineNumbers: (state) => {
      state.showLineNumbers = !state.showLineNumbers;
    },
    
    // Preview settings
    setPreviewScale: (state, action) => {
      state.previewScale = Math.max(0.25, Math.min(2, action.payload));
    },
    
    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },
    
    toggleRuler: (state) => {
      state.showRuler = !state.showRuler;
    },
    
    // Error handling
    setJsxErrors: (state, action) => {
      state.jsxErrors = action.payload;
    },
    
    setCssErrors: (state, action) => {
      state.cssErrors = action.payload;
    },
    
    clearErrors: (state) => {
      state.jsxErrors = [];
      state.cssErrors = [];
    },
    
    // History/Undo-Redo
    undoJsx: (state) => {
      if (state.history.currentIndex.jsx > 0) {
        state.history.currentIndex.jsx--;
        state.jsxCode = state.history.jsx[state.history.currentIndex.jsx];
      }
    },
    
    redoJsx: (state) => {
      if (state.history.currentIndex.jsx < state.history.jsx.length - 1) {
        state.history.currentIndex.jsx++;
        state.jsxCode = state.history.jsx[state.history.currentIndex.jsx];
      }
    },
    
    undoCss: (state) => {
      if (state.history.currentIndex.css > 0) {
        state.history.currentIndex.css--;
        state.cssCode = state.history.css[state.history.currentIndex.css];
      }
    },
    
    redoCss: (state) => {
      if (state.history.currentIndex.css < state.history.css.length - 1) {
        state.history.currentIndex.css++;
        state.cssCode = state.history.css[state.history.currentIndex.css];
      }
    },
    
    // Save state
    markAsSaved: (state) => {
      state.hasUnsavedChanges = false;
      state.lastSaved = new Date().toISOString();
    },
    
    // Export settings
    setExportFormat: (state, action) => {
      state.exportFormat = action.payload;
    },
    
    toggleIncludeStyles: (state) => {
      state.includeStyles = !state.includeStyles;
    },
    
    toggleIncludeDependencies: (state) => {
      state.includeDependencies = !state.includeDependencies;
    },
    
    // Reset editor
    resetEditor: (state) => {
      state.jsxCode = '';
      state.cssCode = '';
      state.jsxErrors = [];
      state.cssErrors = [];
      state.hasUnsavedChanges = false;
      state.activeTab = 'jsx';
      state.history = {
        jsx: [],
        css: [],
        currentIndex: { jsx: -1, css: -1 }
      };
    }
  }
});

export const {
  setEditorCode,
  setEditorCSS,
  setActiveTab,
  setCode,
  setPreviewMode,
  toggleDarkMode,
  setTheme,
  toggleFullscreen,
  setFontSize,
  setTabSize,
  toggleWordWrap,
  toggleLineNumbers,
  setPreviewScale,
  toggleGrid,
  toggleRuler,
  setJsxErrors,
  setCssErrors,
  clearErrors,
  undoJsx,
  redoJsx,
  undoCss,
  redoCss,
  markAsSaved,
  setExportFormat,
  toggleIncludeStyles,
  toggleIncludeDependencies,
  resetEditor
} = editorSlice.actions;

export default editorSlice.reducer;
