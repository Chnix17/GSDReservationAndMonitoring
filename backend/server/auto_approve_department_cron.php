<?php

// Set error reporting for CLI execution
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load configuration
require_once __DIR__ . '/../config/auto_approve_config.php';

// Get configuration
try {
    $config = getAutoApproveConfig();
} catch (Exception $e) {
    echo "Configuration error: " . $e->getMessage() . "\n";
    exit(1);
}

// Set timezone from configuration
date_default_timezone_set($config['timezone']);

// Include database connection
require_once __DIR__ . '/../connection-pdo.php';

// Check if database connection is available
if (!isset($conn) || !$conn) {
    echo "Database connection failed\n";
    exit(1);
}

// Verify database connection supports transactions (required for data integrity)
try {
    // Test transaction support
    $conn->beginTransaction();
    $conn->rollBack();
} catch (PDOException $e) {
    echo "Database does not support transactions: " . $e->getMessage() . "\n";
    exit(1);
}

/**
 * Log a message with timestamp and level
 * 
 * @param string $message The message to log
 * @param string $level Log level (INFO, WARNING, ERROR, DEBUG)
 */
function log_line($message, $level = 'INFO') {
    global $config;
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message\n";
    
    // Output to console for CLI execution
    if (php_sapi_name() === 'cli') {
        echo $logEntry;
    } else {
        echo nl2br(htmlentities($logEntry));
    }
    
    // Write to log file
    if (isset($config['log_file']) && !empty($config['log_file'])) {
        file_put_contents($config['log_file'], $logEntry, FILE_APPEND);
    }
}

// Log execution start
log_line("Auto-approve department cron started");
log_line("Configuration: policy_days={$config['policy_days']}, trigger_hours={$config['trigger_hours']}, timezone={$config['timezone']}");

// Check if system is enabled
if (!$config['enabled']) {
    log_line("Auto-approve system is disabled in configuration", "WARNING");
    exit(0);
}

/**
 * Calculate the policy deadline for a reservation
 * 
 * The policy deadline is the event start date minus the configured policy days.
 * For example, if an event starts on November 1 and policy_days is 3,
 * the policy deadline is October 29.
 * 
 * @param string $eventStartDate The event start date (Y-m-d H:i:s format)
 * @param int $policyDays Number of days before event for policy deadline
 * @return DateTime|false The policy deadline DateTime object, or false on error
 */
function calculatePolicyDeadline($eventStartDate, $policyDays) {
    try {
        // Create DateTime object from event start date
        $eventDate = new DateTime($eventStartDate);
        
        // Subtract policy days to get deadline
        $policyDeadline = clone $eventDate;
        $policyDeadline->modify("-{$policyDays} days");
        
        return $policyDeadline;
    } catch (Exception $e) {
        log_line("Error calculating policy deadline: " . $e->getMessage(), "ERROR");
        return false;
    }
}

/**
 * Check if current time is within the trigger window
 * 
 * The trigger window is the period before the policy deadline when auto-approval
 * should occur. For example, if trigger_hours is 24, auto-approval happens
 * within 24 hours before the policy deadline.
 * 
 * @param DateTime $policyDeadline The policy deadline
 * @param int $triggerHours Hours before policy deadline to trigger auto-approval
 * @return bool True if within trigger window, false otherwise
 */
function isWithinTriggerWindow($policyDeadline, $triggerHours) {
    try {
        $now = new DateTime();
        
        // Calculate trigger window start (policy deadline minus trigger hours)
        $triggerWindowStart = clone $policyDeadline;
        $triggerWindowStart->modify("-{$triggerHours} hours");
        
        // Check if current time is between trigger window start and policy deadline
        // Current time >= trigger window start AND current time <= policy deadline
        $isWithinWindow = ($now >= $triggerWindowStart && $now <= $policyDeadline);
        
        return $isWithinWindow;
    } catch (Exception $e) {
        log_line("Error checking trigger window: " . $e->getMessage(), "ERROR");
        return false;
    }
}

