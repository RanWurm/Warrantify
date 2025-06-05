// app/screens/LoginScreen.tsx
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';


export default function LoginScreen() {
  const serverBackendURL = Constants.expoConfig!.extra!.SERVER_BACKEND_URL;
  console.log(serverBackendURL);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const router = useRouter();
  
 const handleLogin = async () =>{
    console.log("in handle login")
    const userData={
        email:email,
        password:password
      }
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password.');
        return;
      }
      
      try{
        axios.post(`${serverBackendURL}/login`, userData)
      .then(res=>{
        console.log("hey data is",res.data)
        AsyncStorage.setItem("token",res.data.data)
        router.replace('/home')
      }) 
      .catch(e => {
        console.log("Error:", e.message);
        console.error(e);  // Full error log for more details
      });
    }
      catch (error: any) {
        //     // Handle different auth errors
            if (error.code === 'auth/user-not-found') {
              Alert.alert('Login Failed', 'No user found with this email. Please register first.');
            } else if (error.code === 'auth/wrong-password') {
              Alert.alert('Login Failed', 'Incorrect password. Please try again.');
            } else if (error.code === 'auth/invalid-email') {
              Alert.alert('Login Failed', 'Invalid email format. Please check and try again.');
            } else {
              Alert.alert('Login Failed', `Error: ${error.message}`);
            }
            console.error('Error signing in:', error);
          }
    
  }

  const navigateToRegister = () => {
    router.push('/register');
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/warrantylogo.png')} // Adjust the path if necessary
          style={styles.logo}
        />
        <Text style={styles.title}>Warrantify</Text>
        <Text style={styles.subtitle}>
          Manage your product warranties all in one place.
        </Text>
      </View>

      {/* Form Section */}
      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8898aa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8898aa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
          />
          <TouchableOpacity
            style={styles.showPasswordButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Text style={styles.showPasswordText}>
              {isPasswordVisible ? 'Hide' : 'Show'} Password
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#dbc4b2', '#4f3e2f']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Sign Up */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={navigateToRegister}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5ede6',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 120,
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontFamily: 'InriaSerif-Bold',
    color: '#4f3e2f',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7a6858',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 22,
    fontFamily: 'InriaSerif-Bold',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  passwordContainer: {
    marginBottom: 24,
  },
  input: {
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1f36',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    fontFamily: 'InriaSerif-Regular',

  },
  showPasswordButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  showPasswordText: {
    color: '#4f3e2f',
    fontSize: 14,
    fontFamily: 'InriaSerif-Bold',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#4f3e2f',
    fontSize: 14,
    fontFamily: 'InriaSerif-Bold',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'InriaSerif-Bold',
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#7a6858',
    fontSize: 14,
    fontFamily: 'InriaSerif-Regular',

  },
  signupLink: {
    color: '#4f3e2f',
    fontSize: 14,
    fontFamily: 'InriaSerif-Bold',
  },
});