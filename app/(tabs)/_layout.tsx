// app/(tabs)/_layout.tsx - ADD INDEX SCREEN

import React from 'react';
import { Stack } from 'expo-router';

export default function TabsLayout() {
  console.log("app/(tabs)/_layout.tsx")
  return (
      <Stack
        screenOptions={{
          headerStyle: { 
            backgroundColor: '#1e1e2f',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        {/* ADD THIS - The missing index screen */}
        <Stack.Screen
          name="index"
          options={{
            title: 'Loading',
            headerShown: false,
          }}
        />
        
        <Stack.Screen
          name="home"
          options={{
            title: 'Home',
            headerStyle: { backgroundColor: '#4a90e2' },
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Login',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="myWarranties"
          options={{
            title: 'My Warranties',
            headerStyle: { backgroundColor: '#5856d6' },
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="recommended"
          options={{
            title: 'Recommended',
            headerStyle: { backgroundColor: '#5856d6' },
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerStyle: { backgroundColor: '#5856d6' },
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="account"
          options={{
            title: 'Account',
            headerStyle: { backgroundColor: '#5856d6' },
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: 'About',
            headerStyle: { backgroundColor: '#5856d6' },
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            title: 'Privacy',
            headerStyle: { backgroundColor: '#5856d6' },
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="helpAndSupport"
          options={{
            title: 'Help & Support',
            headerStyle: { backgroundColor: '#5856d6' },
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="adBoard"
          options={{
            title: 'Ad Board',
            headerShown: false,
          }}
        />
        <Stack.Screen
            name="productInformation"
            options={{
                title: 'product Information',
                headerShown: false,
            }}
            />
      </Stack>
  );
}