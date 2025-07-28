import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import NotAuthorize from '../components/NotAuthorize';
import { SecureStorage } from './encryption';

const ProtectedRoute = ({ children, allowedRoles, requiredDepartment }) => {
    const [showModal, setShowModal] = useState(false);
    const [shouldNavigate, setShouldNavigate] = useState(false);
    // Check both regular localStorage and SecureStorage for backward compatibility
    const isLoggedIn = SecureStorage.getLocalItem('loggedIn') === 'true' || SecureStorage.getSessionItem('loggedIn');
    const userRole = SecureStorage.getLocalItem('user_level');
    const userDepartment = SecureStorage.getSessionItem('Department Name');

    useEffect(() => {
        if (
            (allowedRoles && !allowedRoles.includes(userRole)) ||
            (requiredDepartment && userDepartment !== requiredDepartment)
        ) {
            setShowModal(true);
        }
    }, [allowedRoles, userRole, requiredDepartment, userDepartment]);

    const handleModalClose = () => {
        setShowModal(false);
        // Delay navigation until after modal closes
        setTimeout(() => {
            setShouldNavigate(true);
        }, 300); // 300ms delay to match modal animation
    };

    if (!isLoggedIn) {
        return <Navigate to="/gsd" replace />;
    }

    const getRedirectPath = () => {
        if (userRole === 'Super Admin' || userRole === 'Admin') return '/adminDashboard';
        if (userRole === 'Personnel') return '/personnelDashboard';
        if (userRole === 'Dean' || userRole === 'Secretary' || userRole === 'Department Head') return '/Department/Dashboard';
        if (userRole === 'Faculty/Staff' || userRole === 'School Head' || userRole === 'SBO PRESIDENT' || userRole === 'CSG PRESIDENT') return '/Faculty/Dashboard';
        if (userRole === 'Driver') return '/Driver/Dashboard';
        return '/gsd';
    };

    if (
        (allowedRoles && !allowedRoles.includes(userRole)) ||
        (requiredDepartment && userDepartment !== requiredDepartment)
    ) {
        return (
            <>
                <NotAuthorize open={showModal} onClose={handleModalClose} />
                {shouldNavigate && <Navigate to={getRedirectPath()} replace />}
            </>
        );
    }

    return children;
};

export default ProtectedRoute;