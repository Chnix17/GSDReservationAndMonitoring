import React from 'react';
import { Navigate } from 'react-router-dom';
import { SecureStorage } from '../utils/encryption';
import Logins from '../pages/auth/logins';

const LoginRedirect = () => {
  const isLoggedIn = SecureStorage.getLocalItem('loggedIn') === 'true' || SecureStorage.getSessionItem('loggedIn');
  const userRole = SecureStorage.getLocalItem('user_level');
  const userLevelId = SecureStorage.getLocalItem('user_level_id') || SecureStorage.getSessionItem('user_level_id');
  
  // Minimal mapping to ensure Admin access even if only the id is present
  const roleMap = { '1': 'Admin' };
  const resolvedUserRole = userRole || roleMap[String(userLevelId)] || '';

  if (isLoggedIn && resolvedUserRole) {
    // Redirect logged-in users to their appropriate dashboard
    if (resolvedUserRole === 'Super Admin' || resolvedUserRole === 'Admin') {
      return <Navigate to="/Admin" replace />;
    }
    if (resolvedUserRole === 'Personnel') {
      return <Navigate to="/Personnel/Dashboard" replace />;
    }
    if (resolvedUserRole === 'Dean' || resolvedUserRole === 'Secretary' || resolvedUserRole === 'Department Head') {
      return <Navigate to="/Department/Dashboard" replace />;
    }
    if (resolvedUserRole === 'Faculty/Staff' || resolvedUserRole === 'School Head' || resolvedUserRole === 'SBO PRESIDENT' || resolvedUserRole === 'CSG PRESIDENT') {
      return <Navigate to="/Faculty/Dashboard" replace />;
    }
    if (resolvedUserRole === 'Driver') {
      return <Navigate to="/Driver/Dashboard" replace />;
    }
  }

  // Show login page for non-logged-in users
  return <Logins />;
};

export default LoginRedirect;
