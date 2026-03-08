import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View } from 'react-native';

import { GameProvider, useGame } from './src/context/GameContext';
import MapScreen from './src/screens/MapScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ShopScreen from './src/screens/ShopScreen';
import LandmarksScreen from './src/screens/LandmarksScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Tab = createBottomTabNavigator();

const navIcons = {
  map: require('./assets/nav_icons/map.png'),
  leaderboard: require('./assets/nav_icons/leaderboard.png'),
  landmark: require('./assets/nav_icons/landmark.png'),
  shop: require('./assets/nav_icons/shop.png'),
  profile: require('./assets/nav_icons/profile.png'),
};

function TabIcon({ icon, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={icon}
        style={{
          width: 56,
          height: 56,
          resizeMode: 'contain',
          opacity: focused ? 1 : 0.4,
        }}
      />
    </View>
  );
}

function MainApp() {
  const { state } = useGame();

  if (!state.isOnboarded) {
    return <OnboardingScreen />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#16213e',
            borderTopColor: '#0f3460',
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 0,
            paddingTop: 15,
            justifyContent: 'center',
          },
          tabBarActiveTintColor: '#e94560',
          tabBarInactiveTintColor: '#666',
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={navIcons.map} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={navIcons.leaderboard} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Landmarks"
          component={LandmarksScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={navIcons.landmark} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Shop"
          component={ShopScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={navIcons.shop} focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={navIcons.profile} focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GameProvider>
      <MainApp />
    </GameProvider>
  );
}
