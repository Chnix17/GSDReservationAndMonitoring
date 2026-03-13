<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS, GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

class User {
    private $conn;

    public function __construct() {
        include 'connection-pdo.php';
        $this->conn = $conn;
    }

    private function executeQuery($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    // Check if a personnel/user has an active push subscription
    private function hasActiveSubscription($userId) {
        try {
            $sql = "SELECT 1 FROM tbl_push_subscriptions WHERE user_id = :uid AND is_active = 1 LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['uid' => $userId]);
            return (bool)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log('hasActiveSubscription error: ' . $e->getMessage());
            return false;
        }
    }

    // Send a test reminder push using existing send-push-notification.php endpoint
    public function sendTestReminder($personnel_id) {
        if (!$personnel_id) {
            return json_encode(['status' => 'error', 'message' => 'Personnel ID is required']);
        }

        // Verify active subscription first
        if (!$this->hasActiveSubscription($personnel_id)) {
            return json_encode(['status' => 'error', 'message' => 'No active push subscription for this personnel']);
        }

        // Prepare payload
        $payload = [
            'operation' => 'send',
            'user_id'   => (int)$personnel_id,
            'title'     => 'GSD Reminder (Test)',
            'body'      => 'This is a 1-minute test reminder. If you see this, push works.',
            'data'      => [
                'url' => '/ViewRequest',
            ],
        ];

        // Call the existing push sender via HTTP to avoid including its request handler
        // Use the same API base URL structure as the main application
        // Include push notification configuration
        require_once __DIR__ . '/config/pushConfig.php';
        
        // Get push notification URL from configuration
        $url = getPushNotificationUrl();
        // $url = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/server/send-push-notification.php';

        try {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($response === false) {
                $err = curl_error($ch);
                curl_close($ch);
                return json_encode(['status' => 'error', 'message' => 'cURL error: ' . $err]);
            }
            curl_close($ch);

            // Pass through the sender response
            if ($httpCode >= 200 && $httpCode < 300) {
                return json_encode(['status' => 'success', 'message' => 'Test reminder sent', 'sender_response' => json_decode($response, true)]);
            }
            return json_encode(['status' => 'error', 'message' => 'Push sender HTTP ' . $httpCode, 'sender_response' => $response]);
        } catch (Exception $e) {
            return json_encode(['status' => 'error', 'message' => 'Exception: ' . $e->getMessage()]);
        }
    }

    public function fetchAssignedRelease($personnel_id) {
        if (!$personnel_id) {
            return json_encode(['status' => 'error', 'message' => 'Personnel ID is required']);
        }

        try {
            $reservations = [];

            // 1) Venue data - Use 3-step approach to avoid duplicates
            // Step 1a: Get reservation IDs where this personnel has venue checklists
            $sqlResIdsVenue = "
                SELECT DISTINCT rv.reservation_reservation_id
                FROM tbl_reservation_checklist_venue rc
                INNER JOIN tbl_reservation_venue rv ON rc.reservation_venue_id = rv.reservation_venue_id
                INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                INNER JOIN tbl_reservation_status rs ON r.reservation_id = rs.reservation_reservation_id
                    AND rs.reservation_active = 1
                WHERE rc.personnel_id = :personnel_id
                  AND (rs.reservation_status_status_id IN (2, 4, 5, 6, 10) OR rs.reservation_status_status_id = 14)
            ";
            $stmtResIdsVenue = $this->conn->prepare($sqlResIdsVenue);
            $stmtResIdsVenue->execute(['personnel_id' => $personnel_id]);
            $reservationIdsVenue = $stmtResIdsVenue->fetchAll(PDO::FETCH_COLUMN);
            
            $venueData = [];
            if (!empty($reservationIdsVenue)) {
                $resIdPlaceholdersVenue = implode(',', array_fill(0, count($reservationIdsVenue), '?'));
                
                // Step 1b: Get ALL venues for those reservations
                // FIX: Use CASE to return change_venue_id if rescheduled, and grab only the MAX active status to prevent duplicates
                $sqlVenues = "
                    SELECT DISTINCT
                        rv.reservation_reservation_id,
                        rv.reservation_venue_id,
                        CASE 
                            WHEN rs.reservation_status_status_id IN (6, 10, 14) AND rv.reservation_change_venue_id IS NOT NULL 
                            THEN rv.reservation_change_venue_id 
                            ELSE rv.reservation_venue_venue_id 
                        END AS reservation_venue_venue_id,
                        rv.reservation_change_venue_id,
                        rv.reservation_participants,
                        rv.active AS venue_active,
                        CASE 
                            WHEN rs.reservation_status_status_id IN (6, 10, 14) AND rv.reservation_change_venue_id IS NOT NULL 
                            THEN cv.ven_name 
                            ELSE v.ven_name 
                        END AS venue_name,
                        CASE 
                            WHEN rs.reservation_status_status_id IN (6, 10, 14) AND rv.reservation_change_venue_id IS NOT NULL 
                            THEN cvb.venue_building_name 
                            ELSE vb.venue_building_name 
                        END AS venue_building_name,
                        CASE 
                            WHEN rs.reservation_status_status_id IN (6, 10, 14) AND rv.reservation_change_venue_id IS NOT NULL 
                            THEN ctsa.status_availability_name 
                            ELSE tsa.status_availability_name 
                        END AS venue_availability_status_name
                    FROM tbl_reservation_venue rv
                    INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                    INNER JOIN (
                        SELECT rs1.reservation_reservation_id, rs1.reservation_status_status_id
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_status_id) AS latest_status_id
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) rs2 ON rs1.reservation_reservation_id = rs2.reservation_reservation_id AND rs1.reservation_status_id = rs2.latest_status_id
                        WHERE rs1.reservation_active = 1
                    ) rs ON r.reservation_id = rs.reservation_reservation_id
                    LEFT JOIN tbl_venue v ON rv.reservation_venue_venue_id = v.ven_id
                    LEFT JOIN tbl_venue_building vb ON v.venue_building_id = vb.venue_building_id
                    LEFT JOIN tbl_venue cv ON rv.reservation_change_venue_id = cv.ven_id
                    LEFT JOIN tbl_venue_building cvb ON cv.venue_building_id = cvb.venue_building_id
                    LEFT JOIN tbl_status_availability tsa ON v.status_availability_id = tsa.status_availability_id
                    LEFT JOIN tbl_status_availability ctsa ON cv.status_availability_id = ctsa.status_availability_id
                    WHERE rv.reservation_reservation_id IN ($resIdPlaceholdersVenue)
                ";
                $stmtVenues = $this->conn->prepare($sqlVenues);
                $stmtVenues->execute($reservationIdsVenue);
                $venues = $stmtVenues->fetchAll(PDO::FETCH_ASSOC);
                
                // Step 1c: Get checklists for those venues
                $sqlVenueChecklists = "
                    SELECT
                        rc.reservation_venue_id,
                        rc.checklist_venue_id,
                        rc.reservation_checklist_venue_id,
                        rc.isChecked,
                        cvm.checklist_name,
                        CASE 
                            WHEN rc.isChecked = 1 AND rc.personnel_id IS NOT NULL THEN rc.personnel_id
                            ELSE rc.admin_id
                        END AS assigned_by_id,
                        CASE 
                            WHEN rc.isChecked = 1 AND rc.personnel_id IS NOT NULL THEN
                                TRIM(CONCAT_WS(' ', NULLIF(tp.abbreviation, ''), up.users_fname, NULLIF(up.users_mname, ''), up.users_lname, NULLIF(up.users_suffix, '')))
                            ELSE
                                TRIM(CONCAT_WS(' ', NULLIF(ta.abbreviation, ''), ua.users_fname, NULLIF(ua.users_mname, ''), ua.users_lname, NULLIF(ua.users_suffix, '')))
                        END AS assigned_by_full_name
                    FROM tbl_reservation_checklist_venue rc
                    LEFT JOIN tbl_checklist_venue_master cvm ON rc.checklist_venue_id = cvm.checklist_venue_id
                    LEFT JOIN tbl_users ua ON rc.admin_id = ua.users_id
                    LEFT JOIN titles ta ON ua.title_id = ta.id
                    LEFT JOIN tbl_users up ON rc.personnel_id = up.users_id
                    LEFT JOIN titles tp ON up.title_id = tp.id
                    WHERE rc.reservation_venue_id IN (
                        SELECT rv2.reservation_venue_id 
                        FROM tbl_reservation_venue rv2 
                        WHERE rv2.reservation_reservation_id IN ($resIdPlaceholdersVenue)
                    )
                ";
                $stmtVenueChecklists = $this->conn->prepare($sqlVenueChecklists);
                $stmtVenueChecklists->execute($reservationIdsVenue);
                $venueChecklists = $stmtVenueChecklists->fetchAll(PDO::FETCH_ASSOC);
                
                // Merge venues with their checklists
                foreach ($venues as $venue) {
                    $checklists = array_filter($venueChecklists, function($c) use ($venue) {
                        return $c['reservation_venue_id'] == $venue['reservation_venue_id'];
                    });
                    
                    $venueData[] = array_merge($venue, [
                        'checklists' => array_values($checklists)
                    ]);
                }
            }

            // 2a) Get reservation IDs where this personnel has vehicle checklists
            $sqlResIds = "
                SELECT DISTINCT rv.reservation_reservation_id
                FROM tbl_reservation_checklist_vehicle rc
                INNER JOIN tbl_reservation_vehicle rv ON rc.reservation_vehicle_id = rv.reservation_vehicle_id
                INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                INNER JOIN tbl_reservation_status rs ON r.reservation_id = rs.reservation_reservation_id
                    AND rs.reservation_active = 1
                WHERE rc.personnel_id = :personnel_id
                  AND (rs.reservation_status_status_id IN (2, 4, 5, 6, 10) OR rs.reservation_status_status_id = 14)
            ";
            $stmtResIds = $this->conn->prepare($sqlResIds);
            $stmtResIds->execute(['personnel_id' => $personnel_id]);
            $reservationIds = $stmtResIds->fetchAll(PDO::FETCH_COLUMN);
            
            $vehicleData = [];
            if (!empty($reservationIds)) {
                $resIdPlaceholders = implode(',', array_fill(0, count($reservationIds), '?'));
                
                // 2b) Get ALL vehicles for those reservations
                // FIX: Use CASE to return change_vehicle_id if rescheduled, and grab only MAX active status
                $sqlVehicles = "
                    SELECT DISTINCT
                        rv.reservation_reservation_id,
                        rv.reservation_vehicle_id,
                        CASE 
                            WHEN rs.reservation_status_status_id IN (6, 10, 14) AND rv.reservation_change_vehicle_id IS NOT NULL 
                            THEN rv.reservation_change_vehicle_id 
                            ELSE rv.reservation_vehicle_vehicle_id 
                        END AS reservation_vehicle_vehicle_id,
                        rv.reservation_change_vehicle_id,
                        rv.active AS vehicle_active,
                        CASE 
                            WHEN rs.reservation_status_status_id IN (6, 10, 14) AND rv.reservation_change_vehicle_id IS NOT NULL 
                            THEN cv.vehicle_license 
                            ELSE vm.vehicle_license 
                        END AS vehicle_license,
                        CASE 
                            WHEN rs.reservation_status_status_id IN (6, 10, 14) AND rv.reservation_change_vehicle_id IS NOT NULL 
                            THEN cv.vehicle_model_id 
                            ELSE vm.vehicle_model_id 
                        END AS vehicle_model_id,
                        CASE 
                            WHEN rs.reservation_status_status_id IN (6, 10, 14) AND rv.reservation_change_vehicle_id IS NOT NULL 
                            THEN ctsa.status_availability_name 
                            ELSE tsa.status_availability_name 
                        END AS vehicle_availability_status_name
                    FROM tbl_reservation_vehicle rv
                    INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                    INNER JOIN (
                        SELECT rs1.reservation_reservation_id, rs1.reservation_status_status_id
                        FROM tbl_reservation_status rs1
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_status_id) AS latest_status_id
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) rs2 ON rs1.reservation_reservation_id = rs2.reservation_reservation_id AND rs1.reservation_status_id = rs2.latest_status_id
                        WHERE rs1.reservation_active = 1
                    ) rs ON r.reservation_id = rs.reservation_reservation_id
                    LEFT JOIN tbl_vehicle vm ON rv.reservation_vehicle_vehicle_id = vm.vehicle_id
                    LEFT JOIN tbl_vehicle cv ON rv.reservation_change_vehicle_id = cv.vehicle_id
                    LEFT JOIN tbl_status_availability tsa ON vm.status_availability_id = tsa.status_availability_id
                    LEFT JOIN tbl_status_availability ctsa ON cv.status_availability_id = ctsa.status_availability_id
                    WHERE rv.reservation_reservation_id IN ($resIdPlaceholders)
                ";
                $stmtVehicles = $this->conn->prepare($sqlVehicles);
                $stmtVehicles->execute($reservationIds);
                $vehicles = $stmtVehicles->fetchAll(PDO::FETCH_ASSOC);
                
                // 2c) Get checklists for those vehicles
                $sqlChecklists = "
                    SELECT
                        rc.reservation_vehicle_id,
                        rc.checklist_vehicle_id,
                        rc.reservation_checklist_vehicle_id,
                        rc.isChecked,
                        cvm.checklist_name,
                        CASE 
                            WHEN rc.isChecked = 1 AND rc.personnel_id IS NOT NULL THEN rc.personnel_id
                            ELSE rc.admin_id
                        END AS assigned_by_id,
                        CASE 
                            WHEN rc.isChecked = 1 AND rc.personnel_id IS NOT NULL THEN
                                TRIM(CONCAT_WS(' ', NULLIF(tp.abbreviation, ''), up.users_fname, NULLIF(up.users_mname, ''), up.users_lname, NULLIF(up.users_suffix, '')))
                            ELSE
                                TRIM(CONCAT_WS(' ', NULLIF(ta.abbreviation, ''), ua.users_fname, NULLIF(ua.users_mname, ''), ua.users_lname, NULLIF(ua.users_suffix, '')))
                        END AS assigned_by_full_name
                    FROM tbl_reservation_checklist_vehicle rc
                    LEFT JOIN tbl_checklist_vehicle_master cvm ON rc.checklist_vehicle_id = cvm.checklist_vehicle_id
                    LEFT JOIN tbl_users ua ON rc.admin_id = ua.users_id
                    LEFT JOIN titles ta ON ua.title_id = ta.id
                    LEFT JOIN tbl_users up ON rc.personnel_id = up.users_id
                    LEFT JOIN titles tp ON up.title_id = tp.id
                    WHERE rc.reservation_vehicle_id IN (
                        SELECT rv2.reservation_vehicle_id 
                        FROM tbl_reservation_vehicle rv2 
                        WHERE rv2.reservation_reservation_id IN ($resIdPlaceholders)
                    )
                ";
                $stmtChecklists = $this->conn->prepare($sqlChecklists);
                $stmtChecklists->execute($reservationIds);
                $checklists = $stmtChecklists->fetchAll(PDO::FETCH_ASSOC);
                
                // 2d) Get drivers for those vehicles
                $sqlDrivers = "
                    SELECT 
                        rd.reservation_driver_id,
                        rd.reservation_driver_user_id,
                        rd.reservation_vehicle_id,
                        rd.driver_name,
                        rd.created_at,
                        rd.updated_at,
                        u.users_fname,
                        u.users_mname,
                        u.users_lname,
                        u.users_suffix
                    FROM tbl_reservation_driver rd
                    JOIN tbl_reservation_vehicle rv ON rd.reservation_vehicle_id = rv.reservation_vehicle_id
                    LEFT JOIN tbl_users u ON rd.reservation_driver_user_id = u.users_id
                    WHERE rv.reservation_reservation_id IN ($resIdPlaceholders)
                ";
                $stmtDrivers = $this->conn->prepare($sqlDrivers);
                $stmtDrivers->execute($reservationIds);
                $drivers = $stmtDrivers->fetchAll(PDO::FETCH_ASSOC);
                
