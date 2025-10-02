<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

class Login {
    private $conn;
    private $MAX_ATTEMPTS = 3;
    private $BLOCK_DURATION = 3; // minutes

    public function __construct() {
        include 'connection-pdo.php'; // Include your database connection
        $this->conn = $conn;
    }

    private function checkPassword($inputPassword, $storedHash) {
        // Try direct comparison first
        if ($inputPassword === $storedHash) {
            return true;
        }
        // Try password_verify
        $verified = password_verify($inputPassword, $storedHash);
        return $verified;
    }

    public function handleLoginAttempt($username, $isSuccessful) {
        try {
            if ($isSuccessful) {
                // On successful login, reset any existing failed attempts
                $delete_sql = "DELETE FROM tbl_loginfailed WHERE User_schoolid = :username";    
                $stmt = $this->conn->prepare($delete_sql);
                $stmt->bindParam(':username', $username);
                $stmt->execute();
                return true;
            }

            // First check for expired attempts
            $expired = $this->fetchFailedLoginExpired($username);
            if ($expired) {
                // Delete all existing records for this username first
                $delete_sql = "DELETE FROM tbl_loginfailed WHERE User_schoolid = :username";
                $stmt = $this->conn->prepare($delete_sql);
                $stmt->bindParam(':username', $username);
                $stmt->execute();

                // Then create a new attempt
                $insert_sql = "INSERT INTO tbl_loginfailed (User_schoolid, User_loginattempt, Login_until) 
                              VALUES (:username, 1, NULL)";
                $stmt = $this->conn->prepare($insert_sql);
                $stmt->bindParam(':username', $username);
                $stmt->execute();
                return false;
            }

            // Get the latest record for this user if any exists
            $check_sql = "SELECT loginfailed_id, User_schoolid, User_loginattempt, Login_until 
                         FROM tbl_loginfailed 
                         WHERE User_schoolid = :username 
                         ORDER BY loginfailed_id DESC 
                         LIMIT 1";
            $stmt = $this->conn->prepare($check_sql);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            $latest_record = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($latest_record) {
                // Update existing record with incremented attempts
                $new_attempts = $latest_record['User_loginattempt'] + 1;
                
                if ($new_attempts >= $this->MAX_ATTEMPTS) {
                    // Set block duration when max attempts reached
                    date_default_timezone_set('Asia/Manila');
                    $block_until = (new DateTime())->add(new DateInterval('PT' . $this->BLOCK_DURATION . 'M'))->format('Y-m-d H:i:s');
                    
                    $update_sql = "UPDATE tbl_loginfailed 
                                 SET User_loginattempt = :attempts,
                                     Login_until = :block_until 
                                 WHERE loginfailed_id = :id";
                    $stmt = $this->conn->prepare($update_sql);
                    $stmt->bindParam(':attempts', $new_attempts);
                    $stmt->bindParam(':block_until', $block_until);
                    $stmt->bindParam(':id', $latest_record['loginfailed_id']);
                    $stmt->execute();
                } else {
                    $update_sql = "UPDATE tbl_loginfailed 
                                 SET User_loginattempt = :attempts 
                                 WHERE loginfailed_id = :id";
                    $stmt = $this->conn->prepare($update_sql);
                    $stmt->bindParam(':attempts', $new_attempts);
                    $stmt->bindParam(':id', $latest_record['loginfailed_id']);
                    $stmt->execute();
                }
            } else {
                // No previous attempts, create new record
                $insert_sql = "INSERT INTO tbl_loginfailed (User_schoolid, User_loginattempt, Login_until) 
                              VALUES (:username, 1, NULL)";
                $stmt = $this->conn->prepare($insert_sql);
                $stmt->bindParam(':username', $username);
                $stmt->execute();
            }

            return false;

        } catch (PDOException $e) {
            return false;
        }
    }
    
    
    

