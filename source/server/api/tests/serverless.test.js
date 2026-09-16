const assert = require('node:assert/strict');
const {test} = require('node:test');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

process.env.JWT_SECRET_KEY = 'serverless-test-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/serverless-test';
process.env.CORS_ORIGIN = 'https://dashboard.example';
require('ts-node').register({project: path.join(__dirname, '../tsconfig.vercel.json')});
const mongoose = require('mongoose');

test('serverless entrypoint preserves the API without starting a process', async t => {
  let attempts = 0;
  const originalListen = net.Server.prototype.listen;
  const signals = ['SIGINT', 'SIGTERM'].map(signal => process.listenerCount(signal));
  const connect = t.mock.method(mongoose, 'connect', async () => {
    attempts++;
    throw new Error('mongodb://username:private-password@unreachable.example/test');
  });
  let handler;
  await t.test('import neither listens nor connects nor installs signal handlers', () => {
    net.Server.prototype.listen = () => { throw new Error('import opened a port'); };
    try {
      handler = require('../api/index').default;
      assert.equal(typeof handler, 'function');
      assert.equal(attempts, 0);
      assert.deepEqual(['SIGINT', 'SIGTERM'].map(signal => process.listenerCount(signal)), signals);
    } finally {
      net.Server.prototype.listen = originalListen;
    }
  });
  // A missing entrypoint should fail as an import assertion, not leave a server running.
  if (!handler) return;
  const server = http.createServer(handler);
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const origin = process.env.CORS_ORIGIN;

  await t.test('preflight bypasses an unavailable database', async () => {
    const response = await fetch(`${base}/api/state/iot/all`, {
      method: 'OPTIONS',
      headers: {Origin: origin, 'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'x-access-token'},
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.match(response.headers.get('access-control-allow-headers'), /x-access-token/i);
    assert.equal(attempts, 0);
  });

  await t.test('landing page does not require a database connection', async () => {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /<!DOCTYPE html>/i);
    assert.equal(attempts, 0);
  });

  await t.test('connection failures return retryable JSON with CORS and no secrets', async t => {
    const errors = [];
    t.mock.method(console, 'error', (...values) => errors.push(values.join(' ')));
    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${base}/api/state/iot/all`, {headers: {Origin: origin}});
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
      assert.deepEqual(await response.json(), {error: 'Database unavailable'});
    }
    assert.equal(attempts, 2);
    assert.ok(errors.length > 0);
    assert.doesNotMatch(errors.join('\n'), /private-password|mongodb:\/\//);
  });

  connect.mock.mockImplementation(async () => mongoose);

  await t.test('protected route still rejects missing and invalid tokens', async () => {
    for (const headers of [{}, {Authorization: 'Bearer invalid-token'}]) {
      const response = await fetch(`${base}/api/state/iot/all`, {headers});
      assert.equal(response.status, 401);
      await response.text();
    }
  });

  await t.test('an unlisted origin receives no CORS permission', async () => {
    const response = await fetch(`${base}/api/state/iot/all`, {
      headers: {Origin: 'https://untrusted.example'},
    });
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    await response.text();
  });

  await t.test('unknown API routes reach the Express 404', async () => {
    const response = await fetch(`${base}/api/not-a-route?probe=1`);
    assert.equal(response.status, 404);
    assert.match(await response.text(), /Cannot GET \/api\/not-a-route/);
  });

  await t.test('JSON login uses bcrypt and issued tokens are revocable', async t => {
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    const User = require('../lib/modules/schemas/user.schema').default;
    const Password = require('../lib/modules/schemas/password.schema').default;
    const Token = require('../lib/modules/schemas/token.schema').default;
    const DeviceState = require('../lib/modules/schemas/deviceState.schema').default;
    const userId = new mongoose.Types.ObjectId();
    const password = await bcrypt.hash('test-password', 4);
    const active = new Map();
    t.mock.method(User, 'findOne', async filter => {
      assert.deepEqual(filter, {$or: [{email: 'demo'}, {name: 'demo'}]});
      return {_id: userId, id: userId.toString(), email: 'demo@example.com', role: 'user', isAdmin: false};
    });
    t.mock.method(Password, 'findOne', async filter => {
      assert.equal(filter.userId, userId.toString());
      return {password};
    });
    t.mock.method(Token.prototype, 'save', async function () {
      active.set(this.value, this.userId.toString());
      return this;
    });
    t.mock.method(Token, 'exists', async filter =>
      active.get(filter.value) === filter.userId ? {_id: 'active-token'} : null);
    t.mock.method(Token, 'deleteOne', async filter => ({deletedCount: active.delete(filter.value) ? 1 : 0}));
    t.mock.method(DeviceState, 'find', () => ({lean: async () => [{deviceId: 2, states: [{state: true}]}]}));
    const login = password => fetch(`${base}/api/user/auth?client=test`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({login: 'demo', password}),
    });
    const rejected = await login('wrong-password');
    assert.equal(rejected.status, 401);
    await rejected.text();
    const signedIn = await login('test-password');
    assert.equal(signedIn.status, 200);
    const {token} = await signedIn.json();
    assert.equal(jwt.verify(token, process.env.JWT_SECRET_KEY).userId, userId.toString());
    const headers = {'x-access-token': token};
    const states = await fetch(`${base}/api/state/iot/all`, {headers});
    assert.equal(states.status, 200);
    const expected = Array(96).fill(false);
    expected[2] = true;
    assert.deepEqual(await states.json(), expected);
    const logout = await fetch(`${base}/api/user/logout`, {method: 'DELETE', headers});
    assert.equal(logout.status, 200);
    await logout.text();
    const revoked = await fetch(`${base}/api/state/iot/all`, {headers});
    assert.equal(revoked.status, 401);
    await revoked.text();
  });
});
