import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BottomNavBar from '../components/BottomNavBar';

// Replace with your backend URLs
const pythonBackendURL = "http://172.20.10.5:5000";
const serverBackendURL = "http://172.20.10.5:3000";

// Define types
interface RealAd {
  id: string;  // This key should match what your ad board API returns (for example, "id" or "_id")
  salePrice: number;
  city: string;
  description: string;
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
  // Additional fields as needed
}

// A combined ad can be either a real ad or a recommended (monetized) ad.
type CombinedAd = RealAd | (RecommendedAd & { monetized: true });

const CACHE_KEY = 'cachedRecommendations';
const CACHE_EXPIRY = 1000 * 60 * 60; // one hour

const MonetizedAdsIntegration: React.FC = () => {
  const [realAds, setRealAds] = useState<RealAd[]>([]);
  const [recommendedAds, setRecommendedAds] = useState<RecommendedAd[]>([]);
  const [combinedAds, setCombinedAds] = useState<CombinedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real ads from your ad board API endpoint.
  const fetchRealAds = async (): Promise<RealAd[]> => {
    try {
      const response = await axios.get(`${serverBackendURL}/ad-board/page/1`);
      // Adjust this if your server returns the ads under a different key.
	  console.log("response.data.ads;",response.data.ads)
      return response.data.ads;
    } catch (err) {
      console.error('Error fetching real ads:', err);
      throw err;
    }
  };

  // Fetch recommended ads from the AI system and cache them.
  const fetchRecommendedAds = useCallback(async (): Promise<RecommendedAd[]> => {
    try {
      // Check for cached recommendations.
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { timestamp, recommendations } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return recommendations as RecommendedAd[];
        }
      }
      // Otherwise, fetch fresh recommendations.
      const token = await AsyncStorage.getItem("token");
      const warrantiesResponse = await axios.post(`${serverBackendURL}/user-warranties`, { token });
      const warranties = warrantiesResponse.data.data;

      const response = await axios.post(`${pythonBackendURL}/get_recommendation`, {
        products: warranties,
        event_type: "purchase",
      });

      const rawRecs = response.data.recommendations || [];
      const mappedRecs: RecommendedAd[] = rawRecs.map((rec: any) => ({
        title: rec.brand
          ? `${rec.brand} ${rec.category_code.split('.').pop() || 'Product'}`
          : `Product ${rec.product_id}`,
        iconName: rec.iconName || 'cellphone',
      }));

      // Cache the recommendations.
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), recommendations: mappedRecs }));

      return mappedRecs;
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      throw err;
    }
  }, []);

  // Combine real ads with recommended ads:
  // Insert one recommended ad after every 3 real ads and append any remaining recommended ads.
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
    // Append any remaining recommended ads.
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
        const merged = combineAds(real, recs);
        setCombinedAds(merged);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {combinedAds.map((ad, index) => {
          // Check if the ad is monetized (sponsored).
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
            // Render a real ad card.
            const realAd = ad as RealAd;
            return (
              <View key={realAd.id} style={styles.cardContainer}>
				
                <Text style={styles.productName}>{realAd.productName}</Text>
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
	<BottomNavBar/>
  </>
  );
};

export default MonetizedAdsIntegration;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E0D4',
    padding: 15,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontFamily: 'InriaSerif-Bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#000',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#FDFDFD',
    borderRadius: 12,
    marginVertical: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#7E8FA6',
  },
  // Styles for real ads
  productName: {
    fontFamily: 'InriaSerif-Bold',
    fontSize: 18,
    color: '#000',
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
    marginTop: 5,
  },
  city: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 14,
    color: '#000',
    marginTop: 3,
  },
  description: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  // Styles for sponsored (monetized) ads
  monetizedCard: {
    borderColor: '#AF6F6F',
    backgroundColor: '#FDEDEC',
  },
  monetizedHeader: {
    fontFamily: 'InriaSerif-Bold',
    fontSize: 14,
    color: '#AF6F6F',
    marginBottom: 5,
  },
  iconName: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 14,
    color: '#666',
  },
  rowContainer: {
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginVertical: 5,
  },
  manufacturerText: {
	fontFamily: 'InriaSerif-Regular',
	fontSize: 14,
	color: '#666',
	marginRight: 10,
  },
  modelText: {
	fontFamily: 'InriaSerif-Regular',
	fontSize: 14,
	color: '#666',
  },
});
