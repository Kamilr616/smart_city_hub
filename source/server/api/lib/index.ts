import mongoose from 'mongoose';
import {config} from './config';
import {createApp} from './createApp';
import {connectToDatabase} from './database';

const app = createApp();

async function start(): Promise<void> {
    await connectToDatabase();
    const server = app.listen(config.port, () => {
        console.log(`App listening on the port ${config.port}`);
    });
    const shutdown = () => {
        server.close(() => {
            void mongoose.disconnect().catch(() => { process.exitCode = 1; });
        });
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}

void start().catch(() => {
    console.error('API startup failed');
    process.exitCode = 1;
});