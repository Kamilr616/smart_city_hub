import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground } from 'react-native';

// Define the initial data
const initialData = [
  { id: '1', name: 'Lampa uliczna', state: 'on', description: 'Identyfikator: 0' },
  { id: '2', name: 'Lapma uliczna', state: 'on', description: 'Identyfikator: 8' },
  { id: '3', name: 'Parter zielonu tyl	', state: 'on', description: 'Identyfikator: 23' },
  { id: '4', name: 'Pietro bialy	', state: 'on', description: 'Identyfikator: 15' },
  { id: '5', name: 'Swiatlo uliczne wystawa	', state: 'off', description: 'Identyfikator: 1' },
  { id: '6', name: 'Parter zielony przod', state: 'off', description: 'Identyfikator: 5' },
  { id: '7', name: 'Dach bialy', state: 'off', description: 'Identyfikator: 13' },
  { id: '8', name: 'Parter kwiaciarnia', state: 'off', description: 'Identyfikator: 23' },
];

const DevicesScreen: React.FC = () => {
  const [data, setData] = useState(initialData);

  // Function to toggle the state of a light
  const toggleLightState = (id) => {
    const updatedData = data.map(item => {
      if (item.id === id) {
        return {
          ...item,
          state: item.state === 'on' ? 'off' : 'on',
        };
      }
      return item;
    });
    setData(updatedData);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      <TouchableOpacity onPress={() => toggleLightState(item.id)} style={[styles.stateButton, item.state === 'on' ? styles.on : styles.off]}>
        <Text style={styles.stateButtonText}>{item.state === 'on' ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <ImageBackground source={require('../assets/blue.jpg')} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>SmartCity</Text>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <Text style={styles.headerText}>Urządzenie:</Text>
            </View>
          )}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  name: {
    fontSize: 16,
    width: '36%',
  },
  stateButton: {
    width: '20%',
    textAlign: 'center',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  stateButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  on: {
    backgroundColor: 'green',
  },
  off: {
    backgroundColor: 'red',
  },
  description: {
    paddingLeft:15,
    fontSize: 16,
    width: '50%',
  },
});

export default DevicesScreen;
