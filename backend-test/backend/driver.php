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

    public function fetchActiveTrips($driverId) {
        try {
            // Get latest status for each reservation like fetchAvailability
            $stmt = $this->conn->prepare("
                SELECT
                    r.reservation_id,
                    r.reservation_title,
                    r.reservation_description,
                    r.reservation_start_date,
                    r.reservation_end_date,
                    r.reschedule_start_date,
                    r.reschedule_end_date,
                    r.reservation_participants,
                    r.reservation_user_id,
                    r.reservation_created_at,
                    rd.reservation_driver_id,
                    rd.driver_name,
                    rv.reservation_vehicle_id,
                    v.vehicle_id,
                    v.vehicle_license,
                    v.year,
                    v.status_availability_id,
                    v.vehicle_pic,
                    v.is_active AS vehicle_active,
                    vm.vehicle_model_name,
                    vmake.vehicle_make_name,
                    vcat.vehicle_category_name,
                    latest_status.reservation_status_status_id,
                    latest_status.reservation_active
                FROM tbl_reservation_driver rd
                JOIN tbl_reservation_vehicle rv
                    ON rv.reservation_vehicle_id = rd.reservation_vehicle_id
                JOIN tbl_reservation r
                    ON r.reservation_id = rv.reservation_reservation_id
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
                JOIN tbl_vehicle v
                    ON v.vehicle_id = rv.reservation_vehicle_vehicle_id
                JOIN tbl_vehicle_model vm
                    ON vm.vehicle_model_id = v.vehicle_model_id
                JOIN tbl_vehicle_make vmake
                    ON vmake.vehicle_make_id = vm.vehicle_model_vehicle_make_id
                JOIN tbl_vehicle_category vcat
                    ON vcat.vehicle_category_id = vm.vehicle_category_id
                WHERE rd.reservation_driver_user_id = :driverId
                  AND r.reservation_id NOT IN (
                      SELECT DISTINCT reservation_reservation_id 
                      FROM tbl_reservation_status 
                      WHERE reservation_status_status_id IN (2, 5, 4)
                  )
                ORDER BY r.reservation_start_date ASC
            ");

            $stmt->bindParam(':driverId', $driverId);
            $stmt->execute();
            $trips = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'status' => 'success',
                'data' => $trips
            ], JSON_UNESCAPED_UNICODE);

        } catch (PDOException $e) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function fetchInactiveTrips($driverId) {
        try {
            // Get latest status for each reservation like fetchAvailability
            $stmt = $this->conn->prepare("
                SELECT
                    r.reservation_id,
                    r.reservation_title,
                    r.reservation_description,
                    r.reservation_start_date,
                    r.reservation_end_date,
                    r.reschedule_start_date,
                    r.reschedule_end_date,
                    r.reservation_participants,
                    r.reservation_user_id,
                    r.reservation_created_at,
                    rd.reservation_driver_id,
                    rd.driver_name,
                    rv.reservation_vehicle_id,
                    v.vehicle_id,
                    v.vehicle_license,
                    v.year,
                    v.status_availability_id,
                    v.vehicle_pic,
                    v.is_active AS vehicle_active,
                    vm.vehicle_model_name,
                    vmake.vehicle_make_name,
                    vcat.vehicle_category_name,
                    latest_status.reservation_status_status_id,
                    latest_status.reservation_active
                FROM tbl_reservation_driver rd
                JOIN tbl_reservation_vehicle rv
                    ON rv.reservation_vehicle_id = rd.reservation_vehicle_id
                JOIN tbl_reservation r
                    ON r.reservation_id = rv.reservation_reservation_id
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
                JOIN tbl_vehicle v
                    ON v.vehicle_id = rv.reservation_vehicle_vehicle_id
                JOIN tbl_vehicle_model vm
                    ON vm.vehicle_model_id = v.vehicle_model_id
                JOIN tbl_vehicle_make vmake
                    ON vmake.vehicle_make_id = vm.vehicle_model_vehicle_make_id
                JOIN tbl_vehicle_category vcat
                    ON vcat.vehicle_category_id = vm.vehicle_category_id
                WHERE rd.reservation_driver_user_id = :driverId
                  AND r.reservation_id IN (
                      SELECT DISTINCT reservation_reservation_id 
                      FROM tbl_reservation_status 
                      WHERE reservation_status_status_id IN (2, 5, 4)
                  )
                ORDER BY r.reservation_start_date DESC
            ");

            $stmt->bindParam(':driverId', $driverId);
            $stmt->execute();
            $trips = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'status' => 'success',
                'data' => $trips
            ], JSON_UNESCAPED_UNICODE);

        } catch (PDOException $e) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }
}

// Handle incoming requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $vehicle = new Vehicle();
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['operation'])) {
        switch ($data['operation']) {
            case 'fetchActiveTrips':
                if (isset($data['driver_id'])) {
                    $vehicle->fetchActiveTrips($data['driver_id']);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Missing driver_id parameter.']);
                }
                break;

            case 'fetchInactiveTrips':
                if (isset($data['driver_id'])) {
                    $vehicle->fetchInactiveTrips($data['driver_id']);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Missing driver_id parameter.']);
                }
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