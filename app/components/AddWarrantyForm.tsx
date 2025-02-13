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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
interface AddWarrantyFormProps {
  onClose: () => void;
  scannedData: any; // scannedData passed in (or null if not provided)
}

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
    }
  }, [scannedData]);

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
    
      const response = await fetch('http://10.0.0.7:3000/add-warranty', {
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
  
  
  
  // const handleAddWarranty = () => {
  //   console.log("AddWarrantyForm: handleAddWarranty called with formData:", formData);
  //   if (!validateDate(formData.purchaseDate) || !validateDate(formData.expirationDate)) {
  //     Alert.alert(
  //       'Invalid Date Format',
  //       'Please enter dates in YYYY-MM-DD format.'
  //     );
  //     return;
  //   }
    
  //   // Add your warranty saving logic here
    
  //   Alert.alert(
  //     'Success',
  //     'Warranty added successfully!',
  //     [
  //       {
  //         text: 'OK',
  //         onPress: () => {
  //           console.log("AddWarrantyForm: onClose called from handleAddWarranty after success");
  //           onClose();
  //         }
  //       }
  //     ]
  //   );
  //   console.log("AddWarrantyForm: form data is:", formData);
  // };

  return (
    <View style={styles.formOverlay}>
      <View style={styles.formContainer}>
        <View style={styles.header}>
          <Ionicons
            name="close"
            size={24}
            color="#555"
            onPress={() => { console.log("AddWarrantyForm: Close icon pressed"); onClose(); }}
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
              value={formData.productName}
              onChangeText={(text) => setFormData({ ...formData, productName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Service Center"
              value={formData.serviceCenter}
              onChangeText={(text) => setFormData({ ...formData, serviceCenter: text })}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Manufacturer"
              value={formData.manufacturer}
              onChangeText={(text) => setFormData({ ...formData, manufacturer: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Store"
              value={formData.store}
              onChangeText={(text) => setFormData({ ...formData, store: text })}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Model"
              value={formData.model}
              onChangeText={(text) => setFormData({ ...formData, model: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={styles.dateInput}
              placeholder="Purchase Date (YYYY-MM-DD)"
              value={formData.purchaseDate}
              onChangeText={(text) => setFormData({ ...formData, purchaseDate: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.dateInput}
              placeholder="Expiration Date (YYYY-MM-DD)"
              value={formData.expirationDate}
              onChangeText={(text) => setFormData({ ...formData, expirationDate: text })}
              keyboardType="numeric"
            />
          </View>

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
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
          />
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={handleAddWarranty}>
          <Text style={styles.addButtonText}>Add dddWarranty</Text>
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
    backgroundColor: '#D2BBA1',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#555',
  },
  imageContainer: {
    alignSelf: 'center',
    marginVertical: 10,
    width: 100,
    height: 100,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#333',
    fontWeight: 'bold',
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
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddWarrantyForm;
