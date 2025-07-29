import { useState, useEffect } from 'react';

// Hook for responsive behavior
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setScreenSize('mobile');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < 1024) {
        setScreenSize('tablet');
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setScreenSize('desktop');
        setIsMobile(false);
        setIsTablet(false);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet
  };
};

// Media query utilities
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280
};

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event) => setMatches(event.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};
