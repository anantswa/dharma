# DHARMA BUILD SNAPSHOT

## File tree
```
App.tsx
app.json
assets/audio/devotional/Omm_and_Bells.wav
assets/audio/devotional/Shankh_Om_and_Bells.wav
assets/audio/devotional/Shankh_twice.wav
assets/icon.png
assets/images/android-icon-background.png
assets/images/android-icon-foreground.png
assets/images/android-icon-monochrome.png
assets/images/community/community_bengali.jpg
assets/images/community/community_bengali.png
assets/images/community/community_bengali_02.jpg
assets/images/community/community_gujarati.jpg
assets/images/community/community_gujarati_02.jpg
assets/images/community/community_himachal.jpg
assets/images/community/community_jain.jpg
assets/images/community/community_pan_india.jpg
assets/images/community/community_sikh.jpg
assets/images/community/community_tamil.jpg
assets/images/community/community_tamil_02.jpg
assets/images/deities/buddha.jpg
assets/images/deities/devi.jpeg
assets/images/deities/ganesha.jpeg
assets/images/deities/hanuman.jpg
assets/images/deities/hanuman_sunset.jpg
assets/images/deities/krishna.jpg
assets/images/deities/krishna_cosmic.jpeg
assets/images/deities/lakshmi.jpg
assets/images/deities/mahavir.jpg
assets/images/deities/shiva.jpg
assets/images/deities/sriram.jpg
assets/images/favicon.png
assets/images/icon.png
assets/images/icon1.png
assets/images/lessons/c1.jpg
assets/images/lessons/c10.jpg
assets/images/lessons/c11.jpg
assets/images/lessons/c12.jpg
assets/images/lessons/c13.jpg
assets/images/lessons/c14.jpg
assets/images/lessons/c15.jpg
assets/images/lessons/c16.jpg
assets/images/lessons/c17.jpg
assets/images/lessons/c18.jpg
assets/images/lessons/c19.jpg
assets/images/lessons/c2.jpg
assets/images/lessons/c20.jpg
assets/images/lessons/c21.jpg
assets/images/lessons/c3.jpg
assets/images/lessons/c4.jpg
assets/images/lessons/c5.jpg
assets/images/lessons/c6.jpg
assets/images/lessons/c7.jpg
assets/images/lessons/c8.jpg
assets/images/lessons/c9.jpg
assets/images/lessons/d1.jpg
assets/images/lessons/d2.jpg
assets/images/partial-react-logo.png
assets/images/quotes/quotes_bg_01.jpg
assets/images/quotes/quotes_bg_07.jpg
assets/images/quotes/quotes_bg_08.jpg
assets/images/quotes/quotes_bg_10.jpg
assets/images/react-logo.png
assets/images/react-logo@2x.png
assets/images/react-logo@3x.png
assets/images/rituals/AARTI_PLATE_SETUP.md
assets/images/rituals/aarti.png
assets/images/splash-icon.png
assets/images/splash/splash_01.jpg
assets/images/splash/splash_02.jpg
assets/images/splash/splash_03.jpg
assets/images/splash/splash_04.jpg
assets/images/splash/splash_05.jpg
assets/images/splash/splash_06.jpg
assets/images/splash/splash_07.jpg
assets/images/temple/temple_screen.png
assets/images/temple/temple_screen1.png
package.json
src/components/AartiPlate.tsx
src/components/FloatingMusicButton.tsx
src/components/GlassCard.tsx
src/components/MiniMusicPlayer.tsx
src/components/MusicBottomSheet.tsx
src/components/MusicPlayerControls.tsx
src/components/TrackList.tsx
src/data/calendar/events_2025.json
src/data/calendar/events_2027.json
src/data/chalisaLessons.ts
src/data/deityImages.ts
src/data/devotionalTracks.ts
src/data/modules.ts
src/data/wisdom_core_50.json
src/navigation/AppNavigator.tsx
src/screens/CalendarScreen.tsx
src/screens/DashboardScreen.tsx
src/screens/FestivalDetailScreen.tsx
src/screens/HomeScreen.tsx
src/screens/IapTestScreen.tsx
src/screens/LearnScreen.tsx
src/screens/LessonFlowScreen.tsx
src/screens/LessonSelectionScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/WelcomeScreen.tsx
src/screens/WisdomDetailScreen.tsx
src/screens/WisdomScreen.tsx
src/screens/tsx
src/services/audioService.ts
src/services/dataSync.ts
src/services/imageService.ts
src/services/moduleService.ts
src/services/notificationService.ts
src/services/shankhService.ts
src/services/supabase.ts
src/store/dataStore.ts
src/store/learnProgressStore.ts
src/store/musicStore.ts
src/store/preferencesStore.ts
src/store/premiumStore.ts
src/types/supabase.ts
```

## Asset inventory (count by dir)
```
   1 assets
   3 assets/audio/devotional
  11 assets/images
  11 assets/images/community
  11 assets/images/deities
  23 assets/images/lessons
   4 assets/images/quotes
   2 assets/images/rituals
   7 assets/images/splash
   2 assets/images/temple
```

## App.tsx
```tsx
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { MusicBottomSheet } from './src/components/MusicBottomSheet';
import AppNavigator from './src/navigation/AppNavigator';
import { AudioService } from './src/services/audioService';
import type { WisdomNotificationData } from './src/services/notificationService';
import { initializeNotifications } from './src/services/notificationService';
import { usePreferencesStore } from './src/store/preferencesStore';
import { useDataStore } from './src/store/dataStore';
import { loadImageIndex } from './src/services/imageService';

export default function App() {
  const navigationRef = useRef<any>(null);
  const gestureRootRef = useRef<any>(null);
  
  const remindersEnabled = usePreferencesStore((s) => s.remindersEnabled);
  const reminderTime = usePreferencesStore((s) => s.reminderTime);
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);

  const [fontsLoaded] = useFonts({
    Playfair_Regular: PlayfairDisplay_400Regular,
    Playfair_Medium: PlayfairDisplay_500Medium,
    Playfair_SemiBold: PlayfairDisplay_600SemiBold,
    Playfair_Bold: PlayfairDisplay_700Bold,
  });

  // Initialize data from Supabase (cache-first, then background sync)
  useEffect(() => {
    useDataStore.getState().initialize();
    loadImageIndex();
  }, []);

  // Initialize notifications
  useEffect(() => {
    initializeNotifications(remindersEnabled, reminderTime, primaryTradition);
  }, []);

  // Handle notification taps
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as unknown as WisdomNotificationData;
      
      if (data && navigationRef.current) {
        navigationRef.current.navigate('WisdomDetail', {
          wisdom: {
            id: data.wisdomId,
            translation_en: data.text,
            text: data.text,
            tradition: data.tradition,
            source: data.source,
            lineage: data.lineage || '',
            original_transliteration: data.original || '',
          },
        });
      }
    });

    return () => subscription.remove();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        setTimeout(() => {
          AudioService.pauseForBackground().catch(err => 
            console.error('Background audio pause error:', err)
          );
        }, 0);
      } else if (nextAppState === 'active') {
        setTimeout(() => {
          AudioService.restoreFromBackground().catch(err => 
            console.error('Foreground audio restore error:', err)
          );
        }, 50);
      }
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#fbbf24" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView ref={gestureRootRef} style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <StatusBar style="light" />
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
        <MusicBottomSheet />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

```

## app.json
```tsx
{
  "expo": {
    "name": "Dharma — Daily Wisdom",
    "slug": "dharma",
    "version": "1.0.0",
    "description": "A daily spiritual companion across Hindu, Sikh, Buddhist, Jain, and Zen traditions. Temple darshan, sacred calendar, wisdom library, and learning modules — all offline-first.",
    "orientation": "portrait",
    "icon": "./assets/images/icon1.png",
    "scheme": "dharma",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.taraventures.dharma",
      "buildNumber": "1",
      "infoPlist": {
        "NSCalendarsUsageDescription": "Dharma uses your calendar to remind you of sacred festivals.",
        "UIBackgroundModes": ["audio"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#020617",
        "foregroundImage": "./assets/images/icon1.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "SCHEDULE_EXACT_ALARM"
      ],
      "package": "com.taraventures.dharma",
      "versionCode": 1
    },
    "web": {
      "output": "single",
      "favicon": "./assets/images/icon1.png"
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/icon1.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#020617",
          "dark": {
            "backgroundColor": "#020617"
          }
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon1.png",
          "color": "#fbbf24",
          "sounds": []
        }
      ]
    ],
    "experiments": {
      "reactCompiler": false
    },
    "extra": {
      "eas": {
        "projectId": "84d77601-15e9-4ea8-af38-162cf1f96e34"
      }
    }
  }
}

```

## package.json
```tsx
{
  "name": "dharma",
  "main": "expo/AppEntry.js",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "expo lint"
  },
  "dependencies": {
    "@expo-google-fonts/playfair-display": "^0.4.2",
    "@expo/vector-icons": "^15.0.3",
    "@gorhom/bottom-sheet": "^5.2.8",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "@react-native-community/slider": "^5.1.1",
    "@react-navigation/bottom-tabs": "^7.4.0",
    "@react-navigation/elements": "^2.6.3",
    "@react-navigation/native": "^7.1.8",
    "@react-navigation/native-stack": "^7.6.3",
    "expo": "~54.0.25",
    "expo-av": "^16.0.8",
    "expo-blur": "^15.0.7",
    "expo-constants": "~18.0.10",
    "expo-font": "~14.0.9",
    "expo-haptics": "~15.0.7",
    "expo-image": "~3.0.10",
    "expo-linear-gradient": "~15.0.7",
    "expo-linking": "~8.0.9",
    "expo-notifications": "^0.32.16",
    "expo-splash-screen": "~31.0.11",
    "expo-status-bar": "~3.0.8",
    "expo-symbols": "~1.0.7",
    "expo-system-ui": "~6.0.8",
    "expo-web-browser": "~15.0.9",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-web": "~0.21.0",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@expo/ngrok": "^4.1.3",
    "@types/react": "~19.1.0",
    "eslint": "^9.25.0",
    "eslint-config-expo": "~10.0.0",
    "typescript": "~5.9.2"
  },
  "private": true
}

```

## src/navigation/AppNavigator.tsx
```tsx
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform, View } from 'react-native';

import { CalendarScreen } from '../screens/CalendarScreen';
import { FestivalDetailScreen } from '../screens/FestivalDetailScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { IapTestScreen } from '../screens/IapTestScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { LessonFlowScreen } from '../screens/LessonFlowScreen';
import { LessonSelectionScreen } from '../screens/LessonSelectionScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { WisdomDetailScreen } from '../screens/WisdomDetailScreen';
import { WisdomScreen } from '../screens/WisdomScreen';
import { usePreferencesStore } from '../store/preferencesStore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<any>();

/**
 * Main bottom tab navigator
 */
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#fbbf24',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarHideOnKeyboard: true,
        lazy: false,
        unmountOnBlur: false,
        freezeOnBlur: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'ios' ? 24 : 16,
          height: 60,
          borderRadius: 24,
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          borderWidth: 1,
          borderColor: 'rgba(148, 163, 184, 0.45)',
          paddingBottom: 4,
          paddingTop: 4,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 7 },
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Learn') iconName = focused ? 'school' : 'school-outline';
          if (route.name === 'Wisdom') iconName = focused ? 'book' : 'book-outline';
          if (route.name === 'Calendar') iconName = focused ? 'calendar' : 'calendar-outline';
          if (route.name === 'Store') iconName = focused ? 'cart' : 'cart-outline';
          if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';

          return (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: focused ? 'rgba(251, 191, 36, 0.12)' : 'transparent',
              }}
            >
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Wisdom" component={WisdomScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Store" component={IapTestScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

/**
 * Root stack navigator
 * Handles onboarding flow and main app navigation
 */
const AppNavigator: React.FC = () => {
  const hasCompletedOnboarding = usePreferencesStore((s) => s.hasCompletedOnboarding);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasCompletedOnboarding ? (
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      ) : null}
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="WisdomDetail" component={WisdomDetailScreen} />
      <Stack.Screen name="FestivalDetail" component={FestivalDetailScreen as any} />
      <Stack.Screen name="LessonSelection" component={LessonSelectionScreen} />
      <Stack.Screen name="LessonFlow" component={LessonFlowScreen as any} />
    </Stack.Navigator>
  );
};

export default AppNavigator;

```

