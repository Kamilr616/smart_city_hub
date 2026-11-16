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
import {signInWithEmailAndPassword, signOut} from 'firebase/auth';

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
  jest.mocked(signInWithEmailAndPassword).mockResolvedValue({} as never);
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
