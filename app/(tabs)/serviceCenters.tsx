// Updated MyServiceCenters.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import ServiceCenterCard from '../components/serviceCenterCard';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import GoogleMapView from '../components/WebMap';
import serviceCentersCache, { LocatedCenter } from '../../services/serviceCentersCache';

const isWeb = Platform.OS === 'web';

const MyServiceCenters: React.FC = () => {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const [centers, setCenters] = useState<LocatedCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get location for map
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 5000,
        });
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
      }
    } catch (error) {
      console.warn('Failed to get location for map:', error);
    }
  };

  // Load service centers
  const loadServiceCenters = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
        await serviceCentersCache.refreshCache();
      } else {
        setLoading(true);
      }

      // Get cached data immediately
      const cachedCenters = await serviceCentersCache.getCachedServiceCenters();
      setCenters(cachedCenters);

      // If we don't have cached data or it's a force refresh, trigger preload
      if (cachedCenters.length === 0 || forceRefresh) {
        await serviceCentersCache.preloadServiceCenters();
        const freshCenters = await serviceCentersCache.getCachedServiceCenters();
        setCenters(freshCenters);
      }

    } catch (error) {
      console.error('Error loading service centers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    const initializeScreen = async () => {
      await Promise.all([
        loadServiceCenters(),
        getUserLocation(),
      ]);
    };

    initializeScreen();
  }, []);

  // Pull to refresh handler
  const onRefresh = () => {
    loadServiceCenters(true);
  };

  // Loading state
  if (loading && centers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>My Service Centers</Text>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4f3e2f" />
          <Text style={styles.loadingText}>Loading service centers...</Text>
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
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Service Centers</Text>
      
      {location && (
        <View style={styles.mapWrapper}>
          <GoogleMapView center={location} markers={centers} />
        </View>
      )}
      
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f3e2f']}
            tintColor="#4f3e2f"
          />
        }
      >
        {centers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No service centers found</Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh or check your warranties
            </Text>
          </View>
        ) : (
          centers.map((center, index) => (
            <ServiceCenterCard
              key={`${center.name}-${center.latitude}-${index}`}
              name={center.name}
              city={center.address}
              address={center.address}
              notes={
                center.isOpen !== undefined
                  ? center.isOpen
                    ? `Open now${center.closeTime ? `, closes at ${center.closeTime.slice(0, 2)}:${center.closeTime.slice(2)}` : ''}`
                    : 'Closed now'
                  : ''
              }
              phone={center.phone}
              distance={center.distanceKm}
            />
          ))
        )}
      </ScrollView>
      
      {!isWeb && (
        <View style={styles.bottomNavContainer}>
          <BottomNavBar />
        </View>
      )}
    </SafeAreaView>
  );
};

export default MyServiceCenters;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#E9E0D4',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
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
  title: {
    fontSize: 28,
    fontFamily: 'InriaSerif-Bold',
    textAlign: 'center',
    marginVertical: Platform.OS === 'android' ? 8 : 10,
    color: '#000',
  },
  mapWrapper: {
    height: '28%',
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  content: { 
    paddingBottom: Platform.OS === 'android' ? 100 : 80,
    flexGrow: 1,
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
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E9E0D4',
    paddingBottom: Platform.OS === 'android' ? 30 : 10,
    paddingTop: 0,
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -2 },
  },
  scrollViewStyle: {
    flex: 1,
    marginBottom: Platform.OS === 'android' ? 80 : 0,
  },
});