    private function isAccountBlocked($username) {
        date_default_timezone_set('Asia/Manila');
        
        $sql = "SELECT Login_until FROM tbl_loginfailed 
                WHERE User_schoolid = :username 
                AND User_loginattempt >= :max_attempts 
                AND Login_until > NOW()";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':max_attempts', $this->MAX_ATTEMPTS);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            $now = new DateTime();
            $until = new DateTime($result['Login_until']);
            $diff = $now->diff($until);
            $minutes = ($diff->days * 24 * 60) + ($diff->h * 60) + $diff->i;
            return [
                'blocked' => true,
                'minutes_remaining' => $minutes
            ];
        }
        
        return ['blocked' => false];
    }
    

    function login($json)
    {
        include "connection-pdo.php";
        $json = json_decode($json, true);

        try {
            // Check if account is blocked
            $blockStatus = $this->isAccountBlocked($json['username']);
            if ($blockStatus['blocked']) {
                return json_encode([
                    'status' => 'error', 
                    'message' => "Account is temporarily blocked. Please try again after {$blockStatus['minutes_remaining']} minutes."
                ]);
            }
            
            // Single query to check user in tbl_users with JOIN to get user level, department, and title info
            $sql = "SELECT u.*, ul.user_level_name, ul.user_level_desc, d.departments_name, t.abbreviation AS title_abbreviation 
                    FROM tbl_users u
                    LEFT JOIN tbl_user_level ul ON u.users_user_level_id = ul.user_level_id
                    LEFT JOIN tbl_departments d ON u.users_department_id = d.departments_id
                    LEFT JOIN titles t ON u.title_id = t.id
                    WHERE u.users_school_id = :username";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':username', $json['username']);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Verify password and active status
                if ($this->checkPassword($json['password'], $user['users_password']) && $user['is_active'] == 1) {
                    $this->handleLoginAttempt($json['username'], true);
                    
                    // Map user level names based on users_user_level_id
                    $userLevelMap = [
                        1 => 'Admin',
                        2 => 'Personnel',
                        3 => 'Faculty/Staff',
                        4 => 'Super Admin',
                        5 => 'Dean',
                        6 => 'Secretary',
                        19 => 'Driver',
                        15 => 'School Head',
                        16 => 'SBO PRESIDENT',
                        17 => 'CSG PRESIDENT',
                        18 => 'Department Head',
                        
                    ];

                    // Audit the successful login
                    try {
                        date_default_timezone_set('Asia/Manila');
                        $fullName = trim(($user['users_fname'] ?? '') . ' ' . (empty($user['users_mname']) ? '' : ($user['users_mname'] . ' ')) . ($user['users_lname'] ?? ''));
                        $desc = 'User Logged in';
                        $action = 'LOGIN';
                        $created_by = (int)$user['users_id'];
                        $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
                        $auditStmt = $this->conn->prepare($auditSql);
                        $auditStmt->bindParam(':description', $desc, PDO::PARAM_STR);
                        $auditStmt->bindParam(':action', $action, PDO::PARAM_STR);
                        $auditStmt->bindParam(':created_by', $created_by, PDO::PARAM_INT);
                        $auditStmt->execute();
                    } catch (PDOException $e) {
                        // Intentionally ignore audit failures to not block login
                    }

                    return json_encode([ 
                        'status' => 'success',
                        'data' => [
                            'user_id' => $user['users_id'],
                            'firstname' => $user['users_fname'] ?? '',
                            'middlename' => $user['users_mname'] ?? '',
                            'lastname' => $user['users_lname'] ?? '',
                            'suffix' => $user['users_suffix'] ?? '',
                            'title_id' => $user['title_id'] ?? null,
                            'title_abbreviation' => $user['title_abbreviation'] ?? '',
                            'school_id' => $user['users_school_id'],
                            'contact_number' => $user['users_contact_number'],
                            'user_level_name' => $userLevelMap[$user['users_user_level_id']] ?? 'Unknown',
                            'user_level_desc' => $user['user_level_desc'],
                            'user_level_id' => $user['users_user_level_id'],
                            'department_id' => $user['users_department_id'],
                            'department_name' => $user['departments_name'],
                            'profile_pic' => $user['users_pic'],
                            'created_at' => $user['users_created_at'],
                            'updated_at' => $user['users_updated_at'],
                            'password' => $json['password'],
                            'email' => $user['users_email'],
                            'is_2FAactive' => $user['is_2FAactive'] ?? 0,
                            'first_login' => (bool)$user['first_login']
                        ]
                    ]);
                }
            }

            $this->handleLoginAttempt($json['username'], false);
            return json_encode(['status' => 'error', 'message' => 'Invalid credentials']);
            
        } catch (PDOException $e) {
            return json_encode(['status' => 'error', 'message' => 'Database error']);
        }
    }

    public function fetchFailedLoginExpired($username) {
        try {
            $sql = "SELECT loginfailed_id, User_schoolid, User_loginattempt, Login_until 
                    FROM tbl_loginfailed 
                    WHERE User_schoolid = :username 
                    AND Login_until < NOW()";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return false;
        }
    }

    public function checkEmailExists($email) {
        try {
            if (!$this->conn) {
                throw new PDOException("Database connection not established");
            }
            
            $check_sql = "SELECT users_email FROM tbl_users WHERE users_email = :email";
            
            $stmt = $this->conn->prepare($check_sql);
            if (!$stmt) {
                throw new PDOException("Failed to prepare statement");
            }
            
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            
            if (!$stmt->execute()) {
                throw new PDOException("Failed to execute statement");
            }
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return json_encode([
                    'status' => 'exists',
                    'message' => 'Email exists in users table'
                ]);
            }
            
            return json_encode([
                'status' => 'available',
                'message' => 'Email is available'
            ]);

        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error while checking email: ' . $e->getMessage()
            ]);
        } catch (Exception $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'An unexpected error occurred'
            ]);
        }
    }

    public function updateFirstLogin($users_id) {
        try {
            $sql = "UPDATE tbl_users SET first_login = 0 WHERE users_id = :users_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':users_id', $users_id, PDO::PARAM_INT);
            $stmt->execute();
            return json_encode([
                'status' => 'success',
                'message' => 'First login updated successfully.'
            ]);
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error while updating first_login.'
            ]);
        }
    }

    public function logout($users_id) {
        try {
            date_default_timezone_set('Asia/Manila');
            $desc = 'User Logged out';
            $action = 'LOGOUT';
            $created_by = (int)$users_id;

            $auditSql = "INSERT INTO audit_log (description, action, created_at, created_by) VALUES (:description, :action, NOW(), :created_by)";
            $auditStmt = $this->conn->prepare($auditSql);
            $auditStmt->bindParam(':description', $desc, PDO::PARAM_STR);
            $auditStmt->bindParam(':action', $action, PDO::PARAM_STR);
            $auditStmt->bindParam(':created_by', $created_by, PDO::PARAM_INT);
            $auditStmt->execute();

            return json_encode([
                'status' => 'success',
                'message' => 'Logout recorded successfully.'
            ]);
        } catch (PDOException $e) {
            return json_encode([
                'status' => 'error',
                'message' => 'Database error while recording logout.'
            ]);
        }
    }

   
 


    public function updatePassword($email, $newPassword) {
        try {
            // Check if the email exists in tbl_users
            $stmt = $this->conn->prepare("SELECT users_password FROM tbl_users WHERE users_email = :email");
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            
            if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Check if new password matches current password
                if (password_verify($newPassword, $row['users_password'])) {
                    return [
                        "status" => "error",
                        "message" => "Cannot use the current password. Please choose a different password."
                    ];
                }

                // Update password
                $hashedNewPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                $updateStmt = $this->conn->prepare("UPDATE tbl_users SET users_password = :password WHERE users_email = :email");
                $updateStmt->bindParam(':password', $hashedNewPassword);
                $updateStmt->bindParam(':email', $email);
                $updateStmt->execute();

                if ($updateStmt->rowCount() > 0) {
                    // Delete used OTP after successful password update
                    $deleteStmt = $this->conn->prepare("DELETE FROM password_reset_otp WHERE password_otp_email_address = ?");
                    $deleteStmt->execute([$email]);

                    return [
                        "status" => "success",
                        "message" => "Password successfully updated"
                    ];
                }
            }

            return [
                "status" => "error",
                "message" => "Email not found in users table"
            ];

        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to update password: " . $e->getMessage()
            ];
        }
    }

    public function updateAuthPeriod($user_id) {
        try {
            // Calculate new authentication period (7 days from now)
            $auth_until = (new DateTime())->modify('+7 days')->format('Y-m-d H:i:s');
            
            // Update the authentication period for the user
            $stmt = $this->conn->prepare("UPDATE user_authenticate 
                SET user_authenticate_until = :auth_until 
                WHERE user_id = :user_id
                AND authenticate_otp_exp > NOW()
                ORDER BY authenticate_otp_exp DESC
                LIMIT 1");
            
            $stmt->bindParam(':auth_until', $auth_until);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return [
                    "status" => "success",
                    "message" => "Authentication period updated successfully",
                    "authenticated_until" => $auth_until
                ];
            } else {
                return [
                    "status" => "error",
                    "message" => "No valid authentication record found for this user"
                ];
            }
        } catch (Exception $e) {
            return [
                "status" => "error",
                "message" => "Failed to update authentication period: " . $e->getMessage()
            ];
        }
    }



