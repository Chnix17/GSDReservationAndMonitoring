import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Select, Button, Tag, Alert } from 'antd';
import axios from 'axios';
import { toast } from 'sonner';
import { SecureStorage } from '../../../utils/encryption';
import { useNavigate } from 'react-router-dom';

const AssignModal = ({ 
  isOpen, 
  onClose, 
  selectedReservation, 
  onSuccess
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    personnel: '',
    checklists: []
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState([]);
  const [itemsWithoutChecklist, setItemsWithoutChecklist] = useState([]);
  const baseUrl = SecureStorage.getLocalItem("url");

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/user.php`, {
        operation: 'fetchPersonnel'
      });

      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        const formattedPersonnel = response.data.data.map(person => ({
          users_id: person.users_id,
          full_name: person.full_name,
          jo_personel_id: person.jo_personel_id,
          position: person.position || 'N/A'
        }));
        setPersonnel(formattedPersonnel);
      } else {
        console.error('Invalid data format received:', response.data);
        toast.error('Failed to fetch personnel data');
      }
    } catch (error) {
      console.error('Error fetching personnel:', error);
      toast.error('Error fetching personnel data');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const fetchReservationDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/user.php`, {
        operation: 'getReservedById',
        reservation_id: selectedReservation.id
      });

      if (response.data.status === 'success') {
        const { data } = response.data;
        let checklists = [];
        let noChecklistItems = [];
        
        // Process venues
        if (data.venues && data.venues.length > 0) {
          data.venues.forEach(venue => {
            if (venue.checklists && venue.checklists.length > 0) {
              const venueItems = venue.checklists.map(item => ({
                id: item.checklist_venue_id,
                name: item.checklist_name,
                type: 'venue',
                reservation_venue_id: venue.reservation_venue_id,
                description: item.checklist_description || '',
                status: 'pending'
              }));
              checklists.push({
                category: `Venue: ${venue.name}`,
                items: venueItems
              });
            } else {
              noChecklistItems.push({
                type: 'venue',
                name: venue.name,
                id: venue.venue_id
              });
            }
          });
        }

        // Process equipment
        if (data.equipments && data.equipments.length > 0) {
          data.equipments.forEach(equipment => {
            if (equipment.checklists && equipment.checklists.length > 0) {
              const equipmentItems = equipment.checklists.map(item => ({
                id: item.checklist_equipment_id,
                name: item.checklist_name,
                type: 'equipment',
                reservation_equipment_id: equipment.reservation_equipment_id,
                description: item.checklist_description || '',
                status: 'pending'
              }));
              checklists.push({
                category: `Equipment: ${equipment.name} (Qty: ${equipment.quantity})`,
                items: equipmentItems
              });
            } else {
              noChecklistItems.push({
                type: 'equipment',
                name: equipment.name,
                id: equipment.equipment_id
              });
            }
          });
        }

        // Process vehicles
        if (data.vehicles && data.vehicles.length > 0) {
          data.vehicles.forEach(vehicle => {
            if (vehicle.checklists && vehicle.checklists.length > 0) {
              const vehicleItems = vehicle.checklists.map(item => ({
                id: item.checklist_vehicle_id,
                name: item.checklist_name,
                type: 'vehicle',
                reservation_vehicle_id: vehicle.reservation_vehicle_id,
                description: item.checklist_description || '',
                status: 'pending'
              }));
              checklists.push({
                category: `Vehicle: ${vehicle.model || 'N/A'} (License: ${vehicle.license || 'N/A'})`,
                items: vehicleItems
              });
            } else {
              noChecklistItems.push({
                type: 'vehicle',
                name: vehicle.model || 'N/A',
                id: vehicle.vehicle_id
              });
            }
          });
        }

        setItemsWithoutChecklist(noChecklistItems);
        setFormData({
          personnel: '',
          checklists: checklists
        });
      } else {
        toast.error('Failed to fetch reservation details');
      }
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      toast.error('Error fetching reservation details');
      setFormData({ personnel: '', checklists: [] });
    } finally {
      setLoading(false);
    }
  }, [baseUrl, selectedReservation]);

  useEffect(() => {
    if (isOpen) {
      fetchPersonnel();
      if (selectedReservation) {
        fetchReservationDetails();
      }
    }
  }, [isOpen, selectedReservation, fetchPersonnel, fetchReservationDetails]);

  const handleAssign = async () => {
    setErrorMessage('');
    if (!formData.personnel) {
      setErrorMessage('Please select a personnel');
      return;
    }

    const selectedPersonnelObj = personnel.find(p => p.full_name === formData.personnel);
    if (!selectedPersonnelObj) {
      setErrorMessage('Selected personnel not found');
      return;
    }

    setLoading(true);
    try {
      const checklistIds = [];

      formData.checklists.forEach(category => {
        category.items.forEach(item => {
          const entry = {
            type: item.type,
            checklist_id: item.id
          };

          switch (item.type) {
            case 'venue':
              entry.reservation_venue_id = item.reservation_venue_id;
              break;
            case 'equipment':
              entry.reservation_equipment_id = item.reservation_equipment_id;
              break;
            case 'vehicle':
              entry.reservation_vehicle_id = item.reservation_vehicle_id;
              break;
            default:
              break;
          }

          checklistIds.push(entry);
        });
      });

      const payload = {
        operation: 'saveChecklist',
        data: {
          admin_id: SecureStorage.getSessionItem("user_id"),
          personnel_id: selectedPersonnelObj.users_id,
          checklist_ids: checklistIds
        }
      };

      const response = await axios.post(`${baseUrl}/fetch2.php`, payload);

      if (response.data.status === 'success') {
        onSuccess({
          ...selectedReservation,
          personnel: formData.personnel,
          status: 'Assigned'
        });
        
        onClose();
        setFormData({ personnel: '', checklists: [] });
        setErrorMessage('');
        toast.success('Personnel assigned successfully!');
      } else {
        setErrorMessage('Failed to assign personnel. Please try again.');
        toast.error('Failed to assign personnel');
      }
    } catch (error) {
      console.error('Error assigning personnel:', error);
      setErrorMessage(error.message || 'An error occurred while assigning personnel.');
      toast.error('An error occurred while assigning personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({ personnel: '', checklists: [] });
    setErrorMessage('');
  };

  const handleNavigateToChecklist = () => {
    navigate('/Checklist');
  };

  return (
    <Modal
      title={
        <div className="text-xl font-bold text-green-900">
          Assign Personnel
          {selectedReservation && (
            <div className="text-sm font-normal text-gray-500 mt-1">
              Reservation: {selectedReservation.name}
            </div>
          )}
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleAssign}
          className="bg-green-900 hover:bg-lime-900"
          disabled={itemsWithoutChecklist.length > 0}
        >
          Assign Personnel
        </Button>
      ]}
      width={600}
      className="assignment-modal"
      centered
    >
      <Form layout="vertical" className="mt-4">
        {itemsWithoutChecklist.length > 0 && (
          <Alert
            message="Items Without Checklists"
            description={
              <div>
                <p>The following items have no checklists:</p>
                <ul className="list-disc ml-4 mt-2">
                  {itemsWithoutChecklist.map((item, index) => (
                    <li key={index}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}: {item.name}
                    </li>
                  ))}
                </ul>
                <Button 
                  type="link" 
                  onClick={handleNavigateToChecklist}
                  className="p-0 mt-2"
                >
                  Go to Checklist Management
                </Button>
              </div>
            }
            type="warning"
            showIcon
            className="mb-4"
          />
        )}
        
        <Form.Item 
          label="Select Personnel" 
          validateStatus={errorMessage ? "error" : ""}
          help={errorMessage}
          required
        >
          <Select
            value={formData.personnel}
            onChange={(value) => setFormData({...formData, personnel: value})}
            placeholder="Select personnel"
            className="w-full"
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {personnel.map((person) => (
              <Select.Option key={person.users_id} value={person.full_name}>
                {person.full_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Checklists">
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto border border-gray-200">
            {formData.checklists.length > 0 ? (
              formData.checklists.map((categoryList, categoryIndex) => (
                <div key={categoryIndex} className="mb-4">
                  <h4 className="font-medium text-green-900 sticky top-0 bg-gray-50 py-1 border-b border-gray-200 mb-2">
                    {categoryList.category}
                  </h4>
                  {categoryList.items.map((checklist, index) => (
                    <div key={index} className="flex items-center py-1.5 px-2 hover:bg-gray-100 rounded-md ml-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{checklist.name}</span>
                        {checklist.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{checklist.description}</p>
                        )}
                      </div>
                      <Tag color={checklist.status === 'completed' ? 'success' : 'warning'} className="ml-2">
                        {checklist.status}
                      </Tag>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-20 text-gray-500 italic">
                No checklists available
              </div>
            )}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignModal;
