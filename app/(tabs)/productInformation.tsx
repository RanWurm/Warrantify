// app/productInformation.tsx
import React ,{useState} from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity, Platform, Dimensions, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter  } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import * as Progress from 'react-native-progress';
import { TextInput } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FlatList, Modal } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as IntentLauncher from 'expo-intent-launcher';

const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

interface ProductFile {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: string;
  downloadUrl: string;
}

const ProductInformation = () => {
  const { productName, model, purchaseDate, expirationDate, price,  serviceCenter, store, productId } = useLocalSearchParams();
  console.log('🔍 Raw route params:', { purchaseDate, expirationDate });

  const router = useRouter();
  const isWeb = Platform.OS === 'web';

//   const [isEditing, setIsEditing] = useState(false);
    const [editedServiceCenter, setEditedServiceCenter] = useState(serviceCenter as string);
    const [editedStore, setEditedStore] = useState(store as string);
    const [editedPrice, setEditedPrice] = useState(price as string);

    const [editingServiceCenter, setEditingServiceCenter] = useState(false);
    const [editingStore, setEditingStore] = useState(false);
    const [editingPrice, setEditingPrice] = useState(false);

    const [isOnMarket, setIsOnMarket] = useState(false);
    
    const [productFiles, setProductFiles] = useState<ProductFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);


    useEffect(() => {
        const checkMarketStatus = async () => {
            try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${serverBackendURL}/check-market-status/${productId}`, {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            setIsOnMarket(data.isOnMarket);
            } catch (error) {
                console.error("❌ Error checking market status:", error);
            }
    };

  checkMarketStatus();
}, []);

// REPLACE your fetchProductFiles function with this debug version:

const fetchProductFiles = async () => {
  console.log('🔍 Starting to fetch files for productId:', productId);
  setIsLoadingFiles(true);
  
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('🔑 Token found:', token ? 'Yes' : 'No');
    
    const url = `${serverBackendURL}/warranty/${productId}/files`;
    console.log('🌐 Fetching from URL:', url);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Parsed response data:', data);
        console.log('📂 Files found:', data.files?.length || 0);
        setProductFiles(data.files || []);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        console.log('📄 Response was:', responseText);
      }
    } else {
      console.error('❌ Failed to fetch files. Status:', response.status);
      console.log('📄 Error response:', responseText);
      
      // If it's a 404, the endpoint doesn't exist yet
      if (response.status === 404) {
        console.log('🚨 The file endpoints are not implemented in your backend yet!');
        Alert.alert(
          'Files Not Available', 
          'The file management endpoints are not implemented in your backend yet. Please add the file management code to your server.js first.'
        );
      }
    }
  } catch (error) {
    console.error('💥 Network error fetching files:', error);
    Alert.alert('Network Error', 'Failed to connect to server. Make sure your backend is running.');
  } finally {
    setIsLoadingFiles(false);
  }
};


const testBackendConnection = async () => {
  try {
    const healthResponse = await fetch(`${serverBackendURL}/health`);
    console.log('❤️ Health check status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthText = await healthResponse.text();
      console.log('❤️ Health response:', healthText);
    }
  } catch (error) {
    console.error('💔 Backend health check failed:', error);
  }
};



// REPLACE your uploadFiles function with this fixed version:

const uploadFiles = async (fileType: 'image' | 'pdf' | 'camera') => {
  console.log('📤 Starting upload process for type:', fileType);
  
  try {
    let result;
    
    if (fileType === 'camera') {
      console.log('📷 Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Camera permission denied');
        Alert.alert('Permission Required', 'Camera permission is required');
        return;
      }
      
      console.log('📷 Launching camera...');
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else if (fileType === 'image') {
      console.log('🖼️ Requesting photo library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Photo library permission denied');
        Alert.alert('Permission Required', 'Photo library permission is required');
        return;
      }
      
      console.log('🖼️ Launching image picker...');
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });
    } else {
      console.log('📄 Launching document picker...');
      result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        allowsMultipleSelection: true,
        copyToCacheDirectory: true,
      });
    }

    console.log('📋 Picker result:', result);

    if (result.canceled || !result.assets) {
      console.log('📋 User canceled or no assets selected');
      return;
    }

    console.log('📁 Selected assets:', result.assets.length);
    result.assets.forEach((asset, index) => {
      console.log(`📄 Asset ${index}:`, {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType,
        size: asset.size
      });
    });

    setIsUploadingFiles(true);
    const token = await AsyncStorage.getItem('token');
    console.log('🔑 Using token for upload:', token ? 'Yes' : 'No');
    
    // Create FormData with proper React Native format
    const formData = new FormData();

    result.assets.forEach((asset, index) => {
      // Use the exact format that React Native expects
      const fileData = {
        uri: asset.uri,
        type: asset.mimeType || (fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        name: asset.name || `${fileType}_${Date.now()}_${index}.${fileType === 'pdf' ? 'pdf' : 'jpg'}`,
      };
      
      console.log(`📎 Adding file ${index} to form data:`, fileData);
      
      // For React Native, we need to append like this:
      formData.append('files', fileData as any);
    });

    const uploadUrl = `${serverBackendURL}/warranty/${productId}/upload-files`;
    console.log('🌐 Uploading to URL:', uploadUrl);

    // Use fetch with proper headers for React Native
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // DON'T set Content-Type for multipart/form-data in React Native
        // Let the browser/React Native set it automatically with boundary
      },
      body: formData,
    });

    console.log('📡 Upload response status:', response.status);
    console.log('📡 Upload response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('📄 Upload response text:', responseText);

    if (response.ok) {
      const responseData = JSON.parse(responseText);
      console.log('✅ Upload successful:', responseData);
      Alert.alert('Success', `${result.assets.length} file(s) uploaded successfully`);
      
      console.log('🔄 Refreshing files list...');
      fetchProductFiles(); // Refresh the files list
    } else {
      console.error('❌ Upload failed with status:', response.status);
      console.error('❌ Upload error response:', responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        Alert.alert('Upload Error', errorData.error || 'Failed to upload files');
      } catch (parseError) {
        Alert.alert('Upload Error', `Failed to upload files. Status: ${response.status}`);
      }
    }
  } catch (error) {
    console.error('💥 Upload error:', error);
    
    // More detailed error logging
    if (error.message.includes('Network request failed')) {
      console.error('🌐 Network error details:', {
        message: error.message,
        serverURL: serverBackendURL,
        productId: productId
      });
      Alert.alert(
        'Network Error', 
        'Failed to connect to server. Please check:\n1. Server is running\n2. Network connection\n3. Server URL is correct'
      );
    } else {
      Alert.alert('Error', 'Failed to upload files: ' + error.message);
    }
  } finally {
    setIsUploadingFiles(false);
    console.log('📤 Upload process completed');
  }
};

// REPLACE your downloadAndViewFile function with this version that OPENS files:

const downloadAndViewFile = async (file: ProductFile) => {
  console.log('📥 Downloading and opening file:', file.originalName);
  
  try {
    const token = await AsyncStorage.getItem('token');
    const downloadUrl = `${serverBackendURL}/warranty/${productId}/download/${file.filename}`;
    
    // Step 1: Download the file to device storage
    const fileUri = FileSystem.documentDirectory + file.originalName;
    console.log('📥 Downloading to:', fileUri);
    
    const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('📥 Download result:', downloadResult);

    if (downloadResult.status === 200) {
      console.log('✅ Download successful, opening with default app');
      
      if (Platform.OS === 'android') {
        // For Android: Use IntentLauncher to open with default app
        try {
          // First, try using IntentLauncher with proper MIME type
          const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
          
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            type: file.mimeType,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          });
          
        } catch (intentError) {
          console.log('❌ IntentLauncher failed, falling back to sharing:', intentError);
          // Fallback to sharing if IntentLauncher fails
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: file.mimeType,
            dialogTitle: `Open ${file.originalName}`,
          });
        }
        
      } else if (Platform.OS === 'ios') {
        // For iOS: Use Sharing with UTI (this should open with default app)
        const uti = getUTIFromMimeType(file.mimeType);
        
        await Sharing.shareAsync(downloadResult.uri, {
          UTI: uti,
          mimeType: file.mimeType,
        });
        
      } else {
        // For other platforms (web, etc.)
        await Sharing.shareAsync(downloadResult.uri);
      }
      
    } else {
      console.error('❌ Download failed with status:', downloadResult.status);
      Alert.alert('Error', `Download failed. Status: ${downloadResult.status}`);
    }
  } catch (error) {
    console.error('💥 Error downloading/opening file:', error);
    Alert.alert('Error', 'Failed to open file: ' + error.message);
  }
};


// NEW FUNCTION TO ADD - Delete file:
const deleteFile = async (file: ProductFile) => {
  Alert.alert(
    'Delete File',
    `Are you sure you want to delete ${file.originalName}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${serverBackendURL}/warranty/${productId}/files/${file.filename}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              Alert.alert('Success', 'File deleted successfully');
              fetchProductFiles(); // Refresh the files list
            } else {
              Alert.alert('Error', 'Failed to delete file');
            }
          } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Failed to delete file');
          }
        },
      },
    ]
  );
};

