import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const About = () => {
  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.container}>
          <Image 
            source={require('../../assets/images/warrantylogo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>About Us</Text>
          
          <View style={styles.optionsContainer}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="info" size={24} color="#000" />
                <Text style={styles.optionText}>App Version</Text>
              </View>
              <Text style={styles.optionText}>1.0.0</Text>
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="update" size={24} color="#000" />
                <Text style={styles.optionText}>Check for Updates</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#000" />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="star" size={24} color="#000" />
                <Text style={styles.optionText}>Rate Us</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#000" />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="share" size={24} color="#000" />
                <Text style={styles.optionText}>Share App</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#000" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default About;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#E9E0D4',
  },
  scrollView: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    paddingBottom: 100,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 10,
    marginTop: 40,
  },
  title: {
    fontWeight: 'bold',
    fontFamily: 'InriaSerif-Bold',
    marginBottom: 20,
    fontSize: 24,
  },
  optionsContainer: {
    width: '100%',
    paddingTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    marginVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: 15,
    fontFamily: 'InriaSerif-Regular',
    color: '#000',
  },
});