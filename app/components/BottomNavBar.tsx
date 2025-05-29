import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

//import { auth } from "../../constants/firebase.js";

const BottomNavBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (route) => {
    if (pathname === route) return;
    router.push(route);
  };

  const handleLogout = async () => {
    try {
      //await signOut(auth);
      Alert.alert("Logged Out", "You have been logged out successfully.");
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Logout Failed", "Something went wrong. Please try again.");
    }
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navButton} 
        onPress={() => navigateTo('/home ')}
      >
        <MaterialCommunityIcons
          name="home"
          size={24}
          color={pathname === '/' ? '#7E8FA6' : '#555'}
        />
        <Text style={[
          styles.navText,
          pathname === '/home' && styles.activeNavText
        ]}>
          Home
        </Text>
      </TouchableOpacity>

      

      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => navigateTo('/myWarranties')}
      >
        <MaterialCommunityIcons
          name="account"
          size={24}
          color={pathname === '/myWarranties' ? '#7E8FA6' : '#555'}
        />
        <Text style={[
          styles.navText,
          pathname === '/myWarranties' && styles.activeNavText
        ]}>
          My Warranties
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => navigateTo('/adBoard')}
      >
        <MaterialCommunityIcons
          name="storefront"
          size={24}
          color={pathname === '/adBoard' ? '#7E8FA6' : '#555'}
        />
        <Text style={[
          styles.navText,
          pathname === '/adBoard' && styles.activeNavText
        ]}>
          Warranty Shop
        </Text>
      </TouchableOpacity>

     <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateTo('/serviceCenters')}
            >
            <MaterialCommunityIcons
                name="tools"
                size={24}
                color={pathname === '/serviceCenters' ? '#7E8FA6' : '#555'}
            />
            <Text style={[
                styles.navText,
                pathname === '/serviceCenters' && styles.activeNavText
            ]}>
                Service Centers
            </Text>
     </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => navigateTo('/settings')}
      >
        <MaterialCommunityIcons
          name="cog"
          size={24}
          color={pathname === '/settings' ? '#7E8FA6' : '#555'}
        />
        <Text style={[
          styles.navText,
          pathname === '/settings' && styles.activeNavText
        ]}>
          settings
        </Text>
      </TouchableOpacity>
      
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#E9E0D4',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    position: 'absolute',
    bottom: 10,
  },
  navButton: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#555',
  },
});

export default BottomNavBar;