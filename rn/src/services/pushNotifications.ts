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

    // Build token options: use projectId if available (EAS), otherwise fall back
    // to experienceId (@owner/slug) which works in Expo Go without EAS setup
    let tokenOpts: Record<string, string>;
    if (projectId) {
      tokenOpts = { projectId };
    } else {
      const slug = Constants.expoConfig?.slug ?? 'pan-c';
      const owner = Constants.expoConfig?.owner ?? 'anonymous';
      const experienceId = `@${owner}/${slug}`;
      console.warn(`[Push] No projectId — falling back to experienceId: ${experienceId}`);
      tokenOpts = { experienceId };
    }

    const token = await Notifications.getExpoPushTokenAsync(tokenOpts as any);
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
