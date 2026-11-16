import React from 'react';
import {beforeEach, expect, it, jest} from '@jest/globals';
import {TextInput, TouchableOpacity} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {doc, setDoc} from 'firebase/firestore';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import CustomDrawerContent from '../screens/CustomDrawerContent';

const mockNavigate = jest.fn();
const mockAuthenticated = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}));
jest.mock('@react-navigation/drawer', () => {
  const ReactMock = require('react');
  const {View} = require('react-native');
  return {
    DrawerContentScrollView: ({children}: {children: React.ReactNode}) =>
      ReactMock.createElement(View, null, children),
    DrawerItemList: () => null,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

it('logs in and opens the home screen', async () => {
  jest.mocked(signInWithEmailAndPassword).mockResolvedValue({} as never);
  let screen!: renderer.ReactTestRenderer;
  await act(async () => {
    screen = renderer.create(
      <LoginScreen onAuthenticated={mockAuthenticated} />,
    );
  });
  act(() => {
    screen.root
      .findByProps({placeholder: 'Email'})
      .props.onChangeText('user@example.test');
    screen.root
      .findByProps({placeholder: 'Hasło'})
      .props.onChangeText('password');
  });
  await act(async () => {
    await screen.root.findAllByType(TouchableOpacity)[0].props.onPress();
  });
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
    expect.anything(),
    'user@example.test',
    'password',
  );
  expect(mockAuthenticated).toHaveBeenCalledTimes(1);
  act(() => screen.unmount());
});

it('reports authentication only after Firebase accepts the credentials', async () => {
  jest.mocked(signInWithEmailAndPassword).mockResolvedValue({} as never);
  let screen!: renderer.ReactTestRenderer;
  await act(async () => {
    screen = renderer.create(
      <LoginScreen onAuthenticated={mockAuthenticated} />,
    );
  });
  await act(async () => {
    await screen.root.findAllByType(TouchableOpacity)[0].props.onPress();
  });
  expect(mockAuthenticated).toHaveBeenCalledTimes(1);
  act(() => screen.unmount());
});

it('registers a user, writes their profile, and returns to login', async () => {
  jest
    .mocked(createUserWithEmailAndPassword)
    .mockResolvedValue({user: {uid: 'user-1'}} as never);
  jest.mocked(doc).mockReturnValue('profile-ref' as never);
  jest.mocked(setDoc).mockResolvedValue(undefined);
  let screen!: renderer.ReactTestRenderer;
  await act(async () => {
    screen = renderer.create(<RegistrationScreen />);
  });
  act(() => {
    const inputs = screen.root.findAllByType(TextInput);
    inputs[0].props.onChangeText('Ada');
    inputs[1].props.onChangeText('ada@example.test');
    inputs[2].props.onChangeText('password');
  });
  await act(async () => {
    await screen.root.findByType(TouchableOpacity).props.onPress();
  });
  expect(setDoc).toHaveBeenCalledWith('profile-ref', {
    uid: 'user-1',
    username: 'Ada',
    email: 'ada@example.test',
  });
  expect(mockNavigate).toHaveBeenCalledWith('Login');
  act(() => screen.unmount());
});

it('signs out before returning to login', async () => {
  jest.mocked(signOut).mockResolvedValue(undefined);
  let screen!: renderer.ReactTestRenderer;
  await act(async () => {
    screen = renderer.create(
      <CustomDrawerContent
        {...({
          navigation: {navigate: mockNavigate},
          onSignedOut: mockAuthenticated,
        } as unknown as React.ComponentProps<typeof CustomDrawerContent>)}
      />,
    );
  });
  await act(async () => {
    await screen.root.findByType(TouchableOpacity).props.onPress();
  });
  expect(signOut).toHaveBeenCalledTimes(1);
  expect(mockAuthenticated).toHaveBeenCalledTimes(1);
  act(() => screen.unmount());
});
