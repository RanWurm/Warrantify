// services/adBoardCacheService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const pythonBackendURL = Constants.expoConfig!.extra!.PYTHON_BACKEND_URL;
const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

const STORAGE_KEYS = {
  realAds: 'cached_real_ads',
  recommendations: 'cached_recommendations',
  topProducts: 'cached_top_products',
  combinedAds: 'cached_combined_ads',
  userProfile: 'cached_user_profile_ads',
  lastUpdate: 'ad_board_last_update',
};

export interface RealAd {
  _id: string;
  productName: string;
  city: string;
  description: string;
  salePrice: number;
}

export interface RecommendedAd {
  title: string;
  productName: string;
  brand: string;
  iconName: string;
}

export interface TopProductsData {
  labels: string[];
  values: number[];
}

export type CombinedAd = RealAd | (RecommendedAd & { monetized: true });

interface CachedAdBoardData {
  combinedAds: CombinedAd[];
  topProducts: TopProductsData;
}

// Product icon mapping (optimized for reuse)
const productIconMap: Record<string, string> = {
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

class AdBoardCacheService {
  private static instance: AdBoardCacheService;
  private isLoading = false;
  private loadingPromise: Promise<CachedAdBoardData> | null = null;

  static getInstance(): AdBoardCacheService {
    if (!AdBoardCacheService.instance) {
      AdBoardCacheService.instance = new AdBoardCacheService();
    }
    return AdBoardCacheService.instance;
  }

  // Check if cache is valid (15 minutes for ads, 1 hour for recommendations)
  private async isCacheValid(key: string, duration: number = 15 * 60 * 1000): Promise<boolean> {
    try {
      const lastUpdate = await AsyncStorage.getItem(STORAGE_KEYS.lastUpdate);
      if (!lastUpdate) return false;
      
      const timestamps = JSON.parse(lastUpdate);
      const lastUpdateTime = timestamps[key];
      
      if (!lastUpdateTime) return false;
      
      return (Date.now() - lastUpdateTime) < duration;
    } catch {
      return false;
    }
  }

  // Update timestamp for specific cache key
  private async updateTimestamp(key: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.lastUpdate);
      const timestamps = stored ? JSON.parse(stored) : {};
      timestamps[key] = Date.now();
      await AsyncStorage.setItem(STORAGE_KEYS.lastUpdate, JSON.stringify(timestamps));
    } catch {
      // Ignore timestamp errors
    }
  }

  // Utility functions
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  public getIconName(productName: string): string {
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
    if (normalized.includes('lightbulb') || normalized.includes('light') || normalized.includes('bulb') || normalized.includes('hue')) return 'lightbulb';
    if (normalized.includes('switch')) return 'gamepad-variant';

    if (productIconMap[normalized]) return productIconMap[normalized];
  
    const key = Object.keys(productIconMap).find(k => 
      productName.toLowerCase().includes(k.toLowerCase())
    );
    return key ? productIconMap[key] : 'devices';
  }

  // Fetch real ads
  private async fetchRealAds(): Promise<RealAd[]> {
    const response = await axios.get(`${serverBackendURL}/ad-board/page/1`);
    return response.data.ads as RealAd[];
  }

  // Fetch recommended ads with caching
  private async fetchRecommendedAds(): Promise<RecommendedAd[]> {
    try {
      // Check cache first (1 hour validity)
      if (await this.isCacheValid('recommendations', 60 * 60 * 1000)) {
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.recommendations);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      console.log('🔄 Fetching fresh recommendations...');
      
      // Get user data
      const token = await AsyncStorage.getItem('token');
      if (!token) return [];

      const userResponse = await axios.post(`${serverBackendURL}/userdata`, { token });
      const userId = userResponse.data.data.id;

      // Get warranties
      const warrantiesResponse = await axios.post(`${serverBackendURL}/user-warranties`, { token });
      const warranties = warrantiesResponse.data.data;

      // Get recommendations
      const recResponse = await axios.post(`${pythonBackendURL}/get_recommendation`, {
        products: warranties,
        event_type: 'purchase',
        user_id: Number(userId)
      });

      const rawRecs = recResponse.data.recommendations || [];

      const mappedRecs = rawRecs.map((rec: any) => {
        const category = rec.category_code?.split('.').pop() || 'product';
        return {
          title: this.capitalize(category),
          productName: this.capitalize(category),
          brand: this.capitalize(rec.brand || 'Unknown'),
          iconName: rec.iconName || 'ad',
        };
      });

      // Cache the recommendations
      await AsyncStorage.setItem(STORAGE_KEYS.recommendations, JSON.stringify(mappedRecs));
      await this.updateTimestamp('recommendations');

      return mappedRecs;
    } catch (error) {
      console.warn('Failed to fetch recommendations:', error);
      
      // Try to return cached recommendations on error
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.recommendations);
      return cached ? JSON.parse(cached) : [];
    }
  }

  // Fetch top products data
  private async fetchTopProducts(): Promise<TopProductsData> {
    try {
      // Check cache first (30 minutes validity)
      if (await this.isCacheValid('topProducts', 30 * 60 * 1000)) {
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.topProducts);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const response = await axios.get(`${pythonBackendURL}/top_products`);
      const topProducts = {
        labels: response.data.labels || [],
        values: response.data.values || []
      };

      // Cache the data
      await AsyncStorage.setItem(STORAGE_KEYS.topProducts, JSON.stringify(topProducts));
      await this.updateTimestamp('topProducts');

      return topProducts;
    } catch (error) {
      console.warn('Failed to fetch top products:', error);
      
      // Return cached data on error
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.topProducts);
      return cached ? JSON.parse(cached) : { labels: [], values: [] };
    }
  }

  // Combine ads logic (optimized)
  private combineAds(real: RealAd[], recs: RecommendedAd[]): CombinedAd[] {
    const out: CombinedAd[] = [];
    let ri = 0;
    
    for (let i = 0; i < real.length; i++) {
      out.push(real[i]);
      if ((i + 1) % 3 === 0 && ri < recs.length) {
        out.push({ ...recs[ri++], monetized: true });
      }
    }
    
    while (ri < recs.length) {
      out.push({ ...recs[ri++], monetized: true });
    }
    
    return out;
  }

  // Get cached data
  async getCachedData(): Promise<CachedAdBoardData | null> {
    try {
      const [combinedAds, topProducts] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.combinedAds),
        AsyncStorage.getItem(STORAGE_KEYS.topProducts),
      ]);

      if (combinedAds && topProducts) {
        return {
          combinedAds: JSON.parse(combinedAds),
          topProducts: JSON.parse(topProducts),
        };
      }
    } catch (error) {
      console.warn('Error getting cached ad board data:', error);
    }
    return null;
  }

  // Main preload function
  async preloadAdBoard(): Promise<CachedAdBoardData> {
    // Prevent multiple simultaneous loads
    if (this.isLoading && this.loadingPromise) {
      return this.loadingPromise;
    }

    // Check if main cache is valid (15 minutes)
    if (await this.isCacheValid('combinedAds', 15 * 60 * 1000)) {
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

  private async _performPreload(): Promise<CachedAdBoardData> {
    try {
      console.log('🔄 Preloading ad board data...');
      
      // Fetch all data in parallel
      const [realAds, recommendations, topProducts] = await Promise.all([
        this.fetchRealAds(),
        this.fetchRecommendedAds(),
        this.fetchTopProducts(),
      ]);

      // Combine ads
      const combinedAds = this.combineAds(realAds, recommendations);

      const result: CachedAdBoardData = {
        combinedAds,
        topProducts,
      };

      // Cache combined data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.combinedAds, JSON.stringify(combinedAds)),
        this.updateTimestamp('combinedAds'),
      ]);

      console.log(`✅ Cached ${combinedAds.length} ads and top products`);
      return result;
    } catch (error) {
      console.warn('⚠️ Failed to preload ad board:', error);
      
      // Try to return cached data on error
      const cached = await this.getCachedData();
      if (cached) {
        return cached;
      }
      
      throw error;
    }
  }

  // Force refresh cache
  async refreshCache(): Promise<CachedAdBoardData> {
    // Clear timestamps to force refresh
    await AsyncStorage.removeItem(STORAGE_KEYS.lastUpdate);
    return this.preloadAdBoard();
  }

  // Check if currently loading
  isCurrentlyLoading(): boolean {
    return this.isLoading;
  }

  // Search and filtering functionality
  calculateRelevanceScore(ad: CombinedAd, query: string): number {
    const lowerQuery = query.toLowerCase();
    
    if ((ad as any).monetized) {
      const rec = ad as RecommendedAd & { monetized: true };
      const title = rec.title.toLowerCase();
      
      if (title === lowerQuery) return 100;
      if (title.startsWith(lowerQuery)) return 80;
      if (title.includes(lowerQuery)) return 60;
      return 0;
    } else {
      const real = ad as RealAd;
      const productName = real.productName.toLowerCase();
      const city = real.city.toLowerCase();
      const description = real.description.toLowerCase();
      
      let score = 0;
      
      // Product name matches (highest priority)
      if (productName === lowerQuery) score += 100;
      else if (productName.startsWith(lowerQuery)) score += 80;
      else if (productName.includes(lowerQuery)) score += 60;
      
      // City matches (medium priority)
      if (city === lowerQuery) score += 50;
      else if (city.startsWith(lowerQuery)) score += 40;
      else if (city.includes(lowerQuery)) score += 30;
      
      // Description matches (lower priority)
      if (description.includes(lowerQuery)) score += 20;
      
      return score;
    }
  }

  filterAds(ads: CombinedAd[], query: string): CombinedAd[] {
    if (!query.trim()) return ads;
    
    const lowerQuery = query.toLowerCase();
    return ads.filter((ad) => {
      if ((ad as any).monetized) {
        const rec = ad as RecommendedAd & { monetized: true };
        return rec.title.toLowerCase().includes(lowerQuery);
      } else {
        const real = ad as RealAd;
        return (
          real.productName.toLowerCase().includes(lowerQuery) ||
          real.city.toLowerCase().includes(lowerQuery) ||
          real.description.toLowerCase().includes(lowerQuery)
        );
      }
    });
  }

  // Rebuild ads with monetized relationship maintained
  rebuildWithAdsRelationship(sortedAds: CombinedAd[]): CombinedAd[] {
    const result: CombinedAd[] = [];
    const realAds = sortedAds.filter(ad => !(ad as any).monetized) as RealAd[];
    const monetizedAds = sortedAds.filter(ad => (ad as any).monetized) as (RecommendedAd & { monetized: true })[];
    
    let monetizedIndex = 0;
    
    for (let i = 0; i < realAds.length; i++) {
      result.push(realAds[i]);
      
      if ((i + 1) % 3 === 0 && monetizedIndex < monetizedAds.length) {
        result.push(monetizedAds[monetizedIndex]);
        monetizedIndex++;
      }
    }
    
    while (monetizedIndex < monetizedAds.length) {
      result.push(monetizedAds[monetizedIndex]);
      monetizedIndex++;
    }
    
    return result;
  }
}

export default AdBoardCacheService.getInstance();