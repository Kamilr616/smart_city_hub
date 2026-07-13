const assert = require('node:assert/strict');
const test = require('node:test');

process.env.JWT_SECRET_KEY = 'test-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/smart-city-hub-test';

const SensorController = require('../dist/controllers/sensor.controller').default;
const {
  checkSensorIdParam,
  checkSensorLimitParam,
} = require('../dist/middlewares/deviceIdParam.middleware');

function routeHandlers(router, path, method) {
  const layer = router.stack.find(
    candidate =>
      candidate.route?.path === path && candidate.route.methods[method],
  );
  assert.ok(layer, `${method.toUpperCase()} ${path} route is registered`);
  return layer.route.stack.map(candidate => candidate.handle);
}

function runMiddleware(middleware, params) {
  let statusCode;
  let body;
  let nextCalled = false;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    send(value) {
      body = value;
      return this;
    },
  };

  middleware({params}, response, () => {
    nextCalled = true;
  });

  return {statusCode, body, nextCalled};
}

test('reading-count route uses count validation instead of sensor ID validation', () => {
  const controller = new SensorController();
  const handlers = routeHandlers(controller.router, '/api/sensor/all/:num', 'get');

  assert.ok(handlers.includes(checkSensorLimitParam));
  assert.ok(!handlers.includes(checkSensorIdParam));
});

test('bulk ingest route is not rejected for a missing URL sensor ID', () => {
  const controller = new SensorController();
  const handlers = routeHandlers(controller.router, '/api/sensor/iot/update', 'post');

  assert.ok(!handlers.includes(checkSensorIdParam));
});

test('reading-count validation accepts a positive integer', () => {
  assert.deepEqual(runMiddleware(checkSensorLimitParam, {num: '20'}), {
    statusCode: undefined,
    body: undefined,
    nextCalled: true,
  });
});

test('reading-count validation rejects invalid limits', () => {
  for (const num of ['0', '-1', '1.5', 'invalid']) {
    const result = runMiddleware(checkSensorLimitParam, {num});
    assert.equal(result.statusCode, 400);
    assert.equal(result.nextCalled, false);
    assert.ok(result.body);
  }
});
