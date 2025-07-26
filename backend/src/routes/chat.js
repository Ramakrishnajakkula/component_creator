const express = require('express');
const sessionController = require('../controllers/sessionController');
const { sessionValidation } = require('../utils/validation');
const { authenticateToken, refreshTokenIfNeeded } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all chat routes
router.use(authenticateToken);
router.use(refreshTokenIfNeeded);

// Chat routes (compatibility layer for frontend)
router.get('/sessions/:id/messages', sessionValidation.getById, sessionController.getSessionById);
router.post('/messages', sessionController.addMessageToSession);

module.exports = router;
