import React from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaCar, FaTools } from "react-icons/fa";

// Read-only Completed Checklist Viewer
const ChecklistCompleted = ({ isOpen, onClose, selectedTask }) => {
  if (!isOpen || !selectedTask) return null;

  const ItemRow = ({ isChecked, name, assignedBy }) => (
    <div className="flex items-center gap-2 bg-white rounded-md border border-gray-100 px-3 py-2">
      <span
        className={`inline-flex items-center justify-center w-4 h-4 rounded ${
          isChecked ? "bg-lime-500 text-white" : "bg-gray-200"
        }`}
      >
        {isChecked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <div className="flex flex-col">
        <span className={`text-xs sm:text-sm ${isChecked ? "text-gray-400 line-through" : "text-gray-700"}`}>
          {name}
        </span>
        {assignedBy && (
          <span className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-lime-50 text-lime-700 border border-lime-100 text-[10px] sm:text-xs font-medium">
            <span className="inline-block w-1.5 h-1.5 bg-lime-500 rounded-full" />
            Assigned by: <span className="underline decoration-lime-400/60 underline-offset-2">{assignedBy}</span>
          </span>
        )}
      </div>
    </div>
  );

  const VenueSection = () => {
    const venues = Array.isArray(selectedTask.venues) ? selectedTask.venues : [];
    const venuesWithChecklists = venues
      .map((v) => ({
        ...v,
        checklists: (v.checklists || []).filter((c) => (c.checklist_name || "").trim() !== ""),
      }))
      .filter((v) => v.checklists.length > 0);

    return (
      <div className="bg-white/60 rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
          <FaMapMarkerAlt className="text-lime-700" />
          <h3 className="text-sm font-semibold text-gray-700">Venue Checklists</h3>
          <span className="ml-auto text-xs text-gray-500">{venuesWithChecklists.length} venue(s)</span>
        </div>
        {venuesWithChecklists.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-400">No checklist items</div>
        ) : (
          <div className="p-3 space-y-4">
            {venuesWithChecklists.map((venue) => (
              <div key={venue.reservation_venue_id} className="space-y-2">
                <div className="text-sm font-medium text-gray-700">{venue.name}</div>
                <div className="space-y-2">
                  {venue.checklists.map((c) => (
                    <ItemRow
                      key={c.checklist_venue_id}
                      isChecked={c.isChecked === "1" || c.isChecked === 1}
                      name={c.checklist_name || "Unnamed Item"}
                      assignedBy={c.assigned_by}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const VehicleSection = () => {
    const vehicles = Array.isArray(selectedTask.vehicles) ? selectedTask.vehicles : [];
    // Only show vehicles that have at least one checklist name (per user request)
    const vehiclesWithChecklists = vehicles
      .map((v) => ({
        ...v,
        checklists: (v.checklists || []).filter((c) => (c.checklist_name || "").trim() !== ""),
      }))
      .filter((v) => v.checklists.length > 0);

    return (
      <div className="bg-white/60 rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
          <FaCar className="text-lime-700" />
          <h3 className="text-sm font-semibold text-gray-700">Vehicle Checklists</h3>
          <span className="ml-auto text-xs text-gray-500">{vehiclesWithChecklists.length} vehicle(s)</span>
        </div>
        {vehiclesWithChecklists.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-400">No checklist items</div>
        ) : (
          <div className="p-3 space-y-4">
            {vehiclesWithChecklists.map((vehicle) => (
              <div key={vehicle.reservation_vehicle_id} className="space-y-2">
                <div className="text-sm font-medium text-gray-700">{vehicle.vehicle_license}</div>
                <div className="space-y-2">
                  {vehicle.checklists.map((c) => (
                    <ItemRow
                      key={c.checklist_vehicle_id}
                      isChecked={c.isChecked === "1" || c.isChecked === 1}
                      name={c.checklist_name || "Unnamed Item"}
                      assignedBy={c.assigned_by}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const EquipmentSection = () => {
    const equipments = Array.isArray(selectedTask.equipments) ? selectedTask.equipments : [];

    // For each equipment, keep equipment-level and unit-level items that actually have names
    const normalized = equipments.map((e) => {
      const equipLevel = (e.checklists || []).filter((c) => (c.checklist_name || "").trim() !== "");
      const units = Array.isArray(e.units)
        ? e.units
            .map((u) => ({
              ...u,
              checklists: (u.checklists || []).filter((c) => (c.checklist_name || "").trim() !== ""),
            }))
            .filter((u) => u.checklists.length > 0)
        : [];
      const unitsCount = Array.isArray(e.units) ? e.units.length : 0;
      return { ...e, checklists: equipLevel, units, unitsCount };
    });

    // Only equipments that have at least equipment-level items or unit-level items
    const equipmentsWithAny = normalized.filter(
      (e) => (e.checklists && e.checklists.length > 0) || (e.units && e.units.length > 0),
    );

    return (
      <div className="bg-white/60 rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
          <FaTools className="text-lime-700" />
          <h3 className="text-sm font-semibold text-gray-700">Equipment Checklists</h3>
          <span className="ml-auto text-xs text-gray-500">{equipmentsWithAny.length} equipment(s)</span>
        </div>
        {equipmentsWithAny.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-400">No checklist items</div>
        ) : (
          <div className="p-3 space-y-4">
            {equipmentsWithAny.map((equipment) => (
              <div key={equipment.reservation_equipment_id} className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">{equipment.name}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span>Quantity: {equipment.quantity || "0"}</span>
                    {equipment.unitsCount > 0 && (
                      <span>Units: {equipment.unitsCount}</span>
                    )}
                  </div>
                </div>
                {equipment.checklists && equipment.checklists.length > 0 && (
                  <div className="space-y-2">
                    {equipment.checklists.map((c) => (
                      <ItemRow
                        key={c.checklist_equipment_id}
                        isChecked={c.isChecked === "1" || c.isChecked === 1}
                        name={c.checklist_name || "Unnamed Item"}
                        assignedBy={c.assigned_by}
                      />
                    ))}
                  </div>
                )}

                {equipment.units && equipment.units.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    {equipment.units.map((unit) => (
                      <div key={unit.unit_id} className="space-y-2">
                        <div className="text-xs text-gray-600">SN: {unit.unit_serial_number}</div>
                        <div className="space-y-2">
                          {unit.checklists.map((c) => (
                            <ItemRow
                              key={c.checklist_equipment_id}
                              isChecked={c.isChecked === "1" || c.isChecked === 1}
                              name={c.checklist_name || "Unnamed Item"}
                              assignedBy={c.assigned_by}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-5xl max-h-[95vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-lime-900 to-green-900 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold">{selectedTask.reservation_title || "Reservation"}</h2>
                <p className="text-xs sm:text-sm text-green-100">Completed Checklists</p>
              </div>
              <button onClick={onClose} className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm">
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <VenueSection />
            <VehicleSection />
            <EquipmentSection />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default ChecklistCompleted;