/**
 * Get the effective event start date for a reservation
 * 
 * If the reservation has been rescheduled (reschedule_start_date is not NULL),
 * use the reschedule date. Otherwise, use the original reservation_start_date.
 * 
 * @param array $reservation Reservation data array
 * @return string|null The effective event start date, or null if not available
 */
function getEffectiveEventStartDate($reservation) {
    // Use reschedule date if available, otherwise use original date
    if (!empty($reservation['reschedule_start_date'])) {
        return $reservation['reschedule_start_date'];
    }
    
    return $reservation['reservation_start_date'] ?? null;
}

/**
 * Get eligible reservations for auto-approval
 * 
 * Finds reservations that:
 * - Have status 1 or 7 (active statuses)
 * - Do not have status 2, 5, or 4 (cancelled, rejected, etc.)
 * - Have event start dates within the calculated window
 * - Have pending department approvals (department_is_approved IS NULL OR = 0)
 * 
 * @param PDO $conn Database connection
 * @param DateTime $windowStart Start of the eligibility window
 * @param DateTime $windowEnd End of the eligibility window
 * @return array Array of eligible reservations
 */
function getEligibleReservations($conn, $windowStart, $windowEnd) {
    try {
        // Format dates for SQL query
        $windowStartStr = $windowStart->format('Y-m-d H:i:s');
        $windowEndStr = $windowEnd->format('Y-m-d H:i:s');
        
        log_line("Checking reservations with events between {$windowStartStr} and {$windowEndStr}");
        
        // Query to find eligible reservations
        $sql = "SELECT DISTINCT
                    r.reservation_id,
                    r.reservation_title,
                    r.reservation_start_date,
                    r.reschedule_start_date,
                    r.reservation_user_id,
                    CONCAT(u.users_fname, ' ', COALESCE(u.users_mname, ''), ' ', u.users_lname) AS user_full_name,
                    u.users_email,
                    latest_status.reservation_status_status_id
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
                WHERE latest_status.reservation_status_status_id IN (1, 7)
                  AND r.reservation_id NOT IN (
                      SELECT DISTINCT reservation_reservation_id 
                      FROM tbl_reservation_status 
                      WHERE reservation_status_status_id IN (2, 5, 4)
                  )
                  AND (
                      (r.reschedule_start_date IS NOT NULL AND r.reschedule_start_date BETWEEN :window_start AND :window_end)
                      OR
                      (r.reschedule_start_date IS NULL AND r.reservation_start_date BETWEEN :window_start AND :window_end)
                  )
                  AND EXISTS (
                      SELECT 1 FROM tbl_department_approval da
                      WHERE da.department_request_reservation_id = r.reservation_id
                        AND (da.department_is_approved IS NULL OR da.department_is_approved = 0)
                  )
                ORDER BY r.reservation_start_date ASC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':window_start', $windowStartStr, PDO::PARAM_STR);
        $stmt->bindParam(':window_end', $windowEndStr, PDO::PARAM_STR);
        $stmt->execute();
        
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        log_line("Found " . count($reservations) . " eligible reservations");
        
        return $reservations;
        
    } catch (PDOException $e) {
        log_line("Database error in getEligibleReservations: " . $e->getMessage(), "ERROR");
        return [];
    }
}

/**
 * Get pending department approvals for a reservation
 * 
 * This function only returns approvals where department_is_approved is NULL or 0,
 * ensuring idempotency by never returning already-approved records (Requirement 6.1).
 * 
 * @param PDO $conn Database connection
 * @param int $reservationId Reservation ID
 * @return array Array of pending department approvals
 */
function getPendingDepartmentApprovals($conn, $reservationId) {
    try {
        // Only select pending approvals (NULL or 0) - ensures idempotency (Requirement 6.1)
        $sql = "SELECT 
                    da.department_approval_id,
                    da.department_approval_department_id,
                    d.departments_name,
                    da.department_is_approved
                FROM tbl_department_approval da
                INNER JOIN tbl_departments d ON da.department_approval_department_id = d.departments_id
                WHERE da.department_request_reservation_id = :reservation_id
                  AND (da.department_is_approved IS NULL OR da.department_is_approved = 0)";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
        
    } catch (PDOException $e) {
        log_line("Error getting pending approvals for reservation {$reservationId}: " . $e->getMessage(), "ERROR");
        return [];
    }
}

