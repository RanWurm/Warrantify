// app/productInformation.tsx
import React ,{useState} from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity, Platform, Dimensions, } from 'react-native';
import { useLocalSearchParams, useRouter  } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import * as Progress from 'react-native-progress';
import { TextInput } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

const ProductInformation = () => {
  const { productName, model, purchaseDate, expirationDate, price,  serviceCenter, store, productId } = useLocalSearchParams();
  console.log('🔍 Raw route params:', { purchaseDate, expirationDate });

  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  const [isEditing, setIsEditing] = useState(false);
  const [editedServiceCenter, setEditedServiceCenter] = useState(serviceCenter as string);
  const [editedStore, setEditedStore] = useState(store as string);

  const handleSaveEdits = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('📦 Updating productId:', productId);
      console.log("🔗 Calling URL:", `${serverBackendURL}/update-warranty/${productId}`);

      await axios.put(`${serverBackendURL}/update-warranty/${productId}`, {
        serviceCenter: editedServiceCenter,
        store: editedStore,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('Warranty updated successfully!');
      setIsEditing(false);
      
    } catch (err) {
      console.error('Failed to update warranty:', err);
      alert('Failed to save changes.');
    }
  };
  

  const getTimeUntilExpiration = () => {
    const expiration = new Date(expirationDate as string).getTime();
    const now = new Date();
    const diff = now.getTime() - new Date(expiration).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';

    if(days < 0) {
        if (Math.abs(days) < 30) return `In ${Math.abs(days)} days`;
        if (Math.abs(days) < 365) return `In ${Math.floor(Math.abs(days) / 30)} months`;
        if(Math.floor(Math.abs(days) / 365) == 1) return `In ${Math.floor(Math.abs(days) / 365)} year`;
        return `In ${Math.floor(Math.abs(days) / 365)} years`;
    }
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    if(Math.floor(days / 365) == 1) return `One ${Math.floor(Math.abs(days) / 365)} year ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const calculateProgress = (purchaseDate: Date | null, expirationDate: Date | null) => {
    if (!purchaseDate || !expirationDate) return 0;
    const start = new Date(purchaseDate).getTime();
    const end = new Date(expirationDate).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const elapsed = now - start;
    const progress = (elapsed / total) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const toISODate = (dateStr: string) => {
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const getIconName = (productName: string): string => {
    const productMap: { [key: string]: string } = {
    monitor: 'monitor',
    tablet: 'tablet',
    coffemachine: 'coffee',
    headphones: 'headphones',
    earphones: 'headphones',
    ipad: 'tablet',
    laptop: 'laptop',
    iphone: 'cellphone',
    android: 'cellphone',
    charger: 'power-plug',
    vacuum: 'robot-vacuum',
    television: 'television-classic',
    hairdryer: 'hair-dryer',
    microwave: 'microwave',
    oven: 'stove',
    toaster: 'toaster',
    blender: 'blender',
    kettle: 'kettle',
    fridge: 'fridge-outline',
    freezer: 'snowflake',
    dishwasher: 'dishwasher',
    washingmachine: 'washing-machine',
    dryer: 'tumble-dryer',
    fan: 'fan',
    airconditioner: 'air-conditioner',
    airpurifier: 'air-filter',
    printer: 'printer',
    scanner: 'scanner',
    router: 'router-wireless',
    smartwatch: 'watch-variant',
    camera: 'camera',
    drone: 'drone',
    speaker: 'speaker',
    soundbar: 'soundbar',
    projector: 'projector',
    lightbulb: 'lightbulb',
    electricshaver: 'razor-electric',
    straightener: 'hair-straightener',
    iron: 'iron',
    heater: 'radiator',
    powerbank: 'battery-charging',
    ups: 'battery-high',
    smartwatchcharger: 'watch-variant',
    stylus: 'pen',
    gameconsole: 'gamepad-variant',
    controller: 'controller',
    electricbike: 'bike-electric',
    scooter: 'scooter-electric',
    treadmill: 'treadmill',
    humidifier: 'air-humidifier',
    dehumidifier: 'air-humidifier-off'
  };
    
    const normalized = productName.toLowerCase().replace(/\s+/g, '');

     //  Fuzzy alias checks (before strict productMap match)
    if (normalized.includes('refrigerator') || normalized.includes('fridge')) return 'fridge-outline';
    if (normalized.includes('television') || normalized.includes('tv')) return 'television-classic';
    if (normalized.includes('macbook') || normalized.includes('mac') || normalized.includes('applelaptop')) return 'laptop';
    if (normalized.includes('ice') && normalized.includes('maker')) return 'snowflake';
    if (normalized.includes('coffee') || normalized.includes('coffe')) return 'coffee';
    if (normalized.includes('playstation') || normalized.includes('ps5') || normalized.includes('ps4') || normalized.includes('ps')) return 'gamepad-variant';
    if (normalized.includes('airpods') || normalized.includes('pods')) return 'headphones';
    if (normalized.includes('smarttv') || normalized.includes('androidtv')) return 'television-classic';
    if (normalized.includes('smartwatch') || normalized.includes('fitbit') || normalized.includes('watch')) return 'watch-variant';
    if (normalized.includes('earbuds') || normalized.includes('in-ear')) return 'headphones';
    if (normalized.includes('soundbar')) return 'soundbar';
    if (normalized.includes('xbox')) return 'controller';
    if (normalized.includes('switch')) return 'gamepad-variant';

    if (productMap[normalized]) return productMap[normalized];
  
    const key = Object.keys(productMap).find(k =>
        productName.toLowerCase().includes(k.toLowerCase())
    );
    return key ? productMap[key] : 'package-variant-closed';

  };

const parsedPurchaseDate = new Date(purchaseDate as string); 

const parsedExpirationDate = expirationDate?.includes('/')
  ? new Date(toISODate(expirationDate as string))
  : new Date(expirationDate as string);
  
console.log('🔍 Updated route params:', { parsedPurchaseDate, parsedExpirationDate });

const isValidDate = (date: Date) => !isNaN(date.getTime());

console.log(isValidDate);


const progress = isValidDate(parsedPurchaseDate) && isValidDate(parsedExpirationDate)
  ? calculateProgress(parsedPurchaseDate, parsedExpirationDate)
  : 0;

  let progressColor = '#7E8FA6';

    if (progress >= 75) {
        progressColor = '#AF6F6F';
    } else if (progress >= 40) {
        progressColor = '#FDCB6E';
    } else {
        progressColor = '#B3D2A1';
    }

  return (
    
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Product Information</Text>

      <View style={styles.iconBadge}>
            <MaterialCommunityIcons name={getIconName(productName as string)} size={20} color="#333" />
            <Text style={styles.iconBadgeText}>Warranty Item</Text>
     </View>

      <View style={styles.productBox}>
        <View style={styles.brandRow}>
          {/* <Image source={require('../assets/apple.png')} style={styles.brandLogo} /> */}
        </View>

        <View style={styles.productInnerBox}>
            <Text style={styles.productName}>{productName}</Text>
            <Text style={styles.productModel}>{model}</Text>
            <View style={styles.progressContainer}>
        
            <View style={styles.timeRow}>
                <MaterialCommunityIcons
                        name="clock-fast"
                        size={25}
                        color="#000"
                        style={styles.iconSpacing}
                />
                <Text style={styles.inLabel}>{getTimeUntilExpiration()}</Text>
            </View>
            <Progress.Bar
                            progress={progress / 100}
                            width={isWeb ? 600 : Dimensions.get('window').width * 0.7}
                            color={progressColor}
                            unfilledColor="#E8E8E8"
                            borderWidth={0}
                            height={8}
                            style={styles.progressBar}
                />
            </View>
            
            <Text style={styles.progressLabel}>{Math.round(progress)}% warranty used</Text>

        </View>
        

        <View style={styles.dateRow}>
          <View style={styles.dateBlock}>
            <MaterialCommunityIcons name="calendar" size={22} color="#7F8FA6" />
            <Text style={[styles.dateText, { color: '#7F8FA6' }]}>Purchase Date</Text>
            <Text style={[styles.dateValue, { color: '#7F8FA6' }]}>{new Date(purchaseDate as string).toLocaleDateString('en-GB')}</Text>
          </View>

          <View style={styles.dateBlock}>
            <MaterialCommunityIcons name="calendar-check" size={22} color="green" />
            <Text style={[styles.dateText, { color: 'green' }]}>Warranty Expiration</Text>
            <Text style={[styles.dateValue, { color: 'green' }]}>{new Date(expirationDate as string).toLocaleDateString('en-GB')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>

        <Text style={styles.sectionLabel}>Service centers:</Text>
        <View style={styles.infoLine}>
            <TouchableOpacity onPress={isEditing ? handleSaveEdits : () => setIsEditing(true)} style={[styles.editToggleButton, { zIndex: 10, position: 'absolute', top: 10, right: 20 }]}
      >
        <MaterialCommunityIcons name={isEditing ? 'content-save' : 'pencil'} size={24} color="#333" />
      </TouchableOpacity>
            <View style={styles.rowItem}>
                <MaterialCommunityIcons name="tools" size={35} />
                {isEditing ? (
                <TextInput
                value={editedServiceCenter}
                onChangeText={setEditedServiceCenter}
                style={styles.editableTextInput}
                />
            ) : (
                <Text style={styles.rowText}>{editedServiceCenter}</Text>
            )}
            </View>
        </View>
    
        
        <Text style={styles.sectionLabel}>Store:</Text>
        <View style={styles.infoLine}>
            <View style={styles.rowItem}>
                <MaterialCommunityIcons name="store" size={35} />
                <Text style={styles.rowText}>{store}</Text>
            </View>
        </View>

        <Text style={styles.sectionLabel}>Price:</Text>
        <View style={styles.infoLine}>
            <View style={styles.rowItem}>
                <MaterialCommunityIcons name="cash" size={35} />
                <Text style={styles.rowText}>{price} ₪</Text>
            </View>
        </View>

      </View>

      <View style={styles.actionBox}>
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons name="image-plus" size={24} color="black" />
          <Text style={styles.actionText}>Add Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons name="file-pdf-box" size={24} color="black" />
          <Text style={styles.actionText}>Add PDF</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EFE6',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 20 : 0, // Reduce top padding on Android
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: Platform.OS === 'android' ? 13 : 15, // Less margin on Android
    marginBottom: Platform.OS === 'android' ? 13 : 15, // Less margin on Android
    fontFamily: 'InriaSerif-Bold',
  },
  productBox: {
    backgroundColor: '#F5EFE6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  productInnerBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    fontFamily: 'InriaSerif-Bold',
  },
  productModel: {
    fontSize: 16,
    fontFamily: 'InriaSerif-Regular',
  },
  inLabel: {
    marginVertical: 6,
    color: '#444',
    fontStyle: 'italic',
    marginBottom: 0,
    fontFamily: 'InriaSerif-Regular',
    fontSize: 16

  },
  progressContainer: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: 15,
    marginTop: 4,
    color: '#333',
    fontFamily: 'InriaSerif-Regular',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  dateBlock: {
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    marginTop: 4,
    fontFamily: 'InriaSerif-Bold',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
  },
  infoBox: {
    marginTop: "2%",
    // backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  infoLine:{
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    height:"15%",
  },
  sectionLabel: {
    fontWeight: 'bold',
    marginTop: 8,
    fontFamily: 'InriaSerif-Bold',
    fontSize:18,
    marginLeft:'2%',

  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    marginLeft:'2%',
    marginTop:'3.5%',

  },
  rowText: {
    marginLeft: 8,
    fontSize: 18,
    fontFamily: 'InriaSerif-Regular',
  },
  actionBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    marginTop: 4,
  },
    timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  iconSpacing: {
    marginRight: 5,
  },
  iconBadge: {
  position: 'absolute',
  top: "15%",
  left:"35%",
  backgroundColor: '#D1BB9E',
  borderRadius: 50,
  padding: 8,
  flexDirection: 'row',
  alignItems: 'center',
  zIndex: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5,
},

iconBadgeText: {
  color: '#333',
  marginLeft: 5,
  fontSize: 12,
  fontFamily: 'InriaSerif-Regular',
},
editIcon: {
  position: 'absolute',
  left: "90%",
  top: '70%',
  zIndex: 2,
},
editableTextInput: {
  fontSize: 18,
  fontFamily: 'InriaSerif-Regular',
  marginLeft: 8,
  borderBottomWidth: 1,
  borderColor: '#888',
  padding: 2,
  flex: 1,
},
editToggleButton: {
  position: 'absolute',
  right: 20,
  top: 10,
  backgroundColor: '#ccc',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 8,
},

});

export default ProductInformation;
