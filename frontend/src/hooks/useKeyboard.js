import { useEffect, useCallback, useRef } from 'react';

// Keyboard navigation hook
export const useKeyboardNavigation = (options = {}) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    enabled = true,
    preventDefault = true
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      const { key, shiftKey } = event;

      if (preventDefault) {
        // Prevent default for navigation keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) {
          event.preventDefault();
        }
      }

      switch (key) {
        case 'Escape':
          onEscape?.(event);
          break;
        case 'Enter':
          onEnter?.(event);
          break;
        case 'ArrowUp':
          onArrowUp?.(event);
          break;
        case 'ArrowDown':
          onArrowDown?.(event);
          break;
        case 'ArrowLeft':
          onArrowLeft?.(event);
          break;
        case 'ArrowRight':
          onArrowRight?.(event);
          break;
        case 'Tab':
          if (shiftKey) {
            onShiftTab?.(event);
          } else {
            onTab?.(event);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, preventDefault, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onShiftTab]);
};

// Focus management hook
export const useFocusManagement = (containerRef) => {
  const focusableElementsRef = useRef([]);

  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return;

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    focusableElementsRef.current = Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    );
  }, [containerRef]);

  const focusFirst = useCallback(() => {
    updateFocusableElements();
    if (focusableElementsRef.current.length > 0) {
      focusableElementsRef.current[0].focus();
    }
  }, [updateFocusableElements]);

  const focusLast = useCallback(() => {
    updateFocusableElements();
    const elements = focusableElementsRef.current;
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [updateFocusableElements]);

  const focusNext = useCallback(() => {
    updateFocusableElements();
    const elements = focusableElementsRef.current;
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    const nextIndex = (currentIndex + 1) % elements.length;
    if (elements[nextIndex]) {
      elements[nextIndex].focus();
    }
  }, [updateFocusableElements]);

  const focusPrevious = useCallback(() => {
    updateFocusableElements();
    const elements = focusableElementsRef.current;
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    if (elements[prevIndex]) {
      elements[prevIndex].focus();
    }
  }, [updateFocusableElements]);

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    updateFocusableElements
  };
};
