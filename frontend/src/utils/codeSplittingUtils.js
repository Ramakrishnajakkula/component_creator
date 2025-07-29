import React, { lazy, Suspense } from 'react';

// Code splitting utilities
export const createLazyComponent = (importFunction, fallback) => {
  const LazyComponent = lazy(importFunction);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Preload utility for better UX
export const preloadComponent = (importFunction) => {
  const componentImport = importFunction();
  return componentImport;
};

// Bundle analysis helper
export const withBundleAnalysis = (Component, bundleName) => {
  return React.forwardRef((props, ref) => {
    React.useEffect(() => {
      // Only log in development if process is available
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`Bundle loaded: ${bundleName}`);
      }
    }, []);

    return React.createElement(Component, { ref, ...props });
  });
};

// Dynamic import with error boundary
export const withErrorBoundary = (LazyComponent, FallbackComponent) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Lazy component loading error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return FallbackComponent ? React.createElement(FallbackComponent) : React.createElement('div', {
          className: 'p-4 border border-red-200 rounded-lg bg-red-50'
        }, React.createElement('p', { className: 'text-red-600' }, 'Failed to load component'));
      }

      return React.createElement(LazyComponent, this.props);
    }
  };
};
