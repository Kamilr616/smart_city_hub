import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import MainScreen from './screens/MainScreen';
import DevicesScreen from './screens/DevicesScreen';
import SettingsScreen from './screens/SettingsScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import AboutUsScreen from './screens/AboutUsScreen';
import CustomDrawerContent from './screens/CustomDrawerContent';
import LoginScreen from './screens/LoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';

export type RootDrawerParamList = {
  Login: undefined;
  Registration: undefined;
  'Ekran domowy': { refresh?: boolean } | undefined;
  Urządzenia: undefined;
  Statystyki: undefined;
  Ustawienia: undefined;
  'O nas': undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Login"
        useLegacyImplementation={false}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#29B1ED',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Drawer.Screen
          name="Login"
          component={LoginScreen}
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
            drawerIcon: ({ color, size }) => (
              <FontAwesomeIcon name="sign-in" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name='Registration'
          component={RegistrationScreen}
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
            drawerIcon: ({ color, size }) => (
              <FontAwesomeIcon name="user-plus" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Ekran domowy"
          component={MainScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <FontAwesomeIcon name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Urządzenia"
          component={DevicesScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <FontAwesomeIcon name="signal" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Statystyki"
          component={StatisticsScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <FontAwesomeIcon name="dashboard" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Ustawienia"
          component={SettingsScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <FontAwesomeIcon name="gears" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="O nas"
          component={AboutUsScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <FontAwesomeIcon name="info-circle" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

export default App;
