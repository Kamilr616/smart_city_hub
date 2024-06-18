import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  ImageBackground,
  Alert,
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '../FirebaseConfig';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      console.log('Zalogowano pomyślnie');
      navigation.navigate('Ekran domowy', { refresh: true });
    } catch (error) {
      console.error(error);
      Alert.alert('Błąd logowania', 'Wystąpił błąd podczas logowania. Spróbuj ponownie.');
    }
  };

  const handleRegister = () => {
    navigation.navigate('Registration');
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar translucent backgroundColor="transparent" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.screenContainer}>
        <ImageBackground
          source={require('../assets/blue.jpg')}
          style={styles.backgroundImage}
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Logowanie</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              onChangeText={setEmail}
              value={email}
            />
            <TextInput
              style={styles.input}
              placeholder="Hasło"
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />
            <TouchableOpacity onPress={handleLogin} style={styles.button}>
              <Text style={styles.buttonText}>Zaloguj</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRegister} style={styles.registerButton}>
              <Text style={styles.registerButtonText}>Kliknij aby się zarejsterować</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    height:850,
    resizeMode: 'cover',
  },
  formContainer: {
    paddingHorizontal: 65,
    marginTop: 240,
  },
  title: {
    fontSize: 45,
    fontWeight: 'bold',
    marginBottom: 1,
    color: '#29B1ED',
    marginBottom: 30,
  },
  bottomtext:{
    fontSize: 19,
    paddingLeft: 20,
    fontWeight:"bold",
    marginBottom: 45,
    
  },
  input: {
    height: 40,
    borderColor: '#29B1ED',
    borderBottomWidth: 1,
    marginBottom: 25,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    color: 'black', 
  },
  button: {
    backgroundColor: '#29B1ED',
    padding: 10,
    borderRadius: 35,
    alignItems: 'center',
  },
  buttonText: {
    fontSize:25,
    color: 'white',
    fontWeight: 'bold',
  },
  registerButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
