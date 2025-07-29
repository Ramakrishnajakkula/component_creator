import React, { Suspense } from "react";
import { LoadingSpinner } from "../loading/Loading";
import { createLazyComponent } from "../../utils/codeSplittingUtils";

// Route-based code splitting
export const LazyRoute = ({
  component,
  fallback = <LoadingSpinner />,
  ...props
}) => {
  const Component = component;
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

// Component-based code splitting
export const LazyComponent = ({
  loader,
  fallback = <LoadingSpinner />,
  delay = 200,
  timeout = 10000,
  ...props
}) => {
  const [Component, setComponent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) {
        setLoading(true);
      }
    }, delay);

    const timeoutTimer = setTimeout(() => {
      if (mounted && loading) {
        setError(new Error("Component loading timeout"));
        setLoading(false);
      }
    }, timeout);

    loader()
      .then((module) => {
        if (mounted) {
          clearTimeout(timer);
          clearTimeout(timeoutTimer);
          setComponent(() => module.default || module);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          clearTimeout(timer);
          clearTimeout(timeoutTimer);
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timer);
      clearTimeout(timeoutTimer);
    };
  }, [loader, delay, timeout, loading]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-red-800 font-medium">Failed to load component</h3>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
          Reload page
        </button>
      </div>
    );
  }

  if (loading || !Component) {
    return fallback;
  }

  return <Component {...props} />;
};

// Progressive loading wrapper
export const ProgressiveLoader = ({
  children,
  placeholder = <LoadingSpinner />,
  threshold = 0.1,
  rootMargin = "50px",
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const ref = React.useRef();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  React.useEffect(() => {
    if (isVisible) {
      // Simulate component loading
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return <div ref={ref}>{isLoaded ? children : placeholder}</div>;
};

// Common lazy components for the application
export const LazyGeneratorForm = createLazyComponent(
  () => import("../generator/GeneratorForm"),
  <div className="p-8 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="h-32 bg-gray-200 rounded mb-4"></div>
    <div className="h-10 bg-gray-200 rounded w-1/6"></div>
  </div>
);

export const LazyCodePreview = createLazyComponent(
  () => import("../preview/CodePreview"),
  <div className="p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
);

export const LazyHistoryPanel = createLazyComponent(
  () => import("../history/HistoryPanel"),
  <div className="p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);

export const LazyExportModal = createLazyComponent(
  () => import("../modals/ExportModal"),
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);
