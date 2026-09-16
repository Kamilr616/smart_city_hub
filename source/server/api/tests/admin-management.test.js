const assert = require('node:assert/strict');
const {test} = require('node:test');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {Query} = require('mingo');
process.env.JWT_SECRET_KEY = 'admin-management-test-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/admin-management-test';
const UserController = require('../dist/controllers/user.controller').default;
const DeviceController = require('../dist/controllers/device.controller').default;
const User = require('../dist/modules/schemas/user.schema').default;
const Password = require('../dist/modules/schemas/password.schema').default;
const Token = require('../dist/modules/schemas/token.schema').default;
const Device = require('../dist/modules/schemas/device.schema').default;
const mongoose = require('mongoose');
const UserService = require('../dist/modules/services/user.service').default;
const TokenService = require('../dist/modules/services/token.service').default;
const adminId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const memberId = 'bbbbbbbbbbbbbbbbbbbbbbbb';

async function fixture(t) {
  const rollback = [];
  const session = {async withTransaction(callback) {
    rollback.length = 0;
    try { const result = await callback(); rollback.length = 0; return result; }
    catch (error) { for (const undo of rollback.reverse()) undo(); throw error; }
  }, async endSession() {}};
  const transactions = [];
  t.mock.method(mongoose, 'startSession', async () => { transactions.push(session); return session; });
  const users = [
    {_id: adminId, id: adminId, name: 'admin', email: 'admin@example.com', role: 'admin', isAdmin: true, active: true, privateField: 'private'},
    {_id: memberId, id: memberId, name: 'member', email: 'member@example.com', role: 'district-a', isAdmin: false, active: true},
  ];
  const passwords = new Map([[memberId, await bcrypt.hash('old-password-123', 4)]]);
  const tokens = new Map();
  const devices = [{deviceId: 7, name: 'lamp', location: 'district-a', type: 'light', description: 'old', states: [{state: true}]}];
  const find = filter => users.filter(user => new Query(filter).test(user));
  t.mock.method(User, 'find', async filter => find(filter));
  t.mock.method(User, 'findOne', async filter => find(filter)[0] || null);
  t.mock.method(User, 'findById', async id => users.find(user => user._id === String(id).toLowerCase()) || null);
  t.mock.method(User, 'countDocuments', async filter => find(filter).length);
  t.mock.method(User, 'updateOne', async (filter, update, options) => {
    assert.equal(options.session, session);
    const user = find(filter)[0];
    if (!user) return {matchedCount: 0};
    for (const [key, amount] of Object.entries(update.$inc || {})) user[key] = (user[key] || 0) + amount;
    return {matchedCount: 1};
  });
  t.mock.method(User, 'findByIdAndUpdate', async (id, update, options) => {
    assert.notEqual(options.upsert, true);
    assert.equal(options.session, session);
    const user = users.find(user => user._id === String(id).toLowerCase());
    if (!user) return null;
    if (users.some(other => other !== user && (other.name === update.$set.name || other.email === update.$set.email))) throw Object.assign(Error('duplicate'), {code: 11000});
    Object.assign(user, update.$set);
    for (const [key, amount] of Object.entries(update.$inc || {})) user[key] = (user[key] || 0) + amount;
    return user;
  });
  t.mock.method(User.prototype, 'save', async function (options) {
    const user = this.toObject();
    if (users.some(other => other.name === user.name || other.email === user.email)) throw Object.assign(Error('duplicate'), {code: 11000});
    users.push(user);
    if (options?.session === session) rollback.push(() => users.splice(users.indexOf(user), 1));
    return this;
  });
  t.mock.method(Password, 'findOne', async filter => passwords.has(String(filter.userId)) ? {password: passwords.get(String(filter.userId))} : null);
  t.mock.method(Password, 'findOneAndUpdate', async (filter, update) => {
    passwords.set(String(filter.userId), update.$set.password);
    return {password: update.$set.password};
  });
  t.mock.method(Token, 'exists', async filter => tokens.get(filter.value) === String(filter.userId) ? {_id: 'token'} : null);
  t.mock.method(Token, 'deleteMany', async (filter, options) => {
    assert.equal(options.session, session);
    for (const [token, userId] of tokens) if (userId === String(filter.userId)) tokens.delete(token);
    return {acknowledged: true};
  });
  t.mock.method(Token.prototype, 'save', async function () { tokens.set(this.value, String(this.userId)); return this; });
  t.mock.method(Device, 'findOneAndUpdate', async (filter, update, options) => {
    assert.notEqual(options.upsert, true);
    const device = devices.find(item => item.deviceId === filter.deviceId);
    if (!device) return null;
    Object.assign(device, update.$set);
    return device;
  });
  function tokenFor(id, claims = {}) {
    const user = users.find(user => user._id === id);
    const token = jwt.sign({userId: id, role: user.role, isAdmin: user.isAdmin, ...claims}, process.env.JWT_SECRET_KEY);
    tokens.set(token, id);
    return token;
  }
  const adminToken = tokenFor(adminId);
  const memberToken = tokenFor(memberId);
  const app = express();
  app.use(express.json(), new UserController().router, new DeviceController().router);
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  async function request(path, {method = 'GET', body, token = adminToken} = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method, headers: {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let data; try {data = JSON.parse(text);} catch {data = text;}
    return {status: response.status, body: data, cache: response.headers.get('cache-control')};
  }
  return {users, passwords, tokens, devices, request, adminToken, memberToken, tokenFor, transactions};
}

test('user and device administration reject missing, invalid and non-admin credentials', async t => {
  const f = await fixture(t);
  for (const [token, status] of [[null, 401], ['invalid', 401], [f.memberToken, 403]]) {
    for (const [path, method, body] of [['/api/user/list', 'GET'], [`/api/user/${memberId}`, 'PATCH', {name: 'changed'}], ['/api/device/7', 'PATCH', {name: 'changed'}]]) {
      assert.equal((await f.request(path, {method, body, token})).status, status);
    }
  }
});

test('list returns only public management fields', async t => {
  const f = await fixture(t);
  const result = await f.request('/api/user/list');
  assert.equal(result.status, 200);
  assert.equal(result.cache, 'no-store');
  assert.deepEqual(result.body[0], {_id: adminId, name: 'admin', email: 'admin@example.com', role: 'admin', isAdmin: true, active: true});
});

test('editing a user revokes sessions and returns fresh validated public fields', async t => {
  const f = await fixture(t);
  const result = await f.request(`/api/user/${memberId}`, {method: 'PATCH', body: {name: 'Updated', email: 'new@example.com', role: 'district-b', isAdmin: false, active: true}});
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {_id: memberId, name: 'Updated', email: 'new@example.com', role: 'district-b', isAdmin: false, active: true});
  assert.equal(f.tokens.has(f.memberToken), false);
  assert.equal((await f.request('/api/user/list', {token: f.memberToken})).status, 401);
});