/**
 * Update a department approval to approved status
 * 
 * This function ensures idempotency by only updating records where
 * department_is_approved is NULL or 0. This prevents overriding existing
 * approvals or rejections, and ensures running the script multiple times
 * produces the same result.
 * 
 * @param PDO $conn Database connection
 * @param int $approvalId Department approval ID
 * @return bool True if updated successfully, false otherwise
 */
function updateDepartmentApproval($conn, $approvalId) {
    try {
        // WHERE clause ensures idempotency - only updates pending approvals
        // This satisfies requirements 6.1 and 6.2
        $sql = "UPDATE tbl_department_approval
                SET department_is_approved = 1,
                    department_updated_at = NOW()
                WHERE department_approval_id = :approval_id
                  AND (department_is_approved IS NULL OR department_is_approved = 0)";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':approval_id', $approvalId, PDO::PARAM_INT);
        $stmt->execute();
        
        // Return true if at least one row was updated
        // If rowCount is 0, the approval was already processed (idempotent behavior)
        return $stmt->rowCount() > 0;
        
    } catch (PDOException $e) {
        log_line("Error updating approval {$approvalId}: " . $e->getMessage(), "ERROR");
        throw $e;
    }
}

/**
 * Create a notification for the reservation owner
 * 
 * Creates a notification record in tbl_notification_reservation to inform
 * the user that their department approvals were auto-approved.
 * 
 * @param PDO $conn Database connection
 * @param int $reservationId Reservation ID
 * @param string $reservationTitle Reservation title
 * @param int $userId User ID to notify
 * @param array $departmentNames Array of department names that were auto-approved
 * @return bool True if notification created successfully, false otherwise
 */
function createNotification($conn, $reservationId, $reservationTitle, $userId, $departmentNames) {
    try {
        // Build notification message with reservation title and department names
        if (count($departmentNames) === 1) {
            $message = "Your reservation \"{$reservationTitle}\" has been automatically approved by {$departmentNames[0]}";
        } else {
            $deptList = implode(', ', $departmentNames);
            $message = "Your reservation \"{$reservationTitle}\" has been automatically approved by the following departments: {$deptList}";
        }
        
        // Insert notification record
        $sql = "INSERT INTO tbl_notification_reservation 
                (notification_message, notification_reservation_reservation_id, notification_user_id, notification_created_at, is_read)
                VALUES (:message, :reservation_id, :user_id, NOW(), 0)";
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':message', $message, PDO::PARAM_STR);
        $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        log_line("Notification created for user {$userId} (reservation {$reservationId})");
        
        return true;
        
    } catch (PDOException $e) {
        log_line("Error creating notification for user {$userId}: " . $e->getMessage(), "ERROR");
        return false;
    }
}

/**
 * Send push notification to a user
 * 
 * Sends a push notification using the existing push notification service.
 * Uses cURL to call the push notification API endpoint.
 * 
 * @param int $userId User ID to send notification to
 * @param string $title Notification title
 * @param string $body Notification body text
 * @param array $data Additional data to include in notification
 * @return bool True if push notification sent successfully, false otherwise
 */
