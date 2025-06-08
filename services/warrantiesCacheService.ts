// services/warrantiesCacheService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

const STORAGE_KEYS = {
  warranties: 'cached_warranties',
  userProfile: 'cached_user_profile',
  transformedWarranties: 'cached_transformed_warranties',
  warrantyStats: 'cached_warranty_stats',
  lastUpdate: 'warranties_last_update',
};

export interface WarrantyItemProps {
  productId: string;
  title: string;
  subtitle: string;
  date: string;
  timeAgo: string;
  iconName: string;
  progress: number;
  notes: string;
  model: string;
  purchaseDate: string;
  expirationDate: string;
  price: string;
  serviceCenter: string;
  store: string;
}

export interface WarrantyStats {
  expiredCount: number;
  inProgressCount: number;
  recentCount: number;
  expiredPercentage: number;
  inProgressPercentage: number;
  recentPercentage: number;
  totalCount: number;
}

export interface UserProfile {
  image?: string;
  name?: string;
  email?: string;
}

interface CachedWarrantyData {
  warranties: WarrantyItemProps[];
  stats: WarrantyStats;
  userProfile: UserProfile;
}

class WarrantiesCacheService {
  private static instance: WarrantiesCacheService;
  private isLoading = false;
  private loadingPromise: Promise<CachedWarrantyData> | null = null;

  static getInstance(): WarrantiesCacheService {
    if (!WarrantiesCacheService.instance) {
      WarrantiesCacheService.instance = new WarrantiesCacheService();
    }
    return WarrantiesCacheService.instance;
  }

  // Check if cache is valid (30 minutes)
  private async isCacheValid(): Promise<boolean> {
    try {
      const lastUpdate = await AsyncStorage.getItem(STORAGE_KEYS.lastUpdate);
      if (!lastUpdate) return false;
      
      const lastUpdateTime = parseInt(lastUpdate);
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      
      return (now - lastUpdateTime) < thirtyMinutes;
    } catch {
      return false;
    }
  }

  // Icon mapping logic (extracted and optimized)
  private getIconName(productName: string): string {
    const productMap: { [key: string]: string } = {
      monitor: 'monitor',
      tablet: 'tablet',
      coffemachine: 'coffee',
      headphones: 'headphones',
      earphones: 'headphones',
      ipad: 'tablet',
      laptop: 'laptop',
      iphone: 'cellphone',
      android: 'cellphone',
      charger: 'power-plug',
      vacuum: 'robot-vacuum',
      television: 'television-classic',
      hairdryer: 'hair-dryer',
      microwave: 'microwave',
      oven: 'stove',
      toaster: 'toaster',
      blender: 'blender',
      kettle: 'kettle',
      fridge: 'fridge-outline',
      freezer: 'snowflake',
      dishwasher: 'dishwasher',
      washingmachine: 'washing-machine',
      dryer: 'tumble-dryer',
      fan: 'fan',
      airconditioner: 'air-conditioner',
      airpurifier: 'air-filter',
      printer: 'printer',
      scanner: 'scanner',
      router: 'router-wireless',
      smartwatch: 'watch-variant',
      camera: 'camera',
      drone: 'drone',
      speaker: 'speaker',
      soundbar: 'soundbar',
      projector: 'projector',
      lightbulb: 'lightbulb',
      electricshaver: 'razor-electric',
      straightener: 'hair-straightener',
      iron: 'iron',
      heater: 'radiator',
      powerbank: 'battery-charging',
      ups: 'battery-high',
      smartwatchcharger: 'watch-variant',
      stylus: 'pen',
      gameconsole: 'gamepad-variant',
      controller: 'controller',
      electricbike: 'bike-electric',
      scooter: 'scooter-electric',
      treadmill: 'treadmill',
      humidifier: 'air-humidifier',
      dehumidifier: 'air-humidifier-off'
    };
    
    const normalized = productName.toLowerCase().replace(/\s+/g, '');

    // Fuzzy alias checks
    if (normalized.includes('refrigerator') || normalized.includes('fridge')) return 'fridge-outline';
    if (normalized.includes('television') || normalized.includes('tv')) return 'television-classic';
    if (normalized.includes('macbook') || normalized.includes('mac') || normalized.includes('applelaptop')) return 'laptop';
    if (normalized.includes('ice') && normalized.includes('maker')) return 'snowflake';
    if (normalized.includes('coffee') || normalized.includes('coffe')) return 'coffee';
    if (normalized.includes('playstation') || normalized.includes('ps5') || normalized.includes('ps4') || normalized.includes('ps')) return 'gamepad-variant';
    if (normalized.includes('airpods') || normalized.includes('pods')) return 'headphones';
    if (normalized.includes('smarttv') || normalized.includes('androidtv')) return 'television-classic';
    if (normalized.includes('smartwatch') || normalized.includes('fitbit') || normalized.includes('watch')) return 'watch-variant';
    if (normalized.includes('earbuds') || normalized.includes('in-ear')) return 'headphones';
    if (normalized.includes('soundbar')) return 'soundbar';
    if (normalized.includes('xbox')) return 'controller';
    if (normalized.includes('switch')) return 'gamepad-variant';

    if (productMap[normalized]) return productMap[normalized];
  
    const key = Object.keys(productMap).find(k =>
      productName.toLowerCase().includes(k.toLowerCase())
    );
    return key ? productMap[key] : 'package-variant-closed';
  }

