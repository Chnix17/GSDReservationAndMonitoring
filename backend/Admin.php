<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS, GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// At the top of the file, after other use/require/include statements:f

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



    public function fetchUsers() {
        $sql = "SELECT 
                    u.users_id,
                    u.users_fname,
                    u.users_mname,
                    u.users_lname,
                    u.users_email,
                    u.users_school_id,
                    u.users_contact_number,
                    u.users_department_id,
                    u.users_password,
                    u.users_pic,
                    u.users_created_at,
                    u.users_updated_at,
                    u.is_active,
                    d.departments_name,
                    ul.user_level_name,
                    ul.user_level_desc
                FROM 
                    tbl_users u
                LEFT JOIN 
                    tbl_departments d ON u.users_department_id = d.departments_id
                LEFT JOIN 
                    tbl_user_level ul ON u.users_user_level_id = ul.user_level_id";
        return $this->executeQuery($sql);
    }


    public function fetchAllVehicles() {
    $sql = "
        SELECT  
            v.vehicle_id,
            v.vehicle_license,
            v.year,
            v.vehicle_pic,
            v.is_active,
            v.created_at,

            -- Only names
            vmk.vehicle_make_name,
            vmd.vehicle_model_name,
            vc.vehicle_category_name,
            sa.status_availability_name

        FROM tbl_vehicle v
        INNER JOIN tbl_vehicle_model vmd 
            ON v.vehicle_model_id = vmd.vehicle_model_id
        INNER JOIN tbl_vehicle_make vmk 
            ON vmd.vehicle_model_vehicle_make_id = vmk.vehicle_make_id
        INNER JOIN tbl_vehicle_category vc 
            ON vmd.vehicle_category_id = vc.vehicle_category_id
        INNER JOIN tbl_status_availability sa 
            ON v.status_availability_id = sa.status_availability_id
                  WHERE v.is_active = 1
          ORDER BY v.vehicle_id DESC
    ";

    return $this->executeQuery($sql);
}



    public function fetchCategoriesAndModels($makeId) {
        
        $categoriesSql = "SELECT DISTINCT vc.vehicle_category_id, vc.vehicle_category_name 
                          FROM tbl_vehicle_category vc
                          INNER JOIN tbl_vehicle_model vm ON vc.vehicle_category_id = vm.vehicle_category_id
                          WHERE vm.vehicle_model_vehicle_make_id = :makeId
                          ORDER BY vc.vehicle_category_name";

        $modelsSql = "SELECT vehicle_model_name, vehicle_category_id, vehicle_model_id
                      FROM tbl_vehicle_model 
                      WHERE vehicle_model_vehicle_make_id = :makeId 
                      ORDER BY vehicle_model_name";

        try {
            $this->conn->beginTransaction();

            // Fetch categories
            $stmtCategories = $this->conn->prepare($categoriesSql);
            $stmtCategories->execute([':makeId' => $makeId]);
            $categories = $stmtCategories->fetchAll(PDO::FETCH_ASSOC);

            // Fetch models
            $stmtModels = $this->conn->prepare($modelsSql);
            $stmtModels->execute([':makeId' => $makeId]);
            $models = $stmtModels->fetchAll(PDO::FETCH_ASSOC);

            $this->conn->commit();

            // Group models by category
            $modelsByCategory = [];
            foreach ($models as $model) {
                $categoryId = $model['vehicle_category_id'];
                $modelsByCategory[$categoryId][] = [
                    'vehicle_model_id' => $model['vehicle_model_id'],
                    'vehicle_model_name' => $model['vehicle_model_name']
                ];
            }

            return json_encode([
                'status' => 'success',
                'data' => [
                    'categories' => $categories,
                    'modelsByCategory' => $modelsByCategory
                ]
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function fetchCategories() {
        $sql = "SELECT 
                    equipments_category_id, 
                    equipments_category_name 
                FROM 
                    tbl_equipment_category 
                ORDER BY 
                    equipments_category_name";
        return $this->executeQuery($sql);
    }

    public function fetchEquipmentsByCategory($categoryId) {
        $sql = "SELECT 
                    equip_id, 
                    equip_name, 
                    equip_quantity, 
                    equip_created_at, 
                    equip_updated_at, 
                    status_availability_id, 
                    equipment_equipment_category_id 
                FROM 
                    tbl_equipments 
                WHERE 
                    equipment_equipment_category_id = :categoryId";

        return $this->executeQuery($sql, [':categoryId' => $categoryId]);
    }

    public function fetchVenue() {
        $sql = "SELECT 
                v.ven_id, v.ven_name, v.ven_occupancy, v.ven_created_at, v.ven_updated_at, v.status_availability_id, v.ven_minimum ,
                v.ven_pic, v.is_active, v.event_type, v.area_type, v.venue_building_id,
                vb.venue_building_name
                FROM tbl_venue v
                LEFT JOIN tbl_venue_building vb ON v.venue_building_id = vb.venue_building_id
                WHERE v.is_active = 1 ORDER BY v.ven_id DESC";
        return $this->executeQuery($sql);
    }

    public function fetchVenueBuildings() {
        $sql = "SELECT venue_building_id, venue_building_name, venue_added_by, is_active FROM tbl_venue_building WHERE is_active = 1 ORDER BY venue_building_id DESC";
        return $this->executeQuery($sql);
    }

    /**
     * Fetch location categories
     * Expected table: tbllocationcategory with fields locCateg_id, locCateg_name
     */
    public function fetchLocationCategory() {
        $sql = "SELECT `locCateg_id`, `locCateg_name` FROM `tbllocationcategory` WHERE 1 ORDER BY locCateg_name";
        return $this->executeQuery($sql);
    }

    /**
     * Fetch locations
     * Expected table: tbllocation with fields location_id, location_name, location_categoryId
     */
    public function fetchLocation() {
        $sql = "SELECT l.location_id, l.location_name, l.location_categoryId, 
                       lc.locCateg_name AS locCateg_name, lc.locCateg_name AS location_categoryname
                FROM tbllocation l
                LEFT JOIN tbllocationcategory lc ON l.location_categoryId = lc.locCateg_id
                ORDER BY l.location_id DESC";
        return $this->executeQuery($sql);
    }

    /**
     * Update an existing location
     * Expects $data with: location_id, location_name, location_categoryId (optional), userid (optional)
     */
    public function updateLocation($data) {
        try {
            if (is_string($data)) $data = json_decode($data, true);
            if (!is_array($data)) return json_encode(['status' => 'error', 'message' => 'Invalid input data']);

            $id = isset($data['location_id']) ? (int)$data['location_id'] : 0;
            $name = isset($data['location_name']) ? trim($data['location_name']) : '';
            $categoryId = isset($data['location_categoryId']) && $data['location_categoryId'] !== '' ? (int)$data['location_categoryId'] : null;
            $userId = isset($data['userid']) ? $data['userid'] : null;

            if ($id <= 0) return json_encode(['status' => 'error', 'message' => 'location_id is required']);
            if ($name === '') return json_encode(['status' => 'error', 'message' => 'location_name is required']);

            // Check duplicate name excluding current id
            $checkSql = "SELECT COUNT(*) FROM tbllocation WHERE LOWER(TRIM(location_name)) = LOWER(TRIM(:name)) AND location_id != :id";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->execute([':name' => $name, ':id' => $id]);
            if ($checkStmt->fetchColumn() > 0) {
                return json_encode(['status' => 'error', 'message' => 'Another location with same name exists']);
            }

            $sql = "UPDATE tbllocation SET location_name = :name, location_categoryId = :categoryId WHERE location_id = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $name, PDO::PARAM_STR);
            if ($categoryId !== null) {
                $stmt->bindValue(':categoryId', $categoryId, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(':categoryId', null, PDO::PARAM_NULL);
            }
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                // audit
                try {
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:desc, 'UPDATE LOCATION', NOW(), :createdBy)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = 'Updated Location #' . $id . ': ' . $name;
                    $audit->bindParam(':desc', $desc);
                    if ($userId !== null) {
                        $audit->bindValue(':createdBy', (int)$userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':createdBy', null, PDO::PARAM_NULL);
                    }
                    $audit->execute();
                } catch (Exception $e) { /* ignore audit errors */ }

                return json_encode(['status' => 'success', 'message' => 'Location updated']);
            }

            return json_encode(['status' => 'error', 'message' => 'Failed to update location']);
        } catch (PDOException $e) {
            error_log('updateLocation DB error: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        } catch (Exception $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * Create a new location
     * Expects $data array with keys: location_name, location_categoryId, userid (optional)
     */
    public function createLocation($data) {
        try {
            if (is_string($data)) $data = json_decode($data, true);
            if (!is_array($data)) return json_encode(['status' => 'error', 'message' => 'Invalid input data']);

            $name = isset($data['location_name']) ? trim($data['location_name']) : '';
            $categoryId = isset($data['location_categoryId']) ? $data['location_categoryId'] : null;
            $userId = isset($data['userid']) ? $data['userid'] : null;

            if ($name === '') {
                return json_encode(['status' => 'error', 'message' => 'Location name is required']);
            }

            // Optional: prevent duplicates (case-insensitive)
            $checkSql = "SELECT COUNT(*) FROM tbllocation WHERE LOWER(TRIM(location_name)) = LOWER(TRIM(:name))";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->execute([':name' => $name]);
            if ($checkStmt->fetchColumn() > 0) {
                return json_encode(['status' => 'error', 'message' => 'Location already exists']);
            }

            // Insert only fields that are present in the tbllocation schema
            $sql = "INSERT INTO tbllocation (location_name, location_categoryId) VALUES (:name, :categoryId)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $name, PDO::PARAM_STR);
            if ($categoryId !== null && $categoryId !== '') {
                $stmt->bindValue(':categoryId', (int)$categoryId, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(':categoryId', null, PDO::PARAM_NULL);
            }

            if ($stmt->execute()) {
                $id = $this->conn->lastInsertId();
                // non-blocking audit (created_by may be absent in tbllocation but audit_log can record creator)
                try {
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:desc, 'CREATE LOCATION', NOW(), :createdBy)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = 'Created Location: ' . $name;
                    $audit->bindParam(':desc', $desc);
                    if ($userId !== null) {
                        $audit->bindValue(':createdBy', (int)$userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':createdBy', null, PDO::PARAM_NULL);
                    }
                    $audit->execute();
                } catch (Exception $e) { /* ignore audit errors */ }

                return json_encode(['status' => 'success', 'message' => 'Location created', 'location_id' => $id]);
            }

            return json_encode(['status' => 'error', 'message' => 'Failed to create location']);
        } catch (PDOException $e) {
            error_log('createLocation DB error: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        } catch (Exception $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function fetchInactiveBuilding() {
        $sql = "SELECT venue_building_id, venue_building_name, venue_added_by FROM tbl_venue_building WHERE is_active = 0 ORDER BY venue_building_id DESC";
        return $this->executeQuery($sql);
    }

    public function fetchBuildingById($id) {
        $sql = "SELECT venue_building_id, venue_building_name, venue_added_by, is_active FROM tbl_venue_building WHERE venue_building_id = :id";
        return $this->executeQuery($sql, [':id' => $id]);
    }

    public function buildingExists($buildingName) {
        $sql = "SELECT COUNT(*) as count FROM tbl_venue_building WHERE LOWER(venue_building_name) = LOWER(:name)";
        $result = $this->executeQuery($sql, [':name' => trim($buildingName)]);
        if ($result) {
            $data = json_decode($result, true);
            return isset($data['data'][0]['count']) && $data['data'][0]['count'] > 0;
        }
        return false;
    }

    public function saveBuilding($data) {
        try {
            if (!isset($data['user_admin_id'])) {
                return json_encode(['status' => 'error', 'message' => 'Admin ID is required']);
            }
            if (!isset($data['building_name']) || trim($data['building_name']) === '') {
                return json_encode(['status' => 'error', 'message' => 'Building name is required']);
            }
            if ($this->buildingExists($data['building_name'])) {
                return json_encode(['status' => 'error', 'message' => 'This building name already exists.']);
            }

            $sql = "INSERT INTO tbl_venue_building (venue_building_name, venue_added_by) VALUES (:name, :admin_id)";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $data['building_name'], PDO::PARAM_STR);
            $stmt->bindParam(':admin_id', $data['user_admin_id'], PDO::PARAM_INT);

            if ($stmt->execute()) {
                $buildingId = $this->conn->lastInsertId();
                // Audit log
                try {
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = "Created Building: " . $data['building_name'];
                    $action = 'CREATE';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    $audit->bindParam(':created_by', $data['user_admin_id'], PDO::PARAM_INT);
                    $audit->execute();
                } catch (PDOException $e) {
                    error_log("Audit log insert failed (saveBuilding): " . $e->getMessage());
                }
                return json_encode(['status' => 'success', 'message' => 'Building added successfully', 'building_id' => $buildingId]);
            }

            return json_encode(['status' => 'error', 'message' => 'Failed to add building']);
        } catch(PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function updateBuilding($buildingData) {
        try {
            if (!isset($buildingData['building_id'], $buildingData['building_name'])) {
                return json_encode(['status' => 'error', 'message' => 'Missing required fields']);
            }

            // Check if building name already exists (excluding current building)
            $sql = "SELECT COUNT(*) as count FROM tbl_venue_building 
                    WHERE LOWER(venue_building_name) = LOWER(:name) AND venue_building_id != :id";
            $result = $this->executeQuery($sql, [
                ':name' => trim($buildingData['building_name']),
                ':id' => $buildingData['building_id']
            ]);
            
            if ($result) {
                $data = json_decode($result, true);
                if (isset($data['data'][0]['count']) && $data['data'][0]['count'] > 0) {
                    return json_encode(['status' => 'error', 'message' => 'This building name already exists.']);
                }
            }

            $sql = "UPDATE tbl_venue_building SET venue_building_name = :building_name WHERE venue_building_id = :building_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':building_name', $buildingData['building_name'], PDO::PARAM_STR);
            $stmt->bindParam(':building_id', $buildingData['building_id'], PDO::PARAM_INT);

            $success = $stmt->execute();
            if ($success) {
                // Audit logging
                try {
                    $actorId = null;
                    if (isset($buildingData['user_admin_id']) && $buildingData['user_admin_id'] !== '') {
                        $actorId = (int)$buildingData['user_admin_id'];
                    }

                    $buildingName = $buildingData['building_name'] ?? '';
                    $desc = 'Updated Building: ' . $buildingName;

                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $auditStmt = $this->conn->prepare($auditSql);
                    $auditStmt->execute([
                        ':description' => $desc,
                        ':action' => 'UPDATE BUILDING',
                        ':created_by' => $actorId
                    ]);
                } catch (Throwable $te) { /* ignore audit errors */ }

                return json_encode(['status' => 'success', 'message' => 'Building updated successfully']);
            } else {
                return json_encode(['status' => 'error', 'message' => 'Could not update building']);
            }
        } catch (PDOException $e) {
            error_log('Database error in updateBuilding: ' . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function archiveBuilding($buildingIds, $userId) {
        try {
            if (empty($buildingIds)) {
                return json_encode(['status' => 'error', 'message' => 'No building IDs provided']);
            }

            $buildingIds = is_array($buildingIds) ? $buildingIds : [$buildingIds];
            
            // Check if any building is being used by active venues
            $placeholders = implode(',', array_fill(0, count($buildingIds), '?'));
            $checkSql = "SELECT venue_building_id, 
                                GROUP_CONCAT(v.ven_name SEPARATOR ', ') as venue_names
                         FROM tbl_venue v
                         WHERE v.venue_building_id IN ($placeholders) 
                         AND v.is_active = 1
                         GROUP BY venue_building_id";
            
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->execute($buildingIds);
            $usedBuildings = $checkStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($usedBuildings)) {
                $errorMessages = [];
                foreach ($usedBuildings as $building) {
                    $errorMessages[] = "Building is used by active venues: " . $building['venue_names'];
                }
                return json_encode([
                    'status' => 'error', 
                    'message' => implode('; ', $errorMessages)
                ]);
            }

            // Proceed with deactivation
            $sql = "UPDATE tbl_venue_building SET is_active = 0 WHERE venue_building_id IN ($placeholders)";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($buildingIds);

            // Audit log
            try {
                foreach ($buildingIds as $buildingId) {
                    // Get building name
                    $nameSql = "SELECT venue_building_name FROM tbl_venue_building WHERE venue_building_id = ?";
                    $nameStmt = $this->conn->prepare($nameSql);
                    $nameStmt->execute([$buildingId]);
                    $buildingName = $nameStmt->fetchColumn();

                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = "Deactivated Building: " . $buildingName;
                    $action = 'DEACTIVATE BUILDING';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    $audit->bindParam(':created_by', $userId, PDO::PARAM_INT);
                    $audit->execute();
                }
            } catch (PDOException $e) {
                error_log("Audit log insert failed (archiveBuilding): " . $e->getMessage());
            }

            $count = count($buildingIds);
            $message = $count > 1 ? "$count buildings successfully deactivated" : "Building successfully deactivated";
            return json_encode(['status' => 'success', 'message' => $message]);
        } catch(PDOException $e) {
            error_log("Database error in archiveBuilding: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

public function fetchEquipmentsWithStatus() {
    try {
        $sql = "
            SELECT
                te.equip_id,
                te.equip_name,
                tec.equipments_category_name AS category_name,
                te.is_active,
                te.user_admin_id,
                te.equip_type,
                te.equip_created_at,
                -- Use quantity if available, else count units
                COALESCE(
                    (SELECT SUM(quantity) FROM tbl_equipment_quantity WHERE equip_id = te.equip_id),
                    (SELECT COUNT(*) FROM tbl_equipment_unit WHERE equip_id = te.equip_id AND is_active = 1)
                ) AS total_quantity
            FROM
                tbl_equipments AS te
            INNER JOIN
                tbl_equipment_category AS tec ON te.equipments_category_id = tec.equipments_category_id
            WHERE
                te.is_active = 1
            ORDER BY
                te.equip_id DESC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $equipments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return json_encode(['status' => 'success', 'data' => $equipments]);
    } catch (PDOException $e) {
        error_log("Database error in fetchEquipmentsWithStatus: " . $e->getMessage());
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    } catch (Exception $e) {
        error_log("Error in fetchEquipmentsWithStatus: " . $e->getMessage());
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

    

    public function fetchUserByEmailOrFullname($searchTerm) {
        $sql = "SELECT 
                    u.users_id,
                    TRIM(CONCAT(
                        CASE WHEN t.abbreviation IS NOT NULL AND t.abbreviation != '' THEN CONCAT(t.abbreviation, ' ') ELSE '' END,
                        u.users_fname,
                        CASE WHEN u.users_mname IS NOT NULL AND u.users_mname != '' THEN CONCAT(' ', u.users_mname) ELSE '' END,
                        ' ',
                        u.users_lname,
                        CASE WHEN u.users_suffix IS NOT NULL AND u.users_suffix != '' THEN CONCAT(' ', u.users_suffix) ELSE '' END
                    )) AS full_name,
                    u.users_email,
                    u.users_school_id,
                    u.users_contact_number,
                    u.users_user_level_id,
                    u.users_department_id,
                    u.users_pic
                FROM 
                    tbl_users u
                LEFT JOIN titles t ON u.title_id = t.id
                WHERE 
                    u.users_email LIKE :searchTerm
                    OR CONCAT(u.users_fname, ' ', u.users_mname, ' ', u.users_lname) LIKE :searchTerm
                    OR CONCAT(u.users_fname, ' ', u.users_lname) LIKE :searchTerm";
        
        $searchTerm = '%' . $searchTerm . '%';
        return $this->executeQuery($sql, [':searchTerm' => $searchTerm]);
    }

    public function __destruct() {
        unset($this->conn);
    }

    public function fetchEquipment() {
        $sql = "SELECT 
                    equip_id, 
                    equip_name, 
                    equip_quantity, 
                    equip_created_at, 
                    equip_updated_at, 
                    status_availability_id, 
                    equipment_equipment_category_id,
                    is_active
                FROM 
                    tbl_equipments
                WHERE
                    is_active = 1
                ORDER BY 
                    equip_id";

        return $this->executeQuery($sql);
    }
    public function fetchUserLevels() {
        $sql = "SELECT user_level_id, user_level_name FROM tbl_user_level ORDER BY user_level_name";
        return $this->executeQuery($sql);
    }

    public function fetchDepartments() {
        $sql = "SELECT departments_id, departments_name, department_type 
                FROM tbl_departments 
                WHERE is_active = 1 
                ORDER BY departments_id DESC";
        return $this->executeQuery($sql);
    }

        public function fetchPersonnel() {
        $sql = "SELECT users_id,
                CONCAT(
                    users_fname,
                    CASE 
                        WHEN users_mname != '' THEN CONCAT(' ', LEFT(users_mname, 1), '.')
                        ELSE ''
                    END,
                    ' ',
                    users_lname
                ) AS full_name
                FROM tbl_users
                WHERE is_active = 1 
                AND users_user_level_id = 2
                ORDER BY users_fname";
        return $this->executeQuery($sql);
    }

    


    public function fetchAllUserTypes() {
    $sql = "SELECT 
                u.users_id,
                t.abbreviation AS title_abbreviation,
                u.users_fname,
                u.users_mname,
                u.users_lname, 
                u.users_email,
                u.users_school_id,
                u.users_contact_number,
                u.users_user_level_id,
                u.users_department_id,
                u.users_pic,
                u.users_created_at,
                u.users_updated_at,
                u.is_active,
                u.is_2FAactive,
                d.departments_name,
                ul.user_level_name,
                ul.user_level_desc
            FROM tbl_users u
            LEFT JOIN titles t ON u.title_id = t.id
            LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
            LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id 
            WHERE u.is_active = 1
            ORDER BY u.users_id DESC";

    return $this->executeQuery($sql);
}
    public function checkUniqueEmailAndSchoolId($email, $schoolId, $excludeId = null, $excludeType = null) {
        try {
            // Only check in tbl_users
            $sql = "SELECT users_id as id, users_email as email, users_school_id as school_id 
                   FROM tbl_users 
                   WHERE (users_email = :email OR users_school_id = :schoolId)
                   AND is_active = 1";
            
            // Add exclusion if we're updating an existing user
            if ($excludeId) {
                $sql .= " AND users_id != :excludeId";
            }
            
            $stmt = $this->conn->prepare($sql);
            $params = [':email' => $email, ':schoolId' => $schoolId];
            
            if ($excludeId) {
                $params[':excludeId'] = $excludeId;
            }
            
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $response = [
                'status' => 'success',
                'exists' => false,
                'duplicates' => []
            ];
            
            if (!empty($results)) {
                $response['exists'] = true;
                foreach ($results as $result) {
                    if ($result['email'] === $email) {
                        $response['duplicates'][] = [
                            'field' => 'email',
                            'value' => $email,
                            'message' => 'Email already exists'
                        ];
                    }
                    if ($result['school_id'] === $schoolId) {
                        $response['duplicates'][] = [
                            'field' => 'school_id',
                            'value' => $schoolId,
                            'message' => 'School ID already exists'
                        ];
                    }
                }
            }

            return json_encode($response);

        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }


    public function fetchDriver($startDateTime = null, $endDateTime = null, $userId = null, $reservationId = null) {
        try {
        
            $sql = "
                SELECT 
                    u.users_id,
                    u.users_fname,
                    u.users_mname,
                    u.users_lname,
                    u.users_suffix
                FROM 
                    tbl_users u
                WHERE 
                    u.users_user_level_id = 19
                    AND u.is_active = 1
            ";
    
            // If no date filters, return all drivers
            if ($startDateTime === null || $endDateTime === null) {
                $sql .= " ORDER BY u.users_lname, u.users_fname";
                return $this->executeQuery($sql);
            }
            
    
            // Get drivers who are already assigned to ACTIVE reservations during the specified period
            // Only exclude drivers with active statuses: 1,3,6,7,8,10,11,14
            // Drivers with cancelled (2), completed (5), or rejected (4) are available
            // EXCLUDE the current reservation (if provided) so drivers assigned to it remain available
            $sqlUnavailableDrivers = "
                SELECT DISTINCT rd.reservation_driver_user_id
                FROM tbl_reservation_driver rd
                INNER JOIN tbl_reservation_vehicle rv ON rd.reservation_vehicle_id = rv.reservation_vehicle_id
                INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                INNER JOIN (
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
                WHERE 
                    latest_status.reservation_status_status_id IN (1,3,6,7,8,10,11,14)
                    AND (
                        (latest_status.reservation_status_status_id IN (1,3,6,7,8) AND r.reservation_start_date <= :endDateTime AND r.reservation_end_date >= :startDateTime)
                        OR (latest_status.reservation_status_status_id IN (10, 11, 14) AND r.reschedule_start_date IS NOT NULL AND r.reschedule_end_date IS NOT NULL AND r.reschedule_start_date <= :endDateTime AND r.reschedule_end_date >= :startDateTime)
                    )
            ";
            
            // Exclude current reservation from conflict check
            if ($reservationId !== null) {
                $sqlUnavailableDrivers .= " AND r.reservation_id != :reservationId";
              
            }
    
            // Execute unavailable driver check
            try {
                $stmt = $this->conn->prepare($sqlUnavailableDrivers);
                $params = [
                    ':startDateTime' => $startDateTime,
                    ':endDateTime' => $endDateTime
                ];
                
                // Add reservationId to params if provided
                if ($reservationId !== null) {
                    $params[':reservationId'] = $reservationId;
                }
                
                $stmt->execute($params);
                $unavailableDriverIds = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
                
                // Filter out null/empty values
                $unavailableDriverIds = array_filter($unavailableDriverIds, function($id) {
                    return $id !== null && $id !== '' && $id !== false;
                });
                // Re-index array after filtering
                $unavailableDriverIds = array_values($unavailableDriverIds);
                
             
            } catch (PDOException $e) {
                error_log("fetchDriver: Error checking unavailable drivers - " . $e->getMessage());
         
                $unavailableDriverIds = [];
            }
            
    
            // Exclude unavailable drivers from main query
            if (!empty($unavailableDriverIds)) {
                $placeholders = implode(',', array_fill(0, count($unavailableDriverIds), '?'));
                $sql .= " AND u.users_id NOT IN ($placeholders)";
            }
    
            $sql .= " ORDER BY u.users_lname, u.users_fname";
    
            
    
            // Execute final query
            $stmt = $this->conn->prepare($sql);
            if (!empty($unavailableDriverIds)) {
                $stmt->execute($unavailableDriverIds);
            } else {
                $stmt->execute();
            }
    
            $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return json_encode(['status' => 'success', 'data' => $drivers]);
    
        } catch (PDOException $e) {
            error_log("fetchDriver: Database error - " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        } catch (Exception $e) {
            error_log("fetchDriver: General error - " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
        }
    }
    public function updatePassword($userId, $oldPassword, $newPassword){
        try {
            // First, get the user's current password
            $sql = "SELECT users_password FROM tbl_users WHERE users_id = :userId";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['userId' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'User not found'
                ]);
            }            // Verify old password
            if (!password_verify($oldPassword, $user['users_password'])) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Current password is incorrect'
                ]);
            }

            // Check if new password is same as old password
            if (password_verify($newPassword, $user['users_password'])) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'New password cannot be the same as current password'
                ]);
            }

            // Hash new password
            $hashedNewPassword = password_hash($newPassword, PASSWORD_DEFAULT);

            // Update password
            $updateSql = "UPDATE tbl_users SET users_password = :newPassword WHERE users_id = :userId";
            $updateStmt = $this->conn->prepare($updateSql);
            $success = $updateStmt->execute([
                'newPassword' => $hashedNewPassword,
                'userId' => $userId
            ]);

            if ($success) {
                // Non-blocking audit logging for password update
                try {
                    // Fetch user's full name: First + Middle initial + Last
                    $sqlName = "SELECT CONCAT(\n                                    users_fname,\n                                    CASE WHEN users_mname IS NOT NULL AND users_mname != '' THEN CONCAT(' ', LEFT(users_mname, 1), '.') ELSE '' END,\n                                    ' ', users_lname\n                                 ) AS full_name\n                               FROM tbl_users WHERE users_id = :uid";
                    $stmtName = $this->conn->prepare($sqlName);
                    $stmtName->bindParam(':uid', $userId, PDO::PARAM_INT);
                    $stmtName->execute();
                    $rowName = $stmtName->fetch(PDO::FETCH_ASSOC);
                    $fullName = $rowName['full_name'] ?? ('User #' . (int)$userId);

                    $description = 'Password updated by: ' . $fullName;
                    $action = 'UPDATE PASSWORD';

                    $stmtAudit = $this->conn->prepare("INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)");
                    $stmtAudit->bindParam(':description', $description, PDO::PARAM_STR);
                    $stmtAudit->bindParam(':action', $action, PDO::PARAM_STR);
                    $stmtAudit->bindParam(':created_by', $userId, PDO::PARAM_INT);
                    $stmtAudit->execute();
                } catch (Exception $e) { /* ignore audit logging errors */ }

                return json_encode([
                    'status' => 'success',
                    'message' => 'Password updated successfully'
                ]);
            } else {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Failed to update password'
                ]);
            }

        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function fetchTitle() {
        $sql = "SELECT id, abbreviation FROM titles WHERE 1";
        return $this->executeQuery($sql);
    }

    public function getUnitById($unitId) {
        $sql = "SELECT 
                    eu.unit_id,
                    eu.equip_id,
                    eu.serial_number,
                    eu.status_availability_id,
                    sa.status_availability_name,
                    e.equip_name,
                    e.equip_pic,
                    e.equipment_equipment_category_id,
                    ec.equipments_category_name
                FROM 
                    tbl_equipment_unit eu
                LEFT JOIN 
                    tbl_status_availability sa ON eu.status_availability_id = sa.status_availability_id
                LEFT JOIN 
                    tbl_equipments e ON eu.equip_id = e.equip_id
                LEFT JOIN 
                    tbl_equipment_category ec ON e.equipment_equipment_category_id = ec.equipments_category_id
                WHERE 
                    eu.unit_id = :unitId";

        return $this->executeQuery($sql, [':unitId' => $unitId]);
    }


    public function updateProfile($userData){
        try {
            $userId = isset($userData['users_id']) ? $userData['users_id'] : null;
            $email = isset($userData['users_email']) ? $userData['users_email'] : null;
            $schoolId = isset($userData['users_school_id']) ? $userData['users_school_id'] : null;
            $original = null;
            if ($userId) {
                $sql = "SELECT users_email, users_school_id FROM tbl_users WHERE users_id = :userId LIMIT 1";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute([':userId' => $userId]);
                $original = $stmt->fetch(PDO::FETCH_ASSOC);
            }
            $checkDuplicate = false;
            if ($original) {
                if (($email && $email !== $original['users_email']) || ($schoolId && $schoolId !== $original['users_school_id'])) {
                    $checkDuplicate = true;
                }
            }
            if ($checkDuplicate) {
                $checkResult = json_decode($this->checkUniqueEmailAndSchoolId($email, $schoolId, $userId), true);
                if ($checkResult && $checkResult['exists'] && !empty($checkResult['duplicates'])) {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'Duplicate found',
                        'duplicates' => $checkResult['duplicates']
                    ]);
                }
            }
            // Define allowed fields to update
            $allowedFields = [
                'users_fname',
                'users_mname',
                'users_lname',
                'users_email',
                'users_school_id',
                'users_contact_number',
                'users_department_id',
                'users_pic',
                'users_suffix', // Added
                'title_id',     // Added
                'users_user_level_id' // Allow updating user level
            ];

            // Fetch pre-update snapshot for comparison (to list only actual changes)
            $beforeUser = null;
            if (!empty($userData['users_id'])) {
                $beforeSql = "SELECT " . implode(', ', $allowedFields) . " FROM tbl_users WHERE users_id = :userId LIMIT 1";
                $beforeStmt = $this->conn->prepare($beforeSql);
                $beforeStmt->execute([':userId' => $userData['users_id']]);
                $beforeUser = $beforeStmt->fetch(PDO::FETCH_ASSOC) ?: [];
            }

            // Build update query dynamically based on provided data
            $updateFields = [];
            $params = [];
            
            foreach ($allowedFields as $field) {
                // For title_id and users_suffix, check if they exist in the data (even if null)
                if (($field === 'title_id' || $field === 'users_suffix') && array_key_exists($field, $userData)) {
                    $updateFields[] = "$field = :$field";
                    
                    // Set to NULL if value is null, empty string, or string 'null'
                    if ($userData[$field] === null || $userData[$field] === '' || $userData[$field] === 'null') {
                        $params[$field] = null;
                    } else {
                        $params[$field] = $userData[$field];
                    }
                } else if (isset($userData[$field])) {
                    // For other fields, use the original logic
                    $updateFields[] = "$field = :$field";
                    $params[$field] = $userData[$field];
                }
            }

            // Add updated_at timestamp
            $updateFields[] = "users_updated_at = CURRENT_TIMESTAMP";

            // If no fields to update, return error
            if (empty($updateFields)) {
                return json_encode([
                    'status' => 'error',
                    'message' => 'No valid fields to update'
                ]);
            }

            // Add user ID to params
            $params['userId'] = $userData['users_id'];

            // Construct and execute update query
            $sql = "UPDATE tbl_users SET " . implode(', ', $updateFields) . " WHERE users_id = :userId";
            $stmt = $this->conn->prepare($sql);
            $success = $stmt->execute($params);

            if ($success) {
                // Fetch updated user data
                $selectSql = "SELECT users_id, users_fname, users_mname, users_lname, users_birthdate, users_suffix, users_email, users_school_id, users_contact_number, users_user_level_id, users_password, first_login, users_department_id, users_pic, users_created_at, users_updated_at, is_active, is_2FAactive, title_id FROM tbl_users WHERE users_id = :userId";
                $selectStmt = $this->conn->prepare($selectSql);
                $selectStmt->execute(['userId' => $userData['users_id']]);
                $updatedUser = $selectStmt->fetch(PDO::FETCH_ASSOC);

                // Non-blocking audit logging for profile update (list only changed fields)
                try {
                    // Determine actor (personnel) id: prefer explicit user_personnel_id, fallback to updated user id
                    $actorId = isset($userData['user_personnel_id']) && $userData['user_personnel_id'] !== ''
                        ? (int)$userData['user_personnel_id']
                        : (int)$userData['users_id'];

                    // Subject name (updated user)
                    $mi = (!empty($updatedUser['users_mname'])) ? (' ' . substr($updatedUser['users_mname'], 0, 1) . '.') : '';
                    $subjectName = trim(($updatedUser['users_fname'] ?? '') . $mi . ' ' . ($updatedUser['users_lname'] ?? ''));
                    if ($subjectName === '') { $subjectName = 'User #' . (int)$updatedUser['users_id']; }

                    // Actor name
                    if ($actorId === (int)$updatedUser['users_id']) {
                        $actorName = $subjectName;
                    } else {
                        $sqlActor = "SELECT CONCAT(\n                                        users_fname,\n                                        CASE WHEN users_mname IS NOT NULL AND users_mname != '' THEN CONCAT(' ', LEFT(users_mname, 1), '.') ELSE '' END,\n                                        ' ', users_lname\n                                     ) AS full_name\n                                   FROM tbl_users WHERE users_id = :uid";
                        $stmtActor = $this->conn->prepare($sqlActor);
                        $stmtActor->bindParam(':uid', $actorId, PDO::PARAM_INT);
                        $stmtActor->execute();
                        $rowActor = $stmtActor->fetch(PDO::FETCH_ASSOC);
                        $actorName = $rowActor['full_name'] ?? ('User #' . $actorId);
                    }

                    // Build list of changed fields (friendly names)
                    $fieldMap = [
                        'users_fname' => 'First Name',
                        'users_mname' => 'Middle Name',
                        'users_lname' => 'Last Name',
                        'users_email' => 'Email',
                        'users_school_id' => 'School ID',
                        'users_contact_number' => 'Contact Number',
                        'users_department_id' => 'Department',
                        'users_pic' => 'Profile Picture',
                        'users_suffix' => 'Suffix',
                        'title_id' => 'Title',
                        'users_user_level_id' => 'User Level',
                    ];
                    $candidateKeys = array_filter(array_keys($params), function($k){ return $k !== 'userId'; });
                    $changedKeys = [];
                    foreach ($candidateKeys as $k) {
                        $newVal = isset($params[$k]) ? (string)$params[$k] : '';
                        $oldVal = isset($beforeUser[$k]) ? (string)$beforeUser[$k] : '';
                        if (trim($newVal) !== trim($oldVal)) {
                            $changedKeys[] = $k;
                        }
                    }
                    // Build detailed change list with old -> new values
                    $changes = [];
                    foreach ($changedKeys as $k) {
                        $label = $fieldMap[$k] ?? $k;
                        $oldVal = isset($beforeUser[$k]) ? (string)$beforeUser[$k] : '';
                        $newVal = isset($params[$k]) ? (string)$params[$k] : '';
                        if ($k === 'users_pic') {
                            $changes[] = $label . ': [changed]';
                        } else {
                            $changes[] = $label . ": '" . $oldVal . "' -> '" . $newVal . "'";
                        }
                    }
                    $changesList = implode(', ', $changes);

                    $description = 'Profile updated for: ' . $subjectName;
                    if ($changesList !== '') { $description .= ' (Changes: ' . $changesList . ')'; }
                    $action = 'UPDATE PROFILE';

                    $stmtAudit = $this->conn->prepare("INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)");
                    $stmtAudit->bindParam(':description', $description, PDO::PARAM_STR);
                    $stmtAudit->bindParam(':action', $action, PDO::PARAM_STR);
                    $stmtAudit->bindParam(':created_by', $actorId, PDO::PARAM_INT);
                    $stmtAudit->execute();
                } catch (Exception $e) { /* ignore audit logging errors */ }

                return json_encode([
                    'status' => 'success',
                    'message' => 'Profile updated successfully',
                    'data' => $updatedUser
                ]);
            } else {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Failed to update profile'
                ]);
            }

        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }



    public function fetchHoliday() {
        $sql = "SELECT `holiday_id`, `holiday_name`, `holiday_date` FROM `tbl_holidays` WHERE is_active = 1";
        return $this->executeQuery($sql);
    }

    public function updateHoliday($holidayId, $holidayName, $holidayDate, $userId = null) {
        try {
            // First, get the current values to check if they're the same
            $getCurrentSql = "SELECT holiday_name, holiday_date FROM `tbl_holidays` 
                             WHERE `holiday_id` = :holiday_id";
            
            $getCurrentStmt = $this->conn->prepare($getCurrentSql);
            $getCurrentStmt->execute([':holiday_id' => $holidayId]);
            $currentData = $getCurrentStmt->fetch(PDO::FETCH_ASSOC);
    
            if (!$currentData) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Holiday not found'
                ]);
            }
    
            // If values are the same as current values, still audit and return success
            if ($currentData['holiday_name'] === $holidayName && 
                $currentData['holiday_date'] === $holidayDate) {
                // Audit log (non-blocking)
                try {
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = "Updated Holiday: '" . ($currentData['holiday_name'] ?? '') . "' on '" . ($currentData['holiday_date'] ?? '') . "' -> '" . ($holidayName ?? '') . "' on '" . ($holidayDate ?? '') . "'";
                    $action = 'UPDATE';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    $audit->execute();
                } catch (PDOException $e) {
                    error_log("Audit log insert failed (updateHoliday same-values): " . $e->getMessage());
                }
                return json_encode([
                    'status' => 'success', 
                    'message' => 'Holiday updated successfully'
                ]);
            }
    
            // Check if another holiday with the same name and date exists (excluding current holiday)
            $checkSql = "SELECT holiday_id FROM `tbl_holidays` 
                         WHERE `holiday_name` = :holiday_name 
                         AND `holiday_date` = :holiday_date 
                         AND `holiday_id` != :holiday_id";
            
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->execute([
                ':holiday_name' => $holidayName,
                ':holiday_date' => $holidayDate,
                ':holiday_id' => $holidayId
            ]);
    
            if ($checkStmt->rowCount() > 0) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'A holiday with the same name and date already exists'
                ]);
            }
    
            // Proceed with update if no duplicate found
            $sql = "UPDATE `tbl_holidays` 
                   SET `holiday_name` = :holiday_name, 
                       `holiday_date` = :holiday_date 
                   WHERE `holiday_id` = :holiday_id";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':holiday_name' => $holidayName,
                ':holiday_date' => $holidayDate,
                ':holiday_id' => $holidayId
            ]);
    
            if ($stmt->rowCount() > 0) {
                // Audit log (non-blocking)
                try {
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = "Updated Holiday: '" . ($currentData['holiday_name'] ?? '') . "' on '" . ($currentData['holiday_date'] ?? '') . "' -> '" . ($holidayName ?? '') . "' on '" . ($holidayDate ?? '') . "'";
                    $action = 'UPDATE';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    $audit->execute();
                } catch (PDOException $e) {
                    error_log("Audit log insert failed (updateHoliday): " . $e->getMessage());
                }
                return json_encode([
                    'status' => 'success', 
                    'message' => 'Holiday updated successfully'
                ]);
            } else {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'No changes made or holiday not found'
                ]);
            }
            
        } catch (PDOException $e) {
            // Handle specific duplicate entry error
            if ($e->getCode() == 23000 && strpos($e->getMessage(), 'Duplicate entry') !== false) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'A holiday with the same name and date already exists'
                ]);
            }
            
            // Handle other database errors
            return json_encode([
                'status' => 'error', 
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

   public function countTrendReservations($year = null) {
    try {
        // If no year provided, use current year
        if ($year === null) {
            $year = date('Y');
        }

        $sql = "
            SELECT 
                r.reservation_id,
                r.reservation_created_at,
                rs.reservation_status_status_id AS status_id
            FROM 
                tbl_reservation r
            LEFT JOIN tbl_reservation_status rs 
                ON rs.reservation_reservation_id = r.reservation_id
            WHERE 
                YEAR(r.reservation_created_at) = :year
            GROUP BY 
                r.reservation_id
            ORDER BY 
                r.reservation_created_at DESC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':year', $year, PDO::PARAM_INT);
        $stmt->execute();
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode([
            'status' => 'success',
            'data' => [ 
                'countTrendReservation' => count($reservations),
                'reservations' => $reservations,
                'year' => $year
            ]
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

    public function countCompletedAndCancelledReservations() {
    try {
        $sql = "
            SELECT 
                r.reservation_id,
                r.reservation_created_at,
                rs.reservation_status_status_id AS status_id
            FROM 
                tbl_reservation r
            LEFT JOIN 
                tbl_reservation_status rs 
                ON rs.reservation_reservation_id = r.reservation_id
            WHERE 
                rs.reservation_status_status_id IN (4, 5)
            GROUP BY 
                r.reservation_id
            ORDER BY 
                r.reservation_created_at DESC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return json_encode([
            'status' => 'success',
            'data' => [
                'countCompletedAndCancelled' => count($reservations),
                'reservations' => $reservations
            ]
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

public function fetchVenueScheduled() {
        try {
            $query = "SELECT 
                        v.ven_id,
                        v.ven_name, 
                        cvs.day_of_week, 
                        cvs.start_time, 
                        cvs.end_time,
                        cvs.semester_id,  -- Include semester_id if you want to know which semester it belongs to
                        s.semester_name   -- Include semester_name for better context if needed
                      FROM tbl_class_venue_schedule cvs
                      INNER JOIN tbl_venue v ON cvs.ven_id = v.ven_id
                      INNER JOIN tbl_semester s ON cvs.semester_id = s.semester_id
                      ORDER BY s.semester_id, v.ven_name, cvs.day_of_week, cvs.start_time";
            
            $stmt = $this->conn->prepare($query);
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
        } catch (Exception $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }
public function saveStock($data) {
    try {
        if (is_string($data)) {
            $data = json_decode($data, true);
        }

        if (!$data || !is_array($data)) {
            return json_encode(['status' => 'error', 'message' => 'Invalid input data']);
        }

        $requiredFields = ['equip_id', 'quantity', 'user_admin_id'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                return json_encode([
                    'status' => 'error', 
                    'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                ]);
            }
        }

        $equip_id = (int)$data['equip_id'];
        $inputQuantity = (int)$data['quantity'];
        $user_admin_id = (int)$data['user_admin_id'];

        // Enforce always-increase behavior: quantity must be positive
        if ($inputQuantity <= 0) {
            return json_encode(['status' => 'error', 'message' => 'Quantity must be greater than 0']);
        }

        // Determine actor id (for audit created_by)
        $actorId = null;
        if (isset($data['user_personnel_id']) && $data['user_personnel_id'] !== '') {
            $actorId = (int)$data['user_personnel_id'];
        } elseif (isset($data['user_admin_id']) && $data['user_admin_id'] !== '') {
            $actorId = (int)$data['user_admin_id'];
        }

        // Fetch equipment name for audit description
        $equipName = null;
        try {
            $enameStmt = $this->conn->prepare("SELECT equip_name FROM tbl_equipments WHERE equip_id = :id");
            $enameStmt->execute([':id' => $equip_id]);
            $row = $enameStmt->fetch(PDO::FETCH_ASSOC);
            if ($row && isset($row['equip_name'])) {
                $equipName = $row['equip_name'];
            }
        } catch (Throwable $te) { /* ignore name fetch errors */ }

        // Check current stock entry
        $checkSql = "SELECT quantity, on_hand_quantity FROM tbl_equipment_quantity WHERE equip_id = :equip_id";
        $checkStmt = $this->conn->prepare($checkSql);
        $checkStmt->bindParam(':equip_id', $equip_id, PDO::PARAM_INT);
        $checkStmt->execute();
        if ($checkStmt->rowCount() > 0) {
            // Always increment existing stock by the provided quantity
            $sql = "UPDATE tbl_equipment_quantity SET 
                        quantity = quantity + :add_qty,
                        on_hand_quantity = on_hand_quantity + :add_qty,
                        last_updated = NOW(),
                        user_admin_id = :user_admin_id
                    WHERE equip_id = :equip_id";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':add_qty', $inputQuantity, PDO::PARAM_INT);
            $stmt->bindParam(':user_admin_id', $user_admin_id, PDO::PARAM_INT);
            $stmt->bindParam(':equip_id', $equip_id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                // Audit log (non-blocking): Equipment (name) has increase quantity: X
                try {
                    $desc = 'Equipment (' . ($equipName ?? ('#' . $equip_id)) . ') has increase quantity: ' . $inputQuantity;
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $audit->execute([
                        ':description' => $desc,
                        ':action' => 'UPDATE QUANTITY',
                        ':created_by' => $actorId
                    ]);
                } catch (Throwable $te) { /* ignore audit errors */ }
                return json_encode([
                    'status' => 'success',
                    'message' => "Stock increased by $inputQuantity successfully"
                ]);
            }
            return json_encode(['status' => 'error', 'message' => 'Failed to update stock']);
        } else {
            // Insert new stock record
            $sql = "INSERT INTO tbl_equipment_quantity (
                        equip_id, quantity, on_hand_quantity, last_updated, user_admin_id
                    ) VALUES (
                        :equip_id, :quantity, :quantity, NOW(), :user_admin_id
                    )";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':equip_id', $equip_id, PDO::PARAM_INT);
            $stmt->bindParam(':quantity', $inputQuantity, PDO::PARAM_INT);
            $stmt->bindParam(':user_admin_id', $user_admin_id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                // Audit log (non-blocking): Equipment (name) has increase quantity: X
                try {
                    $desc = 'Equipment (' . ($equipName ?? ('#' . $equip_id)) . ') has increase quantity: ' . $inputQuantity;
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $audit->execute([
                        ':description' => $desc,
                        ':action' => 'UPDATE STOCK',
                        ':created_by' => $actorId
                    ]);
                } catch (Throwable $te) { /* ignore audit errors */ }
                return json_encode([
                    'status' => 'success',
                    'message' => 'Equipment stock added successfully'
                ]);
            }
            return json_encode(['status' => 'error', 'message' => 'Failed to add equipment stock']);
        }
    } catch(PDOException $e) {
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    } catch(Exception $e) {
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

// Alias for updateEquipmentUnit to match switch case operation name
public function updateUnit($unitData) {
    return $this->updateEquipmentUnit($unitData);
}

public function saveUnit($data) {
    try {
        if (is_string($data)) $data = json_decode($data, true);
        if (!is_array($data)) return json_encode(['status' => 'error', 'message' => 'Invalid input data']);

        // Required fields and types
        $requiredFields = [
            'equip_id' => 'int',
            'serial_number' => 'string',
            'status_availability_id' => 'int',
            'user_admin_id' => 'int'
        ];

        foreach ($requiredFields as $field => $type) {
            if (!isset($data[$field]) || ($type === 'string' && trim($data[$field]) === '')) {
                return json_encode(['status' => 'error', 'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
            }
            if ($type === 'int' && !is_numeric($data[$field])) {
                return json_encode(['status' => 'error', 'message' => ucfirst(str_replace('_', ' ', $field)) . ' must be a number']);
            }
        }

        // Check for duplicate serial number
        $check = $this->conn->prepare("SELECT COUNT(*) FROM tbl_equipment_unit WHERE serial_number = :serial_number");
        $check->bindParam(':serial_number', $data['serial_number']);
        $check->execute();
        if ($check->fetchColumn() > 0) {
            return json_encode(['status' => 'error', 'message' => 'This serial number already exists']);
        }

        // Determine actor id (for audit created_by)
        $actorId = null;
        if (isset($data['user_personnel_id']) && $data['user_personnel_id'] !== '') {
            $actorId = (int)$data['user_personnel_id'];
        } elseif (isset($data['user_admin_id']) && $data['user_admin_id'] !== '') {
            $actorId = (int)$data['user_admin_id'];
        }

        // Fetch equipment name for audit description
        $equipName = null;
        try {
            $enameStmt = $this->conn->prepare("SELECT equip_name FROM tbl_equipments WHERE equip_id = :id");
            $enameStmt->execute([':id' => $data['equip_id']]);
            $row = $enameStmt->fetch(PDO::FETCH_ASSOC);
            if ($row && isset($row['equip_name'])) {
                $equipName = $row['equip_name'];
            }
        } catch (Throwable $te) { /* ignore name fetch errors */ }

        // Insert query with new fields: equipment_brand, equipment_model, equipment_description, equipment_specs, inch
        $sql = "INSERT INTO tbl_equipment_unit (
                    equip_id, serial_number, equipment_brand, equipment_model, equipment_description, equipment_specs, inch,
                    status_availability_id, unit_created_at, is_active, user_admin_id
                ) VALUES (
                    :equip_id, :serial_number, :equipment_brand, :equipment_model, :equipment_description, :equipment_specs, :inch,
                    :status_id, NOW(), 1, :admin_id
                )";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':equip_id', $data['equip_id'], PDO::PARAM_INT);
        $stmt->bindParam(':serial_number', $data['serial_number']);
        $stmt->bindParam(':equipment_brand', $data['equipment_brand']);
        $stmt->bindParam(':equipment_model', $data['equipment_model']);
        $stmt->bindParam(':equipment_description', $data['equipment_description']);
        $stmt->bindParam(':equipment_specs', $data['equipment_specs']);
        $stmt->bindParam(':inch', $data['inch']);
        $stmt->bindParam(':status_id', $data['status_availability_id'], PDO::PARAM_INT);
        $stmt->bindParam(':admin_id', $data['user_admin_id'], PDO::PARAM_INT);

        $ok = $stmt->execute();
        if ($ok) {
            // Audit log (non-blocking): Equipment (name) has new Serial Number: {serial}
            try {
                $desc = 'Equipment (' . ($equipName ?? ('#' . $data['equip_id'])) . ') has new Serial Number: ' . $data['serial_number'];
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $audit->execute([
                    ':description' => $desc,
                    ':action' => 'CREATE UNIT',
                    ':created_by' => $actorId
                ]);
            } catch (Throwable $te) { /* ignore audit errors */ }
            return json_encode(['status' => 'success', 'message' => 'Equipment unit added successfully']);
        } else {
            return json_encode(['status' => 'error', 'message' => 'Failed to add equipment unit']);
        }

    } catch (PDOException $e) {
        error_log("Database error in saveUnit: " . $e->getMessage());
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    } catch (Exception $e) {
        error_log("Error in saveUnit: " . $e->getMessage());
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

public function updateEquipmentUnit($unitData) {
    try {
        // Validate required fields
        if (empty($unitData['unit_id'])) {
            return json_encode([
                "status" => "error",
                "message" => "Unit ID is required"
            ]);
        }

        // Check if status_availability_id is being changed
        if (isset($unitData['status_availability_id'])) {
            // Get current status_availability_id
            $currentStatusStmt = $this->conn->prepare("SELECT status_availability_id FROM tbl_equipment_unit WHERE unit_id = :unit_id");
            $currentStatusStmt->bindParam(':unit_id', $unitData['unit_id'], PDO::PARAM_INT);
            $currentStatusStmt->execute();
            $currentStatus = $currentStatusStmt->fetch(PDO::FETCH_ASSOC);
            
            // Only check for active transactions if status is actually changing
            if ($currentStatus && $currentStatus['status_availability_id'] != $unitData['status_availability_id']) {
                $activeTransactionCheck = $this->checkActiveTransactions('equipment', [$unitData['unit_id']]);
                // Disabled restriction: previously prevented updating equipment unit status when there were active reservations
                // if ($activeTransactionCheck['hasActive']) {
                //     return json_encode([
                //         'status' => 'error', 
                //         'message' => 'Cannot update equipment unit status with active reservations: ' . implode(', ', $activeTransactionCheck['resourcesWithTransactions'])
                //     ]);
                // }
            }
        }

        // Begin transaction
        $this->conn->beginTransaction();

        // Check if the unit exists
        $checkStmt = $this->conn->prepare("SELECT unit_id FROM tbl_equipment_unit WHERE unit_id = :unit_id FOR UPDATE");
        $checkStmt->bindParam(':unit_id', $unitData['unit_id'], PDO::PARAM_INT);
        $checkStmt->execute();
        
        if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
            $this->conn->rollBack();
            return json_encode([
                "status" => "error",
                "message" => "Equipment unit not found"
            ]);
        }

        // Map the allowed fields that can be updated
        $allowedFields = [
            'serial_number' => PDO::PARAM_STR,
            'equipment_brand' => PDO::PARAM_STR,
            'equipment_model' => PDO::PARAM_STR,
            'equipment_description' => PDO::PARAM_STR,
            'equipment_specs' => PDO::PARAM_STR,
            'inch' => PDO::PARAM_STR,
            'status_availability_id' => PDO::PARAM_INT,
            'is_active' => PDO::PARAM_BOOL,
            'user_admin_id' => PDO::PARAM_INT
        ];

        $updateFields = [];
        $params = [];

        foreach ($allowedFields as $field => $paramType) {
            if (isset($unitData[$field]) && $unitData[$field] !== '') {
                $updateFields[] = "$field = :$field";
                $params[$field] = [
                    'value' => $unitData[$field],
                    'type' => $paramType
                ];
            }
        }

        if (empty($updateFields)) {
            $this->conn->rollBack();
            return json_encode([
                "status" => "error",
                "message" => "No fields to update"
            ]);
        }

        // Construct and execute the update query
        $sql = "UPDATE tbl_equipment_unit SET " . implode(", ", $updateFields) . " WHERE unit_id = :unit_id";
        
        $updateStmt = $this->conn->prepare($sql);
        
        // Bind unit_id parameter
        $updateStmt->bindParam(':unit_id', $unitData['unit_id'], PDO::PARAM_INT);
        
        // Bind all other parameters (use bindValue since we have literal values, not references)
        foreach ($params as $field => $param) {
            $updateStmt->bindValue(":$field", $param['value'], $param['type']);
        }
        
        $updateStmt->execute();
        $this->conn->commit();

        if ($updateStmt->rowCount() > 0) {
            // Verify the update
            $verifyStmt = $this->conn->prepare("SELECT * FROM tbl_equipment_unit WHERE unit_id = :unit_id");
            $verifyStmt->bindParam(':unit_id', $unitData['unit_id'], PDO::PARAM_INT);
            $verifyStmt->execute();
            $updatedData = $verifyStmt->fetch(PDO::FETCH_ASSOC);
            
            return json_encode([
                "status" => "success",
                "message" => "Equipment unit updated successfully",
                "unit_id" => $unitData['unit_id'],
                "updated_data" => $updatedData
            ]);
        } else {
            return json_encode([
                "status" => "info",
                "message" => "No changes were made to the equipment unit",
                "unit_id" => $unitData['unit_id']
            ]);
        }
    } catch (PDOException $e) {
        if ($this->conn->inTransaction()) {
            $this->conn->rollBack();
        }
        error_log("Database error in updateEquipmentUnit: " . $e->getMessage());
        return json_encode([
            "status" => "error",
            "message" => "Database error: " . $e->getMessage()
        ]);
    } catch (Exception $e) {
        if ($this->conn->inTransaction()) {
            $this->conn->rollBack();
        }
        error_log("Error in updateEquipmentUnit: " . $e->getMessage());
        return json_encode([
            "status" => "error",
            "message" => "An unexpected error occurred: " . $e->getMessage()
        ]);
    }
}


public function saveHoliday($data, $userId = null) {
        try {
            // If data is a JSON string, decode it
            if (is_string($data)) {
                $data = json_decode($data, true);
            }

            // Validate decoded data
            if (!$data || !is_array($data)) {
                return json_encode(['status' => 'error', 'message' => 'Invalid input data']);
            }

            // Check required fields
            if (!isset($data['holiday_name']) || !isset($data['holiday_date'])) {
                return json_encode(['status' => 'error', 'message' => 'Holiday name and date are required']);
            }

            // Check if holiday already exists on the same date
            $checkSql = "SELECT COUNT(*) FROM tbl_holidays WHERE holiday_date = :holiday_date";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':holiday_date', $data['holiday_date']);
            $checkStmt->execute();
            
            if ($checkStmt->fetchColumn() > 0) {
                return json_encode(['status' => 'error', 'message' => 'A holiday already exists on this date']);
            }

            // Insert the holiday
            $sql = "INSERT INTO tbl_holidays (holiday_name, holiday_date) VALUES (:name, :date)";
            $stmt = $this->conn->prepare($sql);
            
            $stmt->bindParam(':name', $data['holiday_name'], PDO::PARAM_STR);
            $stmt->bindParam(':date', $data['holiday_date'], PDO::PARAM_STR);

            if ($stmt->execute()) {
                // Non-blocking audit log insert
                try {
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = "Created Holiday: '" . ($data['holiday_name'] ?? '') . "' on '" . ($data['holiday_date'] ?? '') . "'";
                    $action = 'CREATE';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    if (!$audit->execute()) {
                        error_log("Audit log insert failed (saveHoliday): " . print_r($audit->errorInfo(), true));
                    }
                } catch (Throwable $e2) {
                    error_log("Audit logging error (saveHoliday): " . $e2->getMessage());
                }

                return json_encode([
                    'status' => 'success',
                    'message' => 'Holiday added successfully'
                ]);
            }

            return json_encode(['status' => 'error', 'message' => 'Failed to add holiday']);
        } catch(PDOException $e) {
            error_log("Database error in saveHoliday: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

   
public function saveEquipment($json) {
    try {
        $data = is_array($json) ? $json : json_decode($json, true);
        if (!is_array($data)) {
            return json_encode(['status' => 'error', 'message' => 'Invalid input data']);
        }

        // Validate required fields
        $required = ['name', 'user_admin_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return json_encode(['status' => 'error', 'message' => "$field is required or invalid"]);
            }
        }

        // Optional fields (allow name-only submissions)
        // Default type to Bulk (safer default for equipment master)
        $equipType = isset($data['equip_type']) && $data['equip_type'] !== '' ? $data['equip_type'] : 'Bulk';
        // Default category to 1 if not provided (must exist in tbl_equipment_category)
        $categoryId = isset($data['equipments_category_id']) && $data['equipments_category_id'] !== '' ? $data['equipments_category_id'] : 1;

        if (!is_numeric($categoryId)) {
            return json_encode(['status' => 'error', 'message' => "equipments_category_id must be numeric"]);
        }

        // Check for duplicate equipment name (case-insensitive)
        $check = $this->conn->prepare("SELECT equip_id FROM tbl_equipments WHERE LOWER(equip_name) = LOWER(:name)");
        $check->bindParam(':name', $data['name']);
        $check->execute();
        if ($check->rowCount() > 0) {
            return json_encode(['status' => 'error', 'message' => 'Equipment already exists']);
        }

        // Insert equipment
        $sql = "INSERT INTO tbl_equipments (
                    equip_name, equipments_category_id, equip_type,
                    is_active, user_admin_id, equip_created_at
                ) VALUES (
                    :name, :category_id, :type, 1, :admin_id, NOW()
                )";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindParam(':type', $equipType);
        $stmt->bindParam(':admin_id', $data['user_admin_id'], PDO::PARAM_INT);

        if ($stmt->execute()) {
            $equipId = $this->conn->lastInsertId();
            // Audit log
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $desc = "Created Equipment : " . $data['name'];
                $action = 'CREATE';
                $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                $audit->bindParam(':action', $action, PDO::PARAM_STR);
                $audit->bindParam(':created_by', $data['user_admin_id'], PDO::PARAM_INT);
                $audit->execute();
            } catch (PDOException $e) {
                error_log("Audit log insert failed (saveEquipment): " . $e->getMessage());
            }
            return json_encode(['status' => 'success', 'message' => 'Equipment added successfully', 'equip_id' => $equipId]);
        }
        return json_encode(['status' => 'error', 'message' => 'Failed to insert equipment']);

    } catch (PDOException $e) {
        error_log("DB error in saveEquipment: " . $e->getMessage());
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

public function updateEquipment($data) {
    try {
        // Validate required fields
        $required = ['equip_id', 'equip_name'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return json_encode(['status' => 'error', 'message' => "$field is required"]);
            }

            // Check if numeric fields are actually numeric
            if (in_array($field, ['equip_id']) && !is_numeric($data[$field])) {
                return json_encode(['status' => 'error', 'message' => "$field must be numeric"]);
            }
        }

        // If optional fields are omitted, preserve existing values
        $currentType = null;
        $currentCategoryId = null;
        try {
            $curStmt = $this->conn->prepare("SELECT equip_type, equipments_category_id FROM tbl_equipments WHERE equip_id = :id");
            $curStmt->execute([':id' => $data['equip_id']]);
            $cur = $curStmt->fetch(PDO::FETCH_ASSOC);
            if ($cur) {
                $currentType = $cur['equip_type'] ?? null;
                $currentCategoryId = $cur['equipments_category_id'] ?? null;
            }
        } catch (PDOException $e) { /* ignore for main flow */ }

        $equipType = isset($data['equip_type']) && $data['equip_type'] !== '' ? $data['equip_type'] : $currentType;
        $categoryId = isset($data['equipments_category_id']) && $data['equipments_category_id'] !== '' ? $data['equipments_category_id'] : $currentCategoryId;

        if ($equipType === null || $categoryId === null) {
            return json_encode(['status' => 'error', 'message' => 'Equipment not found']);
        }

        if (!is_numeric($categoryId)) {
            return json_encode(['status' => 'error', 'message' => "equipments_category_id must be numeric"]);
        }

        // Check for active transactions before updating
        // Note: For equipment, we need to check all units of this equipment
        $equipmentUnitsCheck = $this->getEquipmentUnits($data['equip_id']);
        if (!empty($equipmentUnitsCheck)) {
            $activeTransactionCheck = $this->checkActiveTransactions('equipment', $equipmentUnitsCheck);
            // Disabled restriction: previously prevented updating equipment master when there were active reservations
            // if ($activeTransactionCheck['hasActive']) {
            //     return json_encode([
            //         'status' => 'error', 
            //         'message' => 'Cannot update equipment with active reservations: ' . implode(', ', $activeTransactionCheck['resourcesWithTransactions'])
            //     ]);
            // }
        }

        // Fetch old values for audit (name only)
        $oldName = null;
        try {
            $prevStmt = $this->conn->prepare("SELECT equip_name FROM tbl_equipments WHERE equip_id = :id");
            $prevStmt->execute([':id' => $data['equip_id']]);
            $prev = $prevStmt->fetch(PDO::FETCH_ASSOC);
            if ($prev && isset($prev['equip_name'])) {
                $oldName = $prev['equip_name'];
            }
        } catch (PDOException $e) { /* ignore for main flow */ }

        // Prepare the update statement
        $sql = "UPDATE tbl_equipments SET 
                    equip_name = :name, 
                    equip_type = :type, 
                    equipments_category_id = :category_id
                WHERE equip_id = :id";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':name', $data['equip_name']);
        $stmt->bindParam(':type', $equipType);
        $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindParam(':id', $data['equip_id'], PDO::PARAM_INT);

        $success = $stmt->execute();
        if ($success) {
            // Non-blocking audit logging
            try {
                // Determine actor id: prefer user_personnel_id, fallback to user_admin_id
                $actorId = null;
                if (isset($data['user_personnel_id']) && $data['user_personnel_id'] !== '') {
                    $actorId = (int)$data['user_personnel_id'];
                } elseif (isset($data['user_admin_id']) && $data['user_admin_id'] !== '') {
                    $actorId = (int)$data['user_admin_id'];
                }

                $newName = $data['equip_name'] ?? '';
                if ($oldName !== null && $oldName !== $newName) {
                    $desc = "Updated Equipment: '" . $oldName . "' -> '" . $newName . "'";
                } else {
                    $desc = 'Updated Equipment: ' . $newName;
                }

                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $audit->execute([
                    ':description' => $desc,
                    ':action' => 'UPDATE',
                    ':created_by' => $actorId
                ]);
            } catch (Throwable $te) { /* ignore audit errors */ }

            return json_encode(['status' => 'success', 'message' => 'Equipment updated successfully']);
        } else {
            return json_encode(['status' => 'error', 'message' => 'Failed to update equipment']);
        }

    } catch (PDOException $e) {
        error_log("Database error in updateEquipment: " . $e->getMessage());
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}



public function saveVehicle($data) {
    try {
        if (is_string($data)) $data = json_decode($data, true);
        if (!is_array($data)) return json_encode(['status' => 'error', 'message' => 'Invalid input data']);

        foreach (['vehicle_model_id', 'vehicle_license', 'year', 'user_admin_id'] as $field) {
            if (empty($data[$field])) return json_encode(['status' => 'error', 'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
        }

        // Pre-insert validation: check duplicate vehicle_license to avoid SQL duplicate errors
        $licenseToCheck = isset($data['vehicle_license']) ? trim($data['vehicle_license']) : '';
        $dupSql = "SELECT vehicle_id FROM tbl_vehicle WHERE LOWER(TRIM(vehicle_license)) = LOWER(TRIM(:license)) LIMIT 1";
        $dupStmt = $this->conn->prepare($dupSql);
        $dupStmt->bindParam(':license', $licenseToCheck);
        $dupStmt->execute();
        if ($dupStmt->fetch(PDO::FETCH_ASSOC)) {
            return json_encode(['status' => 'error', 'message' => 'Vehicle license already exists', 'field' => 'vehicle_license']);
        }

        $sql = "INSERT INTO tbl_vehicle (
                    vehicle_model_id, vehicle_license, year,
                    status_availability_id, user_admin_id,
                    is_active, created_at, updated_at
                ) VALUES (
                    :modelId, :license, :year,
                    1, :adminId,
                    1, NOW(), NOW()
                )";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':modelId', $data['vehicle_model_id']);
        $stmt->bindParam(':license', $data['vehicle_license']);
        $stmt->bindParam(':year', $data['year']);
        $stmt->bindParam(':adminId', $data['user_admin_id']);

        if ($stmt->execute()) {
            $vehicleId = $this->conn->lastInsertId();
            // Audit log
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $desc = "Created Vehicle : " . $data['vehicle_license'];
                $action = 'CREATE';
                $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                $audit->bindParam(':action', $action, PDO::PARAM_STR);
                $audit->bindParam(':created_by', $data['user_admin_id'], PDO::PARAM_INT);
                $audit->execute();
            } catch (PDOException $e) {
                error_log("Audit log insert failed (saveVehicle): " . $e->getMessage());
            }
            return json_encode(['status' => 'success', 'message' => 'Vehicle added successfully.', 'vehicle_id' => $vehicleId]);
        }
        return json_encode(['status' => 'error', 'message' => 'Failed to add vehicle']);
    } catch (PDOException $e) {
        error_log("saveVehicle error: " . $e->getMessage());
        // Translate SQL duplicate errors into a clean message
        if ($e->getCode() === '23000') { // Integrity constraint violation (e.g., duplicate key)
            return json_encode(['status' => 'error', 'message' => 'Vehicle license already exists', 'field' => 'vehicle_license']);
        }
        return json_encode(['status' => 'error', 'message' => 'An unexpected error occurred while saving the vehicle']);
    }
}

public function updateVehicleLicense($vehicleData) {
    try {
        $required = ['vehicle_id', 'vehicle_model_id', 'vehicle_license', 'year', 'status_availability_id', 'user_admin_id', 'is_active'];
        foreach ($required as $field) {
            if (!isset($vehicleData[$field])) {
                return json_encode(['status' => 'error', 'message' => "$field is required"]);
            }
        }

        // Check if vehicle license already exists (excluding current vehicle)
        $licenseToCheck = isset($vehicleData['vehicle_license']) ? trim($vehicleData['vehicle_license']) : '';
        $dupSql = "SELECT vehicle_id FROM tbl_vehicle WHERE LOWER(TRIM(vehicle_license)) = LOWER(TRIM(:license)) AND vehicle_id != :vehicle_id LIMIT 1";
        $dupStmt = $this->conn->prepare($dupSql);
        $dupStmt->bindParam(':license', $licenseToCheck);
        $dupStmt->bindParam(':vehicle_id', $vehicleData['vehicle_id'], PDO::PARAM_INT);
        $dupStmt->execute();
        if ($dupStmt->fetch(PDO::FETCH_ASSOC)) {
            return json_encode(['status' => 'error', 'message' => 'Vehicle license already exists', 'field' => 'vehicle_license']);
        }

        // Check if status_availability_id is being changed
        if (isset($vehicleData['status_availability_id'])) {
            // Get current status_availability_id
            $currentStatusStmt = $this->conn->prepare("SELECT status_availability_id FROM tbl_vehicle WHERE vehicle_id = :vehicle_id");
            $currentStatusStmt->bindParam(':vehicle_id', $vehicleData['vehicle_id'], PDO::PARAM_INT);
            $currentStatusStmt->execute();
            $currentStatus = $currentStatusStmt->fetch(PDO::FETCH_ASSOC);
            
            // Only check for active transactions if status is actually changing
            if ($currentStatus && $currentStatus['status_availability_id'] != $vehicleData['status_availability_id']) {
                $activeTransactionCheck = $this->checkActiveTransactions('vehicle', [$vehicleData['vehicle_id']]);
                // Disabled restriction: previously prevented updating vehicle status when there were active reservations
                // if ($activeTransactionCheck['hasActive']) {
                //     return json_encode([
                //         'status' => 'error', 
                //         'message' => 'Cannot update vehicle status with active reservations: ' . implode(', ', $activeTransactionCheck['resourcesWithTransactions'])
                //     ]);
                // }
            }
        }

        // Fetch old values (for audit description)
        $oldLicense = null;
        try {
            $prevStmt = $this->conn->prepare("SELECT vehicle_license FROM tbl_vehicle WHERE vehicle_id = :id");
            $prevStmt->execute([':id' => $vehicleData['vehicle_id']]);
            $prev = $prevStmt->fetch(PDO::FETCH_ASSOC);
            if ($prev && isset($prev['vehicle_license'])) {
                $oldLicense = $prev['vehicle_license'];
            }
        } catch (PDOException $e) {
            // Non-fatal for main flow; continue without old value
        }

        $sql = "UPDATE tbl_vehicle SET 
                    vehicle_model_id = :model_id,
                    vehicle_license = :license,
                    year = :year,
                    status_availability_id = :status_id,
                    user_admin_id = :user_admin_id,
                    is_active = :is_active,
                    updated_at = NOW()
                WHERE vehicle_id = :id";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':model_id', $vehicleData['vehicle_model_id'], PDO::PARAM_INT);
        $stmt->bindParam(':license', $vehicleData['vehicle_license']);
        $stmt->bindParam(':year', $vehicleData['year']);
        $stmt->bindParam(':status_id', $vehicleData['status_availability_id'], PDO::PARAM_INT);
        $stmt->bindParam(':user_admin_id', $vehicleData['user_admin_id'], PDO::PARAM_INT);
        $stmt->bindParam(':is_active', $vehicleData['is_active'], PDO::PARAM_BOOL);
        $stmt->bindParam(':id', $vehicleData['vehicle_id'], PDO::PARAM_INT);

        // Execute update
        $success = $stmt->execute();
        if ($success) {
            // Non-blocking audit logging for vehicle update
            try {
                // Determine actor id: prefer user_personnel_id, fallback to user_admin_id
                $actorId = null;
                if (isset($vehicleData['user_personnel_id']) && $vehicleData['user_personnel_id'] !== '') {
                    $actorId = (int)$vehicleData['user_personnel_id'];
                } elseif (isset($vehicleData['user_admin_id']) && $vehicleData['user_admin_id'] !== '') {
                    $actorId = (int)$vehicleData['user_admin_id'];
                }

                // Compose description
                $newLicense = $vehicleData['vehicle_license'] ?? '';
                if ($oldLicense !== null && $oldLicense !== $newLicense) {
                    $desc = "Updated Vehicle: '" . $oldLicense . "' -> '" . $newLicense . "'";
                } else {
                    $desc = 'Updated Vehicle: ' . $newLicense;
                }

                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $auditStmt = $this->conn->prepare($auditSql);
                $auditStmt->execute([
                    ':description' => $desc,
                    ':action' => 'UPDATE VEHICLE',
                    ':created_by' => $actorId
                ]);
            } catch (Throwable $te) { /* ignore audit errors */ }

            return json_encode(['status' => 'success', 'message' => 'Vehicle updated successfully', 'vehicle_id' => $vehicleData['vehicle_id']]);
        } else {
            return json_encode(['status' => 'error', 'message' => 'Failed to update vehicle']);
        }
    } catch (PDOException $e) {
        error_log("Database error in updateVehicleLicense: " . $e->getMessage());
        return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

public function saveVenue($data) {
    error_log("saveVenue received data: " . print_r($data, true));

    try {
        if (!isset($data['user_admin_id'])) {
            return json_encode(['status' => 'error', 'message' => 'Admin ID is required']);
        }
        if (!isset($data['name']) || !isset($data['occupancy']) || !isset($data['event_type']) || !isset($data['area_type'])) {
            return json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        }
        
        // Check if venue name exists in the same building
        $buildingId = isset($data['building_id']) && $data['building_id'] !== '' ? $data['building_id'] : null;
        if ($this->venueExistsInBuilding($data['name'], $buildingId)) {
            return json_encode(['status' => 'error', 'message' => 'This venue name is already in use in this location.']);
        }

        $sql = "INSERT INTO tbl_venue 
                (ven_name, ven_occupancy, ven_minimum, status_availability_id, user_admin_id, event_type, area_type, venue_building_id) 
                VALUES (:name, :occupancy, :min_occupancy, 1, :admin_id, :event_type, :area_type, :building_id)";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':name', $data['name'], PDO::PARAM_STR);
        $stmt->bindParam(':occupancy', $data['occupancy'], PDO::PARAM_INT);
        $minOccupancy = isset($data['min_occupancy']) ? intval($data['min_occupancy']) : 0;
        $stmt->bindParam(':min_occupancy', $minOccupancy, PDO::PARAM_INT);
        $stmt->bindParam(':admin_id', $data['user_admin_id'], PDO::PARAM_INT);
        $stmt->bindParam(':event_type', $data['event_type'], PDO::PARAM_STR);
        $stmt->bindParam(':area_type', $data['area_type'], PDO::PARAM_STR);
        $buildingId = isset($data['building_id']) && $data['building_id'] !== '' ? $data['building_id'] : null;
        $stmt->bindParam(':building_id', $buildingId, PDO::PARAM_INT);

        if ($stmt->execute()) {
            $venueId = $this->conn->lastInsertId();
            // Audit log
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $desc = "Created Venue : " . $data['name'];
                $action = 'CREATE';
                $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                $audit->bindParam(':action', $action, PDO::PARAM_STR);
                $audit->bindParam(':created_by', $data['user_admin_id'], PDO::PARAM_INT);
                $audit->execute();
            } catch (PDOException $e) {
                error_log("Audit log insert failed (saveVenue): " . $e->getMessage());
            }
            return json_encode(['status' => 'success', 'message' => 'Venue added successfully', 'venue_id' => $venueId]);
        }

        return json_encode(['status' => 'error', 'message' => 'Failed to add venue']);
    } catch(PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

public function updateVenue($venueData) {
    try {
        if (!isset($venueData['venue_id'], $venueData['venue_name'], $venueData['max_occupancy'], $venueData['status_availability_id'], $venueData['event_type'], $venueData['area_type'])) {
            return json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        }

        // Check if venue name exists in the same building (excluding current venue)
        $buildingId = isset($venueData['building_id']) && $venueData['building_id'] !== '' ? $venueData['building_id'] : null;
        if ($this->venueExistsInBuilding($venueData['venue_name'], $buildingId, $venueData['venue_id'])) {
            return json_encode(['status' => 'error', 'message' => 'This venue name is already in use in this location.']);
        }

        // Check if status_availability_id is being changed
        if (isset($venueData['status_availability_id'])) {
            // Get current status_availability_id
            $currentStatusStmt = $this->conn->prepare("SELECT status_availability_id FROM tbl_venue WHERE ven_id = :venue_id");
            $currentStatusStmt->bindParam(':venue_id', $venueData['venue_id'], PDO::PARAM_INT);
            $currentStatusStmt->execute();
            $currentStatus = $currentStatusStmt->fetch(PDO::FETCH_ASSOC);
            
            // Only check for active transactions if status is actually changing
            if ($currentStatus && $currentStatus['status_availability_id'] != $venueData['status_availability_id']) {
                $activeTransactionCheck = $this->checkActiveTransactions('venue', [$venueData['venue_id']]);
                // Disabled restriction: previously prevented updating venue status when there were active reservations
                // if ($activeTransactionCheck['hasActive']) {
                //     return json_encode([
                //         'status' => 'error', 
                //         'message' => 'Cannot update venue status with active reservations: ' . implode(', ', $activeTransactionCheck['resourcesWithTransactions'])
                //     ]);
                // }
            }
        }

        $sql = "UPDATE tbl_venue SET 
                    ven_name = :venue_name, 
                    ven_occupancy = :max_occupancy,
                    ven_minimum = :min_occupancy,
                    status_availability_id = :status_availability_id,
                    event_type = :event_type,
                    area_type = :area_type,
                    venue_building_id = :building_id
                WHERE ven_id = :venue_id";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':venue_name', $venueData['venue_name'], PDO::PARAM_STR);
        $stmt->bindParam(':max_occupancy', $venueData['max_occupancy'], PDO::PARAM_INT);
        $minOccupancy = isset($venueData['min_occupancy']) ? intval($venueData['min_occupancy']) : 0;
        $stmt->bindParam(':min_occupancy', $minOccupancy, PDO::PARAM_INT);
        $stmt->bindParam(':status_availability_id', $venueData['status_availability_id'], PDO::PARAM_INT);
        $stmt->bindParam(':event_type', $venueData['event_type'], PDO::PARAM_STR);
        $stmt->bindParam(':area_type', $venueData['area_type'], PDO::PARAM_STR);
        $buildingId = isset($venueData['building_id']) && $venueData['building_id'] !== '' ? $venueData['building_id'] : null;
        $stmt->bindParam(':building_id', $buildingId, PDO::PARAM_INT);
        $stmt->bindParam(':venue_id', $venueData['venue_id'], PDO::PARAM_INT);

        $success = $stmt->execute();
        if ($success) {
            // Non-blocking audit logging for venue update
            try {
                // Determine actor id: prefer user_personnel_id, fallback to user_admin_id if provided
                $actorId = null;
                if (isset($venueData['user_personnel_id']) && $venueData['user_personnel_id'] !== '') {
                    $actorId = (int)$venueData['user_personnel_id'];
                } elseif (isset($venueData['user_admin_id']) && $venueData['user_admin_id'] !== '') {
                    $actorId = (int)$venueData['user_admin_id'];
                }

                // Get actor name
                $actorName = null;
                if (!empty($actorId)) {
                    $personSql = "SELECT CONCAT(\n                                    users_fname,\n                                    CASE WHEN users_mname IS NOT NULL AND users_mname != '' THEN CONCAT(' ', LEFT(users_mname, 1), '.') ELSE '' END,\n                                    ' ', users_lname\n                                  ) AS full_name\n                               FROM tbl_users WHERE users_id = :id";
                    $personStmt = $this->conn->prepare($personSql);
                    $personStmt->execute([':id' => $actorId]);
                    $row = $personStmt->fetch(PDO::FETCH_ASSOC);
                    $actorName = $row && !empty($row['full_name']) ? $row['full_name'] : ('User #' . $actorId);
                }

                $venueName = $venueData['venue_name'] ?? '';
                $desc = 'Updated Venue: ' . $venueName;

                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $auditStmt = $this->conn->prepare($auditSql);
                $auditStmt->execute([
                    ':description' => $desc,
                    ':action' => 'UPDATE VENUE',
                    ':created_by' => $actorId
                ]);
            } catch (Throwable $te) { /* ignore audit errors */ }

            return json_encode(['status' => 'success', 'message' => 'Venue updated successfully']);
        } else {
            return json_encode(['status' => 'error', 'message' => 'Could not update venue']);
        }
    } catch (PDOException $e) {
        error_log('Database error in updateVenue: ' . $e->getMessage());
        return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

public function saveUser($data) {
    try {
        // Make sure schoolId is a string
        if (isset($data['schoolId'])) {
            $data['schoolId'] = (string) $data['schoolId'];
        }

        // ——— 1) Check if the SAME school ID + email already exists ———
        $sql = "SELECT COUNT(*) AS cnt
                  FROM tbl_users
                 WHERE users_school_id = :schoolId
                   AND users_email     = :email";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':schoolId', $data['schoolId'], PDO::PARAM_STR);
        $stmt->bindParam(':email',    $data['email'],    PDO::PARAM_STR);
        $stmt->execute();
        if ((int)$stmt->fetch(PDO::FETCH_OBJ)->cnt > 0) {
            return json_encode([
                'status'  => 'error',
                'message' => 'A user with that School ID and Email already exists.'
            ]);
        }

        // ——— 2) Check if school ID alone already exists ———
        $sql = "SELECT COUNT(*) AS cnt
                  FROM tbl_users
                 WHERE users_school_id = :schoolId";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':schoolId', $data['schoolId'], PDO::PARAM_STR);
        $stmt->execute();
        if ((int)$stmt->fetch(PDO::FETCH_OBJ)->cnt > 0) {
            return json_encode([
                'status'  => 'error',
                'message' => 'School ID already exists.'
            ]);
        }

        // ——— 3) Check if email alone already exists ———
        $sql = "SELECT COUNT(*) AS cnt
                  FROM tbl_users
                 WHERE users_email = :email";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':email', $data['email'], PDO::PARAM_STR);
        $stmt->execute();
        if ((int)$stmt->fetch(PDO::FETCH_OBJ)->cnt > 0) {
            return json_encode([
                'status'  => 'error',
                'message' => 'Email address already exists.'
            ]);
        }

        // ——— 4) Check if full personal details already exist ———
        $sql = "SELECT COUNT(*) AS cnt
                  FROM tbl_users
                 WHERE users_fname     = :fname
                   AND users_mname     = :mname
                   AND users_lname     = :lname
                   AND users_birthdate = :birthdate";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':fname',     $data['fname'],     PDO::PARAM_STR);
        $stmt->bindParam(':mname',     $data['mname'],     PDO::PARAM_STR);
        $stmt->bindParam(':lname',     $data['lname'],     PDO::PARAM_STR);
        $stmt->bindParam(':birthdate', $data['birthdate'], PDO::PARAM_STR);
        $stmt->execute();
        if ((int)$stmt->fetch(PDO::FETCH_OBJ)->cnt > 0) {
            return json_encode([
                'status'  => 'error',
                'message' => 'A user with the same personal details already exists.'
            ]);
        }

        // ——— 5) Handle base64 image upload ———
        $picPath = null;
        if (!empty($data['pic'])) {
            $uploadDir = 'uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            list($meta, $b64) = explode(';base64,', $data['pic']);
            $type    = substr($meta, strpos($meta, '/') + 1);
            $decoded = base64_decode($b64);
            $filename = 'profile_' . time() . '.' . $type;
            $picPath   = $uploadDir . $filename;
            file_put_contents($picPath, $decoded);
        }

        // ——— 6) Hash password ———
        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

        // ——— 7) Insert new user ———
        $sql = "INSERT INTO tbl_users (
                    title_id,
                    users_fname, users_mname, users_lname,
                    users_email, users_school_id, users_contact_number,
                    license_number,
                    users_user_level_id, users_password, users_department_id,
                    users_birthdate, users_suffix, users_pic,
                    first_login,
                    users_created_at, users_updated_at
                ) VALUES (
                    :title_id,
                    :fname, :mname, :lname,
                    :email, :schoolId, :contact,
                    :license_number,
                    :userLevelId, :password, :departmentId,
                    :birthdate, :suffix, :pic,
                    1,
                    NOW(), NOW()
                )";

        $stmt = $this->conn->prepare($sql);
        
        // Prepare license_number variable for bindParam (cannot pass expressions by reference)
        $licenseNumber = $data['license_number'] ?? null;
        
        $stmt->bindParam(':title_id',      $data['title_id'],      PDO::PARAM_INT);
        $stmt->bindParam(':fname',         $data['fname'],         PDO::PARAM_STR);
        $stmt->bindParam(':mname',         $data['mname'],         PDO::PARAM_STR);
        $stmt->bindParam(':lname',         $data['lname'],         PDO::PARAM_STR);
        $stmt->bindParam(':email',         $data['email'],         PDO::PARAM_STR);
        $stmt->bindParam(':schoolId',      $data['schoolId'],      PDO::PARAM_STR);
        $stmt->bindParam(':contact',       $data['contact'],       PDO::PARAM_STR);
        $stmt->bindParam(':license_number', $licenseNumber,         PDO::PARAM_STR);
        $stmt->bindParam(':userLevelId',   $data['userLevelId'],   PDO::PARAM_INT);
        $stmt->bindParam(':password',      $hashedPassword,        PDO::PARAM_STR);
        $stmt->bindParam(':departmentId',  $data['departmentId'],  PDO::PARAM_INT);
        $stmt->bindParam(':birthdate',     $data['birthdate'],     PDO::PARAM_STR);
        $stmt->bindParam(':suffix',        $data['suffix'],        PDO::PARAM_STR);
        $stmt->bindParam(':pic',           $picPath,               PDO::PARAM_STR);

        if ($stmt->execute()) {
            $newUserId = $this->conn->lastInsertId();
            
            // Audit log (non-blocking): User: (fullname) has been created
            try {
                $actorId = null;
                if (isset($data['user_personnel_id']) && $data['user_personnel_id'] !== '') {
                    $actorId = (int)$data['user_personnel_id'];
                } elseif (isset($data['user_admin_id']) && $data['user_admin_id'] !== '') {
                    $actorId = (int)$data['user_admin_id'];
                }

                $mInitial = (isset($data['mname']) && trim($data['mname']) !== '') ? (' ' . strtoupper(substr($data['mname'], 0, 1)) . '.') : '';
                $fullName = trim(($data['fname'] ?? '') . $mInitial . ' ' . ($data['lname'] ?? ''));
                $desc = 'User: ' . $fullName . ' has been created';

                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) 
                             VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $audit->execute([
                    ':description' => $desc,
                    ':action' => 'CREATE USER',
                    ':created_by' => $actorId
                ]);
            } catch (Throwable $te) { /* ignore audit errors */ }

            // Fetch newly created user data with all details
            try {
                $fetchSql = "SELECT 
                                u.*,
                                t.abbreviation AS title_abbreviation,
                                d.departments_name,
                                ul.user_level_name
                            FROM 
                                tbl_users u
                            LEFT JOIN 
                                titles t ON u.title_id = t.id
                            LEFT JOIN 
                                tbl_departments d ON u.users_department_id = d.departments_id
                            LEFT JOIN 
                                tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                            WHERE 
                                u.users_id = :userId";
                
                $fetchStmt = $this->conn->prepare($fetchSql);
                $fetchStmt->execute([':userId' => $newUserId]);
                $newUser = $fetchStmt->fetch(PDO::FETCH_ASSOC);
                
                return json_encode([
                    'status'  => 'success',
                    'message' => 'User added successfully.',
                    'user_id' => $newUserId,
                    'data' => $newUser
                ]);
            } catch (Throwable $fe) {
                // If fetch fails, still return success with user_id
                return json_encode([
                    'status'  => 'success',
                    'message' => 'User added successfully.',
                    'user_id' => $newUserId
                ]);
            }
        }

        return json_encode([
            'status'  => 'error',
            'message' => 'Failed to add user.'
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status'  => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}




public function updateUser($userData) {
    try {
        // Check required keys
        if (!isset($userData['userId'], $userData['schoolId'], $userData['email'])) {
            return json_encode([
                'status' => 'error',
                'message' => 'Missing required fields: userId, schoolId, or email.'
            ]);
        }
        // Cast and extract
        $userId    = (int)   $userData['userId'];
        $schoolId  = (string)$userData['schoolId'];
        $email     =           $userData['email'];

        // 1) Check if another user has the same School ID + Email
        $sql = "SELECT COUNT(*) AS cnt
                  FROM tbl_users
                 WHERE users_school_id = :schoolId
                   AND users_email     = :email
                   AND users_id       != :userId";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':schoolId' => $schoolId,
            ':email'    => $email,
            ':userId'   => $userId
        ]);
        if ((int)$stmt->fetch(PDO::FETCH_OBJ)->cnt > 0) {
            return json_encode([
                'status'  => 'error',
                'message' => 'Another user with that School ID and Email already exists.'
            ]);
        }

        // 2) Check if another user has the same School ID
        $sql = "SELECT COUNT(*) AS cnt
                  FROM tbl_users
                 WHERE users_school_id = :schoolId
                   AND users_id       != :userId";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':schoolId' => $schoolId,
            ':userId'   => $userId
        ]);
        if ((int)$stmt->fetch(PDO::FETCH_OBJ)->cnt > 0) {
            return json_encode([
                'status'  => 'error',
                'message' => 'Another user with that School ID already exists.'
            ]);
        }

        // 3) Check if another user has the same Email
        $sql = "SELECT COUNT(*) AS cnt
                  FROM tbl_users
                 WHERE users_email = :email
                   AND users_id   != :userId";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':email'  => $email,
            ':userId' => $userId
        ]);
        if ((int)$stmt->fetch(PDO::FETCH_OBJ)->cnt > 0) {
            return json_encode([
                'status'  => 'error',
                'message' => 'Another user with that Email address already exists.'
            ]);
        }

        // Fetch existing user (for audit diff)
        $oldUser = null;
        try {
            $oldStmt = $this->conn->prepare("SELECT 
                    title_id,
                    users_fname, users_mname, users_lname,
                    users_birthdate, users_suffix,
                    users_email, users_school_id, users_contact_number,
                    license_number,
                    users_user_level_id, users_department_id,
                    users_pic, is_active
                FROM tbl_users WHERE users_id = :userId");
            $oldStmt->execute([':userId' => $userId]);
            $oldUser = $oldStmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (Throwable $te) { /* ignore fetch errors */ }

        // —— Build the UPDATE statement ——
        $sql = "UPDATE tbl_users SET 
                    title_id             = :title_id,
                    users_fname          = :fname,
                    users_mname          = :mname,
                    users_lname          = :lname,
                    users_birthdate      = :birthdate,
                    users_suffix         = :suffix,
                    users_email          = :email,
                    users_school_id      = :schoolId,
                    users_contact_number = :contact,
                    license_number       = :license_number,
                    users_user_level_id  = :userLevelId,
                    users_department_id  = :departmentId,
                    users_pic            = :pic,
                    is_active            = :isActive,
                    users_updated_at     = NOW()";

        if (!empty($userData['password'])) {
            $sql .= ", users_password = :password";
        }
        $sql .= " WHERE users_id = :userId";

        $stmt = $this->conn->prepare($sql);

        // Prepare license_number variable for bindParam (cannot pass expressions by reference)
        $licenseNumber = $userData['license_number'] ?? null;

        // Bind common params
        $stmt->bindParam(':title_id',      $userData['title_id'],      PDO::PARAM_INT);
        $stmt->bindParam(':fname',         $userData['fname'],         PDO::PARAM_STR);
        $stmt->bindParam(':mname',         $userData['mname'],         PDO::PARAM_STR);
        $stmt->bindParam(':lname',         $userData['lname'],         PDO::PARAM_STR);
        $stmt->bindParam(':birthdate',     $userData['birthdate'],     PDO::PARAM_STR);
        $stmt->bindParam(':suffix',        $userData['suffix'],        PDO::PARAM_STR);
        $stmt->bindParam(':email',         $email,                     PDO::PARAM_STR);
        $stmt->bindParam(':schoolId',      $schoolId,                  PDO::PARAM_STR);
        $stmt->bindParam(':contact',       $userData['contact'],       PDO::PARAM_STR);
        $stmt->bindParam(':license_number', $licenseNumber,             PDO::PARAM_STR);
        $stmt->bindParam(':userLevelId',   $userData['userLevelId'],   PDO::PARAM_INT);
        $stmt->bindParam(':departmentId',  $userData['departmentId'],  PDO::PARAM_INT);
        $stmt->bindParam(':pic',           $userData['pic'],           PDO::PARAM_STR);
        $stmt->bindParam(':isActive',      $userData['isActive'],      PDO::PARAM_BOOL);
        $stmt->bindParam(':userId',        $userId,                    PDO::PARAM_INT);

        // Hash & bind the new password if provided
        if (!empty($userData['password'])) {
            $hashed = password_hash($userData['password'], PASSWORD_BCRYPT);
            $stmt->bindParam(':password', $hashed, PDO::PARAM_STR);
        }

        // Execute update
        if ($stmt->execute()) {
            // Audit log (non-blocking): list specific field changes
            try {
                // Determine actor
                $actorId = null;
                if (isset($userData['user_personnel_id']) && $userData['user_personnel_id'] !== '') {
                    $actorId = (int)$userData['user_personnel_id'];
                } elseif (isset($userData['user_admin_id']) && $userData['user_admin_id'] !== '') {
                    $actorId = (int)$userData['user_admin_id'];
                }

                // Compute new full name and changes
                $mInitial = (isset($userData['mname']) && trim($userData['mname']) !== '') ? (' ' . strtoupper(substr($userData['mname'], 0, 1)) . '.') : '';
                $fullName = trim(($userData['fname'] ?? '') . $mInitial . ' ' . ($userData['lname'] ?? ''));

                $changes = [];
                if (is_array($oldUser)) {
                    $map = [
                        'title_id'             => ['label' => 'title',          'new' => $userData['title_id']        ?? null],
                        'users_fname'          => ['label' => 'first name',     'new' => $userData['fname']           ?? null],
                        'users_mname'          => ['label' => 'middle name',    'new' => $userData['mname']           ?? null],
                        'users_lname'          => ['label' => 'last name',      'new' => $userData['lname']           ?? null],
                        'users_birthdate'      => ['label' => 'birthdate',      'new' => $userData['birthdate']       ?? null],
                        'users_suffix'         => ['label' => 'suffix',         'new' => $userData['suffix']          ?? null],
                        'users_email'          => ['label' => 'email',          'new' => $email],
                        'users_school_id'      => ['label' => 'school id',      'new' => $schoolId],
                        'users_contact_number' => ['label' => 'contact number', 'new' => $userData['contact']         ?? null],
                        'license_number'       => ['label' => 'license number', 'new' => $userData['license_number']  ?? null],
                        'users_user_level_id'  => ['label' => 'user level',     'new' => $userData['userLevelId']     ?? null],
                        'users_department_id'  => ['label' => 'department',     'new' => $userData['departmentId']    ?? null],
                        'users_pic'            => ['label' => 'pic',            'new' => $userData['pic']             ?? null],
                        'is_active'            => ['label' => 'is active',      'new' => isset($userData['isActive']) ? (int)$userData['isActive'] : null],
                    ];
                    foreach ($map as $col => $info) {
                        if (array_key_exists($col, $oldUser) && $info['new'] !== null) {
                            $oldVal = $oldUser[$col];
                            $newVal = $info['new'];
                            // normalize boolean-like values
                            if ($col === 'is_active') {
                                $oldVal = ($oldVal === null) ? null : (int)$oldVal;
                                $newVal = ($newVal === null) ? null : (int)$newVal;
                            }
                            if ((string)$oldVal !== (string)$newVal) {
                                $changes[] = $info['label'] . ': ' . ( ($oldVal === null || $oldVal === '') ? 'null' : $oldVal ) . ' -> ' . ( ($newVal === null || $newVal === '') ? 'null' : $newVal );
                            }
                        }
                    }
                    if (!empty($userData['password'])) {
                        $changes[] = 'password: changed';
                    }
                }

                $changeDesc = empty($changes) ? 'no field changes detected' : implode('; ', $changes);
                $desc = 'User: ' . $fullName . ' has been updated. Changes: ' . $changeDesc;

                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $audit->execute([
                    ':description' => $desc,
                    ':action' => 'UPDATE USER',
                    ':created_by' => $actorId
                ]);
            } catch (Throwable $te) { /* ignore audit errors */ }

            // Fetch updated user data with all details
            try {
                $fetchSql = "SELECT 
                                u.*,
                                t.abbreviation AS title_abbreviation,
                                d.departments_name,
                                ul.user_level_name
                            FROM 
                                tbl_users u
                            LEFT JOIN 
                                titles t ON u.title_id = t.id
                            LEFT JOIN 
                                tbl_departments d ON u.users_department_id = d.departments_id
                            LEFT JOIN 
                                tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                            WHERE 
                                u.users_id = :userId";
                
                $fetchStmt = $this->conn->prepare($fetchSql);
                $fetchStmt->execute([':userId' => $userId]);
                $updatedUser = $fetchStmt->fetch(PDO::FETCH_ASSOC);
                
                return json_encode([
                    'status'  => 'success',
                    'message' => 'User updated successfully.',
                    'data' => $updatedUser
                ]);
            } catch (Throwable $fe) {
                // If fetch fails, still return success for the update
                return json_encode([
                    'status'  => 'success',
                    'message' => 'User updated successfully.'
                ]);
            }
        }

        return json_encode([
            'status'  => 'error',
            'message' => 'Could not update user.'
        ]);
    }
    catch (PDOException $e) {
        return json_encode([
            'status'  => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}


public function venueExists($venueName) {
        try {
            $sql = "SELECT COUNT(*) FROM tbl_venue WHERE ven_name = :name";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $venueName);
            $stmt->execute();
            return $stmt->fetchColumn() > 0;
        } catch(PDOException $e) {
            return false; // Treat as not existing on error
        }
    }

    // Check if venue name exists in a specific building
    public function venueExistsInBuilding($venueName, $buildingId = null, $excludeVenueId = null) {
        try {
            $sql = "SELECT COUNT(*) FROM tbl_venue WHERE ven_name = :name";
            
            // Add building condition
            if ($buildingId !== null) {
                $sql .= " AND venue_building_id = :building_id";
            } else {
                $sql .= " AND venue_building_id IS NULL";
            }
            
            // Exclude current venue when updating
            if ($excludeVenueId !== null) {
                $sql .= " AND ven_id != :exclude_id";
            }
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $venueName, PDO::PARAM_STR);
            
            if ($buildingId !== null) {
                $stmt->bindParam(':building_id', $buildingId, PDO::PARAM_INT);
            }
            
            if ($excludeVenueId !== null) {
                $stmt->bindParam(':exclude_id', $excludeVenueId, PDO::PARAM_INT);
            }
            
            $stmt->execute();
            return $stmt->fetchColumn() > 0;
        } catch(PDOException $e) {
            error_log("venueExistsInBuilding error: " . $e->getMessage());
            return false; // Treat as not existing on error
        }
    }

    // Update an existing reservation driver
    public function updateDriver($reservation_driver_id, $reservation_driver_user_id, $driver_name = null) {
        // Debug logging inside the method
       
        try {
            // Handle custom driver case - when driverId is 'custom', treat as null for user_id
            if ($reservation_driver_user_id === 'custom') {
                $reservation_driver_user_id = null;
              
            }
            $sql = "UPDATE tbl_reservation_driver SET 
                        reservation_driver_user_id = :reservation_driver_user_id,
                        driver_name = :driver_name,
                        updated_at = NOW()
                    WHERE reservation_driver_id = :reservation_driver_id";
            $stmt = $this->conn->prepare($sql);
            
          
            
            $stmt->bindValue(':reservation_driver_id', $reservation_driver_id, PDO::PARAM_INT);
            $stmt->bindValue(':reservation_driver_user_id', $reservation_driver_user_id, is_null($reservation_driver_user_id) ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindValue(':driver_name', $driver_name, is_null($driver_name) ? PDO::PARAM_NULL : PDO::PARAM_STR);
            
            if ($stmt->execute()) {
                $affectedRows = $stmt->rowCount();
                if ($affectedRows > 0) {
                    return json_encode([
                        'status' => 'success',
                        'message' => 'Driver updated successfully',
                        'affected_rows' => $affectedRows
                    ]);
                } else {
                    return json_encode([
                        'status' => 'error',
                        'message' => 'No driver record found to update'
                    ]);
                }
            } else {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Failed to update driver'
                ]);
            }
        } catch(PDOException $e) {
            error_log("updateDriver PDO error: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    // Insert or update a reservation driver (supports both user_id and driver_name for "No Driver Available" cases)
    public function insertDriver($reservation_driver_user_id, $reservation_vehicle_id = null, $driver_name = null, $reservation_driver_id = null) {
       
        try {
            // Handle custom driver case - when driverId is 'custom', treat as null for user_id
            if ($reservation_driver_user_id === 'custom') {
                $reservation_driver_user_id = null;
            }
            
            // If reservation_driver_id is provided, update existing record
            if ($reservation_driver_id) {
                return $this->updateDriver($reservation_driver_id, $reservation_driver_user_id, $driver_name);
            }
            
            // Otherwise, insert new record
            $sql = "INSERT INTO tbl_reservation_driver (
                        reservation_driver_user_id,
                        driver_name,
                        reservation_vehicle_id,
                        created_at,
                        updated_at
                    ) VALUES (
                        :reservation_driver_user_id,
                        :driver_name,
                        :reservation_vehicle_id,
                        NOW(),
                        NOW()
                    )";
            $stmt = $this->conn->prepare($sql);
            
            
            
            $stmt->bindValue(':reservation_driver_user_id', $reservation_driver_user_id, is_null($reservation_driver_user_id) ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindValue(':driver_name', $driver_name, is_null($driver_name) ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->bindValue(':reservation_vehicle_id', $reservation_vehicle_id, is_null($reservation_vehicle_id) ? PDO::PARAM_NULL : PDO::PARAM_INT);
            if ($stmt->execute()) {
                $newDriverId = $this->conn->lastInsertId();
                
                // Get reservation_id from tbl_reservation_vehicle
                $reservationId = null;
                $reservationTitle = 'Reservation';
                
                if ($reservation_vehicle_id) {
                    $sqlGetReservation = "
                        SELECT rv.reservation_reservation_id, r.reservation_title
                        FROM tbl_reservation_vehicle rv
                        INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                        WHERE rv.reservation_vehicle_id = :vehicle_id
                    ";
                    $stmtGetReservation = $this->conn->prepare($sqlGetReservation);
                    $stmtGetReservation->bindValue(':vehicle_id', $reservation_vehicle_id, PDO::PARAM_INT);
                    $stmtGetReservation->execute();
                    $reservationData = $stmtGetReservation->fetch(PDO::FETCH_ASSOC);
                    
                    if ($reservationData) {
                        $reservationId = $reservationData['reservation_reservation_id'];
                        $reservationTitle = $reservationData['reservation_title'] ?? 'Reservation';
                    }
                }
                
                // Send notification to driver (only if driver has user_id - not custom driver)
                if ($reservation_driver_user_id && $reservationId) {
                    try {
                        // Get driver name for notification message
                        $driverName = 'Driver';
                        $sqlGetDriver = "
                            SELECT CONCAT(users_fname, ' ', users_lname) AS full_name
                            FROM tbl_users
                            WHERE users_id = :user_id
                        ";
                        $stmtGetDriver = $this->conn->prepare($sqlGetDriver);
                        $stmtGetDriver->bindValue(':user_id', $reservation_driver_user_id, PDO::PARAM_INT);
                        $stmtGetDriver->execute();
                        $driverData = $stmtGetDriver->fetch(PDO::FETCH_ASSOC);
                        if ($driverData) {
                            $driverName = $driverData['full_name'];
                        }
                        
                        // Insert notification into tbl_notification_reservation
                        $notificationMessage = "You have been assigned as a driver for '{$reservationTitle}'";
                        $sqlNotification = "
                            INSERT INTO tbl_notification_reservation 
                            (notification_message, notification_reservation_reservation_id, notification_user_id, notification_created_at, is_read) 
                            VALUES (:message, :reservation_id, :user_id, NOW(), 0)
                        ";
                        $stmtNotification = $this->conn->prepare($sqlNotification);
                        $stmtNotification->bindValue(':message', $notificationMessage, PDO::PARAM_STR);
                        $stmtNotification->bindValue(':reservation_id', $reservationId, PDO::PARAM_INT);
                        $stmtNotification->bindValue(':user_id', $reservation_driver_user_id, PDO::PARAM_INT);
                        $stmtNotification->execute();
                        
                       
                        // Send push notification
                        $pushTitle = "Driver Assignment";
                        $pushBody = "You have been assigned as a driver for '{$reservationTitle}'";
                        $pushData = [
                            'reservation_id' => $reservationId,
                            'type' => 'driver_assignment',
                            'url' => '/gsd/grms/Admin/viewRequest'
                        ];
                        
                        $this->sendPushNotificationToUser($reservation_driver_user_id, $pushTitle, $pushBody, $pushData);
                       
                    } catch (Exception $e) {
                        error_log("Error sending notification to driver: " . $e->getMessage());
                        // Continue even if notification fails
                    }
                }
                
                return json_encode([
                    'status' => 'success',
                    'message' => 'Driver assigned to reservation successfully',
                    'reservation_driver_id' => $newDriverId
                ]);
            } else {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Failed to assign driver to reservation'
                ]);
            }
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }



    public function sendEnhancedNotification($userId, $message, $reservationId = null, $type = 'info') {
        try {
            // Include notification helper
            require_once 'notification_helper.php';
            $notificationHelper = new NotificationHelper();
            
            // Send notification using helper
            $result = $notificationHelper->sendUserNotification($userId, $message, $reservationId, $type);
            
            return $result;
        } catch (Exception $e) {
            return json_encode(['status' => 'error', 'message' => 'Notification error: ' . $e->getMessage()]);
        }
    }

    // Enhanced department notification with push support
    public function sendEnhancedDepartmentNotification($departmentId, $userLevelId, $message) {
        try {
            // Include notification helper
            require_once 'notification_helper.php';
            $notificationHelper = new NotificationHelper();
            
            // Send department notification using helper
            $result = $notificationHelper->sendDepartmentNotification($departmentId, $userLevelId, $message);
            
            return $result;
        } catch (Exception $e) {
            return json_encode(['status' => 'error', 'message' => 'Department notification error: ' . $e->getMessage()]);
        }
    }

    public function fetchRecord() {
        try {
            $sql = "
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
                    TRIM(
                        CONCAT(
                            COALESCE(t.abbreviation, ''),
                            CASE WHEN COALESCE(t.abbreviation, '') <> '' THEN ' ' ELSE '' END,
                            COALESCE(u.users_fname, ''),
                            CASE WHEN COALESCE(u.users_mname, '') <> '' THEN CONCAT(' ', u.users_mname) ELSE '' END,
                            CASE WHEN COALESCE(u.users_lname, '') <> '' THEN CONCAT(' ', u.users_lname) ELSE '' END,
                            CASE WHEN COALESCE(u.users_suffix, '') <> '' THEN CONCAT(', ', u.users_suffix) ELSE '' END
                        )
                    ) AS user_full_name,
                    u.users_suffix AS requester_suffix,
                    t.abbreviation AS requester_title_abbreviation,
                    sm.status_master_name AS reservation_status_name,
                    latest_status.reservation_status_status_id,
                    latest_status.reservation_updated_at,
                    latest_status.reservation_active,
                    CASE WHEN active_resched.max_reschedule_status_id IS NULL THEN 0 ELSE 1 END AS has_active_reschedule,
                    
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
    
                FROM tbl_reservation r
    
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
    
                LEFT JOIN (
                    SELECT reservation_reservation_id, MAX(reservation_status_id) AS max_reschedule_status_id
                    FROM tbl_reservation_status
                    WHERE reservation_status_status_id IN (10, 11, 14) AND reservation_active IN (0, 1)
                    GROUP BY reservation_reservation_id
                ) active_resched ON active_resched.reservation_reservation_id = r.reservation_id
    
                LEFT JOIN tbl_status_master sm ON sm.status_master_id = latest_status.reservation_status_status_id
                LEFT JOIN tbl_users u ON u.users_id = r.reservation_user_id
                LEFT JOIN titles t ON u.title_id = t.id
    
                ORDER BY r.reservation_created_at DESC
            ";
    
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
    
            $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            // Process each reservation to determine which dates to display
            // Following the same logic as fetchRequestById and fetchAvailability
            foreach ($reservations as &$reservation) {
                $statusId = (int)$reservation['reservation_status_status_id'];
                $active = (int)$reservation['reservation_active'];
                $hasActiveReschedule = (int)$reservation['has_active_reschedule'];
                
                // Determine the effective dates to use based on reschedule status
                // This follows the same pattern as fetchRequestById in reservation.php
                if ($statusId === 14 && $active === 1 && 
                    !empty($reservation['reschedule_start_date']) && 
                    !empty($reservation['reschedule_end_date'])) {
                    // For active reschedule (status 14 with active=1), use reschedule dates
                    $reservation['effective_start_date'] = $reservation['reschedule_start_date'];
                    $reservation['effective_end_date'] = $reservation['reschedule_end_date'];
                } elseif ($statusId === 11 && 
                          !empty($reservation['reschedule_start_date']) && 
                          !empty($reservation['reschedule_end_date'])) {
                    // For status 11 (rescheduled), use reschedule dates
                    $reservation['effective_start_date'] = $reservation['reschedule_start_date'];
                    $reservation['effective_end_date'] = $reservation['reschedule_end_date'];
                } elseif ($statusId === 10 && $hasActiveReschedule && 
                          !empty($reservation['reschedule_start_date']) && 
                          !empty($reservation['reschedule_end_date'])) {
                    // For status 10 with active reschedule, use reschedule dates
                    $reservation['effective_start_date'] = $reservation['reschedule_start_date'];
                    $reservation['effective_end_date'] = $reservation['reschedule_end_date'];
                } elseif ($statusId === 5 && 
                          !empty($reservation['reschedule_start_date']) && 
                          !empty($reservation['reschedule_end_date'])) {
                    // For status 5 (cancelled) with reschedule dates, use reschedule dates
                    // This handles cases where reservation was rescheduled but then cancelled
                    $reservation['effective_start_date'] = $reservation['reschedule_start_date'];
                    $reservation['effective_end_date'] = $reservation['reschedule_end_date'];
                } else {
                    // For all other cases, use original dates
                    $reservation['effective_start_date'] = $reservation['reservation_start_date'];
                    $reservation['effective_end_date'] = $reservation['reservation_end_date'];
                }
                
                // Keep original reschedule dates for reference (like fetchRequestById does)
                // Don't null them out - let the frontend decide what to display
                
                // Remove helper field
                unset($reservation['has_active_reschedule']);
            }
    
            return json_encode(['status' => 'success', 'data' => $reservations]);
    
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
        


    public function insertNotificationTouser($notification_message, $notification_user_id, $reservation_id = null) {
        try {
            $sql = "INSERT INTO tbl_notification_reservation (
                        notification_message, 
                        notification_reservation_reservation_id, 
                        notification_user_id, 
                        notification_created_at, 
                        is_read
                    ) VALUES (
                        :message, 
                        :reservation_id, 
                        :user_id, 
                        NOW(), 
                        0
                    )";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':message', $notification_message, PDO::PARAM_STR);
            $stmt->bindParam(':reservation_id', $reservation_id, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $notification_user_id, PDO::PARAM_INT);
            if ($stmt->execute()) {
                return json_encode([
                    'status' => 'success',
                    'message' => 'Notification inserted successfully',
                    'notification_id' => $this->conn->lastInsertId()
                ]);
            } else {
                return json_encode([
                    'status' => 'error',
                    'message' => 'Failed to insert notification'
                ]);
            }
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }
    public function fetchStatusAvailability() {
        $sql = "SELECT `status_availability_id`, `status_availability_name` FROM `tbl_status_availability` WHERE 1";
        return $this->executeQuery($sql);
    }

    public function saveModelData($json, $userId = null) {
        // Handle both string and array inputs
        if (is_array($json)) {
            $data = $json;
        } else {
            $data = json_decode($json, true);
        }
        

        try {
            // Check if the model name already exists globally (unique across all models)
            $sql = "SELECT COUNT(*) FROM tbl_vehicle_model WHERE vehicle_model_name = :name";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $data['name']);
            $stmt->execute();
            if ($stmt->fetchColumn() > 0) {
                return json_encode(['status' => 'error', 'message' => 'This vehicle model name already exists.']);
            }

            // Prepare bind variables
            $name = $data['name'];
            $category_id = $data['category_id'];
            $make_id = $data['make_id'];

            // Insert if not existing
            $sql = "INSERT INTO tbl_vehicle_model (vehicle_model_name, vehicle_category_id, vehicle_model_vehicle_make_id) 
                    VALUES (:name, :category_id, :make_id)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $name, PDO::PARAM_STR);
            $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
            $stmt->bindParam(':make_id', $make_id, PDO::PARAM_INT);
            $stmt->execute();

            // Non-blocking audit log insert
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $desc = "Created Vehicle Model: '" . ($name ?? '') . "'";
                $action = 'CREATE';
                $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                $audit->bindParam(':action', $action, PDO::PARAM_STR);
                if ($userId !== null) {
                    $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                } else {
                    $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                }
                if (!$audit->execute()) {
                    error_log("Audit log insert failed (saveModelData): " . print_r($audit->errorInfo(), true));
                } else {
                    try {
                        $latestAuditStmt = $this->conn->query("SELECT id, description, action, created_at, created_by FROM audit_log ORDER BY id DESC LIMIT 1");
                        $latest = $latestAuditStmt ? $latestAuditStmt->fetch(PDO::FETCH_ASSOC) : null;
                        
                    } catch (Throwable $te) {
                        error_log("Failed to read back latest audit_log (saveModelData): " . $te->getMessage());
                    }
                }
            } catch (Throwable $e2) {
                error_log("Audit logging error (saveModelData): " . $e2->getMessage());
            }

            return json_encode(['status' => 'success', 'message' => 'Model added successfully.']);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function saveCategoryData($json, $userId = null) {
        // Handle both string and array inputs
        if (is_array($json)) {
            $data = $json;
        } else {
            $data = json_decode($json, true);
        }
       
        // Check if category name is set
        if (!isset($data['vehicle_category_name'])) {
            return json_encode(['status' => 'error', 'message' => 'Category name is required.']);
        }
    
        // Inline existence check
        $sql = "SELECT COUNT(*) FROM tbl_vehicle_category WHERE vehicle_category_name = :name";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':name', $data['vehicle_category_name']);
        $stmt->execute();
        if ($stmt->fetchColumn() > 0) {
            return json_encode(['status' => 'error', 'message' => 'Category already exists.']);
        }
    
        try {
            $sql = "INSERT INTO tbl_vehicle_category (vehicle_category_name) VALUES (:name)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $data['vehicle_category_name']);
            $stmt->execute();

            // Non-blocking audit log insert
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $desc = "Created Vehicle Category: '" . ($data['vehicle_category_name'] ?? '') . "'";
                $action = 'CREATE';
                $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                $audit->bindParam(':action', $action, PDO::PARAM_STR);
                if ($userId !== null) {
                    $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                } else {
                    $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                }
                if (!$audit->execute()) {
                    error_log("Audit log insert failed (saveCategoryData): " . print_r($audit->errorInfo(), true));
                } else {
                    try {
                        $latestAuditStmt = $this->conn->query("SELECT id, description, action, created_at, created_by FROM audit_log ORDER BY id DESC LIMIT 1");
                        $latest = $latestAuditStmt ? $latestAuditStmt->fetch(PDO::FETCH_ASSOC) : null;
                       
                    } catch (Throwable $te) {
                        error_log("Failed to read back latest audit_log (saveCategoryData): " . $te->getMessage());
                    }
                }
            } catch (Throwable $e2) {
                error_log("Audit logging error (saveCategoryData): " . $e2->getMessage());
            }

            return json_encode(['status' => 'success', 'message' => 'Category added successfully.']);
        } catch(PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function saveMakeData($json, $userId = null) {
        // Check if $json is already an array
        if (is_array($json)) {
            $data = $json;
        } else {
            $data = json_decode($json, true);
        }
       
        // Inline existence check
        $sql = "SELECT COUNT(*) FROM tbl_vehicle_make WHERE vehicle_make_name = :name";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':name', $data['vehicle_make_name']);
        $stmt->execute();
        if ($stmt->fetchColumn() > 0) {
            return json_encode(['status' => 'error', 'message' => 'Make already exists.']);
        }

        try {
            $sql = "INSERT INTO tbl_vehicle_make (vehicle_make_name) VALUES (:name)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $data['vehicle_make_name']);
            $stmt->execute();

            // Insert audit log (non-blocking)
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $desc = "Created Vehicle Make: " . ($data['vehicle_make_name'] ?? '');
                $action = 'CREATE';
                $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                $audit->bindParam(':action', $action, PDO::PARAM_STR);
                if ($userId !== null) {
                    $audit->bindParam(':created_by', $userId, PDO::PARAM_INT);
                } else {
                    $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                }
                $audit->execute();
                // Log the latest audit_log entry for verification
                try {
                    $sel = $this->conn->prepare("SELECT id, description, action, created_at, created_by FROM audit_log WHERE 1 ORDER BY id DESC LIMIT 1");
                    $sel->execute();
                    $latest = $sel->fetch(PDO::FETCH_ASSOC);
                    
                } catch (PDOException $ex) {
                    error_log("Audit log select failed (saveMakeData): " . $ex->getMessage());
                }
            } catch (PDOException $e) {
                error_log("Audit log insert failed (saveMakeData): " . $e->getMessage());
            }

            return json_encode(['status' => 'success', 'message' => 'Make added successfully.']);
        } catch(PDOException $e) {
            // Log the error message
            error_log("Error inserting make: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }


// Check if equipment category exists
    public function equipmentCategoryExists($categoryName) {
        try {
            $sql = "SELECT COUNT(*) FROM tbl_equipment_category WHERE equipments_category_name = :name";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $categoryName);
            $stmt->execute();
            return $stmt->fetchColumn() > 0;
        } catch(PDOException $e) {
            return false; // Treat as not existing on error
        }
    }
    public function saveEquipmentCategory($json, $userId = null) {
        // Handle both string and array inputs
        $data = is_array($json) ? $json : json_decode($json, true);
      
        
        // Check if category name is set
        if (!isset($data['equipments_category_name'])) {
            return json_encode(['status' => 'error', 'message' => 'Category name is required.']);
        }
    
        if ($this->equipmentCategoryExists($data['equipments_category_name'])) {
            return json_encode(['status' => 'error', 'message' => 'Equipment category already exists.']);
        }
    
        try {
            $sql = "INSERT INTO tbl_equipment_category (equipments_category_name) 
                    VALUES (:name)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $data['equipments_category_name']);
            $stmt->execute();

            // Non-blocking audit log insert
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $desc = "Created Equipment Category: '" . ($data['equipments_category_name'] ?? '') . "'";
                $action = 'CREATE';
                $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                $audit->bindParam(':action', $action, PDO::PARAM_STR);
                if ($userId !== null) {
                    $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                } else {
                    $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                }
                if (!$audit->execute()) {
                    error_log("Audit log insert failed (saveEquipmentCategory): " . print_r($audit->errorInfo(), true));
                } else {
                    try {
                        $latestAuditStmt = $this->conn->query("SELECT id, description, action, created_at, created_by FROM audit_log ORDER BY id DESC LIMIT 1");
                        $latest = $latestAuditStmt ? $latestAuditStmt->fetch(PDO::FETCH_ASSOC) : null;
                      
                    } catch (Throwable $te) {
                        error_log("Failed to read back latest audit_log (saveEquipmentCategory): " . $te->getMessage());
                    }
                }
            } catch (Throwable $e2) {
                error_log("Audit logging error (saveEquipmentCategory): " . $e2->getMessage());
            }

            return json_encode(['status' => 'success', 'message' => 'Equipment category added successfully.']);
        } catch(PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function saveDepartmentData($json, $userId = null) {
        // Check if $json is already an array
        if (is_array($json)) {
            $data = $json;
        } else {
            $data = json_decode($json, true);
        }
    
        // Check if the department name exists in the input
        if (!isset($data['departments_name'])) {
            return json_encode(['status' => 'error', 'message' => 'Department name is required.']);
        }
    
        // Check if the department already exists (inline, not via departmentExists)
        $sql = "SELECT COUNT(*) FROM tbl_departments WHERE departments_name = :name";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':name', $data['departments_name']);
        $stmt->execute();
        if ($stmt->fetchColumn() > 0) {
            return json_encode(['status' => 'error', 'message' => 'Department already exists.']);
        }
    
        try {
            // Updated INSERT to include department_type
            $sql = "INSERT INTO tbl_departments (departments_name, department_type) VALUES (:name, :type)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $data['departments_name']);
            $stmt->bindParam(':type', $data['department_type']);
            $stmt->execute();

            // Insert audit log (non-blocking)
            try {
                $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                $audit = $this->conn->prepare($auditSql);
                $desc = "Created Department: " . ($data['departments_name'] ?? '') . " (Type: " . ($data['department_type'] ?? '') . ")";
                $action = 'CREATE';
                $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                $audit->bindParam(':action', $action, PDO::PARAM_STR);
                if ($userId !== null) {
                    $audit->bindParam(':created_by', $userId, PDO::PARAM_INT);
                } else {
                    $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                }
                $audit->execute();
            } catch (PDOException $e) {
                error_log("Audit log insert failed (saveDepartmentData): " . $e->getMessage());
            }

            return json_encode(['status' => 'success', 'message' => 'Department added successfully.']);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function fetchMake() {
        $sql = "SELECT vehicle_make_id, vehicle_make_name FROM tbl_vehicle_make WHERE is_active = 1 ORDER BY vehicle_make_id DESC";
        return $this->executeQuery($sql);
    }

    public function fetchDriverRestrictionCodes() {
        $sql = "SELECT restriction_id, restriction_code, restriction_desc, vehicle_category, wheels_count 
                FROM tbl_driver_restriction_codes 
                ORDER BY restriction_code ASC";
        return $this->executeQuery($sql);
    }

    // Fetch driver restrictions for a specific user
    public function fetchDriverRestrictions($userId) {
        try {
            $sql = "SELECT 
                        dr.driver_restriction_id,
                        dr.driver_user_id,
                        dr.restriction_code_id,
                        dr.assigned_at,
                        drc.restriction_code,
                        drc.restriction_desc,
                        drc.vehicle_category,
                        drc.wheels_count
                    FROM tbl_driver_restrictions dr
                    INNER JOIN tbl_driver_restriction_codes drc 
                        ON dr.restriction_code_id = drc.restriction_id
                    WHERE dr.driver_user_id = :user_id
                    ORDER BY drc.restriction_code ASC";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $restrictions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode([
                'status' => 'success',
                'data' => $restrictions
            ]);
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    // Save driver restrictions (insert or update)
    public function saveDriverRestrictions($userId, $restrictionIds, $updatedBy) {
        try {
            $this->conn->beginTransaction();
            
            // Delete existing restrictions for this user
            $deleteSql = "DELETE FROM tbl_driver_restrictions WHERE driver_user_id = :user_id";
            $deleteStmt = $this->conn->prepare($deleteSql);
            $deleteStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $deleteStmt->execute();
            
            // Insert new restrictions
            if (!empty($restrictionIds)) {
                $insertSql = "INSERT INTO tbl_driver_restrictions 
                            (driver_user_id, restriction_code_id, updated_by, assigned_at) 
                            VALUES (:user_id, :restriction_id, :updated_by, NOW())";
                $insertStmt = $this->conn->prepare($insertSql);
                
                foreach ($restrictionIds as $restrictionId) {
                    $insertStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                    $insertStmt->bindParam(':restriction_id', $restrictionId, PDO::PARAM_INT);
                    $insertStmt->bindParam(':updated_by', $updatedBy, PDO::PARAM_INT);
                    $insertStmt->execute();
                }
            }
            
            $this->conn->commit();
            
            return json_encode([
                'status' => 'success',
                'message' => 'Driver restrictions saved successfully'
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function updateVehicleMake($id, $name, $userId = null) {

        try {
            // First, get the current vehicle make name to check if it's the same
            $currentSql = "SELECT vehicle_make_name FROM tbl_vehicle_make WHERE vehicle_make_id = :id";
            $currentStmt = $this->conn->prepare($currentSql);
            $currentStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $currentStmt->execute();
            $currentMake = $currentStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$currentMake) {
                return json_encode(['status' => 'error', 'message' => 'Vehicle make not found']);
            }
            
            $currentName = $currentMake['vehicle_make_name'];
            
            // If the new name is the same as the current name, allow the update
            if ($currentName === $name) {
                $sql = "UPDATE tbl_vehicle_make SET vehicle_make_name = :name WHERE vehicle_make_id = :id";
                $stmt = $this->conn->prepare($sql);
                $stmt->bindParam(':name', $name);
                $stmt->bindParam(':id', $id, PDO::PARAM_INT);
                $exec = $stmt->execute();
                if ($exec) {
                    // Audit log (non-blocking)
                    try {
                        $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                        $audit = $this->conn->prepare($auditSql);
                        $desc = "Updated Vehicle Make: '" . ($currentName ?? '') . "' -> '" . ($name ?? '') . "'";
                        $action = 'UPDATE';
                        $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                        $audit->bindParam(':action', $action, PDO::PARAM_STR);
                        if ($userId !== null) {
                            $audit->bindParam(':created_by', $userId, PDO::PARAM_INT);
                        } else {
                            $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                        }
                        $audit->execute();
                        // Log the latest audit_log entry for verification
                        try {
                            $sel = $this->conn->prepare("SELECT id, description, action, created_at, created_by FROM audit_log WHERE 1 ORDER BY id DESC LIMIT 1");
                            $sel->execute();
                            $latest = $sel->fetch(PDO::FETCH_ASSOC);
                            
                        } catch (PDOException $ex) {
                            error_log("Audit log select failed (updateVehicleMake same-name): " . $ex->getMessage());
                        }
                    } catch (PDOException $e) {
                        error_log("Audit log insert failed (updateVehicleMake same-name): " . $e->getMessage());
                    }
                    return json_encode(['status' => 'success', 'message' => 'Vehicle make updated successfully']);
                } else {
                    return json_encode(['status' => 'error', 'message' => 'Could not update vehicle make']);
                }
            }
            
            // If the name is different, check if the new name already exists
            $checkSql = "SELECT COUNT(*) FROM tbl_vehicle_make WHERE vehicle_make_name = :name AND vehicle_make_id != :id";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':name', $name);
            $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $checkStmt->execute();
            
            if ($checkStmt->fetchColumn() > 0) {
                return json_encode(['status' => 'error', 'message' => 'Vehicle make name already exists']);
            }
            
            // If validation passes, proceed with the update
            $sql = "UPDATE tbl_vehicle_make SET vehicle_make_name = :name WHERE vehicle_make_id = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                // Audit log (non-blocking)
                try {
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = "Updated Vehicle Make: '" . ($currentName ?? '') . "' -> '" . ($name ?? '') . "'";
                    $action = 'UPDATE';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindParam(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    $audit->execute();
                    // Log the latest audit_log entry for verification
                    try {
                        $sel = $this->conn->prepare("SELECT id, description, action, created_at, created_by FROM audit_log WHERE 1 ORDER BY id DESC LIMIT 1");
                        $sel->execute();
                        $latest = $sel->fetch(PDO::FETCH_ASSOC);
                      
                    } catch (PDOException $ex) {
                        error_log("Audit log select failed (updateVehicleMake): " . $ex->getMessage());
                    }
                } catch (PDOException $e) {
                    error_log("Audit log insert failed (updateVehicleMake): " . $e->getMessage());
                }
                return json_encode(['status' => 'success', 'message' => 'Vehicle make updated successfully']);
            } else {
                return json_encode(['status' => 'error', 'message' => 'Could not update vehicle make']);
            }
                                     
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function fetchVehicleCategories() {
        $sql = "
                SELECT 
                    vc.vehicle_category_id, 
                    vc.vehicle_category_name
                FROM tbl_vehicle_category vc
                WHERE vc.is_active = 1 
                ORDER BY vc.vehicle_category_name";
        return $this->executeQuery($sql);
    }


    public function updateVehicleCategory($id, $name, $userId = null) {
        try {
            // First, get the current vehicle category name to check if it's the same
            $currentSql = "SELECT vehicle_category_name FROM tbl_vehicle_category WHERE vehicle_category_id = :id";
            $currentStmt = $this->conn->prepare($currentSql);
            $currentStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $currentStmt->execute();
            $currentCategory = $currentStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$currentCategory) {
                return json_encode(['status' => 'error', 'message' => 'Vehicle category not found']);
            }
            
            $currentName = $currentCategory['vehicle_category_name'];
            
            // If the new name is the same as the current name, allow the update
            if ($currentName === $name) {
                $sql = "UPDATE tbl_vehicle_category SET vehicle_category_name = :name WHERE vehicle_category_id = :id";
                $stmt = $this->conn->prepare($sql);
                $stmt->bindParam(':name', $name);
                $stmt->bindParam(':id', $id, PDO::PARAM_INT);
                
                if ($stmt->execute()) {
                    // Audit log (non-blocking)
                    try {
                        $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                        $audit = $this->conn->prepare($auditSql);
                        $desc = "Updated Vehicle Category: '" . ($currentName ?? '') . "' -> '" . ($name ?? '') . "'";
                        $action = 'UPDATE';
                        $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                        $audit->bindParam(':action', $action, PDO::PARAM_STR);
                        if ($userId !== null) {
                            $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                        } else {
                            $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                        }
                        $audit->execute();
                        try {
                            $sel = $this->conn->prepare("SELECT id, description, action, created_at, created_by FROM audit_log WHERE 1 ORDER BY id DESC LIMIT 1");
                            $sel->execute();
                            $latest = $sel->fetch(PDO::FETCH_ASSOC);
                          
                        } catch (PDOException $ex) {
                            error_log("Audit log select failed (updateVehicleCategory same-name): " . $ex->getMessage());
                        }
                    } catch (PDOException $e) {
                        error_log("Audit log insert failed (updateVehicleCategory same-name): " . $e->getMessage());
                    }
                    // Fetch updated list
                    $categories = $this->fetchVehicleCategories();
                    $categoriesData = json_decode($categories, true)['data'] ?? [];
                    return json_encode([
                        'status' => 'success',
                        'message' => 'Vehicle category updated successfully',
                        'categories' => $categoriesData
                    ]);
                } else {
                    return json_encode(['status' => 'error', 'message' => 'Could not update vehicle category']);
                }
            }
            
            // If the name is different, check if the new name already exists
            $checkSql = "SELECT COUNT(*) FROM tbl_vehicle_category WHERE vehicle_category_name = :name AND vehicle_category_id != :id";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':name', $name);
            $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $checkStmt->execute();
            
            if ($checkStmt->fetchColumn() > 0) {
                return json_encode(['status' => 'error', 'message' => 'Vehicle category name already exists']);
            }
            
            // If validation passes, proceed with the update
            $sql = "UPDATE tbl_vehicle_category SET vehicle_category_name = :name WHERE vehicle_category_id = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                // Audit log (non-blocking)
                try {
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = "Updated Vehicle Category: '" . ($currentName ?? '') . "' -> '" . ($name ?? '') . "'";
                    $action = 'UPDATE';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    $audit->execute();
                    try {
                        $sel = $this->conn->prepare("SELECT id, description, action, created_at, created_by FROM audit_log WHERE 1 ORDER BY id DESC LIMIT 1");
                        $sel->execute();
                        $latest = $sel->fetch(PDO::FETCH_ASSOC);
                       
                    } catch (PDOException $ex) {
                        error_log("Audit log select failed (updateVehicleCategory): " . $ex->getMessage());
                    }
                } catch (PDOException $e) {
                    error_log("Audit log insert failed (updateVehicleCategory): " . $e->getMessage());
                }
                // Fetch updated list
                $categories = $this->fetchVehicleCategories();
                $categoriesData = json_decode($categories, true)['data'] ?? [];
                return json_encode([
                    'status' => 'success',
                    'message' => 'Vehicle category updated successfully',
                    'categories' => $categoriesData
                ]);
            } else {
                return json_encode(['status' => 'error', 'message' => 'Could not update vehicle category']);
            }
                                     
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function fetchModels() {
        $sql = "
            SELECT 
                vm.vehicle_model_id,
                vm.vehicle_model_name,
                vm.vehicle_model_created_at,
                vm.vehicle_model_updated_at,
                vm.vehicle_model_vehicle_make_id,
                vm.vehicle_category_id,
                make.vehicle_make_name,
                category.vehicle_category_name
            FROM 
                tbl_vehicle_model vm
            LEFT JOIN 
                tbl_vehicle_make make ON vm.vehicle_model_vehicle_make_id = make.vehicle_make_id
            LEFT JOIN 
                tbl_vehicle_category category ON vm.vehicle_category_id = category.vehicle_category_id
            WHERE 
                vm.is_active = 1
            ORDER BY 
                vm.vehicle_model_id DESC
        ";
    
        return $this->executeQuery($sql);
    }

    public function updateVehicleModel($modelData, $userId = null) {
        // Validate input data
        if (!isset($modelData['id']) || !isset($modelData['name']) || 
            !isset($modelData['category_id']) || !isset($modelData['make_id'])) {
            error_log("Missing required fields in modelData: " . print_r($modelData, true));
            return json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        }

        
        // First, verify the record exists
        $modelId = intval($modelData['id']);
        $checkSql = "SELECT vehicle_model_id, vehicle_model_name FROM tbl_vehicle_model WHERE vehicle_model_id = :modelId";
        try {
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindValue(':modelId', $modelId, PDO::PARAM_INT);
            $checkStmt->execute();
            $existingRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$existingRecord) {
                error_log("Record verification failed: No record found with vehicle_model_id = $modelId");
                return json_encode(['status' => 'error', 'message' => "Vehicle model with ID $modelId does not exist in the database"]);
            }
            
            error_log("Record found: " . print_r($existingRecord, true));
        } catch (PDOException $e) {
            error_log("Record verification error: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error during verification']);
        }
        
        $sql = "UPDATE tbl_vehicle_model SET 
                    vehicle_model_name = :modelName, 
                    vehicle_category_id = :categoryId, 
                    vehicle_model_vehicle_make_id = :makeId 
                WHERE 
                    vehicle_model_id = :modelId";


        try {
            $stmt = $this->conn->prepare($sql);
            
            // Convert values to appropriate types
            $categoryId = intval($modelData['category_id']);
            $makeId = intval($modelData['make_id']);
            
            $stmt->bindValue(':modelName', $modelData['name'], PDO::PARAM_STR);
            $stmt->bindValue(':categoryId', $categoryId, PDO::PARAM_INT);
            $stmt->bindValue(':makeId', $makeId, PDO::PARAM_INT);
            $stmt->bindValue(':modelId', $modelId, PDO::PARAM_INT);

            // Log the actual values being used
            
            
            $result = $stmt->execute();
            $rowCount = $stmt->rowCount();
            
            
            
            if ($result) {
                if ($rowCount > 0) {
                    // Non-blocking audit log insert
                    try {
                        $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                        $audit = $this->conn->prepare($auditSql);
                        $desc = "Updated Vehicle Model: '" . ($existingRecord['vehicle_model_name'] ?? '') . "' -> '" . ($modelData['name'] ?? '') . "'";
                        $action = 'UPDATE';
                        $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                        $audit->bindParam(':action', $action, PDO::PARAM_STR);
                        if ($userId !== null) {
                            $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                        } else {
                            $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                        }
                        if (!$audit->execute()) {
                            error_log("Audit log insert failed (updateVehicleModel): " . print_r($audit->errorInfo(), true));
                        } else {
                            try {
                                $latestAuditStmt = $this->conn->query("SELECT id, description, action, created_at, created_by FROM audit_log ORDER BY id DESC LIMIT 1");
                                $latest = $latestAuditStmt ? $latestAuditStmt->fetch(PDO::FETCH_ASSOC) : null;
                               
                            } catch (Throwable $te) {
                                error_log("Failed to read back latest audit_log (updateVehicleModel): " . $te->getMessage());
                            }
                        }
                    } catch (Throwable $e2) {
                        error_log("Audit logging error (updateVehicleModel): " . $e2->getMessage());
                    }
                    return json_encode(['status' => 'success', 'message' => 'Vehicle model updated successfully']);
                } else {
                    return json_encode(['status' => 'error', 'message' => 'No matching record found']);
                }
            } else {
                $error = $stmt->errorInfo();
                error_log("Database error: " . print_r($error, true));
                return json_encode(['status' => 'error', 'message' => 'Database error: ' . $error[2]]);
            }
        } catch (PDOException $e) {
            error_log("PDO Exception: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function fetchEquipmentsCategory() {
        $sql = "SELECT equipments_category_id, equipments_category_name FROM tbl_equipment_category WHERE is_active = 1 ORDER BY equipments_category_id DESC";
        return $this->executeQuery($sql);
    }

    public function updateEquipmentCategory($categoryData, $userId = null) {
        try {
            // First, get the current equipment category name to check if it's the same
            $currentSql = "SELECT equipments_category_name FROM tbl_equipment_category WHERE equipments_category_id = :id";
            $currentStmt = $this->conn->prepare($currentSql);
            $currentStmt->bindParam(':id', $categoryData['categoryId'], PDO::PARAM_INT);
            $currentStmt->execute();
            $currentCategory = $currentStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$currentCategory) {
                return json_encode(['status' => 'error', 'message' => 'Equipment category not found']);
            }
            
            $currentName = $currentCategory['equipments_category_name'];
            
            // If the new name is the same as the current name, allow the update
            if ($currentName === $categoryData['name']) {
                $sql = "UPDATE tbl_equipment_category SET 
                            equipments_category_name = :name
                        WHERE 
                            equipments_category_id = :categoryId";

                $stmt = $this->conn->prepare($sql);
                $stmt->bindParam(':name', $categoryData['name']);
                $stmt->bindParam(':categoryId', $categoryData['categoryId'], PDO::PARAM_INT);

                // Add these lines for debugging
                
                $result = $stmt->execute();

                if ($result) {
                    // Audit log (non-blocking)
                    try {
                        $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                        $audit = $this->conn->prepare($auditSql);
                        $desc = "Updated Equipment Category: '" . ($currentName ?? '') . "' -> '" . ($categoryData['name'] ?? '') . "'";
                        $action = 'UPDATE';
                        $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                        $audit->bindParam(':action', $action, PDO::PARAM_STR);
                        if ($userId !== null) {
                            $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                        } else {
                            $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                        }
                        $audit->execute();
                        try {
                            $sel = $this->conn->prepare("SELECT id, description, action, created_at, created_by FROM audit_log WHERE 1 ORDER BY id DESC LIMIT 1");
                            $sel->execute();
                            $latest = $sel->fetch(PDO::FETCH_ASSOC);
                           
                        } catch (PDOException $ex) {
                            error_log("Audit log select failed (updateEquipmentCategory same-name): " . $ex->getMessage());
                        }
                    } catch (PDOException $e) {
                        error_log("Audit log insert failed (updateEquipmentCategory same-name): " . $e->getMessage());
                    }
                    return json_encode(['status' => 'success', 'message' => 'Category updated successfully.']);
                } else {
                    return json_encode(['status' => 'error', 'message' => 'Failed to update category.']);
                }
            }
            
            // If the name is different, check if the new name already exists
            $checkSql = "SELECT COUNT(*) FROM tbl_equipment_category WHERE equipments_category_name = :name AND equipments_category_id != :id";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':name', $categoryData['name']);
            $checkStmt->bindParam(':id', $categoryData['categoryId'], PDO::PARAM_INT);
            $checkStmt->execute();
            
            if ($checkStmt->fetchColumn() > 0) {
                return json_encode(['status' => 'error', 'message' => 'Equipment category name already exists']);
            }
            
            // If validation passes, proceed with the update
            $sql = "UPDATE tbl_equipment_category SET 
                        equipments_category_name = :name
                    WHERE 
                        equipments_category_id = :categoryId";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $categoryData['name']);
            $stmt->bindParam(':categoryId', $categoryData['categoryId'], PDO::PARAM_INT);

            // Add these lines for debugging
           
            $result = $stmt->execute();
           

            if ($result) {
                // Audit log (non-blocking)
                try {
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = "Updated Equipment Category: '" . ($currentName ?? '') . "' -> '" . ($categoryData['name'] ?? '') . "'";
                    $action = 'UPDATE';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    $audit->execute();
                    try {
                        $sel = $this->conn->prepare("SELECT id, description, action, created_at, created_by FROM audit_log WHERE 1 ORDER BY id DESC LIMIT 1");
                        $sel->execute();
                        $latest = $sel->fetch(PDO::FETCH_ASSOC);
                       
                    } catch (PDOException $ex) {
                        error_log("Audit log select failed (updateEquipmentCategory): " . $ex->getMessage());
                    }
                } catch (PDOException $e) {
                    error_log("Audit log insert failed (updateEquipmentCategory): " . $e->getMessage());
                }
                return json_encode(['status' => 'success', 'message' => 'Category updated successfully.']);
            } else {
                return json_encode(['status' => 'error', 'message' => 'Failed to update category.']);
            }
                                     
        } catch (PDOException $e) {
            error_log("PDO Exception: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    public function updateDepartment($id, $name, $type, $userId = null) {
        try {
            // First, get the current department data
            $currentSql = "SELECT departments_name, department_type 
                          FROM tbl_departments 
                          WHERE departments_id = :id";
            $currentStmt = $this->conn->prepare($currentSql);
            $currentStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $currentStmt->execute();
            $currentDepartment = $currentStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$currentDepartment) {
                return json_encode(['status' => 'error', 'message' => 'Department not found']);
            }
            
            $currentName = $currentDepartment['departments_name'];
            $currentType = $currentDepartment['department_type'];
            
            // If both name and type are the same, no update needed
            if ($currentName === $name && $currentType === $type) {
                return json_encode(['status' => 'success', 'message' => 'No changes detected.']);
            }
            
            // Check if another department with the same name exists
            $checkSql = "SELECT COUNT(*) FROM tbl_departments 
                        WHERE departments_name = :name 
                        AND departments_id != :id";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':name', $name);
            $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $checkStmt->execute();
            
            if ($checkStmt->fetchColumn() > 0) {
                return json_encode(['status' => 'error', 'message' => 'Another department with this name already exists.']);
            }
            
            // Update the department
            $sql = "UPDATE tbl_departments 
                   SET departments_name = :name, 
                       department_type = :type 
                   WHERE departments_id = :id";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':type', $type);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                // Insert audit log (non-blocking)
                try {
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $desc = "Updated Department: {$currentName} ({$currentType}) -> {$name} ({$type})";
                    $action = 'UPDATE';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindParam(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    $audit->execute();
                } catch (PDOException $e) {
                    error_log("Audit log insert failed (updateDepartment): " . $e->getMessage());
                }
                return json_encode([
                    'status' => 'success', 
                    'message' => 'Department updated successfully.'
                ]);
            } else {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Failed to update department.'
                ]);
            }
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error', 
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function fetchModelsByCategoryAndMake($categoryId, $makeId) {
        $sql = "
            SELECT 
                vm.vehicle_model_id, 
                vm.vehicle_model_name
            FROM 
                tbl_vehicle_model AS vm
            WHERE 
                vm.vehicle_category_id = :categoryId
            AND 
                vm.vehicle_model_vehicle_make_id = :makeId
            ORDER BY 
                vm.vehicle_model_name
        ";
    
        return $this->executeQuery($sql, [':categoryId' => $categoryId, ':makeId' => $makeId]);
    }

    public function fetchUsersById($id) {
        if (!is_numeric($id)) {
            return json_encode(['status' => 'error', 'message' => 'Invalid ID format']);
        }
    
        try {
            // Fetch user details
            $sql = "SELECT 
                        u.*,
                        t.abbreviation AS title_abbreviation,
                        d.departments_name,
                        ul.user_level_name
                    FROM 
                        tbl_users u
                    LEFT JOIN 
                        titles t ON u.title_id = t.id
                    LEFT JOIN 
                        tbl_departments d ON u.users_department_id = d.departments_id
                    LEFT JOIN 
                        tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    WHERE 
                        u.users_id = :id";
        
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                return json_encode(['status' => 'error', 'message' => 'User not found']);
            }
            
            return json_encode([
                'status' => 'success',
                'data' => [$user]
            ]);
            
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }
    public function fetchVenueById($id) {
        $sql = "SELECT 
            v.ven_id, 
            v.ven_name, 
            v.ven_occupancy, 
            v.ven_minimum,
            v.ven_created_at, 
            v.ven_updated_at, 
            v.status_availability_id, 
            v.ven_pic, 
 
            v.is_active, 
            v.user_admin_id,
            sa.status_availability_name,
            v.event_type,
            v.area_type,
            v.venue_building_id,
            vb.venue_building_name
        FROM tbl_venue v
        INNER JOIN tbl_status_availability sa ON v.status_availability_id = sa.status_availability_id
        LEFT JOIN tbl_venue_building vb ON v.venue_building_id = vb.venue_building_id
        WHERE v.ven_id = :id";
        
        return $this->executeQuery($sql, [':id' => $id]);
    }

    public function fetchEquipmentById($id) { // Removed $type as it's not used directly in the initial fetch
        try {
            // 1) Fetch the equipment with its category name
            $sql = "
                SELECT
                    te.equip_id,
                    te.equip_name,
                    tec.equipments_category_name AS category_name, -- Fetch category name from joined table
                    te.is_active,
                    te.user_admin_id,
                    te.equip_created_at,
                    te.equip_type,
                    te.equipments_category_id -- Include category ID if needed for other logic
                FROM
                    tbl_equipments AS te
                INNER JOIN
                    tbl_equipment_category AS tec ON te.equipments_category_id = tec.equipments_category_id
                WHERE
                    te.equip_id = :id
                    AND te.is_active = 1
                LIMIT 1
            ";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':id' => $id]);
            $equip = $stmt->fetch(PDO::FETCH_ASSOC);
    
            if (!$equip) {
                return json_encode([
                    'status'  => 'error',
                    'message' => 'Equipment not found or inactive.'
                ]);
            }
    
            $displayQty = 0;
            $onHandQty = 0;
            $formattedUnits = [];
    
            // Determine logic based on equip_type from the fetched equipment
            if ($equip['equip_type'] === 'Bulk') {
                // Fetch quantity from tbl_equipment_quantity for Bulk type
                $quantitySql = "
                    SELECT quantity, on_hand_quantity
                    FROM tbl_equipment_quantity
                    WHERE equip_id = :id
                    ORDER BY last_updated DESC
                    LIMIT 1
                ";
                $quantityStmt = $this->conn->prepare($quantitySql);
                $quantityStmt->execute([':id' => $id]);
                $quantityResult = $quantityStmt->fetch(PDO::FETCH_ASSOC);
                $displayQty = $quantityResult ? (int)$quantityResult['quantity'] : 0;
                $onHandQty = $quantityResult ? (int)$quantityResult['on_hand_quantity'] : 0;
            } else {
                // For Serialized types, fetch from tbl_equipment_unit
                $unitSql = "
                    SELECT
                        unit_id,
                        equip_id,
                        serial_number,
                        equipment_brand,
                        equipment_model,
                        equipment_description,
                        equipment_specs,
                        inch,
                        status_availability_id,
                        unit_created_at,
                        is_active,
                        user_admin_id
                    FROM tbl_equipment_unit
                    WHERE equip_id = :id
                    AND is_active = 1
                    ORDER BY unit_id
                ";
                $unitStmt = $this->conn->prepare($unitSql);
                $unitStmt->execute([':id' => $id]);
                $units = $unitStmt->fetchAll(PDO::FETCH_ASSOC);
    
                $formattedUnits = array_map(function($u) {
                    return [
                        'unit_id'               => (int)$u['unit_id'],
                        'serial_number'         => $u['serial_number'],
                        'equipment_brand'       => $u['equipment_brand'] ?? null,
                        'equipment_model'       => $u['equipment_model'] ?? null,
                        'equipment_description' => $u['equipment_description'] ?? null,
                        'equipment_specs'       => $u['equipment_specs'] ?? null,
                        'inch'                  => $u['inch'] ?? null,
                        'status_availability_id'=> (int)$u['status_availability_id'],
                        'unit_created_at'       => $u['unit_created_at'],
                        'user_admin_id'         => (int)$u['user_admin_id'],
                    ];
                }, $units);
    
                $displayQty = count($formattedUnits);
                $onHandQty = $displayQty; // For Serialized equipment, on_hand_quantity equals total units
            }
    
            // Build and return final response
            $response = [
                'equip_id'         => (int)$equip['equip_id'],
                'equip_name'       => $equip['equip_name'],
                'category_name'    => $equip['category_name'], // This now comes from the joined table
                'equip_type'       => $equip['equip_type'],
                'user_admin_id'    => (int)$equip['user_admin_id'],
                'equip_created_at' => $equip['equip_created_at'],
                'is_active'        => (bool)$equip['is_active'],
                'equip_quantity'   => $displayQty,
                'on_hand_quantity' => $onHandQty,
                'units'            => $formattedUnits,
            ];
    
            return json_encode([
                'status' => 'success',
                'data'   => $response
            ]);
    
        } catch (PDOException $e) {
            error_log("Database error in fetchEquipmentById: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        } catch (Exception $e) {
            error_log("Error in fetchEquipmentById: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    public function getTotals() {
        try {
            // Query for approved reservations (status_id = 3)


            // Query for vehicles
            $vehicleQuery = "SELECT COUNT(*) AS total FROM tbl_vehicle WHERE is_active = 1";

            // Query for venues
            $venueQuery = "SELECT COUNT(*) AS total FROM tbl_venue WHERE is_active = 1";

            // Query for equipment
            $equipmentQuery = "SELECT COUNT(*) AS total FROM tbl_equipments WHERE is_active = 1";

            // Query for users (only from tbl_users)
            $userQuery = "SELECT COUNT(*) AS total FROM tbl_users WHERE is_active = 1";

            // Execute all queries
            $queries = [
                'vehicles' => $vehicleQuery,
                'venues' => $venueQuery,
                'equipments' => $equipmentQuery,
                'users' => $userQuery
            ];

            $totals = [];
            foreach ($queries as $key => $query) {
                $stmt = $this->conn->query($query);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $totals[$key] = (int)$result['total'];
            }

            return json_encode([
                'status' => 'success',
                'data' => $totals
            ]);

        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
    }

    
    public function fetchVenues() {
        $sql = "SELECT 
                    ven_id, 
                    ven_name, 
                    ven_occupancy, 
                    ven_created_at, 
                    ven_updated_at, 
                    v.status_availability_id,
                    sa.status_availability_name,
                    ven_pic
                FROM 
                    tbl_venue v
                INNER JOIN 
                    tbl_status_availability sa ON v.status_availability_id = sa.status_availability_id 
                WHERE 
                    v.status_availability_id != 2 AND v.is_active = 1
                ORDER BY 
                    ven_name"; 
        return $this->executeQuery($sql);
    }

    public function fetchVehicles() {
        $sql = "SELECT  
                    v.vehicle_id,
                    v.vehicle_pic,
                    v.year,
                    vm.vehicle_make_name, 
                    vc.vehicle_category_name,
                    vmd.vehicle_model_name,      
                    v.vehicle_license,
                    sa.status_availability_name
                  
                FROM 
                    tbl_vehicle v 
                INNER JOIN 
                    tbl_vehicle_model vmd ON v.vehicle_model_id = vmd.vehicle_model_id 
                INNER JOIN 
                    tbl_vehicle_make vm ON vmd.vehicle_model_vehicle_make_id = vm.vehicle_make_id 
                INNER JOIN 
                    tbl_vehicle_category vc ON vmd.vehicle_category_id = vc.vehicle_category_id
                INNER JOIN
                    tbl_status_availability sa ON v.status_availability_id = sa.status_availability_id
                WHERE 
                    v.status_availability_id != 2 AND v.is_active = 1";
             

        return $this->executeQuery($sql);
    }
public function get_message($userid) {
    $sql = "
        SELECT 
            c.*, 
            CONCAT(u.users_fname, ' ', u.users_lname)     AS sender_name,
            CONCAT(u2.users_fname, ' ', u2.users_lname)   AS receiver_name
        FROM tbl_chat c
        JOIN tbl_users u  ON c.sender_id   = u.users_id
        JOIN tbl_users u2 ON c.receiver_id = u2.users_id
        WHERE c.sender_id   = :userid
           OR c.receiver_id = :userid
        ORDER BY c.created_at ASC
    ";
    return $this->executeQuery($sql, [':userid' => $userid]);
}

public function markMessagesAsRead($userId, $otherUserId) {
    try {
        $sql = "UPDATE tbl_chat 
                SET is_read = 1 
                WHERE receiver_id = :userId 
                AND sender_id = :otherUserId 
                AND is_read = 0";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            ':userId' => $userId,
            ':otherUserId' => $otherUserId
        ]);
        
        $affectedRows = $stmt->rowCount();
        
        return json_encode([
            'status' => 'success',
            'message' => 'Messages marked as read',
            'affected_rows' => $affectedRows
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => 'Failed to mark messages as read: ' . $e->getMessage()
        ]);
    }
}

public function getUnreadCount($userId) {
    try {
        $sql = "SELECT sender_id, COUNT(*) as unread_count
                FROM tbl_chat
                WHERE receiver_id = :userId AND is_read = 0
                GROUP BY sender_id";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([':userId' => $userId]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return json_encode([
            'status' => 'success',
            'data' => $results
        ]);
    } catch (PDOException $e) {
        return json_encode([
            'status' => 'error',
            'message' => 'Failed to get unread count: ' . $e->getMessage()
        ]);
    }
}

public function fetchConditions() {
    $sql = "SELECT `id`, `condition_name` FROM `tbl_condition` WHERE 1";
    return $this->executeQuery($sql);
}

public function fetchModelById($id) {
    $sql = "
        SELECT 
            vm.vehicle_model_id, 
            vm.vehicle_model_name, 
            vc.vehicle_category_name, 
            vm2.vehicle_make_name
        FROM 
            tbl_vehicle_model AS vm
        INNER JOIN 
            tbl_vehicle_category AS vc ON vm.vehicle_category_id = vc.vehicle_category_id
        INNER JOIN 
            tbl_vehicle_make AS vm2 ON vm.vehicle_model_vehicle_make_id = vm2.vehicle_make_id
        WHERE 
            vm.vehicle_model_id = :id
    ";

    return $this->executeQuery($sql, [':id' => $id]);
}




public function fetchVehicleById($id) {
    $sql = "
        SELECT 
            v.vehicle_id,
            v.vehicle_license,
            v.year,
            v.vehicle_pic,

            -- Names only
            vmd.vehicle_model_name,
            vmk.vehicle_make_name,
            vc.vehicle_category_name,
            sa.status_availability_name

        FROM tbl_vehicle v
        JOIN tbl_vehicle_model vmd 
            ON v.vehicle_model_id = vmd.vehicle_model_id
        JOIN tbl_vehicle_make vmk 
            ON vmd.vehicle_model_vehicle_make_id = vmk.vehicle_make_id
        JOIN tbl_vehicle_category vc 
            ON vmd.vehicle_category_id = vc.vehicle_category_id
        JOIN tbl_status_availability sa 
            ON v.status_availability_id = sa.status_availability_id
        WHERE v.vehicle_id = :id
    ";

    return $this->executeQuery($sql, [':id' => $id]);
}

public function fetchEquipmentCategoryById($id) {
    $sql = "SELECT equipments_category_id, equipments_category_name FROM tbl_equipment_category WHERE equipments_category_id = :id";
    return $this->executeQuery($sql, [':id' => $id]);
}

public function fetchAudit() {
        $sql = "
            SELECT 
                a.id,
                a.description,
                a.action,
                a.created_at,
                a.created_by,
                CONCAT_WS(' ', u.users_fname, u.users_mname, u.users_lname) AS created_by_name
            FROM audit_log a
            LEFT JOIN tbl_users u ON a.created_by = u.users_id
            ORDER BY a.created_at DESC
        ";
        return $this->executeQuery($sql);
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

// Helper method to check if user is the final approver in sequence
private function isFinalApprover($reservationId, $userId) {
    try {
        // Get approval sequence from tbl_approval_in_order
        $sql = "SELECT approval_order_id, users_id, approval_sequence, approval_status_status_id 
                FROM tbl_approval_in_order 
                ORDER BY approval_sequence ASC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $approvers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
       
        
        if (empty($approvers)) {
            
            return true; // If no sequence defined, treat as final approver
        }
        
        // Find the highest sequence number (last approver)
        $maxSequence = 0;
        $lastApproverUserId = null;
        
        foreach ($approvers as $approver) {
            if ($approver['approval_sequence'] > $maxSequence) {
                $maxSequence = $approver['approval_sequence'];
                $lastApproverUserId = $approver['users_id'];
            }
        }
        
        $isFinal = ($lastApproverUserId == $userId);
        
        
        return $isFinal;
        
    } catch (PDOException $e) {
        error_log("Error checking final approver: " . $e->getMessage());
        return true; // Default to final approver on error
    }
}

// Helper method to get next approver in sequence
private function getNextApprover($reservationId, $currentUserId) {
    try {
        // Get approval sequence from tbl_approval_in_order
        $sql = "SELECT approval_order_id, users_id, approval_sequence, approval_status_status_id 
                FROM tbl_approval_in_order 
                ORDER BY approval_sequence ASC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $approvers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
    
        
        // Find current approver's sequence and get the next one
        $currentSequence = null;
        foreach ($approvers as $approver) {
            if ($approver['users_id'] == $currentUserId) {
                $currentSequence = $approver['approval_sequence'];
                break;
            }
        }
        
        
        
        // Find next approver by sequence number
        $nextSequence = $currentSequence + 1;
        foreach ($approvers as $approver) {
            if ($approver['approval_sequence'] == $nextSequence) {
                error_log("Next approver found - UserId: " . $approver['users_id'] . ", Sequence: $nextSequence");
                return $approver;
            }
        }
        
        error_log("No next approver found after sequence $currentSequence");
        return null; // No next approver
        
    } catch (PDOException $e) {
        error_log("Error getting next approver: " . $e->getMessage());
        return null;
    }
}

// Helper method to mark approver as approved in sequence
private function markApproverAsApproved($reservationId, $userId) {
    try {
        // Note: The approval sequence appears to be global, not per-reservation
        // We'll create a record to track this specific approval for this reservation
        $sql = "INSERT INTO tbl_reservation_approval_tracking 
                (reservation_id, users_id, has_approved, approval_date, approval_status_id, approval_active)
                VALUES (:reservation_id, :user_id, 1, NOW(), 3, 1)
                ON DUPLICATE KEY UPDATE 
                has_approved = 1, 
                approval_date = NOW(),
                approval_status_id = 3,
                approval_active = 1";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
    } catch (PDOException $e) {
        // If the tracking table doesn't exist, we'll just log the approval
        error_log("Approval tracking: Reservation $reservationId approved by User $userId");
        error_log("Error details: " . $e->getMessage());
    }
}

// Helper method to check venue schedule conflicts
private function checkVenueScheduleConflict($reservationId) {
    try {
        // Get active semester
        $semesterStmt = $this->conn->prepare("SELECT semester_id FROM tbl_semester WHERE is_active = 1 LIMIT 1");
        $semesterStmt->execute();
        $semester = $semesterStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$semester) {
            // No active semester, skip validation
            return ['has_conflict' => false];
        }
        
        $semesterId = $semester['semester_id'];
        
        // Get reservation details
        $reservationStmt = $this->conn->prepare("
            SELECT r.reservation_start_date, r.reservation_end_date
            FROM tbl_reservation r
            WHERE r.reservation_id = :reservation_id
        ");
        $reservationStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
        $reservationStmt->execute();
        $reservation = $reservationStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$reservation) {
            return ['has_conflict' => false];
        }
        
        // Get venues for this reservation
        $venueStmt = $this->conn->prepare("
            SELECT rv.reservation_venue_venue_id, v.ven_name
            FROM tbl_reservation_venue rv
            INNER JOIN tbl_venue v ON rv.reservation_venue_venue_id = v.ven_id
            WHERE rv.reservation_reservation_id = :reservation_id
        ");
        $venueStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
        $venueStmt->execute();
        $venues = $venueStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($venues)) {
            return ['has_conflict' => false];
        }
        
        // Parse reservation dates
        $startDateTime = new DateTime($reservation['reservation_start_date']);
        $endDateTime = new DateTime($reservation['reservation_end_date']);
        
        $conflictingVenues = [];
        
        // Check each venue for schedule conflicts
        foreach ($venues as $venue) {
            $venueId = $venue['reservation_venue_venue_id'];
            $venueName = $venue['ven_name'];
            
            // Get all scheduled classes for this venue in the active semester
            $scheduleStmt = $this->conn->prepare("
                SELECT 
                    cvs.schedule_id,
                    cvs.day_of_week,
                    cvs.start_time,
                    cvs.end_time,
                    s.section_name
                FROM tbl_class_venue_schedule cvs
                INNER JOIN tbl_section s ON cvs.section_id = s.section_id
                WHERE cvs.ven_id = :venue_id 
                AND cvs.semester_id = :semester_id
            ");
            $scheduleStmt->bindParam(':venue_id', $venueId, PDO::PARAM_INT);
            $scheduleStmt->bindParam(':semester_id', $semesterId, PDO::PARAM_INT);
            $scheduleStmt->execute();
            $schedules = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($schedules)) {
                continue; // No schedules for this venue
            }
            
            // Check for conflicts in the reservation date range
            $conflicts = [];
            $currentDate = clone $startDateTime;
            
            while ($currentDate <= $endDateTime) {
                $dayOfWeek = $currentDate->format('l'); // Monday, Tuesday, etc.
                
                // Check if there are any schedules for this day
                foreach ($schedules as $schedule) {
                    if ($schedule['day_of_week'] === $dayOfWeek) {
                        // Parse schedule times
                        $scheduleStart = DateTime::createFromFormat('H:i:s', $schedule['start_time']);
                        $scheduleEnd = DateTime::createFromFormat('H:i:s', $schedule['end_time']);
                        
                        // Parse reservation times
                        $reservationStart = clone $currentDate;
                        $reservationStart->setTime(
                            (int)$startDateTime->format('H'),
                            (int)$startDateTime->format('i'),
                            (int)$startDateTime->format('s')
                        );
                        
                        $reservationEnd = clone $currentDate;
                        // If reservation spans multiple days, use end of day for intermediate days
                        if ($currentDate->format('Y-m-d') === $endDateTime->format('Y-m-d')) {
                            $reservationEnd->setTime(
                                (int)$endDateTime->format('H'),
                                (int)$endDateTime->format('i'),
                                (int)$endDateTime->format('s')
                            );
                        } else if ($currentDate->format('Y-m-d') === $startDateTime->format('Y-m-d')) {
                            $reservationEnd->setTime(23, 59, 59);
                        } else {
                            $reservationEnd->setTime(23, 59, 59);
                        }
                        
                        // Check for time overlap
                        $resStartTime = $reservationStart->format('H:i:s');
                        $resEndTime = $reservationEnd->format('H:i:s');
                        
                        if ($resStartTime < $schedule['end_time'] && $resEndTime > $schedule['start_time']) {
                            $conflicts[] = [
                                'date' => $currentDate->format('Y-m-d'),
                                'day' => $dayOfWeek,
                                'section' => $schedule['section_name'],
                                'class_time' => $schedule['start_time'] . ' - ' . $schedule['end_time']
                            ];
                        }
                    }
                }
                
                $currentDate->modify('+1 day');
            }
            
            if (!empty($conflicts)) {
                $conflictingVenues[] = [
                    'venue_id' => $venueId,
                    'venue_name' => $venueName,
                    'conflicts' => $conflicts
                ];
            }
        }
        
        if (!empty($conflictingVenues)) {
            $message = "Cannot approve reservation. The following venues have scheduled classes during the requested time:\n\n";
            foreach ($conflictingVenues as $cv) {
                $message .= "• {$cv['venue_name']}:\n";
                foreach ($cv['conflicts'] as $conflict) {
                    $message .= "  - {$conflict['date']} ({$conflict['day']}): {$conflict['section']} at {$conflict['class_time']}\n";
                }
            }
            
            return [
                'has_conflict' => true,
                'message' => $message,
                'venues' => $conflictingVenues
            ];
        }
        
        return ['has_conflict' => false];
        
    } catch (PDOException $e) {
        error_log("Error checking venue schedule conflicts: " . $e->getMessage());
        // On error, allow approval to proceed
        return ['has_conflict' => false];
    }
}

public function handleRequest($reservationId, $isAccepted, $userId, $notificationMessage = '', $notification_user_id = null, $declineReason = null) {
    try {
        $this->conn->beginTransaction();
        
        // Debug logging
       

        // Check if this user is the final approver in the sequence (needed for both approve and decline)
        $isFinalApprover = false;
        if ($isAccepted) {
            $isFinalApprover = $this->isFinalApprover($reservationId, $userId);
           
        }

        if ($isAccepted) {
            // Validate venue schedule conflicts before approval
            $scheduleConflict = $this->checkVenueScheduleConflict($reservationId);
            if ($scheduleConflict['has_conflict']) {
                $this->conn->rollBack();
                return json_encode([
                    'status' => 'error',
                    'message' => $scheduleConflict['message'],
                    'conflicting_venues' => $scheduleConflict['venues']
                ]);
            }
            // First, update the current pending status to active = 1
            $sqlUpdate = "
                UPDATE tbl_reservation_status 
                SET reservation_active = 1 
                WHERE reservation_reservation_id = :reservation_id 
                AND reservation_status_status_id = 1 
                AND reservation_active = 0";
            
            $stmtUpdate = $this->conn->prepare($sqlUpdate);
            $stmtUpdate->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtUpdate->execute();
            
           
            if ($isFinalApprover) {
                // Final approver: Update status_id 7 to active = 0, then insert status_id 3 AND status_id 6
                $sqlUpdateStatus7 = "
                    UPDATE tbl_reservation_status 
                    SET reservation_active = 0 
                    WHERE reservation_reservation_id = :reservation_id 
                    AND reservation_status_status_id = 7";
                
                $stmtUpdateStatus7 = $this->conn->prepare($sqlUpdateStatus7);
                $stmtUpdateStatus7->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtUpdateStatus7->execute();
                
                error_log("Updated status_id 7 to active = 0. Rows affected: " . $stmtUpdateStatus7->rowCount());
                
                $sqlInsert3 = "
                    INSERT INTO tbl_reservation_status 
                    (reservation_reservation_id, reservation_status_status_id, reservation_active, reservation_updated_at, reservation_users_id) 
                    VALUES (:reservation_id, 3, 1, NOW(), :user_id)";
                
                $stmtInsert3 = $this->conn->prepare($sqlInsert3);
                $stmtInsert3->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtInsert3->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $stmtInsert3->execute();

                $sqlInsert6 = "
                    INSERT INTO tbl_reservation_status 
                    (reservation_reservation_id, reservation_status_status_id, reservation_active, reservation_updated_at, reservation_users_id) 
                    VALUES (:reservation_id, 6, 1, NOW(), :user_id)";
                
                $stmtInsert6 = $this->conn->prepare($sqlInsert6);
                $stmtInsert6->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtInsert6->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $stmtInsert6->execute();
                
                // Update approval sequence to mark this approver as approved
                $this->markApproverAsApproved($reservationId, $userId);
            } else {
                // Not final approver: Insert only status_id 3
                $sqlInsert3 = "
                    INSERT INTO tbl_reservation_status 
                    (reservation_reservation_id, reservation_status_status_id, reservation_active, reservation_updated_at, reservation_users_id) 
                    VALUES (:reservation_id, 3, 1, NOW(), :user_id)";
                
                $stmtInsert3 = $this->conn->prepare($sqlInsert3);
                $stmtInsert3->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtInsert3->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $stmtInsert3->execute();
                
                // Update approval sequence to mark this approver as approved
                $this->markApproverAsApproved($reservationId, $userId);
                
                
            }
        } else {
            // DECLINE logic
            
            // Update decline_reason in tbl_reservation if provided
            if ($declineReason !== null && trim($declineReason) !== '') {
                $sqlUpdateReason = "
                    UPDATE tbl_reservation 
                    SET decline_reason = :decline_reason 
                    WHERE reservation_id = :reservation_id";
                
                $stmtUpdateReason = $this->conn->prepare($sqlUpdateReason);
                $stmtUpdateReason->bindParam(':decline_reason', $declineReason, PDO::PARAM_STR);
                $stmtUpdateReason->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtUpdateReason->execute();
                
            }
            
            if ($userId == 99) {
                // For user ID 99, handle decline
              
                $sqlInsert2 = "
                    INSERT INTO tbl_reservation_status 
                    (reservation_reservation_id, reservation_status_status_id, reservation_active, reservation_updated_at, reservation_users_id) 
                    VALUES (:reservation_id, 2, 1, NOW(), :user_id)";
                
                $stmtInsert2 = $this->conn->prepare($sqlInsert2);
                $stmtInsert2->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtInsert2->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $stmtInsert2->execute();
            } else {
                // For other users, handle decline
                // Insert only status_id 9 with active = 1

                $sqlUpdate = "
                UPDATE tbl_reservation_status 
                SET reservation_active = 1 
                WHERE reservation_reservation_id = :reservation_id 
                AND reservation_status_status_id = 1";
            
                $stmtUpdate = $this->conn->prepare($sqlUpdate);
                $stmtUpdate->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtUpdate->execute();

                $sqlInsert9 = "
                    INSERT INTO tbl_reservation_status 
                    (reservation_reservation_id, reservation_status_status_id, reservation_active, reservation_updated_at, reservation_users_id) 
                    VALUES (:reservation_id, 9, 1, NOW(), :user_id)";
                
                $stmtInsert9 = $this->conn->prepare($sqlInsert9);
                $stmtInsert9->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $stmtInsert9->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $stmtInsert9->execute();

                $sqlInsert2 = "
                INSERT INTO tbl_reservation_status 
                (reservation_reservation_id, reservation_status_status_id, reservation_active, reservation_updated_at, reservation_users_id) 
                VALUES (:reservation_id, 2, 1, NOW(), :user_id)";
            
            $stmtInsert2 = $this->conn->prepare($sqlInsert2);
            $stmtInsert2->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtInsert2->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmtInsert2->execute();
            }
        }

        // Insert notification with proper notification_user_id
        if (!empty($notificationMessage)) {
            $sqlNotification = "INSERT INTO tbl_notification_reservation 
                             (notification_message, notification_reservation_reservation_id, notification_user_id, notification_created_at) 
                             VALUES (:message, :reservation_id, :notification_user_id, NOW())";
            
            $stmtNotification = $this->conn->prepare($sqlNotification);
            $message = $notificationMessage;
            $notification_user = $notification_user_id ?? $userId;
            $stmtNotification->bindParam(':message', $message, PDO::PARAM_STR);
            $stmtNotification->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $stmtNotification->bindParam(':notification_user_id', $notification_user, PDO::PARAM_INT);
            $stmtNotification->execute();
        }

        $this->conn->commit();
        
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
                error_log("Audit approver lookup failed (handleRequest): " . $te->getMessage());
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
                error_log("Audit reservation lookup failed (handleRequest): " . $te->getMessage());
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
                error_log("Audit log insert failed (handleRequest): " . print_r($audit->errorInfo(), true));
            } else {
                try {
                    $latest = $this->conn->query("SELECT id, description, action, created_at, created_by FROM audit_log ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
                   
                } catch (Throwable $te) {
                    error_log("Failed to read latest audit_log (handleRequest): " . $te->getMessage());
                }
            }
        } catch (Throwable $te) {
            error_log("Audit logging error (handleRequest): " . $te->getMessage());
        }

        // Fetch the requester user ID from the reservation
        $requesterUserId = null;
        try {
            $requesterStmt = $this->conn->prepare("SELECT reservation_user_id FROM tbl_reservation WHERE reservation_id = :rid");
            $requesterStmt->bindParam(':rid', $reservationId, PDO::PARAM_INT);
            $requesterStmt->execute();
            $requesterData = $requesterStmt->fetch(PDO::FETCH_ASSOC);
            if ($requesterData && isset($requesterData['reservation_user_id'])) {
                $requesterUserId = (int)$requesterData['reservation_user_id'];
            }
        } catch (Throwable $te) {
            error_log("Failed to fetch requester user ID (handleRequest): " . $te->getMessage());
        }

        // Send push notifications after successful database operations
        $status = $isAccepted ? 'approved' : 'declined';
        $title = "Reservation " . ucfirst($status);
        $body = "Your reservation has been {$status}.";
        $data = [
            'reservation_id' => $reservationId,
            'status' => $status,
            'type' => 'reservation_approval'
        ];

        // For DECLINE: Send to user ID 99 and requester
        if (!$isAccepted) {
            // Send to user ID 99 (skip if final approver)
            if (!$isFinalApprover) {
                $this->sendPushNotificationToUser(99, $title, $body, $data);
            } else {
               
            }
            
            // Always send to requester if different from user ID 99
            if ($requesterUserId && $requesterUserId != 99) {
                $this->sendPushNotificationToUser($requesterUserId, $title, $body, $data);
            }
        } else {
            // For ACCEPT: Send to user ID 99 for final approval (skip if already final approver)
            if (!$isFinalApprover) {
                $finalApprovalTitle = "Final Approval Required";
                $finalApprovalBody = "A reservation has been approved and requires your final approval.";
                $finalApprovalData = [
                    'reservation_id' => $reservationId,
                    'status' => 'pending_final_approval',
                    'type' => 'reservation_final_approval',
                    'url' => '/gsd/grms/Admin/viewRequest'
                ];
                $this->sendPushNotificationToUser(99, $finalApprovalTitle, $finalApprovalBody, $finalApprovalData);
            } else {
              
            }
            
            // Always send to requester
            if ($requesterUserId) {
                $this->sendPushNotificationToUser($requesterUserId, $title, $body, $data);
            }
        }

        return json_encode([
            'status' => 'success', 
            'message' => 'Request ' . ($isAccepted ? 'approved' : 'declined') . ' successfully',
            'reservation_id' => $reservationId
        ]);

    } catch (PDOException $e) {
        $this->conn->rollBack();
        return json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}


public function archiveUser($userType, $userId) {
    try {
        // Validate inputs
        if (empty($userType) || empty($userId)) {
            return json_encode(array('status' => 'error', 'message' => 'User type and ID are required.'));
        }

        // Convert single ID to array for consistent handling
        if (!is_array($userId)) {
            $userId = [$userId];
        }

        // Check for active transactions before archiving (only for users, not drivers) - DISABLED
        // if ($userType === 'user') {
        //     $activeTransactionCheck = $this->checkActiveTransactions('user', $userId);
        //     if ($activeTransactionCheck['hasActive']) {
        //         return json_encode([
        //             'status' => 'error', 
        //             'message' => 'Cannot archive user(s) with active reservations: ' . implode(', ', $activeTransactionCheck['resourcesWithTransactions'])
        //         ]);
        //     }
        // }

        // Create placeholders for IN clause
        $placeholders = implode(',', array_fill(0, count($userId), '?'));
        
        switch ($userType) {
            case 'user':
                $query = "UPDATE tbl_users SET is_active = 0 WHERE users_id IN ($placeholders)";
                break;
            case 'driver':
                $query = "UPDATE tbl_driver SET is_active = 0 WHERE driver_id IN ($placeholders)";
                break;
            default:
                return json_encode(array('status' => 'error', 'message' => 'Invalid user type. Only user and driver types are supported.'));
        }

        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($userId)) {
            $count = $stmt->rowCount();
            if ($count > 0) {
                return json_encode([
                    'status' => 'success', 
                    'message' => $count . ' user(s) archived successfully.'
                ]);
            } else {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'No users found with the given IDs.'
                ]);
            }
        }

        return json_encode(array('status' => 'error', 'message' => 'Error archiving user(s).'));
    } catch (PDOException $e) {
        return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

public function unArchive($userType, $userId) {
    try {
        // Validate inputs
        if (empty($userType) || empty($userId)) {
            return json_encode(array('status' => 'error', 'message' => 'User type and ID are required.'));
        }

        // Convert single ID to array for consistent handling
        if (!is_array($userId)) {
            $userId = [$userId];
        }

        // Create placeholders for IN clause
        $placeholders = implode(',', array_fill(0, count($userId), '?'));
        
        switch ($userType) {
            case 'user':
                $query = "UPDATE tbl_users SET is_active = 1 WHERE users_id IN ($placeholders)";
                break;
            case 'driver':
                $query = "UPDATE tbl_driver SET is_active = 1 WHERE driver_id IN ($placeholders)";
                break;
            default:
                return json_encode(array('status' => 'error', 'message' => 'Invalid user type. Only user and driver types are supported.'));
        }

        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($userId)) {
            $count = $stmt->rowCount();
            if ($count > 0) {
                return json_encode([
                    'status' => 'success', 
                    'message' => $count . ' user(s) unarchived successfully.'
                ]);
            } else {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'No users found with the given IDs.'
                ]);
            }
        }

        return json_encode(array('status' => 'error', 'message' => 'Error unarchiving user(s).'));
    } catch (PDOException $e) {
        return json_encode(array('status' => 'error', 'message' => 'Database error: ' . $e->getMessage()));
    }
}

public function archiveResource($resourceType, $resourceId, $is_serialize = false, $userId = null) {
    try {
        // Debug: log context
     
        if (empty($resourceType) || empty($resourceId)) {
            return json_encode(['status' => 'error', 'message' => 'Resource type and ID are required.']);
        }

        // Convert single ID to array for consistent handling
        if (!is_array($resourceId)) {
            $resourceId = [$resourceId];
        }

        // Check for active transactions before archiving - DISABLED
        // $activeTransactionCheck = $this->checkActiveTransactions($resourceType, $resourceId);
        // if ($activeTransactionCheck['hasActive']) {
        //     return json_encode([
        //         'status' => 'error', 
        //         'message' => 'Cannot archive resource(s) with active reservations: ' . implode(', ', $activeTransactionCheck['resourcesWithTransactions'])
        //     ]);
        // }

        $query = "";

        // Create placeholders for IN clause
        $placeholders = implode(',', array_fill(0, count($resourceId), '?'));

        switch ($resourceType) {
            case 'vehicle':
                $query = "UPDATE tbl_vehicle SET is_active = 0 WHERE vehicle_id IN ($placeholders)";
                break;

            case 'venue':
                $query = "UPDATE tbl_venue SET is_active = 0 WHERE ven_id IN ($placeholders)";
                break;

            case 'equipment':
                // Update equipment master record to deactivate the entire equipment
                $query = "UPDATE tbl_equipments SET is_active = 0 WHERE equip_id IN ($placeholders)";
                break;

            default:
                return json_encode(['status' => 'error', 'message' => 'Invalid resource type.']);
        }

        $stmt = $this->conn->prepare($query);
        
        // Execute with array of IDs
        if ($stmt->execute($resourceId)) {
            $count = $stmt->rowCount();
            if ($count > 0) {
                // Non-blocking audit log insert without IDs
                try {
                    $typeLabel = ucfirst((string)$resourceType);
                    $desc = "Archived " . $typeLabel . " resource(s): " . $count;
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $action = 'ARCHIVE';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    if (!$audit->execute()) {
                        error_log("Audit log insert failed (archiveResource): " . print_r($audit->errorInfo(), true));
                    } else {
                        try {
                            $latest = $this->conn->query("SELECT id, description, action, created_at, created_by FROM audit_log ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
                         
                        } catch (Throwable $te) {
                            error_log("Failed to read latest audit_log (archiveResource): " . $te->getMessage());
                        }
                    }
                } catch (Throwable $te) {
                    error_log("Audit logging error (archiveResource): " . $te->getMessage());
                }
                return json_encode([
                    'status' => 'success', 
                    'message' => $count . ' resource(s) archived successfully.'
                ]);
            } else {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'No resources found with the given IDs.'
                ]);
            }
        }

        return json_encode(['status' => 'error', 'message' => 'Error archiving resource(s).']);

    } catch (PDOException $e) {
        return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}


    public function unarchiveResource($resourceType, $resourceId, $is_serialize = false, $userId = null) {
    try {
        // Debug: log context
        error_log("unarchiveResource userId=" . var_export($userId, true) . ", type=" . var_export($resourceType, true));
        if (empty($resourceType) || empty($resourceId)) {
            return json_encode(['status' => 'error', 'message' => 'Resource type and ID are required.']);
        }

        // Convert single ID to array for consistent handling
        if (!is_array($resourceId)) {
            $resourceId = [$resourceId];
        }

        // Check for active transactions before unarchiving - DISABLED
        // $activeTransactionCheck = $this->checkActiveTransactions($resourceType, $resourceId);
        // if ($activeTransactionCheck['hasActive']) {
        //     return json_encode([
        //         'status' => 'error', 
        //         'message' => 'Cannot unarchive resource(s) with active reservations: ' . implode(', ', $activeTransactionCheck['resourcesWithTransactions'])
        //     ]);
        // }

        // Create placeholders for IN clause
        $placeholders = implode(',', array_fill(0, count($resourceId), '?'));

        $query = "";
        switch ($resourceType) {
            case 'vehicle':
                $query = "UPDATE tbl_vehicle SET is_active = 1 WHERE vehicle_id IN ($placeholders)";
                break;

            case 'venue':
                $query = "UPDATE tbl_venue SET is_active = 1 WHERE ven_id IN ($placeholders)";
                break;

            case 'equipment':
                // Update equipment master record to reactivate the entire equipment
                $query = "UPDATE tbl_equipments SET is_active = 1 WHERE equip_id IN ($placeholders)";
                break;

            default:
                return json_encode(['status' => 'error', 'message' => 'Invalid resource type.']);
        }

        $stmt = $this->conn->prepare($query);
        
        // Execute with array of IDs
        if ($stmt->execute($resourceId)) {
            $count = $stmt->rowCount();
            if ($count > 0) {
                // Non-blocking audit log insert without IDs
                try {
                    $typeLabel = ucfirst((string)$resourceType);
                    $desc = "Unarchived " . $typeLabel . " resource(s): " . $count;
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $action = 'UNARCHIVE';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    if (!$audit->execute()) {
                        error_log("Audit log insert failed (unarchiveResource): " . print_r($audit->errorInfo(), true));
                    } else {
                        try {
                            $latest = $this->conn->query("SELECT id, description, action, created_at, created_by FROM audit_log ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
                        } catch (Throwable $te) {
                            error_log("Failed to read latest audit_log (unarchiveResource): " . $te->getMessage());
                        }
                    }
                } catch (Throwable $te) {
                    error_log("Audit logging error (unarchiveResource): " . $te->getMessage());
                }
                return json_encode([
                    'status' => 'success', 
                    'message' => $count . ' resource(s) unarchived successfully.'
                ]);
            } else {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'No resources found with the given IDs.'
                ]);
            }
        }

        return json_encode(['status' => 'error', 'message' => 'Error unarchiving resource(s).']);

    } catch (PDOException $e) {
        return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

public function fetchInactiveUser() {
    try {
        $usersSql = "SELECT 
                'user' as type,
                u.users_id as id,
                u.users_fname as fname,
                u.users_mname as mname,
                u.users_lname as lname,
                u.users_email as email,
                u.users_school_id as school_id,
                u.users_contact_number as contact_number,
                u.users_department_id as department_id,
                u.users_pic as pic,
                u.users_created_at as created_at,
                u.users_updated_at as updated_at,
                u.is_active,
                d.departments_name,
                ul.user_level_name,
                ul.user_level_desc
            FROM 
                tbl_users u
            LEFT JOIN 
                tbl_departments d ON u.users_department_id = d.departments_id
            LEFT JOIN 
                tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
            WHERE u.is_active = 0";

        

        // Combine all results and execute
        $sql = "($usersSql) ORDER BY type, lname";
        return $this->executeQuery($sql);
    } catch (PDOException $e) {
        return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}


public function fetchEquipmentAndInactiveUnits() {
    // Fetch inactive equipment (master records), with total unit count
    $equipmentSql = "SELECT 
                        e.equip_id, 
                        e.equip_name,
                        e.equip_type,
                        COUNT(eu.unit_id) as total_units
                    FROM 
                        tbl_equipments e
                    LEFT JOIN 
                        tbl_equipment_unit eu ON e.equip_id = eu.equip_id
                    WHERE 
                        e.is_active = 0
                    GROUP BY e.equip_id, e.equip_name, e.equip_type";

    $stmt = $this->conn->prepare($equipmentSql);
    $stmt->execute();
    $inactiveEquipment = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response = [];

    foreach ($inactiveEquipment as $equipment) {
        $response[] = [
            'equip_id' => (int)$equipment['equip_id'],
            'equip_name' => $equipment['equip_name'],
            'equip_type' => $equipment['equip_type'] ?? 'Not specified',
            'total_units' => (int)$equipment['total_units'],
            'serial_number' => null // Not applicable for master equipment records
        ];
    }

    return json_encode(['status' => 'success', 'data' => $response]);
}

public function fetchInactiveEquipmentUnits() {
    // Fetch inactive equipment units with their equipment name
    $unitSql = "SELECT 
                    eu.unit_id, 
                    eu.equip_id, 
                    eu.serial_number,
                    e.equip_name,
                    e.equip_type
                FROM 
                    tbl_equipment_unit eu
                INNER JOIN 
                    tbl_equipments e ON e.equip_id = eu.equip_id
                WHERE 
                    eu.is_active = 0";

    $stmt = $this->conn->prepare($unitSql);
    $stmt->execute();
    $inactiveUnits = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $response = [];

    foreach ($inactiveUnits as $unit) {
        $response[] = [
            'unit_id' => (int)$unit['unit_id'],
            'equip_id' => (int)$unit['equip_id'],
            'equip_name' => $unit['equip_name'],
            'equip_type' => $unit['equip_type'] ?? 'Not specified',
            'serial_number' => $unit['serial_number'] ?? 'N/A'
        ];
    }

    return json_encode(['status' => 'success', 'data' => $response]);
}

public function deactivateEquipmentUnits($unitIds, $userId = null) {
    try {
        // Convert single ID to array for consistent handling
        if (!is_array($unitIds)) {
            $unitIds = [$unitIds];
        }

        // Create placeholders for IN clause
        $placeholders = implode(',', array_fill(0, count($unitIds), '?'));
        
        $query = "UPDATE tbl_equipment_unit SET is_active = 0 WHERE unit_id IN ($placeholders)";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($unitIds)) {
            $count = $stmt->rowCount();
            if ($count > 0) {
                // Audit log
                try {
                    $desc = "Deactivated equipment unit(s): " . $count;
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $action = 'DEACTIVATE_UNIT';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    $audit->execute();
                } catch (Throwable $te) {
                    error_log("Audit logging error (deactivateEquipmentUnits): " . $te->getMessage());
                }
                
                return json_encode([
                    'status' => 'success', 
                    'message' => $count . ' equipment unit(s) deactivated successfully.'
                ]);
            } else {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'No units found with the given IDs.'
                ]);
            }
        }

        return json_encode(['status' => 'error', 'message' => 'Error deactivating equipment unit(s).']);

    } catch (PDOException $e) {
        return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

public function reactivateEquipmentUnits($unitIds, $userId = null) {
    try {
        // Convert single ID to array for consistent handling
        if (!is_array($unitIds)) {
            $unitIds = [$unitIds];
        }

        // Create placeholders for IN clause
        $placeholders = implode(',', array_fill(0, count($unitIds), '?'));
        
        $query = "UPDATE tbl_equipment_unit SET is_active = 1 WHERE unit_id IN ($placeholders)";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($unitIds)) {
            $count = $stmt->rowCount();
            if ($count > 0) {
                // Audit log
                try {
                    $desc = "Reactivated equipment unit(s): " . $count;
                    $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                    $audit = $this->conn->prepare($auditSql);
                    $action = 'REACTIVATE_UNIT';
                    $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                    $audit->bindParam(':action', $action, PDO::PARAM_STR);
                    if ($userId !== null) {
                        $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                    } else {
                        $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                    }
                    $audit->execute();
                } catch (Throwable $te) {
                    error_log("Audit logging error (reactivateEquipmentUnits): " . $te->getMessage());
                }
                
                return json_encode([
                    'status' => 'success', 
                    'message' => $count . ' equipment unit(s) reactivated successfully.'
                ]);
            } else {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'No units found with the given IDs.'
                ]);
            }
        }

        return json_encode(['status' => 'error', 'message' => 'Error reactivating equipment unit(s).']);

    } catch (PDOException $e) {
        return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

    public function fetchInactiveVenue() {
        $sql = "SELECT 
                ven_id, 
                ven_name, 
                ven_occupancy, 
                ven_created_at, 
                ven_updated_at, 
                status_availability_id, 
                ven_pic, 
                is_active
                FROM tbl_venue
                WHERE is_active = 0";
        return $this->executeQuery($sql);
    }

    public function fetchInactiveVehicle() {
        $sql = "SELECT  
                    v.vehicle_id,
                    v.vehicle_license,
                    v.year,
                    v.vehicle_pic,
                    v.status_availability_id,
                    vmk.vehicle_make_name, 
                    vc.vehicle_category_name,
                    vmd.vehicle_model_name,
                    sa.status_availability_name,
                    v.is_active
                FROM 
                    tbl_vehicle v
                INNER JOIN
                    tbl_vehicle_model vmd ON v.vehicle_model_id = vmd.vehicle_model_id
                INNER JOIN
                    tbl_vehicle_make vmk ON vmd.vehicle_model_vehicle_make_id = vmk.vehicle_make_id
                INNER JOIN
                    tbl_vehicle_category vc ON vmd.vehicle_category_id = vc.vehicle_category_id
                INNER JOIN
                    tbl_status_availability sa ON v.status_availability_id = sa.status_availability_id
                WHERE 
                    v.is_active = 0";
    
        return $this->executeQuery($sql);
    }

    // Fetch inactive vehicle makes
    public function fetchInactiveVehicleMake() {
        $sql = "SELECT vehicle_make_id, vehicle_make_name 
                FROM tbl_vehicle_make 
                WHERE is_active = 0 
                ORDER BY vehicle_make_id DESC";
        return $this->executeQuery($sql);
    }

    // Fetch inactive vehicle categories
    public function fetchInactiveVehicleCategory() {
        $sql = "SELECT vehicle_category_id, vehicle_category_name 
                FROM tbl_vehicle_category 
                WHERE is_active = 0 
                ORDER BY vehicle_category_id DESC";
        return $this->executeQuery($sql);
    }

    // Fetch inactive vehicle models
    public function fetchInactiveVehicleModel() {
        $sql = "SELECT 
                    vm.vehicle_model_id,
                    vm.vehicle_model_name,
                    vmk.vehicle_make_name,
                    vc.vehicle_category_name
                FROM tbl_vehicle_model vm
                LEFT JOIN tbl_vehicle_make vmk ON vm.vehicle_model_vehicle_make_id = vmk.vehicle_make_id
                LEFT JOIN tbl_vehicle_category vc ON vm.vehicle_category_id = vc.vehicle_category_id
                WHERE vm.is_active = 0 
                ORDER BY vm.vehicle_model_id DESC";
        return $this->executeQuery($sql);
    }

    // Fetch inactive equipment categories
    public function fetchInactiveEquipmentCategory() {
        $sql = "SELECT equipments_category_id, equipments_category_name 
                FROM tbl_equipment_category 
                WHERE is_active = 0 
                ORDER BY equipments_category_id DESC";
        return $this->executeQuery($sql);
    }

    // Fetch inactive departments
    public function fetchInactiveDepartment() {
        $sql = "SELECT departments_id, departments_name, department_type 
                FROM tbl_departments 
                WHERE is_active = 0 
                ORDER BY departments_id DESC";
        return $this->executeQuery($sql);
    }

    // Fetch inactive holidays
    public function fetchInactiveHoliday() {
        $sql = "SELECT holiday_id, holiday_name, holiday_date 
                FROM tbl_holidays 
                WHERE is_active = 0 
                ORDER BY holiday_id DESC";
        return $this->executeQuery($sql);
    }

    // Check if vehicle make or category is referenced by active vehicle models
    private function checkVehicleReferenceInModels($referenceType, $referenceIds) {
        try {
            if (!is_array($referenceIds)) {
                $referenceIds = [$referenceIds];
            }

            $placeholders = implode(',', array_fill(0, count($referenceIds), '?'));
            
            // Build query based on reference type
            switch ($referenceType) {
                case 'vehicle_make':
                    $sql = "SELECT DISTINCT vmk.vehicle_make_name, vm.vehicle_model_name
                            FROM tbl_vehicle_model vm
                            INNER JOIN tbl_vehicle_make vmk ON vm.vehicle_model_vehicle_make_id = vmk.vehicle_make_id
                            WHERE vmk.vehicle_make_id IN ($placeholders)
                            AND vm.is_active = 1";
                    break;

                case 'vehicle_category':
                    $sql = "SELECT DISTINCT vc.vehicle_category_name, vm.vehicle_model_name
                            FROM tbl_vehicle_model vm
                            INNER JOIN tbl_vehicle_category vc ON vm.vehicle_category_id = vc.vehicle_category_id
                            WHERE vc.vehicle_category_id IN ($placeholders)
                            AND vm.is_active = 1";
                    break;

                default:
                    return ['hasActive' => false, 'itemsWithModels' => []];
            }

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($referenceIds);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $hasActive = count($results) > 0;
            $itemsWithModels = [];
            
            if ($hasActive) {
                // Group model names by make/category
                $groupedModels = [];
                foreach ($results as $row) {
                    $parentName = $row[array_keys($row)[0]]; // First column (make or category name)
                    if (!isset($groupedModels[$parentName])) {
                        $groupedModels[$parentName] = [];
                    }
                    $groupedModels[$parentName][] = $row['vehicle_model_name'];
                }
                
                foreach ($groupedModels as $parentName => $models) {
                    $itemsWithModels[] = $parentName . ' (has active models: ' . implode(', ', $models) . ')';
                }
            }

            return ['hasActive' => $hasActive, 'itemsWithModels' => $itemsWithModels];

        } catch (PDOException $e) {
            error_log("Error checking vehicle reference in models: " . $e->getMessage());
            return ['hasActive' => false, 'itemsWithModels' => []];
        }
    }

    // Check if vehicle model is referenced by active vehicles
    private function checkVehicleModelInVehicles($modelIds) {
        try {
            if (!is_array($modelIds)) {
                $modelIds = [$modelIds];
            }

            $placeholders = implode(',', array_fill(0, count($modelIds), '?'));
            
            $sql = "SELECT DISTINCT vm.vehicle_model_name, v.vehicle_license
                    FROM tbl_vehicle v
                    INNER JOIN tbl_vehicle_model vm ON v.vehicle_model_id = vm.vehicle_model_id
                    WHERE vm.vehicle_model_id IN ($placeholders)
                    AND v.is_active = 1";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($modelIds);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $hasActive = count($results) > 0;
            $itemsWithVehicles = [];
            
            if ($hasActive) {
                // Group vehicle licenses by model
                $groupedVehicles = [];
                foreach ($results as $row) {
                    $modelName = $row['vehicle_model_name'];
                    if (!isset($groupedVehicles[$modelName])) {
                        $groupedVehicles[$modelName] = [];
                    }
                    $groupedVehicles[$modelName][] = $row['vehicle_license'];
                }
                
                foreach ($groupedVehicles as $modelName => $licenses) {
                    $itemsWithVehicles[] = $modelName . ' (has active vehicles: ' . implode(', ', $licenses) . ')';
                }
            }

            return ['hasActive' => $hasActive, 'itemsWithVehicles' => $itemsWithVehicles];

        } catch (PDOException $e) {
            error_log("Error checking vehicle model in vehicles: " . $e->getMessage());
            return ['hasActive' => false, 'itemsWithVehicles' => []];
        }
    }

    // Check if equipment category is referenced by active equipment
    private function checkEquipmentCategoryInEquipment($categoryIds) {
        try {
            if (!is_array($categoryIds)) {
                $categoryIds = [$categoryIds];
            }

            $placeholders = implode(',', array_fill(0, count($categoryIds), '?'));
            
            $sql = "SELECT DISTINCT ec.equipments_category_name, e.equip_name
                    FROM tbl_equipments e
                    INNER JOIN tbl_equipment_category ec ON e.equipments_category_id = ec.equipments_category_id
                    WHERE ec.equipments_category_id IN ($placeholders)
                    AND e.is_active = 1";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($categoryIds);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $hasActive = count($results) > 0;
            $itemsWithEquipment = [];
            
            if ($hasActive) {
                // Group equipment names by category
                $groupedEquipment = [];
                foreach ($results as $row) {
                    $categoryName = $row['equipments_category_name'];
                    if (!isset($groupedEquipment[$categoryName])) {
                        $groupedEquipment[$categoryName] = [];
                    }
                    $groupedEquipment[$categoryName][] = $row['equip_name'];
                }
                
                foreach ($groupedEquipment as $categoryName => $equipment) {
                    $itemsWithEquipment[] = $categoryName . ' (has active equipment: ' . implode(', ', $equipment) . ')';
                }
            }

            return ['hasActive' => $hasActive, 'itemsWithEquipment' => $itemsWithEquipment];

        } catch (PDOException $e) {
            error_log("Error checking equipment category in equipment: " . $e->getMessage());
            return ['hasActive' => false, 'itemsWithEquipment' => []];
        }
    }

    // Check if vehicle make, category, or model is used in active transactions
    private function checkVehicleReferenceInTransactions($referenceType, $referenceIds) {
        try {
            if (!is_array($referenceIds)) {
                $referenceIds = [$referenceIds];
            }

            $placeholders = implode(',', array_fill(0, count($referenceIds), '?'));
            
            // Build query based on reference type
            switch ($referenceType) {
                case 'vehicle_make':
                    $sql = "SELECT DISTINCT vmk.vehicle_make_name
                            FROM tbl_reservation_vehicle rv
                            INNER JOIN tbl_vehicle v ON rv.reservation_vehicle_vehicle_id = v.vehicle_id
                            INNER JOIN tbl_vehicle_model vm ON v.vehicle_model_id = vm.vehicle_model_id
                            INNER JOIN tbl_vehicle_make vmk ON vm.vehicle_model_vehicle_make_id = vmk.vehicle_make_id
                            INNER JOIN tbl_reservation r ON rv.reservation_vehicle_reservation_id = r.reservation_id
                            INNER JOIN tbl_reservation_status rs ON r.reservation_id = rs.reservation_reservation_id
                            WHERE vmk.vehicle_make_id IN ($placeholders)
                            AND rs.reservation_active = 1
                            AND rs.reservation_status_status_id NOT IN (2, 4, 5)";
                    break;

                case 'vehicle_category':
                    $sql = "SELECT DISTINCT vc.vehicle_category_name
                            FROM tbl_reservation_vehicle rv
                            INNER JOIN tbl_vehicle v ON rv.reservation_vehicle_vehicle_id = v.vehicle_id
                            INNER JOIN tbl_vehicle_model vm ON v.vehicle_model_id = vm.vehicle_model_id
                            INNER JOIN tbl_vehicle_category vc ON vm.vehicle_category_id = vc.vehicle_category_id
                            INNER JOIN tbl_reservation r ON rv.reservation_vehicle_reservation_id = r.reservation_id
                            INNER JOIN tbl_reservation_status rs ON r.reservation_id = rs.reservation_reservation_id
                            WHERE vc.vehicle_category_id IN ($placeholders)
                            AND rs.reservation_active = 1
                            AND rs.reservation_status_status_id NOT IN (2, 4, 5)";
                    break;

                case 'vehicle_model':
                    $sql = "SELECT DISTINCT vm.vehicle_model_name
                            FROM tbl_reservation_vehicle rv
                            INNER JOIN tbl_vehicle v ON rv.reservation_vehicle_vehicle_id = v.vehicle_id
                            INNER JOIN tbl_vehicle_model vm ON v.vehicle_model_id = vm.vehicle_model_id
                            INNER JOIN tbl_reservation r ON rv.reservation_vehicle_reservation_id = r.reservation_id
                            INNER JOIN tbl_reservation_status rs ON r.reservation_id = rs.reservation_reservation_id
                            WHERE vm.vehicle_model_id IN ($placeholders)
                            AND rs.reservation_active = 1
                            AND rs.reservation_status_status_id NOT IN (2, 4, 5)";
                    break;

                default:
                    return ['hasActive' => false, 'itemsWithTransactions' => []];
            }

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($referenceIds);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $hasActive = count($results) > 0;
            $itemsWithTransactions = array_column($results, array_values($results[0])[0] ?? 'name');

            return ['hasActive' => $hasActive, 'itemsWithTransactions' => $itemsWithTransactions];

        } catch (PDOException $e) {
            error_log("Error checking vehicle reference transactions: " . $e->getMessage());
            return ['hasActive' => false, 'itemsWithTransactions' => []];
        }
    }

    // Check if department is used in approval exclusive table
    private function checkDepartmentInApprovalExclusive($departmentIds) {
        try {
            if (!is_array($departmentIds)) {
                $departmentIds = [$departmentIds];
            }

            $placeholders = implode(',', array_fill(0, count($departmentIds), '?'));
            
            $sql = "SELECT DISTINCT d.departments_name, ul.user_level_name
                    FROM tbl_approval_exclusive ae
                    INNER JOIN tbl_departments d ON ae.approval_exclusive_department_id = d.departments_id
                    INNER JOIN tbl_user_level ul ON ae.approval_exclusive_user_level_id = ul.user_level_id
                    WHERE d.departments_id IN ($placeholders)";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($departmentIds);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $hasActive = count($results) > 0;
            $itemsWithApprovals = [];
            
            if ($hasActive) {
                // Group user levels by department
                $groupedApprovals = [];
                foreach ($results as $row) {
                    $departmentName = $row['departments_name'];
                    if (!isset($groupedApprovals[$departmentName])) {
                        $groupedApprovals[$departmentName] = [];
                    }
                    $groupedApprovals[$departmentName][] = $row['user_level_name'];
                }
                
                foreach ($groupedApprovals as $departmentName => $userLevels) {
                    $itemsWithApprovals[] = $departmentName . ' (used in approval exclusive for: ' . implode(', ', array_unique($userLevels)) . ')';
                }
            }

            return ['hasActive' => $hasActive, 'itemsWithApprovals' => $itemsWithApprovals];

        } catch (PDOException $e) {
            error_log("Error checking department in approval exclusive: " . $e->getMessage());
            return ['hasActive' => false, 'itemsWithApprovals' => []];
        }
    }

    // Check if department is used in venue department approval table
    private function checkDepartmentInVenueApproval($departmentIds) {
        try {
            if (!is_array($departmentIds)) {
                $departmentIds = [$departmentIds];
            }

            $placeholders = implode(',', array_fill(0, count($departmentIds), '?'));
            
            $sql = "SELECT DISTINCT d.departments_name, v.ven_name
                    FROM tbl_venue_department_approval vda
                    INNER JOIN tbl_departments d ON vda.approval_venue_department_id = d.departments_id
                    INNER JOIN tbl_venue v ON vda.approval_venue_venue_id = v.ven_id
                    WHERE d.departments_id IN ($placeholders)";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($departmentIds);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $hasActive = count($results) > 0;
            $itemsWithVenues = [];
            
            if ($hasActive) {
                // Group venues by department
                $groupedVenues = [];
                foreach ($results as $row) {
                    $departmentName = $row['departments_name'];
                    if (!isset($groupedVenues[$departmentName])) {
                        $groupedVenues[$departmentName] = [];
                    }
                    $groupedVenues[$departmentName][] = $row['ven_name'];
                }
                
                foreach ($groupedVenues as $departmentName => $venues) {
                    $itemsWithVenues[] = $departmentName . ' (assigned to venues: ' . implode(', ', $venues) . ')';
                }
            }

            return ['hasActive' => $hasActive, 'itemsWithVenues' => $itemsWithVenues];

        } catch (PDOException $e) {
            error_log("Error checking department in venue approval: " . $e->getMessage());
            return ['hasActive' => false, 'itemsWithVenues' => []];
        }
    }

    // Archive/Deactivate catalog items (vehicle make, category, model, equipment category, departments, holidays)
    public function archiveCatalogItem($itemType, $itemIds, $userId = null) {
        try {
            if (empty($itemType) || empty($itemIds)) {
                return json_encode(['status' => 'error', 'message' => 'Item type and ID are required.']);
            }

            // Convert single ID to array for consistent handling
            if (!is_array($itemIds)) {
                $itemIds = [$itemIds];
            }

            // For vehicle make and category, check if they're referenced by active vehicle models FIRST
            if (in_array($itemType, ['vehicle_make', 'vehicle_category'])) {
                $modelCheck = $this->checkVehicleReferenceInModels($itemType, $itemIds);
                if ($modelCheck['hasActive']) {
                    return json_encode([
                        'status' => 'error', 
                        'message' => 'Cannot deactivate item(s) that have active vehicle models: ' . implode(', ', $modelCheck['itemsWithModels'])
                    ]);
                }
            }

            // For vehicle model, check if they're referenced by active vehicles FIRST
            if ($itemType === 'vehicle_model') {
                $vehicleCheck = $this->checkVehicleModelInVehicles($itemIds);
                if ($vehicleCheck['hasActive']) {
                    return json_encode([
                        'status' => 'error', 
                        'message' => 'Cannot deactivate vehicle model(s) that have active vehicles: ' . implode(', ', $vehicleCheck['itemsWithVehicles'])
                    ]);
                }
            }

            // For equipment category, check if they're referenced by active equipment FIRST
            if ($itemType === 'equipment_category') {
                $equipmentCheck = $this->checkEquipmentCategoryInEquipment($itemIds);
                if ($equipmentCheck['hasActive']) {
                    return json_encode([
                        'status' => 'error', 
                        'message' => 'Cannot deactivate equipment category that has active equipment: ' . implode(', ', $equipmentCheck['itemsWithEquipment'])
                    ]);
                }
            }

            // For vehicle-related tables, check if they're used in active transactions
            if (in_array($itemType, ['vehicle_make', 'vehicle_category', 'vehicle_model'])) {
                $transactionCheck = $this->checkVehicleReferenceInTransactions($itemType, $itemIds);
                if ($transactionCheck['hasActive']) {
                    return json_encode([
                        'status' => 'error', 
                        'message' => 'Cannot deactivate item(s) used in active reservations: ' . implode(', ', $transactionCheck['itemsWithTransactions'])
                    ]);
                }
            }

            // For departments, check if they're used in approval systems
            if ($itemType === 'department') {
                // Check approval exclusive table
                $approvalExclusiveCheck = $this->checkDepartmentInApprovalExclusive($itemIds);
                if ($approvalExclusiveCheck['hasActive']) {
                    return json_encode([
                        'status' => 'error', 
                        'message' => 'Cannot deactivate department(s) that are used in approval exclusive settings: ' . implode(', ', $approvalExclusiveCheck['itemsWithApprovals'])
                    ]);
                }

                // Check venue department approval table
                $venueApprovalCheck = $this->checkDepartmentInVenueApproval($itemIds);
                if ($venueApprovalCheck['hasActive']) {
                    return json_encode([
                        'status' => 'error', 
                        'message' => 'Cannot deactivate department(s) that are assigned to venue approvals: ' . implode(', ', $venueApprovalCheck['itemsWithVenues'])
                    ]);
                }
            }

            // Create placeholders for IN clause
            $placeholders = implode(',', array_fill(0, count($itemIds), '?'));

            $query = "";
            $itemName = "";

            switch ($itemType) {
                case 'vehicle_make':
                    $query = "UPDATE tbl_vehicle_make SET is_active = 0 WHERE vehicle_make_id IN ($placeholders)";
                    $itemName = "Vehicle Make";
                    break;

                case 'vehicle_category':
                    $query = "UPDATE tbl_vehicle_category SET is_active = 0 WHERE vehicle_category_id IN ($placeholders)";
                    $itemName = "Vehicle Category";
                    break;

                case 'vehicle_model':
                    $query = "UPDATE tbl_vehicle_model SET is_active = 0 WHERE vehicle_model_id IN ($placeholders)";
                    $itemName = "Vehicle Model";
                    break;

                case 'equipment_category':
                    $query = "UPDATE tbl_equipment_category SET is_active = 0 WHERE equipments_category_id IN ($placeholders)";
                    $itemName = "Equipment Category";
                    break;

                case 'department':
                    $query = "UPDATE tbl_departments SET is_active = 0 WHERE departments_id IN ($placeholders)";
                    $itemName = "Department";
                    break;

                case 'holiday':
                    $query = "UPDATE tbl_holidays SET is_active = 0 WHERE holiday_id IN ($placeholders)";
                    $itemName = "Holiday";
                    break;

                default:
                    return json_encode(['status' => 'error', 'message' => 'Invalid item type.']);
            }

            $stmt = $this->conn->prepare($query);
            
            if ($stmt->execute($itemIds)) {
                $count = $stmt->rowCount();
                if ($count > 0) {
                    // Audit log
                    try {
                        $desc = "Deactivated $itemName: $count item(s)";
                        $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                        $audit = $this->conn->prepare($auditSql);
                        $action = 'DEACTIVATE';
                        $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                        $audit->bindParam(':action', $action, PDO::PARAM_STR);
                        if ($userId !== null) {
                            $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                        } else {
                            $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                        }
                        $audit->execute();
                    } catch (Throwable $te) {
                        error_log("Audit logging error (archiveCatalogItem): " . $te->getMessage());
                    }
                    return json_encode([
                        'status' => 'success', 
                        'message' => "$count $itemName(s) deactivated successfully."
                    ]);
                } else {
                    return json_encode([
                        'status' => 'error', 
                        'message' => 'No items found with the given IDs.'
                    ]);
                }
            }

            return json_encode(['status' => 'error', 'message' => 'Error deactivating item(s).']);

        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    // Unarchive/Reactivate catalog items
    public function unarchiveCatalogItem($itemType, $itemIds, $userId = null) {
        try {
            if (empty($itemType) || empty($itemIds)) {
                return json_encode(['status' => 'error', 'message' => 'Item type and ID are required.']);
            }

            // Convert single ID to array for consistent handling
            if (!is_array($itemIds)) {
                $itemIds = [$itemIds];
            }

            // Create placeholders for IN clause
            $placeholders = implode(',', array_fill(0, count($itemIds), '?'));

            $query = "";
            $itemName = "";

            switch ($itemType) {
                case 'vehicle_make':
                    $query = "UPDATE tbl_vehicle_make SET is_active = 1 WHERE vehicle_make_id IN ($placeholders)";
                    $itemName = "Vehicle Make";
                    break;

                case 'vehicle_category':
                    $query = "UPDATE tbl_vehicle_category SET is_active = 1 WHERE vehicle_category_id IN ($placeholders)";
                    $itemName = "Vehicle Category";
                    break;

                case 'vehicle_model':
                    $query = "UPDATE tbl_vehicle_model SET is_active = 1 WHERE vehicle_model_id IN ($placeholders)";
                    $itemName = "Vehicle Model";
                    break;

                case 'equipment_category':
                    $query = "UPDATE tbl_equipment_category SET is_active = 1 WHERE equipments_category_id IN ($placeholders)";
                    $itemName = "Equipment Category";
                    break;

                case 'department':
                    $query = "UPDATE tbl_departments SET is_active = 1 WHERE departments_id IN ($placeholders)";
                    $itemName = "Department";
                    break;

                case 'holiday':
                    $query = "UPDATE tbl_holidays SET is_active = 1 WHERE holiday_id IN ($placeholders)";
                    $itemName = "Holiday";
                    break;

                case 'building':
                    $query = "UPDATE tbl_venue_building SET is_active = 1 WHERE venue_building_id IN ($placeholders)";
                    $itemName = "Building";
                    break;

                default:
                    return json_encode(['status' => 'error', 'message' => 'Invalid item type.']);
            }

            $stmt = $this->conn->prepare($query);
            
            if ($stmt->execute($itemIds)) {
                $count = $stmt->rowCount();
                if ($count > 0) {
                    // Audit log
                    try {
                        $desc = "Reactivated $itemName: $count item(s)";
                        $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                        $audit = $this->conn->prepare($auditSql);
                        $action = 'REACTIVATE';
                        $audit->bindParam(':description', $desc, PDO::PARAM_STR);
                        $audit->bindParam(':action', $action, PDO::PARAM_STR);
                        if ($userId !== null) {
                            $audit->bindValue(':created_by', $userId, PDO::PARAM_INT);
                        } else {
                            $audit->bindValue(':created_by', null, PDO::PARAM_NULL);
                        }
                        $audit->execute();
                    } catch (Throwable $te) {
                        error_log("Audit logging error (unarchiveCatalogItem): " . $te->getMessage());
                    }
                    return json_encode([
                        'status' => 'success', 
                        'message' => "$count $itemName(s) reactivated successfully."
                    ]);
                } else {
                    return json_encode([
                        'status' => 'error', 
                        'message' => 'No items found with the given IDs.'
                    ]);
                }
            }

            return json_encode(['status' => 'error', 'message' => 'Error reactivating item(s).']);

        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
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
                    
                    // Commit transaction
                    $this->conn->commit();
                    
                    
                    
                    // Check if reservation has department approval requirements and send push notifications
                    if ($this->hasDepartmentApproval($reservationId)) {
                        $this->sendPushNotificationToDepartmentApproval($reservationId);
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
                    error_log("Failed to process reservation {$reservationId}: " . $e->getMessage());
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

    public function sendPushNotificationToUser($userId, $title = 'Notification', $body = 'You have a new notification', $data = []) {
        try {
            // Make a POST request to the push notification service
            // Use absolute URL for production environment compatibility
            // $pushNotificationUrl = 'https://peachpuff-alligator-715719.hostingersite.com/gsd/api/server/send-push-notification.php';
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
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => [
                        'Content-Type: application/json',
                        'Content-Length: ' . strlen($postData)
                    ],
                    'content' => $postData,
                    'timeout' => 10
                ]
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
            $curlError = curl_error($ch);
            curl_close($ch);
            
            // Handle cURL errors (connection issues, timeouts, etc.)
            if ($curlError) {
                error_log("Push notification cURL error for user $userId: $curlError");
                return false;
            }
            
            // Handle HTTP error codes with specific messages
            if ($httpCode < 200 || $httpCode >= 300 || $result === false) {
                $errorMessage = "Push notification HTTP error for user $userId (Code: $httpCode)";
                
                // Categorize HTTP errors
                if ($httpCode >= 400 && $httpCode < 500) {
                    // Client errors (4xx)
                    switch ($httpCode) {
                        case 400:
                            $errorMessage .= " - Bad Request: Invalid request data sent to push service";
                            break;
                        case 401:
                            $errorMessage .= " - Unauthorized: Authentication required or failed";
                            break;
                        case 403:
                            $errorMessage .= " - Forbidden: Access denied to push notification service";
                            break;
                        case 404:
                            $errorMessage .= " - Not Found: Push notification service endpoint not found at $pushNotificationUrl";
                            break;
                        case 408:
                            $errorMessage .= " - Request Timeout: Push notification service did not respond in time";
                            break;
                        case 429:
                            $errorMessage .= " - Too Many Requests: Rate limit exceeded for push notifications";
                            break;
                        default:
                            $errorMessage .= " - Client Error: Request could not be processed";
                    }
                } elseif ($httpCode >= 500 && $httpCode < 600) {
                    // Server errors (5xx)
                    switch ($httpCode) {
                        case 500:
                            $errorMessage .= " - Internal Server Error: Push notification service encountered an error";
                            break;
                        case 502:
                            $errorMessage .= " - Bad Gateway: Invalid response from push notification service";
                            break;
                        case 503:
                            $errorMessage .= " - Service Unavailable: Push notification service is temporarily down";
                            break;
                        case 504:
                            $errorMessage .= " - Gateway Timeout: Push notification service timed out";
                            break;
                        default:
                            $errorMessage .= " - Server Error: Push notification service error";
                    }
                } else {
                    $errorMessage .= " - Unexpected response code";
                }
                
                // Include response body if available for debugging
                if ($result) {
                    $errorMessage .= " | Response: " . substr($result, 0, 200);
                }
                
                error_log($errorMessage);
                return false;
            }
            
            // Parse and validate successful response
            $response = json_decode($result, true);
            if ($response && isset($response['status']) && $response['status'] === 'success') {
                error_log("Push notification sent successfully to user $userId");
                return true;
            } else {
                // Response received but indicates failure
                $failureMessage = "Push notification failed for user $userId";
                if ($response && isset($response['message'])) {
                    $failureMessage .= ": " . $response['message'];
                } elseif ($result) {
                    $failureMessage .= ": " . substr($result, 0, 200);
                } else {
                    $failureMessage .= ": Unknown error - empty response";
                }
                error_log($failureMessage);
                return false;
            }
            
        } catch (Exception $e) {
            error_log("Exception in sendPushNotificationToUser: " . $e->getMessage());
            return false;
        }
    }

    // Send push notification to department approval users
    private function sendPushNotificationToDepartmentApproval($reservationId) {
        try {
            error_log("🚀 INITIATING department approval push notifications for reservation ID: $reservationId");
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
                error_log("ℹ️  No department approvals found for reservation ID: $reservationId - skipping push notifications");
                return;
            }
            
            error_log("📋 Found " . count($deptApprovals) . " department(s) requiring approval for reservation ID: $reservationId");
            
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
                error_log("Could not find reservation details for ID: " . $reservationId);
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
            
           
            
            
            
            // Prepare notification data
            $title = "Department Approval Required";
            $body = "A reservation '{$reservation['reservation_title']}' by {$reservation['requester_name']} requires your department's approval.";
            $data = [
                'reservation_id' => $reservationId,
                'type' => 'department_approval',
                'action_url' => '/gsd/grms/Department/ViewApproval'
            ];
            
            // Include push notification configuration
            require_once __DIR__ . '/config/pushConfig.php';
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

            
         
            
        } catch (Exception $e) {
            error_log("Error sending department approval notifications: " . $e->getMessage());
        }
    }

    // Approval Order Management Methods
    public function fetchApprovalOrders() {
        $sql = "SELECT 
                    ao.approval_order_id,
                    ao.users_id,
                    ao.approval_sequence,
                    CONCAT(
                        u.users_fname,
                        CASE 
                            WHEN u.users_mname != '' THEN CONCAT(' ', LEFT(u.users_mname, 1), '.')
                            ELSE ''
                        END,
                        ' ',
                        u.users_lname
                    ) AS user_name,
                    ul.user_level_name,
                    d.departments_name
                FROM tbl_approval_in_order ao
                LEFT JOIN tbl_users u ON ao.users_id = u.users_id
                LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                ORDER BY ao.approval_sequence ASC, ao.approval_order_id DESC";
        return $this->executeQuery($sql);
    }

    public function fetchAdmin() {
        $sql = "SELECT 
                    u.users_id,
                    CONCAT(
                        COALESCE(t.abbreviation, ''),
                        CASE 
                            WHEN t.abbreviation IS NOT NULL AND t.abbreviation != '' THEN ' '
                            ELSE ''
                        END,
                        u.users_fname,
                        CASE 
                            WHEN u.users_mname != '' THEN CONCAT(' ', LEFT(u.users_mname, 1), '.')
                            ELSE ''
                        END,
                        ' ',
                        u.users_lname,
                        CASE 
                            WHEN u.users_suffix != '' THEN CONCAT(' ', u.users_suffix)
                            ELSE ''
                        END
                    ) AS full_name
                FROM tbl_users u
                LEFT JOIN titles t ON u.title_id = t.id
                WHERE u.users_user_level_id = 1
                ORDER BY u.users_fname ASC, u.users_lname ASC";
        return $this->executeQuery($sql);
    }

    public function addApprovalOrder($usersId, $approvalSequence) {
        try {
            // Check if the user and sequence combination already exists
            $checkSql = "SELECT approval_order_id FROM tbl_approval_in_order 
                        WHERE users_id = :users_id AND approval_sequence = :approval_sequence";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->execute([
                ':users_id' => $usersId,
                ':approval_sequence' => $approvalSequence
            ]);
            
            if ($checkStmt->fetch()) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'This user already has an approval order with the same sequence number'
                ]);
            }

            $sql = "INSERT INTO tbl_approval_in_order (users_id, approval_sequence) 
                    VALUES (:users_id, :approval_sequence)";
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute([
                ':users_id' => $usersId,
                ':approval_sequence' => $approvalSequence
            ]);

            if ($result) {
                return json_encode(['status' => 'success', 'message' => 'Approval order added successfully']);
            } else {
                return json_encode(['status' => 'error', 'message' => 'Failed to add approval order']);
            }
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Duplicate entry: This user and sequence combination already exists'
                ]);
            }
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function updateApprovalOrder($approvalOrderId, $usersId, $approvalSequence) {
        try {
            // Check if there are any active reservations in the system using the same logic as fetchRequestReservation
          
            // Check if another record has the same user and sequence combination (excluding current record)
            $checkSql = "SELECT approval_order_id FROM tbl_approval_in_order 
                        WHERE users_id = :users_id AND approval_sequence = :approval_sequence 
                        AND approval_order_id != :approval_order_id";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->execute([
                ':users_id' => $usersId,
                ':approval_sequence' => $approvalSequence,
                ':approval_order_id' => $approvalOrderId
            ]);
            
            if ($checkStmt->fetch()) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'This user already has an approval order with the same sequence number'
                ]);
            }

            $sql = "UPDATE tbl_approval_in_order 
                    SET users_id = :users_id, approval_sequence = :approval_sequence 
                    WHERE approval_order_id = :approval_order_id";
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute([
                ':users_id' => $usersId,
                ':approval_sequence' => $approvalSequence,
                ':approval_order_id' => $approvalOrderId
            ]);

            if ($result) {
                return json_encode(['status' => 'success', 'message' => 'Approval order updated successfully']);
            } else {
                return json_encode(['status' => 'error', 'message' => 'Failed to update approval order']);
            }
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Duplicate entry: This user and sequence combination already exists'
                ]);
            }
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function deleteApprovalOrder($approvalOrderId) {
        try {
           

            $sql = "DELETE FROM tbl_approval_in_order WHERE approval_order_id = :approval_order_id";
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute([':approval_order_id' => $approvalOrderId]);

            if ($result) {
                if ($stmt->rowCount() > 0) {
                    return json_encode(['status' => 'success', 'message' => 'Approval order deleted successfully']);
                } else {
                    return json_encode(['status' => 'error', 'message' => 'Approval order not found']);
                }
            } else {
                return json_encode(['status' => 'error', 'message' => 'Failed to delete approval order']);
            }
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function updateAllApprovalOrders($approvalOrders) {
        try {
            // Check if any approval orders are being used in active reservations
            $getAllOrdersSql = "SELECT approval_order_id FROM tbl_approval_in_order";
            $getAllOrdersStmt = $this->conn->prepare($getAllOrdersSql);
            $getAllOrdersStmt->execute();
            $existingOrderIds = $getAllOrdersStmt->fetchAll(PDO::FETCH_COLUMN);
            
           

            // Start transaction
            $this->conn->beginTransaction();

            // First, delete all existing approval orders
            $deleteSql = "DELETE FROM tbl_approval_in_order";
            $deleteStmt = $this->conn->prepare($deleteSql);
            $deleteStmt->execute();

            // If approvalOrders is empty, just return success (all orders cleared)
            if (empty($approvalOrders)) {
                $this->conn->commit();
                return json_encode(['status' => 'success', 'message' => 'All approval orders cleared successfully']);
            }

            // Insert new approval orders
            $insertSql = "INSERT INTO tbl_approval_in_order (users_id, approval_sequence) VALUES (:users_id, :approval_sequence)";
            $insertStmt = $this->conn->prepare($insertSql);

            $successCount = 0;
            $errors = [];

            foreach ($approvalOrders as $order) {
                if (!isset($order['users_id']) || !isset($order['approval_sequence'])) {
                    $errors[] = "Missing required fields for approval order";
                    continue;
                }

                $result = $insertStmt->execute([
                    ':users_id' => $order['users_id'],
                    ':approval_sequence' => $order['approval_sequence']
                ]);

                if ($result) {
                    $successCount++;
                } else {
                    $errors[] = "Failed to insert approval order for user ID: " . $order['users_id'];
                }
            }

            if (!empty($errors)) {
                $this->conn->rollback();
                return json_encode([
                    'status' => 'error', 
                    'message' => 'Some approval orders failed to update',
                    'errors' => $errors
                ]);
            }

            $this->conn->commit();
            return json_encode([
                'status' => 'success', 
                'message' => $successCount . ' approval orders updated successfully'
            ]);

        } catch (PDOException $e) {
            $this->conn->rollback();
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function deleteAllApprovalOrders() {
        try {
            

            $sql = "DELETE FROM tbl_approval_in_order";
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute();

            if ($result) {
                $deletedCount = $stmt->rowCount();
                return json_encode([
                    'status' => 'success', 
                    'message' => $deletedCount . ' approval orders deleted successfully'
                ]);
            } else {
                return json_encode(['status' => 'error', 'message' => 'Failed to delete approval orders']);
            }
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Check for active reservation requests in the system
     * @return string JSON response with active request count
     */
    public function checkActiveRequests() {
        try {
            $sql = "
                SELECT COUNT(DISTINCT r.reservation_id) as active_count
                FROM tbl_reservation r
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

    /**
     * Check if approval orders are being used in active reservations
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
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $activeCount = isset($result['active_count']) ? (int)$result['active_count'] : 0;
            
            return json_encode([
                'status' => 'success',
                'has_active_requests' => $activeCount > 0,
                'active_count' => $activeCount
            ]);
            
        } catch (PDOException $e) {
            error_log("Error in checkActiveRequests: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * @param array $approvalOrderIds - Array of approval order IDs to check
     * @return array - ['hasActive' => bool, 'resourcesWithTransactions' => array]
     */
    private function checkApprovalOrderUsage($approvalOrderIds) {
    try {
        if (empty($approvalOrderIds) || !is_array($approvalOrderIds)) {
            return ['hasActive' => false, 'resourcesWithTransactions' => []];
        }

        $resourcesWithTransactions = [];
        
        // Check if there are ANY active reservations in the system using the same logic as fetchRequestReservation
        // Block approval order changes if any reservations are currently active
        $sql = "
            SELECT 
                'approval_order' as resource_type,
                'Active Reservations Found' as order_name,
                COUNT(DISTINCT r.reservation_id) as active_count
            FROM tbl_reservation r
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
            WHERE
                (
                    -- Show status 1, 3, 7, 8, 10 (Pending, Approved, Admin Approved, Department Approval, Rescheduled)
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
            HAVING active_count > 0
        ";
        
        $stmt = $this->conn->prepare($sql);
        // No parameters needed since we check all active reservations
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        
        foreach ($results as $row) {
            if (isset($row['order_name']) && !empty($row['order_name'])) {
                $resourcesWithTransactions[] = $row['order_name'];
            }
        }
   
        
        return [
            'hasActive' => count($resourcesWithTransactions) > 0,
            'resourcesWithTransactions' => $resourcesWithTransactions
        ];
    } catch (PDOException $e) {
        error_log("Error checking approval order usage: " . $e->getMessage());
        return ['hasActive' => true, 'resourcesWithTransactions' => []]; // Assume usage to be safe
    }
}

    /**
     * Get all unit IDs for a given equipment ID
     * @param int $equipmentId - The equipment ID
     * @return array - Array of unit IDs
     */
    private function getEquipmentUnits($equipmentId) {
        try {
            $sql = "SELECT unit_id FROM tbl_equipment_unit WHERE unit_equipment_id = :equipment_id AND is_active = 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':equipment_id' => $equipmentId]);
            $results = $stmt->fetchAll(PDO::FETCH_COLUMN);
            return $results;
        } catch (PDOException $e) {
            error_log("Error getting equipment units: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Check if resources have active transactions/reservations
     * @param string $resourceType - 'venue', 'vehicle', 'equipment', or 'approval_order'
     * @param array $resourceIds - Array of resource IDs to check
     * @return array - ['hasActive' => bool, 'resourcesWithTransactions' => array]
     */
    private function checkActiveTransactions($resourceType, $resourceIds) {
        try {
            $resourcesWithTransactions = [];
            $placeholders = implode(',', array_fill(0, count($resourceIds), '?'));
            
            // Inactive status IDs that indicate a reservation is no longer active
            // Status 2: Cancelled
            // Status 5: Declined  
            // Status 4: Completed
            $inactiveStatuses = [2, 5, 4];
            
            // Active reservation status IDs (all statuses except cancelled/declined/completed)
            // Status 1: Pending Admin Approval
            // Status 3: Pending Approval
            // Status 6: Pending Assign
            // Status 7: Admin Approved
            // Status 8: Pending Department Approval
            // Status 10: Rescheduled
            // Status 11: Pending Reschedule
            // Status 14: Reschedule Declined
            //
            // Note: Uses latest_status join to check CURRENT status, not historical statuses
            // This ensures rescheduled reservations (that may have been cancelled before) are properly detected
            $activeStatuses = [1, 3, 6, 7, 8, 10, 11, 14];
            $statusPlaceholders = implode(',', array_fill(0, count($activeStatuses), '?'));
            
            switch ($resourceType) {
                case 'venue':
                    $sql = "
                        SELECT DISTINCT 
                            v.ven_id,
                            v.ven_name,
                            COUNT(DISTINCT r.reservation_id) as active_count
                        FROM tbl_venue v
                        INNER JOIN tbl_reservation_venue rv ON v.ven_id = rv.reservation_venue_venue_id
                        INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                        INNER JOIN (
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
                        WHERE v.ven_id IN ($placeholders)
                          AND latest_status.reservation_status_status_id NOT IN (2, 5, 4)
                        GROUP BY v.ven_id, v.ven_name
                        HAVING active_count > 0
                    ";
                    break;
                    
                case 'vehicle':
                    $sql = "
                        SELECT DISTINCT 
                            vh.vehicle_id,
                            vh.vehicle_license,
                            COUNT(DISTINCT r.reservation_id) as active_count
                        FROM tbl_vehicle vh
                        INNER JOIN tbl_reservation_vehicle rv ON vh.vehicle_id = rv.reservation_vehicle_vehicle_id
                        INNER JOIN tbl_reservation r ON rv.reservation_reservation_id = r.reservation_id
                        INNER JOIN (
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
                        WHERE vh.vehicle_id IN ($placeholders)
                          AND latest_status.reservation_status_status_id NOT IN (2, 5, 4)
                        GROUP BY vh.vehicle_id, vh.vehicle_license
                        HAVING active_count > 0
                    ";
                    break;
                    
                case 'equipment':
                    // Note: Equipment reservations are tracked at equipment level (equip_id), not unit level
                    // Need to get all units for the equipment IDs being checked
                    $sql = "
                        SELECT DISTINCT 
                            eu.unit_id,
                            CONCAT(e.equip_name, ' (Unit #', eu.unit_id, ')') as equipment_name,
                            COUNT(DISTINCT r.reservation_id) as active_count
                        FROM tbl_equipment_unit eu
                        INNER JOIN tbl_equipments e ON eu.equip_id = e.equip_id
                        INNER JOIN tbl_reservation_equipment re ON e.equip_id = re.reservation_equipment_equip_id
                        INNER JOIN tbl_reservation r ON re.reservation_reservation_id = r.reservation_id
                        INNER JOIN (
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
                        WHERE eu.unit_id IN ($placeholders)
                          AND latest_status.reservation_status_status_id NOT IN (2, 5, 4)
                        GROUP BY eu.unit_id, e.equip_name
                        HAVING active_count > 0
                    ";
                    break;
                    
                case 'approval_order':
                    // Check if there are ANY active reservations in the system
                    // Block approval order changes if any reservations are currently active
                    $sql = "
                        SELECT 
                            'approval_order' as resource_type,
                            'Active Reservations Found' as order_name,
                            COUNT(DISTINCT r.reservation_id) as active_count
                        FROM tbl_reservation r
                        INNER JOIN (
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
                        WHERE latest_status.reservation_status_status_id NOT IN (2, 5, 4)
                        HAVING active_count > 0
                    ";
                    break;
                    
                case 'user':
                    // Check if user has any active reservations (excluding statuses 2, 5, 4)
                    // Status 2: Cancelled, Status 5: Declined, Status 4: Completed
                    $sql = "
                        SELECT DISTINCT 
                            u.users_id,
                            CONCAT(u.users_fname, ' ', u.users_lname) as user_name,
                            COUNT(DISTINCT r.reservation_id) as active_count
                        FROM tbl_users u
                        INNER JOIN tbl_reservation r ON u.users_id = r.reservation_user_id
                        INNER JOIN (
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
                        WHERE u.users_id IN ($placeholders)
                          AND latest_status.reservation_status_status_id NOT IN (2, 5, 4)
                        GROUP BY u.users_id, u.users_fname, u.users_lname
                        HAVING active_count > 0
                    ";
                    break;
                    
                default:
                    return ['hasActive' => false, 'resourcesWithTransactions' => []];
            }
            
            // Execute query - using latest_status join for proper status filtering
            $stmt = $this->conn->prepare($sql);
            // For approval_order, we don't need parameters since we check all reservations
            if ($resourceType === 'approval_order') {
                $stmt->execute();
                error_log("Approval Order Check - Checking for ANY active reservations in system");
            } else {
                $stmt->execute($resourceIds);
            }
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Debug logging for approval_order
            if ($resourceType === 'approval_order') {
                error_log("Approval Order Check - Query returned " . count($results) . " result(s)");
                error_log("Approval Order Check - Results: " . print_r($results, true));
            }
            
            foreach ($results as $row) {
                switch ($resourceType) {
                    case 'venue':
                        $resourcesWithTransactions[] = $row['ven_name'];
                        break;
                    case 'vehicle':
                        $resourcesWithTransactions[] = $row['vehicle_license'];
                        break;
                    case 'equipment':
                        $resourcesWithTransactions[] = $row['equipment_name'];
                        break;
                    case 'approval_order':
                        $resourcesWithTransactions[] = $row['order_name'];
                        break;
                    case 'user':
                        $resourcesWithTransactions[] = $row['user_name'];
                        break;
                }
            }
            
            $hasActive = count($resourcesWithTransactions) > 0;
            
            // Debug logging for approval_order
            if ($resourceType === 'approval_order') {
                error_log("Approval Order Check - Final hasActive: " . ($hasActive ? 'true' : 'false'));
                error_log("Approval Order Check - Resources with transactions: " . print_r($resourcesWithTransactions, true));
            }
            
            return [
                'hasActive' => $hasActive,
                'resourcesWithTransactions' => $resourcesWithTransactions
            ];
            
        } catch (PDOException $e) {
            error_log("Error checking active transactions: " . $e->getMessage());
            // On error, be conservative and block the operation
            return [
                'hasActive' => true,
                'resourcesWithTransactions' => ['Error checking transactions - operation blocked for safety']
            ];
        }
    }

    // ======================== School Year & Semester Management ========================
    
    /**
     * Fetch all school years
     */
    public function fetchSchoolYears() {
        try {
            $sql = "SELECT school_year_id, school_year_name, created_at 
                    FROM tbl_school_year 
                    ORDER BY school_year_id DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode(['status' => 'success', 'data' => $result]);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Fetch semesters by school year (or all if no school_year_id provided)
     */
    public function fetchSemesters($schoolYearId = null) {
        try {
            if ($schoolYearId) {
                $sql = "SELECT s.semester_id, s.school_year_id, s.semester_name, s.created_at, s.is_active,
                               sy.school_year_name
                        FROM tbl_semester s
                        LEFT JOIN tbl_school_year sy ON s.school_year_id = sy.school_year_id
                        WHERE s.school_year_id = :school_year_id
                        ORDER BY s.semester_id DESC";
                $stmt = $this->conn->prepare($sql);
                $stmt->bindParam(':school_year_id', $schoolYearId, PDO::PARAM_INT);
            } else {
                $sql = "SELECT s.semester_id, s.school_year_id, s.semester_name, s.created_at, s.is_active,
                               sy.school_year_name
                        FROM tbl_semester s
                        LEFT JOIN tbl_school_year sy ON s.school_year_id = sy.school_year_id
                        ORDER BY s.school_year_id DESC, s.semester_id DESC";
                $stmt = $this->conn->prepare($sql);
            }
            
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode(['status' => 'success', 'data' => $result]);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Get the active semester
     */
    public function getActiveSemester() {
        try {
            $sql = "SELECT s.semester_id, s.school_year_id, s.semester_name, s.created_at, s.is_active,
                           sy.school_year_name
                    FROM tbl_semester s
                    LEFT JOIN tbl_school_year sy ON s.school_year_id = sy.school_year_id
                    WHERE s.is_active = 1
                    LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return json_encode(['status' => 'success', 'data' => $result, 'hasActive' => true]);
            } else {
                return json_encode(['status' => 'success', 'data' => null, 'hasActive' => false]);
            }
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Set active semester (only one can be active at a time)
     */
    public function setActiveSemester($semesterId) {
        try {
            $this->conn->beginTransaction();
            
            // First, deactivate all semesters
            $sqlDeactivate = "UPDATE tbl_semester SET is_active = 0";
            $stmtDeactivate = $this->conn->prepare($sqlDeactivate);
            $stmtDeactivate->execute();
            
            // Then, activate the selected semester
            $sqlActivate = "UPDATE tbl_semester SET is_active = 1 WHERE semester_id = :semester_id";
            $stmtActivate = $this->conn->prepare($sqlActivate);
            $stmtActivate->bindParam(':semester_id', $semesterId, PDO::PARAM_INT);
            $stmtActivate->execute();
            
            if ($stmtActivate->rowCount() === 0) {
                $this->conn->rollBack();
                return json_encode(['status' => 'error', 'message' => 'Semester not found']);
            }
            
            $this->conn->commit();
            
            // Fetch the newly activated semester
            return $this->getActiveSemester();
            
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Add a new school year
     */
    public function addSchoolYear($schoolYearName) {
        try {
            // Check for duplicate
            $sqlCheck = "SELECT COUNT(*) as count FROM tbl_school_year WHERE school_year_name = :school_year_name";
            $stmtCheck = $this->conn->prepare($sqlCheck);
            $stmtCheck->bindParam(':school_year_name', $schoolYearName, PDO::PARAM_STR);
            $stmtCheck->execute();
            $checkResult = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            
            if ($checkResult['count'] > 0) {
                return json_encode(['status' => 'error', 'message' => 'School year already exists']);
            }
            
            $sql = "INSERT INTO tbl_school_year (school_year_name, created_at) 
                    VALUES (:school_year_name, NOW())";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':school_year_name', $schoolYearName, PDO::PARAM_STR);
            $stmt->execute();
            
            return json_encode(['status' => 'success', 'message' => 'School year added successfully']);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Add a new semester
     */
    public function addSemester($schoolYearId, $semesterName) {
        try {
            // Check for duplicate
            $sqlCheck = "SELECT COUNT(*) as count FROM tbl_semester 
                        WHERE school_year_id = :school_year_id AND semester_name = :semester_name";
            $stmtCheck = $this->conn->prepare($sqlCheck);
            $stmtCheck->bindParam(':school_year_id', $schoolYearId, PDO::PARAM_INT);
            $stmtCheck->bindParam(':semester_name', $semesterName, PDO::PARAM_STR);
            $stmtCheck->execute();
            $checkResult = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            
            if ($checkResult['count'] > 0) {
                return json_encode(['status' => 'error', 'message' => 'Semester already exists for this school year']);
            }
            
            $sql = "INSERT INTO tbl_semester (school_year_id, semester_name, created_at, is_active) 
                    VALUES (:school_year_id, :semester_name, NOW(), 0)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':school_year_id', $schoolYearId, PDO::PARAM_INT);
            $stmt->bindParam(':semester_name', $semesterName, PDO::PARAM_STR);
            $stmt->execute();
            
            return json_encode(['status' => 'success', 'message' => 'Semester added successfully']);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    // ======================== Academic Session Management ========================
    
    /**
     * Fetch all academic sessions with school year and semester details
     */
    public function fetchAcademicSessions() {
        try {
            $sql = "SELECT 
                        acs.academic_session_id,
                        acs.school_year_id,
                        acs.semester_id,
                        acs.is_active,
                        acs.created_at,
                        acs.updated_at,
                        sy.school_year_name,
                        s.semester_name
                    FROM tbl_academic_session acs
                    INNER JOIN tbl_school_year sy ON acs.school_year_id = sy.school_year_id
                    INNER JOIN tbl_semester s ON acs.semester_id = s.semester_id
                    ORDER BY acs.academic_session_id DESC";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return json_encode(['status' => 'success', 'data' => $result]);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Get the active academic session
     */
    public function getActiveAcademicSession() {
        try {
            $sql = "SELECT 
                        acs.academic_session_id,
                        acs.school_year_id,
                        acs.semester_id,
                        acs.is_active,
                        acs.created_at,
                        acs.updated_at,
                        sy.school_year_name,
                        s.semester_name
                    FROM tbl_academic_session acs
                    INNER JOIN tbl_school_year sy ON acs.school_year_id = sy.school_year_id
                    INNER JOIN tbl_semester s ON acs.semester_id = s.semester_id
                    WHERE acs.is_active = 1
                    LIMIT 1";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return json_encode(['status' => 'success', 'data' => $result, 'hasActive' => true]);
            } else {
                return json_encode(['status' => 'success', 'data' => null, 'hasActive' => false]);
            }
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Set active academic session (only one can be active at a time)
     */
    public function setActiveAcademicSession($academicSessionId) {
        try {
            $this->conn->beginTransaction();
            
            // First, deactivate all academic sessions
            $sqlDeactivate = "UPDATE tbl_academic_session SET is_active = 0, updated_at = NOW()";
            $stmtDeactivate = $this->conn->prepare($sqlDeactivate);
            $stmtDeactivate->execute();
            
            // Then, activate the selected academic session
            $sqlActivate = "UPDATE tbl_academic_session 
                           SET is_active = 1, updated_at = NOW() 
                           WHERE academic_session_id = :academic_session_id";
            $stmtActivate = $this->conn->prepare($sqlActivate);
            $stmtActivate->bindParam(':academic_session_id', $academicSessionId, PDO::PARAM_INT);
            $stmtActivate->execute();
            
            if ($stmtActivate->rowCount() === 0) {
                $this->conn->rollBack();
                return json_encode(['status' => 'error', 'message' => 'Academic session not found']);
            }
            
            $this->conn->commit();
            
            // Fetch the newly activated academic session
            return $this->getActiveAcademicSession();
            
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Create a new academic session
     */
    public function createAcademicSession($schoolYearId, $semesterId) {
        try {
            // Check for duplicate
            $sqlCheck = "SELECT COUNT(*) as count FROM tbl_academic_session 
                        WHERE school_year_id = :school_year_id AND semester_id = :semester_id";
            $stmtCheck = $this->conn->prepare($sqlCheck);
            $stmtCheck->bindParam(':school_year_id', $schoolYearId, PDO::PARAM_INT);
            $stmtCheck->bindParam(':semester_id', $semesterId, PDO::PARAM_INT);
            $stmtCheck->execute();
            $checkResult = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            
            if ($checkResult['count'] > 0) {
                return json_encode(['status' => 'error', 'message' => 'Academic session already exists for this school year and semester']);
            }
            
            $sql = "INSERT INTO tbl_academic_session (school_year_id, semester_id, is_active, created_at, updated_at) 
                    VALUES (:school_year_id, :semester_id, 0, NOW(), NOW())";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':school_year_id', $schoolYearId, PDO::PARAM_INT);
            $stmt->bindParam(':semester_id', $semesterId, PDO::PARAM_INT);
            $stmt->execute();
            
            return json_encode(['status' => 'success', 'message' => 'Academic session created successfully']);
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

     function getLocationCategory()
    {
        include "connection-pdo.php";
        $sql = "SELECT * FROM tbllocationcategory ORDER BY locCateg_name";
        $stmt = $conn->prepare($sql);
        $returnValue = 0;
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $returnValue = json_encode($rs);
            }
        }
        return $returnValue;
    }

    function getAllLocation()
    {
        include "connection-pdo.php";
        $sql = "SELECT * FROM tbllocation ORDER BY location_id";
        $stmt = $conn->prepare($sql);
        $returnValue = 0;
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $returnValue = json_encode($rs);
            }
        }
        return $returnValue;
    }

    public function getAllTickets() {
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
                    b.joStatus_name as comp_status, 
                    CONCAT_WS(' ', c.users_fname, c.users_mname, c.users_lname) as client_full_name,
                    loc.location_name, 
                    locCateg.locCateg_name,
                    latest_status.history_statusId,
                    latest_status.history_date as status_date,
                    latest_status.history_updatedBy,
                    op.operation_name,
                    CONCAT_WS(' ', closedByUser.users_fname, closedByUser.users_mname, closedByUser.users_lname) as closed_by_full_name,
                    CONCAT_WS(' ', lastUser.users_fname, lastUser.users_mname, lastUser.users_lname) as last_user_full_name,
                    joAgg.priority_name,
                    joAgg.assigned_personnel,
                    joAgg.job_image
                    FROM tblcomplaints as a 
                    LEFT JOIN (
                        SELECT h1.*
                        FROM tblcomplaint_status_history h1
                        INNER JOIN (
                            SELECT history_compId, MAX(history_id) as max_history_id
                            FROM tblcomplaint_status_history
                            GROUP BY history_compId
                        ) h2 ON h1.history_compId = h2.history_compId 
                        AND h1.history_id = h2.max_history_id
                    ) latest_status ON a.comp_id = latest_status.history_compId
                    LEFT JOIN tbljoborderstatus as b ON latest_status.history_statusId = b.joStatus_id 
                    LEFT JOIN tbl_users as c ON a.comp_clientId = c.users_id 
                    LEFT JOIN tbllocation as loc ON a.comp_locationId = loc.location_id
                    LEFT JOIN tbllocationcategory as locCateg ON a.comp_locationCategoryId = locCateg.locCateg_id
                    LEFT JOIN tbloperation as op ON a.comp_operation = op.operation_id
                    LEFT JOIN tbl_users as closedByUser ON a.comp_closedBy = closedByUser.users_id
                    LEFT JOIN tbl_users as lastUser ON a.comp_lastUser = lastUser.users_id
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
                    ORDER BY a.comp_id DESC";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return json_encode(['status' => 'success', 'data' => $rs]);
            } else {
                return json_encode(['status' => 'success', 'data' => []]);
            }
        } catch (PDOException $e) {
            error_log("Error in getAllTickets: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        } catch (Exception $e) {
            error_log("General error in getAllTickets: " . $e->getMessage());
            return json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

}

// Handle the request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $input = $_POST;
    }
    $operation = $input['operation'] ?? '';   
    $user = new User();   
    switch ($operation) {
        case "getAllLocation":
            echo $user->getAllLocation();
            break;

         case "getLocationCategory":
            echo $user->getLocationCategory();
            break;

        case 'fetchInactiveUser':
            echo $user->fetchInactiveUser();
            break;

        case 'fetchInactiveVehicle':
            echo $user->fetchInactiveVehicle();
            break;

        case 'fetchInactiveVenue':
            echo $user->fetchInactiveVenue();
            break;

        case 'fetchEquipmentAndInactiveUnits':
            echo $user->fetchEquipmentAndInactiveUnits();
            break;

        case 'fetchInactiveEquipmentUnits':
            echo $user->fetchInactiveEquipmentUnits();
            break;

        case 'fetchInactiveVehicleMake':
            echo $user->fetchInactiveVehicleMake();
            break;

        case 'fetchInactiveVehicleCategory':
            echo $user->fetchInactiveVehicleCategory();
            break;

        case 'fetchInactiveVehicleModel':
            echo $user->fetchInactiveVehicleModel();
            break;

        case 'fetchInactiveEquipmentCategory':
            echo $user->fetchInactiveEquipmentCategory();
            break;

        case 'fetchInactiveDepartment':
            echo $user->fetchInactiveDepartment();
            break;

        case 'fetchInactiveHoliday':
            echo $user->fetchInactiveHoliday();
            break;

        case 'archiveCatalogItem':
            $itemType = $input['itemType'] ?? ($_POST['itemType'] ?? null);
            $itemId = $input['itemId'] ?? ($_POST['itemId'] ?? null);
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            
            if ($itemType && $itemId) {
                error_log("route archiveCatalogItem - Type: $itemType, ID: " . print_r($itemId, true) . ", User: " . ($userId ?? 'null'));
                echo $user->archiveCatalogItem($itemType, $itemId, $userId);
            } else {
                error_log('Archive catalog item failed - Missing parameters. Input: ' . print_r($input, true));
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters. itemType and itemId are required.']);
            }
            break;

        case 'unarchiveCatalogItem':
            $itemType = $input['itemType'] ?? ($_POST['itemType'] ?? null);
            $itemId = $input['itemId'] ?? ($_POST['itemId'] ?? null);
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            
            if ($itemType && $itemId) {
                error_log("route unarchiveCatalogItem - Type: $itemType, ID: " . print_r($itemId, true) . ", User: " . ($userId ?? 'null'));
                echo $user->unarchiveCatalogItem($itemType, $itemId, $userId);
            } else {
                error_log('Unarchive catalog item failed - Missing parameters. Input: ' . print_r($input, true));
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters. itemType and itemId are required.']);
            }
            break;

        case 'deactivateResource':
            // Deactivate equipment units (serialize=true) or equipment master
            $resourceType = $input['resourceType'] ?? ($_POST['resourceType'] ?? null);
            $resourceId = $input['resourceId'] ?? ($_POST['resourceId'] ?? null);
            $is_serialize = $input['is_serialize'] ?? ($_POST['is_serialize'] ?? false);
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            
            if ($resourceType && $resourceId) {
                error_log("route deactivateResource - Type: $resourceType, ID: " . print_r($resourceId, true) . ", Serialize: " . ($is_serialize ? 'true' : 'false') . ", User: " . ($userId ?? 'null'));
                
                // If it's equipment with serialize flag, deactivate units
                if ($resourceType === 'equipment' && $is_serialize) {
                    echo $user->deactivateEquipmentUnits($resourceId, $userId);
                } else {
                    // Otherwise use regular archive (for equipment master)
                    echo $user->archiveResource($resourceType, $resourceId, $is_serialize, $userId);
                }
            } else {
                error_log('Deactivate resource failed - Missing parameters. Input: ' . print_r($input, true));
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters. resourceType and resourceId are required.']);
            }
            break;

        case 'archiveResource':
            // Get data from JSON input or fall back to $_POST
            $resourceType = $input['resourceType'] ?? ($_POST['resourceType'] ?? null);
            $resourceId = $input['resourceId'] ?? ($_POST['resourceId'] ?? null);
            $is_serialize = $input['is_serialize'] ?? ($_POST['is_serialize'] ?? false);
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            
            if ($resourceType && $resourceId) {
                error_log("route archiveResource - Type: $resourceType, ID: " . print_r($resourceId, true) . ", User: " . ($userId ?? 'null'));
                echo $user->archiveResource($resourceType, $resourceId, $is_serialize, $userId);
            } else {
                error_log('Archive resource failed - Missing parameters. Input: ' . print_r($input, true));
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters. resourceType and resourceId are required.']);
            }
            break;
            
        case 'reactivateResource':
            // Reactivate equipment units (serialize=true) or equipment master
            $resourceType = $input['resourceType'] ?? ($_POST['resourceType'] ?? null);
            $resourceId = $input['resourceId'] ?? ($_POST['resourceId'] ?? null);
            $is_serialize = $input['is_serialize'] ?? ($_POST['is_serialize'] ?? false);
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            
            if ($resourceType && $resourceId) {
                error_log("route reactivateResource - Type: $resourceType, ID: " . print_r($resourceId, true) . ", Serialize: " . ($is_serialize ? 'true' : 'false') . ", User: " . ($userId ?? 'null'));
                
                // If it's equipment with serialize flag, reactivate units
                if ($resourceType === 'equipment' && $is_serialize) {
                    echo $user->reactivateEquipmentUnits($resourceId, $userId);
                } else {
                    // Otherwise use regular unarchive (for equipment master)
                    echo $user->unarchiveResource($resourceType, $resourceId, $is_serialize, $userId);
                }
            } else {
                error_log('Reactivate resource failed - Missing parameters. Input: ' . print_r($input, true));
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters. resourceType and resourceId are required.']);
            }
            break;

        case 'unarchiveResource':
            // Get data from JSON input or fall back to $_POST
            $resourceType = $input['resourceType'] ?? ($_POST['resourceType'] ?? null);
            $resourceId = $input['resourceId'] ?? ($_POST['resourceId'] ?? null);
            $is_serialize = $input['is_serialize'] ?? ($_POST['is_serialize'] ?? false);
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            
            if ($resourceType && $resourceId) {
                error_log("route unarchiveResource - Type: $resourceType, ID: " . print_r($resourceId, true) . ", User: " . ($userId ?? 'null'));
                echo $user->unarchiveResource($resourceType, $resourceId, $is_serialize, $userId);
            } else {
                error_log('Unarchive resource failed - Missing parameters. Input: ' . print_r($input, true));
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters. resourceType and resourceId are required.']);
            }
            break;

        case 'archiveUser':
            // Get data from JSON input or fall back to $_POST
            $userType = $input['userType'] ?? ($_POST['userType'] ?? null);
            $userId = $input['userId'] ?? ($_POST['userId'] ?? null);
            
            if ($userType && $userId) {
                echo $user->archiveUser($userType, $userId);
            } else {
                error_log('Archive user failed - Missing parameters. Input: ' . print_r($input, true));
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters. userType and userId are required.']);
            }
            break;
        case 'unarchiveUser':
            // Get data from JSON input or fall back to $_POST
            $userType = $input['userType'] ?? ($_POST['userType'] ?? null);
            $userId = $input['userId'] ?? ($_POST['userId'] ?? null);
            
            if ($userType && $userId) {
                echo $user->unArchive($userType, $userId);
            } else {
                error_log('Unarchive user failed - Missing parameters. Input: ' . print_r($input, true));
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters. userType and userId are required.']);
            }
            break;

        case 'updateEquipmentUnit':
            $data = $input['json'] ?? ($input['unitData'] ?? ($input['data'] ?? $input ?? null));
            $result = $user->updateEquipmentUnit($data);
            echo $result;
            break;

        case "handleRequest":
                $reservationId = $input['reservation_id'] ?? null;
                $isAccepted = $input['is_accepted'] ?? false;
                $userId = $input['user_id'] ?? null;
                $notificationMessage = $input['notification_message'] ?? '';
                $notificationUserId = $input['notification_user_id'] ?? null;
                $declineReason = $input['decline_reason'] ?? null;
                if ($reservationId === null) {
                    echo json_encode(['status' => 'error', 'message' => 'Reservation ID is required']);
                    break;
                }
                if ($userId === null) {
                    echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                    break;
                }
                echo $user->handleRequest($reservationId, $isAccepted, $userId, $notificationMessage, $notificationUserId, $declineReason);
                break;
        case "fetchEquipmentCategoryById": // Fetch equipment category by ID
            $equipmentId = $input['id'] ?? ($_POST['id'] ?? null);
            if ($equipmentId) {
                echo $user->fetchEquipmentCategoryById($equipmentId); 
            } else {
                echo json_encode(['status' => 'error', 'message' => 'ID parameter is missing.']);
            }
            break;

        case "fetchVehicleById":
            $vehicleId = $input['id'] ?? ($_POST['id'] ?? null);
            if ($vehicleId) {
                echo $user->fetchVehicleById($vehicleId); // Fetch vehicle by ID
            } else {
                echo json_encode(['status' => 'error', 'message' => 'ID parameter is missing.']);
            }
            break;

        case "getConsumableUsage":
            $equipId = $input['equipId'] ?? null;
            if ($equipId) {
                echo $user->getConsumableUsage($equipId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Equipment ID is required']);
            }
            break;


        case "fetchModelById":
            $vehicleModelId = $input['id'] ?? ($_POST['id'] ?? null);
            if ($vehicleModelId) {
                echo $user->fetchModelById($vehicleModelId); // Fetch vehicle model by ID
            } else {
                echo json_encode(['status' => 'error', 'message' => 'ID parameter is missing.']);
            }
            break;

        case 'fetchConditions':
            echo $user->fetchConditions();
            break;

        case "get_message":
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            if ($userId) {
                echo $user->get_message($userId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'userid parameter is missing']);
            }
            break;

        case "mark_messages_read":
            $userId = $input['user_id'] ?? ($_POST['user_id'] ?? null);
            $otherUserId = $input['other_user_id'] ?? ($_POST['other_user_id'] ?? null);
            if ($userId && $otherUserId) {
                echo $user->markMessagesAsRead($userId, $otherUserId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'user_id and other_user_id parameters are required']);
            }
            break;

        case "get_unread_count":
            $userId = $input['user_id'] ?? ($_POST['user_id'] ?? null);
            if ($userId) {
                echo $user->getUnreadCount($userId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'user_id parameter is missing']);
            }
            break;

        case "fetchVenueById":
            $venueId = $input['id'] ?? ($_POST['id'] ?? null);
            if ($venueId) {
                echo $user->fetchVenueById($venueId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'ID parameter is missing.']);
            }
            break;

        case "updateDepartment":
            $id = $input['id'] ?? '';
            $name = $input['name'] ?? '';
            $type = $input['type'] ?? '';
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            echo $user->updateDepartment($id, $name, $type, $userId);
            break;

        case "updateVehicleMake":
            $id = $input['id'] ?? null;
            $name = $input['name'] ?? null;
            if (!$id || !$name) {
                echo json_encode(['status' => 'error', 'message' => 'Missing id or name']);
                break;
            }
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            echo $user->updateVehicleMake($id, $name, $userId);
            break;

        case "fetchMake":
            echo $user->fetchMake();
            break;
        case "fetchDriverRestrictionCodes":
            echo $user->fetchDriverRestrictionCodes();
            break;
        case "fetchDriverRestrictions":
            $userId = $input['user_id'] ?? null;
            if ($userId === null) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            echo $user->fetchDriverRestrictions($userId);
            break;
        case "saveDriverRestrictions":
            $userId = $input['user_id'] ?? null;
            $restrictionIds = $input['restriction_ids'] ?? [];
            $updatedBy = $input['updated_by'] ?? null;
            
            if ($userId === null) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            if ($updatedBy === null) {
                echo json_encode(['status' => 'error', 'message' => 'Updated by user ID is required']);
                break;
            }
            
            echo $user->saveDriverRestrictions($userId, $restrictionIds, $updatedBy);
            break;
        case "fetchRecord":
            echo $user->fetchRecord();
            break;
        case "fetchAudit":
            echo $user->fetchAudit();
            break;
        case "fetchStatusAvailability":
            echo $user->fetchStatusAvailability();
            break;

        case "fetchEquipments":
            $startDateTime = $input['startDateTime'] ?? null;
            $endDateTime = $input['endDateTime'] ?? null;
            $user->fetchEquipments($startDateTime, $endDateTime);
            break;

       
        case "fetchDeansApproval":
            $reservationId = $input['reservation_id'] ?? null;
            if ($reservationId === null) {
                echo json_encode(['status' => 'error', 'message' => 'Reservation ID is required']);
                break;
            }
            echo $user->fetchDeansApproval($reservationId);
            break;

        case "fetchReadApprovalNotification":
            echo $user->fetchReadApprovalNotification();
            break;
        case "insertDriver":
            $reservation_driver_user_id = $input['reservation_driver_user_id'] ?? null;
            $reservation_vehicle_id = $input['reservation_vehicle_id'] ?? null;
            $driver_name = $input['driver_name'] ?? null;
            $reservation_driver_id = $input['reservation_driver_id'] ?? null;
            
         
            
            echo $user->insertDriver($reservation_driver_user_id, $reservation_vehicle_id, $driver_name, $reservation_driver_id);
            break;

        case "saveHoliday":
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            
            echo $user->saveHoliday($input, $userId);
            break;
         
        case "saveVenue":
            echo $user->saveVenue($input);
            break;

        case "updateVenue":
            echo $user->updateVenue($input);
            break;

        case "saveVehicle":
            echo $user->saveVehicle($input);
            break;
        case "updateVehicleLicense":
            echo $user->updateVehicleLicense($input);
            break;

        case "saveEquipment":
            echo $user->saveEquipment($input);
            break;

        case "updateEquipment":
            echo $user->updateEquipment($input);
            break;
        case "saveUnit":
            echo $user->saveUnit($input);
            break;
        case "updateUnit":
            echo $user->updateUnit($input);
            break;
        case "saveStock":
            echo $user->saveStock($input);
            break;
        case "saveUser":
            echo $user->saveUser($input);
            break;
        case "updateUser":
            echo $user->updateUser($input);
            break;

        case "fetchVenueScheduled":
            echo $user->fetchVenueScheduled();
            break;

        case "fetchTitle":
            echo $user->fetchTitle();
            break;

        case "fetchHoliday":
            echo $user->fetchHoliday();
            break;        
        case "updateHoliday":
            $holidayId = $input['holiday_id'] ?? null;
            $holidayName = $input['holiday_name'] ?? null;
            $holidayDate = $input['holiday_date'] ?? null;
            
            if (!$holidayId || !$holidayName || !$holidayDate) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
                break;
            }
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
          
            echo $user->updateHoliday($holidayId, $holidayName, $holidayDate, $userId);
            break;
        
        case "fetchDepartments":
            echo $user->fetchDepartments();
            break;
        case "fetchVehicles":
            echo $user->fetchVehicles();
            break;
        case "fetchPositions":
            echo $user->fetchPositions();
            break;
        case "fetchUserLevels":
            echo $user->fetchUserLevels();
            break;
        case "fetchMake":
            echo $user->fetchMake();
            break;
        case "fetchCategoriesAndModels":
            $makeId = $_POST['make_id'] ?? null;
            echo $user->fetchCategoriesAndModels($makeId);
            break;
        case "fetchAllUser":
            echo $user->fetchAllUserTypes();
            break;
        case "fetchUserProfile":
            $userId = $_POST['userId'] ?? null; 
            echo $user->fetchUserProfile($userId);
            break;
        case "fetchVenue": 
            echo $user->fetchVenue();
            break;
        case "fetchVenueBuildings": 
            echo $user->fetchVenueBuildings();
            break;
        case "fetchInactiveBuilding":
            echo $user->fetchInactiveBuilding();
            break;
        case "fetchBuildingById":
            $id = $_POST['id'] ?? null;
            if ($id) {
                echo $user->fetchBuildingById($id);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Building ID is required']);
            }
            break;
        case "saveBuilding":
            echo $user->saveBuilding($input);
            break;
        case "updateBuilding":
            echo $user->updateBuilding($input);
            break;
        case "buildingExists":
            $buildingName = $input['building_name'] ?? '';
            $exists = $user->buildingExists($buildingName);
            echo json_encode(['status' => 'success', 'exists' => $exists]);
            break;
        case "archiveBuilding":
            $buildingIds = $input['building_ids'] ?? null;
            $userId = $input['user_id'] ?? null;
            if ($buildingIds && $userId) {
                echo $user->archiveBuilding($buildingIds, $userId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Building IDs and User ID are required']);
            }
            break;
        case "fetchCategories": 
            echo $user->fetchCategories();
            break;
        case "fetchEquipment": 
            echo $user->fetchEquipment();
            break;
        case "fetchEquipmentsWithStatus":
            echo $user->fetchEquipmentsWithStatus();
            break;
        case "fetchEquipmentsByCategory":
            $categoryId = $_POST['category_id'] ?? null; 
            echo $user->fetchEquipmentsByCategory($categoryId);
            break;
        case "fetchAllVehicles":
            echo $user->fetchALlVehicles();
            break;
        case "fetchPersonnel":
            echo $user->fetchPersonnel();
            break;

        case "fetchUserByEmail":
            $email = $input['email'] ?? $_POST['email'] ?? null;
            if ($email) {
                echo $user->fetchUserByEmail($email);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Email is required']);
            }
            break;
        case "fetchUserByEmailOrFullname":
            $searchTerm = $input['searchTerm'] ?? $_POST['searchTerm'] ?? null;
            if ($searchTerm) {
                echo $user->fetchUserByEmailOrFullname($searchTerm);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Search term is required']);
            }
            break;
        case "checkUniqueEmailAndSchoolId":
            $email = $input['email'] ?? '';
            $schoolId = $input['schoolId'] ?? '';
            $excludeId = $input['excludeId'] ?? null;
            $excludeType = $input['excludeType'] ?? null;
            echo $user->checkUniqueEmailAndSchoolId($email, $schoolId, $excludeId, $excludeType);
            break;


        case "fetchDriver":
            $startDateTime = $input['startDateTime'] ?? null;
            $endDateTime = $input['endDateTime'] ?? null;   
            $userId = $input['userId'] ?? null;
            $reservationId = $input['reservationId'] ?? null;
            $restrictionIds = $input['restrictionIds'] ?? null;
            echo $user->fetchDriver($startDateTime, $endDateTime, $userId, $reservationId, $restrictionIds);
            break;
        
        case "fetchAllReservations":
            echo $user->fetchAllReservations();
            break;
        case "getInUse":
            echo $user->getInUse();
            break;
        case "updatePassword":
            $userId = $input['userId'] ?? null;
            $oldPassword = $input['oldPassword'] ?? null;
            $newPassword = $input['newPassword'] ?? null;
            
            if (!$userId || !$oldPassword || !$newPassword) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
                break;
            }     
            echo $user->updatePassword($userId, $oldPassword, $newPassword);
            break;
        case "updateProfile":
            echo $user->updateProfile($input);
            break;
        case "getUnitById":
            $unitId = $input['unitId'] ?? null;
            if ($unitId) {
                echo $user->getUnitById($unitId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Unit ID is required']);
            }
            break;

        case "countReservationTrends":
            echo $user->countReservationTrends();
            break;
        case "countTrendReservations":
            $year = $input['year'] ?? null;
            echo $user->countTrendReservations($year);
            break;
        case "countCompletedAndCancelledReservations":
            echo $user->countCompletedAndCancelledReservations();
            break;
        case "insertNotificationTouser":
            $notification_message = $input['notification_message'] ?? null;
            $notification_user_id = $input['notification_user_id'] ?? null;
            $reservation_id = $input['reservation_id'] ?? null;
            if (!$notification_message || !$notification_user_id) {
                echo json_encode(['status' => 'error', 'message' => 'Missing notification message or user ID']);
                break;
            }
            echo $user->insertNotificationTouser($notification_message, $notification_user_id, $reservation_id);
            break;
        
        case "saveModelData":
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            echo $user->saveModelData($input, $userId);
            break;
        case "saveMakeData":
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            echo $user->saveMakeData($input, $userId);
            break;
        case "saveEquipmentCategory":
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            echo $user->saveEquipmentCategory($input, $userId);
            break;
        case "saveDepartmentData":
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            echo $user->saveDepartmentData($input, $userId);
            break;
        case "saveCategoryData":
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            echo $user->saveCategoryData($input, $userId);
            break;

        case "fetchVehicleCategories":
            echo $user->fetchVehicleCategories();
            break;

        case "updateVehicleMake":
            $id = $input['id'] ?? null;
            $name = $input['name'] ?? null;
            if (!$id || !$name) {
                echo json_encode(['status' => 'error', 'message' => 'Missing id or name']);
                break;
            }
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            echo $user->updateVehicleMake($id, $name, $userId);
            break;

        case "updateVehicleCategory":
            $id = $input['id'] ?? null;
            $name = $input['name'] ?? null;
            if (!$id || !$name) {
                echo json_encode(['status' => 'error', 'message' => 'Missing id or name']);
                break;
            }
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            echo $user->updateVehicleCategory($id, $name, $userId);
            break;

        case "updateVehicleModel":
            if (isset($input['modelData'])) {
                $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
                echo $user->updateVehicleModel($input['modelData'], $userId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Missing modelData']);
            }
            break;

        case "fetchModels":
            echo $user->fetchModels();
            break;

        case "fetchEquipmentsCategory":
            echo $user->fetchEquipmentsCategory();
            break;
        case "updateEquipmentCategory":
            $categoryData = $input['categoryData'] ?? null;
            if (!$categoryData) {
                echo json_encode(['status' => 'error', 'message' => 'Missing categoryData']);
                break;
            }
            $userId = $input['userid'] ?? ($_POST['userid'] ?? null);
            echo $user->updateEquipmentCategory($categoryData, $userId);
            break;
        
        case "fetchModelsByCategoryAndMake":
            $categoryId = $input['categoryId'] ?? null;
            $makeId = $input['makeId'] ?? null;
            if ($categoryId && $makeId) {
                echo $user->fetchModelsByCategoryAndMake($categoryId, $makeId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Category ID and Make ID are required']);
            }
            break;
        
        case "fetchUsersById":
            $id = $input['id'] ?? null;
            if (!$id) {
                echo json_encode(['status' => 'error', 'message' => 'Missing id']);
                break;
            }
            echo $user->fetchUsersById($id);
            break;
        
        case "fetchEquipmentById":
            $equipmentId = $input['id'] ?? ($_POST['id'] ?? null);
            if ($equipmentId) {
                echo $user->fetchEquipmentById($equipmentId);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'ID parameter is missing.']);
            }
            break;       
        case "getTotals":
            echo $user->getTotals();
            break;
        case "fetchVenues":
            echo $user->fetchVenues();
            break;
        case "fetchLocationCategory":
            echo $user->fetchLocationCategory();
            break;

        case "fetchLocation":
            echo $user->fetchLocation();
            break;

        case "updateLocation":
            $data = $input ?? [];
            // Validate minimal fields
            if (!isset($data['location_id']) || !isset($data['location_name'])) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters: location_id and location_name']);
                break;
            }
            echo $user->updateLocation($data);
            break;

        case "createLocation":
            $data = $input ?? [];
            echo $user->createLocation($data);
            break;
        case "fetchVehicles":
            echo $user->fetchVehicles();
            break;

        // Approval Order Management Operations
        case "fetchApprovalOrders":
            echo $user->fetchApprovalOrders();
            break;

        case "fetchAdmin":
            echo $user->fetchAdmin();
            break;

        case "addApprovalOrder":
            $usersId = $input['users_id'] ?? null;
            $approvalSequence = $input['approval_sequence'] ?? null;
            
            if (!$usersId || !$approvalSequence) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters: users_id and approval_sequence']);
                break;
            }
            
            echo $user->addApprovalOrder($usersId, $approvalSequence);
            break;

        case "updateApprovalOrder":
            $approvalOrderId = $input['approval_order_id'] ?? null;
            $usersId = $input['users_id'] ?? null;
            $approvalSequence = $input['approval_sequence'] ?? null;
            
            if (!$approvalOrderId || !$usersId || !$approvalSequence) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters: approval_order_id, users_id, and approval_sequence']);
                break;
            }
            
            echo $user->updateApprovalOrder($approvalOrderId, $usersId, $approvalSequence);
            break;

        case "deleteApprovalOrder":
            $approvalOrderId = $input['approval_order_id'] ?? null;
            
            if (!$approvalOrderId) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameter: approval_order_id']);
                break;
            }
            
            echo $user->deleteApprovalOrder($approvalOrderId);
            break;

        case "updateAllApprovalOrders":
            $approvalOrders = $input['approval_orders'] ?? [];
            
            // Validate that approval_orders is an array
            if (!is_array($approvalOrders)) {
                echo json_encode(['status' => 'error', 'message' => 'approval_orders must be an array']);
                break;
            }
            
            echo $user->updateAllApprovalOrders($approvalOrders);
            break;

        case "deleteAllApprovalOrders":
            echo $user->deleteAllApprovalOrders();
            break;

        case "checkActiveRequests":
            echo $user->checkActiveRequests();
            break;

        // School Year & Semester Management Operations
        case "fetchSchoolYears":
            echo $user->fetchSchoolYears();
            break;

        case "fetchSemesters":
            $schoolYearId = $input['school_year_id'] ?? null;
            echo $user->fetchSemesters($schoolYearId);
            break;

        case "getActiveSemester":
            echo $user->getActiveSemester();
            break;

        case "setActiveSemester":
            $semesterId = $input['semester_id'] ?? null;
            
            if (!$semesterId) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameter: semester_id']);
                break;
            }
            
            echo $user->setActiveSemester($semesterId);
            break;

        case "addSchoolYear":
            $schoolYearName = $input['school_year_name'] ?? null;
            
            if (!$schoolYearName || trim($schoolYearName) === '') {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameter: school_year_name']);
                break;
            }
            
            echo $user->addSchoolYear(trim($schoolYearName));
            break;

        case "addSemester":
            $schoolYearId = $input['school_year_id'] ?? null;
            $semesterName = $input['semester_name'] ?? null;
            
            if (!$schoolYearId || !$semesterName || trim($semesterName) === '') {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters: school_year_id and semester_name']);
                break;
            }
            
            echo $user->addSemester($schoolYearId, trim($semesterName));
            break;

        // Academic Session Management Operations
        case "fetchAcademicSessions":
            echo $user->fetchAcademicSessions();
            break;

        case "getActiveAcademicSession":
            echo $user->getActiveAcademicSession();
            break;

        case "setActiveAcademicSession":
            $academicSessionId = $input['academic_session_id'] ?? null;
            
            if (!$academicSessionId) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameter: academic_session_id']);
                break;
            }
            
            echo $user->setActiveAcademicSession($academicSessionId);
            break;

        case "createAcademicSession":
            $schoolYearId = $input['school_year_id'] ?? null;
            $semesterId = $input['semester_id'] ?? null;
            
            if (!$schoolYearId || !$semesterId) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameters: school_year_id and semester_id']);
                break;
            }
            
            echo $user->createAcademicSession($schoolYearId, $semesterId);
            break;

        // Driver Restriction Management Operations
        case "fetchDriverRestrictionCodes":
            echo $user->fetchDriverRestrictionCodes();
            break;

        case "fetchDriverRestrictions":
            $userId = $input['user_id'] ?? null;
            
            if (!$userId) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameter: user_id']);
                break;
            }
            
            echo $user->fetchDriverRestrictions($userId);
            break;

        case "saveDriverRestrictions":
            $userId = $input['user_id'] ?? null;
            $restrictionIds = $input['restriction_ids'] ?? [];
            $updatedBy = $input['updated_by'] ?? null;
            
            if (!$userId) {
                echo json_encode(['status' => 'error', 'message' => 'Missing required parameter: user_id']);
                break;
            }
            
            if (!is_array($restrictionIds)) {
                echo json_encode(['status' => 'error', 'message' => 'restriction_ids must be an array']);
                break;
            }
            
            echo $user->saveDriverRestrictions($userId, $restrictionIds, $updatedBy);
            break;

        case "getAllTickets":
            echo $user->getAllTickets();
            break;
       
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid operation']);
            break;
    }
}
?>