function sendPushNotificationToUser($userId, $title, $body, $data = []) {
    try {
        // Load push notification configuration
        require_once __DIR__ . '/../config/pushConfig.php';
        
        $pushUrl = getPushNotificationUrl();
        
        if (empty($pushUrl)) {
            log_line("Push notification URL not configured", "WARNING");
            return false;
        }
        
        // Prepare push notification payload
        $payload = [
            'operation' => 'send',
            'user_id' => $userId,
            'title' => $title,
            'body' => $body,
            'data' => $data
        ];
        
        // Initialize cURL
        $ch = curl_init($pushUrl);
        
        if ($ch === false) {
            log_line("Failed to initialize cURL for push notification", "ERROR");
            return false;
        }
        
        // Set cURL options
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10 second timeout
        
        // Execute request
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        
        curl_close($ch);
        
        // Check for cURL errors
        if ($response === false) {
            log_line("cURL error sending push notification to user {$userId}: {$curlError}", "WARNING");
            return false;
        }
        
        // Check HTTP response code
        if ($httpCode !== 200) {
            log_line("Push notification API returned HTTP {$httpCode} for user {$userId}", "WARNING");
            return false;
        }
        
        // Parse response
        $responseData = json_decode($response, true);
        
        if (isset($responseData['status']) && $responseData['status'] === 'success') {
            log_line("Push notification sent to user {$userId}");
            return true;
        } else {
            $errorMsg = $responseData['message'] ?? 'Unknown error';
            log_line("Push notification failed for user {$userId}: {$errorMsg}", "WARNING");
            return false;
        }
        
    } catch (Exception $e) {
        log_line("Exception sending push notification to user {$userId}: " . $e->getMessage(), "WARNING");
        return false;
    }
}

/**
 * Process a single reservation for auto-approval
 * 
 * This function implements atomic transaction processing to ensure data integrity.
 * All updates are wrapped in a transaction that either commits completely or
 * rolls back entirely, satisfying requirements 6.2, 6.3, and 6.4.
 * 
 * Process flow:
 * 1. Begins a database transaction (atomicity - Req 6.2)
 * 2. Gets all pending department approvals for the reservation
 * 3. Updates each pending approval to approved status (idempotent WHERE clause)
 * 4. Creates notification for the user if approvals were updated
 * 5. Sends push notification to the user
 * 6. Commits the transaction if successful, or rolls back on error (Req 6.3)
 * 
 * @param PDO $conn Database connection
 * @param array $reservation Reservation data
 * @param array $config Configuration array
 * @return array Result array with status and details
 */
