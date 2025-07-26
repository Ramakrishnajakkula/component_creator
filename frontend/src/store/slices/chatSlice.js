import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { generateMessageId } from '../../utils/messageUtils';

// Async thunks for chat/AI operations
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ sessionId, content, type = 'user', metadata }, { rejectWithValue }) => {
    try {
      if (!sessionId || sessionId === 'undefined') {
        return rejectWithValue('Invalid session ID provided');
      }
      
      const messageId = generateMessageId();
      const timestamp = new Date().toISOString();
      
      const message = {
        id: messageId,
        sessionId,
        content,
        type,
        metadata,
        timestamp,
        status: 'sent'
      };

      // For user messages, save to backend
      if (type === 'user') {
        const response = await api.post('/chat/messages', message);
        return response.data.data;
      }
      
      return message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const generateComponent = createAsyncThunk(
  'chat/generateComponent',
  async ({ sessionId, prompt }, { rejectWithValue, dispatch }) => {
    try {
      console.log('generateComponent called with:', { sessionId, prompt: prompt.substring(0, 50) });
      
      if (!sessionId || sessionId === 'undefined') {
        console.error('Invalid sessionId in generateComponent:', sessionId);
        return rejectWithValue('Invalid session ID provided');
      }
      
      // First send the AI thinking message
      dispatch(addMessage({
        id: generateMessageId(),
        sessionId,
        content: 'Analyzing your request and generating component...',
        type: 'assistant',
        timestamp: new Date().toISOString(),
        status: 'thinking'
      }));

      const requestData = {
        sessionId,
        prompt,
        model: 'gpt-4o-mini' // Default model
      };
      
      console.log('Sending JSON data:', requestData);

      const response = await api.post('/ai/generate', requestData);
      
      return response.data.data;
    } catch (error) {
      console.error('generateComponent error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to generate component');
    }
  }
);

export const retryMessage = createAsyncThunk(
  'chat/retryMessage',
  async ({ sessionId, messageId }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const originalMessage = state.chat.messages.find(m => m.id === messageId);
      
      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      // Retry the generation with the original prompt
      const response = await api.post('/ai/retry', {
        sessionId,
        messageId,
        prompt: originalMessage.content
      });
      
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to retry message');
    }
  }
);

export const loadChatHistory = createAsyncThunk(
  'chat/loadHistory',
  async (sessionId, { rejectWithValue }) => {
    try {
      if (!sessionId || sessionId === 'undefined') {
        return rejectWithValue('Invalid session ID provided');
      }
      const response = await api.get(`/chat/sessions/${sessionId}/messages`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load chat history');
    }
  }
);

const initialState = {
  messages: [],
  isLoading: false,
  isGenerating: false,
  error: null,
  currentModel: 'gpt-4o-mini',
  availableModels: [
    'gpt-4o-mini',
    'llama-3.1-sonar-small-128k-online',
    'gemini-1.5-flash'
  ]
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setCurrentModel: (state, action) => {
      state.currentModel = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    updateLastMessage: (state, action) => {
      if (state.messages.length > 0) {
        const lastIndex = state.messages.length - 1;
        state.messages[lastIndex] = { ...state.messages[lastIndex], ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        // Only add the message if it's not already in the array
        const existingMessage = state.messages.find(m => m.id === action.payload.id);
        if (!existingMessage) {
          state.messages.push(action.payload);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Generate component
      .addCase(generateComponent.pending, (state) => {
        state.isGenerating = true;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateComponent.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.isLoading = false;
        
        // Remove any thinking messages
        state.messages = state.messages.filter(m => m.status !== 'thinking');
        
        // Add AI response message with generated component
        const aiMessage = {
          id: generateMessageId(),
          type: 'assistant',
          content: action.payload.explanation || 'Component generated successfully!',
          timestamp: new Date().toISOString(),
          code: action.payload.code,
          css: action.payload.component?.css || '',
          component: action.payload.component,
          metadata: {
            componentGenerated: true,
            processingTime: action.payload.processingTime,
            model: action.payload.model
          }
        };
        
        state.messages.push(aiMessage);
      })
      .addCase(generateComponent.rejected, (state, action) => {
        state.isGenerating = false;
        state.isLoading = false;
        state.error = action.payload;
        
        // Remove any thinking messages
        state.messages = state.messages.filter(m => m.status !== 'thinking');
        
        // Add error message
        const errorMessage = {
          id: generateMessageId(),
          type: 'assistant',
          content: `I apologize, but I encountered an error while generating your component: ${action.payload}`,
          timestamp: new Date().toISOString(),
          status: 'error'
        };
        
        state.messages.push(errorMessage);
      })
      // Retry message
      .addCase(retryMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(retryMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        // Replace the failed message with the new response
        const messageIndex = state.messages.findIndex(m => m.id === action.payload.originalMessageId);
        if (messageIndex !== -1) {
          state.messages[messageIndex] = {
            ...action.payload,
            timestamp: new Date().toISOString()
          };
        }
      })
      .addCase(retryMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Load chat history
      .addCase(loadChatHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadChatHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        // Extract chatHistory from session object, fallback to empty array
        const session = action.payload.session || action.payload;
        state.messages = session.chatHistory || [];
      })
      .addCase(loadChatHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  addMessage, 
  clearMessages, 
  setCurrentModel, 
  setMessages,
  updateLastMessage 
} = chatSlice.actions;

// Selectors
export const selectChatMessages = (state) => state.chat.messages;
export const selectChatLoading = (state) => state.chat.isLoading;
export const selectChatGenerating = (state) => state.chat.isGenerating;
export const selectChatError = (state) => state.chat.error;
export const selectCurrentModel = (state) => state.chat.currentModel;
export const selectAvailableModels = (state) => state.chat.availableModels;

export default chatSlice.reducer;
