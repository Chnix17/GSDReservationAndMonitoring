import React from 'react';
import { Modal, Tag, Button } from 'antd';
import { motion } from 'framer-motion';

const AllAssignedPersonnel = ({ isOpen, onClose, reservationData }) => {
  if (!reservationData) return null;

  return (
    <Modal
      title={<div className="text-xl font-bold text-green-900">Checklist Details</div>}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={800}
      centered
    >
      <div className="mt-4 space-y-6">
        {/* Venues Section */}
        {reservationData.venues && reservationData.venues.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-3">Venues</h3>
            {reservationData.venues.map((venue, venueIndex) => (
              <div key={venueIndex} className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">{venue.name}</h4>
                <div className="space-y-2">
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
              <div key={vehicleIndex} className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">{vehicle.name}</h4>
                <div className="space-y-2">
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
              <div key={equipmentIndex} className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">{equipment.name}</h4>
                <div className="space-y-2">
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