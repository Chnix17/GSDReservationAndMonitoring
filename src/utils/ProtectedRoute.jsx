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
    // Fallback to numeric role id when role name is missing
    const userLevelId = SecureStorage.getLocalItem('user_level_id') || SecureStorage.getSessionItem('user_level_id');
    // Minimal mapping to ensure Admin access even if only the id is present
    const roleMap = { '1': 'Admin' };
    const resolvedUserRole = userRole || roleMap[String(userLevelId)] || '';
    const userDepartment = SecureStorage.getSessionItem('Department Name');

    useEffect(() => {
        if (
            (allowedRoles && !allowedRoles.includes(resolvedUserRole)) ||
            (requiredDepartment && userDepartment !== requiredDepartment)
        ) {
            setShowModal(true);
        }
    }, [allowedRoles, resolvedUserRole, requiredDepartment, userDepartment]);

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
        if (resolvedUserRole === 'Super Admin' || resolvedUserRole === 'Admin') return '/adminDashboard';
        if (resolvedUserRole === 'Personnel') return '/personnelDashboard';
        if (resolvedUserRole === 'Dean' || resolvedUserRole === 'Secretary' || resolvedUserRole === 'Department Head') return '/Department/Dashboard';
        if (resolvedUserRole === 'Faculty/Staff' || resolvedUserRole === 'School Head' || resolvedUserRole === 'SBO PRESIDENT' || resolvedUserRole === 'CSG PRESIDENT') return '/Faculty/Dashboard';
        if (resolvedUserRole === 'Driver') return '/Driver/Dashboard';
        return '/gsd';
    };

    if (
        (allowedRoles && !allowedRoles.includes(resolvedUserRole)) ||
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