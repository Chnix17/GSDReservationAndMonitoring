<?php
// Set CORS headers
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Requested-By");
header("Access-Control-Max-Age: 86400");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class Reservation {
    private $conn;

    public function __construct() {
        include 'connection-pdo.php';
        $this->conn = $conn;
    }


    public function fetchAvailability($itemType, $itemId, $inputQuantities = [], $startDateTime = null, $endDateTime = null) {
        try {
            $itemIds = is_array($itemId) ? $itemId : [$itemId];
            $placeholders = implode(',', array_fill(0, count($itemIds), '?'));
    
            if ($itemType === 'venue') {
                // First get original venue reservations
                $sql1 = "
                    SELECT
                        v.ven_id,
                        v.ven_name,
                        v.ven_occupancy,
                        r.reservation_id,
                        r.reservation_title,
                        r.reservation_user_id,
                        ul.user_level_name AS user_level_name,
                        d.departments_name AS department_name,
                        r.reservation_start_date,
                        r.reservation_end_date,
                        r.reschedule_start_date,
                        r.reschedule_end_date,
                        latest_status.reservation_status_status_id AS reservation_status_status_id,
                        latest_status.reservation_active AS reservation_active,
                        CASE WHEN active_resched.max_reschedule_status_id IS NULL THEN 0 ELSE 1 END AS has_active_reschedule,
                        rv.reservation_change_venue_id,
                        'original' AS venue_type
                    FROM tbl_venue v
                    INNER JOIN tbl_reservation_venue rv
                        ON v.ven_id = rv.reservation_venue_venue_id
                    INNER JOIN tbl_reservation r
                        ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) latest_status
                        ON latest_status.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                    LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                    WHERE v.ven_id IN ($placeholders)
                      AND r.reservation_id NOT IN (
                          SELECT DISTINCT reservation_reservation_id 
                          FROM tbl_reservation_status 
                          WHERE reservation_status_status_id IN (2, 5, 4)
                      )
                      AND NOT (latest_status.reservation_status_status_id = 6 AND active_resched.max_reschedule_status_id IS NOT NULL)
                    
                    UNION ALL
                    
                    SELECT
                        v.ven_id,
                        v.ven_name,
                        v.ven_occupancy,
                        r.reservation_id,
                        r.reservation_title,
                        r.reservation_user_id,
                        ul.user_level_name AS user_level_name,
                        d.departments_name AS department_name,
                        r.reservation_start_date,
                        r.reservation_end_date,
                        r.reschedule_start_date,
                        r.reschedule_end_date,
                        latest_status.reservation_status_status_id AS reservation_status_status_id,
                        latest_status.reservation_active AS reservation_active,
                        CASE WHEN active_resched.max_reschedule_status_id IS NULL THEN 0 ELSE 1 END AS has_active_reschedule,
                        rv.reservation_change_venue_id,
                        'reschedule_original' AS venue_type
                    FROM tbl_venue v
                    INNER JOIN tbl_reservation_venue rv
                        ON v.ven_id = rv.reservation_venue_venue_id
                    INNER JOIN tbl_reservation r
                        ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) latest_status
                        ON latest_status.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                    LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                    WHERE v.ven_id IN ($placeholders)
                      AND latest_status.reservation_status_status_id IN (1, 6, 8, 9, 10, 11, 14)
                      AND rv.reservation_change_venue_id IS NULL
                      AND r.reschedule_start_date IS NOT NULL
                      AND r.reschedule_end_date IS NOT NULL
                      AND r.reservation_id NOT IN (
                          SELECT DISTINCT reservation_reservation_id 
                          FROM tbl_reservation_status 
                          WHERE reservation_status_status_id IN (2, 5, 4)
                      )
                    
                    UNION ALL
                    
                    SELECT
                        cv.ven_id,
                        cv.ven_name,
                        cv.ven_occupancy,
                        r.reservation_id,
                        r.reservation_title,
                        r.reservation_user_id,
                        ul.user_level_name AS user_level_name,
                        d.departments_name AS department_name,
                        CASE 
                            WHEN latest_status.reservation_status_status_id = 14 
                                 AND r.reschedule_start_date IS NOT NULL 
                            THEN r.reschedule_start_date 
                            ELSE r.reservation_start_date 
                        END AS reservation_start_date,
                        CASE 
                            WHEN latest_status.reservation_status_status_id = 14 
                                 AND r.reschedule_end_date IS NOT NULL 
                            THEN r.reschedule_end_date 
                            ELSE r.reservation_end_date 
                        END AS reservation_end_date,
                        r.reschedule_start_date,
                        r.reschedule_end_date,
                        latest_status.reservation_status_status_id AS reservation_status_status_id,
                        latest_status.reservation_active AS reservation_active,
                        CASE WHEN active_resched.max_reschedule_status_id IS NULL THEN 0 ELSE 1 END AS has_active_reschedule,
                        rv.reservation_change_venue_id,
                        'change' AS venue_type
                    FROM tbl_venue cv
                    INNER JOIN tbl_reservation_venue rv
                        ON cv.ven_id = rv.reservation_change_venue_id
                    INNER JOIN tbl_reservation r
                        ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) latest_status
                        ON latest_status.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                    LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                    WHERE cv.ven_id IN ($placeholders)
                      AND rv.reservation_change_venue_id IS NOT NULL
                      AND latest_status.reservation_status_status_id IN (1, 6, 8, 9, 10, 11, 14)
                      AND r.reservation_id NOT IN (
                          SELECT DISTINCT reservation_reservation_id 
                          FROM tbl_reservation_status 
                          WHERE reservation_status_status_id IN (2, 5, 4)
                      )
                ";
                
                // Add date range filtering if provided
                if ($startDateTime && $endDateTime) {
                    $dateFilter = " AND (
                        (
                            (CASE
                                WHEN latest_status.reservation_status_status_id IN (10, 11, 14)
                                     AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_start_date ELSE r.reservation_start_date END)
                            BETWEEN :startDateTime AND :endDateTime
                        )
                        OR (
                            (CASE
                                WHEN latest_status.reservation_status_status_id IN (10, 11, 14)
                                     AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_end_date ELSE r.reservation_end_date END)
                            BETWEEN :startDateTime AND :endDateTime
                        )
                        OR (
                            :startDateTime BETWEEN 
                                (CASE
                                    WHEN latest_status.reservation_status_status_id IN (10, 11, 14)
                                         AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                    THEN r.reschedule_start_date ELSE r.reservation_start_date END)
                                AND 
                                (CASE
                                    WHEN latest_status.reservation_status_status_id IN (10, 11, 14)
                                         AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                    THEN r.reschedule_end_date ELSE r.reservation_end_date END)
                        )
                        OR (
                            :endDateTime BETWEEN 
                                (CASE
                                    WHEN latest_status.reservation_status_status_id IN (10, 11, 14)
                                         AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                    THEN r.reschedule_start_date ELSE r.reservation_start_date END)
                                AND 
                                (CASE
                                    WHEN latest_status.reservation_status_status_id IN (10, 11, 14)
                                         AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                    THEN r.reschedule_end_date ELSE r.reservation_end_date END)
                        )
                    )";
                    
                    // Insert date filter before UNION ALL
                    $sql1 = str_replace('WHERE cv.ven_id IN', $dateFilter . ' WHERE cv.ven_id IN', 
                             str_replace('WHERE v.ven_id IN', $dateFilter . ' WHERE v.ven_id IN', $sql1));
                }
                
                $stmt = $this->conn->prepare($sql1);
                
                if ($startDateTime && $endDateTime) {
                    $params = array_merge($itemIds, [$startDateTime, $endDateTime, $startDateTime, $endDateTime], 
                                         $itemIds, [$startDateTime, $endDateTime, $startDateTime, $endDateTime],
                                         $itemIds, [$startDateTime, $endDateTime, $startDateTime, $endDateTime]);
                    $stmt->execute($params);
                } else {
                    $params = array_merge($itemIds, $itemIds, $itemIds);
                    $stmt->execute($params);
                }
    
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Filter results to handle rescheduled reservations properly
                $filteredResults = [];
                $processedReservations = [];
                
                foreach ($results as $result) {
                    $reservationId = $result['reservation_id'];
                    $statusId = (int)$result['reservation_status_status_id'];
                    $reservationActive = (int)$result['reservation_active'];
                    $venueType = $result['venue_type'];
                    
                    // Handle the logic for displaying reservations based on status and venue type
                    if ($statusId === 10 || $statusId === 11 || $statusId === 14) {
                        // Special handling for status 11 - always display 2 entries
                        if ($statusId === 11) {
                            // Check if change_venue_id exists
                            if (!empty($result['reservation_change_venue_id'])) {
                                // Display both original and change venues
                                if ($venueType === 'original') {
                                    // Original venue uses original dates
                                    // Keep both original and reschedule dates for display
                                    
                                    // Clean up helper fields only
                                    unset($result['venue_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_venue_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                } else if ($venueType === 'change') {
                                    // Change venue - keep both original and reschedule dates
                                    // Store original dates before updating
                                    $result['original_start_date'] = $result['reservation_start_date'];
                                    $result['original_end_date'] = $result['reservation_end_date'];
                                    
                                    // Set reschedule dates as main dates for change venue
                                    if (!empty($result['reschedule_start_date']) && !empty($result['reschedule_end_date'])) {
                                        $result['reservation_start_date'] = $result['reschedule_start_date'];
                                        $result['reservation_end_date'] = $result['reschedule_end_date'];
                                    }
                                    
                                    // Clean up helper fields only
                                    unset($result['venue_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_venue_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                }
                            } else {
                                // No change venue - display both original and reschedule dates
                                if ($venueType === 'original') {
                                    // Original venue with original dates
                                    // Keep both original and reschedule dates for display
                                    
                                    // Clean up helper fields only
                                    unset($result['venue_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_venue_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                } else if ($venueType === 'reschedule_original') {
                                    // Same venue with reschedule dates (already set in query)
                                    // Keep both original and reschedule dates for display
                                    
                                    // Clean up helper fields only
                                    unset($result['venue_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_venue_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                }
                            }
                        }
                        // Special handling for status 14 with active=1
                        else if ($statusId === 14 && $reservationActive === 1) {
                            // Check if change_venue_id exists
                            if (!empty($result['reservation_change_venue_id'])) {
                                // Only display one entry (prioritize change venue)
                                if ($venueType === 'change' && !in_array($reservationId, $processedReservations)) {
                                    // For status 14 change venues, keep both original and reschedule dates
                                    // Store original dates for reference
                                    $result['original_start_date'] = $result['reservation_start_date'];
                                    $result['original_end_date'] = $result['reservation_end_date'];
                                    
                                    // Clean up helper fields only
                                    unset($result['venue_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_venue_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                    $processedReservations[] = $reservationId;
                                }
                            } else {
                                // Display reschedule dates when change_venue_id is null
                                if (!in_array($reservationId, $processedReservations)) {
                                    if ($venueType === 'reschedule_original') {
                                        // For status 14 original venues, reschedule dates are already set as reservation dates
                                        // Keep both for display
                                    } else if ($venueType === 'original') {
                                        // For status 14 original venues, store original dates before updating
                                        $result['original_start_date'] = $result['reservation_start_date'];
                                        $result['original_end_date'] = $result['reservation_end_date'];
                                        
                                        // Use reschedule dates as main dates
                                        if (!empty($result['reschedule_start_date']) && !empty($result['reschedule_end_date'])) {
                                            $result['reservation_start_date'] = $result['reschedule_start_date'];
                                            $result['reservation_end_date'] = $result['reschedule_end_date'];
                                        }
                                    }
                                    
                                    // Clean up helper fields only
                                    unset($result['venue_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_venue_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                    
                                    // Mark as processed only after handling all venue types for this reservation
                                    if ($venueType === 'reschedule_original' || ($venueType === 'original' && empty($result['reservation_change_venue_id']))) {
                                        $processedReservations[] = $reservationId;
                                    }
                                }
                            }
                        } else {
                            // For other statuses (10, 11, or 14 with active=0), handle based on venue type
                            if ($venueType === 'change') {
                                // For change venues, store original dates and use reschedule dates
                                $result['original_start_date'] = $result['reservation_start_date'];
                                $result['original_end_date'] = $result['reservation_end_date'];
                                
                                // For status 10 and 11 change venues, use rescheduled dates
                                if (($statusId === 10 || $statusId === 11) && !empty($result['reschedule_start_date']) && !empty($result['reschedule_end_date'])) {
                                    $result['reservation_start_date'] = $result['reschedule_start_date'];
                                    $result['reservation_end_date'] = $result['reschedule_end_date'];
                                }
                            } else if ($venueType === 'original') {
                                // For original venues, store original dates before updating
                                $result['original_start_date'] = $result['reservation_start_date'];
                                $result['original_end_date'] = $result['reservation_end_date'];
                                
                                // For status 10, 11, and 14 original venues, use reschedule dates when available
                                if (($statusId === 10 || $statusId === 11 || $statusId === 14) && !empty($result['reschedule_start_date']) && !empty($result['reschedule_end_date'])) {
                                    $result['reservation_start_date'] = $result['reschedule_start_date'];
                                    $result['reservation_end_date'] = $result['reschedule_end_date'];
                                }
                            } else if ($venueType === 'reschedule_original') {
                                // This venue type already has reschedule dates as reservation dates
                                // Keep both for display
                            }
                            
                            // Clean up helper fields only
                            unset($result['venue_type']);
                            unset($result['has_active_reschedule']);
                            unset($result['reservation_change_venue_id']);
                            
                            // Set availability based on status
                            $result['is_available'] = false;
                            
                            // Set reservation status text
                            $result['reservation_status'] = 'Rescheduled';
                            
                            $filteredResults[] = $result;
                        }
                    } else {
                        // For all other reservations, show as normal
                        // Clean up helper fields
                        unset($result['reschedule_start_date']);
                        unset($result['reschedule_end_date']);
                        unset($result['venue_type']);
                        unset($result['has_active_reschedule']);
                        unset($result['reservation_change_venue_id']);
                        
                        // Set availability based on status
                        $result['is_available'] = ($statusId !== 6);
                        
                        // Set reservation status text
                        switch ($statusId) {
                            case 1:
                                $result['reservation_status'] = 'Pending';
                                break;
                            case 6:
                                $result['reservation_status'] = 'Reserved';
                                break;
                            case 8:
                                $result['reservation_status'] = 'Pending Department Approval';
                                break;
                            case 10:
                            case 11:
                            case 14:
                                $result['reservation_status'] = 'Rescheduled';
                                break;
                            default:
                                $result['reservation_status'] = 'Available';
                        }
                        
                        $filteredResults[] = $result;
                    }
                }
                
                $results = $filteredResults;
    
            } elseif ($itemType === 'vehicle') {
                // First get original vehicle reservations
                $sql2 = "
                    SELECT
                        v.vehicle_id,
                        v.vehicle_license,
                        vm.vehicle_make_name,
                        vmd.vehicle_model_name,
                        r.reservation_id,
                        r.reservation_title,
                        r.reservation_user_id,
                        ul.user_level_name AS user_level_name,
                        d.departments_name AS department_name,
                        r.reservation_start_date,
                        r.reservation_end_date,
                        r.reschedule_start_date,
                        r.reschedule_end_date,
                        latest_status.reservation_status_status_id,
                        latest_status.reservation_active,
                        CASE WHEN active_resched.max_reschedule_status_id IS NULL THEN 0 ELSE 1 END AS has_active_reschedule,
                        rv.reservation_change_vehicle_id,
                        'original' AS vehicle_type,
                        (
                            SELECT COUNT(DISTINCT u2.users_id)
                            FROM tbl_users u2
                            WHERE u2.users_user_level_id = 19
                                AND u2.is_active = 1
                        ) AS available_drivers_count
                    FROM tbl_vehicle v
                    LEFT JOIN tbl_vehicle_model vmd
                        ON v.vehicle_model_id = vmd.vehicle_model_id
                    LEFT JOIN tbl_vehicle_make vm
                        ON vmd.vehicle_model_vehicle_make_id = vm.vehicle_make_id
                    INNER JOIN tbl_reservation_vehicle rv
                        ON v.vehicle_id = rv.reservation_vehicle_vehicle_id
                    INNER JOIN tbl_reservation r
                        ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) latest_status
                        ON latest_status.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                    LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                    WHERE v.vehicle_id IN ($placeholders)
                      AND r.reservation_id NOT IN (
                          SELECT DISTINCT reservation_reservation_id 
                          FROM tbl_reservation_status 
                          WHERE reservation_status_status_id IN (2, 5, 4)
                      )
                      AND NOT (latest_status.reservation_status_status_id = 6 AND active_resched.max_reschedule_status_id IS NOT NULL)
                    
                    UNION ALL
                    
                    SELECT
                        v.vehicle_id,
                        v.vehicle_license,
                        vm.vehicle_make_name,
                        vmd.vehicle_model_name,
                        r.reservation_id,
                        r.reservation_title,
                        r.reservation_user_id,
                        ul.user_level_name AS user_level_name,
                        d.departments_name AS department_name,
                        r.reservation_start_date,
                        r.reservation_end_date,
                        r.reschedule_start_date,
                        r.reschedule_end_date,
                        latest_status.reservation_status_status_id,
                        latest_status.reservation_active,
                        CASE WHEN active_resched.max_reschedule_status_id IS NULL THEN 0 ELSE 1 END AS has_active_reschedule,
                        rv.reservation_change_vehicle_id,
                        'reschedule_original' AS vehicle_type,
                        (
                            SELECT COUNT(DISTINCT u2.users_id)
                            FROM tbl_users u2
                            WHERE u2.users_user_level_id = 19
                                AND u2.is_active = 1
                        ) AS available_drivers_count
                    FROM tbl_vehicle v
                    LEFT JOIN tbl_vehicle_model vmd
                        ON v.vehicle_model_id = vmd.vehicle_model_id
                    LEFT JOIN tbl_vehicle_make vm
                        ON vmd.vehicle_model_vehicle_make_id = vm.vehicle_make_id
                    INNER JOIN tbl_reservation_vehicle rv
                        ON v.vehicle_id = rv.reservation_vehicle_vehicle_id
                    INNER JOIN tbl_reservation r
                        ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) latest_status
                        ON latest_status.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                    LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                    WHERE v.vehicle_id IN ($placeholders)
                      AND latest_status.reservation_status_status_id IN (1, 6, 8, 9, 10, 11, 14)
                      AND rv.reservation_change_vehicle_id IS NULL
                      AND r.reschedule_start_date IS NOT NULL
                      AND r.reschedule_end_date IS NOT NULL
                      AND r.reservation_id NOT IN (
                          SELECT DISTINCT reservation_reservation_id 
                          FROM tbl_reservation_status 
                          WHERE reservation_status_status_id IN (2, 5, 4)
                      )
                    
                    UNION ALL
                    
                    SELECT
                        cv.vehicle_id,
                        cv.vehicle_license,
                        cvmk.vehicle_make_name,
                        cvmd.vehicle_model_name,
                        r.reservation_id,
                        r.reservation_title,
                        r.reservation_user_id,
                        ul.user_level_name AS user_level_name,
                        d.departments_name AS department_name,
                        CASE 
                            WHEN latest_status.reservation_status_status_id = 14 
                                 AND r.reschedule_start_date IS NOT NULL 
                            THEN r.reschedule_start_date 
                            ELSE r.reservation_start_date 
                        END AS reservation_start_date,
                        CASE 
                            WHEN latest_status.reservation_status_status_id = 14 
                                 AND r.reschedule_end_date IS NOT NULL 
                            THEN r.reschedule_end_date 
                            ELSE r.reservation_end_date 
                        END AS reservation_end_date,
                        r.reschedule_start_date,
                        r.reschedule_end_date,
                        latest_status.reservation_status_status_id,
                        latest_status.reservation_active,
                        CASE WHEN active_resched.max_reschedule_status_id IS NULL THEN 0 ELSE 1 END AS has_active_reschedule,
                        rv.reservation_change_vehicle_id,
                        'change' AS vehicle_type,
                        (
                            SELECT COUNT(DISTINCT u2.users_id)
                            FROM tbl_users u2
                            WHERE u2.users_user_level_id = 19
                                AND u2.is_active = 1
                        ) AS available_drivers_count
                    FROM tbl_vehicle cv
                    LEFT JOIN tbl_vehicle_model cvmd
                        ON cv.vehicle_model_id = cvmd.vehicle_model_id
                    LEFT JOIN tbl_vehicle_make cvmk
                        ON cvmd.vehicle_model_vehicle_make_id = cvmk.vehicle_make_id
                    INNER JOIN tbl_reservation_vehicle rv
                        ON cv.vehicle_id = rv.reservation_change_vehicle_id
                    INNER JOIN tbl_reservation r
                        ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) latest_status
                        ON latest_status.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                    LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                    WHERE cv.vehicle_id IN ($placeholders)
                      AND rv.reservation_change_vehicle_id IS NOT NULL
                      AND latest_status.reservation_status_status_id IN (1, 6, 8, 9, 10, 11, 14)
                      AND r.reservation_id NOT IN (
                          SELECT DISTINCT reservation_reservation_id 
                          FROM tbl_reservation_status 
                          WHERE reservation_status_status_id IN (2, 5, 4)
                      )
                ";
                
                $stmt = $this->conn->prepare($sql2);
                $params = array_merge($itemIds, $itemIds, $itemIds);
                $stmt->execute($params);
    
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Filter results to handle rescheduled reservations properly
                $filteredResults = [];
                $processedReservations = [];
                
                foreach ($results as $result) {
                    $reservationId = $result['reservation_id'];
                    $statusId = (int)$result['reservation_status_status_id'];
                    $reservationActive = (int)$result['reservation_active'];
                    $vehicleType = $result['vehicle_type'];
                    
                    // Handle the logic for displaying reservations based on status and vehicle type
                    if ($statusId === 10 || $statusId === 11 || $statusId === 14) {
                        // Special handling for status 11 - always display 2 entries
                        if ($statusId === 11) {
                            // Check if change_vehicle_id exists
                            if (!empty($result['reservation_change_vehicle_id'])) {
                                // Display both original and change vehicles
                                if ($vehicleType === 'original') {
                                    // Original vehicle uses original dates
                                    // Keep both original and reschedule dates for display
                                    
                                    // Clean up helper fields only
                                    unset($result['vehicle_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_vehicle_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                } else if ($vehicleType === 'change') {
                                    // Change vehicle - keep both original and reschedule dates
                                    // Store original dates before updating
                                    $result['original_start_date'] = $result['reservation_start_date'];
                                    $result['original_end_date'] = $result['reservation_end_date'];
                                    
                                    // Set reschedule dates as main dates for change vehicle
                                    if (!empty($result['reschedule_start_date']) && !empty($result['reschedule_end_date'])) {
                                        $result['reservation_start_date'] = $result['reschedule_start_date'];
                                        $result['reservation_end_date'] = $result['reschedule_end_date'];
                                    }
                                    
                                    // Clean up helper fields only
                                    unset($result['vehicle_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_vehicle_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                }
                            } else {
                                // No change vehicle - display both original and reschedule dates
                                if ($vehicleType === 'original') {
                                    // Original vehicle with original dates
                                    // Keep both original and reschedule dates for display
                                    
                                    // Clean up helper fields only
                                    unset($result['vehicle_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_vehicle_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                } else if ($vehicleType === 'reschedule_original') {
                                    // Same vehicle with reschedule dates (already set in query)
                                    // Keep both original and reschedule dates for display
                                    
                                    // Clean up helper fields only
                                    unset($result['vehicle_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_vehicle_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                }
                            }
                        }
                        // Special handling for status 14 with active=1
                        else if ($statusId === 14 && $reservationActive === 1) {
                            // Check if change_vehicle_id exists
                            if (!empty($result['reservation_change_vehicle_id'])) {
                                // Only display one entry (prioritize change vehicle)
                                if ($vehicleType === 'change' && !in_array($reservationId, $processedReservations)) {
                                    // For status 14 change vehicles, keep both original and reschedule dates
                                    // Store original dates for reference
                                    $result['original_start_date'] = $result['reservation_start_date'];
                                    $result['original_end_date'] = $result['reservation_end_date'];
                                    
                                    // Clean up helper fields only
                                    unset($result['vehicle_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_vehicle_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                    $processedReservations[] = $reservationId;
                                }
                            } else {
                                // Display reschedule dates when change_vehicle_id is null
                                if (!in_array($reservationId, $processedReservations)) {
                                    if ($vehicleType === 'reschedule_original') {
                                        // For status 14 original vehicles, reschedule dates are already set as reservation dates
                                        // Keep both for display
                                    } else if ($vehicleType === 'original') {
                                        // For status 14 original vehicles, store original dates before updating
                                        $result['original_start_date'] = $result['reservation_start_date'];
                                        $result['original_end_date'] = $result['reservation_end_date'];
                                        
                                        // Use reschedule dates as main dates
                                        if (!empty($result['reschedule_start_date']) && !empty($result['reschedule_end_date'])) {
                                            $result['reservation_start_date'] = $result['reschedule_start_date'];
                                            $result['reservation_end_date'] = $result['reschedule_end_date'];
                                        }
                                    }
                                    
                                    // Clean up helper fields only
                                    unset($result['vehicle_type']);
                                    unset($result['has_active_reschedule']);
                                    unset($result['reservation_change_vehicle_id']);
                                    
                                    // Set availability based on status
                                    $result['is_available'] = false;
                                    
                                    // Set reservation status text
                                    $result['reservation_status'] = 'Rescheduled';
                                    
                                    $filteredResults[] = $result;
                                    
                                    // Mark as processed only after handling all vehicle types for this reservation
                                    if ($vehicleType === 'reschedule_original' || ($vehicleType === 'original' && empty($result['reservation_change_vehicle_id']))) {
                                        $processedReservations[] = $reservationId;
                                    }
                                }
                            }
                        } else {
                            // For other statuses (10, 11, or 14 with active=0), handle based on vehicle type
                            if ($vehicleType === 'change') {
                                // For change vehicles, store original dates and use reschedule dates
                                $result['original_start_date'] = $result['reservation_start_date'];
                                $result['original_end_date'] = $result['reservation_end_date'];
                                
                                // For status 10 and 11 change vehicles, use rescheduled dates
                                if (($statusId === 10 || $statusId === 11) && !empty($result['reschedule_start_date']) && !empty($result['reschedule_end_date'])) {
                                    $result['reservation_start_date'] = $result['reschedule_start_date'];
                                    $result['reservation_end_date'] = $result['reschedule_end_date'];
                                }
                            } else if ($vehicleType === 'original') {
                                // For original vehicles, store original dates before updating
                                $result['original_start_date'] = $result['reservation_start_date'];
                                $result['original_end_date'] = $result['reservation_end_date'];
                                
                                // For status 10, 11, and 14 original vehicles, use reschedule dates when available
                                if (($statusId === 10 || $statusId === 11 || $statusId === 14) && !empty($result['reschedule_start_date']) && !empty($result['reschedule_end_date'])) {
                                    $result['reservation_start_date'] = $result['reschedule_start_date'];
                                    $result['reservation_end_date'] = $result['reschedule_end_date'];
                                }
                            } else if ($vehicleType === 'reschedule_original') {
                                // This vehicle type already has reschedule dates as reservation dates
                                // Keep both for display
                            }
                            
                            // Clean up helper fields only
                            unset($result['vehicle_type']);
                            unset($result['has_active_reschedule']);
                            unset($result['reservation_change_vehicle_id']);
                            
                            // Set availability based on status
                            $result['is_available'] = false;
                            
                            // Set reservation status text
                            $result['reservation_status'] = 'Rescheduled';
                            
                            $filteredResults[] = $result;
                        }
                    } else {
                        // For all other reservations, show as normal
                        // Clean up helper fields
                        unset($result['reschedule_start_date']);
                        unset($result['reschedule_end_date']);
                        unset($result['vehicle_type']);
                        unset($result['has_active_reschedule']);
                        unset($result['reservation_change_vehicle_id']);
                        
                        // Set availability based on status
                        $result['is_available'] = ($statusId !== 6);
                        
                        // Set reservation status text
                        switch ($statusId) {
                            case 1:
                                $result['reservation_status'] = 'Pending';
                                break;
                            case 6:
                                $result['reservation_status'] = 'Reserved';
                                break;
                            case 8:
                                $result['reservation_status'] = 'Pending Department Approval';
                                break;
                            case 10:
                            case 14:
                                $result['reservation_status'] = 'Rescheduled';
                                break;
                            default:
                                $result['reservation_status'] = 'Available';
                        }
                        
                        $filteredResults[] = $result;
                    }
                }
                
                $results = $filteredResults;
            } elseif ($itemType === 'equipment') {
                // Query to get all equipment with their reservation details
                $sql = "
                    SELECT
                        e.equip_id,
                        e.equip_name,
                        e.equip_type,
                        tec.equipments_category_name AS category_name,
                        CASE
                            WHEN e.equip_type = 'Bulk' THEN COALESCE(eq.quantity, 0)
                            ELSE COALESCE(eu.unit_count, 0)
                        END AS current_quantity,
                        COALESCE(re.reservation_equipment_quantity, 0) AS reserved_quantity,
                        r.reservation_user_id,
                        ul.user_level_name AS user_level_name,
                        d.departments_name AS department_name,
                        r.reservation_start_date,
                        r.reservation_end_date,
                        r.reschedule_start_date,
                        r.reschedule_end_date,
                        latest_status.reservation_status_status_id,
                        latest_status.reservation_active,
                        CASE WHEN active_resched.max_reschedule_status_id IS NULL THEN 0 ELSE 1 END AS has_active_reschedule,
                        r.reservation_id,
                        e.equip_created_at,
                        e.equipments_category_id
                    FROM tbl_equipments e
                    LEFT JOIN tbl_equipment_category tec ON e.equipments_category_id = tec.equipments_category_id
                    LEFT JOIN (
                        SELECT
                            equip_id,
                            quantity
                            FROM tbl_equipment_quantity
                            WHERE (equip_id, last_updated) IN (
                                SELECT equip_id, MAX(last_updated)
                                FROM tbl_equipment_quantity
                                GROUP BY equip_id
                            )
                    ) AS eq ON e.equip_id = eq.equip_id AND e.equip_type = 'Bulk'
                    LEFT JOIN (
                        SELECT
                            equip_id,
                            COUNT(*) AS unit_count
                        FROM tbl_equipment_unit
                        WHERE is_active = 1
                        GROUP BY equip_id
                    ) AS eu ON e.equip_id = eu.equip_id AND e.equip_type != 'Bulk'
                    LEFT JOIN tbl_reservation_equipment re ON e.equip_id = re.reservation_equipment_equip_id
                    LEFT JOIN tbl_reservation r ON re.reservation_reservation_id = r.reservation_id
                    LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                    LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    WHERE e.equip_id IN ($placeholders)
                      AND (r.reservation_id IS NULL OR r.reservation_id NOT IN (
                          SELECT DISTINCT reservation_reservation_id 
                          FROM tbl_reservation_status 
                          WHERE reservation_status_status_id IN (2, 5, 4)
                      ))
                ";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute($itemIds);
                $rawResults = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Group results by equip_id to show only one entry per equipment
                $equipmentMap = [];
                
                foreach ($rawResults as $row) {
                    $equipId = $row['equip_id'];
                    
                    // Initialize equipment entry if not exists
                    if (!isset($equipmentMap[$equipId])) {
                        $equipmentMap[$equipId] = [
                            'equip_id' => $row['equip_id'],
                            'equip_name' => $row['equip_name'],
                            'equip_type' => $row['equip_type'],
                            'category_name' => $row['category_name'],
                            'current_quantity' => (int)$row['current_quantity'],
                            'equip_created_at' => $row['equip_created_at'],
                            'equipments_category_id' => $row['equipments_category_id'],
                            'inputted_quantity' => isset($inputQuantities[$equipId]) ? (int)$inputQuantities[$equipId] : 0,
                            'total_reserved' => 0,
                            'reservations' => []
                        ];
                    }
                    
                    // Add reservation data if exists
                    if ($row['reservation_id']) {
                        $statusId = (int)$row['reservation_status_status_id'];
                        $reservationActive = (int)$row['reservation_active'];
                        $reservedQty = (int)$row['reserved_quantity'];
                        
                        // Set reservation status text
                        $reservationStatus = 'Available';
                        switch ($statusId) {
                            case 1:
                                $reservationStatus = 'Pending';
                                break;
                            case 6:
                                $reservationStatus = 'Reserved';
                                break;
                            case 8:
                                $reservationStatus = 'Pending Department Approval';
                                break;
                            case 10:
                            case 11:
                            case 14:
                                $reservationStatus = 'Rescheduled';
                                break;
                        }
                        
                        // Add to total reserved quantity
                        $equipmentMap[$equipId]['total_reserved'] += $reservedQty;
                        
                        // Store reservation details with both original and reschedule dates
                        $reservationData = [
                            'reservation_id' => $row['reservation_id'],
                            'reserved_quantity' => $reservedQty,
                            'reservation_user_id' => $row['reservation_user_id'],
                            'user_level_name' => $row['user_level_name'],
                            'department_name' => $row['department_name'],
                            'reservation_start_date' => $row['reservation_start_date'],
                            'reservation_end_date' => $row['reservation_end_date'],
                            'reschedule_start_date' => $row['reschedule_start_date'],
                            'reschedule_end_date' => $row['reschedule_end_date'],
                            'reservation_status_status_id' => $statusId,
                            'reservation_active' => $reservationActive,
                            'reservation_status' => $reservationStatus
                        ];
                        
                        $equipmentMap[$equipId]['reservations'][] = $reservationData;
                    }
                }
                
                // Convert to final results array
                $results = [];
                foreach ($equipmentMap as $equipment) {
                    $totalAvailable = $equipment['current_quantity'] - $equipment['total_reserved'];
                    
                    $results[] = [
                        'equip_id' => $equipment['equip_id'],
                        'equip_name' => $equipment['equip_name'],
                        'equip_type' => $equipment['equip_type'],
                        'category_name' => $equipment['category_name'],
                        'current_quantity' => $equipment['current_quantity'],
                        'total_reserved' => $equipment['total_reserved'],
                        'total_available' => $totalAvailable,
                        'equip_created_at' => $equipment['equip_created_at'],
                        'equipments_category_id' => $equipment['equipments_category_id'],
                        'inputted_quantity' => $equipment['inputted_quantity'],
                        'is_available' => $totalAvailable > 0,
                        'availability_status' => $totalAvailable > 0 ? 'Available' : 'Unavailable',
                        'reservations' => $equipment['reservations']
                    ];
                }
            }
    
            return json_encode([
                'status' => 'success',
                'data' => $results
            ]);
        } catch (PDOException $e) {
            error_log("Database error in fetchAvailability: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        } catch (Exception $e) {
            error_log("General error in fetchAvailability: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'An unexpected error occurred: ' . $e->getMessage()
            ]);
        }
    } 
  public function fetchAvailableDrivers() {
        try {
            $sql = "
                SELECT 
                    u.users_id,
                    u.users_fname,
                    u.users_mname,
                    u.users_lname,
                    u.users_suffix,
                    u.title_id,
                    r.reservation_id,
                    r.reservation_title,
                    r.reservation_user_id,
                    r.reservation_start_date,
                    r.reservation_end_date,
                    r.reschedule_start_date,
                    r.reschedule_end_date,
                    latest_status.reservation_status_status_id,
                    latest_status.reservation_active,
                    ru.users_fname AS requester_fname,
                    ru.users_mname AS requester_mname,
                    ru.users_lname AS requester_lname,
                    ul.user_level_name AS user_level_name,
                    d.departments_name AS department_name,
                    CASE WHEN active_resched.max_reschedule_status_id IS NULL THEN 0 ELSE 1 END AS has_active_reschedule,
                    CASE 
                        WHEN latest_status.reservation_status_status_id = 6 AND latest_status.reservation_active = 1 THEN 'Reserved'
                        WHEN latest_status.reservation_status_status_id IN (10, 11, 14) AND latest_status.reservation_active = 1 THEN 'Rescheduled'
                        WHEN latest_status.reservation_status_status_id = 11 AND latest_status.reservation_active = 0 THEN 'Pending Reschedule'
                        ELSE 'Available'
                    END AS availability_status,
                    CASE 
                        WHEN latest_status.reservation_status_status_id IN (1,3,6,7,9, 10, 11, 14) AND latest_status.reservation_active = 1 THEN 0
                        WHEN latest_status.reservation_status_status_id = 11 AND latest_status.reservation_active = 0 THEN 0
                        ELSE 1
                    END AS is_available
                FROM 
                    tbl_users u
                LEFT JOIN tbl_reservation_driver rd ON u.users_id = rd.reservation_driver_user_id
                LEFT JOIN tbl_reservation_vehicle rv ON rd.reservation_vehicle_id = rv.reservation_vehicle_id
                LEFT JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                LEFT JOIN tbl_users ru ON r.reservation_user_id = ru.users_id
                LEFT JOIN tbl_user_level ul ON ru.users_user_level_id = ul.user_level_id
                LEFT JOIN tbl_departments d ON ru.users_department_id = d.departments_id
                LEFT JOIN (
                    SELECT rs1.*
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                         AND rs1.reservation_updated_at = mu.max_updated_at
                    INNER JOIN (
                        SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                        FROM tbl_reservation_status x
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                           AND y.max_updated_at = x.reservation_updated_at
                        GROUP BY x.reservation_reservation_id
                    ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                         AND rs1.reservation_status_id = mid.max_id
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                LEFT JOIN (
                    SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                    FROM tbl_reservation_status
                    WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                    GROUP BY reservation_reservation_id
                ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                WHERE 
                    u.users_user_level_id = 19
                    AND u.is_active = 1
                    AND (r.reservation_id IS NULL OR r.reservation_id NOT IN (
                        SELECT DISTINCT reservation_reservation_id 
                        FROM tbl_reservation_status 
                        WHERE reservation_status_status_id IN (2, 5, 4)
                    ))
                ORDER BY 
                    u.users_lname, u.users_fname, r.reservation_start_date DESC
            ";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Group drivers by user_id to handle multiple reservations
            $drivers = [];
            foreach ($results as $row) {
                $userId = $row['users_id'];
                
                if (!isset($drivers[$userId])) {
                    // Initialize driver data
                    $drivers[$userId] = [
                        'users_id' => $row['users_id'],
                        'users_fname' => $row['users_fname'],
                        'users_mname' => $row['users_mname'],
                        'users_lname' => $row['users_lname'],
                        'users_suffix' => $row['users_suffix'],
                        'title_id' => $row['title_id'],
                        'availability_status' => $row['availability_status'],
                        'is_available' => $row['is_available'],
                        'reservations' => []
                    ];
                }

                // Add reservation data if exists and matches criteria - include all reschedule statuses regardless of active status
                if ($row['reservation_id'] && $row['reservation_status_status_id']) {

                    // Set reservation status text like fetchAvailability
                    $reservationStatus = '';
                    switch ($row['reservation_status_status_id']) {
                        case 1:
                            $reservationStatus = 'Pending';
                            break;
                        case 6:
                            $reservationStatus = 'Reserved';
                            break;
                        case 8:
                            $reservationStatus = 'Pending Department Approval';
                            break;
                        case 10:
                            $reservationStatus = 'Pending Reschedule';
                            break;
                        case 11:
                            $reservationStatus = $row['reservation_active'] == 1 ? 'Rescheduled' : 'Pending Reschedule';
                            break;
                        case 14:
                            $reservationStatus = 'Rescheduled';
                            break;
                        default:
                            $reservationStatus = 'Available';
                    }
                    
                    $drivers[$userId]['reservations'][] = [
                        'reservation_id' => $row['reservation_id'],
                        'reservation_title' => $row['reservation_title'],
                        'reservation_user_id' => $row['reservation_user_id'],
                        'reservation_start_date' => $row['reservation_start_date'],
                        'reservation_end_date' => $row['reservation_end_date'],
                        'reschedule_start_date' => $row['reschedule_start_date'],
                        'reschedule_end_date' => $row['reschedule_end_date'],
                        'reservation_status_status_id' => $row['reservation_status_status_id'],
                        'reservation_active' => $row['reservation_active'],
                        'reservation_status' => $reservationStatus,
                        'user_level_name' => $row['user_level_name'],
                        'department_name' => $row['department_name'],
                        'requester_name' => trim($row['requester_fname'] . ' ' . $row['requester_mname'] . ' ' . $row['requester_lname']),
                        'is_available' => false
                    ];
                }
            }

            return json_encode(['status' => 'success', 'data' => array_values($drivers)]);

        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function doubleCheckAvailability($startDateTime, $endDateTime, $reservationId = null) {
        try {
            // Initialize the result array with empty arrays for each resource type
            $result = [
                'reservation_users' => [],
                'unavailable_vehicles' => [],
                'unavailable_venues' => [],
                'unavailable_equipment' => [],
                'unavailable_drivers' => []
            ];
    
            // Build the exclusion clause for the reservation ID
            $excludeReservationClause = '';
            $excludeParams = [];
            if ($reservationId !== null) {
                $excludeReservationClause = 'AND r.reservation_id != :excludeReservationId';
                $excludeParams[':excludeReservationId'] = $reservationId;
            }
    
            // --- Query for Reserved Users (reservation_users) with latest-status and reschedule logic ---
            $userQuery = "
                SELECT DISTINCT
                    r.reservation_user_id,
                    r.reservation_id,
                    r.reservation_title,
                    r.reservation_description,
                    r.reservation_start_date,
                    r.reservation_end_date,
                    CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS full_name,
                    ul.user_level_name,
                    d.departments_name
                FROM tbl_reservation r
                INNER JOIN tbl_users u ON r.reservation_user_id = u.users_id
                LEFT JOIN (
                    SELECT rs1.*
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                         AND rs1.reservation_updated_at = mu.max_updated_at
                    INNER JOIN (
                        SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                        FROM tbl_reservation_status x
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                           AND y.max_updated_at = x.reservation_updated_at
                        GROUP BY x.reservation_reservation_id
                    ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                         AND rs1.reservation_status_id = mid.max_id
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                LEFT JOIN (
                    SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                    FROM tbl_reservation_status
                    WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                    GROUP BY reservation_reservation_id
                ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                WHERE r.reservation_id NOT IN (
                    SELECT DISTINCT reservation_reservation_id 
                    FROM tbl_reservation_status 
                    WHERE reservation_status_status_id IN (2, 5, 4)
                )
                AND NOT (
                    latest_status.reservation_status_status_id = 11 
                    AND latest_status.reservation_active = 0
                )
                AND (
                    latest_status.reservation_status_status_id IN (1, 3, 6, 7, 9, 10, 11, 14)
                    AND latest_status.reservation_active IN (0, 1)
                )
                AND (
                    (CASE
                        WHEN (
                                latest_status.reservation_status_status_id IN (10, 11, 14)
                                OR (
                                    latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                    AND active_resched.max_reschedule_status_id IS NOT NULL
                                )
                             )
                             AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                        THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= :endDateTime
                    AND
                    (CASE
                        WHEN (
                                latest_status.reservation_status_status_id IN (10, 11, 14)
                                OR (
                                    latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                    AND active_resched.max_reschedule_status_id IS NOT NULL
                                )
                             )
                             AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                        THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= :startDateTime
                )
                {$excludeReservationClause}
            ";
            $stmt = $this->conn->prepare($userQuery);
            $params = array_merge([
                ':startDateTime' => $startDateTime,
                ':endDateTime' => $endDateTime
            ], $excludeParams);
            $stmt->execute($params);
            $result['reservation_users'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            // --- Unavailable Vehicles: pick effective vehicle when rescheduled, apply latest-status and reschedule dates ---
            $vehicleQuery = "
                SELECT DISTINCT
                    rv.reservation_vehicle_id,
                    CASE 
                        WHEN (
                            latest_status.reservation_status_status_id IN (10, 11, 14)
                            OR (
                                latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                AND active_resched.max_reschedule_status_id IS NOT NULL
                            )
                        ) AND rv.reservation_change_vehicle_id IS NOT NULL
                        THEN rv.reservation_change_vehicle_id
                        ELSE v.vehicle_id
                    END AS vehicle_id,
                    CASE 
                        WHEN (
                            latest_status.reservation_status_status_id IN (10, 11, 14)
                            OR (
                                latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                AND active_resched.max_reschedule_status_id IS NOT NULL
                            )
                        ) AND rv.reservation_change_vehicle_id IS NOT NULL
                        THEN cv.vehicle_license
                        ELSE v.vehicle_license
                    END AS vehicle_license,
                    CASE 
                        WHEN (
                            latest_status.reservation_status_status_id IN (10, 11, 14)
                            OR (
                                latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                AND active_resched.max_reschedule_status_id IS NOT NULL
                            )
                        ) AND rv.reservation_change_vehicle_id IS NOT NULL
                        THEN cvmk.vehicle_make_name
                        ELSE vm.vehicle_make_name
                    END AS vehicle_make_name,
                    CASE 
                        WHEN (
                            latest_status.reservation_status_status_id IN (10, 11, 14)
                            OR (
                                latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                AND active_resched.max_reschedule_status_id IS NOT NULL
                            )
                        ) AND rv.reservation_change_vehicle_id IS NOT NULL
                        THEN cvmd.vehicle_model_name
                        ELSE vmd.vehicle_model_name
                    END AS vehicle_model_name,
                    r.reservation_id,
                    r.reservation_title,
                    CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS reserved_by,
                    CASE 
                        WHEN latest_status.reservation_status_status_id IN (10, 11, 14) AND latest_status.reservation_active IN (0, 1)
                        THEN 1
                        ELSE 0
                    END AS is_reschedule,
                    rd.reservation_driver_user_id AS driver_id,
                    CASE 
                        WHEN rd.driver_name IS NOT NULL AND rd.driver_name != '' 
                        THEN rd.driver_name
                        WHEN driver_user.users_id IS NOT NULL 
                        THEN CONCAT(driver_user.users_fname, ' ', driver_user.users_mname, ' ', driver_user.users_lname)
                        ELSE NULL
                    END AS driver_name
                FROM tbl_reservation r
                INNER JOIN tbl_reservation_vehicle rv ON r.reservation_id = rv.reservation_reservation_id
                INNER JOIN tbl_vehicle v ON rv.reservation_vehicle_vehicle_id = v.vehicle_id
                INNER JOIN tbl_vehicle_model vmd ON v.vehicle_model_id = vmd.vehicle_model_id
                INNER JOIN tbl_vehicle_make vm ON vmd.vehicle_model_vehicle_make_id = vm.vehicle_make_id
                INNER JOIN tbl_users u ON r.reservation_user_id = u.users_id
                LEFT JOIN tbl_vehicle cv ON rv.reservation_change_vehicle_id = cv.vehicle_id
                LEFT JOIN tbl_vehicle_model cvmd ON cv.vehicle_model_id = cvmd.vehicle_model_id
                LEFT JOIN tbl_vehicle_make cvmk ON cvmd.vehicle_model_vehicle_make_id = cvmk.vehicle_make_id
                LEFT JOIN tbl_reservation_driver rd ON rv.reservation_vehicle_id = rd.reservation_vehicle_id
                LEFT JOIN tbl_users driver_user ON rd.reservation_driver_user_id = driver_user.users_id
                LEFT JOIN (
                    SELECT rs1.*
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                         AND rs1.reservation_updated_at = mu.max_updated_at
                    INNER JOIN (
                        SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                        FROM tbl_reservation_status x
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                           AND y.max_updated_at = x.reservation_updated_at
                        GROUP BY x.reservation_reservation_id
                    ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                         AND rs1.reservation_status_id = mid.max_id
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                LEFT JOIN (
                    SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                    FROM tbl_reservation_status
                    WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                    GROUP BY reservation_reservation_id
                ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                WHERE r.reservation_id NOT IN (
                    SELECT DISTINCT reservation_reservation_id 
                    FROM tbl_reservation_status 
                    WHERE reservation_status_status_id IN (2, 5, 4)
                )
                AND NOT (
                    latest_status.reservation_status_status_id = 6 
                    AND active_resched.max_reschedule_status_id IS NOT NULL
                )
                AND NOT (
                    latest_status.reservation_status_status_id = 11 
                    AND latest_status.reservation_active = 0
                )
                AND (
                    (CASE
                        WHEN (
                                latest_status.reservation_status_status_id IN (10, 11, 14)
                                OR (
                                    latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                    AND active_resched.max_reschedule_status_id IS NOT NULL
                                )
                             )
                             AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                        THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= :endDateTime
                    AND
                    (CASE
                        WHEN (
                                latest_status.reservation_status_status_id IN (10, 11, 14)
                                OR (
                                    latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                    AND active_resched.max_reschedule_status_id IS NOT NULL
                                )
                             )
                             AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                        THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= :startDateTime
                )
                {$excludeReservationClause}
            ";
            $stmt = $this->conn->prepare($vehicleQuery);
            $stmt->execute($params);
            $result['unavailable_vehicles'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            // --- Unavailable Venues: pick effective venue when rescheduled, apply latest-status and reschedule dates ---
            $venueQuery = "
                SELECT DISTINCT
                    rv.reservation_venue_id,
                    CASE 
                        WHEN (
                            latest_status.reservation_status_status_id IN (10, 11, 14)
                            OR (
                                latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                AND active_resched.max_reschedule_status_id IS NOT NULL
                            )
                        ) AND rv.reservation_change_venue_id IS NOT NULL
                        THEN rv.reservation_change_venue_id
                        ELSE v.ven_id
                    END AS ven_id,
                    CASE 
                        WHEN (
                            latest_status.reservation_status_status_id IN (10, 11, 14)
                            OR (
                                latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                AND active_resched.max_reschedule_status_id IS NOT NULL
                            )
                        ) AND rv.reservation_change_venue_id IS NOT NULL
                        THEN change_venue.ven_name
                        ELSE v.ven_name
                    END AS ven_name,
                    r.reservation_id,
                    r.reservation_title,
                    CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS reserved_by,
                    CASE 
                        WHEN latest_status.reservation_status_status_id IN (10, 11, 14) AND latest_status.reservation_active IN (0, 1)
                        THEN 1
                        ELSE 0
                    END AS is_reschedule
                FROM tbl_reservation r
                INNER JOIN tbl_reservation_venue rv ON r.reservation_id = rv.reservation_reservation_id
                INNER JOIN tbl_venue v ON rv.reservation_venue_venue_id = v.ven_id
                INNER JOIN tbl_users u ON r.reservation_user_id = u.users_id
                LEFT JOIN tbl_venue change_venue ON rv.reservation_change_venue_id = change_venue.ven_id
                LEFT JOIN (
                    SELECT rs1.*
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                         AND rs1.reservation_updated_at = mu.max_updated_at
                    INNER JOIN (
                        SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                        FROM tbl_reservation_status x
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                           AND y.max_updated_at = x.reservation_updated_at
                        GROUP BY x.reservation_reservation_id
                    ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                         AND rs1.reservation_status_id = mid.max_id
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                LEFT JOIN (
                    SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                    FROM tbl_reservation_status
                    WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                    GROUP BY reservation_reservation_id
                ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                WHERE r.reservation_id NOT IN (
                    SELECT DISTINCT reservation_reservation_id 
                    FROM tbl_reservation_status 
                    WHERE reservation_status_status_id IN (2, 5, 4)
                )
                AND NOT (
                    latest_status.reservation_status_status_id = 6 
                    AND active_resched.max_reschedule_status_id IS NOT NULL
                )
                AND NOT (
                    latest_status.reservation_status_status_id = 11 
                    AND latest_status.reservation_active = 0
                )
                AND (
                    (CASE
                        WHEN (
                                latest_status.reservation_status_status_id IN (10, 11, 14)
                                OR (
                                    latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                    AND active_resched.max_reschedule_status_id IS NOT NULL
                                )
                             )
                             AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                        THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= :endDateTime
                    AND
                    (CASE
                        WHEN (
                                latest_status.reservation_status_status_id IN (10, 11, 14)
                                OR (
                                    latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                    AND active_resched.max_reschedule_status_id IS NOT NULL
                                )
                             )
                             AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                        THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= :startDateTime
                )
                {$excludeReservationClause}
            ";
            $stmt = $this->conn->prepare($venueQuery);
            $stmt->execute($params);
            $result['unavailable_venues'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            // --- Unavailable Equipment: block when reserved qty >= total qty with latest-status & reschedule-aware overlap ---
            $equipmentQuery = "
                WITH EquipmentTotalQuantities AS (
                    SELECT
                        e.equip_id,
                        CASE
                            WHEN EXISTS (SELECT 1 FROM tbl_equipment_unit u WHERE u.equip_id = e.equip_id) THEN (
                                SELECT COUNT(*) FROM tbl_equipment_unit u_inner WHERE u_inner.equip_id = e.equip_id
                            )
                            ELSE (
                                SELECT eq.quantity FROM tbl_equipment_quantity eq WHERE eq.equip_id = e.equip_id LIMIT 1
                            )
                        END AS total_quantity
                    FROM tbl_equipments e
                )
                SELECT 
                    e.equip_id,
                    e.equip_name,
                    COALESCE(etq.total_quantity, 0) AS total_quantity,
                    COALESCE(SUM(re.reservation_equipment_quantity), 0) AS reserved_quantity,
                    GROUP_CONCAT(
                        DISTINCT CONCAT(r.reservation_id, ':', r.reservation_title, ':', 
                        CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname))
                        SEPARATOR '|'
                    ) AS reservations_info,
                    MAX(CASE 
                        WHEN latest_status.reservation_status_status_id IN (10, 11, 14) AND latest_status.reservation_active IN (0, 1)
                        THEN 1
                        ELSE 0
                    END) AS is_reschedule
                FROM tbl_equipments e
                INNER JOIN EquipmentTotalQuantities etq ON e.equip_id = etq.equip_id
                LEFT JOIN tbl_reservation_equipment re ON e.equip_id = re.reservation_equipment_equip_id
                LEFT JOIN tbl_reservation r ON r.reservation_id = re.reservation_reservation_id
                LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                LEFT JOIN (
                    SELECT rs1.*
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                         AND rs1.reservation_updated_at = mu.max_updated_at
                    INNER JOIN (
                        SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                        FROM tbl_reservation_status x
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                           AND y.max_updated_at = x.reservation_updated_at
                        GROUP BY x.reservation_reservation_id
                    ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                         AND rs1.reservation_status_id = mid.max_id
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                LEFT JOIN (
                    SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                    FROM tbl_reservation_status
                    WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                    GROUP BY reservation_reservation_id
                ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                WHERE (r.reservation_id IS NULL OR r.reservation_id NOT IN (
                    SELECT DISTINCT reservation_reservation_id 
                    FROM tbl_reservation_status 
                    WHERE reservation_status_status_id IN (2, 5, 4)
                ))
                AND (r.reservation_id IS NULL OR (
                    latest_status.reservation_active IN (0, 1)
                ))
                AND (r.reservation_id IS NULL OR NOT (
                    latest_status.reservation_status_status_id = 11 
                    AND latest_status.reservation_active = 0
                ))
                AND (r.reservation_id IS NULL OR (
                    (CASE
                        WHEN (
                                latest_status.reservation_status_status_id IN (10, 11, 14)
                                OR (
                                    latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                    AND active_resched.max_reschedule_status_id IS NOT NULL
                                )
                             )
                             AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                        THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= :endDateTime
                    AND
                    (CASE
                        WHEN (
                                latest_status.reservation_status_status_id IN (10, 11, 14)
                                OR (
                                    latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                    AND active_resched.max_reschedule_status_id IS NOT NULL
                                )
                             )
                             AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                        THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= :startDateTime
                ))
                " . ($reservationId !== null ? "AND (r.reservation_id IS NULL OR r.reservation_id != :excludeReservationId)" : "") . "
                GROUP BY e.equip_id, e.equip_name, etq.total_quantity
                HAVING COALESCE(SUM(re.reservation_equipment_quantity), 0) > 0
            ";
            $stmt = $this->conn->prepare($equipmentQuery);
            $stmt->execute($params);
            $result['unavailable_equipment'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            // --- Unavailable Drivers: use latest-status and reschedule-aware overlap to find reserved drivers ---
            $sqlReservedDrivers = "
                SELECT DISTINCT rd.reservation_driver_user_id
                FROM tbl_reservation_driver rd
                INNER JOIN tbl_reservation_vehicle rv ON rd.reservation_vehicle_id = rv.reservation_vehicle_id
                INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                LEFT JOIN (
                    SELECT rs1.*
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                         AND rs1.reservation_updated_at = mu.max_updated_at
                    INNER JOIN (
                        SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                        FROM tbl_reservation_status x
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                           AND y.max_updated_at = x.reservation_updated_at
                        GROUP BY x.reservation_reservation_id
                    ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                         AND rs1.reservation_status_id = mid.max_id
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                LEFT JOIN (
                    SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                    FROM tbl_reservation_status
                    WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                    GROUP BY reservation_reservation_id
                ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                WHERE r.reservation_id NOT IN (
                    SELECT DISTINCT reservation_reservation_id 
                    FROM tbl_reservation_status 
                    WHERE reservation_status_status_id IN (1, 2, 4, 5)
                )
                AND (
                    latest_status.reservation_status_status_id IN (6, 8, 9, 10, 11, 14)
                    AND latest_status.reservation_active IN (0, 1)
                )
                AND (
                    (CASE
                        WHEN (
                                latest_status.reservation_status_status_id IN (10, 11, 14)
                                OR (
                                    latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                    AND active_resched.max_reschedule_status_id IS NOT NULL
                                )
                             )
                             AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                        THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= :endDateTime
                    AND
                    (CASE
                        WHEN (
                                latest_status.reservation_status_status_id IN (10, 11, 14)
                                OR (
                                    latest_status.reservation_status_status_id IN (6, 8) AND latest_status.reservation_active = 1
                                    AND active_resched.max_reschedule_status_id IS NOT NULL
                                )
                             )
                             AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                        THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= :startDateTime
                )
                {$excludeReservationClause}
            ";
            $stmt = $this->conn->prepare($sqlReservedDrivers);
            $stmt->execute($params);
            $reservedDriverIds = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    
            if (!empty($reservedDriverIds)) {
                $placeholders = implode(',', array_fill(0, count($reservedDriverIds), '?'));
                $driverDetailsSql = "
                    SELECT u.users_id, CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS full_name
                    FROM tbl_users u
                    WHERE u.users_id IN ($placeholders)
                ";
                $stmt = $this->conn->prepare($driverDetailsSql);
                $stmt->execute($reservedDriverIds);
                $result['unavailable_drivers'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $result['unavailable_drivers'] = [];
            }
    
            // Return the results as a JSON success response
            return json_encode(['status' => 'success', 'data' => $result]);
        } catch (PDOException $e) {
            // Catch any PDO exceptions (database errors) and return an error JSON response
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function fetchEquipments($startDateTime = null, $endDateTime = null) {
        header('Content-Type: application/json');
    
        try {
            $mainQuery = "
                SELECT
                    e.equip_id,
                    e.equip_name,
                    e.equip_type,
                    e.equip_created_at,
                    tec.equipments_category_name AS category_name,
                    e.equipments_category_id,
                    CASE
                        WHEN e.equip_type = 'Bulk' THEN COALESCE(eq.quantity, 0)
                        ELSE COALESCE(eu.unit_count, 0)
                    END AS total_on_hand,
                    COALESCE(r.reserved_qty, 0) AS total_reserved,
                    (
                        CASE
                            WHEN e.equip_type = 'Bulk' THEN COALESCE(eq.quantity, 0)
                            ELSE COALESCE(eu.unit_count, 0)
                        END
                        - COALESCE(r.reserved_qty, 0)
                    ) AS total_available
                FROM tbl_equipments e
                LEFT JOIN tbl_equipment_category tec
                    ON e.equipments_category_id = tec.equipments_category_id
                LEFT JOIN (
                    SELECT
                        equip_id,
                        quantity
                    FROM tbl_equipment_quantity
                    WHERE (equip_id, last_updated) IN (
                        SELECT equip_id, MAX(last_updated)
                        FROM tbl_equipment_quantity
                        GROUP BY equip_id
                    )
                ) AS eq ON e.equip_id = eq.equip_id AND e.equip_type = 'Bulk'
                LEFT JOIN (
                    SELECT
                        equip_id,
                        COUNT(*) AS unit_count
                    FROM tbl_equipment_unit
                    WHERE is_active = 1 AND status_availability_id != 2
                    GROUP BY equip_id
                ) AS eu ON e.equip_id = eu.equip_id AND e.equip_type != 'Bulk'
                LEFT JOIN (
                    SELECT
                        re.reservation_equipment_equip_id AS equip_id,
                        SUM(re.reservation_equipment_quantity) AS reserved_qty
                    FROM tbl_reservation_equipment re
                    JOIN tbl_reservation r
                        ON r.reservation_id = re.reservation_reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) ls ON ls.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 14) AND reservation_active = 1
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    WHERE (
                        ls.reservation_status_status_id IN (1, 6, 7, 8, 10, 14)
                        AND (
                            (ls.reservation_status_status_id = 6 AND ls.reservation_active = 1)
                            OR (ls.reservation_status_status_id IN (1, 7, 8, 10, 14) AND (ls.reservation_active = 0 OR ls.reservation_active = 1))
                        )
                    )
                    AND r.reservation_id NOT IN (
                        SELECT DISTINCT reservation_reservation_id 
                        FROM tbl_reservation_status 
                        WHERE reservation_status_status_id IN (2, 5, 4)
                    )
                    AND (
                        (CASE
                            WHEN (
                                    (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active = 1)
                                    OR (
                                        ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                        AND active_resched.max_reschedule_status_id IS NOT NULL
                                    )
                                 )
                                 AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                            THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= :end
                        AND (CASE
                            WHEN (
                                    (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active = 1)
                                    OR (
                                        ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                        AND active_resched.max_reschedule_status_id IS NOT NULL
                                    )
                                 )
                                 AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                            THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= :start
                    )
                    GROUP BY re.reservation_equipment_equip_id
                ) AS r ON e.equip_id = r.equip_id
                WHERE e.is_active = 1
                ORDER BY e.equip_name";
    
            $mainStmt = $this->conn->prepare($mainQuery);
    
            // Always bind these, even if null (SQL will handle them accordingly)
            $mainStmt->bindParam(':start', $startDateTime);
            $mainStmt->bindParam(':end', $endDateTime);
    
            $mainStmt->execute();
            $equipments = $mainStmt->fetchAll(PDO::FETCH_ASSOC);
    
            $finalResults = [];
            foreach ($equipments as $equip) {
                $totalOnHand = (int)$equip['total_on_hand'];
                $reserved = (int)$equip['total_reserved'];
                $available = (int)$equip['total_available'];
    
                if ($available > 0 || $reserved > 0) {
                    $equip['current_quantity'] = $totalOnHand;
                    $equip['reserved_quantity'] = $reserved;
                    $equip['available_quantity'] = $available;
                    $equip['is_available'] = ($available > 0);
                    $equip['availability_status'] = $available > 0 ? 'Available' : 'Unavailable';
                    $finalResults[] = $equip;
                }
            }
    
            http_response_code(200);
            echo json_encode([
                'status'    => 'success',
                'data'      => $finalResults,
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_UNESCAPED_SLASHES);
    
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'status'    => 'error',
                'message'   => 'Database error: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status'    => 'error',
                'message'   => 'General error: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
    }

    public function fetchRequestById($reservationId) {
        try {
            // First, get all status history for this reservation
            $statusHistorySql = "
                SELECT 
                    rs.reservation_status_id,
                    rs.reservation_status_status_id AS status_id,
                    sm.status_master_name AS status_name,
                    rs.reservation_active,
                    rs.reservation_updated_at,
                    rs.reservation_users_id,
                    CONCAT_WS(' ', u.users_fname, u.users_mname, u.users_lname) AS updated_by_name
                FROM tbl_reservation_status rs
                JOIN tbl_status_master sm ON rs.reservation_status_status_id = sm.status_master_id
                LEFT JOIN tbl_users u ON rs.reservation_users_id = u.users_id
                WHERE rs.reservation_reservation_id = :reservation_id
                ORDER BY rs.reservation_status_id DESC, rs.reservation_updated_at DESC
            ";
            
            $statusStmt = $this->conn->prepare($statusHistorySql);
            $statusStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $statusStmt->execute();
            $statusHistory = $statusStmt->fetchAll(PDO::FETCH_ASSOC);

            $sql = "
                SELECT 
                    r.reservation_id, 
                    r.reservation_title, 
                    r.reservation_description, 
                    r.reservation_start_date, 
                    r.reservation_end_date, 
                    r.reschedule_start_date,
                    r.reschedule_end_date,
                    r.reservation_user_id,
                    r.reservation_created_at,
                    r.additional_note,
                    r.decline_reason,

                    latest_status.reservation_status_status_id AS status_id,
                    sm.status_master_name AS status_name,
                    latest_status.reservation_active AS active,

                    ul.user_level_name,
                    dep.departments_name,
                    TRIM(
                        CONCAT(
                            COALESCE(t_req.abbreviation, ''),
                            CASE WHEN COALESCE(t_req.abbreviation, '') <> '' THEN ' ' ELSE '' END,
                            COALESCE(u_req.users_fname, ''),
                            CASE WHEN COALESCE(u_req.users_mname, '') <> '' THEN CONCAT(' ', u_req.users_mname) ELSE '' END,
                            CASE WHEN COALESCE(u_req.users_lname, '') <> '' THEN CONCAT(' ', u_req.users_lname) ELSE '' END,
                            CASE WHEN COALESCE(u_req.users_suffix, '') <> '' THEN CONCAT(', ', u_req.users_suffix) ELSE '' END
                        )
                    ) AS requester_name,
                    u_req.users_suffix AS requester_suffix,
                    t_req.abbreviation AS requester_title_abbreviation,
                    dep.departments_name AS department_name,

                    -- Venue details (including per-venue participants and building name)
                    GROUP_CONCAT(DISTINCT
                        CONCAT_WS(0x1F,
                            COALESCE(v.reservation_venue_id, ''),
                            COALESCE(v.reservation_venue_venue_id, ''),
                            COALESCE(venue.ven_name, ''),
                            COALESCE(venue.ven_occupancy, ''),
                            COALESCE(venue.ven_pic, ''),
                            COALESCE(venue.event_type, ''),
                            COALESCE(venue.area_type, ''),
                            COALESCE(v.reservation_change_venue_id, ''),
                            COALESCE(change_venue.ven_name, ''),
                            COALESCE(change_venue.event_type, ''),
                            COALESCE(change_venue.area_type, ''),
                            COALESCE(v.reservation_participants, ''),
                            COALESCE(vb.venue_building_name, ''),
                            COALESCE(change_vb.venue_building_name, '')
                        )
                        SEPARATOR 0x1E
                    ) as venue_data,

                    -- Vehicle details with complete information (restriction removed)
                    GROUP_CONCAT(DISTINCT
                        CONCAT_WS(0x1F,
                            COALESCE(ve.reservation_vehicle_id, ''),
                            COALESCE(ve.reservation_vehicle_vehicle_id, ''),
                            COALESCE(vm.vehicle_license, ''),
                            COALESCE(vmm.vehicle_model_name, ''),
                            COALESCE(vm.year, ''),
                            COALESCE(vma.vehicle_make_name, ''),
                            COALESCE(vc.vehicle_category_name, ''),
                            COALESCE(vm.vehicle_pic, ''),
                            COALESCE(ve.reservation_change_vehicle_id, ''),
                            COALESCE(change_vm.vehicle_license, ''),
                            COALESCE(change_vmm.vehicle_model_name, ''),
                            COALESCE(change_vm.year, ''),
                            COALESCE(change_vma.vehicle_make_name, ''),
                            COALESCE(change_vc.vehicle_category_name, ''),
                            COALESCE(change_vm.vehicle_pic, '')
                        )
                        SEPARATOR 0x1E
                    ) as vehicle_data,

                    -- Equipment details
                    GROUP_CONCAT(DISTINCT 
                        CONCAT(
                            e.reservation_equipment_equip_id, ':',
                            equip.equip_name, ':',
                            e.reservation_equipment_quantity
                        ) SEPARATOR '|'
                    ) as equipment_data,

                    -- Passenger details
                    GROUP_CONCAT(DISTINCT 
                        CONCAT(
                            p.reservation_passenger_id, ':',
                            p.reservation_passenger_name
                        ) SEPARATOR '|'
                    ) as passenger_data

                FROM tbl_reservation r

                -- Latest status subquery
                LEFT JOIN (
                    SELECT rs1.*
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_status_id
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) rs2 ON rs1.reservation_reservation_id = rs2.reservation_reservation_id
                    AND rs1.reservation_status_id = rs2.max_status_id
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id

                LEFT JOIN tbl_status_master sm ON sm.status_master_id = latest_status.reservation_status_status_id
                LEFT JOIN tbl_users u_req ON r.reservation_user_id = u_req.users_id
                LEFT JOIN tbl_user_level ul ON u_req.users_user_level_id = ul.user_level_id
                LEFT JOIN tbl_departments dep ON u_req.users_department_id = dep.departments_id
                LEFT JOIN titles t_req ON u_req.title_id = t_req.id

                LEFT JOIN tbl_reservation_venue v ON r.reservation_id = v.reservation_reservation_id
                LEFT JOIN tbl_venue venue ON v.reservation_venue_venue_id = venue.ven_id
                LEFT JOIN tbl_venue_building vb ON venue.venue_building_id = vb.venue_building_id
                LEFT JOIN tbl_venue change_venue ON v.reservation_change_venue_id = change_venue.ven_id
                LEFT JOIN tbl_venue_building change_vb ON change_venue.venue_building_id = change_vb.venue_building_id

                LEFT JOIN tbl_reservation_vehicle ve ON r.reservation_id = ve.reservation_reservation_id
                -- Original vehicle joins with complete details
                LEFT JOIN tbl_vehicle vm ON ve.reservation_vehicle_vehicle_id = vm.vehicle_id
                LEFT JOIN tbl_vehicle_model vmm ON vm.vehicle_model_id = vmm.vehicle_model_id
                LEFT JOIN tbl_vehicle_make vma ON vmm.vehicle_model_vehicle_make_id = vma.vehicle_make_id
                LEFT JOIN tbl_vehicle_category vc ON vmm.vehicle_category_id = vc.vehicle_category_id
                -- Change vehicle joins with complete details
                LEFT JOIN tbl_vehicle change_vm ON ve.reservation_change_vehicle_id = change_vm.vehicle_id
                LEFT JOIN tbl_vehicle_model change_vmm ON change_vm.vehicle_model_id = change_vmm.vehicle_model_id
                LEFT JOIN tbl_vehicle_make change_vma ON change_vmm.vehicle_model_vehicle_make_id = change_vma.vehicle_make_id
                LEFT JOIN tbl_vehicle_category change_vc ON change_vmm.vehicle_category_id = change_vc.vehicle_category_id

                LEFT JOIN tbl_reservation_equipment e ON r.reservation_id = e.reservation_reservation_id
                LEFT JOIN tbl_equipments equip ON e.reservation_equipment_equip_id = equip.equip_id

                LEFT JOIN tbl_reservation_passenger p ON r.reservation_id = p.reservation_reservation_id

                WHERE r.reservation_id = :reservation_id
                GROUP BY r.reservation_id
            ";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmt->execute();

            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row) {
                $venues = [];
                $vehicles = [];
                $equipment = [];
                $drivers = [];
                $passengers = [];

                $response = [
                    'reservation_id' => $row['reservation_id'],
                    'reservation_created_at' => $row['reservation_created_at'],
                    'reservation_title' => $row['reservation_title'],
                    'reservation_description' => $row['reservation_description'],
                    'reservation_start_date' => $row['reservation_start_date'],
                    'reservation_end_date' => $row['reservation_end_date'],
                    'reschedule_start_date' => $row['reschedule_start_date'],
                    'reschedule_end_date' => $row['reschedule_end_date'],
                    // Note: reservation_participants removed - now per-venue in venues array
                    'additional_note' => $row['additional_note'],
                    'decline_reason' => $row['decline_reason'] ?? null,
                    'status_name' => $row['status_name'],  // Keep for backward compatibility
                    'status_id' => $row['status_id'],      // Keep for backward compatibility
                    'active' => $row['active'],            // Keep for backward compatibility
                    'reservation_user_id' => $row['reservation_user_id'],
                    'requester_name' => $row['requester_name'],
                    'department_name' => $row['department_name'],
                    'user_level_name' => $row['user_level_name'],
                    'requester_suffix' => $row['requester_suffix'] ?? null,
                    'requester_title_abbreviation' => $row['requester_title_abbreviation'] ?? '',
                    'status_history' => $statusHistory     // Add full status history
                ];

                // VENUES
                if (!empty($row['venue_data'])) {
                    foreach (explode(chr(30), $row['venue_data']) as $venueStr) {
                        if ($venueStr === '' || $venueStr === null) { continue; }
                        $venueParts = explode(chr(31), $venueStr);
                        // Ensure at least base fields exist and not all empty
                        if (count($venueParts) >= 7 && trim(implode('', $venueParts)) !== '') {
                            $venueItem = [
                                'reservation_venue_id' => $venueParts[0] ?? '',
                                'venue_id' => $venueParts[1] ?? '',
                                'venue_name' => $venueParts[2] ?? '',
                                'occupancy' => $venueParts[3] ?? '',
                                'picture' => $venueParts[4] ?? '',
                                'event_type' => $venueParts[5] ?? '',
                                'area_type' => $venueParts[6] ?? ''
                            ];
                            if (count($venueParts) >= 11) {
                                $venueItem['change_venue_id'] = $venueParts[7] ?? '';
                                $venueItem['change_venue_name'] = $venueParts[8] ?? '';
                                $venueItem['change_venue_event_type'] = $venueParts[9] ?? '';
                                $venueItem['change_venue_area_type'] = $venueParts[10] ?? '';
                            }
                            // Add per-venue participants (index 11)
                            if (count($venueParts) >= 12) {
                                $venueItem['participants'] = $venueParts[11] ?? '';
                            }
                            // Add venue building name (index 12)
                            if (count($venueParts) >= 13) {
                                $venueItem['venue_building_name'] = $venueParts[12] ?? '';
                            }
                            // Add change venue building name (index 13)
                            if (count($venueParts) >= 14) {
                                $venueItem['change_venue_building_name'] = $venueParts[13] ?? '';
                            }
                            $venues[] = $venueItem;
                        }
                    }
                }

                // VEHICLES - Updated to include all vehicle details (restriction removed)
                if (!empty($row['vehicle_data'])) {
                    foreach (explode(chr(30), $row['vehicle_data']) as $vehicleStr) {
                        if ($vehicleStr === '' || $vehicleStr === null) { continue; }
                        $vehicleParts = explode(chr(31), $vehicleStr);

                        // Skip entries where all parts are empty
                        if (trim(implode('', $vehicleParts)) === '') { continue; }

                        if (count($vehicleParts) >= 8) {
                            $vehicleItem = [
                                'reservation_vehicle_id' => $vehicleParts[0] ?? '',
                                'vehicle_id' => $vehicleParts[1] ?? '',
                                'license' => $vehicleParts[2] ?? '',
                                'model' => $vehicleParts[3] ?? '',
                                'year' => $vehicleParts[4] ?? '',
                                'make' => $vehicleParts[5] ?? '',
                                'category' => $vehicleParts[6] ?? '',
                                'picture' => $vehicleParts[7] ?? ''
                            ];
                            
                            // If change vehicle data is present (16 parts total after removal), include it as well
                            if (count($vehicleParts) >= 16) {
                                $vehicleItem['change_vehicle_id'] = $vehicleParts[8] ?? '';
                                $vehicleItem['change_vehicle_license'] = $vehicleParts[9] ?? '';
                                $vehicleItem['change_vehicle_model'] = $vehicleParts[10] ?? '';
                                $vehicleItem['change_vehicle_year'] = $vehicleParts[11] ?? '';
                                $vehicleItem['change_vehicle_make'] = $vehicleParts[12] ?? '';
                                $vehicleItem['change_vehicle_category'] = $vehicleParts[13] ?? '';
                                $vehicleItem['change_vehicle_picture'] = $vehicleParts[14] ?? '';
                            }

                            // Only push if at least one primary field has a value
                            if (
                                $vehicleItem['reservation_vehicle_id'] !== '' ||
                                $vehicleItem['vehicle_id'] !== '' ||
                                $vehicleItem['license'] !== '' ||
                                $vehicleItem['model'] !== ''
                            ) {
                                $vehicles[] = $vehicleItem;
                            }
                        }
                    }
                }

                // EQUIPMENT - Parse basic equipment data first
                if (!empty($row['equipment_data'])) {
                    foreach (explode('|', $row['equipment_data']) as $equipStr) {
                        $equipParts = explode(':', $equipStr);
                        if (count($equipParts) >= 3) {
                            $equipment[] = [
                                'equipment_id' => $equipParts[0],
                                'name' => $equipParts[1],
                                'quantity' => $equipParts[2],
                                'units' => [] // Will be populated below
                            ];
                        }
                    }
                }
                
                // Fetch units for equipment (similar to fetchAssignedRelease)
                if (!empty($equipment)) {
                    $equipmentIds = array_map(function($eq) {
                        return $eq['equipment_id'];
                    }, $equipment);
                    
                    // Get reservation_equipment_ids for this reservation
                    $resEquipSql = "
                        SELECT reservation_equipment_id, reservation_equipment_equip_id
                        FROM tbl_reservation_equipment
                        WHERE reservation_reservation_id = :reservation_id
                    ";
                    $resEquipStmt = $this->conn->prepare($resEquipSql);
                    $resEquipStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                    $resEquipStmt->execute();
                    $resEquipData = $resEquipStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    if (!empty($resEquipData)) {
                        $reservationEquipmentIds = array_map(function($re) {
                            return $re['reservation_equipment_id'];
                        }, $resEquipData);
                        
                        $placeholders = implode(',', array_fill(0, count($reservationEquipmentIds), '?'));
                        
                        // Fetch units with availability status
                        $sqlUnits = "
                            SELECT
                                ru.reservation_unit_id,
                                ru.reservation_equipment_id,
                                ru.unit_id,
                                ru.active AS unit_active,
                                eu.serial_number AS unit_serial_number,
                                tsa.status_availability_name AS unit_availability_status_name
                            FROM tbl_reservation_unit ru
                            LEFT JOIN tbl_equipment_unit eu
                                ON ru.unit_id = eu.unit_id
                            LEFT JOIN tbl_status_availability tsa
                                ON eu.status_availability_id = tsa.status_availability_id
                            WHERE ru.reservation_equipment_id IN ($placeholders)
                        ";
                        $stmtUnits = $this->conn->prepare($sqlUnits);
                        $stmtUnits->execute($reservationEquipmentIds);
                        $unitsData = $stmtUnits->fetchAll(PDO::FETCH_ASSOC);
                        
                        // Group units by reservation_equipment_id
                        $unitsByResEquip = [];
                        foreach ($unitsData as $u) {
                            $unitsByResEquip[$u['reservation_equipment_id']][] = [
                                'reservation_unit_id' => $u['reservation_unit_id'],
                                'unit_id' => $u['unit_id'],
                                'unit_serial_number' => $u['unit_serial_number'],
                                'availability_status' => $u['unit_availability_status_name'],
                                'active' => (int)$u['unit_active'],
                            ];
                        }
                        
                        // Map reservation_equipment_id to equipment_id
                        $equipIdToResEquipId = [];
                        foreach ($resEquipData as $re) {
                            $equipIdToResEquipId[$re['reservation_equipment_equip_id']] = $re['reservation_equipment_id'];
                        }
                        
                        // Inject units into equipment array
                        foreach ($equipment as &$eq) {
                            if (isset($equipIdToResEquipId[$eq['equipment_id']])) {
                                $resEquipId = $equipIdToResEquipId[$eq['equipment_id']];
                                $eq['units'] = $unitsByResEquip[$resEquipId] ?? [];
                            }
                        }
                        unset($eq);
                    }
                }

                // DRIVERS: fetch all drivers for this reservation and their details
                $drivers = [];
                $driverStmt = $this->conn->prepare(
                    "SELECT rd.reservation_driver_id, rd.reservation_driver_user_id, rd.reservation_vehicle_id, rv.reservation_vehicle_vehicle_id, rd.driver_name, rd.created_at, rd.updated_at, u.users_fname, u.users_mname, u.users_lname
                     FROM tbl_reservation_driver rd
                     JOIN tbl_reservation_vehicle rv ON rd.reservation_vehicle_id = rv.reservation_vehicle_id
                     LEFT JOIN tbl_users u ON rd.reservation_driver_user_id = u.users_id
                     WHERE rv.reservation_reservation_id = :reservation_id"
                );
                $driverStmt->execute([':reservation_id' => $row['reservation_id']]);
                while ($driverRow = $driverStmt->fetch(PDO::FETCH_ASSOC)) {
                    $drivers[] = [
                        'reservation_driver_id' => $driverRow['reservation_driver_id'],
                        'driver_id' => $driverRow['reservation_driver_user_id'],
                        'driver_name' => $driverRow['driver_name'] ?? trim($driverRow['users_fname'] . ' ' . $driverRow['users_mname'] . ' ' . $driverRow['users_lname']),
                        'reservation_vehicle_id' => $driverRow['reservation_vehicle_id'],
                        'reservation_vehicle_vehicle_id' => $driverRow['reservation_vehicle_vehicle_id'],
                        'created_at' => $driverRow['created_at'],
                        'updated_at' => $driverRow['updated_at']
                    ];
                }

                // PASSENGERS
                if (!empty($row['passenger_data'])) {
                    foreach (explode('|', $row['passenger_data']) as $passengerStr) {
                        $passengerParts = explode(':', $passengerStr);
                        if (count($passengerParts) >= 2) {
                            $passengers[] = [
                                'passenger_id' => $passengerParts[0],
                                'name' => $passengerParts[1]
                            ];
                        }
                    }
                }

                $response['venues'] = $venues;
                $response['vehicles'] = $vehicles;
                $response['equipment'] = $equipment;
                $response['drivers'] = $drivers;
                $response['passengers'] = $passengers;

                // Add reservation summary
                $summary = [
                    'total_venues' => count($venues),
                    'total_vehicles' => count($vehicles),
                    'total_equipment_types' => count($equipment),
                    'total_drivers' => count($drivers),
                    'total_passengers' => count($passengers),
                    'resource_types' => [],
                    'resource_details' => []
                ];

                // Build resource types array
                if (!empty($venues)) {
                    $summary['resource_types'][] = 'venues';
                    $venueNames = array_map(function($venue) {
                        return $venue['venue_name'];
                    }, $venues);
                    $summary['resource_details']['venues'] = [
                        'count' => count($venues),
                        'names' => $venueNames
                    ];
                }

                if (!empty($vehicles)) {
                    $summary['resource_types'][] = 'vehicles';
                    $vehicleNames = array_map(function($vehicle) {
                        return $vehicle['license'] . ' (' . $vehicle['model'] . ')';
                    }, $vehicles);
                    $summary['resource_details']['vehicles'] = [
                        'count' => count($vehicles),
                        'names' => $vehicleNames
                    ];
                }

                if (!empty($equipment)) {
                    $summary['resource_types'][] = 'equipment';
                    $equipmentDetails = [];
                    $totalEquipmentQuantity = 0;
                    foreach ($equipment as $equip) {
                        $equipmentDetails[] = $equip['name'] . ' (Qty: ' . $equip['quantity'] . ')';
                        $totalEquipmentQuantity += (int)$equip['quantity'];
                    }
                    $summary['resource_details']['equipment'] = [
                        'count' => count($equipment),
                        'total_quantity' => $totalEquipmentQuantity,
                        'details' => $equipmentDetails
                    ];
                }

                // Create human-readable summary text
                $summaryParts = [];
                if (!empty($venues)) {
                    $summaryParts[] = count($venues) . ' venue' . (count($venues) > 1 ? 's' : '');
                }
                if (!empty($vehicles)) {
                    $summaryParts[] = count($vehicles) . ' vehicle' . (count($vehicles) > 1 ? 's' : '');
                }
                if (!empty($equipment)) {
                    $summaryParts[] = count($equipment) . ' equipment type' . (count($equipment) > 1 ? 's' : '');
                }
                if (!empty($drivers)) {
                    $summaryParts[] = count($drivers) . ' driver' . (count($drivers) > 1 ? 's' : '');
                }
                if (!empty($passengers)) {
                    $summaryParts[] = count($passengers) . ' passenger' . (count($passengers) > 1 ? 's' : '');
                }

                $summary['summary_text'] = !empty($summaryParts) ? 
                    'Reservation includes: ' . implode(', ', $summaryParts) : 
                    'No resources assigned';

                $response['summary'] = $summary;

                // Add maintenance conditions for all resources
                $maintenanceConditions = [];

                // 1) Equipment (Bulk) maintenance conditions
                $equipmentConditionSql = "
                    SELECT 
                        rce.id AS record_id,
                        'equipment_bulk' AS resource_type,
                        e.equip_name AS resource_name,
                        rce.qty_bad AS quantity,
                        re.reservation_equipment_equip_id AS resource_id,
                        c.condition_name,
                        rce.remarks,
                        rce.created_at,
                        rce.user_personnel_id AS reported_by_id,
                        CONCAT(
                            COALESCE(pt.abbreviation, ''),
                            CASE WHEN pt.abbreviation IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_fname, ''),
                            CASE WHEN up.users_fname IS NOT NULL AND up.users_lname IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_lname, ''),
                            CASE WHEN up.users_lname IS NOT NULL AND up.users_suffix IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_suffix, '')
                        ) AS reported_by_name
                    FROM tbl_reservation_condition_equipment rce
                    JOIN tbl_reservation_equipment re ON rce.reservation_equipment_id = re.reservation_equipment_id
                    JOIN tbl_equipments e ON re.reservation_equipment_equip_id = e.equip_id
                    JOIN tbl_condition c ON rce.condition_id = c.id
                    LEFT JOIN tbl_users up ON rce.user_personnel_id = up.users_id
                    LEFT JOIN titles pt ON up.title_id = pt.id
                    WHERE re.reservation_reservation_id = :reservation_id
                ";
                $equipCondStmt = $this->conn->prepare($equipmentConditionSql);
                $equipCondStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $equipCondStmt->execute();
                $equipmentConditions = $equipCondStmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($equipmentConditions as $condition) {
                    $maintenanceConditions[] = $condition;
                }

                // 2) Venue maintenance conditions
                $venueConditionSql = "
                    SELECT 
                        rcv.id AS record_id,
                        'venue' AS resource_type,
                        v.ven_name AS resource_name,
                        NULL AS quantity,
                        CASE 
                            WHEN EXISTS (
                                SELECT 1 FROM tbl_reservation_status rs 
                                WHERE rs.reservation_reservation_id = :reservation_id
                                  AND rs.reservation_status_status_id IN (10, 14) 
                                  AND rs.reservation_active = 1
                            )
                             AND rv.reservation_change_venue_id IS NOT NULL
                             AND rv.reservation_change_venue_id > 0
                            THEN rv.reservation_change_venue_id
                            ELSE rv.reservation_venue_venue_id
                        END AS resource_id,
                        c.condition_name,
                        rcv.remarks,
                        rcv.created_at,
                        rcv.user_personnel_id AS reported_by_id,
                        CONCAT(
                            COALESCE(pt.abbreviation, ''),
                            CASE WHEN pt.abbreviation IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_fname, ''),
                            CASE WHEN up.users_fname IS NOT NULL AND up.users_lname IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_lname, ''),
                            CASE WHEN up.users_lname IS NOT NULL AND up.users_suffix IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_suffix, '')
                        ) AS reported_by_name
                    FROM tbl_reservation_condition_venue rcv
                    JOIN tbl_reservation_venue rv ON rcv.reservation_venue_id = rv.reservation_venue_id
                    JOIN tbl_venue v ON v.ven_id = CASE 
                            WHEN EXISTS (
                                SELECT 1 FROM tbl_reservation_status rs 
                                WHERE rs.reservation_reservation_id = :reservation_id
                                  AND rs.reservation_status_status_id IN (10, 14) 
                                  AND rs.reservation_active = 1
                            )
                             AND rv.reservation_change_venue_id IS NOT NULL
                             AND rv.reservation_change_venue_id > 0
                            THEN rv.reservation_change_venue_id
                            ELSE rv.reservation_venue_venue_id
                        END
                    JOIN tbl_condition c ON rcv.condition_id = c.id
                    LEFT JOIN tbl_users up ON rcv.user_personnel_id = up.users_id
                    LEFT JOIN titles pt ON up.title_id = pt.id
                    WHERE rv.reservation_reservation_id = :reservation_id
                ";
                $venueCondStmt = $this->conn->prepare($venueConditionSql);
                $venueCondStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $venueCondStmt->execute();
                $venueConditions = $venueCondStmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($venueConditions as $condition) {
                    $maintenanceConditions[] = $condition;
                }

                // 3) Vehicle maintenance conditions
                $vehicleConditionSql = "
                    SELECT 
                        rcv.id AS record_id,
                        'vehicle' AS resource_type,
                        vm.vehicle_model_name AS resource_name,
                        NULL AS quantity,
                        CASE 
                            WHEN EXISTS (
                                SELECT 1 FROM tbl_reservation_status rs 
                                WHERE rs.reservation_reservation_id = :reservation_id
                                  AND rs.reservation_status_status_id IN (6, 10, 14) 
                                  AND rs.reservation_active = 1
                            )
                             AND rv.reservation_change_vehicle_id IS NOT NULL
                             AND rv.reservation_change_vehicle_id > 0
                            THEN rv.reservation_change_vehicle_id
                            ELSE rv.reservation_vehicle_vehicle_id
                        END AS resource_id,
                        c.condition_name,
                        rcv.remarks,
                        rcv.created_at,
                        rcv.user_personnel_id AS reported_by_id,
                        CONCAT(
                            COALESCE(pt.abbreviation, ''),
                            CASE WHEN pt.abbreviation IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_fname, ''),
                            CASE WHEN up.users_fname IS NOT NULL AND up.users_lname IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_lname, ''),
                            CASE WHEN up.users_lname IS NOT NULL AND up.users_suffix IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_suffix, '')
                        ) AS reported_by_name
                    FROM tbl_reservation_condition_vehicle rcv
                    JOIN tbl_reservation_vehicle rv ON rcv.reservation_vehicle_id = rv.reservation_vehicle_id
                    JOIN tbl_vehicle vh ON vh.vehicle_id = CASE 
                            WHEN EXISTS (
                                SELECT 1 FROM tbl_reservation_status rs 
                                WHERE rs.reservation_reservation_id = :reservation_id
                                  AND rs.reservation_status_status_id IN (6, 10, 14) 
                                  AND rs.reservation_active = 1
                            )
                             AND rv.reservation_change_vehicle_id IS NOT NULL
                             AND rv.reservation_change_vehicle_id > 0
                            THEN rv.reservation_change_vehicle_id
                            ELSE rv.reservation_vehicle_vehicle_id
                        END
                    JOIN tbl_vehicle_model vm ON vh.vehicle_model_id = vm.vehicle_model_id
                    JOIN tbl_condition c ON rcv.condition_id = c.id
                    LEFT JOIN tbl_users up ON rcv.user_personnel_id = up.users_id
                    LEFT JOIN titles pt ON up.title_id = pt.id
                    WHERE rv.reservation_reservation_id = :reservation_id
                ";
                $vehicleCondStmt = $this->conn->prepare($vehicleConditionSql);
                $vehicleCondStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $vehicleCondStmt->execute();
                $vehicleConditions = $vehicleCondStmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($vehicleConditions as $condition) {
                    $maintenanceConditions[] = $condition;
                }

                // 4) Equipment units (Serialized) maintenance conditions
                $unitConditionSql = "
                    SELECT 
                        rcu.id AS record_id,
                        'equipment_unit' AS resource_type,
                        eu.serial_number AS resource_name,
                        NULL AS quantity,
                        eu.unit_id AS resource_id,
                        c.condition_name,
                        rcu.remarks,
                        rcu.created_at,
                        rcu.user_personnel_id AS reported_by_id,
                        CONCAT(
                            COALESCE(pt.abbreviation, ''),
                            CASE WHEN pt.abbreviation IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_fname, ''),
                            CASE WHEN up.users_fname IS NOT NULL AND up.users_lname IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_lname, ''),
                            CASE WHEN up.users_lname IS NOT NULL AND up.users_suffix IS NOT NULL THEN ' ' ELSE '' END,
                            COALESCE(up.users_suffix, '')
                        ) AS reported_by_name
                    FROM tbl_reservation_condition_unit rcu
                    JOIN tbl_reservation_unit ru ON rcu.reservation_unit_id = ru.reservation_unit_id
                    JOIN tbl_reservation_equipment re ON ru.reservation_equipment_id = re.reservation_equipment_id
                    JOIN tbl_equipment_unit eu ON ru.unit_id = eu.unit_id
                    JOIN tbl_condition c ON rcu.condition_id = c.id
                    LEFT JOIN tbl_users up ON rcu.user_personnel_id = up.users_id
                    LEFT JOIN titles pt ON up.title_id = pt.id
                    WHERE re.reservation_reservation_id = :reservation_id
                ";
                $unitCondStmt = $this->conn->prepare($unitConditionSql);
                $unitCondStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $unitCondStmt->execute();
                $unitConditions = $unitCondStmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($unitConditions as $condition) {
                    $maintenanceConditions[] = $condition;
                }

                // Sort maintenance conditions by created_at descending
                usort($maintenanceConditions, function($a, $b) {
                    return strcmp($b['created_at'], $a['created_at']);
                });

                $response['maintenance_conditions'] = $maintenanceConditions;

                // Add approval sequence information
                $approvalSequence = [];
                $approvalSequenceSql = "
                    SELECT 
                        ao.approval_order_id,
                        ao.users_id,
                        ao.approval_sequence,
                        CONCAT_WS(' ', u.users_fname, u.users_mname, u.users_lname) AS approver_name,
                        ul.user_level_name,
                        d.departments_name,
                        CASE 
                            WHEN EXISTS (
                                SELECT 1 FROM tbl_reservation_status rs3
                                WHERE rs3.reservation_reservation_id = :reservation_id 
                                AND rs3.reservation_users_id = ao.users_id
                                AND rs3.reservation_status_status_id = 3
                            ) THEN true
                            ELSE false
                        END AS has_approved,
                        rs.reservation_status_status_id AS approval_status_id,
                        rs.reservation_active AS approval_active,
                        rs.reservation_updated_at AS approval_date
                    FROM tbl_approval_in_order ao
                    LEFT JOIN tbl_users u ON ao.users_id = u.users_id
                    LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                    LEFT JOIN tbl_reservation_status rs ON (
                        rs.reservation_reservation_id = :reservation_id 
                        AND rs.reservation_users_id = ao.users_id
                        AND rs.reservation_status_status_id IN (1)
                    )
                    ORDER BY ao.approval_sequence ASC
                ";
                
                $approvalStmt = $this->conn->prepare($approvalSequenceSql);
                $approvalStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $approvalStmt->execute();
                $approvalResults = $approvalStmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($approvalResults as $approval) {
                    $approvalSequence[] = [
                        'approval_order_id' => $approval['approval_order_id'],
                        'users_id' => $approval['users_id'],
                        'approval_sequence' => $approval['approval_sequence'],
                        'approver_name' => $approval['approver_name'],
                        'user_level_name' => $approval['user_level_name'],
                        'departments_name' => $approval['departments_name'],
                        'has_approved' => (bool)$approval['has_approved'],
                        'approval_status_id' => $approval['approval_status_id'],
                        'approval_active' => $approval['approval_active'],
                        'approval_date' => $approval['approval_date']
                    ];
                }
                
                $response['approval_sequence'] = $approvalSequence;
                
                // Add approval sequence summary
                $totalApprovers = count($approvalSequence);
                $approvedCount = 0;
                foreach ($approvalSequence as $approver) {
                    if ($approver['has_approved']) {
                        $approvedCount++;
                    }
                }
                
                $response['approval_summary'] = [
                    'total_approvers' => $totalApprovers,
                    'approved_count' => $approvedCount,
                    'approval_progress' => $totalApprovers > 0 ? "$approvedCount / $totalApprovers Approved" : "No approvers assigned"
                ];

                // Calculate effective dates based on reschedule status
                $statusId = (int)$response['status_id'];
                $active = (int)$response['active'];
                
                // Check if status 11 (Change Request) exists in the status history
                $hasStatus11 = false;
                foreach ($statusHistory as $status) {
                    if ((int)$status['status_id'] === 11) {
                        $hasStatus11 = true;
                        break;
                    }
                }
                
                // Determine the effective dates to use based on reschedule status
                if ($hasStatus11 && 
                    !empty($response['reschedule_start_date']) && 
                    !empty($response['reschedule_end_date'])) {
                    // If status 11 exists in history, always use reschedule dates
                    $response['effective_start_date'] = $response['reschedule_start_date'];
                    $response['effective_end_date'] = $response['reschedule_end_date'];
                } else {
                    // If no status 11 in history, use original reservation dates
                    $response['effective_start_date'] = $response['reservation_start_date'];
                    $response['effective_end_date'] = $response['reservation_end_date'];
                }

                return json_encode(['status' => 'success', 'data' => $response]);
            } else {
                return json_encode(['status' => 'error', 'message' => 'Reservation not found']);
            }

        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function fetchAvailableVenues($startDateTime = null, $endDateTime = null, $excludeIds = null) {
        header('Content-Type: application/json');
        
        try {
            // Step 1: Get all available venues (not status 2 - unavailable) and exclude venues with reservations having status IDs 2, 5, 4
            $sql = "
                SELECT 
                    v.ven_id, 
                    v.ven_name, 
                    v.ven_occupancy, 
                    v.ven_created_at, 
                    v.ven_updated_at, 
                    v.status_availability_id,
                    sa.status_availability_name,
                    v.ven_pic
                FROM tbl_venue v
                INNER JOIN tbl_status_availability sa ON v.status_availability_id = sa.status_availability_id
                WHERE v.status_availability_id NOT IN (2) AND v.is_active = 1
                AND v.ven_id NOT IN (
                    SELECT DISTINCT rv.reservation_venue_venue_id 
                    FROM tbl_reservation_venue rv
                    INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                    WHERE r.reservation_id IN (
                        SELECT DISTINCT reservation_reservation_id 
                        FROM tbl_reservation_status 
                        WHERE reservation_status_status_id IN (2, 5, 4)
                    )
                )
                ORDER BY v.ven_name";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $allVenues = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Step 2: Filter out excluded venue IDs
            $filteredVenues = $allVenues;
            if (!empty($excludeIds)) {
                if (is_array($excludeIds)) {
                    $filteredVenues = array_filter($allVenues, function($venue) use ($excludeIds) {
                        return !in_array($venue['ven_id'], $excludeIds);
                    });
                } else {
                    $filteredVenues = array_filter($allVenues, function($venue) use ($excludeIds) {
                        return $venue['ven_id'] != $excludeIds;
                    });
                }
            }
            
            // Step 3: Apply date-based reservation filtering if dates are provided
            if ($startDateTime && $endDateTime && !empty($filteredVenues)) {
                // Get venue IDs that are currently reserved/occupied during the specified time
                $reservedVenuesSql = "
                    SELECT DISTINCT 
                        CASE 
                            WHEN (
                                (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active IN (0, 1))
                                OR (active_resched.max_reschedule_status_id IS NOT NULL AND ls.reservation_status_status_id = 6 AND ls.reservation_active = 1)
                            ) AND rv.reservation_change_venue_id IS NOT NULL
                            THEN rv.reservation_change_venue_id
                            ELSE rv.reservation_venue_venue_id
                        END AS venue_id_in_use
                    FROM tbl_reservation_venue rv
                    INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) ls ON ls.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 14) AND reservation_active IN (0,1)
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    WHERE 
                        r.reservation_id NOT IN (
                            SELECT DISTINCT reservation_reservation_id 
                            FROM tbl_reservation_status 
                            WHERE reservation_status_status_id IN (1,3,7,6,8,10,11,14,2,5,4)
                        )
                        AND (
                            (CASE
                                WHEN (
                                        (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active IN (0, 1))
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                     )
                                     AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= ?
                            AND (CASE
                                WHEN (
                                        (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active IN (0, 1))
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                     )
                                     AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= ?
                        )
                    
                    UNION
                    
                    SELECT DISTINCT 
                        CASE 
                            WHEN rv.reservation_change_venue_id IS NOT NULL
                            THEN rv.reservation_change_venue_id
                            ELSE rv.reservation_venue_venue_id
                        END AS venue_id_in_use
                    FROM tbl_reservation_venue rv
                    INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) ls ON ls.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 14) AND reservation_active = 0
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    WHERE 
                        r.reservation_id NOT IN (
                            SELECT DISTINCT reservation_reservation_id 
                            FROM tbl_reservation_status 
                            WHERE reservation_status_status_id IN (1,3,7,6,10,11,14,2,5,4)
                        )
                        AND (
                            (CASE
                                WHEN (
                                        (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active IN (0, 1))
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                     )
                                     AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= ?
                            AND (CASE
                                WHEN (
                                        (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active IN (0, 1))
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                     )
                                     AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= ?
                        )";
                
                $reservedStmt = $this->conn->prepare($reservedVenuesSql);
                $reservedStmt->execute([$endDateTime, $startDateTime, $endDateTime, $startDateTime]);
                $reservedVenues = $reservedStmt->fetchAll(PDO::FETCH_COLUMN);
                
                // Additional query specifically for reschedule scenarios (status 10)
                $rescheduleSql = "
                    SELECT DISTINCT 
                        CASE 
                            WHEN rv.reservation_change_venue_id IS NOT NULL
                            THEN rv.reservation_change_venue_id
                            ELSE rv.reservation_venue_venue_id
                        END AS venue_id_in_use
                    FROM tbl_reservation_venue rv
                    INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) ls ON ls.reservation_reservation_id = r.reservation_id
                    WHERE 
                        ls.reservation_status_status_id = 10
                        AND r.reschedule_start_date IS NOT NULL 
                        AND r.reschedule_end_date IS NOT NULL
                        AND r.reschedule_start_date <= ?
                        AND r.reschedule_end_date >= ?";
                
                $rescheduleStmt = $this->conn->prepare($rescheduleSql);
                $rescheduleStmt->execute([$endDateTime, $startDateTime]);
                $rescheduleVenues = $rescheduleStmt->fetchAll(PDO::FETCH_COLUMN);
                
                // Combine both reserved and reschedule venues
                $allBlockedVenues = array_unique(array_merge($reservedVenues, $rescheduleVenues));
                
                // Filter out all blocked venues (reserved + reschedule)
                $finalVenues = array_filter($filteredVenues, function($venue) use ($allBlockedVenues) {
                    return !in_array($venue['ven_id'], $allBlockedVenues);
                });
            } else {
                $finalVenues = $filteredVenues;
            }
            
            // Re-index array to ensure proper JSON encoding
            $finalVenues = array_values($finalVenues);
            
            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'data' => $finalVenues,
                'count' => count($finalVenues),
                'filters_applied' => [
                    'excluded_ids' => !empty($excludeIds),
                    'date_filtering' => ($startDateTime && $endDateTime)
                ],
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_UNESCAPED_SLASHES);
            
        } catch (PDOException $e) {
            error_log("Database error in fetchAvailableVenues: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            error_log("General error in fetchAvailableVenues: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'General error: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
    }

    public function fetchAvailableVehicles($startDateTime = null, $endDateTime = null, $excludeIds = null) {
        header('Content-Type: application/json');
        
        try {
            // Step 1: Get all available vehicles (not status 2 - unavailable)
            $sql = "
                SELECT 
                    vh.vehicle_id, 
                    CONCAT(vm.vehicle_make_name, ' ', vmo.vehicle_model_name, ' ', vc.vehicle_category_name, ' - ', vh.vehicle_license) AS vehicle_name,
                    vh.vehicle_license,
                    vh.year,
                    vh.created_at AS vehicle_created_at, 
                    vh.updated_at AS vehicle_updated_at, 
                    vh.status_availability_id,
                    sa.status_availability_name,
                    vh.vehicle_pic
                FROM tbl_vehicle vh
                INNER JOIN tbl_status_availability sa ON vh.status_availability_id = sa.status_availability_id
                INNER JOIN tbl_vehicle_model vmo ON vh.vehicle_model_id = vmo.vehicle_model_id
                INNER JOIN tbl_vehicle_make vm ON vmo.vehicle_model_vehicle_make_id = vm.vehicle_make_id
                INNER JOIN tbl_vehicle_category vc ON vmo.vehicle_category_id = vc.vehicle_category_id
                WHERE vh.status_availability_id NOT IN (2) AND vh.is_active = 1
                ORDER BY vehicle_name";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $allVehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            
            
            // Step 2: Filter out excluded vehicle IDs
            $filteredVehicles = $allVehicles;
            if (!empty($excludeIds)) {
                if (is_array($excludeIds)) {
                    $filteredVehicles = array_filter($allVehicles, function($vehicle) use ($excludeIds) {
                        return !in_array($vehicle['vehicle_id'], $excludeIds);
                    });
                } else {
                    $filteredVehicles = array_filter($allVehicles, function($vehicle) use ($excludeIds) {
                        return $vehicle['vehicle_id'] != $excludeIds;
                    });
                }
           
            }
            
            // Step 3: Apply date-based reservation filtering if dates are provided
            if ($startDateTime && $endDateTime && !empty($filteredVehicles)) {
               
                // Get vehicle IDs that are currently reserved/occupied during the specified time
                $reservedVehiclesSql = "
                    SELECT DISTINCT 
                        CASE 
                            WHEN (
                                (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active IN (0, 1))
                                OR (active_resched.max_reschedule_status_id IS NOT NULL AND ls.reservation_status_status_id = 6 AND ls.reservation_active = 1)
                            ) AND rv.reservation_change_vehicle_id IS NOT NULL
                            THEN rv.reservation_change_vehicle_id
                            ELSE rv.reservation_vehicle_vehicle_id
                        END AS vehicle_id_in_use
                    FROM tbl_reservation_vehicle rv
                    INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) ls ON ls.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 14) AND reservation_active = 1
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    WHERE 
                        r.reservation_id NOT IN (
                            SELECT DISTINCT reservation_reservation_id 
                            FROM tbl_reservation_status 
                            WHERE reservation_status_status_id IN (1,3,7,6,8,10,11,14,2,5,4)
                        )
                        AND (
                            (CASE
                                WHEN (
                                        (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active = 1)
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                     )
                                     AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= ?
                            AND (CASE
                                WHEN (
                                        (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active = 1)
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                     )
                                     AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= ?
                        )
                    
                    UNION
                    
                    SELECT DISTINCT 
                        CASE 
                            WHEN rv.reservation_change_vehicle_id IS NOT NULL
                            THEN rv.reservation_change_vehicle_id
                            ELSE rv.reservation_vehicle_vehicle_id
                        END AS vehicle_id_in_use
                    FROM tbl_reservation_vehicle rv
                    INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT rs1.*
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                             AND rs1.reservation_updated_at = mu.max_updated_at
                        INNER JOIN (
                            SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                            FROM tbl_reservation_status x
                            INNER JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                FROM tbl_reservation_status
                                GROUP BY reservation_reservation_id
                            ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                               AND y.max_updated_at = x.reservation_updated_at
                            GROUP BY x.reservation_reservation_id
                        ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                             AND rs1.reservation_status_id = mid.max_id
                    ) ls ON ls.reservation_reservation_id = r.reservation_id
                    LEFT JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_status_status_id IN (10, 14) AND reservation_active = 1
                        GROUP BY reservation_reservation_id
                    ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                    WHERE 
                        r.reservation_id NOT IN (
                            SELECT DISTINCT reservation_reservation_id 
                            FROM tbl_reservation_status 
                            WHERE reservation_status_status_id IN (1,3,7,6,8,10,11,14,2,5,4)
                        )
                        AND (
                            (CASE
                                WHEN (
                                        (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active = 1)
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                     )
                                     AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= ?
                            AND (CASE
                                WHEN (
                                        (ls.reservation_status_status_id IN (10, 14) AND ls.reservation_active = 1)
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                     )
                                     AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= ?
                        )";
                
                $reservedStmt = $this->conn->prepare($reservedVehiclesSql);
                $reservedStmt->execute([$endDateTime, $startDateTime, $endDateTime, $startDateTime]);
                $reservedVehicles = $reservedStmt->fetchAll(PDO::FETCH_COLUMN);
               
                
                // Filter out reserved vehicles
                $finalVehicles = array_filter($filteredVehicles, function($vehicle) use ($reservedVehicles) {
                    return !in_array($vehicle['vehicle_id'], $reservedVehicles);
                });
               
            } else {
                $finalVehicles = $filteredVehicles;
                if (!$startDateTime || !$endDateTime) {
                    
                }
            }
            
            // Re-index array to ensure proper JSON encoding
            $finalVehicles = array_values($finalVehicles);
            
           
            
            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'data' => $finalVehicles,
                'count' => count($finalVehicles),
                'filters_applied' => [
                    'excluded_ids' => !empty($excludeIds),
                    'date_filtering' => ($startDateTime && $endDateTime)
                ],
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_UNESCAPED_SLASHES);
            
        } catch (PDOException $e) {
            error_log("Database error in fetchAvailableVehicles: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            error_log("General error in fetchAvailableVehicles: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'General error: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
    }

    public function updateVenueReschedule($reservation_venue_id, $reservation_change_venue_id, $reservation_id = null) {
        try {
            if ($reservation_venue_id === null || $reservation_change_venue_id === null) {
                return json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
            }

            // If reservation_id is not provided, get it from the venue record
            if ($reservation_id === null) {
                $getReservationSql = "SELECT reservation_reservation_id FROM tbl_reservation_venue WHERE reservation_venue_id = :reservation_venue_id";
                $getReservationStmt = $this->conn->prepare($getReservationSql);
                $getReservationStmt->bindParam(':reservation_venue_id', $reservation_venue_id, PDO::PARAM_INT);
                $getReservationStmt->execute();
                $reservationData = $getReservationStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$reservationData) {
                    return json_encode(['status' => 'error', 'message' => 'Reservation venue record not found']);
                }
                
                $reservation_id = $reservationData['reservation_reservation_id'];
            }
    
            $sql = "UPDATE tbl_reservation_venue
                    SET reservation_change_venue_id = :reservation_change_venue_id
                    WHERE reservation_venue_id = :reservation_venue_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':reservation_change_venue_id', (int)$reservation_change_venue_id, PDO::PARAM_INT);
            $stmt->bindValue(':reservation_venue_id', (int)$reservation_venue_id, PDO::PARAM_INT);
    
            $ok = $stmt->execute();
            if ($ok) {
                return json_encode([
                    'status' => 'success', 
                    'message' => 'Venue reschedule updated successfully'
                ]);
            }
            return json_encode(['status' => 'error', 'message' => 'Failed to update venue reschedule']);
        } catch (PDOException $e) {
            error_log('Database error in updateVenueReschedule: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function validateConflictingReservationsStatus($reservationIds) {
        try {
            if (empty($reservationIds) || !is_array($reservationIds)) {
                return json_encode(['status' => 'error', 'message' => 'Invalid reservation IDs provided']);
            }

            $placeholders = implode(',', array_fill(0, count($reservationIds), '?'));
            
            $sql = "
                SELECT 
                    r.reservation_id,
                    r.reservation_title,
                    latest_status.reservation_status_status_id,
                    latest_status.reservation_active,
                    status.status_name,
                    CASE 
                        WHEN latest_status.reservation_status_status_id = 10 THEN 'rescheduled'
                        WHEN latest_status.reservation_status_status_id = 11 THEN 'pending_reschedule'
                        ELSE 'not_rescheduled'
                    END AS reschedule_status
                FROM tbl_reservation r
                LEFT JOIN (
                    SELECT rs1.*
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                         AND rs1.reservation_updated_at = mu.max_updated_at
                    INNER JOIN (
                        SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                        FROM tbl_reservation_status x
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                           AND y.max_updated_at = x.reservation_updated_at
                        GROUP BY x.reservation_reservation_id
                    ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                         AND rs1.reservation_status_id = mid.max_id
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                LEFT JOIN tbl_status status ON latest_status.reservation_status_status_id = status.status_id
                WHERE r.reservation_id IN ($placeholders)
            ";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($reservationIds);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $validationData = [
                'total_reservations' => count($reservationIds),
                'reservations' => [],
                'already_rescheduled' => [],
                'pending_reschedule' => [],
                'not_rescheduled' => []
            ];

            foreach ($results as $row) {
                $reservationData = [
                    'reservation_id' => $row['reservation_id'],
                    'reservation_title' => $row['reservation_title'],
                    'status_id' => $row['reservation_status_status_id'],
                    'status_name' => $row['status_name'],
                    'reschedule_status' => $row['reschedule_status'],
                    'is_active' => $row['reservation_active']
                ];

                $validationData['reservations'][] = $reservationData;

                // Categorize reservations by their reschedule status
                switch ($row['reschedule_status']) {
                    case 'rescheduled':
                        $validationData['already_rescheduled'][] = $reservationData;
                        break;
                    case 'pending_reschedule':
                        $validationData['pending_reschedule'][] = $reservationData;
                        break;
                    default:
                        $validationData['not_rescheduled'][] = $reservationData;
                        break;
                }
            }

            $validationData['counts'] = [
                'already_rescheduled' => count($validationData['already_rescheduled']),
                'pending_reschedule' => count($validationData['pending_reschedule']),
                'not_rescheduled' => count($validationData['not_rescheduled'])
            ];

            return json_encode([
                'status' => 'success',
                'data' => $validationData
            ]);

        } catch (Exception $e) {
            error_log("Error in validateConflictingReservationsStatus: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error occurred']);
        }
    }

    public function filterActiveConflicts($conflictingReservations) {
        try {
            if (empty($conflictingReservations) || !is_array($conflictingReservations)) {
                return json_encode(['status' => 'error', 'message' => 'Invalid conflicting reservations data']);
            }

            // Extract reservation IDs from the conflicting reservations array
            $reservationIds = [];
            foreach ($conflictingReservations as $reservation) {
                if (isset($reservation['reservation_id'])) {
                    $reservationIds[] = $reservation['reservation_id'];
                }
            }

            if (empty($reservationIds)) {
                return json_encode(['status' => 'error', 'message' => 'No valid reservation IDs found']);
            }

            $placeholders = implode(',', array_fill(0, count($reservationIds), '?'));
            
            $sql = "
                SELECT 
                    r.reservation_id,
                    latest_status.reservation_status_status_id,
                    latest_status.reservation_active
                FROM tbl_reservation r
                LEFT JOIN (
                    SELECT rs1.*
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                         AND rs1.reservation_updated_at = mu.max_updated_at
                    INNER JOIN (
                        SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                        FROM tbl_reservation_status x
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                           AND y.max_updated_at = x.reservation_updated_at
                        GROUP BY x.reservation_reservation_id
                    ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                         AND rs1.reservation_status_id = mid.max_id
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                WHERE r.reservation_id IN ($placeholders)
            ";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($reservationIds);
            $statusResults = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Create a map of reservation_id to status
            $statusMap = [];
            foreach ($statusResults as $row) {
                $statusMap[$row['reservation_id']] = [
                    'status_id' => $row['reservation_status_status_id'],
                    'is_active' => $row['reservation_active']
                ];
            }

            // Filter out reservations that are already rescheduled (status 10) or pending reschedule (status 11)
            $activeConflicts = [];
            $rescheduledCount = 0;
            
            foreach ($conflictingReservations as $reservation) {
                $reservationId = $reservation['reservation_id'];
                $status = $statusMap[$reservationId] ?? null;
                
                if ($status) {
                    // Skip reservations that are already rescheduled (status 10) or pending reschedule (status 11)
                    if ($status['status_id'] == 10 || $status['status_id'] == 11) {
                        $rescheduledCount++;
                        continue;
                    }
                }
                
                // Keep reservations that still need to be rescheduled
                $activeConflicts[] = $reservation;
            }

            return json_encode([
                'status' => 'success',
                'data' => [
                    'active_conflicts' => $activeConflicts,
                    'total_original' => count($conflictingReservations),
                    'already_rescheduled' => $rescheduledCount,
                    'remaining_conflicts' => count($activeConflicts),
                    'suggested_index' => $rescheduledCount // This will be the starting index for the queue
                ]
            ]);

        } catch (Exception $e) {
            error_log("Error in filterActiveConflicts: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error occurred']);
        }
    }
    
    public function updateVehicleReschedule($reservation_vehicle_id, $reservation_change_vehicle_id, $reservation_id = null) {
        try {
            if ($reservation_vehicle_id === null || $reservation_change_vehicle_id === null) {
                return json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
            }

            // If reservation_id is not provided, get it from the vehicle record
            if ($reservation_id === null) {
                $getReservationSql = "SELECT reservation_reservation_id FROM tbl_reservation_vehicle WHERE reservation_vehicle_id = :reservation_vehicle_id";
                $getReservationStmt = $this->conn->prepare($getReservationSql);
                $getReservationStmt->bindParam(':reservation_vehicle_id', $reservation_vehicle_id, PDO::PARAM_INT);
                $getReservationStmt->execute();
                $reservationData = $getReservationStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$reservationData) {
                    return json_encode(['status' => 'error', 'message' => 'Reservation vehicle record not found']);
                }
                
                $reservation_id = $reservationData['reservation_reservation_id'];
            }
    
            $sql = "UPDATE tbl_reservation_vehicle
                    SET reservation_change_vehicle_id = :reservation_change_vehicle_id
                    WHERE reservation_vehicle_id = :reservation_vehicle_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':reservation_change_vehicle_id', (int)$reservation_change_vehicle_id, PDO::PARAM_INT);
            $stmt->bindValue(':reservation_vehicle_id', (int)$reservation_vehicle_id, PDO::PARAM_INT);
    
            $ok = $stmt->execute();
            if ($ok) {
                return json_encode([
                    'status' => 'success', 
                    'message' => 'Vehicle reschedule updated successfully'
                ]);
            }
            return json_encode(['status' => 'error', 'message' => 'Failed to update vehicle reschedule']);
        } catch (PDOException $e) {
            error_log('Database error in updateVehicleReschedule: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    public function updateReservationReschedule($reservation_id, $reschedule_start_date, $reschedule_end_date, $user_admin_id = null, $venue_ids = null, $vehicle_ids = null) {
        try {
            if ($reservation_id === null || $reschedule_start_date === null || $reschedule_end_date === null) {
                return json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
            }

            

            // First, check the current status of the reservation
            $checkSql = "
                SELECT 
                    rs.reservation_status_status_id,
                    rs.reservation_active,
                    sm.status_master_name
                FROM tbl_reservation_status rs
                LEFT JOIN tbl_status_master sm ON rs.reservation_status_status_id = sm.status_master_id
                WHERE rs.reservation_reservation_id = :reservation_id
                ORDER BY rs.reservation_status_id DESC
                LIMIT 1
            ";
            
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':reservation_id', $reservation_id, PDO::PARAM_INT);
            $checkStmt->execute();
            $currentStatus = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$currentStatus) {
                return json_encode(['status' => 'error', 'message' => 'Reservation not found']);
            }
            
           
            
            $currentStatusId = (int)$currentStatus['reservation_status_status_id'];
            
            // Check if reservation is in final states (cancelled, completed, declined)
            if ($currentStatusId === 2) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Cannot update reschedule dates: Reservation has been cancelled',
                    'current_status' => $currentStatus['status_master_name']
                ]);
            }
            
            if ($currentStatusId === 4) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Cannot update reschedule dates: Reservation has been declined/rejected',
                    'current_status' => $currentStatus['status_master_name']
                ]);
            }
            
            if ($currentStatusId === 5) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Cannot update reschedule dates: Reservation has been completed',
                    'current_status' => $currentStatus['status_master_name']
                ]);
            }

            // Check if reservation is already rescheduled (status 10)
            if ($currentStatusId === 10) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Cannot update reschedule dates: Reservation has already been rescheduled',
                    'current_status' => $currentStatus['status_master_name']
                ]);
            }

            // ===== CHECK FOR CONFLICTS BEFORE UPDATING =====
            // Fetch requested resources and check for conflicts FIRST
            $conflictResults = [];
            
            // Determine venue IDs to check: use provided IDs or fetch from database
            $venues = [];
            if (!empty($venue_ids) && is_array($venue_ids)) {
                
                foreach ($venue_ids as $venueId) {
                    $venues[] = ['reservation_venue_venue_id' => $venueId];
                }
            } else {
                
                $venuesSql = "SELECT reservation_venue_venue_id 
                              FROM tbl_reservation_venue 
                              WHERE reservation_reservation_id = :reservation_id";
                $venuesStmt = $this->conn->prepare($venuesSql);
                $venuesStmt->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
                $venuesStmt->execute();
                $venues = $venuesStmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
           
            
            // Check conflicts for each venue
            foreach ($venues as $venue) {
                $venueId = $venue['reservation_venue_venue_id'];
                $conf = $this->hasConflictRequest('venue', $venueId, $reschedule_start_date, $reschedule_end_date, 0, $reservation_id);
               
                if ($conf['count'] > 0 && !empty($conf['conflicts'])) {
                    $venueName = $conf['conflicts'][0]['venue_name'] ?? 'Venue ID ' . $venueId;
                   
                    $conflictResults[] = [
                        'type' => 'Venue',
                        'name' => $venueName,
                        'resource_id' => $venueId,
                        'conflicts' => $conf['conflicts']
                    ];
                }
            }
            
            // Determine vehicle IDs to check: use provided IDs or fetch from database
            $vehicles = [];
            if (!empty($vehicle_ids) && is_array($vehicle_ids)) {
                foreach ($vehicle_ids as $vehicleId) {
                    $vehicles[] = ['reservation_vehicle_vehicle_id' => $vehicleId];
                }
            } else {

                $vehiclesSql = "SELECT reservation_vehicle_vehicle_id 
                                FROM tbl_reservation_vehicle 
                                WHERE reservation_reservation_id = :reservation_id";
                $vehiclesStmt = $this->conn->prepare($vehiclesSql);
                $vehiclesStmt->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
                $vehiclesStmt->execute();
                $vehicles = $vehiclesStmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
           
            
            // Check conflicts for each vehicle
            foreach ($vehicles as $vehicle) {
                $vehicleId = $vehicle['reservation_vehicle_vehicle_id'];
                $conf = $this->hasConflictRequest('vehicle', $vehicleId, $reschedule_start_date, $reschedule_end_date, 0, $reservation_id);
               
                if ($conf['count'] > 0 && !empty($conf['conflicts'])) {
                    $vehicleName = $conf['conflicts'][0]['vehicle_name'] ?? 'Vehicle ID ' . $vehicleId;
                   
                    $conflictResults[] = [
                        'type' => 'Vehicle',
                        'name' => $vehicleName,
                        'resource_id' => $vehicleId,
                        'conflicts' => $conf['conflicts']
                    ];
                }
            }
            
            // Fetch equipment
            $equipmentSql = "SELECT reservation_equipment_equip_id, reservation_equipment_quantity 
                             FROM tbl_reservation_equipment 
                             WHERE reservation_reservation_id = :reservation_id";
            $equipmentStmt = $this->conn->prepare($equipmentSql);
            $equipmentStmt->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
            $equipmentStmt->execute();
            $equipment = $equipmentStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Check conflicts for each equipment
            foreach ($equipment as $equip) {
                $equipId = $equip['reservation_equipment_equip_id'];
                $quantity = $equip['reservation_equipment_quantity'];
                $conf = $this->hasConflictRequest('equipment', $equipId, $reschedule_start_date, $reschedule_end_date, $quantity, $reservation_id);
                if ($conf['count'] > 0) {
                    $equipName = $conf['equipment_info']['equipment_name'] ?? 'Equipment ID ' . $equipId;
                    $requested = $conf['equipment_info']['requested_quantity'] ?? $quantity;
                    $remaining = $conf['equipment_info']['remaining_quantity'] ?? 0;
                    $conflictResults[] = [
                        'type' => 'Equipment',
                        'name' => $equipName,
                        'resource_id' => $equipId,
                        'details' => "Requested: $requested, Available: $remaining",
                        'conflicts' => $conf['conflicts']
                    ];
                }
            }
            
            // If conflicts exist, return error with details
            if (!empty($conflictResults)) {
                
                
                $errorMessage = "The following resources have conflicts with the new reschedule dates:\n\n";
                foreach ($conflictResults as $resource) {
                    $errorMessage .= "• {$resource['type']}: {$resource['name']}";
                    if (isset($resource['details'])) {
                        $errorMessage .= " ({$resource['details']})";
                    }
                    $errorMessage .= "\n";
                }
                
                return json_encode([
                    'status' => 'error',
                    'message' => $errorMessage,
                    'conflicts' => $conflictResults,
                    'has_conflicts' => true
                ]);
            }
            
            // No conflicts, proceed with reschedule
           
    
            $this->conn->beginTransaction();
    
            // 1) Update reschedule dates on reservation
            $sql = "UPDATE tbl_reservation
                    SET reschedule_start_date = :reschedule_start_date,
                        reschedule_end_date = :reschedule_end_date
                    WHERE reservation_id = :reservation_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':reschedule_start_date', $reschedule_start_date, PDO::PARAM_STR);
            $stmt->bindValue(':reschedule_end_date', $reschedule_end_date, PDO::PARAM_STR);
            $stmt->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
            $stmt->execute();

            // 2) Check if status_id 7 (Admin Approved) exists for this reservation
            $checkStatus7Sql = "SELECT COUNT(*) as count FROM tbl_reservation_status 
                                WHERE reservation_reservation_id = :reservation_id 
                                AND reservation_status_status_id = 7";
            $checkStatus7Stmt = $this->conn->prepare($checkStatus7Sql);
            $checkStatus7Stmt->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
            $checkStatus7Stmt->execute();
            $status7Exists = $checkStatus7Stmt->fetch(PDO::FETCH_ASSOC);

            // If status_id 7 doesn't exist, insert it first
            if ($status7Exists['count'] == 0) {
               
                $insertStatus7Sql = "INSERT INTO tbl_reservation_status
                    (reservation_status_status_id, reservation_reservation_id, reservation_active, reservation_updated_at, reservation_users_id)
                    VALUES (7, :reservation_id, 1, NOW(), :user_admin_id)";
                $insertStatus7Stmt = $this->conn->prepare($insertStatus7Sql);
                $insertStatus7Stmt->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
                if ($user_admin_id === null || $user_admin_id === '') {
                    $insertStatus7Stmt->bindValue(':user_admin_id', null, PDO::PARAM_NULL);
                } else {
                    $insertStatus7Stmt->bindValue(':user_admin_id', (int)$user_admin_id, PDO::PARAM_INT);
                }
                $insertStatus7Stmt->execute();
            } else {
               
            }

            // 3) Insert status_id 3 with active=1
           
            $insertStatus3Sql = "INSERT INTO tbl_reservation_status
                (reservation_status_status_id, reservation_reservation_id, reservation_active, reservation_updated_at, reservation_users_id)
                VALUES (3, :reservation_id, 1, NOW(), :user_admin_id)";
            $insertStatus3Stmt = $this->conn->prepare($insertStatus3Sql);
            $insertStatus3Stmt->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
            if ($user_admin_id === null || $user_admin_id === '') {
                $insertStatus3Stmt->bindValue(':user_admin_id', null, PDO::PARAM_NULL);
            } else {
                $insertStatus3Stmt->bindValue(':user_admin_id', (int)$user_admin_id, PDO::PARAM_INT);
            }
            $insertStatus3Stmt->execute();
    
            // 4) Update status ID 8 to active (reservation_active = 1) for this reservation
            $updateStatusSql = "UPDATE tbl_reservation_status 
                               SET reservation_active = 1, 
                                   reservation_updated_at = NOW(),
                                   reservation_users_id = :user_admin_id
                               WHERE reservation_reservation_id = :reservation_id 
                               AND reservation_status_status_id = 8";
            $updateStmt = $this->conn->prepare($updateStatusSql);
            $updateStmt->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
            if ($user_admin_id === null || $user_admin_id === '') {
                $updateStmt->bindValue(':user_admin_id', null, PDO::PARAM_NULL);
            } else {
                $updateStmt->bindValue(':user_admin_id', (int)$user_admin_id, PDO::PARAM_INT);
            }
            $updateStmt->execute();
    
            // 5) Insert a new status row with reservation_active = 0 and status_id 10
            $ins = $this->conn->prepare("INSERT INTO tbl_reservation_status
                (reservation_status_status_id, reservation_reservation_id, reservation_active, reservation_updated_at, reservation_users_id)
                VALUES (:status_id, :reservation_id, 0, NOW(), :user_admin_id)");
            $ins->bindValue(':status_id', 10, PDO::PARAM_INT);
            $ins->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
            if ($user_admin_id === null || $user_admin_id === '') {
                $ins->bindValue(':user_admin_id', null, PDO::PARAM_NULL);
            } else {
                $ins->bindValue(':user_admin_id', (int)$user_admin_id, PDO::PARAM_INT);
            }
            $ins->execute();
    
            $this->conn->commit();
    
            // Fetch reservation details for push notification
            try {
                $fetchSql = "SELECT r.reservation_user_id, r.reservation_title,
                                   CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS full_name
                            FROM tbl_reservation r
                            LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                            WHERE r.reservation_id = :reservation_id";
                $fetchStmt = $this->conn->prepare($fetchSql);
                $fetchStmt->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
                $fetchStmt->execute();
                $reservationData = $fetchStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($reservationData && $reservationData['reservation_user_id']) {
                    // Format dates for notification
                    $formattedStartDate = date('M d, Y h:i A', strtotime($reschedule_start_date));
                    $formattedEndDate = date('M d, Y h:i A', strtotime($reschedule_end_date));
                    
                    // Send push notification to user
                    $title = "Reservation Rescheduled";
                    $body = "Your reservation '{$reservationData['reservation_title']}' has been rescheduled to {$formattedStartDate} - {$formattedEndDate}.";
                    $notificationData = [
                        'reservation_id' => $reservation_id,
                        'type' => 'reservation_reschedule',
                        'action_url' => '/gsd/grms'
                    ];
                    
                    $this->sendPushNotificationToUser(
                        $reservationData['reservation_user_id'],
                        $title,
                        $body,
                        $notificationData
                    );
                    
                   
                }
            } catch (Exception $e) {
                // Don't fail the reschedule if push notification fails
                error_log("Failed to send push notification for reschedule: " . $e->getMessage());
            }
    
            return json_encode([
                'status' => 'success', 
                'message' => 'Reservation reschedule updated successfully'
            ]);
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log('Database error in updateReservationReschedule: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    private function checkHolidayConflict($startDate, $endDate) {
        try {
            $sql = "SELECT holiday_id, holiday_name, holiday_date 
                    FROM tbl_holidays 
                    WHERE holiday_date BETWEEN :start_date AND :end_date
                    ORDER BY holiday_date ASC";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
            $stmt->execute();
            
            $holidays = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($holidays)) {
             
                return [
                    'has_holiday' => true,
                    'holiday_count' => count($holidays),
                    'holidays' => $holidays
                ];
            }
            
            return [
                'has_holiday' => false,
                'holiday_count' => 0,
                'holidays' => []
            ];
        } catch (PDOException $e) {
            
            return [
                'has_holiday' => false,
                'holiday_count' => 0,
                'holidays' => []
            ];
        }
    }

    public function hasConflictRequest($resourceType, $resourceId, $startDate, $endDate, $requestedQuantity = 0, $excludeReservationId = null) {
        if (!in_array($resourceType, ['venue', 'vehicle', 'equipment'])) {
            
            return ['status' => false, 'count' => 0, 'has_holiday' => false, 'conflicts' => []];
        }
    
        try {
            // Check for holiday conflicts first
            $holidayConflicts = $this->checkHolidayConflict($startDate, $endDate);
            
            $sql = "";
    
            switch ($resourceType) {
                case 'venue':
                    $sql = "SELECT DISTINCT 
                            r.reservation_id,
                            r.reservation_title,
                            r.reservation_start_date,
                            r.reservation_end_date,
                            r.reschedule_start_date,
                            r.reschedule_end_date,
                            CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS requester_name,
                            u.users_id AS requester_id,
                            s.status_master_name AS status_name,
                            ls.reservation_status_status_id,
                            ls.reservation_active,
                            CASE
                                WHEN v.reservation_venue_venue_id = :resource_id THEN ven.ven_name
                                WHEN v.reservation_change_venue_id = :resource_id THEN COALESCE(change_ven.ven_name, ven.ven_name)
                                ELSE ven.ven_name
                            END AS venue_name,
                            ven.ven_name AS original_venue_name,
                            v.reservation_venue_venue_id AS original_venue_id,
                            v.reservation_change_venue_id,
                            change_ven.ven_name AS change_venue_name,
                            CASE
                                WHEN v.reservation_venue_venue_id = :resource_id THEN 'original'
                                WHEN v.reservation_change_venue_id = :resource_id THEN 'change'
                                ELSE 'unknown'
                            END AS conflict_type,
                            CASE
                                WHEN (
                                    ls.reservation_status_status_id IN (10, 11, 14)
                                    OR (
                                        ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                        AND active_resched.max_reschedule_status_id IS NOT NULL
                                    )
                                )
                                AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_start_date 
                                ELSE r.reservation_start_date 
                            END AS effective_start_date,
                            CASE
                                WHEN (
                                    ls.reservation_status_status_id IN (10, 11, 14)
                                    OR (
                                        ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                        AND active_resched.max_reschedule_status_id IS NOT NULL
                                    )
                                )
                                AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_end_date 
                                ELSE r.reservation_end_date 
                            END AS effective_end_date
                            FROM tbl_reservation r
                            INNER JOIN tbl_reservation_venue v
                              ON r.reservation_id = v.reservation_reservation_id
                            INNER JOIN tbl_users u ON r.reservation_user_id = u.users_id
                            INNER JOIN tbl_venue ven ON v.reservation_venue_venue_id = ven.ven_id
                            LEFT JOIN tbl_venue change_ven ON v.reservation_change_venue_id = change_ven.ven_id
                            LEFT JOIN (
                                SELECT rs1.*
                                FROM tbl_reservation_status rs1
                                INNER JOIN (
                                    SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                    FROM tbl_reservation_status
                                    GROUP BY reservation_reservation_id
                                ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                                     AND rs1.reservation_updated_at = mu.max_updated_at
                                INNER JOIN (
                                    SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                                    FROM tbl_reservation_status x
                                    INNER JOIN (
                                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                        FROM tbl_reservation_status
                                        GROUP BY reservation_reservation_id
                                    ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                                       AND y.max_updated_at = x.reservation_updated_at
                                    GROUP BY x.reservation_reservation_id
                                ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                                     AND rs1.reservation_status_id = mid.max_id
                            ) ls ON ls.reservation_reservation_id = r.reservation_id
                            LEFT JOIN tbl_status_master s ON ls.reservation_status_status_id = s.status_master_id
                            LEFT JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                                FROM tbl_reservation_status
                                WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                                GROUP BY reservation_reservation_id
                            ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                            WHERE (
                                -- For status 10 active 0 (pending reschedule): check both original and change venue IDs
                                (ls.reservation_status_status_id = 10 AND ls.reservation_active = 0 
                                 AND (v.reservation_venue_venue_id = :resource_id OR v.reservation_change_venue_id = :resource_id))
                                OR
                                -- For status 10 active 1 or status 14 (confirmed reschedule): check only change venue ID
                                (((ls.reservation_status_status_id = 10 AND ls.reservation_active = 1) OR ls.reservation_status_status_id = 14)
                                 AND v.reservation_change_venue_id = :resource_id)
                                OR
                                -- For all other statuses: check only original venue ID
                                (ls.reservation_status_status_id NOT IN (10, 14) 
                                 AND v.reservation_venue_venue_id = :resource_id)
                              )
                              AND ven.is_active = 1
                              AND (:exclude_reservation_id IS NULL OR r.reservation_id != :exclude_reservation_id)
                              AND (
                                ls.reservation_status_status_id IN (1, 6, 8, 9, 10, 11, 14)
                                AND (
                                  (ls.reservation_status_status_id = 6 AND ls.reservation_active = 1)
                                  OR (ls.reservation_status_status_id IN (1, 8, 9, 10, 11, 14) AND (ls.reservation_active = 0 OR ls.reservation_active = 1))
                                )
                              )
                              AND (
                                (CASE
                                  WHEN (
                                        ls.reservation_status_status_id IN (10, 11, 14)
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                      )
                                      AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                  THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= :end_date
                                AND (CASE
                                  WHEN (
                                        ls.reservation_status_status_id IN (10, 11, 14)
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                      )
                                      AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                  THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= :start_date
                              )
                            ORDER BY effective_start_date ASC
                            LOCK IN SHARE MODE";
                    break;

                case 'vehicle':
                    $sql = "SELECT DISTINCT 
                            r.reservation_id,
                            r.reservation_title,
                            r.reservation_start_date,
                            r.reservation_end_date,
                            r.reschedule_start_date,
                            r.reschedule_end_date,
                            CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS requester_name,
                            u.users_id AS requester_id,
                            s.status_master_name AS status_name,
                            ls.reservation_status_status_id,
                            ls.reservation_active,
                            CASE
                                WHEN v.reservation_vehicle_vehicle_id = :resource_id THEN CONCAT(vm.vehicle_make_name, ' ', vmod.vehicle_model_name)
                                WHEN v.reservation_change_vehicle_id = :resource_id THEN COALESCE(CONCAT(change_vm.vehicle_make_name, ' ', change_vmod.vehicle_model_name), CONCAT(vm.vehicle_make_name, ' ', vmod.vehicle_model_name))
                                ELSE CONCAT(vm.vehicle_make_name, ' ', vmod.vehicle_model_name)
                            END AS vehicle_name,
                            CONCAT(vm.vehicle_make_name, ' ', vmod.vehicle_model_name) AS original_vehicle_name,
                            v.reservation_vehicle_vehicle_id AS original_vehicle_id,
                            v.reservation_change_vehicle_id,
                            CONCAT(change_vm.vehicle_make_name, ' ', change_vmod.vehicle_model_name) AS change_vehicle_name,
                            CASE
                                WHEN v.reservation_vehicle_vehicle_id = :resource_id THEN 'original'
                                WHEN v.reservation_change_vehicle_id = :resource_id THEN 'change'
                                ELSE 'unknown'
                            END AS conflict_type,
                            CASE
                                WHEN (
                                    ls.reservation_status_status_id IN (10, 11, 14)
                                    OR (
                                        ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                        AND active_resched.max_reschedule_status_id IS NOT NULL
                                    )
                                )
                                AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_start_date 
                                ELSE r.reservation_start_date 
                            END AS effective_start_date,
                            CASE
                                WHEN (
                                    ls.reservation_status_status_id IN (10, 11, 14)
                                    OR (
                                        ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                        AND active_resched.max_reschedule_status_id IS NOT NULL
                                    )
                                )
                                AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                THEN r.reschedule_end_date 
                                ELSE r.reservation_end_date 
                            END AS effective_end_date
                            FROM tbl_reservation r
                            INNER JOIN tbl_reservation_vehicle v
                              ON r.reservation_id = v.reservation_reservation_id
                            INNER JOIN tbl_users u ON r.reservation_user_id = u.users_id
                            INNER JOIN tbl_vehicle veh ON v.reservation_vehicle_vehicle_id = veh.vehicle_id
                            INNER JOIN tbl_vehicle_model vmod ON veh.vehicle_model_id = vmod.vehicle_model_id
                            INNER JOIN tbl_vehicle_make vm ON vmod.vehicle_model_vehicle_make_id = vm.vehicle_make_id
                            LEFT JOIN tbl_vehicle change_veh ON v.reservation_change_vehicle_id = change_veh.vehicle_id
                            LEFT JOIN tbl_vehicle_model change_vmod ON change_veh.vehicle_model_id = change_vmod.vehicle_model_id
                            LEFT JOIN tbl_vehicle_make change_vm ON change_vmod.vehicle_model_vehicle_make_id = change_vm.vehicle_make_id
                            LEFT JOIN (
                                SELECT rs1.*
                                FROM tbl_reservation_status rs1
                                INNER JOIN (
                                    SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                    FROM tbl_reservation_status
                                    GROUP BY reservation_reservation_id
                                ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                                     AND rs1.reservation_updated_at = mu.max_updated_at
                                INNER JOIN (
                                    SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                                    FROM tbl_reservation_status x
                                    INNER JOIN (
                                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                        FROM tbl_reservation_status
                                        GROUP BY reservation_reservation_id
                                    ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                                       AND y.max_updated_at = x.reservation_updated_at
                                    GROUP BY x.reservation_reservation_id
                                ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                                     AND rs1.reservation_status_id = mid.max_id
                            ) ls ON ls.reservation_reservation_id = r.reservation_id
                            LEFT JOIN tbl_status_master s ON ls.reservation_status_status_id = s.status_master_id
                            LEFT JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                                FROM tbl_reservation_status
                                WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                                GROUP BY reservation_reservation_id
                            ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                            WHERE (
                                -- For status 10 active 0 (pending reschedule): check both original and change vehicle IDs
                                (ls.reservation_status_status_id = 10 AND ls.reservation_active = 0 
                                 AND (v.reservation_vehicle_vehicle_id = :resource_id OR v.reservation_change_vehicle_id = :resource_id))
                                OR
                                -- For status 10 active 1 or status 14 (confirmed reschedule): check only change vehicle ID
                                (((ls.reservation_status_status_id = 10 AND ls.reservation_active = 1) OR ls.reservation_status_status_id = 14)
                                 AND v.reservation_change_vehicle_id = :resource_id)
                                OR
                                -- For all other statuses: check only original vehicle ID
                                (ls.reservation_status_status_id NOT IN (10, 14) 
                                 AND v.reservation_vehicle_vehicle_id = :resource_id)
                              )
                              AND veh.is_active = 1
                              AND (:exclude_reservation_id IS NULL OR r.reservation_id != :exclude_reservation_id)
                              AND (
                                ls.reservation_status_status_id IN (1, 6, 8, 9, 10, 11, 14)
                                AND (
                                  (ls.reservation_status_status_id = 6 AND ls.reservation_active = 1)
                                  OR (ls.reservation_status_status_id IN (1, 8, 9, 10, 11, 14) AND (ls.reservation_active = 0 OR ls.reservation_active = 1))
                                )
                              )
                              AND (
                                (CASE
                                  WHEN (
                                        ls.reservation_status_status_id IN (10, 11, 14)
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                      )
                                      AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                  THEN r.reschedule_start_date ELSE r.reservation_start_date END) <= :end_date
                                AND (CASE
                                  WHEN (
                                        ls.reservation_status_status_id IN (10, 11, 14)
                                        OR (
                                            ls.reservation_status_status_id = 6 AND ls.reservation_active = 1
                                            AND active_resched.max_reschedule_status_id IS NOT NULL
                                        )
                                      )
                                      AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL
                                  THEN r.reschedule_end_date ELSE r.reservation_end_date END) >= :start_date
                              )
                            ORDER BY effective_start_date ASC
                            LOCK IN SHARE MODE";
                    break;
                    
                case 'equipment':
                    // First get capacity info
                    $capacitySql = "SELECT t.equip_id,
                                   t.equip_name,
                                   t.total_capacity,
                                   COALESCE(ur.used_quantity, 0) AS used_quantity,
                                   (t.total_capacity - COALESCE(ur.used_quantity, 0)) AS remaining_quantity
                            FROM (
                              SELECT eq.equip_id,
                                     eq.equip_name,
                                     CASE 
                                       WHEN LOWER(eq.equip_type) = 'bulk' THEN (
                                         SELECT COALESCE(SUM(q.quantity), 0)
                                         FROM tbl_equipment_quantity q
                                         WHERE q.equip_id = eq.equip_id
                                           AND (q.status_availability_id IS NULL OR q.status_availability_id <> 2)
                                       )
                                       ELSE (
                                         SELECT COALESCE(SUM(CASE WHEN u.is_active = 1 AND (u.status_availability_id IS NULL OR u.status_availability_id <> 2) THEN 1 ELSE 0 END), 0)
                                         FROM tbl_equipment_unit u
                                         WHERE u.equip_id = eq.equip_id
                                       )
                                     END AS total_capacity
                              FROM tbl_equipments eq
                              WHERE eq.equip_id = :resource_id
                                AND eq.is_active = 1
                            ) t
                            LEFT JOIN (
                              SELECT e.reservation_equipment_equip_id AS equip_id,
                                     COALESCE(SUM(e.reservation_equipment_quantity), 0) AS used_quantity
                              FROM tbl_reservation_equipment e
                              INNER JOIN tbl_reservation r ON e.reservation_reservation_id = r.reservation_id
                              WHERE e.reservation_equipment_equip_id = :resource_id
                                AND r.reservation_id NOT IN (
                                  SELECT DISTINCT reservation_reservation_id 
                                  FROM tbl_reservation_status 
                                  WHERE reservation_status_status_id IN (2, 5, 4)
                                )
                                AND (:start_date <= r.reservation_end_date AND :end_date >= r.reservation_start_date)
                            ) ur ON ur.equip_id = t.equip_id";

                    $stmt = $this->conn->prepare($capacitySql);
                    $stmt->bindValue(':resource_id', $resourceId, PDO::PARAM_INT);
                    $stmt->bindValue(':start_date', $startDate);
                    $stmt->bindValue(':end_date', $endDate);
                    $stmt->execute();
                    $capacityResult = $stmt->fetch(PDO::FETCH_ASSOC);

                    if (!$capacityResult) {
                        return array_merge(['status' => true, 'count' => 0, 'conflicts' => [], 'equipment_info' => null], $holidayConflicts);
                    }
                    
                    $remainingQuantity = (int)$capacityResult['remaining_quantity'];
                    $hasConflict = $requestedQuantity > $remainingQuantity;
                    
                    // Get detailed conflict reservations
                    $detailSql = "SELECT DISTINCT
                            r.reservation_id,
                            r.reservation_title,
                            r.reservation_start_date,
                            r.reservation_end_date,
                            CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS requester_name,
                            u.users_id AS requester_id,
                            e.reservation_equipment_quantity,
                            eq.equip_name AS equipment_name,
                            s.status_master_name AS status_name
                            FROM tbl_reservation_equipment e
                            INNER JOIN tbl_reservation r ON e.reservation_reservation_id = r.reservation_id
                            INNER JOIN tbl_users u ON r.reservation_user_id = u.users_id
                            INNER JOIN tbl_equipments eq ON e.reservation_equipment_equip_id = eq.equip_id
                              AND eq.is_active = 1
                            LEFT JOIN (
                                SELECT rs1.*
                                FROM tbl_reservation_status rs1
                                INNER JOIN (
                                    SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                    FROM tbl_reservation_status
                                    GROUP BY reservation_reservation_id
                                ) mu ON rs1.reservation_reservation_id = mu.reservation_reservation_id
                                     AND rs1.reservation_updated_at = mu.max_updated_at
                                INNER JOIN (
                                    SELECT x.reservation_reservation_id, MAX(x.reservation_status_id) AS max_id
                                    FROM tbl_reservation_status x
                                    INNER JOIN (
                                        SELECT reservation_reservation_id, MAX(reservation_updated_at) AS max_updated_at
                                        FROM tbl_reservation_status
                                        GROUP BY reservation_reservation_id
                                    ) y ON y.reservation_reservation_id = x.reservation_reservation_id
                                       AND y.max_updated_at = x.reservation_updated_at
                                    GROUP BY x.reservation_reservation_id
                                ) mid ON rs1.reservation_reservation_id = mid.reservation_reservation_id
                                     AND rs1.reservation_status_id = mid.max_id
                            ) ls ON ls.reservation_reservation_id = r.reservation_id
                            LEFT JOIN tbl_status_master s ON ls.reservation_status_status_id = s.status_master_id
                            WHERE e.reservation_equipment_equip_id = :resource_id
                              AND r.reservation_id NOT IN (
                                SELECT DISTINCT reservation_reservation_id 
                                FROM tbl_reservation_status 
                                WHERE reservation_status_status_id IN (2, 5, 4)
                              )
                              AND (:start_date <= r.reservation_end_date AND :end_date >= r.reservation_start_date)
                            ORDER BY r.reservation_start_date ASC
                            LOCK IN SHARE MODE";
                    
                    $detailStmt = $this->conn->prepare($detailSql);
                    $detailStmt->bindValue(':resource_id', $resourceId, PDO::PARAM_INT);
                    $detailStmt->bindValue(':start_date', $startDate);
                    $detailStmt->bindValue(':end_date', $endDate);
                    $detailStmt->execute();
                    $conflicts = $detailStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    
                    
                    return array_merge([
                        'status' => true, 
                        'count' => $hasConflict ? 1 : 0,
                        'conflicts' => $conflicts,
                        'equipment_info' => [
                            'equipment_name' => $capacityResult['equip_name'],
                            'total_capacity' => (int)$capacityResult['total_capacity'],
                            'used_quantity' => (int)$capacityResult['used_quantity'],
                            'remaining_quantity' => $remainingQuantity,
                            'requested_quantity' => (int)$requestedQuantity
                        ]
                    ], $holidayConflicts);
            }

            // Generic path for venue/vehicle - fetch all conflict details
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':resource_id', $resourceId, PDO::PARAM_INT);
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
            $stmt->bindValue(':exclude_reservation_id', $excludeReservationId, $excludeReservationId !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
            $stmt->execute();
            $conflicts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $conflictCount = count($conflicts);
            return array_merge([
                'status' => true, 
                'count' => $conflictCount,
                'conflicts' => $conflicts
            ], $holidayConflicts);
    
        } catch (PDOException $e) {
            error_log("Conflict check error: " . $e->getMessage());
            return ['status' => false, 'count' => 0, 'has_holiday' => false, 'conflicts' => []];
        }
    }

    public function handleProcessed($reservationId, $userId) {
        try {
            // First, check the current status of the reservation
            $checkSql = "
                SELECT 
                    rs.reservation_status_status_id,
                    rs.reservation_active,
                    sm.status_master_name
                FROM tbl_reservation_status rs
                LEFT JOIN tbl_status_master sm ON rs.reservation_status_status_id = sm.status_master_id
                WHERE rs.reservation_reservation_id = :reservation_id
                ORDER BY rs.reservation_status_id DESC
                LIMIT 1
            ";
            
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $checkStmt->execute();
            $currentStatus = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$currentStatus) {
                return json_encode(['status' => 'error', 'message' => 'Reservation not found']);
            }
            
            
            
            $currentStatusId = (int)$currentStatus['reservation_status_status_id'];
            
            // Check if reservation is in final states (cancelled, completed, declined)
            if ($currentStatusId === 2) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Cannot process reservation: Reservation has been cancelled',
                    'current_status' => $currentStatus['status_master_name']
                ]);
            }
            
            if ($currentStatusId === 4) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Cannot process reservation: Reservation has been declined/rejected',
                    'current_status' => $currentStatus['status_master_name']
                ]);
            }
            
            if ($currentStatusId === 5) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Cannot process reservation: Reservation has been completed',
                    'current_status' => $currentStatus['status_master_name']
                ]);
            }
            
            // Check if the reservation is pending (status_id 1, 3, or 8) and needs to be processed
            $pendingStatuses = [1]; // Pending, Approved, Department Approval
            
            // If already has status 7 (Admin Approved/Process), don't insert again
            if ($currentStatusId === 7) {
                return json_encode([
                    'status' => 'success', 
                    'message' => 'Reservation is already being processed',
                    'already_processed' => true
                ]);
            }
            
            // If status is pending (status_id 1), insert status 7 and update status 1 to active
            if (in_array($currentStatusId, $pendingStatuses)) {
                // Start transaction
                $this->conn->beginTransaction();
                
                try {
                    // First, insert status 7 (Process)
                    $insertSql = "
                        INSERT INTO tbl_reservation_status 
                        (reservation_reservation_id, reservation_status_status_id, reservation_active, reservation_users_id, reservation_updated_at) 
                        VALUES (:reservation_id, 7, 1, :user_id, NOW())
                    ";
                    
                    $insertStmt = $this->conn->prepare($insertSql);
                    $insertStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                    $insertStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                    
                    if (!$insertStmt->execute()) {
                        throw new Exception("Failed to insert status 7");
                    }
                    
                    // Second, update the original status_id 1 to active = 1
                    $updateSql = "
                        UPDATE tbl_reservation_status 
                        SET reservation_active = 1 
                        WHERE reservation_reservation_id = :reservation_id 
                        AND reservation_status_status_id = 1
                    ";
                    
                    $updateStmt = $this->conn->prepare($updateSql);
                    $updateStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                    
                    if (!$updateStmt->execute()) {
                        throw new Exception("Failed to update status 1 to active");
                    }
                    
                    // Department approvals are now inserted during reservation creation in faculty&staff.php
                   
                    
                    // Commit transaction
                    $this->conn->commit();
                    
                  
                    
                    // Check if reservation has department approval requirements and send push notifications
                    $hasDepartmentApproval = $this->hasDepartmentApproval($reservationId);
                    
                    if ($hasDepartmentApproval) {
                        
                        
                        // Get requester info for push notification logic
                        $reservationSql = "
                            SELECT 
                                r.reservation_user_id,
                                u.users_user_level_id,
                                u.users_department_id
                            FROM tbl_reservation r
                            LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                            WHERE r.reservation_id = :reservation_id
                        ";
                        $reservationStmt = $this->conn->prepare($reservationSql);
                        $reservationStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                        $reservationStmt->execute();
                        $reservationData = $reservationStmt->fetch(PDO::FETCH_ASSOC);
                        
                        if ($reservationData) {
                            $userLevelId = (int)$reservationData['users_user_level_id'];
                            $userDeptId = (int)$reservationData['users_department_id'];
                            
                            
                            
                            // Check if requester is level 5 (Department Head) or 6 (Secretary)
                            if ($userLevelId === 5 || $userLevelId === 6) {
                                // Level 5 or 6: Send notifications to ALL departments requiring approval
                                
                                $this->sendPushNotificationToDepartmentApproval($reservationId);
                            } else {
                                // NOT level 5 or 6: Only notify their own department first
                                
                                $this->sendPushNotificationToOwnDepartmentOnly($reservationId, $userDeptId);
                            }
                        } else {
                            
                            $this->sendPushNotificationToDepartmentApproval($reservationId);
                        }
                        
                       
                    } 
                    
                    return json_encode([
                        'status' => 'success', 
                        'message' => 'Reservation status updated to Process',
                        'status_inserted' => true,
                        'status_updated' => true,
                        'new_status_id' => 7
                    ]);
                    
                } catch (Exception $e) {
                    // Rollback transaction on error
                    $this->conn->rollBack();
                    
                    return json_encode(['status' => 'error', 'message' => 'Failed to update reservation status: ' . $e->getMessage()]);
                }
            } else {
                // Status is not pending, no action needed
                return json_encode([
                    'status' => 'success', 
                    'message' => 'No status update needed',
                    'current_status' => $currentStatus['status_master_name'],
                    'status_inserted' => false
                ]);
            }
            
        } catch (PDOException $e) {
            error_log('Database error in handleProcessed: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function fetchRequestReservation() {
        try {
            $sql = "
                SELECT 
                    r.reservation_id, 
                    r.reservation_created_at, 
                    r.reservation_title,
                    r.reservation_description,
                    r.reservation_start_date,
                    r.reservation_end_date,
                    -- reservation_participants moved to tbl_reservation_venue
                    r.reservation_user_id AS requester_id,
                    TRIM(
                        CONCAT(
                            COALESCE(t.abbreviation, ''),
                            CASE WHEN COALESCE(t.abbreviation, '') <> '' THEN ' ' ELSE '' END,
                            COALESCE(u.users_fname, ''),
                            CASE WHEN COALESCE(u.users_mname, '') <> '' THEN CONCAT(' ', u.users_mname) ELSE '' END,
                            CASE WHEN COALESCE(u.users_lname, '') <> '' THEN CONCAT(' ', u.users_lname) ELSE '' END,
                            CASE WHEN COALESCE(u.users_suffix, '') <> '' THEN CONCAT(', ', u.users_suffix) ELSE '' END
                        )
                    ) AS requester_name,
                    u.users_suffix AS requester_suffix,
                    t.abbreviation AS requester_title_abbreviation,
                    d.departments_name,
                    latest_status.reservation_status_status_id AS status_id,
                    latest_status.reservation_active AS active,
                    
                    -- Enhanced status logic
                    CASE 
                        -- If status is 7 (Admin Approved), show Process
                        WHEN latest_status.reservation_status_status_id = 7 THEN 'Processed'
                        
                        -- Default to the standard status master name
                        ELSE sm.status_master_name
                    END AS reservation_status,
                    
                    -- Add reservation type determination
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM tbl_reservation_vehicle rv 
                            WHERE rv.reservation_reservation_id = r.reservation_id
                        ) THEN 'Trip'
                        WHEN EXISTS (
                            SELECT 1 FROM tbl_reservation_venue rven 
                            WHERE rven.reservation_reservation_id = r.reservation_id
                        ) THEN 'Activity/Event'
                        WHEN EXISTS (
                            SELECT 1 FROM tbl_reservation_equipment re 
                            WHERE re.reservation_reservation_id = r.reservation_id
                        ) THEN 'EQ'
                        ELSE 'Unknown'
                    END AS reservation_type
                FROM 
                    tbl_reservation r
                LEFT JOIN 
                    tbl_users u ON r.reservation_user_id = u.users_id
                LEFT JOIN 
                    tbl_departments d ON u.users_department_id = d.departments_id
                LEFT JOIN 
                    titles t ON u.title_id = t.id
                -- Latest status subquery to get the most recent status
                LEFT JOIN (
                    SELECT rs1.*
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_status_id
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) rs2 ON rs1.reservation_reservation_id = rs2.reservation_reservation_id
                    AND rs1.reservation_status_id = rs2.max_status_id
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                LEFT JOIN 
                    tbl_status_master sm ON latest_status.reservation_status_status_id = sm.status_master_id
                WHERE
                    (
                        -- Show status 1, 3, 7, 8 (Pending, Approved, Admin Approved, Department Approval)
                        latest_status.reservation_status_status_id IN (1, 3, 7, 8, 10) 
                        AND latest_status.reservation_active IN (0, 1)
                    )
                    OR 
                    (
                        -- Show status 11 (Change Request) but exclude if it has cancelled or rescheduled statuses
                        latest_status.reservation_status_status_id = 11 
                        AND latest_status.reservation_active IN (0, 1)
                        AND NOT EXISTS (
                            SELECT 1 
                            FROM tbl_reservation_status rs_check_final
                            WHERE rs_check_final.reservation_reservation_id = r.reservation_id 
                            AND rs_check_final.reservation_status_status_id IN (2, 14)
                            AND rs_check_final.reservation_active = 1
                        )
                    )
                    OR 
                    (
                        -- Show status 6 (Completed) with active = 1 if it has a change request (status 11)
                        latest_status.reservation_status_status_id = 6 
                        AND latest_status.reservation_active = 1
                        AND EXISTS (
                            SELECT 1 
                            FROM tbl_reservation_status rs_change_request
                            WHERE rs_change_request.reservation_reservation_id = r.reservation_id 
                            AND rs_change_request.reservation_status_status_id = 11
                        )
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM tbl_reservation_status rs3
                        WHERE rs3.reservation_reservation_id = r.reservation_id
                        AND rs3.reservation_status_status_id = 2
                        AND rs3.reservation_active = 1
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM tbl_reservation_status rs4
                        WHERE rs4.reservation_reservation_id = r.reservation_id
                        AND rs4.reservation_status_status_id = 14
                        AND rs4.reservation_active = 1
                    )
    
                GROUP BY 
                    r.reservation_id
                ORDER BY 
                    r.reservation_created_at DESC;
            ";
    
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
    
            $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return json_encode(['status' => 'success', 'data' => $reservations]);
    
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateChangeReschedule($reservationId, $isAccepted, $userId) {
        try {
            $this->conn->beginTransaction();

            if ($isAccepted) {
                // ACCEPTED: Update reservation_active to 1 and insert status 14 with active 1
                $sqlUpdate = "
                    UPDATE tbl_reservation_status 
                    SET reservation_active = 1 
                    WHERE reservation_reservation_id = :reservation_id 
                    AND reservation_status_status_id = 11";
                
                $stmtUpdate = $this->conn->prepare($sqlUpdate);
                $stmtUpdate->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtUpdate->execute();

                // Insert new status: status_id 14 with active 1
                $sqlInsert14 = "
                    INSERT INTO tbl_reservation_status 
                    (reservation_reservation_id, reservation_status_status_id, reservation_active, reservation_updated_at, reservation_users_id) 
                    VALUES (:reservation_id, 14, 1, NOW(), :user_id)";
                
                $stmtInsert14 = $this->conn->prepare($sqlInsert14);
                $stmtInsert14->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtInsert14->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $stmtInsert14->execute();

                $statusText = 'accepted';
                $newStatusId = 14;
            } else {
                // REJECTED: Update reservation_active to 1 and insert status 2 with active 1
                $sqlUpdate = "
                    UPDATE tbl_reservation_status 
                    SET reservation_active = 1 
                    WHERE reservation_reservation_id = :reservation_id 
                    AND reservation_status_status_id = 11";
                
                $stmtUpdate = $this->conn->prepare($sqlUpdate);
                $stmtUpdate->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtUpdate->execute();

                // Insert new status: status_id 2 with active 1
                $sqlInsert2 = "
                    INSERT INTO tbl_reservation_status 
                    (reservation_reservation_id, reservation_status_status_id, reservation_active, reservation_updated_at, reservation_users_id) 
                    VALUES (:reservation_id, 2, 1, NOW(), :user_id)";
                
                $stmtInsert2 = $this->conn->prepare($sqlInsert2);
                $stmtInsert2->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtInsert2->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $stmtInsert2->execute();

                $statusText = 'rejected';
                $newStatusId = 2;
            }

            $this->conn->commit();

            // Add audit log entry
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) 
                           VALUES (:description, :action, NOW(), :created_by)";
                $auditStmt = $this->conn->prepare($auditSql);
                $description = "Reschedule request {$statusText} for reservation ID {$reservationId}";
                $action = "RESCHEDULE_" . strtoupper($statusText);
                $auditStmt->execute([
                    ':description' => $description,
                    ':action' => $action,
                    ':created_by' => $userId
                ]);
            } catch (Exception $e) {
                error_log("Audit log error in updateChangeReschedule: " . $e->getMessage());
            }

            return json_encode([
                'status' => 'success',
                'message' => "Reschedule request {$statusText} successfully",
                'reservation_id' => $reservationId,
                'new_status_id' => $newStatusId,
                'is_accepted' => $isAccepted
            ]);

        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Database error in updateChangeReschedule: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("General error in updateChangeReschedule: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Error processing reschedule request: ' . $e->getMessage()
            ]);
        }
    }

    // Send push notification ONLY to own department (for non-level 5/6 users)
    private function sendPushNotificationToOwnDepartmentOnly($reservationId, $requesterDepartmentId) {
        try {
            
            
            // Check if requester's own department requires approval
            $sqlCheckOwnDept = "SELECT department_approval_department_id 
                               FROM tbl_department_approval 
                               WHERE department_request_reservation_id = :reservation_id 
                               AND department_approval_department_id = :dept_id
                               AND department_is_approved = 0";
            $stmtCheck = $this->conn->prepare($sqlCheckOwnDept);
            $stmtCheck->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtCheck->bindParam(':dept_id', $requesterDepartmentId, PDO::PARAM_INT);
            $stmtCheck->execute();
            $ownDeptApproval = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            
            if (!$ownDeptApproval) {
               
                // If own department doesn't need approval, send to all departments
                $this->sendPushNotificationToDepartmentApproval($reservationId);
                return;
            }
            
           
            
            // Get reservation details for notification
            $sqlReservation = "SELECT r.reservation_title, 
                                    CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS requester_name
                             FROM tbl_reservation r
                             LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                             WHERE r.reservation_id = :reservation_id";
            $stmtReservation = $this->conn->prepare($sqlReservation);
            $stmtReservation->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtReservation->execute();
            $reservation = $stmtReservation->fetch(PDO::FETCH_ASSOC);
            
            if (!$reservation) {
                return;
            }
            
            // Get department heads (level 5) and deans (level 16) from the requester's own department
            $sqlDeptUsers = "SELECT 
                                u.users_id,
                                CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS full_name,
                                ps.subscription_id,
                                ps.endpoint,
                                ps.p256dh_key,
                                ps.auth_key,
                                d.departments_name
                            FROM tbl_users u
                            INNER JOIN tbl_push_subscriptions ps ON u.users_id = ps.user_id
                            LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                            WHERE u.users_department_id = :dept_id 
                            AND u.users_user_level_id IN (5, 16)
                            AND ps.is_active = 1";
            
            $stmtDeptUsers = $this->conn->prepare($sqlDeptUsers);
            $stmtDeptUsers->bindParam(':dept_id', $requesterDepartmentId, PDO::PARAM_INT);
            $stmtDeptUsers->execute();
            $deptUsers = $stmtDeptUsers->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($deptUsers)) {
                
                return;
            }
            
            
            
            // Prepare notification data
            $title = "Department Approval Required (Your Department)";
            $body = "A reservation '{$reservation['reservation_title']}' by {$reservation['requester_name']} from your department requires approval.";
            $data = [
                'reservation_id' => $reservationId,
                'type' => 'department_approval',
                'action_url' => '/gsd/grms/Department/ViewApproval',
                'priority' => 'own_department'
            ];
            
            // Use the existing sendPushNotificationToUser method
            $successCount = 0;
            $errorCount = 0;
            
            // Send push notification to department users in own department
            foreach ($deptUsers as $user) {
               
                
                $result = $this->sendPushNotificationToUser(
                    $user['users_id'],
                    $title,
                    $body,
                    $data
                );
                
                if ($result) {
                    $successCount++;
                    
                } else {
                    $errorCount++;
                }
            }
            
           
            
        } catch (Exception $e) {
            error_log("Exception in sendPushNotificationToOwnDepartmentOnly: " . $e->getMessage());
        }
    }

    // Check if reservation has department approval requirements
    private function hasDepartmentApproval($reservationId) {
        try {
           
            
            $sql = "SELECT COUNT(*) as count 
                    FROM tbl_department_approval 
                    WHERE department_request_reservation_id = :reservation_id 
                    AND department_is_approved = 0";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
           
            
            $hasApproval = $result['count'] > 0;
           
            
            return $hasApproval;
        } catch (PDOException $e) {
            error_log("Error checking department approval: " . $e->getMessage());
            return false;
        }
    }

    // Send push notification to department approval users
    private function sendPushNotificationToDepartmentApproval($reservationId) {
        try {
           
            // Get all department approvals for this reservation
            $sqlDeptApprovals = "SELECT department_approval_department_id 
                               FROM tbl_department_approval 
                               WHERE department_request_reservation_id = :reservation_id 
                               AND department_is_approved = 0";
            $stmtDeptApprovals = $this->conn->prepare($sqlDeptApprovals);
            $stmtDeptApprovals->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtDeptApprovals->execute();
            $deptApprovals = $stmtDeptApprovals->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($deptApprovals)) {
                return;
            }
            
         
            // Get reservation details for notification
            $sqlReservation = "SELECT r.reservation_title, 
                                    CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS requester_name
                             FROM tbl_reservation r
                             LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                             WHERE r.reservation_id = :reservation_id";
            $stmtReservation = $this->conn->prepare($sqlReservation);
            $stmtReservation->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtReservation->execute();
            $reservation = $stmtReservation->fetch(PDO::FETCH_ASSOC);
            
            if (!$reservation) {
                return;
            }
            
            $allDeptUsers = [];
            
            // Get users from each department that needs approval
            foreach ($deptApprovals as $deptApproval) {
                $deptId = $deptApproval['department_approval_department_id'];
                
                // Get department heads (level 5) and deans (level 16) from the department
                $sqlDeptUsers = "SELECT 
                                    u.users_id,
                                    CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS full_name,
                                    ps.subscription_id,
                                    ps.endpoint,
                                    ps.p256dh_key,
                                    ps.auth_key,
                                    d.departments_name
                                FROM tbl_users u
                                INNER JOIN tbl_push_subscriptions ps ON u.users_id = ps.user_id
                                LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                                WHERE u.users_department_id = :dept_id 
                                AND u.users_user_level_id IN (5, 16)
                                AND ps.is_active = 1";
                
                $stmtDeptUsers = $this->conn->prepare($sqlDeptUsers);
                $stmtDeptUsers->bindParam(':dept_id', $deptId, PDO::PARAM_INT);
                $stmtDeptUsers->execute();
                $deptUsers = $stmtDeptUsers->fetchAll(PDO::FETCH_ASSOC);
                
                $allDeptUsers = array_merge($allDeptUsers, $deptUsers);
            }
            
            if (empty($allDeptUsers)) {
               
                return;
            }
            
           
            
            // Prepare notification data
            $title = "Department Approval Required";
            $body = "A reservation '{$reservation['reservation_title']}' by {$reservation['requester_name']} requires your department's approval.";
            $data = [
                'reservation_id' => $reservationId,
                'type' => 'department_approval',
                'action_url' => '/gsd/grms/Department/ViewApproval'
            ];
            
            // Include push notification configuration
            require_once 'config/pushConfig.php';
            $pushUrl = getPushNotificationUrl();
            $successCount = 0;
            $errorCount = 0;
            
            // Send push notification to all department users
            foreach ($allDeptUsers as $user) {
                $pushData = [
                    'operation' => 'send',
                    'user_id' => $user['users_id'],
                    'title' => $title,
                    'body' => $body,
                    'data' => $data
                ];
                
               
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $pushUrl);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($pushData));
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Content-Length: ' . strlen(json_encode($pushData))
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                curl_close($ch);
                
               
                
                if ($error || $httpCode < 200 || $httpCode >= 300) {
                   
                    $errorCount++;
                } else {
                    
                    $successCount++;
                }
            }

            
            
            if ($successCount > 0) {
                
            }
            
            if ($errorCount > 0) {
                
            }
            
        } catch (Exception $e) {
            error_log("Error sending department approval notifications: " . $e->getMessage());
        }
    }

    // Send push notification to user
    private function sendPushNotificationToUser($userId, $title = 'Notification', $body = 'You have a new notification', $data = []) {
        try {
            // Include push notification configuration
            require_once __DIR__ . '/config/pushConfig.php';
            
            // Get push notification URL from configuration
            $pushNotificationUrl = getPushNotificationUrl();
            $postData = json_encode([
                'operation' => 'send',
                'user_id' => $userId,
                'title' => $title,
                'body' => $body,
                'data' => $data
            ]);
            
            // Use cURL to send push notification
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $pushNotificationUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen($postData)
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            
            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);
            
            // Handle cURL errors
            if ($curlError) {
                error_log("Push notification cURL error for user $userId: $curlError");
                return false;
            }
            
            // Handle HTTP error codes
            if ($httpCode < 200 || $httpCode >= 300 || $result === false) {
                error_log("Push notification HTTP error for user $userId (Code: $httpCode)");
                if ($result) {
                    error_log("Response: " . substr($result, 0, 200));
                }
                return false;
            }
            
            // Parse and validate successful response
            $response = json_decode($result, true);
            if ($response && isset($response['status']) && $response['status'] === 'success') {
            
                return true;
            } else {
                $failureMessage = "Push notification failed for user $userId";
                if ($response && isset($response['message'])) {
                    $failureMessage .= ": " . $response['message'];
                }
                error_log($failureMessage);
                return false;
            }
            
        } catch (Exception $e) {
            error_log("Exception in sendPushNotificationToUser: " . $e->getMessage());
            return false;
        }
    }
}

// Handle incoming requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $reservation = new Reservation();
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['operation'])) {
        switch ($data['operation']) {
            case "fetchAvailableDrivers":
                $restrictionIds = $data['restriction_ids'] ?? ($_POST['restriction_ids'] ?? null);
                echo $reservation->fetchAvailableDrivers($restrictionIds);
                break;

            case "updateChangeReschedule":
                $reservationId = $data['reservation_id'] ?? ($_POST['reservation_id'] ?? null);
                $isAccepted = $data['is_accepted'] ?? ($_POST['is_accepted'] ?? false);
                $userId = $data['user_id'] ?? ($_POST['user_id'] ?? null);
                
                if (!$reservationId || $userId === null) {
                    echo json_encode(['status' => 'error', 'message' => 'Reservation ID and User ID are required']);
                    break;
                }
                
                echo $reservation->updateChangeReschedule($reservationId, $isAccepted, $userId);
                break;

            case "fetchRequestReservation":
                echo $reservation->fetchRequestReservation(); 
                break;

            case "handleProcessed":
                $reservationId = $data['reservation_id'] ?? null;
                $userId = $data['user_id'] ?? null;
                
                if (!$reservationId || !$userId) {
                    echo json_encode(['status' => 'error', 'message' => 'Reservation ID and User ID are required']);
                    break;
                }
                
                echo $reservation->handleProcessed($reservationId, $userId);
                break;
    
            case "updateReservationReschedule":
                $reservation_id = $data['reservation_id'] ?? ($_POST['reservation_id'] ?? null);
                $reschedule_start_date = $data['reschedule_start_date'] ?? ($_POST['reschedule_start_date'] ?? null);
                $reschedule_end_date = $data['reschedule_end_date'] ?? ($_POST['reschedule_end_date'] ?? null);
                $user_admin_id = $data['user_admin_id'] ?? ($_POST['user_admin_id'] ?? null);
                $venue_ids = $data['venue_ids'] ?? ($_POST['venue_ids'] ?? null);
                $vehicle_ids = $data['vehicle_ids'] ?? ($_POST['vehicle_ids'] ?? null);
                
                
                
                if ($reservation_id === null || $reschedule_start_date === null || $reschedule_end_date === null) {
                    echo json_encode(['status' => 'error', 'message' => 'reservation_id, reschedule_start_date, and reschedule_end_date are required']);
                    break;
                }
                echo $reservation->updateReservationReschedule($reservation_id, $reschedule_start_date, $reschedule_end_date, $user_admin_id, $venue_ids, $vehicle_ids);
                break;

            case "updateVenueReschedule":
                $reservation_venue_id = $data['reservation_venue_id'] ?? ($_POST['reservation_venue_id'] ?? null);
                $reservation_change_venue_id = $data['reservation_change_venue_id'] ?? ($_POST['reservation_change_venue_id'] ?? null);
                if ($reservation_venue_id === null || $reservation_change_venue_id === null) {
                    echo json_encode(['status' => 'error', 'message' => 'reservation_venue_id and reservation_change_venue_id are required']);
                    break;
                }
                echo $reservation->updateVenueReschedule($reservation_venue_id, $reservation_change_venue_id);
                break;
    
            case "updateVehicleReschedule":
                $reservation_vehicle_id = $data['reservation_vehicle_id'] ?? ($_POST['reservation_vehicle_id'] ?? null);
                $reservation_change_vehicle_id = $data['reservation_change_vehicle_id'] ?? ($_POST['reservation_change_vehicle_id'] ?? null);
                if ($reservation_vehicle_id === null || $reservation_change_vehicle_id === null) {
                    echo json_encode(['status' => 'error', 'message' => 'reservation_vehicle_id and reservation_change_vehicle_id are required']);
                    break;
                }
                echo $reservation->updateVehicleReschedule($reservation_vehicle_id, $reservation_change_vehicle_id);
                break;

            case "fetchAvailableVenues":
                // Accept both camelCase and snake_case for flexibility
                $startDateTime = $data['startDateTime']
                    ?? $data['start_datetime']
                    ?? ($_POST['startDateTime'] ?? ($_POST['start_datetime'] ?? null));
                $endDateTime = $data['endDateTime']
                    ?? $data['end_datetime']
                    ?? ($_POST['endDateTime'] ?? ($_POST['end_datetime'] ?? null));
                
                // Handle exclude IDs - check multiple possible field names
                $excludeIds = $data['excludeIds']
                    ?? $data['exclude_ids']
                    ?? $data['excludedIds']
                    ?? $data['excluded_ids']
                    ?? $data['excludedids']
                    ?? ($_POST['excludeIds'] ?? ($_POST['exclude_ids'] ?? ($_POST['excludedIds'] ?? ($_POST['excluded_ids'] ?? ($_POST['excludedids'] ?? null)))));
                
                
                
                // Handle string conversion to array if needed
                if (!empty($excludeIds) && is_string($excludeIds)) {
                    // Remove any brackets and split by comma
                    $excludeIds = trim($excludeIds, '[]');
                    if (!empty($excludeIds)) {
                        $excludeIds = array_map('trim', explode(',', $excludeIds));
                        $excludeIds = array_filter($excludeIds, function($id) {
                            return !empty($id) && is_numeric($id);
                        });
                        $excludeIds = array_map('intval', $excludeIds);
                    } else {
                        $excludeIds = null;
                    }
                }
                
                // Final validation
                if ($startDateTime === null || $endDateTime === null) {
                    echo json_encode(['status' => 'error', 'message' => 'startDateTime and endDateTime are required']);
                    break;
                }
                
                // Method echoes JSON and sets headers internally
                $reservation->fetchAvailableVenues($startDateTime, $endDateTime, $excludeIds);
                break;

            case "fetchAvailableVehicles":
                    // Accept both camelCase and snake_case for flexibility
                    $startDateTime = $data['startDateTime']
                        ?? $data['start_datetime']
                        ?? ($_POST['startDateTime'] ?? ($_POST['start_datetime'] ?? null));
                    $endDateTime = $data['endDateTime']
                        ?? $data['end_datetime']
                        ?? ($_POST['endDateTime'] ?? ($_POST['end_datetime'] ?? null));
                    
                    // Handle exclude IDs - check multiple possible field names
                    $excludeIds = $data['excludeIds']
                        ?? $data['exclude_ids']
                        ?? $data['excludedIds']
                        ?? $data['excluded_ids']
                        ?? $data['excludedids']
                        ?? ($_POST['excludeIds'] ?? ($_POST['exclude_ids'] ?? ($_POST['excludedIds'] ?? ($_POST['excluded_ids'] ?? ($_POST['excludedids'] ?? null)))));
                    
                    // Log what we received for debugging
               
                    // Handle string conversion to array if needed
                    if (!empty($excludeIds) && is_string($excludeIds)) {
                        // Remove any brackets and split by comma
                        $excludeIds = trim($excludeIds, '[]');
                        if (!empty($excludeIds)) {
                            $excludeIds = array_map('trim', explode(',', $excludeIds));
                            $excludeIds = array_filter($excludeIds, function($id) {
                                return !empty($id) && is_numeric($id);
                            });
                            $excludeIds = array_map('intval', $excludeIds);
                        } else {
                            $excludeIds = null;
                        }
                    }
                    
                    // Final validation
                    if ($startDateTime === null || $endDateTime === null) {
                        echo json_encode(['status' => 'error', 'message' => 'startDateTime and endDateTime are required']);
                        break;
                    }
                    
                    // Method echoes JSON and sets headers internally
                    $reservation->fetchAvailableVehicles($startDateTime, $endDateTime, $excludeIds);
                    break;
            case "fetchRequestById":
                $reservationId = $data['reservation_id'] ?? null;
                if ($reservationId === null) {
                    echo json_encode(['status' => 'error', 'message' => 'Reservation ID is required']);
                    break;
                }
                echo $reservation->fetchRequestById($reservationId); 
                break;

            case "fetchEquipments":
                $startDateTime = $data['startDateTime'] ?? null;
                $endDateTime = $data['endDateTime'] ?? null;
                $reservation->fetchEquipments($startDateTime, $endDateTime);
                break;

            case "doubleCheckAvailability":
                $startDateTime = $data['start_datetime'] ?? null;
                $endDateTime = $data['end_datetime'] ?? null;
                $reservationId = $data['reservation_id'] ?? null;
                if ($startDateTime === null || $endDateTime === null) {
                    echo json_encode(['status' => 'error', 'message' => 'Start and end datetime are required']);
                    break;
                }
                echo $reservation->doubleCheckAvailability($startDateTime, $endDateTime, $reservationId);
                break;
            case "fetchAvailability":
                $itemType = $data['itemType'] ?? '';
                $itemId = $data['itemId'] ?? [];
                $quantities = $data['quantity'] ?? [];
                
                // Initialize empty array for quantities if not dealing with equipment
                $inputQuantities = [];
                if ($itemType === 'equipment' && !empty($quantities)) {
                    // Only create the combined array if we have quantities
                    $inputQuantities = array_combine($itemId, $quantities);
                }        
                echo $reservation->fetchAvailability($itemType, $itemId, $inputQuantities);
                break;

            case "validateConflictingReservationsStatus":
                $reservationIds = $data['reservation_ids'] ?? [];
                if (empty($reservationIds)) {
                    echo json_encode(['status' => 'error', 'message' => 'Reservation IDs are required']);
                    break;
                }
                echo $reservation->validateConflictingReservationsStatus($reservationIds);
                break;

            case "filterActiveConflicts":
                $conflictingReservations = $data['conflicting_reservations'] ?? [];
                if (empty($conflictingReservations)) {
                    echo json_encode(['status' => 'error', 'message' => 'Conflicting reservations data is required']);
                    break;
                }
                echo $reservation->filterActiveConflicts($conflictingReservations);
                break;
          

            default:
                echo json_encode(['status' => 'error', 'message' => 'Invalid operation.']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No operation specified.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
}
