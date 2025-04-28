// PhotoPreviewSection.tsx
import { Fontisto } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  StyleSheet, 
  View,
  Dimensions,
  Text,
  ActivityIndicator,
  Alert
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PhotoPreviewSection = ({photo, handleRetakePhoto,onClose}) => {
  const [loading, setLoading] = useState(false);
  
  const handleUsePhoto = async () => {
    try {
      setLoading(true);

      const SERVER_URL = 'http://172.20.10.5:5000/scan_recepit';

      const payload = {
        image: photo.base64,
      };

      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload photo');
      }

      const responseData = await response.json();
      console.log(responseData);

      onClose(responseData); // Pass data to onClose and close the preview
      // return responseData; // No need to return here since we're using onClose

    } catch (error) {
      //console.error('Error uploading photo:', error);
      //Alert.alert('Error', error.message || 'An error occurred while uploading the photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            style={styles.previewImage}
            source={{ uri: 'data:image/jpg;base64,' + photo.base64 }}
          />
          <View style={styles.overlay}>
            <Text style={styles.hint}>Review your receipt</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.retakeButton} 
            onPress={handleRetakePhoto}
          >
            <Fontisto name="trash" size={24} color="white" />
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleUsePhoto}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Use Photo</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  imageContainer: {
    width: SCREEN_WIDTH - 40,
    aspectRatio: 3/4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 15,
    alignItems: 'center',
  },
  hint: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhotoPreviewSection; 