## src/screens/WelcomeScreen.tsx
```tsx
// src/screens/WelcomeScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { usePreferencesStore } from '../store/preferencesStore';

// IMPORTANT: must match your store's TraditionKey exactly
const TRADITIONS = ['Hindu', 'Sikh', 'Buddhist', 'Jain', 'Zen', 'Christian', 'Sufi'] as const;
type TraditionKey = (typeof TRADITIONS)[number];

 

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // ✅ Avoid returning an object from Zustand selector (prevents getSnapshot infinite loop)
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const savedRemindersEnabled = usePreferencesStore((s) => s.remindersEnabled);
  const setOnboarding = usePreferencesStore((s) => s.setOnboarding);

  const [tradition, setTradition] = useState<TraditionKey>(
    (primaryTradition as TraditionKey) ?? 'Sikh',
  );
  const [remindersEnabled, setRemindersEnabled] = useState(!!savedRemindersEnabled);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  

  const onNext = () => {
    setOnboarding({
      primaryTradition: tradition,
      remindersEnabled,
    });

    // Go to main app (Tabs)
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', 'rgba(2,6,23,0.85)', '#020617']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Begin your Dharma journey</Text>
        <Text style={styles.subtitle}>Tailor your experience in a few taps.</Text>

        {/* Tradition dropdown */}
        <Text style={styles.sectionLabel}>CHOOSE YOUR PATH</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownOpen(true)}
          activeOpacity={0.9}
        >
          <Text style={styles.dropdownText}>{tradition}</Text>
          <Text style={styles.dropdownChevron}>▾</Text>
        </TouchableOpacity>

        <Modal
          visible={dropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDropdownOpen(false)}
          >
            <View style={styles.modalCard}>
              {TRADITIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.modalRow}
                  onPress={() => {
                    setTradition(t);
                    setDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalRowText,
                      t === tradition && styles.modalRowTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        

        {/* Reminders */}
        <View style={styles.reminderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>Reminders</Text>
            <Text style={styles.reminderSubtitle}>Get a gentle daily nudge.</Text>
          </View>
          <Switch value={remindersEnabled} onValueChange={setRemindersEnabled} />
        </View>

        {/* Next */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onNext}
          disabled={false}
          style={[styles.nextButton]}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { flex: 1, paddingTop: 80, paddingHorizontal: 20, paddingBottom: 28 },
  title: { fontSize: 30, color: '#fbbf24', fontFamily: 'Playfair_Bold' },
  subtitle: { marginTop: 10, fontSize: 15, color: '#cbd5e1', opacity: 0.9 },

  sectionLabel: {
    marginTop: 26,
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#fbbf24',
    fontFamily: 'Playfair_SemiBold',
  },

  dropdownButton: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { color: '#f8fafc', fontSize: 16, fontFamily: 'System' },
  dropdownChevron: { color: '#94a3b8', fontSize: 18 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  modalRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalRowText: { color: '#e2e8f0', fontSize: 16 },
  modalRowTextActive: { color: '#fbbf24', fontWeight: '700' },

  reminderRow: {
    marginTop: 26,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(15,23,42,0.45)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  reminderSubtitle: { marginTop: 4, color: '#94a3b8', fontSize: 13 },

  nextButton: {
    marginTop: 'auto',
    borderRadius: 18,
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextText: { color: '#020617', fontSize: 16, fontWeight: '800' },
 
});

```

## src/screens/HomeScreen.tsx
```tsx
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AartiPlate } from '../components/AartiPlate';
import { FloatingMusicButton } from '../components/FloatingMusicButton';
import { Deity, FINAL_DEITIES } from '../data/deityImages';
import { AudioService } from '../services/audioService';
import { ShankhService } from '../services/shankhService';
import { useDataStore } from '../store/dataStore';
import { isTraditionEnabled, usePreferencesStore } from '../store/preferencesStore';

const { width, height } = Dimensions.get('window');

// 🔵 APP THEME COLOR
const THEME_COLOR = '#0f172a';

// Use dynamically loaded deities
const DEITIES = FINAL_DEITIES;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isShankhPlaying, setIsShankhPlaying] = useState(false);
  const wisdom = useDataStore((s) => s.wisdom);
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);

  // Today's wisdom — same rotation logic as old Dashboard
  const todaysWisdom = useMemo(() => {
    if (!wisdom.length) return null;
    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    if (primaryTradition) {
      const filtered = wisdom.filter((w) => w.tradition?.toLowerCase() === primaryTradition.toLowerCase());
      if (filtered.length) return filtered[dayOfYear % filtered.length];
    }
    const filtered = wisdom.filter((w) => isTraditionEnabled(w.tradition, enabledTraditions));
    return filtered.length ? filtered[dayOfYear % filtered.length] : wisdom[0];
  }, [wisdom, primaryTradition, enabledTraditions]);

  // Initialize audio service on mount
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      AudioService.initialize();
      setIsReady(true);
    });

    return () => {
      task.cancel();
      ShankhService.stop();
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        AudioService.pauseForBackground();
        ShankhService.pause();
        setIsShankhPlaying(false);
      }
    });
    return () => sub.remove();
  }, []);

  const toggleShankhLoop = async () => {
    try {
      if (isShankhPlaying) {
        await ShankhService.pause();
        setIsShankhPlaying(false);
      } else {
        const started = await ShankhService.playLoop();
        setIsShankhPlaying(started);
      }
    } catch (error) {
      console.error('Error toggling Shankh loop:', error);
      setIsShankhPlaying(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setActiveIndex(newIndex);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // 🎨 RENDER FUNCTION (Maximized Deities)
  const renderDeity = ({ item }: { item: Deity }) => (
    <View style={styles.cardContainer}>
      {/* 1. Background */}
      <View style={styles.backgroundLayer} />

      {/* 2. Safe Zone (Maximized) */}
      <View style={styles.safeZone}>
        <Image 
          source={item.image} 
          style={styles.deityImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <StatusBar hidden={true} backgroundColor={THEME_COLOR} />
        
        {/* BOTTOM LAYER: Carousel */}
        <FlatList
          data={DEITIES}
          renderItem={renderDeity}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          decelerationRate="fast"
          disableIntervalMomentum={true}
          scrollEventThrottle={32}
          bounces={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={1}
          style={styles.carousel}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        {/* MIDDLE LAYER: Temple Frame */}
        <View style={styles.templeFrame} pointerEvents="box-none">
          <Image
            source={require('../../assets/images/temple/temple_screen.png')}
            style={{ width, height }}
            resizeMode="stretch"
            pointerEvents="none" 
          />
        </View>

        {/* TOP LAYER: UI Elements */}
        <View style={styles.topLayer} pointerEvents="box-none">
          {/* Today's Wisdom — subtle overlay at top */}
          {todaysWisdom && (
            <Pressable
              style={styles.wisdomOverlay}
              onPress={() => navigation.navigate('WisdomDetail', { wisdom: todaysWisdom })}
            >
              <Text style={styles.wisdomOverlayLabel}>TODAY'S WISDOM</Text>
              <Text style={styles.wisdomOverlayText} numberOfLines={2}>
                {todaysWisdom.translation_en || todaysWisdom.short_form || ''}
              </Text>
              <Text style={styles.wisdomOverlaySource}>
                {todaysWisdom.source_text || ''} {'\u2022'} {todaysWisdom.tradition}
              </Text>
            </Pressable>
          )}

          {/* Pagination */}
          <View style={styles.paginationContainer} pointerEvents="none">
            {DEITIES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          {/* Aarti Plate */}
          <AartiPlate />

          {/* Shankh Loop Button (Left) */}
          <Pressable
            style={styles.shankhButton}
            onPress={toggleShankhLoop}
            accessibilityRole="button"
            accessibilityLabel="Play Shankh Om and Bells"
            accessibilityState={{ selected: isShankhPlaying }}
          >
            <View style={[styles.shankhDot, isShankhPlaying && styles.shankhDotActive]} />
          </Pressable>
        </View>
      </View>

      {/* Music Selection Button (Right) */}
      <FloatingMusicButton />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLOR,
  },
  carousel: {
    flex: 1,
  },
  cardContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME_COLOR,
  },
  safeZone: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deityImage: {
    width: '100%',
    height: '100%',
  },
  templeFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 10,
  },
  topLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 20,
  },
  wisdomOverlay: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    zIndex: 25,
  },
  wisdomOverlayLabel: {
    fontSize: 10,
    color: '#fbbf24',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  wisdomOverlayText: {
    fontSize: 15,
    color: '#f1f5f9',
    fontFamily: 'Playfair_Medium',
    lineHeight: 22,
    marginBottom: 6,
  },
  wisdomOverlaySource: {
    fontSize: 11,
    color: '#64748b',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: '#fbbf24',
    opacity: 0.8,
  },
  // 🟢 UPDATED: Aligned to bottom: 100 to match Music Button
  shankhButton: {
    position: 'absolute',
    left: 20,
    bottom: 100, // Matches FloatingMusicButton height
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shankhDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.7)',
  },
  shankhDotActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fff',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});
```

