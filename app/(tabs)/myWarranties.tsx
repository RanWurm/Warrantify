// Optimized MyWarranties.tsx
import React, { useEffect, useState, useMemo } from 'react';
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
  RefreshControl,
} from 'react-native';

import BottomNavBar from '../components/BottomNavBar';
import SearchBar from '../components/SearchBar';
import WarrantyCard from '../components/WarrantyCard';
import warrantiesCacheService, { 
  WarrantyItemProps, 
  WarrantyStats, 
  UserProfile 
} from '../../services/warrantiesCacheService';

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
        hovered ? { backgroundColor: 'rgb(255,255,255)' } : null,
      ]}
    >
      <Text style={styles.navItemText}>{label}</Text>
    </Pressable>
  );
};

const MyWarranties = () => {
  // State management
  const [warranties, setWarranties] = useState<WarrantyItemProps[]>([]);
  const [stats, setStats] = useState<WarrantyStats>({
    expiredCount: 0,
    inProgressCount: 0,
    recentCount: 0,
    expiredPercentage: 0,
    inProgressPercentage: 0,
    recentPercentage: 0,
    totalCount: 0,
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

  // Memoized filtered warranties to avoid recalculation on every render
  const filteredWarranties = useMemo(() => {
    return warrantiesCacheService.filterWarranties(warranties, searchQuery);
  }, [warranties, searchQuery]);

  // Load warranties data
  const loadWarranties = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Get cached data first for instant loading
      if (!forceRefresh) {
        const cached = await warrantiesCacheService.getCachedData();
        if (cached) {
          setWarranties(cached.warranties);
          setStats(cached.stats);
          setUserProfile(cached.userProfile);
          setLoading(false);
        }
      }

      // Get fresh data (will use cache if valid, or fetch fresh)
      const data = forceRefresh 
        ? await warrantiesCacheService.refreshCache()
        : await warrantiesCacheService.preloadWarranties();

      setWarranties(data.warranties);
      setStats(data.stats);
      setUserProfile(data.userProfile);
      setError(null);

    } catch (err) {
      console.error('Error loading warranties:', err);
      setError('Failed to load warranties');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadWarranties();
  }, []);

  // Keyboard listeners
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

  // Search handler (simplified since filtering is memoized)
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
  };

  // Pull to refresh handler
  const onRefresh = () => {
    loadWarranties(true);
  };

  // Loading state
  if (loading && warranties.length === 0) {
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
        
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4f3e2f" />
          <Text style={styles.loadingText}>Loading warranties...</Text>
        </View>
        
        {!isWeb && (
          <View style={styles.bottomNavContainer}>
            <BottomNavBar />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Error state
  if (error && warranties.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadWarranties(true)} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
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
          <View style={styles.topRow}>
            <View style={styles.profileImageWrapper}>
              <Image
                source={
                  userProfile.image
                    ? { uri: userProfile.image }
                    : require('../../assets/images/default-profile-pic.png')
                }
                style={styles.profileImage}
              />
            </View>

            <View style={styles.statisticsContainer}>
              <View style={styles.statBlock}>
                <Text style={styles.statNumber}>{stats.expiredPercentage}%</Text>
                <Text style={styles.statLabel}>Expired</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statNumber}>{stats.inProgressPercentage}%</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statNumber}>{stats.recentPercentage}%</Text>
                <Text style={styles.statLabel}>Recent</Text>
              </View>
            </View>
          </View>
          <Text style={styles.totalLabel}>{stats.totalCount} warranties in total</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.warrantyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f3e2f']}
            tintColor="#4f3e2f"
          />
        }
      >
        <View style={{ width: isWeb ? '50%' : '100%', alignSelf: 'center' }}>
          {filteredWarranties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No warranties match your search' : 'No warranties found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Pull down to refresh'}
              </Text>
            </View>
          ) : (
            filteredWarranties.map((warranty, index) => (
              <WarrantyCard 
                key={`${warranty.productId}-${index}`} 
                {...warranty} 
              />
            ))
          )}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {!isWeb && (
        <View style={styles.bottomNavContainer}>
          <BottomNavBar />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9E0D4',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingTop: Platform.OS === 'android' ? 10 : 15,
  },
  title: {
    fontSize: 32,
    fontFamily: 'InriaSerif-Bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: Platform.OS === 'android' ? 3 : 5,
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  statBlock: {
    alignItems: 'center',
    marginHorizontal: isWeb ? 15 : 5,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    color: '#D0BBA2',
    fontFamily: 'InriaSerif-Bold',
    marginTop: '-8%',
    marginLeft: '30%',
    marginBottom: '2%',
  },
  statNumber: {
    fontSize: isWeb ? 30 : 20,
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
    justifyContent: 'space-between',
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
    marginTop: isWeb ? 50 : 0,
  },
  profileImageWrapper: {
    width: isWeb ? 200 : 120,
    height: isWeb ? 200 : 120,
    borderRadius: isWeb ? 100 : 90,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD',
    right: isWeb ? 200 : 0,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  warrantyList: {
    flex: 1,
    marginBottom: Platform.OS === 'android' ? 60 : 0,
  },
  bottomPadding: {
    height: 80,
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
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4f3e2f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'InriaSerif-Bold',
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
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E9E0D4',
    paddingBottom: Platform.OS === 'android' ? 25 : 10,
    paddingTop: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -2 },
  },
});

export default MyWarranties;