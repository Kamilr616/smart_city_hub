import express from 'express';
import mongoose from 'mongoose';
import App from './app';
import {config} from './config';
import IndexController from './controllers/index.controller';
import SensorController from './controllers/sensor.controller';
import UserController from './controllers/user.controller';
import DeviceController from './controllers/device.controller';
import DeviceStateController from './controllers/deviceState.controller';

type ConnectionPromise = Promise<typeof mongoose>;

/**
 * Serverless platforms reuse a warm Node.js process between invocations but may
 * re-evaluate the module graph, so the pending connection is cached both in a
 * module variable and on `globalThis`.
 */
type GlobalWithConnection = typeof globalThis & {
    __smartCityHubMongooseConnection?: ConnectionPromise | undefined;
};

const globalCache = globalThis as GlobalWithConnection;

let connectionPromise: ConnectionPromise | undefined;
let connectionHandlersRegistered = false;

const registerConnectionHandlers = (): void => {
    if (connectionHandlersRegistered) {
        return;
    }
    connectionHandlersRegistered = true;

    mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
    });
};

const clearCache = (pending: ConnectionPromise): void => {
    if (connectionPromise === pending) {
        connectionPromise = undefined;
    }
    if (globalCache.__smartCityHubMongooseConnection === pending) {
        globalCache.__smartCityHubMongooseConnection = undefined;
    }
};

/**
 * Builds the Express application with the full controller set. The returned
 * instance is a plain request listener, so it can be served by `app.listen()`
 * locally and invoked directly by a serverless function.
 */
export const createApp = (): express.Application => new App([
    new UserController(),
    new IndexController(),
    new SensorController(),
    new DeviceController(),
    new DeviceStateController()
]).app;

/**
 * Connects to MongoDB at most once per process. Concurrent callers share the
 * same pending promise; a failed attempt drops the cache so the next call
 * retries instead of resolving a dead connection forever.
 */
export const connectToDatabase = async (): ConnectionPromise => {
    const cached = connectionPromise || globalCache.__smartCityHubMongooseConnection;
    if (cached) {
        return cached;
    }

    registerConnectionHandlers();

    const pending = mongoose.connect(config.databaseUrl).then((connection) => {
        console.log('Connected to database');
        return connection;
    });

    connectionPromise = pending;
    globalCache.__smartCityHubMongooseConnection = pending;

    try {
        return await pending;
    } catch (error) {
        clearCache(pending);
        throw error;
    }
};
