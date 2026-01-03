import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Select, Button, Tag, Alert, Drawer } from 'antd';
import { useMediaQuery } from 'react-responsive';
import axios from 'axios';
import { toast } from 'sonner';
import { SecureStorage } from '../../../utils/encryption';
// import { useNavigate } from 'react-router-dom';

const AssignModal = ({ 
  isOpen, 
  onClose, 
  selectedReservation, 
  onSuccess
}) => {
  // const navigate = useNavigate();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });
  // const isSmallScreen = useMediaQuery({ maxWidth: 1023 });
  const [formData, setFormData] = useState({
    personnel: '',
    checklists: []
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [personnel, setPersonnel] = useState([]);
  const [itemsWithoutChecklist, setItemsWithoutChecklist] = useState([]);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
    currentStatus: ''
  });
  const baseUrl = SecureStorage.getLocalItem("url");

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/Admin.php`, {
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
      if (!error.response || error.message === 'Network Error') {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else {
        toast.error('Error fetching personnel data');
      }
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const fetchReservationDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/Assigned&Records.php`, {
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
      if (!error.response || error.message === 'Network Error') {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else {
        toast.error('Error fetching reservation details');
      }
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
          admin_id: SecureStorage.getLocalItem("user_id"),
          personnel_id: selectedPersonnelObj.users_id,
          notification_reservation_reservation_id: selectedReservation.id,
          checklist_ids: checklistIds
        }
      };

      const response = await axios.post(`${baseUrl}/Assigned&Records.php`, payload);

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
        setErrorModal({
          visible: true,
          title: 'Assignment Failed',
          message: response.data.message || 'Failed to assign personnel. Please try again.',
          currentStatus: response.data.current_status || ''
        });
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error assigning personnel:', error);
      if (!error.response || error.message === 'Network Error') {
        toast.error('Network connection lost. Please check your internet connection and try again.');
        setErrorMessage('');
      } else {
        setErrorModal({
          visible: true,
          title: 'Assignment Error',
          message: error.message || 'An error occurred while assigning personnel.',
          currentStatus: ''
        });
        setErrorMessage('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({ personnel: '', checklists: [] });
    setErrorMessage('');
    setErrorModal({ visible: false, title: '', message: '', currentStatus: '' });
  };

  const handleErrorModalClose = () => {
    setErrorModal({ visible: false, title: '', message: '', currentStatus: '' });
  };

  const handleNavigateToChecklist = () => {
    const baseUrl = window.location.origin + '/gsd/grms';
    const fullUrl = baseUrl + '/Admin/Checklist';
    window.location.assign(fullUrl);
  };

  // Get responsive modal/drawer props
  const getModalProps = () => {
    if (isMobile) {
      return {
        placement: 'bottom',
        height: '90%',
        closable: true,
        maskClosable: false
      };
    }
    return {
      width: isTablet ? 700 : 800,
      centered: true,
      maskClosable: false
    };
  };

  // Get responsive footer
  const getFooter = () => {
    const buttons = [
      <Button 
        key="cancel" 
        onClick={handleClose}
        block={isMobile}
        size={isMobile ? "large" : "middle"}
        style={isMobile ? { marginBottom: '8px' } : {}}
      >
        Cancel
      </Button>,
      <Button 
        key="submit" 
        type="primary" 
        loading={loading} 
        onClick={handleAssign}
        className="bg-green-900 hover:bg-lime-900"
        disabled={itemsWithoutChecklist.length > 0}
        block={isMobile}
        size={isMobile ? "large" : "middle"}
      >
        Assign Personnel
      </Button>
    ];

    if (isMobile) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column-reverse',
          gap: '8px',
          padding: '16px 0'
        }}>
          {buttons}
        </div>
      );
    }

    return buttons;
  };

  // Get responsive title
  const getTitle = () => {
    const titleContent = (
      <div className={`font-bold text-green-900 ${
        isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-xl'
      }`}>
        Assign Personnel
        {selectedReservation && (
          <div className={`font-normal text-gray-500 mt-1 ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>
            Reservation: {selectedReservation.name}
          </div>
        )}
      </div>
    );
    return titleContent;
  };

  // Render content
  const renderContent = () => (
    <Form layout="vertical" className={isMobile ? "mt-2" : "mt-4"}>
      {itemsWithoutChecklist.length > 0 && (
        <Alert
          message="Items Without Checklists"
          description={
            <div>
              <p className={isMobile ? "text-sm" : ""}>
                The following items have no checklists:
              </p>
              <ul className={`list-disc ml-4 mt-2 ${
                isMobile ? "text-sm" : ""
              }`}>
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
                size={isMobile ? "small" : "middle"}
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
        label={<span className={isMobile ? "text-sm font-medium" : ""}>Select Personnel</span>}
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
          size={isMobile ? "large" : "middle"}
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

      <Form.Item label={<span className={isMobile ? "text-sm font-medium" : ""}>Checklists</span>}>
        <div className={`bg-gray-50 rounded-lg border border-gray-200 ${
          isMobile 
            ? "p-3 max-h-48" 
            : isTablet 
              ? "p-4 max-h-56" 
              : "p-4 max-h-60"
        } overflow-y-auto`}>
          {formData.checklists.length > 0 ? (
            formData.checklists.map((categoryList, categoryIndex) => (
              <div key={categoryIndex} className="mb-4">
                <h4 className={`font-medium text-green-900 sticky top-0 bg-gray-50 py-1 border-b border-gray-200 mb-2 ${
                  isMobile ? "text-sm" : ""
                }`}>
                  {categoryList.category}
                </h4>
                {categoryList.items.map((checklist, index) => (
                  <div key={index} className={`flex items-start py-1.5 px-2 hover:bg-gray-100 rounded-md ml-2 ${
                    isMobile ? "flex-col space-y-1" : "items-center"
                  }`}>
                    <div className={`flex items-center ${
                      isMobile ? "w-full" : "flex-1"
                    }`}>
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className={`text-gray-700 ${
                          isMobile ? "text-sm" : "text-sm"
                        }`}>
                          {checklist.name}
                        </span>
                        {checklist.description && (
                          <p className={`text-gray-500 mt-0.5 ${
                            isMobile ? "text-xs" : "text-xs"
                          }`}>
                            {checklist.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Tag 
                      color={checklist.status === 'completed' ? 'success' : 'warning'} 
                      className={isMobile ? "ml-6" : "ml-2"}
                      size={isMobile ? "small" : "default"}
                    >
                      {checklist.status}
                    </Tag>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className={`flex items-center justify-center text-gray-500 italic ${
              isMobile ? "h-16 text-sm" : "h-20"
            }`}>
              No checklists available
            </div>
          )}
        </div>
      </Form.Item>
    </Form>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          title={getTitle()}
          open={isOpen}
          onClose={handleClose}
          {...getModalProps()}
          footer={getFooter()}
          bodyStyle={{
            paddingBottom: '120px'
          }}
        >
          {renderContent()}
        </Drawer>
      ) : (
        <Modal
          title={getTitle()}
          open={isOpen}
          onCancel={handleClose}
          footer={getFooter()}
          {...getModalProps()}
          className="assignment-modal"
        >
          {renderContent()}
        </Modal>
      )}

      {/* Error Modal - Always use Modal for error display */}
      <Modal
        title="Cannot Assign Personnel"
        open={errorModal.visible}
        onCancel={handleErrorModalClose}
        footer={[
          <Button 
            key="ok" 
            type="primary" 
            onClick={handleErrorModalClose}
            block={isMobile}
            size={isMobile ? "large" : "middle"}
          >
            OK
          </Button>
        ]}
        centered
        width={isMobile ? '90%' : isTablet ? 500 : 500}
      >
        <div style={{ 
          textAlign: 'center', 
          padding: isMobile ? '16px 0' : '20px 0'
        }}>
          <div style={{ 
            fontSize: isMobile ? '36px' : '48px', 
            color: '#ff4d4f', 
            marginBottom: '16px' 
          }}>
            ⚠️
          </div>
          <h3 style={{ 
            color: '#ff4d4f', 
            marginBottom: '16px',
            fontSize: isMobile ? '16px' : '18px'
          }}>
            Assignment Not Allowed
          </h3>
          <p style={{ 
            fontSize: isMobile ? '14px' : '16px', 
            lineHeight: '1.5', 
            color: '#666', 
            marginBottom: '16px' 
          }}>
            {errorModal.message}
          </p>
          {errorModal.currentStatus && (
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: isMobile ? '10px' : '12px', 
              borderRadius: '6px',
              border: '1px solid #d9d9d9'
            }}>
              <p style={{ 
                fontSize: isMobile ? '12px' : '14px', 
                color: '#666', 
                margin: 0 
              }}>
                <strong>Current Status:</strong> {errorModal.currentStatus}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AssignModal;
