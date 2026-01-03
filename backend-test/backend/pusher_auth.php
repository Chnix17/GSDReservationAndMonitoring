<?php
/**
 * Pusher Authentication Endpoint
 * Handles authentication for private/presence channels
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-User-ID');

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

try {
    // Get user ID from headers
    $user_id = isset($_SERVER['HTTP_X_USER_ID']) ? (int)$_SERVER['HTTP_X_USER_ID'] : 0;
    
    // Get POST data
    $socket_id = $_POST['socket_id'] ?? '';
    $channel_name = $_POST['channel_name'] ?? '';
    
    if (empty($socket_id) || empty($channel_name)) {
        throw new Exception('Missing socket_id or channel_name');
    }
    
    // Validate user exists and is active
    global $conn;
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
    
    $stmt = $conn->prepare("SELECT users_id, users_fname, users_lname FROM tbl_users WHERE users_id = ? AND is_active = 1");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception('User not found or inactive');
    }
    
    // Initialize Pusher
    $pusher = getPusherInstance();
    
    // For public channels (chat-*), no authentication needed
    if (strpos($channel_name, 'chat-') === 0) {
        // Public channel - just return success
        echo json_encode(['auth' => '']);
        exit();
    }
    
    // For private channels (private-*), authenticate
    if (strpos($channel_name, 'private-') === 0) {
        $auth = $pusher->socket_auth($channel_name, $socket_id);
        echo $auth;
        exit();
    }
    
    // For presence channels (presence-*), authenticate with user data
    if (strpos($channel_name, 'presence-') === 0) {
        $user_data = [
            'id' => $user['users_id'],
            'name' => trim($user['users_fname'] . ' ' . $user['users_lname'])
        ];
        
        $auth = $pusher->presence_auth($channel_name, $socket_id, $user['users_id'], $user_data);
        echo $auth;
        exit();
    }
    
    // Unknown channel type
    throw new Exception('Unknown channel type');
    
} catch (Exception $e) {
    http_response_code(403);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
    error_log("Pusher auth error: " . $e->getMessage());
}
?>
