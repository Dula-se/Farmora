import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { doc, setDoc, getDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Remote push notifications were removed from Expo Go Android in SDK 53+.
// Loading expo-notifications on Android in Expo Go throws an unhandled exception.
export const isAndroidExpoGo = isExpoGo && Platform.OS === 'android';

// Safely require expo-notifications only in environments where it is supported
let Notifications: typeof import('expo-notifications') | null = null;

if (!isAndroidExpoGo) {
  try {
    Notifications = require('expo-notifications');
    // Configure foreground notification presentation when available
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('[Notifications] Could not load expo-notifications module:', e);
  }
}

export { Notifications };

// ─── Android Channel ──────────────────────────────────────────────────────────
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || isAndroidExpoGo || !Notifications) return;

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Farmora Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E5E3A',
      enableVibrate: true,
      showBadge: true,
    });
  } catch (e) {
    console.warn('[Notifications] Could not set up Android channel:', e);
  }
}

// ─── Permission Request ───────────────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  if (isAndroidExpoGo || !Notifications) return false;

  if (!Device.isDevice) {
    console.warn('[Notifications] Must run on a physical device.');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted.');
      return false;
    }

    return true;
  } catch (e) {
    console.warn('[Notifications] Could not request permissions:', e);
    return false;
  }
}

// ─── Token Registration ───────────────────────────────────────────────────────
/**
 * Gets the Expo Push Token for this device and stores it in Firestore
 * under /users/{userId}/pushTokens document.
 */
export async function registerForPushNotifications(userId?: string): Promise<string | null> {
  if (isAndroidExpoGo || !Notifications) {
    console.log('[Notifications] Push notifications disabled in Expo Go. Use development build (npx expo run:android).');
    return null;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  await setupAndroidChannel();

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log('[Notifications] Running without EAS projectId. Remote push notifications require a development build (npx eas build).');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log('[Notifications] Expo Push Token:', token);

    // Persist token to Firestore if a userId is provided
    if (userId && token) {
      await saveTokenToFirestore(userId, token);
    }

    return token;
  } catch (err) {
    console.error('[Notifications] Failed to get push token:', err);
    return null;
  }
}

// ─── Firestore Token Storage ──────────────────────────────────────────────────
/**
 * Saves the device push token to Firestore.
 * Path: /users/{userId}  (merged so it doesn't overwrite other fields)
 */
export async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        pushToken: token,
        pushTokenUpdatedAt: serverTimestamp(),
        platform: Platform.OS,
      },
      { merge: true }
    );
    console.log('[Notifications] Token saved to Firestore for user:', userId);
  } catch (err) {
    console.error('[Notifications] Failed to save token to Firestore:', err);
  }
}

// ─── Remote FCM / Expo Push Sender ───────────────────────────────────────────
/**
 * Sends a real-time push notification to a recipient user using their FCM/Expo token
 * and creates an in-app notification entry in Firestore.
 */
export async function sendFcmPushNotification(params: {
  recipientUserId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<boolean> {
  try {
    const { recipientUserId, title, body, data } = params;
    if (!recipientUserId) return false;

    // 1. Fetch recipient's token from Firestore users collection
    const userDocRef = doc(db, 'users', recipientUserId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return false;

    const userData = userSnap.data();
    const token = userData?.pushToken || userData?.fcmToken;

    // 2. Persist in-app notification record in Firestore for real-time notification listener
    try {
      const notifCol = collection(db, 'users', recipientUserId, 'notifications');
      const newNotifDoc = doc(notifCol);
      await setDoc(newNotifDoc, {
        id: newNotifDoc.id,
        title,
        body,
        data: data || {},
        createdAt: serverTimestamp(),
        isRead: false,
      });
    } catch {}

    // 3. Send remote push notification via Expo Push Notification service
    if (token && typeof token === 'string') {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            to: token,
            title,
            body,
            data: data || {},
            sound: 'default',
            priority: 'high',
            channelId: 'default',
          }),
        });
        console.log('[Notifications] FCM push notification delivered to:', recipientUserId);
      } catch (pushErr) {
        console.warn('[Notifications] Push delivery error:', pushErr);
      }
    }

    return true;
  } catch (err) {
    console.warn('[Notifications] sendFcmPushNotification error:', err);
    return false;
  }
}

// ─── Local Notification Helpers ───────────────────────────────────────────────
/**
 * Schedule an immediate local notification (useful for testing).
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> {
  if (!Notifications) return '';
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: true,
    },
    trigger: null, // fire immediately
  });
}

/**
 * Schedule a notification at a future time.
 */
export async function scheduleNotification(
  title: string,
  body: string,
  date: Date,
  data?: Record<string, unknown>
): Promise<string> {
  if (!Notifications) return '';
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

/** Cancel all scheduled notifications. */
export async function cancelAllNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Clear the app badge count (iOS). */
export async function clearBadge(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {}
}
