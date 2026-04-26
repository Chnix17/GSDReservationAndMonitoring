import React from 'react';
import { Form, Input, Button, Card, Empty, Typography } from 'antd';
import { UserOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { FaTimes } from 'react-icons/fa';
// removed framer-motion wrapper to avoid double container

const { TextArea } = Input;
const { Title } = Typography;

const BasicInformationForm = ({
  formData,
  handleInputChange,
  isMobile,
  // showEquipmentModal,
  // setShowEquipmentModal,
  selectedVenueEquipment,
  equipment,
  // showPassengerModal,
  setShowPassengerModal,
  handleRemovePassenger,
  renderDriverDropdown,
  selectedModels,
  vehicles,
  setFormData,
  venues = [], // Add venues as a prop (default empty array)
  venueParticipants = {}, // Per-venue participants object
  setVenueParticipants, // Function to update per-venue participants
}) => {
  // Clean up selectedVenueEquipment to remove non-existent equipment and adjust quantities
  React.useEffect(() => {
    console.log('=== Equipment Validation Start ===');
    console.log('Current resourceType:', formData.resourceType);
    console.log('Current selectedVenueEquipment:', selectedVenueEquipment);
    console.log('Available equipment:', equipment);
    
    if ((formData.resourceType === 'venue' || formData.resourceType === 'vehicle') && 
        selectedVenueEquipment && 
        Object.keys(selectedVenueEquipment).length > 0 && 
        equipment?.length > 0) {
      
      console.log('Processing equipment validation for:', formData.resourceType);
      const updatedEquipment = { ...selectedVenueEquipment };
      let hasChanges = false;
      
      // Check each selected equipment
      Object.entries(selectedVenueEquipment).forEach(([equipId, quantity]) => {
        console.log(`Checking equipment ${equipId} (qty: ${quantity})`);
        
        const equip = equipment.find(e => {
          const match = String(e.equip_id) === equipId || String(e.equipment_id) === equipId;
          if (match) {
            console.log('Found matching equipment:', {
              id: e.equip_id || e.equipment_id,
              name: e.equip_name || e.equipment_name,
              available: e.available_quantity,
              currentQty: quantity
            });
          }
          return match;
        });
        
        // If equipment doesn't exist or is unavailable, remove it
        if (!equip) {
          console.log(`Equipment ${equipId} not found in available equipment - removing`);
          delete updatedEquipment[equipId];
          hasChanges = true;
        } 
        // If quantity exceeds available, adjust it
        else if (quantity > (equip.available_quantity || 0)) {
          console.log(`Adjusting quantity for ${equipId} from ${quantity} to ${equip.available_quantity}`);
          updatedEquipment[equipId] = equip.available_quantity || 0;
          hasChanges = true;
        } else {
          console.log(`Equipment ${equipId} is valid (qty: ${quantity})`);
        }
      });
      
      // Clean up any equipment with quantity <= 0
      Object.keys(updatedEquipment).forEach(equipId => {
        if (updatedEquipment[equipId] <= 0) {
          console.log(`Removing equipment ${equipId} due to zero/negative quantity`);
          delete updatedEquipment[equipId];
          hasChanges = true;
        }
      });

      // If there were changes, update the state
      if (hasChanges) {
        console.log('Updating selectedVenueEquipment with changes:', updatedEquipment);
        setFormData(prev => ({
          ...prev,
          selectedVenueEquipment: updatedEquipment
        }));
      } else {
        console.log('No changes needed for selected equipment');
      }
    } else {
      console.log('Skipping equipment validation - conditions not met', {
        isVenueOrVehicle: formData.resourceType === 'venue' || formData.resourceType === 'vehicle',
        hasSelectedEquipment: selectedVenueEquipment && Object.keys(selectedVenueEquipment).length > 0,
        hasEquipmentList: equipment?.length > 0
      });
    }
    
    console.log('=== Equipment Validation End ===');
  }, [equipment, formData.resourceType, selectedVenueEquipment, setFormData]);

  // Calculate max capacity for selected venues - removed unused variable

  return (
    <Card className="shadow-sm border-0 p-4 sm:p-6">
      <Title level={isMobile ? 5 : 4} className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
        <InfoCircleOutlined />
        <span className="truncate">
          {formData.resourceType === 'venue' ? 'Venue Details' : 
           formData.resourceType === 'vehicle' ? 'Trip Details' : 
           'Equipment Details'}
        </span>
      </Title>
      <Form layout="vertical" className="vehicle-form space-y-6">
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

            {/* Per-Venue Participants Section */}
            <Form.Item
              label={<span className="text-sm">Number of Participants per Venue <span className="text-red-500">*</span></span>}
              required
            >
              {formData.venues && formData.venues.length > 0 ? (
                <div className="space-y-3">
                  {formData.venues.map(venueId => {
                    const venue = venues.find(v => String(v.ven_id) === String(venueId));
                    if (!venue) return null;
                    
                    const minCapacity = parseInt(venue.ven_minimum, 10) || 1;
                    const maxCapacity = parseInt(venue.ven_occupancy, 10) || 0;
                    const currentValue = venueParticipants[venueId] || '';
                    const isInvalid = currentValue === '' || 
                                     parseInt(currentValue) < minCapacity || 
                                     (maxCapacity > 0 && parseInt(currentValue) > maxCapacity);
                    
                    return (
                      <div key={venueId} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-gray-900">{venue.ven_name}</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {venue.event_type} • {venue.area_type}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 text-right">
                            <div>Min: {minCapacity}</div>
                            <div>Max: {maxCapacity}</div>
                          </div>
                        </div>
                        <Input
                          type="number"
                          min={minCapacity}
                          max={maxCapacity}
                          value={currentValue}
                          onChange={e => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            // Prevent leading zeros
                            if (val.length > 1 && val.startsWith('0')) {
                              val = val.replace(/^0+/, '');
                            }
                            // Cap at max capacity if set
                            if (maxCapacity > 0 && val !== '' && parseInt(val) > maxCapacity) {
                              val = maxCapacity.toString();
                            }
                            setVenueParticipants(prev => ({
                              ...prev,
                              [venueId]: val
                            }));
                          }}
                          className="rounded"
                          size={isMobile ? 'middle' : 'large'}
                          placeholder={`Enter ${minCapacity}-${maxCapacity} participants`}
                          status={isInvalid ? 'error' : undefined}
                        />
                        {isInvalid && currentValue !== '' && (
                          <div className="text-xs text-red-500 mt-1">
                            {parseInt(currentValue) < minCapacity 
                              ? `Minimum ${minCapacity} participant${minCapacity > 1 ? 's' : ''} required`
                              : `Maximum ${maxCapacity} participant${maxCapacity > 1 ? 's' : ''} allowed`}
                          </div>
                        )}
                        {currentValue === '' && (
                          <div className="text-xs text-red-500 mt-1">
                            Please enter number of participants
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-gray-500">
                      Please select venue(s) first to enter participant counts.
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
            {/* Trip & Driver Section */}
            <section className="space-y-4">
            

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
                  <TextArea
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    rows={isMobile ? 2 : 3}
                    className="rounded"
                    placeholder="Enter trip destination"
                  />
                </Form.Item>
              </div>

              <div className="mt-2">
                {/* <h5 className="text-sm font-medium text-gray-700 mb-2">Driver Selection</h5> */}
                <div className="driver-grid grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {renderDriverDropdown(selectedModels || [], vehicles || [], setFormData)}
                </div>
              </div>
            </section>

            {/* Passengers Section */}
            <section className="mt-6">
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
                  <ul className="border rounded-lg divide-y bg-gray-50 border-gray-200">
                    {formData.passengers.map((passenger, index) => (
                      <li key={passenger.id} className="flex items-center justify-between p-3 hover:bg-gray-100 transition-colors">
                        <span className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">{index + 1}</span>
                          </span>
                          <UserOutlined className="text-primary-green" />
                          <span className="text-sm text-gray-800">{passenger.name}</span>
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

            {/* Additional Equipment Section - Hidden for vehicle */}
            {/* <section className="mt-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Additional Equipment</h4>
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
            </section> */}

            {/* Additional Note */}
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
  );
};

export default BasicInformationForm;
