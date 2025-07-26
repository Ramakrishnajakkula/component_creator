import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";

const ComponentPreview = ({ code, css, onError, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef(null);
  const { currentSession } = useSelector((state) => state.sessions);

  // Refresh iframe when code changes
  useEffect(() => {
    if (code) {
      setIframeKey((prev) => prev + 1);
      setIsLoading(true);
      setError(null);
    }
  }, [code, css]);

  const createPreviewHTML = () => {
    // Clean up the code by removing import statements and fixing common issues
    let cleanCode = code
      ? code
          // Remove import statements
          .replace(/^import.*?;$/gm, "")
          // Remove export statements but keep the component name
          .replace(/^export\s+default\s+/gm, "")
          // Clean up extra whitespace
          .replace(/^\s*[\r\n]/gm, "")
          .trim()
      : "const DefaultComponent = () => <div>No component code provided</div>;";

    // Extract component name from the code
    const componentMatch = cleanCode.match(
      /(?:const|function)\s+([A-Za-z][A-Za-z0-9]*)\s*[=(]/
    );
    const componentName = componentMatch
      ? componentMatch[1]
      : "DefaultComponent";

    // If no component is found, wrap the code in a default component
    if (
      !componentMatch &&
      cleanCode &&
      !cleanCode.includes("const") &&
      !cleanCode.includes("function")
    ) {
      cleanCode = `const DefaultComponent = () => { return (${cleanCode}); };`;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #f9fafb;
        }
        
        .preview-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .error-container {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 16px;
            color: #b91c1c;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
            white-space: pre-wrap;
        }
        
        .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            color: #6b7280;
        }
        
        /* Custom CSS from props */
        ${css || ""}
    </style>
</head>
<body>
    <div id="root">
        <div class="loading-container">
            <div>Loading component...</div>
        </div>
    </div>
    
    <script type="text/babel">
        const { useState, useEffect, useRef } = React;
        
        // Error boundary component
        class ErrorBoundary extends React.Component {
            constructor(props) {
                super(props);
                this.state = { hasError: false, error: null };
            }
            
            static getDerivedStateFromError(error) {
                return { hasError: true, error };
            }
            
            componentDidCatch(error, errorInfo) {
                console.error('Component Error:', error, errorInfo);
                window.parent.postMessage({
                    type: 'preview-error',
                    error: error.message + '\\n' + error.stack
                }, '*');
            }
            
            render() {
                if (this.state.hasError) {
                    return (
                        <div className="error-container">
                            <strong>Component Error:</strong>\\n{this.state.error?.message}
                        </div>
                    );
                }
                
                return this.props.children;
            }
        }
        
        // Wrap the user component in error boundary
        function SafePreview() {
            try {
                // User's component code will be injected here
                ${cleanCode}
                
                // Dynamically get the component to render
                const ComponentToRender = ${componentName};
                
                // Ensure the component is a valid React component
                if (typeof ComponentToRender !== 'function') {
                    throw new Error('Generated code does not export a valid React component');
                }
                
                return (
                    <ErrorBoundary>
                        <div className="preview-container">
                            <ComponentToRender />
                        </div>
                    </ErrorBoundary>
                );
            } catch (error) {
                console.error('Compilation Error:', error);
                window.parent.postMessage({
                    type: 'preview-error',
                    error: 'Compilation Error: ' + error.message
                }, '*');
                
                return (
                    <div className="error-container">
                        <strong>Compilation Error:</strong>\\n{error.message}
                    </div>
                );
            }
        }
        
        // Render the component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<SafePreview />);
        
        // Notify parent that component loaded successfully
        setTimeout(() => {
            window.parent.postMessage({
                type: 'preview-loaded'
            }, '*');
        }, 100);
    </script>
</body>
</html>`;
  };

  const handleIframeLoad = () => {
    setIsLoading(false);

    // Set up message listener for iframe communication
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      switch (event.data.type) {
        case "preview-loaded":
          setError(null);
          onSuccess?.();
          break;

        case "preview-error": {
          const errorMsg = event.data.error;
          setError(errorMsg);
          onError?.(errorMsg);
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  };

  const refreshPreview = () => {
    setIframeKey((prev) => prev + 1);
    setIsLoading(true);
    setError(null);
  };

  const openInNewTab = () => {
    const newWindow = window.open("", "_blank");
    newWindow.document.write(createPreviewHTML());
    newWindow.document.close();
  };

  const getIframeSrc = () => {
    const html = createPreviewHTML();
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-3 bg-gray-700 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-100">
            Component Preview
          </h3>
          {currentSession?.title && (
            <span className="text-xs text-gray-400">
              • {currentSession.title}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <button
            onClick={refreshPreview}
            disabled={isLoading}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            title="Refresh preview">
            <svg
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Open in New Tab */}
          <button
            onClick={openInNewTab}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Open in new tab">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative bg-gray-900">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-gray-300">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Loading preview...</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute inset-0 p-4 bg-red-50 border border-red-200 overflow-auto">
            <div className="text-sm text-red-800">
              <div className="font-medium mb-2">Preview Error:</div>
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {error}
              </pre>
            </div>
            <button
              onClick={refreshPreview}
              className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Iframe Preview */}
        {code ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={getIframeSrc()}
            onLoad={handleIframeLoad}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Component Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <p className="text-sm">No component code to preview</p>
              <p className="text-xs text-gray-400 mt-1">
                Generate a component to see the preview
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentPreview;
