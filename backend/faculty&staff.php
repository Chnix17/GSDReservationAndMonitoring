<?php 
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class FacultyStaff {
    private $conn;

    public function __construct() {
        include 'connection-pdo.php'; 
        $this->conn = $conn;
    }

    // Add complaint function
    public function addComplaint($subject, $clientId, $locationId, $locationCategoryId, $description, $endDate, $imagePath = null, $userId = null) {
        try {
            // Set timezone to Asia/Manila
            date_default_timezone_set('Asia/Manila');
            $compDate = date('Y-m-d H:i:s');
            
            // Use userId if provided, otherwise use clientId
            $updatedBy = $userId ?? $clientId;
            
            // Prepare the SQL insert statement
            $sql = "INSERT INTO tblcomplaints 
                    (comp_subject, comp_clientId, comp_locationId, comp_locationCategoryId, comp_description, comp_date, comp_end_date, comp_image)
                    VALUES (:subject, :clientId, :locationId, :locationCategoryId, :description, :compDate, :endDate, :imagePath)";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':subject', $subject, PDO::PARAM_STR);
            $stmt->bindValue(':clientId', $clientId, PDO::PARAM_INT);
            $stmt->bindValue(':locationId', $locationId, PDO::PARAM_INT);
            $stmt->bindValue(':locationCategoryId', $locationCategoryId, PDO::PARAM_INT);
            $stmt->bindValue(':description', $description, PDO::PARAM_STR);
            $stmt->bindValue(':compDate', $compDate, PDO::PARAM_STR);
            $stmt->bindValue(':endDate', $endDate, PDO::PARAM_STR);
            $stmt->bindValue(':imagePath', $imagePath, PDO::PARAM_STR);
            
            if ($stmt->execute()) {
                // Get the inserted complaint ID
                $compId = $this->conn->lastInsertId();
                
                if (!$compId) {
                    error_log('addComplaint Error: Failed to get last insert ID after inserting complaint. Subject: ' . $subject . ', ClientId: ' . $clientId);
                    return 0; // Failed
                }
                
                // Insert into complaint status history
                $historySql = "INSERT INTO tblcomplaint_status_history 
                              (history_compId, history_statusId, history_updatedBy, history_date)
                              VALUES (:compId, :statusId, :updatedBy, :historyDate)";
                
                $historyStmt = $this->conn->prepare($historySql);
                $historyStmt->bindValue(':compId', $compId, PDO::PARAM_INT);
                $historyStmt->bindValue(':statusId', 1, PDO::PARAM_INT); // Status 1 = Pending
                $historyStmt->bindValue(':updatedBy', $updatedBy, PDO::PARAM_INT);
                $historyStmt->bindValue(':historyDate', $compDate, PDO::PARAM_STR);
                
                if ($historyStmt->execute()) {
                    // Fire push notification to admins for new complaint
                    try {
                        $this->sendComplaintPushNotification($compId, $clientId, $subject);
                    } catch (Exception $e) {
                        error_log('addComplaint PushNotify Exception: ' . $e->getMessage());
                    }
                    return 1; // Success
                } else {
                    $errorInfo = $historyStmt->errorInfo();
                    error_log('addComplaint Error: Failed to insert into complaint status history. ComplaintId: ' . $compId . ', UpdatedBy: ' . $updatedBy . ', Error: ' . print_r($errorInfo, true));
                    return 0; // Failed
                }
            } else {
                $errorInfo = $stmt->errorInfo();
                error_log('addComplaint Error: Failed to insert complaint. Subject: ' . $subject . ', ClientId: ' . $clientId . ', Error: ' . print_r($errorInfo, true));
                return 0; // Failed
            }
        } catch (PDOException $e) {
            error_log('addComplaint PDOException: ' . $e->getMessage() . ' | Subject: ' . $subject . ' | ClientId: ' . $clientId . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return 0; // Failed
        } catch (Exception $e) {
            error_log('addComplaint Exception: ' . $e->getMessage() . ' | Subject: ' . $subject . ' | ClientId: ' . $clientId . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            return 0; // Failed
        }
    }

    // Submit a general issue report (accessible to all logged-in users)
    public function submitReport($name, $issue, $description = null)
    {
        try {
            $sql = "INSERT INTO tbl_reports (name, issue, description, date_reported) VALUES (:name, :issue, :description, NOW())";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':name', $name, PDO::PARAM_STR);
            $stmt->bindValue(':issue', $issue, PDO::PARAM_STR);
            $stmt->bindValue(':description', $description, PDO::PARAM_STR);
            $stmt->execute();

            return json_encode([
                'status' => 'success',
                'message' => 'Report submitted successfully'
            ]);
        } catch (Exception $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Failed to submit report: ' . $e->getMessage()
            ]);
        }
    }

    // Fetch all reports (restricted to Admin/Super Admin)
    public function fetchReports($requestingUserId)
    {
        try {
            // Determine user level name by joining users tables
            $stmtRole = $this->conn->prepare("SELECT ul.user_level_name
                FROM tbl_users u
                LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                WHERE u.users_id = :uid");
            $stmtRole->bindValue(':uid', $requestingUserId, PDO::PARAM_INT);
            $stmtRole->execute();
            $roleRow = $stmtRole->fetch(PDO::FETCH_ASSOC);
            $roleName = $roleRow['user_level_name'] ?? '';

            if (!in_array($roleName, ['Admin', 'Super Admin'])) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Unauthorized: admin access required'
                ]);
            }

            $stmt = $this->conn->prepare("SELECT report_id, name, issue, description, date_reported FROM tbl_reports ORDER BY date_reported DESC");
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return json_encode([
                'status' => 'success',
                'data' => $rows
            ]);
        } catch (Exception $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch reports: ' . $e->getMessage()
            ]);
        }
    }

    // Send push notification to GSD Admins when a new complaint is submitted
    private function sendComplaintPushNotification($complaintId, $clientId, $subject)
    {
        try {
            // Fetch client/requester info
            $userSql = "SELECT u.users_id, u.users_department_id, CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS full_name
                        FROM tbl_users u
                        WHERE u.users_id = :uid";
            $userStmt = $this->conn->prepare($userSql);
            $userStmt->bindValue(':uid', $clientId, PDO::PARAM_INT);
            $userStmt->execute();
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);

            $requesterName = $user['full_name'] ?? 'User';

            // Get recipients: GSD Admins (department 27, user level 1) with active push subscriptions
            $recipientsSql = "SELECT DISTINCT u.users_id
                              FROM tbl_users u
                              INNER JOIN tbl_push_subscriptions ps ON u.users_id = ps.user_id
                              WHERE ps.is_active = 1
                              AND u.is_active = 1
                              AND u.users_department_id = 27
                              AND u.users_user_level_id = 1";
            $recipientsStmt = $this->conn->prepare($recipientsSql);
            $recipientsStmt->execute();
            $recipients = $recipientsStmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($recipients)) {
                error_log('sendComplaintPushNotification: No admin recipients found');
                return;
            }

            $title = 'New Complaint Submitted';
            $body = $requesterName . ' submitted a complaint: ' . $subject;
            $data = [
                'type' => 'complaint_created',
                'complaint_id' => (int)$complaintId,
                'requester_name' => $requesterName,
            ];

            // Push config
            require_once 'config/pushConfig.php';
            $pushUrl = getPushNotificationUrl();

            foreach ($recipients as $recipient) {
                $payload = [
                    'operation' => 'send',
                    'user_id' => $recipient['users_id'],
                    'title' => $title,
                    'body' => $body,
                    'data' => $data
                ];

                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $pushUrl);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Content-Length: ' . strlen(json_encode($payload))
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                curl_close($ch);

                if ($error || $httpCode < 200 || $httpCode >= 300) {
                    error_log("sendComplaintPushNotification failed for user {$recipient['users_id']}: " . ($error ?: "HTTP $httpCode") . ", response: " . $response);
                }
            }
        } catch (Exception $e) {
            error_log('sendComplaintPushNotification Exception: ' . $e->getMessage());
        }
    }

    public function handleCancelReservation($reservationId, $userId)
{
    try {
        $this->conn->beginTransaction();

        // Set timezone to Asia/Manila
        date_default_timezone_set('Asia/Manila');
        $currentDateTime = date('Y-m-d H:i:s');

        // Get reservation details including start and end dates and latest status info
        $sqlReservation = "
            SELECT 
                r.reservation_id,
                r.reservation_title,
                r.reservation_start_date,
                r.reservation_end_date,
                r.reschedule_start_date,
                r.reschedule_end_date,
                latest_status.reservation_status_status_id,
                latest_status.reservation_active
            FROM tbl_reservation r
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
            ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
            WHERE r.reservation_id = :reservation_id
        ";
        $stmtReservation = $this->conn->prepare($sqlReservation);
        $stmtReservation->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmtReservation->execute();
        $reservation = $stmtReservation->fetch(PDO::FETCH_ASSOC);

        if (!$reservation) {
            $this->conn->rollBack();
            return json_encode([
                'status' => 'error',
                'message' => 'Reservation not found',
                'reservation_id' => $reservationId
            ]);
        }

        // Prevent cancellation if Admin Approved/Processing (status 7) is active
        $sqlCheckStatus = "
            SELECT COUNT(*) as status_count 
            FROM tbl_reservation_status 
            WHERE reservation_reservation_id = :reservation_id 
            AND reservation_status_status_id = 7 
            AND reservation_active = 1
        ";
        $stmtCheckStatus = $this->conn->prepare($sqlCheckStatus);
        $stmtCheckStatus->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmtCheckStatus->execute();
        $statusCheck = $stmtCheckStatus->fetch(PDO::FETCH_ASSOC);

        if (!empty($statusCheck['status_count']) && $statusCheck['status_count'] > 0) {
            $this->conn->rollBack();
            return json_encode([
                'status' => 'error',
                'message' => 'Reservation cannot be cancelled. It is already being processed by admin.',
                'reservation_id' => $reservationId
            ]);
        }

        // Prevent cancellation if Ongoing (status 9) is active
        $sqlCheckOngoing = "
            SELECT COUNT(*) as status_count 
            FROM tbl_reservation_status 
            WHERE reservation_reservation_id = :reservation_id 
            AND reservation_status_status_id = 9 
            AND reservation_active = 1
        ";
        $stmtCheckOngoing = $this->conn->prepare($sqlCheckOngoing);
        $stmtCheckOngoing->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmtCheckOngoing->execute();
        $ongoingCheck = $stmtCheckOngoing->fetch(PDO::FETCH_ASSOC);

        if (!empty($ongoingCheck['status_count']) && $ongoingCheck['status_count'] > 0) {
            $this->conn->rollBack();
            return json_encode([
                'status' => 'error',
                'message' => 'Reservation cannot be cancelled. The reservation is currently ongoing.',
                'reservation_id' => $reservationId
            ]);
        }

        // If latest status is 6 and still active, make sure current time is not within the scheduled range
        if (isset($reservation['reservation_status_status_id']) 
            && $reservation['reservation_status_status_id'] == 6 
            && isset($reservation['reservation_active']) 
            && $reservation['reservation_active'] == 1) {
            $startDate = $reservation['reschedule_start_date'] ?: $reservation['reservation_start_date'];
            $endDate = $reservation['reschedule_end_date'] ?: $reservation['reservation_end_date'];

            if ($currentDateTime >= $startDate && $currentDateTime <= $endDate) {
                $this->conn->rollBack();
                return json_encode([
                    'status' => 'error',
                    'message' => 'Reservation cannot be cancelled. The reservation is currently active and within its scheduled time range.',
                    'reservation_id' => $reservationId
                ]);
            }
        }

        // ---- KEY FIX: deactivate any currently active status row(s) for this reservation
        // This updates whichever status row is active (no longer relies on status_id = 6)
        $sqlDeactivateActive = "
            UPDATE tbl_reservation_status
            SET reservation_active = 0,
                reservation_users_id = :user_id,
                reservation_updated_at = NOW()
            WHERE reservation_reservation_id = :reservation_id
            AND reservation_active = 1
        ";
        $stmtDeactivateActive = $this->conn->prepare($sqlDeactivateActive);
        $stmtDeactivateActive->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmtDeactivateActive->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmtDeactivateActive->execute();
        // if you want to know how many rows were affected, use $stmtDeactivateActive->rowCount()

        // Fetch reservation + requester info for messaging / logging
        $sqlInfo = "
            SELECT 
                r.reservation_title,
                CONCAT(u.users_fname, ' ', COALESCE(u.users_mname, ''), ' ', u.users_lname) AS requester_name
            FROM tbl_reservation r
            LEFT JOIN tbl_users u ON r.reservation_user_id = u.users_id
            WHERE r.reservation_id = :reservation_id
        ";
        $stmtInfo = $this->conn->prepare($sqlInfo);
        $stmtInfo->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmtInfo->execute();
        $info = $stmtInfo->fetch(PDO::FETCH_ASSOC);

        $cancelMessage = $info && !empty($info['reservation_title'])
            ? "Reservation '{$info['reservation_title']}' by {$info['requester_name']} has been cancelled."
            : 'Reservation Cancelled';

        // Insert new "Cancelled" status (5) with reservation_users_id set to the cancelling user
        $sqlInsertCancel = "
            INSERT INTO tbl_reservation_status
            (reservation_reservation_id, reservation_status_status_id, reservation_active, reservation_updated_at, reservation_users_id)
            VALUES (:reservation_id, 5, 1, NOW(), :user_id)
        ";
        $stmtInsertCancel = $this->conn->prepare($sqlInsertCancel);
        $stmtInsertCancel->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmtInsertCancel->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmtInsertCancel->execute();

        // Commit transaction
        $this->conn->commit();

        // Non-blocking audit logging (after commit)
        try {
            $sqlCanceller = "
                SELECT CONCAT(
                    users_fname,
                    CASE WHEN users_mname IS NOT NULL AND users_mname != '' 
                        THEN CONCAT(' ', LEFT(users_mname, 1), '.') ELSE '' END,
                    ' ', users_lname
                ) AS full_name
                FROM tbl_users
                WHERE users_id = :uid
            ";
            $stmtCanceller = $this->conn->prepare($sqlCanceller);
            $stmtCanceller->bindValue(':uid', $userId, PDO::PARAM_INT);
            $stmtCanceller->execute();
            $canceller = $stmtCanceller->fetch(PDO::FETCH_ASSOC);
            $cancellerName = $canceller['full_name'] ?? ('User #' . (int)$userId);

            $reservationTitle = $info['reservation_title'] ?? 'Reservation';
            $description = "Reservation (" . $reservationTitle . ") was cancelled by: " . $cancellerName;
            $action = 'UPDATE STATUS';

            $stmtAudit = $this->conn->prepare("
                INSERT INTO audit_log (description, action, created_at, created_by)
                VALUES (:description, :action, NOW(), :created_by)
            ");
            $stmtAudit->bindValue(':description', $description, PDO::PARAM_STR);
            $stmtAudit->bindValue(':action', $action, PDO::PARAM_STR);
            $stmtAudit->bindValue(':created_by', $userId, PDO::PARAM_INT);
            $stmtAudit->execute();
        } catch (Exception $e) {
            // ignore audit errors
        }

        return json_encode([
            'status' => 'success',
            'message' => 'Reservation cancelled successfully',
            'reservation_id' => $reservationId
        ]);
    } catch (PDOException $e) {
        // Ensure rollback on error
        try { $this->conn->rollBack(); } catch (Exception $ex) {}
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}


    public function checkCancelEligibility($reservationId, $userId) {
        try {
            // Set timezone to Asia/Manila
            date_default_timezone_set('Asia/Manila');
            $currentDateTime = date('Y-m-d H:i:s');
            
            // Get reservation details including start and end dates
            $sqlReservation = "
                SELECT 
                    r.reservation_id,
                    r.reservation_title,
                    r.reservation_start_date,
                    r.reservation_end_date,
                    r.reschedule_start_date,
                    r.reschedule_end_date,
                    latest_status.reservation_status_status_id,
                    latest_status.reservation_active
                FROM tbl_reservation r
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
                ) latest_status ON latest_status.reservation_reservation_id = r.reservation_id
                WHERE r.reservation_id = :reservation_id";
            
            $stmtReservation = $this->conn->prepare($sqlReservation);
            $stmtReservation->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtReservation->execute();
            $reservation = $stmtReservation->fetch(PDO::FETCH_ASSOC);
            
            if (!$reservation) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Reservation not found',
                    'reservation_id' => $reservationId
                ]);
            }
            
            // Check if reservation has status_id 7 (Admin Approved/Process) before allowing cancellation
            $sqlCheckStatus = "
                SELECT COUNT(*) as status_count 
                FROM tbl_reservation_status 
                WHERE reservation_reservation_id = :reservation_id 
                AND reservation_status_status_id = 7 
                AND reservation_active = 1";
            $stmtCheckStatus = $this->conn->prepare($sqlCheckStatus);
            $stmtCheckStatus->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtCheckStatus->execute();
            $statusCheck = $stmtCheckStatus->fetch(PDO::FETCH_ASSOC);
            
            // If reservation has status_id 7 (Admin Approved/Process), prevent cancellation
            if ($statusCheck['status_count'] > 0) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Reservation cannot be cancelled. It is already being processed by admin.',
                    'reservation_id' => $reservationId
                ]);
            }
            
            // Check if status ID 6 is still active
            if ($reservation['reservation_status_status_id'] == 6 && $reservation['reservation_active'] == 1) {
                // Determine which dates to use (reschedule dates if available, otherwise original dates)
                $startDate = $reservation['reschedule_start_date'] ?: $reservation['reservation_start_date'];
                $endDate = $reservation['reschedule_end_date'] ?: $reservation['reservation_end_date'];
                
                // Check if current time is within the reservation time range
                if ($currentDateTime >= $startDate && $currentDateTime <= $endDate) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Reservation cannot be cancelled. The reservation is currently active and within its scheduled time range.',
                        'reservation_id' => $reservationId
                    ]);
                }
            }
            
            return json_encode([
                'status' => 'success',
                'message' => 'Reservation can be cancelled',
                'reservation_id' => $reservationId
            ]);
            
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function fetchMyReservation($userId) {
    try {
        $query = "
            SELECT 
                r.reservation_id,
                r.reservation_title,
                r.reservation_description,
                r.reservation_start_date,
                r.reservation_end_date,
                r.reschedule_start_date,
                r.reschedule_end_date,
                -- reservation_participants moved to tbl_reservation_venue
                r.reservation_user_id,
                r.reservation_created_at,
                sm.status_master_name AS reservation_status_name,
                rs_filtered.reservation_status_status_id,
                rs_filtered.reservation_updated_at,
                rs_filtered.reservation_active

            FROM tbl_reservation r

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
            ) rs_filtered ON rs_filtered.reservation_reservation_id = r.reservation_id

            LEFT JOIN tbl_status_master sm 
                ON sm.status_master_id = rs_filtered.reservation_status_status_id

            WHERE r.reservation_user_id = :userId
            ORDER BY r.reservation_id DESC
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Process each reservation to apply reschedule date logic
        foreach ($reservations as &$reservation) {
            $statusId = $reservation['reservation_status_status_id'];
            $active = $reservation['reservation_active'];
            
            // Only show reschedule dates when status is 14 and active is 1
            // Otherwise, set reschedule dates to null
            if (!($statusId == 14 && $active == 1)) {
                $reservation['reschedule_start_date'] = null;
                $reservation['reschedule_end_date'] = null;
            }
        }

        return json_encode([
            'status' => 'success',
            'data'   => $reservations
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status'  => 'error',
            'message' => 'Error fetching reservations: ' . $e->getMessage()
        ]);
    }
}

    
    public function fetchMyReservationById($reservationId){
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
        
                    -- Requester information
                    CONCAT(u_req.users_fname, ' ', u_req.users_mname, ' ', u_req.users_lname) AS requester_name,
                    
                    -- Department information
                    dep.departments_name AS department_name,
                    
                    -- Venue details (as separate records)
                    GROUP_CONCAT(DISTINCT 
                        CONCAT(
                            v.reservation_venue_venue_id, ':', 
                            venue.ven_name, ':',
                            venue.ven_occupancy, ':',
                            IFNULL(venue.ven_pic, '')
                        )
                    ) as venue_data,
                    
                    -- Vehicle details (as separate records)
                    GROUP_CONCAT(DISTINCT 
                        CONCAT(
                            ve.reservation_vehicle_vehicle_id, ':',
                            vm.vehicle_license, ':',
                            vmm.vehicle_model_name
                        )
                    ) as vehicle_data,
                    
                    -- Equipment details
                    GROUP_CONCAT(DISTINCT 
                        CONCAT(
                            e.reservation_equipment_equip_id, ':',
                            equip.equip_name, ':',
                            e.reservation_equipment_quantity
                        )
                    ) as equipment_data,
                    
                    -- Driver details
                    GROUP_CONCAT(DISTINCT 
                        CONCAT(
                            d.reservation_driver_user_id, ':',
                            CONCAT(u_driver.users_fname, ' ', u_driver.users_mname, ' ', u_driver.users_lname)
                        )
                    ) as driver_data,
                    
                    -- Passenger details
                    GROUP_CONCAT(DISTINCT 
                        CONCAT(
                            p.reservation_passenger_id, ':',
                            p.reservation_passenger_name
                        )
                    ) as passenger_data

                FROM 
                    tbl_reservation r
                LEFT JOIN 
                    tbl_reservation_status rs ON r.reservation_id = rs.reservation_reservation_id
                LEFT JOIN 
                    tbl_users u_req ON r.reservation_user_id = u_req.users_id
                LEFT JOIN 
                    tbl_departments dep ON u_req.users_department_id = dep.departments_id
                    
                -- Venue joins
                LEFT JOIN tbl_reservation_venue v ON r.reservation_id = v.reservation_reservation_id
                LEFT JOIN tbl_venue venue ON v.reservation_venue_venue_id = venue.ven_id
                
                -- Vehicle joins
                LEFT JOIN tbl_reservation_vehicle ve ON r.reservation_id = ve.reservation_reservation_id
                LEFT JOIN tbl_vehicle vm ON ve.reservation_vehicle_vehicle_id = vm.vehicle_id
                LEFT JOIN tbl_vehicle_model vmm ON vm.vehicle_model_id = vmm.vehicle_model_id
                
                -- Equipment joins
                LEFT JOIN tbl_reservation_equipment e ON r.reservation_id = e.reservation_reservation_id
                LEFT JOIN tbl_equipments equip ON e.reservation_equipment_equip_id = equip.equip_id
                
                -- Driver joins
                LEFT JOIN tbl_reservation_driver d ON r.reservation_id = d.reservation_reservation_id
                LEFT JOIN tbl_users u_driver ON d.reservation_driver_user_id = u_driver.users_id
                
                -- Passenger joins
                LEFT JOIN tbl_reservation_passenger p ON r.reservation_id = p.reservation_reservation_id
                
                WHERE 
                    r.reservation_id = :reservation_id
                GROUP BY 
                    r.reservation_id";
        
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmt->execute();
        
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($row) {
                // Initialize arrays
                $venues = [];
                $vehicles = [];
                $equipment = [];
                $drivers = [];
                $passengers = [];
                
                // Base reservation data
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
                    'requester_name' => $row['requester_name'],
                    'department_name' => $row['department_name']
                ];

                // Process venue data
                if (!empty($row['venue_data'])) {
                    foreach(explode(',', $row['venue_data']) as $venueStr) {
                        $venueParts = explode(':', $venueStr);
                        if (count($venueParts) >= 4) {
                            $venues[] = [
                                'venue_id' => $venueParts[0],
                                'venue_name' => $venueParts[1],
                                'occupancy' => $venueParts[2],
                                'picture' => $venueParts[3]
                            ];
                        }
                    }
                }

                // Process vehicle data
                if (!empty($row['vehicle_data'])) {
                    foreach(explode(',', $row['vehicle_data']) as $vehicleStr) {
                        $vehicleParts = explode(':', $vehicleStr);
                        if (count($vehicleParts) >= 3) {
                            $vehicles[] = [
                                'vehicle_id' => $vehicleParts[0],
                                'license' => $vehicleParts[1],
                                'model' => $vehicleParts[2]
                            ];
                        }
                    }
                }

                // Process equipment data
                if (!empty($row['equipment_data'])) {
                    foreach(explode(',', $row['equipment_data']) as $equipStr) {
                        $equipParts = explode(':', $equipStr);
                        if (count($equipParts) >= 3) {
                            $equipment[] = [
                                'equipment_id' => $equipParts[0],
                                'name' => $equipParts[1],
                                'quantity' => $equipParts[2]
                            ];
                        }
                    }
                }

                // Process driver data
                if (!empty($row['driver_data'])) {
                    foreach(explode(',', $row['driver_data']) as $driverStr) {
                        $driverParts = explode(':', $driverStr);
                        if (count($driverParts) >= 2) {
                            $drivers[] = [
                                'driver_id' => $driverParts[0],
                                'name' => $driverParts[1]
                            ];
                        }
                    }
                }

                // Process passenger data
                if (!empty($row['passenger_data'])) {
                    foreach(explode(',', $row['passenger_data']) as $passengerStr) {
                        $passengerParts = explode(':', $passengerStr);
                        if (count($passengerParts) >= 2) {
                            $passengers[] = [
                                'passenger_id' => $passengerParts[0],
                                'name' => $passengerParts[1]
                            ];
                        }
                    }
                }

                // Add all arrays to response
                $response['venues'] = $venues;
                $response['vehicles'] = $vehicles;
                $response['equipment'] = $equipment;
                $response['drivers'] = $drivers;
                $response['passengers'] = $passengers;
        
                return json_encode(['status' => 'success', 'data' => $response]);
            } else {
                return json_encode(['status' => 'error', 'message' => 'Reservation not found']);
            }
        
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function fetchStatusById($reservationId) {
        try {
            $sql = "
                SELECT 
                    rs.reservation_status_id,
                    rs.reservation_status_status_id AS status_id,
                    sm.status_master_name      AS status_name,
                    rs.reservation_active      AS active,
                    rs.reservation_updated_at  AS updated_at,
                    rs.reservation_users_id    AS updated_by_user_id,
                    CONCAT_WS(' ',
                        u.users_fname,
                        u.users_mname,
                        u.users_lname
                    ) AS updated_by_full_name
                FROM tbl_reservation_status rs
                INNER JOIN tbl_status_master sm 
                    ON rs.reservation_status_status_id = sm.status_master_id
                LEFT JOIN tbl_users u
                    ON rs.reservation_users_id = u.users_id
                WHERE rs.reservation_reservation_id = :reservation_id
                ORDER BY rs.reservation_status_id DESC
            ";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmt->execute();
    
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (count($rows) > 0) {
                return json_encode([
                    'status' => 'success',
                    'data'   => array_map(function($row) {
                        return [
                            'reservation_status_id'   => $row['reservation_status_id'],
                            'status_id'               => $row['status_id'],
                            'status_name'             => $row['status_name'],
                            'active'                  => $row['active'],
                            'updated_at'              => $row['updated_at'],
                            'updated_by_user_id'      => $row['updated_by_user_id'],
                            'updated_by_full_name'    => $row['updated_by_full_name'],
                        ];
                    }, $rows)
                ]);
            } else {
                return json_encode([
                    'status'  => 'error',
                    'message' => 'No status history found for that reservation'
                ]);
            }
        } catch (PDOException $e) {
            return json_encode([
                'status'  => 'error',
                'message' => 'Error fetching status history: ' . $e->getMessage()
            ]);
        }
    }

    public function displayedMaintenanceResources(int $reservationId) {
    try {
        $records = [];

        //
        // 1) Equipment
        //
        $sql = "
            SELECT 
                rce.id               AS record_id,
                'equipment'          AS resource_type,
                e.equip_name         AS resource_name,
                re.reservation_equipment_quantity AS quantity,
                re.reservation_equipment_equip_id  AS resource_id,
                CASE 
                    WHEN c.condition_name = 'Other' THEN rce.other_reason 
                    ELSE c.condition_name 
                END                   AS condition_name
            FROM tbl_reservation_condition_equipment rce
            JOIN tbl_reservation_equipment re 
              ON rce.reservation_equipment_id = re.reservation_equipment_id
            JOIN tbl_reservation r
              ON re.reservation_reservation_id = r.reservation_id
            JOIN tbl_equipments e 
              ON re.reservation_equipment_equip_id = e.equip_id
            JOIN tbl_condition c 
              ON rce.condition_id = c.id
            WHERE r.reservation_id = :reservation_id
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['reservation_id' => $reservationId]);
        $records = array_merge($records, $stmt->fetchAll(PDO::FETCH_ASSOC));

        //
        // 2) Venues
        //
        $sql = "
            SELECT 
                rcv.id               AS record_id,
                'venue'              AS resource_type,
                v.ven_name           AS resource_name,
                NULL                 AS quantity,
                rv.reservation_venue_venue_id  AS resource_id,
                CASE 
                    WHEN c.condition_name = 'Other' THEN rcv.other_reason 
                    ELSE c.condition_name 
                END                   AS condition_name
            FROM tbl_reservation_condition_venue rcv
            JOIN tbl_reservation_venue rv 
              ON rcv.reservation_venue_id = rv.reservation_venue_id
            JOIN tbl_reservation r
              ON rv.reservation_reservation_id = r.reservation_id
            JOIN tbl_venue v 
              ON rv.reservation_venue_venue_id = v.ven_id
            JOIN tbl_condition c 
              ON rcv.condition_id = c.id
            WHERE r.reservation_id = :reservation_id
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['reservation_id' => $reservationId]);
        $records = array_merge($records, $stmt->fetchAll(PDO::FETCH_ASSOC));

        //
        // 3) Vehicles
        //
        $sql = "
            SELECT
                rcvh.id              AS record_id,
                'vehicle'            AS resource_type,
                CONCAT(vm.vehicle_model_name, ' (', vh.vehicle_license, ')') AS resource_name,
                NULL                 AS quantity,
                rv.reservation_vehicle_vehicle_id AS resource_id,
                CASE 
                    WHEN c.condition_name = 'Other' THEN rcvh.other_reason 
                    ELSE c.condition_name 
                END                   AS condition_name
            FROM tbl_reservation_condition_vehicle rcvh
            JOIN tbl_reservation_vehicle rv 
              ON rcvh.reservation_vehicle_id = rv.reservation_vehicle_id
            JOIN tbl_reservation r
              ON rv.reservation_reservation_id = r.reservation_id
            JOIN tbl_vehicle vh 
              ON rv.reservation_vehicle_vehicle_id = vh.vehicle_id
            JOIN tbl_vehicle_model vm 
              ON vh.vehicle_model_id = vm.vehicle_model_id
            JOIN tbl_condition c 
              ON rcvh.condition_id = c.id
            WHERE r.reservation_id = :reservation_id
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['reservation_id' => $reservationId]);
        $records = array_merge($records, $stmt->fetchAll(PDO::FETCH_ASSOC));

        return json_encode([
            'status' => 'success',
            'data'   => $records
        ], JSON_THROW_ON_ERROR);

    } catch (PDOException $e) {
        return json_encode([
            'status'  => 'error',
            'message' => $e->getMessage()
        ], JSON_THROW_ON_ERROR);
    }
}


    public function fetchMyActiveReservation($userId) {
        try {
            $query = "
                SELECT 
                    r.reservation_id,
                    r.reservation_title,
                    r.reservation_description,
                    r.reservation_start_date,
                    r.reservation_end_date,
                    -- reservation_participants moved to tbl_reservation_venue
                    r.reservation_user_id,
                    r.reservation_created_at,
                    rs.reservation_active,
                    sm.status_master_name AS reservation_status
                FROM tbl_reservation AS r
                LEFT JOIN tbl_reservation_status AS rs
                  ON rs.reservation_status_id = (
                        SELECT reservation_status_id
                        FROM tbl_reservation_status
                        WHERE reservation_reservation_id = r.reservation_id
                          AND reservation_status_status_id = 6
                          AND reservation_active = 1
                        ORDER BY 
                          reservation_updated_at DESC,
                          reservation_status_id DESC
                        LIMIT 1
                  )
                LEFT JOIN tbl_status_master AS sm
                  ON rs.reservation_status_status_id = sm.status_master_id
                WHERE r.reservation_user_id = :userId
                  AND rs.reservation_status_status_id = 6
                  AND rs.reservation_active = 1
                ORDER BY r.reservation_start_date DESC
            ";
    
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            return json_encode([
                'status' => 'success',
                'data'   => $reservations
            ]);
        } catch (PDOException $e) {
            return json_encode([
                'status'  => 'error',
                'message' => 'Error fetching active reservations: ' . $e->getMessage()
            ]);
        }
    }

    public function fetchNotification($userId) {
        try {
            $query = "
                SELECT 
                    notification_reservation_id,
                    notification_message,
                    notification_reservation_reservation_id,
                    notification_user_id,
                    notification_created_at,
                    is_read
                FROM tbl_notification_reservation
                WHERE notification_user_id = :userId
                ORDER BY notification_created_at DESC
            ";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return json_encode([
                'status' => 'success',
                'data'   => $notifications
            ]);
        } catch (PDOException $e) {
            return json_encode([
                'status'  => 'error',
                'message' => 'Error fetching notifications: ' . $e->getMessage()
            ]);
        }
    }

    public function updateReadNotification($notificationIds, $actingUserId = null) {
        try {
            if (!is_array($notificationIds)) {
                $notificationIds = [$notificationIds]; // Convert single ID to array for consistency
            }

            $placeholders = str_repeat('?,', count($notificationIds) - 1) . '?';
            $query = "
                UPDATE tbl_notification_reservation
                SET is_read = 1
                WHERE notification_reservation_id IN ($placeholders)
            ";

            $stmt = $this->conn->prepare($query);
            $stmt->execute($notificationIds);

            if ($stmt->rowCount() > 0) {
                $updatedCount = $stmt->rowCount();

                // Audit log (non-blocking)
                try {
                    // Try to determine the acting user from the targeted notifications
                    $uid = null;
                    $checkQuery = "SELECT DISTINCT notification_user_id FROM tbl_notification_reservation WHERE notification_reservation_id IN ($placeholders)";
                    $checkStmt = $this->conn->prepare($checkQuery);
                    $checkStmt->execute($notificationIds);
                    $uids = $checkStmt->fetchAll(PDO::FETCH_COLUMN, 0);
                    if (is_array($uids) && count($uids) === 1) {
                        $uid = (int)$uids[0];
                    }

                    // Prefer the acting user id when available; fallback to the notification owner
                    $createdBy = $actingUserId !== null ? (int)$actingUserId : $uid;

                    $desc = 'Marked notifications as read (count: ' . (int)$updatedCount . ')';
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $audit->execute([
                        ':description' => $desc,
                        ':action' => 'READ NOTIFICATION',
                        ':created_by' => $createdBy
                    ]);
                } catch (Throwable $te) { /* ignore audit errors */ }

                return json_encode([
                    'status' => 'success',
                    'message' => 'Notifications marked as read',
                    'updated_count' => $updatedCount
                ]);
            } else {
                return json_encode([
                    'status' => 'error',
                    'message' => 'No notifications were updated'
                ]);
            }
        } catch (PDOException $e) {
            return json_encode([
                'status'  => 'error',
                'message' => 'Error updating notifications: ' . $e->getMessage()
            ]);
        }
    }
    
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
    
    public function updateReschedule(int $reservationId, int $active, ?int $actingUserId = null) {
        try {
            if (!in_array($active, [1, -1], true)) {
                return json_encode(['status' => 'error', 'message' => 'Invalid active value. Use 1 for confirm or -1 for decline.']);
            }

            $this->conn->beginTransaction();

            // 1) Update the latest pending status (status 10 with active = 0)
            $updSql = "
                UPDATE tbl_reservation_status
                SET reservation_active = :active,
                    reservation_updated_at = NOW(),
                    reservation_users_id = :user_id
                WHERE reservation_reservation_id = :rid
                  AND reservation_status_status_id = 10
                  AND reservation_active = 0
                ORDER BY reservation_status_id DESC
                LIMIT 1
            ";
            $upd = $this->conn->prepare($updSql);
            $upd->bindValue(':active', $active, PDO::PARAM_INT);
            $upd->bindValue(':user_id', $actingUserId !== null ? (int)$actingUserId : null, $actingUserId !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
            $upd->bindValue(':rid', (int)$reservationId, PDO::PARAM_INT);
            $upd->execute();

            // 2) Handle status insertion based on active value
            if ($active == 1) {
                // For confirmed reschedule (active = 1), check if status 1 or 8 is active before inserting status 6
                $checkSql = "
                    SELECT COUNT(*) as count 
                    FROM tbl_reservation_status 
                    WHERE reservation_reservation_id = :rid 
                    AND reservation_status_status_id IN (1, 8)
                    AND reservation_active = 1
                ";
                $check = $this->conn->prepare($checkSql);
                $check->bindValue(':rid', (int)$reservationId, PDO::PARAM_INT);
                $check->execute();
                $result = $check->fetch(PDO::FETCH_ASSOC);
            
                // Only insert status 6 if status 1 or 8 is active
                if ($result['count'] > 0) {
                    $checkExistingSql = "
                        SELECT COUNT(*) as count 
                        FROM tbl_reservation_status 
                        WHERE reservation_reservation_id = :rid 
                        AND reservation_status_status_id = 6
                        AND reservation_active = 1
                    ";
                    $checkExisting = $this->conn->prepare($checkExistingSql);
                    $checkExisting->bindValue(':rid', (int)$reservationId, PDO::PARAM_INT);
                    $checkExisting->execute();
                    $existingResult = $checkExisting->fetch(PDO::FETCH_ASSOC);
            
                    // Insert status 6 if it doesn't already exist
                    if ($existingResult['count'] == 0) {
                        $insSql = "
                            INSERT INTO tbl_reservation_status
                                (reservation_status_status_id, reservation_reservation_id, reservation_active, reservation_updated_at, reservation_users_id)
                            VALUES (6, :rid, 1, NOW(), :user_id)
                        ";
                        $ins = $this->conn->prepare($insSql);
                        $ins->bindValue(':rid', (int)$reservationId, PDO::PARAM_INT);
                        $ins->bindValue(':user_id', $actingUserId !== null ? (int)$actingUserId : null, $actingUserId !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
                        $ins->execute();
                    }
                }
            
                // ✅ Always insert status 14 after confirming reschedule
                $ins14Sql = "
                    INSERT INTO tbl_reservation_status
                        (reservation_status_status_id, reservation_reservation_id, reservation_active, reservation_updated_at, reservation_users_id)
                    VALUES (14, :rid, 1, NOW(), :user_id)
                ";
                $ins14 = $this->conn->prepare($ins14Sql);
                $ins14->bindValue(':rid', (int)$reservationId, PDO::PARAM_INT);
                $ins14->bindValue(':user_id', $actingUserId !== null ? (int)$actingUserId : null, $actingUserId !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
                $ins14->execute();
            }
             else {
                // For declined reschedule (active = -1), insert status 5
                $insSql = "
                    INSERT INTO tbl_reservation_status
                        (reservation_status_status_id, reservation_reservation_id, reservation_active, reservation_updated_at, reservation_users_id)
                    VALUES (5, :rid, -1, NOW(), :user_id)
                ";
                $ins = $this->conn->prepare($insSql);
                $ins->bindValue(':rid', (int)$reservationId, PDO::PARAM_INT);
                $ins->bindValue(':user_id', $actingUserId !== null ? (int)$actingUserId : null, $actingUserId !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
                $ins->execute();
            }

            $this->conn->commit();

            return json_encode(['status' => 'success', 'message' => 'Reschedule status updated']);
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return json_encode(['status' => 'error', 'message' => 'Error updating reschedule: ' . $e->getMessage()]);
        }
    }

    public function updateVenueReschedule($reservation_venue_id, $reservation_change_venue_id) {
        try {
            if ($reservation_venue_id === null) {
                return json_encode(['status' => 'error', 'message' => 'Missing required reservation_venue_id parameter']);
            }
    
            $sql = "UPDATE tbl_reservation_venue
                    SET reservation_change_venue_id = :reservation_change_venue_id
                    WHERE reservation_venue_id = :reservation_venue_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':reservation_venue_id', (int)$reservation_venue_id, PDO::PARAM_INT);
            
            // Handle null case properly
            if ($reservation_change_venue_id === null) {
                $stmt->bindValue(':reservation_change_venue_id', null, PDO::PARAM_NULL);
            } else {
                $stmt->bindValue(':reservation_change_venue_id', (int)$reservation_change_venue_id, PDO::PARAM_INT);
            }
    
            $ok = $stmt->execute();
            if ($ok) {
                return json_encode(['status' => 'success', 'message' => 'Venue reschedule updated successfully']);
            }
            return json_encode(['status' => 'error', 'message' => 'Failed to update venue reschedule']);
        } catch (PDOException $e) {
            error_log('Database error in updateVenueReschedule: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    public function updateVehicleReschedule($reservation_vehicle_id, $reservation_change_vehicle_id) {
        try {
            if ($reservation_vehicle_id === null) {
                return json_encode(['status' => 'error', 'message' => 'Missing required reservation_vehicle_id parameter']);
            }
    
            $sql = "UPDATE tbl_reservation_vehicle
                    SET reservation_change_vehicle_id = :reservation_change_vehicle_id
                    WHERE reservation_vehicle_id = :reservation_vehicle_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':reservation_vehicle_id', (int)$reservation_vehicle_id, PDO::PARAM_INT);
            
            // Handle null case properly
            if ($reservation_change_vehicle_id === null) {
                $stmt->bindValue(':reservation_change_vehicle_id', null, PDO::PARAM_NULL);
            } else {
                $stmt->bindValue(':reservation_change_vehicle_id', (int)$reservation_change_vehicle_id, PDO::PARAM_INT);
            }
    
            $ok = $stmt->execute();
            if ($ok) {
                return json_encode(['status' => 'success', 'message' => 'Vehicle reschedule updated successfully']);
            }
            return json_encode(['status' => 'error', 'message' => 'Failed to update vehicle reschedule']);
        } catch (PDOException $e) {
            error_log('Database error in updateVehicleReschedule: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function updateReservationReschedule($reservation_id, $reschedule_start_date, $reschedule_end_date, $user_admin_id = null) {
        try {
            if ($reservation_id === null || $reschedule_start_date === null || $reschedule_end_date === null) {
                return json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
            }
    
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
    
            // 2) Update status ID 8 to active (reservation_active = 1) for this reservation
            $updateStatusSql = "UPDATE tbl_reservation_status 
                               SET reservation_active = 1, 
                                   reservation_updated_at = NOW(),
                                   reservation_users_id = :user_admin_id
                               WHERE reservation_reservation_id = :reservation_id 
                               AND reservation_status_status_id = 10";
            $updateStmt = $this->conn->prepare($updateStatusSql);
            $updateStmt->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
            if ($user_admin_id === null || $user_admin_id === '') {
                $updateStmt->bindValue(':user_admin_id', null, PDO::PARAM_NULL);
            } else {
                $updateStmt->bindValue(':user_admin_id', (int)$user_admin_id, PDO::PARAM_INT);
            }
            $updateStmt->execute();
    
            // 3) Insert a new status row with reservation_active = 0 and status id 11
            $ins = $this->conn->prepare("INSERT INTO tbl_reservation_status
                (reservation_status_status_id, reservation_reservation_id, reservation_active, reservation_updated_at, reservation_users_id)
                VALUES (:status_id, :reservation_id, 0, NOW(), :user_admin_id)");
            $ins->bindValue(':status_id', 11, PDO::PARAM_INT);
            $ins->bindValue(':reservation_id', (int)$reservation_id, PDO::PARAM_INT);
            if ($user_admin_id === null || $user_admin_id === '') {
                $ins->bindValue(':user_admin_id', null, PDO::PARAM_NULL);
            } else {
                $ins->bindValue(':user_admin_id', (int)$user_admin_id, PDO::PARAM_INT);
            }
            $ins->execute();
    
            $this->conn->commit();
    
            return json_encode(['status' => 'success', 'message' => 'Reservation reschedule updated successfully']);
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log('Database error in updateReservationReschedule: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    // Auto-cancel reservations with pending reschedule if requestor doesn't accept by original start time
    public function autoCancelExpiredReschedules() {
        try {
            // Set timezone to Asia/Manila
            date_default_timezone_set('Asia/Manila');
            $currentDateTime = date('Y-m-d H:i:s');
            
            $this->conn->beginTransaction();
            
            // Find reservations with status 10 (reschedule) with active=0 where original start time has passed
            $sql = "SELECT DISTINCT r.reservation_id, r.reservation_title, r.reservation_start_date, 
                           r.reschedule_start_date, r.reschedule_end_date, r.reservation_user_id,
                           CONCAT(u.users_fname, ' ', COALESCE(u.users_mname, ''), ' ', u.users_lname) AS full_name, 
                           u.users_email
                    FROM tbl_reservation r
                    INNER JOIN tbl_reservation_status rs ON rs.reservation_reservation_id = r.reservation_id
                    INNER JOIN tbl_users u ON u.users_id = r.reservation_user_id
                    WHERE rs.reservation_status_status_id = 10 
                    AND rs.reservation_active = 0
                    AND r.reservation_start_date <= :current_datetime
                    AND r.reservation_start_date IS NOT NULL";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':current_datetime', $currentDateTime, PDO::PARAM_STR);
            $stmt->execute();
            $expiredReservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $cancelledCount = 0;
            $cancelledReservations = [];
            
            foreach ($expiredReservations as $reservation) {
                // Insert cancelled status (status_id = 2)
                $insertCancelSql = "INSERT INTO tbl_reservation_status 
                                   (reservation_status_status_id, reservation_reservation_id, reservation_active, 
                                    reservation_updated_at, reservation_users_id) 
                                   VALUES (5, :reservation_id, 1, NOW(), :user_id)";
                $insertStmt = $this->conn->prepare($insertCancelSql);
                $insertStmt->bindParam(':reservation_id', $reservation['reservation_id'], PDO::PARAM_INT);
                $insertStmt->bindParam(':user_id', $reservation['reservation_user_id'], PDO::PARAM_INT);
                
                if ($insertStmt->execute()) {
                    // Deactivate the pending reschedule status (status 10)
                    $deactivateSql = "UPDATE tbl_reservation_status 
                                     SET reservation_active = 0 
                                     WHERE reservation_reservation_id = :reservation_id 
                                     AND reservation_status_status_id = 10";
                    $deactivateStmt = $this->conn->prepare($deactivateSql);
                    $deactivateStmt->bindParam(':reservation_id', $reservation['reservation_id'], PDO::PARAM_INT);
                    $deactivateStmt->execute();
                    
                    // Insert notification to user about the cancellation
                    $notificationMessage = "Your reservation '{$reservation['reservation_title']}' has been automatically cancelled because you did not accept the proposed reschedule by the original event start time ({$reservation['reservation_start_date']}).";
                    $insertNotificationSql = "INSERT INTO tbl_notification_reservation 
                                            (notification_message, notification_reservation_reservation_id, notification_user_id, notification_created_at, is_read) 
                                            VALUES (:message, :reservation_id, :user_id, NOW(), 0)";
                    $notificationStmt = $this->conn->prepare($insertNotificationSql);
                    $notificationStmt->bindParam(':message', $notificationMessage, PDO::PARAM_STR);
                    $notificationStmt->bindParam(':reservation_id', $reservation['reservation_id'], PDO::PARAM_INT);
                    $notificationStmt->bindParam(':user_id', $reservation['reservation_user_id'], PDO::PARAM_INT);
                    $notificationStmt->execute();
                    
                    // Send push notification to user
                    $this->sendPushNotificationToUser(
                        $reservation['reservation_user_id'],
                        'Reservation Auto-Cancelled',
                        "Your reservation '{$reservation['reservation_title']}' has been automatically cancelled due to expired reschedule.",
                        [
                            'reservation_id' => $reservation['reservation_id'],
                            'type' => 'auto_cancel',
                            'original_start' => $reservation['reservation_start_date']
                        ]
                    );
                    
                    $cancelledCount++;
                    $cancelledReservations[] = [
                        'reservation_id' => $reservation['reservation_id'],
                        'title' => $reservation['reservation_title'],
                        'original_start' => $reservation['reservation_start_date'],
                        'username' => $reservation['full_name'],
                        'email' => $reservation['users_email']
                    ];
                    
                    // Log the auto-cancellation
                }
            }
            
            $this->conn->commit();
            
            return json_encode([
                'status' => 'success',
                'message' => "Auto-cancelled {$cancelledCount} expired reschedule reservations",
                'cancelled_count' => $cancelledCount,
                'cancelled_reservations' => $cancelledReservations,
                'check_time' => $currentDateTime
            ]);
            
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log('Database error in autoCancelExpiredReschedules: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
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
                error_log("[FacultyStaff.autoCancelExpiredReschedules] Push notification failed for user $userId: " . ($error ?: "HTTP $httpCode"));
                return false;
            }
            
            $response = json_decode($result, true);
            if ($response && isset($response['status']) && $response['status'] === 'success') {
                return true;
            }
            error_log("[FacultyStaff.autoCancelExpiredReschedules] Push notification failed for user $userId: " . ($response['message'] ?? 'Unknown error'));
            return false;
        } catch (Throwable $e) {
            error_log("[FacultyStaff.autoCancelExpiredReschedules] Exception sending push: " . $e->getMessage());
            return false;
        }
    }

    // Insert Reservation
    public function insertReservation($formType, $formId, $resourceId) {
        try {
            $sql = "INSERT INTO tbl_reservation 
                    (" . ($formType === 'venue' ? 'reservation_venue_id' : 'reservation_vehicle_id') . ",
                    reservation_date) 
                    VALUES (:resource_id, NOW())";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':resource_id', $resourceId);
            
            if ($stmt->execute()) {
                $reservationId = $this->conn->lastInsertId();
                // Insert initial status
                $this->insertReservationStatus($reservationId);
                return ['status' => 'success', 'reservation_id' => $reservationId];
            } else {
                return ['status' => 'error', 'message' => 'Failed to create reservation.'];
            }
        } catch (PDOException $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    private function checkEquipmentAvailability($equipmentId, $requestedQuantity) {
        try {
            $sql = "SELECT equipment_quantity FROM tbl_equipment WHERE equipment_id = :equipment_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':equipment_id', $equipmentId);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result && $result['equipment_quantity'] >= $requestedQuantity) {
                return true;
            }
            return false;
        } catch (PDOException $e) {
            return false;
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
            error_log("Holiday check error: " . $e->getMessage());
            return [
                'has_holiday' => false,
                'holiday_count' => 0,
                'holidays' => []
            ];
        }
    }

    public function hasConflictRequest($resourceType, $resourceId, $startDate, $endDate, $requestedQuantity = 0) {
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
                            dept.departments_name AS department_name,
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
                            LEFT JOIN tbl_departments dept ON u.users_department_id = dept.departments_id
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
                            WHERE ven.is_active = 1
                              AND ls.reservation_status_status_id IS NOT NULL
                              AND (
                                -- Status 6 must be active
                                (ls.reservation_status_status_id = 6 AND ls.reservation_active = 1)
                                OR
                                -- Other valid statuses can be active or inactive
                                (ls.reservation_status_status_id IN (1, 8, 9, 10, 11, 14))
                              )
                              AND (
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
                            ORDER BY effective_start_date ASC";
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
                            dept.departments_name AS department_name,
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
                            LEFT JOIN tbl_departments dept ON u.users_department_id = dept.departments_id
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
                            WHERE veh.is_active = 1
                              AND ls.reservation_status_status_id IS NOT NULL
                              AND (
                                -- Status 6 must be active
                                (ls.reservation_status_status_id = 6 AND ls.reservation_active = 1)
                                OR
                                -- Other valid statuses can be active or inactive
                                (ls.reservation_status_status_id IN (1, 8, 9, 10, 11, 14))
                              )
                              AND (
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
                            ORDER BY effective_start_date ASC";
                    break;
                    // driver conflict check removed

                case 'equipment':
                    // First get capacity info with reschedule date consideration
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
                                  WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                                  GROUP BY reservation_reservation_id
                              ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                              WHERE e.reservation_equipment_equip_id = :resource_id
                         
                                AND r.reservation_id NOT IN (
                                  SELECT DISTINCT reservation_reservation_id 
                                  FROM tbl_reservation_status 
                                  WHERE reservation_status_status_id IN (2, 5, 4)
                                )
                                AND (
                                  -- Use reschedule dates if status is 10, 11, or 14, or if status 6 with active reschedule
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
                    
                    // Get detailed conflict reservations with reschedule date consideration
                    $detailSql = "SELECT DISTINCT
                            r.reservation_id,
                            r.reservation_title,
                            r.reservation_start_date,
                            r.reservation_end_date,
                            r.reschedule_start_date,
                            r.reschedule_end_date,
                            CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS requester_name,
                            u.users_id AS requester_id,
                            dept.departments_name AS department_name,
                            e.reservation_equipment_quantity,
                            eq.equip_name AS equipment_name,
                            s.status_master_name AS status_name,
                            ls.reservation_status_status_id,
                            ls.reservation_active,
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
                            FROM tbl_reservation_equipment e
                            INNER JOIN tbl_reservation r ON e.reservation_reservation_id = r.reservation_id
                            INNER JOIN tbl_users u ON r.reservation_user_id = u.users_id
                            LEFT JOIN tbl_departments dept ON u.users_department_id = dept.departments_id
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
                            LEFT JOIN (
                                SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                                FROM tbl_reservation_status
                                WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                                GROUP BY reservation_reservation_id
                            ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
                            WHERE e.reservation_equipment_equip_id = :resource_id
                     
                              AND r.reservation_id NOT IN (
                                SELECT DISTINCT reservation_reservation_id 
                                FROM tbl_reservation_status 
                                WHERE reservation_status_status_id IN (2, 5, 4)
                              )
                              AND (
                                -- Use reschedule dates if status is 10, 11, or 14, or if status 6 with active reschedule
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
                            ORDER BY effective_start_date ASC";
                    
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
    public function insertEquipment($reservationId, $equipments) {
        try {
            $sql = "INSERT INTO tbl_reservation_equipment 
                    (reservation_equipment_equip_id, reservation_reservation_id, reservation_equipment_quantity) 
                    VALUES (:equipment_id, :reservation_id, :quantity)";
            $stmt = $this->conn->prepare($sql);
            $errors = [];

            foreach ($equipments as $equip) {
                $stmt->bindParam(':equipment_id', $equip['equipment_id']);
                $stmt->bindParam(':reservation_id', $reservationId);
                $stmt->bindParam(':quantity', $equip['quantity']);

                if (!$stmt->execute()) {
                    $errors[] = 'Failed to insert equipment: ' . $equip['equipment_id'];
                }
            }

            if (!empty($errors)) {
                return ['status' => 'error', 'message' => implode('; ', $errors)];
            }

            return ['status' => 'success', 'message' => 'All equipment inserted successfully.'];
        } catch (PDOException $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    public function insertVehicles($reservationId, $vehicleIds) {
        try {
            $sql = "INSERT INTO tbl_reservation_vehicle 
                    (reservation_vehicle_vehicle_id, reservation_reservation_id) 
                    VALUES (:vehicle_id, :reservation_id)";

            $stmt = $this->conn->prepare($sql);
            $errors = [];

            foreach ($vehicleIds as $vehicleId) {
                $stmt->bindParam(':vehicle_id', $vehicleId);
                $stmt->bindParam(':reservation_id', $reservationId);

                if (!$stmt->execute()) {
                    $errors[] = 'Failed to insert vehicle: ' . $vehicleId;
                }
            }

            if (!empty($errors)) {
                return ['status' => 'error', 'message' => implode('; ', $errors)];
            }

            return ['status' => 'success', 'message' => 'All vehicles inserted successfully.'];
        } catch (PDOException $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    public function insertVenue($reservationId, $venueData) {
        try {
            $sql = "INSERT INTO tbl_reservation_venue 
                    (reservation_venue_venue_id, reservation_reservation_id, reservation_participants) 
                    VALUES (:venue_id, :reservation_id, :participants)";

            $stmt = $this->conn->prepare($sql);
            $errors = [];

            // Handle both old format (array of IDs) and new format (array of objects with venue_id and participants)
            foreach ($venueData as $venue) {
                if (is_array($venue) && isset($venue['venue_id'])) {
                    // New format: {venue_id: X, participants: Y}
                    $venueId = $venue['venue_id'];
                    $participants = isset($venue['participants']) ? intval($venue['participants']) : 0;
                } else {
                    // Old format: just venue ID (for backward compatibility)
                    $venueId = $venue;
                    $participants = 0;
                }

                $stmt->bindParam(':venue_id', $venueId);
                $stmt->bindParam(':reservation_id', $reservationId);
                $stmt->bindParam(':participants', $participants);

                if (!$stmt->execute()) {
                    $errors[] = 'Failed to insert venue: ' . $venueId;
                }
            }

            if (!empty($errors)) {
                return ['status' => 'error', 'message' => implode('; ', $errors)];
            }

            return ['status' => 'success', 'message' => 'All venues inserted successfully.'];
        } catch (PDOException $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
  
    public function insertDriver($drivers = null) {
        try {
            $sql = "INSERT INTO tbl_reservation_driver (reservation_driver_user_id, driver_name, reservation_vehicle_id) VALUES (:driver_id, :driver_name, :reservation_vehicle_id)";
            $stmt = $this->conn->prepare($sql);
            $errors = [];

            // Normalize input to array of drivers
            if (is_null($drivers)) {
                $drivers = [];
            } elseif (is_string($drivers)) {
                $drivers = [['name' => $drivers]];
            } elseif (is_array($drivers) && isset($drivers['name'])) {
                // Single driver object with 'name'
                $drivers = [$drivers];
            } elseif (!is_array($drivers) || (is_array($drivers) && array_keys($drivers) === range(0, count($drivers) - 1))) {
                // Already an array of drivers or single value
                $drivers = is_array($drivers) ? $drivers : [$drivers];
            } else {
                $drivers = [$drivers];
            }

            foreach ($drivers as $driver) {
                $userId = null;
                $name = null;
                $vehicleId = null;
                if (is_array($driver)) {
                    $userId = isset($driver['user_id']) ? $driver['user_id'] : null;
                    $name = array_key_exists('name', $driver) ? $driver['name'] : null;
                    if (isset($driver['reservation_vehicle_id'])) {
                        $vehicleId = $driver['reservation_vehicle_id'];
                    } elseif (isset($driver['vehicle_id'])) {
                        $vehicleId = $driver['vehicle_id'];
                    } else {
                        $vehicleId = null;
                    }
                } elseif (is_numeric($driver)) {
                    $userId = $driver;
                } elseif (is_string($driver)) {
                    $name = $driver;
                }
                $stmt->bindValue(':driver_id', $userId, is_null($userId) ? \PDO::PARAM_NULL : \PDO::PARAM_INT);
                $stmt->bindValue(':driver_name', $name, is_null($name) ? \PDO::PARAM_NULL : \PDO::PARAM_STR);
                $stmt->bindValue(':reservation_vehicle_id', $vehicleId, is_null($vehicleId) ? \PDO::PARAM_NULL : \PDO::PARAM_INT);
                if (!$stmt->execute()) {
                    $errors[] = 'Failed to insert driver: ' . (is_null($userId) ? $name : $userId);
                }
            }
            if (!empty($errors)) {
                return ['status' => 'error', 'message' => implode('; ', $errors)];
            }
            return ['status' => 'success', 'message' => 'All drivers inserted successfully.'];
        } catch (PDOException $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    // deprecated: insertVehicleForm removed (legacy form tables no longer used)
    // deprecated: insertVenueForm removed (legacy form tables no longer used)
    
    // deprecated: getAvailableEquipmentQuantity removed (uses legacy form tables)
    
    

    // Add this new method to check for active transactions
    public function hasActiveTransaction() {
        try {
            return $this->conn->inTransaction();
        } catch (PDOException $e) {
            return false;
        }
    }

    // Named lock helpers to prevent race conditions on resource reservation
    private function acquireLock($key, $timeout = 1.0) {
        try {
            $stmt = $this->conn->prepare("SELECT GET_LOCK(:k, :t) AS got");
            $stmt->execute([':k' => $key, ':t' => $timeout]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return isset($row['got']) && (int)$row['got'] === 1;
        } catch (PDOException $e) {
            error_log('acquireLock error: ' . $e->getMessage());
            return false;
        }
    }

    private function releaseLock($key) {
        try {
            $stmt = $this->conn->prepare("SELECT RELEASE_LOCK(:key)");
            $stmt->bindParam(':key', $key);
            $stmt->execute();
        } catch (PDOException $e) {
            error_log('Failed to release lock: ' . $e->getMessage());
        }
    }

    // Determine if the user's role should bypass conflict checks
    private function shouldBypassConflict($userId) {
        try {
            $sql = "SELECT 
                        COALESCE(d.departments_name, '') AS dept_name,
                        COALESCE(ul.user_level_name, '') AS level_name
                    FROM tbl_users u
                    LEFT JOIN tbl_departments d ON d.departments_id = u.users_department_id
                    LEFT JOIN tbl_user_level ul ON ul.user_level_id = u.users_user_level_id
                    WHERE u.users_id = :user_id
                    LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            if (!$stmt->execute()) {
                return false;
            }
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                return false;
            }
            $dept = strtolower(trim($row['dept_name'] ?? ''));
            $level = strtolower(trim($row['level_name'] ?? ''));
            $bypass = ($dept === '#' && $level === '#');
            $bypass1 = ($dept === '#' && $level === '#');
                    
            return $bypass || $bypass1;
        } catch (PDOException $e) {
            error_log('shouldBypassConflict error: ' . $e->getMessage());
            return false;
        }
    }

    private function insertReservationStatus($reservationId) {
        try {
            $sql = "INSERT INTO tbl_reservation_status 
                    (reservation_status_reservation_id, 
                    reservation_status_status_reservation_id,
                    reservation_status_updated_at) 
                    VALUES (:reservation_id, 1, NOW())";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':reservation_id', $reservationId);
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }
    public function insertPassengers($reservationId, $passengers) {
        try {
            if (empty($passengers)) {
                return ['status' => 'warning', 'message' => 'No passengers provided.'];
            }

            $sql = "INSERT INTO tbl_reservation_passenger 
                    (reservation_passenger_name, reservation_reservation_id) 
                    VALUES (:passenger_name, :reservation_id)";

            $stmt = $this->conn->prepare($sql);
            $errors = [];

            foreach ($passengers as $passenger) {
                // Normalize passenger value to string name
                if (is_array($passenger)) {
                    $name = isset($passenger['name']) ? (string)$passenger['name'] : '';
                } else {
                    $name = (string)$passenger;
                }
                $stmt->bindParam(':passenger_name', $name);
                $stmt->bindParam(':reservation_id', $reservationId);

                if (!$stmt->execute()) {
                    $errors[] = 'Failed to insert passenger: ' . $name;
                }
            }

            if (!empty($errors)) {
                return ['status' => 'error', 'message' => implode('; ', $errors)];
            }

            return ['status' => 'success', 'message' => 'All passengers inserted successfully.'];
        } catch (PDOException $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    public function createReservation($data, $type) {
        $requestId = uniqid('req_', true);
        
        // Normalize inputs to arrays expected by logic
        if ($type === 'venue') {
            if (!isset($data['venues']) && isset($data['venue'])) {
                $data['venues'] = [(int)$data['venue']];
            }
        } elseif ($type === 'vehicle') {
            if (!isset($data['vehicles']) && isset($data['vehicle'])) {
                $data['vehicles'] = [(int)$data['vehicle']];
            }
        }
        
        $start = $data['start_date'] ?? null;
        $end = $data['end_date'] ?? null;
        
        // Build lock keys in deterministic order
        $lockKeys = [];
        if ($type === 'venue' && !empty($data['venues'])) {
            foreach ($data['venues'] as $vid) {
                $lockKeys[] = 'venue_' . (int)$vid;
            }
        } elseif ($type === 'vehicle' && !empty($data['vehicles'])) {
            foreach ($data['vehicles'] as $vehId) {
                $lockKeys[] = 'vehicle_' . (int)$vehId;
            }
        }
        if (!empty($data['equipment']) && is_array($data['equipment'])) {
            foreach ($data['equipment'] as $eq) {
                $lockKeys[] = 'equipment_' . (int)$eq['equipment_id'];
            }
        }
        sort($lockKeys); // Deterministic order to prevent deadlocks
        
        // Acquire MySQL named locks
        $acquired = [];
        try {
            foreach ($lockKeys as $key) {
                $stmt = $this->conn->prepare("SELECT GET_LOCK(?, 10)");
                $stmt->execute([$key]);
                $result = $stmt->fetchColumn();
                
                if ($result != 1) {
                    // Release all acquired locks
                    foreach ($acquired as $ak) {
                        $releaseStmt = $this->conn->prepare("SELECT RELEASE_LOCK(?)");
                        $releaseStmt->execute([$ak]);
                    }
                    return ['status' => 'error', 'message' => 'Another reservation is being processed. Please try again.'];
                }
                
                $acquired[] = $key;
            }
            
            // Start transaction AFTER acquiring locks
            $this->conn->beginTransaction();
            
            // Now check for conflicts while holding locks
            $bypassConflict = $this->shouldBypassConflict($data['user_id'] ?? 0);
            
            if (!$bypassConflict) {
                $conflictingResources = [];
                
                if ($type === 'venue') {
                    if (!empty($data['venues'])) {
                        foreach ($data['venues'] as $venueData) {
                            // Handle both old format (just ID) and new format (object with venue_id)
                            $vid = is_array($venueData) ? (int)$venueData['venue_id'] : (int)$venueData;
                            
                            $conf = $this->hasConflictRequest('venue', $vid, $start, $end);
                            
                            if ($conf['status'] === false) {
                                throw new Exception('Failed to check venue availability.');
                            }
                            if ($conf['count'] > 0 && !empty($conf['conflicts'])) {
                                $venueName = $conf['conflicts'][0]['venue_name'] ?? 'Venue ID ' . $vid;
                                $conflictingResources[] = [
                                    'type' => 'Venue',
                                    'name' => $venueName,
                                    'conflicts' => $conf['conflicts']
                                ];
                            }
                        }
                    }
                    if (!empty($data['equipment'])) {
                        foreach ($data['equipment'] as $eq) {
                            $conf = $this->hasConflictRequest('equipment', (int)$eq['equipment_id'], $start, $end, (int)$eq['quantity']);
                            if ($conf['count'] > 0) {
                                $equipName = $conf['equipment_info']['equipment_name'] ?? 'Equipment ID ' . $eq['equipment_id'];
                                $requested = $conf['equipment_info']['requested_quantity'] ?? $eq['quantity'];
                                $remaining = $conf['equipment_info']['remaining_quantity'] ?? 0;
                                $conflictingResources[] = [
                                    'type' => 'Equipment',
                                    'name' => $equipName,
                                    'details' => "Requested: $requested, Available: $remaining",
                                    'conflicts' => $conf['conflicts']
                                ];
                            }
                        }
                    }
                } elseif ($type === 'vehicle') {
                    if (!empty($data['vehicles'])) {
                        foreach ($data['vehicles'] as $vehId) {
                            $conf = $this->hasConflictRequest('vehicle', (int)$vehId, $start, $end);
                            if ($conf['status'] === false) {
                                throw new Exception('Failed to check vehicle availability.');
                            }
                            if ($conf['count'] > 0 && !empty($conf['conflicts'])) {
                                $vehicleName = $conf['conflicts'][0]['vehicle_name'] ?? 'Vehicle ID ' . $vehId;
                                $conflictingResources[] = [
                                    'type' => 'Vehicle',
                                    'name' => $vehicleName,
                                    'conflicts' => $conf['conflicts']
                                ];
                            }
                        }
                    }
                    if (!empty($data['equipment'])) {
                        foreach ($data['equipment'] as $eq) {
                            $conf = $this->hasConflictRequest('equipment', (int)$eq['equipment_id'], $start, $end, (int)$eq['quantity']);
                            if ($conf['count'] > 0) {
                                $equipName = $conf['equipment_info']['equipment_name'] ?? 'Equipment ID ' . $eq['equipment_id'];
                                $requested = $conf['equipment_info']['requested_quantity'] ?? $eq['quantity'];
                                $remaining = $conf['equipment_info']['remaining_quantity'] ?? 0;
                                $conflictingResources[] = [
                                    'type' => 'Equipment',
                                    'name' => $equipName,
                                    'details' => "Requested: $requested, Available: $remaining",
                                    'conflicts' => $conf['conflicts']
                                ];
                            }
                        }
                    }
                } elseif ($type === 'equipment') {
                    if (!empty($data['equipment'])) {
                        foreach ($data['equipment'] as $eq) {
                            $conf = $this->hasConflictRequest('equipment', (int)$eq['equipment_id'], $start, $end, (int)$eq['quantity']);
                            if ($conf['count'] > 0) {
                                $equipName = $conf['equipment_info']['equipment_name'] ?? 'Equipment ID ' . $eq['equipment_id'];
                                $requested = $conf['equipment_info']['requested_quantity'] ?? $eq['quantity'];
                                $remaining = $conf['equipment_info']['remaining_quantity'] ?? 0;
                                $conflictingResources[] = [
                                    'type' => 'Equipment',
                                    'name' => $equipName,
                                    'details' => "Requested: $requested, Available: $remaining",
                                    'conflicts' => $conf['conflicts']
                                ];
                            }
                        }
                    }
                }
                
                // If conflicts found, rollback and return error with details
                if (!empty($conflictingResources)) {
                    $this->conn->rollBack();
                    
                    // Release locks
                    foreach ($acquired as $ak) {
                        $releaseStmt = $this->conn->prepare("SELECT RELEASE_LOCK(?)");
                        $releaseStmt->execute([$ak]);
                    }
                    
                    $errorMessage = "The following resources have conflicts:\n\n";
                    foreach ($conflictingResources as $resource) {
                        $errorMessage .= "• {$resource['type']}: {$resource['name']}";
                        if (isset($resource['details'])) {
                            $errorMessage .= " ({$resource['details']})";
                        }
                        
                        // Add requester and department info if available
                        if (!empty($resource['conflicts'])) {
                            $conflict = $resource['conflicts'][0];
                            $requesterInfo = [];
                            
                           
                            
                            if (isset($conflict['department_name']) && !empty($conflict['department_name'])) {
                                $requesterInfo[] = "Department: {$conflict['department_name']}";
                            }
                            
                            if (!empty($requesterInfo)) {
                                $errorMessage .= "\n  " . implode(", ", $requesterInfo);
                            }
                        }
                        $errorMessage .= "\n";
                    }
                    
                    return ['status' => 'error', 'message' => $errorMessage];
                }
            }
            
            // No conflicts - continue with reservation creation while holding locks and transaction
            
        } catch (Exception $e) {
            error_log("[$requestId] Exception during lock/conflict check: " . $e->getMessage());
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            // Release locks
            foreach ($acquired as $ak) {
                $releaseStmt = $this->conn->prepare("SELECT RELEASE_LOCK(?)");
                $releaseStmt->execute([$ak]);
            }
            return ['status' => 'error', 'message' => 'Failed to process reservation: ' . $e->getMessage()];
        }
        
        // Continue with reservation creation (old code below will be executed)
        $lockKeys = [];
        if ($type === 'venue') {
            if (!empty($data['venues']) && is_array($data['venues'])) {
                foreach ($data['venues'] as $vid) {
                    $lockKeys[] = 'lock:venue:' . (int)$vid;
                }
            }
            if (!empty($data['equipment']) && is_array($data['equipment'])) {
                foreach ($data['equipment'] as $eq) {
                    $lockKeys[] = 'lock:equipment:' . (int)$eq['equipment_id'];
                }
            }
        } elseif ($type === 'vehicle') {
            if (!empty($data['vehicles']) && is_array($data['vehicles'])) {
                foreach ($data['vehicles'] as $vehId) {
                    $lockKeys[] = 'lock:vehicle:' . (int)$vehId;
                }
            }
            if (!empty($data['equipment']) && is_array($data['equipment'])) {
                foreach ($data['equipment'] as $eq) {
                    $lockKeys[] = 'lock:equipment:' . (int)$eq['equipment_id'];
                }
            }
        } elseif ($type === 'equipment') {
            if (!empty($data['equipment']) && is_array($data['equipment'])) {
                foreach ($data['equipment'] as $eq) {
                    $lockKeys[] = 'lock:equipment:' . (int)$eq['equipment_id'];
                }
            }
        }

        // Acquire locks in deterministic order BEFORE transaction
        sort($lockKeys);
        $acquired = [];
        try {
            foreach ($lockKeys as $k) {
                if (!$this->acquireLock($k, 2.0)) { // allow more time for one request to win
                    foreach ($acquired as $ak) { $this->releaseLock($ak); }
                    
                    // Check for conflicts to provide detailed error message
                    // Use $start and $end already defined from lines 1866-1867
                    $conflictingResources = [];
                    
                    if ($type === 'venue') {
                        if (!empty($data['venues'])) {
                            foreach ($data['venues'] as $vid) {
                                $conf = $this->hasConflictRequest('venue', (int)$vid, $start, $end);
                                if ($conf['count'] > 0 && !empty($conf['conflicts'])) {
                                    $venueName = $conf['conflicts'][0]['venue_name'] ?? 'Venue ID ' . $vid;
                                    $conflictingResources[] = [
                                        'type' => 'Venue',
                                        'name' => $venueName,
                                        'conflicts' => $conf['conflicts']
                                    ];
                                }
                            }
                        }
                        if (!empty($data['equipment'])) {
                            foreach ($data['equipment'] as $eq) {
                                $conf = $this->hasConflictRequest('equipment', (int)$eq['equipment_id'], $start, $end, (int)$eq['quantity']);
                                if ($conf['count'] > 0) {
                                    $equipName = $conf['equipment_info']['equipment_name'] ?? 'Equipment ID ' . $eq['equipment_id'];
                                    $requested = $conf['equipment_info']['requested_quantity'] ?? $eq['quantity'];
                                    $remaining = $conf['equipment_info']['remaining_quantity'] ?? 0;
                                    $conflictingResources[] = [
                                        'type' => 'Equipment',
                                        'name' => $equipName,
                                        'details' => "Requested: $requested, Available: $remaining",
                                        'conflicts' => $conf['conflicts']
                                    ];
                                }
                            }
                        }
                    } elseif ($type === 'vehicle') {
                        if (!empty($data['vehicles'])) {
                            foreach ($data['vehicles'] as $vehId) {
                                $conf = $this->hasConflictRequest('vehicle', (int)$vehId, $start, $end);
                                if ($conf['count'] > 0 && !empty($conf['conflicts'])) {
                                    $vehicleName = $conf['conflicts'][0]['vehicle_name'] ?? 'Vehicle ID ' . $vehId;
                                    $conflictingResources[] = [
                                        'type' => 'Vehicle',
                                        'name' => $vehicleName,
                                        'conflicts' => $conf['conflicts']
                                    ];
                                }
                            }
                        }
                        if (!empty($data['equipment'])) {
                            foreach ($data['equipment'] as $eq) {
                                $conf = $this->hasConflictRequest('equipment', (int)$eq['equipment_id'], $start, $end, (int)$eq['quantity']);
                                if ($conf['count'] > 0) {
                                    $equipName = $conf['equipment_info']['equipment_name'] ?? 'Equipment ID ' . $eq['equipment_id'];
                                    $requested = $conf['equipment_info']['requested_quantity'] ?? $eq['quantity'];
                                    $remaining = $conf['equipment_info']['remaining_quantity'] ?? 0;
                                    $conflictingResources[] = [
                                        'type' => 'Equipment',
                                        'name' => $equipName,
                                        'details' => "Requested: $requested, Available: $remaining",
                                        'conflicts' => $conf['conflicts']
                                    ];
                                }
                            }
                        }
                    } elseif ($type === 'equipment') {
                        if (!empty($data['equipment'])) {
                            foreach ($data['equipment'] as $eq) {
                                $conf = $this->hasConflictRequest('equipment', (int)$eq['equipment_id'], $start, $end, (int)$eq['quantity']);
                                if ($conf['count'] > 0) {
                                    $equipName = $conf['equipment_info']['equipment_name'] ?? 'Equipment ID ' . $eq['equipment_id'];
                                    $requested = $conf['equipment_info']['requested_quantity'] ?? $eq['quantity'];
                                    $remaining = $conf['equipment_info']['remaining_quantity'] ?? 0;
                                    $conflictingResources[] = [
                                        'type' => 'Equipment',
                                        'name' => $equipName,
                                        'details' => "Requested: $requested, Available: $remaining",
                                        'conflicts' => $conf['conflicts']
                                    ];
                                }
                            }
                        }
                    }
                    
                    // Build detailed error message
                    $errorMessage = "The following resources have conflicts:\n\n";
                    
                    if (!empty($conflictingResources)) {
                        foreach ($conflictingResources as $resource) {
                            $errorMessage .= "• {$resource['type']}: {$resource['name']}";
                            if (isset($resource['details'])) {
                                $errorMessage .= " ({$resource['details']})";
                            }
                           
                            $errorMessage .= "\n\n";
                        }
                    } else {
                        // If no conflicts detected in check, check if it's a temporary lock or real conflict
                        // Collect equipment availability to determine if it's a lock contention or actual conflict
                        $hasRealConflict = false;
                        $equipmentDetails = [];
                        
                        if ($type === 'venue' && !empty($data['equipment'])) {
                            foreach ($data['equipment'] as $eq) {
                                $equipId = (int)$eq['equipment_id'];
                                $requestedQty = isset($eq['quantity']) ? (int)$eq['quantity'] : 0;
                                
                                $availStmt = $this->conn->prepare("
                                    SELECT 
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
                                        END AS total_capacity,
                                        COALESCE((
                                            SELECT SUM(re.reservation_equipment_quantity)
                                            FROM tbl_reservation_equipment re
                                            INNER JOIN tbl_reservation r ON re.reservation_reservation_id = r.reservation_id
                                            WHERE re.reservation_equipment_equip_id = eq.equip_id
                                              AND r.reservation_id NOT IN (
                                                SELECT DISTINCT reservation_reservation_id 
                                                FROM tbl_reservation_status 
                                                WHERE reservation_status_status_id IN (2, 5, 4)
                                              )
                                              AND (? <= r.reservation_end_date AND ? >= r.reservation_start_date)
                                        ), 0) AS used_quantity
                                    FROM tbl_equipments eq
                                    WHERE eq.equip_id = ?
                                ");
                                $availStmt->execute([$start, $end, $equipId]);
                                $availData = $availStmt->fetch(PDO::FETCH_ASSOC);
                                
                                $available = $availData ? ((int)$availData['total_capacity'] - (int)$availData['used_quantity']) : 0;
                                $equipmentDetails[] = ['requested' => $requestedQty, 'available' => $available];
                                
                                if ($requestedQty > $available) {
                                    $hasRealConflict = true;
                                }
                            }
                        } elseif ($type === 'vehicle' && !empty($data['equipment'])) {
                            foreach ($data['equipment'] as $eq) {
                                $equipId = (int)$eq['equipment_id'];
                                $requestedQty = isset($eq['quantity']) ? (int)$eq['quantity'] : 0;
                                
                                $availStmt = $this->conn->prepare("
                                    SELECT 
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
                                        END AS total_capacity,
                                        COALESCE((
                                            SELECT SUM(re.reservation_equipment_quantity)
                                            FROM tbl_reservation_equipment re
                                            INNER JOIN tbl_reservation r ON re.reservation_reservation_id = r.reservation_id
                                            WHERE re.reservation_equipment_equip_id = eq.equip_id
                                              AND r.reservation_id NOT IN (
                                                SELECT DISTINCT reservation_reservation_id 
                                                FROM tbl_reservation_status 
                                                WHERE reservation_status_status_id IN (2, 5, 4)
                                              )
                                              AND (? <= r.reservation_end_date AND ? >= r.reservation_start_date)
                                        ), 0) AS used_quantity
                                    FROM tbl_equipments eq
                                    WHERE eq.equip_id = ?
                                ");
                                $availStmt->execute([$start, $end, $equipId]);
                                $availData = $availStmt->fetch(PDO::FETCH_ASSOC);
                                
                                $available = $availData ? ((int)$availData['total_capacity'] - (int)$availData['used_quantity']) : 0;
                                $equipmentDetails[] = ['requested' => $requestedQty, 'available' => $available];
                                
                                if ($requestedQty > $available) {
                                    $hasRealConflict = true;
                                }
                            }
                        } elseif ($type === 'equipment' && !empty($data['equipment'])) {
                            foreach ($data['equipment'] as $eq) {
                                $equipId = (int)$eq['equipment_id'];
                                $requestedQty = isset($eq['quantity']) ? (int)$eq['quantity'] : 0;
                                
                                $availStmt = $this->conn->prepare("
                                    SELECT 
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
                                        END AS total_capacity,
                                        COALESCE((
                                            SELECT SUM(re.reservation_equipment_quantity)
                                            FROM tbl_reservation_equipment re
                                            INNER JOIN tbl_reservation r ON re.reservation_reservation_id = r.reservation_id
                                            WHERE re.reservation_equipment_equip_id = eq.equip_id
                                              AND r.reservation_id NOT IN (
                                                SELECT DISTINCT reservation_reservation_id 
                                                FROM tbl_reservation_status 
                                                WHERE reservation_status_status_id IN (2, 5, 4)
                                              )
                                              AND (? <= r.reservation_end_date AND ? >= r.reservation_start_date)
                                        ), 0) AS used_quantity
                                    FROM tbl_equipments eq
                                    WHERE eq.equip_id = ?
                                ");
                                $availStmt->execute([$start, $end, $equipId]);
                                $availData = $availStmt->fetch(PDO::FETCH_ASSOC);
                                
                                $available = $availData ? ((int)$availData['total_capacity'] - (int)$availData['used_quantity']) : 0;
                                $equipmentDetails[] = ['requested' => $requestedQty, 'available' => $available];
                                
                                if ($requestedQty > $available) {
                                    $hasRealConflict = true;
                                }
                            }
                        }
                        
                        // For venues/vehicles without equipment, assume it's a lock contention (not a real conflict)
                        if ($type === 'venue' && empty($data['equipment'])) {
                            $hasRealConflict = false;
                        } elseif ($type === 'vehicle' && empty($data['equipment'])) {
                            $hasRealConflict = false;
                        }
                        
                        // If no real conflicts exist, it's just temporary lock contention
                        if (!$hasRealConflict) {
                            $errorMessage .= "Another user is currently submitting a reservation. Please try again in a moment.\n\n";
                            return ['status' => 'error', 'message' => $errorMessage];
                        }
                        
                        // Real conflicts exist, show detailed message
                        $errorMessage .= "One or more selected resources are currently being reserved by another user:\n\n";
                        
                        if ($type === 'venue') {
                            if (!empty($data['venues'])) {
                                // Fetch venue names
                                $venueIds = array_map('intval', $data['venues']);
                                $placeholders = implode(',', array_fill(0, count($venueIds), '?'));
                                $venueStmt = $this->conn->prepare("SELECT ven_id, ven_name FROM tbl_venue WHERE ven_id IN ($placeholders)");
                                $venueStmt->execute($venueIds);
                                $venues = $venueStmt->fetchAll(PDO::FETCH_ASSOC);
                                
                                foreach ($venues as $venue) {
                                    $errorMessage .= "• Venue: {$venue['ven_name']}\n";
                                }
                            }
                            if (!empty($data['equipment'])) {
                                // Fetch equipment names and availability
                                foreach ($data['equipment'] as $eq) {
                                    $equipId = (int)$eq['equipment_id'];
                                    $requestedQty = isset($eq['quantity']) ? (int)$eq['quantity'] : 0;
                                    
                                    // Get equipment availability
                                    $availStmt = $this->conn->prepare("
                                        SELECT 
                                            eq.equip_name,
                                            eq.equip_type,
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
                                            END AS total_capacity,
                                            COALESCE((
                                                SELECT SUM(re.reservation_equipment_quantity)
                                                FROM tbl_reservation_equipment re
                                                INNER JOIN tbl_reservation r ON re.reservation_reservation_id = r.reservation_id
                                                WHERE re.reservation_equipment_equip_id = eq.equip_id
                                                  AND r.reservation_id NOT IN (
                                                    SELECT DISTINCT reservation_reservation_id 
                                                    FROM tbl_reservation_status 
                                                    WHERE reservation_status_status_id IN (2, 5, 4)
                                                  )
                                                  AND (? <= r.reservation_end_date AND ? >= r.reservation_start_date)
                                            ), 0) AS used_quantity
                                        FROM tbl_equipments eq
                                        WHERE eq.equip_id = ?
                                    ");
                                    $availStmt->execute([$start, $end, $equipId]);
                                    $availData = $availStmt->fetch(PDO::FETCH_ASSOC);
                                    
                                    $equipName = $availData ? $availData['equip_name'] : 'Unknown Equipment';
                                    $totalCapacity = $availData ? (int)$availData['total_capacity'] : 0;
                                    $usedQuantity = $availData ? (int)$availData['used_quantity'] : 0;
                                    $available = $totalCapacity - $usedQuantity;
                                    
                                    $errorMessage .= "• Equipment: {$equipName} (Requested: {$requestedQty}, Available: {$available})\n";
                                }
                            }
                        } elseif ($type === 'vehicle') {
                            if (!empty($data['vehicles'])) {
                                // Fetch vehicle names with make and model
                                $vehicleIds = array_map('intval', $data['vehicles']);
                                $placeholders = implode(',', array_fill(0, count($vehicleIds), '?'));
                                $vehicleStmt = $this->conn->prepare("
                                    SELECT v.vehicle_id, vm.vehicle_make_name, vmod.vehicle_model_name, v.vehicle_license
                                    FROM tbl_vehicle v
                                    LEFT JOIN tbl_vehicle_make vm ON v.vehicle_make_id = vm.vehicle_make_id
                                    LEFT JOIN tbl_vehicle_model vmod ON v.vehicle_model_id = vmod.vehicle_model_id
                                    WHERE v.vehicle_id IN ($placeholders)
                                ");
                                $vehicleStmt->execute($vehicleIds);
                                $vehicles = $vehicleStmt->fetchAll(PDO::FETCH_ASSOC);
                                
                                foreach ($vehicles as $vehicle) {
                                    $vehicleName = trim($vehicle['vehicle_make_name'] . ' ' . $vehicle['vehicle_model_name']);
                                    if (!empty($vehicle['vehicle_license'])) {
                                        $vehicleName .= " ({$vehicle['vehicle_license']})";
                                    }
                                    $errorMessage .= "• Vehicle: {$vehicleName}\n";
                                }
                            }
                            if (!empty($data['equipment'])) {
                                // Fetch equipment names and availability
                                foreach ($data['equipment'] as $eq) {
                                    $equipId = (int)$eq['equipment_id'];
                                    $requestedQty = isset($eq['quantity']) ? (int)$eq['quantity'] : 0;
                                    
                                    // Get equipment availability
                                    $availStmt = $this->conn->prepare("
                                        SELECT 
                                            eq.equip_name,
                                            eq.equip_type,
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
                                            END AS total_capacity,
                                            COALESCE((
                                                SELECT SUM(re.reservation_equipment_quantity)
                                                FROM tbl_reservation_equipment re
                                                INNER JOIN tbl_reservation r ON re.reservation_reservation_id = r.reservation_id
                                                WHERE re.reservation_equipment_equip_id = eq.equip_id
                                                  AND r.reservation_id NOT IN (
                                                    SELECT DISTINCT reservation_reservation_id 
                                                    FROM tbl_reservation_status 
                                                    WHERE reservation_status_status_id IN (2, 5, 4)
                                                  )
                                                  AND (? <= r.reservation_end_date AND ? >= r.reservation_start_date)
                                            ), 0) AS used_quantity
                                        FROM tbl_equipments eq
                                        WHERE eq.equip_id = ?
                                    ");
                                    $availStmt->execute([$start, $end, $equipId]);
                                    $availData = $availStmt->fetch(PDO::FETCH_ASSOC);
                                    
                                    $equipName = $availData ? $availData['equip_name'] : 'Unknown Equipment';
                                    $totalCapacity = $availData ? (int)$availData['total_capacity'] : 0;
                                    $usedQuantity = $availData ? (int)$availData['used_quantity'] : 0;
                                    $available = $totalCapacity - $usedQuantity;
                                    
                                    $errorMessage .= "• Equipment: {$equipName} (Requested: {$requestedQty}, Available: {$available})\n";
                                }
                            }
                        } elseif ($type === 'equipment') {
                            if (!empty($data['equipment'])) {
                                // Fetch equipment names and availability
                                foreach ($data['equipment'] as $eq) {
                                    $equipId = (int)$eq['equipment_id'];
                                    $requestedQty = isset($eq['quantity']) ? (int)$eq['quantity'] : 0;
                                    
                                    // Get equipment availability
                                    $availStmt = $this->conn->prepare("
                                        SELECT 
                                            eq.equip_name,
                                            eq.equip_type,
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
                                            END AS total_capacity,
                                            COALESCE((
                                                SELECT SUM(re.reservation_equipment_quantity)
                                                FROM tbl_reservation_equipment re
                                                INNER JOIN tbl_reservation r ON re.reservation_reservation_id = r.reservation_id
                                                WHERE re.reservation_equipment_equip_id = eq.equip_id
                                                  AND r.reservation_id NOT IN (
                                                    SELECT DISTINCT reservation_reservation_id 
                                                    FROM tbl_reservation_status 
                                                    WHERE reservation_status_status_id IN (2, 5, 4)
                                                  )
                                                  AND (? <= r.reservation_end_date AND ? >= r.reservation_start_date)
                                            ), 0) AS used_quantity
                                        FROM tbl_equipments eq
                                        WHERE eq.equip_id = ?
                                    ");
                                    $availStmt->execute([$start, $end, $equipId]);
                                    $availData = $availStmt->fetch(PDO::FETCH_ASSOC);
                                    
                                    $equipName = $availData ? $availData['equip_name'] : 'Unknown Equipment';
                                    $totalCapacity = $availData ? (int)$availData['total_capacity'] : 0;
                                    $usedQuantity = $availData ? (int)$availData['used_quantity'] : 0;
                                    $available = $totalCapacity - $usedQuantity;
                                    
                                    $errorMessage .= "• Equipment: {$equipName} (Requested: {$requestedQty}, Available: {$available})\n";
                                }
                            }
                        }
                        

                    }
                    
                    return ['status' => 'error', 'message' => $errorMessage];
                }
                $acquired[] = $k;
            }

            // Transaction already started at the beginning - no need to start again
            // We're already holding locks from the first transaction
            
            // Final conflict checks while holding locks
            $bypassConflict = $this->shouldBypassConflict($data['user_id'] ?? 0);
            if (!$bypassConflict) {
                $conflictingResources = [];
                
                if ($type === 'venue') {
                    if (!empty($data['venues'])) {
                        foreach ($data['venues'] as $vid) {
                            $conf = $this->hasConflictRequest('venue', (int)$vid, $start, $end);
                            if ($conf['status'] === false) {
                                throw new Exception('Failed to check venue availability.');
                            }
                            if ($conf['count'] > 0 && !empty($conf['conflicts'])) {
                                $venueName = $conf['conflicts'][0]['venue_name'] ?? 'Venue ID ' . $vid;
                                $conflictingResources[] = [
                                    'type' => 'Venue',
                                    'name' => $venueName,
                                    'conflicts' => $conf['conflicts']
                                ];
                            }
                        }
                    }
                    if (!empty($data['equipment'])) {
                        foreach ($data['equipment'] as $eq) {
                            $conf = $this->hasConflictRequest('equipment', (int)$eq['equipment_id'], $start, $end, (int)$eq['quantity']);
                            if ($conf['status'] === false) {
                                throw new Exception('Failed to check equipment availability.');
                            }
                            if ($conf['count'] > 0) {
                                $equipName = $conf['equipment_info']['equipment_name'] ?? 'Equipment ID ' . $eq['equipment_id'];
                                $requested = $conf['equipment_info']['requested_quantity'] ?? $eq['quantity'];
                                $remaining = $conf['equipment_info']['remaining_quantity'] ?? 0;
                                $conflictingResources[] = [
                                    'type' => 'Equipment',
                                    'name' => $equipName,
                                    'details' => "Requested: $requested, Available: $remaining",
                                    'conflicts' => $conf['conflicts']
                                ];
                            }
                        }
                    }
                } elseif ($type === 'vehicle') {
                    if (!empty($data['vehicles'])) {
                        foreach ($data['vehicles'] as $vehId) {
                            $conf = $this->hasConflictRequest('vehicle', (int)$vehId, $start, $end);
                            if ($conf['status'] === false) {
                                throw new Exception('Failed to check vehicle availability.');
                            }
                            if ($conf['count'] > 0 && !empty($conf['conflicts'])) {
                                $vehicleName = $conf['conflicts'][0]['vehicle_name'] ?? 'Vehicle ID ' . $vehId;
                                $conflictingResources[] = [
                                    'type' => 'Vehicle',
                                    'name' => $vehicleName,
                                    'conflicts' => $conf['conflicts']
                                ];
                            }
                        }
                    }
                    if (!empty($data['equipment'])) {
                        foreach ($data['equipment'] as $eq) {
                            $conf = $this->hasConflictRequest('equipment', (int)$eq['equipment_id'], $start, $end, (int)$eq['quantity']);
                            if ($conf['status'] === false) {
                                throw new Exception('Failed to check equipment availability.');
                            }
                            if ($conf['count'] > 0) {
                                $equipName = $conf['equipment_info']['equipment_name'] ?? 'Equipment ID ' . $eq['equipment_id'];
                                $requested = $conf['equipment_info']['requested_quantity'] ?? $eq['quantity'];
                                $remaining = $conf['equipment_info']['remaining_quantity'] ?? 0;
                                $conflictingResources[] = [
                                    'type' => 'Equipment',
                                    'name' => $equipName,
                                    'details' => "Requested: $requested, Available: $remaining",
                                    'conflicts' => $conf['conflicts']
                                ];
                            }
                        }
                    }
                } elseif ($type === 'equipment') {
                    if (!empty($data['equipment'])) {
                        foreach ($data['equipment'] as $eq) {
                            $conf = $this->hasConflictRequest('equipment', (int)$eq['equipment_id'], $start, $end, (int)$eq['quantity']);
                            if ($conf['status'] === false) {
                                throw new Exception('Failed to check equipment availability.');
                            }
                            if ($conf['count'] > 0) {
                                $equipName = $conf['equipment_info']['equipment_name'] ?? 'Equipment ID ' . $eq['equipment_id'];
                                $requested = $conf['equipment_info']['requested_quantity'] ?? $eq['quantity'];
                                $remaining = $conf['equipment_info']['remaining_quantity'] ?? 0;
                                $conflictingResources[] = [
                                    'type' => 'Equipment',
                                    'name' => $equipName,
                                    'details' => "Requested: $requested, Available: $remaining",
                                    'conflicts' => $conf['conflicts']
                                ];
                            }
                        }
                    }
                }
                
                // If there are conflicts, build detailed error message
                if (!empty($conflictingResources)) {
                    $errorMessage = "The following resources have conflicts:\n\n";
                    foreach ($conflictingResources as $resource) {
                        $errorMessage .= "• {$resource['type']}: {$resource['name']}";
                        if (isset($resource['details'])) {
                            $errorMessage .= " ({$resource['details']})";
                        }
                       
                        $errorMessage .= "\n\n";
                    }
                    throw new Exception($errorMessage);
                }
            }

            // Validate and prepare user_id - must not be null
            if (!isset($data['user_id']) || $data['user_id'] === null || $data['user_id'] === '') {
                throw new Exception('User ID is required and cannot be null');
            }
            $userId = (int)$data['user_id'];
            if ($userId <= 0) {
                throw new Exception('Invalid user ID');
            }

            // Insert into tbl_reservation
            // Note: reservation_participants column removed - now stored per-venue in tbl_reservation_venue
            $sql = "INSERT INTO tbl_reservation 
                    (reservation_title, reservation_description, 
                    reservation_start_date, reservation_end_date,
                    reservation_user_id, reservation_created_at, additional_note) 
                    VALUES (:title, :description,
                    :start_date, :end_date, :user_id, NOW(), :additional_note)";
            
            $stmt = $this->conn->prepare($sql);

            $additionalNote = isset($data['additional_note']) ? $data['additional_note'] : null;

            switch($type) {
                case 'venue':
                    $stmt->bindParam(':title', $data['title']);
                    $stmt->bindParam(':description', $data['description']);
                    $stmt->bindParam(':start_date', $data['start_date']);
                    $stmt->bindParam(':end_date', $data['end_date']);
                    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
                    $stmt->bindValue(':additional_note', $additionalNote);
                    break;
                case 'vehicle':
                    $stmt->bindParam(':title', $data['destination']);
                    $stmt->bindParam(':description', $data['purpose']);
                    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
                    $stmt->bindParam(':start_date', $data['start_date']);
                    $stmt->bindParam(':end_date', $data['end_date']);
                    $stmt->bindValue(':additional_note', $additionalNote);
                    break;
                case 'equipment':
                    $stmt->bindParam(':title', $data['title']);
                    $stmt->bindParam(':description', $data['description']);
                    $stmt->bindParam(':start_date', $data['start_date']);
                    $stmt->bindParam(':end_date', $data['end_date']);
                    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
                    $stmt->bindValue(':additional_note', $additionalNote);
                    break;
            }

            if (!$stmt->execute()) {
                throw new Exception('Failed to create reservation record');
            }

            $reservationId = $this->conn->lastInsertId();

            // Insert resource bindings inside the same transaction
            if ($type === 'venue') {
                if (!empty($data['venues'])) {
                    $venueResult = $this->insertVenue($reservationId, $data['venues']);
                    if ($venueResult['status'] !== 'success') {
                        throw new Exception($venueResult['message']);
                    }
                }
                if (!empty($data['equipment'])) {
                    $equipmentResult = $this->insertEquipment($reservationId, $data['equipment']);
                    if ($equipmentResult['status'] !== 'success') {
                        throw new Exception($equipmentResult['message']);
                    }
                }
            } elseif ($type === 'vehicle') {
                if (!empty($data['vehicles'])) {
                    $vehicleResult = $this->insertVehicles($reservationId, $data['vehicles']);
                    if ($vehicleResult['status'] !== 'success') {
                        throw new Exception($vehicleResult['message']);
                    }
                }
                // Map vehicle_id to reservation_vehicle_id for this reservation
                $vehicleIds = !empty($data['vehicles']) ? $data['vehicles'] : [];
                $vehicleMap = [];
                if (!empty($vehicleIds)) {
                    $placeholders = implode(',', array_fill(0, count($vehicleIds), '?'));
                    $sqlMap = "SELECT reservation_vehicle_id, reservation_vehicle_vehicle_id 
                               FROM tbl_reservation_vehicle 
                               WHERE reservation_reservation_id = ? 
                                 AND reservation_vehicle_vehicle_id IN ($placeholders)";
                    $stmtMap = $this->conn->prepare($sqlMap);
                    $params = array_merge([$reservationId], $vehicleIds);
                    $stmtMap->execute($params);
                    while ($row = $stmtMap->fetch(PDO::FETCH_ASSOC)) {
                        $vehicleMap[$row['reservation_vehicle_vehicle_id']] = $row['reservation_vehicle_id'];
                    }
                }
                if (!empty($data['passengers'])) {
                    $passengerResult = $this->insertPassengers($reservationId, $data['passengers']);
                    if ($passengerResult['status'] !== 'success') {
                        throw new Exception($passengerResult['message']);
                    }
                }
                if (!empty($data['drivers'])) {
                    // Attach reservation_vehicle_id to each driver where possible
                    $drivers = $data['drivers'];
                    if (is_array($drivers)) {
                        foreach ($drivers as &$driver) {
                            if (isset($driver['vehicle_id']) && isset($vehicleMap[$driver['vehicle_id']])) {
                                $driver['reservation_vehicle_id'] = $vehicleMap[$driver['vehicle_id']];
                            }
                        }
                        unset($driver);
                    }
                    $driverResult = $this->insertDriver($drivers);
                    if ($driverResult['status'] !== 'success') {
                        throw new Exception($driverResult['message']);
                    }
                }
                if (!empty($data['equipment'])) {
                    $equipmentResult = $this->insertEquipment($reservationId, $data['equipment']);
                    if ($equipmentResult['status'] !== 'success') {
                        throw new Exception($equipmentResult['message']);
                    }
                }
            } elseif ($type === 'equipment') {
                if (!empty($data['equipment'])) {
                    $equipmentResult = $this->insertEquipment($reservationId, $data['equipment']);
                    if ($equipmentResult['status'] !== 'success') {
                        throw new Exception($equipmentResult['message']);
                    }
                }
            }
    
            // Get the user level ID based on the reservation_user_id
            $userLevelSql = "SELECT u.users_user_level_id , u.users_department_id
                             FROM tbl_users u 
                             WHERE u.users_id = :user_id";
            $userLevelStmt = $this->conn->prepare($userLevelSql);
            $userLevelStmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
    
            if (!$userLevelStmt->execute()) {
                $this->conn->rollBack();
                return ['status' => 'error', 'message' => 'Failed to fetch user level'];
            }
    
            $userLevel = $userLevelStmt->fetch(PDO::FETCH_ASSOC);
            $userLevelId = $userLevel['users_user_level_id'];
            
            // Determine if requester is GSD Secretary (used to skip department approvals)
            $isGsdSecretary = false;
            try {
                $roleSql = "SELECT COALESCE(d.departments_name,'') AS dept_name, COALESCE(ul.user_level_name,'') AS level_name
                            FROM tbl_users u
                            LEFT JOIN tbl_departments d ON d.departments_id = u.users_department_id
                            LEFT JOIN tbl_user_level ul ON ul.user_level_id = u.users_user_level_id
                            WHERE u.users_id = :user_id
                            LIMIT 1";
                $roleStmt = $this->conn->prepare($roleSql);
                $roleStmt->bindValue(':user_id', $data['user_id'], PDO::PARAM_INT);
                if ($roleStmt->execute()) {
                    $roleRow = $roleStmt->fetch(PDO::FETCH_ASSOC);
                    $deptName = strtolower(trim($roleRow['dept_name'] ?? ''));
                    $levelName = strtolower(trim($roleRow['level_name'] ?? ''));
                    $isGsdSecretary = ($deptName === 'gsd' && $levelName === 'secretary');
                    if ($isGsdSecretary) {
                    // Insert notification for Admins (Dept 27, Level 1)
                    try {
                        // Get all users in department 27 (GSD) for notifications
                        $gsdUsersSql = "SELECT users_id FROM tbl_users WHERE users_department_id = 27 AND is_active = 1";
                        $gsdUsersStmt = $this->conn->prepare($gsdUsersSql);
                        
                        if ($gsdUsersStmt->execute()) {
                            $gsdUsers = $gsdUsersStmt->fetchAll(PDO::FETCH_ASSOC);
                            
                            // Insert notification for each user in GSD department
                            $gsdNotifSql = "INSERT INTO tbl_notification_reservation 
                                          (notification_message, notification_reservation_reservation_id, 
                                           notification_user_id, notification_created_at, is_read) 
                                          VALUES ('New Reservation Request', :reservation_id, :user_id, NOW(), 0)";
                            
                            foreach ($gsdUsers as $user) {
                                $gsdNotifStmt = $this->conn->prepare($gsdNotifSql);
                                $gsdNotifStmt->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                                $gsdNotifStmt->bindValue(':user_id', $user['users_id'], PDO::PARAM_INT);
                                
                                if (!$gsdNotifStmt->execute()) {
                                    error_log('Failed to insert GSD notification for user ID: ' . $user['users_id']);
                                }
                            }
                        } else {
                            error_log('Failed to fetch GSD users for notifications');
                        }
                    } catch (Exception $e) {
                        error_log('Exception inserting GSD Secretary admin notification: ' . $e->getMessage());
                    }
                    }
                }
            } catch (Exception $e) {
                // Failed to determine requester role for department approvals
            }
    
            // Initialize status SQL based on user level
            if ($userLevelId == 3 || $userLevelId == 16 || $userLevelId == 17) {
                // Determine event type from all venues
                $reservationActive = null;
                $hasBigEvent = false;
                
                if (!empty($data['venues']) && is_array($data['venues'])) {
                    // Check all venues for event types
                    foreach ($data['venues'] as $venueId) {
                        $stmtEventType = $this->conn->prepare("SELECT event_type FROM tbl_venue WHERE ven_id = :venue_id LIMIT 1");
                        $stmtEventType->bindParam(':venue_id', $venueId, PDO::PARAM_INT);
                        if ($stmtEventType->execute()) {
                            $row = $stmtEventType->fetch(PDO::FETCH_ASSOC);
                            if ($row && isset($row['event_type'])) {
                                $eventType = $row['event_type'];
                                // If any venue is Big Event, set hasBigEvent to true
                                if ($eventType === 'Big Event') {
                                    $hasBigEvent = true;
                                    break; // No need to check further, one Big Event makes it null
                                }
                            }
                        }
                    }
                    
                    // Set reservation_active based on whether any venue is Big Event
                    if ($hasBigEvent) {
                        $reservationActive = null;
                    } else {
                        // If no Big Event found, check if all are Small Event
                        $allSmallEvents = true;
                        foreach ($data['venues'] as $venueId) {
                            $stmtEventType = $this->conn->prepare("SELECT event_type FROM tbl_venue WHERE ven_id = :venue_id LIMIT 1");
                            $stmtEventType->bindParam(':venue_id', $venueId, PDO::PARAM_INT);
                            if ($stmtEventType->execute()) {
                                $row = $stmtEventType->fetch(PDO::FETCH_ASSOC);
                                if ($row && isset($row['event_type']) && $row['event_type'] !== 'Small Event') {
                                    $allSmallEvents = false;
                                    break;
                                }
                            }
                        }
                        
                        if ($allSmallEvents) {
                            $reservationActive = 1;
                        } else {
                            $reservationActive = null;
                        }
                    }
                }
    
                // ====== INSERT DEPARTMENT APPROVALS BASED ON VENUE REQUIREMENTS ======
            
            // Get venues associated with this reservation
            if (!empty($data['venues']) && is_array($data['venues'])) {
                
                // Extract venue IDs from the venues array (which contains objects with venue_id and participants)
                $venueIdsList = [];
                foreach ($data['venues'] as $venue) {
                    if (is_array($venue) && isset($venue['venue_id'])) {
                        $venueIdsList[] = (int)$venue['venue_id'];
                    } elseif (is_numeric($venue)) {
                        $venueIdsList[] = (int)$venue;
                    }
                }
                
                $venueIds = implode(",", $venueIdsList);
                
                $venueApprovalSql = "
                    SELECT DISTINCT 
                        vda.approval_venue_department_id, 
                        d.departments_name, 
                        v.ven_name,
                        vda.approval_venue_venue_id
                    FROM tbl_venue_department_approval vda
                    JOIN tbl_departments d ON vda.approval_venue_department_id = d.departments_id
                    JOIN tbl_venue v ON vda.approval_venue_venue_id = v.ven_id
                    WHERE vda.approval_venue_venue_id IN ($venueIds)
                ";
                
                $venueApprovalStmt = $this->conn->query($venueApprovalSql);
                
                if ($venueApprovalStmt) {
                    $requiredDepartments = $venueApprovalStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    $departmentsToApprove = [];
                    
                    // Check if any departments are required for approval
                    if (!empty($requiredDepartments)) {
                        // Venues HAVE department approval requirements
                        
                        // Extract department IDs - use ALL departments required by venues
                        $departmentsToApprove = array_unique(array_column($requiredDepartments, 'approval_venue_department_id'));
                        
                        // Exclude user's own department for certain user levels
                        if (in_array($userLevelId, [5, 18, 20]) && $userLevel['users_department_id'] > 0) {
                            $departmentsToApprove = array_filter($departmentsToApprove, function($deptId) use ($userLevel) {
                                return (int)$deptId !== (int)$userLevel['users_department_id'];
                            });
                        }
                        
                        // Check for additional department approvals from tbl_approval_exclusive
                        $exclusiveSql = "
                            SELECT DISTINCT approval_exclusive_department_id 
                            FROM tbl_approval_exclusive 
                            WHERE approval_exclusive_user_level_id = :user_level_id
                        ";
                        $exclusiveStmt = $this->conn->prepare($exclusiveSql);
                        $exclusiveStmt->bindParam(':user_level_id', $userLevelId, PDO::PARAM_INT);
                        
                        if ($exclusiveStmt->execute()) {
                            $exclusiveResults = $exclusiveStmt->fetchAll(PDO::FETCH_COLUMN);
                            if (!empty($exclusiveResults)) {
                                // Filter out user's own department for levels 5, 6, 18, 20
                                if (in_array($userLevelId, [5, 18, 20]) && $userLevel['users_department_id'] > 0) {
                                    $exclusiveResults = array_filter($exclusiveResults, function($deptId) use ($userLevel) {
                                        return (int)$deptId !== (int)$userLevel['users_department_id'];
                                    });
                                }
                                
                                if (!empty($exclusiveResults)) {
                                    $departmentsToApprove = array_merge($departmentsToApprove, $exclusiveResults);
                                }
                            }
                        }
                        
                    } else {
                        // Venues have NO department approval requirements
                    }
                    
                    // Clean and deduplicate departments array
                    $departmentsToApprove = array_values(array_unique(array_map('intval', $departmentsToApprove)));
                    
                    // 🔥 SEQUENTIAL APPROVAL LOGIC: If user is NOT level 5/6, insert ONLY own department first
                    $departmentsToInsert = $departmentsToApprove;
                    
                    if ($userLevelId !== 5 && $userLevel['users_department_id'] > 0) {
                        // Check if own department is in the list
                        if (in_array($userLevel['users_department_id'], $departmentsToApprove)) {
                            // Insert ONLY own department
                            $departmentsToInsert = [$userLevel['users_department_id']];
                        } else {
                            // Own department not in list, insert all
                        }
                    } else {
                        // User is level 5 or 6 - inserting ALL department approvals immediately
                    }
                    
                    // Insert department approvals
                    /* COMMENTED OUT - Department approval insertion disabled
                    if (!empty($departmentsToInsert)) {
                        error_log("Inserting department approvals for departments: " . implode(', ', $departmentsToInsert));
                        
                        foreach ($departmentsToInsert as $deptId) {
                            $deptApprovalSql = "
                                INSERT INTO tbl_department_approval 
                                (department_is_approved, department_approval_department_id, 
                                department_user_id, department_updated_at, department_request_reservation_id) 
                                VALUES (0, :dept_id, NULL, NULL, :reservation_id)
                            ";
                            $deptApprovalStmt = $this->conn->prepare($deptApprovalSql);
                            $deptApprovalStmt->bindParam(':dept_id', $deptId, PDO::PARAM_INT);
                            $deptApprovalStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                            
                            if (!$deptApprovalStmt->execute()) {
                                $error = $deptApprovalStmt->errorInfo();
                                error_log("Failed to insert department approval for dept {$deptId}: " . json_encode($error));
                                throw new Exception("Failed to create department approval record");
                            } else {
                                error_log("✅ Successfully inserted department approval - Department ID: {$deptId}, Reservation ID: {$reservationId}");
                            }
                        }
                    } else {
                        error_log("No department approvals to insert for this reservation");
                    }
                    */
                }
            } else {
                // No venues found for reservation - no department approvals needed
            }
            
            // ====== END DEPARTMENT APPROVALS LOGIC ======
            
    
                // Status SQL 1 and 2 remain the same
                $statusSql1 = "INSERT INTO tbl_reservation_status 
                              (reservation_reservation_id, reservation_status_status_id, 
                               reservation_active, reservation_users_id, reservation_updated_at) 
                              VALUES (:reservation_id, 1, 0, null, NOW())";
    
                // $statusSql2 = "INSERT INTO tbl_reservation_status 
                //               (reservation_reservation_id, reservation_status_status_id, 
                //                reservation_active, reservation_users_id, reservation_updated_at) 
                //               VALUES (:reservation_id, 8, 0, 99, NOW())";
    
                $statusStmt1 = $this->conn->prepare($statusSql1);
                $statusStmt1->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                if (!$statusStmt1->execute()) {
                    $this->conn->rollBack();
                    return ['status' => 'error', 'message' => 'Failed to create first reservation status'];
                }
    
                // $statusStmt2 = $this->conn->prepare($statusSql2);
                // $statusStmt2->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                // if (!$statusStmt2->execute()) {
                //     $this->conn->rollBack();
                //     return ['status' => 'error', 'message' => 'Failed to create second reservation status'];
                // }
    
                // Insert notification for waiting for approval (keeping existing notification)
                $notificationSql = "INSERT INTO tbl_notification_reservation 
                                  (notification_message, notification_reservation_reservation_id, 
                                   notification_user_id, notification_created_at)
                                  VALUES ('Your reservation is waiting for approval', 
                                         :reservation_id, :user_id, NOW())";
                $notificationStmt = $this->conn->prepare($notificationSql);
                $notificationStmt->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                $notificationStmt->bindValue(':user_id', $data['user_id'], PDO::PARAM_INT);
                
                if (!$notificationStmt->execute()) {
                    $this->conn->rollBack();
                    return ['status' => 'error', 'message' => 'Failed to create notification'];
                }
                // Audit: Request submitted (exclude any fetch-only ops)
                try {
                    $desc = ($type === 'venue')
                        ? 'Venue Request submitted'
                        : (($type === 'vehicle')
                            ? 'Vehicle Request submitted'
                            : 'Equipment Request submitted');
                    $action = 'Reservation Request';
                    $created_by = (int)$data['user_id'];

                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $auditStmt = $this->conn->prepare($auditSql);
                    $auditStmt->bindParam(':description', $desc, PDO::PARAM_STR);
                    $auditStmt->bindParam(':action', $action, PDO::PARAM_STR);
                    $auditStmt->bindParam(':created_by', $created_by, PDO::PARAM_INT);
                    if (!$auditStmt->execute()) {
                        $err = $auditStmt->errorInfo();
                        error_log('Audit log insert failed (submission block): ' . json_encode($err));
                    }
                } catch (Exception $e) {
                    // Do not fail the main flow if audit logging fails; just log the error
                    error_log('Audit log insert failed: ' . $e->getMessage());
                }
    
                // Insert notifications directly to tbl_notification_reservation for all department users
                if (!$isGsdSecretary) {
                    // Get all users in the department
                    $deptUsersSql = "SELECT users_id FROM tbl_users WHERE users_department_id = :dept_id AND is_active = 1";
                    $deptUsersStmt = $this->conn->prepare($deptUsersSql);
                    $deptUsersStmt->bindValue(':dept_id', $userLevel['users_department_id'], PDO::PARAM_INT);
                    
                    if ($deptUsersStmt->execute()) {
                        $deptUsers = $deptUsersStmt->fetchAll(PDO::FETCH_ASSOC);
                        
                        // Insert notification for each user in the department
                        $notifSql = "INSERT INTO tbl_notification_reservation 
                                   (notification_message, notification_reservation_reservation_id, 
                                    notification_user_id, notification_created_at, is_read) 
                                   VALUES ('New Reservation Request', :reservation_id, :user_id, NOW(), 0)";
                        
                        foreach ($deptUsers as $user) {
                            $notifStmt = $this->conn->prepare($notifSql);
                            $notifStmt->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                            $notifStmt->bindValue(':user_id', $user['users_id'], PDO::PARAM_INT);
                            
                            if (!$notifStmt->execute()) {
                                error_log('Failed to insert notification for user ID: ' . $user['users_id']);
                            }
                        }
                    } else {
                        error_log('Failed to fetch department users for notifications');
                    }
                }
    
                // --- SPECIAL NOTIFICATION FOR DEPARTMENT 27, USER LEVEL 1 (ALWAYS) ---
                // Get all users in department 27 with user level 1
                $specialDeptUsersSql = "SELECT users_id FROM tbl_users WHERE users_department_id = 27 AND users_user_level_id = 1 AND is_active = 1";
                $specialDeptUsersStmt = $this->conn->prepare($specialDeptUsersSql);
                
                if ($specialDeptUsersStmt->execute()) {
                    $specialDeptUsers = $specialDeptUsersStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Insert notification for each user in department 27 with level 1
                    $specialNotifSql = "INSERT INTO tbl_notification_reservation 
                                      (notification_message, notification_reservation_reservation_id, 
                                       notification_user_id, notification_created_at, is_read) 
                                      VALUES ('New Reservation Request', :reservation_id, :user_id, NOW(), 0)";
                    
                    foreach ($specialDeptUsers as $user) {
                        $specialNotifStmt = $this->conn->prepare($specialNotifSql);
                        $specialNotifStmt->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                        $specialNotifStmt->bindValue(':user_id', $user['users_id'], PDO::PARAM_INT);
                        
                        if (!$specialNotifStmt->execute()) {
                            error_log('Failed to insert special notification for department 27, level 1 user ID: ' . $user['users_id']);
                        }
                    }
                } else {
                    error_log('Failed to fetch department 27, level 1 users for special notifications');
                }
    
                // --- PUSH NOTIFICATION LOGIC (for user levels 3, 6, 16, 17) ---
                if ($isGsdSecretary) {
                    // For GSD Secretary: push directly to Admins in department 27
                    $sqlPushUsers = "SELECT u.users_id
                                        FROM tbl_users u
                                        INNER JOIN tbl_push_subscriptions ps ON u.users_id = ps.user_id
                                        WHERE u.users_user_level_id = 1
                                        AND u.users_department_id = 27
                                        AND ps.is_active = 1";
                    $stmtPushUsers = $this->conn->prepare($sqlPushUsers);
                    $stmtPushUsers->execute();
                    $pushUsers = $stmtPushUsers->fetchAll(PDO::FETCH_ASSOC);

                    error_log("GSD Secretary flow: Found " . count($pushUsers) . " admin users in department 27 for push notification.");

                    $pushTitle = 'New Reservation Request';
                    $pushBody = 'A new reservation request waiting for confirmation.';
                    $pushData = [
                        'reservation_id' => $reservationId,
                        'type' => 'reservation_confirmation'
                    ];
                    // Include push notification configuration
                    require_once 'config/pushConfig.php';
                    $pushUrl = getPushNotificationUrl();
                    error_log("Push URL: " . $pushUrl);
                    foreach ($pushUsers as $pushUser) {
                        $pushPayload = [
                            'operation' => 'send',
                            'user_id' => $pushUser['users_id'],
                            'title' => $pushTitle,
                            'body' => $pushBody,
                            'data' => $pushData
                        ];
                        
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, $pushUrl);
                        curl_setopt($ch, CURLOPT_POST, true);
                        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($pushPayload));
                        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                        
                        $response = curl_exec($ch);
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        $error = curl_error($ch);
                        curl_close($ch);
                        
                        if ($error || $httpCode < 200 || $httpCode >= 300) {
                            error_log("GSD Secretary admin push failed for user {$pushUser['users_id']}: " . ($error ?: "HTTP $httpCode"));
                        } else {
                            error_log("GSD Secretary admin push sent successfully to user {$pushUser['users_id']}");
                        }
                    }
                } else {
                    // Default: push to department 5/6 approvers in user's department
                    $sqlPushUsers = "SELECT u.users_id
                                        FROM tbl_users u
                                        INNER JOIN tbl_push_subscriptions ps ON u.users_id = ps.user_id
                                        WHERE u.users_department_id = :dept_id
                                        AND u.users_user_level_id IN (5, 6)
                                        AND ps.is_active = 1";
                    $stmtPushUsers = $this->conn->prepare($sqlPushUsers);
                    $stmtPushUsers->bindValue(':dept_id', $userLevel['users_department_id'], PDO::PARAM_INT);
                    $stmtPushUsers->execute();
                    $pushUsers = $stmtPushUsers->fetchAll(PDO::FETCH_ASSOC);

                    // Log the number of users found for push notifications
                    error_log("Found " . count($pushUsers) . " users with push subscriptions for department " . $userLevel['users_department_id'] . " and user levels 5,6");

                    // Prepare push notification data
                    $pushTitle = 'New Reservation Request';
                    $pushBody = 'A new reservation request is pending approval.';
                    $pushData = [
                        'reservation_id' => $reservationId,
                        'type' => 'reservation_approval',
                        'department_id' => $userLevel['users_department_id'],
                    ];
                    // Include push notification configuration
                    require_once 'config/pushConfig.php';
                    $pushUrl = getPushNotificationUrl();

                    $successCount = 0;
                    $errorCount = 0;

                    foreach ($pushUsers as $pushUser) {
                        $pushPayload = [
                            'operation' => 'send',
                            'user_id' => $pushUser['users_id'],
                            'title' => $pushTitle,
                            'body' => $pushBody,
                            'data' => $pushData
                        ];
                        
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, $pushUrl);
                        curl_setopt($ch, CURLOPT_POST, true);
                        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($pushPayload));
                        curl_setopt($ch, CURLOPT_HTTPHEADER, [
                            'Content-Type: application/json',
                            'Content-Length: ' . strlen(json_encode($pushPayload))
                        ]);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                        
                        $response = curl_exec($ch);
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        $error = curl_error($ch);
                        curl_close($ch);
                        
                        if ($error || $httpCode < 200 || $httpCode >= 300) {
                            error_log("Push notification failed for user {$pushUser['users_id']}: " . ($error ?: "HTTP $httpCode"));
                            $errorCount++;
                        } else {
                            $successCount++;
                        }
                    }
                }
    
            } elseif ($userLevelId == 5 || $userLevelId == 18) {
                // ====== INSERT DEPARTMENT APPROVALS BASED ON VENUE REQUIREMENTS ======
                
                // Get venues associated with this reservation
                if (!empty($data['venues']) && is_array($data['venues'])) {
                    
                    // Extract venue IDs from the venues array (which contains objects with venue_id and participants)
                    $venueIdsList = [];
                    foreach ($data['venues'] as $venue) {
                        if (is_array($venue) && isset($venue['venue_id'])) {
                            $venueIdsList[] = (int)$venue['venue_id'];
                        } elseif (is_numeric($venue)) {
                            $venueIdsList[] = (int)$venue;
                        }
                    }
                    
                    $venueIds = implode(",", $venueIdsList);
                    
                    $venueApprovalSql = "
                        SELECT DISTINCT 
                            vda.approval_venue_department_id, 
                            d.departments_name, 
                            v.ven_name,
                            vda.approval_venue_venue_id
                        FROM tbl_venue_department_approval vda
                        JOIN tbl_departments d ON vda.approval_venue_department_id = d.departments_id
                        JOIN tbl_venue v ON vda.approval_venue_venue_id = v.ven_id
                        WHERE vda.approval_venue_venue_id IN ($venueIds)
                    ";
                    
                    $venueApprovalStmt = $this->conn->query($venueApprovalSql);
                    
                    if ($venueApprovalStmt) {
                        $requiredDepartments = $venueApprovalStmt->fetchAll(PDO::FETCH_ASSOC);
                        
                        $departmentsToApprove = [];
                        
                        // Check if any departments are required for approval
                        if (!empty($requiredDepartments)) {
                            // Venues HAVE department approval requirements
                            
                            // Extract department IDs - use ALL departments required by venues
                            $departmentsToApprove = array_unique(array_column($requiredDepartments, 'approval_venue_department_id'));
                            
                            // Exclude user's own department for certain user levels
                            if (in_array($userLevelId, [5, 6, 18, 20]) && $userLevel['users_department_id'] > 0) {
                                $departmentsToApprove = array_filter($departmentsToApprove, function($deptId) use ($userLevel) {
                                    return (int)$deptId !== (int)$userLevel['users_department_id'];
                                });
                            }
                            
                            // Check for additional department approvals from tbl_approval_exclusive
                            $exclusiveSql = "
                                SELECT DISTINCT approval_exclusive_department_id 
                                FROM tbl_approval_exclusive 
                                WHERE approval_exclusive_user_level_id = :user_level_id
                            ";
                            $exclusiveStmt = $this->conn->prepare($exclusiveSql);
                            $exclusiveStmt->bindParam(':user_level_id', $userLevelId, PDO::PARAM_INT);
                            
                            if ($exclusiveStmt->execute()) {
                                $exclusiveResults = $exclusiveStmt->fetchAll(PDO::FETCH_COLUMN);
                                if (!empty($exclusiveResults)) {
                                    // Filter out user's own department for levels 5, 6, 18, 20
                                    if (in_array($userLevelId, [5, 6, 18, 20]) && $userLevel['users_department_id'] > 0) {
                                        $exclusiveResults = array_filter($exclusiveResults, function($deptId) use ($userLevel) {
                                            return (int)$deptId !== (int)$userLevel['users_department_id'];
                                        });
                                    }
                                    
                                    if (!empty($exclusiveResults)) {
                                        $departmentsToApprove = array_merge($departmentsToApprove, $exclusiveResults);
                                    }
                                }
                            }
                            
                        } else {
                            // Venues have NO department approval requirements
                        }
                        
                        // Clean and deduplicate departments array
                        $departmentsToApprove = array_values(array_unique(array_map('intval', $departmentsToApprove)));
                        
                        // For levels 5/18: Insert ALL department approvals immediately
                        $departmentsToInsert = $departmentsToApprove;
                        
                        // Insert department approvals
                        /* COMMENTED OUT - Department approval insertion disabled
                        if (!empty($departmentsToInsert)) {
                            error_log("Inserting department approvals for departments: " . implode(', ', $departmentsToInsert));
                            
                            foreach ($departmentsToInsert as $deptId) {
                                $deptApprovalSql = "
                                    INSERT INTO tbl_department_approval 
                                    (department_is_approved, department_approval_department_id, 
                                    department_user_id, department_updated_at, department_request_reservation_id) 
                                    VALUES (0, :dept_id, NULL, NULL, :reservation_id)
                                ";
                                $deptApprovalStmt = $this->conn->prepare($deptApprovalSql);
                                $deptApprovalStmt->bindParam(':dept_id', $deptId, PDO::PARAM_INT);
                                $deptApprovalStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                                
                                if (!$deptApprovalStmt->execute()) {
                                    $error = $deptApprovalStmt->errorInfo();
                                    error_log("Failed to insert department approval for dept {$deptId}: " . json_encode($error));
                                    throw new Exception("Failed to create department approval record");
                                } else {
                                    error_log("✅ Successfully inserted department approval - Department ID: {$deptId}, Reservation ID: {$reservationId}");
                                }
                            }
                        } else {
                            error_log("No department approvals to insert for this reservation");
                        }
                        */
                    }
                } else {
                    // No venues found for reservation - no department approvals needed
                }
                
                // ====== END DEPARTMENT APPROVALS LOGIC ======
                
                // Status SQL 1 and 2 remain the same
                $statusSql1 = "INSERT INTO tbl_reservation_status 
                              (reservation_reservation_id, reservation_status_status_id, 
                               reservation_active, reservation_users_id, reservation_updated_at) 
                              VALUES (:reservation_id, 1, 0, :user_id, NOW())";

                // $statusSql2 = "INSERT INTO tbl_reservation_status 
                //               (reservation_reservation_id, reservation_status_status_id, 
                //                reservation_active, reservation_users_id, reservation_updated_at) 
                //               VALUES (:reservation_id, 8, 0, 99, NOW())";
    
                $statusStmt1 = $this->conn->prepare($statusSql1);
                $statusStmt1->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                $statusStmt1->bindValue(':user_id', $data['user_id'], PDO::PARAM_INT);
                if (!$statusStmt1->execute()) {
                    $this->conn->rollBack();
                    return ['status' => 'error', 'message' => 'Failed to create first reservation status'];
                }
    
                // $statusStmt2 = $this->conn->prepare($statusSql2);
                // $statusStmt2->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                // if (!$statusStmt2->execute()) {
                //     $this->conn->rollBack();
                //     return ['status' => 'error', 'message' => 'Failed to create second reservation status'];
                // }
    
                // Insert notification for waiting for confirmation (keeping existing notification)
                $notificationSql = "INSERT INTO tbl_notification_reservation 
                                  (notification_message, notification_reservation_reservation_id, 
                                   notification_user_id, notification_created_at)
                                  VALUES ('Your reservation is waiting for confirmation', 
                                         :reservation_id, :user_id, NOW())";
                $notificationStmt = $this->conn->prepare($notificationSql);
                $notificationStmt->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                $notificationStmt->bindValue(':user_id', $data['user_id'], PDO::PARAM_INT);
                
                if (!$notificationStmt->execute()) {
                    $this->conn->rollBack();
                    return ['status' => 'error', 'message' => 'Failed to create notification'];
                }
                
                // Audit: Request submitted (user level 5/18 branch)
                try {
                    $desc = ($type === 'venue')
                        ? 'Venue Request submitted'
                        : (($type === 'vehicle')
                            ? 'Vehicle Request submitted'
                            : 'Equipment Request submitted');
                    $action = 'Reservation Request';
                    $created_by = (int)$data['user_id'];

                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $auditStmt = $this->conn->prepare($auditSql);
                    $auditStmt->bindParam(':description', $desc, PDO::PARAM_STR);
                    $auditStmt->bindParam(':action', $action, PDO::PARAM_STR);
                    $auditStmt->bindParam(':created_by', $created_by, PDO::PARAM_INT);
                    if (!$auditStmt->execute()) {
                        $err = $auditStmt->errorInfo();
                        error_log('Audit log insert failed (level 5/18 block): ' . json_encode($err));
                    }
                } catch (Exception $e) {
                    // Do not fail the main flow if audit logging fails; just log the error
                    error_log('Audit log insert failed: ' . $e->getMessage());
                }
                
                // Insert notifications directly to tbl_notification_reservation for all department users
                if (!$isGsdSecretary) {
                    $targetDeptId = ($userLevelId == 18) ? 27 : $userLevel['users_department_id'];
                    
                    // Get all users in the target department
                    $deptUsersSql = "SELECT users_id FROM tbl_users WHERE users_department_id = :dept_id AND is_active = 1";
                    $deptUsersStmt = $this->conn->prepare($deptUsersSql);
                    $deptUsersStmt->bindValue(':dept_id', $targetDeptId, PDO::PARAM_INT);
                    
                    if ($deptUsersStmt->execute()) {
                        $deptUsers = $deptUsersStmt->fetchAll(PDO::FETCH_ASSOC);
                        
                        // Insert notification for each user in the department
                        $notifSql = "INSERT INTO tbl_notification_reservation 
                                   (notification_message, notification_reservation_reservation_id, 
                                    notification_user_id, notification_created_at, is_read) 
                                   VALUES ('New Reservation Request', :reservation_id, :user_id, NOW(), 0)";
                        
                        foreach ($deptUsers as $user) {
                            $notifStmt = $this->conn->prepare($notifSql);
                            $notifStmt->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                            $notifStmt->bindValue(':user_id', $user['users_id'], PDO::PARAM_INT);
                            
                            if (!$notifStmt->execute()) {
                                error_log('Failed to insert notification for user ID: ' . $user['users_id']);
                            }
                        }
                    } else {
                        error_log('Failed to fetch department users for notifications');
                    }
                }
    
                // --- SPECIAL NOTIFICATION FOR DEPARTMENT 27, USER LEVEL 1 (ALWAYS) ---
                // Get all users in department 27 with user level 1
                $specialDeptUsersSql = "SELECT users_id FROM tbl_users WHERE users_department_id = 27 AND users_user_level_id = 1 AND is_active = 1";
                $specialDeptUsersStmt = $this->conn->prepare($specialDeptUsersSql);
                
                if ($specialDeptUsersStmt->execute()) {
                    $specialDeptUsers = $specialDeptUsersStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Insert notification for each user in department 27 with level 1
                    $specialNotifSql = "INSERT INTO tbl_notification_reservation 
                                      (notification_message, notification_reservation_reservation_id, 
                                       notification_user_id, notification_created_at, is_read) 
                                      VALUES ('New Reservation Request', :reservation_id, :user_id, NOW(), 0)";
                    
                    foreach ($specialDeptUsers as $user) {
                        $specialNotifStmt = $this->conn->prepare($specialNotifSql);
                        $specialNotifStmt->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                        $specialNotifStmt->bindValue(':user_id', $user['users_id'], PDO::PARAM_INT);
                        
                        if (!$specialNotifStmt->execute()) {
                            error_log('Failed to insert special notification for department 27, level 1 user ID: ' . $user['users_id']);
                        }
                    }
                } else {
                    error_log('Failed to fetch department 27, level 1 users for special notifications');
                }
    
                // --- PUSH NOTIFICATION TO ADMIN LOGIC (for user levels 5, 18) ---
                $pushUserLevel = 1; // Admin user level
                $pushDeptId = null;
    
                if ($userLevelId == 18) {
                    $pushDeptId = 27; // Specific department for VPAA requests
                }

                // If the requester is Secretary from GSD, directly push to Admin in department 27
                try {
                    $roleSql = "SELECT COALESCE(d.departments_name,'') AS dept_name, COALESCE(ul.user_level_name,'') AS level_name
                                FROM tbl_users u
                                LEFT JOIN tbl_departments d ON d.departments_id = u.users_department_id
                                LEFT JOIN tbl_user_level ul ON ul.user_level_id = u.users_user_level_id
                                WHERE u.users_id = :user_id
                                LIMIT 1";
                    $roleStmt = $this->conn->prepare($roleSql);
                    $roleStmt->bindValue(':user_id', $data['user_id'], PDO::PARAM_INT);
                    if ($roleStmt->execute()) {
                        $roleRow = $roleStmt->fetch(PDO::FETCH_ASSOC);
                        $deptName = strtolower(trim($roleRow['dept_name'] ?? ''));
                        $levelName = strtolower(trim($roleRow['level_name'] ?? ''));
                        if ($deptName === 'gsd' && $levelName === 'secretary') {
                            // Ensure push goes to Admins in Department 27
                            $evaluateGsdSecretary = $this->conn->prepare("SELECT 1");
                            if (!$evaluateGsdSecretary->execute()) {
                                // Direct admin push to department 27 enabled (GSD Secretary requester)
                            }
                        }
                    }
                } catch (Exception $e) {
                    error_log('Failed to evaluate GSD Secretary direct push: ' . $e->getMessage());
                }
    
                $sqlPushUsers = "SELECT u.users_id
                                    FROM tbl_users u
                                    INNER JOIN tbl_push_subscriptions ps ON u.users_id = ps.user_id
                                    WHERE u.users_user_level_id = :push_user_level
                                    AND ps.is_active = 1";
                
                if ($pushDeptId !== null) {
                    $sqlPushUsers .= " AND u.users_department_id = :push_dept_id";
                }
    
                $stmtPushUsers = $this->conn->prepare($sqlPushUsers);
                $stmtPushUsers->bindValue(':push_user_level', $pushUserLevel, PDO::PARAM_INT);
                if ($pushDeptId !== null) {
                    $stmtPushUsers->bindValue(':push_dept_id', $pushDeptId, PDO::PARAM_INT);
                }
                $stmtPushUsers->execute();
                $pushUsers = $stmtPushUsers->fetchAll(PDO::FETCH_ASSOC);
    
                // Old push notification code removed - now handled by consolidated method
            } else {
                // Default case: set as pending with active 1
                $statusSql = "INSERT INTO tbl_reservation_status 
                              (reservation_reservation_id, reservation_status_status_id, 
                               reservation_active, reservation_users_id, reservation_updated_at) 
                              VALUES (:reservation_id, 1, 1, :user_id, NOW())";
                               
                $statusStmt = $this->conn->prepare($statusSql);
                $statusStmt->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                $statusStmt->bindValue(':user_id', $data['user_id'], PDO::PARAM_INT);
                
                if (!$statusStmt->execute()) {
                    $this->conn->rollBack();
                    return ['status' => 'error', 'message' => 'Failed to create reservation status'];
                }
                
                // --- SPECIAL NOTIFICATION FOR DEPARTMENT 27, USER LEVEL 1 (ALWAYS) ---
                // Get all users in department 27 with user level 1
                $specialDeptUsersSql = "SELECT users_id FROM tbl_users WHERE users_department_id = 27 AND users_user_level_id = 1 AND is_active = 1";
                $specialDeptUsersStmt = $this->conn->prepare($specialDeptUsersSql);
                
                if ($specialDeptUsersStmt->execute()) {
                    $specialDeptUsers = $specialDeptUsersStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Insert notification for each user in department 27 with level 1
                    $specialNotifSql = "INSERT INTO tbl_notification_reservation 
                                      (notification_message, notification_reservation_reservation_id, 
                                       notification_user_id, notification_created_at, is_read) 
                                      VALUES ('New Reservation Request', :reservation_id, :user_id, NOW(), 0)";
                    
                    foreach ($specialDeptUsers as $user) {
                        $specialNotifStmt = $this->conn->prepare($specialNotifSql);
                        $specialNotifStmt->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                        $specialNotifStmt->bindValue(':user_id', $user['users_id'], PDO::PARAM_INT);
                        
                        if (!$specialNotifStmt->execute()) {
                            error_log('Failed to insert special notification for department 27, level 1 user ID: ' . $user['users_id']);
                        }
                    }
                } else {
                    error_log('Failed to fetch department 27, level 1 users for special notifications');
                }
            }
    
            $this->conn->commit();
            
            // Release locks after successful commit
            foreach ($acquired as $ak) {
                $releaseStmt = $this->conn->prepare("SELECT RELEASE_LOCK(?)");
                $releaseStmt->execute([$ak]);
            }
            
            // Send push notifications after successful reservation creation
            try {
                // Get reservation details for push notifications
                $reservationDetails = [
                    'reservation_user_id' => $data['user_id'],
                    'reservation_title' => $data['title'] ?? $data['destination'] ?? 'New Reservation',
                    'requester_name' => 'User'
                ];
                
                // Get requester name
                $sqlRequester = "SELECT CONCAT(users_fname, ' ', users_mname, ' ', users_lname) AS full_name 
                               FROM tbl_users WHERE users_id = :user_id";
                $stmtRequester = $this->conn->prepare($sqlRequester);
                $stmtRequester->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
                $stmtRequester->execute();
                $requesterInfo = $stmtRequester->fetch(PDO::FETCH_ASSOC);
                if ($requesterInfo) {
                    $reservationDetails['requester_name'] = $requesterInfo['full_name'];
                }
                
                // Send single unified push notification to requester only
                $this->sendUnifiedReservationPushNotification($reservationId, $data, $type);
                
            } catch (Exception $e) {
                error_log("Error sending push notifications after reservation creation: " . $e->getMessage());
                // Don't fail the reservation creation if push notifications fail
            }
            
            return ['status' => 'success', 'reservation_id' => $reservationId];

        } catch (Exception $e) {
            error_log("[$requestId] EXCEPTION during reservation creation: " . $e->getMessage());
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            // Release locks in catch block
            if (!empty($acquired)) {
                foreach ($acquired as $ak) {
                    $releaseStmt = $this->conn->prepare("SELECT RELEASE_LOCK(?)");
                    $releaseStmt->execute([$ak]);
                }
            }
            return ['status' => 'error', 'message' => $e->getMessage()];
        } finally {
            // Locks should already be released, but double-check
            if (!empty($acquired)) {
                foreach ($acquired as $ak) { $this->releaseLock($ak); }
            }
        }
    }
    
    // Send push notification to admins based on requester's user level and department
    private function sendPushNotificationToAdmins($reservation, $status, $title, $body, $data) {
        try {
            // Get the requester's user level and department to determine notification targets
            $requesterUserId = $reservation['reservation_user_id'];
            $sqlRequester = "SELECT users_user_level_id, users_department_id FROM tbl_users WHERE users_id = :user_id";
            $stmtRequester = $this->conn->prepare($sqlRequester);
            $stmtRequester->bindParam(':user_id', $requesterUserId, PDO::PARAM_INT);
            $stmtRequester->execute();
            $requester = $stmtRequester->fetch(PDO::FETCH_ASSOC);
            
            if (!$requester) {
                error_log("Could not find requester information for user ID: " . $requesterUserId);
                return;
            }
            
            // Determine notification targets based on requester's user level
            $notificationTargets = [];
            
            switch ($requester['users_user_level_id']) {
                case 3: // Student
                    // Notify department heads (level 5) and secretaries (level 6) in the same department
                    $notificationTargets = [
                        ['dept_id' => $requester['users_department_id'], 'user_level_id' => 5],
                        ['dept_id' => $requester['users_department_id'], 'user_level_id' => 6]
                    ];
                    break;
                    
                case 6: // Secretary
                    // Notify department heads (level 5) in the same department
                    $notificationTargets = [
                        ['dept_id' => $requester['users_department_id'], 'user_level_id' => 5]
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
                        ['dept_id' => $requester['users_department_id'], 'user_level_id' => 5]
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
            
            // Prepare admin notification message
            $adminTitle = $title;
            $adminBody = $body;
            
            if ($status === 'cancelled') {
                $adminTitle = "Reservation Cancelled";
                $adminBody = "A reservation '{$reservation['reservation_title']}' by {$reservation['requester_name']} has been cancelled.";
            } else if ($status === 'approved') {
                 // Approved by Dept Head, waiting for GSD
                $adminTitle = "New Request for GSD";
                $adminBody = "Waiting Approval For GSD";
            }
            else {
                $adminTitle = "Reservation " . ucfirst($status);
                $adminBody = "A reservation '{$reservation['reservation_title']}' by {$reservation['requester_name']} has been {$status}.";
            }
            
            // Add unique identifier to prevent notification replacement
            $adminData = array_merge($data, [
                'notification_id' => uniqid('admin_', true),
                'timestamp' => time(),
                'recipient_type' => 'admin'
            ]);
            
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
                
                error_log("Sending admin push notification to user {$user['users_id']}: " . json_encode($pushData));
                
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
                
                error_log("Admin push notification response for user {$user['users_id']}: HTTP $httpCode, Response: $response");
                
                if ($error || $httpCode < 200 || $httpCode >= 300) {
                    error_log("Push notification failed for admin user {$user['users_id']}: " . ($error ?: "HTTP $httpCode"));
                    $errorCount++;
                } else {
                    $successCount++;
                }
            }
            
            error_log("Push notifications sent to admins: $successCount successful, $errorCount failed");
            
        } catch (Exception $e) {
            error_log("Error sending push notifications to admins: " . $e->getMessage());
        }
    }

    // sendPushNotificationToDepartmentApproval method removed - functionality moved to Admin.php handleRequest

    // Helper method to send individual push notification
    private function sendPushNotificationHelper($pushUrl, $pushData, $userId, &$successCount, &$errorCount) {
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
            error_log("Push notification failed for user $userId: " . ($error ?: "HTTP $httpCode"));
            $errorCount++;
        } else {
            error_log("Push notification sent successfully to user $userId");
            $successCount++;
        }
    }

    // Send push notification for successful reservation creation
    private function sendSuccessfulReservationPushNotification($reservationId, $data, $type) {
        try {
            // ... (rest of the code remains the same)
            // Get the requester's information
            $userSql = "SELECT u.users_id, u.users_fname, u.users_lname, u.users_department_id,
                              d.departments_name, ul.user_level_name
                        FROM tbl_users u
                        LEFT JOIN tbl_departments d ON d.departments_id = u.users_department_id
                        LEFT JOIN tbl_user_level ul ON ul.user_level_id = u.users_user_level_id
                        WHERE u.users_id = :user_id
                        LIMIT 1";
            $userStmt = $this->conn->prepare($userSql);
            $userStmt->bindValue(':user_id', $data['user_id'], PDO::PARAM_INT);
            
            if (!$userStmt->execute()) {
                error_log('Failed to fetch user information for push notification');
                return;
            }
            
            $userInfo = $userStmt->fetch(PDO::FETCH_ASSOC);
            if (!$userInfo) {
                error_log('User not found for push notification');
                return;
            }
            
            $requesterName = trim($userInfo['users_fname'] . ' ' . $userInfo['users_lname']);
            $department = $userInfo['departments_name'] ?? 'Unknown Department';
            
            // Determine notification recipients based on reservation type and user level
            $recipientsSql = "SELECT DISTINCT u.users_id
                             FROM tbl_users u
                             INNER JOIN tbl_push_subscriptions ps ON u.users_id = ps.user_id
                             WHERE ps.is_active = 1
                             AND u.is_active = 1
                             AND (
                                 -- Send to GSD department (ID 27) admins (level 1)
                                 (u.users_department_id = 27 AND u.users_user_level_id = 1)
                                 OR
                                 -- Send to department heads/deans (levels 5, 6) in requester's department
                                 (u.users_department_id = :user_dept_id AND u.users_user_level_id IN (5, 6))
                             )";
            
            $recipientsStmt = $this->conn->prepare($recipientsSql);
            $recipientsStmt->bindValue(':user_dept_id', $userInfo['users_department_id'] ?? 0, PDO::PARAM_INT);
            $recipientsStmt->execute();
            $recipients = $recipientsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($recipients)) {
                error_log('No push notification recipients found for successful reservation');
                return;
            }
            
            // Prepare notification content
            $typeLabel = ucfirst($type);
            $pushTitle = 'Reservation Created Successfully';
            $pushBody = "New {$typeLabel} reservation by {$requesterName} from {$department}";
            $pushData = [
                'reservation_id' => $reservationId,
                'type' => 'reservation_created',
                'reservation_type' => $type,
                'requester_name' => $requesterName,
                'department' => $department
            ];
            
            // Include push notification configuration
            require_once 'config/pushConfig.php';
            $pushUrl = getPushNotificationUrl();
            $successCount = 0;
            $errorCount = 0;
            
            foreach ($recipients as $recipient) {
                $pushPayload = [
                    'operation' => 'send',
                    'user_id' => $recipient['users_id'],
                    'title' => $pushTitle,
                    'body' => $pushBody,
                    'data' => $pushData
                ];
                
                error_log("Sending successful reservation push notification to user {$recipient['users_id']}: " . json_encode($pushPayload));
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $pushUrl);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($pushPayload));
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Content-Length: ' . strlen(json_encode($pushPayload))
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                curl_close($ch);
                
                error_log("Reservation push notification response for user {$recipient['users_id']}: HTTP $httpCode, Response: $response");
                
                if ($error || $httpCode < 200 || $httpCode >= 300) {
                    error_log("Reservation push notification failed for user {$recipient['users_id']}: " . ($error ?: "HTTP $httpCode"));
                    $errorCount++;
                } else {
                    error_log("Successful reservation push notification sent to user {$recipient['users_id']}");
                    $successCount++;
                }
            }
            
            error_log("Successful reservation push notifications sent: $successCount successful, $errorCount failed");
            
        } catch (Exception $e) {
            error_log('Exception in sendSuccessfulReservationPushNotification: ' . $e->getMessage());
        }
    }

    // Send unified push notification for reservation creation (single notification to admins only)
    private function sendUnifiedReservationPushNotification($reservationId, $data, $type) {
        try {
            // Get the requester's information for notification content
            $sqlRequester = "SELECT 
                                u.users_id,
                                CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) AS full_name,
                                d.departments_name
                            FROM tbl_users u
                            LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                            WHERE u.users_id = :user_id";
            $stmtRequester = $this->conn->prepare($sqlRequester);
            $stmtRequester->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
            $stmtRequester->execute();
            $requester = $stmtRequester->fetch(PDO::FETCH_ASSOC);
            
            if (!$requester) {
                error_log("Could not find requester information for user ID: " . $data['user_id']);
                return;
            }
            
            // Get all admin users with active push subscriptions (department 27, user level 1)
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
            
            // Prepare notification content for admins
            $typeLabel = ucfirst($type);
            $pushTitle = 'New Reservation Request';
            $pushBody = "New {$typeLabel} reservation by {$requester['full_name']} from {$requester['departments_name']} requires your attention.";
            $pushData = [
                'reservation_id' => $reservationId,
                'type' => 'new_reservation',
                'reservation_type' => $type,
                'requester_name' => $requester['full_name'],
                'department' => $requester['departments_name'],
                'action_url' => '/gsd/grms/Admin/viewRequest'
            ];
            
            // Include push notification configuration
            require_once 'config/pushConfig.php';
            $pushUrl = getPushNotificationUrl();
            $successCount = 0;
            $errorCount = 0;
            
            // Send notification to all admins
            foreach ($admins as $admin) {
                $pushPayload = [
                    'operation' => 'send',
                    'user_id' => $admin['users_id'],
                    'title' => $pushTitle,
                    'body' => $pushBody,
                    'data' => $pushData
                ];
                
                error_log("Sending unified reservation push notification to admin {$admin['users_id']}: " . json_encode($pushPayload));
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $pushUrl);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($pushPayload));
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Content-Length: ' . strlen(json_encode($pushPayload))
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                curl_close($ch);
                
                error_log("Unified reservation push notification response for admin {$admin['users_id']}: HTTP $httpCode, Response: $response");
                
                if ($error || $httpCode < 200 || $httpCode >= 300) {
                    error_log("Unified reservation push notification failed for admin {$admin['users_id']}: " . ($error ?: "HTTP $httpCode"));
                    $errorCount++;
                } else {
                    error_log("Unified reservation push notification sent successfully to admin {$admin['users_id']}");
                    $successCount++;
                }
            }
            
            error_log("Unified reservation push notifications sent to admins: $successCount successful, $errorCount failed");
            
        } catch (Exception $e) {
            error_log('Exception in sendUnifiedReservationPushNotification: ' . $e->getMessage());
        }
    }

    public function commit() {
        if ($this->conn->inTransaction()) {
            return $this->conn->commit();
        }
        return true;  // No transaction to commit
    }
    
    public function rollBack() {
        if ($this->conn->inTransaction()) {
            return $this->conn->rollBack();
        }
        return true;  // No transaction to roll back
    }

    public function updateReservationDetails($reservationId, $title, $description, $userId, $startDate = null, $endDate = null) {
        try {
            $this->conn->beginTransaction();
            
            // Verify the reservation belongs to the user
            $sqlVerify = "SELECT reservation_user_id FROM tbl_reservation WHERE reservation_id = :reservation_id";
            $stmtVerify = $this->conn->prepare($sqlVerify);
            $stmtVerify->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtVerify->execute();
            $reservation = $stmtVerify->fetch(PDO::FETCH_ASSOC);
            
            if (!$reservation) {
                $this->conn->rollBack();
                return json_encode([
                    'status' => 'error',
                    'message' => 'Reservation not found'
                ]);
            }
            
            if ($reservation['reservation_user_id'] != $userId) {
                $this->conn->rollBack();
                return json_encode([
                    'status' => 'error',
                    'message' => 'You are not authorized to edit this reservation'
                ]);
            }
            
            // Build dynamic UPDATE query based on provided parameters
            $updateFields = [];
            $params = [':reservation_id' => $reservationId];
            
            if ($title !== null) {
                $updateFields[] = "reservation_title = :title";
                $params[':title'] = $title;
            }
            
            if ($description !== null) {
                $updateFields[] = "reservation_description = :description";
                $params[':description'] = $description;
            }
            
            if ($startDate !== null) {
                // Validate date format and business hours (4 AM - 10 PM)
                $startDateTime = new DateTime($startDate);
                $startHour = (int)$startDateTime->format('H');
                
                if ($startHour < 4 || $startHour >= 22) {
                    $this->conn->rollBack();
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Start time must be between 4:00 AM and 10:00 PM'
                    ]);
                }
                
                $updateFields[] = "reservation_start_date = :start_date";
                $params[':start_date'] = $startDate;
            }
            
            if ($endDate !== null) {
                // Validate date format and business hours (4 AM - 10 PM)
                $endDateTime = new DateTime($endDate);
                $endHour = (int)$endDateTime->format('H');
                
                if ($endHour < 4 || $endHour > 22) {
                    $this->conn->rollBack();
                    return json_encode([
                        'status' => 'error',
                        'message' => 'End time must be between 4:00 AM and 10:00 PM'
                    ]);
                }
                
                $updateFields[] = "reservation_end_date = :end_date";
                $params[':end_date'] = $endDate;
            }
            
            // Validate that end date is after start date if both are provided
            if ($startDate !== null && $endDate !== null) {
                $startDateTime = new DateTime($startDate);
                $endDateTime = new DateTime($endDate);
                
                if ($endDateTime <= $startDateTime) {
                    $this->conn->rollBack();
                    return json_encode([
                        'status' => 'error',
                        'message' => 'End date must be after start date'
                    ]);
                }
            }
            
            if (empty($updateFields)) {
                $this->conn->rollBack();
                return json_encode([
                    'status' => 'error',
                    'message' => 'No fields to update'
                ]);
            }
            
            // Build and execute update query
            $sqlUpdate = "UPDATE tbl_reservation SET " . implode(', ', $updateFields) . " WHERE reservation_id = :reservation_id";
            
            $stmtUpdate = $this->conn->prepare($sqlUpdate);
            
            foreach ($params as $key => $value) {
                $stmtUpdate->bindValue($key, $value);
            }
            
            if ($stmtUpdate->execute()) {
                $this->conn->commit();
                return json_encode([
                    'status' => 'success',
                    'message' => 'Reservation details updated successfully',
                    'reservation_id' => $reservationId
                ]);
            } else {
                $this->conn->rollBack();
                return json_encode([
                    'status' => 'error',
                    'message' => 'Failed to update reservation details'
                ]);
            }
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return json_encode([
                'status' => 'error',
                'message' => 'Error updating reservation details: ' . $e->getMessage()
            ]);
        }
    }

    public function getTicketsByClientId($clientId) {
    try {
        $sql = "SELECT 
                    a.comp_id,
                    a.comp_subject,
                    a.comp_clientId,
                    a.comp_locationId,
                    a.comp_locationCategoryId,
                    a.comp_description,
                    a.comp_date,
                    a.comp_end_date,
                    a.comp_image,
                    a.comp_date_closed,
                    a.comp_closedBy,
                    a.comp_operation,
                    a.comp_lastUser,
                    a.comp_remark,
                    b.joStatus_name AS comp_status,
                    CONCAT_WS(' ', c.users_fname, c.users_mname, c.users_lname) AS client_full_name,
                    loc.location_name,
                    locCateg.locCateg_name,
                    latest_status.history_statusId,
                    latest_status.history_date AS status_date,
                    latest_status.history_updatedBy,
                    op.operation_name,
                    CONCAT_WS(' ', closedByUser.users_fname, closedByUser.users_mname, closedByUser.users_lname) AS closed_by_full_name,
                    CONCAT_WS(' ', lastUser.users_fname, lastUser.users_mname, lastUser.users_lname) AS last_user_full_name,
                    joAgg.priority_name,
                    joAgg.assigned_personnel,
                    joAgg.job_image
                FROM tblcomplaints AS a
                LEFT JOIN (
                    SELECT h1.*
                    FROM tblcomplaint_status_history h1
                    INNER JOIN (
                        SELECT history_compId, MAX(history_id) AS max_history_id
                        FROM tblcomplaint_status_history
                        GROUP BY history_compId
                    ) h2 ON h1.history_compId = h2.history_compId AND h1.history_id = h2.max_history_id
                ) latest_status ON a.comp_id = latest_status.history_compId
                LEFT JOIN tbljoborderstatus AS b ON latest_status.history_statusId = b.joStatus_id
                LEFT JOIN tbl_users AS c ON a.comp_clientId = c.users_id
                LEFT JOIN tbllocation AS loc ON a.comp_locationId = loc.location_id
                LEFT JOIN tbllocationcategory AS locCateg ON a.comp_locationCategoryId = locCateg.locCateg_id
                LEFT JOIN tbloperation AS op ON a.comp_operation = op.operation_id
                LEFT JOIN tbl_users AS closedByUser ON a.comp_closedBy = closedByUser.users_id
                LEFT JOIN tbl_users AS lastUser ON a.comp_lastUser = lastUser.users_id
                LEFT JOIN (
                    SELECT 
                        jo.job_complaintId AS comp_id,
                        MAX(p.priority_name) AS priority_name,
                        GROUP_CONCAT(DISTINCT TRIM(CONCAT_WS(' ', u.users_fname, u.users_mname, u.users_lname)) SEPARATOR ', ') AS assigned_personnel,
                        MAX(jo.job_image) AS job_image
                    FROM tbljoborders jo
                    LEFT JOIN tblpriority p ON p.priority_id = jo.job_priority
                    LEFT JOIN tbljoborderpersonnel jop ON jop.joPersonnel_joId = jo.job_id
                    LEFT JOIN tbl_users u ON u.users_id = jop.joPersonnel_userId
                    GROUP BY jo.job_complaintId
                ) joAgg ON joAgg.comp_id = a.comp_id
                WHERE a.comp_clientId = :clientId
                ORDER BY a.comp_id DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':clientId', $clientId, PDO::PARAM_INT);
        $stmt->execute();

        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return json_encode([
            'status' => 'success',
            'data' => $rs
        ]);

    } catch (PDOException $e) {
        error_log("Error in getTicketsByClientId: " . $e->getMessage());
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        error_log("General error in getTicketsByClientId: " . $e->getMessage());
        return json_encode([
            'status' => 'error',
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}


   
 
}



// Only run request handler if accessed via HTTP (not CLI)
if (php_sapi_name() !== 'cli' && isset($_SERVER['REQUEST_METHOD'])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // For multipart/form-data (file uploads), PHP populates $_FILES and $_POST
        // Treat any request with non-empty $_FILES as multipart, regardless of CONTENT_TYPE nuances
        if (!empty($_FILES) || (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false)) {
            $input = $_POST;
        } else {
            $input = json_decode(file_get_contents('php://input'), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                $input = $_POST;
            }
        }

        $operation = $input['operation'] ?? '';
        $userId = $input['userId'] ?? $input['user_id'] ?? null;
        $facultyStaff = new FacultyStaff();

    switch ($operation) {

        case "getTicketsByClientId":
            if (empty($userId)) {
                echo json_encode(['status' => 'error', 'message' => 'Missing userId']);
                break;
            }
            $result = $facultyStaff->getTicketsByClientId($userId);
            echo $result;
            break;

        case "addComplaint":
            try {
                // Support both multipart/FormData (with 'json' field) and pure JSON payloads
                if (isset($input['json'])) {
                    $json = json_decode($input['json'], true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        error_log('addComplaint Error: Failed to decode nested JSON. Error: ' . json_last_error_msg() . ' | Input: ' . print_r($input['json'] ?? 'No json key', true));
                        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON format']);
                        break;
                    }
                } else {
                    // For JSON and multipart requests, $input already contains the scalar fields
                    $json = $input;
                }

                $subject = trim($json['subject'] ?? '');
                $clientId = $json['clientId'] ?? null;
                $userId = $json['userId'] ?? $json['user_id'] ?? $clientId; // Get userId from payload, fallback to clientId
                $locationId = $json['locationId'] ?? null;
                $locationCategoryId = $json['locationCategoryId'] ?? null;
                // Description is optional; trim but do not require it
                $description = isset($json['description']) ? trim($json['description']) : '';
                $endDate = $json['endDate'] ?? null;

                // Validate required fields (description is optional)
                if (empty($subject) || empty($clientId) || empty($locationId) || empty($locationCategoryId) || empty($endDate)) {
                    error_log('addComplaint Error: Missing required fields. Subject: ' . ($subject ?: 'empty') . ', ClientId: ' . ($clientId ?: 'empty') . ', LocationId: ' . ($locationId ?: 'empty') . ', LocationCategoryId: ' . ($locationCategoryId ?: 'empty') . ', EndDate: ' . ($endDate ?: 'empty'));
                    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
                    break;
                }

                // Validate end date is not earlier than today
                date_default_timezone_set('Asia/Manila');
                $today = date('Y-m-d');
                if (strtotime($endDate) < strtotime($today)) {
                    error_log('addComplaint Error: End date is earlier than today. EndDate: ' . $endDate . ', Today: ' . $today . ', ClientId: ' . $clientId);
                    echo 5; // End date cannot be earlier than today
                    break;
                }

                // Handle optional image upload (multipart/form-data)
                $imagePath = null;
                // Accept both 'image' and 'file' as possible field names
                $fileField = null;
                if (isset($_FILES['image']) && is_array($_FILES['image'])) {
                    $fileField = 'image';
                } elseif (isset($_FILES['file']) && is_array($_FILES['file'])) {
                    $fileField = 'file';
                }

                if ($fileField !== null && $_FILES[$fileField]['error'] !== UPLOAD_ERR_NO_FILE) {
                    $file = $_FILES[$fileField];

                    // Server-side size limit: 1MB
                    $maxBytes = 1 * 1024 * 1024; // 1MB
                    if ($file['size'] > $maxBytes) {
                        error_log('addComplaint Error: Uploaded image too large. Size: ' . $file['size']);
                        echo 4; // File too big
                        break;
                    }

                    // Allowed mime types
                    $finfo = new finfo(FILEINFO_MIME_TYPE);
                    $mimeType = $finfo->file($file['tmp_name']);
                    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                    if (!in_array($mimeType, $allowedTypes, true)) {
                        error_log('addComplaint Error: Invalid image type. Mime: ' . $mimeType);
                        echo 2; // Invalid type
                        break;
                    }

                    // Prepare destination directory
                    $uploadDir = __DIR__ . '/static/complaints';
                    if (!is_dir($uploadDir)) {
                        if (!mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
                            error_log('addComplaint Error: Failed to create upload directory: ' . $uploadDir);
                            echo 3; // Upload error
                            break;
                        }
                    }

                    $canUseGdWebp = function_exists('imagewebp') && (
                        function_exists('imagecreatefromjpeg') ||
                        function_exists('imagecreatefrompng') ||
                        function_exists('imagecreatefromgif') ||
                        function_exists('imagecreatefromwebp')
                    );

                    $fileName = 'complaint_' . time() . '_' . mt_rand(1000, 9999) . '.webp';
                    $destPath = $uploadDir . '/' . $fileName;

                    if ($canUseGdWebp) {
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
                            error_log('addComplaint Error: Failed to create image resource from uploaded file.');
                            echo 3; // Upload error
                            break;
                        }

                        if (!imagewebp($srcImage, $destPath, 80)) {
                            imagedestroy($srcImage);
                            error_log('addComplaint Error: Failed to save WebP image to ' . $destPath);
                            echo 3; // Upload error
                            break;
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
                            error_log('addComplaint Error: Imagick WebP conversion failed: ' . $e->getMessage());
                            echo 3; // Upload error
                            break;
                        }
                    } else {
                        error_log('addComplaint Error: WebP conversion is not supported on this server (GD WebP/Imagick unavailable).');
                        echo 3; // Upload error
                        break;
                    }

                    // Store relative path for DB/front-end
                    $imagePath = 'static/complaints/' . $fileName;
                }

                // Insert complaint with userId for status history
                $result = $facultyStaff->addComplaint($subject, $clientId, $locationId, $locationCategoryId, $description, $endDate, $imagePath, $userId);

                if ($result === 0) {
                    error_log('addComplaint Error: addComplaint function returned 0 (failed). Subject: ' . $subject . ', ClientId: ' . $clientId . ', UserId: ' . $userId);
                }

                echo $result;
            } catch (Exception $e) {
                error_log('addComplaint Case Handler Exception: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() . ' | Trace: ' . $e->getTraceAsString());
                echo json_encode(['status' => 'error', 'message' => 'An error occurred while processing the complaint']);
            }
            break;
        
        case "submitReport":
            $name = trim($input['name'] ?? '');
            $issue = trim($input['issue'] ?? '');
            $description = $input['description'] ?? null;
            if ($name === '' || $issue === '') {
                echo json_encode(['status' => 'error', 'message' => 'Name and issue are required']);
                break;
            }
            echo (new FacultyStaff())->submitReport($name, $issue, $description);
            break;

        case "fetchReports":
            if (!$userId) {
                echo json_encode(['status' => 'error', 'message' => 'Missing userId']);
                break;
            }
            echo (new FacultyStaff())->fetchReports((int)$userId);
            break;

        case "handleCancelReservation":
            $reservationId = $input['reservation_id'] ?? null;
            if ($reservationId === null) {
                echo json_encode(['status' => 'error', 'message' => 'Reservation ID is required']);
                break;
            }
            echo $facultyStaff->handleCancelReservation($reservationId, $userId);
            break;

        case "checkCancelEligibility":
            $reservationId = $input['reservation_id'] ?? null;
            if ($reservationId === null) {
                echo json_encode(['status' => 'error', 'message' => 'Reservation ID is required']);
                break;
            }
            echo $facultyStaff->checkCancelEligibility($reservationId, $userId);
            break;

        case "updateReservationDetails":
            $reservationId = $input['reservation_id'] ?? null;
            $title = $input['title'] ?? null;
            $description = $input['description'] ?? null;
            $startDate = $input['start_date'] ?? null;
            $endDate = $input['end_date'] ?? null;
            
            if ($reservationId === null) {
                echo json_encode(['status' => 'error', 'message' => 'reservation_id is required']);
                break;
            }
            
            // At least one field must be provided
            if ($title === null && $description === null && $startDate === null && $endDate === null) {
                echo json_encode(['status' => 'error', 'message' => 'At least one field to update is required']);
                break;
            }
            
            echo $facultyStaff->updateReservationDetails($reservationId, $title, $description, $userId, $startDate, $endDate);
            break;

        case "updateReservationReschedule":
            $reservation_id = $input['reservation_id'] ?? ($_POST['reservation_id'] ?? null);
            $reschedule_start_date = $input['reschedule_start_date'] ?? ($_POST['reschedule_start_date'] ?? null);
            $reschedule_end_date = $input['reschedule_end_date'] ?? ($_POST['reschedule_end_date'] ?? null);
            $user_admin_id = $input['user_admin_id'] ?? ($_POST['user_admin_id'] ?? null);
            if ($reservation_id === null || $reschedule_start_date === null || $reschedule_end_date === null) {
                echo json_encode(['status' => 'error', 'message' => 'reservation_id, reschedule_start_date, and reschedule_end_date are required']);
                break;
            }
            echo $facultyStaff->updateReservationReschedule($reservation_id, $reschedule_start_date, $reschedule_end_date, $user_admin_id);
            break;


        case "updateVenueReschedule":
            $reservation_venue_id = $input['reservation_venue_id'] ?? ($_POST['reservation_venue_id'] ?? null);
            $reservation_change_venue_id = $input['reservation_change_venue_id'] ?? ($_POST['reservation_change_venue_id'] ?? null);
            if ($reservation_venue_id === null) {
                echo json_encode(['status' => 'error', 'message' => 'reservation_venue_id is required']);
                break;
            }
            echo $facultyStaff->updateVenueReschedule($reservation_venue_id, $reservation_change_venue_id);
            break;

        case "updateVehicleReschedule":
            $reservation_vehicle_id = $input['reservation_vehicle_id'] ?? ($_POST['reservation_vehicle_id'] ?? null);
            $reservation_change_vehicle_id = $input['reservation_change_vehicle_id'] ?? ($_POST['reservation_change_vehicle_id'] ?? null);
            if ($reservation_vehicle_id === null) {
                echo json_encode(['status' => 'error', 'message' => 'reservation_vehicle_id is required']);
                break;
            }
            echo $facultyStaff->updateVehicleReschedule($reservation_vehicle_id, $reservation_change_vehicle_id);
            break;
        case 'fetchDeansApproval':
            if (!$reservationId) {
                echo json_encode(['status' => 'error', 'message' => 'Reservation ID is required']);
                break;
            }
            echo $facultyStaff->fetchDeansApproval($reservationId);
            break;
        case 'fetchMyReservation':
            if (!$userId) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            echo $facultyStaff->fetchMyReservation($userId);
            break;
        case 'fetchMyReservationbyId':
            if(!$reservationId = $input['reservationId'] ?? null) {
                echo json_encode(['status' => 'error', 'message' => 'Reservation ID is required']);
                break;
            }
            echo $facultyStaff->fetchMyReservationById($reservationId);
            break;
        case 'fetchStatusById':
            if(!$reservationId = $input['reservationId'] ?? null) {
                echo json_encode(['status' => 'error', 'message' => 'Reservation ID is required']);
                break;
            }
            echo $facultyStaff->fetchStatusById($reservationId);
            break;
        case 'displayedMaintenanceResources':
            if(!$reservationId = $input['reservationId'] ?? null) {
                echo json_encode(['status' => 'error', 'message' => 'Reservation ID is required']);
                break;
            }
            echo $facultyStaff->displayedMaintenanceResources($reservationId);
            break;
        case 'fetchMyActiveReservation':
            if (!$userId) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            echo $facultyStaff->fetchMyActiveReservation($userId);
            break;
        case 'fetchNotification':
            if (!$userId) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            echo $facultyStaff->fetchNotification($userId);
            break;
        case 'updateReadNotification':
            if(!$notificationIds = $input['notificationIds'] ?? null) {
                echo json_encode(['status' => 'error', 'message' => 'Notification IDs are required']);
                break;
            }
            echo $facultyStaff->updateReadNotification($notificationIds, $userId);
            break;
        case 'updateReschedule':
            $reservationId = $input['reservationId'] ?? null;
            // Accept either explicit active (1 or -1) or confirm boolean/string
            $active = null;
            if (isset($input['active'])) {
                $active = (int)$input['active'];
            } elseif (isset($input['confirm'])) {
                $confirm = $input['confirm'];
                // Handle boolean, numeric, or string values
                $truthy = [true, 1, '1', 'true', 'TRUE', 'confirm', 'CONFIRM', 'yes', 'YES'];
                $active = in_array($confirm, $truthy, true) ? 1 : -1;
            }
            if (!$reservationId || !in_array($active, [1, -1], true)) {
                echo json_encode(['status' => 'error', 'message' => 'reservationId and active (1 or -1) or confirm flag are required']);
                break;
            }
            echo $facultyStaff->updateReschedule((int)$reservationId, (int)$active, $userId !== null ? (int)$userId : null);
            break;
            case 'venuereservation':
                try {
                    // Validate required fields for venue
                    if (!isset($input['form_data']['title']) || 
                        !isset($input['form_data']['description']) || 
                        !isset($input['form_data']['start_date']) || 
                        !isset($input['form_data']['end_date']) || 
                        !isset($input['form_data']['user_id']) ||
                        !isset($input['form_data']['venues']) ||
                        !isset($input['form_data']['equipment'])) {
                        throw new Exception('Missing required fields for venue reservation');
                    }
    
                    // Validate venues array (now expects array of objects with venue_id and participants)
                    if (!is_array($input['form_data']['venues'])) {
                        throw new Exception('Venues must be an array');
                    }
                    
                    // Validate each venue has required fields
                    foreach ($input['form_data']['venues'] as $venue) {
                        if (is_array($venue)) {
                            // New format: {venue_id: X, participants: Y}
                            if (!isset($venue['venue_id'])) {
                                throw new Exception('Each venue must have a venue_id');
                            }
                            if (!isset($venue['participants']) || $venue['participants'] <= 0) {
                                throw new Exception('Each venue must have a valid participant count');
                            }
                        }
                        // Old format (just venue ID) is also accepted for backward compatibility
                    }
    
                    // Validate equipment array structure
                    if (!is_array($input['form_data']['equipment'])) {
                        throw new Exception('Equipment must be an array');
                    }
    
                    foreach ($input['form_data']['equipment'] as $equipment) {
                        if (!isset($equipment['equipment_id']) || !isset($equipment['quantity'])) {
                            throw new Exception('Each equipment must have equipment_id and quantity');
                        }
                    }
            
                    $input['form_data']['type'] = 'venue';
                    $reservationResult = $facultyStaff->createReservation($input['form_data'], 'venue');
                    echo json_encode($reservationResult);
                    
                } catch (Exception $e) {
                    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
                }
                break;
    
            case 'vehiclereservation':
            case 'vehicleReservation':
                try {
                    // Validate required fields for vehicle
                    if (!isset($input['form_data']['destination']) || 
                        !isset($input['form_data']['purpose']) || 
                        !isset($input['form_data']['start_date']) || 
                        !isset($input['form_data']['end_date']) || 
                        !isset($input['form_data']['user_id']) ||
                        !isset($input['form_data']['vehicles']) ||
                        !isset($input['form_data']['passengers'])) {
                        throw new Exception('Missing required fields for vehicle reservation');
                    }
    
                    // Validate arrays
                    if (!is_array($input['form_data']['vehicles'])) {
                        throw new Exception('Vehicles must be an array');
                    }
    
                    if (!is_array($input['form_data']['passengers'])) {
                        throw new Exception('Passengers must be an array');
                    }
    
                    // Validate equipment array if present
                    if (isset($input['form_data']['equipment'])) {
                        if (!is_array($input['form_data']['equipment'])) {
                            throw new Exception('Equipment must be an array');
                        }
                        foreach ($input['form_data']['equipment'] as $equipment) {
                            if (!isset($equipment['equipment_id']) || !isset($equipment['quantity'])) {
                                throw new Exception('Each equipment must have equipment_id and quantity');
                            }
                        }
                    }
            
                    $input['form_data']['type'] = 'vehicle';
                    $reservationResult = $facultyStaff->createReservation($input['form_data'], 'vehicle');
                    echo json_encode($reservationResult);
                    
                } catch (Exception $e) {
                    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
                }
                break;
    
            case 'equipmentreservation':
                try {
                    // Validate required fields for equipment
                    if (!isset($input['form_data']['title']) || 
                        !isset($input['form_data']['description']) || 
                        !isset($input['form_data']['start_date']) || 
                        !isset($input['form_data']['end_date']) || 
                        !isset($input['form_data']['user_id']) ||
                        !isset($input['form_data']['equipment'])) {
                        throw new Exception('Missing required fields for equipment reservation');
                    }
    
                    // Validate equipment array structure
                    if (!is_array($input['form_data']['equipment'])) {
                        throw new Exception('Equipment must be an array');
                    }
    
                    foreach ($input['form_data']['equipment'] as $equipment) {
                        if (!isset($equipment['equipment_id']) || !isset($equipment['quantity'])) {
                            throw new Exception('Each equipment must have equipment_id and quantity');
                        }
                    }
    
                    $input['form_data']['type'] = 'equipment';
                    $reservationResult = $facultyStaff->createReservation($input['form_data'], 'equipment');
                    echo json_encode($reservationResult);
                    
                } catch (Exception $e) {
                    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
                }
                break;
    
            case "updateNotification":
                if (isset($input['notification_id'])) {
                    $updateResponse = $facultyStaff->updateNotification($input['notification_id']);
                    echo json_encode($updateResponse);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Missing notification ID.']);
                }
                break;
            case "deanApproval":
                if (isset($input['dept_id'], $input['reservation_id'], $input['is_approved'])) {
                    $approvalResponse = $reservation->insertApproval(
                        $input['dept_id'], // Changed from dean_id to dept_id
                        $input['reservation_id'],
                        $input['is_approved']
                    );
                    echo json_encode($approvalResponse);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Missing required fields for approval.']);
                }
                break;
            case "autoCancelExpiredReschedules":
                echo $facultyStaff->autoCancelExpiredReschedules();
                break;
            default:
                echo json_encode([
                    'status' => 'error', 
                    'message' => 'Invalid operation: ' . $input['operation'],
                    'valid_operations' => ['venuereservation', 'vehicleReservation', 'vehiclereservation', 'equipmentreservation', 'autoCancelExpiredReschedules']
                ]);
                break;
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    }
}
?>
