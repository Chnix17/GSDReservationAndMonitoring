import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, message, Radio, Input } from 'antd';
import { toast } from 'react-toastify';
import axios from 'axios';

const MaintenanceModal = ({ visible, onClose, resource, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [maintenanceDetails, setMaintenanceDetails] = useState(null);

  useEffect(() => {
    if (visible && resource) {
      fetchMaintenanceDetails();
    }
  }, [visible, resource]);

  const fetchMaintenanceDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/get_totals.php', {
        operation: 'getMaintenanceDetails',
        resource_id: resource.resource_id,
        resource_type: resource.resource_type
      });

      if (response.data.status === 'success') {
        setMaintenanceDetails(response.data.data);
        // Set initial form values if they exist
        if (response.data.data) {
          form.setFieldsValue({
            remarks: response.data.data.remarks || 'fixable',
            notes: response.data.data.notes || ''
          });
        }
      } else {
        toast.error('Failed to fetch maintenance details');
      }
    } catch (error) {
      console.error('Error fetching maintenance details:', error);
      toast.error('Error fetching maintenance details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Map resource type to the expected format
      const typeMapping = {
        'venue': 'venue',
        'equipment_unit': 'equipment_unit',
        'vehicle': 'vehicle',
        'equipment_consumable': 'equipment_consumable'
      };

      // Allow both original type and mapped type
      const mappedType = typeMapping[resource.resource_type] || resource.resource_type;
      if (!['venue', 'equipment_unit', 'vehicle', 'equipment_consumable'].includes(mappedType)) {
        message.error('Invalid resource type');
        return;
      }

      const payload = {
        operation: 'updateResourceStatusAndCondition',
        type: mappedType,
        resourceId: resource.resource_id,
        recordId: resource.record_id,
        isFixed: values.remarks === 'fixable',
        notes: values.notes || ''
      };

      console.log('Update Resource Status Payload:', payload);

      const response = await axios.post('http://localhost/coc/gsd/get_totals.php', payload);

      if (response.data.status === 'success') {
        message.success('Resource status updated successfully');
        onSuccess();
        onClose();
        form.resetFields();
      } else {
        message.error(response.data.message || 'Failed to update resource status');
      }
    } catch (error) {
      message.error('Error updating resource status');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="View Maintenance Details"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={600}
    >
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Resource Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Name:</p>
                <p className="font-medium">{resource?.resource_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Type:</p>
                <p className="font-medium capitalize">{resource?.resource_type}</p>
              </div>
              {maintenanceDetails && (
                <>
                  <div>
                    <p className="text-gray-600">Status:</p>
                    <p className="font-medium">{maintenanceDetails.maintenance_status_name || 'Not Set'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Assigned To:</p>
                    <p className="font-medium">{maintenanceDetails.assigned_to || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date:</p>
                    <p className="font-medium">{maintenanceDetails.due_date || 'Not Set'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <Form.Item
            label="Remarks"
            name="remarks"
            rules={[{ required: true, message: 'Please select remarks' }]}
          >
            <Radio.Group>
              <Radio value="fixable">Can be Fixed</Radio>
              <Radio value="unfixable">Cannot be Fixed</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Button onClick={onClose} className="mr-2">
              Close
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Status
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default MaintenanceModal;
