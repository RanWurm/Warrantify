// screens/settings.tsx

import React, { useContext } from 'react';
import { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  useWindowDimensions,
  Image,
  Alert,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { UserContext } from '../context/UserContext'; 



interface SettingOption {
  id: string;
  name: string;
  icon: string;
  type: 'toggle' | 'navigation';
  route?: string; // Added route for navigation-type options
}

const isWeb = Platform.OS === 'web';


const NavItem = ({ label, destination }: { label: string; destination: string }) => {
	const [hovered, setHovered] = useState(false);
	const router = useRouter();
  
	return (
	  <Pressable
		  onPress={() => router.push(destination as any)}
		  onHoverIn={() => setHovered(true)}
		onHoverOut={() => setHovered(false)}
		style={[
		  styles.navItem,
		  hovered && { backgroundColor: 'rgb(255,255,255)' },
		]}
	  >
		<Text style={styles.navItemText}>{label}</Text>
	  </Pressable>
	);
  };

const settingsOptions: SettingOption[] = [
  { id: '1', name: 'Account', icon: 'person-outline', type: 'navigation', route: '/account' },
  { id: '2', name: 'Notifications', icon: 'notifications-outline', type: 'toggle' },
  { id: '3', name: 'Privacy', icon: 'lock-closed-outline', type: 'navigation', route: '/privacy' },
  { id: '4', name: 'Help & Support', icon: 'help-circle-outline', type: 'navigation', route: '/helpAndSupport' },
  { id: '5', name: 'About', icon: 'information-circle-outline', type: 'navigation', route: '/about' },
  { id: '6', name: 'Logout', icon: 'log-out-outline', type: 'navigation' }, // Removed route since it's handled separately
];


export default function Settings() {
  const [fontsLoaded] = useFonts({
    'InriaSerif-Regular': require('../../assets/fonts/InriaSerif-Regular.ttf'),
    'InriaSerif-Bold': require('../../assets/fonts/InriaSerif-Bold.ttf'),
  });

  const { width } = useWindowDimensions();
  const router = useRouter();
  const { logout, isAuthenticated } = useContext(UserContext); // Access the logout function and auth state

  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(false);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = React.useState(false);

  if (!fontsLoaded) {
    return null; // Render nothing while fonts are loading
  }

  // Dynamic sizing based on screen width
  const logoSize = Math.min(width * 0.3, 120);
  const titleFontSize = Math.min(width * 0.07, 32);
  const categorySize = Math.min(width * 0.25, 120);
  const iconSize = categorySize * 0.36;
  const navFontSize = Math.min(width * 0.03, 16);


  const toggleSwitch = (optionName: string) => {
    if (optionName === 'Notifications') {
      setIsNotificationsEnabled((previousState) => !previousState);
      // Implement notification toggle logic here
    } else if (optionName === 'Dark Mode') {
      setIsDarkModeEnabled((previousState) => !previousState);
      // Implement Dark Mode theme toggle if applicable
    }
    // Add more toggles as needed
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => {
            await logout();
            // Optionally, navigate to login if not handled within logout
            router.replace('/login'); // Uncomment if navigation is not handled in logout
          } 
        },
      ],
      { cancelable: true }
    );
  };

  const handleOptionPress = (option: SettingOption) => {
    if (option.type === 'navigation') {
      if (option.name === 'Logout') {
        handleLogout();
      } else if (option.route) {
        router.push(option.route as any);
      }
    }
    // Handle other types if necessary
  };

  return (
    <>
      {/* Disable the default header */}
      <Stack.Screen options={{ headerShown: false }} />
	  
	  {isWeb && (
		<View style={styles.heroSection}>
			<Image
			source={require('../../assets/images/warrantylogo.png')}
			style={styles.heroLogo}
			/>
			<Text style={styles.heroTitle}>Manage Your Experience</Text>
			<Text style={styles.heroSubtitle}>Control your account, privacy, and notifications</Text>
		</View>
		)}


	  {isWeb && (
			  <View style={styles.topNavbar}>
				{[
							{ label: 'Home', destination: '/home' },
							{ label: 'My Warranties', destination: '/myWarranties' },
							{ label: 'Shop', destination: '/adBoard' },
							{ label: 'Settings', destination: '/settings' },
						].map((item) => (
							<NavItem key={item.label} label={item.label} destination={item.destination} />
					))}
			  </View>
			)}

      <View style={styles.container}>

	  <View style={styles.settingsHeader}>
		{isWeb ? (
			<>
			<Text style={[styles.title, { fontSize: titleFontSize }]}>Settings</Text>
			<Image
				source={require('../../assets/images/settings-icon.png')}
				style={[
				styles.settingsIcon,
				{
					width: logoSize * 0.4,
					height: logoSize * 0.4,
				},
				]}
			/>
			</>
		) : (
			<>
			<Image
				source={require('../../assets/images/settings-icon.png')}
				style={[
				styles.settingsIcon,
				{
					width: logoSize,
					height: logoSize,
				},
				]}
			/>
			<Text style={[styles.title, { fontSize: titleFontSize }]}>Settings</Text>
			</>
		)}
	</View>

        {/* Settings Options */}
		<ScrollView contentContainerStyle={styles.optionsContainer} showsVerticalScrollIndicator={false}>
			{isWeb ? (
				<View style={styles.columnsContainer}>
				{/* Left column */}
				<View style={styles.column}>
					{settingsOptions.slice(0, 3).map((option) => (
					<TouchableOpacity
						key={option.id}
						style={styles.optionRow}
						onPress={() => handleOptionPress(option)}
					>
						<View style={styles.optionLeft}>
						<Ionicons name={option.icon as any} size={iconSize} color="#000" />
						<Text style={[styles.optionText, { fontSize: navFontSize }]}>{option.name}</Text>
						</View>
						{option.type === 'toggle' ? (
						<Switch
							value={option.name === 'Notifications' ? isNotificationsEnabled : isDarkModeEnabled}
							onValueChange={() => toggleSwitch(option.name)}
						/>
						) : (
						<Ionicons name="chevron-forward" size={iconSize * 0.8} color="#666" />
						)}
					</TouchableOpacity>
					))}
				</View>

				{/* Right column */}
				<View style={styles.column}>
					{settingsOptions.slice(3).map((option) => (
					<TouchableOpacity
						key={option.id}
						style={styles.optionRow}
						onPress={() => handleOptionPress(option)}
					>
						<View style={styles.optionLeft}>
						<Ionicons name={option.icon as any} size={iconSize} color="#000" />
						<Text style={[styles.optionText, { fontSize: navFontSize }]}>{option.name}</Text>
						</View>
						{option.type === 'toggle' ? (
						<Switch
							value={option.name === 'Notifications' ? isNotificationsEnabled : isDarkModeEnabled}
							onValueChange={() => toggleSwitch(option.name)}
						/>
						) : (
						<Ionicons name="chevron-forward" size={iconSize * 0.8} color="#666" />
						)}
					</TouchableOpacity>
					))}
				</View>
				</View>
			) : (
				// Mobile view: classic stacked
				settingsOptions.map((option) => (
				<TouchableOpacity
					key={option.id}
					style={styles.optionRow}
					onPress={() => handleOptionPress(option)}
				>
					<View style={styles.optionLeft}>
					<Ionicons name={option.icon as any} size={iconSize} color="#000" />
					<Text style={[styles.optionText, { fontSize: navFontSize }]}>{option.name}</Text>
					</View>
					{option.type === 'toggle' ? (
					<Switch
						value={option.name === 'Notifications' ? isNotificationsEnabled : isDarkModeEnabled}
						onValueChange={() => toggleSwitch(option.name)}
					/>
					) : (
					<Ionicons name="chevron-forward" size={iconSize * 0.8} color="#666" />
					)}
				</TouchableOpacity>
				))
			)}
			</ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E0D4',
	alignItems: isWeb ? 'center' : 'center',
    padding: 16,
    paddingBottom: 100, 
	width: '100%',
  },
  logo: {
    resizeMode: 'contain',
    marginBottom: 10,
    marginTop: isWeb ? 0: 100,
  },
  title: {
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
    marginBottom: 20,
	marginTop: isWeb ? 0 : 10,
  },
  optionsContainer: {
    width: isWeb ? '100%' : 300,
    paddingTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    marginVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: 15,
    fontFamily: 'InriaSerif-Regular',
    color: '#000',
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
columnsContainer: {
	flexDirection: 'row',
	justifyContent: 'center',
	width: 1500,
  },
  column: {
	flex: 1,
	paddingHorizontal: 10,
  }, 
  heroSection: {
	width: '100%',
	backgroundColor: '#E9E0D4',
	alignItems: 'center',
	paddingHorizontal: 20,
  },
  heroLogo: {
	width: 120,
	height: 120,
	resizeMode: 'contain',
	marginBottom: 20,
	marginTop:90,
  },
  heroTitle: {
	fontSize: 28,
	fontWeight: 'bold',
	color: '#333',
	fontFamily: 'InriaSerif-Bold',
	textAlign: 'center',
  },
  
  heroSubtitle: {
	fontSize: 16,
	color: '#555',
	fontFamily: 'InriaSerif-Regular',
	textAlign: 'center',
	maxWidth: 400,
  },
  settingsHeader: {
	flexDirection: isWeb ? 'row' : 'column', // row on web, column on mobile
	alignItems: 'center',
	justifyContent: isWeb ? 'flex-start' : 'center',
	width: '100%',
	marginBottom: 0,
	marginLeft: isWeb ? 350 : 0,
	paddingHorizontal: isWeb ? 40 : 0, // extra spacing on web
  },

  settingsIcon: {
	resizeMode: 'contain',
	marginLeft: isWeb ? 10 : 0, // gap between title and icon only on web
	marginTop: isWeb ? 0 : 60,  // little space on mobile between title and icon
  },
  
});