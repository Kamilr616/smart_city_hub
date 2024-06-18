import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, Modal, TextInput, Alert } from 'react-native';

const initialData = [
  { id: '1', name: 'Lampa uliczna', state: 'on'},
  { id: '2', name: 'Lapma uliczna', state: 'on'},
  { id: '3', name: 'Parter zielonu tyl'},
  { id: '4', name: 'Pietro bialy	', state: 'on'},
  { id: '5', name: 'Swiatlo uliczne wystawa	'},
  { id: '6', name: 'Parter zielony przod'},
  { id: '7', name: 'Dach bialy'},
  { id: '8', name: 'Parter kwiaciarnia'},
];

const SettingsScreen: React.FC = () => {
  const [data, setData] = useState(initialData);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedLight, setSelectedLight] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDevice, setNewDevice] = useState({
    location: '',
    name: '',
    description: '',
    type: '',
    deviceId: '',
    state: 'off',
  });

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

  // Function to delete a light
  const deleteLight = (id) => {
    const updatedData = data.filter(item => item.id !== id);
    setData(updatedData);
  };

  // Function to open edit modal
  const openEditModal = (light) => {
    setSelectedLight(light);
    setNewName(light.name);
    setEditModalVisible(true);
  };

  // Function to save edited name
  const saveEdit = () => {
    const updatedData = data.map(item => {
      if (item.id === selectedLight.id) {
        return {
          ...item,
          name: newName,
        };
      }
      return item;
    });
    setData(updatedData);
    setEditModalVisible(false);
  };

  // Function to add a new device
  const addNewDevice = () => {
    const newDeviceWithId = { ...newDevice, id: (data.length + 1).toString() };
    setData([...data, newDeviceWithId]);
    setNewDevice({
      location: '',
      name: '',
      description: '',
      type: '',
      deviceId: '',
      state: 'off',
    });
    setAddModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      <TouchableOpacity onPress={() => toggleLightState(item.id)} style={[styles.stateButton, item.state === 'on' ? styles.on : styles.off]}>
        <Text style={styles.stateButtonText}>{item.state === 'on' ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>
      <View style={styles.options}>
        <TouchableOpacity onPress={() => deleteLight(item.id)} style={styles.optionButton}>
          <Text style={styles.optionButtonText}>delete</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.optionButton}>
          <Text style={styles.optionButtonText}>edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground source={require('../assets/blue.jpg')} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Admin Panel</Text>
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

        {selectedLight && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => {
              setEditModalVisible(!editModalVisible);
            }}
          >
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Edit Light Name</Text>
              <TextInput
                style={styles.input}
                onChangeText={setNewName}
                value={newName}
                placeholder="Enter new name"
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={styles.modalButton} onPress={saveEdit}>
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={addModalVisible}
          onRequestClose={() => {
            setAddModalVisible(!addModalVisible);
          }}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Add new device</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text) => setNewDevice({ ...newDevice, location: text })}
              value={newDevice.location}
              placeholder="location"
            />
            <TextInput
              style={styles.input}
              onChangeText={(text) => setNewDevice({ ...newDevice, name: text })}
              value={newDevice.name}
              placeholder="name"
            />
            <TextInput
              style={styles.input}
              onChangeText={(text) => setNewDevice({ ...newDevice, description: text })}
              value={newDevice.description}
              placeholder="description (can be empty)"
            />
            <TextInput
              style={styles.input}
              onChangeText={(text) => setNewDevice({ ...newDevice, type: text })}
              value={newDevice.type}
              placeholder="type"
            />
            <TextInput
              style={styles.input}
              onChangeText={(text) => setNewDevice({ ...newDevice, deviceId: text })}
              value={newDevice.deviceId}
              placeholder="deviceId"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={addNewDevice}>
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  name: {
    fontSize: 16,
    width: '30%',
  },
  stateButton: {
    width: '15%',
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
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '55%',
  },
  optionButton: {
    backgroundColor: 'black',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 16,
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
  input: {
    width: 200,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: 'black',
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
  },
});

export default SettingsScreen;
