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
                        className="text-blue-500 hover:text-blue-600"
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
                <Form.Item
                  label={<span className="text-sm">Purpose <span className="text-red-500">*</span></span>}
                  required
                >
                  <TextArea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    rows={isMobile ? 2 : 3}
                    className="rounded"
                    placeholder="Trip purpose"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-sm">Destination <span className="text-red-500">*</span></span>}
                  required
                >
                  <Input
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="rounded"
                    size={isMobile ? 'middle' : 'large'}
                    placeholder="Trip destination"
                  />
                </Form.Item>

                {renderDriverDropdown()}

                <Form.Item
                  label={
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Passengers <span className="text-red-500">*</span></span>
                      <Button
                        type="text"
                        onClick={() => setShowPassengerModal(true)}
                        icon={<PlusOutlined />}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Add Passenger
                      </Button>
                    </div>
                  }
                  required
                >
                  {formData.passengers.length > 0 ? (
                    <div className="border rounded-lg divide-y">
                      {formData.passengers.map((passenger, index) => (
                        <div key={passenger.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">{index + 1}.</span>
                            <UserOutlined className="text-gray-400" />
                            <span>{passenger.name}</span>
                          </div>
                          <Button
                            type="text"
                            danger
                            icon={<FaTimes />}
                            onClick={() => handleRemovePassenger(passenger.id)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span className="text-gray-500">
                          No passengers added yet. Click "Add Passenger" to begin.
                        </span>
                      }
                    />
                  )}
                </Form.Item>

                {/* Add Equipment Button for Vehicle */}
                <Form.Item
                  label={
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Equipment</span>
                      <Button
                        type="text"
                        onClick={() => setShowEquipmentModal(true)}
                        icon={<FaTools />}
                        className="text-blue-500 hover:text-blue-600"
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
