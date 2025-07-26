const express = require('express');
const authController = require('../controllers/authController');
const { userValidation } = require('../utils/validation');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', authLimiter, userValidation.register, authController.register);
router.post('/login', authLimiter, userValidation.login, authController.login);
router.post('/refresh-token', userValidation.refreshToken, authController.refreshToken);

// Protected routes (authentication required)
router.use(authenticateToken); // Apply authentication to all routes below

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.delete('/account', authController.deleteAccount);

module.exports = router;
