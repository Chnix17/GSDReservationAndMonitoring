import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

export const generateComplaintReportExcel = ({ complaint, history }) => {
  const complaintId = complaint?.comp_id ?? complaint?.complaint_id ?? '';
  const subject = complaint?.comp_subject ?? complaint?.subject ?? '';

  const equipmentStr = Array.isArray(complaint?.equipments_used)
    ? complaint.equipments_used.join(', ')
    : (complaint?.equipments_used ?? complaint?.equipments ?? '');

  const assignedStr = Array.isArray(complaint?.personnel_assigned)
    ? complaint.personnel_assigned.map((p) => p.user_name).filter(Boolean).join(', ')
    : (complaint?.assigned_personnel ?? '');

  const summaryRows = [
    ['Complaint Report with Status History'],
    ['Generated', new Date().toLocaleString()],
    [],
    [`Complaint #${complaintId}: ${subject}`],
    [],
    ['Client', complaint?.client_name ?? complaint?.client_info?.client_name ?? complaint?.client_info?.client_full_name ?? ''],
    ['Location', complaint?.location_name ?? ''],
    ['Equipment', equipmentStr],
    ['Assigned Personnel', assignedStr],
    ['Date', formatDateTime(complaint?.comp_date ?? complaint?.complaint_date ?? complaint?.date_created)],
    ['Current Status', complaint?.latest_status ?? complaint?.comp_status ?? complaint?.current_status ?? '']
  ];

  const historyRows = [
    ['History Date', 'Status', 'Updated By'],
    ...(Array.isArray(history)
      ? history.map((h) => [
          formatDateTime(h.history_date),
          h.status_name || '',
          h.updated_by_name || ''
        ])
      : [])
  ];

  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Report');

  const wsHistory = XLSX.utils.aoa_to_sheet(historyRows);
  XLSX.utils.book_append_sheet(wb, wsHistory, 'Status History');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  saveAs(blob, `Complaint_${complaintId}_Report.xlsx`);
};
