const express = require('express');
const sessionController = require('../controllers/sessionController');
const { sessionValidation, queryValidation } = require('../utils/validation');
const { authenticateToken, refreshTokenIfNeeded } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all session routes
router.use(authenticateToken);
router.use(refreshTokenIfNeeded);

// Session CRUD routes
router.get('/', queryValidation.pagination, sessionController.getSessions);
router.get('/active', sessionController.getActiveSession);
router.get('/:id', sessionValidation.getById, sessionController.getSessionById);
router.post('/', sessionValidation.create, sessionController.createSession);
router.put('/:id', sessionValidation.update, sessionController.updateSession);
router.delete('/:id', sessionValidation.delete, sessionController.deleteSession);

// Session operations
router.post('/:id/duplicate', sessionValidation.getById, sessionController.duplicateSession);
router.post('/:id/auto-save', sessionValidation.getById, sessionController.autoSave);

// Chat messages route (for compatibility with frontend)
router.get('/:id/messages', sessionValidation.getById, sessionController.getSessionById);

module.exports = router;
