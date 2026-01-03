<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class Vehicle {
    private $conn;

    public function __construct() {
        include 'connection-pdo.php';
        $this->conn = $conn;
    }

    // Fetch priorities list
    public function fetchPriorities() {
        try {
            $sql = "SELECT priority_id, priority_name, priority_order FROM tblpriority ORDER BY priority_order ASC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['status' => 'success', 'data' => $rows]);
            return;
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            return;
        }
    }

    // Create job order and assign personnel with priority
    public function assignPersonnelWithPriority($data) {
        try {
            // basic validation
            $required = ['job_complaintId', 'job_title', 'job_description', 'job_priority', 'job_createdBy'];
            foreach ($required as $r) {
                if (!isset($data[$r])) {
                    echo json_encode(['status' => 'error', 'message' => "Missing field: $r"]);
                    return;
                }
            }

            $createDate = isset($data['job_createDate']) ? $data['job_createDate'] : date('Y-m-d H:i:s');

            date_default_timezone_set('Asia/Manila');
            $createDate = isset($data['job_createDate']) ? $data['job_createDate'] : date('Y-m-d H:i:s');

            $this->conn->beginTransaction();

            $sql = "INSERT INTO tbljoborders (job_complaintId, job_title, job_description, job_priority, job_createdBy, job_createDate) VALUES (:complaintId, :title, :description, :priority, :createdBy, :createDate)";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':complaintId' => $data['job_complaintId'],
                ':title' => $data['job_title'],
                ':description' => $data['job_description'],
                ':priority' => $data['job_priority'],
                ':createdBy' => $data['job_createdBy'],
                ':createDate' => $createDate
            ]);

            $job_id = $this->conn->lastInsertId();
            if (!$job_id) {
                throw new Exception('Failed to create job order');
            }

            // Accept single user id or an array of user ids
            $personnel = [];
            if (isset($data['personnel_userIds']) && is_array($data['personnel_userIds'])) {
                $personnel = $data['personnel_userIds'];
            } elseif (isset($data['personnel_userId'])) {
                $personnel = [$data['personnel_userId']];
            } elseif (isset($data['joPersonnel_userId'])) {
                $personnel = [$data['joPersonnel_userId']];
            } else {
                // No personnel provided; roll back and error
                throw new Exception('No personnel supplied to assign');
            }

            $insertPersonnelSql = "INSERT INTO tbljoborderpersonnel (joPersonnel_userId, joPersonnel_joId) VALUES (:userId, :joId)";
            $pstmt = $this->conn->prepare($insertPersonnelSql);

            foreach ($personnel as $userId) {
                $pstmt->execute([
                    ':userId' => $userId,
                    ':joId' => $job_id
                ]);
            }

            $this->conn->commit();

            echo json_encode(['status' => 'success', 'message' => 'Job created and personnel assigned', 'job_id' => $job_id]);
            return;
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            return;
        }
    }

    // Create job order, assign personnel, and add comment (or default comment)
    public function createJobOrder($data) {
        try {
            if (!isset($data['complaint_id'])) {
                echo json_encode(['status' => 'error', 'message' => 'Missing field: complaint_id']);
                return;
            }

            $complaintId = $data['complaint_id'];
            $priorityId = isset($data['priority_id']) ? $data['priority_id'] : null;
            $personnel = [];
            if (isset($data['personnel_id'])) {
                // accept comma-separated or single
                if (is_array($data['personnel_id'])) {
                    $personnel = $data['personnel_id'];
                } else {
                    $personnel = array_map('trim', explode(',', $data['personnel_id']));
                }
            }
            
            $remarks = isset($data['remarks']) ? $data['remarks'] : '';
            $targetEndDate = isset($data['target_end_date']) ? $data['target_end_date'] : null;

            // Fetch complaint subject and description for job title/description
            $compStmt = $this->conn->prepare("SELECT comp_subject, comp_description FROM tblcomplaints WHERE comp_id = :compId");
            $compStmt->execute([':compId' => $complaintId]);
            $compRow = $compStmt->fetch(PDO::FETCH_ASSOC);
            if (!$compRow) {
                throw new Exception('Complaint not found for given complaint_id');
            }

            $jobTitle = $compRow['comp_subject'];
            $jobDescription = $compRow['comp_description'];
            $jobCreatedBy = isset($data['createdBy']) ? $data['createdBy'] : (count($personnel) ? $personnel[0] : null);
            date_default_timezone_set('Asia/Manila');
            $jobCreateDate = date('Y-m-d H:i:s');

            $this->conn->beginTransaction();

            $sql = "INSERT INTO tbljoborders (job_complaintId, job_title, job_description, job_priority, job_createdBy, job_createDate) VALUES (:complaintId, :title, :description, :priority, :createdBy, :createDate)";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':complaintId' => $complaintId,
                ':title' => $jobTitle,
                ':description' => $jobDescription,
                ':priority' => $priorityId,
                ':createdBy' => $jobCreatedBy,
                ':createDate' => $jobCreateDate
            ]);

            $job_id = $this->conn->lastInsertId();
            if (!$job_id) {
                throw new Exception('Failed to create job order');
            }

            // assign personnel if provided
            if (count($personnel) > 0) {
                $insertPersonnelSql = "INSERT INTO tbljoborderpersonnel (joPersonnel_userId, joPersonnel_joId) VALUES (:userId, :joId)";
                $pstmt = $this->conn->prepare($insertPersonnelSql);
                foreach ($personnel as $userId) {
                    $pstmt->execute([
                        ':userId' => $userId,
                        ':joId' => $job_id
                    ]);
                }
            }

            // handle comment
            $commentText = '';
            $commentUserId = null;
            if (isset($data['comment']) && trim($data['comment']) !== '') {
                $commentText = $data['comment'];
                // if comment user provided use it, else use first personnel if available
                $commentUserId = isset($data['comment_userId']) ? $data['comment_userId'] : (count($personnel) ? $personnel[0] : null);
            } else {
                $commentText = 'Hi Maam/Sir! A job order has been created for this ticket. A GSD personnel is going to contact you soon!';
                $commentUserId = null;
            }

            $insertCommentSql = "INSERT INTO tblcomments (comment_complaintId, comment_userId, comment_commentText, comment_commentImage, comment_date) VALUES (:complaintId, :userId, :text, :image, :date)";
            $cstmt = $this->conn->prepare($insertCommentSql);
            $cstmt->execute([
                ':complaintId' => $complaintId,
                ':userId' => $commentUserId,
                ':text' => $commentText,
                ':image' => isset($data['comment_image']) ? $data['comment_image'] : null,
                ':date' => date('Y-m-d H:i:s')
            ]);

            // Insert status history: set complaint status to 2 (e.g., In Progress) with who updated it
            // Use the actor creating the job if provided; fallback to comment user or jobCreatedBy
            $updatedBy = isset($data['comment_userId']) && !empty($data['comment_userId'])
                ? $data['comment_userId']
                : (isset($data['createdBy']) && !empty($data['createdBy'])
                    ? $data['createdBy']
                    : $jobCreatedBy);

            $histSql = "INSERT INTO tblcomplaint_status_history (history_compId, history_statusId, history_updatedBy, history_date) VALUES (:compId, :statusId, :updatedBy, :date)";
            $hstmt = $this->conn->prepare($histSql);
            $hstmt->execute([
                ':compId' => $complaintId,
                ':statusId' => 2,
                ':updatedBy' => $updatedBy,
                ':date' => date('Y-m-d H:i:s')
            ]);

            $this->conn->commit();

            echo json_encode(['status' => 'success', 'message' => 'Job order created', 'job_id' => $job_id]);
            return;

        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            return;
        }
    }

    // Fetch comprehensive complaint report with personnel and equipment
    public function getComplaintReportData($data) {
        try {
            $complaintId = isset($data['complaint_id']) ? $data['complaint_id'] : null;
            
            $sql = "
                SELECT 
                    c.comp_id,
                    c.comp_subject,
                    c.comp_description,
                    c.comp_date,
                    c.comp_end_date,
                    c.comp_date_closed,
                    c.comp_operation,
                    c.comp_remark,
                    c.comp_lastUser,
                    c.comp_closedBy,
                    c.comp_clientId,
                    l.location_name,
                    o.operation_name,
                    csh.history_date AS latest_status_date,
                    jos.joStatus_name AS latest_status,
                    jo.job_id,
                    jo.job_title,
                    jo.job_priority,
                    jo.job_createDate,
                    GROUP_CONCAT(DISTINCT jp.joPersonnel_userId) AS personnel_ids,
                    GROUP_CONCAT(DISTINCT eq.equip_name) AS equipments_used
                FROM tblcomplaints c
                LEFT JOIN tbllocation l ON c.comp_locationId = l.location_id
                LEFT JOIN tbloperation o ON c.comp_operation = o.operation_id
                LEFT JOIN tbljoborders jo ON c.comp_id = jo.job_complaintId
                LEFT JOIN tbljoborderpersonnel jp ON jo.job_id = jp.joPersonnel_joId
                LEFT JOIN tbljobequipment je ON jo.job_id = je.joEquipment_equipId OR jp.joPersonnel_id = je.joEquipment_personnelId
                LEFT JOIN tbl_equipments eq ON je.joEquipment_equipId = eq.equip_id
                LEFT JOIN tblcomplaint_status_history csh ON c.comp_id = csh.history_compId
                LEFT JOIN tbljoborderstatus jos ON csh.history_statusId = jos.joStatus_id
                WHERE c.comp_id = :complaintId
                AND (csh.history_id = (
                    SELECT MAX(history_id) 
                    FROM tblcomplaint_status_history 
                    WHERE history_compId = c.comp_id
                ) OR csh.history_id IS NULL)
                GROUP BY c.comp_id, jo.job_id
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':complaintId' => $complaintId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                // Fetch personnel details
                $personnelIds = $result['personnel_ids'] ? explode(',', $result['personnel_ids']) : [];
                $personnelList = [];
                
                if (!empty($personnelIds)) {
                    $placeholders = implode(',', array_fill(0, count($personnelIds), '?'));
                    $personSql = "SELECT users_id as user_id, CONCAT(users_fname, ' ', users_lname) as user_name, users_email as user_email FROM tbl_users WHERE users_id IN ($placeholders)";
                    $personStmt = $this->conn->prepare($personSql);
                    $personStmt->execute($personnelIds);
                    $personnelList = $personStmt->fetchAll(PDO::FETCH_ASSOC);
                }
                
                // Fetch submitted by user details
                $submittedBy = null;
                if ($result['comp_lastUser']) {
                    $submittedByStmt = $this->conn->prepare("SELECT users_id as user_id, CONCAT(users_fname, ' ', users_lname) as user_name, users_email as user_email FROM tbl_users WHERE users_id = :userId");
                    $submittedByStmt->execute([':userId' => $result['comp_lastUser']]);
                    $submittedBy = $submittedByStmt->fetch(PDO::FETCH_ASSOC);
                }
                
                // Fetch client details
                $clientInfo = null;
                if ($result['comp_clientId']) {
                    $clientStmt = $this->conn->prepare("SELECT users_id as user_id, CONCAT(users_fname, ' ', users_lname) as client_name, users_email as client_email FROM tbl_users WHERE users_id = :clientId");
                    $clientStmt->execute([':clientId' => $result['comp_clientId']]);
                    $clientInfo = $clientStmt->fetch(PDO::FETCH_ASSOC);
                }
                
                $reportData = [
                    'complaint_id' => $result['comp_id'],
                    'subject' => $result['comp_subject'],
                    'description' => $result['comp_description'],
                    'location_name' => $result['location_name'],
                    'operation_name' => $result['operation_name'],
                    'personnel_assigned' => $personnelList,
                    'equipments_used' => $result['equipments_used'] ? explode(',', $result['equipments_used']) : [],
                    'submitted_by' => $submittedBy,
                    'client_info' => $clientInfo,
                    'latest_status' => $result['latest_status'],
                    'latest_status_date' => $result['latest_status_date'],
                    'complaint_date' => $result['comp_date'],
                    'complaint_end_date' => $result['comp_end_date'],
                    'complaint_closed_date' => $result['comp_date_closed'],
                    'job_id' => $result['job_id'],
                    'job_title' => $result['job_title'],
                    'job_priority' => $result['job_priority'],
                    'job_create_date' => $result['job_createDate'],
                    'remark' => $result['comp_remark']
                ];
                
                echo json_encode(['status' => 'success', 'data' => $reportData]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Complaint not found']);
            }
            return;
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            return;
        }
    }

    // Fetch all complaints with report data for listing
    public function getComplaintReportList($data) {
        try {
            $limit = isset($data['limit']) ? (int)$data['limit'] : 10;
            $offset = isset($data['offset']) ? (int)$data['offset'] : 0;
            $start_date = isset($data['start_date']) ? $data['start_date'] : null;
            $end_date = isset($data['end_date']) ? $data['end_date'] : null;
            
            // Build WHERE clause with optional date range
            $dateCondition = '';
            if ($start_date && $end_date) {
                $dateCondition = " AND DATE(c.comp_date) >= :start_date AND DATE(c.comp_date) <= :end_date";
            }
            
            $sql = "
                SELECT 
                    c.comp_id,
                    c.comp_subject,
                    c.comp_date,
                    c.comp_clientId,
                    l.location_name,
                    o.operation_name,
                    csh.history_date AS latest_status_date,
                    jos.joStatus_name AS latest_status,
                    GROUP_CONCAT(DISTINCT jp.joPersonnel_userId) AS personnel_ids,
                    GROUP_CONCAT(DISTINCT eq.equip_name) AS equipments_used,
                    CONCAT(u.users_fname, ' ', u.users_lname) AS submitted_by,
                    CONCAT(cl.users_fname, ' ', cl.users_lname) AS client_name
                FROM tblcomplaints c
                LEFT JOIN tbllocation l ON c.comp_locationId = l.location_id
                LEFT JOIN tbloperation o ON c.comp_operation = o.operation_id
                LEFT JOIN tbljoborders jo ON c.comp_id = jo.job_complaintId
                LEFT JOIN tbljoborderpersonnel jp ON jo.job_id = jp.joPersonnel_joId
                LEFT JOIN tbljobequipment je ON jo.job_id = je.joEquipment_equipId OR jp.joPersonnel_id = je.joEquipment_personnelId
                LEFT JOIN tbl_equipments eq ON je.joEquipment_equipId = eq.equip_id
                LEFT JOIN tblcomplaint_status_history csh ON c.comp_id = csh.history_compId AND csh.history_id = (
                    SELECT MAX(history_id) 
                    FROM tblcomplaint_status_history 
                    WHERE history_compId = c.comp_id
                )
                LEFT JOIN tbljoborderstatus jos ON csh.history_statusId = jos.joStatus_id
                LEFT JOIN tbl_users u ON c.comp_lastUser = u.users_id
                LEFT JOIN tbl_users cl ON c.comp_clientId = cl.users_id
                WHERE c.comp_id IS NOT NULL
                {$dateCondition}
                GROUP BY c.comp_id
                ORDER BY c.comp_date DESC
                LIMIT :limit OFFSET :offset
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            // Bind date parameters if provided
            if ($start_date && $end_date) {
                $stmt->bindValue(':start_date', $start_date);
                $stmt->bindValue(':end_date', $end_date);
            }
            
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get total count with date filter if applied
            $countSql = "SELECT COUNT(DISTINCT c.comp_id) as total FROM tblcomplaints c WHERE c.comp_id IS NOT NULL{$dateCondition}";
            $countStmt = $this->conn->prepare($countSql);
            
            if ($start_date && $end_date) {
                $countStmt->bindValue(':start_date', $start_date);
                $countStmt->bindValue(':end_date', $end_date);
            }
            
            $countStmt->execute();
            $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);
            $total = $countResult['total'];
            
            echo json_encode([
                'status' => 'success',
                'data' => $results,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);
            return;
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            return;
        }
    }

    public function getComplaintStatusHistory($data) {
        try {
            $complaint_id = isset($data['complaint_id']) ? (int)$data['complaint_id'] : null;
            
            if (!$complaint_id) {
                echo json_encode(['status' => 'error', 'message' => 'Complaint ID is required']);
                return;
            }
            
            $sql = "
                SELECT 
                    csh.history_id,
                    csh.history_compId,
                    csh.history_statusId,
                    csh.history_updatedBy,
                    csh.history_date,
                    jos.joStatus_name AS status_name,
                    CONCAT(u.users_fname, ' ', u.users_lname) AS updated_by_name
                FROM tblcomplaint_status_history csh
                LEFT JOIN tbljoborderstatus jos ON csh.history_statusId = jos.joStatus_id
                LEFT JOIN tbl_users u ON csh.history_updatedBy = u.users_id
                WHERE csh.history_compId = :complaint_id
                ORDER BY csh.history_date ASC
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':complaint_id', $complaint_id, PDO::PARAM_INT);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success',
                'data' => $results
            ]);
            return;
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            return;
        }
    }

   
}

// Handle incoming requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $vehicle = new Vehicle();
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['operation'])) {
        switch ($data['operation']) {

            case 'assign_personnel_priority':
                $vehicle->assignPersonnelWithPriority($data);
                break;

            case 'createJobOrder':
                $vehicle->createJobOrder($data);
                break;
            case 'fetchPriorities':
                $vehicle->fetchPriorities();
                break;
            case 'getComplaintReportData':
                $vehicle->getComplaintReportData($data);
                break;
            case 'getComplaintReportList':
                $vehicle->getComplaintReportList($data);
                break;
            case 'getComplaintStatusHistory':
                $vehicle->getComplaintStatusHistory($data);
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