import React, { useState, useEffect, useRef } from 'react';
import { Card, Empty, Tag, Spin, Input, Pagination } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { BsTools } from 'react-icons/bs';
import { MdInventory } from 'react-icons/md';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { SecureStorage } from '../../../../utils/encryption';

const EquipmentCard = React.forwardRef(({ equipment, isSelected, onClick, isMobile, currentQuantity, onQuantityChange }, ref) => {
  const availableQuantity = parseInt(equipment.available_quantity) || 0;
  const isAvailable = availableQuantity > 0;
  const [inputValue, setInputValue] = useState(currentQuantity || 0);

  useEffect(() => {
    setInputValue(currentQuantity || 0);
  }, [currentQuantity]);

  const handleInputChange = (e) => {
    e.stopPropagation();
    const value = e.target.value;
    setInputValue(value);
  };

  const handleInputBlur = (e) => {
    e.stopPropagation();
    const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
    const clampedValue = Math.min(Math.max(0, value), availableQuantity);
    setInputValue(clampedValue);
    onQuantityChange(equipment.equipment_id, clampedValue);
  };

  const handleInputFocus = (e) => {
    e.stopPropagation();
  };

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
          ${currentQuantity > 0 ? 'ring-2 ring-green-500 bg-green-50/30' : 'bg-white/80 hover:bg-gray-50/50'}
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
          {/* Equipment Icon */}
          <div className={`
            flex items-center justify-center rounded-lg bg-gradient-to-br from-green-100/80 to-green-50/80
            ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}
            flex-shrink-0
            border border-gray-100/30
          `}>
            <BsTools className={`text-green-500 ${isMobile ? 'text-sm' : 'text-lg'}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between gap-1 mb-0">
              <h3 className={`
                font-medium text-gray-800 truncate
                ${isMobile ? 'text-xs' : 'text-sm'}
              `}>
                {equipment.equipment_name}
              </h3>
              {currentQuantity > 0 && (
                <Tag 
                  color="green"
                  className={`
                    flex items-center font-medium whitespace-nowrap
                    ${isMobile ? 'text-[8px] px-1 py-0' : 'text-xs px-1 py-0'}
                    bg-green-100/80 border border-green-200/50
                  `}
                >
                  {currentQuantity} selected
                </Tag>
              )}
            </div>

            <div className={`
              flex flex-wrap items-center
              ${isMobile ? 'gap-1' : 'gap-2'}
            `}>
              <div className="flex items-center gap-1 text-gray-600">
                <MdInventory className={`text-green-500 ${isMobile ? 'text-xs' : 'text-sm'}`} />
                <span className={`${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                  Available: {availableQuantity}
                </span>
              </div>
            </div>

            {/* Quantity Controls */}
            {isAvailable && (
              <div className={`
                flex items-center justify-center gap-2 mt-1
                ${isMobile ? 'mt-0' : 'mt-1'}
              `}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuantityChange(equipment.equipment_id, Math.max(0, currentQuantity - 1));
                  }}
                  disabled={currentQuantity === 0}
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
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
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  onClick={(e) => e.stopPropagation()}
                  className={`
                    w-8 h-5 text-center border border-gray-300 rounded text-xs font-medium
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                    ${isMobile ? 'text-[10px]' : 'text-xs'}
                  `}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuantityChange(equipment.equipment_id, currentQuantity + 1);
                  }}
                  disabled={currentQuantity >= availableQuantity}
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
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
});

