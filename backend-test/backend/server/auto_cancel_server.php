<?php
// Set timezone
date_default_timezone_set('Asia/Manila');

// Include database connection
require_once '../connection-pdo.php';

// Send push notification to user function
function sendPushNotificationToUser($userId, $title = 'Notification', $body = 'You have a new notification', $data = []) {
    try {
        // Include push notification configuration
        require_once __DIR__ . '/../config/pushConfig.php';
        
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
            error_log("[AutoCancel.Server] Push notification failed for user $userId: " . ($error ?: "HTTP $httpCode"));
            return false;
        }
        
        $response = json_decode($result, true);
        if ($response && isset($response['status']) && $response['status'] === 'success') {
            return true;
        }
        error_log("[AutoCancel.Server] Push notification failed for user $userId: " . ($response['message'] ?? 'Unknown error'));
        return false;
    } catch (Throwable $e) {
        error_log("[AutoCancel.Server] Exception sending push: " . $e->getMessage());
        return false;
    }
}

// Auto-cancel function
function autoCancelExpiredReschedules($conn) {
    try {
        $currentDateTime = date('Y-m-d H:i:s');
        
        $conn->beginTransaction();
        
        // Find reservations with status 10 (reschedule) with active=0 where original start time has passed
        // AND make sure they haven't been cancelled already (no active status 5)
        $sql = "SELECT DISTINCT r.reservation_id, r.reservation_title, r.reservation_start_date, 
                       r.reschedule_start_date, r.reschedule_end_date, r.reservation_user_id,
                       CONCAT(u.users_fname, ' ', COALESCE(u.users_mname, ''), ' ', u.users_lname) AS full_name, 
                       u.users_email
                FROM tbl_reservation r
                INNER JOIN tbl_reservation_status rs ON rs.reservation_reservation_id = r.reservation_id
                INNER JOIN tbl_users u ON u.users_id = r.reservation_user_id
                LEFT JOIN tbl_reservation_status cancelled_status ON cancelled_status.reservation_reservation_id = r.reservation_id 
                    AND cancelled_status.reservation_status_status_id = 5 
                    AND cancelled_status.reservation_active = 1
                WHERE rs.reservation_status_status_id = 10 
                AND rs.reservation_active = 0
                AND r.reservation_start_date <= :current_datetime
                AND r.reservation_start_date IS NOT NULL
                AND cancelled_status.reservation_status_id IS NULL";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':current_datetime', $currentDateTime, PDO::PARAM_STR);
        $stmt->execute();
        $expiredReservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $cancelledCount = 0;
        $cancelledReservations = [];
        
        foreach ($expiredReservations as $reservation) {
            // Insert cancelled status (status_id = 5)
            $insertCancelSql = "INSERT INTO tbl_reservation_status 
                               (reservation_status_status_id, reservation_reservation_id, reservation_active, 
                                reservation_updated_at, reservation_users_id) 
                               VALUES (5, :reservation_id, 1, NOW(), :user_id)";
            $insertStmt = $conn->prepare($insertCancelSql);
            $insertStmt->bindParam(':reservation_id', $reservation['reservation_id'], PDO::PARAM_INT);
            $insertStmt->bindParam(':user_id', $reservation['reservation_user_id'], PDO::PARAM_INT);
            
            if ($insertStmt->execute()) {
                // Deactivate ALL pending reschedule statuses (status 10) for this reservation
                $deactivateSql = "UPDATE tbl_reservation_status 
                                 SET reservation_active = -1 
                                 WHERE reservation_reservation_id = :reservation_id 
                                 AND reservation_status_status_id = 10 
                                 AND reservation_active = 0";
                $deactivateStmt = $conn->prepare($deactivateSql);
                $deactivateStmt->bindParam(':reservation_id', $reservation['reservation_id'], PDO::PARAM_INT);
                $deactivateResult = $deactivateStmt->execute();
                $deactivatedRows = $deactivateStmt->rowCount();
                
                // Insert notification to user about the cancellation
                $notificationMessage = "Your reservation '{$reservation['reservation_title']}' has been automatically cancelled because you did not accept the proposed reschedule by the GSD";
                $insertNotificationSql = "INSERT INTO tbl_notification_reservation 
                                        (notification_message, notification_reservation_reservation_id, notification_user_id, notification_created_at, is_read) 
                                        VALUES (:message, :reservation_id, :user_id, NOW(), 0)";
                $notificationStmt = $conn->prepare($insertNotificationSql);
                $notificationStmt->bindParam(':message', $notificationMessage, PDO::PARAM_STR);
                $notificationStmt->bindParam(':reservation_id', $reservation['reservation_id'], PDO::PARAM_INT);
                $notificationStmt->bindParam(':user_id', $reservation['reservation_user_id'], PDO::PARAM_INT);
                $notificationStmt->execute();
                
                // Send push notification to user
                sendPushNotificationToUser(
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
                echo "[" . date('Y-m-d H:i:s') . "] Auto-cancelled reservation ID: {$reservation['reservation_id']} - Title: {$reservation['reservation_title']} - User: {$reservation['full_name']}\n";
            }
        }
        
        $conn->commit();
        
        if ($cancelledCount > 0) {
            echo "[" . date('Y-m-d H:i:s') . "] SUCCESS: Auto-cancelled {$cancelledCount} expired reschedule reservations\n";
        }
        
        return [
            'status' => 'success',
            'message' => "Auto-cancelled {$cancelledCount} expired reschedule reservations",
            'cancelled_count' => $cancelledCount,
            'cancelled_reservations' => $cancelledReservations,
            'check_time' => $currentDateTime
        ];
        
    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        error_log('Database error in autoCancelExpiredReschedules: ' . $e->getMessage());
        echo "[" . date('Y-m-d H:i:s') . "] ERROR: Database error - " . $e->getMessage() . "\n";
        return ['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()];
    }
}

// Main server loop
echo "=== Auto Cancel Server Started ===\n";
echo "Server started at: " . date('Y-m-d H:i:s') . "\n";
echo "Checking for expired reschedules every 60 seconds...\n";
echo "Press Ctrl+C to stop the server\n";
echo "=====================================\n\n";

$checkInterval = 60; // Check every 60 seconds
$lastCheck = 0;

while (true) {
    try {
        $currentTime = time();
        
        // Check if it's time to run the auto-cancel check
        if ($currentTime - $lastCheck >= $checkInterval) {
            echo "[" . date('Y-m-d H:i:s') . "] Running auto-cancel check...\n";
            
            $result = autoCancelExpiredReschedules($conn);
            
            if ($result['status'] === 'success' && $result['cancelled_count'] == 0) {
                echo "[" . date('Y-m-d H:i:s') . "] No expired reschedules found\n";
            }
            
            $lastCheck = $currentTime;
            echo "[" . date('Y-m-d H:i:s') . "] Next check in {$checkInterval} seconds\n\n";
        }
        
        // Sleep for 1 second to prevent high CPU usage
        sleep(1);
        
    } catch (Exception $e) {
        echo "[" . date('Y-m-d H:i:s') . "] ERROR: " . $e->getMessage() . "\n";
        sleep(5); // Wait 5 seconds before retrying
    }
}
?>