// NEW FUNCTION TO ADD - Show upload options:
const showUploadOptions = () => {
  Alert.alert(
    'Add Files',
    'Choose file type to upload',
    [
      { text: 'Take Photo', onPress: () => uploadFiles('camera') },
      { text: 'Choose Image', onPress: () => uploadFiles('image') },
      { text: 'Choose PDF', onPress: () => uploadFiles('pdf') },
      { text: 'Cancel', style: 'cancel' },
    ]
  );
};

// ADD THIS TO YOUR useEffect (modify the existing one):
useEffect(() => {
  const checkMarketStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${serverBackendURL}/check-market-status/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setIsOnMarket(data.isOnMarket);
    } catch (error) {
      console.error("❌ Error checking market status:", error);
    }
  };

  checkMarketStatus();
  fetchProductFiles(); // ADD THIS LINE
}, []);

useEffect(() => {
  const checkMarketStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${serverBackendURL}/check-market-status/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setIsOnMarket(data.isOnMarket);
    } catch (error) {
      console.error("❌ Error checking market status:", error);
    }
  };

  // ADD THESE LINES:
  testBackendConnection(); // Test if backend is running
  checkMarketStatus();
  fetchProductFiles(); // This will now show detailed logs
}, []);

const renderFileItem = ({ item }: { item: ProductFile }) => (
  <TouchableOpacity 
    style={styles.fileItem}
    onPress={() => downloadAndViewFile(item)}
  >
    <View style={styles.fileInfo}>
      <MaterialCommunityIcons 
        name={item.mimeType.startsWith('image/') ? 'image-outline' : 'document-outline'}
        size={24} 
        color="#7E8FA6" 
      />
      <View style={styles.fileDetails}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.originalName}
        </Text>
        <Text style={styles.fileSize}>
          {(item.size / 1024).toFixed(1)} KB • {new Date(item.uploadDate).toLocaleDateString()}
        </Text>
      </View>
    </View>
    <TouchableOpacity onPress={() => deleteFile(item)}>
      <MaterialCommunityIcons name="delete" size={20} color="#AF6F6F" />
    </TouchableOpacity>
  </TouchableOpacity>
);


  const handleSaveEdits = async () => {
    console.log("💾 Save button pressed");

    try {
      const token = await AsyncStorage.getItem('token');

      if (!editedPrice || isNaN(Number(editedPrice))) {
        alert("Please enter a valid price.");
        return;
      }

      console.log('📦 Updating productId:', productId);
      console.log("🔗 Calling URL:", `${serverBackendURL}/update-warranty/${productId}`);

      const response = await axios.put(`${serverBackendURL}/update-warranty/${productId}`, {
        serviceCenter: editedServiceCenter,
        store: editedStore,
        price: editedPrice,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        alert('Warranty updated successfully!');
        setEditingServiceCenter(false);
        setEditingStore(false);
        setEditingPrice(false);

        // Update the local state with the new values
        router.replace({
          pathname: '/productInformation',
          params: {
            productId,
            productName,
            model,
            purchaseDate,
            expirationDate,
            price: editedPrice,
            serviceCenter: editedServiceCenter,
            store: editedStore,
          }
        });
      } else {
        throw new Error('Failed to update warranty');
      }
    } catch (err) {
      console.error('Failed to update warranty:', err);
      alert('Failed to save changes. Please try again.');
    }
  };

  const getTimeUntilExpiration = () => {
    const expiration = new Date(expirationDate as string).getTime();
    const now = new Date();
    const diff = now.getTime() - new Date(expiration).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';

    if(days < 0) {
        if (Math.abs(days) < 30) return `In ${Math.abs(days)} days`;
        if (Math.abs(days) < 365) return `In ${Math.floor(Math.abs(days) / 30)} months`;
        if(Math.floor(Math.abs(days) / 365) == 1) return `In ${Math.floor(Math.abs(days) / 365)} year`;
        return `In ${Math.floor(Math.abs(days) / 365)} years`;
    }
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    if(Math.floor(days / 365) == 1) return `One ${Math.floor(Math.abs(days) / 365)} year ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

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

  const toISODate = (dateStr: string) => {
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const getIconName = (productName: string): string => {
    const productMap: { [key: string]: string } = {
    monitor: 'monitor',
    tablet: 'tablet',
    coffemachine: 'coffee',
    headphones: 'headphones',
    earphones: 'headphones',
    ipad: 'tablet',
    laptop: 'laptop',
    iphone: 'cellphone',
    android: 'cellphone',
    charger: 'power-plug',
    vacuum: 'robot-vacuum',
    television: 'television-classic',
    hairdryer: 'hair-dryer',
    microwave: 'microwave',
    oven: 'stove',
    toaster: 'toaster',
    blender: 'blender',
    kettle: 'kettle',
    fridge: 'fridge-outline',
    freezer: 'snowflake',
    dishwasher: 'dishwasher',
    washingmachine: 'washing-machine',
    dryer: 'tumble-dryer',
    fan: 'fan',
    airconditioner: 'air-conditioner',
    airpurifier: 'air-filter',
    printer: 'printer',
    scanner: 'scanner',
    router: 'router-wireless',
    smartwatch: 'watch-variant',
    camera: 'camera',
    drone: 'drone',
    speaker: 'speaker',
    soundbar: 'soundbar',
    projector: 'projector',
    lightbulb: 'lightbulb',
    electricshaver: 'razor-electric',
    straightener: 'hair-straightener',
    iron: 'iron',
    heater: 'radiator',
    powerbank: 'battery-charging',
    ups: 'battery-high',
    smartwatchcharger: 'watch-variant',
    stylus: 'pen',
    gameconsole: 'gamepad-variant',
    controller: 'controller',
    electricbike: 'bike-electric',
    scooter: 'scooter-electric',
    treadmill: 'treadmill',
    humidifier: 'air-humidifier',
    dehumidifier: 'air-humidifier-off'
  };
    
    const normalized = productName.toLowerCase().replace(/\s+/g, '');

     //  Fuzzy alias checks (before strict productMap match)
    if (normalized.includes('refrigerator') || normalized.includes('fridge')) return 'fridge-outline';
    if (normalized.includes('television') || normalized.includes('tv')) return 'television-classic';
    if (normalized.includes('macbook') || normalized.includes('mac') || normalized.includes('applelaptop')) return 'laptop';
    if (normalized.includes('ice') && normalized.includes('maker')) return 'snowflake';
    if (normalized.includes('coffee') || normalized.includes('coffe')) return 'coffee';
    if (normalized.includes('playstation') || normalized.includes('ps5') || normalized.includes('ps4') || normalized.includes('ps')) return 'gamepad-variant';
    if (normalized.includes('airpods') || normalized.includes('pods')) return 'headphones';
    if (normalized.includes('smarttv') || normalized.includes('androidtv')) return 'television-classic';
    if (normalized.includes('smartwatch') || normalized.includes('fitbit') || normalized.includes('watch')) return 'watch-variant';
    if (normalized.includes('earbuds') || normalized.includes('in-ear')) return 'headphones';
    if (normalized.includes('soundbar')) return 'soundbar';
    if (normalized.includes('xbox')) return 'controller';
    if (normalized.includes('switch')) return 'gamepad-variant';

    if (productMap[normalized]) return productMap[normalized];
  
    const key = Object.keys(productMap).find(k =>
        productName.toLowerCase().includes(k.toLowerCase())
    );
    return key ? productMap[key] : 'package-variant-closed';

  };

const parsedPurchaseDate = new Date(purchaseDate as string); 

const parsedExpirationDate = expirationDate?.includes('/')
  ? new Date(toISODate(expirationDate as string))
  : new Date(expirationDate as string);
  
console.log('🔍 Updated route params:', { parsedPurchaseDate, parsedExpirationDate });

const isValidDate = (date: Date) => !isNaN(date.getTime());

console.log(isValidDate);


const progress = isValidDate(parsedPurchaseDate) && isValidDate(parsedExpirationDate)
  ? calculateProgress(parsedPurchaseDate, parsedExpirationDate)
  : 0;

  let progressColor = '#7E8FA6';

    if (progress >= 75) {
        progressColor = '#AF6F6F';
    } else if (progress >= 40) {
        progressColor = '#FDCB6E';
    } else {
        progressColor = '#B3D2A1';
    }

  return (

    <SafeAreaView style={{ flex: 1, backgroundColor:'#E9E0D4' }}>
        <ScrollView 
            contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 20 : 120 }}
            keyboardShouldPersistTaps="handled" 
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            scrollEventThrottle={16}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                    <Text style={styles.title}>Product Information</Text>

                    <View style={styles.iconBadge}>
                            <MaterialCommunityIcons name={getIconName(productName as string)} size={18} color="#333" />
                            <Text style={styles.iconBadgeText}>Warranty Item</Text>
                    </View>

                    <View style={styles.productBox}>

                        <View style={styles.productInnerBox}>
                            <Text style={styles.productName}>{productName}</Text>
                            <Text style={styles.productModel}>{model}</Text>

                                <View style={styles.progressContainer}>
                                <View style={styles.timeRow}>
                                    <MaterialCommunityIcons
                                            name="clock-fast"
                                            size={22}
                                            color="#000"
                                            style={styles.iconSpacing}
                                    />
                                    <Text style={styles.inLabel}>{getTimeUntilExpiration()}</Text>
                                </View>

                                
                                <Progress.Bar
                                                progress={progress / 100}
                                                width={isWeb ? 600 : Dimensions.get('window').width * 0.75}
                                                color={progressColor}
                                                unfilledColor="#E8E8E8"
                                                borderWidth={0}
                                                height={8}
                                                style={styles.progressBar}
                                />


                                <View style={styles.dateRow}>
                                    <View style={styles.dateBlockLeft}>
                                        <MaterialCommunityIcons name="calendar" size={20} color="#7F8FA6" />
                                        <View style={styles.dateTextGroup}>
                                        <Text style={[styles.dateText, { color: '#7F8FA6' }]}>Purchase</Text>
                                        <Text style={[styles.dateValue, { color: '#7F8FA6' }]}>
                                            {new Date(purchaseDate as string).toLocaleDateString('en-GB')}
                                        </Text>
                                        </View>
                                    </View>

                                    <View style={styles.dateBlockRight}>
                                        <MaterialCommunityIcons name="calendar-check" size={20} color="green" />
                                        <View style={styles.dateTextGroup}>
                                        <Text style={[styles.dateText, { color: 'green' }]}>Expiration</Text>
                                        <Text style={[styles.dateValue, { color: 'green' }]}>
                                            {new Date(expirationDate as string).toLocaleDateString('en-GB')}
                                        </Text>
                                        </View>
                                    </View>
                                    
                                </View>
                            </View>

                            <Text style={styles.progressLabel}>{Math.round(progress)}% of the warranty used</Text>
                        </View>
                    </View>

                    <View style={styles.infoBox}>

                        <Text style={styles.sectionLabel}>Service centers:</Text>
                        <View style={styles.infoLine}>
                            {!editingServiceCenter && (
                                <TouchableOpacity
                                onPress={() => setEditingServiceCenter(true)}
                                style={styles.editToggleButton}
                                >
                                <MaterialCommunityIcons name="pencil" size={20} color="#333" />
                                </TouchableOpacity>
                            )}

                            {editingServiceCenter && (
                                <TouchableOpacity
                                onPress={handleSaveEdits}
                                style={styles.editToggleButton}
                                >
                                <MaterialCommunityIcons name="content-save" size={20} color="green" />
                                </TouchableOpacity>
                            )}

                            <View style={styles.rowItem}>
                                <MaterialCommunityIcons name="tools" size={28} />
                                {editingServiceCenter ? (
                                <TextInput
                                    value={editedServiceCenter}
                                    onChangeText={setEditedServiceCenter}
                                    style={styles.editableTextInput}
                                />
                                ) : (
                                <Text style={styles.rowText}>{editedServiceCenter}</Text>
                                )}
                            </View>
                        </View>

                        <Text style={styles.sectionLabel}>Store:</Text>
                        <View style={styles.infoLine}>
                            {!editingStore && (
                            <TouchableOpacity
                                onPress={() => setEditingStore(true)}
                                style={styles.editToggleButton}>
                                <MaterialCommunityIcons name="pencil" size={20} color="#333" />
                            </TouchableOpacity>
                            )}

                            {editingStore && (
                            <TouchableOpacity
                                onPress={handleSaveEdits}
                                style={styles.editToggleButton}>
                                <MaterialCommunityIcons name="content-save" size={20} color="green" />
                            </TouchableOpacity>
                            )}

                            <View style={styles.rowItem}>
                                <MaterialCommunityIcons name="store" size={28} />
                                {editingStore ? (
                                <TextInput
                                    value={editedStore}
                                    onChangeText={setEditedStore}
                                    style={styles.editableTextInput}
                                />
                                ) : (
                                <Text style={styles.rowText}>{editedStore}</Text>
                                )}
                            </View>
                        </View>

                        <Text style={styles.sectionLabel}>Price:</Text>
                        <View style={styles.infoLine}>
                            {!editingPrice && (
                                <TouchableOpacity
                                onPress={() => setEditingPrice(true)}
                                style={styles.editToggleButton}
                                >
                                <MaterialCommunityIcons name="pencil" size={20} color="#333" />
                                </TouchableOpacity>
                            )}

                            {editingPrice && (
                                <TouchableOpacity
                                onPress={handleSaveEdits}
                                style={styles.editToggleButton}
                                >
                                <MaterialCommunityIcons name="content-save" size={20} color="green" />
                                </TouchableOpacity>
                            )}

                            <View style={styles.rowItem}>
                                <MaterialCommunityIcons name="cash" size={28} />
                                {editingPrice ? (
                                <TextInput
                                    value={editedPrice}
                                    onChangeText={setEditedPrice}
                                    keyboardType="numeric"
                                    style={styles.editableTextInput}
                                />
                                ) : (
                                <Text style={styles.rowText}>{editedPrice} ₪</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.actionBox}>

                          <View style={styles.actionButtonsColumn}>          
                            <TouchableOpacity 
                                style={styles.actionBtn}
                                onPress={() => uploadFiles('image')}
                                disabled={isUploadingFiles}
                            >
                                <MaterialCommunityIcons name="image-plus" size={20} color="black" />
                                <Text style={styles.actionText}>Add Image</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.actionBtn}
                                onPress={() => uploadFiles('pdf')}
                                disabled={isUploadingFiles}
                            >
                                <MaterialCommunityIcons name="file-pdf-box" size={20} color="black" />
                                <Text style={styles.actionText}>Add PDF</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                    style={styles.actionBtn}
                                    onPress={showUploadOptions}
                                    disabled={isUploadingFiles}
                                >
                                    <MaterialCommunityIcons name="plus-circle" size={20} color="black" />
                                    <Text style={styles.actionText}>
                                        {isUploadingFiles ? 'Uploading...' : 'Add Files'}
                                    </Text>
                            </TouchableOpacity>

                          </View>

                           {productFiles.length > 0 && (
                                <TouchableOpacity
                                    style={[styles.inlineDeleteBtn, isOnMarket && { backgroundColor: 'gray' }]}
                                    onPress={() => {
                                    if (isOnMarket) {
                                        Alert.alert('Cannot Delete', 'This product is listed in the marketplace.');
                                        return;
                                    }
                                    Alert.alert(
                                        'Delete Warranty',
                                        'Are you sure you want to delete this warranty?',
                                        [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Delete',
                                            style: 'destructive',
                                            onPress: async () => {
                                            try {
                                                const token = await AsyncStorage.getItem('token');
                                                await axios.delete(`${serverBackendURL}/delete-warranty/${productId}`, {
                                                headers: { Authorization: `Bearer ${token}` },
                                                });
                                                alert('Warranty deleted successfully!');
                                                router.replace('/myWarranties');
                                            } catch (err) {
                                                console.error('❌ Failed to delete:', err);
                                                alert('Failed to delete warranty.');
                                            }
                                            },
                                        },
                                        ]
                                    );
                                    }}
                                >
                                    <Text style={styles.inlineDeleteBtnText}>
                                    {isOnMarket ? 'Listed in Marketplace' : 'Delete Warranty'}
                                    </Text>
                                </TouchableOpacity>   
                           )}
                        </View>

                        <View style={productFiles.length > 0 ? styles.filesSection : styles.filesSectionNofiles}>
                                <View style={styles.filesSectionHeader}>
                                    <Text style={styles.sectionLabel}>
                                        Attached Files ({productFiles.length})
                                    </Text>
                                    {productFiles.length > 0 && (
                                        <TouchableOpacity onPress={() => setShowFileModal(true)}>
                                            <MaterialCommunityIcons name="eye" size={20} color="#7E8FA6" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                
                                {isLoadingFiles ? (
                                    <Text style={styles.loadingText}>Loading files...</Text>
                                ) : productFiles.length > 0 ? (
                                    <View style={styles.filesPreview}>
                                        {productFiles.slice(0, 2).map((file) => (
                                            <TouchableOpacity 
                                                key={file._id}
                                                style={styles.filePreviewItem}
                                                onPress={() => downloadAndViewFile(file)}
                                            >
                                                <MaterialCommunityIcons 
                                                    name={file.mimeType.startsWith('image/') ? 'image' : 'file-pdf-box'}
                                                    size={16} 
                                                    color="#7E8FA6" 
                                                />
                                                <Text style={styles.filePreviewName} numberOfLines={1}>
                                                    {file.originalName}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                        {productFiles.length > 2 && (
                                            <TouchableOpacity 
                                                style={styles.moreFilesButton}
                                                onPress={() => setShowFileModal(true)}
                                            >
                                                <Text style={styles.moreFilesText}>
                                                    +{productFiles.length - 2} more
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : (
                                    <Text style={styles.noFilesText}>No files attached</Text>
                                )}

                        
                        </View>
                         
                         {productFiles.length == 0 && (           
                            <TouchableOpacity
                                style={[styles.deleteBtn, isOnMarket && { backgroundColor: 'gray' }]}
                                onPress={() => {
                                    if (isOnMarket) {
                                    Alert.alert('Cannot Delete', 'This product is listed in the marketplace.');
                                    return;
                                    }

                                    Alert.alert(
                                    'Delete Warranty',
                                    'Are you sure you want to delete this warranty?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: async () => {
                                            try {
                                            const token = await AsyncStorage.getItem('token');
                                            await axios.delete(`${serverBackendURL}/delete-warranty/${productId}`, {
                                                headers: { Authorization: `Bearer ${token}` },
                                            });
                                            alert('Warranty deleted successfully!');
                                            router.replace('/myWarranties');
                                            } catch (err) {
                                            console.error('❌ Failed to delete:', err);
                                            alert('Failed to delete warranty.');
                                            }
                                        },
                                        },
                                    ]
                                    );
                                }}
                                >
                                <Text style={styles.deleteBtnText}>
                                    {isOnMarket ? 'Listed in Marketplace' : 'Delete Warranty'}
                                </Text>
                            </TouchableOpacity>
                         )}

                    </View>
                </View>
            </TouchableWithoutFeedback>
        </ScrollView>

        {!isWeb ? (
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNavWrapper}>
          <BottomNavBar />
        </View>
      </View>
    ) : null}
    <Modal
                        visible={showFileModal}
                        animationType="slide"
                        presentationStyle="pageSheet"
                    >
                        <SafeAreaView style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Attached Files</Text>
                                <TouchableOpacity onPress={() => setShowFileModal(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>
                            
                            <FlatList
                                data={productFiles}
                                renderItem={renderFileItem}
                                keyExtractor={(item) => item._id}
                                style={styles.filesList}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <Text style={styles.emptyListText}>No files attached</Text>
                                }
                            />
                            
                            <View style={styles.modalActions}>
                                <TouchableOpacity 
                                    style={styles.modalActionButton}
                                    onPress={showUploadOptions}
                                >
                                    <MaterialCommunityIcons name="plus" size={20} color="white" />
                                    <Text style={styles.modalActionText}>Add Files</Text>
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                   </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: '#E9E0D4',
    padding: Platform.OS === 'android' ? 12 : 16,
    paddingTop: Platform.OS === 'android' ? 15 : 0,
  },
  title: {
    fontSize: Platform.OS === 'android' ? 22 : 24,
    textAlign: 'center',
    marginTop: Platform.OS === 'android' ? 15 : 15,
    marginBottom: Platform.OS === 'android' ? 10 : 15,
    fontFamily: 'InriaSerif-Bold',
  },
  productBox: {
    backgroundColor: '#F5EFE6',
    padding: Platform.OS === 'android' ? 12 : 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  productInnerBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    width: Platform.OS === 'android' ? '105%': '95%',
    paddingVertical: Platform.OS === 'android' ? 15 : 20,
  },
  productName: {
    fontSize: Platform.OS === 'android' ? 20 : 22,
    marginTop: Platform.OS === 'android' ? 15 : 20,
    fontFamily: 'InriaSerif-Bold',
  },
  productModel: {
    fontSize: Platform.OS === 'android' ? 14 : 16,
    fontFamily: 'InriaSerif-Regular',
    marginBottom: Platform.OS === 'android' ? 5 : 0,
  },
  inLabel: {
    marginVertical: Platform.OS === 'android' ? 4 : 6,
    color: '#444',
    marginBottom: 0,
    fontFamily: 'InriaSerif-Regular',
    fontSize: Platform.OS === 'android' ? 14 : 16,
  },
  progressContainer: {
    width: '100%',
    marginTop: Platform.OS === 'android' ? 8 : 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  progressBar: {
    height: Platform.OS === 'android' ? 8 : 10,
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: Platform.OS === 'android' ? 13 : 15,
    marginTop: Platform.OS === 'android' ? 4 : 6,
    marginBottom: Platform.OS === 'android' ? 4 : 6,
    color: '#333',
    fontFamily: 'InriaSerif-Regular',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: Platform.OS === 'android' ? 8 : 10,
  },

  dateBlockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    gap: Platform.OS === 'android' ? 4 : 6,
  },

  dateBlockRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: Platform.OS === 'android' ? 4 : 6,
  },

  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.OS === 'android' ? 6 : 8,
  },

  dateTextGroup: {
    flexDirection: 'column',
    justifyContent: 'center',
  },

  dateText: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    fontFamily: 'InriaSerif-Bold',
  },

  dateValue: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    fontFamily: 'InriaSerif-Bold',
  },

  infoBox: {
    padding: Platform.OS === 'android' ? 12 : 16,
    borderRadius: 12,
    paddingTop: 0,
    paddingBottom: 0,
  },

  infoLine: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: "2%",
    height: Platform.OS === 'android' ? 50 : 55,
    width: Platform.OS === 'android' ? '105%': '95%',
    marginLeft: Platform.OS === 'android' ? '-1%':'3%',
  },

  sectionLabel: {
    marginTop: Platform.OS === 'android' ? 6 : 8,
    fontFamily: 'InriaSerif-Bold',
    fontSize: Platform.OS === 'android' ? 16 : 18,
    marginLeft: '4%',
  },

  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Platform.OS === 'android' ? 2 : 4,
    marginLeft: '2%',
    marginTop: Platform.OS === 'android' ? 10 : 15,
  },

  rowText: {
    marginLeft: 8,
    fontSize: Platform.OS === 'android' ? 16 : 18,
    fontFamily: 'InriaSerif-Regular',
    width: '30%',
  },

  actionBox: {
    flexDirection: 'column',
    // justifyContent: 'space-around',
    marginTop: Platform.OS === 'android' ? 15 : 20,
  },
  actionButtonsColumn: {
  flexDirection: 'row',
  gap: 8,
},

  actionBtn: {
    alignItems: 'center',
  },

  actionText: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    marginTop: 4,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 3 : 5,
  },

  iconSpacing: {
    marginRight: 5,
  },

  iconBadge: {
    position: 'absolute',
    top: Platform.OS === 'android' ? "9%": "13%",
    left: Platform.OS === 'android' ? "30%": "30%",
    backgroundColor: '#D1BB9E',
    borderRadius: 50,
    padding: Platform.OS === 'android' ? 10 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: Platform.OS === 'android' ? '45%':'40%',
  },

  iconBadgeText: {
    color: '#333',
    marginLeft: 5,
    fontSize: Platform.OS === 'android' ? 13 : 15,
    fontFamily: 'InriaSerif-Regular',
  },

  editIcon: {
    position: 'absolute',
    left: "90%",
    top: '70%',
    zIndex: 2,
  },

  editableTextInput: {
    fontSize: Platform.OS === 'android' ? 16 : 18,
    fontFamily: 'InriaSerif-Regular',
    marginLeft: 8,
    borderBottomWidth: 1,
    borderColor: '#888',
    padding: 2,
    flex: 1,
    textAlign: 'left',  
  },

  editToggleButton: {
    position: 'absolute',
    right: 15,
    top: Platform.OS === 'android' ? 15 : 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 999,             
  },

  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E9E0D4',
    height: Platform.OS === 'android' ? 75 : 70,
  },

  bottomNavWrapper: {
    position: 'absolute',
    top: Platform.OS === 'android' ? -15 : 0,
    left: 0,
    right: 0,
  },

  deleteBtn: {
    backgroundColor: '#AF6F6F',
    padding: Platform.OS === 'android' ? 10 : 12,
    marginTop: Platform.OS === 'android' ? 15 : 0,
    borderRadius: 12,
    alignItems: 'center',
    width: '94%',
    alignSelf: 'center',
  },

  deleteBtnText: {
    color: '#fff',
    fontSize: Platform.OS === 'android' ? 14 : 16,
    fontFamily: 'InriaSerif-Bold',
  },

  inlineDeleteBtn: {
  backgroundColor: '#AF6F6F',
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 8,
  marginTop: 12,
  alignSelf: 'flex-start', // makes it left-aligned within the flex row
  marginLeft: Platform.OS === 'android' ? 0 : '8%',

},

inlineDeleteBtnText: {
  color: '#fff',
  fontSize: 13,
  fontFamily: 'InriaSerif-Bold',
},

  filesSection: {
    marginTop: Platform.OS === 'android' ? 15 : -95,
    marginBottom: Platform.OS === 'android' ? 10 : 25,
    marginLeft: Platform.OS === 'android' ? 0 : 175,
  },
  filesSectionNofiles: {
    marginTop: Platform.OS === 'android' ? 15 : -50,
    marginBottom: Platform.OS === 'android' ? 10 : 15,
    marginLeft: Platform.OS === 'android' ? 0 : 180,
  },
  filesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: '4%',
    marginBottom: 8,
  },
  filesPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginLeft: Platform.OS === 'android' ? '-1%' : '3%',
    width: Platform.OS === 'android' ? '105%' : '95%',
  },
  filePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filePreviewName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  moreFilesButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  moreFilesText: {
    color: '#7E8FA6',
    fontSize: 12,
    fontStyle: 'italic',
  },
  noFilesText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: '4%',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginLeft: '4%',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#E9E0D4',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'InriaSerif-Bold',
  },
  filesList: {
    flex: 1,
    padding: 16,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'InriaSerif-Bold',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 50,
    fontStyle: 'italic',
  },
  modalActions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  modalActionButton: {
    backgroundColor: '#7E8FA6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  modalActionText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'InriaSerif-Bold',
    marginLeft: 8,
  },
});

export default ProductInformation;