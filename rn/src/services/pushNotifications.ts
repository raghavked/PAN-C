import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Push] Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Notification permission not granted');
    return null;
  }

  try {
    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.expoConfig?.extra?.expoProjectId ||
      (Constants as any).easConfig?.projectId;

    if (!projectId) {
      console.warn(
        '[Push] No Expo projectId found — Expo Push Token unavailable.\n' +
        '       Add EXPO_PROJECT_ID to Replit Secrets (get it from expo.dev).'
      );
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Push] Expo Push Token obtained:', token.data.substring(0, 50) + '...');
    return token.data;
  } catch (error) {
    console.error('[Push] getExpoPushTokenAsync failed:', (error as Error).message);
    return null;
  }
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
