import React from 'react';
import { Modal, Button } from 'antd';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';

const AssignOptionModal = ({ 
  isOpen, 
  onClose, 
  onAssignNow, 
  onAssignLater,
  selectedReservation 
}) => {
  return (
    <Modal
      title={
        <div className="text-xl font-bold text-green-900">
          Assignment Options
          {selectedReservation && (
            <div className="text-sm font-normal text-gray-500 mt-1">
              Reservation: {selectedReservation.name}
            </div>
          )}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      className="assign-option-modal"
      centered
    >
      <div className="py-6">
        <div className="text-center mb-6">
          <p className="text-gray-700 text-lg mb-2">
            Reservation has been approved successfully!
          </p>
          <p className="text-gray-600">
            Would you like to assign personnel now or later?
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            type="primary"
            size="large"
            icon={<UserOutlined />}
            onClick={onAssignNow}
            className="bg-green-900 hover:bg-lime-900 h-12 text-base font-medium"
          >
            Assign Now
          </Button>
          
          <Button
            size="large"
            icon={<ClockCircleOutlined />}
            onClick={onAssignLater}
            className="h-12 text-base font-medium border-gray-300 text-gray-700 hover:border-gray-400"
          >
            Assign Later
          </Button>
        </div>

     
      </div>
    </Modal>
  );
};

export default AssignOptionModal;
