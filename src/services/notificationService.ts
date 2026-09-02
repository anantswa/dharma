// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import wisdomData from '../data/wisdom_core_50.json';
import { TraditionKey, usePreferencesStore } from '../store/preferencesStore';
import { getDailyDarshan, dailyWisdom } from './dailyDarshan';

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

export interface WisdomNotificationData {
  wisdomId: string;
  text: string;
  tradition: string;
  source: string;
  lineage?: string;
  original?: string;
}

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

/**
 * Get a random wisdom based on the user's primary tradition
 */
function getRandomWisdom(primaryTradition?: TraditionKey) {
  const allWisdom = wisdomData as any[];
  
  // Filter by primary tradition if set
  let filteredWisdom = allWisdom;
  if (primaryTradition) {
    filteredWisdom = allWisdom.filter((w) => {
      const tradition = w.tradition?.toLowerCase() || '';
      const primary = primaryTradition.toLowerCase();
      return tradition.includes(primary);
    });
  }

  // Fallback to all wisdom if none match
  const wisdomList = filteredWisdom.length > 0 ? filteredWisdom : allWisdom;
  const randomIndex = Math.floor(Math.random() * wisdomList.length);
  return wisdomList[randomIndex];
}

/**
 * Schedule a daily notification at the specified time
 */
export async function scheduleDailyWisdomNotification(
  time: string, // Format: "HH:MM" (24-hour)
  primaryTradition?: TraditionKey
): Promise<string | null> {
  try {
    // Cancel existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Parse the time
    const [hours, minutes] = time.split(':').map(Number);
    
    // Get a random wisdom
    const wisdom = getRandomWisdom(primaryTradition);
    
    if (!wisdom) {
      console.warn('No wisdom found for notification');
      return null;
    }

    // Prepare notification content
    const wisdomText = wisdom.translation_en || wisdom.text || '';
    const notificationData = {
      wisdomId: wisdom.id || `wisdom-${Date.now()}`,
      text: wisdomText,
      tradition: wisdom.tradition || '',
      source: wisdom.source || '',
      lineage: wisdom.lineage || '',
      original: wisdom.original_transliteration || '',
    };

    const traditionEmoji = getTraditionEmoji(wisdom.tradition);

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${traditionEmoji} Daily Wisdom`,
        body: wisdomText.substring(0, 120) + (wisdomText.length > 120 ? '...' : ''),
        data: notificationData,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
        channelId: 'daily-wisdom',
      },
    });

    console.log('Scheduled daily notification:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
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

/**
 * Cancel all scheduled notifications
 */
export async function cancelDailyWisdomNotification(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all notifications');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

/**
 * Get emoji for tradition
 */
function getTraditionEmoji(tradition?: string): string {
  const lower = tradition?.toLowerCase() || '';
  
  if (lower.includes('hindu')) return '🕉️';
  if (lower.includes('sikh')) return '☬';
  if (lower.includes('buddh')) return '☸️';
  if (lower.includes('jain')) return '☸️';
  if (lower.includes('zen')) return '🧘';
  
  return '✨';
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
    await cancelDailyWisdomNotification();
    return;
  }

  // Roll the ārati-bell window forward — called on every app open, so the
  // next 3 bells always carry fresh darshan images and days 4-10 keep a
  // lapsed user connected by text. (Replaces the fixed-repeating wisdom.)
  await refreshAratiBell(reminderTime, primaryTradition);
}
