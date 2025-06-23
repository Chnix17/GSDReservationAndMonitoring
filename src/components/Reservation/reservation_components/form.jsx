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
  renderDriverDropdown
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <Card className="shadow-sm border-0">
        <div className={`${isMobile ? 'p-3' : 'p-6'}`}>
          {/* Compact Header */}
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
              // Venue Fields
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
                  label={<span className="text-sm">Number of Participants</span>}
                >
                  <Input
                    name="participants"
                    value={formData.participants}
                    onChange={handleInputChange}
                    type="number"
                    min="0"
                    className="rounded"
                    size={isMobile ? 'middle' : 'large'}
                    placeholder="Enter number of participants (optional)"
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
                        <div className="border rounded-lg divide-y">
                            {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                            const equip = equipment?.find(e => {
                                const eId = e?.equipment_id;
                                const compareId = equipId;
                                return eId != null && compareId != null && String(eId) === String(compareId);
                            });
                            if (!equip) return null;
                            return (
                                <div key={equipId} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <FaTools className="text-gray-400" />
                                    <span>{equip.equipment_name || 'Unknown Equipment'}</span>
                                    <span className="text-gray-500">x{quantity}</span>
                                </div>
                                </div>
                            );
                            })}
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
              </>
            ) : formData.resourceType === 'vehicle' ? (
                // Vehicle Fields
                <>
                {/* Trip Information Section */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Trip Information</h4>
                  </div>
                  
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

                  {renderDriverDropdown()}
                </div>

                {/* Personnel Section */}
                <div className="space-y-4 mt-6">
                  <div className="border-b pb-2">
         
                  </div>
                  
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
                      <div className="border rounded-lg divide-y bg-green-50 border-green-200">
                        {formData.passengers.map((passenger, index) => (
                          <div key={passenger.id} className="flex items-center justify-between p-3 hover:bg-green-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-green-600">{index + 1}</span>
                              </div>
                              <UserOutlined className="text-green-500" />
                              <span className="text-sm text-green-700">{passenger.name}</span>
                            </div>
                            <Button
                              type="text"
                              danger
                              icon={<FaTimes />}
                              onClick={() => handleRemovePassenger(passenger.id)}
                              size="small"
                            />
                          </div>
                        ))}
                      </div>
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
                </div>

                {/* Equipment Section */}
                <div className="space-y-4 mt-6">
                  <div className="border-b pb-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Equipment</h4>
                  </div>
                  
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
                      <div className="border rounded-lg divide-y bg-gray-50">
                        {Object.entries(selectedVenueEquipment).map(([equipId, quantity]) => {
                          const equip = equipment?.find(e => {
                            const eId = e?.equipment_id;
                            const compareId = equipId;
                            return eId != null && compareId != null && String(eId) === String(compareId);
                          });
                          if (!equip) return null;
                          return (
                            <div key={equipId} className="flex items-center justify-between p-3 hover:bg-white transition-colors">
                              <div className="flex items-center gap-3">
                                <FaTools className="text-gray-400" />
                                <span className="text-sm">{equip.equipment_name || 'Unknown Equipment'}</span>
                                <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-medium">
                                  x{quantity}
                                </span>
                              </div>
                            </div>
                          );
                        })}
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
                </div>
                </>
              ) : (
              // Equipment Fields - Only title and description
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
              </>
            )}
          </Form>
        </div>
      </Card>
    </motion.div>
  );
};

export default BasicInformationForm;
