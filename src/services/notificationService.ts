// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import wisdomData from '../data/wisdom_core_50.json';
import { TraditionKey } from '../store/preferencesStore';

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
export async function initializeNotifications(
  remindersEnabled: boolean,
  reminderTime: string,
  primaryTradition?: TraditionKey
): Promise<void> {
  // Request permissions
  const granted = await registerForPushNotificationsAsync();
  
  if (!granted || !remindersEnabled) {
    await cancelDailyWisdomNotification();
    return;
  }

  // Schedule the notification
  await scheduleDailyWisdomNotification(reminderTime, primaryTradition);
}
