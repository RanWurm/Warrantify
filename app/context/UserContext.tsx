// app/context/UserContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';

const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

interface UserContextProps {
  userId: number | null;
  isAuthenticated: boolean;
  userData: any | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export const UserContext = createContext<UserContextProps>({
  userId: null,
  isAuthenticated: false,
  userData: null,
  loading: true,
  token: null,
  login: async () => false,
  logout: async () => {},
  refreshUserData: async () => {},
});

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<number | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);

  const router = useRouter();

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing auth state...');
      
      const [storedToken, storedUserData, isLoggedIn] = await AsyncStorage.multiGet([
        'token',
        'userData', 
        'isLoggedIn'
      ]);

      const tokenValue = storedToken[1];
      const userDataValue = storedUserData[1];
      const loggedInValue = isLoggedIn[1];

      console.log('📱 Stored login flag:', loggedInValue);
      console.log('🔑 Stored token exists:', !!tokenValue);
      console.log('👤 Stored user data exists:', !!userDataValue);

      if (loggedInValue === 'true' && tokenValue && userDataValue) {
        // Try to verify token is still valid
        try {
          const response = await axios.post(`${serverBackendURL}/userdata`, { 
            token: tokenValue 
          });

          if (response.data.Status === "Ok") {
            // Token is valid, restore auth state
            const parsedUserData = JSON.parse(userDataValue);
            setToken(tokenValue);
            setUserData(response.data.data); // Use fresh data from server
            setUserId(response.data.data.id);
            setIsAuthenticated(true);
            
            // Update stored user data with fresh data
            await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
            
            console.log('✅ Auth state restored successfully');
          } else {
            console.log('❌ Token invalid, clearing auth state');
            await clearAuthState();
          }
        } catch (error) {
          console.warn('⚠️ Token verification failed, but keeping user logged in:', error);
          
          // If network error, keep user logged in with cached data
          const parsedUserData = JSON.parse(userDataValue);
          setToken(tokenValue);
          setUserData(parsedUserData);
          setUserId(parsedUserData.id);
          setIsAuthenticated(true);
        }
      } else {
        console.log('❌ No valid auth data found');
        await clearAuthState();
      }
    } catch (error) {
      console.error('🚨 Error initializing auth:', error);
      await clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login...');
      
      const response = await axios.post(`${serverBackendURL}/login`, {
        email,
        password
      });

      if (response.data.status === "ok" && response.data.data) {
        const authToken = response.data.data;

        // Get user data
        const userDataResponse = await axios.post(`${serverBackendURL}/userdata`, { 
          token: authToken 
        });

        if (userDataResponse.data.Status === "Ok") {
          const user = userDataResponse.data.data;

          // Store auth data
          await AsyncStorage.multiSet([
            ['token', authToken],
            ['userData', JSON.stringify(user)],
            ['isLoggedIn', 'true']
          ]);

          // Update state
          setToken(authToken);
          setUserData(user);
          setUserId(user.id);
          setIsAuthenticated(true);

          console.log('✅ Login successful');
          return true;
        }
      }

      console.log('❌ Login failed - invalid response');
      return false;
    } catch (error) {
      console.error('🚨 Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await clearAuthState();
      
      // Navigate to login
      router.replace('/login');
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('🚨 Logout error:', error);
    }
  };

  const clearAuthState = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        'token',
        'userData',
        'isLoggedIn',
        // Clear cache data as well
        'cached_warranties',
        'cached_user_profile',
        'cached_transformed_warranties',
        'cached_warranty_stats',
        'warranties_last_update',
        'cachedServiceCenters',
        'serviceCentersLastUpdate',
        'cached_real_ads',
        'cached_recommendations',
        'cached_top_products',
        'cached_combined_ads',
        'ad_board_last_update'
      ]);

      // Clear state
      setToken(null);
      setUserData(null);
      setUserId(null);
      setIsAuthenticated(false);

      console.log('🧹 Auth state cleared');
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  const refreshUserData = async () => {
    if (!token) return;

    try {
      console.log('🔄 Refreshing user data...');
      
      const response = await axios.post(`${serverBackendURL}/userdata`, { token });
      
      if (response.data.Status === "Ok") {
        const freshUserData = response.data.data;
        setUserData(freshUserData);
        
        // Update stored data
        await AsyncStorage.setItem('userData', JSON.stringify(freshUserData));
        
        console.log('✅ User data refreshed');
      }
    } catch (error) {
      console.warn('⚠️ Failed to refresh user data:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{ 
        userId, 
        isAuthenticated, 
        userData,
        loading, 
        token,
        login,
        logout,
        refreshUserData
      }}
    >
      {children}
    </UserContext.Provider>
  );
};