// app/components/WarrantyCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
interface WarrantyCardProps {
  productId: string;
  title: string;
  subtitle: string;
  date: string;
  timeAgo: string;
  iconName: string;
  progress: number;
  notes: string;
}
const WarrantyCard: React.FC<WarrantyCardProps> = ({
  productId,
  title,
  subtitle,
  date,
  timeAgo,
  iconName,
  progress,
  notes,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [adData, setAdData]= useState([]);
  // Determine progress color based on the progress value.
  let progressColor = '#7E8FA6';
  if (progress >= 75) {
    progressColor = '#AF6F6F';
  } else if (progress >= 40) {
    progressColor = '#FDCB6E';
  } else {
    progressColor = '#B3D2A1';
  }

  const toggleExpanded = () => setExpanded(!expanded);

  const handleAddToMarketList = () => {
    // Open the modal when the button is pressed.
    setModalVisible(true);
  };

  const handleSubmitMarketItem = async () => {
   
    
    // Process the entered data as needed.
    try{
      const token = await AsyncStorage.getItem("token")
      const response = await fetch('http://10.0.0.7:3000/add-for-sale-board',{
        method:'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body:JSON.stringify({
          token,
          productId,
          salePrice,
          city,
          description,
        })
        
      })
      if (!response.ok) {
        console.error('Failed to add item to market list');
        // Optionally show an error message or handle error responses here.
      }
      console.log(`Successfully added product ${productId} to the market list!`);
    } catch (error) {
      console.error('Error submitting market item:', error);
    }
    setModalVisible(false);
    setSalePrice('');
    setCity('');
    setDescription('');
  };

  return (
    <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.8}>
      <View style={[styles.cardContainer, expanded && styles.cardExpanded]}>
        <View style={styles.warrantyItem}>
          <MaterialCommunityIcons
            name={iconName}
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
              width={Dimensions.get('window').width * 0.4}
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
            <TouchableOpacity
              style={styles.marketListButton}
              onPress={handleAddToMarketList}
            >
              <Text style={styles.marketListButtonText}>Add to marketList</Text>
            </TouchableOpacity>
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
                placeholder="Description"
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
                  style={styles.submitButton} 
                  onPress={handleSubmitMarketItem}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
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
  },
  cardExpanded: {
    // Optionally, add any style changes when expanded.
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
    marginBottom: 10,
    fontFamily: 'InriaSerif-Regular',
    color: '#000',
  },
  marketListButton: {
    backgroundColor: '#7E8FA6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  marketListButtonText: {
    color: '#fff',
    fontFamily: 'InriaSerif-Regular',
    fontSize: 16,
  },
  // Modal Styles (adjusted to match overall styling)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#F5EFE6',  // Matching header background
    borderRadius: 15,           // Matching profileContainer borderRadius
    padding: 15,               // Matching header padding
    borderColor: '#E8FA6',    // Matching profileContainer borderColor
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
    color: '#00',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FDFDFD',  // Clean white background for better contrast
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
    fontFamily: 'InriaSerif-Regular',
    color: '#000',
    borderWidth: 1,
    borderColor: '#7E8FA6',    // Subtle border using the app's accent color
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
  }
});

export default WarrantyCard;
