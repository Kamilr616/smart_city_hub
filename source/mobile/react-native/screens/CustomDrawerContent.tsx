import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { signOut } from 'firebase/auth'; 
import { FIREBASE_AUTH } from '../FirebaseConfig'; 

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      console.log('Wylogowano użytkownika');
      props.navigation.navigate('Login');
    } catch (error) {
      console.error('Błąd podczas wylogowywania użytkownika:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Wyloguj</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: '#29B1ED',
    paddingVertical: 15,
    marginHorizontal:50,
    marginBottom:25,
    borderRadius:20,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize:15,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;
