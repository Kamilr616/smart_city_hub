import mongoose from 'mongoose';
import {config} from './config';

let pending: Promise<typeof mongoose> | undefined;

export async function connectToDatabase(): Promise<typeof mongoose> {
    if (pending) return pending;
    if (mongoose.connection.readyState === 1) return mongoose;

    const attempt = mongoose.connect(config.databaseUrl, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 5,
    });
    pending = attempt;

    try {
        return await attempt;
    } finally {
        if (pending === attempt) pending = undefined;
    }
}
