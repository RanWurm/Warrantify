import React, { useEffect, useState, useContext } from 'react';
import { Redirect } from 'expo-router';
import UserContext from '../context/UserContext';
import { View, ActivityIndicator, Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, checkAuthStatus } = useContext(UserContext);
  const [debugMode, setDebugMode] = useState(true); // Set to true for testing

  useEffect(() => {
    // TEMPORARY: Clear any existing tokens for a clean start
    // You can remove this block after the first successful run
    const resetTokens = async () => {
      if (debugMode) {
        try {
          // Clear the token to force a fresh login
          await AsyncStorage.removeItem('token');
          console.log('⚠️ DEBUG: Token cleared for testing');
        } catch (error) {
          console.error('Error clearing token:', error);
        }
      }
    };
    
    // Check auth status from context
    const initAuth = async () => {
      if (debugMode) {
        await resetTokens(); // Only in debug mode
      }
      await checkAuthStatus();
      setLoading(false);
    };

    initAuth();
  }, []);

  // DEBUG SCREEN - Remove this in production
  if (loading && debugMode) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ marginBottom: 20, textAlign: 'center' }}>
          Transitioning to token-based auth. Clearing old tokens...
        </Text>
        <ActivityIndicator size="large" color="#4f3e2f" />
      </View>
    );
  } else if (loading) {
    // Normal loading indicator
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f3e2f" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  } else {
    return <Redirect href="/login" />;
  }
}