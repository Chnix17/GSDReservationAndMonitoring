import React from 'react';
import { Navigate } from 'react-router-dom';
import { SecureStorage } from './encryption';

const RoleRedirect = ({ type }) => {
  // type: 'chat' | 'notification' | 'reservations' | 'addReservation'
  const isLoggedIn = SecureStorage.getLocalItem('loggedIn') === 'true' || SecureStorage.getSessionItem('loggedIn');
  const role = SecureStorage.getLocalItem('user_level') || '';

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const toPath = (() => {
    let target;
    if (type === 'notification') target = 'Notification';
    else if (type === 'reservations') target = 'MyReservations';
    else if (type === 'addReservation') target = 'addReservation';
    else target = 'Chat';
    
    if (role === 'Super Admin' || role === 'Admin') return `/Admin/${target}`;
    if (role === 'Personnel') return `/Personnel/${target}`;
    if (role === 'Dean' || role === 'Secretary' || role === 'Department Head' || role === 'Principal') return `/Department/${target}`;
    if (role === 'Driver') return `/Driver/${target}`;
    // Faculty and other authenticated roles
    return `/Faculty/${target}`;
  })();

  return <Navigate to={toPath} replace />;
};

export default RoleRedirect;
