import React, { useState, useEffect, useRef } from 'react';
import { Card, Empty, Tag, Spin, Input, Pagination, Button } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { CarOutlined } from '@ant-design/icons';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { SecureStorage } from '../../../../utils/encryption';

const VehicleCard = React.forwardRef(({ vehicle, isSelected, onClick, isMobile }, ref) => {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`${isMobile ? 'mx-1' : 'mx-2'}`}
    >
      <Card
        className={`
          overflow-hidden border border-gray-50/20 hover:border-gray-100 
          shadow-sm hover:shadow-md transition-all
          ${isSelected ? 'ring-2 ring-green-500 bg-green-500/20' : 'bg-white/80 hover:bg-gray-50/50'}
          flex
          ${isMobile ? 'py-1 px-2' : 'p-2'}
          backdrop-blur-sm
          h-[100px]
        `}
        onClick={onClick}
        bodyStyle={{ padding: 0 }}
      >
        <div className={`
          flex flex-row items-center
          ${isMobile ? 'gap-1' : 'gap-2'} w-full h-full
        `}>
          <div className={`
            flex items-center justify-center rounded-lg bg-gradient-to-br from-green-100/80 to-green-50/80
            ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}
            flex-shrink-0
            border border-gray-100/30
          `}>
            <CarOutlined className={`text-green-500 ${isMobile ? 'text-sm' : 'text-lg'}`} />
          </div>

          <div className="flex-1 min-w-0 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between gap-1 mb-0">
              <h3 className={`
                font-medium text-gray-800 truncate
                ${isMobile ? 'text-xs' : 'text-sm'}
              `}>
                {vehicle.vehicle_make_name} {vehicle.vehicle_model_name}
              </h3>
              {isSelected && (
                <Tag 
                  color="green"
                  className={`
                    flex items-center font-medium whitespace-nowrap
                    ${isMobile ? 'text-[8px] px-1 py-0' : 'text-xs px-1 py-0'}
                    bg-green-100/80 border border-green-200/50
                  `}
                >
                  Selected
                </Tag>
              )}
            </div>
            
            <div className={`
              flex items-center flex-wrap
              ${isMobile ? 'gap-1' : 'gap-2'}
            `}>
              <Tag 
                color="green"
                className={`
                  font-medium whitespace-nowrap
                  ${isMobile ? 'text-[10px] px-1 py-0' : 'text-xs px-2 py-0.5'}
                  bg-green-100/80 border border-green-200/50
                `}
              >
                {vehicle.vehicle_category_name}
              </Tag>
              {vehicle.vehicle_license && (
                <Tag 
                  color="blue"
                  className={`
                    font-medium whitespace-nowrap
                    ${isMobile ? 'text-[10px] px-1 py-0' : 'text-xs px-2 py-0.5'}
                    bg-blue-100/80 border border-blue-200/50
                  `}
                >
                  {vehicle.vehicle_license}
                </Tag>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

const ResourceVehicle = ({ selectedVehicles, onVehicleSelect, isMobile, showSelectedOnly = false, onFilterToggle }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const firstVehicleRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const filteredVehicles = vehicles.filter(vehicle => {
    // Apply search filter
    const matchesSearch = (
      (vehicle.vehicle_make_name + ' ' + vehicle.vehicle_model_name + ' ' + (vehicle.vehicle_category_name || '') + ' ' + (vehicle.vehicle_license || ''))
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    
    // Apply selected filter - automatically show all if no items are selected
    const isSelected = selectedVehicles.includes(vehicle.vehicle_id);
    const hasSelectedItems = selectedVehicles.length > 0;
    const matchesSelectedFilter = !showSelectedOnly || !hasSelectedItems || isSelected;
    
    return matchesSearch && matchesSelectedFilter;
  });

  const totalItems = filteredVehicles.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVehicles = filteredVehicles.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setTimeout(() => {
      if (isMobile && firstVehicleRef.current) {
        firstVehicleRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
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
        url: `${encryptedUrl}Admin.php`,
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
      if (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !navigator.onLine)) {
        toast.error("Network connection lost. Please check your internet connection and try again.");
      } else {
        toast.error("An error occurred while fetching vehicles.");
      }
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
      className={`flex flex-col h-full ${isMobile ? 'p-1' : 'p-3'}`}
    >
      {/* Header Section */}
      <div className={`
        flex flex-col gap-3
        bg-white/80 backdrop-blur-sm rounded-lg shadow-sm
        ${isMobile ? 'p-3 mb-2' : 'p-4 mb-3'}
        border border-gray-100/20
      `}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1">
            <h2 className={`
              font-semibold text-gray-900
              ${isMobile ? 'text-base' : 'text-lg'}
            `}>
              {selectedVehicles.length > 0
                ? `Selected Vehicles (${selectedVehicles.length})`
                : 'Available Vehicles'}
            </h2>
            <p className={`
              text-gray-600 mt-0.5
              ${isMobile ? 'text-xs' : 'text-sm'}
            `}>
              {selectedVehicles.length > 0
                ? 'Click to deselect vehicles'
                : 'Select vehicles to proceed'}
            </p>
          </div>
          
          {/* Filter Button */}
          {selectedVehicles.length > 0 && onFilterToggle && (
            <Button
              type={showSelectedOnly ? "primary" : "default"}
              icon={<FilterOutlined />}
              onClick={onFilterToggle}
              size={isMobile ? "small" : "middle"}
              className={`
                flex items-center gap-1
                ${showSelectedOnly 
                  ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600' 
                  : 'border-gray-300 hover:border-green-500 hover:text-green-500'}
                transition-all duration-200
              `}
            >
              {showSelectedOnly ? 'Show All' : 'Show Selected'}
            </Button>
          )}
        </div>

        {/* Search Input */}
        <div className={`${isMobile ? 'mt-1' : 'mt-2'}`}>
          <Input
            placeholder="Search vehicles by make, model, category, or license..."
            prefix={<SearchOutlined className="text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
            value={searchQuery}
            className="w-full"
            size={isMobile ? "middle" : "large"}
            bordered
            allowClear
          />
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-1"
        style={{ 
          maxHeight: 'calc(100vh - 180px)',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size={isMobile ? "default" : "large"} />
          </div>
        ) : (
          <AnimatePresence>
            <div className={`flex flex-col ${isMobile ? 'gap-1.5' : 'gap-2.5'}`}>
              {currentVehicles.map((vehicle, idx) => (
                <VehicleCard
                  key={vehicle.vehicle_id}
                  vehicle={vehicle}
                  isSelected={selectedVehicles.includes(vehicle.vehicle_id)}
                  onClick={() => onVehicleSelect(vehicle.vehicle_id)}
                  isMobile={isMobile}
                  ref={idx === 0 ? firstVehicleRef : undefined}
                />
              ))}
            </div>

            {filteredVehicles.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center h-full"
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
                  className={`bg-white/80 backdrop-blur-sm rounded-lg shadow-sm ${isMobile ? 'p-4' : 'p-6'} border border-gray-100/20`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination Section */}
      {filteredVehicles.length > 0 && (
        <div className={`
          bg-white/80 backdrop-blur-sm rounded-lg shadow-sm
          ${isMobile ? 'p-2 mt-1' : 'p-3 mt-2'}
          border border-gray-100/20
        `}>
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={itemsPerPage}
            onChange={handlePageChange}
            size={isMobile ? "small" : "default"}
            showSizeChanger={false}
            showQuickJumper={!isMobile}
            className="flex justify-center"
            responsive
            simple={isMobile}
          />
        </div>
      )}
    </motion.div>
  );
};

export default ResourceVehicle;