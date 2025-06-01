import React from 'react';
import { motion } from 'framer-motion';
import { Alert, Card, Typography, Row, Col, Divider, Button, Tag, Image, Spin, Space } from 'antd';
import { PrinterOutlined, BankOutlined, CarOutlined, UserOutlined, TeamOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { FaTools, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { format } from 'date-fns';
import { Button as AntButton } from 'antd';

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
  handlePrintRequest
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

  // Get the correct equipment data based on resource type
  const selectedEquipment = formData.resourceType === 'equipment' 
    ? equipmentQuantities 
    : selectedVenueEquipment;

  console.log('Selected Equipment Data:', {
    resourceType: formData.resourceType,
    selectedEquipment,
    equipment
  });

  // Helper function to get equipment details
  const getEquipmentDetails = (equipId) => {
    return equipment?.find(e => e.equipment_id?.toString() === equipId?.toString()) || null;
  };

  // Helper function for formatting date ranges
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Not specified';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDate = (date) => {
      return format(date, 'MMM dd, yyyy');
    };
    
    const formatTime = (date) => {
      return format(date, 'h:mm a');
    };
    
    if (formatDate(start) === formatDate(end)) {
      // Same day
      return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`;
    } else {
      // Different days
      return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
    }
  };

  // Update the equipment section to use selectedEquipment
  const renderEquipmentSection = () => (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <FaTools className="text-blue-500" />
        <Text strong className="text-lg">Equipment Details</Text>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(selectedEquipment || {}).map(([equipId, quantity]) => {
          const equip = equipment?.find(e => 
            e.equip_id?.toString() === equipId?.toString()
          );
          
          if (!equip) {
            return (
              <Card key={equipId} className="hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FaTools className="text-gray-400 text-xl" />
                  </div>
                  <div>
                    <Text strong className="block">Equipment #{equipId}</Text>
                    <Tag color="blue">Qty: {quantity}</Tag>
                  </div>
                </div>
              </Card>
            );
          }

          return (
            <Card key={equipId} className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img
                    src={equip.equipment_pic ? `http://localhost/coc/gsd/${equip.equipment_pic}` : '/default-equipment.jpg'}
                    alt={equip.equip_name || `Equipment ${equipId}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/default-equipment.jpg';
                      e.target.onerror = null;
                    }}
                  />
                </div>
                <div>
                  <Text strong className="block">{equip.equip_name}</Text>
                  <Tag color="blue">Qty: {quantity}</Tag>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <motion.div
      {...fadeInAnimation}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <Alert
        message="Review Your Reservation"
        description="Please review all details carefully before submitting. You won't be able to modify them after submission."
        type="info"
        showIcon
        className="mb-6"
      />
      
      <Card className="rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={4} className="m-0">Reservation Summary</Title>
            <Text type="secondary" className="text-sm">Review and confirm your reservation details</Text>
          </div>
          <AntButton 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={handlePrintRequest}
            className="bg-blue-500"
          >
            Print Preview
          </AntButton>
        </div>
        
        <Divider className="my-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Resource Type and Date/Time Section */}
          <Card className="bg-gray-50">
            <Space direction="vertical" size="large" className="w-full">
              <div>
                <Text type="secondary" className="text-sm">Resource Type</Text>
                <div className="flex items-center mt-1">
                  {formData.resourceType === 'venue' ? (
                    <><BankOutlined className="text-blue-500 mr-2" /> <Text strong>Venue</Text></>
                  ) : formData.resourceType === 'vehicle' ? (
                    <><CarOutlined className="text-blue-500 mr-2" /> <Text strong>Vehicle</Text></>
                  ) : (
                    <><FaTools className="text-blue-500 mr-2" /> <Text strong>Equipment</Text></>
                  )}
                </div>
              </div>
              
              <div>
                <Text type="secondary" className="text-sm">Date & Time</Text>
                <div className="flex items-center mt-1">
                  <CalendarOutlined className="text-blue-500 mr-2" />
                  <Text strong>{formatDateRange(formData.startDate, formData.endDate)}</Text>
                </div>
              </div>
            </Space>
          </Card>

          {/* Resource specific details */}
          {formData.resourceType === 'venue' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <BankOutlined className="text-blue-500 text-xl" />
                <Text strong className="text-lg">Selected Venues ({selectedVenues.length})</Text>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVenues.map(venue => (
                  <Card key={venue.ven_id} className="hover:shadow-md transition-shadow">
                    <div className="space-y-4">
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <img
                          src={venue.ven_pic ? `http://localhost/coc/gsd/${venue.ven_pic}` : '/default-venue.jpg'}
                          alt={venue.ven_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/default-venue.jpg';
                            e.target.onerror = null;
                          }}
                        />
                        <Tag color="blue" className="absolute top-2 right-2">
                          Capacity: {venue.ven_occupancy}
                        </Tag>
                      </div>
                      <div>
                        <Text strong className="text-lg block">{venue.ven_name}</Text>
                        <Text type="secondary" className="text-sm">{venue.ven_description}</Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card>
                  <Text type="secondary" className="text-sm">Event</Text>
                  <Text strong className="text-lg block mt-1">{formData.eventTitle}</Text>
                </Card>
                <Card>
                  <Text type="secondary" className="text-sm">Participants</Text>
                  <Text strong className="text-lg block mt-1">{formData.participants}</Text>
                </Card>
              </div>

              {renderEquipmentSection()}
            </div>
          ) : formData.resourceType === 'vehicle' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <CarOutlined className="text-blue-500 text-xl" />
                <Text strong className="text-lg">Selected Vehicles ({selectedVehicleDetails.length})</Text>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVehicleDetails.map(vehicle => (
                  <Card key={vehicle.vehicle_id} className="hover:shadow-md transition-shadow">
                    <div className="space-y-4">
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <img
                          src={vehicle.vehicle_pic ? `http://localhost/coc/gsd/${vehicle.vehicle_pic}` : '/default-vehicle.jpg'}
                          alt={`${vehicle.vehicle_make_name} ${vehicle.vehicle_model_name}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/default-vehicle.jpg';
                            e.target.onerror = null;
                          }}
                        />
                        <Tag color="blue" className="absolute top-2 right-2">
                          {vehicle.vehicle_license}
                        </Tag>
                      </div>
                      <div>
                        <Text strong className="text-lg block">
                          {vehicle.vehicle_make_name} {vehicle.vehicle_model_name}
                        </Text>
                        <Text type="secondary" className="text-sm">{vehicle.vehicle_description}</Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card>
                  <Text type="secondary" className="text-sm">Purpose</Text>
                  <Text strong className="text-lg block mt-1">{formData.purpose}</Text>
                </Card>
                <Card>
                  <Text type="secondary" className="text-sm">Destination</Text>
                  <Text strong className="text-lg block mt-1">{formData.destination}</Text>
                </Card>
              </div>

              <Card className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <TeamOutlined className="text-blue-500" />
                  <Text strong className="text-lg">Passengers ({formData.passengers.length})</Text>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {formData.passengers.map((passenger, index) => (
                    <div key={passenger.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <UserOutlined className="text-blue-500" />
                      <Text>{passenger.name}</Text>
                    </div>
                  ))}
                </div>
              </Card>

              {renderEquipmentSection()}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <FaTools className="text-blue-500 text-xl" />
                <Text strong className="text-lg">Equipment Details</Text>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <Text type="secondary" className="text-sm">Purpose</Text>
                  <Text strong className="text-lg block mt-1">{formData.eventTitle}</Text>
                </Card>
                <Card>
                  <Text type="secondary" className="text-sm">Description</Text>
                  <Text strong className="text-lg block mt-1">{formData.description}</Text>
                </Card>
              </div>

              {renderEquipmentSection()}
            </div>
          )}
        </div>
        
        <Divider className="my-6" />
        
        <div className="flex justify-between mt-6">
          <AntButton 
            onClick={handleBack}
            icon={<FaTimes className="mr-1" />}
            size="large"
          >
            Back
          </AntButton>
          <AntButton 
            type="primary" 
            onClick={handleAddReservation}
            loading={loading}
            icon={<FaCheckCircle className="mr-1" />}
            className="bg-blue-500"
            size="large"
          >
            Confirm Reservation
          </AntButton>
        </div>
      </Card>
    </motion.div>
  );
};

export default ReviewSection;
