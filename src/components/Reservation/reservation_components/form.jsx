import React from 'react';
import { Form, Input, Button, Card, Empty, Typography } from 'antd';
import { UserOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { FaTools, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

const { TextArea } = Input;
const { Title } = Typography;

const BasicInformationForm = ({
  formData,
  handleInputChange,
  isMobile,
  showEquipmentModal,
  setShowEquipmentModal,
  selectedVenueEquipment,
  equipment,
  showPassengerModal,
  setShowPassengerModal,
  handleRemovePassenger,
  renderDriverDropdown,
  selectedModels,
  vehicles,
  setFormData,
  venues = [], // Add venues as a prop (default empty array)
}) => {
  // Debug logging
  console.log('BasicInformationForm props:', {
    formData: {
      driverType: formData.driverType,
      forceOwnDrivers: formData.forceOwnDrivers,
      forceMixedDrivers: formData.forceMixedDrivers,
      availableDrivers: formData.availableDrivers,
      totalVehicles: formData.totalVehicles,
      mixedDrivers: formData.mixedDrivers
    },
    selectedModels: selectedModels || [],
    vehicles: vehicles || [],
    venues: venues || []
  });

  // Calculate max capacity for selected venues
  let maxCapacity = 0;
  if (formData.resourceType === 'venue' && Array.isArray(formData.venues) && venues.length > 0) {
    maxCapacity = venues
      .filter(v => formData.venues.includes(v.ven_id))
      .reduce((sum, v) => sum + (parseInt(v.ven_occupancy) || 0), 0);
  }

  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-3"
  >
    <Card className="shadow-sm border-0 p-4 sm:p-6">
      <Title level={isMobile ? 5 : 4} className="mb-4 flex items-center gap-2">
        <InfoCircleOutlined />
        <span className="truncate">
          {formData.resourceType === 'venue' ? 'Venue Details' : 
           formData.resourceType === 'vehicle' ? 'Vehicle Details' : 
           'Equipment Details'}
        </span>
      </Title>

      <Form layout="vertical" className="space-y-3">
        {formData.resourceType === 'venue' ? (
          <>
            <Form.Item
              label={<span className="text-sm">Event Title <span className="text-red-500">*</span></span>}
              required
            >
              <Input
                name="eventTitle"
                value={formData.eventTitle}
                onChange={handleInputChange}
                className="rounded"
                size={isMobile ? 'middle' : 'large'}
                placeholder="Event title"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm">Description <span className="text-red-500">*</span></span>}
              required
            >
              <TextArea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={isMobile ? 3 : 4}
                className="rounded"
                placeholder="Event description"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm">Number of Participants <span className="text-red-500">*</span></span>}
              required
              validateStatus={
                formData.participants === '' ||
                (maxCapacity > 0 && parseInt(formData.participants) > maxCapacity)
                  ? 'error'
                  : undefined
              }
              help={
                maxCapacity > 0
                  ? `Maximum allowed: ${maxCapacity} participant${maxCapacity > 1 ? 's' : ''}`
                  : 'Select venue(s) to see capacity.'
              }
            >
              <Input
                name="participants"
                value={formData.participants}
                onChange={e => {
                  let val = e.target.value.replace(/[^0-9]/g, '');
                  if (maxCapacity > 0 && val !== '' && parseInt(val) > maxCapacity) {
                    val = maxCapacity.toString();
                  }
                  handleInputChange({
                    target: {
                      name: 'participants',
                      value: val
                    }
                  });
                }}
                type="number"
                min="1"
                max={maxCapacity > 0 ? maxCapacity : undefined}
                className="rounded"
                size={isMobile ? 'middle' : 'large'}
                placeholder={maxCapacity > 0 ? `Up to ${maxCapacity}` : 'Enter number of participants'}
                required
              />
            </Form.Item>

            <Form.Item
              label={
                <div className="flex justify-between items-center">
                  <span className="text-sm">Equipment</span>
                  <Button
                    type="text"
                    onClick={() => setShowEquipmentModal(true)}
                    icon={<FaTools />}
                    className="text-primary-green hover:text-primary-green-dark"
                  >
                    Add Equipment
                  </Button>
                </div>
              }
            >
              {Object.keys(selectedVenueEquipment).length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 shadow-inner">
                  <ul className="divide-y divide-gray-200">
                    {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                      const equip = equipment?.find(e => String(e?.equip_id) === String(equipId) || String(e?.equipment_id) === String(equipId));
                      if (!equip || quantity <= 0) return null;
                      
                      return (
                        <li 
                          key={equipId} 
                          className="p-3 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                              <FaTools className="text-green-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {equip.equipment_name || equip.equip_name || 'Unknown Equipment'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {equip.equipment_category_name || equip.category_name || 'No Category'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              Qty: {quantity}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-gray-500">
                      No equipment added yet. Click "Add Equipment" to begin.
                    </span>
                  }
                />
              )}
            </Form.Item>
            <Form.Item
              label={<span className="text-sm">Additional Note</span>}
            >
              <Input
                name="additionalNote"
                value={formData.additionalNote}
                onChange={handleInputChange}
                className="rounded"
                size={isMobile ? 'middle' : 'large'}
                placeholder="Enter any additional notes (optional)"
              />
            </Form.Item>
          </>
        ) : formData.resourceType === 'vehicle' ? (
          <>
            <section className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 border-b pb-2 mb-3">Trip Information</h4>
              
              <Form.Item
                label={<span className="text-sm font-medium">Purpose <span className="text-red-500">*</span></span>}
                required
              >
                <TextArea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  rows={isMobile ? 2 : 3}
                  className="rounded"
                  placeholder="Describe the purpose of your trip"
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-sm font-medium">Destination <span className="text-red-500">*</span></span>}
                required
              >
                <Input
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className="rounded"
                  size={isMobile ? 'middle' : 'large'}
                  placeholder="Enter trip destination"
                />
              </Form.Item>

              {renderDriverDropdown(selectedModels || [], vehicles || [], setFormData)}
            </section>

            <section className="space-y-4 mt-6">
              <Form.Item
                label={
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Passengers <span className="text-red-500">*</span></span>
                    <Button
                      type="text"
                      onClick={() => setShowPassengerModal(true)}
                      icon={<PlusOutlined />}
                      className="text-primary-green hover:text-primary-green-dark text-xs"
                      size="small"
                    >
                      Add Passenger
                    </Button>
                  </div>
                }
                required
              >
                {formData.passengers.length > 0 ? (
                  <ul className="border rounded-lg divide-y bg-green-50 border-green-200">
                    {formData.passengers.map((passenger, index) => (
                      <li key={passenger.id} className="flex items-center justify-between p-3 hover:bg-green-100 transition-colors">
                        <span className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-green-600">{index + 1}</span>
                          </span>
                          <UserOutlined className="text-green-500" />
                          <span className="text-sm text-green-700">{passenger.name}</span>
                        </span>
                        <Button
                          type="text"
                          danger
                          icon={<FaTimes />}
                          onClick={() => handleRemovePassenger(passenger.id)}
                          size="small"
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span className="text-gray-500 text-sm">
                        No passengers added yet. Click "Add Passenger" to begin.
                      </span>
                    }
                  />
                )}
              </Form.Item>
            </section>

            <section className="space-y-4 mt-6">
              <h4 className="text-sm font-medium text-gray-700 border-b pb-2 mb-3">Additional Equipment</h4>
              
              <Form.Item
                label={
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Equipment</span>
                    <Button
                      type="text"
                      onClick={() => setShowEquipmentModal(true)}
                      icon={<FaTools />}
                      className="text-primary-green hover:text-primary-green-dark text-xs"
                      size="small"
                    >
                      Add Equipment
                    </Button>
                  </div>
                }
              >
                {Object.keys(selectedVenueEquipment).length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 shadow-inner">
                    <ul className="divide-y divide-gray-200">
                      {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                        const equip = equipment?.find(e => String(e?.equip_id) === String(equipId) || String(e?.equipment_id) === String(equipId));
                        if (!equip || quantity <= 0) return null;
                        
                        return (
                          <li 
                            key={equipId} 
                            className="p-3 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                                <FaTools className="text-green-600" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">
                                  {equip.equipment_name || equip.equip_name || 'Unknown Equipment'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {equip.equipment_category_name || equip.category_name || 'No Category'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                Qty: {quantity}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span className="text-gray-500 text-sm">
                        No equipment added yet. Click "Add Equipment" to begin.
                      </span>
                    }
                  />
                )}
              </Form.Item>
            </section>
            <Form.Item
              label={<span className="text-sm">Additional Note</span>}
            >
              <Input
                name="additionalNote"
                value={formData.additionalNote}
                onChange={handleInputChange}
                className="rounded"
                size={isMobile ? 'middle' : 'large'}
                placeholder="Enter any additional notes (optional)"
              />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              label={<span className="text-sm">Title <span className="text-red-500">*</span></span>}
              required
            >
              <Input
                name="eventTitle"
                value={formData.eventTitle}
                onChange={handleInputChange}
                className="rounded"
                size={isMobile ? 'middle' : 'large'}
                placeholder="Purpose of equipment request"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm">Description <span className="text-red-500">*</span></span>}
              required
            >
              <TextArea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={isMobile ? 3 : 4}
                className="rounded"
                placeholder="Describe how you will use the equipment"
              />
            </Form.Item>
            <Form.Item
              label={<span className="text-sm">Additional Note</span>}
            >
              <Input
                name="additionalNote"
                value={formData.additionalNote}
                onChange={handleInputChange}
                className="rounded"
                size={isMobile ? 'middle' : 'large'}
                placeholder="Enter any additional notes (optional)"
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Card>
  </motion.div>
  );
};

export default BasicInformationForm;
