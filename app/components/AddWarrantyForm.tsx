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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';

const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

interface AddWarrantyFormProps {
  onClose: () => void;
  scannedData: any; // scannedData passed in (or null if not provided)
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
      // Assume you have a way to retrieve the token (e.g., from storage or context)
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
        Alert.alert(
          'Success',
          'Warranty added successfully!',
          [
            {
              text: 'OK',
              onPress: () => onClose(),
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

                    <View style={styles.row}>
                        <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="scan-outline" size={24} color="#555" />
                        <Text style={styles.iconButtonText}>Scan Receipt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="add-outline" size={24} color="#555" />
                        <Text style={styles.iconButtonText}>Add Receipt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="document-attach-outline" size={24} color="#555" />
                        <Text style={styles.iconButtonText}>Add Files</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.notesInput}
                        placeholder="Add notes"
                        placeholderTextColor="black"
                        value={formData.notes}
                        onChangeText={(text) => setFormData({ ...formData, notes: text })}
                        multiline
                    />
                    </ScrollView>

                    <TouchableOpacity style={styles.addButton} onPress={handleAddWarranty}>
                    <Text style={styles.addButtonText}>Add a Warranty</Text>
                    </TouchableOpacity>
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
    fontSize: 14,
    color: '#555',
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
});

export default AddWarrantyForm;