const ResourceEquipment = ({ 
  equipmentQuantities,
  onQuantityChange,
  isMobile,
  startDate,
  endDate
}) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const firstEquipmentRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const handleEquipmentQuantityChange = (equipId, value) => {
    const numericValue = parseInt(value) || 0;
    const equip = equipment.find(e => e.equipment_id.toString() === equipId.toString());
    if (!equip) return;

    const availableQuantity = parseInt(equip.available_quantity) || 0;
    if (numericValue > availableQuantity) return;

    onQuantityChange(equipId, numericValue);
  };

  const fetchAllEquipments = async () => {
    try {
      setLoading(true);
      const encryptedUrl = SecureStorage.getLocalItem("url");
      if (!encryptedUrl) {
        toast.error("API URL configuration is missing");
        return;
      }

      const response = await axios.post(
        `${encryptedUrl}fetch2.php`,
        { operation: 'fetchEquipments' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.status === 'success') {
        const formattedEquipment = response.data.data.map(item => {
          const totalQuantity = Number(item.equip_quantity) || 0;
          const reservedQuantity = Number(item.reserved_quantity) || 0;
          const availableQuantity = Number(item.available_quantity) || Math.max(0, totalQuantity - reservedQuantity);
          
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

        setEquipment(formattedEquipment);
      } else {
        toast.error("Error fetching equipment: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
      toast.error("An error occurred while fetching equipment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEquipments();
  }, []);

  const filteredEquipment = equipment.filter(item => 
    searchQuery === '' || 
    item.equipment_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredEquipment.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEquipment = filteredEquipment.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setTimeout(() => {
      if (isMobile && firstEquipmentRef.current) {
        firstEquipmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col h-full ${isMobile ? 'p-1' : 'p-3'}`}
    >
      {/* Fixed Header Section */}
      <div className={`
        flex flex-col gap-3
        bg-white/80 backdrop-blur-sm rounded-lg shadow-sm
        ${isMobile ? 'p-3 mb-2' : 'p-4 mb-3'}
        sticky top-0 z-10
        border border-gray-100/20
      `}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1">
            <h2 className={`
              font-semibold text-gray-900
              ${isMobile ? 'text-base' : 'text-lg'}
            `}>
              {Object.values(equipmentQuantities).filter(qty => qty > 0).length > 0
                ? `Selected Equipment (${Object.values(equipmentQuantities).filter(qty => qty > 0).length})`
                : 'Available Equipment'}
            </h2>
            <p className={`
              text-gray-600 mt-0.5
              ${isMobile ? 'text-xs' : 'text-sm'}
            `}>
              {Object.values(equipmentQuantities).filter(qty => qty > 0).length > 0
                ? 'Equipment availability is calculated based on existing reservations'
                : 'Select equipment to proceed'}
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className={`${isMobile ? 'mt-1' : 'mt-2'}`}>
          <Input
            placeholder="Search equipment by name..."
            prefix={<SearchOutlined className="text-gray-400" />}
            onChange={(e) => handleSearch(e.target.value)}
            value={searchQuery}
            className="w-full"
            size={isMobile ? 'middle' : 'large'}
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
              {currentEquipment.map((item, idx) => (
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
                  isMobile={isMobile}
                  currentQuantity={equipmentQuantities[item.equipment_id] || 0}
                  onQuantityChange={handleEquipmentQuantityChange}
                  ref={idx === 0 ? firstEquipmentRef : undefined}
                />
              ))}
            </div>

            {filteredEquipment.length === 0 && (
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
                  className={`bg-white/80 backdrop-blur-sm rounded-lg shadow-sm ${isMobile ? 'p-4' : 'p-6'} border border-gray-100/20`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Fixed Pagination Section */}
      {filteredEquipment.length > 0 && (
        <div className={`
          bg-white/80 backdrop-blur-sm rounded-lg shadow-sm
          ${isMobile ? 'p-2 mt-1' : 'p-3 mt-2'}
          sticky bottom-0 z-10
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

      {/* Summary Footer */}
      {Object.values(equipmentQuantities).filter(qty => qty > 0).length > 0 && (
        <div className={`
          sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-100/20 shadow-lg
          ${isMobile ? 'p-2' : 'p-3'}
        `}>
          <div className="flex items-center justify-between">
            <div className={`
              font-medium text-gray-600
              ${isMobile ? 'text-xs' : 'text-sm'}
            `}>
              Selected Items: <span className="text-green-500 font-semibold">
                {Object.values(equipmentQuantities).filter(qty => qty > 0).length}
              </span>
            </div>
            <div className={`
              font-medium text-gray-600
              ${isMobile ? 'text-xs' : 'text-sm'}
            `}>
              Total Quantity: <span className="text-green-500 font-semibold">
                {Object.values(equipmentQuantities).reduce((sum, qty) => sum + qty, 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ResourceEquipment;