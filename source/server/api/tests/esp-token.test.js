const assert = require('node:assert/strict');
const test = require('node:test');
const crypto = require('node:crypto');
process.env.JWT_SECRET_KEY = 'test-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/smart-city-hub-test';
const DeviceModel = require('../dist/modules/schemas/device.schema').default;
const StateModel = require('../dist/modules/schemas/deviceState.schema').default;
const {SensorDefinitionModel} = require('../dist/modules/schemas/sensorDefinition.schema');
const StateService = require('../dist/modules/services/deviceState.service').default;
const SensorController = require('../dist/controllers/sensor.controller').default;
function response(locals = {}) {
  return {locals, statusCode: 200, status(code) { this.statusCode = code; return this; },
    json(body) {this.body = body; return this;}, send(body) {this.body = body; return this;}};
}
function handler(controller, path, method) {
  const route = controller.router.stack.find(item => item.route?.path === path && item.route.methods[method]);
  assert.ok(route, `${method} ${path} registered`);
  return route.route.stack.map(item => item.handle);
}
const reading = deviceId => ({deviceId, air: {temperature: 20, humidity: 40, pressure: 1000}});

test('IoT state returns fixed indexed payload and masks foreign locations', async t => {
  t.mock.method(DeviceModel, 'find', filter => {
    assert.deepEqual(filter, {location: 'North'});
    return {select: () => ({lean: async () => [{deviceId: 4}]})};
  });
  t.mock.method(StateModel, 'find', filter => ({lean: async () =>
    [{deviceId: 4, states: [{state: true}]}, {deviceId: 8, states: [{state: true}]}]
      .filter(item => !filter.deviceId.$in || filter.deviceId.$in.includes(item.deviceId))}));
  const payload = await new StateService().getAllLatestDeviceStatesService('North');
  assert.equal(payload.length, 96);
  assert.equal(payload[4], true);
  assert.equal(payload[8], false);
});

test('foreign sensor in ESP batch rejects the entire batch before any writes', async t => {
  const controller = new SensorController();
  let writes = 0;
  t.mock.method(controller.sensorService, 'createSensorData', async () => {writes++;});
  t.mock.method(SensorDefinitionModel, 'find', () => ({select: () => ({lean: async () => [{deviceId: 0}]})}));
  const res = response({iotCredential: 'esp', iotLocation: 'North'});
  await handler(controller, '/api/sensor/iot/update', 'post').at(-1)({body: {sensorData: [reading(0), reading(1)]}}, res);
  assert.equal(res.statusCode, 403);
  assert.equal(writes, 0);
});

test('ESP keys use random secrets but persist and list only digests and metadata', async t => {
  const Model = require('../dist/modules/schemas/espToken.schema').default;
  const Service = require('../dist/modules/services/espToken.service').default;
  let persisted;
  t.mock.method(DeviceModel, 'exists', async () => ({_id: 'device'}));
  t.mock.method(SensorDefinitionModel, 'exists', async () => null);
  t.mock.method(Model, 'create', async input => {persisted = input; return {...input, _id: '507f1f77bcf86cd799439011'};});
  const service = new Service();
  const created = await service.create({name: 'Bridge', location: 'North', expiresInDays: 30});
  assert.match(created.token, /^sch_[a-f0-9]{64}$/);
  assert.equal(persisted.tokenHash, crypto.createHash('sha256').update(created.token).digest('hex'));
  assert.equal(JSON.stringify(persisted).includes(created.token), false);
  assert.deepEqual(Object.keys(created.key).sort(), ['id','name','location','createdAt','expiresAt','revokedAt'].sort());
  assert.equal(created.key.location, 'North');
  assert.equal(+new Date(created.key.expiresAt) - +new Date(created.key.createdAt), 30 * 86400000);
  t.mock.method(Model, 'find', () => ({sort: () => ({lean: async () => [{...persisted, _id: '507f1f77bcf86cd799439011'}]})}));
  const listed = await service.list();
  assert.equal(listed.length, 1);
  assert.equal(JSON.stringify(listed).includes(persisted.tokenHash), false);
  assert.equal(JSON.stringify(listed).includes(created.token), false);
});

