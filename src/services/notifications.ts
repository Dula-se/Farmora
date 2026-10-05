import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

// ─── Notification Handler (foreground behaviour) ─────────────────────────────
// Show alerts, play sound, and set badge even when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Android Channel ──────────────────────────────────────────────────────────
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Farmora Notifications',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1E5E3A',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

// ─── Permission Request ───────────────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Must run on a physical device.');
    return false;
  }

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
}

// ─── Token Registration ───────────────────────────────────────────────────────
/**
 * Gets the Expo Push Token for this device and stores it in Firestore
 * under /users/{userId}/pushTokens document.
 */
export async function registerForPushNotifications(userId?: string): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  await setupAndroidChannel();

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log('[Notifications] Running in Expo Go without EAS projectId. Remote push notifications require a development build (npx eas build).');
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

// ─── Local Notification Helpers ───────────────────────────────────────────────
/**
 * Schedule an immediate local notification (useful for testing).
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
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
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

/** Cancel all scheduled notifications. */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Clear the app badge count (iOS). */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
