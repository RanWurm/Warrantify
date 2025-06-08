// Optimized app/(tabs)/adBoard.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  RefreshControl,
  TouchableOpacity, 
} from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import SearchBar from '../components/SearchBar'; 
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import adBoardCacheService, { 
  CombinedAd, 
  RealAd, 
  RecommendedAd, 
  TopProductsData 
} from '../../services/adBoardCacheService';

const pythonBackendURL = Constants.expoConfig!.extra!.PYTHON_BACKEND_URL;
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const isWeb = Platform.OS === 'web';

export default function OptimizedAdBoard() {
  // State management
  const [combinedAds, setCombinedAds] = useState<CombinedAd[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductsData>({ labels: [], values: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Memoized filtered ads to avoid recalculation on every render
  const filteredAds = useMemo(() => {
    return adBoardCacheService.filterAds(combinedAds, searchQuery);
  }, [combinedAds, searchQuery]);

  // Load ad board data
  const loadAdBoardData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Get cached data first for instant loading
      if (!forceRefresh) {
        const cached = await adBoardCacheService.getCachedData();
        if (cached) {
          setCombinedAds(cached.combinedAds);
          setTopProducts(cached.topProducts);
          setLoading(false);
        }
      }

      // Get fresh data (will use cache if valid, or fetch fresh)
      const data = forceRefresh 
        ? await adBoardCacheService.refreshCache()
        : await adBoardCacheService.preloadAdBoard();

      setCombinedAds(data.combinedAds);
      setTopProducts(data.topProducts);
      setError(null);

    } catch (err) {
      console.error('Error loading ad board data:', err);
      setError('Failed to load ads. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAdBoardData();
  }, []);

  // Search handler (simplified since filtering is memoized)
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Enhanced suggestion handler with sorting
  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    
    // Filter and sort ads by relevance
    const filtered = adBoardCacheService.filterAds(combinedAds, suggestion);
    const sortedFiltered = filtered.sort((a, b) => {
      const scoreA = adBoardCacheService.calculateRelevanceScore(a, suggestion);
      const scoreB = adBoardCacheService.calculateRelevanceScore(b, suggestion);
      return scoreB - scoreA; // Sort descending (highest score first)
    });
    
    // Rebuild with ads relationship maintained
    const finalSortedAds = adBoardCacheService.rebuildWithAdsRelationship(sortedFiltered);
    setCombinedAds(finalSortedAds);
    
    console.log(`🔍 Sorted results for "${suggestion}":`, finalSortedAds.map(ad => {
      if ((ad as any).monetized) {
        return `[AD] ${(ad as RecommendedAd).title}`;
      } else {
        return `${(ad as RealAd).productName} (Score: ${adBoardCacheService.calculateRelevanceScore(ad, suggestion)})`;
      }
    }));
  };

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    await loadAdBoardData(true);
  }, []);

  // Loading state
  if (loading && combinedAds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Recommended</Text>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4f3e2f" />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
        {!isWeb && (
          <View style={styles.bottomNavContainer}>
            <BottomNavBar />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Error state  
  if (error && combinedAds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Recommended</Text>
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadAdBoardData(true)} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
        {!isWeb && (
          <View style={styles.bottomNavContainer}>
            <BottomNavBar />
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Recommended</Text>

        {/* Top-5 Products Chart */}
        {topProducts.labels.length > 0 && (
          <>
            <Text style={styles.chartTitle}>
              5 most used products
            </Text>
            
            {Platform.OS === 'android' ? (
              <View style={styles.chartContainerAndroid}>
                <BarChart
                  data={{
                    labels: topProducts.labels,
                    datasets: [{
                      data: (() => {
                        const total = topProducts.values.reduce((sum, val) => sum + val, 0);
                        return topProducts.values.map((value) => {
                          const percentage = ((value / total) * 100).toFixed(1);
                          return parseFloat(percentage);
                        });
                      })(),
                      colors: [
                        () => '#d6bda7',
                        () => '#d8d7d8',
                        () => '#c5d1d1',
                        () => '#a6ada6',
                        () => '#c5d1b2',
                      ],
                    }],
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
                  style={styles.chartAndroid}
                />
              </View>
            ) : (
              <View style={styles.chartContainerIOS}>
                <BarChart
                  data={{
                    labels: topProducts.labels.map(label =>
                      label.length >= 8 ? label : label
                    ),
                    datasets: [{
                      data: (() => {
                        const total = topProducts.values.reduce((sum, val) => sum + val, 0);
                        return topProducts.values.map((value) => {
                          const percentage = ((value / total) * 100).toFixed(1);
                          return parseFloat(percentage);
                        });
                      })(),
                      colors: [
                        () => '#d6bda7',
                        () => '#d8d7d8',
                        () => '#c5d1d1',
                        () => '#a6ada6',
                        () => '#c5d1b2',
                      ],
                    }],
                  }}
                  width={CARD_WIDTH + 55}
                  height={170}
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
                    decimalPlaces: 1,
                    color: () => '#000',
                    labelColor: () => '#333',
                    style: { borderRadius: 12 },
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
                  style={styles.chartIOS}
                />
              </View>
            )}
          </>
        )}
        
        <SearchBar
          variant="recommended"
          onSearch={handleSearch}
          onSelectSuggestion={handleSelectSuggestion}
          placeholder="Products, cities, descriptions..."
          filterOptions={{
            text: 'All Products',
            onPress: () => console.log('Filter button pressed'),
          }}
          autocompleteEndpoint={`${pythonBackendURL}/autocomplete`}
          additionalStyles={{
            container: styles.searchBarContainer,
            filterButton: styles.filterButton,
            filterButtonText: styles.filterButtonText,
            searchInput: styles.searchInput,
            searchText: styles.searchText,
          }}
        />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7E8FA6']}
              tintColor='#7E8FA6'
              title="Pull to refresh..."
              titleColor='#7E8FA6'
            />
          }
        >
          {filteredAds.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No ads match your search' : 'No ads found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Pull down to refresh'}
              </Text>
            </View>
          ) : (
            filteredAds.map((ad, idx) => {
              if ((ad as any).monetized) {
                const rec = ad as RecommendedAd & { monetized: true };
                return (
                  <View
                    key={`monetized-${idx}`}
                    style={[styles.cardContainer, styles.monetizedCard]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="bullhorn" size={20} color="#AF6F6F" />
                      <Text style={styles.monetizedHeader}>Sponsored</Text>
                    </View>
                    <Text style={styles.adTitle}>Try {rec.productName} by {rec.brand}</Text>
                    <Text style={styles.description}>
                      This is a personalized recommendation based on your personal product preferences.
                    </Text>
                  </View>
                );
              }
              
              const real = ad as RealAd;
              return (
                <View key={real._id} style={styles.cardContainer}>
                  <View style={styles.adHeader}>
                    <View style={styles.titleWithIcon}>
                      <MaterialCommunityIcons
                        name={adBoardCacheService.getIconName(real.productName)}
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
                        ₪{real.salePrice}
                      </Text>
                      <MaterialCommunityIcons
                        name="cash"
                        size={20}
                        color="#7E8FA6"
                        style={{ marginLeft: 5 }}
                      />
                    </View>
                  </View>
                  
                  <Text style={styles.city}>Location: {real.city}</Text>
                  <Text style={styles.description}>{real.description}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
      
      {!isWeb && (
        <View style={styles.bottomNavContainer}>
          <BottomNavBar />
        </View>
      )}
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
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4f3e2f',
    fontFamily: 'InriaSerif-Regular',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4f3e2f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'InriaSerif-Bold',
  },
  header: {
    fontSize: 28,
    fontFamily: 'InriaSerif-Bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#000',
    marginTop: Platform.OS === 'android' ? '10%' : 0,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'InriaSerif-Bold',
    marginBottom: 5,
    marginHorizontal: '6%',
  },
  chartContainerAndroid: {
    backgroundColor: '#f5ede6',
    width: CARD_WIDTH,
    marginHorizontal: '0%',
    borderRadius: 12,
    marginBottom: '2%',
  },
  chartAndroid: {
    marginTop: 20,
    borderRadius: 12,
    marginHorizontal: '0%',
  },
  chartContainerIOS: {
    backgroundColor: '#f5ede6',
    width: CARD_WIDTH,
    marginHorizontal: '5%',
    borderRadius: 12,
    marginBottom: '5%',
  },
  chartIOS: {
    marginTop: 0,
    borderRadius: 12,
    marginHorizontal: '-20%',
  },
  searchBarContainer: {
    marginHorizontal: 10,
    marginVertical: Platform.OS === 'android' ? 5 : 10,
    width: isWeb ? '100%' : '100%',
    alignSelf: 'center',
  },
  filterButton: {
    backgroundColor: '#D2BBA1',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 5,
  },
  searchInput: {
    backgroundColor: '#D2BBA1',
  },
  searchText: {
    fontSize: 12,
    color: '#000',
    marginRight: 5,
  },
  scrollView: {
    flex: 1,
    marginBottom: Platform.OS === 'android' ? 80 : 0,
  },
  scrollContent: {
    paddingBottom: 90,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'InriaSerif-Bold',
    color: '#4f3e2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'InriaSerif-Regular',
    color: '#666',
    textAlign: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#FDFDFD',
    borderRadius: 12,
    marginVertical: 8,
    padding: 14,
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
  adTitle: {
    fontFamily: 'InriaSerif-Bold',
    fontSize: 18,
    color: '#000',
    marginTop: 2,
  },
  salePrice: {
    fontFamily: 'InriaSerif-Bold',
    fontSize: 16,
    color: '#7E8FA6',
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
    // Add any special styling for sponsored ads if needed
  },
  monetizedHeader: {
    fontFamily: 'InriaSerif-Bold',
    fontSize: 18,
    color: '#AF6F6F',
    marginBottom: 0,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E9E0D4',
    paddingBottom: Platform.OS === 'android' ? 25 : 10,
    paddingTop: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -2 },
  },
});