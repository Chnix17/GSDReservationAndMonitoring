import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const applyBorder = (cell) => {
  cell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };
};

const styleRange = (ws, startRow, endRow, startCol, endCol, styleFn) => {
  for (let r = startRow; r <= endRow; r += 1) {
    for (let c = startCol; c <= endCol; c += 1) {
      const cell = ws.getCell(r, c);
      styleFn(cell);
    }
  }
};

const buildSheetForComplaint = (wb, { complaint, history }, sheetName) => {
  const complaintId = complaint?.comp_id ?? complaint?.complaint_id ?? '';
  const subject = complaint?.comp_subject ?? complaint?.subject ?? '';

  const equipmentStr = Array.isArray(complaint?.equipments_used)
    ? complaint.equipments_used.join(', ')
    : (complaint?.equipments_used ?? complaint?.equipments ?? '');

  const assignedStr = Array.isArray(complaint?.personnel_assigned)
    ? complaint.personnel_assigned.map((p) => p.user_name).filter(Boolean).join(', ')
    : (complaint?.assigned_personnel ?? '');

  const ws = wb.addWorksheet(sheetName);

  ws.columns = [
    { key: 'a', width: 18 },
    { key: 'b', width: 30 },
    { key: 'c', width: 14 },
    { key: 'd', width: 30 }
  ];

  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = 'Complaint Report with Status History';
  ws.getCell('A1').font = { bold: true, size: 14, color: { argb: '0B6623' } };

  ws.getCell('A3').value = `Generated: ${new Date().toLocaleString()}`;
  ws.getCell('A3').font = { size: 10 };

  ws.mergeCells('A5:D5');
  ws.getCell('A5').value = `Complaint #${complaintId}: ${subject}`;
  ws.getCell('A5').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '145414' } };
  ws.getCell('A5').alignment = { vertical: 'middle', horizontal: 'left' };
  styleRange(ws, 5, 5, 1, 4, applyBorder);

  const clientName = complaint?.client_name ?? complaint?.client_info?.client_name ?? complaint?.client_info?.client_full_name ?? '';
  const locationName = complaint?.location_name ?? '';

  ws.getCell('A6').value = 'Client:';
  ws.getCell('B6').value = clientName;
  ws.getCell('C6').value = 'Location:';
  ws.getCell('D6').value = locationName;

  ws.getCell('A7').value = 'Equipment:';
  ws.mergeCells('B7:D7');
  ws.getCell('B7').value = equipmentStr;

  ws.getCell('A8').value = 'Assigned Personel:';
  ws.mergeCells('B8:D8');
  ws.getCell('B8').value = assignedStr;

  ws.getCell('A9').value = 'Date:';
  ws.mergeCells('B9:D9');
  ws.getCell('B9').value = formatDateTime(complaint?.comp_date ?? complaint?.complaint_date ?? complaint?.date_created);

  ws.getCell('A10').value = 'Current Status:';
  ws.getCell('B10').value = complaint?.latest_status ?? complaint?.comp_status ?? complaint?.current_status ?? '';

  styleRange(ws, 6, 10, 1, 4, (cell) => {
    applyBorder(cell);
    cell.font = cell.font || { size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  });
  ['A6', 'C6', 'A7', 'A8', 'A9', 'A10'].forEach((addr) => {
    ws.getCell(addr).font = { bold: true, size: 10 };
  });

  const headerRowIdx = 12;
  ws.getCell(`A${headerRowIdx}`).value = 'History Date';
  ws.getCell(`B${headerRowIdx}`).value = 'Status';
  ws.getCell(`C${headerRowIdx}`).value = 'Updated By';
  ws.mergeCells(`C${headerRowIdx}:D${headerRowIdx}`);

  styleRange(ws, headerRowIdx, headerRowIdx, 1, 4, (cell) => {
    applyBorder(cell);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '145414' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  const historyList = Array.isArray(history) ? history : [];
  historyList.forEach((h, idx) => {
    const r = headerRowIdx + 1 + idx;
    ws.getCell(`A${r}`).value = formatDateTime(h.history_date);
    ws.getCell(`B${r}`).value = h.status_name || '';
    ws.mergeCells(`C${r}:D${r}`);
    ws.getCell(`C${r}`).value = h.updated_by_name || '';
    styleRange(ws, r, r, 1, 4, (cell) => {
      applyBorder(cell);
      cell.font = { size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    });
  });

  const totalRow = headerRowIdx + 1 + historyList.length + 1;
  ws.mergeCells(`A${totalRow}:D${totalRow}`);
  ws.getCell(`A${totalRow}`).value = `Total Records: ${historyList.length}`;
  ws.getCell(`A${totalRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getCell(`A${totalRow}`).font = { bold: true, size: 10 };

  return { complaintId };
};

export const generateComplaintReportExcel = ({ complaint, history, items, fileName } = {}) => {
  const list = Array.isArray(items)
    ? items
    : (complaint ? [{ complaint, history }] : []);

  if (list.length === 0) return;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GSD Reservation System';
  wb.created = new Date();

  const single = list.length === 1;
  list.forEach((item, idx) => {
    const id = item?.complaint?.comp_id ?? item?.complaint?.complaint_id ?? '';
    const safeId = String(id || idx + 1);
    const name = (single ? 'complaint-report-with-history' : `complaint-${safeId}`)
      .slice(0, 31);
    buildSheetForComplaint(wb, item, name);
  });

  wb.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const fallback = single
      ? `Complaint_${list[0]?.complaint?.comp_id ?? list[0]?.complaint?.complaint_id ?? ''}_Report.xlsx`
      : 'Complaint_Reports.xlsx';
    saveAs(blob, fileName || fallback);
  });
};
