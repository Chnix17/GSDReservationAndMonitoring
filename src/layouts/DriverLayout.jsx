import React from 'react';
import { Outlet } from 'react-router-dom';

const DriverLayout = () => {
  return (
    <div className="layout layout-driver">
      <Outlet />
    </div>
  );
};

export default DriverLayout;
