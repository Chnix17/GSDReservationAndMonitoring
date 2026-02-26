<?php
/**
 * Push Notification Configuration
 * Centralized configuration for push notification service URLs
 */

// Push Notification Service URL
// define('PUSH_NOTIFICATION_URL', 'https://peachpuff-alligator-715719.hostingersite.com/gsd/api/server/send-push-notification.php');

// Alternative URLs for different environments (if needed)
define('PUSH_NOTIFICATION_URL', 'http://localhost/gsd-reservation-main/send-push-notification.php');
// define('PUSH_NOTIFICATION_URL', 'http://coc-studentinfo.net/gsd/grms/backend/server/send-push-notification.php');
// define('PUSH_NOTIFICATION_URL_STAGING', 'https://staging.example.com/gsd/api/server/send-push-notification.php');

/**
 * Get the push notification URL
 * @return string The push notification service URL
 */
function getPushNotificationUrl() {
    return PUSH_NOTIFICATION_URL;
}

/**
 * Get push notification URL for specific environment
 * @param string $environment The environment (production, local, staging)
 * @return string The push notification service URL
 */
function getPushNotificationUrlForEnvironment($environment = 'production') {
    switch ($environment) {
        case 'local':
            return defined('PUSH_NOTIFICATION_URL') ? PUSH_NOTIFICATION_URL : PUSH_NOTIFICATION_URL;
        case 'staging':
            return defined('PUSH_NOTIFICATION_URL_STAGING') ? PUSH_NOTIFICATION_URL_STAGING : PUSH_NOTIFICATION_URL;
        case 'production':
        default:
            return PUSH_NOTIFICATION_URL;
    }
}
?>