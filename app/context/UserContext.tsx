// app/context/UserContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router'; // Import useRouter
import { getAuth, signOut, onAuthStateChanged, User as FirebaseUser } from '../../constants/customAuth';



interface UserContextProps {
  userId: number | null;
  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  loading: boolean; // Add loading to interface
  assignUserId: (uid: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const UserContext = createContext<UserContextProps>({
  userId: null,
  isAuthenticated: false,
  firebaseUser: null,
  loading: true, // Default to loading state
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
  const [loading, setLoading] = useState<boolean>(true); // Add loading state

  const auth = getAuth();
  const router = useRouter();
  const USER_ID_KEY_PREFIX = 'user_id_';



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
    await AsyncStorage.clear();
    console.log('User signed out successfully.');
    
    // Clear the entire navigation stack and go to login
    try {
      // Try multiple approaches to ensure navigation works
      if (router.canDismissAll) {
        router.dismissAll();
      }
      router.replace('/login');
    } catch (navError) {
      console.log('Navigation error during logout:', navError);
      // Fallback - force a page reload/restart
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    }
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
      value={{ 
        userId, 
        isAuthenticated, 
        firebaseUser, 
        loading, // Export loading state
        assignUserId, 
        logout 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};