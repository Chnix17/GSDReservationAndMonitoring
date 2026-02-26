import React, { useState } from 'react';
import { Modal, Tag, Button, Divider, Badge, Descriptions } from 'antd';
import { motion } from 'framer-motion';
import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, CalendarOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import axios from 'axios';
import { SecureStorage } from '../../../utils/encryption';

const AllAssignedPersonnel = ({ isOpen, onClose, reservationData, onStatusUpdate }) => {
  const [isMarkingAsDone, setIsMarkingAsDone] = useState(false);
  
  if (!reservationData) return null;

  // Derive admin name from nested checklists when not provided at root
  const collectAdminNames = (groups) => {
    const names = [];
    if (Array.isArray(groups)) {
      groups.forEach((g) => {
        if (Array.isArray(g?.checklists)) {
          g.checklists.forEach((cl) => {
            if (cl?.admin_name) names.push(String(cl.admin_name).trim());
          });
        }
      });
    }
    return names;
  };

  const adminNames = [
    ...collectAdminNames(reservationData.venues),
    ...collectAdminNames(reservationData.vehicles),
    ...collectAdminNames(reservationData.equipments),
  ].filter(Boolean);

  const assignedBy = reservationData.admin_name || adminNames[0] || undefined;

  // Check if all checklists are completed
  const checkAllChecklistsCompleted = () => {
    const allChecklists = [
      ...(reservationData.venues?.flatMap(v => v.checklists || []) || []),
      ...(reservationData.vehicles?.flatMap(v => v.checklists || []) || []),
      ...(reservationData.equipments?.flatMap(e => e.checklists || []) || [])
    ];
    
    if (allChecklists.length === 0) return false;
    return allChecklists.every(checklist => checklist.isChecked === 1);
  };

  // Check if all return conditions have been reported
  const checkAllConditionsReported = () => {
    const venues = reservationData.venues || [];
    const vehicles = reservationData.vehicles || [];
    const equipments = reservationData.equipments || [];
    
    // Check venues
    for (const venue of venues) {
      if (!venue.conditions || venue.conditions.length === 0) {
        return false;
      }
    }
    
    // Check vehicles
    for (const vehicle of vehicles) {
      if (!vehicle.conditions || vehicle.conditions.length === 0) {
        return false;
      }
    }
    
    // Check equipments (both bulk and serialized)
    for (const equipment of equipments) {
      // For serialized equipment, check units
      if (equipment.units && equipment.units.length > 0) {
        for (const unit of equipment.units) {
          if (!unit.conditions || unit.conditions.length === 0) {
            return false;
          }
        }
      } else {
        // For bulk equipment, check conditions
        if (!equipment.conditions || equipment.conditions.length === 0) {
          return false;
        }
      }
    }
    
    return true;
  };

  const allChecklistsCompleted = checkAllChecklistsCompleted();
  const allConditionsReported = checkAllConditionsReported();
  
  // Check if reservation is already completed (status_id = 4)
  const isAlreadyCompleted = reservationData.status_id === 4 || 
                             reservationData.status_id === '4' ||
                             reservationData.status_name?.toLowerCase().includes('completed');
  
  const canMarkAsDone = allChecklistsCompleted && allConditionsReported && !isAlreadyCompleted;

  const handleMarkAsDone = async () => {
    try {
      setIsMarkingAsDone(true);
      const encryptedUrl = SecureStorage.getLocalItem('url');
      const userId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
      
      const response = await axios.post(`${encryptedUrl}personnel.php`, {
        operation: 'updateReservationStatus',
        reservation_id: reservationData.reservation_id,
        user_personnel_id: userId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        toast.success('Reservation marked as completed successfully!');
        onClose();
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      } else {
        toast.error(response.data.message || 'Failed to mark reservation as done');
      }
    } catch (error) {
      console.error('Error marking reservation as done:', error);
      toast.error('Failed to mark reservation as done. Please try again.');
    } finally {
      setIsMarkingAsDone(false);
    }
  };

  return (
    <Modal
      title={<div className="text-xl font-bold text-green-900">Checklist Details</div>}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        (
          <Button 
            key="markAsDone" 
            type="primary"
            className="bg-green-600 hover:bg-green-700"
            icon={<CheckCircleOutlined />}
            onClick={handleMarkAsDone}
            loading={isMarkingAsDone}
            disabled={isAlreadyCompleted}
          >
            Mark Reservation as Done
          </Button>
        )
      ]}
      width={800}
      centered
    >
      <div className="mt-4 space-y-6">
        {/* Event Information Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-base font-semibold text-green-900 mb-3 flex items-center gap-2">
            <InfoCircleOutlined className="text-green-600" />
            Event Information
          </h3>
          <Descriptions column={1} size="small" className="mb-0">
            <Descriptions.Item 
              label={<span className="font-medium text-gray-700">Title</span>}
            >
              <span className="text-gray-900">{reservationData.reservation_title || 'N/A'}</span>
            </Descriptions.Item>
            <Descriptions.Item 
              label={<span className="font-medium text-gray-700">Description</span>}
            >
              <span className="text-gray-900">{reservationData.reservation_description || 'N/A'}</span>
            </Descriptions.Item>
            {reservationData.venues && reservationData.venues.length > 0 && reservationData.venues[0].participants && (
              <Descriptions.Item 
                label={<span className="font-medium text-gray-700 flex items-center gap-1"><TeamOutlined /> Participants</span>}
              >
                <Tag color="blue">{reservationData.venues[0].participants}</Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item 
              label={<span className="font-medium text-gray-700 flex items-center gap-1"><UserOutlined /> Requester</span>}
            >
              <span className="text-gray-900">{reservationData.user_details?.full_name || 'N/A'}</span>
              {reservationData.user_details?.department && (
                <Tag color="green" className="ml-2">{reservationData.user_details.department}</Tag>
              )}
              {reservationData.user_details?.role && (
                <Tag color="purple" className="ml-1">{reservationData.user_details.role}</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item 
              label={<span className="font-medium text-gray-700 flex items-center gap-1"><CalendarOutlined /> Event Date</span>}
            >
              <span className="text-gray-900">
                {reservationData.reservation_start_date && reservationData.reservation_end_date
                  ? `${new Date(reservationData.reservation_start_date).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - ${new Date(reservationData.reservation_end_date).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}`
                  : 'N/A'
                }
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-md p-3">
          <div className="text-sm text-green-900">
            <span className="font-semibold">Assigned by:</span> {assignedBy || 'Unknown'}
          </div>
        </div>

        {/* Venues Section */}
        {reservationData.venues && reservationData.venues.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-3">Venues</h3>
            {reservationData.venues.map((venue, venueIndex) => (
              <div key={venueIndex} className="mb-4 border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="font-medium text-gray-700 mb-2">{venue.name}</h4>
                {venue.building_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <InfoCircleOutlined className="text-blue-500" />
                    <span>Location: <span className="font-medium text-gray-800">{venue.building_name}</span></span>
                  </div>
                )}
                {venue.participants && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <UserOutlined className="text-gray-500" />
                    <span>Participants: <span className="font-medium text-gray-800">{venue.participants}</span></span>
                  </div>
                )}
                
                {/* Venue Conditions */}
                <div className="mb-3">
                  <Divider className="my-2" />
                  <div className="flex items-center gap-2 mb-2">
                    <InfoCircleOutlined className="text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">Return Condition:</span>
                  </div>
                  {venue.conditions && venue.conditions.length > 0 ? (
                    <div className="space-y-2">
                      {venue.conditions.map((condition, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-md p-2">
                          <div className="flex items-center justify-between">
                            <Badge status={condition.is_active === 1 ? "success" : "default"} 
                                   text={<span className="text-sm font-medium">{condition.condition_name || 'Condition'}</span>} />
                          </div>
                          {condition.remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Remarks:</span> {condition.remarks}
                            </div>
                          )}
                          {condition.admin_remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Admin Remarks:</span> {condition.admin_remarks}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-center gap-2">
                      <ExclamationCircleOutlined className="text-amber-500" />
                      <span className="text-xs text-amber-700">Not yet returned or no condition reported</span>
                    </div>
                  )}
                </div>
                
                <Divider className="my-2" />
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-600">Checklists:</span>
                  {venue.checklists.map((checklist, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className={`text-sm flex-1 ${checklist.isChecked === 1 ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {checklist.checklist_name}
                      </span>
                      <Tag 
                        color={checklist.isChecked === 1 ? 'success' : 'warning'}
                        className="capitalize rounded-full px-2 py-0.5 text-xs"
                      >
                        {checklist.isChecked === 1 ? 'Completed' : 'Pending'}
                      </Tag>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vehicles Section */}
        {reservationData.vehicles && reservationData.vehicles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-3">Vehicles</h3>
            {reservationData.vehicles.map((vehicle, vehicleIndex) => (
              <div key={vehicleIndex} className="mb-4 border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="font-medium text-gray-700 mb-2">
                  {vehicle.vehicle_make_name && vehicle.vehicle_model_name 
                    ? `${vehicle.vehicle_make_name} ${vehicle.vehicle_model_name} - ${vehicle.vehicle_license}`
                    : vehicle.vehicle_license || vehicle.name
                  }
                </h4>
                
                {/* Vehicle Conditions */}
                <div className="mb-3">
                  <Divider className="my-2" />
                  <div className="flex items-center gap-2 mb-2">
                    <InfoCircleOutlined className="text-blue-500" />
                    <span className="text-sm font-semibold text-gray-700">Return Condition:</span>
                  </div>
                  {vehicle.conditions && vehicle.conditions.length > 0 ? (
                    <div className="space-y-2">
                      {vehicle.conditions.map((condition, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-md p-2">
                          <div className="flex items-center justify-between">
                            <Badge status={condition.is_active === 1 ? "success" : "default"} 
                                   text={<span className="text-sm font-medium">{condition.condition_name || 'Condition'}</span>} />
                          </div>
                          {condition.remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Remarks:</span> {condition.remarks}
                            </div>
                          )}
                          {condition.admin_remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Admin Remarks:</span> {condition.admin_remarks}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-center gap-2">
                      <ExclamationCircleOutlined className="text-amber-500" />
                      <span className="text-xs text-amber-700">Not yet returned or no condition reported</span>
                    </div>
                  )}
                </div>
                
                <Divider className="my-2" />
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-600">Checklists:</span>
                  {vehicle.checklists.map((checklist, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className={`text-sm flex-1 ${checklist.isChecked === 1 ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {checklist.checklist_name}
                      </span>
                      <Tag 
                        color={checklist.isChecked === 1 ? 'success' : 'warning'}
                        className="capitalize rounded-full px-2 py-0.5 text-xs"
                      >
                        {checklist.isChecked === 1 ? 'Completed' : 'Pending'}
                      </Tag>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Equipments Section */}
        {reservationData.equipments && reservationData.equipments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-3">Equipments</h3>
            {reservationData.equipments.map((equipment, equipmentIndex) => (
              <div key={equipmentIndex} className="mb-4 border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="font-medium text-gray-700 mb-2">{equipment.name}</h4>
                
                {/* Equipment Quantity Summary (for bulk equipment) */}
                {equipment.quantity && (
                  <div className="mb-2 flex gap-2 items-center">
                    <Tag color="blue">Total Qty: {equipment.quantity}</Tag>
                    {equipment.qty_good !== null && equipment.qty_good !== undefined && (
                      <>
                        <Tag color="green" icon={<CheckCircleOutlined />}>Good: {equipment.qty_good}</Tag>
                        {equipment.qty_bad > 0 && (
                          <Tag color="red" icon={<ExclamationCircleOutlined />}>Bad: {equipment.qty_bad}</Tag>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* Equipment Conditions (for bulk) */}
                {equipment.conditions && equipment.conditions.length > 0 && (
                  <div className="mb-3">
                    <Divider className="my-2" />
                    <div className="flex items-center gap-2 mb-2">
                      <InfoCircleOutlined className="text-blue-500" />
                      <span className="text-sm font-semibold text-gray-700">Return Condition:</span>
                    </div>
                    <div className="space-y-2">
                      {equipment.conditions.map((condition, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-md p-2">
                          <div className="flex items-center justify-between">
                            <Badge status={condition.is_active === 1 ? "success" : "default"} 
                                   text={<span className="text-sm font-medium">{condition.condition_name || 'Condition'}</span>} />
                            {condition.qty_bad && <Tag color="red">Qty Bad: {condition.qty_bad}</Tag>}
                          </div>
                          {condition.remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Remarks:</span> {condition.remarks}
                            </div>
                          )}
                          {condition.admin_remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Admin Remarks:</span> {condition.admin_remarks}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Units (for serialized equipment) */}
                {equipment.units && equipment.units.length > 0 && (
                  <div className="mb-3">
                    <Divider className="my-2" />
                    <div className="flex items-center gap-2 mb-2">
                      <InfoCircleOutlined className="text-purple-500" />
                      <span className="text-sm font-semibold text-gray-700">Units:</span>
                    </div>
                    <div className="space-y-2">
                      {equipment.units.map((unit, unitIdx) => (
                        <div key={unitIdx} className="bg-purple-50 border border-purple-200 rounded-md p-2">
                          <div className="font-medium text-sm text-purple-900">
                            Serial: {unit.unit_serial_number || 'N/A'}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {unit.equipment_brand && (
                              <span className="text-xs text-gray-600">
                                <span className="font-medium">Brand:</span> {unit.equipment_brand}
                              </span>
                            )}
                            {unit.equipment_model && (
                              <span className="text-xs text-gray-600">
                                <span className="font-medium">Model:</span> {unit.equipment_model}
                              </span>
                            )}
                            {unit.inch && (
                              <span className="text-xs text-gray-600">
                                <span className="font-medium">Size:</span> {unit.inch}"
                              </span>
                            )}
                          </div>
                          {unit.conditions && unit.conditions.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {unit.conditions.map((condition, condIdx) => (
                                <div key={condIdx} className="bg-white border border-purple-100 rounded p-1 ml-2">
                                  <Badge status={condition.is_active === 1 ? "success" : "default"} 
                                         text={<span className="text-xs">{condition.condition_name || 'Condition'}</span>} />
                                  {condition.remarks && (
                                    <div className="text-xs text-gray-600 mt-1 ml-5">
                                      <span className="font-medium">Remarks:</span> {condition.remarks}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 italic mt-1 ml-2">No condition reported</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No conditions for equipment */}
                {(!equipment.conditions || equipment.conditions.length === 0) && 
                 (!equipment.units || equipment.units.length === 0 || 
                  !equipment.units.some(u => u.conditions && u.conditions.length > 0)) && (
                  <div className="mb-3">
                    <Divider className="my-2" />
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-center gap-2">
                      <ExclamationCircleOutlined className="text-amber-500" />
                      <span className="text-xs text-amber-700">Not yet returned or no condition reported</span>
                    </div>
                  </div>
                )}
                
                <Divider className="my-2" />
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-600">Checklists:</span>
                  {equipment.checklists.map((checklist, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className={`text-sm flex-1 ${checklist.isChecked === 1 ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {checklist.checklist_name}
                      </span>
                      <Tag 
                        color={checklist.isChecked === 1 ? 'success' : 'warning'}
                        className="capitalize rounded-full px-2 py-0.5 text-xs"
                      >
                        {checklist.isChecked === 1 ? 'Completed' : 'Pending'}
                      </Tag>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {(!reservationData.venues?.length && 
          !reservationData.vehicles?.length && 
          !reservationData.equipments?.length) && (
          <div className="text-center py-4 text-gray-500">
            No checklist items available
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AllAssignedPersonnel;