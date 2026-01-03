import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function generateReservationReport(data, monthStr) {
  // Helper function to format date and time in readable format
  function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return "";
    
    const date = new Date(dateTimeStr);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    // Format time in 12-hour format
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    const timeStr = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    return `${month} ${day}, ${year} at ${timeStr}`;
  }

  // Prepare detailed reservation data with formatted dates
  const flatData = data.map(({ passengers, reservation_id, reservation_user_id, user_level_name, venues, vehicles, equipment, drivers, active, status_history, ...rest }) => ({
    ...rest,
    role: user_level_name,
    reservation_start_date: formatDateTime(rest.reservation_start_date),
    reservation_end_date: formatDateTime(rest.reservation_end_date),
    reservation_created_at: formatDateTime(rest.reservation_created_at)
  }));

  if (!flatData.length) return false;

  // Helper to count occurrences, calculate hours, and sum issues
  function countOccurrencesAndHours(items, keyFn, startDateFn, endDateFn, issueCountFn, locationFn = null) {
    const counts = {};
    const hours = {};
    const issues = {};
    const locations = {};
    
    items.forEach((item) => {
      const key = keyFn(item);
      if (!key) return;
      
      // Count occurrences
      if (!counts[key]) counts[key] = 0;
      counts[key] += 1;
      
      // Calculate hours
      if (!hours[key]) hours[key] = 0;
      
      const startDate = startDateFn(item);
      const endDate = endDateFn(item);
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationMs = end - start;
        const durationHours = durationMs / (1000 * 60 * 60);
        hours[key] += durationHours;
      }
      
      // Sum issues
      if (!issues[key]) issues[key] = 0;
      const issueCount = issueCountFn(item);
      issues[key] += issueCount || 0;
      
      // Store location if provided
      if (locationFn && !locations[key]) {
        locations[key] = locationFn(item);
      }
    });
    
    return Object.entries(counts).map(([name, count]) => {
      const result = { 
        name, 
        "No. Of Uses": count, 
        "No. Hours": Math.round(hours[name] * 100) / 100, // Round to 2 decimal places
        total_issues: issues[name] || 0
      };
      
      // Add location if it exists
      if (locationFn && locations[name]) {
        result.location = locations[name];
      }
      
      return result;
    });
  }

  // Helper to count occurrences, calculate hours, and sum issues for equipment (including unit issues)
  function countOccurrencesAndHoursForEquipment(items, keyFn, startDateFn, endDateFn) {
    const counts = {};
    const hours = {};
    const issues = {};
    const unitIssues = {};
    
    items.forEach((item) => {
      const key = keyFn(item);
      if (!key) return;
      
      // Count occurrences
      if (!counts[key]) counts[key] = 0;
      counts[key] += 1;
      
      // Calculate hours
      if (!hours[key]) hours[key] = 0;
      
      const startDate = startDateFn(item);
      const endDate = endDateFn(item);
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationMs = end - start;
        const durationHours = durationMs / (1000 * 60 * 60);
        hours[key] += durationHours;
      }
      
      // Sum issues (both total_issues and total_unit_issues)
      if (!issues[key]) issues[key] = 0;
      if (!unitIssues[key]) unitIssues[key] = 0;
      
      const issueCount = item.issue_counts?.total_issues || 0;
      const unitIssueCount = item.issue_counts?.total_unit_issues || 0;
      
      issues[key] += issueCount;
      unitIssues[key] += unitIssueCount;
    });
    
    return Object.entries(counts).map(([name, count]) => ({ 
      name, 
      "No. Of Uses": count, 
      "No. Hours": Math.round(hours[name] * 100) / 100, // Round to 2 decimal places
      total_issues: issues[name] || 0
    }));
  }

  // Helper to calculate hours from reservation data
  // function calculateHoursFromReservation(reservation, item) {
  //   if (!reservation.reservation_start_date || !reservation.reservation_end_date) return 0;
    
  //   const start = new Date(reservation.reservation_start_date);
  //   const end = new Date(reservation.reservation_end_date);
  //   const durationMs = end - start;
  //   return durationMs / (1000 * 60 * 60);
  // }

  // Gather all venues, vehicles, equipment for the month with hours and issues
  const allVenues = [];
  const allVehicles = [];
  const allEquipment = [];
  
  data.forEach((item) => {
    if (Array.isArray(item.venues)) {
      item.venues.forEach((v) => {
        const venueName = v.venue_name || '';
        allVenues.push({
          name: venueName,
          location: v.venue_location || '',
          startDate: item.reservation_start_date,
          endDate: item.reservation_end_date,
          issue_counts: v.issue_counts || { total_issues: 0 }
        });
      });
    }
    if (Array.isArray(item.vehicles)) {
      item.vehicles.forEach((v) => {
        const vehicleName = `${v.model || v.name || ""}${v.license ? ` (${v.license})` : ""}`;
        allVehicles.push({
          name: vehicleName,
          startDate: item.reservation_start_date,
          endDate: item.reservation_end_date,
          issue_counts: v.issue_counts || { total_issues: 0 }
        });
      });
    }
    if (Array.isArray(item.equipment)) {
      item.equipment.forEach((e) => {
        const equipmentName = `${e.equipment_name || e.name || ""}`;
        allEquipment.push({
          name: equipmentName,
          startDate: item.reservation_start_date,
          endDate: item.reservation_end_date,
          issue_counts: e.issue_counts || { total_issues: 0, total_unit_issues: 0 }
        });
      });
    }
  });

  const venueCounts = countOccurrencesAndHours(
    allVenues, 
    (v) => v.name, 
    (v) => v.startDate, 
    (v) => v.endDate,
    (v) => v.issue_counts.total_issues,
    (v) => v.location || '' // Add location extractor
  );
  const vehicleCounts = countOccurrencesAndHours(
    allVehicles, 
    (v) => v.name, 
    (v) => v.startDate, 
    (v) => v.endDate,
    (v) => v.issue_counts.total_issues
  );
  const equipmentCounts = countOccurrencesAndHoursForEquipment(
    allEquipment, 
    (e) => e.name, 
    (e) => e.startDate, 
    (e) => e.endDate
  );

  // Create workbook and sheets
  const wb = XLSX.utils.book_new();

  // Reservations sheet (detailed, styled)
  const wsReservations = XLSX.utils.json_to_sheet(flatData);
  const headerCellStyle = {
    font: { bold: true },
    fill: { patternType: "solid", fgColor: { rgb: "C6EFCE" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
  };
  const contentCellStyle = {
    alignment: { vertical: "center", wrapText: true },
  };
  const headerKeys = Object.keys(flatData[0] || {});
  wsReservations["!cols"] = headerKeys.map((key) => ({ wch: Math.max(18, key.length + 5) }));
  headerKeys.forEach((key, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
    if (wsReservations[cellRef]) wsReservations[cellRef].s = headerCellStyle;
  });
  for (let r = 1; r <= flatData.length; r++) {
    for (let c = 0; c < headerKeys.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (wsReservations[cellRef]) wsReservations[cellRef].s = contentCellStyle;
    }
  }
  XLSX.utils.book_append_sheet(wb, wsReservations, "Reservations");

  // Venues summary sheet with hours, total issues, and location
  const wsVenues = XLSX.utils.json_to_sheet(venueCounts.length ? venueCounts : [{ name: "No data", location: "", "No. Of Uses": 0, "No. Hours": 0, total_issues: 0 }]);
  // Set column widths for venues sheet
  wsVenues["!cols"] = [
    { wch: 30 }, // name
    { wch: 25 }, // location
    { wch: 15 }, // No. Of Uses
    { wch: 15 }, // No. Hours
    { wch: 15 }  // total_issues
  ];
  XLSX.utils.book_append_sheet(wb, wsVenues, "Venues");

  // Vehicles summary sheet with hours and total issues
  const wsVehicles = XLSX.utils.json_to_sheet(vehicleCounts.length ? vehicleCounts : [{ name: "No data", "No. Of Uses": 0, "No. Hours": 0, total_issues: 0 }]);
  XLSX.utils.book_append_sheet(wb, wsVehicles, "Vehicles");

  // Equipment summary sheet with hours, total issues, and total unit issues
  const wsEquipment = XLSX.utils.json_to_sheet(equipmentCounts.length ? equipmentCounts : [{ name: "No data", "No. Of Uses": 0, "No. Hours": 0, total_issues: 0}]);
  XLSX.utils.book_append_sheet(wb, wsEquipment, "Equipment");

  // Status History sheet (one row per status change, minimal fields + Status)
  const statusRows = [];
  data.forEach((item) => {
    const title = item.reservation_title || "";
    const requester = item.requester_name || "";
    const department = item.department_name || "";
    const history = Array.isArray(item.status_history) ? item.status_history : [];
    history.forEach((h) => {
      statusRows.push({
        Reservation: title,
        Requester: requester,
        Department: department,
        Status: h.status_name || "",
        "Updated At": formatDateTime(h.reservation_updated_at),
        _sortDate: h.reservation_updated_at // Keep raw date for sorting
      });
    });
  });
  
  // Sort statusRows by date in descending order (newest to oldest)
  statusRows.sort((a, b) => {
    const dateA = new Date(a._sortDate);
    const dateB = new Date(b._sortDate);
    return dateB - dateA; // Descending: newest first
  });
  
  // Remove the _sortDate field before creating the sheet
  const statusRowsForSheet = statusRows.map(({ _sortDate, ...rest }) => rest);
  
  const wsStatus = XLSX.utils.json_to_sheet(statusRowsForSheet.length ? statusRowsForSheet : [{ Reservation: "No data", Requester: "", Department: "", Status: "", "Updated At": "" }]);
  // Set friendly column widths and apply styles so the sheet is readable without resizing
  wsStatus["!cols"] = [
    { wch: 40 }, // Reservation
    { wch: 28 }, // Requester
    { wch: 24 }, // Department
    { wch: 18 }, // Status
    { wch: 28 }  // Updated At
  ];
  const statusHeaderKeys = Object.keys(statusRowsForSheet[0] || { Reservation: "", Requester: "", Department: "", Status: "", "Updated At": "" });
  statusHeaderKeys.forEach((key, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
    if (wsStatus[cellRef]) wsStatus[cellRef].s = headerCellStyle;
  });
  for (let r = 1; r <= statusRowsForSheet.length; r++) {
    for (let c = 0; c < statusHeaderKeys.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (wsStatus[cellRef]) wsStatus[cellRef].s = contentCellStyle;
    }
  }
  XLSX.utils.book_append_sheet(wb, wsStatus, "Status History");

  // Write workbook
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([wbout], { type: "application/octet-stream" }),
    `Reservation_Report_${monthStr}.xlsx`
  );
  return true;
}
