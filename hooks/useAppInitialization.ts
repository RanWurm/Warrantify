// hooks/useAppInitialization.ts - DON'T WAIT for cache services

import { useEffect, useState } from 'react';
import serviceCentersCache from '../services/serviceCentersCache';
import warrantiesCacheService from '../services/warrantiesCacheService';
import adBoardCacheService from '../services/adBoardCacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // Check if user is logged in
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        const token = await AsyncStorage.getItem('token');
        
        console.log('🔍 App init - Login flag:', isLoggedIn, 'Token exists:', !!token);
        
        // IMMEDIATELY mark as initialized - don't wait for cache services
        setIsInitialized(true);
        console.log('✅ App initialized (UI ready)');
        
        // ONLY start background preloading if user is logged in
        if (isLoggedIn === 'true' && token) {
          console.log('🔄 Starting background cache preload...');
          
          // Start ALL cache services in background - but DON'T AWAIT them
          // This way the UI shows immediately, but data will load in background
          Promise.allSettled([
            warrantiesCacheService.preloadWarranties().catch(error => {
              console.warn('Warranties background preload failed:', error);
            }),
            adBoardCacheService.preloadAdBoard().catch(error => {
              console.warn('AdBoard background preload failed:', error);
            }),
            serviceCentersCache.preloadServiceCenters().catch(error => {
              console.warn('Service centers background preload failed:', error);
            })
          ]).then(() => {
            console.log('✅ Background preload completed');
          });
          
        } else {
          console.log('❌ User not logged in, skipping background preload');
        }
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitialized(true); // Still show UI even on error
      }
    };

    initializeApp();
  }, []);

  return { isInitialized, initializationError };
};