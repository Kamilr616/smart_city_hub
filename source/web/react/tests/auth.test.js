/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeApiUrl,
  apiRequest,
  subscribeUnauthorized,
  getApiErrorMessage,
} from '../src/api.js';
import {
  parseSession,
  loadStoredUser,
  devicePayload,
  userPayload,
} from '../src/context/session.js';

const token = (claims) =>
  `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;

test('API roots work with an existing API suffix and trailing slashes', () => {
  for (const [input, expected] of [
    ['https://example.test/', 'https://example.test/api'],
    ['https://example.test/api///', 'https://example.test/api'],
    ['', '/api'],
    ['/api/', '/api'],
  ]) {
    assert.equal(normalizeApiUrl(input), expected);
  }
});

test('session rejects expired, malformed and missing-expiry tokens', () => {
  for (const data of [
    null,
    { token: 'broken' },
    { token: token({ exp: 100 }) },
    { token: token({}) },
  ]) {
    assert.equal(parseSession(data, 100_000), null);
  }
});

test('session derives administrator access from either supported claim', () => {
  assert.equal(
    parseSession({ token: token({ exp: 200, role: 'admin' }) }, 100_000)
      .isAdmin,
    true,
  );
  assert.equal(
    parseSession(
      { token: token({ exp: 200, role: 'house1', isAdmin: true }) },
      100_000,
    ).isAdmin,
    true,
  );
  assert.equal(
    parseSession(
      { token: token({ exp: 200, role: 'house1' }), isAdmin: true },
      100_000,
    ).isAdmin,
    false,
  );
});

test('invalid persisted sessions are removed and unavailable storage is tolerated', () => {
  let value = '{';
  const storage = {
    getItem: () => value,
    removeItem: () => {
      value = null;
    },
  };
  assert.equal(loadStoredUser(storage), null);
  assert.equal(value, null);
  assert.equal(
    loadStoredUser({
      getItem: () => {
        throw Error('blocked');
      },
      removeItem() {},
    }),
    null,
  );
});

test('device creation validates integer bounds, nonempty location and existing IDs', () => {
  const valid = {
    deviceId: '0',
    location: ' house1 ',
    name: ' Lamp ',
    type: 'light',
    description: '',
  };
  assert.deepEqual(devicePayload(valid, []), {
    deviceId: 0,
    location: 'house1',
    name: 'Lamp',
    type: 'light',
    description: '',
  });
  for (const deviceId of ['', ' ', '-1', '96', '1.5'])
    assert.throws(() => devicePayload({ ...valid, deviceId }, []));
  assert.throws(() => devicePayload({ ...valid, location: ' ' }, []));
  assert.throws(() =>
    devicePayload(valid, [{ deviceId: 0, location: 'house2' }]),
  );
});

test('account payload excludes password confirmation and unexpected fields', () => {
  assert.deepEqual(
    userPayload({
      name: ' Ada ',
      email: ' a@b.test ',
      role: ' house1 ',
      password: 'pass',
      confirmPassword: 'pass',
      isAdmin: true,
    }),
    { name: 'Ada', email: 'a@b.test', role: 'house1', password: 'pass' },
  );
  assert.throws(() =>
    userPayload({
      name: 'Ada',
      email: 'a@b.test',
      role: 'house1',
      password: 'pass',
      confirmPassword: 'different',
    }),
  );
});

test('request serializes JSON and sends bearer credentials', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/device/update');
    assert.equal(options.headers.get('Authorization'), 'Bearer example');
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    assert.equal(options.body, '{"deviceId":0}');
    return new Response('{"ok":true}', { status: 200 });
  });
  assert.deepEqual(
    await apiRequest('/device/update', {
      token: 'example',
      method: 'POST',
      body: { deviceId: 0 },
    }),
    { ok: true },
  );
});

test('authenticated 401 expires its own token without exposing server error details', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('private database failure', { status: 401 }),
  );
  const expired = [];
  const unsubscribe = subscribeUnauthorized((value) => expired.push(value));
  try {
    await assert.rejects(
      apiRequest('/device/user/get', { token: 'old' }),
      (error) =>
        error.status === 401 && !getApiErrorMessage(error).includes('private'),
    );
    assert.deepEqual(expired, ['old']);
    await assert.rejects(apiRequest('/user/auth', { method: 'POST' }));
    assert.deepEqual(expired, ['old']);
  } finally {
    unsubscribe();
  }
});

test('requests terminate on timeout and caller cancellation', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    (_, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      }),
  );
  await assert.rejects(
    apiRequest('/slow', { timeoutMs: 10 }),
    (error) => error.code === 'TIMEOUT',
  );
  const controller = new AbortController();
  const pending = apiRequest('/slow', { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, (error) => error.name === 'AbortError');
});
