import React from 'react';
import { Modal, Tag, Divider, Button } from 'antd';
import { useMediaQuery } from 'react-responsive';

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
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const resolveImageUrl = (baseUrl, path) => {
  if (!path) return null;
  const p = String(path);
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:')) return p;
  if (!baseUrl) return p;
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  // For complaints images, they are already under static/complaints/, so don't double-nest
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

const JobOrderDetailsModal = ({ open, onClose, ticket, baseUrl }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });

  if (!ticket) return null;

  const complaintImageUrl = resolveImageUrl(baseUrl, ticket.comp_image);
  const jobImageUrl = resolveImageUrl(baseUrl, ticket.job_image);

  const commentText = ticket.comment || ticket.comp_comment || 'Hi Maam/Sir! A job order has been created for this ticket. A GSD personnel is going to contact you soon!';

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
            <span className="text-sm">Complaint Details ID: #{ticket.comp_id}</span>
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
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xs text-gray-600">Status:</div>
            <Tag color={getStatusColor(ticket.comp_status)} className="m-0">
              {ticket.comp_status || 'Unknown'}
            </Tag>
          </div>

          <div className="space-y-3">
            <FieldInput label="Subject" value={ticket.comp_subject} />
            <FieldTextarea label="Description" value={ticket.comp_description} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldInput label="Client Name" value={ticket.client_full_name} icon={<span>👤</span>} />
              <FieldInput label="Location" value={ticket.location_name} icon={<span>📍</span>} />
              <FieldInput label="Location Category" value={ticket.locCateg_name} icon={<span>🏢</span>} />
              <FieldInput label="Date Created" value={formatDateTime(ticket.comp_date)} icon={<span>🗓</span>} />
              <FieldInput label="Expected End Date" value={formatDateTime(ticket.comp_end_date)} icon={<span>🗓</span>} />
              <FieldInput label="Date Closed" value={formatDateTime(ticket.comp_date_closed)} icon={<span>🗓</span>} />
            </div>
          </div>

          <Divider className="my-4" />

          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-3">Operation Information</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-600">Last User</div>
                <div className="text-sm text-gray-900">{ticket.last_user_full_name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Closed By</div>
                <div className="text-sm text-gray-900">{ticket.closed_by_full_name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Operation</div>
                <div className="text-sm text-gray-900">{ticket.operation_name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Priority</div>
                <div className="text-sm text-gray-900">{ticket.priority_name || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Assigned Personnel</div>
                <div className="text-sm text-gray-900">{ticket.assigned_personnel || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Remark</div>
                <div className="text-sm text-gray-900">{ticket.comp_remark || '-'}</div>
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
                    onError={(e) => { e.target.style.display = 'none'; }}
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
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="text-sm text-gray-700">No job order image</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-2">Comment</div>
            <textarea
              className="w-full rounded border border-gray-300 bg-white text-sm text-gray-800 px-3 py-2 focus:outline-none"
              rows={3}
              value={commentText}
              readOnly
            />
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default JobOrderDetailsModal;
