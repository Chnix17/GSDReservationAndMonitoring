<?php
/**
 * Pusher Configuration for GSD Reservation Chat System
 * 
 * This file contains the Pusher credentials and configuration
 * for real-time chat functionality using Pusher Channels.
 */

// Pusher Configuration
define('PUSHER_APP_ID', '2060281');
define('PUSHER_KEY', '838be046a73c19032b25');
define('PUSHER_SECRET', 'd1c5bf74c1d0e5d0f49f');
define('PUSHER_CLUSTER', 'ap1');

// Pusher Options
$pusher_options = [
    'cluster' => PUSHER_CLUSTER,
    'useTLS' => true,
    'encrypted' => true
];

// Initialize Pusher instance (to be used in other files)
function getPusherInstance() {
    require_once __DIR__ . '/vendor/autoload.php';
    
    global $pusher_options;
    
    return new Pusher\Pusher(
        PUSHER_KEY,
        PUSHER_SECRET,
        PUSHER_APP_ID,
        $pusher_options
    );
}

// Channel naming conventions
define('CHAT_CHANNEL_PREFIX', 'chat-');
define('PRESENCE_CHANNEL_PREFIX', 'presence-chat-');

/**
 * Generate a chat channel name for two users
 * Uses consistent naming regardless of who initiates the chat
 */
function getChatChannelName($user1_id, $user2_id) {
    $ids = [$user1_id, $user2_id];
    sort($ids);
    return CHAT_CHANNEL_PREFIX . implode('-', $ids);
}

/**
 * Generate a presence channel name for user status
 */
function getPresenceChannelName($user_id) {
    return PRESENCE_CHANNEL_PREFIX . $user_id;
}
