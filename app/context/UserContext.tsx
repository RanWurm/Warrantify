// app/context/UserContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'expo-router'; // Import useRouter

// Initialize Firebase if not already done
// import { initializeApp } from 'firebase/app';
// const firebaseConfig = { /* Your Firebase config */ };
// initializeApp(firebaseConfig);

interface UserContextProps {
  userId: number | null;
  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  assignUserId: (uid: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const UserContext = createContext<UserContextProps>({
  userId: null,
  isAuthenticated: false,
  firebaseUser: null,
  assignUserId: async () => {},
  logout: async () => {},
});

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<number | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const USER_ID_KEY_PREFIX = 'user_id_';

  const auth = getAuth();
  const router = useRouter(); // Initialize router

  // Function to generate a random user_id between 1 and 200,000
  const generateRandomUserId = (): number => {
    return Math.floor(Math.random() * 12659) + 1;
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
      await signOut(auth);
      setFirebaseUser(null);
      setIsAuthenticated(false);
      setUserId(null);
      // Optionally, clear all user-related data from AsyncStorage
      await AsyncStorage.clear();
      console.log('User signed out successfully.');
      router.replace('/login'); // Navigate to Login screen
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsAuthenticated(true);
        await assignUserId(user.uid);
      } else {
        setFirebaseUser(null);
        setIsAuthenticated(false);
        setUserId(null);
        router.replace('/login'); // Navigate to Login screen if not authenticated
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider
      value={{ userId, isAuthenticated, firebaseUser, assignUserId, logout }}
    >
      {children}
    </UserContext.Provider>
  );
};
