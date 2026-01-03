<?php
/**
 * Pusher Chat Handler for GSD Reservation System
 * 
 * This file handles chat message sending and broadcasting using Pusher Channels
 * Replaces the WebSocket server functionality with Pusher integration
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Include required files
require_once __DIR__ . '/connection-pdo.php';
require_once __DIR__ . '/pusher_config.php';

// Set timezone to Asia/Manila
date_default_timezone_set('Asia/Manila');

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    // Validate required fields
    $sender_id = isset($data['sender_id']) ? (int)$data['sender_id'] : 0;
    $receiver_id = isset($data['receiver_id']) ? (int)$data['receiver_id'] : 0;
    $message = isset($data['message']) ? trim($data['message']) : '';
    
    if ($sender_id <= 0 || $receiver_id <= 0 || empty($message)) {
        throw new Exception('Missing required fields: sender_id, receiver_id, message');
    }
    
    // Initialize database connection
    global $conn;
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
    
    // Insert message into database with Asia/Manila timezone
    $currentDateTime = date('Y-m-d H:i:s');
    $stmt = $conn->prepare("INSERT INTO tbl_chat (sender_id, receiver_id, message, created_at, is_read) VALUES (?, ?, ?, ?, 0)");
    $stmt->execute([$sender_id, $receiver_id, $message, $currentDateTime]);
    
    $message_id = $conn->lastInsertId();
    
    // Get sender information for the broadcast
    $senderStmt = $conn->prepare("
        SELECT 
            users_id,
            CONCAT(
                users_fname,
                CASE WHEN users_mname IS NOT NULL AND users_mname != '' 
                     THEN CONCAT(' ', LEFT(users_mname, 1), '.') 
                     ELSE '' 
                END,
                ' ', users_lname
            ) AS full_name
        FROM tbl_users 
        WHERE users_id = ?
    ");
    $senderStmt->execute([$sender_id]);
    $sender_info = $senderStmt->fetch(PDO::FETCH_ASSOC);
    
    // Audit logging (non-blocking)
    try {
        $receiverStmt = $conn->prepare("
            SELECT CONCAT(
                users_fname,
                CASE WHEN users_mname IS NOT NULL AND users_mname != '' 
                     THEN CONCAT(' ', LEFT(users_mname, 1), '.') 
                     ELSE '' 
                END,
                ' ', users_lname
            ) AS full_name
            FROM tbl_users 
            WHERE users_id = ?
        ");
        $receiverStmt->execute([$receiver_id]);
        $receiver_info = $receiverStmt->fetch(PDO::FETCH_ASSOC);
        
        $sender_name = $sender_info['full_name'] ?? ('User #' . $sender_id);
        $receiver_name = $receiver_info['full_name'] ?? ('User #' . $receiver_id);
        
        $snippet = substr($message, 0, 200);
        $description = "User {$sender_name} sent a message to {$receiver_name}: '{$snippet}'";
        
        $auditStmt = $conn->prepare("INSERT INTO audit_log (description, action, created_at, created_by) VALUES (?, ?, ?, ?)");
        $auditStmt->execute([$description, 'SEND MESSAGE', $currentDateTime, $sender_id]);
    } catch (Exception $e) {
        // Ignore audit logging errors
        error_log("Audit logging failed: " . $e->getMessage());
    }
    
    // Initialize Pusher
    $pusher = getPusherInstance();
    
    // Prepare message data for broadcast
    $messageData = [
        'message_id' => $message_id,
        'sender_id' => $sender_id,
        'receiver_id' => $receiver_id,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s'),
        'sender_name' => $sender_info['full_name'] ?? null,
        'receiver_name' => $receiver_info['full_name'] ?? null
    ];
    
    // Get chat channel name
    $channel = getChatChannelName($sender_id, $receiver_id);
    
    // Broadcast message via Pusher
    $pusher->trigger($channel, 'new-message', $messageData);
    // Also broadcast to per-user channels so list view gets real-time updates
    $pusher->trigger('user-' . $sender_id, 'new-message', $messageData);
    $pusher->trigger('user-' . $receiver_id, 'new-message', $messageData);
    
    // Send push notification to receiver (optional - don't fail if not available)
    try {
        // Check if push notification config exists
        if (file_exists(__DIR__ . '/config/pushConfig.php')) {
            require_once 'config/pushConfig.php';
            $pushUrl = getPushNotificationUrl();
            
            // Determine the correct chat URL based on user role
            $chatUrl = '/Admin/Chat'; // Default to Admin
            
            // Get receiver's user level to determine correct chat route
            try {
                $userLevelStmt = $conn->prepare("
                    SELECT ul.user_level_name 
                    FROM tbl_users u
                    LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    WHERE u.users_id = ?
                ");
                $userLevelStmt->execute([$receiver_id]);
                $userLevel = $userLevelStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($userLevel && $userLevel['user_level_name']) {
                    $levelName = $userLevel['user_level_name'];
                    // Map user levels to their chat routes
                    if (in_array($levelName, ['Student', 'Faculty', 'Secretary'])) {
                        $chatUrl = '/Faculty/Chat';
                    } elseif (in_array($levelName, ['Department Head', 'Dean', 'Vice President'])) {
                        $chatUrl = '/Department/Chat';
                    } elseif ($levelName === 'Personnel') {
                        $chatUrl = '/Personnel/Chat';
                    } elseif ($levelName === 'Driver') {
                        $chatUrl = '/Driver/Chat';
                    }
                    // Admin and other levels default to /Admin/Chat
                }
            } catch (Exception $e) {
                error_log("Error getting user level for chat URL: " . $e->getMessage());
            }
            
            $pushData = [
                'operation' => 'send',
                'user_id' => $receiver_id,
                'title' => 'New Message from ' . ($sender_info['full_name'] ?? 'User'),
                'body' => substr($message, 0, 100) . (strlen($message) > 100 ? '...' : ''),
                'data' => [
                    'sender_id' => $sender_id,
                    'message' => $message,
                    'type' => 'chat_message',
                    'timestamp' => time(),
                    'url' => $chatUrl
                ]
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
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode >= 200 && $httpCode < 300) {
                error_log("Push notification sent successfully to user $receiver_id");
            } else {
                error_log("Push notification failed for user $receiver_id: HTTP $httpCode");
            }
        } else {
            error_log("Push notification config not found - skipping push notification");
        }
    } catch (Exception $e) {
        error_log("Push notification error (non-critical): " . $e->getMessage());
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message_id' => $message_id,
        'channel' => $channel,
        'data' => $messageData
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
    error_log("Pusher chat error: " . $e->getMessage());
}
