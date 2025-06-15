// Updated WarrantyCard.tsx with toggle market functionality

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import notificationService from '../../services/notificationService';

const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

interface WarrantyCardProps {
  productId: string;
  title: string;
  subtitle: string;
  date: string;
  timeAgo: string;
  iconName: string;
  progress: number;
  notes: string;
  onDelete?: () => void;

  model: string;
  purchaseDate: string;
  expirationDate: string;
  price: string;
}

const isWeb = Platform.OS === 'web';

const WarrantyCard: React.FC<WarrantyCardProps> = ({
  productId,
  title,
  subtitle,
  date,
  timeAgo,
  iconName,
  progress,
  notes,
  onDelete,
  model,
  purchaseDate,
  expirationDate,
  price,
  serviceCenter,
  store,
}) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [isOnMarket, setIsOnMarket] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Determine progress color based on the progress value. 
  let progressColor = '#7E8FA6';
  if (progress >= 75) {
    progressColor = '#AF6F6F';
  } else if (progress >= 40) {
    progressColor = '#FDCB6E';
  } else {
    progressColor = '#B3D2A1';
  }

  useEffect(() => {
    if (expanded) {
      checkMarketStatus();
    }
  }, [expanded, productId]);


  const checkMarketStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${serverBackendURL}/check-market-status/${productId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Market status for ${productId}:`, data); // Debug log
        setIsOnMarket(data.isOnMarket);
        
        // If it's on market, populate the form with existing data
        if (data.isOnMarket && data.adData) {
          setSalePrice(data.adData.salePrice?.toString() || '');
          setCity(data.adData.city || '');
          setDescription(data.adData.description || '');
          setPhoneNumber(data.adData.phoneNumber || '');
        }
      } else {
        console.log('Failed to check market status:', response.status); // Debug log
      }
    } catch (error) {
      console.error('Error checking market status:', error);
    }
  };

  const toggleExpanded = () => setExpanded(!expanded);

  const handleMarketAction = () => {
    if (isOnMarket) {
      handleRemoveFromMarket();
    } else {
      handleAddToMarket();
    }
  };
  
  const handleNavigateToProductInfo = () => {
  router.push({
    pathname: '/productInformation',
    params: {
      productId,
      productName: title,
      model,
      purchaseDate,
      expirationDate,
      price,
      serviceCenter,
      store,
    },
  });
};

  const handleAddToMarket = () => {
    // Reset form and open modal
    setSalePrice('');
    setCity('');
    setDescription('');
    setPhoneNumber('');
    setModalVisible(true);
  };

  const handleRemoveFromMarket = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to remove this item from the market?');
      if (!confirmed) return;
      await performRemoveFromMarket();
    } else {
      Alert.alert(
        'Remove from Market',
        'Are you sure you want to remove this item from the market?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => performRemoveFromMarket() }
        ]
      );
    }
  };

  const performRemoveFromMarket = async () => {

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${serverBackendURL}/remove-from-sale-board/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsOnMarket(false);
        // Clear form data
        setSalePrice('');
        setCity('');
        setDescription('');
        setPhoneNumber('');
        
        if (Platform.OS === 'web') {
          console.log('Item removed from market successfully');
        } else {
          Alert.alert('Success', 'Item removed from market successfully');
        }
      } else {
        throw new Error('Failed to remove from market');
      }
    } catch (error) {
      console.error('Error removing from market:', error);
      if (Platform.OS === 'web') {
        alert('Failed to remove item from market. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to remove item from market. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMarketItem = async () => {
    if (!salePrice.trim() || !city.trim() || !phoneNumber.trim()) {
        const message = 'Please fill in all required fields (Sale Price, City, and Phone Number)';
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Missing Information', message);
        }
        return;
    }
      
    setLoading(true);
    
    try {
    const token = await AsyncStorage.getItem("token")
    const response = await fetch(`${serverBackendURL}/add-for-sale-board`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        token,
        productId,
        salePrice,
        city,
        description,
        phoneNumber, // ADD THIS LINE
      })
    });
      
      if (response.ok) {
        setIsOnMarket(true);
        setModalVisible(false);
        
        if (Platform.OS === 'web') {
          console.log('Successfully added product to the market list!');
        } else {
          Alert.alert('Success', 'Product added to market list successfully!');
        }
      } else {
        throw new Error('Failed to add item to market list');
      }
    } catch (error) {
      console.error('Error submitting market item:', error);
      if (Platform.OS === 'web') {
        alert('Failed to add item to market. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to add item to market. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this warranty? This action cannot be undone.');
      if (confirmed && onDelete) {
        // Cancel the notification before deleting the warranty
        await notificationService.cancelWarrantyNotification(productId);
        onDelete();
      }
    } else {
      Alert.alert(
        'Delete Warranty',
        'Are you sure you want to delete this warranty? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: async () => {
              // Cancel the notification before deleting the warranty
              await notificationService.cancelWarrantyNotification(productId);
              onDelete && onDelete();
            }
          }
        ]
      );
    }
  };

  return (
      <TouchableOpacity
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >

      <View style={[styles.cardContainer, expanded && styles.cardExpanded]}>
        
        {/* Delete button - positioned absolutely in top-right corner */}
        {onDelete && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        )}

        <View style={styles.warrantyItem}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={32}
            color="#000"
            style={styles.icon}
          />
          <View style={styles.warrantyInfo}>
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={styles.itemSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.warrantyProgress}>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons
                name="calendar"
                size={16}
                color="#000"
                style={styles.iconSpacing}
              />
              <Text style={styles.dateText}>{date}</Text>
            </View>
            <Progress.Bar
				progress={progress / 100}
				width={isWeb ? 600 : Dimensions.get('window').width * 0.4}
				color={progressColor}
				unfilledColor="#E8E8E8"
				borderWidth={0}
				height={8}
				style={styles.progressBar}
				/>
            <View style={styles.timeRow}>
              <MaterialCommunityIcons
                name="clock-fast"
                size={16}
                color="#000"
                style={styles.iconSpacing}
              />
              <Text style={styles.timeAgoText}>{timeAgo}</Text>
            </View>
          </View>
        </View>
        {expanded && (
  <View style={styles.expandedContainer}>
    <Text style={styles.expandedText}>{notes}</Text>
    
    {/* Button row for expanded actions */}
    <View style={styles.expandedButtonsContainer}>
      <TouchableOpacity
        style={styles.productInfoButton}
        onPress={handleNavigateToProductInfo}
      >
        <MaterialCommunityIcons
          name="information"
          size={16}
          color="#fff"
          style={styles.buttonIcon}
        />
        <Text style={styles.productInfoButtonText}>Product Info</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.marketListButton,
          isOnMarket ? styles.removeFromMarketButton : styles.addToMarketButton,
          loading && styles.disabledButton
        ]}
        onPress={handleMarketAction}
        disabled={loading}
      >
        <MaterialCommunityIcons
          name={isOnMarket ? "cart-remove" : "cart-plus"}
          size={16}
          color="#fff"
          style={styles.buttonIcon}
        />
        <Text style={[
          styles.marketListButtonText,
          isOnMarket ? styles.removeFromMarketButtonText : styles.addToMarketButtonText
        ]}>
          {loading ? 'Loading...' : (isOnMarket ? 'Remove from market' : 'Add to market')}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
)}

        {/* Modal for entering market item details */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add to Market List</Text>

              <TextInput
                placeholder="Sale Price"
                style={styles.input}
                keyboardType="numeric"
                value={salePrice}
                onChangeText={setSalePrice}
              />
              <TextInput
                placeholder="City"
                style={styles.input}
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                placeholder="Phone Number"
                style={styles.input}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
              <TextInput
                placeholder="Description (optional)"
                style={[styles.input, styles.descriptionInput]}
                value={description}
                onChangeText={setDescription}
                multiline={true}
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.submitButton, loading && styles.disabledButton]} 
                  onPress={handleSubmitMarketItem}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Adding...' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FDFDFD',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardExpanded: {
    // Optionally, add any style changes when expanded.
  },
  // Delete button styles
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#AF6F6F',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  warrantyItem: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  icon: {},
  warrantyInfo: {
    flex: 1,
    marginLeft: 10,
  },
  itemTitle: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'InriaSerif-Regular',
  },
  itemSubtitle: {
    color: '#666',
    marginTop: 5,
    fontFamily: 'InriaSerif-Regular',
  },
  warrantyProgress: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  iconSpacing: {
    marginRight: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'InriaSerif-Regular',
  },
  progressBar: {
    borderRadius: 5,
  },
  timeAgoText: {
    fontSize: 12,
    color: '#7E8FA6',
    fontFamily: 'InriaSerif-Regular',
  },
  expandedContainer: {
    padding: 15,
    backgroundColor: '#FDFDFD',
  },
expandedText: {
  marginBottom: 15, // Changed from 10 to 15
  fontFamily: 'InriaSerif-Regular',
  color: '#000',
},
marketListButton: {
  paddingVertical: 12,
  paddingHorizontal: 15, // Changed from 20 to 15
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1, // Added
  flexDirection: 'row', // Added
},
  addToMarketButton: {
    backgroundColor: '#7E8FA6',
  },
  removeFromMarketButton: {
    backgroundColor: '#AF6F6F',
  },
  disabledButton: {
    opacity: 0.6,
  },
  marketListButtonText: {
    fontFamily: 'InriaSerif-Regular',
    fontSize: 14,
  },
  addToMarketButtonText: {
    color: '#fff',
  },
  removeFromMarketButtonText: {
    color: '#fff',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#F5EFE6',
    borderRadius: 15,
    padding: 15,
    borderColor: '#E8FA6',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'InriaSerif-Bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FDFDFD',
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
    fontFamily: 'InriaSerif-Regular',
    color: '#000',
    borderWidth: 1,
    borderColor: '#7E8FA6',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  submitButton: {
    backgroundColor: '#7E8FA6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5EFE6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7E8FA6',
  },
  submitButtonText: {
    color: '#FDFDFD',
    fontFamily: 'InriaSerif-Regular',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#7E8FA6',
    fontFamily: 'InriaSerif-Regular',
    fontSize: 16,
  },
  expandedButtonsContainer: {
  flexDirection: 'row',
  gap: 10,
},
productInfoButton: {
  backgroundColor: '#7E8FA6',
  paddingVertical: 12,
  paddingHorizontal: 15,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  flexDirection: 'row',
},
productInfoButtonText: {
  color: '#fff',
  fontFamily: 'InriaSerif-Regular',
  fontSize: 14,
},
buttonIcon: {
  marginRight: 5,
},
});

export default WarrantyCard;