## src/screens/LearnScreen.tsx
```tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Dimensions,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ALL_MODULES, getModulesForUser, type ModuleDefinition } from '../data/modules';
import { getLessonsForModule } from '../services/moduleService';
import { AudioService } from '../services/audioService';
import { ShankhService } from '../services/shankhService';
import { useLearnProgressStore } from '../store/learnProgressStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useDataStore } from '../store/dataStore';

const { width } = Dimensions.get('window');

type Props = {
  navigation: any;
};

type SectionData = {
  title: string;
  subtitle: string;
  data: ModuleDefinition[];
};

export const LearnScreen: React.FC<Props> = ({ navigation }) => {
  const completedLessons = useLearnProgressStore((s) => s.completedLessons);
  const loadProgress = useLearnProgressStore((s) => s.loadProgress);
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);
  const wisdomLoaded = useDataStore((s) => s.isLoaded);

  useEffect(() => { loadProgress(); }, []);

  useFocusEffect(
    useCallback(() => {
      AudioService.pause();
      ShankhService.pause();
      return undefined;
    }, [])
  );

  const sections = useMemo((): SectionData[] => {
    const modules = getModulesForUser(primaryTradition, enabledTraditions);

    const scripture = modules.filter((m) => m.type === 'scripture');
    const thematic = modules.filter((m) => m.type === 'thematic');
    const practice = modules.filter((m) => m.type === 'practice');

    const result: SectionData[] = [];
    if (scripture.length)
      result.push({ title: 'Sacred Texts', subtitle: 'Verse-by-verse journeys through scripture', data: scripture });
    if (thematic.length)
      result.push({ title: 'Explorations', subtitle: 'Cross-tradition themes', data: thematic });
    if (practice.length)
      result.push({ title: 'Daily Practice', subtitle: 'Build a daily spiritual habit', data: practice });

    return result;
  }, [primaryTradition, enabledTraditions]);

  const getProgress = (module: ModuleDefinition): { completed: number; total: number } => {
    // Count how many lessons in this module are completed
    const prefix = `${module.id}:`;
    const completed = completedLessons.filter((id) => id.startsWith(prefix)).length;
    // Get actual lesson count from dataStore if available
    const lessons = wisdomLoaded ? getLessonsForModule(module) : [];
    const total = lessons.length || module.estimatedLessons;
    return { completed, total };
  };

  const getDifficultyLabel = (d: string) => {
    switch (d) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      default: return '';
    }
  };

  const getTraditionEmoji = (t: string) => {
    switch (t) {
      case 'hindu': return '';
      case 'buddhist': return '';
      case 'sikh': return '';
      case 'jain': return '';
      case 'zen': return '';
      case 'christian': return '';
      case 'sufi': return '';
      case 'cross-tradition': return '';
      default: return '';
    }
  };

  const renderModule = ({ item: module }: { item: ModuleDefinition }) => {
    const { completed, total } = getProgress(module);
    const pct = total > 0 ? completed / total : 0;
    const isStarted = completed > 0;

    return (
      <Pressable
        style={styles.moduleCard}
        onPress={() =>
          navigation.navigate('LessonSelection', { moduleId: module.id })
        }
      >
        <LinearGradient
          colors={[
            `${module.accentColor}18`,
            `${module.accentColor}08`,
          ]}
          style={styles.moduleGradient}
        >
          <View style={[styles.moduleIcon, { backgroundColor: `${module.accentColor}25` }]}>
            <Ionicons
              name={module.iconName as any}
              size={28}
              color={module.accentColor}
            />
          </View>

          <View style={styles.moduleContent}>
            <View style={styles.moduleTitleRow}>
              <Text style={styles.moduleTitle} numberOfLines={1}>
                {module.title}
              </Text>
              <Text style={[styles.difficultyBadge, {
                color: module.difficulty === 'advanced' ? '#E74C3C' :
                       module.difficulty === 'intermediate' ? '#F39C12' : '#27AE60',
              }]}>
                {getDifficultyLabel(module.difficulty)}
              </Text>
            </View>

            <Text style={styles.moduleSubtitle} numberOfLines={2}>
              {module.subtitle}
            </Text>

            <View style={styles.moduleFooter}>
              <Text style={styles.lessonCount}>
                {total} lessons {getTraditionEmoji(module.tradition)}
              </Text>

              {isStarted && (
                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${pct * 100}%`, backgroundColor: module.accentColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {completed}/{total}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </LinearGradient>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderModule}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Learn</Text>
            <Text style={styles.headerSubtitle}>
              {ALL_MODULES.filter(m => m.available).length} modules across {7} traditions
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Playfair_Bold',
    color: '#fbbf24',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Playfair_Regular',
    color: '#64748b',
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Playfair_Bold',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  moduleCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  moduleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  moduleIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  moduleTitle: {
    fontSize: 17,
    fontFamily: 'Playfair_Bold',
    color: '#f1f5f9',
    flex: 1,
  },
  difficultyBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 8,
  },
  moduleSubtitle: {
    fontSize: 13,
    fontFamily: 'Playfair_Regular',
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 8,
  },
  moduleFooter: {
    gap: 6,
  },
  lessonCount: {
    fontSize: 12,
    color: '#64748b',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#64748b',
    width: 40,
    textAlign: 'right',
  },
});

```

## src/screens/LessonFlowScreen.tsx
```tsx
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CHALISA_LESSONS } from '../data/chalisaLessons';
import type { ModuleLesson } from '../services/moduleService';
import { useLearnProgressStore } from '../store/learnProgressStore';

const { width } = Dimensions.get('window');

type Props = {
  navigation: any;
  route: {
    params: {
      lessonId: string;
      moduleId?: string;
      lesson?: ModuleLesson;
    };
  };
};

type Step = 'read' | 'understand' | 'reflect' | 'done';

const STEPS: Step[] = ['read', 'understand', 'reflect', 'done'];
const STEP_LABELS: Record<Step, string> = {
  read: 'Read',
  understand: 'Understand',
  reflect: 'Reflect',
  done: 'Complete',
};

