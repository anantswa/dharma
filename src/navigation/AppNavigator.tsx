import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform, Text, View } from 'react-native';

import { CalendarScreen } from '../screens/CalendarScreen';
import { ArticlesScreen } from '../screens/ArticlesScreen';
import { ArticleReaderScreen } from '../screens/ArticleReaderScreen';
import { FilmsScreen } from '../screens/FilmsScreen';
import { ComicReaderScreen } from '../screens/ComicReaderScreen';
import { PathInfoScreen } from '../screens/PathInfoScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { SaharaScreen } from '../screens/SaharaScreen';
import { SaharaDetailScreen } from '../screens/SaharaDetailScreen';
import { ChalisaPathScreen } from '../screens/ChalisaPathScreen';
import { FestivalDetailScreen } from '../screens/FestivalDetailScreen';
import { GitaAudioScreen } from '../screens/GitaAudioScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { SadhanaScreen } from '../screens/SadhanaScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { LessonFlowScreen } from '../screens/LessonFlowScreen';
import { LessonSelectionScreen } from '../screens/LessonSelectionScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WisdomDetailScreen } from '../screens/WisdomDetailScreen';
import { WisdomScreen } from '../screens/WisdomScreen';

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
        tabBarShowLabel: true,
        tabBarLabel: ({ focused, color }) => {
          const labels: Record<string, string> = {
            Home: 'Today', Learn: 'Learn', Wisdom: 'Wisdom',
            Calendar: 'Calendar', Store: 'Shop', Settings: 'You',
          };
          return (
            <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '500', marginTop: 2 }}>
              {labels[route.name] ?? route.name}
            </Text>
          );
        },
        tabBarActiveTintColor: '#fbbf24',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarHideOnKeyboard: true,
        lazy: false,
        unmountOnBlur: false,
        freezeOnBlur: false,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: Platform.OS === 'ios' ? 24 : 16,
          height: 74,
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

          if (route.name === 'Home') iconName = focused ? 'sunny' : 'sunny-outline';
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
      <Tab.Screen name="Home" component={TodayScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Store" component={ShopScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

/**
 * Root stack navigator
 * Handles onboarding flow and main app navigation
 */
const AppNavigator: React.FC = () => {
  // No onboarding/faith-picker — launch straight into the app.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Temple" component={HomeScreen} />
      <Stack.Screen name="WisdomDetail" component={WisdomDetailScreen} />
      <Stack.Screen name="FestivalDetail" component={FestivalDetailScreen as any} />
      <Stack.Screen name="LessonSelection" component={LessonSelectionScreen} />
      <Stack.Screen name="LessonFlow" component={LessonFlowScreen as any} />
      <Stack.Screen name="GitaAudio" component={GitaAudioScreen} />
      <Stack.Screen name="ChalisaPath" component={ChalisaPathScreen} />
      <Stack.Screen name="Sadhana" component={SadhanaScreen} />
      <Stack.Screen name="Articles" component={ArticlesScreen} />
      <Stack.Screen name="ArticleReader" component={ArticleReaderScreen} />
      <Stack.Screen name="Films" component={FilmsScreen} />
      <Stack.Screen name="ComicReader" component={ComicReaderScreen} />
      <Stack.Screen name="PathInfo" component={PathInfoScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Sahara" component={SaharaScreen} />
      <Stack.Screen name="SaharaDetail" component={SaharaDetailScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