test('key creation rejects wildcard and nonexistent locations', async t => {
  const Service = require('../dist/modules/services/espToken.service').default;
  t.mock.method(DeviceModel, 'exists', async () => null);
  t.mock.method(SensorDefinitionModel, 'exists', async () => null);
  for (const location of ['admin', '*', 'Unknown']) {
    await assert.rejects(new Service().create({name: 'ESP', location, expiresInDays: 30}), {status: 400});
  }
});

test('ESP authentication rejects expired, revoked and unknown keys and accepts active key', async t => {
  const Model = require('../dist/modules/schemas/espToken.schema').default;
  const {iotAuth} = require('../dist/middlewares/iotAuth.middleware');
  const token = 'sch_' + 'a'.repeat(64);
  let entry;
  t.mock.method(Model, 'findOne', filter => {
    assert.equal(filter.tokenHash, crypto.createHash('sha256').update(token).digest('hex'));
    return {lean: async () => entry};
  });
  for (const record of [null, {location: 'North', expiresAt: new Date(0), revokedAt: null},
    {location: 'North', expiresAt: new Date(Date.now() + 100000), revokedAt: new Date()}]) {
    entry = record;
    const res = response(); let allowed = false;
    await iotAuth({headers: {'x-access-token': 'Bearer ' + token}}, res, () => {allowed = true;});
    assert.equal(res.statusCode, 401); assert.equal(allowed, false);
  }
  entry = {location: 'North', expiresAt: new Date(Date.now() + 100000), revokedAt: null};
  const res = response(); let allowed = false;
  await iotAuth({headers: {authorization: 'Bearer ' + token}}, res, () => {allowed = true;});
  assert.equal(allowed, true); assert.equal(res.locals.iotLocation, 'North');
  assert.equal(res.locals.iotCredential, 'esp');
});

test('ESP credentials cannot access JWT/admin routes or manage ESP keys', async () => {
  const {auth} = require('../dist/middlewares/auth.middleware');
  const {admin} = require('../dist/middlewares/admin.middleware');
  const Controller = require('../dist/controllers/espToken.controller').default;
  const controller = new Controller();
  for (const middleware of [auth, admin, ...[['/api/esp-tokens','get'], ['/api/esp-tokens','post'], ['/api/esp-tokens/:id','delete']].map(([path, method]) => handler(controller, path, method)[0])]) {
    const res = response(); let allowed = false;
    await middleware({headers: {authorization: 'Bearer sch_' + 'b'.repeat(64)}}, res, () => {allowed = true;});
    assert.equal(res.statusCode, 401); assert.equal(allowed, false);
  }
});

test('only IoT routes accept ESP authentication', () => {
  const {iotAuth} = require('../dist/middlewares/iotAuth.middleware');
  const StateController = require('../dist/controllers/deviceState.controller').default;
  for (const controller of [new StateController(), new SensorController()]) {
    for (const layer of controller.router.stack.filter(item => item.route)) {
      const accepted = layer.route.stack.some(item => item.handle === iotAuth);
      assert.equal(accepted, ['/api/state/iot/all', '/api/sensor/iot/update'].includes(layer.route.path));
    }
  }
});

test('ESP creation validates expiry and name before persisting; revoke is metadata only', async t => {
  const Controller = require('../dist/controllers/espToken.controller').default;
  const controller = new Controller();
  for (const expiresInDays of [0,366,1.5,'30']) {
    const res = response();
    await handler(controller, '/api/esp-tokens','post').at(-1)({body:{name:'ESP',location:'North',expiresInDays}},res);
    assert.equal(res.statusCode,400);
  }
  const Model = require('../dist/modules/schemas/espToken.schema').default;
  const Service = require('../dist/modules/services/espToken.service').default;
  let revoked;
  t.mock.method(Model, 'findByIdAndUpdate', async (id, update) => {revoked = update;return {_id:id, name:'ESP',location:'North',createdAt:new Date(),expiresAt:new Date(),revokedAt:update.$set.revokedAt};});
  const result = await new Service().revoke('507f1f77bcf86cd799439011');
  assert.ok(revoked.$set.revokedAt instanceof Date);
  assert.equal(result.id, '507f1f77bcf86cd799439011');
});

