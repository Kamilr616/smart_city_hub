/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {expect, it, jest} from '@jest/globals';
import {NavigationContainer} from '@react-navigation/native';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import type {User} from 'firebase/auth';
import {FIREBASE_AUTH} from '../FirebaseConfig';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

it('renders correctly', async () => {
  let app!: renderer.ReactTestRenderer;
  await act(async () => {
    app = renderer.create(<App />);
  });
  act(() => app.unmount());
});

it('opens registration from the login screen through the real navigator', async () => {
  let app!: renderer.ReactTestRenderer;
  await act(async () => {
    app = renderer.create(<App />);
  });
  const register = app.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'Kliknij aby się zarejsterować'),
    );
  expect(register).toBeDefined();
  await act(async () => {
    register!.props.onPress();
  });
  expect(app.root.findByProps({placeholder: 'Nazwa'})).toBeTruthy();
  act(() => app.unmount());
});

it('only exposes authenticated drawer routes after login and removes them after logout', async () => {
  let emit: (user: User | null) => void = () => {};
  jest.mocked(onAuthStateChanged).mockImplementation((_auth, observer) => {
    emit = observer as (user: User | null) => void;
    return () => {};
  });
  jest
    .mocked(signInWithEmailAndPassword)
    .mockResolvedValue({user: {uid: 'user-1'}} as never);
  jest.mocked(signOut).mockResolvedValue(undefined);
  let app!: renderer.ReactTestRenderer;
  await act(async () => {
    app = renderer.create(<App />);
  });
  const routeNames = () => {
    const navigator = app.root.findByType(NavigationContainer).props.children;
    const fragment = navigator.props.children;
    return React.Children.toArray(fragment.props.children).map(
      child => (child as React.ReactElement<{name: string}>).props.name,
    );
  };
  expect(routeNames()).toEqual(['Login', 'Registration']);
  const login = app.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'Zaloguj'),
    );
  await act(async () => {
    Object.assign(FIREBASE_AUTH, {currentUser: {uid: 'user-1'}});
    emit({uid: 'user-1'} as User);
  });
  // Firebase signs in during registration; that alone must not open the drawer.
  expect(routeNames()).toEqual(['Login', 'Registration']);
  await act(async () => {
    await login!.props.onPress();
  });
  expect(routeNames()).toContain('Statystyki');
  expect(routeNames()).not.toContain('Login');
  const logout = app.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'Wyloguj'),
    );
  expect(logout).toBeDefined();
  await act(async () => {
    await logout!.props.onPress();
  });
  expect(routeNames()).toEqual(['Login', 'Registration']);
  act(() => app.unmount());
});

it('keeps the login screen when Firebase rejects credentials', async () => {
  jest
    .mocked(signInWithEmailAndPassword)
    .mockRejectedValue(new Error('invalid credentials'));
  let app!: renderer.ReactTestRenderer;
  await act(async () => {
    app = renderer.create(<App />);
  });
  const login = app.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'Zaloguj'),
    );
  await act(async () => {
    await login!.props.onPress();
  });
  expect(app.root.findByProps({placeholder: 'Email'})).toBeTruthy();
  const navigator = app.root.findByType(NavigationContainer).props.children;
  const routes = React.Children.toArray(
    navigator.props.children.props.children,
  ).map(child => (child as React.ReactElement<{name: string}>).props.name);
  expect(routes).toEqual(['Login', 'Registration']);
  act(() => app.unmount());
});

