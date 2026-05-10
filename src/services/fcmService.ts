/**
 * fcmService.ts — Frontend Firebase Cloud Messaging service
 *
 * Handles:
 * - Initializing Firebase in the browser
 * - Getting the device FCM token (for receiving push notifications)
 * - Registering the token with the PAN!C backend
 * - Listening for incoming push notifications (foreground)
 *
 * Required Replit Secrets (VITE_ prefix):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FCM_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *   VITE_FIREBASE_VAPID_KEY   (optional — needed for background push in some browsers)
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FCM_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function initFirebase() {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.warn('[FCM] Firebase not configured — push notifications disabled');
    return;
  }
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('✅ Firebase initialized');
  } catch (err) {
    console.error('[FCM] Firebase initialization error:', err);
  }
}

initFirebase();

export const fcmService = {
  /**
   * Get the FCM registration token for this browser/device.
   * Returns null if Firebase is not configured or the browser doesn't support it.
   */
  async getFCMToken(): Promise<string | null> {
    try {
      if (!messaging) return null;
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
      });
      if (token) {
        console.log('✅ FCM token obtained:', token.substring(0, 30) + '...');
      }
      return token || null;
    } catch (err: unknown) {
      // Silently fail — not all browsers support push notifications
      console.warn('[FCM] Could not get token:', (err as Error).message);
      return null;
    }
  },

  /**
   * Register this device's FCM token with the PAN!C backend.
   * Called after successful signup/login so the server can send push alerts to this device.
   */
  async registerFCMToken(fcmToken: string): Promise<boolean> {
    try {
      const authToken = localStorage.getItem('panic_token');
      if (!authToken) {
        console.warn('[FCM] No auth token — skipping FCM registration');
        return false;
      }

      const response = await fetch('/api/auth/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fcmToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('[FCM] Registration failed:', data.error);
        return false;
      }

      console.log('✅ FCM token registered with PAN!C backend');
      return true;
    } catch (err) {
      console.error('[FCM] Registration error:', err);
      return false;
    }
  },

  /**
   * Auto-get and register FCM token in one call.
   * Call this after successful signup or login.
   */
  async setupPushNotifications(): Promise<void> {
    try {
      const token = await fcmService.getFCMToken();
      if (token) {
        await fcmService.registerFCMToken(token);
      } else {
        console.warn('[FCM] Push notifications not available on this device/browser');
      }
    } catch (err) {
      // Non-blocking — app works fine without push
      console.warn('[FCM] Push setup failed (non-critical):', err);
    }
  },

  /**
   * Listen for incoming push notifications while the app is in the foreground.
   * Returns a Promise that resolves with the notification payload.
   */
  onMessageListener(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!messaging) {
        reject(new Error('Firebase messaging not initialized'));
        return;
      }
      onMessage(messaging, payload => {
        console.log('🔔 Foreground notification received:', payload);
        resolve(payload);
      });
    });
  },
};
