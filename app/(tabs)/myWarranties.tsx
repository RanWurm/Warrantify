import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';

import BottomNavBar from '../components/BottomNavBar';
import AddWarrantyOptions from '../components/AddWarrantyOptions.';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WarrantyCard from '../components/WarrantyCard';
import Constants from 'expo-constants';


interface WarrantyItemProps {
  productId: string;
  title: string;
  subtitle: string;
  date: string;
  timeAgo: string;
  iconName: string;
  progress: number;
  notes: string;
}

const isWeb = Platform.OS === 'web';
const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;


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

const MyWarranties = () => {
  const [warranties, setWarranties] = useState<WarrantyItemProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredWarranties, setFilteredWarranties] = useState<WarrantyItemProps[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const [userImage, setUserImage] = useState<string>(''); 
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const [expiredCount, setExpiredCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [recentCount, setRecentCount] = useState(0);

  const refreshWarranties = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchWarranties = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
		const response = await axios.post(`${serverBackendURL}/user-warranties`,{ token });        
        const now = new Date().getTime();
        const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

        let expired = 0;
        let inProgress = 0;
        let recent = 0;

        const transformedWarranties = response.data.data.map((warranty: any) => {
          const expiration = new Date(warranty.expirationDate).getTime();
          const purchase = new Date(warranty.purchaseDate).getTime();

          if (expiration < now) {
            expired++;
          } else {
            inProgress++;
            if (now - purchase <= oneMonthMs) {
              recent++;
            }
          }

          return {
            productId: warranty._id,
            title: warranty.productName,
            subtitle: warranty.model || 'No model specified',
            date: warranty.purchaseDate
              ? new Date(warranty.purchaseDate).toLocaleDateString()
              : 'No date',
            timeAgo: getTimeAgo(warranty.purchaseDate),
            iconName: getIconName(warranty.productName),
            progress: calculateProgress(warranty.purchaseDate, warranty.expirationDate),
            notes: warranty.notes || 'No additional notes'
          };
        });

        setWarranties(transformedWarranties);
        setFilteredWarranties(transformedWarranties);

        setExpiredCount(expired);
        setInProgressCount(inProgress);
        setRecentCount(recent);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching warranties:', err);
        setError('Failed to load warranties');
        setLoading(false);
      }
    };

    fetchWarranties();
  }, [refreshTrigger]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.post(`${serverBackendURL}/userdata`, { token });
        if (response.data.data.image) {
          setUserImage(response.data.data.image);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, []);

  const calculateProgress = (purchaseDate: Date | null, expirationDate: Date | null) => {
    if (!purchaseDate || !expirationDate) return 0;
    const start = new Date(purchaseDate).getTime();
    const end = new Date(expirationDate).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const elapsed = now - start;
    const progress = (elapsed / total) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getIconName = (productName: string): string => {
    const productMap: { [key: string]: string } = {
      Monitor: 'monitor',
      Tablet: 'tablet',
      Coffe_machine: 'coffee',
    };
    return productMap[productName] || 'package-variant-closed';
  };

  const getTimeAgo = (date: Date | null) => {
    if (!date) return 'No date';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredWarranties(warranties);
    } else {
      const filtered = warranties.filter(
        (warranty) =>
          warranty.title.toLowerCase().includes(query.toLowerCase()) ||
          warranty.subtitle.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredWarranties(filtered);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const total = expiredCount + inProgressCount;
  const expiredPercentage = total > 0 ? Math.round((expiredCount / total) * 100) : 0;
  const inProgressPercentage = total > 0 ? Math.round((inProgressCount / total) * 100) : 0;
  const recentPercentage = total > 0 ? Math.round((recentCount / total) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f3e2f" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.header}>
        <Text style={styles.title}>My Warranties</Text>

        <View style={styles.profileContainer}>
		<View style={styles.topRow}>  {/* ✅ NEW ROW wrapper */}
          <View style={styles.profileImageWrapper}>
            <Image
              source={
                userImage
                  ? { uri: userImage }
                  : { uri: 'data:image/png;base64,...' }
              }
              style={styles.profileImage}
            />
          </View>

		  <View style={styles.statisticsContainer}>
			<View style={styles.statBlock}>
				<Text style={styles.statNumber}>{expiredPercentage}%</Text>
				<Text style={styles.statLabel}>Expired</Text>
			</View>
			<View style={styles.statBlock}>
				<Text style={styles.statNumber}>{inProgressPercentage}%</Text>
				<Text style={styles.statLabel}>In Progress</Text>
			</View>
				<View style={styles.statBlock}>
				<Text style={styles.statNumber}>{recentPercentage}%</Text>
				<Text style={styles.statLabel}>Recent</Text>
			</View>
			</View>
        </View>

          <SearchBar
			variant="myWarranties"
			onSearch={handleSearch}
			onSelectSuggestion={handleSelectSuggestion}
			placeholder="Search your warranties..."
			filterOptions={{
				text: 'All Warranties',
				onPress: () => console.log('Filter button pressed'),
			}}
			autocompleteEndpoint="http://10.0.0.12:5000/autocomplete"
			additionalStyles={{
				container: styles.searchBarContainer,
				filterButton: styles.filterButton,
				filterButtonText: styles.filterButtonText,
				searchInput: styles.searchInput,
				searchText: styles.searchText,
			}}
			/>

        </View>
      </View>

      <ScrollView style={styles.warrantyList}>
        <View style={{ width: isWeb ? '50%' : '100%', alignSelf: 'center' }}>
          {filteredWarranties.map((warranty, index) => (
            <WarrantyCard key={index} {...warranty} />
          ))}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>

      {!isWeb && <BottomNavBar />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E0D4',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  title: {
    fontSize: 32,
    fontFamily: 'InriaSerif-Bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 5,
  },
  statisticsContainer: {
	flexDirection: 'row',
	justifyContent: 'space-between',
	flex: 1, // take remaining width
  },
  
  statBlock: {
	alignItems: 'center',
	marginHorizontal: isWeb ? 15 : 5,
  },
  
  statNumber: {
	fontSize: isWeb ? 30 : 20,
	fontWeight: 'bold',
	color: '#333',
	fontFamily: 'InriaSerif-Bold',
  },
  
  statLabel: {
	fontSize: 14,
	color: '#666',
	fontFamily: 'InriaSerif-Regular',
  },
  topRow: {
	flexDirection: 'row',
	alignItems: 'center',  
	justifyContent: 'space-between', // ✅ or 'space-between' if you prefer
  },
  
  profileContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#F5EFE6',
    padding: 15,
    borderRadius: 15,
    borderColor: '#7E8FA6',
    borderWidth: 1,
    width: isWeb ? '50%' : '100%',
    alignSelf: 'center',
	marginTop: isWeb? 50 : 0,
  },
  profileImageWrapper: {
    width: isWeb ? 200 : 120,
    height: isWeb ? 200 : 120,
    borderRadius: isWeb ? 100 : 90,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD',
	right: isWeb? 200: 0,

  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  warrantyList: {
    flex: 1,
  },
  bottomPadding: {
    height: 80,
  },
  searchBarContainer: {
	marginHorizontal: 10,
	marginVertical: 10,
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
  
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
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

export default MyWarranties;