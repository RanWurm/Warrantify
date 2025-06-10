// app/_layout.tsx - SIMPLIFIED VERSION

import React from 'react';
import { Stack } from 'expo-router';
// import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function RootLayout() {
  // Remove the initialization hook completely - let index.tsx handle everything
  console.log("app/_layout.tsx")
  return (
    <Stack
      screenOptions={{
        headerShown: false, // This is the key fix!
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
    </Stack>
  );
}