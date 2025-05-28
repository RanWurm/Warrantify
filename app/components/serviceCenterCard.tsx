import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const isWeb = Platform.OS === 'web';

interface ServiceCenterCardProps {
  name: string;
  city: string;
  address?: string;
  iconName?: string;
  notes?: string;
}

const ServiceCenterCard: React.FC<ServiceCenterCardProps> = ({
  name,
  city,
  address = 'No address provided',
  iconName = 'store',
  notes = 'No additional notes',
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded(!expanded);

  return (
    <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.85}>
      <View style={[styles.cardContainer, expanded && styles.cardExpanded]}>
        <View style={styles.centerItem}>
          <MaterialCommunityIcons
            name={iconName}
            size={32}
            color="#000"
            style={styles.icon}
          />
          <View style={styles.centerInfo}>
            <Text style={styles.itemTitle}>{name}</Text>
            <Text style={styles.itemSubtitle}>{city}</Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.expandedContainer}>
            <Text style={styles.expandedText}>📍 {address}</Text>
            <Text style={styles.expandedText}>📝 {notes}</Text>
          </View>
        )}
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
  elevation: 2,               
  shadowColor: '#000',        
  shadowOpacity: 0.1,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 2 },
  },
  cardExpanded: {
    // Add visual cue if needed
  },
  centerItem: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  icon: {},
  centerInfo: {
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
  expandedContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  expandedText: {
    fontFamily: 'InriaSerif-Regular',
    color: '#000',
    marginTop: 8,
  },
});

export default ServiceCenterCard;
