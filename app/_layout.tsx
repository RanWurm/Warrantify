// app/_layout.tsx - Fixed version
import React from 'react';
import { Stack } from 'expo-router';
import { useAppInitialization } from '../hooks/useAppInitialization';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function RootLayout() {
  const { isInitialized, initializationError } = useAppInitialization();

  // Optional: Show a minimal splash screen while initializing (without white background)
  if (!isInitialized) {
    return (
      <View style={styles.initContainer}>
        <ActivityIndicator size="large" color="#4f3e2f" />
        <Text style={styles.initText}>Initializing app...</Text>
      </View>
    );
  }

  // Show error if initialization failed (optional)
  if (initializationError) {
    console.warn('App initialization error:', initializationError);
    // Still proceed to show the app
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false, // This is the key fix!
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Your other screens */}
    </Stack>
  );
}

const styles = StyleSheet.create({
  initContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E9E0D4', // Match your app background, not white
  },
  initText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4f3e2f',
    fontFamily: 'InriaSerif-Regular',
  },
});