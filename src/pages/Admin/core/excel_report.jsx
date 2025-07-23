import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function generateReservationReport(data, monthStr) {
  // Prepare detailed reservation data (original sheet), exclude venues, vehicles, equipment, drivers
  const flatData = data.map(({ passengers, reservation_id, reservation_user_id, user_level_name, venues, vehicles, equipment, drivers, ...rest }) => ({
    ...rest,
    role: user_level_name,
  }));

  if (!flatData.length) return false;

  // Helper to count occurrences
  function countOccurrences(items, keyFn) {
    const counts = {};
    items.forEach((item) => {
      const key = keyFn(item);
      if (!key) return;
      if (!counts[key]) counts[key] = 0;
      counts[key] += 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }

  // Gather all venues, vehicles, equipment for the month
  const allVenues = [];
  const allVehicles = [];
  const allEquipment = [];
  data.forEach((item) => {
    if (Array.isArray(item.venues)) {
      item.venues.forEach((v) => {
        allVenues.push(`${v.venue_name}${v.venue_location ? ` (${v.venue_location})` : ""}`);
      });
    }
    if (Array.isArray(item.vehicles)) {
      item.vehicles.forEach((v) => {
        allVehicles.push(`${v.vehicle_model || v.name || ""}${v.vehicle_plate ? ` (${v.vehicle_plate})` : ""}`);
      });
    }
    if (Array.isArray(item.equipment)) {
      item.equipment.forEach((e) => {
        allEquipment.push(`${e.equipment_name || e.name || ""}`);
      });
    }
  });

  const venueCounts = countOccurrences(allVenues, (v) => v);
  const vehicleCounts = countOccurrences(allVehicles, (v) => v);
  const equipmentCounts = countOccurrences(allEquipment, (e) => e);

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

  // Venues summary sheet
  const wsVenues = XLSX.utils.json_to_sheet(venueCounts.length ? venueCounts : [{ name: "No data", count: 0 }]);
  XLSX.utils.book_append_sheet(wb, wsVenues, "Venues");

  // Vehicles summary sheet
  const wsVehicles = XLSX.utils.json_to_sheet(vehicleCounts.length ? vehicleCounts : [{ name: "No data", count: 0 }]);
  XLSX.utils.book_append_sheet(wb, wsVehicles, "Vehicles");

  // Equipment summary sheet
  const wsEquipment = XLSX.utils.json_to_sheet(equipmentCounts.length ? equipmentCounts : [{ name: "No data", count: 0 }]);
  XLSX.utils.book_append_sheet(wb, wsEquipment, "Equipment");

  // Write workbook
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([wbout], { type: "application/octet-stream" }),
    `Reservation_Report_${monthStr}.xlsx`
  );
  return true;
}
