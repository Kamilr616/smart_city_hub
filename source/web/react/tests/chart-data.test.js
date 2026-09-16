import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSensorSeries,
  buildStateSeries,
  historyRange,
  isStaleReading,
  formatTimestamp,
} from '../src/charts/data.js';

test('sensor chart uses real timestamps in chronological order and keeps zero without inventing missing values', () => {
  const series = buildSensorSeries([
    {
      readingDate: '2026-09-16T12:30:00Z',
      temperature: 0,
      humidity: null,
      pressure: 1005,
    },
    {
      readingDate: '2026-09-16T12:00:00Z',
      temperature: 21,
      humidity: 50,
      pressure: 1000,
    },
    { deviceId: 2 },
    { readingDate: 'invalid', temperature: 30 },
  ]);
  assert.deepEqual(series.temperature, [
    { x: 1789560000000, y: 21 },
    { x: 1789561800000, y: 0 },
  ]);
  assert.deepEqual(series.humidity, [
    { x: 1789560000000, y: 50 },
    { x: 1789561800000, y: null },
  ]);
});

test('device unknown history is empty rather than an invented off state', () => {
  assert.deepEqual(
    buildStateSeries({
      from: '2026-09-16T12:00:00Z',
      to: '2026-09-16T13:00:00Z',
      initialState: null,
      states: [],
    }),
    [],
  );
});

test('device history includes a known baseline and continues its last observed state to range end', () => {
  assert.deepEqual(
    buildStateSeries({
      from: '2026-09-16T12:00:00Z',
      to: '2026-09-16T13:00:00Z',
      initialState: false,
      states: [{ timestamp: '2026-09-16T12:30:00Z', state: true }],
    }),
    [
      { x: 1789560000000, y: 0 },
      { x: 1789561800000, y: 1 },
      { x: 1789563600000, y: 1 },
    ],
  );
});

test('truncated device history never bridges the omitted interval from the baseline', () => {
  assert.deepEqual(
    buildStateSeries({
      from: '2026-09-16T12:00:00Z',
      to: '2026-09-16T13:00:00Z',
      initialState: false,
      truncated: true,
      states: [{ timestamp: '2026-09-16T12:30:00Z', state: true }],
    }),
    [
      { x: 1789561800000, y: 1 },
      { x: 1789563600000, y: 1 },
    ],
  );
});

test('unknown initial state leaves the range before the first observation blank and sorts observations', () => {
  assert.deepEqual(
    buildStateSeries({
      from: '2026-09-16T12:00:00Z',
      to: '2026-09-16T13:00:00Z',
      initialState: null,
      states: [
        { timestamp: '2026-09-16T12:45:00Z', state: false },
        { timestamp: '2026-09-16T12:30:00Z', state: true },
        { timestamp: '2026-09-16T12:10:00Z', state: null },
      ],
    }),
    [
      { x: 1789561800000, y: 1 },
      { x: 1789562700000, y: 0 },
      { x: 1789563600000, y: 0 },
    ],
  );
});

test('range requests use bounded ISO timestamps and reject unsupported ranges', () => {
  assert.deepEqual(historyRange('1h', Date.parse('2026-09-16T13:00:00Z')), {
    from: '2026-09-16T12:00:00.000Z',
    to: '2026-09-16T13:00:00.000Z',
  });
  assert.throws(() => historyRange('all'), RangeError);
});

test('staleness distinguishes missing readings, fresh readings and readings older than 15 minutes', () => {
  const now = Date.parse('2026-09-16T13:00:00Z');
  assert.equal(isStaleReading({ deviceId: 2 }, now), false);
  assert.equal(
    isStaleReading({ readingDate: '2026-09-16T12:59:00Z' }, now),
    false,
  );
  assert.equal(
    isStaleReading({ readingDate: '2026-09-16T12:00:00Z' }, now),
    true,
  );
});

test('browser demo samples span only the selected range and never produce actuator states', async () => {
  const { createDemoHistory } = await import('../src/charts/data.js');
  const result = createDemoHistory('1h', 4, Date.parse('2026-09-16T13:00:00Z'));
  assert.equal(result.source, 'demo');
  assert.equal(result.from, '2026-09-16T12:00:00.000Z');
  assert.equal(result.to, '2026-09-16T13:00:00.000Z');
  assert.equal(result.readings[0].readingDate, result.from);
  assert.equal(result.readings.at(-1).readingDate, result.to);
  assert.equal(result.states, undefined);
  assert.ok(result.readings.length > 2);
  let previous = -Infinity;
  for (const reading of result.readings) {
    const timestamp = Date.parse(reading.readingDate);
    assert.ok(timestamp > previous && timestamp <= 1789563600000);
    assert.equal(reading.deviceId, 4);
    assert.ok(Number.isFinite(reading.temperature));
    assert.ok(reading.humidity >= 0 && reading.humidity <= 100);
    assert.ok(reading.pressure > 900 && reading.pressure < 1100);
    previous = timestamp;
  }
  assert.ok(
    new Set(result.readings.map((reading) => reading.temperature)).size > 1,
  );
});

test('browser demo adapts to long ranges and preserves the selected sensor identity', async () => {
  const { createDemoHistory } = await import('../src/charts/data.js');
  const result = createDemoHistory('7d', 0, Date.parse('2026-09-16T13:00:00Z'));
  assert.equal(result.from, '2026-09-09T13:00:00.000Z');
  assert.equal(result.to, '2026-09-16T13:00:00.000Z');
  assert.ok(result.readings.every((reading) => reading.deviceId === 0));
  assert.throws(() => createDemoHistory('all', 0), RangeError);
});

test('missing timestamps are not formatted as the Unix epoch', () => {
  for (const value of [null, undefined, '', 'invalid'])
    assert.equal(formatTimestamp(value), 'No reading');
});
