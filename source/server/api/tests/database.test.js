const assert = require('node:assert/strict');
const test = require('node:test');

process.env.JWT_SECRET_KEY = 'test-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test';

const mongoose = require('mongoose');
const {connectToDatabase} = require('../dist/database');

test('shares pending connections, retries failures, and reuses only ready connections', async () => {
  const originalConnect = mongoose.connect;
  const originalState = mongoose.connection.readyState;
  let calls = 0;
  let rejectConnection;
  let resolveConnection;

  try {
    mongoose.connection.readyState = 0;
    mongoose.connect = (uri, options) => {
      calls++;
      assert.equal(uri, process.env.MONGODB_URI);
      assert.deepEqual(options, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 5,
      });
      return new Promise((resolve, reject) => {
        resolveConnection = resolve;
        rejectConnection = reject;
      });
    };

    const failedA = connectToDatabase();
    const failedB = connectToDatabase();
    const failures = Promise.allSettled([failedA, failedB]);
    assert.equal(calls, 1);
    rejectConnection(new Error('simulated connection failure'));
    assert.deepEqual((await failures).map((result) => result.status), [
      'rejected',
      'rejected',
    ]);

    const connectedA = connectToDatabase();
    const connectedB = connectToDatabase();
    assert.equal(calls, 2);
    mongoose.connection.readyState = 1;
    resolveConnection(mongoose);
    assert.deepEqual(await Promise.all([connectedA, connectedB]), [mongoose, mongoose]);

    await connectToDatabase();
    assert.equal(calls, 2);

    mongoose.connection.readyState = 0;
    const reconnected = connectToDatabase();
    assert.equal(calls, 3);
    mongoose.connection.readyState = 1;
    resolveConnection(mongoose);
    assert.equal(await reconnected, mongoose);
  } finally {
    mongoose.connect = originalConnect;
    mongoose.connection.readyState = originalState;
  }
});
