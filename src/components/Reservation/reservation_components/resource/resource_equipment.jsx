import React, { useState, useEffect } from 'react';
import { Card, Empty, Tag, Spin, Input, Pagination } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { BsFillGridFill, BsList, BsTools } from 'react-icons/bs';
import { MdInventory } from 'react-icons/md';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { SecureStorage } from '../../../../utils/encryption';

const EquipmentCard = ({ equipment, isSelected, onClick, viewMode, isMobile, currentQuantity, onQuantityChange }) => {
  // Force list view on mobile
  const effectiveViewMode = isMobile ? 'list' : viewMode;
  const availableQuantity = parseInt(equipment.available_quantity) || 0;
  const isAvailable = availableQuantity > 0;

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
          ${currentQuantity > 0 ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}
          ${effectiveViewMode === 'list' ? 'flex' : 'h-full'}
          ${isMobile ? 'py-2 px-3' : 'p-4'}
        `}
        onClick={onClick}
      >
        <div className={`
          flex ${effectiveViewMode === 'list' ? 'flex-row items-center' : 'flex-col h-full'}
          ${isMobile ? 'gap-2' : 'gap-3'} w-full
        `}>
          {/* Equipment Icon/Placeholder */}
          <div className={`
            flex items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-50
            ${effectiveViewMode === 'list' 
              ? (isMobile ? 'w-12 h-12' : 'w-16 h-16') 
              : 'w-full h-24'}
            flex-shrink-0
          `}>
            <BsTools className={`text-green-500 ${isMobile ? 'text-xl' : 'text-3xl'}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={`
                  font-medium text-gray-800 truncate
                  ${isMobile ? 'text-sm' : 'text-base'}
                `}>
                  {equipment.equipment_name}
                </h3>
                {currentQuantity > 0 && (
                  <Tag 
                    color="green"
                    className={`
                      flex items-center font-medium whitespace-nowrap
                      ${isMobile ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}
                    `}
                  >
                    {currentQuantity} selected
                  </Tag>
                )}
              </div>

              <div className={`
                flex flex-wrap
                ${isMobile ? 'gap-2' : 'gap-3'}
              `}>
                <div className="flex items-center gap-1 text-gray-600">
                  <MdInventory className={`text-green-500 ${isMobile ? 'text-sm' : 'text-base'}`} />
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                    qty: {availableQuantity}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Controls */}
            {isAvailable && (
              <div className={`
                flex items-center justify-center gap-2 mt-auto pt-2
                ${isMobile ? 'mt-1' : 'mt-3'}
              `}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuantityChange(equipment.equipment_id, Math.max(0, currentQuantity - 1));
                  }}
                  disabled={currentQuantity === 0}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${currentQuantity > 0 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    transition-colors
                  `}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max={availableQuantity}
                  value={currentQuantity}
                  onChange={(e) => {
                    e.stopPropagation();
                    const value = parseInt(e.target.value) || 0;
                    const clampedValue = Math.min(Math.max(0, value), availableQuantity);
                    onQuantityChange(equipment.equipment_id, clampedValue);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`
                    w-12 h-6 text-center border border-gray-300 rounded text-xs font-medium
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                    ${isMobile ? 'text-xs' : 'text-sm'}
                  `}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuantityChange(equipment.equipment_id, currentQuantity + 1);
                  }}
                  disabled={currentQuantity >= availableQuantity}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${currentQuantity < availableQuantity 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    transition-colors
                  `}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const ResourceEquipment = ({ 
  equipmentQuantities,
  onQuantityChange,
  isMobile,
  startDate,
  endDate
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleEquipmentQuantityChange = (equipId, value) => {
    console.log('Equipment quantity change triggered:', {
      equipId,
      value,
      currentEquipment: equipment,
      currentQuantities: equipmentQuantities
    });
    
    const numericValue = parseInt(value) || 0;
    
    const equip = equipment.find(e => e.equipment_id.toString() === equipId.toString());
    if (!equip) {
      console.error('Equipment not found:', equipId);
      return;
    }

    const availableQuantity = parseInt(equip.available_quantity) || 0;
    console.log('Equipment availability check:', {
      equipId,
      availableQuantity,
      requestedQuantity: numericValue
    });

    if (numericValue > availableQuantity) {
      console.log('Quantity exceeds available amount');
      return;
    }

    // Call the parent's onQuantityChange with the new value
    onQuantityChange(equipId, numericValue);
  };

  const fetchAllEquipments = async () => {
    try {
      console.log('Fetching all equipment...');
      setLoading(true);

      const encryptedUrl = SecureStorage.getLocalItem("url");
      if (!encryptedUrl) {
        toast.error("API URL configuration is missing");
        return;
      }

      const response = await axios.post(
        `${encryptedUrl}fetch2.php`,
        {
          operation: 'fetchEquipments'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Equipment API Response:', response.data);

      if (response.data.status === 'success') {
        const formattedEquipment = response.data.data.map(item => {
          // Parse quantities properly with debug logging
          console.log('Raw equipment data:', {
            equip_quantity: item.equip_quantity,
            reserved_quantity: item.reserved_quantity,
            available_quantity: item.available_quantity
          });

          // Use Number() instead of parseInt() for more reliable parsing
          const totalQuantity = Number(item.equip_quantity) || 0;
          const reservedQuantity = Number(item.reserved_quantity) || 0;
          // Use the API's available_quantity if provided, otherwise calculate it
          const availableQuantity = Number(item.available_quantity) || Math.max(0, totalQuantity - reservedQuantity);
          
          console.log('Processed equipment item:', {
            name: item.equip_name,
            total: totalQuantity,
            reserved: reservedQuantity,
            available: availableQuantity
          });
          
          return {
            equipment_id: item.equip_id,
            equipment_name: item.equip_name,
            equipment_quantity: totalQuantity,
            current_quantity: item.current_quantity || 0,
            equipment_category: item.equipments_category_name || 'Uncategorized',
            equipment_category_id: item.equipments_category_id,
            equipment_pic: item.equip_pic,
            status_availability_name: availableQuantity > 0 ? 'available' : 'unavailable',
            reserved_quantity: reservedQuantity,
            equip_quantity: totalQuantity,
            available_quantity: availableQuantity
          };
        });

        console.log('Formatted equipment data:', formattedEquipment);
        setEquipment(formattedEquipment);
      } else {
        console.error('Error fetching equipment:', response.data.message);
        toast.error("Error fetching equipment: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
      toast.error("An error occurred while fetching equipment.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch equipment when component mounts
  useEffect(() => {
    console.log('ResourceEquipment mounted - fetching equipment');
    fetchAllEquipments();
  }, []); // Empty dependency array means this runs once when component mounts

  // Filter equipment by search term only
  const filteredEquipment = equipment.filter(item => 
    searchQuery === '' || 
    item.equipment_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalItems = filteredEquipment.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEquipment = filteredEquipment.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of equipment section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`space-y-3 ${isMobile ? 'p-2' : 'p-4'}`}
    >
      {/* Header with Search */}
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
              {Object.values(equipmentQuantities).filter(qty => qty > 0).length > 0
                ? `Selected Equipment (${Object.values(equipmentQuantities).filter(qty => qty > 0).length})`
                : 'Available Equipment'}
            </h2>
            <p className={`
              text-gray-500 mt-0.5
              ${isMobile ? 'text-xs' : 'text-sm'}
            `}>
              {Object.values(equipmentQuantities).filter(qty => qty > 0).length > 0
                ? 'Equipment availability is calculated based on existing reservations'
                : 'Select equipment to proceed'}
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
                      ? 'bg-white text-green-600 shadow-sm' 
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
                      ? 'bg-white text-green-600 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-200'}
                  `}
                >
                  <BsList size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className={`${isMobile ? 'mt-1' : 'mt-2'}`}>
          <Input
            placeholder="Search equipment by name..."
            prefix={<SearchOutlined className="text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
            value={searchQuery}
            className="w-full max-w-md"
            size={isMobile ? 'middle' : 'large'}
          />
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
            {currentEquipment.map((item) => (
              <EquipmentCard
                key={item.equipment_id}
                equipment={item}
                isSelected={equipmentQuantities[item.equipment_id] > 0}
                onClick={() => {
                  const currentQty = equipmentQuantities[item.equipment_id] || 0;
                  const availableQty = parseInt(item.available_quantity) || 0;
                  if (currentQty === 0 && availableQty > 0) {
                    handleEquipmentQuantityChange(item.equipment_id, 1);
                  } else if (currentQty > 0) {
                    handleEquipmentQuantityChange(item.equipment_id, 0);
                  }
                }}
                viewMode={viewMode}
                isMobile={isMobile}
                currentQuantity={equipmentQuantities[item.equipment_id] || 0}
                onQuantityChange={handleEquipmentQuantityChange}
              />
            ))}
          </div>

          {filteredEquipment.length === 0 && (
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
                        ? 'No equipment matches your search'
                        : 'No Equipment Available'}
                    </h3>
                    <p className={`
                      text-gray-500
                      ${isMobile ? 'text-xs' : 'text-sm'}
                    `}>
                      {searchQuery 
                        ? 'Try different keywords or clear the search'
                        : 'Check back later for available equipment'}
                    </p>
                  </div>
                }
                className={`bg-white rounded-lg shadow-sm ${isMobile ? 'p-6' : 'p-8'}`}
              />
            </motion.div>
          )}

          {/* Pagination */}
          {filteredEquipment.length > 0 && (
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

      {/* Summary Footer */}
      {Object.values(equipmentQuantities).filter(qty => qty > 0).length > 0 && (
        <div className={`
          sticky bottom-0 bg-white border-t shadow-lg
          ${isMobile ? 'p-3' : 'p-4'}
        `}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`
                font-medium text-gray-600
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                Selected Items: <span className="text-green-500 font-semibold">
                  {Object.values(equipmentQuantities).filter(qty => qty > 0).length}
                </span>
              </div>
              <div className={`
                font-medium text-gray-600
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                Total Quantity: <span className="text-green-500 font-semibold">
                  {Object.values(equipmentQuantities).reduce((sum, qty) => sum + qty, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ResourceEquipment;
