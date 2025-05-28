import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import ServiceCenterCard from '../components/serviceCenterCard';
import { Alert } from 'react-native';


const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;
const googleApiKey = "AIzaSyCn-qqKYulPv-Ken38MtqimNa1AiJFluic";

// const googleApiKey =
//   (Constants.manifest as any)?.extra?.GOOGLE_MAPS_API_KEY ||
//   Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

interface Warranty {
  serviceCenter?: string;
  notes?: string;
}

interface LocatedCenter {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const MyServiceCenters: React.FC = () => {
  const [centers, setCenters] = useState<LocatedCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const fetchWarrantiesAndLocations = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission denied');
        const userLoc = await Location.getCurrentPositionAsync({});
        const userLat = userLoc.coords.latitude;
        const userLng = userLoc.coords.longitude;
        setLocation({ latitude: userLat, longitude: userLng });

        const token = await AsyncStorage.getItem('token');
        const response = await axios.post(`${serverBackendURL}/user-warranties`, { token });
        const warranties: Warranty[] = response.data.data;

        const seen = new Set();
        const uniqueCenters = warranties
          .filter((w) => w.serviceCenter && !seen.has(w.serviceCenter) && seen.add(w.serviceCenter))
          .map((w) => w.serviceCenter!);

        const resolvedCenters: LocatedCenter[] = [];

        for (const centerName of uniqueCenters) {
          const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
            centerName
          )}&location=${userLat},${userLng}&key=${googleApiKey}`;

          console.log("🔍 Google Places search URL:", textSearchUrl);

          try {
            const res = await fetch(textSearchUrl);
            const places = await res.json();
            
            console.log(JSON.stringify(places.results, null, 2));

            if (places.results && places.results.length > 0) {
              const sorted = places.results.sort((a, b) => {
                const distA = Math.hypot(a.geometry.location.lat - userLat, a.geometry.location.lng - userLng);
                const distB = Math.hypot(b.geometry.location.lat - userLat, b.geometry.location.lng - userLng);
                return distA - distB;
              });
              const closest = sorted[0];

              const address = closest.formatted_address?.trim() || closest.vicinity?.trim() || 'Unknown';

              console.log("✅ Closest place for", centerName);
              console.log("Formatted Address:", closest.formatted_address);
              console.log("Vicinity:", closest.vicinity);

              resolvedCenters.push({
                name: centerName,
                address,
                latitude: closest.geometry.location.lat,
                longitude: closest.geometry.location.lng,
              });
            } else {
              resolvedCenters.push({
                name: centerName,
                address: 'None in your area',
                latitude: userLat + Math.random() * 0.02,
                longitude: userLng + Math.random() * 0.02,
              });
            }
          } catch (err) {
            console.error(`Error searching for ${centerName}:`, err);
            resolvedCenters.push({
              name: centerName,
              address: 'Error resolving location',
              latitude: userLat + Math.random() * 0.02,
              longitude: userLng + Math.random() * 0.02,
            });
          }
        }

        setCenters(resolvedCenters);
        setLoading(false);
      } catch (err) {
        console.error('Error loading service centers:', err);
        setLoading(false);
      }
    };

    fetchWarrantiesAndLocations();
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
        <MapView
          style={{ flex: 1 }}
          showsUserLocation
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
        >
          {centers.map((center, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: center.latitude, longitude: center.longitude }}
              title={center.name}
              description={center.address }
            />
          ))}
        </MapView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {centers.map((center, index) => (
          <ServiceCenterCard
            key={index}
            name={center.name}
            city={center.address}
            address={center.address}
            notes={
              center.address.includes('None') || center.address === 'Unknown'
                ? 'Try searching manually or check spelling.'
                : ''
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyServiceCenters;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E0D4',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'InriaSerif-Bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: '#000',
  },
  mapWrapper: {
    height: 300,
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
    paddingBottom: 80,
  },
});
