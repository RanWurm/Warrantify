import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  name: string;
  address: string;
  city: string;
  phone?: string;
  distance?: number;
  notes?: string;
}

const ServiceCenterCard: React.FC<Props> = ({ name, address, phone, distance, notes }) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{name}</Text>
        {distance !== undefined && (
          <View style={styles.row}>
            <MaterialCommunityIcons name="map-marker-distance" size={16} color="#555" />
            <Text style={styles.infoText}>{distance} Km</Text>
          </View>
        )}
      </View>

      <Text style={styles.address}>{address}</Text>

      <View style={styles.infoRow}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#4caf50" />
          <Text style={[styles.statusText, notes?.includes('Open') ? styles.open : styles.closed]}>
            {notes || 'Opening info unavailable'}
          </Text>
        </View>

        {phone && (
          <TouchableOpacity style={styles.row}>
            <MaterialCommunityIcons name="phone" size={16} color="#555" />
            <Text style={styles.infoText}>{phone}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FDFDFD',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderColor: '#DDD',
    borderWidth: 1,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: 'InriaSerif-Bold',
    color: '#000',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'InriaSerif-Regular',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'InriaSerif-Regular',
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'InriaSerif-Regular',
  },
  open: {
    color: '#4caf50',
  },
  closed: {
    color: '#f44336',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default ServiceCenterCard;
