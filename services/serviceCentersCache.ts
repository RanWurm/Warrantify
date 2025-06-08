// services/serviceCentersCache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

const serverBackendURL =
  Constants.expoConfig?.extra?.SERVER_BACKEND_URL ||
  (Constants as any).manifest?.extra?.SERVER_BACKEND_URL;
const googleApiKey = 'AIzaSyCn-qqKYulPv-Ken38MtqimNa1AiJFluic';

const STORAGE_KEYS = {
  serviceCenters: 'cachedServiceCenters',
  warranties: 'cachedWarranties',
  location: 'cachedLocation',
  lastUpdate: 'serviceCentersLastUpdate',
};

export interface LocatedCenter {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  isOpen?: boolean;
  closeTime?: string;
  distanceKm?: number;
}

interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface Warranty {
  serviceCenter?: string;
}

class ServiceCentersCacheService {
  private static instance: ServiceCentersCacheService;
  private isLoading = false;
  private loadingPromise: Promise<void> | null = null;

  static getInstance(): ServiceCentersCacheService {
    if (!ServiceCentersCacheService.instance) {
      ServiceCentersCacheService.instance = new ServiceCentersCacheService();
    }
    return ServiceCentersCacheService.instance;
  }

  // Check if cache is still valid (24 hours)
  private async isCacheValid(): Promise<boolean> {
    try {
      const lastUpdate = await AsyncStorage.getItem(STORAGE_KEYS.lastUpdate);
      if (!lastUpdate) return false;
      
      const lastUpdateTime = parseInt(lastUpdate);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      return (now - lastUpdateTime) < twentyFourHours;
    } catch {
      return false;
    }
  }

  // Get cached location (valid for 1 hour)
  private async getCachedLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.location);
      if (!cached) return null;
      
      const location: CachedLocation = JSON.parse(cached);
      const oneHour = 60 * 60 * 1000;
      
      if (Date.now() - location.timestamp < oneHour) {
        return { latitude: location.latitude, longitude: location.longitude };
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  // Cache location
  private async cacheLocation(latitude: number, longitude: number): Promise<void> {
    try {
      const location: CachedLocation = {
        latitude,
        longitude,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.location, JSON.stringify(location));
    } catch {
      // Ignore cache errors
    }
  }

  // Get fresh location
  private async getFreshLocation(): Promise<{ latitude: number; longitude: number }> {
    // Try cached location first
    const cached = await this.getCachedLocation();
    if (cached) return cached;

    // Request fresh location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // Faster than high accuracy
      timeout: 10000,
    });

    const location = { latitude: coords.latitude, longitude: coords.longitude };
    await this.cacheLocation(location.latitude, location.longitude);
    return location;
  }

  // Fetch warranties with caching
  private async getWarranties(): Promise<Warranty[]> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const { data } = await axios.post(`${serverBackendURL}/user-warranties`, { token });
      const warranties: Warranty[] = data.data;
      
      // Cache warranties
      await AsyncStorage.setItem(STORAGE_KEYS.warranties, JSON.stringify(warranties));
      return warranties;
    } catch (error) {
      // Try to return cached warranties on error
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.warranties);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }

  // Geocode service centers in parallel with better error handling
  private async geocodeServiceCenters(
    serviceNames: string[],
    userLocation: { latitude: number; longitude: number }
  ): Promise<LocatedCenter[]> {
    const results = await Promise.allSettled(
      serviceNames.map(async (name): Promise<LocatedCenter | null> => {
        try {
          // Search for the service center
          const searchResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
              name
            )}&location=${userLocation.latitude},${userLocation.longitude}&radius=15000&key=${googleApiKey}`,
            { timeout: 8000 } // 8 second timeout
          );
          
          if (!searchResponse.ok) return null;
          
          const searchData = await searchResponse.json();
          if (!searchData.results?.length) return null;

          // Find closest result
          const [best] = searchData.results.sort(
            (a: any, b: any) =>
              Math.hypot(
                a.geometry.location.lat - userLocation.latitude,
                a.geometry.location.lng - userLocation.longitude
              ) -
              Math.hypot(
                b.geometry.location.lat - userLocation.latitude,
                b.geometry.location.lng - userLocation.longitude
              )
          );

          // Get place details (with timeout)
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${best.place_id}&key=${googleApiKey}`,
            { timeout: 8000 }
          );
          
          let details: any = {};
          if (detailsResponse.ok) {
            details = await detailsResponse.json();
          }

          return {
            name,
            address: best.formatted_address || best.vicinity || 'Unknown',
            latitude: best.geometry.location.lat,
            longitude: best.geometry.location.lng,
            phone: details.result?.formatted_phone_number,
            isOpen: details.result?.opening_hours?.open_now,
            closeTime: details.result?.opening_hours?.periods?.[0]?.close?.time,
            distanceKm: Math.round(
              10 *
                Math.hypot(
                  best.geometry.location.lat - userLocation.latitude,
                  best.geometry.location.lng - userLocation.longitude
                ) *
                111
            ) / 10,
          };
        } catch (error) {
          console.warn(`Failed to geocode ${name}:`, error);
          return null;
        }
      })
    );

    return results
      .filter((result): result is PromiseFulfilledResult<LocatedCenter | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!);
  }

  // Main method to preload service centers
  async preloadServiceCenters(): Promise<void> {
    // Prevent multiple simultaneous loads
    if (this.isLoading && this.loadingPromise) {
      return this.loadingPromise;
    }

    // Check if cache is still valid
    if (await this.isCacheValid()) {
      return;
    }

    this.isLoading = true;
    this.loadingPromise = this._performPreload();
    
    try {
      await this.loadingPromise;
    } finally {
      this.isLoading = false;
      this.loadingPromise = null;
    }
  }

  private async _performPreload(): Promise<void> {
    try {
      console.log('🔄 Preloading service centers...');
      
      // Get location and warranties in parallel
      const [location, warranties] = await Promise.all([
        this.getFreshLocation(),
        this.getWarranties(),
      ]);

      // Extract unique service center names
      const serviceNames = Array.from(
        new Set(
          warranties
            .map(w => w.serviceCenter)
            .filter((name): name is string => Boolean(name))
        )
      );

      if (serviceNames.length === 0) {
        console.log('📍 No service centers to geocode');
        return;
      }

      // Geocode all service centers
      const geocodedCenters = await this.geocodeServiceCenters(serviceNames, location);

      // Deduplicate using normalized name + coordinates
      const uniqueMap = new Map<string, LocatedCenter>();
      for (const center of geocodedCenters) {
        const normalizedName = center.name.trim().toLowerCase().replace(/\s+/g, '');
        const coordKey = `${normalizedName}::${center.latitude.toFixed(4)}:${center.longitude.toFixed(4)}`;
        if (!uniqueMap.has(coordKey)) {
          uniqueMap.set(coordKey, center);
        }
      }

      const uniqueCenters = Array.from(uniqueMap.values());

      // Cache the results
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.serviceCenters, JSON.stringify(uniqueCenters)],
        [STORAGE_KEYS.lastUpdate, Date.now().toString()],
      ]);

      console.log(`✅ Cached ${uniqueCenters.length} service centers`);
    } catch (error) {
      console.warn('⚠️ Failed to preload service centers:', error);
    }
  }

  // Get cached service centers
  async getCachedServiceCenters(): Promise<LocatedCenter[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.serviceCenters);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  // Force refresh cache
  async refreshCache(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.lastUpdate);
    await this.preloadServiceCenters();
  }

  // Check if data is currently loading
  isCurrentlyLoading(): boolean {
    return this.isLoading;
  }
}

export default ServiceCentersCacheService.getInstance();