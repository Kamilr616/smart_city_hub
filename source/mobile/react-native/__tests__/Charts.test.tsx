import React from 'react';
import {afterEach, expect, it, jest} from '@jest/globals';
import {Text, TouchableOpacity} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import renderer, {act} from 'react-test-renderer';
import MainScreen from '../screens/MainScreen';
import StatisticsScreen from '../screens/StatisticsScreen';

afterEach(() => {
  jest.useRealTimers();
});

it('updates the usage chart when a favorite device is switched off', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-11-16T12:00:00Z'));
  let screen!: renderer.ReactTestRenderer;
  await act(async () => {
    screen = renderer.create(<MainScreen />);
  });
  act(() => screen.root.findAllByType(TouchableOpacity)[0].props.onPress());
  const turnOff = screen.root.findAllByType(TouchableOpacity).find(button =>
    button.findAllByType(Text).some(text => text.props.children === 'Turn Off'),
  );
  expect(turnOff).toBeDefined();
  act(() => turnOff!.props.onPress());
  expect(screen.root.findByType(LineChart).props.data.datasets[1].data[0]).toBe(
    1,
  );
  act(() => screen.unmount());
});

it('renders temperature, humidity and pressure charts', async () => {
  let screen!: renderer.ReactTestRenderer;
  await act(async () => {
    screen = renderer.create(<StatisticsScreen />);
  });
  const charts = screen.root.findAllByType(LineChart);
  expect(charts).toHaveLength(3);
  expect(charts.map(chart => chart.props.data.datasets[0].data[0])).toEqual([
    24, 45, 1010,
  ]);
  act(() => screen.unmount());
});
