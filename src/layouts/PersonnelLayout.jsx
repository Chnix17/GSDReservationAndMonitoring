import React from 'react';
import { Outlet } from 'react-router-dom';

const PersonnelLayout = () => {
  return (
    <div className="layout layout-personnel">
      <Outlet />
    </div>
  );
};

export default PersonnelLayout;
