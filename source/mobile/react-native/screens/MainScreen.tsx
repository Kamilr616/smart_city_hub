import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Dimensions, ImageBackground, TouchableOpacity, Modal } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// Sample data for the chart representing the number of times devices were turned on and off during the week
const initialChartData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      data: [0, 0, 0, 0, 0, 0, 0], // Turned on count
      strokeWidth: 2,
      color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`, // Custom color for on
    },
    {
      data: [0, 0, 0, 0, 0, 0, 0], // Turned off count
      strokeWidth: 2,
      color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Custom color for off
    },
  ],
};

const initialFavoriteDevices = [
  { id: '1', name: 'Lampa uliczna', state: 'on' },
  { id: '2', name: 'Parter czerwony	', state: 'off' },
  { id: '3', name: 'Dach zewnatrz', state: 'off' },
  { id: '4', name: 'Lampa pietro 2', state: 'off' },
  { id: '5', name: 'Dach biały	', state: 'off' },
];

const MainScreen: React.FC = () => {
  const [favoriteDevices, setFavoriteDevices] = useState(initialFavoriteDevices);
  const [chartData, setChartData] = useState(initialChartData);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (device) => {
    setSelectedDevice(device);
    setModalVisible(true);
  };

  const toggleDeviceState = () => {
    const updatedDevices = favoriteDevices.map((device) => {
      if (device.id === selectedDevice.id) {
        return {
          ...device,
          state: device.state === 'on' ? 'off' : 'on',
        };
      }
      return device;
    });
    setFavoriteDevices(updatedDevices);
    updateChartData(selectedDevice.state === 'on' ? 'off' : 'on');
    setModalVisible(false);
  };

  const updateChartData = (newState) => {
    const currentDayIndex = new Date().getDay() - 1; // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const updatedChartData = { ...chartData };

    if (newState === 'on') {
      updatedChartData.datasets[0].data[currentDayIndex] += 1;
    } else {
      updatedChartData.datasets[1].data[currentDayIndex] += 1;
    }

    setChartData(updatedChartData);
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity style={styles.deviceContainer} onPress={() => openModal(item)}>
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={[styles.deviceState, item.state === 'on' ? styles.on : styles.off]}>{item.state.toUpperCase()}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground source={require('../assets/blue.jpg')} style={styles.background}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ulubione urządzenia</Text>
          <FlatList
            data={favoriteDevices}
            renderItem={renderDevice}
            keyExtractor={(item) => item.id}
            horizontal={true}
            style={styles.deviceList}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wykorzystanie urządzeń:</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </ScrollView>

      {selectedDevice && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Control {selectedDevice.name}</Text>
            <Text style={styles.modalText}>Current State: {selectedDevice.state.toUpperCase()}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={toggleDeviceState}>
              <Text style={styles.modalButtonText}>{selectedDevice.state === 'on' ? 'Turn Off' : 'Turn On'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </ImageBackground>
  );
};

const chartConfig = {
  backgroundColor: '#000000',
  backgroundGradientFrom: '#000000',
  backgroundGradientTo: '#000000',
  decimalPlaces: 1, // optional, defaults to 2dp
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#ffa726',
  },
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: "black",
  },
  deviceContainer: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 10,
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceState: {
    fontSize: 14,
    marginTop: 5,
  },
  on: {
    color: 'green',
  },
  off: {
    color: 'red',
  },
  deviceList: {
    paddingLeft: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MainScreen;
