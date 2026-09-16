const assert = require('node:assert/strict');
const {test} = require('node:test');
process.env.JWT_SECRET_KEY = 'test-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/sensor-test';
const SensorController =
  require('../dist/controllers/sensor.controller').default;
const {admin} = require('../dist/middlewares/admin.middleware');
const express = require('express');
const http = require('node:http');

function route(controller, path, method) {
  const layer = controller.router.stack.find(
    (item) => item.route?.path === path && item.route.methods[method],
  );
  assert.ok(layer, method + ' ' + path + ' is registered');
  return layer.route.stack;
}
function response() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
const metadata = {
  deviceId: 0,
  name: 'Weather station',
  description: 'Planned street sensor',
  location: 'city',
};

test('catalog read is routed before the generic sensor ID route', async (t) => {
  const controller = new SensorController();
  controller.sensorService = {
    async getSensorCatalog() {
      return [metadata];
    },
  };
  const app = express();
  app.use(controller.router);
  const server = http.createServer(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const res = await fetch(
    'http://127.0.0.1:' + server.address().port + '/api/sensor/catalog',
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), [metadata]);
});
test('catalog writes require the existing admin middleware', () => {
  const stack = route(new SensorController(), '/api/sensor/catalog', 'post');
  assert.equal(stack[0].handle, admin);
});
test('catalog updates metadata without creating a measurement', async () => {
  const controller = new SensorController();
  let saved;
  controller.sensorService = {
    async upsertSensorDefinition(data) {
      saved = data;
      return data;
    },
  };
  const res = response();
  await route(controller, '/api/sensor/catalog', 'post')
    .at(-1)
    .handle({body: metadata}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(saved, metadata);
});
test('catalog rejects bad IDs, empty names and measurement fields', async () => {
  const controller = new SensorController();
  let writes = 0;
  controller.sensorService = {
    async upsertSensorDefinition() {
      writes++;
    },
  };
  for (const data of [
    {...metadata, deviceId: 2},
    {...metadata, deviceId: -1},
    {...metadata, name: ''},
    {...metadata, temperature: 22},
  ]) {
    const res = response();
    await route(controller, '/api/sensor/catalog', 'post')
      .at(-1)
      .handle({body: data}, res);
    assert.equal(res.statusCode, 400);
    assert.equal(writes, 0);
  }
});
test('catalog database failures return generic JSON', async () => {
  const controller = new SensorController();
  controller.sensorService = {
    async getSensorCatalog() {
      throw Error('private connection string');
    },
  };
  const res = response();
  await route(controller, '/api/sensor/catalog', 'get').at(-1).handle({}, res);
  assert.equal(res.statusCode, 503);
  assert.doesNotMatch(JSON.stringify(res.body), /private/);
});
test('bulk sensor ingestion accepts both configured IDs including zero', async () => {
  const controller = new SensorController();
  const saved = [];
  controller.sensorService = {
    async createSensorData(data) {
      saved.push(data);
    },
  };
  const res = response();
  const sensorData = [0, 1].map((deviceId) => ({
    deviceId,
    air: {temperature: 20, pressure: 1013, humidity: 50},
  }));
  await route(controller, '/api/sensor/iot/update', 'post')
    .at(-1)
    .handle({body: {sensorData}}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(
    saved.map((s) => s.deviceId),
    [0, 1],
  );
});
test('bulk ingestion rejects out-of-range and duplicate IDs before any write', async () => {
  const controller = new SensorController();
  let writes = 0;
  controller.sensorService = {
    async createSensorData() {
      writes++;
    },
  };
  for (const ids of [[2], [-1], [0, 0], []]) {
    const res = response();
    const sensorData = ids.map((deviceId) => ({
      deviceId,
      air: {temperature: 20, pressure: 1013, humidity: 50},
    }));
    await route(controller, '/api/sensor/iot/update', 'post')
      .at(-1)
      .handle({body: {sensorData}}, res);
    assert.equal(res.statusCode, 400);
    assert.equal(writes, 0);
  }
});

test('definitions have their own collection and measurement units, without a reading', () => {
  const {
    SensorDefinitionModel,
  } = require('../dist/modules/schemas/sensorDefinition.schema');
  const {SensorModel} = require('../dist/modules/schemas/sensor.schema');
  const definition = new SensorDefinitionModel(metadata);
  assert.equal(definition.validateSync(), undefined);
  assert.notEqual(
    SensorDefinitionModel.collection.name,
    SensorModel.collection.name,
  );
  const data = definition.toObject();
  assert.equal(data.temperature, undefined);
  assert.equal(data.readingDate, undefined);
  assert.deepEqual(
    data.measurements.map(({kind, unit}) => ({kind, unit})),
    [
      {kind: 'temperature', unit: '°C'},
      {kind: 'humidity', unit: '%'},
      {kind: 'pressure', unit: 'hPa'},
    ],
  );
});
test('catalog upsert failures do not expose database details', async () => {
  const controller = new SensorController();
  controller.sensorService = {
    async upsertSensorDefinition() {
      throw Error('private database failure');
    },
  };
  const res = response();
  await route(controller, '/api/sensor/catalog', 'post')
    .at(-1)
    .handle({body: metadata}, res);
  assert.equal(res.statusCode, 503);
  assert.doesNotMatch(JSON.stringify(res.body), /private/);
});
test('catalog rejects anonymous writes over HTTP', async (t) => {
  const app = express();
  app.use(express.json(), new SensorController().router);
  const server = http.createServer(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const res = await fetch(
    'http://127.0.0.1:' + server.address().port + '/api/sensor/catalog',
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(metadata),
    },
  );
  assert.equal(res.status, 401);
  await res.text();
});
