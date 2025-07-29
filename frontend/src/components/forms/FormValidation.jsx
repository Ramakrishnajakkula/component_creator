import React, { useState, useRef } from "react";
import { useFormValidation } from "../../hooks/useFormValidation";
import { validationRules } from "../../utils/validationUtils";

// Validated Input Component
export const ValidatedInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  className = "",
  helpText,
  disabled = false,
  ...props
}) => {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  const hasError = touched && error;
  const showError = hasError && !focused;

  const inputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${hasError ? "border-red-500 bg-red-50" : "border-gray-300"}
    ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
    ${className}
  `.trim();

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${name}-error` : helpText ? `${name}-help` : undefined
          }
          {...props}
        />

        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {showError && (
        <p
          id={`${name}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert">
          {error}
        </p>
      )}

      {helpText && !showError && (
        <p id={`${name}-help`} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Validated Textarea Component
export const ValidatedTextarea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  rows = 4,
  className = "",
  helpText,
  disabled = false,
  maxLength,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const hasError = touched && error;
  const showError = hasError && !focused;
  const remainingChars = maxLength ? maxLength - (value?.length || 0) : null;

  const textareaClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    resize-vertical
    ${hasError ? "border-red-500 bg-red-50" : "border-gray-300"}
    ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
    ${className}
  `.trim();

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        className={textareaClasses}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${name}-error` : helpText ? `${name}-help` : undefined
        }
        {...props}
      />

      <div className="flex justify-between items-start mt-1">
        <div className="flex-1">
          {showError && (
            <p
              id={`${name}-error`}
              className="text-sm text-red-600"
              role="alert">
              {error}
            </p>
          )}

          {helpText && !showError && (
            <p id={`${name}-help`} className="text-sm text-gray-500">
              {helpText}
            </p>
          )}
        </div>

        {maxLength && (
          <p
            className={`text-xs ml-2 ${
              remainingChars < 0 ? "text-red-500" : "text-gray-400"
            }`}>
            {remainingChars < 0
              ? Math.abs(remainingChars) + " over"
              : remainingChars + " left"}
          </p>
        )}
      </div>
    </div>
  );
};

// Validated Select Component
export const ValidatedSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  options = [],
  className = "",
  helpText,
  disabled = false,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const hasError = touched && error;
  const showError = hasError && !focused;

  const selectClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${hasError ? "border-red-500 bg-red-50" : "border-gray-300"}
    ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
    ${className}
  `.trim();

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onFocus={() => setFocused(true)}
        disabled={disabled}
        className={selectClasses}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${name}-error` : helpText ? `${name}-help` : undefined
        }
        {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      {showError && (
        <p
          id={`${name}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert">
          {error}
        </p>
      )}

      {helpText && !showError && (
        <p id={`${name}-help`} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default {
  useFormValidation,
  ValidatedInput,
  ValidatedTextarea,
  ValidatedSelect,
  validationRules,
};
