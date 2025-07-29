const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const AutoSave = require('../models/AutoSave');

// Auto-save session data
router.post('/autosave', async (req, res) => {
  try {
    const {
      sessionId,
      code,
      css,
      description,
      isAutoSave,
      trigger,
      messagesCount,
      timestamp
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Create auto-save record
    const autoSave = new AutoSave({
      sessionId,
      code: code || '',
      css: css || '',
      description: description || 'Auto-saved version',
      isAutoSave: isAutoSave !== false,
      trigger: trigger || 'auto',
      messagesCount: messagesCount || 0,
      timestamp: timestamp || new Date().toISOString()
    });

    await autoSave.save();

    // Update session with latest data
    const session = await Session.findOne({ sessionId });
    if (session) {
      session.code = code || session.code;
      session.css = css || session.css;
      session.lastAutoSave = new Date();
      session.messagesCount = messagesCount || session.messagesCount;
      await session.save();
    } else {
      // Create new session if it doesn't exist
      const newSession = new Session({
        sessionId,
        code: code || '',
        css: css || '',
        messages: [],
        lastAutoSave: new Date(),
        messagesCount: messagesCount || 0
      });
      await newSession.save();
    }

    res.json({
      success: true,
      autoSaveId: autoSave._id,
      timestamp: autoSave.timestamp
    });

  } catch (error) {
    console.error('Auto-save error:', error);
    res.status(500).json({
      error: 'Failed to auto-save',
      details: error.message
    });
  }
});

// Get auto-save history for a session
router.get('/autosave/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const autoSaves = await AutoSave.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('description isAutoSave trigger timestamp messagesCount');

    const total = await AutoSave.countDocuments({ sessionId });

    res.json({
      success: true,
      history: autoSaves,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + autoSaves.length < total
      }
    });

  } catch (error) {
    console.error('Get auto-save history error:', error);
    res.status(500).json({
      error: 'Failed to get auto-save history',
      details: error.message
    });
  }
});

// Restore session from auto-save
router.get('/restore/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { autoSaveId } = req.query;

    let sessionData;

    if (autoSaveId) {
      // Restore from specific auto-save
      const autoSave = await AutoSave.findById(autoSaveId);
      if (!autoSave || autoSave.sessionId !== sessionId) {
        return res.status(404).json({ error: 'Auto-save not found' });
      }
      sessionData = autoSave;
    } else {
      // Restore latest session data
      const session = await Session.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      sessionData = session;
    }

    res.json({
      success: true,
      sessionData: {
        sessionId: sessionData.sessionId,
        code: sessionData.code || '',
        css: sessionData.css || '',
        messagesCount: sessionData.messagesCount || 0,
        lastSaved: sessionData.timestamp || sessionData.lastAutoSave,
        restoredFrom: autoSaveId ? 'autosave' : 'session'
      }
    });

  } catch (error) {
    console.error('Session restore error:', error);
    res.status(500).json({
      error: 'Failed to restore session',
      details: error.message
    });
  }
});

// Get auto-save statistics
router.get('/stats/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const stats = await AutoSave.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: null,
          totalSaves: { $sum: 1 },
          autoSaves: { $sum: { $cond: ['$isAutoSave', 1, 0] } },
          manualSaves: { $sum: { $cond: ['$isAutoSave', 0, 1] } },
          triggers: {
            $push: '$trigger'
          },
          firstSave: { $min: '$timestamp' },
          lastSave: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          _id: 0,
          totalSaves: 1,
          autoSaves: 1,
          manualSaves: 1,
          triggerCounts: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ['$triggers'] },
                as: 'trigger',
                in: {
                  k: '$$trigger',
                  v: {
                    $size: {
                      $filter: {
                        input: '$triggers',
                        cond: { $eq: ['$$this', '$$trigger'] }
                      }
                    }
                  }
                }
              }
            }
          },
          firstSave: 1,
          lastSave: 1
        }
      }
    ]);

    const result = stats[0] || {
      totalSaves: 0,
      autoSaves: 0,
      manualSaves: 0,
      triggerCounts: {},
      firstSave: null,
      lastSave: null
    };

    res.json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      details: error.message
    });
  }
});

// Clean up old auto-saves (keep only last 100 per session)
router.delete('/cleanup/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const keepCount = parseInt(req.query.keep) || 100;

    // Get IDs of saves to keep (latest ones)
    const savesToKeep = await AutoSave.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(keepCount)
      .select('_id');

    const idsToKeep = savesToKeep.map(save => save._id);

    // Delete older saves
    const deleteResult = await AutoSave.deleteMany({
      sessionId,
      _id: { $nin: idsToKeep }
    });

    res.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
      remaining: savesToKeep.length
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      error: 'Failed to cleanup auto-saves',
      details: error.message
    });
  }
});

// Bulk restore multiple sessions (for user dashboard)
router.post('/bulk-restore', async (req, res) => {
  try {
    const { sessionIds } = req.body;

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({ error: 'Session IDs array is required' });
    }

    const sessions = await Session.find({
      sessionId: { $in: sessionIds }
    }).select('sessionId code css lastAutoSave messagesCount');

    const sessionMap = {};
    sessions.forEach(session => {
      sessionMap[session.sessionId] = {
        sessionId: session.sessionId,
        code: session.code || '',
        css: session.css || '',
        messagesCount: session.messagesCount || 0,
        lastSaved: session.lastAutoSave
      };
    });

    res.json({
      success: true,
      sessions: sessionMap,
      found: sessions.length,
      requested: sessionIds.length
    });

  } catch (error) {
    console.error('Bulk restore error:', error);
    res.status(500).json({
      error: 'Failed to bulk restore sessions',
      details: error.message
    });
  }
});

module.exports = router;
