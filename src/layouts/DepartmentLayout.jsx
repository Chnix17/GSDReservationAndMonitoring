import React from 'react';
import { Outlet } from 'react-router-dom';

const DepartmentLayout = () => {
  return (
    <div className="layout layout-department">
      <Outlet />
    </div>
  );
};

export default DepartmentLayout;
