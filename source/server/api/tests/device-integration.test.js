const assert = require('node:assert/strict');
const test = require('node:test');

process.env.JWT_SECRET_KEY = 'test-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/smart-city-hub-test';

const DeviceController = require('../dist/controllers/device.controller').default;
const {
  buildIotStatePayload,
} = require('../dist/modules/services/deviceState.service');

function routeHandler(router, path, method) {
  const layer = router.stack.find(
    candidate =>
      candidate.route?.path === path && candidate.route.methods[method],
  );
  assert.ok(layer, `${method.toUpperCase()} ${path} route is registered`);
  return layer.route.stack.at(-1).handle;
}

function createResponse() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

test('device form payload accepts deviceId and upserts that identifier', async () => {
  const controller = new DeviceController();
  let storedDevice;
  controller.deviceService = {
    async createDeviceEntry(device) {
      storedDevice = device;
    },
  };
  const handler = routeHandler(controller.router, '/api/device/update', 'post');
  const response = createResponse();

  await handler(
    {
      body: {
        location: 'district-a',
        name: 'lamp',
        description: 'test device',
        type: 'light',
        deviceId: 7,
      },
    },
    response,
    () => {},
  );

  assert.equal(response.statusCode, 200);
  assert.equal(storedDevice.deviceId, 7);
  assert.equal(response.body.deviceId, 7);
});

test('device form payload rejects identifiers outside the 0-95 range', async () => {
  const controller = new DeviceController();
  controller.deviceService = {
    async createDeviceEntry() {
      assert.fail('invalid devices must not be stored');
    },
  };
  const handler = routeHandler(controller.router, '/api/device/update', 'post');

  for (const deviceId of [-1, 96]) {
    const response = createResponse();
    await handler(
      {
        body: {
          location: 'district-a',
          name: 'lamp',
          description: '',
          type: 'light',
          deviceId,
        },
      },
      response,
      () => {},
    );
    assert.equal(response.statusCode, 400);
  }
});

test('ESP32 payload is indexed by deviceId and padded to 96 states', () => {
  const payload = buildIotStatePayload(
    [
      {deviceId: 95, states: [{state: true}]},
      {deviceId: 2, states: [{state: false}, {state: true}]},
      {deviceId: 0, states: [{state: false}]},
      {deviceId: 200, states: [{state: true}]},
    ],
    96,
  );

  assert.equal(payload.length, 96);
  assert.equal(payload[0], false);
  assert.equal(payload[1], false);
  assert.equal(payload[2], true);
  assert.equal(payload[95], true);
});
