<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Include database connection
require_once '../connection-pdo.php';



class PushSubscriptionManager {
    private $conn;

    public function __construct($connection) {
        $this->conn = $connection;
    }

    public function saveSubscription($userId, $subscriptionData, $deviceInfo = null) {
        try {
          
            
            // Validate required data
            if (empty($userId)) {
                throw new Exception("User ID is required");
            }
            if (empty($subscriptionData) || !is_array($subscriptionData)) {
                throw new Exception("Subscription data is required and must be an array");
            }
            if (empty($subscriptionData['endpoint'])) {
                throw new Exception("Subscription endpoint is required");
            }
            if (empty($subscriptionData['keys']) || !is_array($subscriptionData['keys'])) {
                throw new Exception("Subscription keys are required");
            }
            if (empty($subscriptionData['keys']['p256dh'])) {
                throw new Exception("p256dh key is required");
            }
            if (empty($subscriptionData['keys']['auth'])) {
                throw new Exception("auth key is required");
            }
            
           
            
            // Normalize keys to base64url (browser btoa gives base64)
            $normalizeBase64Url = function ($s) {
                // If it's already url-safe, this will effectively be a no-op
                $s = rtrim($s, '=');
                $s = strtr($s, '+/', '-_');
                return $s;
            };

            
            if (isset($subscriptionData['keys']['p256dh'])) {
                
                $subscriptionData['keys']['p256dh'] = $normalizeBase64Url($subscriptionData['keys']['p256dh']);
            }
            
            
            if (isset($subscriptionData['keys']['auth'])) {
                
                $subscriptionData['keys']['auth'] = $normalizeBase64Url($subscriptionData['keys']['auth']);
            }
            
            

            // Extract device information from User-Agent or provided data
            
            $userAgent = $deviceInfo['user_agent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? '';
            $deviceType = $deviceInfo['device_type'] ?? $this->detectDeviceType($userAgent);
            $deviceOS = $deviceInfo['device_os'] ?? $this->detectOS($userAgent);
            $browser = $deviceInfo['browser'] ?? $this->detectBrowser($userAgent);
            
           
            
            
            // Check if subscription exists for this specific user on this device (user_id + user_agent)
            
            
            $checkDeviceSql = "SELECT subscription_id, user_id, device_type, device_os, browser FROM tbl_push_subscriptions WHERE user_id = :user_id AND user_agent = :user_agent";
            
            $checkDeviceStmt = $this->conn->prepare($checkDeviceSql);
            $checkDeviceStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $checkDeviceStmt->bindParam(':user_agent', $userAgent, PDO::PARAM_STR);
            $result = $checkDeviceStmt->execute();
            
            
            $existingDeviceSubscription = $checkDeviceStmt->fetch(PDO::FETCH_ASSOC);
            

            // Check if device fingerprint is different (same user agent but different browser/device/OS)
            $shouldInsertNew = false;
            if ($existingDeviceSubscription) {
                $existingDeviceType = $existingDeviceSubscription['device_type'] ?? '';
                $existingDeviceOS = $existingDeviceSubscription['device_os'] ?? '';
                $existingBrowser = $existingDeviceSubscription['browser'] ?? '';
                
               
                if ($deviceType !== $existingDeviceType || 
                    $deviceOS !== $existingDeviceOS || 
                    $browser !== $existingBrowser) {
                    
                    
                    
                    
                    $shouldInsertNew = true;
                } else {
                    
                    $shouldInsertNew = false;
                }
            } else {
                
                $shouldInsertNew = true;
            }

            // Delete existing subscription only if device fingerprint is the same (for this specific user)
            if ($existingDeviceSubscription && !$shouldInsertNew) {
                
                $deleteSql = "DELETE FROM tbl_push_subscriptions WHERE user_id = :user_id AND user_agent = :user_agent";
                
                $deleteStmt = $this->conn->prepare($deleteSql);
                $deleteStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $deleteStmt->bindParam(':user_agent', $userAgent, PDO::PARAM_STR);
                $deleteResult = $deleteStmt->execute();
                
               
            } else {
                
            }
            
            // Insert new subscription (new fingerprint gets added, same fingerprint gets replaced)
            
            $sql = "INSERT INTO tbl_push_subscriptions 
                    (user_id, endpoint, p256dh_key, auth_key, device_type, device_os, browser, user_agent, is_active, created_at, updated_at) 
                    VALUES (:user_id, :endpoint, :p256dh_key, :auth_key, :device_type, :device_os, :browser, :user_agent, 1, NOW(), NOW())";
            

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':endpoint', $subscriptionData['endpoint'], PDO::PARAM_STR);
            $stmt->bindParam(':p256dh_key', $subscriptionData['keys']['p256dh'], PDO::PARAM_STR);
            $stmt->bindParam(':auth_key', $subscriptionData['keys']['auth'], PDO::PARAM_STR);
            $stmt->bindParam(':device_type', $deviceType, PDO::PARAM_STR);
            $stmt->bindParam(':device_os', $deviceOS, PDO::PARAM_STR);
            $stmt->bindParam(':browser', $browser, PDO::PARAM_STR);
            $stmt->bindParam(':user_agent', $userAgent, PDO::PARAM_STR);
            
            
            $result = $stmt->execute();
            
            $insertId = $this->conn->lastInsertId();
            
            
            if (!$result) {
                $errorInfo = $stmt->errorInfo();
                
                
                throw new Exception("Failed to insert subscription: " . $errorInfo[2]);
            }
            
            // Verify the insert by checking if the record exists
            
            $verifySql = "SELECT subscription_id, user_id, created_at FROM tbl_push_subscriptions WHERE subscription_id = :id";
            $verifyStmt = $this->conn->prepare($verifySql);
            $verifyStmt->bindParam(':id', $insertId, PDO::PARAM_INT);
            $verifyStmt->execute();
            $verifyResult = $verifyStmt->fetch(PDO::FETCH_ASSOC);
            
            
            // Also count total records for this user
            $countSql = "SELECT COUNT(*) as total FROM tbl_push_subscriptions WHERE user_id = :user_id";
            $countStmt = $this->conn->prepare($countSql);
            $countStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $countStmt->execute();
            $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);
            

            return json_encode([
                'status' => 'success',
                'message' => 'Push subscription saved successfully'
            ]);

        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

	public function repairSubscription($userId, $subscriptionData, $deviceInfo = null) {
		// For now, repairing is equivalent to saving/upserting the latest
		// subscription for this specific device and marking it active.
		return $this->saveSubscription($userId, $subscriptionData, $deviceInfo);
	}

    private function detectDeviceType($userAgent) {
        $userAgent = strtolower($userAgent);
        
        if (strpos($userAgent, 'mobile') !== false || 
            strpos($userAgent, 'android') !== false || 
            strpos($userAgent, 'iphone') !== false || 
            strpos($userAgent, 'ipod') !== false) {
            return 'Mobile';
        } elseif (strpos($userAgent, 'tablet') !== false || 
                  strpos($userAgent, 'ipad') !== false) {
            return 'Tablet';
        } else {
            return 'Desktop';
        }
    }

    private function detectOS($userAgent) {
        $userAgent = strtolower($userAgent);
        
        if (strpos($userAgent, 'windows nt') !== false) {
            return 'Windows';
        } elseif (strpos($userAgent, 'mac os x') !== false || strpos($userAgent, 'macintosh') !== false) {
            return 'macOS';
        } elseif (strpos($userAgent, 'linux') !== false) {
            return 'Linux';
        } elseif (strpos($userAgent, 'android') !== false) {
            return 'Android';
        } elseif (strpos($userAgent, 'iphone') !== false || strpos($userAgent, 'ipad') !== false || strpos($userAgent, 'ipod') !== false) {
            return 'iOS';
        } else {
            return 'Unknown';
        }
    }

    private function detectBrowser($userAgent) {
        $userAgent = strtolower($userAgent);
        
        if (strpos($userAgent, 'edg') !== false) {
            return 'Microsoft Edge';
        } elseif (strpos($userAgent, 'chrome') !== false && strpos($userAgent, 'edg') === false) {
            return 'Google Chrome';
        } elseif (strpos($userAgent, 'firefox') !== false) {
            return 'Mozilla Firefox';
        } elseif (strpos($userAgent, 'safari') !== false && strpos($userAgent, 'chrome') === false) {
            return 'Safari';
        } elseif (strpos($userAgent, 'opera') !== false || strpos($userAgent, 'opr') !== false) {
            return 'Opera';
        } elseif (strpos($userAgent, 'trident') !== false || strpos($userAgent, 'msie') !== false) {
            return 'Internet Explorer';
        } else {
            return 'Unknown';
        }
    }

    public function deleteSubscription($userId) {
        try {
            $sql = "DELETE FROM tbl_push_subscriptions WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();

            return json_encode([
                'status' => 'success',
                'message' => 'Push subscription deleted successfully'
            ]);

        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function deleteDeviceSubscription($userId, $deviceInfo = null) {
        try {
          
            // Get user agent from device info or current request
            $userAgent = $deviceInfo['user_agent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? '';
            
            if (empty($userAgent)) {
                throw new Exception("User agent is required for device-specific unsubscribe");
            }
            
           
            
            // Delete only the subscription for this specific user on this specific device
            $sql = "DELETE FROM tbl_push_subscriptions WHERE user_id = :user_id AND user_agent = :user_agent";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':user_agent', $userAgent, PDO::PARAM_STR);
            $stmt->execute();
            
            $deletedCount = $stmt->rowCount();
            

            return json_encode([
                'status' => 'success',
                'message' => 'Push subscription for this device deleted successfully',
                'deleted_count' => $deletedCount
            ]);

        } catch (Exception $e) {
            error_log("Error in deleteDeviceSubscription: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function getSubscription($userId, $deviceInfo = null) {
        try {
            // Always perform a device-specific lookup using provided device_info
            // or the current request's User-Agent if device_info is missing.
            $userAgent = $deviceInfo['user_agent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? '';
            $deviceType = $deviceInfo['device_type'] ?? $this->detectDeviceType($userAgent);
            $deviceOS = $deviceInfo['device_os'] ?? $this->detectOS($userAgent);
            $browser = $deviceInfo['browser'] ?? $this->detectBrowser($userAgent);

            // 1) Try to find a subscription tied to this exact device for this specific user (user_id + user_agent)
            $sqlDevice = "SELECT * FROM tbl_push_subscriptions WHERE user_id = :user_id AND user_agent = :user_agent LIMIT 1";
            $stmtDevice = $this->conn->prepare($sqlDevice);
            $stmtDevice->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmtDevice->bindParam(':user_agent', $userAgent, PDO::PARAM_STR);
            $stmtDevice->execute();
            $deviceSubscription = $stmtDevice->fetch(PDO::FETCH_ASSOC);

            // 2) Also load any latest subscription for the user (other devices)
            $sqlAny = "SELECT * FROM tbl_push_subscriptions 
                       WHERE user_id = :user_id 
                       ORDER BY updated_at DESC, created_at DESC
                       LIMIT 1";
            $stmtAny = $this->conn->prepare($sqlAny);
            $stmtAny->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmtAny->execute();
            $anySubscription = $stmtAny->fetch(PDO::FETCH_ASSOC);

            // Derive flags
            $hasDeviceSubscription = !!$deviceSubscription;
            $deviceMatchesUser = $hasDeviceSubscription && ($deviceSubscription['user_id'] == $userId);
            $isActive = $hasDeviceSubscription ? ($deviceSubscription['is_active'] == 1) : false;
            $keysPresent = $hasDeviceSubscription 
                ? (!empty($deviceSubscription['p256dh_key']) && !empty($deviceSubscription['auth_key']))
                : false;
            $endpointPresent = $hasDeviceSubscription ? !empty($deviceSubscription['endpoint']) : false;

            $needResubscribe = false;
            $reason = '';
            if (!$hasDeviceSubscription) {
                $needResubscribe = false; // No subscription exists for this device, show subscribe button
                $reason = 'no_device_subscription';
            } elseif (!$deviceMatchesUser) {
                $needResubscribe = false; // Different user's subscription on this device, show subscribe button
                $reason = 'different_user_subscription';
            } elseif (!$isActive) {
                $needResubscribe = true;
                $reason = 'inactive_subscription';
            } elseif (!$keysPresent || !$endpointPresent) {
                $needResubscribe = true;
                $reason = !$keysPresent ? 'missing_keys' : 'missing_endpoint';
            }

            // Prefer device-specific data when available; otherwise, return the latest user subscription for visibility
            $data = $deviceSubscription ?: ($anySubscription ?: []);

            return json_encode([
                'status' => 'success',
                'data' => $deviceMatchesUser ? $deviceSubscription : [],
                'is_active' => $deviceMatchesUser ? $isActive : false,
                'device_match' => $deviceMatchesUser,
                'need_resubscribe' => $needResubscribe,
                'reason' => $reason,
                'device_fingerprint' => [
                    'device_type' => $deviceType,
                    'device_os' => $deviceOS,
                    'browser' => $browser,
                    'user_agent' => $userAgent,
                ]
            ]);

        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }

    public function getAllSubscriptions() {
        try {
            $sql = "SELECT ps.*, u.users_fname, u.users_mname, u.users_lname 
                    FROM tbl_push_subscriptions ps 
                    LEFT JOIN tbl_users u ON ps.user_id = u.users_id 
                    WHERE ps.is_active = 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();

            $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return json_encode([
                'status' => 'success',
                'data' => $subscriptions
            ]);

        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return json_encode([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
    }
}

// Handle the request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $input = file_get_contents('php://input');
    
    $data = json_decode($input, true);
    $jsonError = json_last_error();
    if ($jsonError !== JSON_ERROR_NONE) {
        error_log("JSON decode error: " . json_last_error_msg());
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON data']);
        exit;
    }
    
    
    
    // Check if database connection exists
    if (!isset($conn) || !$conn) {
        error_log("DATABASE CONNECTION FAILED - conn is not available");
        echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
        exit;
    }
    
    
    
    $manager = new PushSubscriptionManager($conn);
    
    $operation = $data['operation'] ?? 'save';
    $userId = $data['user_id'] ?? null;
    $subscriptionData = $data['subscription'] ?? null;
    $deviceInfo = $data['device_info'] ?? null;
    
    

    switch ($operation) {
        case 'save':
            if ($userId === null || $subscriptionData === null) {
                echo json_encode(['status' => 'error', 'message' => 'User ID and subscription data are required']);
                break;
            }
            $result = $manager->saveSubscription($userId, $subscriptionData, $deviceInfo);
            echo $result;
            break;

			case 'repair':
				if ($userId === null || $subscriptionData === null) {
					echo json_encode(['status' => 'error', 'message' => 'User ID and subscription data are required']);
					break;
				}
				echo $manager->repairSubscription($userId, $subscriptionData, $deviceInfo);
				break;

        case 'delete':
            if ($userId === null) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            echo $manager->deleteSubscription($userId);
            break;

        case 'deleteDevice':
            if ($userId === null) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            echo $manager->deleteDeviceSubscription($userId, $deviceInfo);
            break;

        case 'get':
            if ($userId === null) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            // Pass device info to getSubscription method if provided
            echo $manager->getSubscription($userId, $deviceInfo);
            break;

        case 'getAll':
            echo $manager->getAllSubscriptions();
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid operation']);
            break;
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
} 