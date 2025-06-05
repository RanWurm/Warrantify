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
import { KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { Alert } from 'react-native';
import { useEffect } from 'react';


const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

const ProductInformation = () => {
  const { productName, model, purchaseDate, expirationDate, price,  serviceCenter, store, productId } = useLocalSearchParams();
  console.log('🔍 Raw route params:', { purchaseDate, expirationDate });

  const router = useRouter();
  const isWeb = Platform.OS === 'web';

//   const [isEditing, setIsEditing] = useState(false);
    const [editedServiceCenter, setEditedServiceCenter] = useState(serviceCenter as string);
    const [editedStore, setEditedStore] = useState(store as string);
    const [editedPrice, setEditedPrice] = useState(price as string);

    const [editingServiceCenter, setEditingServiceCenter] = useState(false);
    const [editingStore, setEditingStore] = useState(false);
    const [editingPrice, setEditingPrice] = useState(false);

    const [isOnMarket, setIsOnMarket] = useState(false);

    useEffect(() => {
        const checkMarketStatus = async () => {
            try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${serverBackendURL}/check-market-status/${productId}`, {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            setIsOnMarket(data.isOnMarket);
            } catch (error) {
                console.error("❌ Error checking market status:", error);
            }
    };

  checkMarketStatus();
}, []);


  const handleSaveEdits = async () => {
      console.log("💾 Save button pressed");

    try {
      const token = await AsyncStorage.getItem('token');

      if (!editedPrice || isNaN(Number(editedPrice))) {
      alert("Please enter a valid price.");
      return;
    }

      console.log('📦 Updating productId:', productId);
      console.log("🔗 Calling URL:", `${serverBackendURL}/update-warranty/${productId}`);

      await axios.put(`${serverBackendURL}/update-warranty/${productId}`, {
        serviceCenter: editedServiceCenter,
        store: editedStore,
        price: editedPrice,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('Warranty updated successfully!');
      //setIsEditing(false);
      setEditingServiceCenter(false);
      setEditingStore(false);
      setEditingPrice(false);

      router.replace({
        pathname: '/productInformation',
        params: {
            productId,
            productName,
            model,
            purchaseDate,
            expirationDate,
            price,
            serviceCenter: editedServiceCenter,
            store: editedStore,
        }
        });

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

    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor:'#F5EFE6', }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}   showsVerticalScrollIndicator={false}
>
                <SafeAreaView style={styles.container}>
                    <Text style={styles.title}>Product Information</Text>

                    <View style={styles.iconBadge}>
                            <MaterialCommunityIcons name={getIconName(productName as string)} size={20} color="#333" />
                            <Text style={styles.iconBadgeText}>Warranty Item</Text>
                    </View>

                    <View style={styles.productBox}>

                        <View style={styles.productInnerBox}>
                            <Text> </Text>
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
                                                width={isWeb ? 600 : Dimensions.get('window').width * 0.75}
                                                color={progressColor}
                                                unfilledColor="#E8E8E8"
                                                borderWidth={0}
                                                height={8}
                                                style={styles.progressBar}
                                />


                                <View style={styles.dateRow}>
                                    <View style={styles.dateBlockLeft}>
                                        <MaterialCommunityIcons name="calendar" size={25} color="#7F8FA6" />
                                        <View style={styles.dateTextGroup}>
                                        <Text style={[styles.dateText, { color: '#7F8FA6' }]}>Purchase</Text>
                                        <Text style={[styles.dateValue, { color: '#7F8FA6' }]}>
                                            {new Date(purchaseDate as string).toLocaleDateString('en-GB')}
                                        </Text>
                                        </View>
                                    </View>

                                    <View style={styles.dateBlockRight}>
                                        <MaterialCommunityIcons name="calendar-check" size={25} color="green" />
                                        <View style={styles.dateTextGroup}>
                                        <Text style={[styles.dateText, { color: 'green' }]}>Expiration</Text>
                                        <Text style={[styles.dateValue, { color: 'green' }]}>
                                            {new Date(expirationDate as string).toLocaleDateString('en-GB')}
                                        </Text>
                                        </View>
                                    </View>
                                    
                                </View>
                            </View>

                            <Text style={styles.progressLabel}>{Math.round(progress)}% of the warranty used</Text>
                        </View>
                    </View>

                    <View style={styles.infoBox}>

                        <Text style={styles.sectionLabel}>Service centers:</Text>
                        <View style={styles.infoLine}>
                            {!editingServiceCenter && (
                                <TouchableOpacity
                                onPress={() => setEditingServiceCenter(true)}
                                style={styles.editToggleButton}
                                >
                                <MaterialCommunityIcons name="pencil" size={24} color="#333" />
                                </TouchableOpacity>
                            )}

                            {editingServiceCenter && (
                                <TouchableOpacity
                                onPress={handleSaveEdits}
                                style={styles.editToggleButton}
                                >
                                <MaterialCommunityIcons name="content-save" size={24} color="green" />
                                </TouchableOpacity>
                            )}

                            <View style={styles.rowItem}>
                                <MaterialCommunityIcons name="tools" size={35} />
                                {editingServiceCenter ? (
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
                            {!editingStore && (
                            <TouchableOpacity
                                onPress={() => setEditingStore(true)}
                                style={styles.editToggleButton}>
                                <MaterialCommunityIcons name="pencil" size={24} color="#333" />
                            </TouchableOpacity>
                            )}

                            {editingStore && (
                            <TouchableOpacity
                                onPress={handleSaveEdits}
                                style={styles.editToggleButton}>
                                <MaterialCommunityIcons name="content-save" size={24} color="green" />
                            </TouchableOpacity>
                            )}

                            <View style={styles.rowItem}>
                                <MaterialCommunityIcons name="store" size={35} />
                                {editingStore ? (
                                <TextInput
                                    value={editedStore}
                                    onChangeText={setEditedStore}
                                    style={styles.editableTextInput}
                                />
                                ) : (
                                <Text style={styles.rowText}>{editedStore}</Text>
                                )}
                            </View>
                        </View>

                        <Text style={styles.sectionLabel}>Price:</Text>
                        <View style={styles.infoLine}>
                            {!editingPrice && (
                                <TouchableOpacity
                                onPress={() => setEditingPrice(true)}
                                style={styles.editToggleButton}
                                >
                                <MaterialCommunityIcons name="pencil" size={24} color="#333" />
                                </TouchableOpacity>
                            )}

                            {editingPrice && (
                                <TouchableOpacity
                                onPress={handleSaveEdits}
                                style={styles.editToggleButton}
                                >
                                <MaterialCommunityIcons name="content-save" size={24} color="green" />
                                </TouchableOpacity>
                            )}

                            <View style={styles.rowItem}>
                                <MaterialCommunityIcons name="cash" size={35} />
                                {editingPrice ? (
                                <TextInput
                                    value={editedPrice}
                                    onChangeText={setEditedPrice}
                                    keyboardType="numeric"
                                    style={styles.editableTextInput}
                                />
                                ) : (
                                <Text style={styles.rowText}>{editedPrice} ₪</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.actionBox}>
                            <TouchableOpacity style={styles.actionBtn}>
                                <MaterialCommunityIcons name="image-plus" size={24} color="black" />
                            <   Text style={styles.actionText}>Add Image</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtn}>
                                <MaterialCommunityIcons name="file-pdf-box" size={24} color="black" />
                                <Text style={styles.actionText}>Add PDF</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.deleteBtn, isOnMarket && { backgroundColor: 'gray' }]}
                            onPress={() => {
                                if (isOnMarket) {
                                Alert.alert('Cannot Delete', 'This product is listed in the marketplace.');
                                return;
                                }

                                Alert.alert(
                                'Delete Warranty',
                                'Are you sure you want to delete this warranty?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                        const token = await AsyncStorage.getItem('token');
                                        await axios.delete(`${serverBackendURL}/delete-warranty/${productId}`, {
                                            headers: { Authorization: `Bearer ${token}` },
                                        });
                                        alert('Warranty deleted successfully!');
                                        router.replace('/myWarranties');
                                        } catch (err) {
                                        console.error('❌ Failed to delete:', err);
                                        alert('Failed to delete warranty.');
                                        }
                                    },
                                    },
                                ]
                                );
                            }}
                            >
                            <Text style={styles.deleteBtnText}>
                                {isOnMarket ? 'Listed in Marketplace' : 'Delete Warranty'}
                            </Text>
                        </TouchableOpacity>

                    </View>
                </SafeAreaView>
            </ScrollView>

            {!isWeb ? (
      <View style={styles.bottomNavContainer}>
        <BottomNavBar />
      </View>
    ) : null}
        </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
    borderRadius: 12,
    alignItems: 'center',
    width: '95%',
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
    borderRadius: 5,
    // borderWidth: 1,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: 15,
    marginTop: 6,
    marginBottom:6,    
    color: '#333',
    fontFamily: 'InriaSerif-Regular',
  },
  dateRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  paddingHorizontal: 8,
  marginTop: 10,
},

dateBlockLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flex: 1,
  gap: 6,
},

dateBlockRight: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flex: 1,
  gap: 6,
},

dateBlock: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

dateTextGroup: {
  flexDirection: 'column',
  justifyContent: 'center',
},

dateText: {
  fontSize: 12,
  fontFamily: 'InriaSerif-Bold',
},

dateValue: {
  fontSize: 12,
  fontWeight: 'bold',
  fontFamily: 'InriaSerif-Bold',
},
infoBox: {
    padding: 16,
    borderRadius: 12,
    paddingTop:0,
    paddingBottom:0,
  },
  infoLine:{
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: "2%",
    height:"12%",
    width:"95%",
    marginLeft:'3%',
  },
  sectionLabel: {
    fontWeight: 'bold',
    marginTop: 8,
    fontFamily: 'InriaSerif-Bold',
    fontSize:18,
    marginLeft:'4%',
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
    width: '30%',
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
  top: "13%",
  left:"30%",
  backgroundColor: '#D1BB9E',
  borderRadius: 50,
  padding: 12,
  flexDirection: 'row',
  alignItems: 'center',
  zIndex: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5,
  width:'40%',
},

iconBadgeText: {
  color: '#333',
  marginLeft: 5,
  fontSize: 15,
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
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 8,
  zIndex: 999,             
},
bottomNavContainer: {
  position: 'absolute',
  bottom: Platform.OS === 'android' ? 20 : 0, // Move up 20px on Android
  left: 0,
  right: 0,
  backgroundColor: '#E9E0D4', // Add background to hide content underneath
  paddingTop: 10, // Add padding above nav bar
},

deleteBtn: {
  backgroundColor: '#AF6F6F',
  padding: 12,
  marginTop: 20,
  borderRadius: 12,
  alignItems: 'center',
  width: '94%',
  alignSelf: 'center',
},

deleteBtnText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
  fontFamily: 'InriaSerif-Bold',
}


});


export default ProductInformation;
