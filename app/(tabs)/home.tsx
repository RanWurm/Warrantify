// screens/home.tsx

import { Stack } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import BottomNavBar from '../components/BottomNavBar';
import AddWarrantyOptions from '../components/AddWarrantyOptions.';

export default function home() {
  const [fontsLoaded] = useFonts({
    'InriaSerif-Regular': require('../../assets/fonts/InriaSerif-Regular.ttf'),
    'InriaSerif-Bold': require('../../assets/fonts/InriaSerif-Bold.ttf'),
  });

  const { width, height } = useWindowDimensions();

  if (!fontsLoaded) {
    return null; // Render nothing while fonts are loading
  }

  // Calculate dynamic sizes based on screen dimensions
  const logoSize = width * 0.3; // 30% of screen width
  const titleFontSize = width * 0.07; // 7% of screen width
  const subtitleFontSize = width * 0.045; // 4.5% of screen width
  const categorySize = width * 0.25; // 25% of screen width
  const iconSize = categorySize * 0.36; // 36% of category size
  const navIconSize = width * 0.06; // 6% of screen width
  const navFontSize = width * 0.03; // 3% of screen width

  return (
    <>
      {/* Disable the default header */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* Logo */}
        <Image
          source={require('../../assets/images/warrantylogo.png')}
          style={[styles.logo, { width: logoSize, height: logoSize }]}
        />

        {/* Title and Subtitle */}
        <Text style={[styles.title, { fontSize: titleFontSize }]}>Warrantify</Text>
        <Text style={[styles.subtitle, { fontSize: subtitleFontSize }]}>Warranty Management App</Text>

        {/* Grid of Categories */}
        <FlatList
          data={[
            { id: '1', name: 'Computer', icon: 'desktop-outline' },
            { id: '2', name: 'Laptop', icon: 'laptop-outline' },
            { id: '3', name: 'Smartphone', icon: 'phone-portrait-outline' },
            { id: '4', name: 'Television', icon: 'tv-outline' },
            { id: '5', name: 'Printer', icon: 'print-outline' },
            { id: '6', name: 'Charger', icon: 'battery-charging-outline' },
            { id: '7', name: 'Refrigerator', icon: 'snow-outline' },
            { id: '8', name: 'Microwave', icon: 'restaurant-outline' },
            { id: '9', name: 'Washer', icon: 'water-outline' },
          ]}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <View style={[styles.categoryContainer, { width: categorySize, height: categorySize }]}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={iconSize} color="#000" />
              </View>
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>{item.name}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.grid}
        />

        {/* Add Warranty Button */}
        <AddWarrantyOptions />

        {/* Bottom Navigation */}
        <BottomNavBar />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E0D4',
    alignItems: 'center',
    padding: 16,
  },
  logo: {
    resizeMode: 'contain',
    marginBottom: 10,
    marginTop: 40,
  },
  title: {
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
    marginTop: 0,
  },
  subtitle: {
    color: '#666',
    marginBottom: 20,
    fontFamily: 'InriaSerif-Regular',
  },
  grid: {
    alignItems: 'center',
    paddingBottom: 150, // Increased padding to accommodate AddWarrantyButton and BottomNavBar
    marginTop: 20,
  },
  categoryContainer: {
    margin: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  labelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'InriaSerif-Bold',
    color: '#000',
  },
});
