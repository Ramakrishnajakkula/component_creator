const express = require('express');
const aiController = require('../controllers/aiController');
const { aiValidation } = require('../utils/validation');
const { authenticateToken, refreshTokenIfNeeded } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication to all AI routes
router.use(authenticateToken);
router.use(refreshTokenIfNeeded);

// AI component generation routes
router.post('/generate', aiLimiter, aiValidation.generateComponent, aiController.generateComponent);
router.post('/refine', aiLimiter, aiValidation.refineComponent, aiController.refineComponent);

// AI chat routes
router.post('/chat', aiLimiter, aiController.chatWithAI);

// AI utility routes
router.get('/models', aiController.getModels);
router.get('/usage', aiController.getUsageStats);

module.exports = router;
