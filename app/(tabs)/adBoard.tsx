// app/(tabs)/adBoard.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BottomNavBar from '../components/BottomNavBar';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const pythonBackendURL = Constants.expoConfig!.extra!.PYTHON_BACKEND_URL;
const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

// Map product names (or keywords) to MaterialCommunityIcons names:
const productIconMap: Record<string, string> = {
  Headphones: 'headphones',
  iPad: 'tablet-ipad',
  Monitor: 'monitor',
  Laptop: 'laptop',
  iPhone: 'cellphone',
  Charger: 'power-plug',
  Vacuum: 'robot-vacuum',
  Television: 'television-classic',
  Earphones: 'headphones',
  // add more mappings as needed…
};

function getIconName(productName: string) {
  if (productIconMap[productName]) return productIconMap[productName];
  const key = Object.keys(productIconMap).find(k =>
    productName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? productIconMap[key] : 'package-variant-closed';
}

interface RealAd {
  _id: string;
  productName: string;   // top‐level product name
  city: string;
  description: string;
  salePrice: number;
}

interface RecommendedAd {
  title: string;
  iconName: string;
}

type CombinedAd = RealAd | (RecommendedAd & { monetized: true });

const CACHE_KEY = 'cachedRecommendations';
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

export default function MonetizedAdsIntegration() {
  const [combinedAds, setCombinedAds] = useState<CombinedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealAds = async (): Promise<RealAd[]> => {
    const resp = await axios.get(`${serverBackendURL}/ad-board/page/1`);
    return resp.data.ads as RealAd[];
  };

  const fetchRecommendedAds = useCallback(async (): Promise<RecommendedAd[]> => {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, recommendations } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return recommendations;
      }
    }

    const token = await AsyncStorage.getItem('token');
    const warranties = (await axios.post(
      `${serverBackendURL}/user-warranties`,
      { token }
    )).data.data;
    const userId = (await axios.post(
      `${serverBackendURL}/userdata`,
      { token }
    )).data.data.id;

    const rawRecs = (await axios.post(
      `${pythonBackendURL}/get_recommendation`,
      { products: warranties, event_type: 'purchase', user_id: Number(userId) }
    )).data.recommendations || [];

    const mapped = rawRecs.map((rec: any) => ({
      title: rec.brand
        ? `${rec.brand} ${rec.category_code.split('.').pop() || 'Product'}`
        : `Product ${rec.product_id}`,
      iconName: rec.iconName || 'cellphone',
    }));

    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), recommendations: mapped })
    );

    return mapped;
  }, []);

  const combineAds = (real: RealAd[], recs: RecommendedAd[]): CombinedAd[] => {
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
  };

  useEffect(() => {
    (async () => {
      try {
        const [real, recs] = await Promise.all([
          fetchRealAds(),
          fetchRecommendedAds(),
        ]);
        setCombinedAds(combineAds(real, recs));
      } catch {
        setError('Failed to fetch ads. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchRecommendedAds]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f3e2f" />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Ads Board</Text>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {combinedAds.map((ad, idx) => {
            if ((ad as any).monetized) {
              const rec = ad as RecommendedAd & { monetized: true };
              return (
                <View
                  key={`monetized-${idx}`}
                  style={[styles.cardContainer, styles.monetizedCard]}
                >
                  <Text style={styles.monetizedHeader}>Sponsored</Text>
                  <Text style={styles.productName}>{rec.title}</Text>
                  <Text style={styles.iconName}>Icon: {rec.iconName}</Text>
                </View>
              );
            }
            const real = ad as RealAd;
            return (
              <View key={real._id} style={styles.cardContainer}>
                {/* Header row with dynamic icon */}
                <View style={styles.adHeader}>
                  <View style={styles.titleWithIcon}>
                    <MaterialCommunityIcons
                      name={getIconName(real.productName)}
                      size={20}
                      color="#4f3e2f"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.productName}>
                      {real.productName}
                    </Text>
                  </View>
                  <View style={styles.headerRight}>
                    <Text style={styles.salePrice}>
                      ${real.salePrice}
                    </Text>
                    <MaterialCommunityIcons
                      name="cash"
                      size={20}
                      color="#7E8FA6"
                      style={{ marginLeft: 5 }}
                    />
                  </View>
                </View>
                {/* Product Name again */}
                <Text style={styles.productModel}>{real.productName}</Text>
                {/* Location */}
                <Text style={styles.city}>Location: {real.city}</Text>
                {/* Description */}
                <Text style={styles.description}>{real.description}</Text>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
      <BottomNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E0D4',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontFamily: 'InriaSerif-Bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#000',
  },
  scrollContent: {
    paddingBottom: 90,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },

  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#FDFDFD',
    borderRadius: 12,
    marginVertical: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#7E8FA6',
    elevation: 2,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  productName: {
    fontFamily: 'InriaSerif-Bold',
    fontSize: 18,
    color: '#000',
  },
  salePrice: {
    fontFamily: 'InriaSerif-Bold',
    fontSize: 16,
    color: '#7E8FA6',
  },
  productModel: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  city: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  description: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  monetizedCard: {
    borderColor: '#AF6F6F',
    backgroundColor: '#FDEDEC',
  },
  monetizedHeader: {
    fontFamily: 'InriaSerif-Bold',
    fontSize: 14,
    color: '#AF6F6F',
    marginBottom: 4,
  },
  iconName: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 14,
    color: '#666',
  },
});