function processReservation($conn, $reservation, $config) {
    $reservationId = $reservation['reservation_id'];
    $reservationTitle = $reservation['reservation_title'];
    
    try {
        // Begin transaction for atomicity (Requirement 6.2)
        // All updates within this transaction will either commit or rollback together
        $conn->beginTransaction();
        
        log_line("Processing reservation {$reservationId}: \"{$reservationTitle}\"");
        
        // Get pending department approvals
        $pendingApprovals = getPendingDepartmentApprovals($conn, $reservationId);
        
        if (empty($pendingApprovals)) {
            // No pending approvals found (may have been approved already)
            $conn->rollBack();
            log_line("No pending approvals found for reservation {$reservationId}", "WARNING");
            return [
                'status' => 'skipped',
                'message' => 'No pending approvals',
                'reservation_id' => $reservationId,
                'approvals_updated' => 0
            ];
        }
        
        $approvalsUpdated = 0;
        $departmentNames = [];
        
        // Update each pending approval
        foreach ($pendingApprovals as $approval) {
            $approvalId = $approval['department_approval_id'];
            $departmentName = $approval['departments_name'];
            
            // Update the approval
            $updated = updateDepartmentApproval($conn, $approvalId);
            
            if ($updated) {
                $approvalsUpdated++;
                $departmentNames[] = $departmentName;
                log_line("Updated department approval {$approvalId} for department: {$departmentName}");
            } else {
                log_line("Approval {$approvalId} was not updated (may have been approved already)", "WARNING");
            }
        }
        
        // Only create notification if at least one approval was auto-approved
        $notificationSent = false;
        $pushNotificationSent = false;
        
        if ($approvalsUpdated > 0) {
            $userId = $reservation['reservation_user_id'];
            
            // Create notification record if enabled
            if ($config['enable_notifications']) {
                $notificationSent = createNotification($conn, $reservationId, $reservationTitle, $userId, $departmentNames);
            }
            
            // Send push notification if enabled
            if ($config['enable_push']) {
                $pushTitle = "Department Approval Auto-Approved";
                $pushBody = count($departmentNames) === 1 
                    ? "Your reservation \"{$reservationTitle}\" has been automatically approved by {$departmentNames[0]}"
                    : "Your reservation \"{$reservationTitle}\" has been automatically approved by " . count($departmentNames) . " departments";
                
                $pushData = [
                    'type' => 'auto_approve',
                    'reservation_id' => $reservationId,
                    'action_url' => '/viewRequest'
                ];
                
                $pushNotificationSent = sendPushNotificationToUser($userId, $pushTitle, $pushBody, $pushData);
            }
        }
        
        // Commit transaction - all updates are now permanent (Requirement 6.2)
        $conn->commit();
        
        log_line("Successfully processed reservation {$reservationId}: {$approvalsUpdated} approvals updated");
        
        return [
            'status' => 'success',
            'message' => 'Approvals updated successfully',
            'reservation_id' => $reservationId,
            'reservation_title' => $reservationTitle,
            'approvals_updated' => $approvalsUpdated,
            'department_names' => $departmentNames,
            'user_id' => $reservation['reservation_user_id'],
            'notification_sent' => $notificationSent,
            'push_notification_sent' => $pushNotificationSent
        ];
        
    } catch (PDOException $e) {
        // Rollback transaction on database error (Requirement 6.3)
        // This ensures atomicity - either all updates succeed or none do
        if ($conn->inTransaction()) {
            $conn->rollBack();
            log_line("Transaction rolled back for reservation {$reservationId}", "WARNING");
        }
        
        log_line("Database error processing reservation {$reservationId}: " . $e->getMessage(), "ERROR");
        
        // Return error but allow processing to continue with other reservations (Requirement 6.4)
        return [
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage(),
            'reservation_id' => $reservationId,
            'error_type' => 'database'
        ];
        
    } catch (Exception $e) {
        // Rollback transaction on general error (Requirement 6.3)
        if ($conn->inTransaction()) {
            $conn->rollBack();
            log_line("Transaction rolled back for reservation {$reservationId}", "WARNING");
        }
        
        log_line("General error processing reservation {$reservationId}: " . $e->getMessage(), "ERROR");
        
        // Return error but allow processing to continue with other reservations (Requirement 6.4)
        return [
            'status' => 'error',
            'message' => 'General error: ' . $e->getMessage(),
            'reservation_id' => $reservationId,
            'error_type' => 'general'
        ];
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
//
// IDEMPOTENCY AND DATA INTEGRITY GUARANTEES (Requirements 6.1-6.5):
//
// 1. Idempotent Execution (Req 6.1):
//    - Running the script multiple times produces the same result
//    - WHERE clauses in UPDATE statements only affect pending approvals
//    - Already-approved records are never modified
//
// 2. Atomic Transactions (Req 6.2):
//    - All database updates are wrapped in transactions
//    - Each reservation is processed in its own transaction
//    - Either all updates for a reservation succeed, or none do
//
// 3. Transaction Rollback (Req 6.3):
//    - Any error during processing triggers an immediate rollback
//    - Database state remains consistent even on failures
//    - Partial updates are never committed
//
// 4. Error Isolation (Req 6.4):
//    - Errors in one reservation do not affect others
//    - Script continues processing remaining reservations after errors
//    - All errors are logged for review
//
// 5. Duplicate Prevention (Req 6.5):
//    - Processed reservation IDs are tracked in memory
//    - Duplicate reservations in the same execution are skipped
//    - Prevents race conditions within a single script run
//
// ============================================================================

try {
    // Calculate the eligibility window based on configuration
    $now = new DateTime();
    
    // The window end is: now + policy_days (events happening in the next policy_days)
    $windowEnd = clone $now;
    $windowEnd->modify("+{$config['policy_days']} days");
    
    // The window start is: now + policy_days - trigger_hours
    // This represents events whose policy deadline is within the trigger window
    $windowStart = clone $windowEnd;
    $windowStart->modify("-{$config['trigger_hours']} hours");
    
    log_line("Eligibility window: " . $windowStart->format('Y-m-d H:i:s') . " to " . $windowEnd->format('Y-m-d H:i:s'));
    
    // Get eligible reservations
    $eligibleReservations = getEligibleReservations($conn, $windowStart, $windowEnd);
    
    if (empty($eligibleReservations)) {
        log_line("No eligible reservations found");
        log_line("Auto-approve department cron completed");
        exit(0);
    }
    
    // Initialize counters for summary
    $totalChecked = count($eligibleReservations);
    $totalProcessed = 0;
    $totalApprovalsUpdated = 0;
    $totalNotificationsSent = 0;
    $totalPushNotificationsSent = 0;
    $totalErrors = 0;
    $errors = [];
    
    // Track processed reservation IDs to prevent duplicate processing (Requirement 6.5)
    // This ensures idempotency within a single execution - if the same reservation
    // appears multiple times in the result set, it will only be processed once
    $processedReservationIds = [];
    
    // Process each eligible reservation
    // Errors in one reservation do not stop processing of others (Requirement 6.4)
    foreach ($eligibleReservations as $reservation) {
        $reservationId = $reservation['reservation_id'];
        
        // Idempotency check: Skip if already processed in this execution (Requirement 6.5)
        // This prevents duplicate processing within the same script run
        if (in_array($reservationId, $processedReservationIds)) {
            log_line("Skipping reservation {$reservationId} - already processed in this execution", "WARNING");
            continue;
        }
        
        // Get effective event start date
        $eventStartDate = getEffectiveEventStartDate($reservation);
        
        if (!$eventStartDate) {
            log_line("Skipping reservation {$reservationId} - no valid event start date", "WARNING");
            continue;
        }
        
        // Calculate policy deadline for this reservation
        $policyDeadline = calculatePolicyDeadline($eventStartDate, $config['policy_days']);
        
        if (!$policyDeadline) {
            log_line("Skipping reservation {$reservationId} - could not calculate policy deadline", "WARNING");
            continue;
        }
        
        // Check if we're within the trigger window for this reservation
        if (!isWithinTriggerWindow($policyDeadline, $config['trigger_hours'])) {
            log_line("Skipping reservation {$reservationId} - not within trigger window", "DEBUG");
            continue;
        }
        
        // Process the reservation with full transaction support
        // Each reservation is processed independently - errors in one do not affect others (Requirement 6.4)
        $result = processReservation($conn, $reservation, $config);
        
        // Track this reservation as processed to prevent duplicate processing (Requirement 6.5)
        // This is added regardless of success/failure to prevent retry loops
        $processedReservationIds[] = $reservationId;
        
        // Update counters based on result
        if ($result['status'] === 'success') {
            $totalProcessed++;
            $totalApprovalsUpdated += $result['approvals_updated'];
            
            // Track notification statistics
            if (isset($result['notification_sent']) && $result['notification_sent']) {
                $totalNotificationsSent++;
            }
            if (issett($result['push_notification_sent']) && $result['push_notification_sent']) {
                $totalPushNotificationsSent++;
            }
        } elseif ($result['status'] === 'error') {
            // Log error but continue processing other reservations (Requirement 6.4)
            $totalErrors++;
            $errors[] = $result;
        }
        // 'skipped' status doesn't count as processed or error
    }
    
    // Log summary report
    log_line("========================================");
    log_line("EXECUTION SUMMARY");
    log_line("========================================");
    log_line("Total reservations checked: {$totalChecked}");
    log_line("Total reservations processed: {$totalProcessed}");
    log_line("Total approvals updated: {$totalApprovalsUpdated}");
    log_line("Total notifications sent: {$totalNotificationsSent}");
    log_line("Total push notifications sent: {$totalPushNotificationsSent}");
    log_line("Total errors: {$totalErrors}");
    
    if (!empty($errors)) {
        log_line("Errors encountered:", "ERROR");
        foreach ($errors as $error) {
            log_line("  - Reservation {$error['reservation_id']}: {$error['message']}", "ERROR");
        }
    }
    
    log_line("Auto-approve department cron completed");
    
    exit(0);
    
} catch (Exception $e) {
    log_line("Fatal error in main execution: " . $e->getMessage(), "ERROR");
    log_line("Stack trace: " . $e->getTraceAsString(), "ERROR");
    exit(1);
}

?>
