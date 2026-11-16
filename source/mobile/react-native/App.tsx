import React, {useCallback, useState} from 'react';
import {StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
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
  'Ekran domowy': {refresh?: boolean} | undefined;
  Urządzenia: undefined;
  Statystyki: undefined;
  Ustawienia: undefined;
  'O nas': undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

type DrawerIconProps = {
  color: string;
  size: number;
};

const LoginIcon = ({color, size}: DrawerIconProps) => (
  <FontAwesomeIcon name="sign-in" size={size} color={color} />
);
const RegistrationIcon = ({color, size}: DrawerIconProps) => (
  <FontAwesomeIcon name="user-plus" size={size} color={color} />
);
const HomeIcon = ({color, size}: DrawerIconProps) => (
  <FontAwesomeIcon name="home" size={size} color={color} />
);
const DevicesIcon = ({color, size}: DrawerIconProps) => (
  <FontAwesomeIcon name="signal" size={size} color={color} />
);
const StatisticsIcon = ({color, size}: DrawerIconProps) => (
  <FontAwesomeIcon name="dashboard" size={size} color={color} />
);
const SettingsIcon = ({color, size}: DrawerIconProps) => (
  <FontAwesomeIcon name="gears" size={size} color={color} />
);
const AboutIcon = ({color, size}: DrawerIconProps) => (
  <FontAwesomeIcon name="info-circle" size={size} color={color} />
);

const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const onAuthenticated = useCallback(() => setAuthenticated(true), []);
  const onSignedOut = useCallback(() => setAuthenticated(false), []);
  const renderDrawerContent = useCallback(
    (props: DrawerContentComponentProps) => (
      <CustomDrawerContent {...props} onSignedOut={onSignedOut} />
    ),
    [onSignedOut],
  );
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <Drawer.Navigator
          key={authenticated ? 'authenticated' : 'anonymous'}
          drawerContent={renderDrawerContent}
          screenOptions={{
            swipeEnabled: authenticated,
            headerStyle: {
              backgroundColor: '#29B1ED',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          {!authenticated ? (
            <>
              <Drawer.Screen
                name="Login"
                options={{
                  drawerItemStyle: {display: 'none'},
                  headerShown: false,
                  drawerIcon: LoginIcon,
                }}>
                {() => <LoginScreen onAuthenticated={onAuthenticated} />}
              </Drawer.Screen>
              <Drawer.Screen
                name="Registration"
                component={RegistrationScreen}
                options={{
                  drawerItemStyle: {display: 'none'},
                  headerShown: false,
                  drawerIcon: RegistrationIcon,
                }}
              />
            </>
          ) : (
            <>
              <Drawer.Screen
                name="Ekran domowy"
                component={MainScreen}
                options={{
                  drawerIcon: HomeIcon,
                }}
              />
              <Drawer.Screen
                name="Urządzenia"
                component={DevicesScreen}
                options={{
                  drawerIcon: DevicesIcon,
                }}
              />
              <Drawer.Screen
                name="Statystyki"
                component={StatisticsScreen}
                options={{
                  drawerIcon: StatisticsIcon,
                }}
              />
              <Drawer.Screen
                name="Ustawienia"
                component={SettingsScreen}
                options={{
                  drawerIcon: SettingsIcon,
                }}
              />
              <Drawer.Screen
                name="O nas"
                component={AboutUsScreen}
                options={{
                  drawerIcon: AboutIcon,
                }}
              />
            </>
          )}
        </Drawer.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({root: {flex: 1}});

export default App;
