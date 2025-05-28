import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import BottomNavBar from '../components/BottomNavBar';

const pythonBackendURL = Constants.expoConfig!.extra!.PYTHON_BACKEND_URL;
const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

interface RealAd {
  id: string;
  salePrice: number;
  city: string;
  description: string;
  latitude: number;   // Make sure this exists in your backend data
  longitude: number;  // Make sure this exists in your backend data
  product: {
    id: string;
    productName: string;
    imageUrl?: string;
    model?: string;
  };
}

interface RecommendedAd {
  title: string;
  iconName: string;
}

type CombinedAd = RealAd | (RecommendedAd & { monetized: true });

const CACHE_KEY = 'cachedRecommendations';
const CACHE_EXPIRY = 1000 * 60 * 60; // one hour

const MapSection = ({ ads }: { ads: RealAd[] }) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  return (
    <View style={{ height: 200, borderRadius: 0, overflow: 'hidden', marginBottom: 16 }}>
      <MapView
        style={{ flex: 1 }}
        showsUserLocation
        initialRegion={{
          latitude: location?.latitude || 32.0853,
          longitude: location?.longitude || 34.7818,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {ads.map(ad => (
          <Marker
            key={ad.id}
            coordinate={{ latitude: ad.latitude, longitude: ad.longitude }}
            title={ad.product.productName}
            description={ad.city}
          />
        ))}
      </MapView>
    </View>
  );
};

const MonetizedAdsIntegration: React.FC = () => {
  const [realAds, setRealAds] = useState<RealAd[]>([]);
  const [recommendedAds, setRecommendedAds] = useState<RecommendedAd[]>([]);
  const [combinedAds, setCombinedAds] = useState<CombinedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealAds = async (): Promise<RealAd[]> => {
    try {
      const response = await axios.get(`${serverBackendURL}/ad-board/page/1`);
      return response.data.ads;
    } catch (err) {
      console.error('Error fetching real ads:', err);
      throw err;
    }
  };

  const fetchRecommendedAds = useCallback(async (): Promise<RecommendedAd[]> => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { timestamp, recommendations } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return recommendations as RecommendedAd[];
        }
      }

      const token = await AsyncStorage.getItem("token");
      const warrantiesResponse = await axios.post(`${serverBackendURL}/user-warranties`, { token });
      const warranties = warrantiesResponse.data.data;

      const userResp = await axios.post(`${serverBackendURL}/userdata`, { token });
      const userId = userResp.data.data.id;

      const response = await axios.post(`${pythonBackendURL}/get_recommendation`, {
        products: warranties,
        event_type: "purchase",
        user_id: Number(userId),
      });

      const rawRecs = response.data.recommendations || [];
      const mappedRecs: RecommendedAd[] = rawRecs.map((rec: any) => ({
        title: rec.brand
          ? `${rec.brand} ${rec.category_code.split('.').pop() || 'Product'}`
          : `Product ${rec.product_id}`,
        iconName: rec.iconName || 'cellphone',
      }));

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), recommendations: mappedRecs }));
      return mappedRecs;
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      throw err;
    }
  }, []);

  const combineAds = (real: RealAd[], recs: RecommendedAd[]): CombinedAd[] => {
    const combined: CombinedAd[] = [];
    let recIndex = 0;
    for (let i = 0; i < real.length; i++) {
      combined.push(real[i]);
      if ((i + 1) % 3 === 0 && recIndex < recs.length) {
        combined.push({
          ...recs[recIndex],
          monetized: true,
        });
        recIndex++;
      }
    }
    while (recIndex < recs.length) {
      combined.push({
        ...recs[recIndex],
        monetized: true,
      });
      recIndex++;
    }
    return combined;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [real, recs] = await Promise.all([fetchRealAds(), fetchRecommendedAds()]);
        setRealAds(real);
        setRecommendedAds(recs);
        setCombinedAds(combineAds(real, recs));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch ads. Please try again later.');
        setLoading(false);
      }
    };

    fetchAllData();
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
        <MapSection ads={realAds} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {combinedAds.map((ad, index) => {
            if ((ad as any).monetized) {
              const recAd = ad as RecommendedAd & { monetized: true };
              return (
                <View key={`monetized-${index}`} style={[styles.cardContainer, styles.monetizedCard]}>
                  <Text style={styles.monetizedHeader}>Sponsored</Text>
                  <Text style={styles.productName}>{recAd.title}</Text>
                  <Text style={styles.iconName}>Icon: {recAd.iconName}</Text>
                </View>
              );
            } else {
              const realAd = ad as RealAd;
              return (
                <View key={realAd.id} style={styles.cardContainer}>
                  <Text style={styles.productModel}>Model: {realAd.product.model}</Text>
                  <Text style={styles.salePrice}>${realAd.salePrice}</Text>
                  <Text style={styles.city}>{realAd.city}</Text>
                  <Text style={styles.description}>{realAd.description}</Text>
                </View>
              );
            }
          })}
        </ScrollView>
      </SafeAreaView>
      <BottomNavBar />
    </>
  );
};

export default MonetizedAdsIntegration;

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
  productName: {
    fontFamily: 'InriaSerif-Bold',
    fontSize: 18,
    color: '#000',
    marginBottom: 4,
  },
  productModel: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 14,
    color: '#666',
  },
  salePrice: {
    fontFamily: 'InriaSerif-Bold',
    fontSize: 16,
    color: '#7E8FA6',
    marginTop: 6,
  },
  city: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 14,
    color: '#000',
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
