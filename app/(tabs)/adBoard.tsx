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
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BottomNavBar from '../components/BottomNavBar';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';


const pythonBackendURL = Constants.expoConfig!.extra!.PYTHON_BACKEND_URL;
const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const isWeb = Platform.OS === 'web';


// Map product names (or keywords) to MaterialCommunityIcons names:
const productIconMap: Record<string, string> = {
  Headphones: 'headphones',
  iPad: 'tablet',
  Monitor: 'monitor',
  Laptop: 'laptop',
  iPhone: 'cellphone',
  Charger: 'power-plug',
  Vacuum: 'robot-vacuum',
  Television: 'television-classic',
  Earphones: 'headphones',
  HairDryer: 'hair-dryer', 
  Tablet: 'tablet',
  Coffe_machine: 'coffee',
};

function getIconName(productName: string) {
  const normalizedMap: Record<string, string> = {
    'Hair Dryer': 'HairDryer',
    'Coffe machine': 'Coffe_machine',
    'Coffe Machine': 'Coffe_machine',
  };

  const normalized = normalizedMap[productName] || productName;
  if (productIconMap[normalized]) return productIconMap[normalized];
  
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

    // for the top-5 chart:
  const [topLabels, setTopLabels] = useState<string[]>([]);
  const [topValues, setTopValues] = useState<number[]>([])

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
    console.log("IN USE EFFECTTTTTTTTTTT");
    // 1) fetch top-5 data
    axios
      .get(`${pythonBackendURL}/top_products`)
      .then(res => {
        console.log("🔝 /top_products:", res.data);
        setTopLabels(res.data.labels);
        setTopValues(res.data.values);
      })
      .catch(console.warn);
    // 2) fetch ads + recommendations

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
        
        <Text style={styles.header}>Recommended</Text>

        {/* ─── Top-5 Products Chart ───────────────────────────── */}
        <Text style={{ fontSize: 16, fontFamily: 'InriaSerif-Bold', marginBottom: 5, marginHorizontal: '6%',}}>
                5 most used products
        </Text>
        
        {topLabels.length > 0 && (
        Platform.OS === 'android' ? (
            <View style={{backgroundColor: '#f5ede6',width: CARD_WIDTH, marginHorizontal: '0%', borderRadius: 12, marginBottom: '2%',}}>
            <BarChart
                data={{
                labels: topLabels,
                datasets: [
                            {
                            data: (() => {
                                const total = topValues.reduce((sum, val) => sum + val, 0);
                                return topValues.map((value) => {
                                const percentage = ((value / total) * 100).toFixed(1);
                                return parseFloat(percentage); // Return percentage as the data value
                                });
                            })(),
                            colors: [
                                () => '#d6bda7',
                                () => '#d8d7d8',
                                () => '#c5d1d1',
                                () => '#a6ada6',
                                () => '#c5d1b2',
                            ],
                            },
                        ],
                        }}
                width={CARD_WIDTH}
                height={180}
                withInnerLines={false}
                withHorizontalLabels={true}
                withCustomBarColorFromData={true}
                flatColor={true}
                fromZero
                showValuesOnTopOfBars={true}
                chartConfig={{
                barPercentage: 1,
                backgroundGradientFrom: '#f5ede6',
                backgroundGradientTo: '#f5ede6',
                fillShadowGradientOpacity: 1,
                decimalPlaces: 1,
                color: () => '#000',
                labelColor: () => '#333',
                formatTopBarValue: value => `${value}%`,
                propsForVerticalLabels: {
                    fontFamily: 'InriaSerif-Bold',
                    fontSize: 10,
                },
                propsForLabels: {
                    fontFamily: 'InriaSerif-Bold',
                    fontSize: 10,
                },
                }}
                style={{
                marginTop: 20,
                borderRadius: 12,
                marginHorizontal: '0%',
                }}
            />
            </View>
        ) : (

        // IPHONE BAR STARTS HERE ----------------------------------------------------------------------------------------
        <View style={{ backgroundColor: '#f5ede6', width:CARD_WIDTH,  marginHorizontal: '5%', borderRadius: 12, marginBottom: '5%',}}>
                {/* Actual bar chart */}
                <BarChart
                    data={{
                    labels: topLabels.map(label =>
                        label.length >= 8
                        ?  label 
                        : label
                    ),
                    datasets: [
                        {
                        data: (() => {
                            const total = topValues.reduce((sum, val) => sum + val, 0);
                            return topValues.map((value) => {
                            const percentage = ((value / total) * 100).toFixed(1);
                            return parseFloat(percentage); // Return percentage as the data value
                            });
                        })(),
                        colors: [
                            () => '#d6bda7',
                            () => '#d8d7d8',
                            () => '#c5d1d1',
                            () => '#a6ada6',
                            () => '#c5d1b2',
                        ],
                        },
                    ],
                    }}
                    width={CARD_WIDTH + 55 }
                    height={180}
                    withInnerLines={false}
                    withHorizontalLabels={false}
                    withCustomBarColorFromData={true}
                    flatColor={true}
                    fromZero
                    showValuesOnTopOfBars={true} 
                    chartConfig={{
                    barPercentage: 1.6,
                    backgroundGradientFrom: ' ',
                    backgroundGradientTo: ' ',
                    decimalPlaces: 1, // Show 1 decimal place for percentages
                    color: () => '#000',
                    labelColor: () => '#333',
                    style: { borderRadius: 12 },
                    // Format the values displayed on top of bars to show % symbol
                    formatTopBarValue: (value) => `${value}%`,
                    propsForVerticalLabels: {
                        fontFamily: 'InriaSerif-Bold',
                        fontSize: 10,
                    },
                    propsForLabels: {
                        fontFamily: 'InriaSerif-Bold',
                        fontSize: 10,
                    },
                    }}
                    style={{ marginTop: 20, borderRadius: 12, marginHorizontal: '-20%',}}
                />
        </View>
  )
)}
        {/* ──────────────────────────────────────────────────── */}
        
        <ScrollView 
  contentContainerStyle={styles.scrollContent}
  style={{ 
    flex: 1, 
    marginBottom: Platform.OS === 'android' ? 80 : 0 
  }}
>
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
                
                {/* Location */}
                <Text style={styles.city}>Location: {real.city}</Text>
                {/* Description */}
                <Text style={styles.description}>{real.description}</Text>
              </View>
            );
          })}
        </ScrollView>

      </SafeAreaView>
      {!isWeb ? (
  <View style={styles.bottomNavContainer}>
    <BottomNavBar />
  </View>
) : null}
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
    marginTop: Platform.OS === 'android' ? '10%' : 0,

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
    // borderWidth: 1,
    // borderColor: '#7E8FA6',
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
    // borderColor: '#AF6F6F',
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
  bottomNavContainer: {
  position: 'absolute',
  bottom: Platform.OS === 'android' ? 20 : 0, // Move up 20px on Android
  left: 0,
  right: 0,
},
});
