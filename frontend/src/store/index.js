import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import sessionSlice from './slices/sessionSlice';
import chatSlice from './slices/chatSlice';
import editorSlice from './slices/editorSlice';
import versionHistorySlice from './slices/versionHistorySlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    sessions: sessionSlice,
    chat: chatSlice,
    editor: editorSlice,
    versionHistory: versionHistorySlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
});
