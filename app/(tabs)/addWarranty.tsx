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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';

const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

interface AddWarrantyFormProps {
  onClose: () => void;
  scannedData: any;
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

  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);

  useEffect(() => {
    if (scannedData) {
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

      if (scannedData.purchaseDate) {
        const parsedPurchaseDate = new Date(scannedData.purchaseDate);
        if (!isNaN(parsedPurchaseDate.getTime())) setPurchaseDate(parsedPurchaseDate);
      }

      if (scannedData.expirationDate) {
        const parsedExpirationDate = new Date(scannedData.expirationDate);
        if (!isNaN(parsedExpirationDate.getTime())) setExpirationDate(parsedExpirationDate);
      }
    }
  }, [scannedData]);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const onPurchaseDateChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      setPurchaseDate(selectedDate);
      setFormData({ ...formData, purchaseDate: formatDate(selectedDate) });
    }
    setShowPurchaseDatePicker(false);
  };

  const onExpirationDateChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      setExpirationDate(selectedDate);
      setFormData({ ...formData, expirationDate: formatDate(selectedDate) });
    }
    setShowExpirationDatePicker(false);
  };

  const showPurchaseDatePickerModal = () => {
    if (isWeb) {
      setShowPurchaseDatePicker(true);
    } else {
      setShowPurchaseDatePicker(true);
    }
  };

  const showExpirationDatePickerModal = () => {
    if (isWeb) {
      setShowExpirationDatePicker(true);
    } else {
      setShowExpirationDatePicker(true);
    }
  };

  const handleAddWarranty = async () => {
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
        Alert.alert('Success', 'Warranty added successfully!', [{ text: 'OK', onPress: onClose }]);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <View style={styles.formOverlay}>
      <View style={styles.formContainer}>
        <View style={styles.header}>
          <Ionicons name="close" size={24} color="#555" onPress={onClose} style={{ position: 'absolute', left: 10 }} />
          <Text style={styles.headerTitle}>Add a Warranty</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image source={require('../../assets/images/warranty-placeholder.png')} style={styles.image} />
        </View>

        <ScrollView style={styles.inputContainer} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="Product Name" placeholderTextColor="black"
              value={formData.productName}
              onChangeText={(text) => setFormData({ ...formData, productName: text })}
            />
            <TextInput style={styles.input} placeholder="Service Center" placeholderTextColor="black"
              value={formData.serviceCenter}
              onChangeText={(text) => setFormData({ ...formData, serviceCenter: text })}
            />
          </View>

          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="Manufacturer" placeholderTextColor="black"
              value={formData.manufacturer}
              onChangeText={(text) => setFormData({ ...formData, manufacturer: text })}
            />
            <TextInput style={styles.input} placeholder="Store" placeholderTextColor="black"
              value={formData.store}
              onChangeText={(text) => setFormData({ ...formData, store: text })}
            />
          </View>

          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="Model" placeholderTextColor="black"
              value={formData.model}
              onChangeText={(text) => setFormData({ ...formData, model: text })}
            />
            <TextInput style={styles.input} placeholder="Price" placeholderTextColor="black"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.dateInput} onPress={showPurchaseDatePickerModal}>
              <Text style={styles.dateInputText}>
                {formData.purchaseDate || 'Purchase Date'}
              </Text>
              <Ionicons name="calendar-outline" size={16} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateInput} onPress={showExpirationDatePickerModal}>
              <Text style={styles.dateInputText}>
                {formData.expirationDate || 'Expiration Date'}
              </Text>
              <Ionicons name="calendar-outline" size={16} color="#555" />
            </TouchableOpacity>
          </View>

          {showPurchaseDatePicker && (
            <DateTimePicker
              value={purchaseDate}
              mode="date"
              display="calendar"
              onChange={onPurchaseDateChange}
            />
          )}

          {showExpirationDatePicker && (
            <DateTimePicker
              value={expirationDate}
              mode="date"
              display="calendar"
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
  );
};

const styles = StyleSheet.create({
  formOverlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'flex-end',
  },
  formContainer: {
    backgroundColor: isWeb ? '#e0c3a9' : '#DCC0AB',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
    position: 'absolute',
    width: isWeb ? '30%' : '100%',
    right: isWeb ? '35%' : 0,
    bottom: isWeb ? 150 : 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'InriaSerif-Bold',
  },
  imageContainer: {
    alignSelf: 'center',
    marginVertical: 10,
    width: '100%',
    height: 120,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
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
  dateInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
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
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
  },
});

export default AddWarrantyForm;
