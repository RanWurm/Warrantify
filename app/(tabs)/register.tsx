import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';


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
    axios.post("http://172.20.10.5:3000/register",UserData)
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
		<Stack.Screen options={{ headerShown: false }} />

		<SafeAreaView style={{ flex: 1, backgroundColor: '#D2BBA1' }}>

		</SafeAreaView>
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
				<LinearGradient
					colors={['#dbc4b2', '#4f3e2f']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={styles.signUpButton}
				>
				<Text style={styles.signUpButtonText}>Sign Up</Text>
				</LinearGradient>
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

const { width : SCREEN_WIDTH  } = Dimensions.get('window');
const INPUT_WIDTH = SCREEN_WIDTH  * 0.85 > 400 ? 400 : SCREEN_WIDTH  * 0.85; // Max 400px
const isSmallDevice = SCREEN_WIDTH < 400;  // Phones are < 400px width

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5ede6',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 40,
  },
	logo: {
		width: isSmallDevice ? 90 : 120,   // smaller logo on small devices
		height: isSmallDevice ? 90 : 120,
		resizeMode: 'contain',
		marginTop: 3,
		marginBottom: 10,
	},
  title: {
		fontSize: isSmallDevice ? 24 : 28,
		fontWeight: 'bold',
		fontFamily: 'InriaSerif-Bold',
		color: '#000',
  },
  subtitle: {
		fontSize: isSmallDevice ? 16 : 18,
		color: '#666',
		marginBottom: isSmallDevice ? 10 : 20,
    fontFamily: 'InriaSerif-Regular',
  },
  inputContainer: {
    width: INPUT_WIDTH,
  },
  inputLabel: {
    fontSize: 16,
    //fontFamily: 'InriaSerif-regular',
    color: '#000',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    //fontFamily: 'InriaSerif-Regular',
    // borderWidth: 1,
    // borderColor: '#CCC',
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
    //backgroundColor: '#7E8FA6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: INPUT_WIDTH,
    marginTop: 5,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    //fontFamily: 'InriaSerif-Bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: INPUT_WIDTH,
		marginVertical: isSmallDevice ? 3 : 20, // <--- shrink vertical space
		
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
		marginTop: 2,
    //fontFamily: 'InriaSerif-Regular',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CCC',
    width: INPUT_WIDTH,
    justifyContent: 'center',
		marginTop: 10,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#555',
    //fontFamily: 'InriaSerif-Regular',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  loginText: {
    color: '#4f3e2f',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButtonText: {
    fontSize: 14,
    color: '#7E8FA6',
    //fontFamily: 'InriaSerif-Bold',
  },
});

