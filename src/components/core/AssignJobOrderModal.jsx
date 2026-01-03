import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Form, Select, Input, Button, Alert } from 'antd';
import axios from 'axios';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';

const AssignJobOrderModal = ({ open, onClose, ticket, baseUrl, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [priorities, setPriorities] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [form] = Form.useForm();

  const currentUserId = SecureStorage.getLocalItem('user_id');

  const isPending = useMemo(() => {
    const s = String(ticket?.comp_status || '').toLowerCase();
    return s.includes('pending');
  }, [ticket]);

  const fetchPriorities = useCallback(async () => {
    if (!baseUrl) return;
    const res = await axios.post(
      `${baseUrl}/JobOrder.php`,
      { operation: 'fetchPriorities' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
      setPriorities(res.data.data);
      return;
    }

    throw new Error(res.data?.message || 'Failed to fetch priorities');
  }, [baseUrl]);

  const fetchPersonnel = useCallback(async () => {
    if (!baseUrl) return;
    const res = await axios.post(
      `${baseUrl}/Admin.php`,
      { operation: 'fetchPersonnel' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
      setPersonnel(res.data.data);
      return;
    }

    throw new Error(res.data?.message || 'Failed to fetch personnel');
  }, [baseUrl]);

  useEffect(() => {
    if (!open) return;

    setErrorMessage('');
    form.resetFields();

    if (ticket?.comp_id) {
      form.setFieldsValue({
        complaint_id: ticket.comp_id,
        subject: ticket.comp_subject || '',
        comment: 'Hi Maam/Sir! A job order has been created for this ticket. A GSD personnel is going to contact you soon!'
      });
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([fetchPriorities(), fetchPersonnel()]);
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(e?.message || 'Failed to load form data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, ticket, fetchPriorities, fetchPersonnel, form]);

  const handleSubmit = async () => {
    setErrorMessage('');

    try {
      const values = await form.validateFields();

      if (!ticket?.comp_id) {
        setErrorMessage('No ticket selected');
        return;
      }

      setLoading(true);

      const payload = {
        operation: 'createJobOrder',
        complaint_id: ticket.comp_id,
        priority_id: values.priority_id,
        personnel_id: values.personnel_id,
        createdBy: currentUserId || undefined,
        comment: values.comment || undefined,
        comment_userId: currentUserId || undefined
      };

      const res = await axios.post(
        `${baseUrl}/JobOrder.php`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data?.status === 'success') {
        toast.success('Job order created and assigned');
        onClose?.();
        onSuccess?.();
        return;
      }

      setErrorMessage(res.data?.message || 'Failed to create job order');
    } catch (e) {
      if (e?.errorFields) return;
      setErrorMessage(e?.message || 'Failed to create job order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Assign & Create Job Order${ticket?.comp_id ? ` (#${ticket.comp_id})` : ''}`}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit} disabled={!isPending}>
          Create Job Order
        </Button>
      ]}
    >
      {!isPending && (
        <Alert
          type="warning"
          showIcon
          message="This ticket is not Pending"
          className="mb-3"
        />
      )}

      {errorMessage && (
        <Alert
          type="error"
          showIcon
          message={errorMessage}
          className="mb-3"
        />
      )}

      <Form layout="vertical" form={form}>
        <Form.Item name="complaint_id" hidden>
          <Input readOnly />
        </Form.Item>

        <Form.Item label="Subject" name="subject">
          <Input readOnly />
        </Form.Item>

        <Form.Item
          label="Priority"
          name="priority_id"
          rules={[{ required: true, message: 'Please select a priority' }]}
        >
          <Select
            placeholder="Select priority"
            loading={loading && priorities.length === 0}
            options={priorities.map((p) => ({
              value: p.priority_id,
              label: p.priority_name
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Personnel"
          name="personnel_id"
          rules={[{ required: true, message: 'Please select a personnel' }]}
        >
          <Select
            placeholder="Select personnel"
            loading={loading && personnel.length === 0}
            showSearch
            optionFilterProp="label"
            options={personnel.map((p) => ({
              value: p.users_id,
              label: p.full_name
            }))}
          />
        </Form.Item>

        <Form.Item label="Comment" name="comment">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignJobOrderModal;
