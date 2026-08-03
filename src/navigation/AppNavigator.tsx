import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform, Text, View } from 'react-native';

import { CalendarScreen } from '../screens/CalendarScreen';
import { ArticlesScreen } from '../screens/ArticlesScreen';
import { ArticleReaderScreen } from '../screens/ArticleReaderScreen';
import { FilmsScreen } from '../screens/FilmsScreen';
import { FilmPlayerScreen } from '../screens/FilmPlayerScreen';
import { ComicReaderScreen } from '../screens/ComicReaderScreen';
import { PathInfoScreen } from '../screens/PathInfoScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { SaharaScreen } from '../screens/SaharaScreen';
import { SaharaDetailScreen } from '../screens/SaharaDetailScreen';
import { JapaScreen } from '../screens/JapaScreen';
import { KathaScrollScreen } from '../screens/KathaScrollScreen';
import { WallpapersScreen } from '../screens/WallpapersScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { ChalisaPathScreen } from '../screens/ChalisaPathScreen';
import { FestivalDetailScreen } from '../screens/FestivalDetailScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { MandirScreen } from '../screens/MandirScreen';
import { SadhanaScreen } from '../screens/SadhanaScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WisdomDetailScreen } from '../screens/WisdomDetailScreen';
import { NoticeboardScreen } from '../screens/NoticeboardScreen';
import { OfferingScreen } from '../screens/OfferingScreen';
import { getFaithTheme } from '../data/faiths';
import { usePreferencesStore } from '../store/preferencesStore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<any>();

/**
 * Main bottom tab navigator
 */
const MainTabs: React.FC = () => {
  const primary = usePreferencesStore((s) => s.primaryTradition);
  const accent = getFaithTheme(primary).accent;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabel: ({ focused, color }) => {
          const labels: Record<string, string> = {
            Home: 'Today', Mandir: 'Mandir',
            Calendar: 'Calendar', Store: 'Shop', Settings: 'You',
          };
          return (
            <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '500', marginTop: 2 }}>
              {labels[route.name] ?? route.name}
            </Text>
          );
        },
        tabBarActiveTintColor: accent,
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
          if (route.name === 'Mandir') iconName = focused ? 'flame' : 'flame-outline';
          if (route.name === 'Calendar') iconName = focused ? 'calendar' : 'calendar-outline';
          if (route.name === 'Store') iconName = focused ? 'cart' : 'cart-outline';
          if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';

          return (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: focused ? getFaithTheme(primary).accentSoft : 'transparent',
              }}
            >
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={TodayScreen} />
      <Tab.Screen name="Mandir" component={MandirScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      {/* Shop links out to external stores — hidden on iOS (App Review 4.2.2 / 3.1.1). */}
      {Platform.OS !== 'ios' && <Tab.Screen name="Store" component={ShopScreen} />}
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
      {/* Learn moved from tab → stack: Mandir's Teachings "See all" is the way in */}
      <Stack.Screen name="Learn" component={LearnScreen} />
      <Stack.Screen name="WisdomDetail" component={WisdomDetailScreen} />
      <Stack.Screen name="FestivalDetail" component={FestivalDetailScreen as any} />
      <Stack.Screen name="ChalisaPath" component={ChalisaPathScreen} />
      <Stack.Screen name="Sadhana" component={SadhanaScreen} />
      <Stack.Screen name="Articles" component={ArticlesScreen} />
      <Stack.Screen name="ArticleReader" component={ArticleReaderScreen} />
      <Stack.Screen name="Films" component={FilmsScreen} />
      <Stack.Screen name="FilmPlayer" component={FilmPlayerScreen} />
      <Stack.Screen name="ComicReader" component={ComicReaderScreen} />
      <Stack.Screen name="PathInfo" component={PathInfoScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Sahara" component={SaharaScreen} />
      <Stack.Screen name="SaharaDetail" component={SaharaDetailScreen} />
      <Stack.Screen name="Japa" component={JapaScreen} />
      <Stack.Screen name="KathaScroll" component={KathaScrollScreen} />
      <Stack.Screen name="Wallpapers" component={WallpapersScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Noticeboard" component={NoticeboardScreen} />
      <Stack.Screen name="Offering" component={OfferingScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
