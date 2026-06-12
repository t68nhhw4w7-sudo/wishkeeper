// src/navigation/AppNavigator.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';

import DashboardScreen from '../screens/DashboardScreen';
import WishesScreen    from '../screens/WishesScreen';
import FamilyScreen    from '../screens/FamilyScreen';
// Additional screens would be imported here:
// import EventsScreen, GiftTrackerScreen, MemoriesScreen, RemindersScreen, AIAssistantScreen

const PURPLE = '#534AB7';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─── Tab icon component ───────────────────────────────────────────────────────

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 6 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, color: focused ? PURPLE : '#aaa', marginTop: 2, fontWeight: focused ? '700' : '400' }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff', shadowColor: 'transparent', elevation: 0 },
        headerTitleStyle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
        tabBarStyle: { height: 80, paddingBottom: 10, borderTopColor: '#f0eeff', backgroundColor: '#fff' },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: 'WishKeeper',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 22 }}>🔔</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Wishes"
        component={WishesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎁" label="Wishes" focused={focused} />,
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 22 }}>🔍</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        // component={EventsScreen}  // swap in when screen is created
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎂" label="Events" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👨‍👩‍👧" label="Family" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="More"
        // component={MoreScreen}  // swap in when screen is created
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="✨" label="More" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Onboarding / auth screens would go here first */}
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
