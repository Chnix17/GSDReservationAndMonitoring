<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

class Department_Dean {
    private $conn;

    public function __construct() {
        include 'connection-pdo.php';
        $this->conn = $conn;
    }
    
    /**
     * Fetch department approval data by reservation ID
     * @param int $reservationId The ID of the reservation
     * @return string JSON encoded response with department approval data
     */
    public function fetchDeansApproval($reservationId) {
        try {
            $sql = "
                SELECT 
                    da.department_approval_id,
                    da.department_is_approved,
                    da.department_approval_department_id,
                    da.department_user_id,
                    da.department_updated_at,
                    da.department_request_reservation_id,
                    d.departments_name,
                    CONCAT_WS(' ', u.users_fname, u.users_mname, u.users_lname) as user_name
                FROM 
                    tbl_department_approval da
                LEFT JOIN 
                    tbl_departments d ON da.department_approval_department_id = d.departments_id
                LEFT JOIN 
                    tbl_users u ON da.department_user_id = u.users_id
                WHERE 
                    da.department_request_reservation_id = :reservation_id
                ORDER BY 
                    da.department_updated_at DESC
            ";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmt->execute();

            $approvals = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $approvals[] = [
                    'approval_id' => $row['department_approval_id'],
                    'is_approved' => $row['department_is_approved'],
                    'department_id' => $row['department_approval_department_id'],
                    'department_name' => $row['departments_name'],
                    'user_id' => $row['department_user_id'] ?: '',
                    'user_name' => $row['user_name'] ?: '',
                    'updated_at' => $row['department_updated_at'],
                    'reservation_id' => $row['department_request_reservation_id']
                ];
            }

            return json_encode([
                'status' => 'success',
                'data' => $approvals
            ]);

        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Error fetching department approvals: ' . $e->getMessage()
            ]);
        }
    }

    public function fetchApprovalByDept(int $departmentId, int $userLevelId, int $currentUserId): string
{
    if (!$departmentId || !$userLevelId) {
        return json_encode([
            'status'  => 'error',
            'message' => 'Department ID and User Level ID are required'
        ]);
    }

    try {
        $sql = "
            SELECT 
                r.reservation_id,
                r.reservation_created_at,
                r.reservation_title,
                r.reservation_description,
                r.reservation_start_date,
                r.reservation_end_date,
                r.reservation_user_id,
                r.additional_note,
                rs.reservation_status_status_id    AS status_id,
                rs.reservation_active              AS active,
                u_req.users_user_level_id          AS user_level_id,
                CONCAT_WS(' ',
                    u_req.users_fname,
                    u_req.users_mname,
                    u_req.users_lname
                )                                    AS requester_name,
                dep.departments_name               AS department_name,
                ul.user_level_name                  AS user_level_name,
                da.department_approval_id,
                da.department_is_approved,
                da.department_user_id,
                da.department_updated_at,

                -- Venues
                GROUP_CONCAT(DISTINCT
                    CONCAT_WS(':',
                        v.reservation_venue_venue_id,
                        venue.ven_name,
                        venue.ven_occupancy,
                        IFNULL(venue.ven_pic,'')
                    )
                ) AS venue_data,

                -- Vehicles
                GROUP_CONCAT(DISTINCT
                    CONCAT_WS(':',
                        ve.reservation_vehicle_vehicle_id,
                        ve.reservation_vehicle_id,
                        vm.vehicle_license,
                        vmm.vehicle_model_name
                    )
                ) AS vehicle_data,

                -- Equipment
                GROUP_CONCAT(DISTINCT
                    CONCAT_WS(':',
                        e.reservation_equipment_equip_id,
                        equip.equip_name,
                        e.reservation_equipment_quantity
                    )
                ) AS equipment_data,

                -- Passengers
                GROUP_CONCAT(DISTINCT
                    CONCAT_WS(':',
                        p.reservation_passenger_id,
                        p.reservation_passenger_name
                    )
                ) AS passenger_data

            FROM tbl_department_approval da
            INNER JOIN tbl_reservation r 
                ON da.department_request_reservation_id = r.reservation_id
            LEFT JOIN tbl_users u_req 
                ON r.reservation_user_id = u_req.users_id
            LEFT JOIN tbl_departments dep 
                ON u_req.users_department_id = dep.departments_id
            LEFT JOIN (
                SELECT 
                    reservation_reservation_id,
                    reservation_status_status_id,
                    reservation_active,
                    reservation_updated_at
                FROM tbl_reservation_status
                WHERE (reservation_reservation_id, reservation_updated_at) IN (
                    SELECT reservation_reservation_id, MAX(reservation_updated_at)
                    FROM tbl_reservation_status
                    GROUP BY reservation_reservation_id
                )
            ) rs ON r.reservation_id = rs.reservation_reservation_id
            LEFT JOIN tbl_reservation_venue v 
                ON r.reservation_id = v.reservation_reservation_id
            LEFT JOIN tbl_venue venue 
                ON v.reservation_venue_venue_id = venue.ven_id
            LEFT JOIN tbl_reservation_vehicle ve 
                ON r.reservation_id = ve.reservation_reservation_id
            LEFT JOIN tbl_vehicle vm 
                ON ve.reservation_vehicle_vehicle_id = vm.vehicle_id
            LEFT JOIN tbl_user_level ul 
                ON u_req.users_user_level_id = ul.user_level_id
            LEFT JOIN tbl_vehicle_model vmm 
                ON vm.vehicle_model_id = vmm.vehicle_model_id
            LEFT JOIN tbl_reservation_equipment e 
                ON r.reservation_id = e.reservation_reservation_id
            LEFT JOIN tbl_equipments equip 
                ON e.reservation_equipment_equip_id = equip.equip_id
            LEFT JOIN tbl_reservation_passenger p 
                ON r.reservation_id = p.reservation_reservation_id

            WHERE
                da.department_approval_department_id = :department_id
                AND da.department_is_approved = 0
                AND (
                    :user_level_id <> 6 OR r.reservation_user_id <> :current_user_id
                )
                
            GROUP BY r.reservation_id, da.department_approval_id
            ORDER BY r.reservation_created_at DESC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            'department_id'   => $departmentId,
            'user_level_id'   => $userLevelId,
            'current_user_id' => $currentUserId
        ]);

        $result = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Decode concatenated fields into structured arrays...
            $venues     = [];
            $vehicles   = [];
            $equipment  = [];
            $drivers    = [];
            $passengers = [];

            if (!empty($row['venue_data'])) {
                foreach (explode(',', $row['venue_data']) as $str) {
                    list($vid,$vname,$occ,$pic) = explode(':', $str) + [null,null,null,null];
                    $venues[] = [
                        'venue_id'        => $vid,
                        'venue_name'      => $vname,
                        'occupancy'       => $occ,
                        'picture'         => $pic
                    ];
                }
            }

            if (!empty($row['vehicle_data'])) {
                foreach (explode(',', $row['vehicle_data']) as $str) {
                    list($vehicle_vehicle_id, $reservation_vehicle_id, $license, $model) = explode(':', $str) + [null,null,null,null];
                    $vehicles[] = [
                        'vehicle_vehicle_id'      => $vehicle_vehicle_id,
                        'reservation_vehicle_id'  => $reservation_vehicle_id,
                        'license'                 => $license,
                        'model'                   => $model
                    ];
                }
            }

            if (!empty($row['equipment_data'])) {
                foreach (explode(',', $row['equipment_data']) as $str) {
                    list($eid,$ename,$qty) = explode(':', $str) + [null,null,null];
                    $equipment[] = [
                        'equipment_id' => $eid,
                        'name'         => $ename,
                        'quantity'     => $qty
                    ];
                }
            }

            // Fetch all drivers for this reservation (with fallback to driver_name if user_id is null)
            $driverStmt = $this->conn->prepare(
                "SELECT rd.reservation_driver_id, rd.reservation_driver_user_id, rd.reservation_vehicle_id, rd.driver_name, rd.created_at, rd.updated_at, u.users_fname, u.users_mname, u.users_lname, u.users_suffix
                 FROM tbl_reservation_driver rd
                 JOIN tbl_reservation_vehicle rv ON rd.reservation_vehicle_id = rv.reservation_vehicle_id
                 LEFT JOIN tbl_users u ON rd.reservation_driver_user_id = u.users_id
                 WHERE rv.reservation_reservation_id = :reservation_id"
            );
            $driverStmt->execute([':reservation_id' => $row['reservation_id']]);
            while ($driverRow = $driverStmt->fetch(PDO::FETCH_ASSOC)) {
                if (empty($driverRow['reservation_driver_user_id'])) {
                    $driverName = $driverRow['driver_name'];
                } else {
                    $driverName = trim(
                        $driverRow['users_fname'] . ' ' .
                        ($driverRow['users_mname'] ? $driverRow['users_mname'] . ' ' : '') .
                        $driverRow['users_lname'] .
                        ($driverRow['users_suffix'] ? ' ' . $driverRow['users_suffix'] : '')
                    );
                }
                $drivers[] = [
                    'reservation_driver_id' => $driverRow['reservation_driver_id'],
                    'driver_id' => $driverRow['reservation_driver_user_id'],
                    'name' => $driverName,
                    'created_at' => $driverRow['created_at'],
                    'updated_at' => $driverRow['updated_at'],
                    'reservation_vehicle_id' => $driverRow['reservation_vehicle_id'],
                    'assigned_vehicle' => null // You can add vehicle details if needed
                ];
            }

            if (!empty($row['passenger_data'])) {
                foreach (explode(',', $row['passenger_data']) as $str) {
                    list($pid,$pname) = explode(':', $str) + [null,null];
                    $passengers[] = [
                        'passenger_id' => $pid,
                        'name'         => $pname
                    ];
                }
            }

            $result[] = [
                'reservation_id'           => $row['reservation_id'],
                'reservation_created_at'   => $row['reservation_created_at'],
                'reservation_title'        => $row['reservation_title'],
                'reservation_description'  => $row['reservation_description'],
                'reservation_start_date'   => $row['reservation_start_date'],
                'reservation_end_date'     => $row['reservation_end_date'],
                // reservation_participants now in venues array
                'reservation_user_id'      => $row['reservation_user_id'],
                'additional_note'          => $row['additional_note'],
                'user_level_id'            => $row['user_level_id'],
                'status_id'                => $row['status_id'],
                'active'                   => $row['active'],
                'requester_name'           => $row['requester_name'],
                'department_name'          => $row['department_name'],
                'user_level_name'          => $row['user_level_name'],
                'department_approval_id'   => $row['department_approval_id'],
                'department_is_approved'   => $row['department_is_approved'],
                'department_user_id'       => $row['department_user_id'],
                'department_updated_at'    => $row['department_updated_at'],
                'venues'                   => $venues,
                'vehicles'                 => $vehicles,
                'equipment'                => $equipment,
                'drivers'                  => $drivers,
                'passengers'               => $passengers
            ];
        }

        return json_encode([
            'status' => 'success',
            'data'   => $result
        ]);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return json_encode([
            'status'  => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}


    

    

   

    public function uploadClassroomJSON($academicSessionId, $csvData) {
        if (!is_array($csvData)) {
            return json_encode(['status' => 'error', 'message' => 'Invalid or missing csv_data']);
        }

        // Validate academic session exists
        $stmt = $this->conn->prepare("SELECT academic_session_id FROM tbl_academic_session WHERE academic_session_id = ?");
        $stmt->execute([$academicSessionId]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            return json_encode(['status' => 'error', 'message' => 'Invalid academic_session_id']);
        }

        $dayMap = [
            'mon' => 'Monday', 'tue' => 'Tuesday', 'wed' => 'Wednesday',
            'thu' => 'Thursday', 'fri' => 'Friday', 'sat' => 'Saturday', 'sun' => 'Sunday'
        ];

        $rowCount = 0;
        $skippedRows = [];

        foreach ($csvData as $row) {
            $sectionName = trim($row['section_name'] ?? '');
            $venueName = trim($row['venue_name'] ?? '');
            $dayAbbrev = trim($row['day'] ?? '');
            $startTime = trim($row['start_time'] ?? '');
            $endTime = trim($row['end_time'] ?? '');

            if (!$sectionName || !$venueName || !$dayAbbrev || !$startTime || !$endTime) {
                $skippedRows[] = array_merge($row, ['reason' => 'Missing required fields']);
                continue;
            }

            $dayKey = strtolower(substr($dayAbbrev, 0, 3));
            $dayOfWeek = $dayMap[$dayKey] ?? null;

            if (!$dayOfWeek) {
                $skippedRows[] = array_merge($row, ['reason' => 'Invalid day format']);
                continue;
            }

            // SECTION
            $stmt = $this->conn->prepare("SELECT section_id FROM tbl_section WHERE section_name = ?");
            $stmt->execute([$sectionName]);
            $section = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$section) {
                $insert = $this->conn->prepare("INSERT INTO tbl_section (section_name) VALUES (?)");
                $insert->execute([$sectionName]);
                $sectionId = $this->conn->lastInsertId();
            } else {
                $sectionId = $section['section_id'];
            }

            // VENUE
            $stmt = $this->conn->prepare("SELECT ven_id FROM tbl_venue WHERE LOWER(ven_name) = ?");
            $stmt->execute([strtolower($venueName)]);
            $venue = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$venue) {
                $skippedRows[] = array_merge($row, ['reason' => 'Venue not found']);
                continue;
            }
            $venueId = $venue['ven_id'];

            // Check if schedule already exists for this academic session
            $checkDuplicate = $this->conn->prepare("
                SELECT schedule_id 
                FROM tbl_class_venue_schedule 
                WHERE academic_session_id = ? 
                AND section_id = ? 
                AND ven_id = ? 
                AND day_of_week = ? 
                AND start_time = ? 
                AND end_time = ?
            ");
            $checkDuplicate->execute([$academicSessionId, $sectionId, $venueId, $dayOfWeek, $startTime, $endTime]);
            $existingSchedule = $checkDuplicate->fetch(PDO::FETCH_ASSOC);

            // Only insert if it doesn't exist
            if ($existingSchedule) {
                $skippedRows[] = array_merge($row, ['reason' => 'Schedule already exists for this academic session']);
                continue;
            }

            // INSERT schedule
            $insertSchedule = $this->conn->prepare("INSERT INTO tbl_class_venue_schedule (academic_session_id, section_id, ven_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)");
            $insertSchedule->execute([$academicSessionId, $sectionId, $venueId, $dayOfWeek, $startTime, $endTime]);

            $rowCount++;
        }

        return json_encode([
            'status' => 'success',
            'message' => "$rowCount rows inserted.",
            'skipped_count' => count($skippedRows),
            'skipped' => $skippedRows
        ]);
    }

    public function fetchSchoolYear() {
        try {
            $stmt = $this->conn->prepare("SELECT `school_year_id`, `school_year_name`, `created_at` FROM `tbl_school_year` WHERE 1");
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode([
                'status' => 'success',
                'data' => $result
            ]);
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function fetchSemester($school_year_id) {
        try {
            $stmt = $this->conn->prepare("SELECT `semester_id`, `school_year_id`, `semester_name`, `created_at`, `is_active` FROM `tbl_semester` WHERE school_year_id = ?");
            $stmt->execute([$school_year_id]);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode([
                'status' => 'success',
                'data' => $result
            ]);
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function fetchVenueScheduled($academicSessionId) {
        try {
            $query = "SELECT DISTINCT v.ven_id, v.ven_name, cvs.schedule_id
                     FROM tbl_class_venue_schedule cvs
                     INNER JOIN tbl_venue v ON cvs.ven_id = v.ven_id
                     WHERE cvs.academic_session_id = ?";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$academicSessionId]);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode([
                'status' => 'success',
                'data' => $result
            ]);
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }    
    public function fetchVenueByVenId($ven_id) {
        try {            $query = "SELECT cvs.schedule_id, cvs.academic_session_id, cvs.ven_id, cvs.day_of_week, cvs.start_time, cvs.end_time,
                            sec.section_name, v.ven_name
                     FROM tbl_class_venue_schedule cvs
                     INNER JOIN tbl_academic_session acs ON cvs.academic_session_id = acs.academic_session_id
                     INNER JOIN tbl_section sec ON cvs.section_id = sec.section_id
                     INNER JOIN tbl_venue v ON cvs.ven_id = v.ven_id
                     WHERE cvs.ven_id = ?
                     ORDER BY cvs.day_of_week, cvs.start_time";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$ven_id]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode([
                'status' => 'success',
                'data' => $results
            ]);
            
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function updateClassSchedule($schedule_id, $ven_id, $day_of_week, $start_time, $end_time) {
        try {
            // 1. Validate required fields
            if (empty($schedule_id) || empty($ven_id) || empty($day_of_week) || empty($start_time) || empty($end_time)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'All fields are required'
                ]);
            }

            // 2. Validate schedule_id and ven_id are numeric
            if (!is_numeric($schedule_id) || !is_numeric($ven_id)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid schedule ID or venue ID'
                ]);
            }

            // 3. Validate day of week
            $validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            if (!in_array($day_of_week, $validDays)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid day of week. Must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
                ]);
            }

            // 4. Validate time format (HH:mm:ss)
            if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $start_time)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid start time format. Expected HH:mm:ss'
                ]);
            }
            if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $end_time)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid end time format. Expected HH:mm:ss'
                ]);
            }

            // 5. Validate start time is before end time
            $startTimestamp = strtotime($start_time);
            $endTimestamp = strtotime($end_time);
            if ($startTimestamp >= $endTimestamp) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Start time must be before end time'
                ]);
            }

            // 6. Validate reasonable time range (between 6:00 AM and 11:00 PM)
            $startHour = (int)date('H', $startTimestamp);
            $endHour = (int)date('H', $endTimestamp);
            if ($startHour < 6 || $startHour > 22) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Start time must be between 6:00 AM and 10:00 PM'
                ]);
            }
            if ($endHour < 6 || $endHour > 23) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'End time must be between 6:00 AM and 11:00 PM'
                ]);
            }

            // 7. Validate minimum duration (at least 30 minutes)
            $duration = ($endTimestamp - $startTimestamp) / 60; // in minutes
            if ($duration < 30) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Schedule duration must be at least 30 minutes'
                ]);
            }

            // 8. Validate maximum duration (not more than 8 hours)
            if ($duration > 480) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Schedule duration cannot exceed 8 hours'
                ]);
            }

            // 9. Check if venue exists and is active
            $venueQuery = "SELECT ven_id FROM tbl_venue WHERE ven_id = ? AND is_active = 1";
            $venueStmt = $this->conn->prepare($venueQuery);
            $venueStmt->execute([$ven_id]);
            
            if ($venueStmt->rowCount() === 0) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Venue not found or inactive'
                ]);
            }

            // 10. Check if the schedule exists
            $checkQuery = "SELECT schedule_id, semester_id, section_id FROM tbl_class_venue_schedule WHERE schedule_id = ?";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->execute([$schedule_id]);
            
            if ($checkStmt->rowCount() === 0) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Schedule not found'
                ]);
            }

            $existingSchedule = $checkStmt->fetch(PDO::FETCH_ASSOC);
            $semester_id = $existingSchedule['semester_id'];
            $section_id = $existingSchedule['section_id'];

            // 11. Verify semester is active
            $semesterQuery = "SELECT semester_id FROM tbl_semester WHERE semester_id = ? AND is_active = 1";
            $semesterStmt = $this->conn->prepare($semesterQuery);
            $semesterStmt->execute([$semester_id]);
            
            if ($semesterStmt->rowCount() === 0) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Cannot edit schedule - semester is inactive or not found'
                ]);
            }

            // 12. Check for exact duplicate schedule (same venue, section, day, and time)
            $duplicateQuery = "SELECT cvs.schedule_id, v.ven_name, sec.section_name 
                              FROM tbl_class_venue_schedule cvs
                              INNER JOIN tbl_section sec ON cvs.section_id = sec.section_id
                              INNER JOIN tbl_venue v ON cvs.ven_id = v.ven_id
                              WHERE cvs.ven_id = ? 
                              AND cvs.section_id = ?
                              AND cvs.day_of_week = ? 
                              AND cvs.start_time = ?
                              AND cvs.end_time = ?
                              AND cvs.schedule_id != ?
                              AND cvs.semester_id = ?";
            $duplicateStmt = $this->conn->prepare($duplicateQuery);
            $duplicateStmt->execute([
                $ven_id,
                $section_id,
                $day_of_week,
                $start_time,
                $end_time,
                $schedule_id,
                $semester_id
            ]);
            
            if ($duplicateStmt->rowCount() > 0) {
                $duplicate = $duplicateStmt->fetch(PDO::FETCH_ASSOC);
                return json_encode([
                    'status' => 'error',
                    'message' => 'Duplicate schedule: Section "' . $duplicate['section_name'] . '" is already scheduled at venue "' . $duplicate['ven_name'] . '" on ' . $day_of_week . ' from ' . date('g:i A', strtotime($start_time)) . ' to ' . date('g:i A', strtotime($end_time))
                ]);
            }

            // 13. Check if the same section is already scheduled at the same time in any venue
            $sectionConflictQuery = "SELECT cvs.schedule_id, v.ven_name, sec.section_name 
                                     FROM tbl_class_venue_schedule cvs
                                     INNER JOIN tbl_section sec ON cvs.section_id = sec.section_id
                                     INNER JOIN tbl_venue v ON cvs.ven_id = v.ven_id
                                     WHERE cvs.section_id = ? 
                                     AND cvs.day_of_week = ? 
                                     AND cvs.schedule_id != ?
                                     AND cvs.semester_id = ?
                                     AND (
                                         (cvs.start_time < ? AND cvs.end_time > ?) OR
                                         (cvs.start_time < ? AND cvs.end_time > ?) OR
                                         (cvs.start_time >= ? AND cvs.end_time <= ?) OR
                                         (cvs.start_time <= ? AND cvs.end_time >= ?)
                                     )";
            $sectionConflictStmt = $this->conn->prepare($sectionConflictQuery);
            $sectionConflictStmt->execute([
                $section_id,
                $day_of_week,
                $schedule_id,
                $semester_id,
                $end_time, $start_time,      // Existing starts before and ends after new start
                $end_time, $end_time,        // Existing starts before and ends at same time
                $start_time, $end_time,      // Existing is completely within new schedule
                $start_time, $end_time       // New schedule is completely within existing
            ]);
            
            if ($sectionConflictStmt->rowCount() > 0) {
                $sectionConflict = $sectionConflictStmt->fetch(PDO::FETCH_ASSOC);
                return json_encode([
                    'status' => 'error',
                    'message' => 'Section conflict: Section "' . $sectionConflict['section_name'] . '" is already scheduled at venue "' . $sectionConflict['ven_name'] . '" during the selected time slot'
                ]);
            }

            // 14. Check for venue time conflicts (excluding the current schedule)
            $conflictQuery = "SELECT cvs.schedule_id, sec.section_name 
                             FROM tbl_class_venue_schedule cvs
                             INNER JOIN tbl_section sec ON cvs.section_id = sec.section_id
                             WHERE cvs.ven_id = ? 
                             AND cvs.day_of_week = ? 
                             AND cvs.schedule_id != ?
                             AND cvs.semester_id = ?
                             AND (
                                 (cvs.start_time < ? AND cvs.end_time > ?) OR
                                 (cvs.start_time < ? AND cvs.end_time > ?) OR
                                 (cvs.start_time >= ? AND cvs.end_time <= ?) OR
                                 (cvs.start_time <= ? AND cvs.end_time >= ?)
                             )";
            $conflictStmt = $this->conn->prepare($conflictQuery);
            $conflictStmt->execute([
                $ven_id, 
                $day_of_week, 
                $schedule_id,
                $semester_id,
                $end_time, $start_time,      // Existing starts before and ends after new start
                $end_time, $end_time,        // Existing starts before and ends at same time
                $start_time, $end_time,      // Existing is completely within new schedule
                $start_time, $end_time       // New schedule is completely within existing
            ]);
            
            if ($conflictStmt->rowCount() > 0) {
                $conflict = $conflictStmt->fetch(PDO::FETCH_ASSOC);
                return json_encode([
                    'status' => 'error',
                    'message' => 'Venue conflict: This venue is already scheduled for section "' . $conflict['section_name'] . '" during the selected time slot'
                ]);
            }

            // 15. Update the schedule
            $updateQuery = "UPDATE tbl_class_venue_schedule 
                           SET ven_id = ?, day_of_week = ?, start_time = ?, end_time = ?
                           WHERE schedule_id = ?";
            $updateStmt = $this->conn->prepare($updateQuery);
            $result = $updateStmt->execute([$ven_id, $day_of_week, $start_time, $end_time, $schedule_id]);
            
            if (!$result) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Failed to update schedule'
                ]);
            }

            return json_encode([
                'status' => 'success',
                'message' => 'Schedule updated successfully'
            ]);
            
        } catch (PDOException $e) {
            error_log("Database error in updateClassSchedule: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        } catch (Exception $e) {
            error_log("Error in updateClassSchedule: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'An error occurred while updating the schedule'
            ]);
        }
    }

    public function addClassSchedule($semester_id, $section_name, $ven_id, $day_of_week, $start_time, $end_time) {
        try {
            // 1. Validate required fields
            if (empty($semester_id) || empty($section_name) || empty($ven_id) || empty($day_of_week) || empty($start_time) || empty($end_time)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'All fields are required'
                ]);
            }

            // 2. Validate section name
            $section_name = trim($section_name);
            if (empty($section_name)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Section name cannot be empty or whitespace only'
                ]);
            }

            // 3. Validate IDs are numeric
            if (!is_numeric($semester_id) || !is_numeric($ven_id)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid semester or venue ID'
                ]);
            }

            // 3. Validate day of week
            $validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            if (!in_array($day_of_week, $validDays)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid day of week. Must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
                ]);
            }

            // 4. Validate time format (HH:mm:ss)
            if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $start_time)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid start time format. Expected HH:mm:ss'
                ]);
            }
            if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $end_time)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Invalid end time format. Expected HH:mm:ss'
                ]);
            }

            // 5. Validate start time is before end time
            $startTimestamp = strtotime($start_time);
            $endTimestamp = strtotime($end_time);
            if ($startTimestamp >= $endTimestamp) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Start time must be before end time'
                ]);
            }

            // 6. Validate reasonable time range (between 6:00 AM and 11:00 PM)
            $startHour = (int)date('H', $startTimestamp);
            $endHour = (int)date('H', $endTimestamp);
            if ($startHour < 6 || $startHour > 22) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Start time must be between 6:00 AM and 10:00 PM'
                ]);
            }
            if ($endHour < 6 || $endHour > 23) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'End time must be between 6:00 AM and 11:00 PM'
                ]);
            }

            // 7. Validate minimum duration (at least 30 minutes)
            $duration = ($endTimestamp - $startTimestamp) / 60;
            if ($duration < 30) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Schedule duration must be at least 30 minutes'
                ]);
            }

            // 8. Validate maximum duration (not more than 8 hours)
            if ($duration > 480) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Schedule duration cannot exceed 8 hours'
                ]);
            }

            // 9. Check if venue exists and is active
            $venueQuery = "SELECT ven_id FROM tbl_venue WHERE ven_id = ? AND is_active = 1";
            $venueStmt = $this->conn->prepare($venueQuery);
            $venueStmt->execute([$ven_id]);
            
            if ($venueStmt->rowCount() === 0) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Venue not found or inactive'
                ]);
            }

            // 10. Check if section exists or create new one
            $sectionQuery = "SELECT section_id FROM tbl_section WHERE LOWER(TRIM(section_name)) = LOWER(?)";
            $sectionStmt = $this->conn->prepare($sectionQuery);
            $sectionStmt->execute([$section_name]);
            
            if ($sectionStmt->rowCount() > 0) {
                // Section exists, get its ID
                $section = $sectionStmt->fetch(PDO::FETCH_ASSOC);
                $section_id = $section['section_id'];
            } else {
                // Section doesn't exist, create it
                $insertSectionQuery = "INSERT INTO tbl_section (section_name, created_at) VALUES (?, NOW())";
                $insertSectionStmt = $this->conn->prepare($insertSectionQuery);
                $insertSectionStmt->execute([$section_name]);
                $section_id = $this->conn->lastInsertId();
                
                if (!$section_id) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Failed to create section'
                    ]);
                }
            }

            // 11. Verify semester is active
            $semesterQuery = "SELECT semester_id FROM tbl_semester WHERE semester_id = ? AND is_active = 1";
            $semesterStmt = $this->conn->prepare($semesterQuery);
            $semesterStmt->execute([$semester_id]);
            
            if ($semesterStmt->rowCount() === 0) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Semester is inactive or not found'
                ]);
            }

            // 12. Check for exact duplicate schedule
            $duplicateQuery = "SELECT cvs.schedule_id, v.ven_name, sec.section_name 
                              FROM tbl_class_venue_schedule cvs
                              INNER JOIN tbl_section sec ON cvs.section_id = sec.section_id
                              INNER JOIN tbl_venue v ON cvs.ven_id = v.ven_id
                              WHERE cvs.ven_id = ? 
                              AND cvs.section_id = ?
                              AND cvs.day_of_week = ? 
                              AND cvs.start_time = ?
                              AND cvs.end_time = ?
                              AND cvs.semester_id = ?";
            $duplicateStmt = $this->conn->prepare($duplicateQuery);
            $duplicateStmt->execute([
                $ven_id,
                $section_id,
                $day_of_week,
                $start_time,
                $end_time,
                $semester_id
            ]);
            
            if ($duplicateStmt->rowCount() > 0) {
                $duplicate = $duplicateStmt->fetch(PDO::FETCH_ASSOC);
                return json_encode([
                    'status' => 'error',
                    'message' => 'Duplicate schedule: Section "' . $duplicate['section_name'] . '" is already scheduled at venue "' . $duplicate['ven_name'] . '" on ' . $day_of_week . ' from ' . date('g:i A', strtotime($start_time)) . ' to ' . date('g:i A', strtotime($end_time))
                ]);
            }

            // 13. Check if the same section is already scheduled at the same time in any venue
            $sectionConflictQuery = "SELECT cvs.schedule_id, v.ven_name, sec.section_name 
                                     FROM tbl_class_venue_schedule cvs
                                     INNER JOIN tbl_section sec ON cvs.section_id = sec.section_id
                                     INNER JOIN tbl_venue v ON cvs.ven_id = v.ven_id
                                     WHERE cvs.section_id = ? 
                                     AND cvs.day_of_week = ? 
                                     AND cvs.semester_id = ?
                                     AND (
                                         (cvs.start_time < ? AND cvs.end_time > ?) OR
                                         (cvs.start_time < ? AND cvs.end_time > ?) OR
                                         (cvs.start_time >= ? AND cvs.end_time <= ?) OR
                                         (cvs.start_time <= ? AND cvs.end_time >= ?)
                                     )";
            $sectionConflictStmt = $this->conn->prepare($sectionConflictQuery);
            $sectionConflictStmt->execute([
                $section_id,
                $day_of_week,
                $semester_id,
                $end_time, $start_time,
                $end_time, $end_time,
                $start_time, $end_time,
                $start_time, $end_time
            ]);
            
            if ($sectionConflictStmt->rowCount() > 0) {
                $sectionConflict = $sectionConflictStmt->fetch(PDO::FETCH_ASSOC);
                return json_encode([
                    'status' => 'error',
                    'message' => 'Section conflict: Section "' . $sectionConflict['section_name'] . '" is already scheduled at venue "' . $sectionConflict['ven_name'] . '" during the selected time slot'
                ]);
            }

            // 14. Check for venue time conflicts
            $conflictQuery = "SELECT cvs.schedule_id, sec.section_name 
                             FROM tbl_class_venue_schedule cvs
                             INNER JOIN tbl_section sec ON cvs.section_id = sec.section_id
                             WHERE cvs.ven_id = ? 
                             AND cvs.day_of_week = ? 
                             AND cvs.semester_id = ?
                             AND (
                                 (cvs.start_time < ? AND cvs.end_time > ?) OR
                                 (cvs.start_time < ? AND cvs.end_time > ?) OR
                                 (cvs.start_time >= ? AND cvs.end_time <= ?) OR
                                 (cvs.start_time <= ? AND cvs.end_time >= ?)
                             )";
            $conflictStmt = $this->conn->prepare($conflictQuery);
            $conflictStmt->execute([
                $ven_id, 
                $day_of_week, 
                $semester_id,
                $end_time, $start_time,
                $end_time, $end_time,
                $start_time, $end_time,
                $start_time, $end_time
            ]);
            
            if ($conflictStmt->rowCount() > 0) {
                $conflict = $conflictStmt->fetch(PDO::FETCH_ASSOC);
                return json_encode([
                    'status' => 'error',
                    'message' => 'Venue conflict: This venue is already scheduled for section "' . $conflict['section_name'] . '" during the selected time slot'
                ]);
            }

            // 15. Insert the new schedule
            $insertQuery = "INSERT INTO tbl_class_venue_schedule 
                           (semester_id, section_id, ven_id, day_of_week, start_time, end_time, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?, NOW())";
            $insertStmt = $this->conn->prepare($insertQuery);
            $result = $insertStmt->execute([$semester_id, $section_id, $ven_id, $day_of_week, $start_time, $end_time]);
            
            if (!$result) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Failed to add schedule'
                ]);
            }

            return json_encode([
                'status' => 'success',
                'message' => 'Schedule added successfully',
                'schedule_id' => $this->conn->lastInsertId()
            ]);
            
        } catch (PDOException $e) {
            error_log("Database error in addClassSchedule: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        } catch (Exception $e) {
            error_log("Error in addClassSchedule: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'An error occurred while adding the schedule'
            ]);
        }
    }

    public function fetchSections() {
        try {
            $query = "SELECT section_id, section_name FROM tbl_section ORDER BY section_name ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode([
                'status' => 'success',
                'data' => $sections
            ]);
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function fetchAllVenues() {
        try {
            $query = "SELECT ven_id, ven_name FROM tbl_venue WHERE ven_is_active = 1 ORDER BY ven_name ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $venues = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode([
                'status' => 'success',
                'data' => $venues
            ]);
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function addVenueSchedule($academicSessionId, $schedules) {
        try {
            $this->conn->beginTransaction();
            
            $insertedCount = 0;
            $errors = [];
            $createdSections = [];
            
            foreach ($schedules as $schedule) {
                // Validate required fields
                if (!isset($schedule['venue_id']) || !isset($schedule['section_identifier']) || 
                    !isset($schedule['day_of_week']) || !isset($schedule['start_time']) || 
                    !isset($schedule['end_time'])) {
                    $errors[] = 'Missing required fields in schedule entry';
                    continue;
                }
                
                $sectionIdentifier = $schedule['section_identifier'];
                $sectionId = null;
                
                // Check if section_identifier is a number (existing ID) or string (new section name)
                if (is_numeric($sectionIdentifier)) {
                    // It's an existing section ID
                    $sectionId = (int)$sectionIdentifier;
                } else {
                    // It's a section name - check if it exists or create it
                    $sectionName = trim($sectionIdentifier);
                    
                    // Check if section already exists
                    $checkSectionQuery = "SELECT section_id FROM tbl_section WHERE section_name = :section_name";
                    $checkSectionStmt = $this->conn->prepare($checkSectionQuery);
                    $checkSectionStmt->execute([':section_name' => $sectionName]);
                    $existingSection = $checkSectionStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($existingSection) {
                        $sectionId = $existingSection['section_id'];
                    } else {
                        // Create new section
                        $insertSectionQuery = "INSERT INTO tbl_section (section_name) VALUES (:section_name)";
                        $insertSectionStmt = $this->conn->prepare($insertSectionQuery);
                        $insertSectionStmt->execute([':section_name' => $sectionName]);
                        $sectionId = $this->conn->lastInsertId();
                        $createdSections[] = $sectionName;
                    }
                }
                
                // Check for duplicate schedule
                $checkQuery = "SELECT schedule_id FROM tbl_class_venue_schedule 
                              WHERE academic_session_id = :academic_session_id 
                              AND section_id = :section_id 
                              AND ven_id = :ven_id 
                              AND day_of_week = :day_of_week 
                              AND start_time = :start_time 
                              AND end_time = :end_time";
                              
                $checkStmt = $this->conn->prepare($checkQuery);
                $checkStmt->execute([
                    ':academic_session_id' => $academicSessionId,
                    ':section_id' => $sectionId,
                    ':ven_id' => $schedule['venue_id'],
                    ':day_of_week' => $schedule['day_of_week'],
                    ':start_time' => $schedule['start_time'],
                    ':end_time' => $schedule['end_time']
                ]);
                
                if ($checkStmt->fetch()) {
                    $errors[] = 'Schedule already exists for ' . $schedule['day_of_week'] . 
                               ' ' . $schedule['start_time'] . '-' . $schedule['end_time'];
                    continue;
                }
                
                // Insert schedule
                $insertQuery = "INSERT INTO tbl_class_venue_schedule 
                               (academic_session_id, section_id, ven_id, day_of_week, start_time, end_time, is_active) 
                               VALUES (:academic_session_id, :section_id, :ven_id, :day_of_week, :start_time, :end_time, 1)";
                               
                $insertStmt = $this->conn->prepare($insertQuery);
                $insertStmt->execute([
                    ':academic_session_id' => $academicSessionId,
                    ':section_id' => $sectionId,
                    ':ven_id' => $schedule['venue_id'],
                    ':day_of_week' => $schedule['day_of_week'],
                    ':start_time' => $schedule['start_time'],
                    ':end_time' => $schedule['end_time']
                ]);
                
                $insertedCount++;
            }
            
            $this->conn->commit();
            
            if ($insertedCount > 0) {
                $message = "Successfully added {$insertedCount} schedule(s)";
                if (count($createdSections) > 0) {
                    $message .= ". Created new section(s): " . implode(', ', $createdSections);
                }
                return json_encode([
                    'status' => 'success',
                    'message' => $message,
                    'inserted_count' => $insertedCount,
                    'created_sections' => $createdSections,
                    'errors' => $errors
                ]);
            } else {
                return json_encode([
                    'status' => 'error',
                    'message' => 'No schedules were added',
                    'errors' => $errors
                ]);
            }
            
        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Error in addVenueSchedule: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
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
                CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS requester_name,
                d.departments_name,
                rs.reservation_status_status_id AS status_id,
                rs.reservation_active AS active,
                sm.status_master_name AS reservation_status
            FROM 
                tbl_reservation r
            INNER JOIN 
                tbl_users u ON r.reservation_user_id = u.users_id
            INNER JOIN 
                tbl_departments d ON u.users_department_id = d.departments_id
            LEFT JOIN 
                tbl_reservation_status rs ON r.reservation_id = rs.reservation_reservation_id
            LEFT JOIN 
                tbl_status_master sm ON rs.reservation_status_status_id = sm.status_master_id
            WHERE
                rs.reservation_status_status_id = 7 AND rs.reservation_active = 1
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


    public function fetchVenueScheduledCheck() {
    try {
        // First, get the active academic session
        $activeSessionQuery = "SELECT academic_session_id, school_year_id, semester_id 
                              FROM tbl_academic_session 
                              WHERE is_active = 1 
                              LIMIT 1";
        $activeSessionStmt = $this->conn->prepare($activeSessionQuery);
        $activeSessionStmt->execute();
        $activeSession = $activeSessionStmt->fetch(PDO::FETCH_ASSOC);
        
        // If no active academic session, return empty result
        if (!$activeSession) {
            return json_encode([
                'status' => 'success',
                'data' => [],
                'message' => 'No active academic session found'
            ]);
        }
        
        $activeSessionId = $activeSession['academic_session_id'];
        
        // Fetch venue schedules for active academic session with active schedules only
        $query = "SELECT 
                    cvs.schedule_id,
                    v.ven_id,
                    v.ven_name, 
                    sct.section_id,
                    sct.section_name,
                    cvs.day_of_week, 
                    cvs.start_time, 
                    cvs.end_time,
                    cvs.academic_session_id,
                    cvs.is_active,
                    sem.semester_name,
                    acs.school_year_id,
                    sy.school_year_name
                  FROM tbl_class_venue_schedule cvs
                  INNER JOIN tbl_venue v ON cvs.ven_id = v.ven_id
                  INNER JOIN tbl_section sct ON cvs.section_id = sct.section_id
                  INNER JOIN tbl_academic_session acs ON cvs.academic_session_id = acs.academic_session_id
                  INNER JOIN tbl_semester sem ON acs.semester_id = sem.semester_id
                  INNER JOIN tbl_school_year sy ON acs.school_year_id = sy.school_year_id
                  WHERE cvs.academic_session_id = :academic_session_id 
                  AND cvs.is_active = 1
                  ORDER BY v.ven_name, sct.section_name, cvs.day_of_week, cvs.start_time";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':academic_session_id' => $activeSessionId]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return json_encode([
            'status' => 'success',
            'data' => $result,
            'active_academic_session_id' => $activeSessionId
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        return json_encode([
            'status' => 'error',
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}

public function fetchRequestById($reservationId) {
    try {
        $sql = "
            SELECT 
                r.reservation_id, 
                r.reservation_title, 
                r.reservation_description, 
                r.reservation_start_date, 
                r.reservation_end_date, 
                -- reservation_participants moved to tbl_reservation_venue
                r.reservation_user_id,
                r.reservation_created_at,
                rs.reservation_status_status_id AS status_id,
                rs.reservation_active AS active,
                ul.user_level_name,
                dep.departments_name,
                CONCAT(u_req.users_fname, ' ', u_req.users_mname, ' ', u_req.users_lname) AS requester_name,
                dep.departments_name AS department_name,
                -- Only venue names
                GROUP_CONCAT(DISTINCT venue.ven_name SEPARATOR '|') AS venue_names
            FROM 
                tbl_reservation r
            LEFT JOIN tbl_reservation_status rs ON r.reservation_id = rs.reservation_reservation_id
            LEFT JOIN tbl_users u_req ON r.reservation_user_id = u_req.users_id
            LEFT JOIN tbl_user_level ul ON u_req.users_user_level_id = ul.user_level_id
            LEFT JOIN tbl_departments dep ON u_req.users_department_id = dep.departments_id
            LEFT JOIN tbl_reservation_venue v ON r.reservation_id = v.reservation_reservation_id
            LEFT JOIN tbl_venue venue ON v.reservation_venue_venue_id = venue.ven_id
            WHERE r.reservation_id = :reservation_id
            GROUP BY r.reservation_id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            // Prepare response
            $response = [
                'reservation_id' => $row['reservation_id'],
                'reservation_created_at' => $row['reservation_created_at'],
                'reservation_title' => $row['reservation_title'],
                'reservation_description' => $row['reservation_description'],
                'reservation_start_date' => $row['reservation_start_date'],
                'reservation_end_date' => $row['reservation_end_date'],
                // reservation_participants now in venues array
                'status_id' => $row['status_id'],
                'active' => $row['active'],
                'reservation_user_id' => $row['reservation_user_id'],
                'requester_name' => $row['requester_name'],
                'department_name' => $row['department_name'],
                'user_level_name' => $row['user_level_name'],
                'venues' => []
            ];

            // VENUE NAMES ONLY
            if (!empty($row['venue_names'])) {
                $names = explode('|', $row['venue_names']);
                foreach ($names as $name) {
                    if (trim($name) !== '') {
                        $response['venues'][] = [
                            'venue_name' => $name
                        ];
                    }
                }
            }

            return json_encode(['status' => 'success', 'data' => $response]);
        } else {
            return json_encode(['status' => 'error', 'message' => 'Reservation not found']);
        }

    } catch (PDOException $e) {
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

public function handleReviewUpdated($reservationId, $userId, $isAvailable) {
    try {
        $this->conn->beginTransaction();

        // Step 1: Deactivate old status with ID 7
        $sql = "UPDATE tbl_reservation_status 
                SET reservation_active = 0
                WHERE reservation_reservation_id = :reservation_id 
                AND reservation_status_status_id = 7";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmt->execute();

        // Step 2: Determine new status ID
        $statusId = $isAvailable ? 8 : 9;

        // Step 3: Insert new status record
        $sqlInsert = "
            INSERT INTO tbl_reservation_status (
                reservation_status_status_id,
                reservation_reservation_id,
                reservation_active,
                reservation_users_id,
                reservation_updated_at
            ) VALUES (
                :status_id,
                :reservation_id,
                1,
                :user_id,
                NOW()
            )
        ";

        $stmtInsert = $this->conn->prepare($sqlInsert);
        $stmtInsert->bindParam(':status_id', $statusId, PDO::PARAM_INT);
        $stmtInsert->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmtInsert->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmtInsert->execute();

        // Step 4: Insert notification
        $sqlNotif = "
            INSERT INTO notification_requests (
                notification_message,
                notification_department_id,
                notification_user_level_id,
                notification_create
            ) VALUES (
                :message,
                :department_id,
                :user_level_id,
                NOW()
            )
        ";

        $stmtNotif = $this->conn->prepare($sqlNotif);

        // Customize message
        if ($isAvailable) {
            $message = "Venue has been approved and available by registrar.";
        } else {
            $message = "Venue is NOT AVAILABLE for the requested time.";
        }

        // You can change these IDs based on your system
        $departmentId = 27;
        $userLevelId = 1;

        $stmtNotif->bindParam(':message', $message, PDO::PARAM_STR);
        $stmtNotif->bindParam(':department_id', $departmentId, PDO::PARAM_INT);
        $stmtNotif->bindParam(':user_level_id', $userLevelId, PDO::PARAM_INT);
        $stmtNotif->execute();

        // Finalize transaction
        $this->conn->commit();

        return json_encode([
            'status' => 'success',
            'message' => $message,
            'reservation_id' => $reservationId,
            'status_id' => $statusId
        ]);

    } catch (PDOException $e) {
        $this->conn->rollBack();
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        $this->conn->rollBack();
        return json_encode([
            'status' => 'error',
            'message' => 'General error: ' . $e->getMessage()
        ]);
    }
}

public function fetchApprovalNotification($departmentId, $userLevelId) {
        try {
            if ($departmentId === null || $userLevelId === null) {
                return json_encode(['status' => 'error', 'message' => 'Missing department ID or user level ID']);
            }
    
            $sql = "SELECT 
                        notification_id, 
                        notification_message, 
                        notification_department_id, 
                        notification_user_level_id, 
                        notification_create 
                    FROM notification_requests 
                    WHERE notification_department_id = :department_id
                      AND notification_user_level_id = :user_level_id
                    ORDER BY notification_create DESC";
    
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':department_id' => $departmentId,
                ':user_level_id' => $userLevelId
            ]);
    
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return json_encode(['status' => 'success', 'data' => $notifications]);
    
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function handleApproval($reservationId, $isAccepted, $userId, $notificationMessage = '', $notification_user_id = null) {
        try {
            $this->conn->beginTransaction();
    
            // 1. First check the current status of the reservation (same validation as saveChecklist)
            $checkSql = "
                SELECT 
                    rs.reservation_status_status_id,
                    rs.reservation_active,
                    sm.status_master_name,
                    r.reservation_end_date
                FROM tbl_reservation_status rs
                LEFT JOIN tbl_status_master sm ON rs.reservation_status_status_id = sm.status_master_id
                LEFT JOIN tbl_reservation r ON rs.reservation_reservation_id = r.reservation_id
                WHERE rs.reservation_reservation_id = :reservation_id
                ORDER BY rs.reservation_status_id DESC
                LIMIT 1
            ";
            
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $checkStmt->execute();
            $currentStatus = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$currentStatus) {
                throw new Exception("Reservation not found");
            }
            
            $currentStatusId = (int)$currentStatus['reservation_status_status_id'];
            
            // Check if reservation is in final states (cancelled, completed, declined/rejected)
            if ($currentStatusId === 2) {
                throw new Exception("Cannot process approval: Reservation has been cancelled");
            }
            
            if ($currentStatusId === 4) {
                throw new Exception("Cannot process approval: Reservation has been declined/rejected");
            }
            
            if ($currentStatusId === 5) {
                throw new Exception("Cannot process approval: Reservation has been completed");
            }
            
            // Check if reservation has expired (end date has passed)
            if (!empty($currentStatus['reservation_end_date'])) {
                $endDate = new DateTime($currentStatus['reservation_end_date']);
                $now = new DateTime();
                if ($endDate < $now) {
                    throw new Exception("Cannot process approval: Reservation has expired");
                }
            }
    
            // 2. Get the user's department_id
            $userSql = "SELECT users_department_id FROM tbl_users WHERE users_id = :user_id";
            $userStmt = $this->conn->prepare($userSql);
            $userStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $userStmt->execute();
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user || !isset($user['users_department_id'])) {
                throw new Exception("User department not found");
            }
    
            $departmentId = $user['users_department_id'];
    
            // 2. Update only the specific department approval record
            $sql = "UPDATE tbl_department_approval 
                    SET department_is_approved = :approval_status,
                        department_user_id = :user_id,
                        department_updated_at = NOW()
                    WHERE department_request_reservation_id = :reservation_id
                    AND department_approval_department_id = :department_id";
            
            $stmt = $this->conn->prepare($sql);
            $approval_status = $isAccepted ? 1 : -1;
            $stmt->bindParam(':approval_status', $approval_status, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmt->bindParam(':department_id', $departmentId, PDO::PARAM_INT);
            $stmt->execute();
    
            // Check if any rows were affected
            if ($stmt->rowCount() === 0) {
                throw new Exception("No matching department approval record found");
            }
    
            // Set notification message based on approval status
            $defaultMessage = $isAccepted ? 'Request Approved by Department' : 'Request Declined by Department';
            $notificationMessage = !empty($notificationMessage) ? $notificationMessage : $defaultMessage;
            
            // Determine the requester (reservation owner) and insert user notification
            $reqStmt = $this->conn->prepare("SELECT reservation_user_id FROM tbl_reservation WHERE reservation_id = :reservation_id");
            $reqStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $reqStmt->execute();
            $reqRow = $reqStmt->fetch(PDO::FETCH_ASSOC);
            if (!$reqRow || empty($reqRow['reservation_user_id'])) {
                throw new Exception("Requester not found for reservation");
            }
            $notificationUserId = (int)$reqRow['reservation_user_id'];

            $sqlNotification = "INSERT INTO tbl_notification_reservation 
                             (notification_message, notification_reservation_reservation_id, notification_user_id, notification_created_at) 
                             VALUES (:message, :reservation_id, :notification_user_id, NOW())";

            $stmtNotification = $this->conn->prepare($sqlNotification);
            $stmtNotification->bindParam(':message', $notificationMessage, PDO::PARAM_STR);
            $stmtNotification->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtNotification->bindParam(':notification_user_id', $notificationUserId, PDO::PARAM_INT);
            $stmtNotification->execute();
            
            $this->conn->commit();
            
            // 🔥 SEQUENTIAL APPROVAL: If own department approved, insert remaining departments
            if ($isAccepted) {
                $this->insertRemainingDepartmentsAfterOwnApproval($reservationId, $departmentId);
            }
            
            // Audit log: who approved/declined and which reservation
            try {
                // Fetch approver name
                $approverName = 'User ID ' . (string)$userId;
                try {
                    $unameStmt = $this->conn->prepare("SELECT CONCAT_WS(' ', users_fname, users_mname, users_lname) AS full_name FROM tbl_users WHERE users_id = :uid");
                    $unameStmt->bindParam(':uid', $userId, PDO::PARAM_INT);
                    $unameStmt->execute();
                    $uname = $unameStmt->fetch(PDO::FETCH_ASSOC);
                    if ($uname && !empty(trim((string)$uname['full_name']))) {
                        $approverName = trim((string)$uname['full_name']);
                    }
                } catch (Throwable $te) {
                    error_log("Audit approver lookup failed (handleApproval): " . $te->getMessage());
                }
    
                // Fetch reservation title
                $resTitle = 'Reservation';
                try {
                    $resStmt = $this->conn->prepare("SELECT reservation_title FROM tbl_reservation WHERE reservation_id = :rid");
                    $resStmt->bindParam(':rid', $reservationId, PDO::PARAM_INT);
                    $resStmt->execute();
                    $res = $resStmt->fetch(PDO::FETCH_ASSOC);
                    if ($res && isset($res['reservation_title']) && trim((string)$res['reservation_title']) !== '') {
                        $resTitle = (string)$res['reservation_title'];
                    }
                } catch (Throwable $te) {
                    error_log("Audit reservation lookup failed (handleApproval): " . $te->getMessage());
                }
    
                $statusText = $isAccepted ? 'approved' : 'declined';
                $desc = "Reservation '" . $resTitle . "' " . $statusText . " by " . $approverName;
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $action = $isAccepted ? 'APPROVE' : 'DECLINE';
                $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                $audit->bindParam(':action', $action, PDO::PARAM_STR);
                $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                if (!$audit->execute()) {
                    error_log("Audit log insert failed (handleApproval): " . print_r($audit->errorInfo(), true));
                } else {
                    try {
                        $latest = $this->conn->query("SELECT id, description, action, created_at, created_by FROM audit_log ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
                        
                    } catch (Throwable $te) {
                        error_log("Failed to read latest audit_log (handleApproval): " . $te->getMessage());
                    }
                }
            } catch (Throwable $te) {
                error_log("Audit logging error (handleApproval): " . $te->getMessage());
            }
    
            // Send push notification
            $this->sendApprovalPushNotification($reservationId, $isAccepted, $notificationUserId);
            
            return json_encode([
                'status' => 'success', 
                'message' => 'Department request ' . ($isAccepted ? 'approved' : 'declined') . ' successfully',
                'reservation_id' => $reservationId,
                'department_id' => $departmentId,
                'approval_status' => $approval_status
            ]);
    
        } catch (Exception $e) {
            $this->conn->rollBack();
            return json_encode([
                'status' => 'error', 
                'message' => $e->getMessage()
            ]);
        }
    }

    public function sendApprovalPushNotification($reservationId, $isAccepted, $userId, $data = []) {
        try {
            // Make a POST request to the push notification service
            // $pushNotificationUrl = 'https://peachpuff-alligator-715719.hostingersite.com/gsd/api/server/send-push-notification.php';
            // $pushNotificationUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/server/send-push-notification.php';
            // Include push notification configuration
            require_once __DIR__ . '/config/pushConfig.php';
            
            // Get push notification URL from configuration
            $pushNotificationUrl = getPushNotificationUrl();
            $title = 'Department Approval Update';
            $body = $isAccepted ? 'Your reservation has been approved by the department.' : 'Your reservation has been declined by the department.';
            
            $notificationData = array_merge([
                'reservation_id' => $reservationId,
                'status' => $isAccepted ? 'approved' : 'declined',
                'type' => 'department_approval'
            ], $data);
            
            $postData = json_encode([
                'operation' => 'send',
                'user_id' => $userId,
                'title' => $title,
                'body' => $body,
                'data' => $notificationData
            ]);
            // Use cURL instead of file_get_contents to avoid warnings
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
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($error || $httpCode < 200 || $httpCode >= 300 || $result === false) {
                // Log error but don't show warning - fail silently
                error_log("Department approval push notification failed for user $userId: " . ($error ?: "HTTP $httpCode"));
                return false;
            }
            
            $response = json_decode($result, true);
            if ($response && isset($response['status']) && $response['status'] === 'success') {
             
                return true;
            } else {
                error_log("Department approval push notification failed for user $userId: " . ($response['message'] ?? 'Unknown error'));
                return false;
            }
            
        } catch (Exception $e) {
            error_log("Exception in sendApprovalPushNotification: " . $e->getMessage());
            return false;
        }
    }

    // Insert remaining department approvals after own department approves
    private function insertRemainingDepartmentsAfterOwnApproval($reservationId, $approvedDepartmentId) {
        try {
            
            
            // Get requester info
            $sqlRequester = "SELECT 
                                u.users_id,
                                u.users_user_level_id,
                                u.users_department_id
                            FROM tbl_reservation r
                            INNER JOIN tbl_users u ON r.reservation_user_id = u.users_id
                            WHERE r.reservation_id = :reservation_id";
            
            $stmtRequester = $this->conn->prepare($sqlRequester);
            $stmtRequester->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtRequester->execute();
            $requester = $stmtRequester->fetch(PDO::FETCH_ASSOC);
            
            if (!$requester) {
                error_log("⚠️  Could not find requester info for reservation {$reservationId}");
                return;
            }
            
            $requesterUserId = (int)$requester['users_id'];
            $requesterUserLevel = (int)$requester['users_user_level_id'];
            $requesterDepartment = (int)$requester['users_department_id'];
            
          
            
            // Check if approved department is the requester's own department
            if ($approvedDepartmentId != $requesterDepartment) {
                
                return;
            }
            
            // Check if requester is level 5 or 6
            if ($requesterUserLevel === 5) {
               
                return;
            }
            
         
            
            // Get all required departments from venue approval configuration
            $sqlVenues = "SELECT reservation_venue_venue_id 
                         FROM tbl_reservation_venue 
                         WHERE reservation_reservation_id = :reservation_id";
            $stmtVenues = $this->conn->prepare($sqlVenues);
            $stmtVenues->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtVenues->execute();
            $venues = $stmtVenues->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($venues)) {
               
                return;
            }
            
            // Get required departments for all venues
            $venueIds = implode(",", array_map('intval', $venues));
            $sqlRequiredDepts = "SELECT DISTINCT approval_venue_department_id
                                FROM tbl_venue_department_approval
                                WHERE approval_venue_venue_id IN ($venueIds)";
            $stmtRequiredDepts = $this->conn->query($sqlRequiredDepts);
            $requiredDepartments = $stmtRequiredDepts->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($requiredDepartments)) {
              
                return;
            }
            
          
            
            // Get already inserted departments
            $sqlExisting = "SELECT department_approval_department_id
                           FROM tbl_department_approval
                           WHERE department_request_reservation_id = :reservation_id";
            $stmtExisting = $this->conn->prepare($sqlExisting);
            $stmtExisting->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtExisting->execute();
            $existingDepartments = $stmtExisting->fetchAll(PDO::FETCH_COLUMN);
            
          
            
            // Calculate remaining departments to insert
            $remainingDepartments = array_diff($requiredDepartments, $existingDepartments);
            
            if (empty($remainingDepartments)) {
               
                return;
            }
            
          
            
            // Insert remaining departments
            $insertCount = 0;
            foreach ($remainingDepartments as $deptId) {
                $sqlInsert = "INSERT INTO tbl_department_approval 
                             (department_is_approved, department_approval_department_id, 
                             department_user_id, department_updated_at, department_request_reservation_id) 
                             VALUES (0, :dept_id, NULL, NULL, :reservation_id)";
                
                $stmtInsert = $this->conn->prepare($sqlInsert);
                $stmtInsert->bindParam(':dept_id', $deptId, PDO::PARAM_INT);
                $stmtInsert->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                
                if ($stmtInsert->execute()) {
                    $insertCount++;
                  
                } else {
                    error_log("❌ Failed to insert department approval for department {$deptId}");
                }
            }
            
        
            // Send push notifications to newly added departments
            if ($insertCount > 0) {
                
                $this->sendPushNotificationToNewDepartments($reservationId, $remainingDepartments);
            }
            
        } catch (Exception $e) {
            error_log("Exception in insertRemainingDepartmentsAfterOwnApproval: " . $e->getMessage());
        }
    }

    // Send push notifications to newly added departments
    private function sendPushNotificationToNewDepartments($reservationId, $departmentIds) {
        try {
            if (empty($departmentIds)) {
                
                return;
            }
            
            
            
            // Get reservation details
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
                error_log("❌ Could not find reservation details for ID: " . $reservationId);
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
            
            $totalNotificationsSent = 0;
            $departmentsSummary = [];
            
            // Send to each department
            foreach ($departmentIds as $deptId) {
                
                
                // Get department name
                $sqlDeptName = "SELECT departments_name FROM tbl_departments WHERE departments_id = :dept_id";
                $stmtDeptName = $this->conn->prepare($sqlDeptName);
                $stmtDeptName->bindParam(':dept_id', $deptId, PDO::PARAM_INT);
                $stmtDeptName->execute();
                $deptInfo = $stmtDeptName->fetch(PDO::FETCH_ASSOC);
                $deptName = $deptInfo['departments_name'] ?? "Unknown Dept {$deptId}";
                
                // Get users from department with push subscriptions
                $sqlUsers = "SELECT 
                                u.users_id,
                                CONCAT(u.users_fname, ' ', u.users_lname) as user_name,
                                ul.user_level_name
                            FROM tbl_users u
                            INNER JOIN tbl_push_subscriptions ps ON u.users_id = ps.user_id
                            LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                            WHERE u.users_department_id = :dept_id 
                            AND u.users_user_level_id IN (5, 16)
                            AND ps.is_active = 1";
                
                $stmtUsers = $this->conn->prepare($sqlUsers);
                $stmtUsers->bindParam(':dept_id', $deptId, PDO::PARAM_INT);
                $stmtUsers->execute();
                $users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);
                
                if (empty($users)) {
                    error_log("⚠️  No users with push subscriptions found in department '{$deptName}' (ID: {$deptId})");
                    $departmentsSummary[] = "{$deptName}: 0 notifications (no users with subscriptions)";
                } else {
                    $deptNotificationCount = 0;
                    $notifiedUsers = [];
                    
                    foreach ($users as $user) {
                        $result = $this->sendApprovalPushNotification($reservationId, true, $user['users_id'], $data);
                        
                        if ($result) {
                            $deptNotificationCount++;
                            $totalNotificationsSent++;
                            $notifiedUsers[] = "{$user['user_name']} ({$user['user_level_name']})";
                            error_log("✅ Sent notification to user {$user['users_id']} ({$user['user_name']}) in department '{$deptName}'");
                        } else {
                            error_log("❌ Failed to send notification to user {$user['users_id']} ({$user['user_name']}) in department '{$deptName}'");
                        }
                    }
                    
                    $departmentsSummary[] = "{$deptName}: {$deptNotificationCount} notification(s) → " . implode(', ', $notifiedUsers);
                }
            }
            
            // Final summary
            error_log("📊 PUSH NOTIFICATION SUMMARY for Reservation {$reservationId}:");
            error_log("   Total departments: " . count($departmentIds));
            error_log("   Total notifications sent: {$totalNotificationsSent}");
            error_log("   Breakdown by department:");
            foreach ($departmentsSummary as $summary) {
                error_log("   - {$summary}");
            }
            error_log("📧 END: Push notification sending complete");
            
        } catch (Exception $e) {
            error_log("Exception in sendPushNotificationToNewDepartments: " . $e->getMessage());
        }
    }
}

// Handle JSON POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);

    if (!$data || !isset($data['operation'])) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON or missing operation']);
        exit();
    }

    $operation = $data['operation'];
    $user = new Department_Dean();

    switch ($operation) {

        case "handleApproval":
            $reservationId = $data['reservation_id'] ?? null;
            $isAccepted = $data['is_accepted'] ?? false;
            $userId = $data['user_id'] ?? null;
            $notificationMessage = $data['notification_message'] ?? '';
            $notificationUserId = $data['notification_user_id'] ?? null;
            if ($reservationId === null) {
                echo json_encode(['status' => 'error', 'message' => 'Reservation ID is required']);
                break;
            }
            if ($userId === null) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            echo $user->handleApproval($reservationId, $isAccepted, $userId, $notificationMessage, $notificationUserId);
            break;
            
        case "fetchApprovalNotification":
            $departmentId = $data['department_id'] ?? null;
            $userLevelId = $data['user_level_id'] ?? null;
            if ($departmentId === null || $userLevelId === null) {
                echo json_encode(['status' => 'error', 'message' => 'Department ID and User Level ID are required']);
                break;
            }
            echo $user->fetchApprovalNotification($departmentId, $userLevelId);
            break;
            
        case "fetchApprovalByDept":
            // Extract parameters - check both direct and nested json structure
            $departmentId    = $data['department_id']    ?? $data['json']['department_id']    ?? null;
            $userLevelId     = $data['user_level_id']     ?? $data['json']['user_level_id']     ?? null;
            $currentUserId   = $data['current_user_id']   ?? $data['json']['current_user_id']   ?? null;

            // Validate presence
            if ($departmentId === null || $userLevelId === null || $currentUserId === null) {
                echo json_encode([
                    'status'  => 'error',
                    'message' => 'Department ID, User Level ID, and Current User ID are required'
                ]);
                break;
            }

            // Call your service method
            echo $user->fetchApprovalByDept(
                (int)$departmentId,
                (int)$userLevelId,
                (int)$currentUserId
            );
            break;

        case "handleReviewUpdated":
            $reservationId = $data['reservation_id'] ?? null;
            $userId = $data['user_id'] ?? null;
            $isAvailable = isset($data['is_available']) ? (bool)$data['is_available'] : null;

            if ($reservationId !== null && $userId !== null && $isAvailable !== null) {
                echo $user->handleReviewUpdated($reservationId, $userId, $isAvailable);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Missing parameters']);
            }
            break;

        case "fetchRequestById":
            $reservationId = $data['reservation_id'] ?? null;
            if ($reservationId !== null) {
                echo $user->fetchRequestById($reservationId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Missing reservation_id parameter']);
            }
            break;
        case "fetchVenueScheduledCheck":
            echo $user->fetchVenueScheduledCheck();
            break;

        case "fetchRequestReservation":
            echo $user->fetchRequestReservation();
            break;
        case 'uploadClassroomCSV':
            $academic_session_id = $data['academic_session_id'] ?? null;
            $csvData = $data['csv_data'] ?? [];

            if ($academic_session_id && is_array($csvData)) {
                echo $user->uploadClassroomJSON($academic_session_id, $csvData);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Missing or invalid parameters']);
            }
            break;
        case 'fetchSchoolYear':
            echo $user->fetchSchoolYear();
            break;
        case 'fetchSemester':
            $school_year_id = $data['school_year_id'] ?? null;
            if ($school_year_id !== null) {
                echo $user->fetchSemester($school_year_id);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Missing school_year_id parameter']);
            }
            break;
        case 'fetchVenueScheduled':
            $academic_session_id = $data['academic_session_id'] ?? null;
            if ($academic_session_id !== null) {
                echo $user->fetchVenueScheduled($academic_session_id);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Missing academic_session_id parameter']);
            }
            break;
        case 'fetchVenueByVenId':
            $ven_id = $data['ven_id'] ?? null;
            if ($ven_id !== null) {
                echo $user->fetchVenueByVenId($ven_id);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Missing ven_id parameter']);
            }
            break;
        case 'updateClassSchedule':
            $schedule_id = $data['schedule_id'] ?? null;
            $ven_id = $data['ven_id'] ?? null;
            $day_of_week = $data['day_of_week'] ?? null;
            $start_time = $data['start_time'] ?? null;
            $end_time = $data['end_time'] ?? null;
            
            if ($schedule_id && $ven_id && $day_of_week && $start_time && $end_time) {
                echo $user->updateClassSchedule($schedule_id, $ven_id, $day_of_week, $start_time, $end_time);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
            }
            break;

        case 'addClassSchedule':
            $semester_id = $data['semester_id'] ?? null;
            $section_name = $data['section_name'] ?? null;
            $ven_id = $data['ven_id'] ?? null;
            $day_of_week = $data['day_of_week'] ?? null;
            $start_time = $data['start_time'] ?? null;
            $end_time = $data['end_time'] ?? null;
            
            // Check which parameters are missing
            $missing = [];
            if (!$semester_id) $missing[] = 'semester_id';
            if (!$section_name) $missing[] = 'section_name';
            if (!$ven_id) $missing[] = 'ven_id';
            if (!$day_of_week) $missing[] = 'day_of_week';
            if (!$start_time) $missing[] = 'start_time';
            if (!$end_time) $missing[] = 'end_time';
            
            if (empty($missing)) {
                echo $user->addClassSchedule($semester_id, $section_name, $ven_id, $day_of_week, $start_time, $end_time);
            } else {
                echo json_encode([
                    'status' => 'error', 
                    'message' => 'Missing required parameters: ' . implode(', ', $missing)
                ]);
            }
            break;

        case 'fetchSections':
            echo $user->fetchSections();
            break;
        
        case 'fetchAllVenues':
            echo $user->fetchAllVenues();
            break;
        
        case 'addVenueSchedule':
            $academic_session_id = $data['academic_session_id'] ?? null;
            $schedules = $data['schedules'] ?? [];
            
            if ($academic_session_id && is_array($schedules) && count($schedules) > 0) {
                echo $user->addVenueSchedule($academic_session_id, $schedules);
            } else {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Missing or invalid parameters. Academic session ID and schedules array are required.'
                ]);
            }
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid operation']);
            break;
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>

