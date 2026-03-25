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
