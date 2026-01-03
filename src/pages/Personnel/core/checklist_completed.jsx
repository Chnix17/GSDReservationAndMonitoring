// import React from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaCar, FaTools } from "react-icons/fa";
import { Drawer, Divider, Badge, Tag } from "antd";
import { useMediaQuery } from "react-responsive";
import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons';

// Read-only Completed Checklist Viewer
const ChecklistCompleted = ({ isOpen, onClose, selectedTask }) => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  // const isDesktop = useMediaQuery({ minWidth: 1024 });

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
              <div key={venue.reservation_venue_id} className="space-y-2 bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-medium text-gray-700">{venue.name}</div>
                {venue.building_name && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <InfoCircleOutlined className="text-blue-500" />
                    <span>Building: <span className="font-medium text-gray-800">{venue.building_name}</span></span>
                  </div>
                )}
                {venue.participants && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <UserOutlined className="text-gray-500" />
                    <span>Participants: <span className="font-medium text-gray-800">{venue.participants}</span></span>
                  </div>
                )}
                
                {/* Venue Conditions */}
                <div className="mt-2">
                  <Divider className="my-2" />
                  <div className="flex items-center gap-2 mb-2">
                    <InfoCircleOutlined className="text-blue-500 text-xs" />
                    <span className="text-xs font-semibold text-gray-700">Return Condition:</span>
                  </div>
                  {venue.conditions && venue.conditions.length > 0 ? (
                    <div className="space-y-2">
                      {venue.conditions.map((condition, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-md p-2">
                          <div className="flex items-center justify-between">
                            <Badge status={condition.is_active === 1 ? "success" : "default"} 
                                   text={<span className="text-xs font-medium">{condition.condition_name || 'Condition'}</span>} />
                          </div>
                          {condition.remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Remarks:</span> {condition.remarks}
                            </div>
                          )}
                          {condition.admin_remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Admin Remarks:</span> {condition.admin_remarks}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-center gap-2">
                      <ExclamationCircleOutlined className="text-amber-500 text-xs" />
                      <span className="text-xs text-amber-700">Not yet returned or no condition reported</span>
                    </div>
                  )}
                </div>
                
                <Divider className="my-2" />
                <span className="text-xs font-semibold text-gray-600">Checklists:</span>
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
              <div key={vehicle.reservation_vehicle_id} className="space-y-2 bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-medium text-gray-700">{vehicle.vehicle_license}</div>
                
                {/* Display drivers */}
                {vehicle.drivers && vehicle.drivers.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    {vehicle.drivers.map((driver, driverIndex) => (
                      <div key={driver.reservation_driver_id || driverIndex} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">Driver:</span>
                        <span>{driver.driver_name || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Vehicle Conditions */}
                <div className="mt-2">
                  <Divider className="my-2" />
                  <div className="flex items-center gap-2 mb-2">
                    <InfoCircleOutlined className="text-blue-500 text-xs" />
                    <span className="text-xs font-semibold text-gray-700">Return Condition:</span>
                  </div>
                  {vehicle.conditions && vehicle.conditions.length > 0 ? (
                    <div className="space-y-2">
                      {vehicle.conditions.map((condition, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-md p-2">
                          <div className="flex items-center justify-between">
                            <Badge status={condition.is_active === 1 ? "success" : "default"} 
                                   text={<span className="text-xs font-medium">{condition.condition_name || 'Condition'}</span>} />
                          </div>
                          {condition.remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Remarks:</span> {condition.remarks}
                            </div>
                          )}
                          {condition.admin_remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Admin Remarks:</span> {condition.admin_remarks}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-center gap-2">
                      <ExclamationCircleOutlined className="text-amber-500 text-xs" />
                      <span className="text-xs text-amber-700">Not yet returned or no condition reported</span>
                    </div>
                  )}
                </div>
                
                <Divider className="my-2" />
                <span className="text-xs font-semibold text-gray-600">Checklists:</span>
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
            .filter((u) => u.checklists.length > 0 || (u.conditions && u.conditions.length > 0))
        : [];
      const unitsCount = Array.isArray(e.units) ? e.units.length : 0;
      return { ...e, checklists: equipLevel, units, unitsCount };
    });

    // Only equipments that have at least equipment-level items, unit-level items, or conditions
    const equipmentsWithAny = normalized.filter(
      (e) => (e.checklists && e.checklists.length > 0) || 
             (e.units && e.units.length > 0) ||
             (e.conditions && e.conditions.length > 0),
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
              <div key={equipment.reservation_equipment_id} className="space-y-3 bg-white rounded-lg p-3 border border-gray-200">
                <div>
                  <div className="text-sm font-medium text-gray-700">{equipment.name}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span>Quantity: {equipment.quantity || "0"}</span>
                    {equipment.unitsCount > 0 && (
                      <span>Units: {equipment.unitsCount}</span>
                    )}
                  </div>
                </div>
                
                {/* Equipment Quantity Summary */}
                {equipment.quantity && (
                  <div className="flex gap-2 items-center flex-wrap">
                    <Tag color="blue" className="text-xs">Total Qty: {equipment.quantity}</Tag>
                    {/* For serialized equipment with units, calculate status from units */}
                    {equipment.units && equipment.units.length > 0 ? (
                      <>
                        {(() => {
                          const goodCount = equipment.units.filter(u => u.status_availability_id === 1).length;
                          const inspectionCount = equipment.units.filter(u => u.status_availability_id === 6).length;
                          const missingCount = equipment.units.filter(u => u.status_availability_id === 7).length;
                          const damagedCount = equipment.units.filter(u => u.status_availability_id === 8).length;
                          
                          return (
                            <>
                              {goodCount > 0 && (
                                <Tag color="green" icon={<CheckCircleOutlined />} className="text-xs">Good: {goodCount}</Tag>
                              )}
                              {inspectionCount > 0 && (
                                <Tag color="processing" icon={<ExclamationCircleOutlined />} className="text-xs">For Inspection: {inspectionCount}</Tag>
                              )}
                              {missingCount > 0 && (
                                <Tag color="magenta" icon={<ExclamationCircleOutlined />} className="text-xs">Missing: {missingCount}</Tag>
                              )}
                              {damagedCount > 0 && (
                                <Tag color="volcano" icon={<ExclamationCircleOutlined />} className="text-xs">Damaged: {damagedCount}</Tag>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      /* For bulk equipment, use qty_good and qty_bad */
                      equipment.qty_good !== undefined && (
                        <>
                          <Tag color="green" icon={<CheckCircleOutlined />} className="text-xs">Good: {equipment.qty_good}</Tag>
                          {equipment.qty_bad > 0 && (
                            <Tag color="red" icon={<ExclamationCircleOutlined />} className="text-xs">Bad: {equipment.qty_bad}</Tag>
                          )}
                        </>
                      )
                    )}
                  </div>
                )}
                
                {/* Equipment Conditions (for bulk) */}
                {equipment.conditions && equipment.conditions.length > 0 && (
                  <div className="mt-2">
                    <Divider className="my-2" />
                    <div className="flex items-center gap-2 mb-2">
                      <InfoCircleOutlined className="text-blue-500 text-xs" />
                      <span className="text-xs font-semibold text-gray-700">Return Condition:</span>
                    </div>
                    <div className="space-y-2">
                      {equipment.conditions.map((condition, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-md p-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <Badge status={condition.is_active === 1 ? "success" : "default"} 
                                   text={<span className="text-xs font-medium">{condition.condition_name || 'Condition'}</span>} />
                            {condition.qty_bad && <Tag color="red" className="text-xs">Qty Bad: {condition.qty_bad}</Tag>}
                          </div>
                          {condition.remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Remarks:</span> {condition.remarks}
                            </div>
                          )}
                          {condition.admin_remarks && (
                            <div className="text-xs text-gray-600 mt-1 ml-5">
                              <span className="font-medium">Admin Remarks:</span> {condition.admin_remarks}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Units (for serialized equipment) */}
                {equipment.units && equipment.units.length > 0 && (
                  <div className="mt-2">
                    <Divider className="my-2" />
                    <div className="flex items-center gap-2 mb-2">
                      <InfoCircleOutlined className="text-purple-500 text-xs" />
                      <span className="text-xs font-semibold text-gray-700">Units:</span>
                    </div>
                    <div className="space-y-2">
                      {equipment.units.map((unit) => (
                        <div key={unit.unit_id} className="bg-purple-50 border border-purple-200 rounded-md p-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-xs text-purple-900">
                                Serial: {unit.unit_serial_number || 'N/A'}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {unit.equipment_brand && (
                                  <span className="text-xs text-gray-600">
                                    <span className="font-medium">Brand:</span> {unit.equipment_brand}
                                  </span>
                                )}
                                {unit.equipment_model && (
                                  <span className="text-xs text-gray-600">
                                    <span className="font-medium">Model:</span> {unit.equipment_model}
                                  </span>
                                )}
                                {unit.inch && (
                                  <span className="text-xs text-gray-600">
                                    <span className="font-medium">Size:</span> {unit.inch}"
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Unit Status Tag */}
                            {unit.status_availability_id && (
                              <Tag 
                                color={
                                  unit.status_availability_id === 1 ? 'success' :
                                  unit.status_availability_id === 6 ? 'processing' :
                                  unit.status_availability_id === 7 ? 'magenta' :
                                  unit.status_availability_id === 8 ? 'volcano' :
                                  'default'
                                }
                                className="text-xs"
                              >
                                {
                                  unit.status_availability_id === 1 ? 'Good' :
                                  unit.status_availability_id === 6 ? 'For Inspection' :
                                  unit.status_availability_id === 7 ? 'Missing' :
                                  unit.status_availability_id === 8 ? 'Damaged' :
                                  'Unknown'
                                }
                              </Tag>
                            )}
                          </div>
                          {unit.conditions && unit.conditions.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {unit.conditions.map((condition, condIdx) => (
                                <div key={condIdx} className="bg-white border border-purple-100 rounded p-1 ml-2">
                                  <Badge status={condition.is_active === 1 ? "success" : "default"} 
                                         text={<span className="text-xs">{condition.condition_name || 'Condition'}</span>} />
                                  {condition.remarks && (
                                    <div className="text-xs text-gray-600 mt-1 ml-5">
                                      <span className="font-medium">Remarks:</span> {condition.remarks}
                                    </div>
                                  )}
                                  {condition.admin_remarks && (
                                    <div className="text-xs text-gray-600 mt-1 ml-5">
                                      <span className="font-medium">Admin Remarks:</span> {condition.admin_remarks}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 italic mt-1 ml-2">No condition reported</div>
                          )}
                          
                          {/* Unit Checklists */}
                          {unit.checklists && unit.checklists.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {unit.checklists.map((c) => (
                                <ItemRow
                                  key={c.checklist_equipment_id}
                                  isChecked={c.isChecked === "1" || c.isChecked === 1}
                                  name={c.checklist_name || "Unnamed Item"}
                                  assignedBy={c.assigned_by}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No conditions for equipment */}
                {/* Only show warning if:
                    - No equipment-level conditions AND
                    - No units with conditions AND
                    - No bulk return data (qty_good is undefined/null)
                */}
                {(!equipment.conditions || equipment.conditions.length === 0) && 
                 (!equipment.units || equipment.units.length === 0 || 
                  !equipment.units.some(u => u.conditions && u.conditions.length > 0)) &&
                 (equipment.qty_good === undefined || equipment.qty_good === null) && (
                  <div className="mt-2">
                    <Divider className="my-2" />
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-center gap-2">
                      <ExclamationCircleOutlined className="text-amber-500 text-xs" />
                      <span className="text-xs text-amber-700">Not yet returned or no condition reported</span>
                    </div>
                  </div>
                )}
                
                {equipment.checklists && equipment.checklists.length > 0 && (
                  <>
                    <Divider className="my-2" />
                    <span className="text-xs font-semibold text-gray-600">Checklists:</span>
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Mobile view - Drawer
  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        onClose={onClose}
        placement="bottom"
        height="95%"
        className="checklist-completed-drawer"
        styles={{
          body: { padding: 0, background: '#fafff4' },
          header: { background: 'linear-gradient(to right, #365314, #166534)', borderBottom: '1px solid #e5e7eb' }
        }}
        title={
          <span className="text-white font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed Checklists
          </span>
        }
        footer={
          <div className="p-4">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-base shadow-sm hover:bg-gray-900 hover:text-lime-100 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        }
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">{selectedTask.reservation_title || "Reservation"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">View completed checklist items</p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Event Information Section */}
            <div className="bg-white/40 backdrop-blur-sm p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-400">Event Information</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                  <p className="text-sm text-gray-700">{selectedTask.reservation_title || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                  <p className="text-sm text-gray-700">{selectedTask.reservation_description || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Requester Name</label>
                  <p className="text-sm text-gray-700">{selectedTask.user_details?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Department</label>
                  <p className="text-sm text-gray-700">{selectedTask.user_details?.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                  <p className="text-sm text-gray-700">{selectedTask.user_details?.role || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                  <p className="text-sm text-gray-700">
                    {selectedTask.reservation_start_date
                      ? new Date(selectedTask.reservation_start_date).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
                  <p className="text-sm text-gray-700">
                    {selectedTask.reservation_end_date
                      ? new Date(selectedTask.reservation_end_date).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            <VenueSection />
            <VehicleSection />
            <EquipmentSection />
          </div>
        </div>
      </Drawer>
    );
  }

  // Desktop/Tablet view - Modal
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`bg-[#fafff4] border border-gray-100 rounded-xl shadow-sm w-full ${
            isTablet ? 'max-w-4xl' : 'max-w-5xl'
          } max-h-[95vh] overflow-hidden flex flex-col`}
        >
          <div className="sticky top-0 bg-gradient-to-r from-lime-900 to-green-900 px-4 py-3 border-b border-gray-100 z-10 rounded-t-xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-lime-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {selectedTask.reservation_title || "Reservation"}
                </h2>
                <p className="text-xs sm:text-sm text-green-100 mt-0.5">Completed Checklists</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-lime-100/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Event Information Section */}
            <div className="bg-white/40 backdrop-blur-sm p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-400">Event Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                    <p className="text-xs sm:text-sm text-gray-700">{selectedTask.reservation_title || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                    <p className="text-xs sm:text-sm text-gray-700">{selectedTask.reservation_description || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Requester Name</label>
                    <p className="text-xs sm:text-sm text-gray-700">{selectedTask.user_details?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Department</label>
                    <p className="text-xs sm:text-sm text-gray-700">{selectedTask.user_details?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                    <p className="text-xs sm:text-sm text-gray-700">{selectedTask.user_details?.role || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                    <p className="text-xs sm:text-sm text-gray-700">
                      {selectedTask.reservation_start_date
                        ? new Date(selectedTask.reservation_start_date).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
                    <p className="text-xs sm:text-sm text-gray-700">
                      {selectedTask.reservation_end_date
                        ? new Date(selectedTask.reservation_end_date).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <VenueSection />
            <VehicleSection />
            <EquipmentSection />
          </div>

          <div className={`w-full flex gap-4 p-4 ${
            isTablet ? 'justify-center' : 'justify-end'
          }`}>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium text-sm shadow-sm hover:bg-gray-900 hover:text-lime-100 transition-all focus:outline-none focus:ring-2 focus:ring-lime-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default ChecklistCompleted;