export const LessonFlowScreen: React.FC<Props> = ({ navigation, route }) => {
  const { lessonId, moduleId, lesson: routeLesson } = route.params;
  const markLessonComplete = useLearnProgressStore((s) => s.markLessonComplete);

  const [currentStep, setCurrentStep] = useState<Step>('read');
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  // Build lesson from either route params (new system) or Chalisa fallback
  const lesson: ModuleLesson | null = routeLesson || (() => {
    const chalisaLesson = CHALISA_LESSONS.find((l) => l.id === lessonId);
    if (!chalisaLesson) return null;
    return {
      id: chalisaLesson.id,
      number: chalisaLesson.number,
      title: chalisaLesson.title,
      original: chalisaLesson.hindi || chalisaLesson.text || '',
      transliteration: chalisaLesson.transliteration || '',
      translation: chalisaLesson.meaning || '',
      context: '',
      elaboration: '',
      source: 'Hanuman Chalisa',
      speaker: 'Tulsidas',
      mood: 'devotional',
      tradition: 'hindu',
      themes: ['devotion'],
      reflectionPrompt: 'What quality of Hanuman does this verse reveal to you?',
      audioUrl: null,
    };
  })();

  useEffect(() => {
    return () => { if (sound) sound.unloadAsync(); };
  }, [sound]);

  if (!lesson) {
    Alert.alert('Error', 'Lesson not found');
    navigation.goBack();
    return null;
  }

  const handleNext = async () => {
    if (sound) { await sound.stopAsync(); await sound.setPositionAsync(0); setIsPlaying(false); }

    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]);
    } else {
      // Complete: mark progress with module prefix
      const progressId = moduleId ? `${moduleId}:${lesson.id}` : lesson.id;
      markLessonComplete(progressId);
      navigation.goBack();
    }
  };

  const handleBack = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1]);
  };

  const handlePlayAudio = async () => {
    try {
      if (isPlaying && sound) {
        await sound.pauseAsync(); setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync(); setIsPlaying(true);
      } else {
        const { sound: s } = await Audio.Sound.createAsync(
          require('../../assets/audio/devotional/Omm_and_Bells.wav'),
          { shouldPlay: true },
        );
        setSound(s); setIsPlaying(true);
        s.setOnPlaybackStatusUpdate((st) => {
          if (st.isLoaded && st.didJustFinish) setIsPlaying(false);
        });
      }
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  const handleClose = () => {
    Alert.alert('Exit Lesson', 'Exit without saving progress?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Exit', style: 'destructive',
        onPress: async () => {
          if (sound) { await sound.stopAsync(); await sound.unloadAsync(); }
          navigation.goBack();
        },
      },
    ]);
  };

  // ─── Step Indicator ───
  const renderStepIndicator = () => {
    const currentIdx = STEPS.indexOf(currentStep);
    return (
      <View style={styles.stepIndicator}>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.stepItem}>
            <View style={[styles.stepCircle, i <= currentIdx && styles.stepCircleActive]}>
              {i < currentIdx ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={[styles.stepLabel, i <= currentIdx && styles.stepLabelActive]}>
                  {STEP_LABELS[step].charAt(0)}
                </Text>
              )}
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, i < currentIdx && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  // ─── Step: READ ───
  const renderRead = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Read the Verse</Text>
      <Text style={styles.stepDesc}>{lesson.source}</Text>

      <View style={styles.verseCard}>
        {lesson.original ? (
          <>
            <Text style={styles.verseLabel}>Original</Text>
            <Text style={styles.verseOriginal}>{lesson.original}</Text>
          </>
        ) : null}

        {lesson.transliteration ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.verseLabel}>Transliteration</Text>
            <Text style={styles.verseTrans}>{lesson.transliteration}</Text>
          </>
        ) : null}

        <View style={styles.divider} />
        <Text style={styles.verseLabel}>Translation</Text>
        <Text style={styles.verseEn}>{lesson.translation}</Text>
      </View>

      {lesson.speaker ? (
        <Text style={styles.speakerNote}>Spoken by {lesson.speaker}</Text>
      ) : null}

      <Pressable style={styles.audioBtn} onPress={handlePlayAudio}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#fbbf24" />
        <Text style={styles.audioBtnText}>{isPlaying ? 'Pause' : 'Listen'}</Text>
      </Pressable>
    </ScrollView>
  );

  // ─── Step: UNDERSTAND ───
  const renderUnderstand = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Understand</Text>
      <Text style={styles.stepDesc}>The context and deeper meaning</Text>

      {lesson.context ? (
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>The Setting</Text>
          <Text style={styles.contextText}>{lesson.context}</Text>
        </View>
      ) : null}

      {lesson.elaboration ? (
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>Deeper Meaning</Text>
          <Text style={styles.contextText}>{lesson.elaboration}</Text>
        </View>
      ) : (
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>The Teaching</Text>
          <Text style={styles.contextText}>{lesson.translation}</Text>
          {lesson.themes.length > 0 && (
            <View style={styles.themeRow}>
              {lesson.themes.slice(0, 4).map((t) => (
                <View key={t} style={styles.themeBadge}>
                  <Text style={styles.themeBadgeText}>{t.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <Pressable style={styles.audioBtn} onPress={handlePlayAudio}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#fbbf24" />
        <Text style={styles.audioBtnText}>Listen again</Text>
      </Pressable>
    </ScrollView>
  );

  // ─── Step: REFLECT ───
  const renderReflect = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Ionicons name="sparkles" size={40} color="#fbbf24" style={{ alignSelf: 'center', marginBottom: 16 }} />
      <Text style={styles.stepTitle}>Reflect</Text>

      <View style={styles.reflectCard}>
        <Text style={styles.reflectPrompt}>{lesson.reflectionPrompt}</Text>
      </View>

      <TextInput
        style={styles.journalInput}
        placeholder="Write your thoughts... (optional)"
        placeholderTextColor="#475569"
        multiline
        value={reflectionText}
        onChangeText={setReflectionText}
        textAlignVertical="top"
      />

      <Text style={styles.reflectHint}>
        There are no right answers. Just sit with the question.
      </Text>
    </ScrollView>
  );

  // ─── Step: DONE ───
  const renderDone = () => (
    <View style={[styles.stepContent, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
      <View style={styles.doneCircle}>
        <Ionicons name="checkmark" size={48} color="#22c55e" />
      </View>
      <Text style={styles.doneTitle}>Lesson Complete</Text>
      <Text style={styles.doneVerse} numberOfLines={2}>
        {lesson.transliteration || lesson.translation}
      </Text>
      <Text style={styles.doneSource}>{lesson.source}</Text>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'read': return renderRead();
      case 'understand': return renderUnderstand();
      case 'reflect': return renderReflect();
      case 'done': return renderDone();
    }
  };

  const currentIdx = STEPS.indexOf(currentStep);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#94a3b8" />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {lesson.number}. {lesson.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStepIndicator()}

      <View style={{ flex: 1 }}>
        {renderCurrentStep()}
      </View>

      {/* Bottom navigation */}
      <View style={styles.bottomBar}>
        {currentIdx > 0 ? (
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        ) : <View style={{ width: 80 }} />}

        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentStep === 'done' ? 'Finish' : 'Next'}
          </Text>
          <Ionicons
            name={currentStep === 'done' ? 'checkmark-circle' : 'arrow-forward'}
            size={20}
            color="#020617"
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontFamily: 'Playfair_SemiBold', color: '#94a3b8' },

  // Step indicator
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 16 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: '#fbbf24' },
  stepLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  stepLabelActive: { color: '#020617' },
  stepLine: { width: 32, height: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#fbbf24' },

  // Step content
  stepContent: { paddingHorizontal: 24, paddingBottom: 24 },
  stepTitle: { fontSize: 26, fontFamily: 'Playfair_Bold', color: '#fbbf24', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: '#64748b', marginBottom: 20 },

  // Verse card
  verseCard: {
    backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.15)', marginBottom: 16,
  },
  verseLabel: { fontSize: 11, color: '#fbbf24', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  verseOriginal: { fontSize: 22, color: '#f8fafc', lineHeight: 34, fontFamily: 'Playfair_Medium', marginBottom: 4 },
  verseTrans: { fontSize: 16, color: '#cbd5e1', fontStyle: 'italic', lineHeight: 24, marginBottom: 4 },
  verseEn: { fontSize: 17, color: '#e2e8f0', lineHeight: 26, fontFamily: 'Playfair_Regular' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  speakerNote: { fontSize: 13, color: '#64748b', fontStyle: 'italic', marginBottom: 16 },

  // Audio button
  audioBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(251,191,36,0.1)', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)', marginTop: 8,
  },
  audioBtnText: { fontSize: 15, color: '#fbbf24', fontFamily: 'Playfair_SemiBold' },

  // Context cards (Understand step)
  contextCard: {
    backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 14,
  },
  contextLabel: { fontSize: 11, color: '#fbbf24', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  contextText: { fontSize: 16, color: '#cbd5e1', lineHeight: 24 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  themeBadge: {
    backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
  },
  themeBadgeText: { fontSize: 11, color: '#fbbf24', textTransform: 'capitalize' },

  // Reflect step
  reflectCard
... [truncated 1686 chars]

```

## src/screens/WisdomScreen.tsx
```tsx
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useDataStore } from '../store/dataStore';
import { isTraditionEnabled, TraditionKey, usePreferencesStore } from '../store/preferencesStore';
import type { WisdomEntry } from '../types/supabase';

// WisdomEntry type from Supabase is used instead of local WisdomItem

const { width } = Dimensions.get('window');

// --- THE NEW IMAGE LOGIC ---
const getBackgroundForTradition = (tradition: string) => {
  const t = tradition.toLowerCase();

  // 1. Check COMMUNITY folder (Specific identities)
  if (t.includes('sikh')) return require('../../assets/images/community/community_sikh.jpg');
  if (t.includes('jain')) return require('../../assets/images/community/community_jain.jpg');
  if (t.includes('gujarati')) return require('../../assets/images/community/community_gujarati.jpg');
  if (t.includes('himachal')) return require('../../assets/images/community/community_himachal.jpg');

  // 2. Check QUOTES folder (Thematic matches)
  // Assuming you might add specific quote backgrounds later, we use your existing one for now
  if (t.includes('zen') || t.includes('buddh')) {
     return require('../../assets/images/quotes/quotes_bg_01.jpg'); 
  }

  // 3. Default to SPLASH folder (The "Base" screens)
  // We can rotate these or pick a specific one for Hindu/General
  return require('../../assets/images/splash/splash_01.jpg'); 
};

export const WisdomScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const wisdomData = useDataStore((s) => s.wisdom);

  // Build available traditions based on user's enabled traditions
  const availableTraditions = useMemo(() => {
    const traditions: string[] = ['All'];
    if (enabledTraditions) {
      const tradKeys: TraditionKey[] = ['Hindu', 'Sikh', 'Buddhist', 'Jain', 'Zen', 'Christian', 'Sufi'];
      tradKeys.forEach((key) => {
        if (enabledTraditions[key]) {
          traditions.push(key);
        }
      });
    }
    return traditions;
  }, [enabledTraditions]);

  const filteredData = useMemo(() => {
    // Safety check: if enabledTraditions is undefined during initial load, show all
    if (!enabledTraditions) return [];
    let base = wisdomData.filter((item) => isTraditionEnabled(item.tradition, enabledTraditions));
    if (activeFilter === 'All') return base;
    return base.filter((item) =>
      item.tradition.toLowerCase().includes(activeFilter.toLowerCase()),
    );
  }, [wisdomData, activeFilter, enabledTraditions]);

  const renderChip = (label: string) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity
        key={label}
        onPress={() => setActiveFilter(label)}
        style={[styles.chip, isActive && styles.chipActive]}
      >
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: WisdomEntry }) => {
    const bgSource = getBackgroundForTradition(item.tradition || '');

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('WisdomDetail', { wisdom: item })}
        style={styles.cardWrapper}
      >
        <ImageBackground source={bgSource} style={styles.cardBg} resizeMode="cover">
          <View style={styles.cardOverlay} />
          <View style={styles.cardInner}>
            <Text style={styles.traditionLabel}>
              {(item.tradition || '').toUpperCase()}
              {item.source_text ? ` \u2022 ${item.source_text.toUpperCase()}` : ''}
            </Text>
            {item.transliteration ? (
              <Text style={styles.originalText} numberOfLines={2}>{item.transliteration}</Text>
            ) : item.original_script ? (
              <Text style={styles.originalText} numberOfLines={2}>{item.original_script}</Text>
            ) : null}
            <Text style={styles.translationText} numberOfLines={3}>
              {item.translation_en || item.short_form || ''}
            </Text>
            <Text style={styles.sourceText}>
              {'\u2014'} {item.source_text || ''}{item.source_location ? ` ${item.source_location}` : ''}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wisdom Library</Text>
      <Text style={styles.subtitle}>Browse timeless teachings.</Text>
      <View style={{ height: 50 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {availableTraditions.map(renderChip)}
        </ScrollView>
      </View>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', paddingTop: 60 },
  title: { fontSize: 28, color: '#fbbf24', fontFamily: 'Playfair_Bold', marginBottom: 4, paddingHorizontal: 20 },
  subtitle: { fontSize: 15, color: '#94a3b8', fontFamily: 'System', marginBottom: 16, paddingHorizontal: 20 },
  chipRow: { paddingHorizontal: 20, alignItems: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.4)', marginRight: 8, backgroundColor: 'rgba(15, 23, 42, 0.8)' },
  chipActive: { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderColor: '#fbbf24' },
  chipText: { fontSize: 14, color: '#cbd5e1' },
  chipTextActive: { color: '#fbbf24', fontWeight: '600' },
  listContent: { paddingTop: 10, paddingBottom: 100, paddingHorizontal: 20 },
  cardWrapper: { marginBottom: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardBg: { width: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 6, 23, 0.7)' },
  cardInner: { padding: 24 },
  traditionLabel: { fontSize: 12, color: '#fbbf24', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Playfair_SemiBold', marginBottom: 12 },
  originalText: { fontSize: 16, color: '#94a3b8', fontFamily: 'Playfair_Regular', fontStyle: 'italic', marginBottom: 12, lineHeight: 24 },
  translationText: { fontSize: 18, lineHeight: 28, color: '#f8fafc', fontFamily: 'Playfair_Medium', marginBottom: 12 },
  sourceText: { fontSize: 14, color: '#cbd5e1', fontFamily: 'System', marginBottom: 8 },
});
```

## src/screens/CalendarScreen.tsx
```tsx
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useMemo } from 'react';
import { SectionList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isTraditionEnabled, usePreferencesStore } from '../store/preferencesStore';
import { useDataStore } from '../store/dataStore';
import type { FestivalEntry } from '../types/supabase';

type SectionData = {
  title: string;
  data: FestivalEntry[];
};

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);
  const festivals = useDataStore((s) => s.festivals);

  const sections = useMemo(() => {
    if (!enabledTraditions || !festivals.length) return [];

    const filtered = festivals.filter(e => {
      if (e.faith === 'Secular') return true;
      return isTraditionEnabled(e.faith, enabledTraditions);
    });

    // 3. Group by Month (e.g. "November 2025")
    const grouped: Record<string, CalendarEvent[]> = {};
    
    filtered.forEach(event => {
      const date = new Date(event.date);
      // Format: "November 2025"
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(event);
    });

    // 4. Convert to SectionList format
    // We rely on the order of keys, but let's ensure months are sorted by time
    return Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(key => ({
        title: key,
        data: grouped[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }));

  }, [enabledTraditions, festivals]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Sacred Calendar</Text>
        <Text style={styles.subtitle}>Click a Festival to Learn significance.</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.date + item.name + index}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{title}</Text>
            <View style={styles.line} />
          </View>
        )}
        
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('FestivalDetail', { festival: item })}
          >
            <BlurView intensity={30} tint="dark" style={styles.card}>
              <View style={styles.dateBox}>
                <Text style={styles.dayText}>
                  {new Date(item.date).getDate()}
                </Text>
                <Text style={styles.weekdayText}>
                  {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.details}>
                <Text style={styles.eventTitle}>{item.name}</Text>
                <Text style={styles.traditionBadge}>{item.faith} • {item.category}</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        )}
        
        ListEmptyComponent={
          <Text style={styles.emptyText}>No events found for your active traditions.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 32, color: '#fbbf24', fontFamily: 'Playfair_Bold' },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 4, fontFamily: 'System' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  monthHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  monthTitle: { color: '#e2e8f0', fontSize: 18, fontFamily: 'Playfair_Bold', marginRight: 12 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  card: { 
    flexDirection: 'row', 
    marginBottom: 12, 
    borderRadius: 16, 
    overflow: 'hidden',
    backgroundColor: 'rgba(30,41,59,0.4)',
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16
  },
  dateBox: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingRight: 16, 
    borderRightWidth: 1, 
    borderRightColor: 'rgba(255,255,255,0.1)',
    marginRight: 16,
    width: 60
  },
  dayText: { fontSize: 24, color: '#fbbf24', fontFamily: 'Playfair_Bold' },
  weekdayText: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  
  details: { flex: 1, justifyContent: 'center' },
  eventTitle: { fontSize: 16, color: '#f1f5f9', fontFamily: 'System', fontWeight: '600', lineHeight: 22, marginBottom: 6 },
  traditionBadge: { 
    fontSize: 11, 
    color: '#cbd5e1', 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    opacity: 0.7 
  },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 14 }
});
```

## src/screens/SettingsScreen.tsx
```tsx
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    cancelDailyWisdomNotification,
    initializeNotifications,
    scheduleDailyWisdomNotification,
} from '../services/notificationService';
import { TraditionKey, usePreferencesStore } from '../store/preferencesStore';

const TRADITIONS: TraditionKey[] = ['Hindu', 'Sikh', 'Buddhist', 'Jain', 'Zen', 'Christian', 'Sufi'];

 

