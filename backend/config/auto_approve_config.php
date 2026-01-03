<?php
/**
 * Auto-Approve Department Configuration
 * Configuration for the automated department approval system
 */

// Default Configuration Values
define('DEFAULT_POLICY_DAYS', 3);
define('DEFAULT_TRIGGER_HOURS', 24);
define('DEFAULT_TIMEZONE', 'Asia/Manila');
define('DEFAULT_LOG_FILE', __DIR__ . '/../server/auto_approve_department.log');
define('DEFAULT_ENABLE_NOTIFICATIONS', true);
define('DEFAULT_ENABLE_PUSH', true);
define('DEFAULT_ENABLED', true);

// Configuration Validation Constraints
define('MIN_POLICY_DAYS', 1);
define('MAX_POLICY_DAYS', 30);
define('MIN_TRIGGER_HOURS', 1);
define('MAX_TRIGGER_HOURS', 72);

/**
 * Get the auto-approve configuration
 * Returns configuration array with validated values
 * 
 * @return array Configuration array with all settings
 */
function getAutoApproveConfig() {
    // Base configuration with defaults
    $config = [
        'policy_days' => DEFAULT_POLICY_DAYS,
        'trigger_hours' => DEFAULT_TRIGGER_HOURS,
        'timezone' => DEFAULT_TIMEZONE,
        'log_file' => DEFAULT_LOG_FILE,
        'enable_notifications' => DEFAULT_ENABLE_NOTIFICATIONS,
        'enable_push' => DEFAULT_ENABLE_PUSH,
        'enabled' => DEFAULT_ENABLED
    ];
    
    // TODO: In future, can load from database or environment variables
    // For now, using defaults defined above
    
    // Validate configuration
    $config = validateAutoApproveConfig($config);
    
    return $config;
}

/**
 * Validate auto-approve configuration values
 * Ensures all configuration values are within acceptable ranges
 * 
 * @param array $config Configuration array to validate
 * @return array Validated configuration array
 * @throws InvalidArgumentException if validation fails
 */
function validateAutoApproveConfig($config) {
    $errors = [];
    
    // Validate policy_days
    if (!isset($config['policy_days'])) {
        $config['policy_days'] = DEFAULT_POLICY_DAYS;
    } else {
        $policyDays = filter_var($config['policy_days'], FILTER_VALIDATE_INT);
        if ($policyDays === false || $policyDays < MIN_POLICY_DAYS || $policyDays > MAX_POLICY_DAYS) {
            $errors[] = "policy_days must be an integer between " . MIN_POLICY_DAYS . " and " . MAX_POLICY_DAYS . ". Got: " . $config['policy_days'];
        } else {
            $config['policy_days'] = $policyDays;
        }
    }
    
    // Validate trigger_hours
    if (!isset($config['trigger_hours'])) {
        $config['trigger_hours'] = DEFAULT_TRIGGER_HOURS;
    } else {
        $triggerHours = filter_var($config['trigger_hours'], FILTER_VALIDATE_INT);
        if ($triggerHours === false || $triggerHours < MIN_TRIGGER_HOURS || $triggerHours > MAX_TRIGGER_HOURS) {
            $errors[] = "trigger_hours must be an integer between " . MIN_TRIGGER_HOURS . " and " . MAX_TRIGGER_HOURS . ". Got: " . $config['trigger_hours'];
        } else {
            $config['trigger_hours'] = $triggerHours;
        }
    }
    
    // Validate timezone
    if (!isset($config['timezone']) || empty($config['timezone'])) {
        $config['timezone'] = DEFAULT_TIMEZONE;
    } else {
        // Check if timezone is valid
        $validTimezones = timezone_identifiers_list();
        if (!in_array($config['timezone'], $validTimezones)) {
            $errors[] = "Invalid timezone: " . $config['timezone'] . ". Using default: " . DEFAULT_TIMEZONE;
            $config['timezone'] = DEFAULT_TIMEZONE;
        }
    }
    
    // Validate log_file path
    if (!isset($config['log_file']) || empty($config['log_file'])) {
        $config['log_file'] = DEFAULT_LOG_FILE;
    }
    
    // Validate boolean flags
    if (!isset($config['enable_notifications'])) {
        $config['enable_notifications'] = DEFAULT_ENABLE_NOTIFICATIONS;
    } else {
        $config['enable_notifications'] = filter_var($config['enable_notifications'], FILTER_VALIDATE_BOOLEAN);
    }
    
    if (!isset($config['enable_push'])) {
        $config['enable_push'] = DEFAULT_ENABLE_PUSH;
    } else {
        $config['enable_push'] = filter_var($config['enable_push'], FILTER_VALIDATE_BOOLEAN);
    }
    
    if (!isset($config['enabled'])) {
        $config['enabled'] = DEFAULT_ENABLED;
    } else {
        $config['enabled'] = filter_var($config['enabled'], FILTER_VALIDATE_BOOLEAN);
    }
    
    // If there are validation errors, throw exception
    if (!empty($errors)) {
        throw new InvalidArgumentException("Configuration validation failed:\n" . implode("\n", $errors));
    }
    
    return $config;
}

/**
 * Check if auto-approve system is enabled
 * 
 * @return bool True if enabled, false otherwise
 */
function isAutoApproveEnabled() {
    try {
        $config = getAutoApproveConfig();
        return $config['enabled'];
    } catch (Exception $e) {
        // If config fails to load, assume disabled
        return false;
    }
}

/**
 * Get configuration value by key
 * 
 * @param string $key Configuration key
 * @param mixed $default Default value if key not found
 * @return mixed Configuration value
 */
function getAutoApproveConfigValue($key, $default = null) {
    try {
        $config = getAutoApproveConfig();
        return isset($config[$key]) ? $config[$key] : $default;
    } catch (Exception $e) {
        return $default;
    }
}

?>
