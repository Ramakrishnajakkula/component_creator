// Form validation utilities
export const validationRules = {
  required: (message = 'This field is required') => ({ required: message }),
  
  email: (message = 'Please enter a valid email address') => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: message
  }),
  
  minLength: (length, message) => ({
    minLength: length,
    minLengthMessage: message || `Minimum ${length} characters required`
  }),
  
  maxLength: (length, message) => ({
    maxLength: length,
    maxLengthMessage: message || `Maximum ${length} characters allowed`
  }),
  
  pattern: (regex, message = 'Invalid format') => ({
    pattern: regex,
    patternMessage: message
  }),
  
  custom: (validator, message = 'Invalid value') => ({
    custom: validator,
    customMessage: message
  })
};
