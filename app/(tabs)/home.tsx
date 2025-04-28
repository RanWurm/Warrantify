import { Stack } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import BottomNavBar from '../components/BottomNavBar';
import { ScrollView } from 'react-native'; 
import { useState } from 'react'; 
import { Pressable } from 'react-native'; 

import { useRouter } from 'expo-router';

export default function home() {
  const [fontsLoaded] = useFonts({
    'InriaSerif-Regular': require('../../assets/fonts/InriaSerif-Regular.ttf'),
    'InriaSerif-Bold': require('../../assets/fonts/InriaSerif-Bold.ttf'),
  });

  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
	const router = useRouter();

  if (!fontsLoaded) {
    return null; 
  }

  // Dynamic sizing but capped for web
  const logoSize = Math.min(width * 0.3, 120);
  const titleFontSize = Math.min(width * 0.07, 32);
  const subtitleFontSize = Math.min(width * 0.045, 22);
  const categorySize = Math.min(width * 0.25, 120);
  const iconSize = categorySize * 0.36;
  const navIconSize = Math.min(width * 0.06, 28);
  const navFontSize = Math.min(width * 0.03, 16);
  const buttonWidth = Math.min(width * 0.8, 200); // Add Warranty button width
	
  const buttonHeight = isWeb ? 50 : 60; // Smaller button height for web
  const fontSize = isWeb ? 18 : 20;      // Smaller font for web
  const buttonPadding = isWeb ? 10 : 14; // Less padding for web


	const [hovered, setHovered] = useState(false);


	const mobileGridData = [
		{ id: '1', name: 'Computer', icon: 'desktop-outline' },
		{ id: '2', name: 'Laptop', icon: 'laptop-outline' },
		{ id: '3', name: 'Smartphone', icon: 'phone-portrait-outline' },
		{ id: '4', name: 'Television', icon: 'tv-outline' },
		{ id: '5', name: 'Printer', icon: 'print-outline' },
		{ id: '6', name: 'Charger', icon: 'battery-charging-outline' },
		{ id: '7', name: 'Refrigerator', icon: 'snow-outline' },
		{ id: '8', name: 'Microwave', icon: 'restaurant-outline' },
		{ id: '9', name: 'Washer', icon: 'water-outline' },
	];
	
	const webGridData = mobileGridData.filter(item => item.name !== 'Washer'); 
	

  return (
		<>
			<Stack.Screen options={{ headerShown: false }} />

			{isWeb && (
  		<View style={styles.topNavbar}>
			{['Home', 'My Warranties', 'Shop', 'Settings'].map((item) => {
				const [hovered, setHovered] = useState(false);

      return (
        <Pressable
					onHoverIn={() => setHovered(true)}
					onHoverOut={() => setHovered(false)}
					style={[
						styles.navItem, 
						hovered && { backgroundColor: 'rgb(255, 255, 255)' }
					]}
				>
					<Text style={styles.navItemText}>{item}</Text>
				</Pressable>
			);
			
		})}
  </View>
)}
			
			{/* Scrollable content */}
			<ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingTop: isWeb ? 80 : 20, paddingBottom: isWeb ? 100 : 20, }}
			style={{ width: '100%' }}>
				<View style={styles.container}>
					
					{/* Logo */}
					<Image
						source={require('../../assets/images/warrantylogo.png')}
						style={[styles.logo, { width: logoSize, height: logoSize }]}
					/>
	
					{/* Title */}
					<Text style={[styles.title, { fontSize: titleFontSize }]}>
						Warrantify
					</Text>
	
					{/* Subtitle */}
					<Text style={[styles.subtitle, { fontSize: subtitleFontSize }]}>
						Warranty Management App
					</Text>
	
					{/* Grid of categories */}
					<FlatList
						data={isWeb ? webGridData : mobileGridData}
						keyExtractor={(item) => item.id}
						numColumns={isWeb ? 4 : 3}
						renderItem={({ item }) => (
							<View style={[styles.categoryContainer, { width: categorySize, height: categorySize }]}>
								<View style={styles.iconContainer}>
									<Ionicons name={item.icon as any} size={iconSize} color="#000" />
								</View>
								<View style={styles.labelContainer}>
									<Text style={[styles.labelText, { fontSize: navFontSize }]}>{item.name}</Text>
								</View>
							</View>
						)}
						scrollEnabled={false}
						contentContainerStyle={[styles.grid, { maxWidth: isWeb ? 1200 : '100%' }]} 
					/>

	
					{/* Add Warranty Button */}
					<View style={{ marginTop: 20, marginBottom: isWeb ? 60 : 20 }}>
						<Pressable
						  onPress={() => router.push('../components/AddWarrantyOptions.')} // or your correct route
							onHoverIn={() => setHovered(true)}
							onHoverOut={() => setHovered(false)}
							style={[
								styles.button,
								{ 
									height: buttonHeight, 
									paddingVertical: buttonPadding, 
									width: buttonWidth, 
									transform: hovered && isWeb ? [{ scale: 1.05 }] : [{ scale: 1 }],
									transitionDuration: '200ms',
								}
							]}
						>
							<Text style={[styles.buttonText, { fontSize }]}>
								Add Warranty
							</Text>
						</Pressable>
					</View>
	
				</View>
			</ScrollView>
			

			{isWeb && (
				<View style={{ width: '100%', backgroundColor: '#E9E0D4', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#ccc' }}>
					<Text style={{ color: '#777', fontSize: 14 }}>© 2025 Warrantify. All rights reserved.</Text>
				</View>
			)}

	
			{/* Bottom Navigation Bar */}
			{!isWeb && <BottomNavBar />}
		</>
	);	
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    //backgroundColor: '#E9E0D4',
    alignItems: 'center',
    padding: 16,
		width: '100%',
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
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    marginBottom: 20,
    fontFamily: 'InriaSerif-Regular',
    textAlign: 'center',
  },
  grid: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
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
    fontWeight: '500',
    fontFamily: 'InriaSerif-Bold',
    color: '#000',
  },
	button: {
    backgroundColor: '#7189A6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', 
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
	topNavbar: {
		width: '100%',
		backgroundColor: '#E9E0D4',
		flexDirection: 'row',
		justifyContent: 'center',
		paddingVertical: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
		position: 'fixed',
		top: 0,
		zIndex: 999,
	},
	navItem: {
		marginHorizontal: 10,
		paddingVertical: 10,
		paddingHorizontal: 20, 
		minWidth: 120,          
		alignItems: 'center',   
		justifyContent: 'center', 
		borderRadius: 8,
		transitionDuration: '200ms',
	},
	
	navItemText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#333',
		fontFamily: 'InriaSerif-Bold',
	},	
});