// Generate hours (0-23) and minutes (0-59)
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export const SettingsScreen: React.FC = () => {
  const enabledTraditions = usePreferencesStore((s) => s.enabledTraditions);
  const toggleTradition = usePreferencesStore((s) => s.toggleTradition);
  
  const primaryTradition = usePreferencesStore((s) => s.primaryTradition);
  const remindersEnabled = usePreferencesStore((s) => s.remindersEnabled);
  const reminderTime = usePreferencesStore((s) => s.reminderTime);
  const setOnboarding = usePreferencesStore((s) => s.setOnboarding);
  const setReminderTime = usePreferencesStore((s) => s.setReminderTime);
  const toggleReminders = usePreferencesStore((s) => s.toggleReminders);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState<TraditionKey>(
    primaryTradition ?? 'Sikh'
  );
  const [reminderToggle, setReminderToggle] = useState(!!remindersEnabled);
  const [selectedTime, setSelectedTime] = useState(reminderTime || '07:00');
  
  const [tempHour, setTempHour] = useState(parseInt(selectedTime.split(':')[0]));
  const [tempMinute, setTempMinute] = useState(parseInt(selectedTime.split(':')[1]));

  // Initialize notifications when settings change
  useEffect(() => {
    initializeNotifications(reminderToggle, selectedTime, selectedTradition);
  }, [reminderToggle, selectedTime, selectedTradition]);

  

  const handleTraditionChange = (trad: TraditionKey) => {
    setSelectedTradition(trad);
    setDropdownOpen(false);
    
    // Save to store
    setOnboarding({
      primaryTradition: trad,
      remindersEnabled: reminderToggle,
    });
  };

  const handleReminderToggle = async (value: boolean) => {
    setReminderToggle(value);
    toggleReminders(value);
    
    // Save to store
    setOnboarding({
      primaryTradition: selectedTradition,
      remindersEnabled: value,
    });

    // Update notifications
    if (value) {
      await scheduleDailyWisdomNotification(selectedTime, selectedTradition);
    } else {
      await cancelDailyWisdomNotification();
    }
  };

  const handleTimeConfirm = () => {
    const formattedTime = `${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`;
    setSelectedTime(formattedTime);
    setReminderTime(formattedTime);
    setTimePickerOpen(false);
    
    // Reschedule notification if enabled
    if (reminderToggle) {
      scheduleDailyWisdomNotification(formattedTime, selectedTradition);
    }
  };

  const openTimePicker = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    setTempHour(hours);
    setTempMinute(minutes);
    setTimePickerOpen(true);
  };

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Notifications, themes, and personal practice preferences.
      </Text>

      {/* Onboarding Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Your Journey</Text>
        <Text style={styles.cardDescription}>
          Customize your primary tradition.
        </Text>

        <View style={styles.separator} />

        {/* Primary Tradition */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Primary Tradition</Text>
            <Text style={styles.rowSubtitle}>Your main spiritual path</Text>
          </View>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownOpen(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.dropdownText}>{selectedTradition}</Text>
            <Text style={styles.dropdownChevron}>▾</Text>
          </TouchableOpacity>
        </View>

        

        {/* Reminders */}
        <View style={[styles.row, { marginTop: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Reminders</Text>
            <Text style={styles.rowSubtitle}>Get a gentle daily nudge</Text>
          </View>
          <Switch
            value={reminderToggle}
            onValueChange={handleReminderToggle}
            trackColor={{ false: '#334155', true: '#f59e0b' }}
            thumbColor={reminderToggle ? '#fffbeb' : '#9ca3af'}
          />
        </View>

        {/* Reminder Time - only show if reminders are enabled */}
        {reminderToggle && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Reminder Time</Text>
                <Text style={styles.rowSubtitle}>When to receive daily wisdom</Text>
              </View>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={openTimePicker}
                activeOpacity={0.9}
              >
                <Text style={styles.timeButtonText}>{formatTime12Hour(selectedTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Modal for Tradition Selection */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDropdownOpen(false)}
        >
          <View style={styles.modalCard}>
            {TRADITIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.modalRow}
                onPress={() => handleTraditionChange(t)}
              >
                <Text
                  style={[
                    styles.modalRowText,
                    t === selectedTradition && styles.modalRowTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={timePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setTimePickerOpen(false)}
        >
          <View style={styles.timePickerCard}>
            <Text style={styles.timePickerTitle}>Select Time</Text>
            
            <View style={styles.timePickerContainer}>
              {/* Hours Picker */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Hour</Text>
                <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                  {HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        tempHour === hour && styles.timeOptionActive,
                      ]}
                      onPress={() => setTempHour(hour)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          tempHour === hour && styles.timeOptionTextActive,
                        ]}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              {/* Minutes Picker */}
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Minute</Text>
                <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                  {MINUTES.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        tempMinute === minute && styles.timeOptionActive,
                      ]}
                      onPress={() => setTempMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          tempMinute === minute && styles.timeOptionTextActive,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmTimeButton}
              onPress={handleTimeConfirm}
              activeOpacity={0.9}
            >
              <Text style={styles.confirmTimeText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Traditions Filter */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.cardLabel}>Traditions to Surface</Text>
        <Text style={styles.cardDescription}>
          Choose which lineages you’d like to see in your Home and Library.
        </Text>

        <View style={styles.separator} />

        {TRADITIONS.map((trad) => (
          <View key={trad} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{trad}</Text>
              <Text style={styles.rowSubtitle}>Included in daily feed</Text>
            </View>

            <Switch
              value={enabledTraditions[trad]}
              onValueChange={() => toggleTradition(trad)}
              trackColor={{ false: '#334155', true: '#f59e0b' }} // Saffron-ish active color
              thumbColor={enabledTraditions[trad] ? '#fffbeb' : '#9ca3af'}
            />
          </View>
        ))}
      </View>

      {/* DharmaWeave Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DharmaWeave</Text>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => {
            const { Linking } = require('react-native');
            Linking.openURL('https://play.google.com/store/books/details?id=HnSlEQAAQBAJ');
          }}
        >
          <Text style={styles.linkText}>Hanuman — Book on Google Play</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => {
            const { Linking } = require('react-native');
            Linking.openURL('https://open.spotify.com/artist/4Kg2Tc3I1sC1zMPiwYeX2x');
          }}
        >
          <Text style={styles.linkText}>DharmaWeave Chants on Spotify</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>v1.0.0 — Dharma by DharmaWeave</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60, // Adjusted for safe area
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    color: '#fbbf24',
    fontFamily: 'Playfair_Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    fontFamily: 'System',
    marginBottom: 32,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // Semi-transparent card
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardLabel: {
    fontSize: 12,
    color: '#fbbf24',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'Playfair_SemiBold',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'System',
    marginBottom: 16,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  row: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 17,
    color: '#f9fafb',
    fontFamily: 'System',
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  linkRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  linkText: {
    fontSize: 15,
    color: '#fbbf24',
  },
  footerNote: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 12,
    color: '#64748b',
  },
  // Dropdown styles
  dropdownButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 120,
  },
... [truncated 2602 chars]

```

## src/screens/IapTestScreen.tsx
```tsx
import Constants from 'expo-constants';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePremiumStore } from '../store/premiumStore';

// ⚠️ REPLACE THIS with your actual ID from Google Play Console later
const PRODUCT_ID = 'dharma_premium_lifetime';

// 📖 YOUR BOOK DATA
const BOOK_ID = 'HnSlEQAAQBAJ';
const BOOK_URL = `https://play.google.com/store/books/details?id=${BOOK_ID}`;

// 🎵 SPOTIFY DATA (Updated with your link)
const SPOTIFY_URL = 'https://open.spotify.com/artist/4Kg2Tc3I1sC1zMPiwYeX2x'; 

// ✅ FIX: Kept the name "IapTestScreen" so your navigation keeps working
export const IapTestScreen: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const iapRef = useRef<any>(null);
  
  const isExpoGo = Constants.appOwnership === 'expo' || Platform.OS === 'web';
  const { isPremium, setPremium, loadPremiumCache } = usePremiumStore();

  useEffect(() => {
    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const setupIAP = async () => {
      if (isExpoGo) {
        await loadPremiumCache();
        return;
      }
      try {
        const iap = await import('react-native-iap');
        iapRef.current = iap;
        await iap.initConnection();
        await loadPremiumCache();

        purchaseUpdateSubscription = iap.purchaseUpdatedListener(
          async (purchase: any) => {
            try {
              await iap.finishTransaction({ purchase, isConsumable: false });
              await setPremium(true);
              Alert.alert('Thank You! 🙏', 'Your support helps keep Dharma Marga alive.');
            } catch (error: any) {
              console.error('Transaction Error:', error);
            }
          }
        );

        purchaseErrorSubscription = iap.purchaseErrorListener(
          async (error: any) => {
            if (error?.code === 'E_ALREADY_OWNED') {
              await restorePurchases();
            }
          }
        );

        await fetchProductsData();
      } catch (error: any) {
        console.error('IAP Init Error:', error);
      }
    };

    setupIAP();

    return () => {
      if (purchaseUpdateSubscription) purchaseUpdateSubscription.remove();
      if (purchaseErrorSubscription) purchaseErrorSubscription.remove();
      if (iapRef.current) iapRef.current.endConnection();
    };
  }, []);

  const fetchProductsData = async () => {
    if (!iapRef.current) return;
    try {
      setLoading(true);
      const productsList = await iapRef.current.fetchProducts({ skus: [PRODUCT_ID] });
      setProducts(productsList || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async () => {
    if (!iapRef.current) return;
    try {
      setRestoring(true);
      const purchases = await iapRef.current.getAvailablePurchases();
      const ownsPremium = purchases.some((p: any) => p.productId === PRODUCT_ID);
      await setPremium(ownsPremium);
      if (ownsPremium) Alert.alert('Welcome Back', 'Premium restored! ✅');
      else Alert.alert('Restore', 'No previous purchases found.');
    } catch (error: any) {
      Alert.alert('Error', 'Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  const handleBuy = async () => {
    if (!iapRef.current) return;
    try {
      await iapRef.current.requestPurchase({
        type: 'in-app',
        request: { google: { skus: [PRODUCT_ID] }, apple: { sku: PRODUCT_ID } },
      });
    } catch (error) { }
  };

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert('Error', 'Could not open link.');
  };

  // Render "Premium Active" State
  if (isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.premiumTitle}>Premium Unlocked</Text>
          <Text style={styles.premiumEmoji}>✨🕉️✨</Text>
          <Text style={styles.description}>
            Thank you for supporting DharmaWeave.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Products from DharmaWeave</Text>
          <Text style={styles.subtitle}>Wisdom, Art, and Devotion.</Text>
        </View>

        {/* 📚 BOOK SECTION (Top Priority) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Featured Book</Text>
          <TouchableOpacity 
            style={styles.bookCard} 
            onPress={() => openLink(BOOK_URL)} 
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: `https://books.google.com/books/content?id=${BOOK_ID}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api` }} 
              style={styles.bookCover}
              resizeMode="cover"
            />
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>Hanuman</Text>
              <Text style={styles.bookAuthor}>by Anant Swarup</Text>
              <Text style={styles.bookDesc} numberOfLines={3}>
                To him, the sun was just a sweet fruit. To the world, he is the ultimate guardian.
              </Text>
              <Text style={styles.linkText}>Get it on Google Play ➔</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 🎵 MUSIC SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Official Music</Text>
          <TouchableOpacity 
            style={styles.musicCard} 
            onPress={() => openLink(SPOTIFY_URL)}
            activeOpacity={0.9}
          >
            <View style={styles.musicIconContainer}>
              <Text style={styles.musicIcon}>🎧</Text>
            </View>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>DharmaWeave Chants</Text>
              <Text style={styles.bookDesc}>
                Listen to our sacred mantras and devotional tracks in high quality.
              </Text>
              <Text style={[styles.linkText, { color: '#1DB954' }]}>Listen on Spotify ➔</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 💎 PREMIUM SECTION */}
        <View style={styles.premiumCard}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumCardTitle}>Support Our Work</Text>
            <Text style={styles.premiumCardSubtitle}>Unlock the full app potential</Text>
          </View>
          
          <View style={styles.featuresList}>
            <FeatureRow icon="📖" text="Access Full Wisdom Library" />
            <FeatureRow icon="🕉️" text="Support Future Development" />
          </View>

          <View style={styles.actionArea}>
            {loading ? (
              <ActivityIndicator color="#fbbf24" size="large" />
            ) : (
              <TouchableOpacity 
                style={styles.buyButton} 
                onPress={handleBuy}
                activeOpacity={0.8}
              >
                <Text style={styles.buyButtonText}>
                  {products.length > 0 
                    ? `Unlock Premium - ${products[0].price}` 
                    : "Unlock Premium"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.restoreButton} 
              onPress={restorePurchases} 
              disabled={restoring}
            >
              <Text style={styles.restoreText}>
                {restoring ? "Checking..." : "Restore Previous Purchase"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isExpoGo && (
          <Text style={styles.devNote}>
            Note: Payment testing is disabled in Expo Go.
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const FeatureRow = ({ icon, text }: { icon: string, text: string }) => (
  <View style={styles.featureRow}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
    marginLeft: 4,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
  },
  bookCover: {
    width: 70,
    height: 105,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  bookTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
  },
  bookDesc: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  linkText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 'bold',
  },
  musicCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
  },
  musicIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  musicIcon: {
    fontSize: 28,
  },
  premiumCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  premiumHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  premiumCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  premiumCardSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#e2e8f0',
  },
  actionArea: {
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#fbbf24',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buyButtonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    padding: 12,
  },
  restoreText: {
    color: '#94a3b8',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  premiumTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 16,
  },
  premiumEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
  },
  devNote: {
    marginTop: 20,
    textAlign: 'center',
    color: '#475569',
    fontSize: 12,
  },
});
```

## src/store/preferencesStore.ts
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * PreferencesStore - User preferences and onboarding state
 * Persists tradition filters, reminder settings, and onboarding status
 */

export type TraditionKey = 'Hindu' | 'Sikh' | 'Buddhist' | 'Jain' | 'Zen' | 'Christian' | 'Sufi';

type PreferencesState = {
  enabledTraditions: Record<TraditionKey, boolean>;
  toggleTradition: (key: TraditionKey) => void;
  resetTraditions: () => void;
  
  hasCompletedOnboarding: boolean;
  primaryTradition?: TraditionKey;
  remindersEnabled: boolean;
  reminderTime: string;
  setOnboarding: (data: {
    primaryTradition: TraditionKey;
    remindersEnabled: boolean;
  }) => void;
  setReminderTime: (time: string) => void;
  toggleReminders: (enabled: boolean) => void;
};

const DEFAULT_TRADITIONS: Record<TraditionKey, boolean> = {
  Hindu: true,
  Sikh: true,
  Buddhist: true,
  Jain: true,
  Zen: true,
  Christian: true,
  Sufi: true,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      enabledTraditions: DEFAULT_TRADITIONS,
      toggleTradition: (key) =>
        set((state) => ({
          enabledTraditions: {
            ...state.enabledTraditions,
            [key]: !state.enabledTraditions[key],
          },
        })),
      resetTraditions: () => set({ enabledTraditions: DEFAULT_TRADITIONS }),
      
      hasCompletedOnboarding: false,
      primaryTradition: undefined,
      remindersEnabled: false,
      reminderTime: '07:00', // Default 7:00 AM
      setOnboarding: (data) =>
        set({
          hasCompletedOnboarding: true,
          primaryTradition: data.primaryTradition,
          remindersEnabled: data.remindersEnabled,
        }),
      setReminderTime: (time) => set({ reminderTime: time }),
      toggleReminders: (enabled) => set({ remindersEnabled: enabled }),
    }),
    {
      name: 'dharma-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// --- Helpers ---

const normalizeTraditionLabel = (tradition?: string): TraditionKey | null => {
  if (!tradition) return null;
  const lower = tradition.toLowerCase();
  
  if (lower.includes('hindu') || lower.includes('vedanta') || lower.includes('gita')) return 'Hindu';
  if (lower.includes('sikh') || lower.includes('gurbani')) return 'Sikh';
  if (lower.includes('buddh')) return 'Buddhist';
  if (lower.includes('jain')) return 'Jain';
  if (lower.includes('zen')) return 'Zen';
  if (lower.includes('christian') || lower.includes('bible') || lower.includes('catholic') || lower.includes('orthodox') || lower.includes('protestant')) return 'Christian';
  if (lower.includes('sufi') || lower.includes('rumi') || lower.includes('hafiz') || lower.includes('islamic')) return 'Sufi';

  return null;
};

// CRITICAL: This must have 'export'
export const isTraditionEnabled = (
  tradition: string | undefined,
  enabledTraditions: Record<TraditionKey, boolean>
): boolean => {
  const key = normalizeTraditionLabel(tradition);
  if (!key) return true;
  return enabledTraditions[key] ?? true;
};
```

## src/store/dataStore.ts
```tsx
/**
 * DataStore — Zustand store for Supabase-synced wisdom + festivals.
 *
 * Replaces the static JSON imports. Data flows:
 * 1. On app start: load from AsyncStorage cache (instant)
 * 2. If cache is stale (>24h) or empty: sync from Supabase in background
 * 3. If Supabase is unreachable AND no cache: fall back to bundled JSON
 */

import { create } from 'zustand';
import type { FestivalEntry, WisdomEntry } from '../types/supabase';
import { isSyncNeeded, loadCachedData, syncFromSupabase } from '../services/dataSync';

// Bundled fallback data (used only when no cache AND no network)
import bundledWisdomRaw from '../data/wisdom_core_50.json';
import bundledEventsRaw from '../data/calendar/events_2025.json';
let bundledEvents2027Raw: any = {};
try { bundledEvents2027Raw = require('../data/calendar/events_2027.json'); } catch (e) {}

type DataState = {
  wisdom: WisdomEntry[];
  festivals: FestivalEntry[];
  lastSyncAt: string | null;
  isSyncing: boolean;
  isLoaded: boolean;
  syncError: string | null;
  dataSource: 'supabase' | 'cache' | 'bundled';

  /** Initialize: load cache, then sync if needed */
  initialize: () => Promise<void>;

  /** Force a fresh sync from Supabase */
  forceSync: () => Promise<void>;
};

/**
 * Convert bundled wisdom JSON (different field names) to WisdomEntry shape.
 */
function convertBundledWisdom(raw: any[]): WisdomEntry[] {
  return raw.map((w: any) => ({
    id: w.id,
    tradition: w.tradition || '',
    source_text: w.lineage || w.source || null,
    source_location: w.source || null,
    speaker: null,
    listener: null,
    context: null,
    original_script: null,
    transliteration: w.original_transliteration || null,
    translation_en: w.translation_en || null,
    translation_hi: null,
    elaboration: null,
    themes: w.theme ? [w.theme] : null,
    mood: null,
    era: null,
    short_form: null,
    importance: w.is_core ? 4 : 3,
    emotion_cluster: null,
    calendar_tags: null,
    series_id: null,
    series_order: null,
    audio_url: null,
    created_at: '',
  }));
}

/**
 * Convert bundled event JSON to FestivalEntry shape.
 */
function convertBundledFestivals(): FestivalEntry[] {
  const all = [
    ...((bundledEventsRaw as any).events_2025 || []),
    ...((bundledEventsRaw as any).events_2026 || []),
    ...((bundledEvents2027Raw as any).events_2027 || []),
  ];
  return all.map((e: any, i: number) => ({
    id: `bundled-${i}`,
    date: e.date,
    name: e.name,
    faith: e.faith || '',
    category: e.category || 'Festival',
    description: e.description || null,
    significance: null,
    story: null,
    customs: null,
    regions: null,
    importance: null,
    tradition: null,
    alternate_names: null,
    lunar_date: null,
    duration_days: 1,
    content_themes: null,
    suggested_mood: null,
    year: e.date ? parseInt(e.date.substring(0, 4), 10) : null,
  }));
}

export const useDataStore = create<DataState>((set, get) => ({
  wisdom: [],
  festivals: [],
  lastSyncAt: null,
  isSyncing: false,
  isLoaded: false,
  syncError: null,
  dataSource: 'bundled',

  initialize: async () => {
    // Step 1: Load from cache (fast, offline)
    const cached = await loadCachedData();

    if (cached.wisdom.length > 0) {
      set({
        wisdom: cached.wisdom,
        festivals: cached.festivals,
        lastSyncAt: cached.lastSyncAt,
        isLoaded: true,
        dataSource: 'cache',
      });
    } else {
      // No cache — use bundled data immediately
      set({
        wisdom: convertBundledWisdom(bundledWisdomRaw as any[]),
        festivals: convertBundledFestivals(),
        isLoaded: true,
        dataSource: 'bundled',
      });
    }

    // Step 2: Sync from Supabase if needed (background)
    if (isSyncNeeded(cached.lastSyncAt)) {
      get().forceSync();
    }
  },

  forceSync: async () => {
    set({ isSyncing: true, syncError: null });

    const result = await syncFromSupabase();

    if (result) {
      set({
        wisdom: result.wisdom,
        festivals: result.festivals,
        lastSyncAt: new Date().toISOString(),
        isSyncing: false,
        dataSource: 'supabase',
      });
    } else {
      set({
        isSyncing: false,
        syncError: 'Could not reach server. Using cached data.',
      });
    }
  },
}));

```

## src/store/premiumStore.ts
```tsx
// src/store/premiumStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const PREMIUM_KEY = '@dharma:isPremium';

type PremiumStore = {
  isPremium: boolean;
  isLoading: boolean;
  setPremium: (value: boolean) => Promise<void>;
  loadPremiumCache: () => Promise<void>;
};

export const usePremiumStore = create<PremiumStore>((set) => ({
  isPremium: false,
  isLoading: true,

  setPremium: async (value: boolean) => {
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, value ? 'true' : 'false');
      set({ isPremium: value });
      console.log('💎 Premium status saved:', value);
    } catch (error) {
      console.error('❌ Failed to save premium status:', error);
    }
  },

  loadPremiumCache: async () => {
    try {
      const cached = await AsyncStorage.getItem(PREMIUM_KEY);
      const isPremium = cached === 'true';
      set({ isPremium, isLoading: false });
      console.log('💎 Premium cache loaded:', isPremium);
    } catch (error) {
      console.error('❌ Failed to load premium cache:', error);
      set({ isLoading: false });
    }
  },
}));

```

## src/store/musicStore.ts
```tsx
import { create } from 'zustand';

/**
 * MusicStore - Global state management for music player
 * Manages playback state, track info, and UI state
 */

export type MusicState = {
  // Playback state
  isPlaying: boolean;
  currentTrackId: string | null;
  currentPosition: number;
  duration: number;
  
  // UI state
  isBottomSheetOpen: boolean;
  
  // Actions
  setIsPlaying: (playing: boolean) => void;
  setCurrentTrack: (trackId: string | null) => void;
  setCurrentPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setBottomSheetOpen: (open: boolean) => void;
  reset: () => void;
};

export const useMusicStore = create<MusicState>((set) => ({
  // Initial state
  isPlaying: false,
  currentTrackId: null,
  currentPosition: 0,
  duration: 0,
  isBottomSheetOpen: false,
  
  // Actions
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTrack: (trackId) => set({ currentTrackId: trackId }),
  setCurrentPosition: (position) => set({ currentPosition: position }),
  setDuration: (duration) => set({ duration: duration }),
  setBottomSheetOpen: (open) => set({ isBottomSheetOpen: open }),
  reset: () => set({ 
    isPlaying: false, 
    currentTrackId: null, 
    currentPosition: 0,
    duration: 0,
  }),
}));

```

## src/store/learnProgressStore.ts
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * LearnProgressStore - Manages learning progress for Hanuman Chalisa lessons
 * Persists completed lessons to AsyncStorage
 */

interface LearnProgressState {
  completedLessons: string[];
  currentLesson: string | null;
  isLoading: boolean;
  
  markLessonComplete: (lessonId: string) => Promise<void>;
  markLessonIncomplete: (lessonId: string) => Promise<void>;
  setCurrentLesson: (lessonId: string | null) => void;
  loadProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

const STORAGE_KEY = '@dharma:learn_progress';

export const useLearnProgressStore = create<LearnProgressState>((set, get) => ({
  completedLessons: [],
  currentLesson: null,
  isLoading: true,

  markLessonComplete: async (lessonId: string) => {
    const { completedLessons } = get();
    
    if (!completedLessons.includes(lessonId)) {
      const updated = [...completedLessons, lessonId];
      set({ completedLessons: updated });
      
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  },

  markLessonIncomplete: async (lessonId: string) => {
    const { completedLessons } = get();
    
    if (completedLessons.includes(lessonId)) {
      const updated = completedLessons.filter(id => id !== lessonId);
      set({ completedLessons: updated });
      
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  },

  setCurrentLesson: (lessonId: string | null) => {
    set({ currentLesson: lessonId });
  },

  loadProgress: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const completedLessons = JSON.parse(stored);
        set({ completedLessons, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      set({ isLoading: false });
    }
  },

  resetProgress: async () => {
    set({ completedLessons: [], currentLesson: null });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  },
}));

```

## src/services/supabase.ts
```tsx
/**
 * Supabase client for the Dharma app.
 *
 * Uses the Supabase REST API directly (no supabase-js dependency needed).
 * The service key is used for now; replace with anon key before production.
 *
 * All requests are read-only SELECT queries — the app never writes to Supabase.
 */

const SUPABASE_URL = 'https://aiwugigdrvijjeoqtpog.supabase.co';

// TODO: Replace with anon key from Supabase dashboard before shipping to public.
// The anon key is safe to embed in the app (read-only via RLS policies).
// Get it from: Supabase Dashboard → Settings → API → anon/public key
const SUPABASE_KEY = 'sb_secret_NSb4vFficZ00dlalq8vHlw_wQbVgUV';

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

/**
 * Query the Supabase REST API.
 *
 * @param table - Table name (e.g. 'wisdom', 'festivals')
 * @param params - PostgREST query params (e.g. 'select=*&tradition=eq.Hindu&limit=10')
 * @returns Parsed JSON array of rows
 */
export async function supabaseQuery<T = any>(
  table: string,
  params: string = 'select=*',
): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;

  const response = await fetch(url, { headers: HEADERS });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase query failed: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Get the count of rows in a table (without fetching all data).
 */
export async function supabaseCount(table: string, filter: string = ''): Promise<number> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=id&${filter}`;

  const response = await fetch(url, {
    headers: {
      ...HEADERS,
      Prefer: 'count=exact',
      'Range-Unit': 'items',
      Range: '0-0',
    },
  });

  const contentRange = response.headers.get('content-range');
  if (contentRange) {
    const total = contentRange.split('/')[1];
    return parseInt(total, 10) || 0;
  }
  return 0;
}

export { SUPABASE_URL };

```

## src/services/audioService.ts
```tsx
import { Audio, AVPlaybackStatus } from 'expo-av';
import { DevotionalTrack } from '../data/devotionalTracks';
import { useMusicStore } from '../store/musicStore';

/**
 * AudioService - Singleton service for managing devotional music playback
 * Handles audio loading, playback control, and state management
 */
class AudioServiceClass {
  private sound: Audio.Sound | null = null;
  private isLoaded = false;
  private currentTrackId: string | null = null;
  private wasPlayingBeforeBackground = false;

  /**
   * Initialize audio configuration for iOS and Android
   */
  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  }

  /**
   * Cleanup and unload current sound
   */
  private async cleanup() {
    if (this.sound) {
      const soundToCleanup = this.sound;
      this.sound = null;
      this.isLoaded = false;
      this.currentTrackId = null;

      try {
        soundToCleanup.setOnPlaybackStatusUpdate(null);
        const status = await soundToCleanup.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundToCleanup.stopAsync();
        }
        await soundToCleanup.unloadAsync();
      } catch (e) {
        console.error('Error during cleanup:', e);
      }
    }
  }

  /**
   * Load and play a track
   */
  async loadAndPlay(track: DevotionalTrack) {
    try {
      await this.cleanup();

      const store = useMusicStore.getState();
      store.setCurrentTrack(track.id);
      store.setIsPlaying(false);
      store.setCurrentPosition(0);
      store.setDuration(0);

      const { sound } = await Audio.Sound.createAsync(
        track.audioUrl,
        { shouldPlay: true },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.isLoaded = true;
      this.currentTrackId = track.id;
    } catch (error) {
      console.error('Error loading track:', error);
      useMusicStore.getState().setIsPlaying(false);
      useMusicStore.getState().setCurrentTrack(null);
    }
  }

  /**
   * Play current track
   */
  async play() {
    if (!this.sound || !this.isLoaded) return;
    
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await this.sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing:', error);
    }
  }

  /**
   * Pause current track
   */
  async pause() {
    if (!this.sound || !this.isLoaded) return;
    
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.sound.pauseAsync();
      }
    } catch (error) {
      console.error('Error pausing:', error);
    }
  }

  // Resume
  async resume() {
    await this.play();
  }

  // Seek to position (in milliseconds)
  async seek(position: number) {
    if (this.sound && this.isLoaded) {
      try {
        await this.sound.setPositionAsync(position);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  }

  /**
   * Stop and unload current track
   */
  async stop() {
    await this.cleanup();
    useMusicStore.getState().reset();
  }

  /**
   * Playback status update callback
   */
  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const store = useMusicStore.getState();

    if (this.currentTrackId === store.currentTrackId) {
      store.setCurrentPosition(status.positionMillis);
      if (status.durationMillis) {
        store.setDuration(status.durationMillis);
      }

      store.setIsPlaying(status.isPlaying);

      if (status.didJustFinish && !status.isLooping) {
        store.setIsPlaying(false);
        store.setCurrentPosition(0);
      }
    }
  };

  // Get current status
  async getStatus() {
    if (this.sound && this.isLoaded) {
      return await this.sound.getStatusAsync();
    }
    return null;
  }

  /**
   * Pause audio when app goes to background
   */
  async pauseForBackground() {
    try {
      if (this.sound && this.isLoaded) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
          this.wasPlayingBeforeBackground = status.isPlaying;
          if (status.isPlaying) {
            await this.sound.pauseAsync();
          }
        }
      }
    } catch (error) {
      console.error('Error pausing for background:', error);
    }
  }

  /**
   * Restore audio when app comes to foreground
   */
  async restoreFromBackground() {
    try {
      await this.initialize();
      
      if (this.wasPlayingBeforeBackground && this.sound && this.isLoaded) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await this.sound.playAsync();
        }
      }
      this.wasPlayingBeforeBackground = false;
    } catch (error) {
      console.error('Error restoring from background:', error);
    }
  }
}

// Export singleton instance
export const AudioService = new AudioServiceClass();

```

## src/services/notificationService.ts
```tsx
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

```

## src/services/shankhService.ts
```tsx
import { Audio } from 'expo-av';

const SHANKH_SOURCE = require('../../assets/audio/devotional/Shankh_Om_and_Bells.wav');

/**
 * ShankhService - Singleton service for managing looping Shankh Om and Bells audio
 * Provides play, pause, and stop controls for the sacred sound loop
 */
class ShankhServiceClass {
  private sound: Audio.Sound | null = null;
  private isLoaded = false;
  private isPlaying = false;

  /**
   * Start playing the shankh sound in a loop
   */
  async playLoop() {
    try {
      if (!this.sound) {
        const { sound } = await Audio.Sound.createAsync(SHANKH_SOURCE, {
          shouldPlay: true,
          isLooping: true,
        });
        this.sound = sound;
        this.isLoaded = true;
        this.isPlaying = true;
        return true;
      }

      if (this.isLoaded) {
        await this.sound!.setIsLoopingAsync(true);
        await this.sound!.playAsync();
        this.isPlaying = true;
        return true;
      }
    } catch (error) {
      console.error('Error playing shankh loop:', error);
    }
    return false;
  }

  /**
   * Pause the shankh sound loop
   */
  async pause() {
    if (!this.sound || !this.isLoaded) return false;
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
      }
      return true;
    } catch (error) {
      console.error('Error pausing shankh loop:', error);
      return false;
    }
  }

  /**
   * Stop and unload the shankh sound
   */
  async stop() {
    if (!this.sound) return;
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.sound.stopAsync();
      }
      await this.sound.unloadAsync();
    } catch (error) {
      console.error('Error stopping shankh loop:', error);
    } finally {
      this.sound = null;
      this.isLoaded = false;
      this.isPlaying = false;
    }
  }

  getPlaying() {
    return this.isPlaying;
  }
}

export const ShankhService = new ShankhServiceClass();

```

## src/services/imageService.ts
```tsx
/**
 * Image service — matches wisdom entries to images from the image_library.
 *
 * Images are stored in GCS/Supabase Storage. The app fetches URLs from
 * the image_library table and loads them on-demand via expo-image's
 * built-in disk cache. No images are bundled in the app binary.
 */

import type { ImageEntry } from '../types/supabase';
import { supabaseQuery } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGES_CACHE_KEY = '@dharma:images_cache';
const SUPABASE_STORAGE_BASE = 'https://aiwugigdrvijjeoqtpog.supabase.co/storage/v1/object/public/dharma-images';

let cachedImages: ImageEntry[] = [];

/**
 * Load image index from Supabase (or cache).
 * Only fetches the metadata (URLs + tags), not the actual image bytes.
 * Images are served from Supabase Storage (dharma-images bucket).
 */
export async function loadImageIndex(): Promise<void> {
  // Try cache first
  try {
    const cached = await AsyncStorage.getItem(IMAGES_CACHE_KEY);
    if (cached) {
      cachedImages = JSON.parse(cached);
      if (cachedImages.length > 0) return;
    }
  } catch (e) {
    // ignore cache errors
  }

  // Fetch from Supabase
  try {
    const fields = 'id,file_url,thumbnail_url,tradition,source_text,primary_figure,mood,scene_description,tags,orientation';
    const images = await supabaseQuery<ImageEntry>(
      'image_library',
      `select=${fields}&available=eq.true&order=created_at.desc&limit=500`,
    );
    cachedImages = images;
    await AsyncStorage.setItem(IMAGES_CACHE_KEY, JSON.stringify(images));
  } catch (error) {
    console.error('[ImageService] Failed to load image index:', error);
  }
}

/**
 * Check if a URL points to Supabase Storage (web-accessible).
 * Local drive paths (G:\...) are not usable by the mobile app.
 */
function isWebUrl(url: string | null): boolean {
  return !!url && (url.startsWith('http://') || url.startsWith('https://'));
}

/**
 * Get the best available image URL for an entry.
 * Prefers Supabase Storage URLs. Falls back to null for local paths.
 */
export function getImageUrl(entry: ImageEntry | null, size: 'full' | 'thumb' = 'full'): string | null {
  if (!entry) return null;
  const url = size === 'thumb' ? (entry.thumbnail_url || entry.file_url) : entry.file_url;
  return isWebUrl(url) ? url : null;
}

/**
 * Find the best matching image for a wisdom entry.
 *
 * Matching priority:
 * 1. Same source_text (e.g. "Bhagavad Gita" matches images from BG)
 * 2. Same tradition + mood
 * 3. Same tradition
 * 4. Any image (random)
 */
export function findImageForWisdom(
  tradition?: string | null,
  sourceText?: string | null,
  mood?: string | null,
  wisdomId?: string,
): ImageEntry | null {
  if (cachedImages.length === 0) return null;

  // Deterministic "random" based on wisdom ID (consistent per entry)
  const hash = wisdomId ? simpleHash(wisdomId) : Math.floor(Math.random() * 10000);

  // Priority 1: Match source_text
  if (sourceText) {
    const sourceMatch = cachedImages.filter(
      (img) => img.source_text && sourceText.toLowerCase().includes(img.source_text.toLowerCase()),
    );
    if (sourceMatch.length > 0) return sourceMatch[hash % sourceMatch.length];
  }

  // Priority 2: Match tradition + mood
  if (tradition && mood) {
    const tradMoodMatch = cachedImages.filter(
      (img) => img.tradition === tradition.toLowerCase() && img.mood === mood,
    );
    if (tradMoodMatch.length > 0) return tradMoodMatch[hash % tradMoodMatch.length];
  }

  // Priority 3: Match tradition
  if (tradition) {
    const tradMatch = cachedImages.filter(
      (img) => img.tradition === tradition.toLowerCase(),
    );
    if (tradMatch.length > 0) return tradMatch[hash % tradMatch.length];
  }

  // Fallback: any image
  return cachedImages[hash % cachedImages.length];
}

/**
 * Get a list of images for a tradition (for carousel/gallery views).
 */
export function getImagesForTradition(tradition: string, limit: number = 10): ImageEntry[] {
  return cachedImages
    .filter((img) => img.tradition === tradition.toLowerCase())
    .slice(0, limit);
}

/** Simple string hash for deterministic image selection */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

```

## src/services/dataSync.ts
```tsx
/**
 * Data sync service — fetches wisdom + festivals from Supabase,
 * caches to AsyncStorage, supports delta sync and offline fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FestivalEntry, WisdomEntry } from '../types/supabase';
import { supabaseQuery } from './supabase';

const WISDOM_CACHE_KEY = '@dharma:wisdom_cache';
const FESTIVALS_CACHE_KEY = '@dharma:festivals_cache';
const LAST_SYNC_KEY = '@dharma:last_sync';

// How often to re-sync (24 hours)
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Fetch all wisdom entries from Supabase.
 * Selects only the fields the app needs (reduces bandwidth).
 */
async function fetchWisdom(): Promise<WisdomEntry[]> {
  const fields = [
    'id', 'tradition', 'source_text', 'source_location', 'speaker', 'listener',
    'context', 'original_script', 'transliteration', 'translation_en', 'translation_hi',
    'elaboration', 'themes', 'mood', 'era', 'short_form', 'importance',
    'emotion_cluster', 'calendar_tags', 'series_id', 'series_order',
    'audio_url', 'created_at',
  ].join(',');

  return supabaseQuery<WisdomEntry>('wisdom', `select=${fields}&order=importance.desc`);
}

/**
 * Fetch all festivals from Supabase.
 */
async function fetchFestivals(): Promise<FestivalEntry[]> {
  const fields = [
    'id', 'date', 'name', 'faith', 'category', 'description',
    'significance', 'story', 'customs', 'regions', 'importance',
    'tradition', 'alternate_names', 'lunar_date', 'duration_days',
    'content_themes', 'suggested_mood', 'year',
  ].join(',');

  return supabaseQuery<FestivalEntry>('festivals', `select=${fields}&order=date.asc`);
}

/**
 * Load cached data from AsyncStorage.
 */
export async function loadCachedData(): Promise<{
  wisdom: WisdomEntry[];
  festivals: FestivalEntry[];
  lastSyncAt: string | null;
}> {
  try {
    const [wisdomJson, festivalsJson, lastSync] = await Promise.all([
      AsyncStorage.getItem(WISDOM_CACHE_KEY),
      AsyncStorage.getItem(FESTIVALS_CACHE_KEY),
      AsyncStorage.getItem(LAST_SYNC_KEY),
    ]);

    return {
      wisdom: wisdomJson ? JSON.parse(wisdomJson) : [],
      festivals: festivalsJson ? JSON.parse(festivalsJson) : [],
      lastSyncAt: lastSync,
    };
  } catch (error) {
    console.error('Failed to load cached data:', error);
    return { wisdom: [], festivals: [], lastSyncAt: null };
  }
}

/**
 * Save data to AsyncStorage cache.
 */
async function saveToCache(
  wisdom: WisdomEntry[],
  festivals: FestivalEntry[],
): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all([
    AsyncStorage.setItem(WISDOM_CACHE_KEY, JSON.stringify(wisdom)),
    AsyncStorage.setItem(FESTIVALS_CACHE_KEY, JSON.stringify(festivals)),
    AsyncStorage.setItem(LAST_SYNC_KEY, now),
  ]);
}

/**
 * Check if a sync is needed (last sync was >24h ago or never synced).
 */
export function isSyncNeeded(lastSyncAt: string | null): boolean {
  if (!lastSyncAt) return true;
  const lastSync = new Date(lastSyncAt).getTime();
  return Date.now() - lastSync > SYNC_INTERVAL_MS;
}

/**
 * Perform a full sync: fetch all data from Supabase and cache locally.
 *
 * Returns the fresh data. If the network request fails, returns null
 * (caller should fall back to cached data).
 */
export async function syncFromSupabase(): Promise<{
  wisdom: WisdomEntry[];
  festivals: FestivalEntry[];
} | null> {
  try {
    console.log('[DataSync] Syncing from Supabase...');
    const [wisdom, festivals] = await Promise.all([
      fetchWisdom(),
      fetchFestivals(),
    ]);

    console.log(`[DataSync] Fetched ${wisdom.length} wisdom, ${festivals.length} festivals`);

    await saveToCache(wisdom, festivals);
    console.log('[DataSync] Cache updated');

    return { wisdom, festivals };
  } catch (error) {
    console.error('[DataSync] Sync failed:', error);
    return null;
  }
}

```

## src/components/AartiPlate.tsx
```tsx
import React from 'react';
import { Dimensions, Image, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Aarti plate configuration
const PLATE_SIZE = 120; // Size of the aarti plate
const INITIAL_BOTTOM = 40; // Distance from bottom
const INITIAL_X = width / 2 - PLATE_SIZE / 2; // Centered horizontally
const INITIAL_Y = height - INITIAL_BOTTOM - PLATE_SIZE; // Position from top

// Movement boundaries (soft bounds)
const MIN_X = -PLATE_SIZE * 0.3; // Allow 30% off left edge
const MAX_X = width - PLATE_SIZE * 0.7; // Allow 30% off right edge
const MIN_Y = 60; // Keep below status bar
const MAX_Y = height - 60; // Keep above bottom edge

// Spring configuration for devotional feel
const SPRING_CONFIG = {
  damping: 20, // Higher damping = less oscillation
  stiffness: 90, // Lower stiffness = slower movement
  mass: 1.2, // Higher mass = more weight feel
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Lift animation configuration
const LIFT_SCALE = 1.05;
const LIFT_TRANSLATION = -4;

export const AartiPlate: React.FC = () => {
  // Position values
  const translateX = useSharedValue(INITIAL_X);
  const translateY = useSharedValue(INITIAL_Y);
  
  // Lift effect values
  const scale = useSharedValue(1);
  const liftY = useSharedValue(0);
  
  // Context for gesture
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const isPressed = useSharedValue(false);

  // Clamp position to soft bounds
  const clampPosition = (value: number, min: number, max: number) => {
    'worklet';
    return Math.max(min, Math.min(max, value));
  };

  // Pan gesture - smooth finger tracking
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isPressed.value = true;
      startX.value = translateX.value;
      startY.value = translateY.value;
      
      // Lift the plate gently
      scale.value = withSpring(LIFT_SCALE, { damping: 15, stiffness: 150 });
      liftY.value = withSpring(LIFT_TRANSLATION, { damping: 15, stiffness: 150 });
    })
    .onUpdate((event) => {
      'worklet';
      // Follow finger smoothly - direct assignment for immediate response
      const newX = clampPosition(startX.value + event.translationX, MIN_X, MAX_X);
      const newY = clampPosition(startY.value + event.translationY, MIN_Y, MAX_Y);
      
      // Direct value assignment - no animation delay
      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd((event) => {
      'worklet';
      isPressed.value = false;
      
      // Return to origin with calm spring animation
      translateX.value = withSpring(INITIAL_X, SPRING_CONFIG);
      translateY.value = withSpring(INITIAL_Y, SPRING_CONFIG);
      
      // Reset lift effect
      scale.value = withSpring(1, { damping: 15, stiffness: 120 });
      liftY.value = withSpring(0, { damping: 15, stiffness: 120 });
    })
    .minDistance(5)
    .maxPointers(1); // Only allow single touch to prevent conflicts

  // Animated style for the plate
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + liftY.value },
        { scale: scale.value },
      ],
    };
  });

  // Shadow style (subtle elevation when lifted)
  const shadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = isPressed.value
      ? withSpring(0.4, { damping: 15 })
      : withSpring(0.15, { damping: 15 });

    return {
      shadowOpacity,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View 
        style={[styles.plateContainer, animatedStyle, shadowStyle]}
        pointerEvents="box-none"
      >
        <Image
          source={require('../../assets/images/rituals/aarti.png')}
          style={styles.plate}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  plateContainer: {
    position: 'absolute',
    width: PLATE_SIZE,
    height: PLATE_SIZE,
    // Shadow properties for depth
    shadowColor: '#FF9933', // Warm aarti glow color
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  plate: {
    width: '100%',
    height: '100%',
  },
});

```

## src/components/MusicBottomSheet.tsx
```tsx
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, Dimensions, StyleSheet, Text, View } from 'react-native';
import { useMusicStore } from '../store/musicStore';
import { MusicPlayerControls } from './MusicPlayerControls';
import { TrackList } from './TrackList';

const { height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.25; // 25% of screen height

export const MusicBottomSheet: React.FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const isBottomSheetOpen = useMusicStore((s) => s.isBottomSheetOpen);
  const setBottomSheetOpen = useMusicStore((s) => s.setBottomSheetOpen);
  const [currentIndex, setCurrentIndex] = React.useState(-1);

  // Open/close based on store state
  useEffect(() => {
    if (isBottomSheetOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isBottomSheetOpen]);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    setCurrentIndex(index);
    if (index === -1) {
      setBottomSheetOpen(false);
    }
  }, [setBottomSheetOpen]);

  // Handle app state changes - close sheet when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        bottomSheetRef.current?.close();
        setBottomSheetOpen(false);
        setCurrentIndex(-1);
      } else if (nextAppState === 'active') {
        bottomSheetRef.current?.close();
        setCurrentIndex(-1);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isBottomSheetOpen, setBottomSheetOpen]);

  return (
    <View 
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents={currentIndex === -1 ? 'none' : 'auto'}
    >
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[SHEET_HEIGHT]}
        enablePanDownToClose
        enableOverDrag={false}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        style={styles.bottomSheet}
        containerStyle={styles.container}
        animateOnMount={false}
      >
        {/* Header - Fixed */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Devotional Music</Text>
        </View>

        {/* Track List - Scrollable (direct child for scrolling to work) */}
        <TrackList />

        {/* Player Controls - Fixed at bottom */}
        <View style={styles.controlsWrapper}>
          <MusicPlayerControls />
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No z-index - controlled by wrapper View
  },
  bottomSheet: {
    // No z-index - controlled by wrapper View  
  },
  background: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#fbbf24',
    width: 40,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1a1a2e',
  },
  headerText: {
    fontSize: 18,
    fontFamily: 'Playfair_SemiBold',
    color: '#fbbf24',
    textAlign: 'center',
  },
  controlsWrapper: {
    paddingHorizontal: 16,
    backgroundColor: '#1a1a2e',
    paddingBottom: 8,
  },
});

```

## src/data/deityImages.ts
```tsx
/**
 * Static Deity Images Loader
 * Maps optimized JPEG images to their display names.
 */

export type Deity = {
  id: string;
  name: string;
  image: any;
  filename: string;
};

export const FINAL_DEITIES: Deity[] = [
  {
    id: '1',
    name: 'Goddess Devi',
    filename: 'devi.jpeg',
    image: require('../../assets/images/deities/devi.jpeg'), 
  },
  {
    id: '2',
    name: 'Lord Ganesha',
    filename: 'ganesha.jpeg',
    image: require('../../assets/images/deities/ganesha.jpeg'), 
  },
  {
    id: '3',
    name: 'Lord Hanuman',
    filename: 'hanuman.jpg',
    image: require('../../assets/images/deities/hanuman.jpg'), 
  },
  {
    id: '4',
    name: 'Lord Hanuman (Sunset)',
    filename: 'hanuman_sunset.jpg',
    image: require('../../assets/images/deities/hanuman_sunset.jpg'), 
  },
  {
    id: '5',
    name: 'Lord Krishna',
    filename: 'krishna.jpg',
    // ✅ UNCOMMENTED: Ensure 'krishna.jpg' is in the folder
    image: require('../../assets/images/deities/krishna.jpg'), 
  },
  {
    id: '6',
    name: 'Goddess Lakshmi',
    filename: 'lakshmi.jpg',
    image: require('../../assets/images/deities/lakshmi.jpg'), 
  },
  {
    id: '7',
    name: 'Lord Shiva',
    filename: 'shiva.jpg',
    image: require('../../assets/images/deities/shiva.jpg'), 
  },
  {
    id: '8',
    name: 'Lord Ram',
    filename: 'sriram.jpg',
    image: require('../../assets/images/deities/sriram.jpg'), 
  },
  {
    id: '9',
    name: 'Lord Buddha',
    filename: 'buddha.jpg',
    // ✅ ADDED: Ensure 'buddha.jpg' exists
    image: require('../../assets/images/deities/buddha.jpg'), 
  },
  {
    id: '10',
    name: 'Lord Mahavir',
    filename: 'mahavir.jpg',
    // ✅ ADDED: Ensure 'mahavir.jpg' exists
    image: require('../../assets/images/deities/mahavir.jpg'), 
  },
];

export const DEITIES = FINAL_DEITIES;
```