test('IoT controller denies missing location and scopes JWT users while retaining admin access', async t => {
  const Controller = require('../dist/controllers/deviceState.controller').default;
  const controller = new Controller();
  const scopes = [];
  t.mock.method(controller.deviceStateService, 'getAllLatestDeviceStatesService', async location => {scopes.push(location);return Array(96).fill(false);});
  const read = handler(controller, '/api/state/iot/all', 'get').at(-1);
  for (const locals of [{}, {userRole:''}, {iotCredential:'esp'}]) {
    const res = response(locals);
    await read({}, res);
    assert.equal(res.statusCode,403);
  }
  for (const locals of [{userRole:'North'}, {userRole:'admin'}, {iotCredential:'esp',iotLocation:'South'}]) {
    const res = response(locals);
    await read({},res);
    assert.equal(res.statusCode,200);
  }
  assert.deepEqual(scopes,['North',undefined,'South']);
});

test('ESP sensor ingestion accepts same-location readings and denies legacy nonadmin JWT writes', async t => {
  const controller = new SensorController();
  const writes = [];
  t.mock.method(controller.sensorService, 'createSensorData', async data => {writes.push(data);});
  t.mock.method(SensorDefinitionModel, 'find', filter => {
    assert.deepEqual(filter,{location:'North'});
    return {select: () => ({lean: async () => [{deviceId:0},{deviceId:1}]})};
  });
  const res = response({iotCredential:'esp',iotLocation:'North'});
  await handler(controller, '/api/sensor/iot/update','post').at(-1)({body:{sensorData:[reading(0),reading(1)]}},res);
  assert.equal(res.statusCode,200);
  assert.deepEqual(writes.map(item => item.deviceId),[0,1]);
  const {iotSensorAccess} = require('../dist/middlewares/iotAuth.middleware');
  const forbidden = response({userRole:'North'});
  iotSensorAccess({},forbidden, () => assert.fail('nonadmin JWT must not ingest sensor data'));
  assert.equal(forbidden.statusCode,403);
});

test('IoT JWT fallback and ESP administration retain active token store enforcement', async t => {
  const jwt = require('jsonwebtoken');
  const TokenModel = require('../dist/modules/schemas/token.schema').default;
  const UserModel = require('../dist/modules/schemas/user.schema').default;
  const {iotAuth} = require('../dist/middlewares/iotAuth.middleware');
  const Controller = require('../dist/controllers/espToken.controller').default;
  let current = {userId:'507f1f77bcf86cd799439011',role:'North',isAdmin:false,active:true};
  let active = true;
  t.mock.method(TokenModel,'exists',async () => active ? {_id:'token'} : null);
  t.mock.method(UserModel,'findById',async () => current);
  const token = jwt.sign(current,'test-secret',{expiresIn:'1h'});
  const request = {headers:{authorization:'Bearer '+token}};
  let accepted = false;
  const res = response();
  await iotAuth(request,res,() => {accepted = true;});
  assert.equal(accepted,true);
  assert.equal(res.locals.userRole,'North');
  const routes = [['/api/esp-tokens','get'],['/api/esp-tokens','post'],['/api/esp-tokens/:id','delete']];
  for (const [path,method] of routes) {
    const denied = response();
    await handler(new Controller(),path,method)[0](request,denied,() => assert.fail('nonadmin cannot manage ESP tokens'));
    assert.equal(denied.statusCode,403);
  }
  active = false;
  const revoked = response();
  await iotAuth(request,revoked,() => assert.fail('revoked JWT must fail'));
  assert.equal(revoked.statusCode,401);
});

test('ESP authentication fails closed when expiry is missing or invalid', async t => {
  const Model = require('../dist/modules/schemas/espToken.schema').default;
  const Service = require('../dist/modules/services/espToken.service').default;
  let expiry;
  t.mock.method(Model,'findOne', () => ({lean: async () => ({location:'North',expiresAt:expiry,revokedAt:null})}));
  for (const value of [undefined,null,'invalid-date',new Date(NaN)]) {
    expiry = value;
    assert.equal(await new Service().authenticate('sch_'+'c'.repeat(64)),null);
  }
});
