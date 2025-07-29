import { useState, useEffect } from 'react';
import { useDebounce } from './usePerformance';

// Form validation hook
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  const debouncedValues = useDebounce(values, 300);

  useEffect(() => {
    const newErrors = {};
    let hasErrors = false;

    Object.keys(validationRules).forEach(field => {
      const rule = validationRules[field];
      const value = debouncedValues[field];

      if (rule.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = rule.required === true ? 'This field is required' : rule.required;
        hasErrors = true;
      } else if (value && rule.pattern && !rule.pattern.test(value)) {
        newErrors[field] = rule.patternMessage || 'Invalid format';
        hasErrors = true;
      } else if (value && rule.minLength && value.length < rule.minLength) {
        newErrors[field] = `Minimum ${rule.minLength} characters required`;
        hasErrors = true;
      } else if (value && rule.maxLength && value.length > rule.maxLength) {
        newErrors[field] = `Maximum ${rule.maxLength} characters allowed`;
        hasErrors = true;
      } else if (rule.custom && !rule.custom(value, debouncedValues)) {
        newErrors[field] = rule.customMessage || 'Invalid value';
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setIsValid(!hasErrors);
  }, [debouncedValues, validationRules]);

  const setValue = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const setFieldTouched = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
  };

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setFieldTouched,
    reset
  };
};
