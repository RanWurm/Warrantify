// app/(tabs)/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';
import { UserProvider } from '../context/UserContext'; // Adjust the path as needed

export default function TabsLayout() {
  return (
    <UserProvider>
      <Stack
        screenOptions={{
          headerStyle: { 
            backgroundColor: '#1e1e2f', // Consistent dark theme for the header
            shadowColor: 'transparent', // Remove shadow for a cleaner look
          },
          headerTintColor: '#ffffff', // White text/icons for contrast
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          headerBackTitleVisible: false, // Cleaner navigation without back title
        }}
      >
        <Stack.Screen
          name="home"
          options={{
            title: 'Home',
            headerStyle: { backgroundColor: '#4a90e2' }, // Specific style for Home
            headerLeft: null, // Remove back button for the root screen
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Login',
            headerShown: false, // Hides the header for Login screen
          }}
        />
        <Stack.Screen
          name="myWarranties"
          options={{
            title: 'My Warranties',
            headerStyle: { backgroundColor: '#5856d6' }, // Unique color for My Warranties
            headerLeft: null,
            headerShown: false, // Disable back button for My Warranties
          }}
        />
        <Stack.Screen
          name="recommended"
          options={{
            title: 'Recommended',
            headerStyle: { backgroundColor: '#5856d6' }, // Unique color for Recommended
            headerLeft: null,
            headerShown: false, // Disable back button for Recommended
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerStyle: { backgroundColor: '#5856d6' }, // Unique color for Settings
            headerLeft: null,
            headerShown: false, // Disable back button for Settings
          }}
        />
        <Stack.Screen
          name="account"
          options={{
            title: 'Account',
            headerStyle: { backgroundColor: '#5856d6' }, // Unique color for Account Settings
            headerLeft: null,
            headerShown: false, // Disable back button for Account Settings
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: 'About',
            headerStyle: { backgroundColor: '#5856d6' }, // Unique color for About
            headerLeft: null,
            headerShown: false, // Disable back button for About
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            title: 'Privacy',
            headerStyle: { backgroundColor: '#5856d6' }, // Unique color for Privacy
            headerLeft: null,
            headerShown: false, // Disable back button for Privacy
          }}
        />
        <Stack.Screen
          name="helpAndSupport"
          options={{
            title: 'Help & Support',
            headerStyle: { backgroundColor: '#5856d6' }, // Unique color for Help & Support
            headerLeft: null,
            headerShown: false, // Disable back button for Help & Support
          }}
        />
      </Stack>
    </UserProvider>
  );
}
