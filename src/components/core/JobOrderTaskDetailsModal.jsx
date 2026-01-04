import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Tag, Divider, Button, Form, Select, Input, Alert, Upload } from 'antd';
import { useMediaQuery } from 'react-responsive';
import axios from 'axios';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';

const MAX_IMAGE_BYTES = 1 * 1024 * 1024;

const getStatusColor = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('complete') || s.includes('done')) return 'green';
  if (s.includes('pending')) return 'gold';
  if (s.includes('ongoing') || s.includes('on-going') || s.includes('in progress')) return 'blue';
  if (s.includes('decline') || s.includes('cancel') || s.includes('reject')) return 'red';
  return 'default';
};

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const resolveImageUrl = (baseUrl, path) => {
  if (!path) return null;
  const p = String(path);
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:')) return p;
  if (!baseUrl) return p;
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  if (p.startsWith('static/')) return `${normalized}${p}`;
  return `${normalized}${p}`;
};

const FieldInput = ({ label, value, icon }) => (
  <div className="w-full">
    <div className="text-[11px] font-semibold text-gray-600 uppercase mb-1">{label}</div>
    <div className="w-full rounded border border-gray-300 bg-white flex items-center overflow-hidden">
      {icon ? (
        <div className="flex items-center justify-center w-9 h-9 text-gray-500 border-r border-gray-200 bg-white">
          {icon}
        </div>
      ) : null}
      <input
        className="flex-1 text-sm text-gray-800 px-3 py-2 focus:outline-none bg-transparent"
        value={value || ''}
        readOnly
      />
    </div>
  </div>
);

const FieldTextarea = ({ label, value }) => (
  <div className="w-full">
    <div className="text-[11px] font-semibold text-gray-600 uppercase mb-1">{label}</div>
    <textarea
      className="w-full rounded border border-gray-300 bg-white text-sm text-gray-800 px-3 py-2 focus:outline-none"
      value={value || ''}
      readOnly
      rows={3}
    />
  </div>
);

