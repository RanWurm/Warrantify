// components/PhotoPreviewSection.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Fontisto } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PhotoPreviewSectionProps {
  photo: { base64: string };
  handleRetakePhoto: () => void;
  onClose: (scannedData: any) => void;
}

const PhotoPreviewSection: React.FC<PhotoPreviewSectionProps> = ({
  photo,
  handleRetakePhoto,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  const handleUsePhoto = () => {
    setLoading(true);
    // Simulate a server call that "scans" the receipt and returns data.
    setTimeout(() => {
      const scannedData = {
        productName: "Lenovo USB Type-C 65W AC Wall Adapter",
        price: "176.00",
        purchaseDate: "2023-08-05",
        manufacturer: "",
        model: "4X20M26279/GX20R05295",
        expirationDate: "",
        serviceCenter: "",
        notes: "",
      };
      setLoading(false);
      onClose(scannedData);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {/* In a real app, use the base64 image data */}
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
    aspectRatio: 3 / 4,
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