  // Calculate progress (optimized)
  private calculateProgress(purchaseDate: string, expirationDate: string): number {
    if (!purchaseDate || !expirationDate) return 0;
    
    const start = new Date(purchaseDate).getTime();
    const end = new Date(expirationDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    const progress = (elapsed / total) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  }

  // Get time ago (optimized)
  private getTimeAgo(date: string): string {
    if (!date) return 'No date';
    
    const now = Date.now();
    const targetTime = new Date(date).getTime();
    const diff = now - targetTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';

    if (days < 0) {
      const absDays = Math.abs(days);
      if (absDays < 30) return `In ${absDays} days`;
      if (absDays < 365) return `In ${Math.floor(absDays / 30)} months`;
      const years = Math.floor(absDays / 365);
      return `In ${years} year${years === 1 ? '' : 's'}`;
    }
    
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }

  // Transform raw warranty data
  private transformWarranties(rawWarranties: any[]): { warranties: WarrantyItemProps[], stats: WarrantyStats } {
    const now = Date.now();
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

    let expired = 0;
    let inProgress = 0;
    let recent = 0;

    const warranties = rawWarranties.map((warranty: any) => {
      const expiration = new Date(warranty.expirationDate).getTime();
      const purchase = new Date(warranty.purchaseDate).getTime();

      // Count statistics
      if (expiration < now) {
        expired++;
      } else {
        inProgress++;
        if (now - purchase <= oneMonthMs) {
          recent++;
        }
      }

      return {
        productId: warranty._id,
        title: warranty.productName,
        subtitle: warranty.model || 'No model specified',
        date: warranty.expirationDate
          ? new Date(warranty.expirationDate).toLocaleDateString()
          : 'No date',
        timeAgo: this.getTimeAgo(warranty.expirationDate),
        iconName: this.getIconName(warranty.productName),
        progress: this.calculateProgress(warranty.purchaseDate, warranty.expirationDate),
        notes: warranty.notes || 'No additional notes',
        model: warranty.model || 'Unknown model',
        purchaseDate: warranty.purchaseDate || 'Unknown purchase date',
        expirationDate: warranty.expirationDate || 'Unknown expiration date',
        price: warranty.price || 'Unknown price',
        serviceCenter: warranty.serviceCenter || 'Unknown service center',
        store: warranty.store || 'Unknown store',
      };
    });

    // Calculate statistics
    const total = expired + inProgress;
    const stats: WarrantyStats = {
      expiredCount: expired,
      inProgressCount: inProgress,
      recentCount: recent,
      expiredPercentage: total > 0 ? Math.round((expired / total) * 100) : 0,
      inProgressPercentage: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      recentPercentage: total > 0 ? Math.round((recent / total) * 100) : 0,
      totalCount: warranties.length,
    };

    return { warranties, stats };
  }

  // Fetch warranties from API
  private async fetchWarranties(): Promise<any[]> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await axios.post(`${serverBackendURL}/user-warranties`, { token });
    return response.data.data;
  }

