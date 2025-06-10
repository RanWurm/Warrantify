// app/(tabs)/index.tsx
import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  console.log('🚨 INDEX IS RUNNING!');
  
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const loginFlag = await AsyncStorage.getItem('isLoggedIn');
    const token = await AsyncStorage.getItem('token');
    
    console.log('Auth check:', loginFlag, !!token);
    
    setIsLoggedIn(loginFlag === 'true' && !!token);
  };

  if (isLoggedIn === null) return null; // Loading
  
  return <Redirect href={isLoggedIn ? "/home" : "/login"} />;
}