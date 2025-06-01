import React, { useState, useEffect } from 'react';
import { Card, Empty, Tag, Spin, Input, Pagination } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { BsFillGridFill, BsList } from 'react-icons/bs';
import { CarOutlined } from '@ant-design/icons';
import { MdPeople } from 'react-icons/md';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { SecureStorage } from '../../../../utils/encryption';

const VehicleCard = ({ vehicle, isSelected, onClick, viewMode, isMobile }) => {
  // Force list view on mobile
  const effectiveViewMode = isMobile ? 'list' : viewMode;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`
          overflow-hidden border-0 shadow-sm hover:shadow-md transition-all
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
          ${effectiveViewMode === 'list' ? 'flex' : ''}
          ${isMobile ? 'py-2 px-3' : 'p-4'}
        `}
        onClick={onClick}
      >
        <div className={`
          flex ${effectiveViewMode === 'list' ? 'flex-row items-center' : 'flex-col'}
          ${isMobile ? 'gap-2' : 'gap-3'} w-full
        `}>
          {/* Vehicle Icon/Placeholder */}
          <div className={`
            flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50
            ${effectiveViewMode === 'list' 
              ? (isMobile ? 'w-12 h-12' : 'w-16 h-16') 
              : 'w-full h-24'}
            flex-shrink-0
          `}>
            <CarOutlined className={`text-blue-400 ${isMobile ? 'text-xl' : 'text-3xl'}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`
                font-medium text-gray-800 truncate
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                {vehicle.vehicle_make_name} {vehicle.vehicle_model_name}
              </h3>
              {isSelected && (
                <Tag 
                  color="blue"
                  className={`
                    flex items-center font-medium whitespace-nowrap
                    ${isMobile ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}
                  `}
                >
                  Selected
                </Tag>
              )}
            </div>

            <div className={`
              flex flex-wrap
              ${isMobile ? 'gap-2' : 'gap-3'}
            `}>
              <div className="flex items-center gap-1 text-gray-600">
                <CarOutlined className={`text-blue-400 ${isMobile ? 'text-sm' : 'text-base'}`} />
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {vehicle.vehicle_license}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <MdPeople className={`text-blue-400 ${isMobile ? 'text-sm' : 'text-base'}`} />
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {vehicle.vehicle_capacity || 'N/A'}
                </span>
              </div>
              <Tag
                color={vehicle.status_availability_name === 'available' ? 'success' : 'error'}
                className={`
                  flex items-center whitespace-nowrap
                  ${isMobile ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}
                `}
              >
                {vehicle.status_availability_name}
              </Tag>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const ResourceVehicle = ({ selectedVehicles, onVehicleSelect, vehicleCategories, selectedCategory, onCategoryChange, isMobile }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter vehicles based on search query and category
  const filteredVehicles = vehicles.filter(vehicle =>
    (selectedCategory === 'all' || vehicle.vehicle_category_id === selectedCategory) &&
    ((vehicle.vehicle_make_name + ' ' + vehicle.vehicle_model_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.vehicle_license.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate pagination
  const totalItems = filteredVehicles.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVehicles = filteredVehicles.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of vehicle list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const encryptedUrl = SecureStorage.getLocalItem("url");
      if (!encryptedUrl) {
        toast.error("API URL configuration is missing");
        return;
      }

      const response = await axios({
        method: 'post',
        url: `${encryptedUrl}fetch2.php`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          operation: 'fetchVehicles'
        }
      });

      if (response.data.status === 'success') {
        setVehicles(response.data.data);
      } else {
        toast.error("Error fetching vehicles: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("An error occurred while fetching vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`space-y-3 ${isMobile ? 'p-2' : 'p-4'}`}
    >
      {/* Header with Search and Filters */}
      <div className={`
        flex flex-col gap-3
        bg-white rounded-lg shadow-sm
        ${isMobile ? 'p-3' : 'p-4'}
      `}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1">
            <h2 className={`
              font-semibold text-gray-800
              ${isMobile ? 'text-base' : 'text-lg'}
            `}>
              {selectedVehicles.length > 0
                ? `Selected Vehicles (${selectedVehicles.length})`
                : 'Available Vehicles'}
            </h2>
            <p className={`
              text-gray-500 mt-0.5
              ${isMobile ? 'text-xs' : 'text-sm'}
            `}>
              {selectedVehicles.length > 0
                ? 'Click to deselect vehicles'
                : 'Select vehicles to proceed'}
            </p>
          </div>
          
          {/* View mode toggle for non-mobile */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`
                    p-2 rounded-md transition-all
                    ${viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-200'}
                  `}
                >
                  <BsFillGridFill size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`
                    p-2 rounded-md transition-all
                    ${viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-200'}
                  `}
                >
                  <BsList size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search and Category Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search vehicles by name or license..."
            prefix={<SearchOutlined className="text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
            value={searchQuery}
            className="w-full sm:max-w-md"
            size={isMobile ? 'middle' : 'large'}
          />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`
              border rounded-md px-3 py-2 bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isMobile ? 'text-sm' : 'text-base'}
            `}
          >
            <option value="all">All Categories</option>
            {vehicleCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spin size={isMobile ? "default" : "large"} />
        </div>
      ) : (
        <AnimatePresence>
          <div className={`
            ${!isMobile && viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-2'}
          `}>
            {currentVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.vehicle_id}
                vehicle={vehicle}
                isSelected={selectedVehicles.includes(vehicle.vehicle_id)}
                onClick={() => onVehicleSelect(vehicle.vehicle_id)}
                viewMode={viewMode}
                isMobile={isMobile}
              />
            ))}
          </div>

          {filteredVehicles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Empty
                description={
                  <div className="text-center">
                    <h3 className={`
                      font-medium text-gray-800 mb-1
                      ${isMobile ? 'text-sm' : 'text-base'}
                    `}>
                      {searchQuery 
                        ? 'No vehicles match your search'
                        : 'No Vehicles Available'}
                    </h3>
                    <p className={`
                      text-gray-500
                      ${isMobile ? 'text-xs' : 'text-sm'}
                    `}>
                      {searchQuery 
                        ? 'Try different keywords or clear the search'
                        : 'Check back later for available vehicles'}
                    </p>
                  </div>
                }
                className={`bg-white rounded-lg shadow-sm ${isMobile ? 'p-6' : 'p-8'}`}
              />
            </motion.div>
          )}

          {/* Pagination */}
          {filteredVehicles.length > 0 && (
            <div className={`
              flex justify-center mt-4 bg-white rounded-lg shadow-sm
              ${isMobile ? 'p-2' : 'p-4'}
            `}>
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={itemsPerPage}
                onChange={handlePageChange}
                size={isMobile ? 'small' : 'default'}
                showSizeChanger={false}
                showQuickJumper={!isMobile}
              />
            </div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default ResourceVehicle;
