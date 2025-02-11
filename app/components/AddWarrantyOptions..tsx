// components/AddWarrantyOptions.tsx
import React, { useState, useEffect } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Modal, 
  View, 
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddWarrantyForm from './AddWarrantyForm';

import Camera from './Camera'; // Import the Camera component

interface AddWarrantyOptionsProps {
  buttonStyle?: any;
  buttonTextStyle?: any;
  onWarrantyAdded?: () => void;  // Add this new prop
}

const AddWarrantyOptions: React.FC<AddWarrantyOptionsProps> = ({ buttonStyle, buttonTextStyle,onWarrantyAdded  }) => {
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const { width, height } = Dimensions.get('window');
  const [cameraVisible, setCameraVisible] = useState(false);
  
  useEffect(() => {
    if (scannedData) {
      console.log("AddWarrantyOptions: Scanned Data Received:", scannedData);
      // Use scannedData here (populate form, navigate, etc.)
      setScannedData(null); // Reset after use
    }
  }, [scannedData]);

  const openOptions = () => {
    console.log("AddWarrantyOptions: openOptions called");
    setOptionsVisible(true);
  };

  const closeOptions = () => {
    console.log("AddWarrantyOptions: closeOptions called");
    setOptionsVisible(false);
  };

  const handleScanReceipt = () => {
    console.log("AddWarrantyOptions: handleScanReceipt called");
    setOptionsVisible(false); // Close the options modal
    setCameraVisible(true);   // Show the camera
  };
  
  const handleAddManually = () => {
    console.log("AddWarrantyOptions: handleAddManually called");
    setOptionsVisible(false);
    setFormVisible(true);
  };
  
  const handlePhotoUsed = (responseData) => {
    console.log("AddWarrantyOptions: handlePhotoUsed called with responseData:", responseData);
    setScannedData(responseData);
    setCameraVisible(false);
    // Show the form immediately after scan
    setFormVisible(true);
  };

  const closeCamera = () => {
    console.log("AddWarrantyOptions: closeCamera called");
    setCameraVisible(false);
  };

  const closeForm = () => {
    console.log("AddWarrantyOptions: closeForm called");
    setFormVisible(false);
  };

  const dynamicStyles = StyleSheet.create({
    addButton: {
      position: 'absolute',
      bottom: height * 0.1,
      alignSelf: 'center',
      backgroundColor: '#7E8FA6',
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: height * 0.02,
      paddingHorizontal: width * 0.1,
      width: width * 0.8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      ...buttonStyle, // Apply custom button styles
    },
    addButtonText: {
      color: '#fff',
      fontSize: width * 0.05,
      fontWeight: 'bold',
      ...buttonTextStyle, // Apply custom text styles
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: '#000000AA',
    },
    modalContainer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      padding: 20,
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    modalContent: {
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      width: '100%',
      borderBottomWidth: 1,
      borderBottomColor: '#DDD',
    },
    optionText: {
      fontSize: 16,
      marginLeft: 10,
      color: '#555',
    },
    cancelButton: {
      marginTop: 10,
      paddingVertical: 10,
    },
    cancelText: {
      fontSize: 16,
      color: '#7E8FA6',
    },
  });

  return (
    <>
      <TouchableOpacity style={dynamicStyles.addButton} onPress={openOptions}>
        <Text style={dynamicStyles.addButtonText}>Add Warranty</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={optionsVisible}
        animationType="fade"
        onRequestClose={() => {
          console.log("AddWarrantyOptions: onRequestClose (options) called");
          closeOptions();
        }}
      >
        <TouchableWithoutFeedback onPress={() => { console.log("AddWarrantyOptions: Overlay pressed to close options"); closeOptions(); }}>
          <View style={dynamicStyles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>Add Warranty</Text>
            <TouchableOpacity style={dynamicStyles.optionButton} onPress={handleScanReceipt}>
              <Ionicons name="scan-outline" size={24} color="#555" />
              <Text style={dynamicStyles.optionText}>Scan Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.optionButton} onPress={handleAddManually}>
              <Ionicons name="create-outline" size={24} color="#555" />
              <Text style={dynamicStyles.optionText}>Add Manually</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.cancelButton} onPress={() => { console.log("AddWarrantyOptions: Cancel pressed in options"); closeOptions(); }}>
              <Text style={dynamicStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={formVisible}
        animationType="slide"
        onRequestClose={() => {
          console.log("AddWarrantyOptions: onRequestClose (form) called via back button");
          closeForm();
        }} // Allows the back button to close the form
      >
        <AddWarrantyForm 
          onClose={() => {
            console.log("AddWarrantyOptions: onClose callback received from AddWarrantyForm");
            closeForm();
            onWarrantyAdded?.();
          }} 
          scannedData={scannedData} // Pass scanned data to form
        />
      </Modal>

      <Modal
        transparent
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => {
          console.log("AddWarrantyOptions: onRequestClose (camera) called");
          setCameraVisible(false);
          setOptionsVisible(true); // Return to options if camera is closed
        }}
      >
        <View style={{ flex: 1 }}>
          <Camera onClose={(data) => {
            console.log("AddWarrantyOptions: Camera onClose callback received with data:", data);
            handlePhotoUsed(data);
          }} />
        </View>
      </Modal>
    </>
  );
};

export default AddWarrantyOptions;
