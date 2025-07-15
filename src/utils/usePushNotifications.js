import { useState, useEffect, useCallback } from 'react';
import { SecureStorage } from './encryption';
import pushNotificationManager from './pushNotificationManager';

export const usePushNotifications = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState('default');
    const [isSupported, setIsSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize push notifications
    const initialize = useCallback(async () => {
        setIsLoading(true);
        try {
            const initialized = await pushNotificationManager.initialize();
            setIsInitialized(initialized);
            setIsSupported(pushNotificationManager.isSupported);
            
            if (initialized) {
                const status = await pushNotificationManager.getSubscriptionStatus();
                setIsSubscribed(status.subscribed);
                setPermission(status.permission);
            }
        } catch (error) {
            console.error('Failed to initialize push notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async (userId) => {
        setIsLoading(true);
        try {
            const subscribed = await pushNotificationManager.subscribe(userId);
            setIsSubscribed(subscribed);
            if (subscribed) {
                setPermission('granted');
            }
            return subscribed;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        setIsLoading(true);
        try {
            const unsubscribed = await pushNotificationManager.unsubscribe();
            setIsSubscribed(!unsubscribed);
            return unsubscribed;
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Send notification to user
    const sendNotificationToUser = useCallback(async (userId, title, body, data = {}) => {
        try {
            return await pushNotificationManager.sendNotificationToUser(userId, title, body, data);
        } catch (error) {
            console.error('Failed to send notification to user:', error);
            return false;
        }
    }, []);

    // Send notification to department
    const sendNotificationToDepartment = useCallback(async (departmentId, userLevelId, title, body, data = {}) => {
        try {
            return await pushNotificationManager.sendNotificationToDepartment(departmentId, userLevelId, title, body, data);
        } catch (error) {
            console.error('Failed to send notification to department:', error);
            return false;
        }
    }, []);

    // Test notification
    const testNotification = useCallback(async () => {
        try {
            return await pushNotificationManager.testNotification();
        } catch (error) {
            console.error('Failed to test notification:', error);
            return false;
        }
    }, []);

    // Auto-initialize on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    return {
        isInitialized,
        isSubscribed,
        permission,
        isSupported,
        isLoading,
        initialize,
        subscribe,
        unsubscribe,
        sendNotificationToUser,
        sendNotificationToDepartment,
        testNotification
    };
}; 