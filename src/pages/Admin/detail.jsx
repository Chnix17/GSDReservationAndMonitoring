const DetailModal = ({ 
    visible, 
    onClose, 
    reservationDetails, 
    setReservationDetails, 
    onAccept, 
    onDecline, 
    isAccepting, 
    isDeclining, 
    setIsDeclineReasonModalOpen, 
    declineReason, 
    setDeclineReason, 
    fetchReservationDetails, 
    currentRequest, 
    setErrorMessage, 
    setIsErrorModalOpen, 
    fetchReservations,
    handleRescheduleError
}) => {
    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    // const isDesktop = useMediaQuery({ minWidth: 1024 });
    
    const [deansApproval, setDeansApproval] = useState([]);
    const [isApproverListVisible, setIsApproverListVisible] = useState(false);
    const [isLoadingDeans, setIsLoadingDeans] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleResources, setRescheduleResources] = useState(null);

    const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
    
    // Debug logging for Change Request - at component level
    if (reservationDetails?.status_name === "Change Request") {
        console.log('=== CHANGE REQUEST MODAL DEBUG ===');
        console.log('Modal opened with reservation details:', reservationDetails);
        console.log('Current User ID:', currentUserId);
        console.log('Approval Sequence:', reservationDetails?.approval_sequence);
        console.log('Status Name:', reservationDetails?.status_name);
        console.log('===================================');
    }
    
    // Find the current approver from approval sequence
    // const currentApprover = reservationDetails?.approval_sequence?.find(approver => !approver.has_approved);
    // const isCurrentApprover = currentApprover && String(currentApprover.users_id) === String(currentUserId);
    
    // // Find the current pending approval from status history
    // const currentPendingApproval = reservationDetails?.status_history?.find(s => s.status_name === 'Pending' && s.reservation_active === 0);
    
    // For backward compatibility, keep these variables but point to the same pending approval
    // However, we'll modify the logic to use approval sequence for determining approver
    // const adminApprovalStage = currentPendingApproval;
    // const departmentApproval = currentPendingApproval;
    const encryptedUrl = SecureStorage.getLocalItem("url");
   
    // const isDepartmentStageForCurrentUser = isCurrentApprover || !!(departmentApproval && String(departmentApproval.reservation_users_id) === String(currentUserId) && departmentApproval.reservation_active === 0);
    // const isAdminStageForCurrentUser = isCurrentApprover || !!(adminApprovalStage && String(adminApprovalStage.reservation_users_id) === String(currentUserId) && adminApprovalStage.reservation_active === 0);

    useEffect(() => {
        const fetchDeansApproval = async () => {
            if (!visible || !reservationDetails?.reservation_id) {
                setDeansApproval([]);
                return;
            }

            setIsLoadingDeans(true);
            try {
                const response = await axios.post(`${encryptedUrl}/Admin.php`, {
                    operation: 'fetchDeansApproval',
                    reservation_id: reservationDetails.reservation_id
                });
                if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
                    setDeansApproval(response.data.data);
                } else {
                    setDeansApproval([]);
                }
            } catch (error) {
                console.error('Error fetching deans approval:', error);
                setDeansApproval([]);
            } finally {
                setIsLoadingDeans(false);
            }
        };

        fetchDeansApproval();

        return () => {
            if (!visible) {
                setDeansApproval([]);
                setIsApproverListVisible(false);
            }
        };
    }, [visible, reservationDetails, encryptedUrl]);
    
    // Count the number of approved deans
    const approvedDeans = deansApproval.filter(approval => approval.is_approved === 1 || approval.is_approved === '1');
    const approvedDeansCount = approvedDeans.length;
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [vehicleDriverAssignments, setVehicleDriverAssignments] = useState({});
    const [customDriverNames, setCustomDriverNames] = useState({});
    const [driverError, setDriverError] = useState("");
    // const [collapsedSections, setCollapsedSections] = useState({
    //     venues: false,
    //     vehicles: false,
    //     equipment: false
    // });

    // // Toggle section collapse
    // const toggleSection = (section) => {
    //     setCollapsedSections(prev => ({
    //         ...prev,
    //         [section]: !prev[section]
    //     }));
    // };
    
    // Fetch available drivers when modal opens
    useEffect(() => {
        setDriverError(""); // Reset driver error when modal opens or reservation changes
        const fetchDrivers = async () => {
            if (!reservationDetails || !reservationDetails.reservation_start_date || !reservationDetails.reservation_end_date) return;
            try {
                console.log('Fetching drivers with params:', {
                    startDateTime: reservationDetails.reservation_start_date,
                    endDateTime: reservationDetails.reservation_end_date,
                    userId: reservationDetails.reservation_user_id || reservationDetails.user_id,
                    reservationId: reservationDetails.reservation_id
                });
                
                const response = await axios.post(`${encryptedUrl}/Admin.php`, {
                    operation: 'fetchDriver',
                    startDateTime: reservationDetails.reservation_start_date,
                    endDateTime: reservationDetails.reservation_end_date,
                    userId: reservationDetails.reservation_user_id || reservationDetails.user_id,
                    reservationId: reservationDetails.reservation_id
                });
                
                console.log('Driver fetch response:', response.data);
                
                if (response.data?.status === 'success') {
                    const drivers = response.data.data.map(driver => ({
                        ...driver,
                        full_name: [
                            driver.users_fname,
                            driver.users_mname ? driver.users_mname : '',
                            driver.users_lname
                        ].filter(Boolean).join(' ')
                    }));
                    console.log('Setting available drivers:', drivers);
                    setAvailableDrivers(drivers);
                } else {
                    console.log('Driver fetch failed:', response.data);
                    setAvailableDrivers([]);
                }
            } catch (error) {
                console.error('Error fetching drivers:', error);
                setAvailableDrivers([]);
            }
        };
        if (visible) {
            fetchDrivers();
            // Initialize assignments from reservationDetails
            if (reservationDetails && reservationDetails.vehicles) {
                const assignments = {};
                (reservationDetails.vehicles || []).forEach(vehicle => {
                    // Try to find assigned driver for this vehicle
                    const assignedDriver = (reservationDetails.drivers || []).find(driver => 
                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                    );
                    if (assignedDriver && assignedDriver.driver_id) {
                        assignments[vehicle.vehicle_id] = assignedDriver.driver_id;
                    }
                });
                setVehicleDriverAssignments(assignments);
            }
            // Check for sufficient drivers immediately
            if (reservationDetails && reservationDetails.vehicles && reservationDetails.vehicles.length > 0) {
                setTimeout(() => {
                    setDriverError("");
                }, 200); // slight delay to ensure availableDrivers is set
            }
        }
    }, [visible, reservationDetails, encryptedUrl, availableDrivers.length]);
    // const fetchReservationDetailsForModal = async (reservationId) => {
    //     try {
    //         const response = await axios.post(`${encryptedUrl}/user.php`, 
    //             {
    //                 operation: 'fetchRequestById',  
    //                 reservation_id: reservationId  
    //             },
    //             {
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 timeout: 10000 // 10 second timeout
    //             }
    //         );

    //         if (response.data?.status === 'success' && response.data.data) {
    //             return response.data.data;
    //         }
    //         return null;
    //     } catch (error) {
    //         console.error('Error fetching reservation details:', error);
    //         toast.error('Error fetching reservation details');
    //         return null;
    //     }
    // };
    
    if (!reservationDetails) return null;



    // Add priority checking logic
    const checkPriority = () => {
        // First check if the reservation is expired
        const isExpired = new Date(reservationDetails.reservation_end_date) < new Date();
        if (isExpired) {
            return {
                hasPriority: false,
                message: "This reservation has expired and cannot be approved."
            };
        }

        // First check if there are any actual resource conflicts
        const hasVenueConflict = reservationDetails.venues?.some(requestedVenue => 
            reservationDetails.availabilityData?.unavailable_venues?.some(unavailableVenue => 
                String(requestedVenue.venue_id) === String(unavailableVenue.ven_id)
            )
        );

        const hasVehicleConflict = reservationDetails.vehicles?.some(requestedVehicle => 
            reservationDetails.availabilityData?.unavailable_vehicles?.some(unavailableVehicle => 
                String(requestedVehicle.vehicle_id) === String(unavailableVehicle.vehicle_id)
            )
        );

        const hasEquipmentConflict = reservationDetails.equipment?.some(requestedEquipment => {
            const unavailableEquipment = reservationDetails.availabilityData?.unavailable_equipment?.find(
                e => String(e.equip_id) === String(requestedEquipment.equipment_id)
            );
            
            if (!unavailableEquipment) return false;
            
            const remainingQuantity = parseInt(unavailableEquipment.total_quantity) - parseInt(unavailableEquipment.reserved_quantity);
            return parseInt(requestedEquipment.quantity) > remainingQuantity;
        });

        const hasAnyResourceConflict = hasVenueConflict || hasVehicleConflict || hasEquipmentConflict;

        // If no resource conflicts, approve immediately
        if (!hasAnyResourceConflict) {
            return { 
                hasPriority: true, 
                message: "No conflicting reservations found." 
            };
        }

        // Get current user's level and department from reservation details
        const currentUserLevel = reservationDetails.user_level_name;
        const currentUserDepartment = reservationDetails.department_name;

        console.log("This is the current user level and department", currentUserLevel, currentUserDepartment);

        // Check if user is a Department Head from COO department or Secretary from GSD department
        const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
        const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
        console.log("Can override reservation:", isDepartmentHeadFromCOO || isSecretaryFromGSD);

        // If user is Department Head from COO or Secretary from GSD, they can override any reservation
        if (isDepartmentHeadFromCOO || isSecretaryFromGSD) {
            return {
                hasPriority: true,
                message: `As ${isDepartmentHeadFromCOO ? 'Department Head from COO department' : 'Secretary from GSD department'}, you can override any existing reservation.`
            };
        }

        // Check against conflicting reservations
        const hasConflicts = reservationDetails.availabilityData?.reservation_users?.length > 0;
        
        if (!hasConflicts) {
            return { 
                hasPriority: true, 
                message: "No conflicting reservations found." 
            };
        }

        // Check if user is a Department Head from COO department or Secretary from GSD department
        
        // Only these roles can override reservations
        if (isDepartmentHeadFromCOO || isSecretaryFromGSD) {
            return {
                hasPriority: true,
                message: `As ${isDepartmentHeadFromCOO ? 'Department Head from COO department' : 'Secretary from GSD department'}, you can override any existing reservation.`
            };
        } else {
            // For other users, check if they have higher priority than conflicting users
            const userPriorities = {
                'COO': 4,
                'Department Head': 3
            };

            const currentPriority = userPriorities[currentUserLevel] || 0;
            
            const canOverride = reservationDetails.availabilityData.reservation_users.every(conflictUser => {
                const conflictingPriority = userPriorities[conflictUser.user_level_name] || 0;
                return currentPriority > conflictingPriority;
            });
            
            if (canOverride) {
                return {
                    hasPriority: true,
                    message: `You have permission to override this reservation as ${currentUserLevel}.`
                };
            } else {
                return {
                    hasPriority: false,
                    message: "You do not have permission to override this reservation."
                };
            }
        }
    };

    // // Determine if the proposed new date range is within the original reservation range
    // const isProposedWithinOriginalRange = () => {
    // 	try {
    // 		const originalStart = reservationDetails?.reservation_start_date ? new Date(reservationDetails.reservation_start_date) : null;
    // 		const originalEnd = reservationDetails?.reservation_end_date ? new Date(reservationDetails.reservation_end_date) : null;
    // 		if (!originalStart || !originalEnd) return true;

    // 		// Prefer reschedule dates when in Change Request; otherwise use effective dates if present
    // 		const useReschedule = reservationDetails?.status_name === "Change Request" && reservationDetails?.reschedule_start_date && reservationDetails?.reschedule_end_date;
    // 		const proposedStartStr = useReschedule ? reservationDetails.reschedule_start_date : reservationDetails?.effective_start_date;
    // 		const proposedEndStr = useReschedule ? reservationDetails.reschedule_end_date : reservationDetails?.effective_end_date;
    // 		if (!proposedStartStr || !proposedEndStr) return true;

    // 		const proposedStart = new Date(proposedStartStr);
    // 		const proposedEnd = new Date(proposedEndStr);

    // 		return proposedStart >= originalStart && proposedEnd <= originalEnd;
    // 	} catch (e) {
    // 		return true;
    // 	}
    // };

    // const checkResourceAvailability = (type, id, data) => {
    //     if (!data) return true;
        
    //     switch (type) {
    //         case 'venue':
    //             return !data.unavailable_venues?.some(v => String(v.ven_id) === String(id));
    //         case 'vehicle':
    //             return !data.unavailable_vehicles?.some(v => String(v.vehicle_id) === String(id));
    //         case 'equipment':
    //             const unavailableEquipment = data.unavailable_equipment?.find(e => String(e.equip_id) === String(id));
    //             if (!unavailableEquipment) return true;
                
    //             // Find the requested equipment quantity from reservationDetails
    //             const requestedEquipment = reservationDetails.equipment?.find(e => String(e.equipment_id) === String(id));
    //             if (!requestedEquipment) return true;
                
    //             // Calculate remaining quantity
    //             const remainingQuantity = parseInt(unavailableEquipment.total_quantity) - parseInt(unavailableEquipment.reserved_quantity);
                
    //             // Check if requested quantity can be accommodated
    //             return parseInt(requestedEquipment.quantity) <= remainingQuantity;
    //         case 'driver':
    //             return !data.unavailable_drivers?.some(d => String(d.driver_id) === String(id));
    //         default:
    //             return true;
    //     }
    // };

    // Handler for driver assignment change
    const handleDriverAssign = (vehicleId, driverId) => {
        // Handle empty string (unselect) by removing the assignment
        if (driverId === '') {
            setVehicleDriverAssignments(prev => {
                const newState = { ...prev };
                delete newState[vehicleId];
                return newState;
            });
            
            // Clear custom driver name when unselecting
            setCustomDriverNames(prev => {
                const newState = { ...prev };
                delete newState[vehicleId];
                return newState;
            });
        } else {
            // Handle null assignment (No Driver Available option)
            const assignmentValue = driverId === 'null' ? null : driverId;
            setVehicleDriverAssignments(prev => ({ ...prev, [vehicleId]: assignmentValue }));
            
            // Clear custom driver name when selecting a real driver
            if (driverId !== 'custom') {
                setCustomDriverNames(prev => {
                    const newState = { ...prev };
                    delete newState[vehicleId];
                    return newState;
                });
            }
        }
        
        // Clear driver error when assignment is made
        if (driverError) {
            setDriverError("");
        }
    };

    // Handler for custom driver name input
    const handleCustomDriverName = (vehicleId, driverName) => {
        setCustomDriverNames(prev => ({ ...prev, [vehicleId]: driverName }));
        
        // Set assignment to 'custom' when entering custom name
        if (driverName.trim()) {
            setVehicleDriverAssignments(prev => ({ ...prev, [vehicleId]: 'custom' }));
        } else {
            // Clear assignment if name is empty
            setVehicleDriverAssignments(prev => {
                const newState = { ...prev };
                delete newState[vehicleId];
                return newState;
            });
        }
        
        // Clear driver error when assignment is made
        if (driverError) {
            setDriverError("");
        }
    };

    // Modified Accept handler to check driver assignments and available drivers
    const handleAcceptWithDriverCheck = async () => {
        setDriverError("");
        // If there are vehicles, check assignments
        if (reservationDetails?.vehicles && reservationDetails.vehicles.length > 0) {
            // Check if all vehicles have a driver assigned (either existing, new assignment, or explicitly set to null)
            const vehiclesWithoutDrivers = reservationDetails.vehicles.filter(vehicle => {
                // Check if there's an existing driver assignment with a name
                const existingDriver = (reservationDetails.drivers || []).find(driver => 
                    driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) && driver.driver_name
                );
                
                // Check if there's a new assignment in the current session using vehicle_id
                const newAssignment = vehicleDriverAssignments[vehicle.vehicle_id];
                
                // Check if there's a custom driver name
                const customDriverName = customDriverNames[vehicle.vehicle_id];
                
                // Vehicle needs a driver if there's no existing assignment with name and no new assignment (including null, custom)
                // and no custom driver name provided
                return !existingDriver && newAssignment === undefined && !customDriverName;
            });
            
            if (vehiclesWithoutDrivers.length > 0) {
                setDriverError("Please assign a driver to each vehicle before approving the reservation.");
                return;
            }
            
            // Insert/update driver assignments before approving reservation
            try {
                for (const vehicle of reservationDetails.vehicles) {
                    // const existingDriver = (reservationDetails.drivers || []).find(driver => 
                    //     driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) && driver.driver_name
                    // );
                    
                    // Check if there's a new assignment in the current session
                    const driverId = vehicleDriverAssignments[vehicle.vehicle_id];
                    
                    // If there's a new assignment (including reassignment), process it
                    if (driverId !== undefined) {
                        // Insert/update driver assignment (null for no driver available, or actual driver ID)
                        let driverName = null;
                        if (driverId === null) {
                            // Calculate driver number for "No Driver Available" cases
                            const vehicleIndex = reservationDetails.vehicles.findIndex(v => String(v.vehicle_id) === String(vehicle.vehicle_id));
                            driverName = `driver ${vehicleIndex + 1}`;
                        } else if (driverId === 'custom') {
                            // Use custom driver name
                            driverName = customDriverNames[vehicle.vehicle_id] || null;
                        }
                        
                        // Check if there's an existing driver assignment for this vehicle
                        const existingDriver = (reservationDetails.drivers || []).find(driver => 
                            driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                        );
                        
                        // Prepare payload
                        const payload = {
                            operation: 'insertDriver',
                            reservation_driver_user_id: driverId, // This can be null
                            reservation_vehicle_id: vehicle.reservation_vehicle_id,
                            driver_name: driverName
                        };
                        
                        // If there's an existing driver assignment, include the reservation_driver_id for update
                        if (existingDriver && existingDriver.reservation_driver_id) {
                            payload.reservation_driver_id = existingDriver.reservation_driver_id;
                        }
                        
                        // Debug logging
                        console.log('Frontend insertDriver payload:', payload);
                        
                        await axios.post(`${encryptedUrl}/Admin.php`, payload);
                    }
                }
            } catch (error) {
                setDriverError("Failed to assign driver(s). Please try again.");
                return;
            }
        }
        // Call the original onAccept, passing assignments if needed
        if (typeof onAccept === 'function') {
            await onAccept(vehicleDriverAssignments);
        }
    };

    // Accept handler that bypasses driver checks (used for Admin stage only)
    const handleAcceptWithoutDriverCheck = async () => {
        // For Admin stage: if any drivers are selected by Admin, insert them before approval, but do not require all
        try {
            if (reservationDetails?.vehicles && reservationDetails.vehicles.length > 0) {
                for (const vehicle of reservationDetails.vehicles) {
                    const driverId = vehicleDriverAssignments[vehicle.vehicle_id];
                    if (driverId !== undefined) {
                        // Insert driver assignment (null for no driver available, or actual driver ID)
                        let driverName = null;
                        if (driverId === null) {
                            // Calculate driver number for "No Driver Available" cases
                            const vehicleIndex = reservationDetails.vehicles.findIndex(v => String(v.vehicle_id) === String(vehicle.vehicle_id));
                            driverName = `driver ${vehicleIndex + 1}`;
                        } else if (driverId === 'custom') {
                            // Use custom driver name
                            driverName = customDriverNames[vehicle.vehicle_id] || null;
                        }
                        
                        // Check if there's an existing driver assignment for this vehicle
                        const existingDriver = (reservationDetails.drivers || []).find(driver => 
                            driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                        );
                        
                        // Prepare payload
                        const payload = {
                            operation: 'insertDriver',
                            reservation_driver_user_id: driverId, // This can be null
                            reservation_vehicle_id: vehicle.reservation_vehicle_id,
                            driver_name: driverName
                        };
                        
                        // If there's an existing driver assignment, include the reservation_driver_id for update
                        if (existingDriver && existingDriver.reservation_driver_id) {
                            payload.reservation_driver_id = existingDriver.reservation_driver_id;
                        }
                        
                        // Debug logging
                        console.log('Frontend insertDriver payload (alt path):', payload);
                        
                        await axios.post(`${encryptedUrl}/Admin.php`, payload);
                    }
                }
            }
        } catch (error) {
            // Soft-fail: still allow admin approval to proceed
            console.error('Optional driver insert failed (admin stage):', error);
        }
        if (typeof onAccept === 'function') {
            await onAccept(vehicleDriverAssignments);
        }
    };

    // Helper function to get current approver from approval sequence
    const getCurrentApproverFromSequence = () => {
        if (!reservationDetails?.approval_sequence || reservationDetails.approval_sequence.length === 0) {
            return null;
        }

        const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
        
        // Find the first approver who hasn't approved yet
        for (let i = 0; i < reservationDetails.approval_sequence.length; i++) {
            const approver = reservationDetails.approval_sequence[i];
            
            // If this approver hasn't approved yet
            if (!approver.has_approved) {
                // Check if all previous approvers have approved
                const previousApprovers = reservationDetails.approval_sequence.slice(0, i);
                const allPreviousApproved = previousApprovers.every(prev => prev.has_approved);
                
                // If all previous approved and current user is this approver
                if (allPreviousApproved && String(approver.users_id) === String(currentUserId)) {
                    return {
                        approver: approver,
                        isCurrentUser: true,
                        isPending: true,
                        sequence: approver.approval_sequence
                    };
                }
                
                // If all previous approved but current user is not this approver
                if (allPreviousApproved) {
                    return {
                        approver: approver,
                        isCurrentUser: false,
                        isPending: true,
                        sequence: approver.approval_sequence
                    };
                }
                
                // If not all previous approved, this approver is waiting
                return {
                    approver: approver,
                    isCurrentUser: approver.users_id === currentUserId,
                    isPending: false,
                    sequence: approver.approval_sequence
                };
            }
        }
        
        // All approvers have approved
        return {
            approver: null,
            isCurrentUser: false,
            isPending: false,
            sequence: null,
            allApproved: true
        };
    };

    // Helper used by last-approver reschedule flow
    const handleReschedule = async ({ startDate, endDate, newVenueIds, newVehicleIds } = {}) => {
        try {
            let didUpdateSomething = false;

            // Update dates if provided
            if (startDate && endDate) {
                const dateResp = await axios.post(`${encryptedUrl}reservation.php`, {
                    operation: 'updateReservationReschedule',
                    reservation_id: reservationDetails?.reservation_id,
                    reschedule_start_date: startDate,
                    reschedule_end_date: endDate,
                    user_admin_id: SecureStorage.getLocalItem('user_id')
                }, { headers: { 'Content-Type': 'application/json' } });
                if (!(dateResp?.data?.status === 'success')) {
                    await handleRescheduleError(dateResp, reservationDetails?.reservation_id, () => setIsRescheduleModalOpen(false));
                    return;
                }
                didUpdateSomething = true;
            }

            // Update venues if selection provided
            if (Array.isArray(newVenueIds) && newVenueIds.length > 0 && Array.isArray(reservationDetails?.venues)) {
                const venueChanges = reservationDetails.venues
                    .map((v, idx) => {
                        const newId = newVenueIds[idx];
                        if (newId == null || String(newId) === String(v.venue_id)) return null;
                        return {
                            reservation_venue_id: v.reservation_venue_id,
                            reservation_change_venue_id: Number(newId)
                        };
                    })
                    .filter(Boolean);
                if (venueChanges.length > 0) {
                    const results = await Promise.allSettled(venueChanges.map(change => axios.post(`${encryptedUrl}reservation.php`, {
                        operation: 'updateVenueReschedule',
                        reservation_venue_id: change.reservation_venue_id,
                        reservation_change_venue_id: change.reservation_change_venue_id,
                        reservation_id: reservationDetails?.reservation_id
                    }, { headers: { 'Content-Type': 'application/json' } })));
                    
                    // Check for errors and handle them appropriately
                    const failedResults = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.data?.status !== 'success'));
                    if (failedResults.length > 0) {
                        const firstError = failedResults[0].status === 'rejected' 
                            ? failedResults[0].reason?.message
                            : failedResults[0].value?.data?.message;
                        
                        // Check if it's a status-related error that should show error modal
                        if (firstError && (firstError.includes('cancelled') || firstError.includes('declined') || 
                            firstError.includes('completed') || firstError.includes('already been rescheduled') || 
                            firstError.includes('pending reschedule'))) {
                            setErrorMessage(firstError);
                            setIsErrorModalOpen(true);
                            // Refresh data to show updated status
                            await fetchReservations();
                            return;
                        } else {
                            toast.error(firstError || 'Failed to reschedule venue');
                            return;
                        }
                    }
                    didUpdateSomething = true;
                }
            }

            // Update vehicles if selection provided
            if (Array.isArray(newVehicleIds) && newVehicleIds.length > 0 && Array.isArray(reservationDetails?.vehicles)) {
                const vehicleChanges = reservationDetails.vehicles
                    .map((v, idx) => {
                        const newId = newVehicleIds[idx];
                        if (newId == null || String(newId) === String(v.vehicle_id)) return null;
                        return {
                            reservation_vehicle_id: v.reservation_vehicle_id,
                            reservation_change_vehicle_id: Number(newId)
                        };
                    })
                    .filter(Boolean);
                if (vehicleChanges.length > 0) {
                    const results = await Promise.allSettled(vehicleChanges.map(change => axios.post(`${encryptedUrl}reservation.php`, {
                        operation: 'updateVehicleReschedule',
                        reservation_vehicle_id: change.reservation_vehicle_id,
                        reservation_change_vehicle_id: change.reservation_change_vehicle_id,
                        reservation_id: reservationDetails?.reservation_id
                    }, { headers: { 'Content-Type': 'application/json' } })));
                    
                    // Check for errors and handle them appropriately
                    const failedResults = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.data?.status !== 'success'));
                    if (failedResults.length > 0) {
                        const firstError = failedResults[0].status === 'rejected' 
                            ? failedResults[0].reason?.message
                            : failedResults[0].value?.data?.message;
                        
                        // Check if it's a status-related error that should show error modal
                        if (firstError && (firstError.includes('cancelled') || firstError.includes('declined') || 
                            firstError.includes('completed') || firstError.includes('already been rescheduled') || 
                            firstError.includes('pending reschedule'))) {
                            setErrorMessage(firstError);
                            setIsErrorModalOpen(true);
                            // Refresh data to show updated status
                            await fetchReservations();
                            return;
                        } else {
                            toast.error(firstError || 'Failed to reschedule vehicle');
                            return;
                        }
                    }
                    didUpdateSomething = true;
                }
            }

            if (!didUpdateSomething && (!startDate || !endDate)) {
                toast.info('No changes to update.');
            } else {
                toast.success('Reservation rescheduled successfully');
                // Refresh the reservations data to show updated status
                await fetchReservations();
            }

            try {
                await fetchReservationDetails(currentRequest?.reservation_id || reservationDetails?.reservation_id);
            } catch (refreshErr) {
                console.error('Error refreshing details after reschedule:', refreshErr);
            }
        } catch (error) {
            console.error('[ViewRequest] Error in handleReschedule:', error);
            toast.error('Error processing reschedule');
        }
    };

        const getModalFooter = () => {
        if (!reservationDetails) {
            return [<Button key="close" onClick={onClose} size="large">Close</Button>];
        }
        
        // Debug logging for Change Request - in getModalFooter
        const footerCurrentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
        if (reservationDetails?.status_name === "Change Request") {
            console.log('=== GET MODAL FOOTER DEBUG ===');
            console.log('getModalFooter called for Change Request');
            console.log('Current User ID:', footerCurrentUserId);
            console.log('Reservation Details:', reservationDetails);
        }
        const currentApproverInfo = getCurrentApproverFromSequence();

        // Debug logging for approval sequence
        console.log('Approval Sequence Debug:', {
            currentUserId: footerCurrentUserId,
            currentApproverInfo,
            approvalSequence: reservationDetails?.approval_sequence
        });

        // Use approval sequence logic if available
        if (currentApproverInfo) {
            // Check if this is a change request and current user is the last approver
            const isChangeRequest = reservationDetails?.status_name === "Change Request";
            
            // Determine if current user is the last approver in the sequence
            const isLastApprover = Array.isArray(reservationDetails?.approval_sequence) &&
                reservationDetails.approval_sequence.length > 0 && (() => {
                    const maxSequence = Math.max(...reservationDetails.approval_sequence.map(a => parseInt(a.approval_sequence, 10)));
                    const lastApprover = reservationDetails.approval_sequence.find(a => parseInt(a.approval_sequence, 10) === maxSequence);
                    return lastApprover && String(lastApprover.users_id) === String(footerCurrentUserId);
                })();
            
            // Debug logging for change request logic
            const maxSequence = reservationDetails?.approval_sequence?.length > 0 ? Math.max(...reservationDetails.approval_sequence.map(a => parseInt(a.approval_sequence, 10))) : null;
            const lastApproverInSequence = reservationDetails?.approval_sequence?.find(a => parseInt(a.approval_sequence, 10) === maxSequence);
            
            console.log('Change Request Debug:', {
                statusName: reservationDetails?.status_name,
                isChangeRequest,
                allApproved: currentApproverInfo.allApproved,
                isLastApprover,
                currentSequence: currentApproverInfo.sequence,
                approvalSequence: reservationDetails?.approval_sequence,
                maxSequence,
                lastApproverInSequence,
                currentUserId: footerCurrentUserId,
                lastApproverUserId: lastApproverInSequence?.users_id
            });
            
            // If it's a change request AND current user is last approver,
            // show decline, reschedule, and approve buttons (regardless of all approvers approved status)
            if (isChangeRequest && isLastApprover) {
                const priorityCheck = checkPriority();
                const isExpired = new Date(reservationDetails.reservation_end_date) < new Date();
                
                // Check if current user can bypass venue availability restrictions
                const currentUserLevel = reservationDetails.user_level_name;
                const currentUserDepartment = reservationDetails.department_name;
                const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
                const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
                const canBypassVenueRestrictions = isDepartmentHeadFromCOO || isSecretaryFromGSD;
                
                const anyVenueNotAvailable = !canBypassVenueRestrictions && reservationDetails.venues && reservationDetails.venues.some(v => v.isAvailable === false);
                
                // Department Approval Progress gating
                const hasDeptProgress = Array.isArray(deansApproval) && deansApproval.length > 0;
                const allDeptProgressApproved = !hasDeptProgress || deansApproval.every(a => a.is_approved === 1 || a.is_approved === '1');
                
                // For expired requests, only show decline
                if (isExpired) {
                    return [
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>,
                        <Button key="close" onClick={onClose} size="large">Close</Button>
                    ];
                }
                
                // Show all three buttons for change request final approval
                const shouldDisableApprove = (!priorityCheck.hasPriority && !(isDepartmentHeadFromCOO || isSecretaryFromGSD)) || anyVenueNotAvailable || (hasDeptProgress && !allDeptProgressApproved);
                
                // Require driver selection before rescheduling when vehicles exist
                const hasVehicles = Array.isArray(reservationDetails.vehicles) && reservationDetails.vehicles.length > 0;
                const allVehiclesHaveDriverAssigned = !hasVehicles || reservationDetails.vehicles.every(vehicle => {
                    const existingDriver = (reservationDetails.drivers || []).find(driver =>
                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                        (driver.driver_id || driver.driver_name)
                    );
                    if (existingDriver) return true;
                    const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                    const customDriverName = customDriverNames[vehicle.vehicle_id];
                    return !!assignedDriverId || !!customDriverName;
                });
                
                return [
                    <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                        Decline
                    </Button>,
                    <Button
                        key="reschedule"
                        type="default"
                        onClick={() => {
                            const resources = {
                                venueIds: (reservationDetails.venues || []).map(v => ({
                                    venue_id: v.venue_id,
                                    change_venue_id: v.change_venue_id || null,
                                    reservation_venue_id: v.reservation_venue_id
                                })),
                                vehicleIds: (reservationDetails.vehicles || []).map(v => ({
                                    vehicle_id: v.vehicle_id,
                                    change_vehicle_id: v.change_vehicle_id || null,
                                    reservation_vehicle_id: v.reservation_vehicle_id
                                })),
                                equipment: (reservationDetails.equipment || []).map(eq => ({
                                    equipment_id: eq.equipment_id,
                                    quantity: parseInt(eq.quantity, 10) || 0
                                }))
                            };
                            setRescheduleResources(resources);
                            setIsRescheduleModalOpen(true);
                        }}
                        size="large"
                        className="mr-2"
                        icon={<ScheduleOutlined />}
                        disabled={hasVehicles && !allVehiclesHaveDriverAssigned}
                    >
                        Reschedule
                    </Button>,
                    <Button 
                        key="approve" 
                        type="primary" 
                        loading={isAccepting} 
                        disabled={shouldDisableApprove}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleAcceptWithoutDriverCheck(); 
                        }} 
                        size="large" 
                        icon={<CheckCircleOutlined />}
                    >
                        Approve
                    </Button>,
                    <Button key="close" onClick={onClose} size="large">Close</Button>,
                    <RescheduleModal
                        visible={isRescheduleModalOpen}
                        onCancel={() => setIsRescheduleModalOpen(false)}
                        reservation={reservationDetails}
                        resources={rescheduleResources}
                        onReschedule={async (newDates) => {
                            try {
                                const { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts } = newDates || {};
                                if (overrideConflicts && conflictData?.reservation_users?.length > 0) {
                                    try {
                                        await axios.post(`${encryptedUrl}/Admin.php`, {
                                            operation: 'handleRequest',
                                            reservation_id: reservationDetails?.reservation_id,
                                            is_accepted: true,
                                            user_id: SecureStorage.getLocalItem("user_id"),
                                            override_lower_priority: true,
                                            reschedule_mode: true,
                                            new_start_datetime: startDate,
                                            new_end_datetime: endDate
                                        });
                                    } catch (error) {
                                        console.error('[ViewRequest] Error overriding conflicts:', error);
                                        toast.error(`Error overriding conflicts: ${error.response?.data?.message || error.message}`);
                                        return;
                                    }
                                }
                                await handleReschedule({ startDate, endDate, newVenueIds, newVehicleIds });
                                setIsRescheduleModalOpen(false);
                            } catch (error) {
                                console.error('[ViewRequest] Error in onReschedule:', error);
                                toast.error(`Error rescheduling reservation: ${error.response?.data?.message || error.message}`);
                            }
                        }}
                    />
                ];
            }
            
            // Alternative condition: If it's a change request and all approvers have approved,
            // show decline, reschedule, and approve buttons for any approver in the sequence
            if (isChangeRequest && currentApproverInfo.allApproved && currentApproverInfo.isCurrentUser) {
                const priorityCheck = checkPriority();
                const isExpired = new Date(reservationDetails.reservation_end_date) < new Date();
                
                // Check if current user can bypass venue availability restrictions
                const currentUserLevel = reservationDetails.user_level_name;
                const currentUserDepartment = reservationDetails.department_name;
                const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
                const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
                const canBypassVenueRestrictions = isDepartmentHeadFromCOO || isSecretaryFromGSD;
                
                const anyVenueNotAvailable = !canBypassVenueRestrictions && reservationDetails.venues && reservationDetails.venues.some(v => v.isAvailable === false);
                
                // Department Approval Progress gating
                const hasDeptProgress = Array.isArray(deansApproval) && deansApproval.length > 0;
                const allDeptProgressApproved = !hasDeptProgress || deansApproval.every(a => a.is_approved === 1 || a.is_approved === '1');
                
                // For expired requests, only show decline
                if (isExpired) {
                    return [
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>,
                        <Button key="close" onClick={onClose} size="large">Close</Button>
                    ];
                }
                
                // Show all three buttons for change request final approval
                const shouldDisableApprove = (!priorityCheck.hasPriority && !(isDepartmentHeadFromCOO || isSecretaryFromGSD)) || anyVenueNotAvailable || (hasDeptProgress && !allDeptProgressApproved);
                
                // Require driver selection before rescheduling when vehicles exist
                const hasVehicles = Array.isArray(reservationDetails.vehicles) && reservationDetails.vehicles.length > 0;
                const allVehiclesHaveDriverAssigned = !hasVehicles || reservationDetails.vehicles.every(vehicle => {
                    const existingDriver = (reservationDetails.drivers || []).find(driver =>
                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                        (driver.driver_id || driver.driver_name)
                    );
                    if (existingDriver) return true;
                    const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                    const customDriverName = customDriverNames[vehicle.vehicle_id];
                    return !!assignedDriverId || !!customDriverName;
                });
                
                return [
                    <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                        Decline
                    </Button>,
                    <Button
                        key="reschedule"
                        type="default"
                        onClick={() => {
                            const resources = {
                                venueIds: (reservationDetails.venues || []).map(v => ({
                                    venue_id: v.venue_id,
                                    change_venue_id: v.change_venue_id || null,
                                    reservation_venue_id: v.reservation_venue_id
                                })),
                                vehicleIds: (reservationDetails.vehicles || []).map(v => ({
                                    vehicle_id: v.vehicle_id,
                                    change_vehicle_id: v.change_vehicle_id || null,
                                    reservation_vehicle_id: v.reservation_vehicle_id
                                })),
                                equipment: (reservationDetails.equipment || []).map(eq => ({
                                    equipment_id: eq.equipment_id,
                                    quantity: parseInt(eq.quantity, 10) || 0
                                }))
                            };
                            setRescheduleResources(resources);
                            setIsRescheduleModalOpen(true);
                        }}
                        size="large"
                        className="mr-2"
                        icon={<ScheduleOutlined />}
                        disabled={hasVehicles && !allVehiclesHaveDriverAssigned}
                    >
                        Reschedule
                    </Button>,
                    <Button 
                        key="approve" 
                        type="primary" 
                        loading={isAccepting} 
                        disabled={shouldDisableApprove}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleAcceptWithoutDriverCheck(); 
                        }} 
                        size="large" 
                        icon={<CheckCircleOutlined />}
                    >
                        Approve
                    </Button>,
                    <Button key="close" onClick={onClose} size="large">Close</Button>,
                    <RescheduleModal
                        visible={isRescheduleModalOpen}
                        onCancel={() => setIsRescheduleModalOpen(false)}
                        reservation={reservationDetails}
                        resources={rescheduleResources}
                        onReschedule={async (newDates) => {
                            try {
                                const { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts } = newDates || {};
                                if (overrideConflicts && conflictData?.reservation_users?.length > 0) {
                                    try {
                                        await axios.post(`${encryptedUrl}/Admin.php`, {
                                            operation: 'handleRequest',
                                            reservation_id: reservationDetails?.reservation_id,
                                            is_accepted: true,
                                            user_id: SecureStorage.getLocalItem("user_id"),
                                            override_lower_priority: true,
                                            reschedule_mode: true,
                                            new_start_datetime: startDate,
                                            new_end_datetime: endDate
                                        });
                                    } catch (error) {
                                        console.error('[ViewRequest] Error overriding conflicts:', error);
                                        toast.error(`Error overriding conflicts: ${error.response?.data?.message || error.message}`);
                                        return;
                                    }
                                }
                                await handleReschedule({ startDate, endDate, newVenueIds, newVehicleIds });
                                setIsRescheduleModalOpen(false);
                            } catch (error) {
                                console.error('[ViewRequest] Error in onReschedule:', error);
                                toast.error(`Error rescheduling reservation: ${error.response?.data?.message || error.message}`);
                            }
                        }}
                    />
                ];
            }
            
            // If all approvers have approved but not a change request, show only close button
            if (currentApproverInfo.allApproved) {
                return [
                    <Button key="close" onClick={onClose} size="large">Close</Button>
                ];
            }

            // If current user is not the pending approver, show only close button
            if (!currentApproverInfo.isCurrentUser || !currentApproverInfo.isPending) {
                return [
                    <Button key="close" onClick={onClose} size="large">Close</Button>
                ];
            }

            // Current user is the pending approver - show approval buttons
            const priorityCheck = checkPriority();
            const isExpired = new Date(reservationDetails.reservation_end_date) < new Date();
            
            // Check if current user can bypass venue availability restrictions
            const currentUserLevel = reservationDetails.user_level_name;
            const currentUserDepartment = reservationDetails.department_name;
            const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
            const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
            const canBypassVenueRestrictions = isDepartmentHeadFromCOO || isSecretaryFromGSD;
            
            const anyVenueNotAvailable = !canBypassVenueRestrictions && reservationDetails.venues && reservationDetails.venues.some(v => v.isAvailable === false);
            
            // Department Approval Progress gating
            const hasDeptProgress = Array.isArray(deansApproval) && deansApproval.length > 0;
            const allDeptProgressApproved = !hasDeptProgress || deansApproval.every(a => a.is_approved === 1 || a.is_approved === '1');

            // For expired requests, only show decline
            if (isExpired) {
                return [
                    <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                        Decline
                    </Button>,
                    <Button key="close" onClick={onClose} size="large">Close</Button>
                ];
            }

            // Show approve and decline buttons for current approver
            // Fix: When there's no department approval progress (hasDeptProgress = false), 
            // allDeptProgressApproved should be true, so the button should be enabled
            const shouldDisableApprove = (!priorityCheck.hasPriority && !(isDepartmentHeadFromCOO || isSecretaryFromGSD)) || anyVenueNotAvailable || (hasDeptProgress && !allDeptProgressApproved);
            
            // Debug logging for button disable conditions
            console.log('Approve Button Debug:', {
                priorityCheck,
                hasPriority: priorityCheck.hasPriority,
                anyVenueNotAvailable,
                hasDeptProgress,
                allDeptProgressApproved,
                shouldDisableApprove
            });
            
            // If current approver is the last in sequence, also show Reschedule
            const isLastInSequence = Array.isArray(reservationDetails?.approval_sequence) &&
                reservationDetails.approval_sequence.length > 0 &&
                parseInt(currentApproverInfo.sequence, 10) === Math.max(
                    ...reservationDetails.approval_sequence.map(a => parseInt(a.approval_sequence, 10))
                );

            // Require driver selection before rescheduling when vehicles exist
            const hasVehicles = Array.isArray(reservationDetails.vehicles) && reservationDetails.vehicles.length > 0;
            const allVehiclesHaveDriverAssigned = !hasVehicles || reservationDetails.vehicles.every(vehicle => {
                const existingDriver = (reservationDetails.drivers || []).find(driver =>
                    driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                    (driver.driver_id || driver.driver_name)
                );
                if (existingDriver) return true;
                const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                const customDriverName = customDriverNames[vehicle.vehicle_id];
                return !!assignedDriverId || !!customDriverName;
            });

            return [
                <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                    Decline
                </Button>,
                isLastInSequence && (
                    <>
                        <Button
                            key="reschedule"
                            type="default"
                            onClick={() => {
                                const isChangeRequest = reservationDetails.status_name === "Change Request";
                                const resources = {
                                    venueIds: (reservationDetails.venues || []).map(v => {
                                        if (isChangeRequest) {
                                            return {
                                                venue_id: v.venue_id,
                                                change_venue_id: v.change_venue_id || null,
                                                reservation_venue_id: v.reservation_venue_id
                                            };
                                        }
                                        return v.venue_id;
                                    }),
                                    vehicleIds: (reservationDetails.vehicles || []).map(v => {
                                        if (isChangeRequest) {
                                            return {
                                                vehicle_id: v.vehicle_id,
                                                change_vehicle_id: v.change_vehicle_id || null,
                                                reservation_vehicle_id: v.reservation_vehicle_id
                                            };
                                        }
                                        return v.vehicle_id;
                                    }),
                                    equipment: (reservationDetails.equipment || []).map(eq => ({
                                        equipment_id: eq.equipment_id,
                                        quantity: parseInt(eq.quantity, 10) || 0
                                    }))
                                };
                                setRescheduleResources(resources);
                                setIsRescheduleModalOpen(true);
                            }}
                            size="large"
                            className="mr-2"
                            icon={<ScheduleOutlined />}
                            disabled={hasVehicles && !allVehiclesHaveDriverAssigned}
                        >
                            Reschedule
                        </Button>
                        <RescheduleModal
                            visible={isRescheduleModalOpen}
                            onCancel={() => setIsRescheduleModalOpen(false)}
                            reservation={reservationDetails}
                            onReschedule={async (newDates) => {
                                try {
                                    const { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts } = newDates || {};
                                    if (overrideConflicts && conflictData?.reservation_users?.length > 0) {
                                        try {
                                            await axios.post(`${encryptedUrl}/Admin.php`, {
                                                operation: 'handleRequest',
                                                reservation_id: reservationDetails?.reservation_id,
                                                is_accepted: true,
                                                user_id: SecureStorage.getLocalItem("user_id"),
                                                override_lower_priority: true,
                                                reschedule_mode: true,
                                                new_start_datetime: startDate,
                                                new_end_datetime: endDate
                                            });
                                        } catch (overrideErr) {
                                            console.error('[ViewRequest] Error overriding conflicts:', overrideErr);
                                            toast.error(`Error overriding conflicts: ${overrideErr.response?.data?.message || overrideErr.message}`);
                                            return;
                                        }
                                    }
                                    await handleReschedule({ startDate, endDate, newVenueIds, newVehicleIds });
                                    setIsRescheduleModalOpen(false);
                                } catch (error) {
                                    console.error('[ViewRequest] Error in onReschedule:', error);
                                    toast.error(`Error rescheduling reservation: ${error.response?.data?.message || error.message}`);
                                }
                            }}
                            reservationId={reservationDetails?.reservation_id}
                            currentStartDate={reservationDetails?.reschedule_start_date || reservationDetails?.reservation_start_date}
                            currentEndDate={reservationDetails?.reschedule_end_date || reservationDetails?.reservation_end_date}
                        />
                    </>
                ),
                <Button 
                    key="approve" 
                    type="primary" 
                    loading={isAccepting} 
                    disabled={shouldDisableApprove}
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        handleAcceptWithoutDriverCheck(); 
                    }} 
                    size="large" 
                    icon={<CheckCircleOutlined />}
                >
                    Approve
                </Button>,
                <Button key="close" onClick={onClose} size="large">Close</Button>
            ];
        }

        // Check for reschedule request waiting for department approval confirmation
        const isRescheduleStatus = reservationDetails.status_name === "Reschedule";
        const isChangeRequestStatus = reservationDetails.status_name === "Change Request";
        const rescheduleApproval = reservationDetails.status_history?.find(
            status => status.status_name === 'Pending'
        );
        const isRescheduleWaitingConfirmation = isRescheduleStatus && 
            rescheduleApproval && 
            rescheduleApproval.reservation_active === 0;

        // If reschedule is waiting for department approval confirmation, disable all buttons
        // BUT if it's Change Request status, allow department approval buttons
        if (isRescheduleWaitingConfirmation && !isChangeRequestStatus) {
            return [
                <div key="reschedule-waiting" className="flex flex-col space-y-2">
        
                    {/* <div className="flex justify-center">
                        <Button key="close" onClick={onClose} size="large">Close</Button>
                    </div> */}
                </div>
            ];
        }

        // Find the current pending approval
        const currentPendingApproval = reservationDetails.status_history?.find(
            status => status.status_name === 'Pending' && status.reservation_active === 0
        );
        
        // Find the current approver from approval sequence
        const currentApprover = reservationDetails?.approval_sequence?.find(approver => !approver.has_approved);
        const isCurrentSequenceApprover = currentApprover && String(currentApprover.users_id) === String(currentUserId);
        
        const adminApproval = currentPendingApproval;
        const departmentApproval = currentPendingApproval;

        // Use approval sequence to determine if user is current approver, fallback to old logic
        const isAdminApprover = isCurrentSequenceApprover || !!(adminApproval && String(adminApproval.reservation_users_id) === String(currentUserId));
        const isDepartmentApprover = isCurrentSequenceApprover || !!(departmentApproval && String(departmentApproval.reservation_users_id) === String(currentUserId));
        const isAdminPending = adminApproval?.reservation_active === 0;
        const isDepartmentPending = departmentApproval?.reservation_active === 0;
        
        // Check if current user is part of the current pending approval stage
        // Fixed logic to ensure buttons show for both admin and department approvers
        // Now also check if admin has already approved or declined based on status names
        // For Change Request status, enable department approval buttons again
        const isAdminAlreadyApproved = false;
        const isAdminAlreadyDeclined = false;
        const isChangeRequestForApproval = reservationDetails.status_name === "Change Request";
        // Check if current user is the last approver in the sequence
        const isLastSequenceApproverForPending = reservationDetails?.approval_sequence && 
            reservationDetails.approval_sequence.length > 0 && 
            parseInt(reservationDetails.approval_sequence[reservationDetails.approval_sequence.length - 1]?.users_id, 10) === currentUserId;
        console.log("isLastSequenceApproverForPending", isLastSequenceApproverForPending);
        
        // Check if all approvers in the sequence have approved for Change Request
        const allSequenceApproversApprovedForPending = reservationDetails?.approval_sequence && 
            reservationDetails.approval_sequence.length > 0 && 
            reservationDetails.approval_sequence.every(approver => approver.has_approved === true);
        
        // Check if current user is in the approval sequence for Change Request (for pending stage)
        const isCurrentUserInApprovalSequenceForPending = reservationDetails?.approval_sequence && 
            reservationDetails.approval_sequence.some(approver => parseInt(approver.users_id, 10) === currentUserId);
        
        const isCurrentUserPartOfPendingStage = (
            (isAdminPending && isAdminApprover) || 
            (isDepartmentPending && isDepartmentApprover && (isAdminAlreadyApproved || isAdminAlreadyDeclined)) ||
            (isChangeRequestForApproval && isLastSequenceApproverForPending)
        );
        
        // Debug logging for pending stage logic
        if (isChangeRequestForApproval) {
            console.log('Pending Stage Debug:', {
                isCurrentUserPartOfPendingStage,
                isAdminPending,
                isAdminApprover,
                isDepartmentPending,
                isDepartmentApprover,
                isAdminAlreadyApproved,
                isAdminAlreadyDeclined,
                isLastSequenceApproverForPending,
                allSequenceApproversApprovedForPending,
                isCurrentUserInApprovalSequenceForPending
            });
        }

        const priorityCheck = checkPriority();
        const isExpired = new Date(reservationDetails.reservation_end_date) < new Date();
        
        // Check if current user can bypass venue availability restrictions
        const currentUserLevel = reservationDetails.user_level_name;
        const currentUserDepartment = reservationDetails.department_name;
        const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
        const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
        const canBypassVenueRestrictions = isDepartmentHeadFromCOO || isSecretaryFromGSD;
        
        const anyVenueNotAvailable = !canBypassVenueRestrictions && reservationDetails.venues && reservationDetails.venues.some(v => v.isAvailable === false);
        // Department Approval Progress gating: Admin waits until all department approvers finish
        const hasDeptProgress = Array.isArray(deansApproval) && deansApproval.length > 0;
        const allDeptProgressApproved = !hasDeptProgress || deansApproval.every(a => a.is_approved === 1 || a.is_approved === '1');
        
        // If the logged-in approver has already taken action (Approved), do not show action buttons again
        // EXCEPTION: For Change Request status, always show buttons since it's a new proposal
        const hasUserAlreadyApproved = !isChangeRequestForApproval && (
            (adminApproval && String(adminApproval.reservation_users_id) === String(currentUserId) && adminApproval.reservation_active === 1) ||
            (departmentApproval && String(departmentApproval.reservation_users_id) === String(currentUserId) && departmentApproval.reservation_active === 1)
        );
        if (hasUserAlreadyApproved) {
            return [
                <Button key="close" onClick={onClose} size="large">Close</Button>
            ];
        }

        // If current user is not part of the pending approval stage, hide action buttons
        // Exception: If admin has already approved/declined and it's department approver's turn, show only decline button
        // Exception: For Change Request, if user is last approver in sequence or part of the approval sequence, always allow buttons
        if (!isCurrentUserPartOfPendingStage && !(isChangeRequestForApproval && (isLastSequenceApproverForPending || isCurrentUserInApprovalSequenceForPending))) {

            
            // If admin already approved or declined and current user is department approver, show only decline button
            if ((isAdminAlreadyApproved || isAdminAlreadyDeclined) && isDepartmentApprover) {
                return [
                    <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                        Decline
                    </Button>,
                    <Button key="close" onClick={onClose} size="large">Close</Button>
                ];
            }
            
            return [
                <Button key="close" onClick={onClose} size="large">Close</Button>
            ];
        }

        // Base case for expired requests
        if (isExpired) {
            return [
                isAdminApprover
                    ? (
                        isAdminPending
                            ? (
                                <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); if (typeof onDecline === 'function') { onDecline(); } }} size="large" icon={<CloseCircleOutlined />}>
                                    Decline
                                </Button>
                            )
                            : (
                                <Button key="close" onClick={onClose} size="large">Close</Button>
                            )
                    )
                    : (
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>
                    )
            ];
        }

        // Handle Change Request status specifically
        const isLastSequenceApprover = reservationDetails?.approval_sequence && 
            reservationDetails.approval_sequence.length > 0 && 
            parseInt(reservationDetails.approval_sequence[reservationDetails.approval_sequence.length - 1]?.users_id, 10) === footerCurrentUserId;
        
        // Check if all approvers in the sequence have approved
        const allSequenceApproversApproved = reservationDetails?.approval_sequence && 
            reservationDetails.approval_sequence.length > 0 && 
            reservationDetails.approval_sequence.every(approver => approver.has_approved === true);
        
        // Check if current user is in the approval sequence for Change Request
        const isCurrentUserInApprovalSequence = reservationDetails?.approval_sequence && 
            reservationDetails.approval_sequence.some(approver => parseInt(approver.users_id, 10) === footerCurrentUserId);
            
        
        // Debug logging for Change Request button logic
        if (isChangeRequestForApproval) {
            console.log('Change Request Debug:', {
                isChangeRequestForApproval,
                currentUserId: footerCurrentUserId,
                approvalSequence: reservationDetails?.approval_sequence,
                isLastSequenceApprover,
                allSequenceApproversApproved,
                isCurrentUserInApprovalSequence,
                shouldShowButtons: isLastSequenceApprover
            });
        }

        console.log("The last approver", isLastSequenceApprover)
        
        // Always show buttons for the last approver in the sequence
        // For Change Request, show for any user in the approval sequence
        if (isLastSequenceApprover) {
            // Require driver selection before rescheduling when vehicles exist
            const hasVehicles = Array.isArray(reservationDetails.vehicles) && reservationDetails.vehicles.length > 0;
            const allVehiclesHaveDriverAssigned = !hasVehicles || reservationDetails.vehicles.every(vehicle => {
                // Check existing assignment
                const existingDriver = (reservationDetails.drivers || []).find(driver =>
                    driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                    (driver.driver_id || driver.driver_name)
                );
                if (existingDriver) return true;
                // Check new assignment in current session
                const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                const customDriverName = customDriverNames[vehicle.vehicle_id];
                return !!assignedDriverId || !!customDriverName;
            });

            return [
                <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                    Decline
                </Button>,
                <>
                    <Button
                        key="reschedule"
                        type="default"
                        onClick={() => {
                            // Extract resource IDs and quantities from reservationDetails
                            // For Change Request status, include both original and change IDs
                            const isChangeRequest = reservationDetails.status_name === "Change Request";
                            
                            const resources = {
                                venueIds: (reservationDetails.venues || []).map(v => {
                                    if (isChangeRequest) {
                                        // For Change Request, create object with both original and change IDs
                                        return {
                                            venue_id: v.venue_id,
                                            change_venue_id: v.change_venue_id || null,
                                            reservation_venue_id: v.reservation_venue_id
                                        };
                                    }
                                    return v.venue_id;
                                }),
                                vehicleIds: (reservationDetails.vehicles || []).map(v => {
                                    if (isChangeRequest) {
                                        // For Change Request, create object with both original and change IDs
                                        return {
                                            vehicle_id: v.vehicle_id,
                                            change_vehicle_id: v.change_vehicle_id || null,
                                            reservation_vehicle_id: v.reservation_vehicle_id
                                        };
                                    }
                                    return v.vehicle_id;
                                }),
                                equipment: (reservationDetails.equipment || []).map(eq => ({
                                    equipment_id: eq.equipment_id,
                                    quantity: parseInt(eq.quantity, 10) || 0
                                }))
                            };
                            setRescheduleResources(resources);
                            setIsRescheduleModalOpen(true);
                        }}
                        size="large"
                        className="mr-2"
                        icon={<ScheduleOutlined />}
                        disabled={hasVehicles && !allVehiclesHaveDriverAssigned}
                    >
                        Reschedule
                    </Button>
                    <RescheduleModal
                        visible={isRescheduleModalOpen}
                        onCancel={() => setIsRescheduleModalOpen(false)}
                        reservation={reservationDetails}
                        resources={rescheduleResources}
                        onReschedule={async (newDates) => {
                            console.log('[ViewRequest] ===== onReschedule ENTRY POINT =====');
                            console.log('[ViewRequest] onReschedule called with:', newDates);
                            try {
                                const { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts } = newDates || {};
                                console.log('[ViewRequest] Destructured values:', { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts });

                                // Step 0: If overriding conflicts, handle conflicting reservations first
                                if (overrideConflicts && conflictData?.reservation_users?.length > 0) {
                                    console.log('Processing conflict override for COO Department Head', {
                                        conflictingUsers: conflictData.reservation_users,
                                        unavailableVenues: conflictData.unavailable_venues,
                                        unavailableVehicles: conflictData.unavailable_vehicles
                                    });
                                    
                                    // Handle conflicting reservations by rescheduling them
                                    try {
                                        const overrideResponse = await axios.post(`${encryptedUrl}/Admin.php`, {
                                            operation: 'handleRequest',
                                            reservation_id: reservationDetails?.reservation_id,
                                            is_accepted: true,
                                            user_id: SecureStorage.getLocalItem("user_id"),
                                            override_lower_priority: true,
                                            reschedule_mode: true,
                                            new_start_datetime: startDate,
                                            new_end_datetime: endDate
                                        });

                                        if (overrideResponse.data?.status !== 'success') {
                                            toast.error('Failed to override conflicting reservations');
                                            return;
                                        }
                                    } catch (overrideError) {
                                        console.error('Error overriding conflicts:', overrideError);
                                        toast.error('Failed to override conflicting reservations');
                                        return;
                                    }
                                }

                                // Step 1: If dates provided, update reservation dates only
                                let didUpdateSomething = false;
                                console.log('[ViewRequest] Checking if dates provided:', { startDate, endDate, hasStartDate: !!startDate, hasEndDate: !!endDate });
                                if (startDate && endDate) {
                                    const dateResp = await axios.post(`${encryptedUrl}reservation.php`, {
                                        operation: 'updateReservationReschedule',
                                        reservation_id: reservationDetails?.reservation_id,
                                        reschedule_start_date: startDate,
                                        reschedule_end_date: endDate,
                                        user_admin_id: SecureStorage.getLocalItem('user_id')
                                    }, { headers: { 'Content-Type': 'application/json' } });
                                    if (!(dateResp?.data?.status === 'success')) {
                                        await handleRescheduleError(dateResp, reservationDetails?.reservation_id, () => setIsRescheduleModalOpen(false));
                                        return;
                                    }
                                    didUpdateSomething = true;
                                }

                                // Step 1.5: Handle equipment units insertion for non-Change Request reschedules
                                const isChangeRequest = reservationDetails?.status_name === "Change Request";
                                console.log('[ViewRequest] Checking equipment handling:', {
                                    isChangeRequest,
                                    hasEquipment: !!(reservationDetails?.equipment && reservationDetails.equipment.length > 0),
                                    equipment: reservationDetails?.equipment
                                });
                                
                                if (!isChangeRequest && reservationDetails?.equipment && reservationDetails.equipment.length > 0) {
                                    try {
                                        console.log('[ViewRequest] Processing equipment units for reschedule');
                                        // Format the data to match backend expectations
                                        const equipIds = reservationDetails.equipment.map(eq => parseInt(eq.equipment_id));
                                        const quantities = reservationDetails.equipment.map(eq => parseInt(eq.quantity));
                                        
                                        // Use the new reschedule dates if provided, otherwise use original dates
                                        const useStartDate = startDate || reservationDetails.reservation_start_date;
                                        const useEndDate = endDate || reservationDetails.reservation_end_date;
                                        const formattedStartDate = new Date(useStartDate).toISOString().split('T')[0];
                                        const formattedEndDate = new Date(useEndDate).toISOString().split('T')[0];

                                        console.log('[ViewRequest] Equipment insertUnits payload:', {
                                            equip_ids: equipIds,
                                            quantities: quantities,
                                            reservation_id: parseInt(reservationDetails.reservation_id),
                                            start_date: formattedStartDate,
                                            end_date: formattedEndDate
                                        });

                                        const insertResponse = await axios.post(`${encryptedUrl}/Assigned&Records.php`, {
                                            operation: 'insertUnits',
                                            equip_ids: equipIds,
                                            quantities: quantities,
                                            reservation_id: parseInt(reservationDetails.reservation_id),
                                            start_date: formattedStartDate,
                                            end_date: formattedEndDate,
                                            user_id: SecureStorage.getLocalItem('user_id')

                                        });

                                        if (insertResponse.data?.status !== 'success') {
                                            console.error('[ViewRequest] Equipment insertUnits failed:', insertResponse.data);
                                            toast.error('Failed to prepare equipment units for rescheduled reservation');
                                            return;
                                        }
                                        
                                        console.log('[ViewRequest] Equipment units inserted successfully for reschedule');
                                        didUpdateSomething = true;
                                    } catch (error) {
                                        console.error('[ViewRequest] Error inserting equipment units during reschedule:', error);
                                        toast.error('Failed to prepare equipment units for rescheduled reservation');
                                        return;
                                    }
                                }

                                // Step 2: Process venue changes with minimal payload per change (no dates)
                                const currentVenues = Array.isArray(reservationDetails?.venues) ? reservationDetails.venues : [];
                                
                                console.log('[ViewRequest] Processing venue changes:', {
                                    currentVenues,
                                    newVenueIds,
                                    hasNewVenueIds: !!(newVenueIds && Array.isArray(newVenueIds) && newVenueIds.length > 0)
                                });
                                
                                if (newVenueIds && Array.isArray(newVenueIds) && newVenueIds.length > 0) {
                                    const venue_changes = currentVenues
                                        .map((v, idx) => {
                                            const newId = newVenueIds[idx];
                                            // Only process if newId is explicitly provided and different from current
                                            if (newId == null || newId === undefined || String(newId) === String(v.venue_id)) return null;
                                            return {
                                                reservation_venue_id: v.reservation_venue_id,
                                                reservation_change_venue_id: Number(newId)
                                            };
                                        })
                                        .filter(Boolean);

                                    console.log('[ViewRequest] Venue changes to process:', venue_changes);
                                    if (venue_changes.length > 0) {
                                        console.log('[ViewRequest] Executing updateVenueReschedule');
                                        const requests = venue_changes.map(change => {
                                            console.log('[ViewRequest] Making venue reschedule request:', change);
                                            return axios.post(`${encryptedUrl}reservation.php`, {
                                                operation: 'updateVenueReschedule',
                                                reservation_venue_id: change.reservation_venue_id,
                                                reservation_change_venue_id: change.reservation_change_venue_id
                                            }, { headers: { 'Content-Type': 'application/json' } });
                                        });
                                        
                                        const results = await Promise.allSettled(requests);
                                        const allOk = results.every(r => r.status === 'fulfilled' && r.value?.data?.status === 'success');
                                        if (!allOk) {
                                            const firstError = results.find(r => r.status === 'rejected')?.reason?.message
                                                || results.find(r => r.status === 'fulfilled' && r.value?.data?.status !== 'success')?.value?.data?.message
                                                || 'Failed to reschedule venue';
                                            toast.error(firstError);
                                            return;
                                        }
                                        didUpdateSomething = true;
                                    }
                                }

                                // Step 3: Process vehicle changes with minimal payload per change (no dates)
                                const currentVehicles = Array.isArray(reservationDetails?.vehicles) ? reservationDetails.vehicles : [];
                                
                                console.log('[ViewRequest] Processing vehicle changes:', {
                                    currentVehicles,
                                    newVehicleIds,
                                    hasNewVehicleIds: !!(newVehicleIds && Array.isArray(newVehicleIds) && newVehicleIds.length > 0)
                                });
                                
                                if (newVehicleIds && Array.isArray(newVehicleIds) && newVehicleIds.length > 0) {
                                    const vehicle_changes = currentVehicles
                                        .map((v, idx) => {
                                            const newId = newVehicleIds[idx];
                                            // Only process if newId is explicitly provided and different from current
                                            if (newId == null || newId === undefined || String(newId) === String(v.vehicle_id)) return null;
                                            return {
                                                reservation_vehicle_id: v.reservation_vehicle_id,
                                                reservation_change_vehicle_id: Number(newId)
                                            };
                                        })
                                        .filter(Boolean);

                                    console.log('[ViewRequest] Vehicle changes to process:', vehicle_changes);
                                    if (vehicle_changes.length > 0) {
                                        console.log('[ViewRequest] Executing updateVehicleReschedule');
                                        const requests = vehicle_changes.map(change => {
                                            console.log('[ViewRequest] Making vehicle reschedule request:', change);
                                            return axios.post(`${encryptedUrl}reservation.php`, {
                                                operation: 'updateVehicleReschedule',
                                                reservation_vehicle_id: change.reservation_vehicle_id,
                                                reservation_change_vehicle_id: change.reservation_change_vehicle_id
                                            }, { headers: { 'Content-Type': 'application/json' } });
                                        });
                                        
                                        const results = await Promise.allSettled(requests);
                                        const allOk = results.every(r => r.status === 'fulfilled' && r.value?.data?.status === 'success');
                                        if (!allOk) {
                                            const firstError = results.find(r => r.status === 'rejected')?.reason?.message
                                                || results.find(r => r.status === 'fulfilled' && r.value?.data?.status !== 'success')?.value?.data?.message
                                                || 'Failed to reschedule vehicle';
                                            toast.error(firstError);
                                            return;
                                        }
                                        didUpdateSomething = true;
                                    }
                                }

                                // Final success handling
                                if (didUpdateSomething) {
                                    toast.success('Reservation rescheduled successfully!', {
                                        icon: '✅',
                                        duration: 3000,
                                    });
                                    setIsRescheduleModalOpen(false);
                                    await fetchReservationDetails(reservationDetails?.reservation_id);
                                } else {
                                    console.log('[ViewRequest] No changes were made during reschedule');
                                    toast.info('No changes were made to the reservation.');
                                    setIsRescheduleModalOpen(false);
                                }
                            } catch (error) {
                                console.error('[ViewRequest] Error in onReschedule:', error);
                                toast.error(`Error rescheduling reservation: ${error.response?.data?.message || error.message}`);
                            }
                        }}
                        reservationId={reservationDetails?.reservation_id}
                        currentStartDate={reservationDetails?.reschedule_start_date || reservationDetails?.reservation_start_date}
                        currentEndDate={reservationDetails?.reschedule_end_date || reservationDetails?.reservation_end_date}
                    
                    />
                </>,
                <Button
                    key="accept"
                    type="primary"
                    loading={isAccepting}
                    onClick={handleAcceptWithDriverCheck}
                    size="large"
                    icon={<CheckCircleOutlined />}
                    disabled={!priorityCheck.hasPriority || anyVenueNotAvailable || (hasVehicles && !allVehiclesHaveDriverAssigned) || !allDeptProgressApproved}
                    className="bg-green-900 hover:bg-lime-900"
                >
                    Confirm
                </Button>,
            ];
        }

        // Sequential Approval Logic
        if (adminApproval && departmentApproval) {

            // Admin must approve first
            if (adminApproval.reservation_active === 0) {
                if (isAdminApprover) {
                    // If department progress is not fully approved, admin must wait
                    if (!allDeptProgressApproved) {
                        return [
                            <Button key="waiting_dept_progress" disabled>Waiting for Department Approval Progress</Button>
                        ];
                    }
                    return [
                        // Admin decline should NOT open the decline reason modal
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); if (typeof onDecline === 'function') { onDecline(); } }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>,
                        <Button
                            key="accept"
                            type="primary"
                            loading={isAccepting}
                            onClick={handleAcceptWithoutDriverCheck}
                            size="large"
                            icon={<CheckCircleOutlined />}
                            disabled={!priorityCheck.hasPriority || anyVenueNotAvailable || !allDeptProgressApproved}
                            className="bg-green-900 hover:bg-lime-900"
                        >
                            Approve
                        </Button>,
                    ];
                }
                return [<Button key="waiting_admin" disabled>Waiting for Admin Approval</Button>];
            }

            // After admin approval is complete, it's Department's turn
            // Check if admin has approved based on status history
            const isAdminApproved = false;
            const isAdminDeclined = false;
            
            if ((isAdminApproved || isAdminDeclined) && departmentApproval.reservation_active === 0) {
                if (isDepartmentApprover) {
                    // When admin has already approved or declined, department approver should only see decline button
                    const isAdminDeclined = false;
                    
                    if (isAdminDeclined) {
                        // If admin declined, department approver should only see decline button
                        return [
                            <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                                Decline
                            </Button>,
                            <Button key="close" onClick={onClose} size="large">Close</Button>
                        ];
                    }
                    
                    // Require driver selection before rescheduling when vehicles exist
                    const hasVehicles = Array.isArray(reservationDetails.vehicles) && reservationDetails.vehicles.length > 0;
                    const allVehiclesHaveDriverAssigned = !hasVehicles || reservationDetails.vehicles.every(vehicle => {
                        // Check existing assignment
                        const existingDriver = (reservationDetails.drivers || []).find(driver =>
                            driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                            (driver.driver_id || driver.driver_name)
                        );
                        if (existingDriver) return true;
                        // Check new assignment in current session
                        const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                        return !!assignedDriverId;
                    });
                    return [
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>,
                        <>
                            <Button
                                key="reschedule"
                                type="default"
                                onClick={() => {
                                    // Extract resource IDs and quantities from reservationDetails
                                    // For Change Request status, include both original and change IDs
                                    const isChangeRequest = reservationDetails.status_name === "Change Request";
                                    
                                    const resources = {
                                        venueIds: (reservationDetails.venues || []).map(v => {
                                            if (isChangeRequest) {
                                                // For Change Request, create object with both original and change IDs
                                                return {
                                                    venue_id: v.venue_id,
                                                    change_venue_id: v.change_venue_id || null,
                                                    reservation_venue_id: v.reservation_venue_id
                                                };
                                            }
                                            return v.venue_id;
                                        }),
                                        vehicleIds: (reservationDetails.vehicles || []).map(v => {
                                            if (isChangeRequest) {
                                                // For Change Request, create object with both original and change IDs
                                                return {
                                                    vehicle_id: v.vehicle_id,
                                                    change_vehicle_id: v.change_vehicle_id || null,
                                                    reservation_vehicle_id: v.reservation_vehicle_id
                                                };
                                            }
                                            return v.vehicle_id;
                                        }),
                                        equipment: (reservationDetails.equipment || []).map(eq => ({
                                            equipment_id: eq.equipment_id,
                                            quantity: parseInt(eq.quantity, 10) || 0
                                        }))
                                    };
                                    setRescheduleResources(resources);
                                    setIsRescheduleModalOpen(true);
                                }}
                                size="large"
                                className="mr-2"
                                icon={<ScheduleOutlined />}
                                disabled={hasVehicles && !allVehiclesHaveDriverAssigned}
                            >
                                Reschedule
                            </Button>
                            <RescheduleModal
                                visible={isRescheduleModalOpen}
                                onCancel={() => setIsRescheduleModalOpen(false)}
                                reservation={reservationDetails}
                                onReschedule={async (newDates) => {
                                    console.log('[ViewRequest] ===== onReschedule ENTRY POINT =====');
                                    console.log('[ViewRequest] onReschedule called with:', newDates);
                                    try {
                                        const { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts } = newDates || {};
                                        console.log('[ViewRequest] Destructured values:', { startDate, endDate, newVenueIds, newVehicleIds, conflictData, overrideConflicts });

                                        // Step 0: If overriding conflicts, handle conflicting reservations first
                                        if (overrideConflicts && conflictData?.reservation_users?.length > 0) {
                                            console.log('Processing conflict override for COO Department Head', {
                                                conflictingUsers: conflictData.reservation_users,
                                                unavailableVenues: conflictData.unavailable_venues,
                                                unavailableVehicles: conflictData.unavailable_vehicles
                                            });
                                            
                                            // Handle conflicting reservations by rescheduling them
                                            try {
                                                const overrideResponse = await axios.post(`${encryptedUrl}/Admin.php`, {
                                                    operation: 'handleRequest',
                                                    reservation_id: reservationDetails?.reservation_id,
                                                    is_accepted: true,
                                                    user_id: SecureStorage.getLocalItem("user_id"),
                                                    override_lower_priority: true,
                                                    reschedule_mode: true,
                                                    new_start_datetime: startDate,
                                                    new_end_datetime: endDate
                                                });

                                                if (overrideResponse.data?.status !== 'success') {
                                                    toast.error('Failed to override conflicting reservations');
                                                    return;
                                                }
                                            } catch (overrideError) {
                                                console.error('Error overriding conflicts:', overrideError);
                                                toast.error('Failed to override conflicting reservations');
                                                return;
                                            }
                                        }

                                        // Step 1: If dates provided, update reservation dates only
                                        let didUpdateSomething = false;
                                        console.log('[ViewRequest] Checking if dates provided:', { startDate, endDate, hasStartDate: !!startDate, hasEndDate: !!endDate });
                                        if (startDate && endDate) {
                                            const dateResp = await axios.post(`${encryptedUrl}reservation.php`, {
                                                operation: 'updateReservationReschedule',
                                                reservation_id: reservationDetails?.reservation_id,
                                                reschedule_start_date: startDate,
                                                reschedule_end_date: endDate,
                                                user_admin_id: SecureStorage.getLocalItem('user_id')
                                            }, { headers: { 'Content-Type': 'application/json' } });
                                            if (!(dateResp?.data?.status === 'success')) {
                                                await handleRescheduleError(dateResp, reservationDetails?.reservation_id, () => setIsRescheduleModalOpen(false));
                                                return;
                                            }
                                            didUpdateSomething = true;
                                        }

                                        // Step 1.5: Handle equipment units insertion for non-Change Request reschedules
                                        const isChangeRequest = reservationDetails?.status_name === "Change Request";
                                        console.log('[ViewRequest] Checking equipment handling:', {
                                            isChangeRequest,
                                            hasEquipment: !!(reservationDetails?.equipment && reservationDetails.equipment.length > 0),
                                            equipment: reservationDetails?.equipment
                                        });
                                        
                                        if (!isChangeRequest && reservationDetails?.equipment && reservationDetails.equipment.length > 0) {
                                            try {
                                                console.log('[ViewRequest] Processing equipment units for reschedule');
                                                // Format the data to match backend expectations
                                                const equipIds = reservationDetails.equipment.map(eq => parseInt(eq.equipment_id));
                                                const quantities = reservationDetails.equipment.map(eq => parseInt(eq.quantity));
                                                
                                                // Use the new reschedule dates if provided, otherwise use original dates
                                                const useStartDate = startDate || reservationDetails.reservation_start_date;
                                                const useEndDate = endDate || reservationDetails.reservation_end_date;
                                                const formattedStartDate = new Date(useStartDate).toISOString().split('T')[0];
                                                const formattedEndDate = new Date(useEndDate).toISOString().split('T')[0];

                                                console.log('[ViewRequest] Equipment insertUnits payload:', {
                                                    equip_ids: equipIds,
                                                    quantities: quantities,
                                                    reservation_id: parseInt(reservationDetails.reservation_id),
                                                    start_date: formattedStartDate,
                                                    end_date: formattedEndDate
                                                });

                                                const insertResponse = await axios.post(`${encryptedUrl}/Assigned&Records.php`, {
                                                    operation: 'insertUnits',
                                                    equip_ids: equipIds,
                                                    quantities: quantities,
                                                    reservation_id: parseInt(reservationDetails.reservation_id),
                                                    start_date: formattedStartDate,
                                                    end_date: formattedEndDate,
                                                    user_id: SecureStorage.getLocalItem('user_id')
                                                });

                                                if (insertResponse.data?.status !== 'success') {
                                                    console.error('[ViewRequest] Equipment insertUnits failed:', insertResponse.data);
                                                    toast.error('Failed to prepare equipment units for rescheduled reservation');
                                                    return;
                                                }
                                                
                                                console.log('[ViewRequest] Equipment units inserted successfully for reschedule');
                                                didUpdateSomething = true;
                                            } catch (error) {
                                                console.error('[ViewRequest] Error inserting equipment units during reschedule:', error);
                                                toast.error('Failed to prepare equipment units for rescheduled reservation');
                                                return;
                                            }
                                        }

                                        // Step 2: Process venue changes with minimal payload per change (no dates)
                                        const currentVenues = Array.isArray(reservationDetails?.venues) ? reservationDetails.venues : [];
                                        
                                        console.log('[ViewRequest] Processing venue changes:', {
                                            currentVenues: currentVenues.map(v => ({ venue_id: v.venue_id, venue_name: v.venue_name, reservation_venue_id: v.reservation_venue_id })),
                                            newVenueIds,
                                            newVenueIdsType: typeof newVenueIds,
                                            isArray: Array.isArray(newVenueIds),
                                            newVenueIdsLength: Array.isArray(newVenueIds) ? newVenueIds.length : 'N/A',
                                            newVenueIdsContent: newVenueIds
                                        });
                                        
                                        const venue_changes = currentVenues
                                            .map((v, idx) => {
                                                const newId = Array.isArray(newVenueIds) ? newVenueIds[idx] : null;
                                                
                                                console.log(`[ViewRequest] Venue ${idx}:`, {
                                                    currentVenueId: v.venue_id,
                                                    currentVenueName: v.venue_name,
                                                    reservationVenueId: v.reservation_venue_id,
                                                    newId,
                                                    newIdType: typeof newId,
                                                    isNull: newId == null,
                                                    isUndefined: newId === undefined,
                                                    isSame: String(newId) === String(v.venue_id),
                                                    willProcess: newId != null && newId !== undefined && String(newId) !== String(v.venue_id)
                                                });
                                                
                                                // Only process if newId is explicitly provided and different from current
                                                if (newId == null || newId === undefined || String(newId) === String(v.venue_id)) return null;
                                                return {
                                                    reservation_venue_id: v.reservation_venue_id,
                                                    reservation_change_venue_id: Number(newId)
                                                };
                                            })
                                            .filter(Boolean);

                                        console.log('[ViewRequest] Venue changes to process:', venue_changes);

                                        if (venue_changes.length > 0) {
                                            console.log('[ViewRequest] Executing updateVenueReschedule for', venue_changes.length, 'venues');
                                            const requests = venue_changes.map(change => {
                                                console.log('[ViewRequest] Making updateVenueReschedule request:', change);
                                                return axios.post(`${encryptedUrl}reservation.php`, {
                                                    operation: 'updateVenueReschedule',
                                                    reservation_venue_id: change.reservation_venue_id,
                                                    reservation_change_venue_id: change.reservation_change_venue_id
                                                }, { headers: { 'Content-Type': 'application/json' } });
                                            });
                                            const results = await Promise.allSettled(requests);
                                            console.log('[ViewRequest] updateVenueReschedule results:', results.map(r => ({
                                                status: r.status,
                                                data: r.status === 'fulfilled' ? r.value?.data : r.reason
                                            })));
                                            const allOk = results.every(r => r.status === 'fulfilled' && r.value?.data?.status === 'success');
                                            if (!allOk) {
                                                const firstError = results.find(r => r.status === 'rejected')?.reason?.message
                                                    || results.find(r => r.status === 'fulfilled' && r.value?.data?.status !== 'success')?.value?.data?.message
                                                    || 'Failed to reschedule reservation';
                                                console.error('[ViewRequest] updateVenueReschedule failed:', firstError);
                                                toast.error(firstError);
                                                return;
                                            }
                                            console.log('[ViewRequest] updateVenueReschedule completed successfully');
                                            didUpdateSomething = true;
                                        } else {
                                            console.log('[ViewRequest] No venue changes to process');
                                        }

                                        // Step 3: Process vehicle changes (map reservation_vehicle_id -> selected vehicle_id)
                                        const currentVehicles = Array.isArray(reservationDetails?.vehicles) ? reservationDetails.vehicles : [];
                                        
                                        console.log('[ViewRequest] Processing vehicle changes:', {
                                            currentVehicles: currentVehicles.map(v => ({ vehicle_id: v.vehicle_id, vehicle_model_name: v.vehicle_model_name, reservation_vehicle_id: v.reservation_vehicle_id })),
                                            newVehicleIds,
                                            newVehicleIdsType: typeof newVehicleIds,
                                            isArray: Array.isArray(newVehicleIds),
                                            newVehicleIdsLength: Array.isArray(newVehicleIds) ? newVehicleIds.length : 'N/A',
                                            newVehicleIdsContent: newVehicleIds
                                        });
                                        
                                        const vehicle_changes = currentVehicles
                                            .map((v, idx) => {
                                                const newId = Array.isArray(newVehicleIds) ? newVehicleIds[idx] : null;
                                                
                                                console.log(`[ViewRequest] Vehicle ${idx}:`, {
                                                    currentVehicleId: v.vehicle_id,
                                                    currentVehicleName: v.vehicle_model_name,
                                                    reservationVehicleId: v.reservation_vehicle_id,
                                                    newId,
                                                    newIdType: typeof newId,
                                                    isNull: newId == null,
                                                    isUndefined: newId === undefined,
                                                    isSame: String(newId) === String(v.vehicle_id),
                                                    willProcess: newId != null && newId !== undefined && String(newId) !== String(v.vehicle_id)
                                                });
                                                
                                                // Only process if newId is explicitly provided and different from current
                                                if (newId == null || newId === undefined || String(newId) === String(v.vehicle_id)) return null;
                                                return {
                                                    reservation_vehicle_id: v.reservation_vehicle_id,
                                                    // Use vehicle_id as reservation_change_vehicle_id per backend contract
                                                    reservation_change_vehicle_id: Number(newId)
                                                };
                                            })
                                            .filter(Boolean);

                                        console.log('[ViewRequest] Vehicle changes to process:', vehicle_changes);
                                        
                                        if (vehicle_changes.length > 0) {
                                            console.log('[ViewRequest] Executing updateVehicleReschedule for', vehicle_changes.length, 'vehicles');
                                            const requests = vehicle_changes.map(change => {
                                                console.log('[ViewRequest] Making updateVehicleReschedule request:', change);
                                                return axios.post(`${encryptedUrl}reservation.php`, {
                                                    operation: 'updateVehicleReschedule',
                                                    reservation_vehicle_id: change.reservation_vehicle_id,
                                                    reservation_change_vehicle_id: change.reservation_change_vehicle_id
                                                }, { headers: { 'Content-Type': 'application/json' } });
                                            });
                                            const results = await Promise.allSettled(requests);
                                            console.log('[ViewRequest] updateVehicleReschedule results:', results.map(r => ({
                                                status: r.status,
                                                data: r.status === 'fulfilled' ? r.value?.data : r.reason
                                            })));
                                            const allOk = results.every(r => r.status === 'fulfilled' && r.value?.data?.status === 'success');
                                            if (!allOk) {
                                                const firstError = results.find(r => r.status === 'rejected')?.reason?.message
                                                    || results.find(r => r.status === 'fulfilled' && r.value?.data?.status !== 'success')?.value?.data?.message
                                                    || 'Failed to reschedule reservation vehicles';
                                                console.error('[ViewRequest] updateVehicleReschedule failed:', firstError);
                                                toast.error(firstError);
                                                return;
                                            }
                                            console.log('[ViewRequest] updateVehicleReschedule completed successfully');
                                            didUpdateSomething = true;
                                        } else {
                                            console.log('[ViewRequest] No vehicle changes to process');
                                        }

                                        if (!didUpdateSomething) {
                                            toast.info('No changes to update.');
                                            return;
                                        }

                                        // After reschedule, persist driver assignments if vehicles exist
                                        if (Array.isArray(reservationDetails.vehicles) && reservationDetails.vehicles.length > 0) {
                                            try {
                                                for (const vehicle of reservationDetails.vehicles) {
                                                    const existingDriver = (reservationDetails.drivers || []).find(driver =>
                                                        driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id) &&
                                                        (driver.driver_id || driver.driver_name)
                                                    );
                                                    if (!existingDriver) {
                                                        const driverId = vehicleDriverAssignments[vehicle.vehicle_id];
                                                        if (driverId !== undefined) {
                                                            let driverName = null;
                                                            if (driverId === null) {
                                                                // Calculate driver number for "No Driver Available" cases
                                                                const vehicleIndex = reservationDetails.vehicles.findIndex(v => String(v.vehicle_id) === String(vehicle.vehicle_id));
                                                                driverName = `driver ${vehicleIndex + 1}`;
                                                            } else if (driverId === 'custom') {
                                                                // Use custom driver name
                                                                driverName = customDriverNames[vehicle.vehicle_id] || null;
                                                            }
                                                            
                                                            // Check if there's an existing driver assignment for this vehicle
                                                            const existingDriverForUpdate = (reservationDetails.drivers || []).find(driver => 
                                                                driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                                                            );
                                                            
                                                            // Prepare payload
                                                            const payload = {
                                                                operation: 'insertDriver',
                                                                reservation_driver_user_id: driverId,
                                                                reservation_vehicle_id: vehicle.reservation_vehicle_id,
                                                                driver_name: driverName
                                                            };
                                                            
                                                            // If there's an existing driver assignment, include the reservation_driver_id for update
                                                            if (existingDriverForUpdate && existingDriverForUpdate.reservation_driver_id) {
                                                                payload.reservation_driver_id = existingDriverForUpdate.reservation_driver_id;
                                                            }
                                                            
                                                            // Debug logging
                                                            console.log('Frontend insertDriver payload (reschedule):', payload);
                                                            
                                                            await axios.post(`${encryptedUrl}/Admin.php`, payload);
                                                        }
                                                    }
                                                }
                                            } catch (err) {
                                                console.error('Error assigning drivers after reschedule:', err);
                                                toast.error('Failed to assign driver(s) after reschedule');
                                                return;
                                            }
                                        }

                                        // Success path
                                        toast.success('Reservation rescheduled successfully');
                                        setIsRescheduleModalOpen(false);
                                        try {
                                            await fetchReservationDetails(currentRequest?.reservation_id || reservationDetails?.reservation_id);
                                        } catch (refreshErr) {
                                            console.error('Error refreshing details after reschedule:', refreshErr);
                                        }
                                    } catch (error) {
                                        console.error('[ViewRequest] ===== ERROR IN onReschedule =====');
                                        console.error('[ViewRequest] Error during reschedule:', error);
                                        console.error('[ViewRequest] Error stack:', error.stack);
                                        toast.error('Error processing reschedule');
                                    }
                                    console.log('[ViewRequest] ===== onReschedule EXIT POINT =====');
                                }}
                            
                                resourceType={
                                    reservationDetails.venues?.length ? 'venue' : (
                                        reservationDetails.vehicles?.length ? 'vehicle' : 'equipment'
                                    )
                                }
                                resourceId={reservationDetails.venues?.[0]?.venue_id || reservationDetails.vehicles?.[0]?.vehicle_id}
                                resources={rescheduleResources}
                                originalStart={reservationDetails?.reservation_start_date}
                                originalEnd={reservationDetails?.reservation_end_date}
                            />
                        </>,
                        <Button
                            key="accept"
                            type="primary"
                            loading={isAccepting}
                            onClick={handleAcceptWithDriverCheck}
                            size="large"
                            icon={<CheckCircleOutlined />}
                            disabled={adminApproval?.reservation_active === -1 || !priorityCheck.hasPriority || anyVenueNotAvailable || !allDeptProgressApproved}
                            className="bg-green-900 hover:bg-lime-900"
                        >
                            Approve
                        </Button>,
                    ];
                }
                return [
                    <Button key="waiting dept" danger disabled={isDepartmentPending} onClick={(e) => { e.stopPropagation(); if (typeof onDecline === 'function') { onDecline(); } }} size="large" icon={<CloseCircleOutlined />}>
                        Waiting for Department Approval
                    </Button>
                ];
            }
        }

        // Fallback for other statuses or if the above logic doesn't apply
        if (reservationDetails.active === 0 || reservationDetails.active === 1) {
            // For admin approval: if current user is the admin approver and it's pending, allow approval
            // Otherwise, check if admin approval is already completed
            const adminSatisfied = adminApproval 
                ? (isAdminApprover && isAdminPending) || adminApproval.reservation_active === 1
                : true;
            
            // For department approval: if current user is the department approver and it's pending, allow approval
            // Otherwise, check if department approval is already completed or not required
            const departmentSatisfied = departmentApproval
                ? (isDepartmentApprover && isDepartmentPending) || (deansApproval.length === 0 ? true : departmentApproval.reservation_active === 1)
                : true;
            
            const approvalsSatisfied = adminSatisfied && departmentSatisfied;
            return [
                // Show decline: Admin (only if pending) skips modal; Department opens modal
                isAdminApprover
                    ? (isAdminPending ? (
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); if (typeof onDecline === 'function') { onDecline(); } }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>
                    ) : null)
                    : (
                        <Button key="decline" danger loading={isDeclining} onClick={(e) => { e.stopPropagation(); handleOpenDeclineReasonModal(); }} size="large" icon={<CloseCircleOutlined />}>
                            Decline
                        </Button>
                    ),
                (!isAdminApprover || isAdminPending) && (
                <Button
                    key="accept"
                    type="primary"
                    loading={isAccepting}
                    onClick={isAdminApprover ? handleAcceptWithoutDriverCheck : handleAcceptWithDriverCheck}
                    size="large"
                    icon={<CheckCircleOutlined />}
                    disabled={!approvalsSatisfied || !priorityCheck.hasPriority || anyVenueNotAvailable || !allDeptProgressApproved}
                    className="bg-green-900 hover:bg-lime-900"
                >
                    Approve
                </Button>
                ),
            ];
        }

        return [
            <Button key="close" onClick={onClose} size="large">
                Close
            </Button>
        ];
    };

    // Enhanced resource availability checking
    const getResourceAvailabilityInfo = (type, resourceId, resourceData = null) => {
        const availabilityData = reservationDetails.availabilityData;
        if (!availabilityData) return { isAvailable: true, conflictInfo: null };
        
        switch (type) {
            case 'venue':
                const unavailableVenue = availabilityData.unavailable_venues?.find(v => 
                    String(v.ven_id) === String(resourceId)
                );
                return {
                    isAvailable: !unavailableVenue,
                    conflictInfo: unavailableVenue ? {
                        reservedBy: unavailableVenue.reserved_by,
                        reservationTitle: unavailableVenue.reservation_title,
                        reservationId: unavailableVenue.reservation_id
                    } : null
                };
            case 'vehicle':
                const unavailableVehicle = availabilityData.unavailable_vehicles?.find(v => 
                    String(v.vehicle_id) === String(resourceId)
                );
                return {
                    isAvailable: !unavailableVehicle,
                    conflictInfo: unavailableVehicle ? {
                        reservedBy: unavailableVehicle.reserved_by,
                        reservationTitle: unavailableVehicle.reservation_title,
                        reservationId: unavailableVehicle.reservation_id,
                        vehicleLicense: unavailableVehicle.vehicle_license,
                        vehicleMake: unavailableVehicle.vehicle_make_name,
                        vehicleModel: unavailableVehicle.vehicle_model_name
                    } : null
                };
            case 'equipment':
                const unavailableEquipment = availabilityData.unavailable_equipment?.find(e => 
                    String(e.equip_id) === String(resourceId)
                );
                if (!unavailableEquipment) return { isAvailable: true, conflictInfo: null };
                
                const requestedEquipment = reservationDetails.equipment?.find(e => 
                    String(e.equipment_id) === String(resourceId)
                );
                const requestedQuantity = requestedEquipment ? parseInt(requestedEquipment.quantity) : 0;
                const totalQuantity = parseInt(unavailableEquipment.total_quantity);
                const reservedQuantity = parseInt(unavailableEquipment.reserved_quantity);
                const availableQuantity = totalQuantity - reservedQuantity;
                const isAvailable = requestedQuantity <= availableQuantity;
                
                return {
                    isAvailable,
                    conflictInfo: {
                        totalQuantity,
                        reservedQuantity,
                        availableQuantity,
                        requestedQuantity,
                        reservationsInfo: unavailableEquipment.reservations_info
                    }
                };
            case 'driver':
                const unavailableDriver = availabilityData.unavailable_drivers?.find(d => 
                    String(d.users_id) === String(resourceId)
                );
                return {
                    isAvailable: !unavailableDriver,
                    conflictInfo: unavailableDriver ? {
                        driverName: unavailableDriver.full_name
                    } : null
                };
            default:
                return { isAvailable: true, conflictInfo: null };
        }
    };

    // Resource table columns definitions
    const columns = {
        venue: [
            {
                title: 'Venue Name',
                dataIndex: 'venue_name',
                key: 'venue_name',
                render: (text, record) => {
                    const availabilityInfo = getResourceAvailabilityInfo('venue', record.venue_id);
                    return (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <BuildOutlined className="mr-2 text-purple-500" />
                                <div>
                                    {record.change_venue_name ? (
                                        // Change request: show old -> new venue name
                                        <span className="font-medium">
                                            <span className="text-red-600 line-through">{text}</span>
                                            <span className="text-gray-500 mx-2">→</span>
                                            <span className="text-green-600">{record.change_venue_name}</span>
                                        </span>
                                    ) : (
                                        // Regular request: show venue name normally
                                        <span className="font-medium">{text}</span>
                                    )}
                                   
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'}>
                                    {availabilityInfo.isAvailable ? 'Available' : 'Not Available'}
                                </Tag>
                            </div>
                        </div>
                    );
                }
            }
        ],
        vehicle: [
            {
                title: 'Vehicle',
                dataIndex: 'model',
                key: 'model',
                render: (text, record) => {
                    const availabilityInfo = getResourceAvailabilityInfo('vehicle', record.vehicle_id);
                    return (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CarOutlined className="mr-2 text-blue-500" />
                                <div className="leading-tight">
                                  
                                    <div className="text-xs text-gray-600">
                                        {[
                                            record.license || null,
                                            record.model || null,
                                            record.year || null,
                                            record.make || null,
                                            record.category || null
                                        ].filter(Boolean).join(' • ')}
                                    </div>
                                </div>
                            </div>
                            <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'}>
                                {availabilityInfo.isAvailable ? 'Available' : 'Not Available'}
                            </Tag>
                        </div>
                    );
                }
            }
            
        ],
        equipment: [
            {
                title: 'Equipment',
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => {
                    const availabilityInfo = getResourceAvailabilityInfo('equipment', record.equipment_id);
                    return (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <ToolOutlined className="mr-2 text-orange-500" />
                                <div>
                                    <span className="font-medium">{text}</span>
                                    {!availabilityInfo.isAvailable && availabilityInfo.conflictInfo && (
                                        <div className="text-xs text-red-600 mt-1">
                                            Available: {availabilityInfo.conflictInfo.availableQuantity} / {availabilityInfo.conflictInfo.totalQuantity}
                                            <br />
                                            Requested: {availabilityInfo.conflictInfo.requestedQuantity}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'}>
                                {availabilityInfo.isAvailable ? 'Available' : 'Not Available'}
                            </Tag>
                        </div>
                    );
                }
            },
            {
                title: 'Quantity',
                dataIndex: 'quantity',
                key: 'quantity',
                render: (text, record) => {
                    const availabilityInfo = getResourceAvailabilityInfo('equipment', record.equipment_id);
                    return (
                        <div className="flex flex-col items-center">
                            <Tag color="orange">Requested: {text}</Tag>
                            {availabilityInfo.conflictInfo && (
                                <Tag color={availabilityInfo.isAvailable ? 'green' : 'red'} className="mt-1">
                                    Available: {availabilityInfo.conflictInfo.availableQuantity}
                                </Tag>
                            )}
                        </div>
                    );
                }
            }
        ],
    };

    // Update vehicle table columns to show dropdown if no driver assigned
    const vehicleColumns = [
        ...columns.vehicle,
        {
            title: 'Driver',
            dataIndex: 'driver',
            key: 'driver',
            render: (_, vehicle) => {
                // First, check if there's already an assigned driver for this vehicle
                const existingDriver = (reservationDetails.drivers || []).find(driver => 
                    driver.reservation_vehicle_id && String(driver.reservation_vehicle_id) === String(vehicle.reservation_vehicle_id)
                );
                
                // Always show dropdown for approvers, even if there's an existing driver
                // This allows reassignment of existing drivers
                
                // Check if current user is an approver in the sequence
                const isApprover = reservationDetails?.approval_sequence && (() => {
                    const approvers = reservationDetails.approval_sequence;
                    if (!approvers || approvers.length === 0) return true;
                    return approvers.some(a => String(a.users_id) === String(currentUserId));
                })();
                
                // Debug logging for driver dropdown
                console.log('Driver Dropdown Debug:', {
                    currentUserId,
                    approvalSequence: reservationDetails?.approval_sequence,
                    isApprover,
                    availableDrivers: availableDrivers.length,
                    existingDriver,
                    vehicleId: vehicle.vehicle_id
                });
                
                // Only approvers in the sequence can assign drivers, others see read-only assignments
                if (!isApprover) {
                    // For non-approvers, show dash if no driver assigned
                    return <span className="text-gray-500">—</span>;
                }
                
                // For approvers, always show dropdown to allow reassignment
                // Check if there's a manual assignment in the current session
                const assignedDriverId = vehicleDriverAssignments[vehicle.vehicle_id];
                
                // Determine current selection value
                let currentValue = '';
                if (assignedDriverId !== undefined) {
                    currentValue = assignedDriverId === null ? 'null' : assignedDriverId;
                } else if (existingDriver) {
                    // If there's an existing driver, set it as current value
                    if (existingDriver.driver_id) {
                        currentValue = existingDriver.driver_id;
                    } else if (existingDriver.driver_name) {
                        // For custom driver names, we need to handle this differently
                        currentValue = 'existing_custom';
                    }
                }
                
                // Exclude drivers already assigned to other vehicles (but include current vehicle's driver)
                const assignedDriverIds = Object.entries(vehicleDriverAssignments)
                    .filter(([vid, did]) => String(vid) !== String(vehicle.vehicle_id))
                    .map(([_, did]) => did)
                    .filter(Boolean);
                const availableForThisVehicle = availableDrivers.filter(driver => !assignedDriverIds.includes(String(driver.users_id)));
                
                console.log('Dropdown Rendering Debug:', {
                    assignedDriverIds,
                    availableForThisVehicle: availableForThisVehicle.length,
                    availableDrivers: availableDrivers.length,
                    vehicleDriverAssignments
                });
                
                return (
                    <div className="space-y-2">
                        <select
                            value={currentValue}
                            onChange={e => handleDriverAssign(vehicle.vehicle_id, e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Driver</option>
                            {availableForThisVehicle.map(driver => (
                                <option key={driver.users_id} value={driver.users_id}>
                                    {driver.full_name}
                                </option>
                            ))}
                            <option value="custom" className="text-blue-600">
                                Custom Driver Name
                            </option>
                            <option value="null" className="text-red-600">
                                {(() => {
                                    const vehicleIndex = reservationDetails.vehicles.findIndex(v => String(v.vehicle_id) === String(vehicle.vehicle_id));
                                    return `driver ${vehicleIndex + 1}`;
                                })()}
                            </option>
                        </select>
                        
                        {/* Show existing custom driver name */}
                        {currentValue === 'existing_custom' && existingDriver?.driver_name && (
                            <div className="mt-2">
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                                    Current: {existingDriver.driver_name}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Select a different option to change driver</p>
                            </div>
                        )}
                        
                        {/* Custom Driver Name Input */}
                        {vehicleDriverAssignments[vehicle.vehicle_id] === 'custom' && (
                            <div className="mt-2">
                                <input
                                    type="text"
                                    placeholder="Enter driver name"
                                    value={customDriverNames[vehicle.vehicle_id] || ''}
                                    onChange={e => handleCustomDriverName(vehicle.vehicle_id, e.target.value)}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter the name of the driver for this vehicle</p>
                            </div>
                        )}
                        
                        {availableForThisVehicle.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">No drivers available for assignment</p>
                        )}
                    </div>
                );
            }
        }
    ];

    // When opening the Decline Reason Modal, pre-select 'no_driver' if driverError is present
    const handleOpenDeclineReasonModal = () => {
        if (driverError) {
            setDeclineReason('no_driver');
        }
        setIsDeclineReasonModalOpen(true);
    };

    // Collapsible resource section component
    // const CollapsibleResourceSection = ({ title, icon, resources, type, count }) => {
    //     const sectionKey = type;
    //     const isCollapsed = collapsedSections[sectionKey];
        
    //     return (
    //         <div className="collapsible-resource-section">
    //             <div
    //                 className="section-header"
    //                 onClick={() => toggleSection(sectionKey)}
    //             >
    //                 <div className="section-title-wrapper">
    //                     {icon}
    //                     <span className="section-title">{title} ({count})</span>
    //                 </div>
    //                 <DownOutlined className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`} />
    //             </div>
    //             {!isCollapsed && (
    //                 <div className="section-content">
    //                     <Table
    //                         dataSource={type === 'vehicle' ? resources.map(vehicle => ({
    //                             ...vehicle,
    //                             driver: vehicleDriverAssignments[vehicle.vehicle_id] || null
    //                         })) : resources}
    //                         columns={type === 'vehicle' ? vehicleColumns : columns[type]}
    //                         pagination={false}
    //                         size="small"
    //                         className="border border-gray-200 rounded-lg"
    //                     />
    //                 </div>
    //             )}
    //         </div>
    //     );
    // };


    // Determine if any venue is not available due to class schedule
    // Check if current user can bypass venue availability restrictions
    const currentUserLevel = reservationDetails.user_level_name;
    const currentUserDepartment = reservationDetails.department_name;
    const isDepartmentHeadFromCOO = currentUserLevel === "Department Head" && currentUserDepartment === "COO";
    const isSecretaryFromGSD = currentUserLevel === "Secretary" && currentUserDepartment === "GSD";
    const canBypassVenueRestrictions = isDepartmentHeadFromCOO || isSecretaryFromGSD;
    
    const anyVenueNotAvailable = !canBypassVenueRestrictions && reservationDetails.venues && reservationDetails.venues.some(v => v.isAvailable === false);
    
    // Get priority check result
    const priorityCheck = checkPriority();
    
    // Responsive modal/drawer content
    const modalContent = (
        <div className={`${isMobile ? 'h-full' : ''}`}>
            <div className={`${isMobile ? 'p-0 h-full flex flex-col' : 'p-0'}`}>
                {/* Enhanced Header Section */}
                <div className={`bg-gradient-to-r from-green-700 to-lime-500 ${isMobile ? 'p-3 relative' : 'p-4'} ${isMobile ? 'rounded-none' : 'rounded-t-lg'}`}>
                    {/* Close button for mobile */}
                    {isMobile && (
                        <button 
                            onClick={onClose}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <CloseOutlined className="text-white text-sm" />
                        </button>
                    )}
                    
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <UserOutlined className={`text-white ${isMobile ? 'text-lg' : 'text-xl'}`} />
                                </div>
                                <div>
                                    <h1 className={`text-white font-bold ${isMobile ? 'text-base' : 'text-xl'}`}>
                                        Reservation Details
                                    </h1>
                                    <p className={`text-white/90 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                        ID: {reservationDetails.reservation_id}
                                    </p>
                                </div>
                            </div>
                            {isMobile && (
                                <p className="text-white/80 text-xs mt-0.5">
                                    {new Date(reservationDetails.reservation_created_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        
                        {!isMobile && (
                            <div className="text-white text-right">
                                <p className="text-white/80 text-xs">Created on</p>
                                <p className="font-semibold text-xs sm:text-sm break-words">
                                    {new Date(reservationDetails.reservation_created_at).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className={`${isMobile ? 'p-4 flex-1 overflow-auto' : 'p-6'} space-y-4 sm:space-y-6`}>
                {/* Status Alerts Section */}
                {new Date(reservationDetails.reservation_end_date) < new Date() ? (
                    <Alert
                        message={<span className="font-semibold">Priority Status: Blocked</span>}
                        description="This reservation has expired and cannot be approved."
                        type="error"
                        showIcon
                        className="border border-red-400 shadow-sm"
                    />
                ) : (
                    <>
                        {/* Status-specific alerts */}
                        {reservationDetails.status_name === "Venue Approved" && (
                            <Alert
                                message={<span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>Venue Approved</span>}
                                description={<span className={isMobile ? 'text-xs' : 'text-sm'}>The venue for this reservation has been approved. You may now proceed to approve or decline the reservation.</span>}
                                type="success"
                                showIcon
                                className="border border-green-200 shadow-sm"
                            />
                        )}
                        {reservationDetails.status_name === "Venue Declined" && (
                            <Alert
                                message={<span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>Venue Declined</span>}
                                description={<span className={isMobile ? 'text-xs' : 'text-sm'}>The venue for this reservation has been declined. You may only decline this reservation.</span>}
                                type="error"
                                showIcon
                                className="border border-red-200 shadow-sm"
                            />
                        )}
                        {reservationDetails.status_name === "Registrar Approval" && (
                            <Alert
                                message={<span className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>Processing Venue Availability</span>}
                                description={<span className={isMobile ? 'text-xs' : 'text-sm'}>This request is currently being processed for venue availability by the registrar. Please wait for the response.</span>}
                                type="info"
                                showIcon
                                className="border border-blue-200 shadow-sm"
                            />
                        )}
                        {reservationDetails.status_name === "Reschedule" && (() => {
                            const departmentApproval = reservationDetails.status_history?.find(
                                status => status.status_name === 'Pending'
                            );
                            return departmentApproval && departmentApproval.reservation_active === 0;
                        })() && (
                            <Alert
                                message={<span className="font-semibold">Reschedule Request Pending</span>}
                                description="This reschedule request is waiting for department approval confirmation. All actions are temporarily disabled until the department responds."
                                type="warning"
                                showIcon
                                className="border border-orange-200 shadow-sm"
                            />
                        )}
                        {(() => {
                            const hasPendingChangeRequest =
                                reservationDetails.status_name === "Change Request" ||
                                (Array.isArray(reservationDetails.status_history) &&
                                 reservationDetails.status_history.some(s => s.status_name === 'Change Request' && s.reservation_active === 0));
                            return hasPendingChangeRequest;
                        })() && (
                            <Alert
                                message={<span className="font-semibold">Change Request - New Schedule Proposed</span>}
                                description="The requester has proposed a new schedule for this reservation. Please review the proposed dates and approve or decline accordingly."
                                type="info"
                                showIcon
                                className="border border-blue-200 shadow-sm"
                            />
                        )}

                        {/* Priority Status Section */}
                        {(reservationDetails.active === 0 || reservationDetails.active === 1) && (
                            <div className="space-y-4">
                                {reservationDetails.status_name !== "Reschedule" && (
                                    <Alert
                                        message={
                                            <span className="font-semibold">
                                                {anyVenueNotAvailable ? "Priority Status: Blocked" : (priorityCheck.hasPriority ? "Priority Status: Approved" : "Priority Status: Blocked")}
                                            </span>
                                        }
                                        description={(() => {
                                            // Check for different types of conflicts
                                            const venuesWithClassConflict = reservationDetails.venues?.filter(v => v.hasClassScheduleConflict) || [];
                                            const venuesWithResourceConflict = reservationDetails.venues?.filter(v => v.hasResourceConflict) || [];
                                            
                                            if (venuesWithClassConflict.length > 0 && venuesWithResourceConflict.length > 0) {
                                                if (canBypassVenueRestrictions) {
                                                    return `As ${isDepartmentHeadFromCOO ? 'Department Head from COO department' : 'Secretary from GSD department'}, you can override and reschedule existing reservations. Venue class schedule conflicts can be bypassed, and resource conflicts can be rescheduled.`;
                                                }
                                                return `Venues have both class schedule conflicts and resource conflicts with other reservations.`;
                                            } else if (venuesWithClassConflict.length > 0) {
                                                if (canBypassVenueRestrictions) {
                                                    return `As ${isDepartmentHeadFromCOO ? 'Department Head from COO department' : 'Secretary from GSD department'}, you can override and reschedule existing reservations (venue class schedule conflicts can be bypassed).`;
                                                }
                                                return `One or more venues are not available due to scheduled classes.`;
                                            } else if (venuesWithResourceConflict.length > 0) {
                                                if (canBypassVenueRestrictions) {
                                                    return `One or more resources are already reserved during this time period. As ${isDepartmentHeadFromCOO ? 'Department Head (COO)' : 'Secretary (GSD)'}, you can override and reschedule the existing reservation.`;
                                                }
                                                return `One or more venues are already reserved by other users during this time period.`;
                                            } else {
                                                return priorityCheck.message;
                                            }
                                        })()}
                                        type={anyVenueNotAvailable ? "warning" : (priorityCheck.hasPriority ? "success" : "warning")}
                                        showIcon
                                        className="border border-blue-200 shadow-sm"
                                    />
                                )}
                                
                                {/* Reschedule Status Message - Show when status is Reschedule */}
                                {reservationDetails.status_name === "Reschedule" && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                                            <InfoCircleOutlined className="text-blue-600" />
                                            Reschedule Proposal
                                        </h3>
                                        
                                        <div className="space-y-3">
                                            <div className="bg-white p-3 rounded-lg border border-blue-100">
                                              
                                                
                                          
                                                    <div className="flex items-center gap-2">
                                                        <Tag color="orange" className="shrink-0">
                                                            Proposal Pending
                                                        </Tag>
                                                        <p className="text-sm text-gray-600">
                                                            The reschedule proposal for the requester is now pending approval.
                                                        </p>
                                                    </div>
                                              
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Existing Reservations - Only show if there are actual resource conflicts AND status is NOT Reschedule */}
                                {reservationDetails.status_name !== "Reschedule" && (() => {
                                    const hasVenueConflict = reservationDetails.venues?.some(requestedVenue => 
                                        reservationDetails.availabilityData?.unavailable_venues?.some(unavailableVenue => 
                                            String(requestedVenue.venue_id) === String(unavailableVenue.ven_id)
                                        )
                                    );
                                    const hasVehicleConflict = reservationDetails.vehicles?.some(requestedVehicle => 
                                        reservationDetails.availabilityData?.unavailable_vehicles?.some(unavailableVehicle => 
                                            String(requestedVehicle.vehicle_id) === String(unavailableVehicle.vehicle_id)
                                        )
                                    );
                                    const hasEquipmentConflict = reservationDetails.equipment?.some(requestedEquipment => {
                                        const unavailableEquipment = reservationDetails.availabilityData?.unavailable_equipment?.find(
                                            e => String(e.equip_id) === String(requestedEquipment.equipment_id)
                                        );
                                        if (!unavailableEquipment) return false;
                                        const remainingQuantity = parseInt(unavailableEquipment.total_quantity) - parseInt(unavailableEquipment.reserved_quantity);
                                        return parseInt(requestedEquipment.quantity) > remainingQuantity;
                                    });
                                    const hasResourceConflicts = hasVenueConflict || hasVehicleConflict || hasEquipmentConflict;
                                    
                                    return hasResourceConflicts && reservationDetails.availabilityData?.reservation_users?.length > 0 && (
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                                                <InfoCircleOutlined className="text-red-600" />
                                                Existing Reservations
                                            </h3>
                                            
                                            <div className="space-y-3">
                                                {reservationDetails.availabilityData.reservation_users.map((user, index) => (
                                                    <div key={index} className="bg-white p-3 rounded-lg border border-red-100">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-600">Reserved by: <span className="font-medium">{user.full_name}</span></p>
                                                                <p className="text-sm text-gray-600">Department: <span className="font-medium">{user.departments_name}</span></p>
                                                                <p className="text-sm text-gray-600">Role: <span className="font-medium">{user.user_level_name}</span></p>
                                                            </div>
                                                            <Tag color="blue" className="shrink-0">
                                                                Priority: High
                                                            </Tag>
                                                        </div>

                                                        <div className="mt-3 space-y-2">
                                                            <h4 className="font-medium text-gray-800">
                                                                {user.reservation_title || 'Untitled Reservation'}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">{user.reservation_description}</p>
                                                        </div>

                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Start Time</p>
                                                                    <p className="font-medium text-sm text-gray-900">
                                                                        {user.reservation_start_date ? new Date(user.reservation_start_date).toLocaleString() : 'Not specified'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">End Time</p>
                                                                    <p className="font-medium text-sm text-gray-900">
                                                                        {user.reservation_end_date ? new Date(user.reservation_end_date).toLocaleString() : 'Not specified'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </>
                )}

                

                {/* Enhanced Request Details Section */}
                <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-lg border border-blue-200 shadow-sm overflow-hidden`}>
                    <div className={`bg-blue-50 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'} border-b border-blue-200`}>
                        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-blue-800 flex items-center gap-2`}>
                            <UserOutlined className="text-blue-600" />
                            Request Details
                        </h2>
                    </div>
                    
                    <div className={`${isMobile ? 'p-3' : 'p-4 sm:p-6'}`}>
                        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : isTablet ? 'grid-cols-1 gap-5' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
                            {/* Requester Information */}
                            <div className="space-y-4">
                                <h3 className={`${isMobile ? 'text-sm' : 'text-md'} font-semibold text-gray-800 border-b border-blue-200 pb-2`}>
                                    Requester Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Name</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails.requester_name}</p>
                                    </div>
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Role</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails.user_level_name}</p>
                                    </div>
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Department</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails.department_name}</p>
                                    </div>
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-green-700 mb-1`}>Additional Note</p>
                                        <p className={`font-medium bg-yellow-50 text-green-900 rounded ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2'} border border-yellow-200`}>
                                         {reservationDetails.additional_note}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule and Details */}
                            <div className="space-y-4">
                                <h3 className={`${isMobile ? 'text-sm' : 'text-md'} font-semibold text-gray-800 border-b border-blue-200 pb-2`}>
                                    Reservation Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Title</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails.reservation_title}</p>
                                    </div>
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Description</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{reservationDetails.reservation_description}</p>
                                    </div>
                                    <div>
                                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Original Date & Time</p>
                                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{formatDateRange(
                                            reservationDetails.reservation_start_date,
                                            reservationDetails.reservation_end_date
                                        )}</p>
                                    </div>
                                {(() => {
                                    // Only show "Proposed New Date & Time" for Change Request status
                                    const isChangeRequest = reservationDetails.status_name === "Change Request";
                                    const hasRescheduleData = reservationDetails.reschedule_start_date && reservationDetails.reschedule_end_date;
                                    
                                    return (isChangeRequest && hasRescheduleData) ? (
                                        <div>
                                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>Proposed New Date & Time</p>
                                            <p className={`font-medium text-blue-600 ${isMobile ? 'text-sm' : ''}`}>{formatDateRange(
                                                reservationDetails.reschedule_start_date,
                                                reservationDetails.reschedule_end_date
                                            )}</p>
                                        </div>
                                    ) : null;
                                })()}
                                </div>
                            </div>
                        </div>

                        {/* Resources Section */}
                        <div className="mt-6 pt-6 border-t border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Requested Resources</h3>
                            <div className="space-y-4">
                                {/* Venues */}
                                {reservationDetails.venues?.length > 0 && (
                                    <div>
                                        <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <BuildOutlined className="text-purple-500" />
                                            Venues ({reservationDetails.venues.length})
                                        </h4>
                                        <Table 
                                            dataSource={reservationDetails.venues} 
                                            columns={columns.venue}
                                            pagination={false}
                                            size="small"
                                            className="border border-blue-200 rounded-lg"
                                        />
                                    </div>
                                )}

                                {/* Vehicles */}
                                {reservationDetails.vehicles?.length > 0 && (
                                    <div>
                                        <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <CarOutlined className="text-blue-500" />
                                            Vehicles ({reservationDetails.vehicles.length})
                                        </h4>
                                        <Table 
                                            dataSource={reservationDetails.vehicles.map(vehicle => ({
                                                ...vehicle,
                                                driver: vehicleDriverAssignments[vehicle.vehicle_id] || null
                                            }))} 
                                            columns={vehicleColumns}
                                            pagination={false}
                                            size="small"
                                            className="border border-blue-200 rounded-lg"
                                        />
                                    </div>
                                )}

                                {/* Equipment */}
                                {reservationDetails.equipment?.length > 0 && (
                                    <div>
                                        <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <ToolOutlined className="text-orange-500" />
                                            Equipment ({reservationDetails.equipment.length})
                                        </h4>
                                        <Table 
                                            dataSource={reservationDetails.equipment} 
                                            columns={columns.equipment}
                                            pagination={false}
                                            size="small"
                                            className="border border-blue-200 rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Final Approval Section - Based on Approval Sequence */}
                        <div className="mt-6 px-4 sm:px-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Approval Sequence</h3>
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                <div className="space-y-4">
                                    {/* Display Approval Sequence */}
                                    {reservationDetails.approval_sequence && reservationDetails.approval_sequence.length > 0 ? (
                                        reservationDetails.approval_sequence.map((approver, index) => {
                                            const currentUserId = parseInt(SecureStorage.getLocalItem('user_id'), 10);
                                            const isCurrentUser = currentUserId === approver.users_id;
                                            
                                            // Determine if this is the last approver in the sequence
                                            const isLastApprover = index === reservationDetails.approval_sequence.length - 1;
                                            
                                            // Determine status based on approval data
                                            // Check if all approvers in the sequence have approved
                                            const allApproversApproved = reservationDetails.approval_sequence.every(app => app.has_approved);
                                            
                                            let statusInfo;
                                            if (approver.has_approved) {
                                                statusInfo = {
                                                    isApproved: true,
                                                    isPending: false,
                                                    isDeclined: false,
                                                    statusName: 'Approved',
                                                    updatedBy: approver.approver_name,
                                                    updatedAt: approver.approval_date,
                                                    allApproversApproved: allApproversApproved,
                                                    isLastApprover: isLastApprover
                                                };
                                            } else {
                                                // Check if this approver should be active (previous approvers have approved)
                                                const previousApprovers = reservationDetails.approval_sequence.slice(0, index);
                                                const allPreviousApproved = previousApprovers.every(prev => prev.has_approved);
                                                
                                                statusInfo = {
                                                    isApproved: false,
                                                    isPending: allPreviousApproved,
                                                    isDeclined: false,
                                                    statusName: allPreviousApproved ? 'Pending' : 'Waiting',
                                                    updatedBy: null,
                                                    updatedAt: null,
                                                    allApproversApproved: allApproversApproved,
                                                    isLastApprover: isLastApprover
                                                };
                                            }
                                            
                                            return (
                                                <div key={approver.approval_order_id} className="p-3 bg-white rounded-md border shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="flex items-center mr-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-2">
                                                                    {approver.approval_sequence}
                                                                </div>
                                                                {statusInfo.isApproved ? (
                                                                    <CheckCircleOutlined className="text-green-500 text-lg" />
                                                                ) : statusInfo.isPending ? (
                                                                    <ClockCircleOutlined className="text-yellow-500 text-lg" />
                                                                ) : (
                                                                    <ClockCircleOutlined className="text-gray-400 text-lg" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-800">
                                                                    {approver.approver_name} {isCurrentUser && '(You)'} 
                                                                    {statusInfo.isLastApprover && <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Last Approver</span>}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {approver.user_level_name} - {approver.departments_name}
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    {statusInfo.updatedAt ? 
                                                                        new Date(statusInfo.updatedAt).toLocaleString() : 
                                                                        statusInfo.isPending ? 'Waiting for action' : 
                                                                        statusInfo.allApproversApproved ? 'Approved' : 'Waiting for previous approvals'
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Tag color={
                                                                statusInfo.isApproved ? 'green' : 
                                                                statusInfo.isPending ? 'gold' : 
                                                                'default'
                                                            }>
                                                                {statusInfo.statusName}
                                                            </Tag>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-4 text-center text-gray-500">
                                            <InfoCircleOutlined className="text-2xl mb-2" />
                                            <div>No approval sequence configured for this reservation</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dean Approval Progress Section */}
                        {(isLoadingDeans || deansApproval.length > 0) && (
                            <div className="mt-6 px-4 sm:px-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Department Approval Progress</h3>
                                {isLoadingDeans ? (
                                    <div className="flex items-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                                        <Spin size="small" className="mr-2" />
                                        <span>Loading Approvals...</span>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg border border-gray-200">
                                        <div 
                                            onClick={() => setIsApproverListVisible(!isApproverListVisible)} 
                                            className="flex items-center justify-between cursor-pointer p-4"
                                        >
                                            <div className="flex-grow pr-4">
                                                <Progress 
                                                    percent={deansApproval.length > 0 ? (approvedDeansCount / deansApproval.length) * 100 : 0}
                                                    format={() => `${approvedDeansCount} / ${deansApproval.length} Approved`}
                                                    strokeColor={{ from: '#108ee9', to: '#87d068' }}
                                                    trailColor="rgba(0, 0, 0, 0.06)"
                                                />
                                            </div>
                                            <DownOutlined 
                                                className={`text-gray-600 transition-transform duration-300 ${isApproverListVisible ? 'rotate-180' : ''}`}
                                            />
                                        </div>

                                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isApproverListVisible ? 'max-h-96' : 'max-h-0'}`}>
                                            <div className="border-t border-gray-200 p-4">
                                                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                                    {deansApproval.map(dean => (
                                                        <li key={dean.approval_id} className="p-3 bg-white rounded-md border flex items-center justify-between shadow-sm">
                                                            <div className="flex items-center">
                                                                {dean.is_approved === 1 || dean.is_approved === '1' ? (
                                                                    <CheckCircleOutlined className="text-green-500 mr-3 text-lg" />
                                                                ) : (
                                                                    <ClockCircleOutlined className="text-yellow-500 mr-3 text-lg" />
                                                                )}
                                                                <div>
                                                                    <div className="font-medium text-gray-800">{dean.user_name}</div>
                                                                    <div className="text-xs text-gray-500">{dean.department_name}</div>
                                                                </div>
                                                            </div>
                                                            <Tag color={dean.is_approved === 1 || dean.is_approved === '1' ? 'green' : 'gold'}>
                                                                {dean.is_approved === 1 || dean.is_approved === '1' ? 'Approved' : 'Pending'}
                                                            </Tag>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
                    
                    {/* Driver Error Alert */}
                    {driverError && (
                        <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-4'}`}>
                            <Alert
                                message={driverError}
                                type="error"
                                showIcon
                                className="border border-red-300"
                            />
                        </div>
                    )}
                </div>
            
        
    );

    return (
        <>
            {isMobile ? (
                <Drawer
                    title={null}
                    placement="bottom"
                    height="95%"
                    visible={visible}
                    onClose={onClose}
                    className="reservation-detail-drawer"
                    bodyStyle={{ padding: 0 }}
                    headerStyle={{ display: 'none' }}
                    closable={true}
                    closeIcon={<CloseOutlined className="text-white" />}
                    maskClosable={false}
                    footer={null}
                >
                    {modalContent}
                </Drawer>
            ) : (
                <Modal
                    title={null}
                    visible={visible}
                    onCancel={onClose}
                    width={isTablet ? 700 : 800}
                    footer={getModalFooter()}
                    className="reservation-detail-modal"
                    bodyStyle={{ padding: '0' }}
                    maskClosable={false}
                    zIndex={1000}
                >
                    {modalContent}
                </Modal>
            )}
        </>
    );
};