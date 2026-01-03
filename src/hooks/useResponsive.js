import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 640); // Tailwind sm breakpoint
      setIsTablet(width >= 640 && width < 1024); // Tailwind md to lg
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenWidth,
    // Utility functions
    getModalWidth: () => {
      if (isMobile) return '95%';
      if (isTablet) return '90%';
      return '900px';
    },
    getTableScrollX: () => {
      if (isMobile) return 350;
      if (isTablet) return 500;
      return false;
    }
  };
};

export default useResponsive;
