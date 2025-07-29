import { useCallback, useRef, useEffect } from 'react';

// Debounce hook for performance optimization
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Immediate execution function
  const executeImmediately = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    callbackRef.current(...args);
  }, []);

  // Cancel pending execution
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    debouncedCallback,
    executeImmediately,
    cancel
  };
};

// Throttle hook for limiting function calls
export const useThrottle = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  const lastExecRef = useRef(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    
    if (now - lastExecRef.current >= delay) {
      lastExecRef.current = now;
      callbackRef.current(...args);
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        lastExecRef.current = Date.now();
        callbackRef.current(...args);
        timeoutRef.current = null;
      }, delay - (now - lastExecRef.current));
    }
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

// Auto-save hook with debouncing
export const useAutoSave = (saveFunction, options = {}) => {
  const {
    delay = 1000,
    enabled = true,
    immediate = false
  } = options;

  const { debouncedCallback, executeImmediately, cancel } = useDebounce(saveFunction, delay);

  const autoSave = useCallback((data, forceImmediate = false) => {
    if (!enabled) return;

    if (immediate || forceImmediate) {
      executeImmediately(data);
    } else {
      debouncedCallback(data);
    }
  }, [enabled, immediate, debouncedCallback, executeImmediately]);

  return {
    autoSave,
    cancelSave: cancel,
    saveImmediately: executeImmediately
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    if (import.meta.env.DEV) {
      console.log(`${componentName} render #${renderCountRef.current}, time since last: ${timeSinceLastRender.toFixed(2)}ms`);
    }
  });

  return {
    renderCount: renderCountRef.current,
    logPerformance: (action) => {
      if (import.meta.env.DEV) {
        console.log(`${componentName} - ${action} - Render count: ${renderCountRef.current}`);
      }
    }
  };
};

// Async debounce for API calls
export const useAsyncDebounce = (asyncFunction, delay) => {
  const timeoutRef = useRef(null);
  const pendingPromiseRef = useRef(null);

  const debouncedFunction = useCallback((...args) => {
    // Cancel previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Return a promise that resolves with the debounced result
    return new Promise((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          // Cancel previous promise if still pending
          if (pendingPromiseRef.current) {
            pendingPromiseRef.current = null;
          }

          const promise = asyncFunction(...args);
          pendingPromiseRef.current = promise;
          
          const result = await promise;
          
          // Only resolve if this is still the latest promise
          if (pendingPromiseRef.current === promise) {
            resolve(result);
          }
        } catch (error) {
          if (pendingPromiseRef.current) {
            reject(error);
          }
        }
      }, delay);
    });
  }, [asyncFunction, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      pendingPromiseRef.current = null;
    };
  }, []);

  return debouncedFunction;
};
