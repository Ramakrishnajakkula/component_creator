const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    model: String,
    tokens: Number,
    processingTime: Number,
    hasImage: Boolean,
    imageUrl: String,
    error: String
  },
  // Component code fields for AI messages
  code: {
    type: String,
    default: ''
  },
  css: {
    type: String,
    default: ''
  },
  componentCode: {
    jsx: {
      type: String,
      default: ''
    },
    css: {
      type: String,
      default: ''
    },
    dependencies: [{
      type: String
    }]
  }
});

const componentCodeSchema = new mongoose.Schema({
  jsx: {
    type: String,
    default: ''
  },
  css: {
    type: String,
    default: ''
  },
  dependencies: [{
    type: String
  }],
  version: {
    type: Number,
    default: 1
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

const uiStateSchema = new mongoose.Schema({
  selectedElement: {
    type: String,
    default: null
  },
  editorTab: {
    type: String,
    enum: ['jsx', 'css'],
    default: 'jsx'
  },
  propertyPanel: {
    isOpen: {
      type: Boolean,
      default: false
    },
    elementId: String,
    properties: mongoose.Schema.Types.Mixed
  },
  viewport: {
    width: {
      type: Number,
      default: 800
    },
    height: {
      type: Number,
      default: 600
    }
  }
});

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Session name is required'],
    trim: true,
    maxlength: [100, 'Session name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  chatHistory: [messageSchema],
  componentCode: {
    type: componentCodeSchema,
    default: () => ({})
  },
  uiState: {
    type: uiStateSchema,
    default: () => ({})
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    componentVersions: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, lastAccessedAt: -1 });
sessionSchema.index({ 'chatHistory.timestamp': -1 });

// Pre-save middleware to update stats
sessionSchema.pre('save', function(next) {
  if (this.isModified('chatHistory')) {
    this.stats.totalMessages = this.chatHistory.length;
    this.stats.totalTokens = this.chatHistory.reduce((total, msg) => {
      return total + (msg.metadata?.tokens || 0);
    }, 0);
  }
  
  if (this.isModified('componentCode')) {
    this.stats.componentVersions = this.componentCode.version || 0;
  }
  
  this.lastAccessedAt = new Date();
  next();
});

// Instance methods
sessionSchema.methods.addMessage = function(messageData) {
  const message = {
    id: messageData.id || new mongoose.Types.ObjectId().toString(),
    type: messageData.type,
    content: messageData.content,
    timestamp: new Date(),
    metadata: messageData.metadata || {}
  };
  
  this.chatHistory.push(message);
  return this.save();
};

sessionSchema.methods.updateComponentCode = function(codeData) {
  if (!this.componentCode) {
    this.componentCode = {};
  }
  
  this.componentCode.jsx = codeData.jsx || this.componentCode.jsx || '';
  this.componentCode.css = codeData.css || this.componentCode.css || '';
  this.componentCode.dependencies = codeData.dependencies || this.componentCode.dependencies || [];
  this.componentCode.version = (this.componentCode.version || 0) + 1;
  this.componentCode.lastModified = new Date();
  
  return this.save();
};

sessionSchema.methods.updateUIState = function(uiStateData) {
  this.uiState = { ...this.uiState.toObject(), ...uiStateData };
  return this.save();
};

// Static methods
sessionSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  let dbQuery = this.find(query);
  
  if (options.limit) {
    dbQuery = dbQuery.limit(options.limit);
  }
  
  if (options.sort) {
    dbQuery = dbQuery.sort(options.sort);
  } else {
    dbQuery = dbQuery.sort({ lastAccessedAt: -1 });
  }
  
  if (options.select) {
    dbQuery = dbQuery.select(options.select);
  }
  
  return dbQuery;
};

sessionSchema.statics.findActiveSession = function(userId) {
  return this.findOne({ 
    userId, 
    isActive: true 
  }).sort({ lastAccessedAt: -1 });
};

// Virtual for message count
sessionSchema.virtual('messageCount').get(function() {
  return this.chatHistory ? this.chatHistory.length : 0;
});

// Virtual for last message
sessionSchema.virtual('lastMessage').get(function() {
  return this.chatHistory && this.chatHistory.length > 0 
    ? this.chatHistory[this.chatHistory.length - 1] 
    : null;
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
