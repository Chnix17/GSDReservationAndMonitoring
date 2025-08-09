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
  const flatData = data.map(({ passengers, reservation_id, reservation_user_id, user_level_name, venues, vehicles, equipment, drivers, active, ...rest }) => ({
    ...rest,
    role: user_level_name,
    reservation_start_date: formatDateTime(rest.reservation_start_date),
    reservation_end_date: formatDateTime(rest.reservation_end_date),
    reservation_created_at: formatDateTime(rest.reservation_created_at)
  }));

  if (!flatData.length) return false;

  // Helper to count occurrences, calculate hours, and sum issues
  function countOccurrencesAndHours(items, keyFn, startDateFn, endDateFn, issueCountFn) {
    const counts = {};
    const hours = {};
    const issues = {};
    
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
    });
    
    return Object.entries(counts).map(([name, count]) => ({ 
      name, 
      "No. Of Uses": count, 
      "No. Hours": Math.round(hours[name] * 100) / 100, // Round to 2 decimal places
      total_issues: issues[name] || 0
    }));
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
        const venueName = `${v.venue_name}${v.venue_location ? ` (${v.venue_location})` : ""}`;
        allVenues.push({
          name: venueName,
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
    (v) => v.issue_counts.total_issues
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

  // Venues summary sheet with hours and total issues
  const wsVenues = XLSX.utils.json_to_sheet(venueCounts.length ? venueCounts : [{ name: "No data", "No. Of Uses": 0, "No. Hours": 0, total_issues: 0 }]);
  XLSX.utils.book_append_sheet(wb, wsVenues, "Venues");

  // Vehicles summary sheet with hours and total issues
  const wsVehicles = XLSX.utils.json_to_sheet(vehicleCounts.length ? vehicleCounts : [{ name: "No data", "No. Of Uses": 0, "No. Hours": 0, total_issues: 0 }]);
  XLSX.utils.book_append_sheet(wb, wsVehicles, "Vehicles");

  // Equipment summary sheet with hours, total issues, and total unit issues
  const wsEquipment = XLSX.utils.json_to_sheet(equipmentCounts.length ? equipmentCounts : [{ name: "No data", "No. Of Uses": 0, "No. Hours": 0, total_issues: 0}]);
  XLSX.utils.book_append_sheet(wb, wsEquipment, "Equipment");

  // Write workbook
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([wbout], { type: "application/octet-stream" }),
    `Reservation_Report_${monthStr}.xlsx`
  );
  return true;
}
