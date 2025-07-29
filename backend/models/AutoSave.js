const mongoose = require('mongoose');

const AutoSaveSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  code: {
    type: String,
    default: ''
  },
  css: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: 'Auto-saved version'
  },
  isAutoSave: {
    type: Boolean,
    default: true
  },
  trigger: {
    type: String,
    enum: ['auto', 'manual', 'chat', 'export', 'preview'],
    default: 'auto'
  },
  messagesCount: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    codeLength: Number,
    cssLength: Number
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
AutoSaveSchema.index({ sessionId: 1, timestamp: -1 });

// Index for cleanup operations
AutoSaveSchema.index({ sessionId: 1, timestamp: 1 });

// Pre-save middleware to calculate metadata
AutoSaveSchema.pre('save', function(next) {
  if (this.code) {
    this.metadata = this.metadata || {};
    this.metadata.codeLength = this.code.length;
  }
  if (this.css) {
    this.metadata = this.metadata || {};
    this.metadata.cssLength = this.css.length;
  }
  next();
});

// Static method to get recent auto-saves
AutoSaveSchema.statics.getRecentSaves = function(sessionId, limit = 10) {
  return this.find({ sessionId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('description isAutoSave trigger timestamp messagesCount');
};

// Static method to cleanup old saves
AutoSaveSchema.statics.cleanupOldSaves = async function(sessionId, keepCount = 100) {
  const savesToKeep = await this.find({ sessionId })
    .sort({ timestamp: -1 })
    .limit(keepCount)
    .select('_id');

  const idsToKeep = savesToKeep.map(save => save._id);
  
  return this.deleteMany({
    sessionId,
    _id: { $nin: idsToKeep }
  });
};

// Static method to get save statistics
AutoSaveSchema.statics.getStats = function(sessionId) {
  return this.aggregate([
    { $match: { sessionId } },
    {
      $group: {
        _id: null,
        totalSaves: { $sum: 1 },
        autoSaves: { $sum: { $cond: ['$isAutoSave', 1, 0] } },
        manualSaves: { $sum: { $cond: ['$isAutoSave', 0, 1] } },
        triggers: { $push: '$trigger' },
        firstSave: { $min: '$timestamp' },
        lastSave: { $max: '$timestamp' },
        avgCodeLength: { $avg: '$metadata.codeLength' },
        avgCssLength: { $avg: '$metadata.cssLength' }
      }
    }
  ]);
};

module.exports = mongoose.model('AutoSave', AutoSaveSchema);