                // Merge vehicles with their checklists and drivers
                foreach ($vehicles as $vehicle) {
                    $vehicleChecklists = array_filter($checklists, function($c) use ($vehicle) {
                        return $c['reservation_vehicle_id'] == $vehicle['reservation_vehicle_id'];
                    });
                    
                    $vehicleDrivers = array_filter($drivers, function($d) use ($vehicle) {
                        return $d['reservation_vehicle_id'] == $vehicle['reservation_vehicle_id'];
                    });
                    
                    // Format driver data
                    $formattedDrivers = [];
                    foreach ($vehicleDrivers as $driver) {
                        $displayName = !empty($driver['driver_name']) 
                            ? $driver['driver_name'] 
                            : trim($driver['users_fname'] . ' ' . $driver['users_mname'] . ' ' . $driver['users_lname']);
                        
                        $formattedDrivers[] = [
                            'reservation_driver_id' => $driver['reservation_driver_id'],
                            'driver_id' => $driver['reservation_driver_user_id'],
                            'driver_name' => $displayName,
                            'reservation_vehicle_id' => $driver['reservation_vehicle_id'],
                            'created_at' => $driver['created_at'],
                            'updated_at' => $driver['updated_at']
                        ];
                    }
                    
                    $vehicleData[] = array_merge($vehicle, [
                        'checklists' => array_values($vehicleChecklists),
                        'drivers' => array_values($formattedDrivers)
                    ]);
                }
            }

            // 3) Equipment checklist items with availability status name
            // FIX: Applied MAX status subquery to prevent duplication
            $sqlEquipment = "
                SELECT DISTINCT
                    rc_equipment.checklist_equipment_id,
                    rc_equipment.reservation_checklist_equipment_id,
                    rc_equipment.isChecked AS equipment_isChecked,
                    re.reservation_reservation_id,
                    re.reservation_equipment_id,
                    re.reservation_equipment_equip_id,
                    re.reservation_equipment_quantity AS quantity,
                    COALESCE(re.release_quantity, 0) AS release_quantity,
                    re.active AS equipment_active,
                    e.equip_name,
                    e.equip_type,
                    cvce.checklist_name AS checklist_equipment_name,
                    eq.quantity_id,
                    tsa.status_availability_name AS equipment_availability_status_name,
                    CASE 
                        WHEN rc_equipment.isChecked = 1 AND rc_equipment.personnel_id IS NOT NULL THEN rc_equipment.personnel_id
                        ELSE rc_equipment.admin_id
                    END AS assigned_by_id,
                    CASE 
                        WHEN rc_equipment.isChecked = 1 AND rc_equipment.personnel_id IS NOT NULL THEN
                            TRIM(CONCAT_WS(' ',
                                NULLIF(tp.abbreviation, ''),
                                up.users_fname,
                                NULLIF(up.users_mname, ''),
                                up.users_lname,
                                NULLIF(up.users_suffix, '')
                            ))
                        ELSE
                            TRIM(CONCAT_WS(' ',
                                NULLIF(ta.abbreviation, ''),
                                ua.users_fname,
                                NULLIF(ua.users_mname, ''),
                                ua.users_lname,
                                NULLIF(ua.users_suffix, '')
                            ))
                    END AS assigned_by_full_name
                FROM tbl_reservation_checklist_equipment rc_equipment
                INNER JOIN tbl_reservation_equipment re
                    ON rc_equipment.reservation_equipment_id = re.reservation_equipment_id
                LEFT JOIN tbl_equipments e
                    ON re.reservation_equipment_equip_id = e.equip_id
                LEFT JOIN tbl_checklist_equipment_master cvce
                    ON rc_equipment.checklist_equipment_id = cvce.checklist_equipment_id
                INNER JOIN tbl_reservation r
                    ON re.reservation_reservation_id = r.reservation_id
                INNER JOIN (
                    SELECT rs1.reservation_reservation_id, rs1.reservation_status_status_id
                    FROM tbl_reservation_status rs1
                    INNER JOIN (
                        SELECT reservation_reservation_id, MAX(reservation_status_id) AS latest_status_id
                        FROM tbl_reservation_status
                        GROUP BY reservation_reservation_id
                    ) rs2 ON rs1.reservation_reservation_id = rs2.reservation_reservation_id AND rs1.reservation_status_id = rs2.latest_status_id
                    WHERE rs1.reservation_active = 1
                ) rs ON r.reservation_id = rs.reservation_reservation_id
                -- JOIN to get equipment quantity and availability status
                LEFT JOIN tbl_equipment_quantity eq
                    ON re.reservation_equipment_equip_id = eq.equip_id
                LEFT JOIN tbl_status_availability tsa
                    ON eq.status_availability_id = tsa.status_availability_id
                -- JOIN to get admin full name (who assigned)
                LEFT JOIN tbl_users ua
                    ON rc_equipment.admin_id = ua.users_id
                LEFT JOIN titles ta
                    ON ua.title_id = ta.id
                -- JOIN to get personnel full name (who checked)
                LEFT JOIN tbl_users up
                    ON rc_equipment.personnel_id = up.users_id
                LEFT JOIN titles tp
                    ON up.title_id = tp.id
                WHERE rc_equipment.personnel_id = :personnel_id
                  AND (rs.reservation_status_status_id IN (4, 5, 6, 10) OR rs.reservation_status_status_id = 14)
            ";
            $stmtEquipment = $this->conn->prepare($sqlEquipment);
            $stmtEquipment->execute(['personnel_id' => $personnel_id]);
            $equipmentData = $stmtEquipment->fetchAll(PDO::FETCH_ASSOC);

            // Process each resource type separately to avoid field conflicts
            // Process VENUE data (already merged with checklists)
            foreach ($venueData as $row) {
                $rid = $row['reservation_reservation_id'];
                if (!isset($reservations[$rid])) {
                    $reservations[$rid] = [
                        'reservation_id'          => $rid,
                        'reservation_title'       => '',
                        'reservation_description' => '',
                        'reservation_user_id'     => '',
                        'user_details'            => [],
                        'venues'                  => [],
                        'vehicles'                => [],
                        'equipments'              => [],
                    ];
                }
                
                // Format checklists properly
                $formattedChecklists = [];
                if (isset($row['checklists']) && is_array($row['checklists'])) {
                    foreach ($row['checklists'] as $checklist) {
                        $formattedChecklists[] = [
                            'checklist_venue_id'             => $checklist['checklist_venue_id'] ?? null,
                            'reservation_checklist_venue_id' => $checklist['reservation_checklist_venue_id'] ?? null,
                            'checklist_name'                 => $checklist['checklist_name'] ?? null,
                            'isChecked'                      => (int)($checklist['isChecked'] ?? 0),
                            'assigned_by_id'                 => $checklist['assigned_by_id'] ?? null,
                            'assigned_by'                    => $checklist['assigned_by_full_name'] ?? null
                        ];
                    }
                }
                
                $reservations[$rid]['venues'][] = [
                    'reservation_venue_id'       => $row['reservation_venue_id'],
                    'reservation_venue_venue_id' => $row['reservation_venue_venue_id'],
                    'name'                       => $row['venue_name'],
                    'building_name'              => $row['venue_building_name'] ?? null,
                    'participants'               => $row['reservation_participants'],
                    'availability_status'        => $row['venue_availability_status_name'],
                    'active'                     => (int)$row['venue_active'],
                    'checklists'                 => $formattedChecklists
                ];
            }
            
            // Process VEHICLE data (already merged with checklists)
            foreach ($vehicleData as $row) {
                $rid = $row['reservation_reservation_id'];
                if (!isset($reservations[$rid])) {
                    $reservations[$rid] = [
                        'reservation_id'          => $rid,
                        'reservation_title'       => '',
                        'reservation_description' => '',
                        'reservation_user_id'     => '',
                        'user_details'            => [],
                        'venues'                  => [],
                        'vehicles'                => [],
                        'equipments'              => [],
                    ];
                }
                
                // Format checklists properly
                $formattedChecklists = [];
                if (isset($row['checklists']) && is_array($row['checklists'])) {
                    foreach ($row['checklists'] as $checklist) {
                        $formattedChecklists[] = [
                            'checklist_vehicle_id'             => $checklist['checklist_vehicle_id'] ?? null,
                            'reservation_checklist_vehicle_id' => $checklist['reservation_checklist_vehicle_id'] ?? null,
                            'checklist_name'                   => $checklist['checklist_name'] ?? null,
                            'isChecked'                        => (int)($checklist['isChecked'] ?? 0),
                            'assigned_by_id'                   => $checklist['assigned_by_id'] ?? null,
                            'assigned_by'                      => $checklist['assigned_by_full_name'] ?? null
                        ];
                    }
                }
                
                // Format drivers properly
                $formattedDrivers = [];
                if (isset($row['drivers']) && is_array($row['drivers'])) {
                    foreach ($row['drivers'] as $driver) {
                        $formattedDrivers[] = [
                            'reservation_driver_id'   => $driver['reservation_driver_id'] ?? null,
                            'driver_id'               => $driver['driver_id'] ?? null,
                            'driver_name'             => $driver['driver_name'] ?? null,
                            'reservation_vehicle_id'  => $driver['reservation_vehicle_id'] ?? null,
                            'created_at'              => $driver['created_at'] ?? null,
                            'updated_at'              => $driver['updated_at'] ?? null
                        ];
                    }
                }
                
                $reservations[$rid]['vehicles'][] = [
                    'reservation_vehicle_id'         => $row['reservation_vehicle_id'],
                    'reservation_vehicle_vehicle_id' => $row['reservation_vehicle_vehicle_id'],
                    'vehicle_license'                => $row['vehicle_license'],
                    'vehicle_model_id'               => $row['vehicle_model_id'],
                    'availability_status'            => $row['vehicle_availability_status_name'],
                    'active'                         => (int)$row['vehicle_active'],
                    'checklists'                     => $formattedChecklists,
                    'drivers'                        => $formattedDrivers
                ];
            }
            
            // Process EQUIPMENT data
            foreach ($equipmentData as $row) {
                $rid = $row['reservation_reservation_id'];
                if (!isset($reservations[$rid])) {
                    $reservations[$rid] = [
                        'reservation_id'          => $rid,
                        'reservation_title'       => '',
                        'reservation_description' => '',
                        'reservation_user_id'     => '',
                        'user_details'            => [],
                        'venues'                  => [],
                        'vehicles'                => [],
                        'equipments'              => [],
                    ];
                }
                // EQUIPMENT processing
                if (isset($row['reservation_equipment_id'])) {
                    $found = false;
                    foreach ($reservations[$rid]['equipments'] as &$e) {
                        if ($e['reservation_equipment_id'] == $row['reservation_equipment_id']) {
                            $checklistExists = false;
                            foreach ($e['checklists'] as $checklist) {
                                if ($checklist['reservation_checklist_equipment_id'] == $row['reservation_checklist_equipment_id']) {
                                    $checklistExists = true;
                                    break;
                                }
                            }
                            if (!$checklistExists) {
                                $e['checklists'][] = [
                                    'checklist_equipment_id'             => $row['checklist_equipment_id'],
                                    'reservation_checklist_equipment_id' => $row['reservation_checklist_equipment_id'],
                                    'checklist_name'                     => $row['checklist_equipment_name'],
                                    'isChecked'                          => (int)$row['equipment_isChecked'],
                                    'assigned_by_id'                     => $row['assigned_by_id'] ?? null,
                                    'assigned_by'                        => $row['assigned_by_full_name'] ?? null
                                ];
                            }
                            $found = true;
                            break;
                        }
                    }
                    if (!$found) {
                        $reservations[$rid]['equipments'][] = [
                            'reservation_equipment_id'       => $row['reservation_equipment_id'],
                            'reservation_equipment_equip_id' => $row['reservation_equipment_equip_id'],
                            'name'                           => $row['equip_name'],
                            'equip_type'                     => $row['equip_type'],
                            'quantity'                       => (int)$row['quantity'],
                            'release_quantity'               => (int)($row['release_quantity'] ?? 0),
                            'quantity_id'                    => $row['quantity_id'],
                            'units'                          => [], // will fill below
                            'availability_status'            => $row['equipment_availability_status_name'],
                            'active'                         => (int)$row['equipment_active'],
                            'checklists'                     => [[
                                'checklist_equipment_id'             => $row['checklist_equipment_id'],
                                'reservation_checklist_equipment_id' => $row['reservation_checklist_equipment_id'],
                                'checklist_name'                     => $row['checklist_equipment_name'],
                                'isChecked'                          => (int)$row['equipment_isChecked'],
                                'assigned_by_id'                     => $row['assigned_by_id'] ?? null,
                                'assigned_by'                        => $row['assigned_by_full_name'] ?? null
                            ]]
                        ];
                    }
                }
            }

            // 4) Fetch & merge reservation units
            $allEqIds = [];
            foreach ($reservations as $res) {
                foreach ($res['equipments'] as $eq) {
                    $allEqIds[] = $eq['reservation_equipment_id'];
                }
            }

            if (!empty($allEqIds)) {
                $placeholders = implode(',', array_fill(0, count($allEqIds), '?'));
                $sqlUnits = "
                    SELECT
                        ru.reservation_unit_id,
                        ru.reservation_equipment_id,
                        ru.unit_id,
                        ru.active AS unit_active,
                        eu.serial_number AS unit_serial_number,
                        eu.equipment_brand,
                        eu.equipment_model,
                        eu.inch,
                        tsa.status_availability_name AS unit_availability_status_name
                    FROM tbl_reservation_unit ru
                    LEFT JOIN tbl_equipment_unit eu
                        ON ru.unit_id = eu.unit_id
                    LEFT JOIN tbl_status_availability tsa
                        ON eu.status_availability_id = tsa.status_availability_id
                    WHERE ru.reservation_equipment_id IN ($placeholders)
                ";
                $stmtUnits = $this->conn->prepare($sqlUnits);
                $stmtUnits->execute($allEqIds);
                $unitsData = $stmtUnits->fetchAll(PDO::FETCH_ASSOC);

                // group by reservation_equipment_id
                $unitsByResEquip = [];
                foreach ($unitsData as $u) {
                    $unitsByResEquip[$u['reservation_equipment_id']][] = [
                        'reservation_unit_id' => $u['reservation_unit_id'],
                        'unit_id'             => $u['unit_id'],
                        'unit_serial_number'  => $u['unit_serial_number'],
                        'equipment_brand'     => $u['equipment_brand'],
                        'equipment_model'     => $u['equipment_model'],
                        'inch'                => $u['inch'],
                        'availability_status' => $u['unit_availability_status_name'],
                        'active'              => (int)$u['unit_active'],
                    ];
                }

                // inject into reservations
                foreach ($reservations as &$res) {
                    foreach ($res['equipments'] as &$eq) {
                        $rid = $eq['reservation_equipment_id'];
                        $eq['units'] = $unitsByResEquip[$rid] ?? [];
                    }
                }
                unset($eq, $res);
            }

            // 5) Fetch conditions for all resources
            $allReservationIds = array_keys($reservations);
            
            // Fetch equipment conditions
            $equipmentConditions = [];
            if (!empty($allEqIds)) {
                $placeholders = implode(',', array_fill(0, count($allEqIds), '?'));
                $sqlEquipConditions = "
                    SELECT rce.id, rce.reservation_equipment_id, rce.condition_id, rce.qty_bad, 
                           rce.user_personnel_id, rce.remarks, rce.admin_remarks, rce.created_at, 
                           rce.updated_at, rce.is_active, c.condition_name,
                           re.reservation_reservation_id,
                           TRIM(CONCAT_WS(' ',
                               NULLIF(t.abbreviation, ''),
                               u.users_fname,
                               NULLIF(u.users_mname, ''),
                               u.users_lname,
                               NULLIF(u.users_suffix, '')
                           )) AS personnel_full_name
                    FROM tbl_reservation_condition_equipment rce
                    LEFT JOIN tbl_condition c ON rce.condition_id = c.id
                    INNER JOIN tbl_reservation_equipment re ON rce.reservation_equipment_id = re.reservation_equipment_id
                    LEFT JOIN tbl_users u ON rce.user_personnel_id = u.users_id
                    LEFT JOIN titles t ON u.title_id = t.id
                    WHERE re.reservation_equipment_id IN ($placeholders)
                      AND rce.is_active = 1
                ";
                $stmtEquipCond = $this->conn->prepare($sqlEquipConditions);
                $stmtEquipCond->execute($allEqIds);
                $equipCondData = $stmtEquipCond->fetchAll(PDO::FETCH_ASSOC);
                foreach ($equipCondData as $cond) {
                    $equipmentConditions[$cond['reservation_equipment_id']][] = $cond;
                }
            }
            
            // Fetch unit conditions
            $unitConditions = [];
            if (!empty($allEqIds)) {
                $placeholders = implode(',', array_fill(0, count($allEqIds), '?'));
                $sqlUnitConditions = "
                    SELECT rcu.id, rcu.reservation_unit_id, rcu.condition_id, rcu.is_active,
                           rcu.user_personnel_id, rcu.remarks, rcu.admin_remarks, rcu.created_at,
                           rcu.updated_at, c.condition_name, ru.reservation_equipment_id,
                           TRIM(CONCAT_WS(' ',
                               NULLIF(t.abbreviation, ''),
                               u.users_fname,
                               NULLIF(u.users_mname, ''),
                               u.users_lname,
                               NULLIF(u.users_suffix, '')
                           )) AS personnel_full_name
                    FROM tbl_reservation_condition_unit rcu
                    LEFT JOIN tbl_condition c ON rcu.condition_id = c.id
                    INNER JOIN tbl_reservation_unit ru ON rcu.reservation_unit_id = ru.reservation_unit_id
                    LEFT JOIN tbl_users u ON rcu.user_personnel_id = u.users_id
                    LEFT JOIN titles t ON u.title_id = t.id
                    WHERE ru.reservation_equipment_id IN ($placeholders)
                      AND rcu.is_active = 1
                ";
                $stmtUnitCond = $this->conn->prepare($sqlUnitConditions);
                $stmtUnitCond->execute($allEqIds);
                $unitCondData = $stmtUnitCond->fetchAll(PDO::FETCH_ASSOC);
                foreach ($unitCondData as $cond) {
                    $unitConditions[$cond['reservation_unit_id']][] = $cond;
                }
            }
            
            // Fetch vehicle conditions
            $vehicleConditions = [];
            $allVehicleIds = [];
            foreach ($reservations as $res) {
                foreach ($res['vehicles'] as $v) {
                    if (isset($v['reservation_vehicle_id'])) {
                        $allVehicleIds[] = $v['reservation_vehicle_id'];
                    }
                }
            }
            if (!empty($allVehicleIds)) {
                $placeholders = implode(',', array_fill(0, count($allVehicleIds), '?'));
                $sqlVehicleConditions = "
                    SELECT rcv.id, rcv.reservation_vehicle_id, rcv.condition_id, rcv.is_active,
                           rcv.user_personnel_id, rcv.remarks, rcv.admin_remarks, rcv.created_at,
                           rcv.updated_at, c.condition_name,
                           TRIM(CONCAT_WS(' ',
                               NULLIF(t.abbreviation, ''),
                               u.users_fname,
                               NULLIF(u.users_mname, ''),
                               u.users_lname,
                               NULLIF(u.users_suffix, '')
                           )) AS personnel_full_name
                    FROM tbl_reservation_condition_vehicle rcv
                    LEFT JOIN tbl_condition c ON rcv.condition_id = c.id
                    LEFT JOIN tbl_users u ON rcv.user_personnel_id = u.users_id
                    LEFT JOIN titles t ON u.title_id = t.id
                    WHERE rcv.reservation_vehicle_id IN ($placeholders)
                      AND rcv.is_active = 1
                ";
                $stmtVehicleCond = $this->conn->prepare($sqlVehicleConditions);
                $stmtVehicleCond->execute($allVehicleIds);
                $vehicleCondData = $stmtVehicleCond->fetchAll(PDO::FETCH_ASSOC);
                foreach ($vehicleCondData as $cond) {
                    $vehicleConditions[$cond['reservation_vehicle_id']][] = $cond;
                }
            }
            
            // Fetch venue conditions
            $venueConditions = [];
            $allVenueIds = [];
            foreach ($reservations as $res) {
                foreach ($res['venues'] as $v) {
                    if (isset($v['reservation_venue_id'])) {
                        $allVenueIds[] = $v['reservation_venue_id'];
                    }
                }
            }
            if (!empty($allVenueIds)) {
                $placeholders = implode(',', array_fill(0, count($allVenueIds), '?'));
                $sqlVenueConditions = "
                    SELECT rcv.id, rcv.reservation_venue_id, rcv.condition_id, rcv.is_active,
                           rcv.user_personnel_id, rcv.remarks, rcv.admin_remarks, rcv.created_at,
                           rcv.updated_at, c.condition_name,
                           TRIM(CONCAT_WS(' ',
                               NULLIF(t.abbreviation, ''),
                               u.users_fname,
                               NULLIF(u.users_mname, ''),
                               u.users_lname,
                               NULLIF(u.users_suffix, '')
                           )) AS personnel_full_name
                    FROM tbl_reservation_condition_venue rcv
                    LEFT JOIN tbl_condition c ON rcv.condition_id = c.id
                    LEFT JOIN tbl_users u ON rcv.user_personnel_id = u.users_id
                    LEFT JOIN titles t ON u.title_id = t.id
                    WHERE rcv.reservation_venue_id IN ($placeholders)
                      AND rcv.is_active = 1
                ";
                $stmtVenueCond = $this->conn->prepare($sqlVenueConditions);
                $stmtVenueCond->execute($allVenueIds);
                $venueCondData = $stmtVenueCond->fetchAll(PDO::FETCH_ASSOC);
                foreach ($venueCondData as $cond) {
                    $venueConditions[$cond['reservation_venue_id']][] = $cond;
                }
            }
            
            // 6) Clean up any cross-contaminated resource arrays
            foreach ($reservations as &$res) {
                $res['venues'] = array_values(array_filter($res['venues'], function($item) {
                    return isset($item['reservation_venue_id']);
                }));
                
                $res['vehicles'] = array_values(array_filter($res['vehicles'], function($item) {
                    return isset($item['reservation_vehicle_id']);
                }));
                
                $res['equipments'] = array_values(array_filter($res['equipments'], function($item) {
                    return isset($item['reservation_equipment_id']);
                }));
            }
            unset($res);
            
            // 7) Inject conditions into resources
            foreach ($reservations as &$res) {
                foreach ($res['venues'] as &$venue) {
                    if (isset($venue['reservation_venue_id'])) {
                        $venue['conditions'] = $venueConditions[$venue['reservation_venue_id']] ?? [];
                    } else {
                        $venue['conditions'] = [];
                    }
                }
                
                foreach ($res['vehicles'] as &$vehicle) {
                    if (isset($vehicle['reservation_vehicle_id'])) {
                        $vehicle['conditions'] = $vehicleConditions[$vehicle['reservation_vehicle_id']] ?? [];
                    } else {
                        $vehicle['conditions'] = [];
                    }
                }
                
                foreach ($res['equipments'] as &$equip) {
                    $equipId = $equip['reservation_equipment_id'];
                    $equipConditions = $equipmentConditions[$equipId] ?? [];
                    
                    $totalQtyBad = 0;
                    foreach ($equipConditions as $cond) {
                        $totalQtyBad += (int)$cond['qty_bad'];
                    }
                    $totalQty = (int)$equip['quantity'];
                    $qtyGood = max(0, $totalQty - $totalQtyBad);
                    
                    $equip['conditions'] = $equipConditions;
                    $equip['qty_good'] = $qtyGood;
                    $equip['qty_bad'] = $totalQtyBad;
                    
                    foreach ($equip['units'] as &$unit) {
                        $unitId = $unit['reservation_unit_id'];
                        $unit['conditions'] = $unitConditions[$unitId] ?? [];
                    }
                }
            }
            unset($res, $venue, $vehicle, $equip, $unit);

            // 8) Fetch reservation header & user info
            foreach ($reservations as $rid => &$res) {
                $sqlR = "
                    SELECT
                        r.reservation_title,
                        r.reservation_description,
                        r.reservation_start_date,
                        r.reservation_end_date,
                        r.reschedule_start_date,
                        r.reschedule_end_date,
                        r.reservation_user_id,
                        u.users_fname,
                        u.users_mname,
                        u.users_lname,
                        d.departments_name,
                        ul.user_level_name AS role,
                        (EXISTS (
                            SELECT 1 FROM tbl_reservation_status s
                            WHERE s.reservation_reservation_id = r.reservation_id
                              AND s.reservation_status_status_id IN (10, 14)
                              AND s.reservation_active = 1
                        )) AS has_active_reschedule,
                        sm.status_master_name AS reservation_status,
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
                    FROM tbl_reservation r
                    INNER JOIN tbl_users u
                        ON r.reservation_user_id = u.users_id
                    LEFT JOIN tbl_departments d
                        ON u.users_department_id = d.departments_id
                    LEFT JOIN tbl_user_level ul
                        ON u.users_user_level_id = ul.user_level_id
                    LEFT JOIN (
                        SELECT rs.*
                        FROM tbl_reservation_status rs
                        INNER JOIN (
                            SELECT reservation_reservation_id, MAX(reservation_status_id) AS latest_status_id
                            FROM tbl_reservation_status
                            GROUP BY reservation_reservation_id
                        ) latest_rs
                            ON rs.reservation_reservation_id = latest_rs.reservation_reservation_id
                            AND rs.reservation_status_id = latest_rs.latest_status_id
                    ) rs_latest ON rs_latest.reservation_reservation_id = r.reservation_id
                    LEFT JOIN tbl_status_master sm
                        ON rs_latest.reservation_status_status_id = sm.status_master_id
                    WHERE r.reservation_id = :rid
                    ORDER BY r.reservation_id DESC
                ";

                $st = $this->conn->prepare($sqlR);
                $st->execute(['rid' => $rid]);
                $hdr = $st->fetch(PDO::FETCH_ASSOC);

                if ($hdr) {
                    $res['reservation_title']        = $hdr['reservation_title'];
                    $res['reservation_description']  = $hdr['reservation_description'];
                    if (!empty($hdr['has_active_reschedule'])) {
                        $res['reschedule_start_date'] = $hdr['reschedule_start_date'];
                        $res['reschedule_end_date']   = $hdr['reschedule_end_date'];
                    } else {
                        $res['reservation_start_date'] = $hdr['reservation_start_date'];
                        $res['reservation_end_date']   = $hdr['reservation_end_date'];
                    }
                    $res['reservation_user_id']      = $hdr['reservation_user_id'];
                    $res['reservation_status']       = $hdr['reservation_status'] ?? 'N/A';
                    $res['reservation_type']         = $hdr['reservation_type'];

                    $fullName = trim(
                        $hdr['users_fname'] . ' ' .
                        (!empty($hdr['users_mname']) ? $hdr['users_mname'] . ' ' : '') .
                        $hdr['users_lname']
                    );

                    $res['user_details'] = [
                        'full_name'  => $fullName,
                        'department' => $hdr['departments_name'] ?? 'N/A',
                        'role'       => $hdr['role'] ?? 'N/A'
                    ];
                }
            }
            unset($res); // Unset the last reference

            // Filter reservations that have associated items
            $filteredReservations = array_filter($reservations, function($res) {
                return !empty($res['venues']) || !empty($res['vehicles']) || !empty($res['equipments']);
            });

            return json_encode([
                'status' => 'success',
                'data'   => array_values($filteredReservations) // Reset array keys
            ]);

        } catch (PDOException $e) {
            error_log("Error in fetchAssignedRelease: " . $e->getMessage());
            return json_encode([
                'status'  => 'error',
                'message' => 'An error occurred while fetching assigned releases. Please try again later.'
            ]);
        }
    }
    public function fetchTaskById($data) {
        if (!isset($data['checklist_id'])) {
            return json_encode(['status' => 'error', 'message' => 'Checklist ID is required']);
        }

        try {
            // Get the checklist master data with reservation details
            $sqlMaster = "SELECT 
                cm.checklist_id,
                cm.checklist_reservation_id,
                cm.checklist_admin_id,
                cm.checklist_personnel_id,
                r.reservation_title,
                r.reservation_description,
                r.reservation_start_date,
                r.reservation_end_date
            FROM tbl_checklist_master cm
            LEFT JOIN tbl_reservation r ON cm.checklist_reservation_id = r.reservation_id
            WHERE cm.checklist_id = :checklist_id";

            $stmtMaster = $this->conn->prepare($sqlMaster);
            $stmtMaster->execute(['checklist_id' => $data['checklist_id']]);
            $masterData = $stmtMaster->fetch(PDO::FETCH_ASSOC);

            if (!$masterData) {
                return json_encode(['status' => 'error', 'message' => 'Checklist not found']);
            }

            $response = [
                'master_data' => $masterData,
                'venue_tasks' => [],
                'vehicle_tasks' => []
            ];

            // Get venue tasks
            $sqlVenue = "SELECT 
                release_venue_id,
                release_checklist_name,
                release_isActive,
                release_updated_at
            FROM tbl_release_venue_equipment 
            WHERE checklist_master_id = :checklist_master_id";
            
            $stmtVenue = $this->conn->prepare($sqlVenue);
            $stmtVenue->execute(['checklist_master_id' => $data['checklist_id']]);
            $response['venue_tasks'] = $stmtVenue->fetchAll(PDO::FETCH_ASSOC);

            // Get vehicle tasks
            $sqlVehicle = "SELECT 
                release_vehicle_id,
                release_checklist_name,
                release_isActive,
                release_updated_at
            FROM tbl_release_vehicle 
            WHERE checklist_master_id = :checklist_master_id";
            
            $stmtVehicle = $this->conn->prepare($sqlVehicle);
            $stmtVehicle->execute(['checklist_master_id' => $data['checklist_id']]);
            $response['vehicle_tasks'] = $stmtVehicle->fetchAll(PDO::FETCH_ASSOC);

            return json_encode(['status' => 'success', 'data' => $response]);

        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function updateTask($data) {
    // Validate required parameters
    if (!isset($data['type']) || !isset($data['id']) || !isset($data['isActive'])) {
        return json_encode([
            'status' => 'error',
            'message' => 'Type, ID, and isActive are required'
        ]);
    }

    try {
        $type = strtolower($data['type']);
        $id = (int)$data['id'];
        $isActive = (int)$data['isActive'];
        $user_personnel_id = isset($data['user_personnel_id']) ? (int)$data['user_personnel_id'] : null;
        
        // Determine which table to update based on type
        switch ($type) {
            case 'venue':
                $table = 'tbl_reservation_checklist_venue';
                $idField = 'reservation_checklist_venue_id';
                break;
            case 'vehicle':
                $table = 'tbl_reservation_checklist_vehicle';
                $idField = 'reservation_checklist_vehicle_id';
                break;
            case 'equipment':
                $table = 'tbl_reservation_checklist_equipment';
                $idField = 'reservation_checklist_equipment_id';
                break;
            default:
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid type specified. Must be venue, vehicle, or equipment'
                ]);
        }

        // Update the isChecked field and personnel_id if provided
        if ($user_personnel_id) {
            $sql = "UPDATE $table 
                    SET isChecked = :isActive,
                        personnel_id = :personnel_id
                    WHERE $idField = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                'isActive' => $isActive,
                'personnel_id' => $user_personnel_id,
                'id' => $id
            ]);
        } else {
            $sql = "UPDATE $table 
                    SET isChecked = :isActive
                    WHERE $idField = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                'isActive' => $isActive,
                'id' => $id
            ]);
        }

        // Insert audit log if we have personnel context
        if (!empty($user_personnel_id)) {
            // 1) Fetch personnel full name (First + Middle Initial + Last)
            $personnelFullName = null;
            try {
                $personSql = "SELECT CONCAT(
                                    u.users_fname,
                                    CASE 
                                        WHEN u.users_mname IS NOT NULL AND u.users_mname != '' THEN CONCAT(' ', LEFT(u.users_mname, 1), '.')
                                        ELSE ''
                                    END,
                                    ' ',
                                    u.users_lname
                                ) AS full_name
                             FROM tbl_users u WHERE u.users_id = :id";
                $personStmt = $this->conn->prepare($personSql);
                $personStmt->execute([':id' => $user_personnel_id]);
                $row = $personStmt->fetch(PDO::FETCH_ASSOC);
                $personnelFullName = $row && !empty($row['full_name']) ? $row['full_name'] : null;
            } catch (PDOException $e) { /* ignore */ }

            // 2) Fetch checklist name based on type and reservation_checklist_* id
            $checklistName = null;
            try {
                if ($type === 'venue') {
                    $q = $this->conn->prepare("SELECT cvc.checklist_name AS name
                                               FROM tbl_reservation_checklist_venue rc
                                               JOIN tbl_checklist_venue_master cvc ON rc.checklist_venue_id = cvc.checklist_venue_id
                                               WHERE rc.reservation_checklist_venue_id = :id");
                } elseif ($type === 'vehicle') {
                    $q = $this->conn->prepare("SELECT cvm.checklist_name AS name
                                               FROM tbl_reservation_checklist_vehicle rc
                                               JOIN tbl_checklist_vehicle_master cvm ON rc.checklist_vehicle_id = cvm.checklist_vehicle_id
                                               WHERE rc.reservation_checklist_vehicle_id = :id");
                } else { // equipment
                    $q = $this->conn->prepare("SELECT cem.checklist_name AS name
                                               FROM tbl_reservation_checklist_equipment rc
                                               JOIN tbl_checklist_equipment_master cem ON rc.checklist_equipment_id = cem.checklist_equipment_id
                                               WHERE rc.reservation_checklist_equipment_id = :id");
                }
                $q->execute([':id' => $id]);
                $r = $q->fetch(PDO::FETCH_ASSOC);
                $checklistName = $r && !empty($r['name']) ? $r['name'] : null;
            } catch (PDOException $e) { /* ignore */ }

            // 3) Compose and insert audit log
            $nameForLog = $personnelFullName ?? ('User #' . (int)$user_personnel_id);
            $itemForLog = $checklistName ?? ('Checklist Item #' . $id);
            $verb = $isActive ? 'checked' : 'unchecked';
            // Example: "Virjillio checked (Item Name)"
            $desc = "$nameForLog $verb ($itemForLog)";
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $auditStmt = $this->conn->prepare($auditSql);
                $auditStmt->execute([
                    ':description' => $desc,
                    ':action' => 'CHECK',
                    ':created_by' => $user_personnel_id
                ]);
            } catch (PDOException $e) { /* ignore logging errors */ }
        }

        return json_encode([
            'status' => 'success',
            'message' => 'Checklist item updated successfully',
            'affected_rows' => $stmt->rowCount()
        ]);

    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

    public function insertComplete($checklist_id) {
        if (!$checklist_id) {
            return json_encode(['status' => 'error', 'message' => 'Checklist ID is required']);
        }

        try {
            $timestamp = date('Y-m-d H:i:s');

            // Insert single status record
            $sql = "INSERT INTO tbl_checklist_status 
                    (checklist_status_status_checklist_id, checklist_checklist_id, checklist_updated_at)
                    VALUES (2, :checklist_id, :timestamp)";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                'checklist_id' => $checklist_id,
                'timestamp' => $timestamp
            ]);

            return json_encode([
                'status' => 'success',
                'message' => 'Completion status inserted successfully',
                'timestamp' => $timestamp
            ]);

        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function fetchRecent() {
        try {
            $sql = "SELECT 
                cm.checklist_id,  
                cs.checklist_updated_at  
            FROM 
                tbl_checklist_master cm
            JOIN
                tbl_checklist_status cs ON cm.checklist_id = cs.checklist_checklist_id  
            WHERE 
                checklist_status_status_checklist_id IN (1)
            ORDER BY
                cs.checklist_updated_at DESC";

            return $this->executeQuery($sql);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
    
    public function fetchCompletedTask($personnel_id) {
        if (!$personnel_id) {
            return json_encode(['status' => 'error', 'message' => 'Personnel ID is required']);
        }
    
        try {
            // Get master checklist data with status filter (checklist_status_status_checklist_id = 2)
            $sqlMaster = "
                SELECT 
                    cm.checklist_id,
                    cm.checklist_reservation_id,
                    cm.checklist_admin_id,
                    cm.checklist_personnel_id,
                    r.reservation_date,
                    cs.checklist_status_id,
                    cs.checklist_status_status_checklist_id,
                    cs.checklist_checklist_id,
                    cs.checklist_updated_at,
                    sc.status_checklist_name,
                    a.approval_form_venue_id,
                    a.approval_form_vehicle_id,
                    GROUP_CONCAT(DISTINCT rfv.reservation_form_name) AS venue_form_name,
                    GROUP_CONCAT(DISTINCT rfv_v.reservation_form_name) AS vehicle_form_name,
                    GROUP_CONCAT(DISTINCT rfv.reservation_form_start_date) AS venue_form_start_date,
                    GROUP_CONCAT(DISTINCT rfv_v.reservation_form_start_date) AS vehicle_form_start_date,
                    GROUP_CONCAT(DISTINCT rfv.reservation_form_end_date) AS venue_form_end_date,
                    GROUP_CONCAT(DISTINCT rfv_v.reservation_form_end_date) AS vehicle_form_end_date
                FROM 
                    tbl_checklist_master cm
                LEFT JOIN
                    tbl_reservation r ON cm.checklist_reservation_id = r.reservation_id
                LEFT JOIN
                    tbl_checklist_status cs ON cm.checklist_id = cs.checklist_checklist_id
                INNER JOIN
                    tbl_status_checklist sc ON cs.checklist_status_status_checklist_id = sc.status_checklist_id
                LEFT JOIN 
                    tbl_approval a ON r.reservation_approval_id = a.approval_id
                LEFT JOIN 
                    tbl_reservation_form_venue rfv ON a.approval_form_venue_id = rfv.reservation_form_venue_id
                LEFT JOIN 
                    tbl_reservation_form_vehicle rfv_v ON a.approval_form_vehicle_id = rfv_v.reservation_form_vehicle_id
                WHERE
                    cm.checklist_personnel_id = :personnel_id
                    AND cs.checklist_status_status_checklist_id = 2
                GROUP BY
                    cm.checklist_id
            ";

            $stmtMaster = $this->conn->prepare($sqlMaster);
            $stmtMaster->execute(['personnel_id' => $personnel_id]);
            $masterData = $stmtMaster->fetchAll(PDO::FETCH_ASSOC);

            if (!$masterData) {
                return json_encode(['status' => 'error', 'message' => 'No completed tasks found']);
            }

            $response = [];
            foreach ($masterData as $master) {
                $checklistData = [
                    'master_data' => $master,
                    'venue_equipment' => [],
                    'vehicle_checklist' => []
                ];

                // Get venue equipment release checklist
                $sqlVenue = "
                    SELECT 
                        release_venue_id,
                        release_checklist_name,
                        release_isActive,
                        release_updated_at
                    FROM 
                        tbl_release_venue_equipment
                    WHERE 
                        checklist_master_id = :checklist_master_id
                ";
                
                $stmtVenue = $this->conn->prepare($sqlVenue);
                $stmtVenue->execute(['checklist_master_id' => $master['checklist_id']]);
                $checklistData['venue_equipment'] = $stmtVenue->fetchAll(PDO::FETCH_ASSOC);

                // Get vehicle release checklist
                $sqlVehicle = "
                    SELECT 
                        release_vehicle_id,
                        release_checklist_name,
                        release_isActive,
                        release_updated_at
                    FROM 
                        tbl_release_vehicle
                    WHERE 
                        checklist_master_id = :checklist_master_id
                ";
                
                $stmtVehicle = $this->conn->prepare($sqlVehicle);
                $stmtVehicle->execute(['checklist_master_id' => $master['checklist_id']]);
                $checklistData['vehicle_checklist'] = $stmtVehicle->fetchAll(PDO::FETCH_ASSOC);

                $response[] = $checklistData;
            }

            return json_encode(['status' => 'success', 'data' => $response]);

        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }


    public function submitCondition($data) {
    if (!isset($data['conditions'])) {
        return json_encode([
            'status' => 'error',
            'message' => 'Missing required parameter (conditions)',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    try {
        $timestamp = date('Y-m-d H:i:s');
        $conditions = $data['conditions'];
        $results = [];
        
        // Begin transaction for all operations
        $this->conn->beginTransaction();
        
        // Process each type of condition
        foreach ($conditions as $type => $typeData) {
            if (!isset($typeData['reservation_ids']) || !isset($typeData['condition_ids']) || 
                !is_array($typeData['reservation_ids']) || !is_array($typeData['condition_ids']) ||
                count($typeData['reservation_ids']) != count($typeData['condition_ids'])) {
                $results[$type] = [
                    'status' => 'error',
                    'message' => 'Invalid or mismatched reservation_ids and condition_ids arrays',
                    'timestamp' => $timestamp
                ];
                continue;
            }

            // Initialize SQL and table names based on type
            $tables = [
                'venue' => [
                    'reservationTable' => 'tbl_reservation_venue',
                    'conditionTable' => 'tbl_reservation_condition_venue',
                    'reservationIdField' => 'reservation_venue_id',
                    'checkField' => 'reservation_venue_id'
                ],
                'vehicle' => [
                    'reservationTable' => 'tbl_reservation_vehicle',
                    'conditionTable' => 'tbl_reservation_condition_vehicle',
                    'reservationIdField' => 'reservation_vehicle_id',
                    'checkField' => 'reservation_vehicle_id'
                ],
                'equipment' => [
                    'reservationTable' => 'tbl_reservation_equipment',
                    'conditionTable' => 'tbl_reservation_condition_equipment',
                    'reservationIdField' => 'reservation_equipment_id',
                    'checkField' => 'reservation_equipment_id'
                ]
            ];

            if (!isset($tables[$type])) {
                $results[$type] = [
                    'status' => 'error',
                    'message' => 'Invalid type specified',
                    'timestamp' => $timestamp
                ];
                continue;
            }

            $tableInfo = $tables[$type];
            $reservation_ids = $typeData['reservation_ids'];
            $condition_ids = $typeData['condition_ids'];
            $other_reasons = $typeData['other_reasons'] ?? array_fill(0, count($reservation_ids), null);
            // New: Get qty_bad for equipment type
            $qty_bad = ($type === 'equipment') ? ($typeData['qty_bad'] ?? array_fill(0, count($reservation_ids), null)) : null;

            // Validate all reservation_ids exist
            $placeholders = str_repeat('?,', count($reservation_ids) - 1) . '?';
            $checkReservation = "SELECT COUNT(*) FROM {$tableInfo['reservationTable']} WHERE {$tableInfo['reservationIdField']} IN ($placeholders)";
            $stmtReservation = $this->conn->prepare($checkReservation);
            $stmtReservation->execute($reservation_ids);
            if ($stmtReservation->fetchColumn() != count($reservation_ids)) {
                $results[$type] = [
                    'status' => 'error',
                    'message' => 'One or more invalid reservation IDs',
                    'timestamp' => $timestamp
                ];
                continue;
            }

            $typeResults = [];
            $insertedCount = 0;
            $skippedCount = 0;

            // Process each reservation-condition pair
            for ($i = 0; $i < count($reservation_ids); $i++) {
                $reservation_id = $reservation_ids[$i];
                $condition_id = $condition_ids[$i];
                $other_reason = isset($other_reasons[$i]) ? $other_reasons[$i] : null;
                // New: Get qty_bad value for this iteration if it's equipment type
                $current_qty_bad = ($type === 'equipment' && isset($qty_bad[$i])) ? $qty_bad[$i] : null;

                // Validate other_reason is provided when condition_id is 6
                if ($condition_id == '6' && empty($other_reason)) {
                    $typeResults[$reservation_id] = [
                        'status' => 'error',
                        'condition_id' => $condition_id,
                        'message' => 'Other reason is required when condition is Others'
                    ];
                    continue;
                }

                // Check for existing condition record
                $checkExisting = "SELECT COUNT(*) FROM {$tableInfo['conditionTable']} 
                                WHERE {$tableInfo['checkField']} = :reservation_id 
                                AND condition_id = :condition_id";
                $stmtExisting = $this->conn->prepare($checkExisting);
                $stmtExisting->execute([
                    'reservation_id' => $reservation_id,
                    'condition_id' => $condition_id
                ]);
                
                if ($type === 'equipment') {
                    // Insert the record with qty_bad for equipment
                    $sql = "INSERT INTO {$tableInfo['conditionTable']} 
                            ({$tableInfo['checkField']}, condition_id, other_reason, qty_bad, is_active) 
                            VALUES (:reservation_id, :condition_id, :other_reason, :qty_bad, 1)";
                    
                    $stmt = $this->conn->prepare($sql);
                    $stmt->execute([
                        'reservation_id' => $reservation_id,
                        'condition_id' => $condition_id,
                        'other_reason' => $other_reason,
                        'qty_bad' => $current_qty_bad
                    ]);
                } else {
                    // Insert the record without qty_bad for venue and vehicle
                    $sql = "INSERT INTO {$tableInfo['conditionTable']} 
                            ({$tableInfo['checkField']}, condition_id, other_reason, is_active) 
                            VALUES (:reservation_id, :condition_id, :other_reason, 1)";
                    
                    $stmt = $this->conn->prepare($sql);
                    $stmt->execute([
                        'reservation_id' => $reservation_id,
                        'condition_id' => $condition_id,
                        'other_reason' => $other_reason
                    ]);
                }
                
                $insertedCount++;
                
                $typeResults[$reservation_id] = [
                    'status' => 'success',
                    'condition_id' => $condition_id,
                    'other_reason' => $other_reason,
                    'qty_bad' => $type === 'equipment' ? $current_qty_bad : null,
                    'message' => 'Condition inserted successfully'
                ];
            }

            $results[$type] = [
                'status' => 'success',
                'summary' => "Processed: $insertedCount inserted",
                'details' => $typeResults,
                'timestamp' => $timestamp
            ];
        }

        // Commit all changes
        $this->conn->commit();
        
        return json_encode([
            'status' => 'success',
            'results' => $results,
            'timestamp' => $timestamp
        ]);
        
    } catch (PDOException $e) {
        // Rollback transaction on error
        if ($this->conn->inTransaction()) {
            $this->conn->rollBack();
        }
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

public function updateResourceStatusAndCondition($type, $resourceId, $recordId) {
    try {
        $type = strtolower($type); // normalize input
        $resourceId = (int)$resourceId;
        $recordId = (int)$recordId;

        // Define table and column mappings for resources
        $resourceMap = [
            'equipment' => ['table' => 'tbl_equipments', 'column' => 'equip_id'],
            'venue'     => ['table' => 'tbl_venue',     'column' => 'ven_id'],
            'vehicle'   => ['table' => 'tbl_vehicle',   'column' => 'vehicle_id'],
        ];

        // Define table mappings for conditions
        $conditionMap = [
            'equipment' => 'tbl_reservation_condition_equipment',
            'venue'     => 'tbl_reservation_condition_venue',
            'vehicle'   => 'tbl_reservation_condition_vehicle',
        ];

        // Check if resource type is valid
        if (!isset($resourceMap[$type]) || !isset($conditionMap[$type])) {
            return json_encode([
                'status' => 'error',
                'message' => 'Invalid resource type.'
            ]);
        }

        // Get table and column names
        $resourceTable = $resourceMap[$type]['table'];
        $resourceColumn = $resourceMap[$type]['column'];
        $conditionTable = $conditionMap[$type];

        // Start transaction to ensure atomicity
        $this->conn->beginTransaction();

        // 1) Update the resource status availability to 1 (Available)
        $stmt = $this->conn->prepare("UPDATE $resourceTable SET status_availability_id = 1 WHERE $resourceColumn = :resourceId");
        $stmt->bindParam(':resourceId', $resourceId, PDO::PARAM_INT);
        $stmt->execute();

        // 2) Update the condition record's is_active to 0
        $stmt = $this->conn->prepare("UPDATE $conditionTable SET is_active = 0 WHERE id = :recordId");
        $stmt->bindParam(':recordId', $recordId, PDO::PARAM_INT);
        $stmt->execute();

        // Commit transaction
        $this->conn->commit();

        return json_encode([
            'status' => 'success',
            'message' => "Updated $type (ID: $resourceId) to status_availability_id = 1 and set condition record ID $recordId to is_active = 0."
        ]);
    } catch (PDOException $e) {
        // Rollback transaction if an error occurs
        $this->conn->rollBack();
        return json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }

    
}

public function updateReservationStatus($reservation_id, $user_personnel_id = null) {
    if (!$reservation_id) {
        return json_encode([
            'status' => 'error',
            'message' => 'Reservation ID is required',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    try {
        $timestamp = date('Y-m-d H:i:s');

        // 1. Deactivate current active status where status_id = 6
        $deactivateSql = "UPDATE tbl_reservation_status 
                          SET reservation_active = 0, 
                              reservation_updated_at = :timestamp 
                          WHERE reservation_reservation_id = :reservation_id 
                            AND reservation_status_status_id = 6";

        $stmtDeactivate = $this->conn->prepare($deactivateSql);
        $stmtDeactivate->execute([
            'reservation_id' => $reservation_id,
            'timestamp' => $timestamp
        ]);

        // 2. Deactivate status_id = 9 if exists
        $deactivateStatus9Sql = "UPDATE tbl_reservation_status 
                                 SET reservation_active = 0, 
                                     reservation_updated_at = :timestamp 
                                 WHERE reservation_reservation_id = :reservation_id 
                                   AND reservation_status_status_id = 9";

        $stmtDeactivate9 = $this->conn->prepare($deactivateStatus9Sql);
        $stmtDeactivate9->execute([
            'reservation_id' => $reservation_id,
            'timestamp' => $timestamp
        ]);

        // 3. Insert new status row with status_id = 4
        $insertSql = "INSERT INTO tbl_reservation_status (
                          reservation_status_status_id, 
                          reservation_reservation_id, 
                          reservation_active, 
                          reservation_users_id,
                          reservation_updated_at
                      ) VALUES (
                          4, :reservation_id, 1, :user_personnel_id, :timestamp
                      )";

        $stmtInsert = $this->conn->prepare($insertSql);
        $stmtInsert->execute([
            'reservation_id' => $reservation_id,
            'user_personnel_id' => $user_personnel_id,
            'timestamp' => $timestamp
        ]);

        // Audit logging for reservation status update (optional if user_personnel_id provided)
        if (!empty($user_personnel_id)) {
            // Fetch personnel full name (First + Middle Initial + Last)
            $personnelFullName = null;
            try {
                $personSql = "SELECT CONCAT(
                                    u.users_fname,
                                    CASE 
                                        WHEN u.users_mname IS NOT NULL AND u.users_mname != '' THEN CONCAT(' ', LEFT(u.users_mname, 1), '.')
                                        ELSE ''
                                    END,
                                    ' ',
                                    u.users_lname
                                ) AS full_name
                             FROM tbl_users u WHERE u.users_id = :id";
                $personStmt = $this->conn->prepare($personSql);
                $personStmt->execute([':id' => $user_personnel_id]);
                $row = $personStmt->fetch(PDO::FETCH_ASSOC);
                $personnelFullName = $row && !empty($row['full_name']) ? $row['full_name'] : null;
            } catch (PDOException $e) { /* ignore */ }

            $nameForLog = $personnelFullName ?? ('User #' . (int)$user_personnel_id);
            // Fetch reservation title for clearer audit description
            $reservationTitle = null;
            try {
                $resSql = "SELECT reservation_title FROM tbl_reservation WHERE reservation_id = :id";
                $resStmt = $this->conn->prepare($resSql);
                $resStmt->execute([':id' => $reservation_id]);
                $resRow = $resStmt->fetch(PDO::FETCH_ASSOC);
                $reservationTitle = $resRow && !empty($resRow['reservation_title']) ? $resRow['reservation_title'] : null;
            } catch (PDOException $e) { /* ignore */ }

            if ($reservationTitle) {
                $desc = "Reservation ({$reservationTitle}) has set to completed by: {$nameForLog}";
            } else {
                $desc = "Reservation has set to completed by: {$nameForLog}";
            }
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $auditStmt = $this->conn->prepare($auditSql);
                $auditStmt->execute([
                    ':description' => $desc,
                    ':action' => 'UPDATE STATUS',
                    ':created_by' => $user_personnel_id
                ]);
            } catch (PDOException $e) { /* ignore logging errors */ }
        }

        // Send push notification to admins after successful status update
        try {
            $this->sendPushNotificationToAdmins($reservation_id);
        } catch (Exception $e) {
            error_log("Failed to send push notification: " . $e->getMessage());
            // Don't fail the operation if push notification fails
        }

        return json_encode([
            'status' => 'success',
            'message' => 'Reservation status updated: deactivated status_id 6, added new status_id 4',
            'timestamp' => $timestamp
        ]);

    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

public function checkEquipmentQuantity($reservation_equipment_id) {
    try {
        // Get the equipment details, current quantity, and requested quantity
        $stmt = $this->conn->prepare("
            SELECT 
                re.reservation_equipment_equip_id,
                re.reservation_equipment_quantity as requested_quantity,
                e.equip_name,
                e.equip_type,
                eq.on_hand_quantity,
                eq.quantity_id
            FROM tbl_reservation_equipment re
            JOIN tbl_equipments e ON e.equip_id = re.reservation_equipment_equip_id
            LEFT JOIN tbl_equipment_quantity eq ON eq.equip_id = e.equip_id
            WHERE re.reservation_equipment_id = :reservation_equipment_id
        ");
        $stmt->execute(['reservation_equipment_id' => $reservation_equipment_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return json_encode([
                'status' => 'error',
                'message' => 'Equipment not found'
            ]);
        }
        
        // For serialized equipment, count available units
        if ($result['quantity_id'] === null && ($result['equip_type'] === 'Serialized' || $result['equip_type'] === 'serialized')) {
            $unitStmt = $this->conn->prepare("
                SELECT COUNT(*) as available_count
                FROM tbl_equipment_unit eu
                JOIN tbl_status_availability sa ON eu.status_availability_id = sa.status_availability_id
                WHERE eu.equip_id = :equip_id
                  AND sa.status_availability_name = 'Available'
                  AND eu.is_active = 1
            ");
            $unitStmt->execute(['equip_id' => $result['reservation_equipment_equip_id']]);
            $unitResult = $unitStmt->fetch(PDO::FETCH_ASSOC);
            $availableCount = $unitResult['available_count'] ?? 0;
            
            return json_encode([
                'status' => 'success',
                'data' => [
                    'on_hand_quantity' => $availableCount,
                    'requested_quantity' => (int)$result['requested_quantity'],
                    'equip_name' => $result['equip_name'],
                    'is_serialized' => true
                ]
            ]);
        }
        
        return json_encode([
            'status' => 'success',
            'data' => [
                'on_hand_quantity' => (int)($result['on_hand_quantity'] ?? 0),
                'requested_quantity' => (int)$result['requested_quantity'],
                'equip_name' => $result['equip_name'],
                'is_serialized' => false
            ]
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

public function fetchAvailableUnits($equip_id) {
    try {
        // Fetch only available units (not in use) for the equipment
        // Exclude units already linked to active reservations
        $stmt = $this->conn->prepare("
            SELECT 
                eu.unit_id,
                eu.serial_number,
                sa.status_availability_name as availability_status
            FROM tbl_equipment_unit eu
            JOIN tbl_status_availability sa ON eu.status_availability_id = sa.status_availability_id
            WHERE eu.equip_id = :equip_id

              AND eu.is_active = 1
              AND eu.unit_id NOT IN (
                  SELECT unit_id 
                  FROM tbl_reservation_unit 
                  WHERE active = 0
              )
        ");
        $stmt->bindValue(':equip_id', $equip_id, PDO::PARAM_INT);
        $stmt->execute();
        $units = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return json_encode([
            'status' => 'success',
            'data' => $units
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

public function releaseAvailableUnit($reservation_id, $reservation_equipment_id, $equip_id, $unit_id, $user_personnel_id) {
    try {
        $this->conn->beginTransaction();
        
        // Check if unit is already reserved for this equipment
        $checkStmt = $this->conn->prepare("
            SELECT reservation_unit_id
            FROM tbl_reservation_unit
            WHERE reservation_equipment_id = :reservation_equipment_id
              AND unit_id = :unit_id
        ");
        $checkStmt->execute([
            'reservation_equipment_id' => $reservation_equipment_id,
            'unit_id' => $unit_id
        ]);
        $existingResUnit = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        $reservation_unit_id = null;
        
        if ($existingResUnit) {
            // Unit is already in this reservation, update to active
            $reservation_unit_id = $existingResUnit['reservation_unit_id'];
            
            $updateStmt = $this->conn->prepare("
                UPDATE tbl_reservation_unit
                SET active = 1,
                    updated_at = NOW()
                WHERE reservation_unit_id = :reservation_unit_id
            ");
            $updateStmt->execute(['reservation_unit_id' => $reservation_unit_id]);
        } else {
            // Create new reservation unit with active = 1 (direct release)
            $insertStmt = $this->conn->prepare("
                INSERT INTO tbl_reservation_unit (
                    reservation_reservation_id,
                    reservation_equipment_id,
                    unit_id,
                    active,
                    created_at,
                    updated_at
                ) VALUES (
                    :reservation_id,
                    :reservation_equipment_id,
                    :unit_id,
                    1,
                    NOW(),
                    NOW()
                )
            ");
            $insertStmt->execute([
                'reservation_id' => $reservation_id,
                'reservation_equipment_id' => $reservation_equipment_id,
                'unit_id' => $unit_id
            ]);
            $reservation_unit_id = $this->conn->lastInsertId();
        }
        
        // Update unit status to "In Use" (status_availability_id = 5)
        $unitUpdateStmt = $this->conn->prepare("
            UPDATE tbl_equipment_unit
            SET status_availability_id = 5,
                updated_at = NOW()
            WHERE unit_id = :unit_id
        ");
        $unitUpdateStmt->execute(['unit_id' => $unit_id]);
        
        // Update reservation equipment to active
        $equipmentUpdateStmt = $this->conn->prepare("
            UPDATE tbl_reservation_equipment
            SET active = 1,
                updated_at = NOW()
            WHERE reservation_equipment_id = :reservation_equipment_id
        ");
        $equipmentUpdateStmt->execute(['reservation_equipment_id' => $reservation_equipment_id]);
        
        $this->conn->commit();
        
        return json_encode([
            'status' => 'success',
            'message' => 'Unit released successfully',
            'data' => [
                'reservation_unit_id' => $reservation_unit_id
            ]
        ]);
    } catch (PDOException $e) {
        $this->conn->rollBack();
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

public function releaseVenue($reservation_venue_id, $personnel_id, $checklist_items) {
    try {
        // Validate required parameters
        if (!$reservation_venue_id || !$personnel_id) {
            return json_encode([
                'status' => 'error',
                'message' => 'Reservation venue ID and personnel ID are required'
            ]);
        }

        // Validate checklist items array
        if (!is_array($checklist_items) || empty($checklist_items)) {
            return json_encode([
                'status' => 'error',
                'message' => 'Checklist items are required'
            ]);
        }

        // Begin database transaction
        $this->conn->beginTransaction();

        // Validate all checklist items are checked
        $allChecked = true;
        foreach ($checklist_items as $item) {
            if (!isset($item['isChecked']) || $item['isChecked'] != 1) {
                $allChecked = false;
                break;
            }
        }

        if (!$allChecked) {
            $this->conn->rollBack();
            return json_encode([
                'status' => 'error',
                'message' => 'All checklist items must be checked before release'
            ]);
        }

        // Update checklist items with personnel_id and timestamp
        $timestamp = date('Y-m-d H:i:s');
        foreach ($checklist_items as $item) {
            if (!isset($item['reservation_checklist_venue_id'])) {
                continue;
            }

            $updateChecklistStmt = $this->conn->prepare("
                UPDATE tbl_reservation_checklist_venue
                SET personnel_id = :personnel_id,
                    isChecked = 1,
                    updated_at = :timestamp
                WHERE reservation_checklist_venue_id = :reservation_checklist_venue_id
            ");
            $updateChecklistStmt->execute([
                'personnel_id' => $personnel_id,
                'timestamp' => $timestamp,
                'reservation_checklist_venue_id' => $item['reservation_checklist_venue_id']
            ]);
        }

        // Check if venue is already released (active = 0)
        $checkVenueStmt = $this->conn->prepare("
            SELECT active, reservation_venue_venue_id, reservation_change_venue_id
            FROM tbl_reservation_venue
            WHERE reservation_venue_id = :reservation_venue_id
        ");
        $checkVenueStmt->execute(['reservation_venue_id' => $reservation_venue_id]);
        $venueData = $checkVenueStmt->fetch(PDO::FETCH_ASSOC);

        if (!$venueData) {
            $this->conn->rollBack();
            return json_encode([
                'status' => 'error',
                'message' => 'Venue reservation not found'
            ]);
        }

        if ($venueData['active'] == 0) {
            $this->conn->rollBack();
            return json_encode([
                'status' => 'error',
                'message' => 'Venue has already been released'
            ]);
        }

        // Determine which venue ID to use (change venue takes precedence)
        $venue_id = $venueData['reservation_change_venue_id'] ?? $venueData['reservation_venue_venue_id'];

        // Update tbl_reservation_venue SET active = 0
        $updateReservationVenueStmt = $this->conn->prepare("
            UPDATE tbl_reservation_venue
            SET active = 0,
                updated_at = :timestamp
            WHERE reservation_venue_id = :reservation_venue_id
        ");
        $updateReservationVenueStmt->execute([
            'timestamp' => $timestamp,
            'reservation_venue_id' => $reservation_venue_id
        ]);

        // Update venue status_availability_id to "In Use" (5)
        $updateVenueStatusStmt = $this->conn->prepare("
            UPDATE tbl_venue
            SET status_availability_id = 5,
                updated_at = :timestamp
            WHERE ven_id = :venue_id
        ");
        $updateVenueStatusStmt->execute([
            'timestamp' => $timestamp,
            'venue_id' => $venue_id
        ]);

        // Insert audit log entry
        try {
            // Fetch personnel full name
            $personnelFullName = null;
            $personSql = "SELECT CONCAT(
                                u.users_fname,
                                CASE 
                                    WHEN u.users_mname IS NOT NULL AND u.users_mname != '' THEN CONCAT(' ', LEFT(u.users_mname, 1), '.')
                                    ELSE ''
                                END,
                                ' ',
                                u.users_lname
                            ) AS full_name
                         FROM tbl_users u WHERE u.users_id = :id";
            $personStmt = $this->conn->prepare($personSql);
            $personStmt->execute([':id' => $personnel_id]);
            $row = $personStmt->fetch(PDO::FETCH_ASSOC);
            $personnelFullName = $row && !empty($row['full_name']) ? $row['full_name'] : null;

            // Fetch venue name
            $venueName = null;
            $venueSql = "SELECT ven_name FROM tbl_venue WHERE ven_id = :id";
            $venueStmt = $this->conn->prepare($venueSql);
            $venueStmt->execute([':id' => $venue_id]);
            $venueRow = $venueStmt->fetch(PDO::FETCH_ASSOC);
            $venueName = $venueRow && !empty($venueRow['ven_name']) ? $venueRow['ven_name'] : null;

            $nameForLog = $personnelFullName ?? ('User #' . (int)$personnel_id);
            $venueForLog = $venueName ?? ('Venue #' . $venue_id);
            $desc = "$nameForLog released venue: $venueForLog";

            $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) 
                         VALUES (:description, :action, NOW(), :created_by)";
            $auditStmt = $this->conn->prepare($auditSql);
            $auditStmt->execute([
                ':description' => $desc,
                ':action' => 'RELEASE_VENUE',
                ':created_by' => $personnel_id
            ]);
        } catch (PDOException $e) {
            // Log error but don't fail the transaction
            error_log('Audit log error in releaseVenue: ' . $e->getMessage());
        }

        // Commit transaction
        $this->conn->commit();

        return json_encode([
            'status' => 'success',
            'message' => 'Venue released successfully',
            'timestamp' => $timestamp
        ]);

    } catch (PDOException $e) {
        // Rollback transaction on error
        if ($this->conn->inTransaction()) {
            $this->conn->rollBack();
        }
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

public function updateRelease($type, $reservation_id, $resource_id, $quantity = null, $user_personnel_id = null) {
    try {
        $status_availability_id = 5;
        
        // Cast IDs to integers to ensure proper comparison
        $reservation_id = (int)$reservation_id;
        $resource_id = (int)$resource_id;
        $user_personnel_id = (int)$user_personnel_id;
        
        
        
        // Require personnel context for audit logging
        if (empty($user_personnel_id)) {
            return json_encode([
                'status' => 'error',
                'message' => 'User Personnel ID is required for audit logging.'
            ]);
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
                'message' => 'Cannot release reservation: Reservation has been cancelled',
                'current_status' => $currentStatus['status_master_name']
            ]);
        }
        
        if ($currentStatusId === 4) {
            return json_encode([
                'status' => 'error', 
                'message' => 'Cannot release reservation: Reservation has been declined/rejected',
                'current_status' => $currentStatus['status_master_name']
            ]);
        }
        
        if ($currentStatusId === 5) {
            return json_encode([
                'status' => 'error', 
                'message' => 'Cannot release reservation: Reservation has been completed',
                'current_status' => $currentStatus['status_master_name']
            ]);
        }


        // Prepare personnel full name (First + Middle Initial + Last)
        $personnelFullName = null;
        try {
            $personSql = "SELECT CONCAT(
                                u.users_fname,
                                CASE 
                                    WHEN u.users_mname IS NOT NULL AND u.users_mname != '' THEN CONCAT(' ', LEFT(u.users_mname, 1), '.')
                                    ELSE ''
                                END,
                                ' ',
                                u.users_lname
                            ) AS full_name
                         FROM tbl_users u WHERE u.users_id = :id";
            $personStmt = $this->conn->prepare($personSql);
            $personStmt->execute([':id' => $user_personnel_id]);
            $row = $personStmt->fetch(PDO::FETCH_ASSOC);
            $personnelFullName = $row && !empty($row['full_name']) ? $row['full_name'] : null;
        } catch (PDOException $e) {
            // Fallback handled later
            $personnelFullName = null;
        }

        // Prepare audit statement once
        $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
        $auditStmt = $this->conn->prepare($auditSql);

        // Insert new status with status_id = 9 and active = 1
        $reservationIdForStatus = null;
        
        switch ($type) {
            case 'venue':
                
                
                // Try primary approach: using resource_id as reservation_venue_id
                $stmtFetchVenueId = $this->conn->prepare("SELECT reservation_venue_venue_id, reservation_change_venue_id, reservation_reservation_id, active FROM tbl_reservation_venue WHERE reservation_venue_id = :reservation_venue_id");
                $stmtFetchVenueId->bindParam(':reservation_venue_id', $resource_id, PDO::PARAM_INT);
                $stmtFetchVenueId->execute();
                $venue = $stmtFetchVenueId->fetch(PDO::FETCH_ASSOC);

                // Alternative approach: if not found by reservation_venue_id, try using reservation_id
                if (!$venue) {
                    
                    
                    $stmtFetchVenueAlt = $this->conn->prepare("
                        SELECT reservation_venue_id, reservation_venue_venue_id, reservation_change_venue_id, reservation_reservation_id, active 
                        FROM tbl_reservation_venue 
                        WHERE reservation_reservation_id = :reservation_id 
                        AND active = 0
                        LIMIT 1
                    ");
                    $stmtFetchVenueAlt->bindParam(':reservation_id', $reservation_id, PDO::PARAM_INT);
                    $stmtFetchVenueAlt->execute();
                    $venue = $stmtFetchVenueAlt->fetch(PDO::FETCH_ASSOC);
                    
                    // If found via alternative method, update resource_id for subsequent operations
                    if ($venue) {
                        $resource_id = (int)$venue['reservation_venue_id'];
                    }
                }

                

                if (!$venue) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Reservation venue not found. Please ensure the venue is assigned to this reservation and not yet released.',
                        'debug' => [
                            'resource_id' => $resource_id,
                            'reservation_id' => $reservation_id,
                            'type' => $type
                        ]
                    ]);
                }

                // CRITICAL: Check if venue is already released (active = 1)
                if (isset($venue['active']) && (int)$venue['active'] === 1) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'This venue is already released. Cannot release again.'
                    ]);
                }

                // Store reservation_id for status insert
                $reservationIdForStatus = (int)$venue['reservation_reservation_id'];

                // Determine if reservation has active status 10
                $ridForStatus = (int)$venue['reservation_reservation_id'];
                $stmtStatus = $this->conn->prepare("SELECT 1 FROM tbl_reservation_status WHERE reservation_reservation_id = :rid AND reservation_status_status_id = 10 AND reservation_active = 1 LIMIT 1");
                $stmtStatus->execute([':rid' => $ridForStatus]);
                $useChangeVenue = (bool)$stmtStatus->fetchColumn();

                $venue_id = ($useChangeVenue && !empty($venue['reservation_change_venue_id'])) ? (int)$venue['reservation_change_venue_id'] : (int)$venue['reservation_venue_venue_id'];

                $sqlUpdateStatus = "UPDATE tbl_venue SET status_availability_id = :status_availability_id WHERE ven_id = :venue_id";
                $stmtStatus = $this->conn->prepare($sqlUpdateStatus);
                $stmtStatus->execute([
                    'status_availability_id' => $status_availability_id,
                    'venue_id' => $venue_id
                ]);

                $sqlUpdateActive = "UPDATE tbl_reservation_venue SET active = 1 WHERE reservation_venue_id = :reservation_venue_id";
                $stmtActive = $this->conn->prepare($sqlUpdateActive);
                $stmtActive->execute(['reservation_venue_id' => $resource_id]);

                // Audit: Venue name
                $venueName = null;
                try {
                    $q = $this->conn->prepare("SELECT ven_name FROM tbl_venue WHERE ven_id = :venue_id");
                    $q->execute([':venue_id' => $venue_id]);
                    $r = $q->fetch(PDO::FETCH_ASSOC);
                    $venueName = $r && !empty($r['ven_name']) ? $r['ven_name'] : null;
                } catch (PDOException $e) { /* ignore */ }
                $nameForLog = $personnelFullName ?? ('User #' . (int)$user_personnel_id);
                $resForLog = $venueName ?? ('Venue #' . (int)$venue_id);
                $desc = "Venue {$resForLog} released by: {$nameForLog}";
                try { $auditStmt->execute([':description'=>$desc, ':action'=>'RELEASE', ':created_by'=>$user_personnel_id]); } catch (PDOException $e) { /* ignore */ }
                break;

            case 'vehicle':
                
                
                // Try primary approach: using resource_id as reservation_vehicle_id
                $stmtFetchVehicleId = $this->conn->prepare("SELECT reservation_vehicle_vehicle_id, reservation_change_vehicle_id, reservation_reservation_id, active FROM tbl_reservation_vehicle WHERE reservation_vehicle_id = :reservation_vehicle_id");
                $stmtFetchVehicleId->execute(['reservation_vehicle_id' => $resource_id]);
                $vehicle = $stmtFetchVehicleId->fetch(PDO::FETCH_ASSOC);

                // Alternative approach: if not found by reservation_vehicle_id, try using reservation_id
                if (!$vehicle) {
                    
                    
                    $stmtFetchVehicleAlt = $this->conn->prepare("
                        SELECT reservation_vehicle_id, reservation_vehicle_vehicle_id, reservation_change_vehicle_id, reservation_reservation_id, active 
                        FROM tbl_reservation_vehicle 
                        WHERE reservation_reservation_id = :reservation_id 
                        AND active = 0
                        LIMIT 1
                    ");
                    $stmtFetchVehicleAlt->bindParam(':reservation_id', $reservation_id, PDO::PARAM_INT);
                    $stmtFetchVehicleAlt->execute();
                    $vehicle = $stmtFetchVehicleAlt->fetch(PDO::FETCH_ASSOC);
                    
                    // If found via alternative method, update resource_id for subsequent operations
                    if ($vehicle) {
                        $resource_id = (int)$vehicle['reservation_vehicle_id'];
                    }
                }

                

                if (!$vehicle) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Reservation vehicle not found. Please ensure the vehicle is assigned to this reservation and not yet released.',
                        'debug' => [
                            'resource_id' => $resource_id,
                            'reservation_id' => $reservation_id,
                            'type' => $type
                        ]
                    ]);
                }

                // CRITICAL: Check if vehicle is already released (active = 1)
                if (isset($vehicle['active']) && (int)$vehicle['active'] === 1) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'This vehicle is already released. Cannot release again.'
                    ]);
                }

                // Store reservation_id for status insert
                $reservationIdForStatus = (int)$vehicle['reservation_reservation_id'];

                // Determine if reservation has active status 10
                $ridForStatus = (int)$vehicle['reservation_reservation_id'];
                $stmtStatus = $this->conn->prepare("SELECT 1 FROM tbl_reservation_status WHERE reservation_reservation_id = :rid AND reservation_status_status_id = 10 AND reservation_active = 1 LIMIT 1");
                $stmtStatus->execute([':rid' => $ridForStatus]);
                $useChangeVehicle = (bool)$stmtStatus->fetchColumn();

                $vehicle_id = ($useChangeVehicle && !empty($vehicle['reservation_change_vehicle_id'])) ? (int)$vehicle['reservation_change_vehicle_id'] : (int)$vehicle['reservation_vehicle_vehicle_id'];

                $sqlUpdateStatus = "UPDATE tbl_vehicle SET status_availability_id = :status_availability_id WHERE vehicle_id = :vehicle_id";
                $stmtStatus = $this->conn->prepare($sqlUpdateStatus);
                $stmtStatus->execute([
                    'status_availability_id' => $status_availability_id,
                    'vehicle_id' => $vehicle_id
                ]);

                $sqlUpdateActive = "UPDATE tbl_reservation_vehicle SET active = 1 WHERE reservation_vehicle_id = :reservation_vehicle_id";
                $stmtActive = $this->conn->prepare($sqlUpdateActive);
                $stmtActive->execute(['reservation_vehicle_id' => $resource_id]);

                // Audit: Vehicle model and license
                $vehicleDisplay = null;
                try {
                    $q = $this->conn->prepare("SELECT CONCAT(vm.vehicle_model_name, ' (', v.vehicle_license, ')') AS display
                                                FROM tbl_vehicle v 
                                                JOIN tbl_vehicle_model vm ON v.vehicle_model_id = vm.vehicle_model_id
                                                WHERE v.vehicle_id = :vid");
                    $q->execute([':vid' => $vehicle_id]);
                    $r = $q->fetch(PDO::FETCH_ASSOC);
                    $vehicleDisplay = $r && !empty($r['display']) ? $r['display'] : null;
                } catch (PDOException $e) { /* ignore */ }
                $nameForLog = $personnelFullName ?? ('User #' . (int)$user_personnel_id);
                $resForLog = $vehicleDisplay ?? ('Vehicle #' . (int)$vehicle_id);
                $desc = "Vehicle {$resForLog} released by: {$nameForLog}";
                try { $auditStmt->execute([':description'=>$desc, ':action'=>'RELEASE', ':created_by'=>$user_personnel_id]); } catch (PDOException $e) { /* ignore */ }
                break;

            case 'equipment':
                
                
                // Try primary approach: using resource_id as reservation_unit_id
                $stmtFetchUnitId = $this->conn->prepare("SELECT ru.unit_id, re.reservation_reservation_id, ru.active 
                                                          FROM tbl_reservation_unit ru
                                                          LEFT JOIN tbl_reservation_equipment re ON ru.reservation_equipment_id = re.reservation_equipment_id
                                                          WHERE ru.reservation_unit_id = :reservation_unit_id");
                $stmtFetchUnitId->execute(['reservation_unit_id' => $resource_id]);
                $unit = $stmtFetchUnitId->fetch(PDO::FETCH_ASSOC);

                // Alternative approach: if not found by reservation_unit_id, try using reservation_id
                if (!$unit) {
                    
                    
                    $stmtFetchUnitAlt = $this->conn->prepare("
                        SELECT ru.reservation_unit_id, ru.unit_id, re.reservation_reservation_id, ru.active 
                        FROM tbl_reservation_unit ru
                        LEFT JOIN tbl_reservation_equipment re ON ru.reservation_equipment_id = re.reservation_equipment_id
                        WHERE re.reservation_reservation_id = :reservation_id 
                        AND ru.active = 0
                        LIMIT 1
                    ");
                    $stmtFetchUnitAlt->bindParam(':reservation_id', $reservation_id, PDO::PARAM_INT);
                    $stmtFetchUnitAlt->execute();
                    $unit = $stmtFetchUnitAlt->fetch(PDO::FETCH_ASSOC);
                    
                    // If found via alternative method, update resource_id for subsequent operations
                    if ($unit) {
                        $resource_id = (int)$unit['reservation_unit_id'];
                    }
                }

                

                if (!$unit) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Reservation equipment unit not found. Please ensure the equipment is assigned to this reservation and not yet released.',
                        'debug' => [
                            'resource_id' => $resource_id,
                            'reservation_id' => $reservation_id,
                            'type' => $type
                        ]
                    ]);
                }

                // CRITICAL: Check if equipment unit is already released (active = 1)
                if (isset($unit['active']) && (int)$unit['active'] === 1) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'This equipment unit is already released. Cannot release again.'
                    ]);
                }

                // Store reservation_id for status insert
                if (!empty($unit['reservation_reservation_id'])) {
                    $reservationIdForStatus = (int)$unit['reservation_reservation_id'];
                }

                $unit_id = (int)$unit['unit_id'];

                $sqlUpdateStatus = "UPDATE tbl_equipment_unit SET status_availability_id = :status_availability_id WHERE unit_id = :unit_id";
                $stmtStatus = $this->conn->prepare($sqlUpdateStatus);
                $stmtStatus->execute([
                    'status_availability_id' => $status_availability_id,
                    'unit_id' => $unit_id
                ]);

                $sqlUpdateActive = "UPDATE tbl_reservation_unit SET active = 1 WHERE reservation_unit_id = :reservation_unit_id";
                $stmtActive = $this->conn->prepare($sqlUpdateActive);
                $stmtActive->execute(['reservation_unit_id' => $resource_id]);

                // Audit: Equipment unit serial number
                $serial = null;
                try {
                    $q = $this->conn->prepare("SELECT serial_number FROM tbl_equipment_unit WHERE unit_id = :uid");
                    $q->execute([':uid' => $unit_id]);
                    $r = $q->fetch(PDO::FETCH_ASSOC);
                    $serial = $r && !empty($r['serial_number']) ? $r['serial_number'] : null;
                } catch (PDOException $e) { /* ignore */ }
                $nameForLog = $personnelFullName ?? ('User #' . (int)$user_personnel_id);
                $resForLog = $serial ? ('Unit ' . $serial) : ('Equipment Unit #' . (int)$unit_id);
                $desc = "Equipment Unit {$resForLog} released by: {$nameForLog}";
                try { $auditStmt->execute([':description'=>$desc, ':action'=>'RELEASE', ':created_by'=>$user_personnel_id]); } catch (PDOException $e) { /* ignore */ }
                break;

            case 'equipment_bulk':
                
                
                // Try primary approach: using resource_id as reservation_equipment_id
                $stmtFetchReservation = $this->conn->prepare("SELECT re.reservation_reservation_id, re.reservation_equipment_equip_id, re.active, re.release_quantity, re.reservation_equipment_quantity
                                                               FROM tbl_reservation_equipment re
                                                               WHERE re.reservation_equipment_id = :reservation_equipment_id");
                $stmtFetchReservation->execute(['reservation_equipment_id' => $resource_id]);
                $resData = $stmtFetchReservation->fetch(PDO::FETCH_ASSOC);
                
                // Alternative approach: if not found by reservation_equipment_id, try using reservation_id
                if (!$resData) {
                    
                    
                    $stmtFetchReservationAlt = $this->conn->prepare("
                        SELECT re.reservation_equipment_id, re.reservation_reservation_id, re.reservation_equipment_equip_id, re.active, re.release_quantity, re.reservation_equipment_quantity
                        FROM tbl_reservation_equipment re
                        WHERE re.reservation_reservation_id = :reservation_id 
                        AND (re.active = 0 OR re.release_quantity < re.reservation_equipment_quantity)
                        LIMIT 1
                    ");
                    $stmtFetchReservationAlt->bindParam(':reservation_id', $reservation_id, PDO::PARAM_INT);
                    $stmtFetchReservationAlt->execute();
                    $resData = $stmtFetchReservationAlt->fetch(PDO::FETCH_ASSOC);
                    
                    // If found via alternative method, update resource_id for subsequent operations
                    if ($resData) {
                        $resource_id = (int)$resData['reservation_equipment_id'];
                        
                    }
                }

            
                
                if (!$resData) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Reservation equipment not found. Please ensure the equipment is assigned to this reservation and not yet fully released.',
                        'debug' => [
                            'resource_id' => $resource_id,
                            'reservation_id' => $reservation_id,
                            'type' => $type
                        ]
                    ]);
                }
                
                // Get current release_quantity (default to 0 if null)
                $currentReleaseQty = isset($resData['release_quantity']) ? (int)$resData['release_quantity'] : 0;
                $totalRequestedQty = (int)$resData['reservation_equipment_quantity'];
                
                // CRITICAL: Check if equipment_bulk is already fully released
                if (isset($resData['active']) && (int)$resData['active'] === 1 && $currentReleaseQty >= $totalRequestedQty) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'This equipment is already fully released. Cannot release again.'
                    ]);
                }
                
                if ($resData && !empty($resData['reservation_reservation_id'])) {
                    $reservationIdForStatus = (int)$resData['reservation_reservation_id'];
                }
                
                // Extract the actual equip_id from the fetched data
                $actual_equip_id = (int)$resData['reservation_equipment_equip_id'];

                // Get quantity_id from equip_id
                $stmtGetQuantityId = $this->conn->prepare("SELECT quantity_id FROM tbl_equipment_quantity WHERE equip_id = :equip_id");
                $stmtGetQuantityId->execute(['equip_id' => $actual_equip_id]);
                $quantityIdData = $stmtGetQuantityId->fetch(PDO::FETCH_ASSOC);
                
                if (!$quantityIdData) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Equipment quantity record not found for equip_id: ' . $actual_equip_id
                    ]);
                }
                
                $quantity_id = (int)$quantityIdData['quantity_id'];

                // Fetch current on_hand_quantity from tbl_equipment_quantity
                $sqlFetchQuantity = "SELECT on_hand_quantity FROM tbl_equipment_quantity WHERE quantity_id = :quantity_id";
                $stmtFetch = $this->conn->prepare($sqlFetchQuantity);
                $stmtFetch->execute(['quantity_id' => $quantity_id]);
                $quantityData = $stmtFetch->fetch(PDO::FETCH_ASSOC);

                if (!$quantityData) {
                    $currentOnHandQuantity = 0;
                } else {
                    $currentOnHandQuantity = (int)$quantityData['on_hand_quantity'];
                }

                // Validate quantity parameter
                if ($quantity === null || !is_numeric($quantity) || $quantity <= 0) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Invalid quantity parameter for deduction.'
                    ]);
                }

                // Calculate how much more can be released
                $requestedQty = (int)$quantity;
                $remainingToRelease = $totalRequestedQty - $currentReleaseQty;
                
                // Check if trying to release more than remaining
                if ($requestedQty > $remainingToRelease) {
                    return json_encode([
                        'status' => 'error',
                        'message' => "Cannot release {$requestedQty} units. Only {$remainingToRelease} units remaining to release (Total: {$totalRequestedQty}, Already Released: {$currentReleaseQty})."
                    ]);
                }

                // Validate sufficient stock before attempting release
                if ($currentOnHandQuantity < $requestedQty) {
                    // Get equipment name for better error message
                    $equipNameForError = null;
                    try {
                        $qName = $this->conn->prepare("SELECT equip_name FROM tbl_equipments WHERE equip_id = :equip_id");
                        $qName->execute([':equip_id' => $actual_equip_id]);
                        $rName = $qName->fetch(PDO::FETCH_ASSOC);
                        $equipNameForError = $rName && !empty($rName['equip_name']) ? $rName['equip_name'] : null;
                    } catch (PDOException $e) { /* ignore */ }
                    
                    $equipmentLabel = $equipNameForError ? $equipNameForError : "Equipment #" . $actual_equip_id;
                    return json_encode([
                        'status' => 'error',
                        'message' => "Insufficient stock for {$equipmentLabel}. Available: {$currentOnHandQuantity}, Requested: {$requestedQty}. Please contact admin to update inventory."
                    ]);
                }

                // Calculate new on_hand_quantity (allow it to reach 0)
                $newOnHandQuantity = $currentOnHandQuantity - $requestedQty;
                
                // Calculate new release_quantity
                $newReleaseQty = $currentReleaseQty + $requestedQty;

                // Update on_hand_quantity in tbl_equipment_quantity
                $sqlUpdateQuantity = "UPDATE tbl_equipment_quantity 
                                    SET on_hand_quantity = :new_quantity 
                                    WHERE quantity_id = :quantity_id";
                $stmtUpdateQuantity = $this->conn->prepare($sqlUpdateQuantity);
                $stmtUpdateQuantity->execute([
                    'new_quantity' => $newOnHandQuantity,
                    'quantity_id' => $quantity_id
                ]);

                // Check if update was successful
                if ($stmtUpdateQuantity->rowCount() === 0) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Failed to update equipment inventory. Database update did not affect any rows. Please contact admin.'
                    ]);
                }

                // Update active flag and release_quantity in tbl_reservation_equipment
                // Only set active = 1 when fully released (release_quantity >= total requested)
                $isFullyReleased = ($newReleaseQty >= $totalRequestedQty) ? 1 : 0;
                
                $sqlUpdateActive = "UPDATE tbl_reservation_equipment 
                                   SET active = :active, release_quantity = :release_quantity 
                                   WHERE reservation_equipment_id = :reservation_equipment_id";
                $stmtActive = $this->conn->prepare($sqlUpdateActive);
                $stmtActive->execute([
                    'active' => $isFullyReleased,
                    'release_quantity' => $newReleaseQty,
                    'reservation_equipment_id' => $resource_id
                ]);
                
                // Log the update result
             

                // Audit: Equipment (bulk) name
                $equipName = null;
                try {
                    $q = $this->conn->prepare("SELECT equip_name FROM tbl_equipments WHERE equip_id = :equip_id");
                    $q->execute([':equip_id' => $actual_equip_id]);
                    $r = $q->fetch(PDO::FETCH_ASSOC);
                    $equipName = $r && !empty($r['equip_name']) ? $r['equip_name'] : null;
                } catch (PDOException $e) { /* ignore */ }
                $nameForLog = $personnelFullName ?? ('User #' . (int)$user_personnel_id);
                $resForLog = $equipName ?? ('Equipment #' . (int)$actual_equip_id);
                $desc = "Equipment {$resForLog} released ({$requestedQty} units, total released: {$newReleaseQty}/{$totalRequestedQty}) by: {$nameForLog}";
                try { $auditStmt->execute([':description'=>$desc, ':action'=>'RELEASE', ':created_by'=>$user_personnel_id]); } catch (PDOException $e) { /* ignore */ }
                break;


            default:
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid type'
                ]);
        }
        // Insert new status with status_id = 9 and active = 1 if we have a reservation_id
        if ($reservationIdForStatus) {
            // Check if status 9 already exists for this reservation
            $checkStatus9Sql = "SELECT COUNT(*) as count FROM tbl_reservation_status 
                                WHERE reservation_reservation_id = :reservation_id 
                                AND reservation_status_status_id = 9";
            $stmtCheckStatus9 = $this->conn->prepare($checkStatus9Sql);
            $stmtCheckStatus9->execute(['reservation_id' => $reservationIdForStatus]);
            $status9Exists = $stmtCheckStatus9->fetch(PDO::FETCH_ASSOC);
            
            // Only insert status 9 if it doesn't already exist
            if ($status9Exists['count'] == 0) {
                $timestamp = date('Y-m-d H:i:s');
                $insertStatusSql = "INSERT INTO tbl_reservation_status (
                                        reservation_status_status_id, 
                                        reservation_reservation_id, 
                                        reservation_active, 
                                        reservation_users_id,
                                        reservation_updated_at
                                    ) VALUES (
                                        9, :reservation_id, 1, :user_personnel_id, :timestamp
                                    )";
                $stmtInsertStatus = $this->conn->prepare($insertStatusSql);
                $stmtInsertStatus->execute([
                    'reservation_id' => $reservationIdForStatus,
                    'user_personnel_id' => $user_personnel_id,
                    'timestamp' => $timestamp
                ]);
                
            } else {
                error_log("Status 9 already exists for reservation ID: " . $reservationIdForStatus . " - skipping insert");
            }
        }

        return json_encode([
            'status' => 'success',
            'message' => 'Status and active flag updated successfully'
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}







public function updateReturn($type, $reservation_id, $resource_id, $condition, $user_personnel_id, $bad_quantity = 0, $good_quantity = 0, $remarks = null) {
    try {
        // If both condition and remarks are empty, return error
        if ((empty($condition) || strtolower($condition) === 'null') && (empty($remarks) || strtolower($remarks) === 'null')) {
            return json_encode([
                'status' => 'error',
                'message' => 'Either condition or remarks must be provided.'
            ]);
        }

        // Normalize remarks
        $remarksValue = (!isset($remarks) || $remarks === '' || strtolower($remarks) === 'null') ? null : $remarks;

        // Determine if a valid condition was provided
        $hasCondition = isset($condition) && $condition !== '' && strtolower((string)$condition) !== 'null';

        // Map provided condition (numeric or string) to status and condition_id.
        if ($hasCondition) {
            if (is_numeric($condition)) {
                switch (intval($condition)) {
                    case 2: // good
                        $status_availability_id = 1;
                        $condition_id = 2;
                        $conditionText = 'Good';
                        break;
                    case 4: // damage
                        $status_availability_id = 8;
                        $condition_id = 4;
                        $conditionText = 'Damage';
                        break;
                    case 3: // missing
                        $status_availability_id = 7;
                        $condition_id = 3;
                        $conditionText = 'Missing';
                        break;
                    case 7: // for inspection
                        $status_availability_id = 6;
                        $condition_id = 7;
                        $conditionText = 'For Inspection';
                        break;
                    default:
                        return json_encode([
                            'status' => 'error',
                            'message' => 'Invalid numeric condition provided.'
                        ]);
                }
            } else {
                switch (strtolower($condition)) {
                    case 'good':
                        $status_availability_id = 1;
                        $condition_id = 2;
                        $conditionText = 'Good';
                        break;
                    case 'damage':
                        $status_availability_id = 8;
                        $condition_id = 4;
                        $conditionText = 'Damage';
                        break;
                    case 'missing':
                        $status_availability_id = 7;
                        $condition_id = 3;
                        $conditionText = 'Missing';
                        break;
                    case 'for inspection':
                        $status_availability_id = 6;
                        $condition_id = 7;
                        $conditionText = 'For Inspection';
                        break;
                    default:
                        return json_encode([
                            'status' => 'error',
                            'message' => 'Invalid condition provided.'
                        ]);
                }
            }
        } else if ($remarksValue !== null) {
            // No condition provided but remarks exist -> default to For Inspection (7)
            $condition_id = 7;
            $status_availability_id = 6;
            $conditionText = 'For Inspection';
        } else {
            return json_encode([
                'status' => 'error',
                'message' => 'Either a valid condition or remarks must be provided.'
            ]);
        }

        // Prepare audit inserter and fetch personnel full name for logging
        $auditStmt = null;
        $personnelFullName = null;
        try {
            $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
            $auditStmt = $this->conn->prepare($auditSql);
        } catch (PDOException $e) { /* ignore */ }
        try {
            $personSql = "SELECT CONCAT(
                                u.users_fname,
                                CASE 
                                    WHEN u.users_mname IS NOT NULL AND u.users_mname != '' THEN CONCAT(' ', LEFT(u.users_mname, 1), '.')
                                    ELSE ''
                                END,
                                ' ',
                                u.users_lname
                            ) AS full_name
                         FROM tbl_users u WHERE u.users_id = :id";
            $personStmt = $this->conn->prepare($personSql);
            $personStmt->execute([':id' => $user_personnel_id]);
            $prow = $personStmt->fetch(PDO::FETCH_ASSOC);
            $personnelFullName = $prow && !empty($prow['full_name']) ? $prow['full_name'] : null;
        } catch (PDOException $e) { /* ignore */ }

        // Validate that the item hasn't already been returned
        switch ($type) {
            case 'venue':
                $checkStmt = $this->conn->prepare("SELECT 1 FROM tbl_reservation_condition_venue WHERE reservation_venue_id = :reservation_id AND is_active = 1 LIMIT 1");
                $checkStmt->execute(['reservation_id' => $reservation_id]);
                if ($checkStmt->fetchColumn()) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'This venue has already been returned and recorded in the condition table.'
                    ]);
                }
                break;
            case 'vehicle':
                $checkStmt = $this->conn->prepare("SELECT 1 FROM tbl_reservation_condition_vehicle WHERE reservation_vehicle_id = :reservation_id AND is_active = 1 LIMIT 1");
                $checkStmt->execute(['reservation_id' => $reservation_id]);
                if ($checkStmt->fetchColumn()) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'This vehicle has already been returned and recorded in the condition table.'
                    ]);
                }
                break;
            case 'equipment':
                $checkStmt = $this->conn->prepare("SELECT 1 FROM tbl_reservation_condition_unit WHERE reservation_unit_id = :reservation_id AND is_active = 1 LIMIT 1");
                $checkStmt->execute(['reservation_id' => $reservation_id]);
                if ($checkStmt->fetchColumn()) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'This equipment unit has already been returned and recorded in the condition table.'
                    ]);
                }
                break;
            case 'equipment_bulk':
                $checkStmt = $this->conn->prepare("SELECT 1 FROM tbl_reservation_condition_equipment WHERE reservation_equipment_id = :reservation_id AND is_active = 1 LIMIT 1");
                $checkStmt->execute(['reservation_id' => $reservation_id]);
                if ($checkStmt->fetchColumn()) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'This equipment has already been returned and recorded in the condition table.'
                    ]);
                }
                break;
            default:
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid type.'
                ]);
        }

        // Validate that the resource is currently active (active = 1) before allowing return
        switch ($type) {
            case 'venue':
                $activeCheckStmt = $this->conn->prepare("SELECT active FROM tbl_reservation_venue WHERE reservation_venue_id = :reservation_id LIMIT 1");
                $activeCheckStmt->execute(['reservation_id' => $reservation_id]);
                $activeStatus = $activeCheckStmt->fetchColumn();
                if ($activeStatus === false) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Venue reservation not found.'
                    ]);
                }
                if ($activeStatus != 1) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Cannot update checklist. This venue is currently in a different status and cannot be returned at this time. Please report this issue to the admin immediately.',
                        'error_code' => 'RESOURCE_NOT_ACTIVE'
                    ]);
                }
                break;
            case 'vehicle':
                $activeCheckStmt = $this->conn->prepare("SELECT active FROM tbl_reservation_vehicle WHERE reservation_vehicle_id = :reservation_id LIMIT 1");
                $activeCheckStmt->execute(['reservation_id' => $reservation_id]);
                $activeStatus = $activeCheckStmt->fetchColumn();
                if ($activeStatus === false) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Vehicle reservation not found.'
                    ]);
                }
                if ($activeStatus != 1) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Cannot update checklist. This vehicle is currently in a different status and cannot be returned at this time. Please report this issue to the admin immediately.',
                        'error_code' => 'RESOURCE_NOT_ACTIVE'
                    ]);
                }
                break;
            case 'equipment':
                $activeCheckStmt = $this->conn->prepare("SELECT active FROM tbl_reservation_unit WHERE reservation_unit_id = :reservation_id LIMIT 1");
                $activeCheckStmt->execute(['reservation_id' => $reservation_id]);
                $activeStatus = $activeCheckStmt->fetchColumn();
                if ($activeStatus === false) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Equipment unit reservation not found.'
                    ]);
                }
                if ($activeStatus != 1) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Cannot update checklist. This equipment unit is currently in a different status and cannot be returned at this time. Please report this issue to the admin immediately.',
                        'error_code' => 'RESOURCE_NOT_ACTIVE'
                    ]);
                }
                break;
            case 'equipment_bulk':
                $activeCheckStmt = $this->conn->prepare("SELECT active FROM tbl_reservation_equipment WHERE reservation_equipment_id = :reservation_id LIMIT 1");
                $activeCheckStmt->execute(['reservation_id' => $reservation_id]);
                $activeStatus = $activeCheckStmt->fetchColumn();
                if ($activeStatus === false) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Equipment reservation not found.'
                    ]);
                }
                if ($activeStatus != 1) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Cannot update checklist. This equipment is currently in a different status and cannot be returned at this time. Please report this issue to the admin immediately.',
                        'error_code' => 'RESOURCE_NOT_ACTIVE'
                    ]);
                }
                break;
            default:
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid type for active status validation.'
                ]);
        }

        switch ($type) {
            case 'venue':
                $stmtFetchVenueId = $this->conn->prepare("SELECT reservation_venue_venue_id, reservation_change_venue_id, reservation_reservation_id FROM tbl_reservation_venue WHERE reservation_venue_id = :reservation_id");
                $stmtFetchVenueId->execute(['reservation_id' => $reservation_id]);
                $venue = $stmtFetchVenueId->fetch(PDO::FETCH_ASSOC);
                if (!$venue) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Reservation venue ID not found.'
                    ]);
                }
                // Determine if reservation has active status 10
                $ridForStatus = (int)$venue['reservation_reservation_id'];
                $stmtStatusCheck = $this->conn->prepare("SELECT 1 FROM tbl_reservation_status WHERE reservation_reservation_id = :rid AND reservation_status_status_id = 10 AND reservation_active = 1 LIMIT 1");
                $stmtStatusCheck->execute([':rid' => $ridForStatus]);
                $useChangeVenue = (bool)$stmtStatusCheck->fetchColumn();

                $venue_id = ($useChangeVenue && !empty($venue['reservation_change_venue_id'])) ? (int)$venue['reservation_change_venue_id'] : (int)$venue['reservation_venue_venue_id'];

                $stmtStatus = $this->conn->prepare("UPDATE tbl_venue SET status_availability_id = :status_availability_id WHERE ven_id = :venue_id");
                $stmtStatus->execute([
                    'status_availability_id' => $status_availability_id,
                    'venue_id' => $venue_id
                ]);
                $stmtActive = $this->conn->prepare("UPDATE tbl_reservation_venue SET active = -1 WHERE reservation_venue_id = :reservation_id");
                $stmtActive->execute(['reservation_id' => $reservation_id]);
                $stmtCond = $this->conn->prepare("INSERT INTO tbl_reservation_condition_venue (reservation_venue_id, condition_id, is_active, user_personnel_id, remarks) VALUES (:reservation_id, :condition_id, 1, :user_personnel_id, :remarks)");
                $stmtCond->execute([
                    'reservation_id' => $reservation_id,
                    'condition_id' => $condition_id,
                    'user_personnel_id' => $user_personnel_id,
                    'remarks' => $remarksValue
                ]);
                // Audit: Venue return
                if ($auditStmt) {
                    $venueName = null;
                    try {
                        $q = $this->conn->prepare("SELECT ven_name FROM tbl_venue WHERE ven_id = :venue_id");
                        $q->execute([':venue_id' => $venue_id]);
                        $r = $q->fetch(PDO::FETCH_ASSOC);
                        $venueName = $r && !empty($r['ven_name']) ? $r['ven_name'] : null;
                    } catch (PDOException $e) { /* ignore */ }
                    $nameForLog = $personnelFullName ?? ('User #' . (int)$user_personnel_id);
                    $resForLog = $venueName ?? ('Venue #' . (int)$venue_id);
                    $desc = "Venue {$resForLog} returned by: {$nameForLog} - condition: {$conditionText}";
                    if ($remarksValue !== null && $remarksValue !== '') { $desc .= " - remarks: {$remarksValue}"; }
                    try { $auditStmt->execute([':description'=>$desc, ':action'=>'RETURN', ':created_by'=>$user_personnel_id]); } catch (PDOException $e) { /* ignore */ }
                }
                break;
            case 'vehicle':
                $stmtStatus = $this->conn->prepare("UPDATE tbl_vehicle SET status_availability_id = :status_availability_id WHERE vehicle_id = :resource_id");
                $stmtStatus->execute([
                    'status_availability_id' => $status_availability_id,
                    'resource_id' => $resource_id
                ]);
                $stmtActive = $this->conn->prepare("UPDATE tbl_reservation_vehicle SET active = -1 WHERE reservation_vehicle_id = :reservation_id");
                $stmtActive->execute(['reservation_id' => $reservation_id]);
                $stmtCond = $this->conn->prepare("INSERT INTO tbl_reservation_condition_vehicle (reservation_vehicle_id, condition_id, is_active, user_personnel_id, remarks) VALUES (:reservation_id, :condition_id, 1, :user_personnel_id, :remarks)");
                $stmtCond->execute([
                    'reservation_id' => $reservation_id,
                    'condition_id' => $condition_id,
                    'user_personnel_id' => $user_personnel_id,
                    'remarks' => $remarksValue
                ]);
                // Audit: Vehicle return
                if ($auditStmt) {
                    $vehicleDisplay = null;
                    try {
                        $q = $this->conn->prepare("SELECT CONCAT(vm.vehicle_model_name, ' (', v.vehicle_license, ')') AS display
                                                    FROM tbl_vehicle v 
                                                    JOIN tbl_vehicle_model vm ON v.vehicle_model_id = vm.vehicle_model_id
                                                    WHERE v.vehicle_id = :vid");
                        $q->execute([':vid' => $resource_id]);
                        $r = $q->fetch(PDO::FETCH_ASSOC);
                        $vehicleDisplay = $r && !empty($r['display']) ? $r['display'] : null;
                    } catch (PDOException $e) { /* ignore */ }
                    $nameForLog = $personnelFullName ?? ('User #' . (int)$user_personnel_id);
                    $resForLog = $vehicleDisplay ?? ('Vehicle #' . (int)$resource_id);
                    $desc = "Vehicle {$resForLog} returned by: {$nameForLog} - condition: {$conditionText}";
                    if ($remarksValue !== null && $remarksValue !== '') { $desc .= " - remarks: {$remarksValue}"; }
                    try { $auditStmt->execute([':description'=>$desc, ':action'=>'RETURN', ':created_by'=>$user_personnel_id]); } catch (PDOException $e) { /* ignore */ }
                }
                break;
            case 'equipment':
                $stmtStatus = $this->conn->prepare("UPDATE tbl_equipment_unit SET status_availability_id = :status_availability_id WHERE unit_id = :resource_id");
                $stmtStatus->execute([
                    'status_availability_id' => $status_availability_id,
                    'resource_id' => $resource_id
                ]);
                $stmtActive = $this->conn->prepare("UPDATE tbl_reservation_unit SET active = -1 WHERE reservation_unit_id = :reservation_id");
                $stmtActive->execute(['reservation_id' => $reservation_id]);
                $stmtCond = $this->conn->prepare("INSERT INTO tbl_reservation_condition_unit (reservation_unit_id, condition_id, is_active, user_personnel_id, remarks) VALUES (:reservation_id, :condition_id, 1, :user_personnel_id, :remarks)");
                $stmtCond->execute([
                    'reservation_id' => $reservation_id,
                    'condition_id' => $condition_id,
                    'user_personnel_id' => $user_personnel_id,
                    'remarks' => $remarksValue
                ]);
                // Also deactivate bulk equipment reservation if exists
                $stmtDeactivateConsumable = $this->conn->prepare("UPDATE tbl_reservation_equipment SET active = -1 WHERE reservation_equipment_id = :reservation_id");
                $stmtDeactivateConsumable->execute(['reservation_id' => $reservation_id]);
                // Audit: Equipment unit return
                if ($auditStmt) {
                    $serial = null;
                    try {
                        $q = $this->conn->prepare("SELECT serial_number FROM tbl_equipment_unit WHERE unit_id = :uid");
                        $q->execute([':uid' => $resource_id]);
                        $r = $q->fetch(PDO::FETCH_ASSOC);
                        $serial = $r && !empty($r['serial_number']) ? $r['serial_number'] : null;
                    } catch (PDOException $e) { /* ignore */ }
                    $nameForLog = $personnelFullName ?? ('User #' . (int)$user_personnel_id);
                    $resForLog = $serial ? ('Unit ' . $serial) : ('Equipment Unit #' . (int)$resource_id);
                    $desc = "Equipment Unit {$resForLog} returned by: {$nameForLog} - condition: {$conditionText}";
                    if ($remarksValue !== null && $remarksValue !== '') { $desc .= " - remarks: {$remarksValue}"; }
                    try { $auditStmt->execute([':description'=>$desc, ':action'=>'RETURN', ':created_by'=>$user_personnel_id]); } catch (PDOException $e) { /* ignore */ }
                }
                break;
            case 'equipment_bulk':
                $stmtFetchEquip = $this->conn->prepare("SELECT reservation_equipment_equip_id FROM tbl_reservation_equipment WHERE reservation_equipment_id = :rid");
                $stmtFetchEquip->execute(['rid' => $reservation_id]);
                $equipRow = $stmtFetchEquip->fetch(PDO::FETCH_ASSOC);
                if (!$equipRow) {
                    return json_encode([
                        'status'  => 'error',
                        'message' => 'Reservation equipment not found.'
                    ]);
                }
                $equip_id = $equipRow['reservation_equipment_equip_id'];
                if ($good_quantity > 0) {
                    // Increase on-hand quantity only; do not change status here
                    $stmtUpdateQty = $this->conn->prepare("UPDATE tbl_equipment_quantity SET on_hand_quantity = on_hand_quantity + :g, last_updated = NOW() WHERE equip_id = :eid");
                    $stmtUpdateQty->execute([
                        'g'    => $good_quantity,
                        'eid'  => $equip_id
                    ]);
                    // If after update the on_hand_quantity is 0, set status to 9 (Unavailable)
                    $stmtSetUnavailable = $this->conn->prepare("UPDATE tbl_equipment_quantity SET status_availability_id = 9 WHERE equip_id = :eid AND COALESCE(on_hand_quantity, 0) = 0");
                    $stmtSetUnavailable->execute(['eid' => $equip_id]);
                }
                // For damaged (4) or missing (3) items, reduce total quantity only (not on_hand, since it was already reduced when borrowed)
                if ($bad_quantity > 0 && ($condition_id == 3 || $condition_id == 4)) {
                    $stmtReduceQty = $this->conn->prepare("UPDATE tbl_equipment_quantity SET quantity = GREATEST(quantity - :b, 0), last_updated = NOW() WHERE equip_id = :eid");
                    $stmtReduceQty->execute([
                        'b'    => $bad_quantity,
                        'eid'  => $equip_id
                    ]);
                }
                if ($bad_quantity > 0 || $remarksValue !== null) {
                    $stmtInsertBad = $this->conn->prepare("INSERT INTO tbl_reservation_condition_equipment (reservation_equipment_id, condition_id, qty_bad, user_personnel_id, is_active, remarks) VALUES (:rid, :cid, :b, :uid, 1, :remarks)");
                    $stmtInsertBad->execute([
                        'rid' => $reservation_id,
                        'cid' => $condition_id,
                        'b'   => $bad_quantity,
                        'uid' => $user_personnel_id,
                        'remarks' => $remarksValue
                    ]);
                }
                $stmtDeactivate = $this->conn->prepare("UPDATE tbl_reservation_equipment SET active = -1 WHERE reservation_equipment_id = :rid");
                $stmtDeactivate->execute(['rid' => $reservation_id]);
                // Audit: Equipment bulk return
                if ($auditStmt) {
                    $equipName = null;
                    try {
                        $q = $this->conn->prepare("SELECT e.equip_name 
                                                    FROM tbl_equipments e 
                                                    WHERE e.equip_id = :eid");
                        $q->execute([':eid' => $equip_id]);
                        $r = $q->fetch(PDO::FETCH_ASSOC);
                        $equipName = $r && !empty($r['equip_name']) ? $r['equip_name'] : null;
                    } catch (PDOException $e) { /* ignore */ }
                    $nameForLog = $personnelFullName ?? ('User #' . (int)$user_personnel_id);
                    $resForLog = $equipName ?? ('Equipment #' . (int)$equip_id);
                    $qtyInfo = ' (good: ' . (int)$good_quantity . ', bad: ' . (int)$bad_quantity . ')';
                    $desc = "Equipment {$resForLog} returned by: {$nameForLog} - condition: {$conditionText}{$qtyInfo}";
                    if ($remarksValue !== null && $remarksValue !== '') { $desc .= " - remarks: {$remarksValue}"; }
                    try { $auditStmt->execute([':description'=>$desc, ':action'=>'RETURN', ':created_by'=>$user_personnel_id]); } catch (PDOException $e) { /* ignore */ }
                }
                break;
            default:
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid type.'
                ]);
        }
        return json_encode([
            'status' => 'success',
            'message' => 'Status, condition, and remarks updated successfully.'
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
}

// Send push notification to admins when reservation status is updated to completed
private function sendPushNotificationToAdmins($reservation_id) {
    try {
        // Get reservation details including requester information
        $sqlReservation = "SELECT 
                            r.reservation_id,
                            r.reservation_title,
                            r.reservation_user_id,
                            CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS requester_name,
                            u.users_user_level_id,
                            u.users_department_id
                        FROM tbl_reservation r
                        LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
                        WHERE r.reservation_id = :reservation_id";
        
        $stmtReservation = $this->conn->prepare($sqlReservation);
        $stmtReservation->bindParam(':reservation_id', $reservation_id, PDO::PARAM_INT);
        $stmtReservation->execute();
        $reservation = $stmtReservation->fetch(PDO::FETCH_ASSOC);
        
        if (!$reservation) {
            error_log("Could not find reservation for ID: " . $reservation_id);
            return;
        }
        
        // Determine notification targets based on requester's user level
        $notificationTargets = [];
        
        switch ($reservation['users_user_level_id']) {
            case 3: // Student
                // Notify department heads (level 5) and secretaries (level 6) in the same department
                $notificationTargets = [
                    ['dept_id' => $reservation['users_department_id'], 'user_level_id' => 5],
                    ['dept_id' => $reservation['users_department_id'], 'user_level_id' => 6]
                ];
                break;
                
            case 6: // Secretary
                // Notify department heads (level 5) in the same department
                $notificationTargets = [
                    ['dept_id' => $reservation['users_department_id'], 'user_level_id' => 5]
                ];
                break;
                
            case 16: // Dean
            case 17: // Vice President
                // Notify administrators (level 1) in department 27
                $notificationTargets = [
                    ['dept_id' => 27, 'user_level_id' => 1]
                ];
                break;
                
            default:
                // Default case - notify department heads (level 5) in the same department
                $notificationTargets = [
                    ['dept_id' => $reservation['users_department_id'], 'user_level_id' => 5]
                ];
                break;
        }
        
        $allUsers = [];
        
        // Get users for each notification target
        foreach ($notificationTargets as $target) {
            $sqlUsers = "SELECT 
                            u.users_id,
                            CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS full_name,
                            ps.subscription_id,
                            ps.endpoint,
                            ps.p256dh_key,
                            ps.auth_key
                        FROM tbl_users u
                        INNER JOIN tbl_push_subscriptions ps ON u.users_id = ps.user_id
                        WHERE u.users_department_id = :dept_id 
                        AND u.users_user_level_id = :user_level_id
                        AND ps.is_active = 1";
            
            $stmtUsers = $this->conn->prepare($sqlUsers);
            $stmtUsers->bindParam(':dept_id', $target['dept_id'], PDO::PARAM_INT);
            $stmtUsers->bindParam(':user_level_id', $target['user_level_id'], PDO::PARAM_INT);
            $stmtUsers->execute();
            $users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);
            
            $allUsers = array_merge($allUsers, $users);
        }
        
        if (empty($allUsers)) {
            // If no users found, fetch all admins in department 27 with active push subscriptions
            $sqlAdmins = "SELECT 
                            u.users_id,
                            CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS full_name,
                            ps.subscription_id,
                            ps.endpoint,
                            ps.p256dh_key,
                            ps.auth_key
                        FROM tbl_users u
                        INNER JOIN tbl_push_subscriptions ps ON u.users_id = ps.user_id
                        WHERE u.users_department_id = 27 
                        AND u.users_user_level_id = 1
                        AND ps.is_active = 1";
            $stmtAdmins = $this->conn->prepare($sqlAdmins);
            $stmtAdmins->execute();
            $admins = $stmtAdmins->fetchAll(PDO::FETCH_ASSOC);
            if (empty($admins)) {
                error_log("No admin users with push subscriptions found in department 27");
                return;
            }
            $allUsers = $admins;
        }
        
        // Prepare notification message
        $adminTitle = "Reservation Completed";
        $adminBody = "Reservation '{$reservation['reservation_title']}' by {$reservation['requester_name']} has been marked as completed.";
        
        // Add unique identifier to prevent notification replacement
        $adminData = [
            'reservation_id' => $reservation_id,
            'type' => 'reservation_completed',
            'action_url' => '/gsd/grms/Admin/viewRequest',
            'notification_id' => uniqid('completed_', true),
            'timestamp' => time(),
            'recipient_type' => 'admin'
        ];
        
        // Include push notification configuration
        require_once 'config/pushConfig.php';
        $pushUrl = getPushNotificationUrl();
        $successCount = 0;
        $errorCount = 0;
        
        // Send push notification to all target users
        foreach ($allUsers as $user) {
            $pushData = [
                'operation' => 'send',
                'user_id' => $user['users_id'],
                'title' => $adminTitle,
                'body' => $adminBody,
                'data' => $adminData
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
                error_log("Push notification failed for admin user {$user['users_id']}: " . ($error ?: "HTTP $httpCode"));
                $errorCount++;
            } else {
                $successCount++;
            }
        }
        
        error_log("Push notifications sent to admins for completed reservation: $successCount successful, $errorCount failed");
        
    } catch (Exception $e) {
        error_log("Error sending push notifications to admins: " . $e->getMessage());
    }
}

    /**
     * Fetch all equipments
     */
    public function fetchEquipments() {
        try {
            $sql = "SELECT `equip_id`, `equip_name`, `is_active`, `user_admin_id`, `equip_type`, `equip_created_at`, `equipments_category_id` FROM `tbl_equipments` WHERE `is_active` = 1 ORDER BY `equip_name` ASC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $equipments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $equipments]);
            return;
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
            return;
        }
    }

    /**
     * Fetch all operations
     */
    public function fetchOperations() {
        try {
            $sql = "SELECT `operation_id`, `operation_name` FROM `tbloperation` WHERE 1 ORDER BY `operation_name` ASC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $operations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $operations]);
            return;
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
            return;
        }
    }

    /**
     * Mark job order as done - update complaint and insert status history
     */
    public function markJobOrderAsDone($data) {
        try {
            // Handle multipart/form-data
            $complaintId = isset($data['complaint_id']) ? $data['complaint_id'] : null;
            $jobId = isset($data['job_id']) ? $data['job_id'] : null;
            $personnelId = isset($data['personnel_id']) ? $data['personnel_id'] : null;
            $joPersonnelId = isset($data['joPersonnel_id']) ? $data['joPersonnel_id'] : null;
            $operationId = isset($data['operation_id']) ? $data['operation_id'] : null;
            $remarks = isset($data['remarks']) ? $data['remarks'] : '';
            
            // Handle equipment_ids - could be JSON string or already an array
            $equipmentIds = [];
            if (isset($data['equipment_ids'])) {
                if (is_string($data['equipment_ids'])) {
                    $decoded = json_decode($data['equipment_ids'], true);
                    $equipmentIds = is_array($decoded) ? $decoded : [];
                } elseif (is_array($data['equipment_ids'])) {
                    $equipmentIds = $data['equipment_ids'];
                }
            }

            if (!$complaintId || !$jobId || !$personnelId || !$operationId) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
                return;
            }
            
            // If joPersonnel_id is not provided, try to get it from the database
            if (!$joPersonnelId && $jobId && $personnelId) {
                $getJoPersonnelSql = "SELECT joPersonnel_id FROM tbljoborderpersonnel 
                    WHERE joPersonnel_joId = :jobId AND joPersonnel_userId = :personnelId 
                    LIMIT 1";
                $getJoPersonnelStmt = $this->conn->prepare($getJoPersonnelSql);
                $getJoPersonnelStmt->execute([
                    ':jobId' => $jobId,
                    ':personnelId' => $personnelId
                ]);
                $joPersonnelResult = $getJoPersonnelStmt->fetch(PDO::FETCH_ASSOC);
                if ($joPersonnelResult) {
                    $joPersonnelId = $joPersonnelResult['joPersonnel_id'];
                }
            }

            // Optional image upload for job order (multipart/form-data, field name 'image')
            $jobImagePath = null;
            if (isset($_FILES['image']) && is_array($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
                $file = $_FILES['image'];

                // Server-side size limit: 1MB
                $maxBytes = 1 * 1024 * 1024; // 1MB
                if ($file['size'] > $maxBytes) {
                    echo json_encode(['status' => 'error', 'message' => 'Image must be less than or equal to 1MB.']);
                    return;
                }

                // Allowed mime types
                $finfo = new finfo(FILEINFO_MIME_TYPE);
                $mimeType = $finfo->file($file['tmp_name']);
                $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($mimeType, $allowedTypes, true)) {
                    echo json_encode(['status' => 'error', 'message' => 'Invalid image type.']);
                    return;
                }

                // Prepare destination directory (reuse complaints folder)
                $uploadDir = __DIR__ . '/static/complaints';
                if (!is_dir($uploadDir)) {
                    if (!mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
                        echo json_encode(['status' => 'error', 'message' => 'Failed to create image directory.']);
                        return;
                    }
                }

                $canUseGdWebp = function_exists('imagewebp') && (
                    function_exists('imagecreatefromjpeg') ||
                    function_exists('imagecreatefrompng') ||
                    function_exists('imagecreatefromgif') ||
                    function_exists('imagecreatefromwebp')
                );

                $fileName = 'job_' . time() . '_' . mt_rand(1000, 9999) . '.webp';
                $destPath = $uploadDir . '/' . $fileName;

                if ($canUseGdWebp) {
                    // Create GD image from source
                    switch ($mimeType) {
                        case 'image/jpeg':
                        case 'image/jpg':
                            $srcImage = imagecreatefromjpeg($file['tmp_name']);
                            break;
                        case 'image/png':
                            $srcImage = imagecreatefrompng($file['tmp_name']);
                            break;
                        case 'image/gif':
                            $srcImage = imagecreatefromgif($file['tmp_name']);
                            break;
                        case 'image/webp':
                            $srcImage = imagecreatefromwebp($file['tmp_name']);
                            break;
                        default:
                            $srcImage = false;
                            break;
                    }

                    if (!$srcImage) {
                        echo json_encode(['status' => 'error', 'message' => 'Failed to process uploaded image.']);
                        return;
                    }

                    if (!imagewebp($srcImage, $destPath, 80)) {
                        imagedestroy($srcImage);
                        echo json_encode(['status' => 'error', 'message' => 'Failed to save image.']);
                        return;
                    }

                    imagedestroy($srcImage);
                } elseif (class_exists('Imagick')) {
                    try {
                        $img = new Imagick();
                        $img->readImage($file['tmp_name']);

                        if (method_exists($img, 'autoOrient')) {
                            $img->autoOrient();
                        }

                        if ($img->getNumberImages() > 1) {
                            $img = $img->coalesceImages();
                            foreach ($img as $frame) {
                                $frame->setImageFormat('webp');
                                $frame->setImageCompressionQuality(80);
                            }
                            $img->writeImages($destPath, true);
                        } else {
                            $img->setImageFormat('webp');
                            $img->setImageCompressionQuality(80);
                            $img->writeImage($destPath);
                        }

                        $img->clear();
                        $img->destroy();
                    } catch (Exception $e) {
                        echo json_encode(['status' => 'error', 'message' => 'WebP conversion failed.']);
                        return;
                    }
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'WebP conversion is not supported on this server (GD WebP/Imagick unavailable).']);
                    return;
                }

                // Relative path for DB/frontend
                $jobImagePath = 'static/complaints/' . $fileName;
            }

            $this->conn->beginTransaction();

            // Update complaint (keep existing comp_image unchanged)
            $updateSql = "UPDATE tblcomplaints SET 
                comp_lastUser = :lastUser,
                comp_closedBy = :closedBy,
                comp_operation = :operation,
                comp_remark = :remark,
                comp_date_closed = NOW()";

            $updateSql .= " WHERE comp_id = :complaintId";
            
            $updateStmt = $this->conn->prepare($updateSql);
            $updateParams = [
                ':lastUser' => $personnelId,
                ':closedBy' => $personnelId,
                ':operation' => $operationId,
                ':remark' => $remarks,
                ':complaintId' => $complaintId
            ];

            $updateStmt->execute($updateParams);

            // If we have an image path, store it on the related job order record
            if ($jobImagePath && $jobId) {
                $updateJobSql = "UPDATE tbljoborders SET job_image = :job_image WHERE job_id = :job_id";
                $updateJobStmt = $this->conn->prepare($updateJobSql);
                $updateJobStmt->execute([
                    ':job_image' => $jobImagePath,
                    ':job_id' => $jobId
                ]);
            }

            // Insert status history (status 3 = Completed)
            $statusHistorySql = "INSERT INTO tblcomplaint_status_history 
                (history_compId, history_statusId, history_updatedBy, history_date)
                VALUES (:compId, :statusId, :updatedBy, NOW())";
            $statusStmt = $this->conn->prepare($statusHistorySql);
            $statusStmt->execute([
                ':compId' => $complaintId,
                ':statusId' => 3, // Status 3 = Completed
                ':updatedBy' => $personnelId
            ]);

            // Insert selected equipments into tbljobequipment
            if (!empty($equipmentIds) && is_array($equipmentIds) && $joPersonnelId) {
                $equipmentSql = "INSERT INTO tbljobequipment 
                    (joEquipment_equipId, joEquipment_personnelId) 
                    VALUES (:equipId, :joPersonnelId)";
                $equipmentStmt = $this->conn->prepare($equipmentSql);
                
                foreach ($equipmentIds as $equipId) {
                    if (!empty($equipId)) {
                        $equipmentStmt->execute([
                            ':equipId' => $equipId,
                            ':joPersonnelId' => $joPersonnelId
                        ]);
                    }
                }
            }

            $this->conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Job order marked as done successfully']);
            return;

        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
            return;
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
            return;
        }
    }

    /**
     * Fetch job order tasks assigned to a personnel, with detailed job order, complaint, client, location, and status info.
     */
    public function fetchJoborderTask($personnel_id) {
        if (!$personnel_id) {
            return json_encode(['status' => 'error', 'message' => 'Personnel ID is required']);
        }
        try {
            $sql = "
                SELECT
                    jo.job_id,
                    jo.job_title,
                    jo.job_description,
                    jo.job_image,
                    jo.job_priority,
                    p.priority_name,
                    jo.job_createdBy,
                    jo.job_createDate,
                    jop.joPersonnel_id,
                    jop.joPersonnel_userId,
                    jop.joPersonnel_joId,
                    c.comp_id,
                    c.comp_subject,
                    c.comp_description AS comp_description,
                    c.comp_locationId,
                    c.comp_locationCategoryId,
                    c.comp_date,
                    c.comp_end_date,
                    c.comp_clientId,
                    c.comp_image,
                    c.comp_date_closed,
                    c.comp_closedBy,
                    c.comp_operation,
                    c.comp_remark,
                    CONCAT_WS(' ', u.users_fname, u.users_mname, u.users_lname) AS client_full_name,
                    loc.location_name,
                    locCateg.locCateg_name,
                    latest_status.history_statusId,
                    latest_status.history_date AS status_date,
                    latest_status.history_updatedBy,
                    b.joStatus_name AS comp_status,
                    op.operation_name,
                    CONCAT_WS(' ', closedByUser.users_fname, closedByUser.users_mname, closedByUser.users_lname) AS closed_by_full_name,
                    CONCAT_WS(' ', lastUser.users_fname, lastUser.users_mname, lastUser.users_lname) AS last_user_full_name
                FROM tbljoborders jo
                LEFT JOIN tbljoborderpersonnel jop ON jo.job_id = jop.joPersonnel_joId
                LEFT JOIN tblcomplaints c ON jo.job_complaintId = c.comp_id
                LEFT JOIN tblpriority p ON jo.job_priority = p.priority_id
                LEFT JOIN tbl_users u ON c.comp_clientId = u.users_id
                LEFT JOIN tbllocation loc ON c.comp_locationId = loc.location_id
                LEFT JOIN tbllocationcategory locCateg ON c.comp_locationCategoryId = locCateg.locCateg_id
                LEFT JOIN tbloperation op ON c.comp_operation = op.operation_id
                LEFT JOIN tbl_users closedByUser ON c.comp_closedBy = closedByUser.users_id
                LEFT JOIN tbl_users lastUser ON c.comp_lastUser = lastUser.users_id
                LEFT JOIN (
                    SELECT h1.*
                    FROM tblcomplaint_status_history h1
                    INNER JOIN (
                        SELECT history_compId, MAX(history_id) as max_history_id
                        FROM tblcomplaint_status_history
                        GROUP BY history_compId
                    ) h2 ON h1.history_compId = h2.history_compId AND h1.history_id = h2.max_history_id
                ) latest_status ON c.comp_id = latest_status.history_compId
                LEFT JOIN tbljoborderstatus b ON latest_status.history_statusId = b.joStatus_id
                WHERE jop.joPersonnel_userId = :personnel_id
                ORDER BY jo.job_createDate DESC
            ";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['personnel_id' => $personnel_id]);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return json_encode(['status' => 'success', 'data' => $result]);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

}

// Handle the request (web requests only; skip when included by CLI)
if (php_sapi_name() !== 'cli' && isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON input
    // Check if request is multipart/form-data
    $isMultipart = isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false;
    
    if ($isMultipart) {
        // For multipart/form-data, use $_POST directly
        $jsonInput = $_POST;
    } else {
        // For JSON requests, parse from php://input
        $jsonInput = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $jsonInput = [];
        }
    }
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        die(json_encode([
            'status' => 'error',
            'message' => 'Invalid JSON format',
            'timestamp' => date('Y-m-d H:i:s')
        ]));
    }

    $operation = $jsonInput['operation'] ?? '';
    $personnel_id = $jsonInput['personnel_id'] ?? null;
    
    // Validate required parameters
    if (!$operation) {
        die(json_encode([
            'status' => 'error',
            'message' => 'Operation is required',
            'timestamp' => date('Y-m-d H:i:s')
        ]));
    }

    $user = new User();
    
    switch ($operation) {
        case 'fetchAssignedRelease':
            if (!$personnel_id) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Personnel ID is required',
                    'timestamp' => date('Y-m-d H:i:s')
                ]));
            }
            echo $user->fetchAssignedRelease($personnel_id);
            break;

        case 'sendTestReminder':
            if (!$personnel_id) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Personnel ID is required',
                    'timestamp' => date('Y-m-d H:i:s')
                ]));
            }
            echo $user->sendTestReminder($personnel_id);
            break;
    
        case 'fetchCompletedTask':  // Add this case for fetchCompletedTask
            if (!$personnel_id) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Personnel ID is required',
                    'timestamp' => date('Y-m-d H:i:s')
                ]));
            }
            echo $user->fetchCompletedTask($personnel_id);
            break;
    
        case 'updateTask':
            $type = $jsonInput['type'] ?? null;
            $id = $jsonInput['id'] ?? null;
            $isActive = $jsonInput['isActive'] ?? null;
            if (!$type || !$id || !isset($isActive)) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Type, ID, and isActive are required',
                    'timestamp' => date('Y-m-d H:i:s')
                ]));
            }
            echo $user->updateTask($jsonInput);
            break;
    
        case 'fetchTaskById':
            echo $user->fetchTaskById($jsonInput);
            break;
    
        case 'insertComplete':
            $checklist_id = $jsonInput['checklist_id'] ?? null;
            if (!$checklist_id) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Checklist ID is required',
                    'timestamp' => date('Y-m-d H:i:s')
                ]));
            }
            echo $user->insertComplete($checklist_id);
            break;
    
        case 'fetchRecent':
            echo $user->fetchRecent();
            break;

        case 'submitCondition':
            echo $user->submitCondition($jsonInput);
            break;
        case 'updateResourceStatusAndCondition':
            $type = $jsonInput['type'] ?? null;
            $resourceId = $jsonInput['resource_id'] ?? null;
            $recordId = $jsonInput['record_id'] ?? null;
            if (!$type || !$resourceId || !$recordId) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Type, Resource ID, and Record ID are required',
                    'timestamp' => date('Y-m-d H:i:s')
                ]));
            }
            echo $user->updateResourceStatusAndCondition($type, $resourceId, $recordId);
            break;
        case 'updateReservationStatus':
            $reservation_id = $jsonInput['reservation_id'] ?? null;
            $user_personnel_id = $jsonInput['user_personnel_id'] ?? null;
            if (!$reservation_id) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Reservation ID is required',
                    'timestamp' => date('Y-m-d H:i:s')
                ]));
            }
            // user_personnel_id is optional here; when provided, we will audit log the status change
            echo $user->updateReservationStatus($reservation_id, $user_personnel_id);
            break;
        case "checkEquipmentQuantity":
            $reservation_equipment_id = $jsonInput['reservation_equipment_id'] ?? null;
            
            if (!$reservation_equipment_id) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Reservation equipment ID is required'
                ]));
            }
            echo $user->checkEquipmentQuantity($reservation_equipment_id);
            break;
        case "fetchAvailableUnits":
            $equip_id = $jsonInput['equip_id'] ?? null;
            if (!$equip_id) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Equipment ID is required'
                ]));
            }
            echo $user->fetchAvailableUnits($equip_id);
            break;
        case "releaseAvailableUnit":
            $reservation_id = $jsonInput['reservation_id'] ?? null;
            $reservation_equipment_id = $jsonInput['reservation_equipment_id'] ?? null;
            $equip_id = $jsonInput['equip_id'] ?? null;
            $unit_id = $jsonInput['unit_id'] ?? null;
            $user_personnel_id = $jsonInput['user_personnel_id'] ?? null;
            $quantity = $jsonInput['quantity'] ?? 1;
            
            if (!$reservation_id || !$reservation_equipment_id || !$equip_id || !$unit_id || !$user_personnel_id) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'All parameters are required'
                ]));
            }
            
            // Include and use insertUnits from Assigned&Records
            require_once 'Assigned&Records.php';
            $assigned = new Assigned();
            
            // Convert unit_id to array and quantity for insertUnits
            $equipIds = [$equip_id];
            $quantities = [$quantity];
            
            // Get effective dates from reservation
            $stmt = $user->conn->prepare("
                SELECT 
                    COALESCE(reschedule_start_date, reservation_start_date) as effective_start_date,
                    COALESCE(reschedule_end_date, reservation_end_date) as effective_end_date
                FROM tbl_reservation
                WHERE reservation_id = :reservation_id
            ");
            $stmt->execute(['reservation_id' => $reservation_id]);
            $reservationData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $effectiveStartDate = $reservationData['effective_start_date'] ?? date('Y-m-d');
            $effectiveEndDate = $reservationData['effective_end_date'] ?? date('Y-m-d');
            
            // Call insertUnits with the specific unit
            // For insertUnits to work with specific unit selection, we need to modify the call
            // Since insertUnits doesn't allow selecting specific units, we'll call it after
            // Let's use a modified approach: first insert the unit, then update to active
            
            // Insert the unit directly
            $insertStmt = $user->conn->prepare("
                INSERT INTO tbl_reservation_unit (
                    reservation_reservation_id,
                    reservation_equipment_id,
                    unit_id,
                    active
                ) VALUES (
                    :reservation_id,
                    :reservation_equipment_id,
                    :unit_id,
                    1
                )
            ");
            $insertStmt->execute([
                'reservation_id' => $reservation_id,
                'reservation_equipment_id' => $reservation_equipment_id,
                'unit_id' => $unit_id
            ]);
            
            // Update unit status to In Use
            $updateUnitStmt = $user->conn->prepare("
                UPDATE tbl_equipment_unit
                SET status_availability_id = 5,
                    updated_at = NOW()
                WHERE unit_id = :unit_id
            ");
            $updateUnitStmt->execute(['unit_id' => $unit_id]);
            
            // Update reservation equipment to active
            $updateEquipStmt = $user->conn->prepare("
                UPDATE tbl_reservation_equipment
                SET active = 1,
                    updated_at = NOW()
                WHERE reservation_equipment_id = :reservation_equipment_id
            ");
            $updateEquipStmt->execute(['reservation_equipment_id' => $reservation_equipment_id]);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Unit released successfully'
            ]);
            break;
        case "releaseVenue":
            $reservation_venue_id = $jsonInput['reservation_venue_id'] ?? null;
            $personnel_id = $jsonInput['personnel_id'] ?? null;
            $checklist_items = $jsonInput['checklist_items'] ?? null;
            
            if (!$reservation_venue_id || !$personnel_id || !$checklist_items) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Reservation venue ID, personnel ID, and checklist items are required'
                ]));
            }
            
            echo $user->releaseVenue($reservation_venue_id, $personnel_id, $checklist_items);

        case "updateRelease":
            $type = $jsonInput['type'] ?? null;
            $reservation_id = $jsonInput['reservation_id'] ?? null;
            $resource_id = $jsonInput['resource_id'] ?? null;
            $quantity = $jsonInput['quantity'] ?? null;
            $user_personnel_id = $jsonInput['user_personnel_id'] ?? null;


            if (!$type || !$reservation_id || !$resource_id || !$user_personnel_id) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Type, Reservation ID, Resource ID, and User Personnel ID are required',
                    'timestamp' => date('Y-m-d H:i:s')
                ]));
            }
            echo $user->updateRelease($type, $reservation_id, $resource_id, $quantity, $user_personnel_id);
            break;
        case "updateReturn":
            $type = $jsonInput['type'] ?? null;
            $reservation_id = $jsonInput['reservation_id'] ?? null;
            $resource_id = $jsonInput['resource_id'] ?? null;
            $condition = $jsonInput['condition'] ?? null;
            $user_personnel_id = $jsonInput['user_personnel_id'] ?? null;
            $bad_quantity = $jsonInput['bad_quantity'] ?? 0; // Default to 0 if not provided
            $good_quantity = $jsonInput['good_quantity'] ?? 0; // Default to 0 if not provided
            $remarks = $jsonInput['remarks'] ?? null; // Get remarks from input

            if (!$type || !$reservation_id || !$resource_id || !$user_personnel_id || (empty($condition) && (empty($remarks) || strtolower($remarks) === 'null'))) {
                die(json_encode([
                    'status' => 'error',
                    'message' => 'Type, Reservation ID, Resource ID, Condition or Remarks, and User Personnel ID are required',
                    'timestamp' => date('Y-m-d H:i:s')
                ]));
            }
            echo $user->updateReturn($type, $reservation_id, $resource_id, $condition, $user_personnel_id, $bad_quantity, $good_quantity, $remarks);
            break;
        case "fetchJoborderTask":
            $personnel_id = $jsonInput['personnel_id'] ?? null;
            echo $user->fetchJoborderTask($personnel_id);
            break;
        case "fetchEquipments":
            echo $user->fetchEquipments();
            break;
        case "fetchOperations":
            echo $user->fetchOperations();
            break;
        case "markJobOrderAsDone":
            // Data is already in $jsonInput (handled above for multipart/form-data)
            echo $user->markJobOrderAsDone($jsonInput);
            break;
            
            
    
    
    
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid operation']);
            break;
    }
}
?>
