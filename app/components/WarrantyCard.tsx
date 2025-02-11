// app/components/WarrantyCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Button,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

interface WarrantyCardProps {
  title: string;
  subtitle: string;
  date: string;
  timeAgo: string;
  iconName: string;
  progress: number;
  notes: string;
}

const WarrantyCard: React.FC<WarrantyCardProps> = ({
  title,
  subtitle,
  date,
  timeAgo,
  iconName,
  progress,
  notes,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Preserve your existing progress color logic.
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
    // Add your "add to marketList" logic here.
    console.log(`Adding "${title}" to marketList`);
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
            <TouchableOpacity style={styles.marketListButton} onPress={handleAddToMarketList}>
              <Text style={styles.marketListButtonText}>Add to marketList</Text>
            </TouchableOpacity>
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
    overflow: 'hidden', // ensures child content respects the border radius
  },
  cardExpanded: {
    // Optionally, add any style changes when expanded.
    // For example, you might want to add a shadow or border change.
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
    backgroundColor: '#7E8FA6', // Use your project's accent or primary color here
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // space above the button if needed
  },
  marketListButtonText: {
    color: '#fff', // or any color that fits your design
    fontFamily: 'InriaSerif-Regular',
    fontSize: 16,
  },
});

export default WarrantyCard;
