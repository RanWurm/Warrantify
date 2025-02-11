import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Privacy = () => {
  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>Privacy Policy</Text>
          
          <View style={styles.optionsContainer}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="security" size={24} color="#000" />
                <Text style={styles.optionText}>Data Protection</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#000" />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="lock" size={24} color="#000" />
                <Text style={styles.optionText}>Privacy Settings</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#000" />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="policy" size={24} color="#000" />
                <Text style={styles.optionText}>Terms & Conditions</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#000" />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="delete" size={24} color="#000" />
                <Text style={styles.optionText}>Delete Account</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#000" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Privacy;

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