test('user edits reject unknown fields, invalid values, duplicate identities and missing IDs', async t => {
  const f = await fixture(t);
  for (const body of [{}, {_id: adminId}, {password: 'short'}, {password: '\u0105'.repeat(40)}, {email: 'invalid'}, {isAdmin: 'true'}, {active: 'false'}, {name: ''}, {role: ''}, {$set: {isAdmin: true}}]) {
    assert.equal((await f.request(`/api/user/${memberId}`, {method: 'PATCH', body})).status, 400);
  }
  assert.equal((await f.request(`/api/user/${memberId}`, {method: 'PATCH', body: {email: 'admin@example.com'}})).status, 409);
  assert.equal((await f.request('/api/user/333333333333333333333333', {method: 'PATCH', body: {name: 'missing'}})).status, 404);
  assert.equal((await f.request('/api/user/bad-id', {method: 'PATCH', body: {name: 'missing'}})).status, 400);
  assert.equal(f.users[1].name, 'member');
});

test('an administrator cannot remove their own access or deactivate their account', async t => {
  const f = await fixture(t);
  for (const body of [{isAdmin: false, role: 'district-a'}, {active: false}, {isAdmin: false}, {role: 'district-a'}]) {
    assert.equal((await f.request(`/api/user/${adminId}`, {method: 'PATCH', body})).status, 409);
  }
  f.users[1].isAdmin = true;
  assert.equal((await f.request(`/api/user/${adminId.toUpperCase()}`, {method: 'PATCH', body: {active: false}})).status, 409);
  assert.equal(f.users[0].active, true);
});

test('password changes store bcrypt hashes, revoke sessions and change login behavior', async t => {
  const f = await fixture(t);
  assert.equal((await f.request(`/api/user/${memberId}`, {method: 'PATCH', body: {password: 'replacement-12345'}})).status, 200);
  assert.notEqual(f.passwords.get(memberId), 'replacement-12345');
  assert.equal(await bcrypt.compare('replacement-12345', f.passwords.get(memberId)), true);
  assert.equal(f.tokens.has(f.memberToken), false);
  const login = password => f.request('/api/user/auth', {method: 'POST', body: {login: 'member', password}, token: null});
  assert.equal((await login('old-password-123')).status, 401);
  assert.equal((await login('replacement-12345')).status, 200);
});

