import React from 'react';
import { useLocation } from 'react-router-dom';
import NotFound from '../utils/NotFound';

const RouteInterceptor = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    // Define patterns that should show 404
    const invalidPatterns = [
        /^\/reservation\/.*/, // Any /reservation/* URLs
        /^\/[^\/]+\/[^\/]+\/[^\/]+\/.*/, // URLs with too many segments
        /^\/\d+/, // URLs starting with numbers
    ];

    // Check if current path matches any invalid pattern
    const isInvalidURL = invalidPatterns.some(pattern => pattern.test(currentPath));

    if (isInvalidURL) {
        console.log('RouteInterceptor: Invalid URL detected:', currentPath);
        return <NotFound />;
    }

    // This should never render if routes are properly configured
    return <NotFound />;
};

export default RouteInterceptor;
