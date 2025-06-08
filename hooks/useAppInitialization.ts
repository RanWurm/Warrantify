// hooks/useAppInitialization.ts
import { useEffect, useState } from 'react';
import serviceCentersCache from '../services/serviceCentersCache';
import warrantiesCacheService from '../services/warrantiesCacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // Check if user is logged in
        const token = await AsyncStorage.getItem('token');
        
        if (token) {
          // Start preloading both service centers and warranties in background
          // Don't await - let them run in background
          Promise.all([
            serviceCentersCache.preloadServiceCenters().catch(error => {
              console.warn('Service centers background preload failed:', error);
            }),
            warrantiesCacheService.preloadWarranties().catch(error => {
              console.warn('Warranties background preload failed:', error);
            })
          ]);
        }
        
        setIsInitialized(true);
        console.log('✅ App initialized');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitialized(true); // Still mark as initialized to not block UI
      }
    };

    initializeApp();
  }, []);

  return { isInitialized, initializationError };
};