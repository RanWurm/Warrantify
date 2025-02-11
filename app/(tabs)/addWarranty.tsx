import React, { useState } from 'react';
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
import { Stack } from 'expo-router';

export default function AddWarranty() {
  const [productName, setProductName] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [store, setStore] = useState('');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');

  const validateDate = (date: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date);
  };

  const handleAddWarranty = () => {
    if (!validateDate(purchaseDate) || !validateDate(expirationDate)) {
      Alert.alert(
        'Invalid Date Format',
        'Please enter dates in YYYY-MM-DD format.'
      );
      return;
    }

    Alert.alert('Success', 'Warranty added successfully!');
  };

  return (
    <>
      {/* Remove the header */}
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 70 }}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons name="document-outline" size={90} color="#555" style={styles.headerIcon} />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Add a warranty</Text>
              <Text style={styles.subtitle}>
                Keep track of all of your receipts simply and easily!
              </Text>
            </View>
          </View>
        </View>

        {/* Illustration */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/warranty-placeholder.png')} // Replace with your image path
            style={styles.image}
          />
        </View>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={productName}
              onChangeText={setProductName}
            />
            <TextInput
              style={styles.input}
              placeholder="Service Center"
              value={serviceCenter}
              onChangeText={setServiceCenter}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Manufacturer"
              value={manufacturer}
              onChangeText={setManufacturer}
            />
            <TextInput
              style={styles.input}
              placeholder="Store"
              value={store}
              onChangeText={setStore}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Model"
              value={model}
              onChangeText={setModel}
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={styles.dateInput}
              placeholder="Purchase Date (YYYY-MM-DD)"
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.dateInput}
              placeholder="Expiration Date (YYYY-MM-DD)"
              value={expirationDate}
              onChangeText={setExpirationDate}
              keyboardType="numeric"
            />
          </View>

		  <View style={styles.row}>
			{/* Scan Receipt Button */}
			<TouchableOpacity style={styles.iconButton}>
				<Ionicons name="scan-outline" size={24} color="#555" />
				<Text style={styles.iconButtonText}>Scan Receipt</Text>
			</TouchableOpacity>

			{/* Add Receipt Button */}
			<TouchableOpacity style={styles.iconButton}>
				<Ionicons name="add-outline" size={24} color="#555" />
				<Text style={styles.iconButtonText}>Add Receipt</Text>
			</TouchableOpacity>

			{/* Add Files Button */}
			<TouchableOpacity style={styles.iconButton}>
				<Ionicons name="document-attach-outline" size={24} color="#555" />
				<Text style={styles.iconButtonText}>Add Fiddddddddddddddd</Text>
			</TouchableOpacity>
		 </View>


          <TextInput
            style={styles.notesInput}
            placeholder="Add notes"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* Add Warranty Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddWarranty}>
          <Text style={styles.addButtonText}>Add Warranty</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="construct-outline" size={24} color="#555" />
          <Text style={styles.navText}>Service centers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="heart-outline" size={24} color="#555" />
          <Text style={styles.navText}>Recommended</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="layers-outline" size={24} color="#555" />
          <Text style={styles.navText}>My Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="home-outline" size={24} color="#555" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D2BBA1',
  },
  header: {
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
	marginTop: 20,
  },
  titleContainer: {
    flex: 1,
	width: 250
  },
  title: {
    fontSize: 30,
    fontFamily: 'InriaSerif-Regular',
    marginBottom: 4,
	marginTop:35,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'left',
    fontFamily: 'InriaSerif-Regular',
  },
  imageContainer: {
    alignSelf: 'center',
    marginVertical: 20,
    width: 400,
    height: 200,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
	marginTop:20,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 15,
    backgroundColor: '#FFF',
	marginTop: 10,
  },
  inputContainer: {
    paddingHorizontal: 16,
	borderColor:'#fff'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconButton: {
	flex: 1,
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: '#FFF',
	borderRadius: 10,
	padding: 12,
	marginHorizontal: 2, // Reduced spacing between buttons
  },
  iconButtonText: {
	marginLeft: 8,
	fontSize: 14,
	color: '#555',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    fontSize: 14,
    color: '#333',
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
    marginHorizontal: 16,
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#D2BBA1',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    position: 'absolute',
    bottom: 0,
  },
  navButton: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#555',
  },
});
