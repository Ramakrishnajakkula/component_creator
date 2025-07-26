const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
    handleValidationErrors
  ]
};

// Session validation rules
const sessionValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Session name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    handleValidationErrors
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid session ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Session name must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    handleValidationErrors
  ],

  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid session ID'),
    handleValidationErrors
  ],

  delete: [
    param('id')
      .isMongoId()
      .withMessage('Invalid session ID'),
    handleValidationErrors
  ]
};

// Chat validation rules
const chatValidation = {
  sendMessage: [
    body('sessionId')
      .isMongoId()
      .withMessage('Invalid session ID'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message must be between 1 and 5000 characters'),
    body('type')
      .optional()
      .isIn(['user', 'ai'])
      .withMessage('Type must be either user or ai'),
    handleValidationErrors
  ]
};

// AI validation rules
const aiValidation = {
  generateComponent: [
    body('prompt')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Prompt must be between 10 and 2000 characters'),
    body('sessionId')
      .isMongoId()
      .withMessage('Invalid session ID'),
    body('model')
      .optional()
      .isString()
      .withMessage('Model must be a string'),
    handleValidationErrors
  ],

  refineComponent: [
    body('prompt')
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Refinement prompt must be between 5 and 1000 characters'),
    body('sessionId')
      .isMongoId()
      .withMessage('Invalid session ID'),
    body('currentCode')
      .optional()
      .isObject()
      .withMessage('Current code must be an object'),
    handleValidationErrors
  ]
};

// Query validation rules
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sort')
      .optional()
      .isString()
      .withMessage('Sort must be a string'),
    handleValidationErrors
  ]
};

module.exports = {
  userValidation,
  sessionValidation,
  chatValidation,
  aiValidation,
  queryValidation,
  handleValidationErrors
};
