<?php
// Disable HTML error output to ensure JSON responses
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Log PHP version and environment info
error_log("=== Push Notification Service Started ===");
error_log("PHP Version: " . phpversion());

// Dynamically check Minishlink WebPush requirements
$composerFile = __DIR__ . '/../vendor/minishlink/web-push/composer.json';
$requiredPhpVersion = 'Unknown';
$requiredExtensions = [];

if (file_exists($composerFile)) {
    $composerData = json_decode(file_get_contents($composerFile), true);
    if (isset($composerData['require']['php'])) {
        $requiredPhpVersion = $composerData['require']['php'];
        error_log("Required PHP Version (from minishlink/web-push): " . $requiredPhpVersion);
    }
    
    // Extract required extensions
    foreach ($composerData['require'] as $package => $version) {
        if (strpos($package, 'ext-') === 0) {
            $extension = substr($package, 4); // Remove 'ext-' prefix
            $requiredExtensions[] = $extension;
        }
    }
    
    if (!empty($requiredExtensions)) {
        error_log("Required Extensions (from minishlink/web-push): " . implode(', ', $requiredExtensions));
    }
} else {
    error_log("Required PHP Version: >=8.0 (fallback - composer.json not found)");
    $requiredExtensions = ['curl', 'json', 'mbstring', 'openssl'];
    error_log("Required Extensions (fallback): " . implode(', ', $requiredExtensions));
}

// Check if current PHP version meets requirements
if ($requiredPhpVersion !== 'Unknown') {
    $currentVersion = phpversion();
    $minVersion = str_replace('>=', '', $requiredPhpVersion);
    if (version_compare($currentVersion, $minVersion, '>=')) {
        error_log("✅ PHP Version Check: PASSED (Current: {$currentVersion}, Required: {$requiredPhpVersion})");
    } else {
        error_log("❌ PHP Version Check: FAILED (Current: {$currentVersion}, Required: {$requiredPhpVersion})");
    }
}

// Check required extensions
$missingExtensions = [];
foreach ($requiredExtensions as $extension) {
    if (!extension_loaded($extension)) {
        $missingExtensions[] = $extension;
    }
}

if (empty($missingExtensions)) {
    error_log("✅ Extensions Check: PASSED - All required extensions loaded");
} else {
    error_log("❌ Extensions Check: FAILED - Missing extensions: " . implode(', ', $missingExtensions));
}

error_log("Current PHP Extensions: " . implode(', ', get_loaded_extensions()));
error_log("OpenSSL Version: " . (defined('OPENSSL_VERSION_TEXT') ? OPENSSL_VERSION_TEXT : 'Not available'));
error_log("cURL Version: " . (function_exists('curl_version') ? json_encode(curl_version()) : 'Not available'));
error_log("==========================================");

// Fix OpenSSL configuration issue for Windows/XAMPP
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    // Set OpenSSL configuration path for Windows
    $opensslConf = 'C:\xampp\php\extras\ssl\openssl.cnf';
    if (file_exists($opensslConf)) {
        putenv("OPENSSL_CONF=$opensslConf");
    }
    
    // Alternative: Create temporary config if main one doesn't exist
    if (!getenv('OPENSSL_CONF') || !file_exists(getenv('OPENSSL_CONF'))) {
        $tempConf = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'openssl_temp.cnf';
        $configContent = "[req]
default_bits = 2048
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment

[v3_ca]
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid:always,issuer:always
basicConstraints = CA:true
";
        file_put_contents($tempConf, $configContent);
        putenv("OPENSSL_CONF=$tempConf");
    }
}

// Handle preflight OPTIONS request first
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header('Content-Type: application/json');
    
    http_response_code(200);
    exit();
}

// Set CORS headers for actual requests
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../connection-pdo.php';
require_once '../vendor/autoload.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// VAPID Configuration - Using recommended keys from memory
const VAPID_SUBJECT = 'mailto:vallechristianmark@gmail.com';
const VAPID_PUBLIC_KEY = 'BL7W2qb8X8DQSMu3S8gozbbawaad68DCNE0wLc2_R7D3zg6FFL4vZI5oBP9AJwf-2UiE3iw4rM-gab_-NdDgrm8';
const VAPID_PRIVATE_KEY = 'jX0InTBb-XZ-P6q8Jr34BwSoSwTq3IT6gtbx54BFaHA';

class PushNotificationHandler {
    private $conn;
    private $webPush;
    private $localKeyObject;