public function fetch2FA($user_id) {
    try {
        // Get current time in Asia/Manila timezone
        $timezone = new DateTimeZone('Asia/Manila');
        $current_time = new DateTime('now', $timezone);
        
        // Check 2FA status in tbl_user_2fa
        $stmt = $this->conn->prepare("
            SELECT id, user_id, expires_at 
            FROM tbl_user_2fa 
            WHERE user_id = :user_id 
            LIMIT 1
        ");
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_STR);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            // Parse expires_at in Asia/Manila timezone
            $expires_at = new DateTime($result['expires_at'], $timezone);
            
            // Check if expired (expires_at is in the past)
            if ($expires_at < $current_time) {
                return [
                    "status" => "expired",
                    "message" => "2FA has expired",
                    "requires_verification" => true,
                    "expires_at" => $result['expires_at']
                ];
            }
            
            return [
                "status" => "success",
                "id" => $result['id'],
                "user_id" => $result['user_id'],
                "expires_at" => $result['expires_at'],
                "requires_verification" => false
            ];
        }
        
        return [
            "status" => "success",
            "message" => "No 2FA record found; verification not required",
            "requires_verification" => false
        ];
        
    } catch (Exception $e) {
        return [
            "status" => "error",
            "message" => "Error fetching 2FA status: " . $e->getMessage(),
            "requires_verification" => true
        ];
    }
}

