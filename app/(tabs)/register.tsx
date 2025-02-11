import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';

export default function RegisterScreen() {
  const [fontsLoaded] = useFonts({
    'InriaSerif-Regular': require('../../assets/fonts/InriaSerif-Regular.ttf'),
    'InriaSerif-Bold': require('../../assets/fonts/InriaSerif-Bold.ttf'),
  });

  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  if (!fontsLoaded) {
    return null; // Render nothing while fonts are loading
  }

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const toggleShowPassword = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };
  
  const handleSignUp = async () => {
    console.log("in Signup")
    const UserData={ 
      firstname:form.firstName,
      lastname:form.lastName,
      email:form.email,
      password:form.password,    
    }
    console.log("here iam",UserData)
    axios.post("http://10.0.0.7:3000/register",UserData)
    .then(res=>{
      console.log(res.data)
      router.replace('/login');
    })
    .catch(e=>console.log("hey",e))
  }
  
  const handleGoogleSignUp = () => {
    // Handle Google sign-up logic here
    console.log('Sign Up with Google Pressed');
  };

  const navigateToLogin = () => {
    router.push('/login'); 
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.container}>
        <Image 
          source={require('../../assets/images/warrantylogo.png')} 
          style={styles.logo} 
        />

        <Text style={styles.title}>Warrantify</Text>
        <Text style={styles.subtitle}>Create Your Account</Text>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            placeholderTextColor="#888"
            value={form.firstName}
            onChangeText={(text) => handleChange('firstName', text)}
          />

          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            placeholderTextColor="#888"
            value={form.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
          />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(text) => handleChange('email', text)}
          />

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter your password"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword.password}
              value={form.password}
              onChangeText={(text) => handleChange('password', text)}
            />
            <TouchableOpacity onPress={() => toggleShowPassword('password')}>
              <Ionicons 
                name={showPassword.password ? 'eye-off' : 'eye'} 
                size={24} 
                color="#555" 
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Confirm your password"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword.confirmPassword}
              value={form.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
            />
            <TouchableOpacity onPress={() => toggleShowPassword('confirmPassword')}>
              <Ionicons 
                name={showPassword.confirmPassword ? 'eye-off' : 'eye'} 
                size={24} 
                color="#555" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Or Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign Up with Google Button */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp}>
          <FontAwesome name="google" size={24} color="#DB4437" style={styles.googleIcon} />
          <Text style={styles.googleButtonText}>Sign Up with Google</Text>
        </TouchableOpacity>

        {/* Already have an account */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginButtonText}> Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#D2BBA1',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 10,
    marginTop: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
    marginTop: 0,
    color: '#000',
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 20,
    fontFamily: 'InriaSerif-Regular',
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'InriaSerif-Bold',
    color: '#000',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'InriaSerif-Regular',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  signUpButton: {
    backgroundColor: '#7E8FA6',
    padding: 14,
    borderRadius: 24,
    alignItems: 'center',
    width: '80%',
    marginTop: 20,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CCC',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#555',
    fontFamily: 'InriaSerif-Regular',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CCC',
    width: '80%',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#555',
    fontFamily: 'InriaSerif-Regular',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'InriaSerif-Regular',
  },
  loginButtonText: {
    fontSize: 14,
    color: '#7E8FA6',
    fontFamily: 'InriaSerif-Bold',
  },
});
