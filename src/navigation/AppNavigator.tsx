// src/navigation/AppNavigator.tsx
import React from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { WisdomScreen } from '../screens/WisdomScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WisdomDetailScreen } from '../screens/WisdomDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: false,
      tabBarActiveTintColor: '#fbbf24',
      tabBarInactiveTintColor: '#9ca3af',
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
        if (route.name === 'Wisdom') iconName = focused ? 'book' : 'book-outline';
        if (route.name === 'Calendar') iconName = focused ? 'calendar' : 'calendar-outline';
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
    <Tab.Screen name="Wisdom" component={WisdomScreen} />
    <Tab.Screen name="Calendar" component={CalendarScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="WisdomDetail" component={WisdomDetailScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
