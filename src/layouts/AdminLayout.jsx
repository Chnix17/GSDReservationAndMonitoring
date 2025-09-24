import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className="layout layout-admin">
      <Outlet />
    </div>
  );
};

export default AdminLayout;