it('closes protected routes when Firebase reports that the session ended', async () => {
  let emit: (user: User | null) => void = () => {};
  const unsubscribe = jest.fn();
  jest.mocked(onAuthStateChanged).mockImplementation((_auth, observer) => {
    emit = observer as (user: User | null) => void;
    return unsubscribe;
  });
  jest
    .mocked(signInWithEmailAndPassword)
    .mockResolvedValue({user: {uid: 'user-1'}} as never);
  let app!: renderer.ReactTestRenderer;
  await act(async () => {
    app = renderer.create(<App />);
  });
  expect(onAuthStateChanged).toHaveBeenCalled();
  const login = app.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'Zaloguj'),
    );
  await act(async () => {
    Object.assign(FIREBASE_AUTH, {currentUser: {uid: 'user-1'}});
    emit({uid: 'user-1'} as User);
    await login!.props.onPress();
  });
  let navigator = app.root.findByType(NavigationContainer).props.children;
  let routes = React.Children.toArray(
    navigator.props.children.props.children,
  ).map(child => (child as React.ReactElement<{name: string}>).props.name);
  expect(routes).toContain('Statystyki');
  await act(async () => {
    Object.assign(FIREBASE_AUTH, {currentUser: {uid: 'other-user'}});
    emit({uid: 'other-user'} as User);
  });
  navigator = app.root.findByType(NavigationContainer).props.children;
  routes = React.Children.toArray(navigator.props.children.props.children).map(
    child => (child as React.ReactElement<{name: string}>).props.name,
  );
  expect(routes).toEqual(['Login', 'Registration']);
  await act(async () => {
    Object.assign(FIREBASE_AUTH, {currentUser: {uid: 'user-1'}});
    emit({uid: 'user-1'} as User);
  });
  const relogin = app.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'Zaloguj'),
    );
  expect(relogin).toBeDefined();
  await act(async () => {
    await relogin!.props.onPress();
  });
  navigator = app.root.findByType(NavigationContainer).props.children;
  routes = React.Children.toArray(navigator.props.children.props.children).map(
    child => (child as React.ReactElement<{name: string}>).props.name,
  );
  expect(routes).toContain('Statystyki');
  await act(async () => {
    Object.assign(FIREBASE_AUTH, {currentUser: null});
    emit(null);
  });
  navigator = app.root.findByType(NavigationContainer).props.children;
  routes = React.Children.toArray(navigator.props.children.props.children).map(
    child => (child as React.ReactElement<{name: string}>).props.name,
  );
  expect(routes).toEqual(['Login', 'Registration']);
  await act(async () => emit({uid: 'user-1'} as User));
  navigator = app.root.findByType(NavigationContainer).props.children;
  routes = React.Children.toArray(navigator.props.children.props.children).map(
    child => (child as React.ReactElement<{name: string}>).props.name,
  );
  expect(routes).toEqual(['Login', 'Registration']);
  act(() => app.unmount());
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});

it('does not approve a login result if Firebase already signed the user out', async () => {
  let emit: (user: User | null) => void = () => {};
  jest.mocked(onAuthStateChanged).mockImplementation((_auth, observer) => {
    emit = observer as (user: User | null) => void;
    return () => {};
  });
  let finishLogin!: (value: never) => void;
  jest.mocked(signInWithEmailAndPassword).mockReturnValue(
    new Promise(resolve => {
      finishLogin = resolve;
    }),
  );
  let app!: renderer.ReactTestRenderer;
  await act(async () => {
    app = renderer.create(<App />);
    Object.assign(FIREBASE_AUTH, {currentUser: {uid: 'user-1'}});
    emit({uid: 'user-1'} as User);
  });
  const login = app.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'Zaloguj'),
    );
  await act(async () => {
    const pending = login!.props.onPress();
    Object.assign(FIREBASE_AUTH, {currentUser: null});
    emit(null);
    finishLogin({user: {uid: 'user-1'}} as never);
    await pending;
  });
  await act(async () => {
    Object.assign(FIREBASE_AUTH, {currentUser: {uid: 'user-1'}});
    emit({uid: 'user-1'} as User);
  });
  const navigator = app.root.findByType(NavigationContainer).props.children;
  const routes = React.Children.toArray(
    navigator.props.children.props.children,
  ).map(child => (child as React.ReactElement<{name: string}>).props.name);
  expect(routes).toEqual(['Login', 'Registration']);
  act(() => app.unmount());
});