test('inactive users cannot log in and current database permissions override stale JWT claims', async t => {
  const f = await fixture(t);
  const forgedRole = f.tokenFor(memberId, {isAdmin: true, role: 'admin'});
  assert.equal((await f.request('/api/user/list', {token: forgedRole})).status, 403);
  f.users[1].active = false;
  assert.equal((await f.request('/api/user/auth', {method: 'POST', body: {login: 'member', password: 'old-password-123'}})).status, 401);
  assert.equal((await f.request('/api/user/list', {token: f.memberToken})).status, 401);
});

test('legacy create cannot update arbitrary IDs and validates password and identity', async t => {
  const f = await fixture(t);
  for (const body of [{_id: adminId, name: 'changed'}, {name: 'new', email: 'new@example.com', password: 'short'}, {name: 'new', email: 'new@example.com', password: 'new-password-123', extra: 'data'}]) {
    assert.equal((await f.request('/api/user/create', {method: 'POST', body})).status, 400);
  }
  const created = await f.request('/api/user/create', {method: 'POST', body: {name: 'new', email: 'new@example.com', password: 'new-password-123', role: 'district-a', active: true, isAdmin: false}});
  assert.equal(created.status, 200);
  assert.equal(created.body.name, 'new');
  assert.equal(created.body.password, undefined);
  assert.equal((await f.request('/api/user/auth', {method: 'POST', body: {login: {$ne: null}, password: 'old-password-123'}})).status, 400);
});

test('device PATCH edits existing metadata only, preserving identity and states', async t => {
  const f = await fixture(t);
  const result = await f.request('/api/device/7', {method: 'PATCH', body: {name: 'New lamp', location: 'district-b', type: 'light', description: ''}});
  assert.equal(result.status, 200);
  assert.equal(result.body.deviceId, 7);
  assert.equal(f.devices[0].name, 'New lamp');
  assert.deepEqual(f.devices[0].states, [{state: true}]);
  for (const body of [{deviceId: 8}, {state: false}, {states: []}, {}, {name: ''}, {location: ''}]) {
    assert.equal((await f.request('/api/device/7', {method: 'PATCH', body})).status, 400);
  }
  assert.equal((await f.request('/api/device/8', {method: 'PATCH', body: {name: 'Missing'}})).status, 404);
  assert.equal((await f.request('/api/device/96', {method: 'PATCH', body: {name: 'Invalid'}})).status, 400);
  assert.equal(f.devices.length, 1);
});


test('user updates recheck the acting administrator inside a transaction', async t => {
  const f = await fixture(t);
  f.users[0].active = false;
  await assert.rejects(new UserService().update(memberId, {name: 'changed'}, adminId), error => error.status === 403);
  assert.equal(f.users[1].name, 'member');
  assert.equal(f.transactions.length, 1);
});

test('non-admin callers cannot bypass authorization by calling the user service directly', async t => {
  const f = await fixture(t);
  await assert.rejects(new UserService().update(adminId, {active: false}, memberId), error => error.status === 403);
  assert.equal(f.users[0].active, true);
});


test('failed password persistence rolls back new accounts so the creation can be retried', async t => {
  const f = await fixture(t);
  t.mock.method(Password, 'findOneAndUpdate', async () => { throw Error('database unavailable'); });
  const result = await f.request('/api/user/create', {method: 'POST', body: {name: 'new', email: 'new@example.com', password: 'new-password-123'}});
  assert.equal(result.status, 500);
  assert.equal(f.users.length, 2);
  assert.equal(f.transactions.length, 1);
});


test('a login that started before a user change cannot issue a usable session afterwards', async t => {
  const f = await fixture(t);
  const staleLoginUser = {...f.users[1]};
  assert.equal((await f.request(`/api/user/${memberId}`, {method: 'PATCH', body: {name: 'updated'}})).status, 200);
  const token = await new TokenService().create(staleLoginUser);
  assert.equal((await f.request('/api/user/list', {token: token.value})).status, 401);
});

test('new logins never recreate a revoked JWT even within the same second', async t => {
  const f = await fixture(t);
  const now = Date.now();
  t.mock.method(Date, 'now', () => now);
  const service = new TokenService();
  const first = await service.create(f.users[1]);
  f.tokens.delete(first.value);
  const second = await service.create(f.users[1]);
  assert.notEqual(first.value, second.value);
});