public function check2FAStatus($user_id) {
    try {
        // First get user email from multiple tables
        $email = null;
        $tables = [
            ['table' => 'tbl_admin', 'id_field' => 'admin_id', 'email_field' => 'admin_email'],
            ['table' => 'tbl_personnel', 'id_field' => 'personnel_id', 'email_field' => 'personnel_email'],
            ['table' => 'tbl_department_dean', 'id_field' => 'department_dean_id', 'email_field' => 'department_dean_email'],
            ['table' => 'tbl_faculty_staff', 'id_field' => 'faculty_staff_id', 'email_field' => 'faculty_staff_email'],
            ['table' => 'tbl_driver', 'id_field' => 'driver_id', 'email_field' => 'driver_email']
        ];

        foreach ($tables as $tableInfo) {
            $stmt = $this->conn->prepare("SELECT {$tableInfo['email_field']} as email FROM {$tableInfo['table']} WHERE {$tableInfo['id_field']} = :user_id LIMIT 1");
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_STR);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result && !empty($result['email'])) {
                $email = $result['email'];
                break;
            }
        }

        if (!$email) {
            return [
                "status" => "error",
                "message" => "User email not found",
                "requires_2fa" => false
            ];
        }

        // Check 2FA status in tbl_user_2fa
        $stmt = $this->conn->prepare("
            SELECT user_id, is_active 
            FROM tbl_user_2fa 
            WHERE user_id = :user_id AND is_active = 1
            LIMIT 1
        ");
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_STR);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            return [
                "status" => "success",
                "requires_2fa" => true,
                "email" => $email
            ];
        } else {
            return [
                "status" => "success",
                "requires_2fa" => false,
                "email" => $email
            ];
        }
        
    } catch (Exception $e) {
        return [
            "status" => "error",
            "message" => "Error checking 2FA status: " . $e->getMessage(),
            "requires_2fa" => false
        ];
    }
}

}

