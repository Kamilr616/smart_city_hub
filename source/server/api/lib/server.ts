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
 * A cache entry tracks whether its promise has already resolved, because a
 * pending connection must never be evicted by the readiness check below.
 */
type ConnectionCache = {
    promise: ConnectionPromise;
    settled: boolean;
};

/**
 * Serverless platforms reuse a warm Node.js process between invocations but may
 * re-evaluate the module graph, so the cache lives both in a module variable
 * and on `globalThis`. Both hold the same object, so `settled` stays in sync.
 */
type GlobalWithConnection = typeof globalThis & {
    __smartCityHubMongooseConnection?: ConnectionCache | undefined;
};

const globalCache = globalThis as GlobalWithConnection;

/** `disconnected` and `disconnecting` cannot serve queries. */
const UNUSABLE_READY_STATES: number[] = [0, 3];

const MONGODB_URI_PATTERN = /mongodb(\+srv)?:\/\/\S+/gi;

let connectionCache: ConnectionCache | undefined;
let connectionHandlersRegistered = false;

/**
 * Renders an error for logging with any MongoDB connection string removed:
 * driver errors such as `MongoParseError` echo the URI, credentials included.
 */
export const describeError = (error: unknown): string => {
    const message = error instanceof Error ? error.message : String(error);
    return message.replace(MONGODB_URI_PATTERN, '[redacted connection string]');
};

const readCache = (): ConnectionCache | undefined =>
    connectionCache || globalCache.__smartCityHubMongooseConnection;

const writeCache = (entry: ConnectionCache): void => {
    connectionCache = entry;
    globalCache.__smartCityHubMongooseConnection = entry;
};

const clearCache = (entry: ConnectionCache): void => {
    if (connectionCache === entry) {
        connectionCache = undefined;
    }
    if (globalCache.__smartCityHubMongooseConnection === entry) {
        globalCache.__smartCityHubMongooseConnection = undefined;
    }
};

const registerConnectionHandlers = (): void => {
    if (connectionHandlersRegistered) {
        return;
    }
    connectionHandlersRegistered = true;

    mongoose.connection.on('error', (error) => {
        console.error(`MongoDB connection error: ${describeError(error)}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        const current = readCache();
        // Only an established connection is dropped here; a pending attempt is
        // owned by connectToDatabase() and cleared by its own rejection.
        if (current && current.settled) {
            clearCache(current);
        }
    });
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
 * same pending promise; a failed attempt, and a connection that has since gone
 * away, drop out of the cache so the next call reconnects instead of handing
 * back a dead connection forever.
 */
export const connectToDatabase = async (): ConnectionPromise => {
    const cached = readCache();
    if (cached) {
        if (!cached.settled || !UNUSABLE_READY_STATES.includes(mongoose.connection.readyState)) {
            return cached.promise;
        }
        clearCache(cached);
    }

    registerConnectionHandlers();

    const entry: ConnectionCache = {
        promise: mongoose.connect(config.databaseUrl).then((connection) => {
            console.log('Connected to database');
            return connection;
        }),
        settled: false
    };

    writeCache(entry);

    try {
        const connection = await entry.promise;
        entry.settled = true;
        return connection;
    } catch (error) {
        clearCache(entry);
        throw error;
    }
};
