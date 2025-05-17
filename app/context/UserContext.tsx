import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BackHandler, Platform } from 'react-native';

interface UserContextProps {
  userId: number | null;
  isAuthenticated: boolean;
  assignUserId: (uid: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
}

const UserContext = createContext<UserContextProps>({
  userId: null,
  isAuthenticated: false,
  assignUserId: async () => {},
  logout: async () => {},
  checkAuthStatus: async () => false,
});

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const USER_ID_KEY_PREFIX = 'user_id_';
  const router = useRouter();

  // Function to generate a random user_id between 1 and 200,000
  const generateRandomUserId = (): number => {
    return Math.floor(Math.random() * 12659) + 1;
  };

  // Check if user has valid token
  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('token');
      const isAuth = !!token;
      setIsAuthenticated(isAuth);
      return isAuth;
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Assign or retrieve user_id based on Firebase UID
  const assignUserId = async (uid: string) => {
    try {
      const storageKey = `${USER_ID_KEY_PREFIX}${uid}`;
      const storedUserId = await AsyncStorage.getItem(storageKey);

      if (storedUserId) {
        // `user_id` already assigned
        setUserId(parseInt(storedUserId, 10));
        console.log(`Existing user_id for UID ${uid}: ${storedUserId}`);
      } else {
        // Assign a new `user_id` randomly
        const newUserId = generateRandomUserId();
        console.log("newUSerId is ", newUserId)
        await AsyncStorage.setItem(storageKey, newUserId.toString());
        setUserId(newUserId);
        console.log(`Assigned new user_id for UID ${uid}: ${newUserId}`);
      }
    } catch (error) {
      console.error('Error assigning user_id:', error);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setUserId(null);
      // Remove the token
      await AsyncStorage.removeItem('token');
      // Optionally, clear all user-related data
      // await AsyncStorage.clear(); // Be careful with this as it clears ALL data
      console.log('User signed out successfully.');
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle back button press on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        const currentRoute = router.pathname;
        // If on login screen, exit app instead of going back
        if (currentRoute === '/login') {
          BackHandler.exitApp();
          return true; // Prevent default behavior
        }
        return false; // Let default behavior happen (navigation back)
      });

      return () => backHandler.remove(); // Cleanup
    }
  }, [router.pathname]);

  // Check authentication status on load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <UserContext.Provider
      value={{ userId, isAuthenticated, assignUserId, logout, checkAuthStatus }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;