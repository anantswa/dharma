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
