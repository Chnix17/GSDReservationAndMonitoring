import React from 'react';
import { Outlet } from 'react-router-dom';

const FacultyLayout = () => {
  return (
    <div className="layout layout-faculty">
      <Outlet />
    </div>
  );
};

export default FacultyLayout;
