// screens/settings.tsx

import React, { useContext } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { UserContext } from '../context/UserContext'; // Adjust the path as necessary

interface SettingOption {
  id: string;
  name: string;
  icon: string;
  type: 'toggle' | 'navigation';
  route?: string; // Added route for navigation-type options
}

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
  const logoSize = width * 0.25; // 25% of screen width
  const titleFontSize = width * 0.06; // 6% of screen width
  const optionFontSize = width * 0.04; // 4% of screen width
  const iconSize = width * 0.07; // 7% of screen width

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
        router.push(option.route);
      }
    }
    // Handle other types if necessary
  };

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

        {/* Title */}
        <Text style={[styles.title, { fontSize: titleFontSize }]}>Settings</Text>

        {/* Settings Options */}
        <ScrollView contentContainerStyle={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionRow}
              onPress={() => handleOptionPress(option)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name={option.icon} size={iconSize} color="#000" />
                <Text style={[styles.optionText, { fontSize: optionFontSize }]}>{option.name}</Text>
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
        </ScrollView>
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
    paddingBottom: 100, // To accommodate BottomNavBar and AddWarrantyButton
  },
  logo: {
    resizeMode: 'contain',
    marginBottom: 10,
    marginTop: 40,
  },
  title: {
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
    marginBottom: 20,
  },
  optionsContainer: {
    width: '100%',
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
});
