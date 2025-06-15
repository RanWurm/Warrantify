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
import BottomNavBar from '../components/BottomNavBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import notificationService from '../../services/notificationService';

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
  { id: '3', name: 'Test Notifications', icon: 'notifications-outline', type: 'navigation' },
  { id: '6', name: 'Logout', icon: 'log-out-outline', type: 'navigation' },
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

  // Load saved notification state when component mounts
  React.useEffect(() => {
    const loadNotificationState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('notificationsEnabled');
        if (savedState !== null) {
          const isEnabled = savedState === 'true';
          setIsNotificationsEnabled(isEnabled);
          if (isEnabled) {
            await notificationService.initialize();
          }
        }
      } catch (error) {
        console.error('Error loading notification state:', error);
      }
    };
    loadNotificationState();
  }, []);

  if (!fontsLoaded) {
    return null; // Render nothing while fonts are loading
  }

  // Dynamic sizing based on screen width
  const logoSize = Math.min(width * 0.3, 120);
  const titleFontSize = Math.min(width * 0.07, 32);
  const categorySize = Math.min(width * 0.25, 120);
  const iconSize = categorySize * 0.36;
  const navFontSize = Math.min(width * 0.03, 16);


  const toggleSwitch = async (optionName: string) => {
    if (optionName === 'Notifications') {
      const newState = !isNotificationsEnabled;
      setIsNotificationsEnabled(newState);
      
      // Save the new state to AsyncStorage
      try {
        await AsyncStorage.setItem('notificationsEnabled', newState.toString());
        
        if (newState) {
          // Initialize notifications when enabling
          await notificationService.initialize();
        } else {
          // Cancel all notifications when disabling
          await notificationService.cancelAllWarrantyNotifications();
        }
      } catch (error) {
        console.error('Error saving notification state:', error);
        Alert.alert('Error', 'Failed to save notification settings');
      }
    } else if (optionName === 'Dark Mode') {
      setIsDarkModeEnabled((previousState) => !previousState);
    }
  };

// Updated handleLogout function in settings.tsx - CLEAR ALL CACHE

const navigation = useNavigation();

const handleLogout = async () => {
  const performLogout = async () => {
    try {
      console.log('🚪 LOGOUT: Starting logout...');
      
      // CLEAR EVERYTHING - Use clear() instead of multiRemove
      await AsyncStorage.clear();
      console.log('🧹 LOGOUT: ALL AsyncStorage data cleared');
      
      // Additional verification - make sure specific keys are gone
      const verification = await AsyncStorage.multiGet([
        'token',
        'userData',
        'isLoggedIn',
        'cached_warranties',
        'cached_user_profile',
        'cached_transformed_warranties',
        'cached_warranty_stats',
        'warranties_last_update',
        'cachedServiceCenters',
        'serviceCentersLastUpdate',
        'cached_real_ads',
        'cached_recommendations',
        'cached_top_products',
        'cached_combined_ads',
        'ad_board_last_update'
      ]);
      
      // Log what's left (should all be null)
      verification.forEach(([key, value]) => {
        if (value !== null) {
          console.warn(`⚠️ ${key} still has value:`, value);
        }
      });
      
      // Force a longer delay to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Navigate to login
      //router.replace('/login');
      
      // Reset navigation stack - this prevents going back
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'login' }],
        })
      );
      
      console.log('✅ LOGOUT: Complete');
      
    } catch (error) {
      console.error('❌ LOGOUT Error:', error);
      Alert.alert('Error', 'An error occurred during logout. Please try again.');
    }
  };

  if (Platform.OS === 'web') {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      await performLogout();
    }
  } else {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout
        },
      ],
      { cancelable: true }
    );
  }
};

  const handleOptionPress = async (option: SettingOption) => {
    if (option.name === 'Test Notifications') {
      try {
        await notificationService.scheduleTestNotification();
        Alert.alert(
          'Test Notification',
          'A test notification will be sent in 10 seconds. Please make sure notifications are enabled.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to schedule test notification');
      }
    } else if (option.name === 'Logout') {
      handleLogout();
    } else if (option.route) {
      router.push(option.route);
    }
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
});