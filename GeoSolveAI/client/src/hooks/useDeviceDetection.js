import { useState, useEffect } from 'react';

/**
 * Hook to detect device type and screen size
 * Returns: { device: 'mobile'|'tablet'|'desktop', isMobile, isTablet, isDesktop, width, height }
 */
export const useDeviceDetection = () => {
  const [deviceType, setDeviceType] = useState({
    device: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isPortrait: typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false,
    isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = height > width;
      const isLandscape = width > height;
      
      // User agent detection as fallback
      const ua = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);
      const isTabletUA = /ipad|android/.test(ua) && !/mobile/.test(ua);

      let device = 'desktop';
      let isMobile = false;
      let isTablet = false;
      let isDesktop = true;

      // Screen size detection (prioritize)
      if (width <= 480) {
        device = 'mobile';
        isMobile = true;
        isDesktop = false;
      } else if (width > 480 && width <= 768) {
        device = 'tablet';
        isTablet = true;
        isDesktop = false;
      } else if (width > 768 && width <= 1024) {
        // Could be tablet or small laptop
        if (isTabletUA || (isPortrait && width < 600)) {
          device = 'tablet';
          isTablet = true;
        } else {
          device = 'desktop';
          isDesktop = true;
        }
        isDesktop = !isTablet;
      } else {
        device = 'desktop';
        isDesktop = true;
      }

      // Fallback: user agent detection if screen detection is unclear
      if (width > 600 && isMobileUA && !isTabletUA) {
        device = 'mobile';
        isMobile = true;
        isDesktop = false;
      }

      setDeviceType({
        device,
        isMobile,
        isTablet,
        isDesktop,
        width,
        height,
        isPortrait,
        isLandscape,
      });
    };

    // Detect on mount
    detectDevice();

    // Detect on resize
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return deviceType;
};

export default useDeviceDetection;
