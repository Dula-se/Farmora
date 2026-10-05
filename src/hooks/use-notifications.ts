import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import type { Subscription } from 'expo-notifications';
import { registerForPushNotifications, clearBadge } from '@/services/notifications';

export interface NotificationState {
  /** The current Expo Push Token for this device */
  expoPushToken: string | null;
  /** The most recently received notification (while app was foregrounded) */
  notification: Notifications.Notification | null;
  /** The last notification response (tap/interaction) */
  notificationResponse: Notifications.NotificationResponse | null;
  /** Whether push token registration is in progress */
  isRegistering: boolean;
  /** Any error that occurred during registration */
  error: string | null;
}

/**
 * useNotifications — full lifecycle hook for Expo push notifications.
 *
 * @param userId  Optional Firestore user ID; if provided, the push token
 *                is automatically persisted to /users/{userId} on registration.
 *
 * Usage:
 *   const { expoPushToken, notification } = useNotifications(user?.id);
 */
export function useNotifications(userId?: string): NotificationState {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [notificationResponse, setNotificationResponse] =
    useState<Notifications.NotificationResponse | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Subscription | undefined>(undefined);
  const responseListener = useRef<Subscription | undefined>(undefined);

  const register = useCallback(async () => {
    setIsRegistering(true);
    setError(null);
    try {
      const token = await registerForPushNotifications(userId);
      setExpoPushToken(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      console.error('[useNotifications] Registration error:', err);
    } finally {
      setIsRegistering(false);
    }
  }, [userId]);

  useEffect(() => {
    // Register and get push token
    register();

    // Clear badge when app opens
    clearBadge().catch(() => {});

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (receivedNotification) => {
        setNotification(receivedNotification);
        console.log('[useNotifications] Received:', receivedNotification.request.content.title);
      }
    );

    // Listen for user tapping a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        setNotificationResponse(response);
        console.log(
          '[useNotifications] Response action:',
          response.actionIdentifier,
          'data:',
          response.notification.request.content.data
        );
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [register]);

  return {
    expoPushToken,
    notification,
    notificationResponse,
    isRegistering,
    error,
  };
}
