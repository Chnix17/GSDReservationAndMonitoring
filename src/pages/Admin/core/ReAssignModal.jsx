import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button,  Card, Typography, Avatar, Tag, Spin, Alert } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faMapMarkerAlt, faCar, faTools } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast } from 'sonner';
import { SecureStorage } from '../../../utils/encryption';
import dayjs from 'dayjs';

const { Title, Text } = Typography;


const ReAssignModal = ({ isOpen, onClose, selectedReservation, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [reservationData, setReservationData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReservationDetails = useCallback(async () => {
    setLoading(true);
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      const response = await axios.post(`${encryptedUrl}Assigned&Records.php`, {
        operation: 'fetchReAssignPersonnel',
        reservation_id: selectedReservation.id
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        setReservationData(response.data.data);
      } else {
        toast.error('Failed to fetch reservation details');
      }
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      toast.error('Error fetching reservation details');
    } finally {
      setLoading(false);
    }
  }, [selectedReservation]);

  useEffect(() => {
    if (isOpen && selectedReservation) {
      fetchReservationDetails();
    }
  }, [isOpen, selectedReservation, fetchReservationDetails]);



  const preparePersonnelAssignments = () => {
    const personnelAssignments = [];
    
    // Process venues
    if (reservationData.venues) {
      reservationData.venues.forEach(venue => {
        if (venue.new_checklists && venue.new_checklists.length > 0) {
          // Get unique personnel from current assignments
          const uniquePersonnel = getUniquePersonnel(venue.current_personnel || []);
          
          uniquePersonnel.forEach(person => {
            const checklistItems = venue.new_checklists.map(checklist => ({
              checklist_id: checklist.checklist_venue_id || checklist.checklist_id
            }));
            
            if (checklistItems.length > 0) {
              personnelAssignments.push({
                resource_type: "venue",
                resource_id: venue.reservation_venue_id, // Use reservation_venue_id instead of venue_id
                personnel_id: person.personnel_id,
                checklist_items: checklistItems
              });
            }
          });
        }
      });
    }
    
    // Process vehicles
    if (reservationData.vehicles) {
      reservationData.vehicles.forEach(vehicle => {
        if (vehicle.new_checklists && vehicle.new_checklists.length > 0) {
          const uniquePersonnel = getUniquePersonnel(vehicle.current_personnel || []);
          
          uniquePersonnel.forEach(person => {
            const checklistItems = vehicle.new_checklists.map(checklist => ({
              checklist_id: checklist.checklist_vehicle_id || checklist.checklist_id
            }));
            
            if (checklistItems.length > 0) {
              personnelAssignments.push({
                resource_type: "vehicle",
                resource_id: vehicle.reservation_vehicle_id, // Use reservation_vehicle_id instead of vehicle_id
                personnel_id: person.personnel_id,
                checklist_items: checklistItems
              });
            }
          });
        }
      });
    }
    
    // Process equipments
    if (reservationData.equipments) {
      reservationData.equipments.forEach(equipment => {
        if (equipment.new_checklists && equipment.new_checklists.length > 0) {
          const uniquePersonnel = getUniquePersonnel(equipment.current_personnel || []);
          
          uniquePersonnel.forEach(person => {
            const checklistItems = equipment.new_checklists.map(checklist => ({
              checklist_id: checklist.checklist_equipment_id || checklist.checklist_id
            }));
            
            if (checklistItems.length > 0) {
              personnelAssignments.push({
                resource_type: "equipment",
                resource_id: equipment.reservation_equipment_id || equipment.equipment_id, // Use reservation_equipment_id if available
                personnel_id: person.personnel_id,
                checklist_items: checklistItems
              });
            }
          });
        }
      });
    }
    
    return personnelAssignments;
  };

  const handleConfirmReassignment = async () => {
    setSubmitting(true);
    try {
      const encryptedUrl = SecureStorage.getLocalItem("url");
      const personnelAssignments = preparePersonnelAssignments();
      const adminId = SecureStorage.getLocalItem("user_id");
      
      const response = await axios.post(`${encryptedUrl}Assigned&Records.php`, {
        operation: 'updateReassignChecklist',
        data: {
          reservation_id: selectedReservation.id,
          admin_id: parseInt(adminId),
          personnel_assignments: personnelAssignments,
          return_reservation_ids: true // Flag to request reservation IDs
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        // Extract reservation IDs from the current reservation data we already have
        let extractedIds = {
          reservation_venue_id: null,
          reservation_vehicle_id: null
        };
        
        // Get reservation IDs from the existing reservationData
        if (reservationData) {
          // Extract venue reservation IDs
          if (reservationData.venues && reservationData.venues.length > 0) {
            reservationData.venues.forEach(venue => {
              if (venue.reservation_venue_id) {
                extractedIds.reservation_venue_id = venue.reservation_venue_id;
              }
            });
          }
          
          // Extract vehicle reservation IDs
          if (reservationData.vehicles && reservationData.vehicles.length > 0) {
            reservationData.vehicles.forEach(vehicle => {
              if (vehicle.reservation_vehicle_id) {
                extractedIds.reservation_vehicle_id = vehicle.reservation_vehicle_id;
              }
            });
          }
        }
        
        // Log the extracted IDs and API response
        console.log('API Response:', response.data);
        console.log('Extracted reservation IDs:', extractedIds);
        
        // Enhanced success message with the IDs
        if (extractedIds.reservation_venue_id || extractedIds.reservation_vehicle_id) {
          const venueIdText = extractedIds.reservation_venue_id ? `Reservation Venue ID: ${extractedIds.reservation_venue_id}` : '';
          const vehicleIdText = extractedIds.reservation_vehicle_id ? `Reservation Vehicle ID: ${extractedIds.reservation_vehicle_id}` : '';
          const idsText = [venueIdText, vehicleIdText].filter(Boolean).join(', ');
          
          toast.success(`Reassignment confirmed successfully. ${idsText}`);
        } else {
          toast.success('Reassignment confirmed successfully');
        }
        
        onSuccess();
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to confirm reassignment');
      }
    } catch (error) {
      console.error('Error confirming reassignment:', error);
      toast.error('Error confirming reassignment');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to get unique personnel from current_personnel array
  const getUniquePersonnel = (personnelArray) => {
    if (!personnelArray || !Array.isArray(personnelArray)) return [];
    
    const uniquePersonnel = [];
    const seenIds = new Set();
    
    personnelArray.forEach(person => {
      if (!seenIds.has(person.personnel_id)) {
        seenIds.add(person.personnel_id);
        uniquePersonnel.push(person);
      }
    });
    
    return uniquePersonnel;
  };

  const renderResourceInfo = (resource, type) => {
    if (!resource.current_personnel || resource.current_personnel.length === 0) {
      return (
        <div className="text-center py-4">
          <Text type="secondary">No personnel currently assigned</Text>
        </div>
      );
    }

    const uniquePersonnel = getUniquePersonnel(resource.current_personnel);
    
    return (
      <div className="space-y-4">
        {/* Personnel Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <Text strong className="text-base mb-2 block">Current Personnel Assigned:</Text>
          {uniquePersonnel.map(person => (
            <div key={person.personnel_id} className="flex items-center mb-2">
              <Avatar className="mr-3 bg-blue-500">
                {person.personnel_name ? person.personnel_name.charAt(0).toUpperCase() : '?'}
              </Avatar>
              <div>
                <Text strong>{person.personnel_name || 'Unknown Personnel'}</Text>

              </div>
            </div>
          ))}
        </div>

        {/* Checklist Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current/Old Checklists */}
          <div className="bg-orange-50 p-3 rounded-lg">
            <Text strong className="text-base mb-2 block text-orange-700">Current Checklists:</Text>
            <div className="space-y-2">
              {resource.current_personnel.map(person => (
                <div key={`current-${person.personnel_id}-${person.checklist_venue_id}`} className="bg-white p-2 rounded border-l-4 border-orange-400">
                  <Text className="font-medium">{person.checklist_name}</Text>
                  <br />
                  <Text type="secondary" className="text-xs">Assigned to: {person.personnel_name}</Text>
                  <div className="mt-1">
                    <Tag color={person.isChecked === null ? 'orange' : person.isChecked ? 'green' : 'red'} size="small">
                      {person.isChecked === null ? 'Pending' : person.isChecked ? 'Completed' : 'Not Completed'}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Checklists */}
          <div className="bg-green-50 p-3 rounded-lg">
            <Text strong className="text-base mb-2 block text-green-700">New Checklists:</Text>
            <div className="space-y-2">
              {resource.new_checklists && resource.new_checklists.length > 0 ? (
                resource.new_checklists.map(checklist => (
                  <div key={`new-${checklist.checklist_venue_id || checklist.checklist_id}`} className="bg-white p-2 rounded border-l-4 border-green-400">
                    <Text className="font-medium">{checklist.checklist_name}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">Will be reassigned</Text>
                    <div className="mt-1">
                      <Tag color="blue" size="small">New Assignment</Tag>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-2 rounded text-center">
                  <Text type="secondary">No new checklists to assign</Text>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResourceSection = (resources, type, icon) => {
    if (!resources || resources.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center mb-4 pb-2 border-b">
          <FontAwesomeIcon icon={icon} className="mr-2 text-gray-600" />
          <Title level={4} className="mb-0">{type}s</Title>
        </div>
        
        {resources.map(resource => (
          <div key={resource.venue_id || resource.vehicle_id || resource.equipment_id} className="mb-6 last:mb-0">
            {/* Resource Header */}
            <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <Text strong className="text-lg">
                  {resource.change_name || resource.original_name}
                </Text>
                {resource.original_name !== resource.change_name && (
                  <div>
                    <Text type="secondary" className="text-sm">
                      Originally: {resource.original_name}
                    </Text>
                  </div>
                )}
              </div>
              <Tag color={resource.active ? 'green' : 'orange'} className="text-sm px-3 py-1">
                {resource.active ? 'Active' : 'Changed'}
              </Tag>
            </div>
            
            {/* Resource Content */}
            {renderResourceInfo(resource, type)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal
      title="Confirm Reassignment"
      open={isOpen}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleConfirmReassignment}
          loading={submitting}
        >
          Confirm Reassignment
        </Button>
      ]}
    >
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spin size="large" />
        </div>
      ) : reservationData ? (
        <div>
          {/* Reservation Info */}
          <Card className="mb-6">
            <Title level={4}>{reservationData.reservation.reservation_title}</Title>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text strong>Description:</Text>
                <br />
                <Text>{reservationData.reservation.reservation_description}</Text>
              </div>
              <div>
                <Text strong>Participants:</Text>
                <br />
                <Text>{reservationData.reservation.reservation_participants}</Text>
              </div>
              <div>
                <Text strong>Start Date:</Text>
                <br />
                <Text>{dayjs(reservationData.reservation.reservation_start_date).format('MMM D, YYYY HH:mm')}</Text>
              </div>
              <div>
                <Text strong>End Date:</Text>
                <br />
                <Text>{dayjs(reservationData.reservation.reservation_end_date).format('MMM D, YYYY HH:mm')}</Text>
              </div>
            </div>
          </Card>

          {/* Alert for reassignment */}
          <Alert
            message="Confirm Reassignment"
            description="Review the current personnel assignments and new checklist assignments below. Click 'Confirm Reassignment' to proceed."
            type="info"
            showIcon
            className="mb-6"
          />

          {/* Resources */}
          {renderResourceSection(reservationData.venues, 'Venue', faMapMarkerAlt)}
          {renderResourceSection(reservationData.vehicles, 'Vehicle', faCar)}
          {renderResourceSection(reservationData.equipments, 'Equipment', faTools)}
        </div>
      ) : (
        <div className="text-center py-8">
          <Text type="secondary">No reservation data available</Text>
        </div>
      )}
    </Modal>
  );
};

export default ReAssignModal;