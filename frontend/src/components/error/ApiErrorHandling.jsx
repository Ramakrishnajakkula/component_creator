import React, { useState, useEffect } from "react";
import { AccessibleButton } from "../accessibility/KeyboardNavigation";

// API Error Display Component
export const ApiErrorDisplay = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!error) return null;

  const getErrorMessage = (error) => {
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.response?.statusText) return error.response.statusText;
    return "An unexpected error occurred";
  };

  const getErrorCode = (error) => {
    if (error?.response?.status) return error.response.status;
    if (error?.code) return error.code;
    return null;
  };

  const getErrorDetails = (error) => {
    if (error?.response?.data) return error.response.data;
    if (error?.stack) return error.stack;
    return null;
  };

  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);
  const errorDetails = getErrorDetails(error);

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Error {errorCode && `(${errorCode})`}
          </h3>
          <p className="mt-1 text-sm text-red-700">{errorMessage}</p>

          {showDetails && errorDetails && (
            <div className="mt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-red-600 underline hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-expanded={isExpanded}>
                {isExpanded ? "Hide" : "Show"} details
              </button>

              {isExpanded && (
                <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="ml-4 flex-shrink-0 flex space-x-2">
          {onRetry && (
            <AccessibleButton
              onClick={onRetry}
              variant="secondary"
              size="small"
              className="bg-red-100 text-red-700 hover:bg-red-200 border-red-300">
              Retry
            </AccessibleButton>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Dismiss error">
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Network Status Indicator
export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Auto-hide after 3 seconds
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? "bg-green-100 border border-green-200 text-green-800"
          : "bg-red-100 border border-red-200 text-red-800"
      }`}
      role="alert"
      aria-live="polite">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {isOnline ? (
            <svg
              className="h-5 w-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <p className="ml-2 text-sm font-medium">
          {isOnline ? "Back online" : "No internet connection"}
        </p>
      </div>
    </div>
  );
};

// Retry Boundary Component
export const RetryBoundary = ({
  children,
  maxRetries = 3,
  retryDelay = 1000,
  onError,
  fallback,
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) return;

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    try {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      setLastError(null);
      setIsRetrying(false);
    } catch (error) {
      setLastError(error);
      setIsRetrying(false);
      onError?.(error);
    }
  };

  const handleReset = () => {
    setRetryCount(0);
    setLastError(null);
    setIsRetrying(false);
  };

  if (lastError && retryCount >= maxRetries) {
    return (
      fallback || (
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 mb-4">
            We've tried {maxRetries} times but couldn't complete the request.
          </p>
          <AccessibleButton onClick={handleReset} variant="default">
            Start Over
          </AccessibleButton>
        </div>
      )
    );
  }

  if (isRetrying) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-600">
          Retrying... (Attempt {retryCount + 1} of {maxRetries})
        </p>
      </div>
    );
  }

  if (lastError) {
    return (
      <div className="p-6">
        <ApiErrorDisplay
          error={lastError}
          onRetry={handleRetry}
          onDismiss={handleReset}
          showDetails={true}
        />
      </div>
    );
  }

  return children;
};

// Global Error Toast Container
export const ErrorToastContainer = ({ errors = [], onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors.map((error, index) => (
        <div
          key={error.id || index}
          className="bg-red-100 border border-red-200 rounded-lg p-4 shadow-lg animate-in slide-in-from-right duration-300"
          role="alert"
          aria-live="assertive">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">
                {error.title || "Error"}
              </p>
              <p className="mt-1 text-sm text-red-700">
                {error.message || "An error occurred"}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => onDismiss?.(error.id || index)}
                className="text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Dismiss error">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default {
  ApiErrorDisplay,
  NetworkStatus,
  RetryBoundary,
  ErrorToastContainer,
};
