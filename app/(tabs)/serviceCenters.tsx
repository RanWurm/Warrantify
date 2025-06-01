import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import ServiceCenterCard from '../components/serviceCenterCard';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import GoogleMapView from '../components/WebMap';

const serverBackendURL =
  Constants.expoConfig?.extra?.SERVER_BACKEND_URL ||
  (Constants as any).manifest?.extra?.SERVER_BACKEND_URL;
const googleApiKey = 'AIzaSyCn-qqKYulPv-Ken38MtqimNa1AiJFluic';
const isWeb = Platform.OS === 'web';
const STORAGE_KEY = 'cachedServiceCenters';

interface Warranty {
  serviceCenter?: string;
}

interface LocatedCenter {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  isOpen?: boolean;
  closeTime?: string;
  distanceKm?: number;
}

const MyServiceCenters: React.FC = () => {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const [centers, setCenters] = useState<LocatedCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  // 1. Load cached centers on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((cached) => {
      if (cached) {
        setCenters(JSON.parse(cached));
        setLoading(false);
      }
    });
  }, []);

  // 2. Always fetch fresh data in background
  useEffect(() => {
    const fetchAndCache = async () => {
      setLoading(true);
      try {
        // Location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission denied');
        const { coords } = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });

        // Warranties
        const token = await AsyncStorage.getItem('token');
        const { data } = await axios.post(`${serverBackendURL}/user-warranties`, { token });
        const warranties: Warranty[] = data.data;
        const seen = new Set<string>();
        const unique = warranties
          .map((w) => w.serviceCenter)
          .filter((s): s is string => !!s && !seen.has(s) && seen.add(s));

        // Parallel geocode + details
        const fresh: LocatedCenter[] = (
          await Promise.all(
            unique.map(async (name) => {
              const locRes = await fetch(
                `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
                  name
                )}&location=${coords.latitude},${coords.longitude}&radius=15000&key=${googleApiKey}`
              ).then((r) => r.json());
              if (!locRes.results?.length) return null;
              const [best] = locRes.results.sort(
                (a: any, b: any) =>
                  Math.hypot(a.geometry.location.lat - coords.latitude, a.geometry.location.lng - coords.longitude) -
                  Math.hypot(b.geometry.location.lat - coords.latitude, b.geometry.location.lng - coords.longitude)
              );
              const details = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${best.place_id}&key=${googleApiKey}`
              ).then((r) => r.json());

              return {
                name,
                address: best.formatted_address || best.vicinity || 'Unknown',
                latitude: best.geometry.location.lat,
                longitude: best.geometry.location.lng,
                phone: details.result.formatted_phone_number,
                isOpen: details.result.opening_hours?.open_now,
                closeTime: details.result.opening_hours?.periods?.[0]?.close?.time,
                distanceKm: Math.round(
                  10 *
                    Math.hypot(
                      best.geometry.location.lat - coords.latitude,
                      best.geometry.location.lng - coords.longitude
                    ) *
                    111
                ) / 10,
              };
            })
          )
        ).filter((c): c is LocatedCenter => !!c);

        setCenters(fresh);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch (err) {
        console.error('Error loading centers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCache();
  }, []);

  if (loading || !location) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f3e2f" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Service Centers</Text>
      <View style={styles.mapWrapper}>
        <GoogleMapView center={location} markers={centers} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {centers.map((c, i) => (
          <ServiceCenterCard
            key={i}
            name={c.name}
            city={c.address}
            address={c.address}
            notes={
              c.isOpen !== undefined
                ? c.isOpen
                  ? `Open now, closes at ${c.closeTime?.slice(0, 2)}:${c.closeTime?.slice(2)}`
                  : 'Closed now'
                : ''
            }
            phone={c.phone}
            distance={c.distanceKm}
          />
        ))}
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
  paddingTop: Platform.OS === 'android' ? 20 : 0, // Less top padding on Android
},

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
  fontSize: 28,
  fontFamily: 'InriaSerif-Bold',
  textAlign: 'center',
  marginVertical: Platform.OS === 'android' ? 8 : 10, // Less margin on Android
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
  content: { paddingBottom: 80 },
  bottomNavContainer: {
  position: 'absolute',
  bottom: Platform.OS === 'android' ? 20 : 0, // Move up 20px on Android
  left: 0,
  right: 0,
  backgroundColor: '#E9E0D4', // Hide content underneath
  paddingTop: 10, // Add padding above nav bar
},
scrollViewStyle: {
  flex: 1,
  marginBottom: Platform.OS === 'android' ? 80 : 0, // Space for bottom nav on Android
},
});
