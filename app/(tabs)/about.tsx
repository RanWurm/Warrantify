// app/(tabs)/account.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;

const isWeb = Platform.OS === 'web';

export default function Account() {
  const [fontsLoaded] = useFonts({
    'InriaSerif-Regular': require('../../assets/fonts/InriaSerif-Regular.ttf'),
    'InriaSerif-Bold': require('../../assets/fonts/InriaSerif-Bold.ttf'),
  });
  const [userData, setUserData] = useState<any>(null);
  const [firstname, setFirstName] = useState<string>('');
  const [lastname, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);


  const { width } = useWindowDimensions();
  const router = useRouter();
  
  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem("token");
      axios.post(`${serverBackendURL}/userdata`, { token })
        .then(res => {
          setUserData(res.data.data);
          // Set the image from userData if it exists
          if (res.data.data.image) {
            setImage(res.data.data.image);
          }
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
        });
    };

    fetchData();
  }, []); 
  
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstname || '');
      setLastName(userData.lastname || '');
      setEmail(userData.email || '');
      // Set the image if it exists in userData
      if (userData.image) {
        setImage(userData.image);
      }
    }
  }, [userData]);

  // Dynamic sizing
  const titleFontSize = isWeb ? 30 : width * 0.06;
  const labelFontSize = isWeb ? 24 :width * 0.04;
  const inputFontSize = isWeb ? 20 :width * 0.04;
  const buttonFontSize = isWeb ? 24 : width * 0.04;

  const selectPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduce quality to 50%
        base64: true,
        // Add size restrictions
        maxWidth: 800,
        maxHeight: 800,
      });
  
      if (!result.canceled && result.assets[0]) {
        // Check file size before proceeding
        const base64String = result.assets[0].base64;
        const sizeInMb = (base64String.length * 0.75) / 1024 / 1024; // Convert base64 length to MB
        
        if (sizeInMb > 5) { // 5MB limit
          Alert.alert(
            'Image Too Large',
            'Please select an image smaller than 5MB'
          );
          return;
        }
  
        const base64Image = `data:image/jpeg;base64,${base64String}`;
        setImage(base64Image);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  // Modified handleUpdate function to handle large payloads
  const handleUpdate = async () => {
    if (!userData) {
      Alert.alert('Error', 'No user data is loaded.');
      return;
    }
    
    if (password && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
  
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem("token");
      
      // Create form data with only changed fields
      const formData = {};
      if (firstname !== userData.firstname) formData.firstname = firstname;
      if (lastname !== userData.lastname) formData.lastname = lastname;
      if (password) formData.password = password;
      if (image) formData.image = image;
  
      // Split the request if image is included
      if (Object.keys(formData).length > 0) {
        let response;
        
        if (image) {
          // First update the image
          response = await axios.post(`${serverBackendURL}/update-user`,
			{ image },
			{
				headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
				},
			}
		);
          
          // Then update other fields if any
          const otherFields = { ...formData };
          delete otherFields.image;
          
          if (Object.keys(otherFields).length > 0) {
            response = await axios.post(`${serverBackendURL}/update-user`, 
              otherFields,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }
            );
          }
        } else {
          // Update without image
          response = await axios.post(`${serverBackendURL}/update-user`, 
            formData,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );
        }
  
        if (response.data.status === "Ok") {
          Alert.alert('Success', 'Profile updated successfully');
          // Refresh user data
          const userDataResponse = await axios.post(`${serverBackendURL}/userdata`,{ token });
          setUserData(userDataResponse.data.data);
        }
      } else {
        Alert.alert('Info', 'No changes to update');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'An error occurred while signing out.');
    }
  };
  if (!fontsLoaded || !userData) {
    // Show a loading indicator until fonts and userData are loaded
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          title: "Account",
        }} 
      />

       <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={selectPhoto}>
            <Avatar.Image
              size={140}
              style={styles.avatar}
              source={{
                uri: image || userData?.image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQMAAADCCAMAAAB6zFdcAAAAM1BMVEXFzeD////Byt7L0uPByd7Q1+b7/P3j5/Dv8fbe4+3r7vTFzuDL0+P19/rn6/LZ3urW2+lU+LHUAAAFLklEQVR4nO2dC3arMAxEQXwCcfjsf7XPkLw2tEka5AEziu8CeuKpJVmyLLIskUgkEkdFbsT+HXEQKbNqOPWN59y72D9nd/z/vWqbOv/mozSY9n116vIl1acYg1++G9v+5/rzvMs+QwL/7x/O9a/lT5zL2D9uF7wAzcP1e+pP2AQi4/mZAJ6TfQ3EtY9N4D+jdQ2k6F8K4OltayDFKyP4cghmI6PzVvDnHrDuEqR9UwFPY1IEufw+C72yh8LeIUFOaxSY6K0dFt2qTXDDVJCUi0IBT2vHHmTUSWAnPjgZtBJ4p2BjJ4RIYCSHlCpEAi+CAXMowiSwIIJoguKSE7k5rD8aPWDg3gnKg8EPLrGXEUL5tGC2ijr2OkIIjAlfEJdVBLMNcmprQEnAW09YUzT5C9aNADgbfMGaPQlOgrwj1cAlDZIGGVYD2ktIpAasiRNQgzxpkOektoCMjUkDT+zFaEFqwNqohtSgiL0YHcHlVAMaoCooM6SJo/qK7RGk+yBpkGVBl2w2NAi7aEwamNEAWE5MGiQNkgZJg6RB0sCEBoj+C3YN0j5IGkyks3LKnSegdaSkQdIgaUCtwcf7RJHy02OjVG3/+knvSlxJd+uK7Emb6eqOrQVBoJvgCtu16xYasF23QXsPWDVI+yArN9CALTyW6LhAqAE8NuaEcQH2fOMbtkNS+e7IC8MaYIuJM3TnRGwxcYbvPQ+0eDBD95TFIRv3rwyx17Qa/EGRbmqSAz1xvSP2ktaDvW3MOV9xoJ0i43tftEPgc4n4U1Ls9ajAbgTOkSCh02AW1GxJ4w2gCKwSIAspF0pLmIB5BNaXvhnwnMSXMn6DqrBzBoUrqKoiXdp8B6qqWMVeSADyzijhNyDeBiinyOwSUc95uAemYZ66sl0wLYGcFPmK6gsgCTRzZJxAlJe5TQFyQiA3hQxRVuSOChPBXrEW2trBf/RDts1sg+C8iXZA1oKwc9IY++dDCDojUKcKd5T67JF6ou4C9SHBhjO4os2hiWupv1Hm0JY00LpFKx5xQmsLpjRQdisy19R/om3MsaSB9rxsSgOdBKY00E5SZOxBeoa2kGJJA+01gyEN1JmjJQ20jxnYq+p3qPNGQxqo66qtHQ3UfUlJA0MalKJ+8NnyPfh/hFzOnbpFr6vP7JeNGaALw0BJMfzemT4+IhqSYq8hFESDInNj3ky4BPSXroieLPZDAuI7nuROsUS84iAvqKmT5gWxVxEIQgJuY8BsA+6NgPmyMXVkQHXuM+cMuBEIjO98Z4K78r5pOFtVpWiRn7Qd+aop5QU9AqJuMyYVRKoNJkT58OD/cuy1vYUX4LTBvLgrzVAcXwYpthPgSjcc2ybkgjoRvKQvjqrCVl7gEU11RJMQGTeYFvicbjyaCnsrMFG3R1JBsnZjR/hEhf4gJiHi0NOg1nCOL8OejvAJ3RBTBScy7O4GHlCfXCwV4hrBkvMlQmYpZXQjWLJ7sJTyEEawZNfMsowUC/+m38kxiNtgbDCMZgfHIMUuaVEA3cYnBnx5aAu8e9xMASkYFJjoNpo/K+7oVnBPg68xuKw8zoHoPXp0pCzHg0bDV0CTa3EsjmBJjUunsB9u35Ua08wkGecmuIEIEVIReoIFwTf38JHhEQgcxuqOlx4qCBFBCnY7uKH/uhV0SHRU9CNFUO1EB0A9TMKIIczoggP+QxpRUQ0cM+MMrmiezG7x0bmoKDYCZhLqgVjf8WvhfLhkfaPnFt/di8zq6XNbfIczMqsHDW3xTdrYPFvrP7kiUsVMV4ODAAAAAElFTkSuQmCC'
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cameraButton} onPress={selectPhoto}>
            <Ionicons name="camera" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { fontSize: titleFontSize }]}>Profile Settings</Text>

        {/* Form Fields */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { fontSize: labelFontSize }]}>
            First Name
          </Text>
          <TextInput
            style={[styles.input, { fontSize: inputFontSize }]}
            value={firstname}
            onChangeText={setFirstName}
            placeholder="Enter your First name"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { fontSize: labelFontSize }]}>
            Last Name
          </Text>
          <TextInput
            style={[styles.input, { fontSize: inputFontSize }]}
            value={lastname}
            onChangeText={setLastName}
            placeholder="Enter your Last Name"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { fontSize: labelFontSize }]}>
            {userData.email}
          </Text>
          <TextInput
            style={[styles.input, { fontSize: inputFontSize }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { fontSize: labelFontSize }]}>New Password</Text>
          <TextInput
            style={[styles.input, { fontSize: inputFontSize }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter new password"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { fontSize: labelFontSize }]}>Confirm Password</Text>
          <TextInput
            style={[styles.input, { fontSize: inputFontSize }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Update Button */}
        <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.buttonText, { fontSize: buttonFontSize }]}>Update Profile</Text>
          )}
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
          <Text style={[styles.signOutText, { fontSize: buttonFontSize }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
	width: isWeb ? '50%' : '100%',   // ✅ Limit width to 50% screen on web
	alignSelf: 'center',         
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#E9E0D4',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 100,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
	marginTop: isWeb ? 80 : 40,  
  },
  avatar: {
    backgroundColor: '#FFF',
	width: isWeb ? 140 : 120,
	height: isWeb ? 140 : 120,
	borderRadius: isWeb ? 70 : 70,  // half of width and height
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
    marginBottom: 20,
  },
  inputContainer: {
	width: isWeb ? '50%' : '100%',  // ✅ 80% width on web, full on mobile
	marginVertical: 8,
	alignSelf: 'center',           
  },
  label: {
    fontFamily: 'InriaSerif-Regular',
    color: '#000',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    backgroundColor: '#636B2F',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
	width: isWeb ? '20%' : '100%',
    flexDirection: 'row',
    justifyContent: 'center',
	
  },
  buttonText: {
    color: '#FFF',
    fontFamily: 'InriaSerif-Bold',

  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
	width: isWeb ? '20%' : '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#FFF',
    fontFamily: 'InriaSerif-Bold',
    marginLeft: 8,
  },
});