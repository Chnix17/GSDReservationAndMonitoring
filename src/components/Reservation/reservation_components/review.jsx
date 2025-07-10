import React from 'react';
import { motion } from 'framer-motion';
import { Typography, Divider, Tag } from 'antd';
import { BankOutlined, CarOutlined, UserOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { FaTools } from 'react-icons/fa';
import { format, isValid, parseISO } from 'date-fns';

const { Title, Text } = Typography;

const fadeInAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: "easeInOut" }
};

const ReviewSection = ({
  formData,
  selectedVenues,
  selectedVehicleDetails,
  selectedVenueEquipment,
  equipmentQuantities,
  equipment,
  isMobile,
  loading,
  handleBack,
  handleAddReservation,
  handlePrintRequest,
  availableDrivers
}) => {
  // Add debug logging
  console.log('ReviewSection Props:', {
    formData,
    selectedVenues,
    selectedVehicleDetails,
    selectedVenueEquipment,
    equipmentQuantities,
    equipment,
    isMobile,
    loading
  });

  // Debug date values specifically
  console.log('Date debugging:', {
    startDate: formData.startDate,
    startDateType: typeof formData.startDate,
    startDateInstance: formData.startDate instanceof Date,
    endDate: formData.endDate,
    endDateType: typeof formData.endDate,
    endDateInstance: formData.endDate instanceof Date,
  });

  // Get the correct equipment data based on resource type
  const selectedEquipment = formData.resourceType === 'equipment' 
    ? equipmentQuantities 
    : selectedVenueEquipment;

  console.log('Selected Equipment Data:', {
    resourceType: formData.resourceType,
    selectedEquipment,
    equipment
  });

  // Helper function to safely format dates
  const safeFormatDate = (dateInput) => {
    if (!dateInput) return 'Not specified';
    try {
      let date;
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        date = parseISO(dateInput);
      } else {
        date = new Date(dateInput);
      }
      if (!isValid(date)) {
        return 'Invalid date';
      }
      return format(date, 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Render resources section without extra wrapper divs
  const renderResourcesSection = () => {
    if (formData.resourceType === 'venue') {
      return <>
        <div className="flex items-center gap-2 mb-4">
          <BankOutlined className="text-blue-500" />
          <Text strong className="text-lg">Selected Venues ({selectedVenues.length})</Text>
        </div>
        <div className="space-y-3">
          {selectedVenues.map(venue => (
            <div key={venue.ven_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Text strong className="text-lg block">{venue.ven_name}</Text>
                <Text type="secondary" className="text-sm">{venue.ven_description}</Text>
              </div>
            </div>
          ))}
        </div>
        {Object.keys(selectedEquipment || {}).length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4 mt-6">
              <FaTools className="text-blue-500" />
              <Text strong className="text-lg">Equipment</Text>
            </div>
            <div className="space-y-3">
              {Object.entries(selectedEquipment || {}).map(([equipId, quantity]) => {
                const equip = equipment?.find(e => e.equip_id?.toString() === equipId?.toString());
                return (
                  <div key={equipId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Text strong className="block">{equip?.equip_name || `Equipment #${equipId}`}</Text>
                    </div>
                    <Tag color="blue">Qty: {quantity}</Tag>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </>;
    } else if (formData.resourceType === 'vehicle') {
      return <>
        <div className="flex items-center gap-2 mb-4">
          <CarOutlined className="text-blue-500" />
          <Text strong className="text-lg">Selected Vehicles ({selectedVehicleDetails.length})</Text>
        </div>
        <div className="space-y-3">
          {selectedVehicleDetails.map(vehicle => {
            let driverName = null;
            if (formData.driverType === 'own' && Array.isArray(formData.ownDrivers)) {
              const driverObj = formData.ownDrivers.find(d => d.vehicle_id === vehicle.vehicle_id);
              driverName = driverObj ? driverObj.name : null;
            }
            return (
              <div key={vehicle.vehicle_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Text strong className="text-lg block">
                    {vehicle.vehicle_make_name} {vehicle.vehicle_model_name}
                  </Text>
                  <Text type="secondary" className="text-sm">{vehicle.vehicle_description}</Text>
                  {formData.driverType === 'own' && (
                    <div className="mt-1">
                      <Text type="secondary" className="text-xs">Assigned Driver: </Text>
                      <Text strong className="text-blue-700 text-xs">{driverName || 'No driver assigned'}</Text>
                    </div>
                  )}
                </div>
                <Tag color="blue">{vehicle.vehicle_license}</Tag>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mb-2 mt-6">
          <UserOutlined className="text-blue-500" />
          <Text strong className="text-lg">Driver</Text>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          {formData.driverType === 'own' && Array.isArray(formData.ownDrivers) && formData.ownDrivers.length > 0 ? (
            <div>
              {formData.ownDrivers.map((driver, idx) => (
                <Text key={driver.vehicle_id || idx} strong className="text-blue-700 block">
                  {driver.name} {driver.vehicle_id ? `- Vehicle: ${(() => { const v = selectedVehicleDetails.find(veh => veh.vehicle_id === driver.vehicle_id); return v ? `${v.vehicle_make_name} ${v.vehicle_model_name} (${v.vehicle_license})` : '' })()}` : ''}
                </Text>
              ))}
            </div>
          ) : formData.driverType === 'default' ? (
            <Text strong className="text-blue-700">Default driver will be assigned by admin.</Text>
          ) : (
            <Text type="secondary">No driver selected</Text>
          )}
        </div>
        <div className="flex items-center gap-2 mb-4 mt-6">
          <TeamOutlined className="text-blue-500" />
          <Text strong className="text-lg">Passengers ({formData.passengers.length})</Text>
        </div>
        <div className="space-y-2">
          {formData.passengers.map((passenger, index) => (
            <div key={passenger.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <UserOutlined className="text-blue-500" />
              <Text>{passenger.name}</Text>
            </div>
          ))}
        </div>
        {Object.keys(selectedEquipment || {}).length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4 mt-6">
              <FaTools className="text-blue-500" />
              <Text strong className="text-lg">Equipment</Text>
            </div>
            <div className="space-y-3">
              {Object.entries(selectedEquipment || {}).map(([equipId, quantity]) => {
                const equip = equipment?.find(e => e.equip_id?.toString() === equipId?.toString());
                return (
                  <div key={equipId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Text strong className="block">{equip?.equip_name || `Equipment #${equipId}`}</Text>
                    </div>
                    <Tag color="blue">Qty: {quantity}</Tag>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </>;
    } else {
      // Equipment only
      return <>
        <div className="flex items-center gap-2 mb-4">
          <FaTools className="text-blue-500" />
          <Text strong className="text-lg">Equipment Details</Text>
        </div>
        <div className="space-y-3">
          {Object.entries(equipmentQuantities || {}).map(([equipId, quantity]) => {
            const equip = equipment?.find(e => e.equip_id?.toString() === equipId?.toString());
            return (
              <div key={equipId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Text strong className="block">{equip?.equip_name || `Equipment #${equipId}`}</Text>
                </div>
                <Tag color="blue">Qty: {quantity}</Tag>
              </div>
            );
          })}
        </div>
      </>;
    }
  };

  return (
    <motion.div {...fadeInAnimation} className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={4} className="m-0">Review</Title>
          <Text type="secondary" className="text-sm">Review and confirm your reservation details</Text>
        </div>
      </div>
      <Divider className="my-4" />
      {/* Section 1: Reservation Request */}
      <div className="mb-8">
        <Title level={5} className="mb-4">Reservation Request</Title>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.resourceType === 'vehicle' ? (
              <>
                <div>
                  <Text type="secondary" className="text-sm">Purpose</Text>
                  <Text strong className="text-lg block mt-1">
                    {formData.purpose || 'No purpose specified'}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" className="text-sm">Destination</Text>
                  <div className="flex items-center mt-1">
                    <Text strong className="text-lg block mt-1">
                      {formData.destination || 'No destination specified'}
                    </Text>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Text type="secondary" className="text-sm">Title</Text>
                  <Text strong className="text-lg block mt-1">
                    {formData.eventTitle}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" className="text-sm">Description</Text>
                  <div className="flex items-center mt-1">
                    <Text strong className="text-lg block mt-1">
                      {formData.description || 'No description'}
                    </Text>
                  </div>
                </div>
              </>
            )}
            <div>
              <Text type="secondary" className="text-sm">Start Date & Time</Text>
              <div className="flex items-center mt-1">
                <CalendarOutlined className="text-blue-500 mr-2" />
                <Text strong>
                  {formData.startDate ? safeFormatDate(formData.startDate) : 'Please select a start date'}
                </Text>
              </div>
            </div>
            <div>
              <Text type="secondary" className="text-sm">End Date & Time</Text>
              <div className="flex items-center mt-1">
                <CalendarOutlined className="text-blue-500 mr-2" />
                <Text strong>
                  {formData.endDate ? safeFormatDate(formData.endDate) : 'Please select an end date'}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Divider className="my-6" />
      {/* Section 2: Resources */}
      <div className="mb-8">
        <Title level={5} className="mb-4">Resources</Title>
        {renderResourcesSection()}
      </div>
      <Divider className="my-6" />
    </motion.div>
  );
};

export default ReviewSection;
