const assert = require('node:assert/strict');
const {test} = require('node:test');
const express = require('express');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const {Aggregator, Query} = require('mingo');
process.env.JWT_SECRET_KEY = 'history-test-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/history-test';
const SensorController = require('../dist/controllers/sensor.controller').default;
const StateController = require('../dist/controllers/deviceState.controller').default;
const StateService = require('../dist/modules/services/deviceState.service').default;
const TokenModel = require('../dist/modules/schemas/token.schema').default;
const UserModel = require('../dist/modules/schemas/user.schema').default;
const DeviceModel = require('../dist/modules/schemas/device.schema').default;
const StateModel = require('../dist/modules/schemas/deviceState.schema').default;
const {SensorModel} = require('../dist/modules/schemas/sensor.schema');
const from = '2026-09-15T00:00:00.000Z';
const to = '2026-09-16T00:00:00.000Z';
const date = hour => new Date(`2026-09-15T${String(hour).padStart(2, '0')}:00:00.000Z`);

async function fixture(t, {states = [], readings = [], location = 'district-a', active = true, fail = false} = {}) {
  t.mock.method(TokenModel, 'exists', async () => active ? {_id: 'token'} : null);
  t.mock.method(DeviceModel, 'exists', async filter => filter.deviceId === 4 && (!filter.location || filter.location === location) ? {_id: 'device'} : null);
  t.mock.method(StateModel, 'aggregate', async pipeline => {
    if (fail) throw Error('private connection string');
    return new Aggregator(pipeline).run([{deviceId: 4, states}]);
  });
  t.mock.method(SensorModel, 'find', (filter, projection) => {
    let sort = {}, limit = Infinity;
    const chain = {
      sort(value) { sort = value; return chain; },
      limit(value) { limit = value; return chain; },
      async lean() {
        if (fail) throw Error('private connection string');
        return new Query(filter).find(readings, projection).sort(sort).limit(limit).all();
      },
    };
    return chain;
  });
  const app = express();
  app.use(new SensorController().router, new StateController().router);
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  let currentUser;
  t.mock.method(UserModel, 'findById', async () => currentUser);
  return async (path, user = {role: 'district-a'}) => {
    currentUser = user ? {_id: 'test-user', name: 'Test', email: 'test@example.com', active: true, ...user} : null;
    const headers = user ? {authorization: `Bearer ${jwt.sign({userId: 'test-user', ...user}, process.env.JWT_SECRET_KEY, {expiresIn: '1h'})}`} : {};
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {headers});
    const text = await response.text();
    let body; try {body = JSON.parse(text);} catch {body = text;}
    return {status: response.status, body};
  };
}
const path = (kind, id, query = `from=${from}&to=${to}`) => `/api/${kind}/history/${id}?${query}`;

