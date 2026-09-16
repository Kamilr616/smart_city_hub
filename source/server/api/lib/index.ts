import mongoose from 'mongoose';
import {config} from './config';
import {connectToDatabase, createApp} from './server';

const app = createApp();

const closeOnSignal = async (): Promise<void> => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
};

process.on('SIGINT', closeOnSignal);
process.on('SIGTERM', closeOnSignal);

const start = async (): Promise<void> => {
    await connectToDatabase();
    app.listen(config.port, () => {
        console.log(`App listening on the port ${config.port}`);
    });
};

void start().catch(error => {
    console.error(`API startup failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
});
