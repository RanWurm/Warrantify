// components/AddWarrantyForm.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import notificationService from '../../services/notificationService';

const serverBackendURL = Constants.expoConfig?.extra?.SERVER_BACKEND_URL || '';

interface AddWarrantyFormProps {
  onClose: () => void;
  scannedData?: {
    productName?: string;
    purchaseDate?: string;
    expirationDate?: string;
  };
}

interface UploadedFile {
  name: string;
  type: string;
  size?: number;
  uri: string;
}

interface DocumentPickerAsset {
  name: string;
  mimeType: string;
  size: number;
  uri: string;
}

interface ImagePickerAsset {
  fileName: string;
  fileSize: number;
  uri: string;
}

const isWeb = Platform.OS === 'web';

const AddWarrantyForm: React.FC<AddWarrantyFormProps> = ({ onClose, scannedData }) => {
  const [formData, setFormData] = useState({
    productName: '',
    serviceCenter: '',
    manufacturer: '',
    store: '',
    model: '',
    price: '',
    purchaseDate: '',
    expirationDate: '',
    notes: '',
  });

  // Date picker states
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [createdWarrantyId, setCreatedWarrantyId] = useState<string | null>(null);
  const [showFileUploadOption, setShowFileUploadOption] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  
  useEffect(() => {
    if (scannedData) {
      console.log("AddWarrantyForm: Populating form with scannedData:", scannedData);
      setFormData({
        productName: scannedData.productName || '',
        serviceCenter: scannedData.serviceCenter || '',
        manufacturer: scannedData.manufacturer || '',
        store: scannedData.store || '',
        model: scannedData.model || '',
        price: scannedData.price || '',
        purchaseDate: scannedData.purchaseDate || '',
        expirationDate: scannedData.expirationDate || '',
        notes: scannedData.notes || '',
      });

      // Parse dates if they exist in scannedData
      if (scannedData.purchaseDate) {
        const parsedPurchaseDate = new Date(scannedData.purchaseDate);
        if (!isNaN(parsedPurchaseDate.getTime())) {
          setPurchaseDate(parsedPurchaseDate);
        }
      }
      if (scannedData.expirationDate) {
        const parsedExpirationDate = new Date(scannedData.expirationDate);
        if (!isNaN(parsedExpirationDate.getTime())) {
          setExpirationDate(parsedExpirationDate);
        }
      }
    }
  }, [scannedData]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };

  const onPurchaseDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || purchaseDate;
    setShowPurchaseDatePicker(false);
    setPurchaseDate(currentDate);
    setFormData({ ...formData, purchaseDate: formatDate(currentDate) });
  };

  const onExpirationDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || expirationDate;
    setShowExpirationDatePicker(false);
    setExpirationDate(currentDate);
    setFormData({ ...formData, expirationDate: formatDate(currentDate) });
  };

  const showPurchaseDatePickerModal = () => {
    setShowPurchaseDatePicker(true);
  };

  const showExpirationDatePickerModal = () => {
    setShowExpirationDatePicker(true);
  };

  const validateDate = (date: string) => {
    // Example: always return true for now.
    return true;
  };
  
  const pickDocumentFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0] as DocumentPickerAsset;
      const newFile: UploadedFile = {
        name: file.name || 'Unknown file',
        type: file.mimeType || 'application/octet-stream',
        size: file.size,
        uri: file.uri,
      };

      setSelectedFiles(prev => [...prev, newFile]);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImageFiles = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (result.canceled) {
        return;
      }

      const newFiles: UploadedFile[] = result.assets.map(asset => ({
        name: (asset as ImagePickerAsset).fileName || 'Unknown image',
        type: 'image/jpeg',
        size: (asset as ImagePickerAsset).fileSize,
        uri: asset.uri,
      }));

      setSelectedFiles(prev => [...prev, ...newFiles]);
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const showReceiptOptions = () => {
    Alert.alert(
      'Add Receipt',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: pickImageFiles },
        { text: 'Choose from Gallery', onPress: pickImageFiles },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  
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
      // You'll need to call your refresh function here
      // fetchProductFiles(); 
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
  
  const uploadFilesToWarranty = async (warrantyId: string) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();

      selectedFiles.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any);
      });

      const response = await fetch(`${serverBackendURL}/warranty/${warrantyId}/upload-files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Files uploaded successfully:', result);
        Alert.alert('Success', `${selectedFiles.length} file(s) uploaded successfully`);
        setSelectedFiles([]); // Clear selected files after successful upload
      } else {
        const errorData = await response.json();
        console.error('Upload error:', errorData);
        Alert.alert('Upload Error', errorData.error || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const renderFileItem = ({ item, index }: { item: UploadedFile; index: number }) => (
    <View style={styles.fileItem}>
      <View style={styles.fileInfo}>
        <Ionicons 
          name={item.type.startsWith('image/') ? 'image-outline' : 'document-outline'} 
          size={20} 
          color="#555" 
        />
        <Text style={styles.fileName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.size && (
          <Text style={styles.fileSize}>
            {(item.size / 1024).toFixed(1)} KB
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => removeFile(index)}>
        <Ionicons name="close-circle" size={24} color="#AF6F6F" />
      </TouchableOpacity>
    </View>
  );

  const handleAddWarranty = async () => {
    console.log("AddWarrantyForm: handleAddWarranty called with formData:", formData);

    if (!validateDate(formData.purchaseDate) || !validateDate(formData.expirationDate)) {
      Alert.alert(
        'Invalid Date Format',
        'Please enter dates in YYYY-MM-DD format.'
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
  
      const response = await fetch(`${serverBackendURL}/add-warranty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        const warrantyId = result.warranty._id;
        
        // Schedule notification for warranty expiration
        await notificationService.scheduleWarrantyExpirationNotification(
          warrantyId,
          formData.productName,
          new Date(formData.expirationDate)
        );
        
        // Store the warranty ID for potential file uploads
        setCreatedWarrantyId(warrantyId);
        
        // Show file upload option dialog
        Alert.alert(
          'Warranty Created Successfully!',
          'Would you like to add files (receipts, photos, PDFs) to this warranty?',
          [
            {
              text: 'Skip',
              style: 'cancel',
              onPress: () => onClose(),
            },
            {
              text: 'Add Files',
              onPress: () => setShowFileUploadOption(true),
            },
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const uploadFilesToCreatedWarranty = async (fileType: 'image' | 'pdf' | 'camera') => {
    if (!createdWarrantyId) {
      Alert.alert('Error', 'No warranty found to upload files to');
      return;
    }

    console.log('📤 Starting upload process for type:', fileType);
    
    try {
      let result;
      
      if (fileType === 'camera') {
        console.log('📷 Requesting camera permissions...');
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required');
          return;
        }
        
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
          Alert.alert('Permission Required', 'Photo library permission is required');
          return;
        }
        
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

      if (result.canceled || !result.assets) {
        console.log('📋 User canceled or no assets selected');
        return;
      }

      setIsUploadingFiles(true);
      const token = await AsyncStorage.getItem('token');
      
      // Create FormData
      const formData = new FormData();
      result.assets.forEach((asset, index) => {
        const fileData = {
          uri: asset.uri,
          type: asset.mimeType || (fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'),
          name: asset.name || `${fileType}_${Date.now()}_${index}.${fileType === 'pdf' ? 'pdf' : 'jpg'}`,
        };
        formData.append('files', fileData as any);
      });

      const uploadUrl = `${serverBackendURL}/warranty/${createdWarrantyId}/upload-files`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert(
          'Files Uploaded Successfully!',
          `${result.assets.length} file(s) uploaded to your warranty.`,
          [
            {
              text: 'Add More Files',
              onPress: () => showPostWarrantyUploadOptions(),
            },
            {
              text: 'Done',
              onPress: () => {
                setShowFileUploadOption(false);
                onClose();
              },
            },
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Upload Error', errorData.error || 'Failed to upload files');
      }
    } catch (error) {
      console.error('💥 Upload error:', error);
      Alert.alert('Error', 'Failed to upload files: ' + error.message);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Show upload options for the created warranty
  const showPostWarrantyUploadOptions = () => {
    Alert.alert(
      'Add Files to Warranty',
      'Choose file type to upload',
      [
        { text: 'Take Photo', onPress: () => uploadFilesToCreatedWarranty('camera') },
        { text: 'Choose Image', onPress: () => uploadFilesToCreatedWarranty('image') },
        { text: 'Choose PDF', onPress: () => uploadFilesToCreatedWarranty('pdf') },
        { 
          text: 'Done', 
          style: 'cancel',
          onPress: () => {
            setShowFileUploadOption(false);
            onClose();
          }
        },
      ]
    );
  };
  
  return (
    <KeyboardAvoidingView style={styles.formOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={40} >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.formOverlay}>
                <View style={styles.formContainer}>
                    <View style={styles.header} >
                    <Ionicons
                        name="close"
                        size={24}
                        color="#555"
                        onPress={() => { console.log("AddWarrantyForm: Close icon pressed"); onClose(); }}
                        style={{ position: 'absolute', left: 10 }}
                    />
                    <Text style={styles.headerTitle}>Add a Warranty</Text>
                    </View>

                    <View style={styles.imageContainer}>
                    <Image
                        source={require('../../assets/images/warranty-placeholder.png')}
                        style={styles.image}
                    />
                    </View>

                    <ScrollView style={styles.inputContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                    <View style={styles.row}>
                        <TextInput
                        style={styles.input}
                        placeholder="Product Name"
                        placeholderTextColor="black"
                        value={formData.productName}
                        onChangeText={(text) => setFormData({ ...formData, productName: text })}
                        />
                        <TextInput
                        style={styles.input}
                        placeholder="Service Center"
                        placeholderTextColor="black"
                        value={formData.serviceCenter}
                        onChangeText={(text) => setFormData({ ...formData, serviceCenter: text })}
                        />
                    </View>

                    <View style={styles.row}>
                        <TextInput
                        style={styles.input}
                        placeholder="Manufacturer"
                        placeholderTextColor="black"
                        value={formData.manufacturer}
                        onChangeText={(text) => setFormData({ ...formData, manufacturer: text })}
                        />
                        <TextInput
                        style={styles.input}
                        placeholder="Store"
                        placeholderTextColor="black"
                        value={formData.store}
                        onChangeText={(text) => setFormData({ ...formData, store: text })}
                        />
                    </View>

                    <View style={styles.row}>
                        <TextInput
                        style={styles.input}
                        placeholder="Model"
                        placeholderTextColor="black"
                        value={formData.model}
                        onChangeText={(text) => setFormData({ ...formData, model: text })}
                        />
                        <TextInput
                        style={styles.input}
                        placeholder="Price"
                        placeholderTextColor="black"
                        value={formData.price}
                        onChangeText={(text) => setFormData({ ...formData, price: text })}
                        keyboardType="numeric"
                        />
                    </View>

                    {/* Date Fields with Pop-up Calendars */}
                    <View style={styles.row}>
                        <TouchableOpacity 
                        style={styles.dateInput} 
                        onPress={showPurchaseDatePickerModal}
                        >
                        <Text style={styles.dateInputText}>
                            {formData.purchaseDate || 'Purchase Date'}
                        </Text>
                        <Ionicons name="calendar-outline" size={16} color="#555" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                        style={styles.dateInput} 
                        onPress={showExpirationDatePickerModal}
                        >
                        <Text style={styles.dateInputText}>
                            {formData.expirationDate || 'Expiration Date'}
                        </Text>
                        <Ionicons name="calendar-outline" size={16} color="#555" />
                        </TouchableOpacity>
                    </View>

                    {/* Pop-up Date Pickers */}
                    {showPurchaseDatePicker && (
                        <DateTimePicker
                        testID="purchaseDateTimePicker"
                        value={purchaseDate}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        onChange={onPurchaseDateChange}
                        />
                    )}

                    {showExpirationDatePicker && (
                        <DateTimePicker
                        testID="expirationDateTimePicker"
                        value={expirationDate}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        onChange={onExpirationDateChange}
                        />
                    )}
                     {selectedFiles.length > 0 && (
                        <View style={styles.filesContainer}>
                        <Text style={styles.filesHeader}>Selected Files ({selectedFiles.length})</Text>
                        <View testID="file-input">
                            <FlatList
                                data={selectedFiles}
                                renderItem={renderFileItem}
                                keyExtractor={(_, index) => index.toString()}
                                style={styles.fileList}
                            />
                        </View>
                        </View>
                    )}
                    <TextInput
                        style={styles.notesInput}
                        placeholder="Add notes"
                        placeholderTextColor="black"
                        value={formData.notes}
                        onChangeText={(text) => setFormData({ ...formData, notes: text })}
                        multiline
                    />
                    </ScrollView>

                   <TouchableOpacity 
                        style={[styles.addButton, isUploading && styles.addButtonDisabled]} 
                        onPress={handleAddWarranty}
                        disabled={isUploading}
                    >
                    <Text style={styles.addButtonText}>
                        {isUploading ? 'Adding Warranty...' : 'Add a Warranty'}
                    </Text>
                    </TouchableOpacity>
                    
                    {showFileUploadOption && (
                        <View style={styles.fileUploadModal}>
                          <Text style={styles.fileUploadTitle}>Add Files to Your Warranty</Text>
                          <Text style={styles.fileUploadSubtitle}>Upload receipts, photos, or documents</Text>
                          
                          <View style={styles.fileUploadButtons}>
                            <TouchableOpacity 
                              style={styles.fileUploadButton} 
                              onPress={() => uploadFilesToCreatedWarranty('camera')}
                              disabled={isUploadingFiles}
                            >
                              <Ionicons name="camera" size={24} color="#555" />
                              <Text style={styles.fileUploadButtonText}>Take Photo</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                              style={styles.fileUploadButton} 
                              onPress={() => uploadFilesToCreatedWarranty('image')}
                              disabled={isUploadingFiles}
                            >
                              <Ionicons name="image" size={24} color="#555" />
                              <Text style={styles.fileUploadButtonText}>Choose Image</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                              style={styles.fileUploadButton} 
                              onPress={() => uploadFilesToCreatedWarranty('pdf')}
                              disabled={isUploadingFiles}
                            >
                              <Ionicons name="document" size={24} color="#555" />
                              <Text style={styles.fileUploadButtonText}>Choose PDF</Text>
                            </TouchableOpacity>
                          </View>
                          
                          <TouchableOpacity 
                            style={styles.skipButton}
                            onPress={() => {
                              setShowFileUploadOption(false);
                              onClose();
                            }}
                          >
                            <Text style={styles.skipButtonText}>
                              {isUploadingFiles ? 'Uploading...' : 'Skip for Now'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                </View>
            </View>
        </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  formOverlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'flex-end',
  },
  formContainer: {
    backgroundColor: isWeb ? '#e0c3a9' : '#E9E0D4',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
	position: 'absolute',
	width:  isWeb ? '30%':'100%',
	right: isWeb ? '35%' : 0,
	bottom: isWeb ? 150 : 0,
  },
  header: {
    // flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
	fontFamily: 'InriaSerif-Bold',
	alignItems: 'center',
  },
  imageContainer: {
    alignSelf: 'center',
    marginVertical: 10,
	width:  isWeb ? '100%':'100%',
    height: 120,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
	backgroundColor:'white',

  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 15,
    backgroundColor: '#FFF',
  },
  inputContainer: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    fontSize: 14,
    fontWeight: 'bold',
	fontFamily: 'InriaSerif-Bold',
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    fontSize: 14,
    color: '#333',
  },
  iconButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 2,
  },
  iconButtonText: {
    marginLeft: 8,
    fontSize: 12, // CHANGED: from 14 to 12 to fit better
    color: '#555',
    textAlign: 'center', // ADDED
  },
  notesInput: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    marginHorizontal: 5,
    minHeight: 80,
  },
  addButton: {
    backgroundColor: '#7E8FA6',
    borderRadius: 24,
    alignItems: 'center',
    padding: 12,
    marginTop: 5,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginLeft:50,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
	fontFamily: 'InriaSerif-Bold',
  },
    filesContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    marginBottom: 10,
    maxHeight: 120,
  },
  filesHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'InriaSerif-Bold',
  },
  filesList: {
    flexGrow: 0,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileName: {
    marginLeft: 8,
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  fileSize: {
    fontSize: 10,
    color: '#888',
    marginLeft: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  fileUploadModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fileUploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'InriaSerif-Bold',
  },
  fileUploadSubtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'InriaSerif-Regular',
  },
  fileUploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  fileUploadButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  fileUploadButtonText: {
    marginTop: 8,
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    fontFamily: 'InriaSerif-Regular',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 30,
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
  },
});

export default AddWarrantyForm;