const JobOrderTaskDetailsModal = ({ open, onClose, task, baseUrl, onSuccess }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const [mode, setMode] = useState('details');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [equipments, setEquipments] = useState([]);
  const [operations, setOperations] = useState([]);
  const [fileList, setFileList] = useState([]);

  const [form] = Form.useForm();

  const personnelId = SecureStorage.getLocalItem('user_id');

  const complaintImageUrl = useMemo(() => resolveImageUrl(baseUrl, task?.comp_image), [baseUrl, task]);
  const jobImageUrl = useMemo(() => resolveImageUrl(baseUrl, task?.job_image), [baseUrl, task]);

  const canMarkDone = useMemo(() => {
    const s = String(task?.comp_status || '').toLowerCase();
    return !(s.includes('complete') || s.includes('done'));
  }, [task]);

  const fetchEquipments = useCallback(async () => {
    if (!baseUrl) return;
    const res = await axios.post(
      `${baseUrl}personnel.php`,
      { operation: 'fetchEquipments' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
      setEquipments(res.data.data);
      return;
    }
    throw new Error(res.data?.message || 'Failed to fetch equipments');
  }, [baseUrl]);

  const fetchOperations = useCallback(async () => {
    if (!baseUrl) return;
    const res = await axios.post(
      `${baseUrl}personnel.php`,
      { operation: 'fetchOperations' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
      setOperations(res.data.data);
      return;
    }
    throw new Error(res.data?.message || 'Failed to fetch operations');
  }, [baseUrl]);

  useEffect(() => {
    if (!open) return;
    setMode('details');
    setErrorMessage('');
    form.resetFields();
    setFileList([]);
  }, [open, form]);

  useEffect(() => {
    if (!open) return;
    if (mode !== 'done') return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        await Promise.all([fetchEquipments(), fetchOperations()]);
        if (!cancelled) {
          form.setFieldsValue({
            complaint_id: task?.comp_id,
            job_id: task?.job_id,
            joPersonnel_id: task?.joPersonnel_id,
            operation_id: task?.comp_operation || undefined,
            equipment_ids: [],
            remarks: task?.comp_remark || ''
          });
        }
      } catch (e) {
        if (!cancelled) setErrorMessage(e?.message || 'Failed to load form data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, mode, fetchEquipments, fetchOperations, form, task]);

  const handleBeforeUpload = (file) => {
    if (file?.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be less than or equal to 1MB');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleSubmitMarkDone = async () => {
    setErrorMessage('');

    try {
      const values = await form.validateFields();
      if (!task?.comp_id || !task?.job_id) {
        setErrorMessage('Missing job order information');
        return;
      }

      setLoading(true);

      const fd = new FormData();
      fd.append('operation', 'markJobOrderAsDone');
      fd.append('complaint_id', String(task.comp_id));
      fd.append('job_id', String(task.job_id));
      fd.append('personnel_id', String(personnelId || ''));
      if (values.joPersonnel_id) fd.append('joPersonnel_id', String(values.joPersonnel_id));
      fd.append('operation_id', String(values.operation_id));
      fd.append('remarks', String(values.remarks || ''));
      fd.append('equipment_ids', JSON.stringify(values.equipment_ids || []));

      const f = fileList?.[0]?.originFileObj;
      if (f) fd.append('image', f);

      const res = await axios.post(`${baseUrl}personnel.php`, fd);

      if (res.data?.status === 'success') {
        toast.success('Job order marked as done');
        onClose?.();
        onSuccess?.();
        return;
      }

      setErrorMessage(res.data?.message || 'Failed to mark job order as done');
    } catch (e) {
      if (e?.errorFields) return;
      setErrorMessage(e?.message || 'Failed to mark job order as done');
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '100%' : 760}
      style={isMobile ? { top: 0, paddingBottom: 0 } : undefined}
      bodyStyle={isMobile ? { height: '100vh', overflow: 'auto', padding: 0 } : { padding: 0 }}
      closable={false}
    >
      <div className="rounded-lg overflow-hidden">
        <div className="bg-[#145414] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <span className="text-white">▣</span>
            <span className="text-sm">Job Order #{task.job_id} (Complaint #{task.comp_id})</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/90 hover:text-white text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-600">Status:</div>
              <Tag color={getStatusColor(task.comp_status)} className="m-0">
                {task.comp_status || 'Unknown'}
              </Tag>
            </div>

            {mode === 'details' ? (
              <Button type="primary" disabled={!canMarkDone} onClick={() => setMode('done')}>
                Mark as Done
              </Button>
            ) : (
              <Button onClick={() => setMode('details')} disabled={loading}>
                Back
              </Button>
            )}
          </div>

          {mode === 'details' ? (
            <>
              <div className="space-y-3">
                <FieldInput label="Subject" value={task.comp_subject} />
                <FieldTextarea label="Description" value={task.comp_description} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldInput label="Client Name" value={task.client_full_name} icon={<span>👤</span>} />
                  <FieldInput label="Location" value={task.location_name} icon={<span>📍</span>} />
                  <FieldInput label="Location Category" value={task.locCateg_name} icon={<span>🏢</span>} />
                  <FieldInput label="Date Created" value={formatDateTime(task.comp_date)} icon={<span>🗓</span>} />
                  <FieldInput label="Expected End Date" value={formatDateTime(task.comp_end_date)} icon={<span>🗓</span>} />
                  <FieldInput label="Date Closed" value={formatDateTime(task.comp_date_closed)} icon={<span>🗓</span>} />
                </div>
              </div>

              <Divider className="my-4" />

              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-3">Operation Information</div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Last User</div>
                    <div className="text-sm text-gray-900">{task.last_user_full_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Closed By</div>
                    <div className="text-sm text-gray-900">{task.closed_by_full_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Operation</div>
                    <div className="text-sm text-gray-900">{task.operation_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Priority</div>
                    <div className="text-sm text-gray-900">{task.priority_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Job Title</div>
                    <div className="text-sm text-gray-900">{task.job_title || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Remark</div>
                    <div className="text-sm text-gray-900">{task.comp_remark || '-'}</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-xs text-gray-600">Complaint Image</div>
                    {complaintImageUrl ? (
                      <img
                        src={complaintImageUrl}
                        alt="Complaint"
                        style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-sm text-gray-700">No complaint image</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Job Order Image</div>
                    {jobImageUrl ? (
                      <img
                        src={jobImageUrl}
                        alt="Job Order"
                        style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-sm text-gray-700">No job order image</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={onClose}>Close</Button>
              </div>
            </>
          ) : (
            <>
              {!canMarkDone && (
                <Alert type="warning" showIcon message="This job order is already completed." className="mb-3" />
              )}

              {errorMessage && <Alert type="error" showIcon message={errorMessage} className="mb-3" />}

              <Form layout="vertical" form={form}>
                <Form.Item name="complaint_id" hidden>
                  <Input readOnly />
                </Form.Item>
                <Form.Item name="job_id" hidden>
                  <Input readOnly />
                </Form.Item>
                <Form.Item name="joPersonnel_id" hidden>
                  <Input readOnly />
                </Form.Item>

                <Form.Item
                  label="Operation"
                  name="operation_id"
                  rules={[{ required: true, message: 'Please select an operation' }]}
                >
                  <Select
                    placeholder="Select operation"
                    loading={loading && operations.length === 0}
                    showSearch
                    optionFilterProp="label"
                    options={operations.map((op) => ({
                      value: op.operation_id,
                      label: op.operation_name
                    }))}
                  />
                </Form.Item>

                <Form.Item label="Equipment Used" name="equipment_ids">
                  <Select
                    mode="multiple"
                    placeholder="Select equipment(s)"
                    loading={loading && equipments.length === 0}
                    showSearch
                    optionFilterProp="label"
                    options={equipments.map((eq) => ({
                      value: eq.equip_id,
                      label: eq.equip_name
                    }))}
                  />
                </Form.Item>

                <Form.Item label="Remarks" name="remarks">
                  <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item label="Upload Job Order Image (optional)">
                  <Upload
                    listType="picture"
                    maxCount={1}
                    fileList={fileList}
                    beforeUpload={handleBeforeUpload}
                    onChange={({ fileList: next }) => setFileList(next)}
                  >
                    <Button disabled={loading}>Select Image</Button>
                  </Upload>
                  <div className="text-xs text-gray-500 mt-1">Max file size: 1MB</div>
                </Form.Item>

                <div className="flex justify-end gap-2 mt-4">
                  <Button onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="primary" loading={loading} onClick={handleSubmitMarkDone} disabled={!canMarkDone}>
                    Submit & Mark Done
                  </Button>
                </div>
              </Form>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default JobOrderTaskDetailsModal;
