// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { TraditionKey, usePreferencesStore } from '../store/preferencesStore';
import { getDailyDarshan } from './dailyDarshan';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  let granted = false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-wisdom', {
      name: 'Daily Wisdom',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#fbbf24',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  granted = finalStatus === 'granted';

  if (!granted) {
    console.warn('Failed to get push notification permissions!');
  }

  return granted;
}

/* ── The Ārati Bell (Move 2) ────────────────────────────────────────────
 * The founder's daily-divine-image idea as LOCAL notifications — no server,
 * no push tokens, opt-in, user-chosen time. Replaces the old behavior that
 * scheduled ONE fixed wisdom repeating forever (the bug users heard as a
 * broken record).
 *
 * Window design: 3 days of distinct darshan-image notifications (deity art
 * pre-cached to a local file; the image renders as an iOS attachment —
 * Android reliably shows title+body, the image appears on open), then
 * text-only bells for days 4-10 so a lapsed user still hears the temple
 * exactly when re-engagement matters. Every app open rolls the whole window
 * forward, so active users always get images. */

async function cacheDeityImage(uri: string, day: string): Promise<string | null> {
  try {
    const dest = `${FileSystem.cacheDirectory}bell_${day}.jpg`;
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) return dest;
    const dl = await FileSystem.downloadAsync(uri, dest);
    return dl.uri;
  } catch { return null; }
}

export async function refreshAratiBell(
  time: string,
  primaryTradition?: TraditionKey,
): Promise<void> {
  const [hour, minute] = time.split(':').map(Number);
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  for (let offset = 0; offset < 10; offset++) {
    const when = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute, 0);
    if (when.getTime() <= now.getTime() + 60_000) continue;   // today's bell already rang
    const daily = getDailyDarshan(primaryTradition, when);
    const emoji = primaryTradition === 'Buddhist' ? '☸️' : '🕉️';
    const content: Notifications.NotificationContentInput = {
      title: `${emoji} ${daily.reason}`,
      body: `“${daily.wisdom.text.substring(0, 140)}${daily.wisdom.text.length > 140 ? '…' : ''}”`,
      data: { kind: 'arati_bell', day: when.toDateString() },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
    if (offset < 3) {
      const img = (daily.deity.image as { uri?: string })?.uri;
      const local = img ? await cacheDeityImage(img, `${when.getMonth() + 1}_${when.getDate()}`) : null;
      if (local && Platform.OS === 'ios') {
        (content as any).attachments = [{ url: local }];
      }
    }
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: 'daily-wisdom' },
    });
  }
}

/** One-call opt-in used by the card's discovery prompt: permission → prefs → schedule. */
export async function enableAratiBell(
  time: string,
  primaryTradition?: TraditionKey,
): Promise<boolean> {
  const granted = await registerForPushNotificationsAsync();
  if (!granted) return false;
  usePreferencesStore.getState().setReminderTime(time);
  usePreferencesStore.getState().toggleReminders(true);
  await refreshAratiBell(time, primaryTradition);
  return true;
}

/** Silence the bell — cancels every scheduled notification (there is only the one pipeline now). */
export async function disableAratiBell(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

/**
 * Initialize notifications - call this on app start
 */
let responseListenerArmed = false;
function armBellOpenTracking(): void {
  if (responseListenerArmed) return;
  responseListenerArmed = true;
  Notifications.addNotificationResponseReceivedListener((resp) => {
    try {
      const kind = (resp.notification.request.content.data as any)?.kind;
      if (kind === 'arati_bell') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('./analytics').track('bell_open');
      }
    } catch { /* never crash on a tap */ }
  });
}

export async function initializeNotifications(
  remindersEnabled: boolean,
  reminderTime: string,
  primaryTradition?: TraditionKey
): Promise<void> {
  armBellOpenTracking();
  // Request permissions
  const granted = await registerForPushNotificationsAsync();

  if (!granted || !remindersEnabled) {
    await disableAratiBell();
    return;
  }

  // Roll the ārati-bell window forward — called on every app open, so the
  // next 3 bells always carry fresh darshan images and days 4-10 keep a
  // lapsed user connected by text. (Replaces the fixed-repeating wisdom.)
  await refreshAratiBell(reminderTime, primaryTradition);
}