// Handle the request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON data']);
        exit;
    }

    $operation = $input['operation'] ?? '';
    $json = isset($input['json']) ? json_encode($input['json']) : '';

    if (empty($operation) || empty($json)) {
        echo json_encode(['status' => 'error', 'message' => 'Operation or JSON data is missing']);
        exit;
    }

    $login = new Login();

    switch ($operation) {

        case 'fetch2FA':
            $user_id = isset($input['json']['user_id']) ? $input['json']['user_id'] : '';
            
            if ($user_id === '') {
                echo json_encode(["status" => "error", "message" => "User ID is required"]);
                exit;
            }
            $result = $login->fetch2FA($user_id);
            echo json_encode($result);
            break;
            
        case 'send_password_reset_otp':
            $email = $input['email'] ?? '';
            if (empty($email)) {
                echo json_encode(["status" => "error", "message" => "Email is required"]);
                exit;
            }
            $result = $login->sendPasswordResetOTP($email);
            echo json_encode($result);
            break;
        case 'validate_otp':
            $otp = $input['otp'] ?? '';
            $email = $input['email'] ?? '';
            
            if (empty($otp) || empty($email)) {
                echo json_encode(["status" => "error", "message" => "OTP and email are required"]);
                exit;
            }
            $result = $login->validateOTPKey($otp, $email);
            echo json_encode($result);
            break;
        case 'sendLoginOTP':
            $user_id = isset($input['json']['id']) ? $input['json']['id'] : '';  // Updated to get ID from json object
            if ($user_id === '') {  // Changed condition to check for empty string
                echo json_encode(["status" => "error", "message" => "User ID is required"]);
                exit;
            }
            $result = $login->sendLoginOTP($user_id);
            echo json_encode($result);
            break;
        case 'validateLoginOTP':
            $username = isset($input['json']['id']) ? $input['json']['id'] : '';
            $otp = isset($input['json']['otp']) ? $input['json']['otp'] : '';
            
            if ($username === '' || $otp === '') {
                echo json_encode(["status" => "error", "message" => "Username and OTP are required"]);
                exit;
            }
            $result = $login->validateLoginOTP($username, $otp);
            echo json_encode($result);
            break;
        case 'updateAuthPeriod':
            $user_id = isset($input['json']['user_id']) ? $input['json']['user_id'] : '';
            
            if ($user_id === '') {
                echo json_encode(["status" => "error", "message" => "User ID is required"]);
                exit;
            }
            $result = $login->updateAuthenticationPeriod($user_id);
            echo json_encode($result);
            break;
        case 'fetch2FA':
            $user_id = isset($input['json']['user_id']) ? $input['json']['user_id'] : '';
            
            if ($user_id === '') {
                echo json_encode(["status" => "error", "message" => "User ID is required"]);
                exit;
            }
            $result = $login->fetch2FA($user_id);
            echo json_encode($result);
            break;
        case 'check_2fa_status':
            $user_id = isset($input['json']['user_id']) ? $input['json']['user_id'] : '';
            
            if ($user_id === '') {
                echo json_encode(["status" => "error", "message" => "User ID is required"]);
                exit;
            }
            $result = $login->check2FAStatus($user_id);
            echo json_encode($result);
            break;
        case "admin":
        case "user":
        case "login":
            echo $login->login($json);
            break;      
        case "logout":
            $users_id = $input['json']['users_id'] ?? '';
            if (empty($users_id)) {
                echo json_encode(['status' => 'error', 'message' => 'users_id is required']);
                break;
            }
            echo $login->logout($users_id);
            break;
        case "fetchFailedLoginExpired":
            $username = $input['json']['username'] ?? '';
            if (empty($username)) {
                echo json_encode(['status' => 'error', 'message' => 'Username is required']);
                break;
            }
            $result = $login->fetchFailedLoginExpired($username);
            echo json_encode([
                'status' => 'success',
                'data' => $result
            ]);
            break;
        case "checkEmail":
            $email = $input['json']['email'] ?? '';
            if (empty($email)) {
                echo json_encode(['status' => 'error', 'message' => 'Email is required']);
                break;
            }
            echo $login->checkEmailExists($email);
            break;
        case "updateFirstLogin":
            $users_id = $input['json']['users_id'] ?? '';
            if (empty($users_id)) {
                echo json_encode(['status' => 'error', 'message' => 'users_id is required']);
                break;
            }
            echo $login->updateFirstLogin($users_id);
            break;
        case "send_password_reset_otp":
            $email = $input['json']['email'] ?? '';
            if (empty($email)) {
                echo json_encode(['status' => 'error', 'message' => 'Email is required']);
                break;
            }
            $result = $login->send_password_reset_otp($email);
            echo json_encode($result);
            break;
        case "validate_otp":
            $otp = $input['json']['otp'] ?? '';
            $email = $input['json']['email'] ?? '';
            if (empty($otp) || empty($email)) {
                echo json_encode(['status' => 'error', 'message' => 'OTP and email are required']);
                break;
            }
            $result = $login->validate_otp($otp, $email);
            echo json_encode($result);
            break;
        case "update_password":
            $email = $input['json']['email'] ?? '';
            $newPassword = $input['json']['new_password'] ?? '';
            if (empty($email) || empty($newPassword)) {
                echo json_encode(['status' => 'error', 'message' => 'Email and new password are required']);
                break;
            }
            $result = $login->updatePassword($email, $newPassword);
            echo json_encode($result);
            break;
        case "sendLoginOTP":
            $user_id = $input['json']['id'] ?? $input['json']['user_id'] ?? '';
            $otp = $input['json']['otp'] ?? null;
            $email = $input['json']['email'] ?? null;
            if (empty($user_id)) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            $result = $login->sendLoginOTP($user_id, $otp, $email);
            echo json_encode($result);
            break;
        case "validateLoginOTP":
            $user_id = $input['json']['user_id'] ?? '';
            $otp = $input['json']['otp'] ?? '';
            $email = $input['json']['email'] ?? null;
            if (empty($user_id) || empty($otp)) {
                echo json_encode(['status' => 'error', 'message' => 'User ID and OTP are required']);
                break;
            }
            $result = $login->validateLoginOTP($user_id, $otp, $email);
            echo json_encode($result);
            break;
        case "updateAuthPeriod":
            $user_id = $input['json']['user_id'] ?? '';
            if (empty($user_id)) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            $result = $login->updateAuthPeriod($user_id);
            echo json_encode($result);
            break;
        case "fetch2FA":
            $user_id = $input['json']['user_id'] ?? '';
            if (empty($user_id)) {
                echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
                break;
            }
            $result = $login->fetch2FA($user_id);
            echo json_encode($result);
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid operation']);
            break;
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Handle preflight requests
    http_response_code(200);
    exit;
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
