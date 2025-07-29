import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError() {
    // Update state to show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    // Report error to monitoring service (if available)
    if (window.gtag) {
      window.gtag("event", "exception", {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  copyErrorToClipboard = () => {
    const errorText = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.toString()}
Component Stack: ${this.state.errorInfo?.componentStack}
Error Stack: ${this.state.error?.stack}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard
      .writeText(errorText)
      .then(() => {
        alert("Error details copied to clipboard");
      })
      .catch(() => {
        // Silent clipboard failure
      });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Something went wrong
                </h2>
                <p className="text-sm text-gray-600">
                  Error ID: {this.state.errorId}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                We encountered an unexpected error. You can try one of the
                following options:
              </p>

              {import.meta.env.DEV && (
                <details className="mb-4 p-3 bg-gray-100 rounded">
                  <summary className="cursor-pointer text-sm font-medium text-gray-800">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                    <strong>Error:</strong> {this.state.error?.toString()}
                    <br />
                    <strong>Stack:</strong> {this.state.error?.stack}
                  </div>
                </details>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Try again">
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Reload page">
                Reload Page
              </button>

              <button
                onClick={this.copyErrorToClipboard}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Copy error details">
                Copy Error Details
              </button>

              <a
                href="/"
                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label="Go to homepage">
                Go to Homepage
              </a>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                If this problem persists, please contact support with the Error
                ID above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