  // Fetch user profile from API
  private async fetchUserProfile(): Promise<UserProfile> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return {};

      const response = await axios.post(`${serverBackendURL}/userdata`, { token });
      return {
        image: response.data.data.image,
        name: response.data.data.name,
        email: response.data.data.email,
      };
    } catch (error) {
      // Return cached profile on error
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.userProfile);
      return cached ? JSON.parse(cached) : {};
    }
  }

  // Get cached data
  async getCachedData(): Promise<CachedWarrantyData | null> {
    try {
      const [warranties, stats, userProfile] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.transformedWarranties),
        AsyncStorage.getItem(STORAGE_KEYS.warrantyStats),
        AsyncStorage.getItem(STORAGE_KEYS.userProfile),
      ]);

      if (warranties && stats && userProfile) {
        return {
          warranties: JSON.parse(warranties),
          stats: JSON.parse(stats),
          userProfile: JSON.parse(userProfile),
        };
      }
    } catch (error) {
      console.warn('Error getting cached warranty data:', error);
    }
    return null;
  }

  // Main preload function
  async preloadWarranties(): Promise<CachedWarrantyData> {
    // Prevent multiple simultaneous loads
    if (this.isLoading && this.loadingPromise) {
      return this.loadingPromise;
    }

    // Check if cache is valid
    if (await this.isCacheValid()) {
      const cached = await this.getCachedData();
      if (cached) return cached;
    }

    this.isLoading = true;
    this.loadingPromise = this._performPreload();
    
    try {
      return await this.loadingPromise;
    } finally {
      this.isLoading = false;
      this.loadingPromise = null;
    }
  }

  private async _performPreload(): Promise<CachedWarrantyData> {
    try {
      console.log('🔄 Preloading warranties...');
      
      // Fetch warranties and user profile in parallel
      const [rawWarranties, userProfile] = await Promise.all([
        this.fetchWarranties(),
        this.fetchUserProfile(),
      ]);

      // Transform warranties and calculate stats
      const { warranties, stats } = this.transformWarranties(rawWarranties);

      const result: CachedWarrantyData = {
        warranties,
        stats,
        userProfile,
      };

      // Cache all data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.transformedWarranties, JSON.stringify(warranties)),
        AsyncStorage.setItem(STORAGE_KEYS.warrantyStats, JSON.stringify(stats)),
        AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(userProfile)),
        AsyncStorage.setItem(STORAGE_KEYS.lastUpdate, Date.now().toString()),
      ]);

      console.log(`✅ Cached ${warranties.length} warranties with stats`);
      return result;
    } catch (error) {
      console.warn('⚠️ Failed to preload warranties:', error);
      
      // Try to return cached data on error
      const cached = await this.getCachedData();
      if (cached) {
        return cached;
      }
      
      throw error;
    }
  }

  // Force refresh cache
  async refreshCache(): Promise<CachedWarrantyData> {
    await AsyncStorage.removeItem(STORAGE_KEYS.lastUpdate);
    return this.preloadWarranties();
  }

  // Check if currently loading
  isCurrentlyLoading(): boolean {
    return this.isLoading;
  }

  // Filter warranties by search query
  filterWarranties(warranties: WarrantyItemProps[], query: string): WarrantyItemProps[] {
    if (!query.trim()) return warranties;
    
    const lowerQuery = query.toLowerCase();
    return warranties.filter(warranty =>
      warranty.title.toLowerCase().includes(lowerQuery) ||
      warranty.subtitle.toLowerCase().includes(lowerQuery)
    );
  }
}

export default WarrantiesCacheService.getInstance();