test('both history routes require an active verified token', async t => {
  const request = await fixture(t, {active: false});
  for (const [kind, id] of [['state', 4], ['sensor', 0]]) {
    assert.equal((await request(path(kind, id), null)).status, 401);
    assert.equal((await request(path(kind, id))).status, 401);
  }
});
test('state history hides missing and unauthorized device metadata', async t => {
  const request = await fixture(t);
  assert.equal((await request(path('state', 4), {role: 'district-b'})).status, 404);
  assert.equal((await request(path('state', 5))).status, 404);
  assert.equal((await request(path('state', 4), {})).status, 404);
  assert.equal((await request(path('state', 4), {role: 'admin'})).status, 200);
  assert.equal((await request(path('state', 4), {role: 'district-b', isAdmin: true})).status, 200);
});
test('history rejects invalid IDs and malformed, repeated, reversed or excessive ranges', async t => {
  const request = await fixture(t);
  for (const [kind, ids] of [['state', [-1, 96, '4x', '1.5']], ['sensor', [-1, 2, '0x', '1.5']]]) {
    for (const id of ids) assert.equal((await request(path(kind, id))).status, 400);
  }
  for (const query of ['from=no', 'from=2026-02-30T00:00:00Z', 'from=2026-09-15', `from=${to}&to=${from}`, `from=${from}&to=${from}`, `from=2026-01-01T00:00:00Z&to=${to}`, `from=${from}&from=${from}`, 'limit=0', 'limit=2001', 'limit=1.5', 'limit=1e2', 'limit=1&limit=2']) {
    for (const [kind, id] of [['state', 4], ['sensor', 0]]) assert.equal((await request(path(kind, id, query))).status, 400, query);
  }
});
test('history defaults to a 24-hour window and preserves missing observations', async t => {
  const request = await fixture(t);
  for (const [kind, id] of [['state', 4], ['sensor', 0]]) {
    const {status, body} = await request(path(kind, id, ''));
    assert.equal(status, 200);
    assert.equal(Date.parse(body.to) - Date.parse(body.from), 86400000);
    assert.deepEqual(body[kind === 'state' ? 'states' : 'readings'], []);
    assert.equal(body.truncated, false);
    if (kind === 'state') assert.equal(body.initialState, null);
  }
});
test('sensor history returns newest bounded readings in chronological order with truthful zeros', async t => {
  const readings = [3, 1, 2, 4].map(hour => ({_id: hour, deviceId: 0, temperature: hour === 4 ? 0 : 20, pressure: 1013, humidity: 50, readingDate: date(hour)}));
  readings.push({...readings[0], deviceId: 1});
  const request = await fixture(t, {readings});
  const {status, body} = await request(path('sensor', 0, `from=${from}&to=${to}&limit=2`));
  assert.equal(status, 200);
  assert.deepEqual(body, {deviceId: 0, from, to, readings: readings.filter(r => r.deviceId === 0 && r._id >= 3).sort((a,b) => a._id - b._id).map(({_id, ...r}) => ({...r, readingDate: r.readingDate.toISOString()})), truncated: true});
});
test('state history finds the actual prior baseline and newest bounded transitions in time order', async t => {
  const states = [
    {state: true, timestamp: date(3)},
    {state: false, timestamp: new Date('2026-09-14T23:00:00Z')},
    {state: true, timestamp: new Date('2026-09-14T22:00:00Z')},
    {state: false, timestamp: date(2)},
    {state: true, timestamp: date(0)},
    {state: false, timestamp: new Date('2026-09-17T00:00:00Z')},
  ];
  const request = await fixture(t, {states});
  const {status, body} = await request(path('state', 4, `from=${from}&to=${to}&limit=2`));
  assert.equal(status, 200);
  assert.deepEqual(body, {deviceId: 4, from, to, initialState: false, states: [{state: false, timestamp: date(2).toISOString()}, {state: true, timestamp: date(3).toISOString()}], truncated: true});
});
test('state history preserves an unknown baseline and includes observations at both bounds', async t => {
  const request = await fixture(t, {states: [{state: true, timestamp: new Date(to)}, {state: false, timestamp: new Date(from)}]});
  const {body} = await request(path('state', 4));
  assert.equal(body.initialState, null);
  assert.deepEqual(body.states, [{state: false, timestamp: from}, {state: true, timestamp: to}]);
  assert.equal(body.truncated, false);
});
test('history database failures produce generic JSON errors', async t => {
  const request = await fixture(t, {fail: true});
  for (const [kind, id] of [['state', 4], ['sensor', 0]]) {
    const response = await request(path(kind, id));
    assert.equal(response.status, 503);
    assert.equal(typeof response.body.error, 'string');
    assert.doesNotMatch(JSON.stringify(response.body), /private/);
  }
});
test('user latest state handles an empty history without inventing off', async t => {
  t.mock.method(DeviceModel, 'find', () => ({select() {return this;}, async lean() {return [{deviceId: 4}];}}));
  t.mock.method(StateModel, 'find', () => Promise.resolve([{deviceId: 4, states: []}]));
  const result = await new StateService().getAllUserDeviceStates('district-a');
  assert.deepEqual(result, [{deviceId: 4, state: null, timestamp: null}]);
});
