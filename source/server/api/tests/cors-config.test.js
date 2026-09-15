const assert = require('node:assert/strict');
const test = require('node:test');

process.env.JWT_SECRET_KEY = 'test-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/smart-city-hub-test';

const { parseCorsOrigins } = require('../dist/config');

test('parseCorsOrigins splits a comma-separated list and trims entries', () => {
  assert.deepEqual(parseCorsOrigins('a, b,,c'), ['a', 'b', 'c']);
});

test('parseCorsOrigins returns a one-element array for a single value', () => {
  assert.deepEqual(parseCorsOrigins('http://localhost:5174'), ['http://localhost:5174']);
});

test('parseCorsOrigins falls back to the default origin when undefined', () => {
  assert.deepEqual(parseCorsOrigins(undefined), ['http://localhost:5173']);
});

test('parseCorsOrigins falls back to the default origin for a blank string', () => {
  assert.deepEqual(parseCorsOrigins('   '), ['http://localhost:5173']);
});

test('parseCorsOrigins returns a fresh array instance on each default-path call', () => {
  const first = parseCorsOrigins(undefined);
  const second = parseCorsOrigins(undefined);
  assert.notEqual(first, second);
  assert.deepEqual(first, second);
});
