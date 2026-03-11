const { body, validationResult } = require('express-validator');

// Validation rules for analysis endpoint
const analysisValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email address is too long')
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

// Sanitize file data
const sanitizeFileData = (data) => {
  if (typeof data !== 'string') return data;
  
  // Remove potential XSS payloads
  return data
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
    .trim();
};

module.exports = {
  analysisValidation,
  handleValidationErrors,
  sanitizeFileData
};
