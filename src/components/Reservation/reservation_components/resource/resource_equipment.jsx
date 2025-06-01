import React, { useState, useEffect } from 'react';
import { Empty, Alert, Button, Input, Pagination } from 'antd';
import { motion } from 'framer-motion';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { SecureStorage } from '../../../../utils/encryption';

const fadeInAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

const ResourceEquipment = ({ 
  equipmentQuantities,
  onQuantityChange,
  isMobile,
  startDate,
  endDate
}) => {
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
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
    equipmentSearch === '' || 
    item.equipment_name.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  // Calculate pagination
  const totalItems = filteredEquipment.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEquipment = filteredEquipment.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of equipment section
    document.getElementById('equipment-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderEquipmentCard = (item) => {
    const availableQuantity = parseInt(item.available_quantity) || 0;
    const isAvailable = availableQuantity > 0;
    const currentQuantity = equipmentQuantities[item.equipment_id] || 0;
    
    return (
      <motion.div
        key={item.equipment_id}
        whileHover={{ scale: 1.02 }}
        className={`
          bg-white rounded-lg shadow-sm border transition-all duration-200
          ${currentQuantity > 0 ? 'border-blue-400 shadow-md' : 'border-gray-100'}
        `}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-medium text-gray-800">{item.equipment_name}</h3>
              <p className="text-sm text-gray-500">Available: {availableQuantity}</p>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                type="text"
                icon={<MinusOutlined />}
                onClick={() => handleEquipmentQuantityChange(item.equipment_id, Math.max(0, currentQuantity - 1))}
                disabled={!isAvailable || currentQuantity === 0}
                className={`h-8 w-8 flex items-center justify-center ${
                  currentQuantity > 0 ? 'text-blue-500 hover:text-blue-600' : 'text-gray-400'
                }`}
              />
              <span className="w-10 text-center font-medium text-gray-700">
                {currentQuantity}
              </span>
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => handleEquipmentQuantityChange(item.equipment_id, currentQuantity + 1)}
                disabled={!isAvailable || currentQuantity >= availableQuantity}
                className={`h-8 w-8 flex items-center justify-center ${
                  isAvailable ? 'text-blue-500 hover:text-blue-600' : 'text-gray-400'
                }`}
              />
            </div>
          </div>
          
          {!isAvailable && (
            <div className="text-xs text-red-500 mt-2">
              Currently unavailable
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      {...fadeInAnimation}
      className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800">Equipment Selection</h3>
        
        <div className="w-full sm:w-80">
          <Input.Search
            placeholder="Search equipment by name..."
            value={equipmentSearch}
            onChange={e => {
              setEquipmentSearch(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full"
            allowClear
          />
        </div>
      </div>

      <Alert
        message="Equipment Availability"
        description="Equipment availability is calculated based on existing reservations. The available quantity shown is what you can reserve for your selected time period."
        type="info"
        showIcon
        className="shadow-sm"
      />
      
      <div id="equipment-section" className="mt-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <Empty
            description={
              <span className="text-gray-500">
                {equipmentSearch
                  ? `No equipment matching "${equipmentSearch}"`
                  : "No equipment available"}
              </span>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {currentEquipment.map(renderEquipmentCard)}
            </div>
            
            <div className="flex justify-center my-6">
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={itemsPerPage}
                onChange={handlePageChange}
                showSizeChanger={false}
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
              />
            </div>
          </>
        )}
      </div>
      
      <div className="sticky bottom-0 bg-white border-t shadow-lg p-4 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-gray-600">
              Selected Items: <span className="text-blue-500 font-semibold">
                {Object.values(equipmentQuantities).filter(qty => qty > 0).length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600">
              Total Quantity: <span className="text-blue-500 font-semibold">
                {Object.values(equipmentQuantities).reduce((sum, qty) => sum + qty, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourceEquipment;
