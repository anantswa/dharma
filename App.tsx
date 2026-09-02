import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { MusicBottomSheet } from './src/components/MusicBottomSheet';
import AppNavigator from './src/navigation/AppNavigator';
import { AudioService } from './src/services/audioService';
import { initializeNotifications } from './src/services/notificationService';
import { usePreferencesStore } from './src/store/preferencesStore';
import { useDataStore } from './src/store/dataStore';
import { loadImageIndex } from './src/services/imageService';

export default function App() {
  const navigationRef = useRef<any>(null);

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

  // Notification taps: the legacy daily-wisdom handler is gone with its pipeline —
  // an ārati-bell tap simply opens the app (Today's strip holds the same darshan),
  // and notificationService's own listener tracks bell_open.

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <StatusBar style="light" />
        <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
        </SafeAreaProvider>
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