    public function __construct() {
        global $conn;
        $this->conn = $conn;

        $auth = [
            'VAPID' => [
                'subject' => VAPID_SUBJECT,
                'publicKey' => VAPID_PUBLIC_KEY,
                'privateKey' => VAPID_PRIVATE_KEY,
            ]
        ];

        try {
            // Validate VAPID keys first
            if (!$this->validateVAPIDKeys()) {
                throw new Exception("Invalid VAPID keys");
            }
            
            // VAPID keys should be in base64url format as expected by the library
            error_log("VAPID private key: " . $auth['VAPID']['privateKey']);
            error_log("VAPID public key: " . $auth['VAPID']['publicKey']);
            
            // Try to initialize WebPush with additional options for Windows/XAMPP compatibility
            $options = [
                'timeout' => 30,
                'TTL' => 2419200, // 4 weeks
                'urgency' => 'normal',
                'topic' => null,
                'batchSize' => 1000,
            ];
            
            $this->webPush = new WebPush($auth, $options);
            error_log("WebPush initialized successfully");
            
        } catch (Exception $e) {
            error_log("WebPush initialization error: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            
            // Try alternative initialization without some options
            try {
                error_log("Attempting fallback WebPush initialization...");
                $this->webPush = new WebPush($auth);
                error_log("Fallback WebPush initialization successful");
            } catch (Exception $e2) {
                error_log("Fallback WebPush initialization also failed: " . $e2->getMessage());
                throw new Exception("WebPush initialization failed: " . $e->getMessage() . " | Fallback: " . $e2->getMessage());
            }
        }
    }

    public function sendTestNotification($userId) {
        try {
            // Test WebPush initialization first
            if (!$this->webPush) {
                error_log("WebPush not initialized");
                return ['status' => 'error', 'message' => 'WebPush not initialized'];
            }
            
            error_log("Starting sendTestNotification for user: " . $userId);
            // Get all active subscriptions for the user, ordered by newest first
            $stmt = $this->conn->prepare("SELECT * FROM tbl_push_subscriptions WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC");
            $stmt->execute([$userId]);
            $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($subscriptions)) {
                return ['status' => 'error', 'message' => 'No active subscription found for user ID: ' . $userId];
            }

            error_log("Found " . count($subscriptions) . " active subscriptions for user {$userId}");

            // Create notification payload
            $notificationPayload = [
                'title' => 'Test Notification',
                'body' => 'This is a test from the server!',
                // 'icon' => '/gsd-reservation/public/images/assets/phinma.png',
                //'badge' => '/gsd-reservation/public/images/assets/phinma.png', // comment out temporarily
                //'requireInteraction' => true, // comment out temporarily
                'data' => [
                    'url' => '/viewRequest',
                    'timestamp' => time(),
                    'type' => 'test_notification'
                ]
            ];
            
            
            $payload = json_encode($notificationPayload);
            error_log("Test notification payload: " . $payload);
            
            // Queue the notification
            $this->webPush->queueNotification($subscription, $payload);
            
            // Send all queued notifications
            $success = false;
            $errorMessage = '';
            $reportCount = 0;
            
            foreach ($this->webPush->flush() as $report) {
                $reportCount++;
                error_log("Processing test notification report #" . $reportCount);
                error_log("Report endpoint: " . $report->getEndpoint());
                error_log("Report success: " . ($report->isSuccess() ? 'true' : 'false'));
                
                if ($report->isSuccess()) {
                    error_log("✅ SUCCESS: Test notification sent successfully for user {$userId}");
                    error_log("✅ SUCCESS: Endpoint: " . substr($report->getEndpoint(), -30));
                    error_log("✅ SUCCESS: Timestamp: " . date('Y-m-d H:i:s'));
                    $success = true;
                } else {
                    $reason = $report->getReason();
                    $response = $report->getResponse();
                    error_log("Test notification failed for user {$userId}: {$reason}");
                    error_log("Response body: " . ($response ? $response->getBody() : 'No response body'));
                    error_log("Response status: " . ($response ? $response->getStatusCode() : 'No status code'));
                    
                    $errorMessage = $reason;
                    
                    if ($report->isSubscriptionExpired()) {
                        error_log("Subscription expired for user {$userId}");
                        $this->markSubscriptionInactive($userId);
                    }
                }
            }
            
            if ($success) {
                error_log("✅ FINAL SUCCESS: Test notification delivery completed for user {$userId}");
                return ['status' => 'success', 'message' => 'Test notification sent.'];
            } else {
                error_log("❌ FINAL FAILURE: Test notification delivery failed for user {$userId}: " . $errorMessage);
                return ['status' => 'error', 'message' => 'Failed to send test notification: ' . $errorMessage];
            }

        } catch (Exception $e) {
            error_log("Exception in sendTestNotification: " . $e->getMessage());
            error_log("Trace: " . $e->getTraceAsString());
            http_response_code(500);
            return [
                'error' => 'Server error: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ];
        }
    }
    
    public function sendNotification($userId, $title = 'Notification', $body = 'You have a new basta', $data = []) {
        try {
            // Get all active subscriptions for the user, ordered by newest first
            $stmt = $this->conn->prepare("SELECT * FROM tbl_push_subscriptions WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC");
            $stmt->execute([$userId]);
            $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($subscriptions)) {
                return ['status' => 'error', 'message' => 'No active subscription found for user ID: ' . $userId];
            }

            error_log("Found " . count($subscriptions) . " active subscriptions for user {$userId}");

            // Create notification payload
            $notificationPayload = [
                'title' => $title,
                'body' => $body,
                'icon' => '/gsd-reservation-main/public/images/assets/phinma.png',
                'badge' => '/gsd-reservation-main/public/images/assets/phinma.png',
                'requireInteraction' => true,
                'data' => array_merge([
                    'timestamp' => time(),
                    'url' => '/'
                ], $data)
            ];
            
            // Set proper URL for action_url notifications
            if (isset($data['action_url'])) {
                error_log("Found action_url in data: " . $data['action_url']);
                $notificationPayload['data']['url'] = $data['action_url'];
            }
            
            // Debug log the data received
            error_log("Notification data received: " . json_encode($data));
            error_log("Notification type: " . ($data['type'] ?? 'not set'));
            error_log("Has action_url: " . (isset($data['action_url']) ? 'yes - ' . $data['action_url'] : 'no'));
            
            // Add action buttons for reservation notifications
            if (isset($data['type']) && in_array($data['type'], ['new_reservation', 'reservation_pending', 'reservation_approved', 'reservation_declined', 'reservation_confirmation', 'reservation_final_approval', 'department_approval'])) {
                $viewButtonTitle = 'View Request';
                
                // Customize button title based on notification type
                if ($data['type'] === 'new_reservation') {
                    $viewButtonTitle = 'View Request';
                } elseif ($data['type'] === 'reservation_pending') {
                    $viewButtonTitle = 'View Approval';
                } elseif (in_array($data['type'], ['reservation_approved', 'reservation_declined'])) {
                    $viewButtonTitle = 'View Details';
                } elseif ($data['type'] === 'reservation_final_approval') {
                    $viewButtonTitle = 'View Request';
                } elseif ($data['type'] === 'department_approval') {
                    $viewButtonTitle = 'View Request';
                }
                
                // For notifications with action_url (like department_approval), only show View Request button without Close button
                if (isset($data['action_url'])) {
                    error_log("Setting single button for action_url notification: " . $data['action_url']);
                    $notificationPayload['actions'] = [
                        [
                            'action' => 'view',
                            'title' => $viewButtonTitle,
                            'icon' => '/gsd-reservation-main/public/images/assets/phinma.png'
                        ]
                    ];
                } else {
                    // For other notifications, show both View and Close buttons
                    error_log("Setting dual buttons for regular notification");
                    $notificationPayload['actions'] = [
                        [
                            'action' => 'view',
                            'title' => $viewButtonTitle,
                            'icon' => '/gsd-reservation-main/public/images/assets/phinma.png'
                        ],
                        [
                            'action' => 'dismiss',
                            'title' => 'Close',
                            'icon' => '/gsd-reservation-main/public/images/assets/phinma.png'
                        ]
                    ];
                }
            }
            
            $payload = json_encode($notificationPayload);
            error_log("Notification payload: " . $payload);
            
            // Try each subscription until one succeeds
            $success = false;
            $lastError = '';
            
            foreach ($subscriptions as $subscriptionData) {
                if (empty($subscriptionData['endpoint']) || empty($subscriptionData['p256dh_key']) || empty($subscriptionData['auth_key'])) {
                    error_log("Skipping incomplete subscription data for user {$userId}");
                    continue;
                }

                $subscription = Subscription::create([
                    'endpoint' => $subscriptionData['endpoint'],
                    'publicKey' => $subscriptionData['p256dh_key'],
                    'authToken' => $subscriptionData['auth_key'],
                ]);
                
                // Show which subscription we're trying (last 20 chars of endpoint for privacy)
                $endpointPreview = '...' . substr($subscriptionData['endpoint'], -20);
                error_log("Trying subscription for user {$userId}: {$endpointPreview}");
            
                // Queue the notification
                $this->webPush->queueNotification($subscription, $payload);
                
                // Send all queued notifications
                $reportCount = 0;
                
                foreach ($this->webPush->flush() as $report) {
                    $reportCount++;
                    error_log("Processing notification report #" . $reportCount);
                    error_log("Report endpoint: " . $report->getEndpoint());
                    error_log("Report success: " . ($report->isSuccess() ? 'true' : 'false'));
                    
                    if ($report->isSuccess()) {
                        error_log("✅ SUCCESS: Notification sent successfully for user {$userId}");
                        error_log("✅ SUCCESS: Title: {$title}");
                        error_log("✅ SUCCESS: Body: {$body}");
                        error_log("✅ SUCCESS: Endpoint: {$endpointPreview}");
                        error_log("✅ SUCCESS: Timestamp: " . date('Y-m-d H:i:s'));
                        if (isset($data['type'])) {
                            error_log("✅ SUCCESS: Notification Type: " . $data['type']);
                        }
                        $success = true;
                        break 2; // Break out of both loops
                    } else {
                        $reason = $report->getReason();
                        $response = $report->getResponse();
                        error_log("Notification for user {$userId} failed via {$endpointPreview}: {$reason}");
                        error_log("Response body: " . ($response ? $response->getBody() : 'No response body'));
                        error_log("Response status: " . ($response ? $response->getStatusCode() : 'No status code'));
                        
                        $lastError = $reason;
                        
                        if ($report->isSubscriptionExpired()) {
                            error_log("Subscription expired for user {$userId}, marking specific subscription as inactive");
                            $this->markSpecificSubscriptionInactive($subscriptionData['id']);
                        }
                    }
                }
            }
            
            if ($success) {
                error_log("✅ FINAL SUCCESS: Notification delivery completed for user {$userId}");
                return ['status' => 'success', 'message' => 'Notification sent.'];
            } else {
                error_log("❌ FINAL FAILURE: Notification delivery failed for user {$userId}: " . $lastError);
                return ['status' => 'error', 'message' => 'Failed to send notification: ' . $lastError];
            }

        } catch (Exception $e) {
            error_log("Exception in sendNotification: " . $e->getMessage());
            return ['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()];
        }
    }

    private function isValidBase64($str) {
        if (empty($str)) return false;
        // Check if it's valid base64url format using the library's method
        try {
            $decoded = \Base64Url\Base64Url::decode($str);
            return $decoded !== false && strlen($decoded) > 0;
        } catch (Exception $e) {
            return false;
        }
    }

    private function markSubscriptionInactive($userId) {
        try {
            $stmt = $this->conn->prepare("UPDATE tbl_push_subscriptions SET is_active = 0 WHERE user_id = ?");
            $stmt->execute([$userId]);
        } catch (Exception $e) {
            error_log("Failed to mark subscription inactive: " . $e->getMessage());
        }
    }

    private function markSpecificSubscriptionInactive($subscriptionId) {
        try {
            $stmt = $this->conn->prepare("UPDATE tbl_push_subscriptions SET is_active = 0 WHERE id = ?");
            $stmt->execute([$subscriptionId]);
            error_log("✅ SUCCESS: Marked specific subscription {$subscriptionId} as inactive");
        } catch (Exception $e) {
            error_log("❌ FAILURE: Failed to mark specific subscription inactive: " . $e->getMessage());
        }
    }

    public function getPublicKey() {
        return ['status' => 'success', 'publicKey' => VAPID_PUBLIC_KEY];
    }
    
    public function generateNewVAPIDKeys() {
        try {
            $keys = \Minishlink\WebPush\VAPID::createVapidKeys();
            return [
                'status' => 'success',
                'publicKey' => $keys['publicKey'],
                'privateKey' => $keys['privateKey']
            ];
        } catch (Exception $e) {
            return ['status' => 'error', 'message' => 'Failed to generate VAPID keys: ' . $e->getMessage()];
        }
    }
    
    public function testOpenSSLConfiguration() {
        $results = [];
        
        // Test different OpenSSL configurations
        $configs = [
            [
                'name' => 'Default',
                'config' => []
            ],
            [
                'name' => 'Prime256v1',
                'config' => [
                    'curve_name' => 'prime256v1',
                    'private_key_type' => OPENSSL_KEYTYPE_EC,
                ]
            ],
            [
                'name' => 'Secp256r1',
                'config' => [
                    'curve_name' => 'secp256r1',
                    'private_key_type' => OPENSSL_KEYTYPE_EC,
                ]
            ],
            [
                'name' => 'With bits',
                'config' => [
                    'curve_name' => 'prime256v1',
                    'private_key_type' => OPENSSL_KEYTYPE_EC,
                    'private_key_bits' => 256,
                ]
            ]
        ];
        
        foreach ($configs as $config) {
            try {
                $key = openssl_pkey_new($config['config']);
                if ($key) {
                    $details = openssl_pkey_get_details($key);
                    if ($details) {
                        $results[$config['name']] = 'SUCCESS';
                        openssl_free_key($key);
                    } else {
                        $results[$config['name']] = 'FAILED - No details';
                    }
                } else {
                    $results[$config['name']] = 'FAILED - Null key';
                }
            } catch (Exception $e) {
                $results[$config['name']] = 'FAILED - ' . $e->getMessage();
            }
        }
        
        return [
            'status' => 'success',
            'results' => $results
        ];
    }
    
    private function validateVAPIDKeys() {
        try {
            // Use Base64Url decode as expected by the WebPush library
            $privateKeyDecoded = \Base64Url\Base64Url::decode(VAPID_PRIVATE_KEY);
            if ($privateKeyDecoded === false) {
                error_log("Invalid VAPID private key format");
                return false;
            }
            
            // Decode the public key
            $publicKeyDecoded = \Base64Url\Base64Url::decode(VAPID_PUBLIC_KEY);
            if ($publicKeyDecoded === false) {
                error_log("Invalid VAPID public key format");
                return false;
            }
            
            error_log("VAPID private key length: " . strlen($privateKeyDecoded));
            error_log("VAPID public key length: " . strlen($publicKeyDecoded));
            
            // Check expected lengths
            if (strlen($privateKeyDecoded) !== 32) {
                error_log("VAPID private key should be 32 bytes, got " . strlen($privateKeyDecoded));
                return false;
            }
            
            if (strlen($publicKeyDecoded) !== 65) {
                error_log("VAPID public key should be 65 bytes, got " . strlen($publicKeyDecoded));
                return false;
            }
            
            return true;
        } catch (Exception $e) {
            error_log("VAPID key validation error: " . $e->getMessage());
            return false;
        }
    }
}

// Handle request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    error_log("Raw input received: " . $rawInput);

    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
        exit;
    }

    if (!$input || !isset($input['operation'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request data']);
        exit;
    }

    try {
        // Additional error suppression for clean JSON output
        ob_start();
        $handler = new PushNotificationHandler();
        ob_end_clean();

        switch ($input['operation']) {
            case 'test':
                if (isset($input['user_id'])) {
                    error_log("🔔 PUSH NOTIFICATION TEST REQUEST: User ID {$input['user_id']}");
                    $result = $handler->sendTestNotification($input['user_id']);
                    error_log("🔔 PUSH NOTIFICATION TEST RESULT: " . json_encode($result));
                    echo json_encode($result);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'User ID required']);
                }
                break;

            case 'send':
                if (isset($input['user_id'])) {
                    $title = $input['title'] ?? 'Notification';
                    $body = $input['body'] ?? 'mao ni syang notification';
                    $data = $input['data'] ?? [];
                    error_log("🔔 PUSH NOTIFICATION SEND REQUEST: User ID {$input['user_id']}, Title: {$title}");
                    $result = $handler->sendNotification($input['user_id'], $title, $body, $data);
                    error_log("🔔 PUSH NOTIFICATION SEND RESULT: " . json_encode($result));
                    echo json_encode($result);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'User ID required']);
                }
                break;

            case 'getPublicKey':
                echo json_encode($handler->getPublicKey());
                break;

            case 'generateVAPIDKeys':
            case 'generateNewVAPIDKeys':
                echo json_encode($handler->generateNewVAPIDKeys());
                break;

            case 'testOpenSSL':
                echo json_encode($handler->testOpenSSLConfiguration());
                break;
                
            case 'ping':
                echo json_encode(['status' => 'success', 'message' => 'API is working', 'timestamp' => time()]);
                break;

            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid operation']);
        }
    } catch (Exception $e) {
        error_log("Fatal error: " . $e->getMessage());
        error_log("Trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode([
            'error' => 'Server error: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}