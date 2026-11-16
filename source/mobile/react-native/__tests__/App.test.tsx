/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {expect, it} from '@jest/globals';

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
  const register = app.root.findAllByType(TouchableOpacity).find(button =>
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
