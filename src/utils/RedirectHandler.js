import { useEffect } from 'react'


const RedirectHandler = () => {
    useEffect(() => {
        // Check if we're at the root path and redirect to /reservation
        if (window.location.pathname === '/') {
            window.location.replace('/reservation');
        }
    }, []);

    return null;
};

export default RedirectHandler;
